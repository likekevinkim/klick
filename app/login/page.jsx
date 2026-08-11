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
  RefreshCw,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

function AuthPageContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // false: Sign In, true: Sign Up
  const [userRole, setUserRole] = useState('seller'); // 'seller' or 'buyer'

  // 공통 입력 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 6자리 이메일 OTP 인증 관련 상태
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // 셀러 전용 입력 상태 (한글/영문 상호명 분리 수집)
  const [companyNameKo, setCompanyNameKo] = useState('');
  const [companyNameEn, setCompanyNameEn] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [category, setCategory] = useState('Industrial Machinery');

  // 바이어 전용 입력 상태 (담당자명, 영문 회사명, 국가)
  const [buyerName, setBuyerName] = useState('');
  const [buyerCompanyNameEn, setBuyerCompanyNameEn] = useState('');
  const [country, setCountry] = useState('United States');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rawDebugLog, setRawDebugLog] = useState(''); // 백엔드 상세 에러 로그 상태

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
        setResetStatus('오류: ' + error.message);
      } else {
        setResetStatus('비밀번호 재설정 링크가 이메일로 발송되었습니다. 메일함을 확인해 주세요!');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setResetStatus('이메일 발송 처리에 실패했습니다.');
    } finally {
      setResetLoading(false);
    }
  };

  // 1단계: 6자리 OTP 인증번호 발송 요청 (500 에러 감지 및 상세 예외 처리)
  const handleSendOtpCode = async () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('올바른 이메일 주소를 입력해 주세요.');
      return;
    }

    try {
      setIsSendingOtp(true);
      setErrorMessage('');
      setSuccessMessage('');
      setRawDebugLog('');

      console.log('Sending OTP request to email:', email);

      // Supabase OTP 메일 발송 시도
      let { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true
        }
      });

      // 예외 폴백: signUp 방식으로 재시도
      if (error) {
        console.warn('signInWithOtp failed. Retrying with signUp fallback...', error);
        const fallbackResult = await supabase.auth.signUp({
          email: email,
          password: 'TemporaryAuthPassword123!',
        });
        error = fallbackResult.error;
        data = fallbackResult.data;
      }

      if (error) {
        console.error('Supabase Email Error Dump:', error);
        
        const logDetail = JSON.stringify({
          message: error.message || 'Internal Server Error',
          status: error.status || 500,
          name: error.name || 'AuthRetryableFetchError',
          code: error.code || 'smtp_connection_failed'
        }, null, 2);
        setRawDebugLog(logDetail);

        if (error.status === 500 || error.name === 'AuthRetryableFetchError') {
          setErrorMessage('Supabase 백엔드에서 Resend 메일 서버 연결 시 500 오류가 발생했습니다. Supabase 대시보드의 SMTP Settings 중 Password(Resend API Key)와 Sender Email(onboarding@resend.dev) 설정을 재확인해 주세요.');
        } else if (error.message.includes('rate limit')) {
          setErrorMessage('이메일 발송 단기 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.');
        } else {
          setErrorMessage(`인증 메일 발송 실패 [오류: ${error.message}]`);
        }
      } else {
        console.log('Supabase Email OTP Sent Success:', data);
        setIsOtpSent(true);
        setSuccessMessage(`[${email}] 메일함으로 6자리 인증번호가 발송되었습니다. 수신함 및 스팸함을 확인해 주세요!`);
      }
    } catch (err) {
      console.error('Send OTP Exception Dump:', err);
      setRawDebugLog(String(err));
      setErrorMessage('인증번호 발송 처리 중 예상치 못한 서버 오류가 발생했습니다.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2단계: 6자리 OTP 인증번호 확인
  const handleVerifyOtpCode = async () => {
    if (!otpCode || otpCode.length < 6) {
      setErrorMessage('메일로 받으신 6자리 숫자 인증번호를 올바르게 입력해 주세요.');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setErrorMessage('');

      let { error } = await supabase.auth.verifyOtp({
        email: email,
        token: otpCode,
        type: 'signup'
      });

      if (error) {
        const { error: retryError } = await supabase.auth.verifyOtp({
          email: email,
          token: otpCode,
          type: 'email'
        });

        if (retryError) {
          setErrorMessage('인증번호가 일치하지 않거나 만료되었습니다. 메일함의 최신 번호를 확인해 주세요.');
          return;
        }
      }

      setIsEmailVerified(true);
      setSuccessMessage('이메일 인증이 완벽하게 완료되었습니다! 아래 비밀번호와 상호명 정보를 입력해 주세요.');
    } catch (err) {
      console.error('Verify OTP Error:', err);
      setErrorMessage('인증번호 확인 중 오류가 발생했습니다.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // 3단계: 가입 완료 및 세부 정보 제출 핸들러
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isSignUp) {
        if (!isEmailVerified) {
          setErrorMessage('가입을 진행하려면 먼저 이메일 6자리 인증번호 확인을 완료해야 합니다.');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMessage('비밀번호는 최소 6자리 이상이어야 합니다.');
          setIsLoading(false);
          return;
        }

        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
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

        const activeUserId = updateData?.user?.id;

        if (activeUserId) {
          try {
            if (userRole === 'seller') {
              await supabase.from('companies').upsert([
                {
                  user_id: activeUserId,
                  company_name: companyNameEn || companyNameKo || 'Hankook Precision Co., Ltd.',
                  company_name_ko: companyNameKo,
                  company_name_en: companyNameEn,
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
        setSuccessMessage('회원가입이 완료되었습니다! 홈 화면으로 이동합니다...');

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
        setSuccessMessage('성공적으로 로그인되었습니다! 홈 화면으로 이동합니다...');

        setTimeout(() => {
          router.push('/');
        }, 400);
      }
    } catch (error) {
      console.error('Auth Error:', error);
      let msg = error.message || '인증 처리에 실패했습니다.';

      if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        msg = '서버 연결에 실패했습니다. 인터넷 연결이나 Vercel 환경변수를 확인해 주세요.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = '이메일 또는 비밀번호가 올바르지 않습니다.';
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
                setRawDebugLog('');
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
                setRawDebugLog('');
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
            {/* Step 1: 이메일 입력 및 인증번호 발송 영역 */}
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
                        <span>{isOtpSent ? '재발송' : '인증번호 발송'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Step 2: 이메일 바로 아래에 노출되는 6자리 인증번호 입력창 */}
            {isSignUp && isOtpSent && !isEmailVerified && (
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    메일로 받으신 6자리 인증번호를 입력하세요 *
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold">유효시간 10분</span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="6자리 숫자 입력"
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
                        <span>인증번호 확인</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 이메일 인증 완료 상자 */}
            {isEmailVerified && isSignUp && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
                <span>이메일 6자리 인증이 완벽히 확인되었습니다! 아래 세부 정보를 입력해 주세요.</span>
              </div>
            )}

            {/* Step 3: 세부 정보 입력 */}
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
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* 디버깅용 Raw Error Log 출력 박스 */}
            {rawDebugLog && (
              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Supabase Raw Error Response Log:</span>
                </div>
                <pre>{rawDebugLog}</pre>
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
                setRawDebugLog('');
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