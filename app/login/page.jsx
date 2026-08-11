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
  Send
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

function AuthPageContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // false: 로그인, true: 이메일 인증 가입
  const [userRole, setUserRole] = useState('seller'); // 'seller' 또는 'buyer'

  // 입력 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
        setResetStatus('오류: ' + error.message);
      } else {
        setResetStatus('비밀번호 재설정 링크가 이메일로 발송되었습니다. 메일함을 확인해 주세요!');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setResetStatus('이메일 발송에 실패했습니다.');
    } finally {
      setResetLoading(false);
    }
  };

  // ★ Step 1: 회원가입용 이메일 인증 메일 발송
  const handleSendSignUpVerification = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage('올바른 이메일 주소를 입력해 주세요.');
      setIsLoading(false);
      return;
    }

    try {
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://klick-six.vercel.app';

      // 확인 메일 클릭 시 인증 완료 후 프로필 작성 페이지(/signup/profile)로 바로 이동
      const { error } = await supabase.auth.signUp({
        email,
        password: 'TemporaryAuthPassword123!', // 1단계 임시 비밀번호
        options: {
          emailRedirectTo: `${siteUrl}/signup/profile?role=${userRole}`,
          data: {
            role: userRole
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrorMessage('이미 가입된 이메일 주소입니다. 로그인 모드로 전환해 주세요.');
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setSuccessMessage(`[${email}] 메일함으로 인증 확인 링크를 보냈습니다! 메일함에서 링크를 클릭하시면 프로필 입력 페이지로 자동으로 이동합니다.`);
      }
    } catch (err) {
      console.error('Sign Up Email verification error:', err);
      setErrorMessage('인증 메일 발송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // ★ 기존 회원 로그인 핸들러
  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
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
    } catch (error) {
      console.error('Auth Error:', error);
      let msg = error.message || '로그인 처리에 실패했습니다.';

      if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        msg = '서버 연결에 실패했습니다. 인터넷 연결이나 Vercel 환경변수를 확인해 주세요.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (msg.includes('Email not confirmed')) {
        msg = '이메일 주소가 아직 인증되지 않았습니다. 메일함에서 확인 링크를 클릭해 주세요.';
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
          {/* 역할 선택 탭 */}
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
                ? userRole === 'seller' ? 'Seller Email Verification' : 'Global Buyer Email Verification'
                : userRole === 'seller' ? 'Seller Sign In' : 'Global Buyer Sign In'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isSignUp
                ? 'Enter your email address first. We will send a confirmation link to proceed.'
                : 'Please sign in with your registered email address and password.'}
            </p>
          </div>

          <form onSubmit={isSignUp ? handleSendSignUpVerification : handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                />
              </div>
            </div>

            {!isSignUp && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Password *</label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
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
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                  />
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
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
                    {isSignUp ? 'Send Verification Link' : 'Sign In'}
                  </span>
                  {isSignUp ? <Send className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
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