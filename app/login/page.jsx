// app/login/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  UserCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Globe, 
  Loader2, 
  AlertCircle,
  User,
  Briefcase
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // false: 로그인, true: 회원가입

  // 폼 입력 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('seller'); // 'seller' 또는 'buyer'
  const [companyName, setCompanyName] = useState('');
  const [buyerName, setBuyerName] = useState('');

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setMounted(true);
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userRole = session.user.user_metadata?.role || 'seller';
        if (userRole === 'seller') {
          router.push('/products');
        } else {
          router.push('/buyer/profile');
        }
      }
    } catch (err) {
      console.error('Session check error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (isSignUp) {
        // 회원가입 처리
        const userMetadata = {
          role: role,
          company_name: role === 'seller' ? companyName : '',
          buyer_name: role === 'buyer' ? buyerName : '',
        };

        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: userMetadata,
          },
        });

        if (error) throw error;

        if (data?.user) {
          alert('Account created successfully! Redirecting...');
          if (role === 'seller') {
            router.push('/products');
          } else {
            router.push('/buyer/profile');
          }
        }
      } else {
        // 로그인 처리
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) throw error;

        if (data?.session) {
          const userRole = data.user.user_metadata?.role || 'seller';
          if (userRole === 'seller') {
            router.push('/products');
          } else {
            router.push('/buyer/profile');
          }
        }
      }
    } catch (err) {
      console.error('Auth action error:', err);
      // Failed to fetch 에러 친절한 친화적 메시지 변환
      if (err.message && err.message.includes('Failed to fetch')) {
        setErrorMessage('Failed to connect to authentication server. Please check your Supabase API keys in .env.local or Vercel Environment Variables.');
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      <main className="max-w-md mx-auto px-6 mt-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 space-y-6 animate-fadeIn">
          
          {/* 상단 탭 헤더 */}
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              <ShieldCheck className="w-3.5 h-3.5" /> KLICK Global B2B Authentication
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isSignUp ? 'Create B2B Account' : 'Sign In to KLICK'}
            </h1>
            <p className="text-xs text-slate-500">
              {isSignUp ? 'Join global trade marketplace as Seller or Buyer' : 'Welcome back! Enter your email and password'}
            </p>
          </div>

          {/* 로그인 / 회원가입 전환 버튼 */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMessage(''); }}
              className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
                !isSignUp ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMessage(''); }}
              className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
                isSignUp ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* 에러 메시지 알림 박스 */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 폼 입력 영역 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 회원가입일 때만 계정 유형 선택 (Seller vs Buyer) */}
            {isSignUp && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Select Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('seller')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2 cursor-pointer ${
                      role === 'seller' ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/10' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <Building2 className={`w-4 h-4 ${role === 'seller' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="block text-xs font-extrabold text-slate-900">Korean Seller</span>
                      <span className="text-[10px] text-slate-400">Manufacturer</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2 cursor-pointer ${
                      role === 'buyer' ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/10' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <Globe className={`w-4 h-4 ${role === 'buyer' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="block text-xs font-extrabold text-slate-900">Global Buyer</span>
                      <span className="text-[10px] text-slate-400">Importer</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 셀러 또는 바이어 이름/회사명 추가 입력 (회원가입 시) */}
            {isSignUp && (
              <>
                {role === 'seller' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company / Factory Name</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Hankook Precision Co., Ltd."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Buyer Contact Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="e.g. John Smith"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 이메일 주소 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 pt-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Complete Registration' : 'Sign In Now'}</span>
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