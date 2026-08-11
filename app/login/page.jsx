// app/login/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { 
  Building2, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Mail, 
  Lock, 
  UserCheck, 
  KeyRound, 
  X 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // false: Sign In, true: Sign Up
  const [userRole, setUserRole] = useState('seller'); // 'seller' or 'buyer'

  // 공통 입력
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 셀러 전용 입력 (한글/영문 상호명 분리 수집)
  const [companyNameKo, setCompanyNameKo] = useState('');
  const [companyNameEn, setCompanyNameEn] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [category, setCategory] = useState('Industrial Machinery');

  // 바이어 전용 입력 (담당자명, 영문 회사명, 국가)
  const [buyerName, setBuyerName] = useState('');
  const [buyerCompanyNameEn, setBuyerCompanyNameEn] = useState('');
  const [country, setCountry] = useState('United States');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 비밀번호 찾기 모달 상태
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // 비밀번호 재설정 이메일 발송 핸들러
  const handleSendPasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;

    try {
      setResetLoading(true);
      setResetStatus('');

      const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://klick-six.vercel.app';

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${siteUrl}/reset-password`
      });

      if (error) {
        setResetStatus('Error: ' + error.message);
      } else {
        setResetStatus('Password reset link has been sent to your email. Please check your inbox!');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setResetStatus('Failed to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  // Supabase Auth 제출 핸들러
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isSignUp) {
        const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://klick-six.vercel.app';

        // 1. Supabase Auth Sign Up (이메일 인증 및 온보딩 플래그 세팅)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${siteUrl}/login`,
            data: {
              role: userRole,
              company_name: userRole === 'seller' ? (companyNameEn || companyNameKo) : buyerCompanyNameEn,
              company_name_ko: companyNameKo,
              company_name_en: userRole === 'seller' ? companyNameEn : buyerCompanyNameEn,
              buyer_name: userRole === 'buyer' ? buyerName : '',
              is_new_user: true // 온보딩 모달 트리거용 플래그
            },
          },
        });

        if (error) throw error;

        // 역할별 메타데이터 DB 저장
        if (data?.user) {
          try {
            if (userRole === 'seller') {
              await supabase.from('companies').insert([
                {
                  user_id: data.user.id,
                  company_name: companyNameEn || companyNameKo || 'Hankook Precision Co., Ltd.',
                  company_name_ko: companyNameKo,
                  company_name_en: companyNameEn,
                  description: `Official Global B2B Showroom of ${companyNameEn || companyNameKo}.`,
                  business_type: 'Direct Manufacturer',
                  location: 'South Korea',
                },
              ]);
            } else {
              await supabase.from('buyers').insert([
                {
                  auth_user_id: data.user.id,
                  buyer_name: buyerName || 'Global Buyer',
                  company_name_en: buyerCompanyNameEn,
                  buyer_email: email,
                  country: country,
                  interest_category: category,
                },
              ]);
            }
          } catch (dbErr) {
            console.warn('Metadata DB Insert skipped:', dbErr);
          }
        }

        if (data?.user && data?.session === null) {
          setSuccessMessage(`A verification link has been sent to ${email}. Please check your inbox and click the link to activate your account.`);
        } else {
          // 회원가입 후 온보딩 안내 플래그 저장 후 홈 이동
          localStorage.setItem('klick_show_onboarding', 'true');
          setSuccessMessage(`Registration completed! Redirecting to home...`);
          setTimeout(() => {
            router.push('/');
          }, 1200);
        }
      } else {
        // 2. Supabase Auth Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        await supabase.auth.getSession();

        setSuccessMessage('Successfully signed in! Redirecting to home...');

        setTimeout(() => {
          router.push('/');
        }, 400);
      }
    } catch (error) {
      console.error('Auth Error:', error);
      let msg = error.message || 'Authentication failed.';

      if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        msg = 'Connection to Supabase server failed. Please check your Supabase URL & Anon Key in Vercel Environment Variables.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'Invalid email or password. Please check your credentials.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Your email address has not been confirmed yet. Please check your inbox for the verification link.';
      } else if (msg.includes('User already registered')) {
        msg = 'This email is already registered. Please switch to Sign In mode.';
      } else if (msg.includes('Password should be at least')) {
        msg = 'Password must be at least 6 characters long.';
      }

      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      <main className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* 좌측 플랫폼 안내 섹션 */}
        <div className="lg:col-span-6 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Globe className="w-4 h-4" /> KLICK Global B2B Network
          </span>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {userRole === 'seller' ? (
              <>
                Global B2B Export Center <br />
                <span className="text-blue-600">For Korean Manufacturers</span>
              </>
            ) : (
              <>
                Sourcing High-Quality Products <br />
                <span className="text-blue-600">Directly from Korean Factories</span>
              </>
            )}
          </h1>

          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            {userRole === 'seller'
              ? 'Register your factory and products without a dedicated sales team. AI automatically generates buyer-customized English detail pages for global exposure.'
              : 'Join as a Global Buyer to directly send RFQs, request wholesale pricing, and trade with verified Korean manufacturers with zero middleman markup.'}
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>Seller & Buyer Account Management System</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>Real-time Multilingual Translation & Direct RFQ System</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>Verified Korean Factory Virtual Showroom & Quotation Hub</span>
            </div>
          </div>
        </div>

        {/* 우측 회원가입 / 로그인 폼 카드의 영역 */}
        <div className="lg:col-span-6 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          {/* 역할 선택 탭 (Seller / Buyer) */}
          <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => {
                setUserRole('seller');
                setErrorMessage('');
              }}
              className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                userRole === 'seller'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Korean Seller</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUserRole('buyer');
                setErrorMessage('');
              }}
              className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                userRole === 'buyer'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Global Buyer</span>
            </button>
          </div>

          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              {isSignUp
                ? userRole === 'seller' ? 'Seller Sign Up' : 'Global Buyer Registration'
                : userRole === 'seller' ? 'Seller Sign In' : 'Global Buyer Sign In'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isSignUp
                ? 'Please fill in the required information below to create an account.'
                : 'Please sign in with your registered email address and password.'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* 1. 회원가입 시 역할별 입력 필드 */}
            {isSignUp && (
              <>
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

                      {/* ★ 바이어용 영문 회사명 필드 추가 */}
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
              </>
            )}

            {/* 2. 공통 로그인/가입 입력 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password (at least 6 characters) *</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
              />
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {isSignUp
                      ? userRole === 'seller' ? 'Complete Seller Registration' : 'Complete Buyer Registration'
                      : 'Sign In'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 로그인 / 회원가입 모드 전환 */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{isSignUp ? 'Already have an account?' : "Don't have an account yet?"}</span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="font-bold text-blue-600 hover:underline cursor-pointer"
            >
              {isSignUp ? 'Switch to Sign In ➡️' : 'Create Free Account ➡️'}
            </button>
          </div>
        </div>
      </main>

      {/* 비밀번호 찾기 모달 팝업 */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" /> Reset Your Password
              </span>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Enter your registered email address below. We will send you a verification link to reset your password.
            </p>

            {resetStatus && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold">
                {resetStatus}
              </div>
            )}

            <form onSubmit={handleSendPasswordReset} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Registered Email</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="seller@company.co.kr"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? 'Sending...' : 'Send Verification Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}