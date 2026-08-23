// app/admin/layout.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import { ShieldCheck, Users, Building2, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ADMIN_EMAILS } from '@/lib/adminEmails';

const NAV_ITEMS = [
  { href: '/admin/sellers', label: '셀러 관리', icon: Building2 },
  { href: '/admin/buyers', label: '바이어 관리', icon: Users }
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    setMounted(true);
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      setCheckingAuth(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const email = session?.user?.email || '';
      setIsAdmin(ADMIN_EMAILS.includes(email));
    } finally {
      setCheckingAuth(false);
    }
  };

  if (!mounted || checkingAuth) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] text-slate-900 antialiased">
        <Header />
        <div className="max-w-md mx-auto mt-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-3">
          <Lock className="w-10 h-10 text-slate-300 mx-auto" />
          <h1 className="text-sm font-extrabold text-slate-800">Admin Access Only</h1>
          <p className="text-xs text-slate-500">
            {session ? 'This account is not the site administrator.' : 'Please log in with the administrator account first.'}
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            {!session && (
              <Link href="/login" className="text-xs font-bold text-blue-600 hover:underline">Log In</Link>
            )}
            <Link href="/" className="text-xs font-bold text-slate-500 hover:underline">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 flex flex-col sm:flex-row gap-6">
        <nav className="sm:w-48 flex-shrink-0 flex sm:flex-col gap-1.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 min-w-0 space-y-8">{children}</main>
      </div>
    </div>
  );
}
