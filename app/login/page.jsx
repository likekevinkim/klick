// app/login/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Building2, Lock, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function SellerLoginPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // 로그인 데모 연동 처리 후 대시보드로 이동
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = '/products';
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Header />

      <main className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* 좌측 안내 섹션 */}
        <div className="lg:col-span-6 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Building2 className="w-4 h-4" /> KLICK Seller Center
          </span>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
            대한민국 제조업 사장님을 위한 <br />
            <span className="text-blue-600">글로벌 B2B 입점 센터</span>
          </h1>

          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            복잡한 해외 영업팀 구성 없이, KLICK에 공장과 제품 정보를 등록하세요. AI가 글로벌 바이어 맞춤형 영문 상세페이지를 기획하고 전 세계에 노출해 드립니다.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>무료 AI 영문 상세페이지 카피라이팅 기획 제공</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>전 세계 해외 바이어 견적 요청(RFQ) 및 문의 직수신</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>공장 전용 글로벌 홍보 미니 사이트 자동 생성</span>
            </div>
          </div>
        </div>

        {/* 우측 로그인 폼 카드 */}
        <div className="lg:col-span-6 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900">제조사 / 셀러 로그인</h2>
            <p className="text-xs text-slate-500 mt-1">등록하신 이메일 계정으로 로그인해 주세요.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">이메일 주소</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="factory@company.com"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">비밀번호</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? '인증 처리 중...' : '셀러 로그인하기'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>아직 셀러 계정이 없으신가요?</span>
            <Link href="/products/new" className="font-bold text-blue-600 hover:underline">
              신규 입점 & 첫 상품 등록 ➡️
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}