// app/admin/verify-sellers/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// 이 화면은 별도 관리자 권한 테이블 없이, 사이트 소유자 이메일 하나로만 접근을 제한합니다.
// (이 프로젝트 전체가 별도 서버 인증 계층 없이 클라이언트 쪽에서 role을 분기하는 구조라서
// 관리자 화면도 동일한 방식 — 진짜 보안 경계가 아니라 UI 상의 접근 제한입니다.)
const ADMIN_EMAILS = ['sportskevinkim@gmail.com'];

export default function VerifySellersAdminPage() {
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [verifiedCompanies, setVerifiedCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    setMounted(true);
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      setCheckingAuth(true);
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || '';
      const allowed = ADMIN_EMAILS.includes(email);
      setIsAdmin(allowed);

      if (allowed) {
        await fetchCompanies();
      }
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const pending = (data || []).filter(
        (c) => c.business_reg_cert_ko && c.business_reg_cert_en && !c.is_verified
      );
      const verified = (data || []).filter((c) => c.is_verified);

      setPendingCompanies(pending);
      setVerifiedCompanies(verified);
    } catch (err) {
      console.error('Failed to load companies for review:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (company) => {
    try {
      setActioningId(company.id);
      const { error } = await supabase
        .from('companies')
        .update({ is_verified: true })
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
    if (!confirm(`Reject ${company.company_name_en || company.company_name}? This clears their uploaded certificates so they can resubmit.`)) return;

    try {
      setActioningId(company.id);
      const { error } = await supabase
        .from('companies')
        .update({ business_reg_cert_ko: null, business_reg_cert_en: null, is_verified: false })
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

  if (!mounted || checkingAuth) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] text-slate-900 antialiased">
        <Header />
        <div className="max-w-md mx-auto mt-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-3">
          <Lock className="w-10 h-10 text-slate-300 mx-auto" />
          <h1 className="text-sm font-extrabold text-slate-800">Admin Access Only</h1>
          <p className="text-xs text-slate-500">This page is restricted to the KLICK site administrator.</p>
          <Link href="/" className="inline-block text-xs font-bold text-blue-600 hover:underline pt-2">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Seller Verification Review
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Approve or reject sellers who submitted a Korean + English business registration certificate.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading submissions...</p>
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Pending Review ({pendingCompanies.length})
              </h2>

              {pendingCompanies.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  No submissions waiting for review.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCompanies.map((c) => (
                    <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 truncate">
                            {c.company_name_en || c.company_name} {c.company_name_ko && <span className="text-slate-400 font-medium">({c.company_name_ko})</span>}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <a href={c.business_reg_cert_ko} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-bold">
                              <ExternalLink className="w-3 h-3" /> Korean Cert
                            </a>
                            <a href={c.business_reg_cert_en} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-bold">
                              <ExternalLink className="w-3 h-3" /> English Cert
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Verified Companies ({verifiedCompanies.length})
              </h2>

              {verifiedCompanies.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  No verified companies yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {verifiedCompanies.map((c) => (
                    <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate">{c.company_name_en || c.company_name}</span>
                      </div>
                      <button
                        type="button"
                        disabled={actioningId === c.id}
                        onClick={() => handleRevoke(c)}
                        className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer disabled:opacity-50 flex-shrink-0"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
