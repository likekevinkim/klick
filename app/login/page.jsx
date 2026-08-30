// app/login/page.jsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Klick from '@/components/Klick';
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

  // Common input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 6-digit email OTP states
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Status message states specific to Email/OTP section
  const [emailStatusMessage, setEmailStatusMessage] = useState({ type: '', text: '' });

  // Seller dedicated states (English name primary, Korean name secondary)
  const [companyNameEn, setCompanyNameEn] = useState('');
  const [companyNameKo, setCompanyNameKo] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [category, setCategory] = useState('');
  const [businessType, setBusinessType] = useState('');

  // Buyer dedicated states
  const [buyerName, setBuyerName] = useState('');
  const [buyerCompanyNameEn, setBuyerCompanyNameEn] = useState('');
  const [country, setCountry] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password reset modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState('');

  useEffect(() => {
    setMounted(true);
    checkExistingSession();
  }, []);

  // 이미 로그인된 사용자인 경우 홈 화면(/)으로 자동 이동
  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      router.push('/');
    }
  };

  // Send password reset email
  const handleSendPasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;

    try {
      setResetLoading(true);
      setResetStatus('');

      // window.location.origin을 쓰면 로컬(localhost)에서 보낸 링크가 로컬 주소로 가버리므로,
      // 어디서 요청했든 항상 실제 운영 도메인으로 보낸다
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://klick.biz';

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${siteUrl}/reset-password`
      });

      if (error) {
        setResetStatus('오류가 발생했어요: ' + error.message);
      } else {
        setResetStatus('비밀번호 재설정 링크를 이메일로 보내드렸어요.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setResetStatus('비밀번호 재설정 이메일 발송에 실패했어요.');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 1: Send 6-digit OTP verification code via Next.js Route Handler
  const handleSendOtpCode = async () => {
    if (!email || !email.includes('@')) {
      setEmailStatusMessage({ type: 'error', text: '올바른 이메일 주소를 입력해주세요.' });
      return;
    }

    try {
      setIsSendingOtp(true);
      setEmailStatusMessage({ type: '', text: '' });
      setErrorMessage('');
      setSuccessMessage('');

      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setEmailStatusMessage({ type: 'error', text: data.error || '인증번호 발송에 실패했어요.' });
      } else {
        setIsOtpSent(true);
        setEmailStatusMessage({
          type: 'success',
          text: `[${email}] 주소로 6자리 인증번호를 보내드렸어요. 메일함을 확인해주세요.`
        });
      }
    } catch (err) {
      console.error('Send OTP Exception:', err);
      setEmailStatusMessage({ type: 'error', text: '인증번호 발송 중 오류가 발생했어요.' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify 6-digit OTP code on server
  const handleVerifyOtpCode = async () => {
    if (!otpCode || otpCode.length < 6) {
      setEmailStatusMessage({ type: 'error', text: '이메일로 받으신 6자리 인증번호를 입력해주세요.' });
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setEmailStatusMessage({ type: '', text: '' });

      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode })
      });

      const data = await res.json();

      if (!res.ok) {
        setEmailStatusMessage({ type: 'error', text: data.error || '인증번호가 일치하지 않아요.' });
        setIsEmailVerified(false);
      } else {
        setIsEmailVerified(true);
        setEmailStatusMessage({
          type: 'success',
          text: '이메일 인증이 완료됐어요! 아래에 정보를 마저 입력해주세요.'
        });
      }
    } catch (err) {
      console.error('Verify OTP Error:', err);
      setEmailStatusMessage({ type: 'error', text: '인증 처리 중 오류가 발생했어요.' });
      setIsEmailVerified(false);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 3: Complete registration or Sign In with strict role verification
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isSignUp) {
        if (!isEmailVerified) {
          setErrorMessage('회원가입을 완료하려면 먼저 이메일 인증을 해주세요.');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMessage('비밀번호는 6자 이상이어야 해요.');
          setIsLoading(false);
          return;
        }

        // Supabase user registration
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              role: userRole,
              company_name: userRole === 'seller' ? (companyNameEn || companyNameKo) : buyerCompanyNameEn,
              company_name_en: userRole === 'seller' ? companyNameEn : buyerCompanyNameEn,
              company_name_ko: companyNameKo,
              contact_person: userRole === 'seller' ? companyNameEn : buyerName,
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
                  company_name: companyNameEn || companyNameKo || 'Not specified',
                  company_name_en: companyNameEn,
                  company_name_ko: companyNameKo,
                  category: category,
                  business_type: businessType,
                  location: 'Republic of Korea',
                  updated_at: new Date().toISOString()
                },
              ], { onConflict: 'user_id' });
            } else {
              await supabase.from('buyers').upsert([
                {
                  auth_user_id: activeUserId,
                  buyer_name: buyerName || 'Not specified',
                  buyer_email: email,
                  company_name: buyerCompanyNameEn || 'Not specified',
                  country: country,
                },
              ], { onConflict: 'auth_user_id' });
            }
          } catch (dbErr) {
            console.warn('Metadata DB Insert skipped:', dbErr);
          }
        }

        setSuccessMessage('회원가입이 완료됐어요! 로그인 화면으로 이동할게요...');

        setTimeout(() => {
          setIsSignUp(false);
          setIsOtpSent(false);
          setIsEmailVerified(false);
          setOtpCode('');
        }, 1200);
      } else {
        // ★ 로그인 시도 및 역할 정밀 검증
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) throw error;

        if (data?.user) {
          const userIdStr = data.user.id.toString();
          const userMetaRole = data.user.user_metadata?.role;

          let actualRole = userMetaRole;

          // 메타데이터에 없을 경우 DB 테이블 조회로 역할 2차 판별
          if (!actualRole) {
            const { data: sellerProf } = await supabase
              .from('companies')
              .select('user_id')
              .eq('user_id', userIdStr)
              .maybeSingle();

            if (sellerProf) {
              actualRole = 'seller';
            } else {
              const { data: buyerProf } = await supabase
                .from('buyers')
                .select('auth_user_id')
                .eq('auth_user_id', userIdStr)
                .maybeSingle();

              if (buyerProf) {
                actualRole = 'buyer';
              }
            }
          }

          if (!actualRole) {
            actualRole = userRole;
          }

          // ★ [핵심 역할 교차 로그인 방지]: 선택된 탭(userRole)과 계정 진짜 역할(actualRole) 비교
          if (userRole !== actualRole) {
            await supabase.auth.signOut(); // 로그인 해제
            setIsLoading(false);
            setErrorMessage(
              `이 계정은 ${actualRole === 'seller' ? '셀러(판매자)' : '바이어(구매자)'}로 가입되어 있어요. ${actualRole === 'seller' ? '한국 셀러' : '글로벌 바이어'} 탭으로 바꾼 뒤 다시 로그인해주세요.`
            );
            return;
          }

          setSuccessMessage(`${actualRole === 'seller' ? '셀러' : '바이어'}로 로그인했어요! 홈 화면으로 이동할게요...`);

          // ★ 역할을 불문하고 첫 화면(홈 화면)으로 리다이렉트 처리
          setTimeout(() => {
            router.push('/');
          }, 600);
        }
      }
    } catch (error) {
      console.error('Auth Error:', error);
      let msg = error.message || '처리 중 오류가 발생했어요.';

      if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        msg = '서버에 연결하지 못했어요. 인터넷 연결 상태를 확인해주세요.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = '이메일 또는 비밀번호가 올바르지 않아요.';
      } else if (msg.includes('User already registered')) {
        msg = '이미 가입된 이메일이에요. 로그인 화면으로 전환해주세요.';
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
        {/* Left Information Section */}
        <div className="lg:col-span-6 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Globe className="w-4 h-4" /> <Klick /> Global B2B Network
          </span>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {userRole === 'seller' ? (
              <>
                국내 제조업체를 위한 <br />
                <span className="text-blue-600">글로벌 수출 플랫폼</span>
              </>
            ) : (
              <>
                한국 공장에서 직접 <br />
                <span className="text-blue-600">고품질 제품을 소싱하세요</span>
              </>
            )}
          </h1>

          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            {userRole === 'seller'
              ? '별도 영업팀 없이도 우리 공장과 제품을 등록해보세요. AI가 알아서 해외 바이어용 영문 상세페이지를 만들어드려요.'
              : '글로벌 바이어로 가입하면 검증된 한국 제조사에 직접 견적을 요청하고, 중간 마진 없이 바로 거래할 수 있어요.'}
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>셀러(판매자) · 바이어(구매자) 계정 관리</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>실시간 다국어 번역 채팅 & 견적 요청(RFQ)</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>검증된 한국 공장 온라인 쇼룸 & 견적 허브</span>
            </div>
          </div>
        </div>

        {/* Right Form Card Section */}
        <div className="lg:col-span-6 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          {/* Role Selection Tabs */}
          <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => {
                setUserRole('seller');
                setErrorMessage('');
                setEmailStatusMessage({ type: '', text: '' });
              }}
              className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                userRole === 'seller'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>한국 셀러</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUserRole('buyer');
                setErrorMessage('');
                setEmailStatusMessage({ type: '', text: '' });
              }}
              className={`py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                userRole === 'buyer'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>글로벌 바이어</span>
            </button>
          </div>

          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              {isSignUp
                ? userRole === 'seller' ? '셀러 회원가입' : '글로벌 바이어 회원가입'
                : userRole === 'seller' ? '셀러 로그인' : '글로벌 바이어 로그인'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isSignUp
                ? '1단계: 이메일을 입력하고, 받으신 6자리 인증번호를 확인해주세요.'
                : '가입하신 이메일 주소와 비밀번호로 로그인해주세요.'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* Step 1: Email Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">이메일 주소 *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    disabled={isEmailVerified}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                        <span>{isOtpSent ? '재발송' : '인증번호 받기'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Step 2: 6-Digit OTP Box */}
              {isSignUp && isOtpSent && !isEmailVerified && (
                <div className="mt-2.5 p-4 bg-blue-50/90 border border-blue-200 rounded-2xl space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-blue-600" />
                      6자리 인증번호를 입력해주세요 *
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
                        placeholder="6자리 숫자"
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
                          <span>인증 확인</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {isSignUp && emailStatusMessage.text && (
                <div className={`mt-2.5 p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium animate-fadeIn ${
                  emailStatusMessage.type === 'success' 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}>
                  {emailStatusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  )}
                  <span className="leading-relaxed">{emailStatusMessage.text}</span>
                </div>
              )}
            </div>

            {/* Step 3: Company Details */}
            {isSignUp && (
              <>
                {userRole === 'seller' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">회사 상호명 (한글 / 선택)</label>
                        <input
                          type="text"
                          value={companyNameKo}
                          onChange={(e) => setCompanyNameKo(e.target.value)}
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
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm bg-white"
                        >
                          <option value="" disabled>선택해주세요</option>
                          <option value="Industrial Machinery">산업 기계 & 부품</option>
                          <option value="K-Beauty & Cosmetics">K-뷰티 & 화장품</option>
                          <option value="K-Food & Beverages">K-푸드 & 식음료</option>
                          <option value="Electronics & Smart IT">전자 & IT 기기</option>
                          <option value="General Manufacturing">일반 제조업</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">사업 형태</label>
                        <select
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm bg-white"
                        >
                          <option value="" disabled>선택해주세요</option>
                          <option value="Direct Manufacturer">직접 제조사</option>
                          <option value="OEM / ODM Manufacturer">OEM / ODM 제조사</option>
                          <option value="High-Tech Direct Manufacturer">첨단기술 직접 제조사</option>
                          <option value="Export Trading House">수출 무역회사</option>
                          <option value="etc">기타</option>
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
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm bg-white"
                      >
                        <option value="" disabled>선택해주세요</option>
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
              </>
            )}

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">비밀번호 (6자 이상) *</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    비밀번호를 잊으셨나요?
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

            {/* General Form Level Error / Success Messages */}
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
                  <span>처리 중...</span>
                </>
              ) : (
                <>
                  <span>
                    {isSignUp
                      ? userRole === 'seller' ? '셀러 가입 완료하기' : '바이어 가입 완료하기'
                      : '로그인'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{isSignUp ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'}</span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage('');
                setSuccessMessage('');
                setEmailStatusMessage({ type: '', text: '' });
              }}
              className="font-bold text-blue-600 hover:underline cursor-pointer"
            >
              {isSignUp ? '로그인하러 가기 ➡️' : '무료로 회원가입하기 ➡️'}
            </button>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" /> 비밀번호 재설정
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
              가입하신 이메일 주소를 입력해주세요. 비밀번호를 재설정할 수 있는 링크를 보내드릴게요.
            </p>

            {resetStatus && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold">
                {resetStatus}
              </div>
            )}

            <form onSubmit={handleSendPasswordReset} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">가입하신 이메일 주소</label>
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
                  취소
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? '발송 중...' : '재설정 메일 보내기'}
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
            <span>로그인 화면을 불러오는 중...</span>
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}