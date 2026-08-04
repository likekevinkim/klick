// app/login/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Building2, Globe, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // false: Sign In, true: Sign Up
  const [userRole, setUserRole] = useState('seller'); // 'seller' or 'buyer'

  // Common inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Seller specific inputs
  const [companyName, setCompanyName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [category, setCategory] = useState('Industrial Machinery');

  // Buyer specific inputs
  const [buyerName, setBuyerName] = useState('');
  const [country, setCountry] = useState('United States');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Supabase Auth submit handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isSignUp) {
        // 1. Supabase Auth Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: userRole,
              company_name: userRole === 'seller' ? companyName : '',
              buyer_name: userRole === 'buyer' ? buyerName : '',
            },
          },
        });

        if (error) throw error;

        // Save metadata according to user role
        if (data?.user) {
          if (userRole === 'seller') {
            await supabase.from('companies').insert([
              {
                company_name: companyName || 'Korean Manufacturer',
                description: `Official Global B2B Showroom of ${companyName}.`,
                business_type: 'Direct Manufacturer',
                location: 'South Korea',
              },
            ]);
          } else {
            await supabase.from('buyers').insert([
              {
                auth_user_id: data.user.id,
                buyer_name: buyerName || 'Global Buyer',
                buyer_email: email,
                country: country,
                interest_category: category,
              },
            ]);
          }
        }

        setSuccessMessage(`Registration completed for ${userRole === 'seller' ? 'Korean Manufacturer (Seller)' : 'Global Buyer'}. Switch to Sign In mode.`);
        setTimeout(() => {
          setIsSignUp(false);
          setSuccessMessage('');
        }, 1200);
      } else {
        // 2. Supabase Auth Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // 세션 정보 확정 대기
        await supabase.auth.getSession();

        const roleInMeta = data.user?.user_metadata?.role || userRole;
        setSuccessMessage('Successfully signed in! Redirecting to dashboard...');

        // 세션 파기 없는 Next.js 내장 안전 이동
        setTimeout(() => {
          if (roleInMeta === 'seller') {
            router.push('/products');
          } else {
            router.push('/buyer/profile');
          }
        }, 400);
      }
    } catch (error) {
      console.error('Auth Error:', error);
      let msg = error.message;
      if (msg.includes('Invalid login credentials')) {
        msg = 'Invalid email or password. Please check your credentials.';
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      <main className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Information Section */}
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

        {/* Right Form Card Section */}
        <div className="lg:col-span-6 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          {/* Role Toggle Tabs (Seller vs Buyer) */}
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
            {/* 1. Sign Up Specific Inputs */}
            {isSignUp && (
              <>
                {userRole === 'seller' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Company / Factory Name</label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Hankook Precision Co., Ltd."
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                      />
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
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name / Contact Person</label>
                      <input
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="John Smith"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
                      />
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

            {/* 2. Common Inputs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password (at least 6 characters)</label>
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

          {/* Toggle between Sign In / Sign Up */}
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
    </div>
  );
}