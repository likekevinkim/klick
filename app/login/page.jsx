// app/login/page.jsx
'use client';

import { useState, useEffect, Suspense } from 'react';
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
  KeyRound, 
  X,
  Send,
  ShieldCheck,
  Key,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

function AuthPageContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // false: Sign In, true: Sign Up
  const [userRole, setUserRole] = useState('seller'); // 'seller' or 'buyer'

  // 공통 입력 필드
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 6자리 이메일 OTP 인증 관련 상태
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // 셀러 전용 입력 상태 (영문 상호명 기본, 한글 상호명 옵션/보조)
  const [companyNameEn, setCompanyNameEn] = useState('');
  const [companyNameKo, setCompanyNameKo] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [category, setCategory] = useState('Industrial Machinery');

  // 바이어 전용 입력 상태 (담당자명, 영문 회사명, 국가)
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

  // 비밀번호 재설정 이메일 발송
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
        setResetStatus('Password reset link has been sent to your email address.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setResetStatus('Failed to send password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  // 1단계: Next.js API Route(Resend Direct)를 통한 6자리 OTP 인증번호 발송 요청
  const handleSendOtpCode = async () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    try {
      setIsSendingOtp(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to send verification code.');
      } else {
        setIsOtpSent(true);
        setSuccessMessage(`[${email}] A 6-digit verification code has been sent to your inbox.`);
      }
    } catch (err) {
      console.error('Send OTP Exception:', err);
      setErrorMessage('An error occurred while sending the verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2단계: 6자리 OTP 인증번호 서버 검증
  const handleVerifyOtpCode = async () => {
    if (!otpCode || otpCode.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setErrorMessage('');

      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Verification code does not match.');
        setIsEmailVerified(false);
      } else {
        setIsEmailVerified(true);
        setSuccessMessage('Email verified successfully! Please enter your company details below.');
      }
    } catch (err) {
      console.error('Verify OTP Error:', err);
      setErrorMessage('An error occurred during verification.');
      setIsEmailVerified(false);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // 3단계: 가입 완료 및 세부 정보 제출 핸들러 (인증 미완료 시 절대 진행 불가)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isSignUp) {
        if (!isEmailVerified) {
          setErrorMessage('Email verification is required before completing registration.');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }

        // Supabase 계정 생성
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              role: userRole,
              company_name: userRole === 'seller' ? (companyNameEn || companyNameKo) : buyerCompanyNameEn,
              company_name_en: userRole === 'seller' ? companyNameEn : buyerCompanyNameEn,
              company_name_ko: companyNameKo,
              buyer_name: userRole === 'buyer' ? buyerName : '',
              is_new_user: true
            }
          }
        });

        if (signUpError) throw signUpError;

        const activeUserId = signUpData?.user?.id;

        if (activeUserId) {
          try {
            if (userRole === 'seller') {
              await supabase.from('companies').upsert([
                {
                  user_id: activeUserId,
                  company_name: companyNameEn || companyNameKo || 'Hankook Precision Co., Ltd.',
                  company_name_en: companyNameEn,
                  company_name_ko: companyNameKo,
                  description: `Official Global B2B Showroom of ${companyNameEn || companyNameKo}.`,
                  business_type: 'Direct Manufacturer',
                  location: 'South Korea',
                },
              ], { onConflict: 'user_id' });
            } else {
              await supabase.from('buyers').upsert([
                {
                  auth_user_id: activeUserId,
                  buyer_name: buyerName || 'Global Buyer',
                  company_name_en: buyerCompanyNameEn,
                  buyer_email: email,
                  country: country,
                  interest_category: category,
                },
              ], { onConflict: 'auth_user_id' });
            }
          } catch (dbErr) {
            console.warn('Metadata DB Insert skipped:', dbErr);
          }
        }

        localStorage.setItem('klick_show_onboarding', 'true');
        setSuccessMessage('Registration completed successfully! Redirecting to home page...');

        setTimeout(() => {
          router.push('/');
        }, 1200);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        await supabase.auth.getSession();
        setSuccessMessage('Successfully signed in! Redirecting...');

        setTimeout(() => {
          router.push('/');
        }, 400);
      }
    } catch (error) {
      console.error('Auth Error:', error);
      let msg = error.message || 'Authentication process failed.';

      if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        msg = 'Failed to connect to server. Please check your internet connection.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'Invalid email or password.';
      } else if (msg.includes('User already registered')) {
        msg = 'This email is already registered. Please switch to Sign In mode.';
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
        {/* 좌측 안내 섹션 */}
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

        {/* 우측 폼 카드 영역 */}
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
                ? 'Step 1: Enter email and verify with 6-digit code sent to your inbox.'
                : 'Please sign in with your registered email address and password.'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* Step 1: 이메일 입력 영역 */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Email Address *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    disabled={isEmailVerified}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                {isSignUp && !isEmailVerified && (
                  <button
                    type="button"
                    disabled={isSendingOtp || !email}
                    onClick={handleSendOtpCode}
                    className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow transition flex-shrink-0 flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    {isSendingOtp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {isOtpSent ? <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> : <Send className="w-3.5 h-3.5 text-blue-400" />}
                        <span>{isOtpSent ? 'Resend' : 'Send Code'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 이메일 입력창 바로 직하단에 노출되는 6자리 OTP 입력 박스 */}
              {isSignUp && isOtpSent && !isEmailVerified && (
                <div className="mt-2.5 p-4 bg-blue-50/90 border border-blue-200 rounded-2xl space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-blue-600" />
                      Enter 6-digit verification code *
                    </label>
                    <span className="text-[10px] text-blue-600 font-semibold">Valid for 10 min</span>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="6-Digit Code"
                        className="w-full px-4 py-3 rounded-xl border border-blue-300 bg-white font-mono tracking-widest text-base font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none text-center text-slate-900"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isVerifyingOtp || otpCode.length < 6}
                      onClick={handleVerifyOtpCode}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition flex-shrink-0 flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                    >
                      {isVerifyingOtp ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 이메일 인증 성공 안내 상자 (이메일 직하단 노출) */}
              {isEmailVerified && isSignUp && (
                <div className="mt-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
                  <span>Email verified successfully! Please complete your company details below.</span>
                </div>
              )}
            </div>

            {/* Step 3: 세부 정보 입력 (영문 회사명 기본 및 한글 회사명 보조) */}
            {isSignUp && (
              <>
                {userRole === 'seller' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Company Name (Korean / Optional)</label>
                        <input
                          type="text"
                          value={companyNameKo}
                          onChange={(e) => setCompanyNameKo(e.target.value)}
                          placeholder="e.g. (주)한국정밀공업"
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

            {/* 비밀번호 입력 */}
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
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (isSignUp && !isEmailVerified)}
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

          {/* 모드 전환 */}
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

      {/* 비밀번호 찾기 모달 */}
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

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading Authentication Portal...</span>
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}