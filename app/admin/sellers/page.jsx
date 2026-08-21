'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Building2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '인증대기' },
  { key: 'verified', label: '인증완료' },
  { key: 'rejected', label: '반려' }
];

function classifySellerStatus(c) {
  const hasBothCerts = !!(c.business_reg_cert_ko && c.business_reg_cert_en);
  if (c.is_verified) return 'verified';
  if (hasBothCerts && c.rejection_reason) return 'rejected';
  if (hasBothCerts) return 'pending';
  return 'incomplete';
}

export default function AdminSellersPage() {
  const [companies, setCompanies] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setCompanies(data || []);

      const { data: products } = await supabase.from('products').select('user_id');
      const counts = {};
      (products || []).forEach((p) => {
        counts[p.user_id] = (counts[p.user_id] || 0) + 1;
      });
      setProductCounts(counts);
    } catch (err) {
      console.error('Failed to load companies for review:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCert = async (path) => {
    if (!path) return;
    try {
      const { data, error } = await supabase.storage
        .from(path.startsWith('http') ? 'company-images' : 'company-private-docs')
        .createSignedUrl(path.startsWith('http') ? path.split('/').slice(-2).join('/') : path, 300);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Signed URL fetch error:', err);
      alert('Failed to open file: ' + (err.message || 'Storage connection error'));
    }
  };

  const handleApprove = async (company) => {
    try {
      setActioningId(company.id);
      const { error } = await supabase
        .from('companies')
        .update({ is_verified: true, rejection_reason: null })
        .eq('id', company.id);
      if (error) throw error;
      await fetchCompanies();
    } catch (err) {
      console.error('Approve failed:', err);
      alert('Approve failed: ' + (err.message || 'Database error. Check RLS policy on companies table.'));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (company) => {
    const reason = prompt(`반려 사유를 입력하세요 (셀러에게 그대로 보여집니다):`, company.rejection_reason || '');
    if (reason === null) return; // 취소
    if (!reason.trim()) {
      alert('반려 사유는 비워둘 수 없습니다.');
      return;
    }

    try {
      setActioningId(company.id);
      const { error } = await supabase
        .from('companies')
        .update({ is_verified: false, rejection_reason: reason.trim() })
        .eq('id', company.id);
      if (error) throw error;
      await fetchCompanies();
    } catch (err) {
      console.error('Reject failed:', err);
      alert('Reject failed: ' + (err.message || 'Database error.'));
    } finally {
      setActioningId(null);
    }
  };

  const handleRevoke = async (company) => {
    if (!confirm(`Revoke verified status for ${company.company_name_en || company.company_name}?`)) return;
    try {
      setActioningId(company.id);
      const { error } = await supabase
        .from('companies')
        .update({ is_verified: false })
        .eq('id', company.id);
      if (error) throw error;
      await fetchCompanies();
    } catch (err) {
      console.error('Revoke failed:', err);
      alert('Revoke failed: ' + (err.message || 'Database error.'));
    } finally {
      setActioningId(null);
    }
  };

  const visible = companies
    .map((c) => ({ ...c, _status: classifySellerStatus(c) }))
    .filter((c) => filter === 'all' || c._status === filter)
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (c.company_name_en || c.company_name || '').toLowerCase().includes(q)
        || (c.company_name_ko || '').toLowerCase().includes(q);
    });

  const statusBadge = (status) => {
    if (status === 'verified') return <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-bold"><ShieldCheck className="w-3.5 h-3.5" /> 인증완료</span>;
    if (status === 'rejected') return <span className="inline-flex items-center gap-1 text-rose-600 text-[11px] font-bold"><ShieldX className="w-3.5 h-3.5" /> 반려</span>;
    if (status === 'pending') return <span className="inline-flex items-center gap-1 text-amber-600 text-[11px] font-bold"><ShieldAlert className="w-3.5 h-3.5" /> 인증대기</span>;
    return <span className="text-[11px] text-slate-400 font-bold">서류 미제출</span>;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Seller Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">셀러 목록 조회 및 사업자등록증 인증 승인/반려.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === f.key ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="회사명 검색"
            className="w-full text-xs focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading sellers...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
          No sellers match this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <Link href={`/companies/${c.user_id || c.id}`} className="text-xs font-extrabold text-slate-900 hover:text-blue-600 hover:underline truncate block">
                    {c.company_name_en || c.company_name} {c.company_name_ko && <span className="text-slate-400 font-medium">({c.company_name_ko})</span>}
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {statusBadge(c._status)}
                    <span className="text-[11px] text-slate-400">가입일 {c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</span>
                    <span className="text-[11px] text-slate-400">등록 상품 {productCounts[c.user_id] || 0}건</span>
                    {c._status !== 'incomplete' && (
                      <>
                        <button type="button" onClick={() => handleViewCert(c.business_reg_cert_ko)} className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-bold cursor-pointer">
                          <ExternalLink className="w-3 h-3" /> Korean Cert
                        </button>
                        <button type="button" onClick={() => handleViewCert(c.business_reg_cert_en)} className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-bold cursor-pointer">
                          <ExternalLink className="w-3 h-3" /> English Cert
                        </button>
                      </>
                    )}
                  </div>
                  {c._status === 'rejected' && c.rejection_reason && (
                    <p className="text-[11px] text-rose-600 mt-1">반려 사유: {c.rejection_reason}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {c._status === 'verified' ? (
                  <button
                    type="button"
                    disabled={actioningId === c.id}
                    onClick={() => handleRevoke(c)}
                    className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer disabled:opacity-50"
                  >
                    Revoke
                  </button>
                ) : (c._status === 'pending' || c._status === 'rejected') ? (
                  <>
                    <button
                      type="button"
                      disabled={actioningId === c.id}
                      onClick={() => handleReject(c)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      type="button"
                      disabled={actioningId === c.id}
                      onClick={() => handleApprove(c)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {actioningId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
