// app/admin/buyers/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Loader2, MessageSquare, FileText, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PRODUCT_CATEGORIES } from '@/lib/categories';

const INCOTERMS = ['FOB', 'CIF', 'EXW', 'FCA', 'DDP'];

export default function AdminBuyersPage() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // 신규 바이어 계정 생성 모달 상태
  const [isNewBuyerOpen, setIsNewBuyerOpen] = useState(false);
  const [newBuyerEmail, setNewBuyerEmail] = useState('');
  const [newBuyerName, setNewBuyerName] = useState('');
  const [newBuyerCompanyEn, setNewBuyerCompanyEn] = useState('');
  const [newBuyerCountry, setNewBuyerCountry] = useState('');
  const [creatingBuyer, setCreatingBuyer] = useState(false);

  // 특정 바이어에 RFQ 등록 모달 상태
  const [rfqModalBuyer, setRfqModalBuyer] = useState(null);
  const [newRfqTitle, setNewRfqTitle] = useState('');
  const [newRfqCategory, setNewRfqCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [newRfqQuantity, setNewRfqQuantity] = useState('');
  const [newRfqTargetPrice, setNewRfqTargetPrice] = useState('');
  const [newRfqIncoterms, setNewRfqIncoterms] = useState('FOB');
  const [newRfqDetails, setNewRfqDetails] = useState('');
  const [creatingRfq, setCreatingRfq] = useState(false);

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

  const callAdminApi = async (path, body) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `요청 실패 (${res.status})`);
    return json;
  };

  const handleCreateBuyer = async (e) => {
    e.preventDefault();
    if (!newBuyerEmail.trim()) return;
    try {
      setCreatingBuyer(true);
      await callAdminApi('/api/admin/create-account', {
        type: 'buyer',
        email: newBuyerEmail,
        buyerName: newBuyerName,
        companyNameEn: newBuyerCompanyEn,
        country: newBuyerCountry
      });
      alert('바이어 계정이 생성되었습니다. 본인은 로그인 화면의 "Forgot Password"로 비밀번호를 설정해야 합니다.');
      setIsNewBuyerOpen(false);
      setNewBuyerEmail('');
      setNewBuyerName('');
      setNewBuyerCompanyEn('');
      setNewBuyerCountry('United States');
      await fetchBuyers();
    } catch (err) {
      alert('바이어 생성 실패: ' + err.message);
    } finally {
      setCreatingBuyer(false);
    }
  };

  const resetRfqForm = () => {
    setRfqModalBuyer(null);
    setNewRfqTitle('');
    setNewRfqCategory(PRODUCT_CATEGORIES[0]);
    setNewRfqQuantity('');
    setNewRfqTargetPrice('');
    setNewRfqIncoterms('FOB');
    setNewRfqDetails('');
  };

  const handleCreateRfq = async (e) => {
    e.preventDefault();
    if (!rfqModalBuyer) return;
    try {
      setCreatingRfq(true);
      await callAdminApi('/api/admin/create-rfq', {
        targetUserId: rfqModalBuyer.auth_user_id,
        title: newRfqTitle,
        category: newRfqCategory,
        quantity: newRfqQuantity,
        targetPrice: newRfqTargetPrice,
        incoterms: newRfqIncoterms,
        details: newRfqDetails
      });
      alert('RFQ가 등록되었습니다.');
      resetRfqForm();
      await fetchBuyers();
    } catch (err) {
      alert('RFQ 등록 실패: ' + err.message);
    } finally {
      setCreatingRfq(false);
    }
  };

  const visible = buyers.filter((b) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (b.buyer_name || '').toLowerCase().includes(q) || (b.company_name || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Buyer Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">바이어 목록 조회 및 검색.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewBuyerOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> 신규 바이어 등록
        </button>
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
            <div key={b.auth_user_id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition">
              <Link href={`/buyers/${b.auth_user_id}`} className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-slate-900 truncate">{b.buyer_name || 'Unnamed Buyer'}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {b.country} · 가입일 {b.created_at ? new Date(b.created_at).toLocaleDateString() : '-'}
                </p>
              </Link>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-shrink-0">
                <span className="flex items-center gap-1" title={b.chatCount === null ? 'Chat count unavailable' : undefined}><MessageSquare className="w-3.5 h-3.5 text-blue-500" /> {b.chatCount === null ? '-' : b.chatCount}</span>
                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-purple-500" /> {b.rfqCount}</span>
                <button
                  type="button"
                  onClick={() => setRfqModalBuyer(b)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-[11px] rounded-lg transition cursor-pointer"
                >
                  RFQ 등록
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isNewBuyerOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100000] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900">신규 바이어 계정 생성</h2>
              <button type="button" onClick={() => setIsNewBuyerOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              계정이 즉시 생성됩니다. 비밀번호는 생성하지 않으니, 바이어 본인이 로그인 화면의 "Forgot Password"로 직접 설정해야 합니다.
            </p>
            <form onSubmit={handleCreateBuyer} className="space-y-3">
              <input
                type="email"
                required
                value={newBuyerEmail}
                onChange={(e) => setNewBuyerEmail(e.target.value)}
                placeholder="바이어 이메일"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="text"
                value={newBuyerName}
                onChange={(e) => setNewBuyerName(e.target.value)}
                placeholder="담당자 이름"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="text"
                value={newBuyerCompanyEn}
                onChange={(e) => setNewBuyerCompanyEn(e.target.value)}
                placeholder="Company Name (English)"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="text"
                value={newBuyerCountry}
                onChange={(e) => setNewBuyerCountry(e.target.value)}
                placeholder="국가"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="submit"
                disabled={creatingBuyer}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
              >
                {creatingBuyer ? '생성 중...' : '바이어 계정 생성'}
              </button>
            </form>
          </div>
        </div>
      )}

      {rfqModalBuyer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100000] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900">
                {rfqModalBuyer.buyer_name || 'Unnamed Buyer'}의 RFQ 등록
              </h2>
              <button type="button" onClick={resetRfqForm} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRfq} className="space-y-3">
              <input
                type="text"
                required
                value={newRfqTitle}
                onChange={(e) => setNewRfqTitle(e.target.value)}
                placeholder="RFQ 제목 / 상품명"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <select
                value={newRfqCategory}
                onChange={(e) => setNewRfqCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newRfqQuantity}
                  onChange={(e) => setNewRfqQuantity(e.target.value)}
                  placeholder="주문 수량"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  type="text"
                  value={newRfqTargetPrice}
                  onChange={(e) => setNewRfqTargetPrice(e.target.value)}
                  placeholder="희망 가격"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <select
                value={newRfqIncoterms}
                onChange={(e) => setNewRfqIncoterms(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {INCOTERMS.map((term) => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
              <textarea
                value={newRfqDetails}
                onChange={(e) => setNewRfqDetails(e.target.value)}
                placeholder="상세 요청 사항"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="submit"
                disabled={creatingRfq}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
              >
                {creatingRfq ? '등록 중...' : 'RFQ 등록'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
