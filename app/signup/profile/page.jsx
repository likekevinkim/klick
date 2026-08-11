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
  
  // 셀러 정보
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
      setErrorMessage('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || user;

      if (!currentUser) {
        setErrorMessage('Authentication session expired. Please check your email link again.');
        setIsLoading(false);
        return;
      }

      // 1. 비밀번호 및 메타데이터 업데이트
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

      // 2. DB 정보 저장
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

      // 온보딩 팝업 플래그 저장 및 홈 페이지 자동 이동
      localStorage.setItem('klick_show_onboarding', 'true');
      router.push('/');
    } catch (err) {
      console.error('Complete signup error:', err);
      setErrorMessage('Failed to save profile: ' + (err.message || 'Unknown error'));
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
              Email Verified! Complete Your Profile
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
                      placeholder="예: (주)한국정밀공업"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Company Name (English) *</label>
                    <input
                      type="text"
                      required
                      value={companyNameEn}
                      onChange={(e) => setCompanyNameEn(e.target.value)}
                      placeholder="e.g. Hankook Precision Co., Ltd."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Main Product Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm bg-white"
                    >
                      <option value="Industrial Machinery">Industrial Machinery & Parts</option>
                      <option value="K-Beauty & Cosmetics">K-Beauty & Cosmetics</option>
                      <option value="K-Food & Beverages">K-Food & Beverages</option>
                      <option value="Electronics & Smart IT">Electronics & Smart IT</option>
                      <option value="General Manufacturing">General Manufacturing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Phone Number</label>
                    <input
                      type="text"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      placeholder="+82-10-1234-5678"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name / Contact Person *</label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. John Smith"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Company Name (English) *</label>
                    <input
                      type="text"
                      required
                      value={buyerCompanyNameEn}
                      onChange={(e) => setBuyerCompanyNameEn(e.target.value)}
                      placeholder="e.g. Apex Global Trading LLC"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Country / Region</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm bg-white"
                  >
                    <option value="United States">United States</option>
                    <option value="China">China</option>
                    <option value="Japan">Japan</option>
                    <option value="Germany">Germany</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Other">Other Global Region</option>
                  </select>
                </div>
              </>
            )}

            {/* 비밀번호 설정 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Set New Password (at least 6 characters) *</label>
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
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Complete Account Registration</span>
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
            <span>Verifying Email Link & Loading Profile Setup...</span>
          </div>
        </div>
      }
    >
      <SignupProfileContent />
    </Suspense>
  );
}