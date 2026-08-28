// app/signup/profile/page.jsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Building2, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  Globe 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

function SignupProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramRole = searchParams.get('role') || 'seller';

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(paramRole);

  const [password, setPassword] = useState('');
  
  // 셀러 정보 (한글/영문 상호명 분리)
  const [companyNameKo, setCompanyNameKo] = useState('');
  const [companyNameEn, setCompanyNameEn] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [category, setCategory] = useState('Industrial Machinery');

  // 바이어 정보
  const [buyerName, setBuyerName] = useState('');
  const [buyerCompanyNameEn, setBuyerCompanyNameEn] = useState('');
  const [country, setCountry] = useState('United States');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setMounted(true);
    verifyConfirmedUser();
  }, []);

  // 이메일 링크 클릭 후 자동 세션 검증
  const verifyConfirmedUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const metaRole = session.user.user_metadata?.role || paramRole;
      setUserRole(metaRole);
    }
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('비밀번호는 6자 이상이어야 해요.');
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || user;

      if (!currentUser) {
        setErrorMessage('인증 세션이 만료됐어요. 이메일로 받으신 링크를 다시 확인해주세요.');
        setIsLoading(false);
        return;
      }

      // 1. 비밀번호 및 사용자 메타데이터 업데이트
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: {
          role: userRole,
          company_name: userRole === 'seller' ? (companyNameEn || companyNameKo) : buyerCompanyNameEn,
          company_name_ko: companyNameKo,
          company_name_en: userRole === 'seller' ? companyNameEn : buyerCompanyNameEn,
          buyer_name: userRole === 'buyer' ? buyerName : '',
          is_new_user: true
        }
      });

      if (updateError) throw updateError;

      // 2. DB 에 정보 저장
      if (userRole === 'seller') {
        await supabase.from('companies').upsert([
          {
            user_id: currentUser.id,
            company_name: companyNameEn || companyNameKo || 'Hankook Precision Co., Ltd.',
            company_name_ko: companyNameKo,
            company_name_en: companyNameEn,
            description: `Official Global B2B Showroom of ${companyNameEn || companyNameKo}.`,
            business_type: 'Direct Manufacturer',
            location: 'South Korea',
          }
        ], { onConflict: 'user_id' });
      } else {
        await supabase.from('buyers').upsert([
          {
            auth_user_id: currentUser.id,
            buyer_name: buyerName || 'Global Buyer',
            company_name_en: buyerCompanyNameEn,
            buyer_email: currentUser.email,
            country: country,
            interest_category: category,
          }
        ], { onConflict: 'auth_user_id' });
      }

      // 가입 완료 후 온보딩 팝업 플래그 세팅 및 홈으로 리다이렉트
      localStorage.setItem('klick_show_onboarding', 'true');
      router.push('/');
    } catch (err) {
      console.error('Complete signup error:', err);
      setErrorMessage('프로필 저장에 실패했어요: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-xl mx-auto px-6 mt-12 space-y-6">
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-200 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-emerald-100">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">
              이메일 인증 완료! 프로필을 마저 입력해주세요
            </h1>
            <p className="text-xs text-slate-500">
              이메일 인증이 확인되었습니다! 회원가입을 완결하기 위해 비밀번호와 상호명 정보를 입력해 주세요.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCompleteSignup} className="space-y-4">
            {/* 셀러 입력 폼 */}
            {userRole === 'seller' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">회사 상호명 (한글) *</label>
                    <input
                      type="text"
                      required
                      value={companyNameKo}
                      onChange={(e) => setCompanyNameKo(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">회사 상호명 (영문) *</label>
                    <input
                      type="text"
                      required
                      value={companyNameEn}
                      onChange={(e) => setCompanyNameEn(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">주요 상품 카테고리</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm bg-white"
                    >
                      <option value="Industrial Machinery">산업 기계 & 부품</option>
                      <option value="K-Beauty & Cosmetics">K-뷰티 & 화장품</option>
                      <option value="K-Food & Beverages">K-푸드 & 식음료</option>
                      <option value="Electronics & Smart IT">전자 & IT 기기</option>
                      <option value="General Manufacturing">일반 제조업</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">연락처(전화번호)</label>
                    <input
                      type="text"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* 바이어 입력 폼 */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">담당자 이름 *</label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">회사 상호명 (영문) *</label>
                    <input
                      type="text"
                      required
                      value={buyerCompanyNameEn}
                      onChange={(e) => setBuyerCompanyNameEn(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">국가 / 지역</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm bg-white"
                  >
                    <option value="United States">미국</option>
                    <option value="China">중국</option>
                    <option value="Japan">일본</option>
                    <option value="Germany">독일</option>
                    <option value="Vietnam">베트남</option>
                    <option value="United Arab Emirates">아랍에미리트</option>
                    <option value="Other">기타 지역</option>
                  </select>
                </div>
              </>
            )}

            {/* 비밀번호 설정 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">비밀번호 설정 (6자 이상) *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>프로필 저장 중...</span>
                </>
              ) : (
                <>
                  <span>가입 완료하기</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function SignupProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>이메일 인증 확인 및 프로필 화면을 불러오는 중...</span>
          </div>
        </div>
      }
    >
      <SignupProfileContent />
    </Suspense>
  );
}