// app/admin/buyers/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Loader2, MessageSquare, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminBuyersPage() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      setLoading(true);

      const { data: buyerRows, error } = await supabase
        .from('buyers')
        .select('auth_user_id, buyer_name, company_name, interest_category, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const buyerIds = (buyerRows || []).map((b) => b.auth_user_id).filter(Boolean);

      const { data: { session } } = await supabase.auth.getSession();

      const [{ data: profiles }, chatCountsResult, { data: rfqs }] = await Promise.all([
        supabase.from('buyer_profiles').select('auth_user_id, country').in('auth_user_id', buyerIds.length ? buyerIds : ['']),
        fetch('/api/admin/buyer-chat-counts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
          body: JSON.stringify({ buyerIds })
        }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`chat counts fetch failed: ${r.status}`))))
          .catch((err) => { console.error('buyer-chat-counts fetch failed:', err); return { counts: {}, failed: true }; }),
        supabase.from('public_rfqs').select('user_id').in('user_id', buyerIds.length ? buyerIds : [''])
      ]);

      const countryById = {};
      (profiles || []).forEach((p) => { countryById[p.auth_user_id] = p.country; });

      const chatCountById = chatCountsResult?.counts || {};
      const chatCountsFailed = !!chatCountsResult?.failed;

      const rfqCountById = {};
      (rfqs || []).forEach((r) => { rfqCountById[r.user_id] = (rfqCountById[r.user_id] || 0) + 1; });

      setBuyers((buyerRows || []).map((b) => ({
        ...b,
        country: countryById[b.auth_user_id] || '-',
        chatCount: chatCountsFailed ? null : (chatCountById[b.auth_user_id] || 0),
        rfqCount: rfqCountById[b.auth_user_id] || 0
      })));
    } catch (err) {
      console.error('Failed to load buyers:', err);
      setBuyers([]);
    } finally {
      setLoading(false);
    }
  };

  const visible = buyers.filter((b) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (b.buyer_name || '').toLowerCase().includes(q) || (b.company_name || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Buyer Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">바이어 목록 조회 및 검색 (조회 전용).</p>
      </div>

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 sm:w-64">
        <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="바이어명 검색"
          className="w-full text-xs focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading buyers...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
          No buyers match this search.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {visible.map((b) => (
            <Link
              key={b.auth_user_id}
              href={`/buyers/${b.auth_user_id}`}
              className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
            >
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 truncate">{b.buyer_name || 'Unnamed Buyer'}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {b.country} · 가입일 {b.created_at ? new Date(b.created_at).toLocaleDateString() : '-'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-shrink-0">
                <span className="flex items-center gap-1" title={b.chatCount === null ? 'Chat count unavailable' : undefined}><MessageSquare className="w-3.5 h-3.5 text-blue-500" /> {b.chatCount === null ? '-' : b.chatCount}</span>
                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-purple-500" /> {b.rfqCount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
