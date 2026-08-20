// components/Header.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Globe, 
  LayoutDashboard, 
  UserCheck, 
  ChevronDown, 
  LogOut, 
  User, 
  Building2, 
  MessageSquare, 
  FileText, 
  Home,
  Factory,
  Package
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState('EN');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  // 실시간 안읽은 채팅 메시지 총 개수 상태
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const languages = [
    { code: 'en', label: 'EN', name: 'English (US)' },
    { code: 'ko', label: 'KO', name: '한국어 (KR)' },
    { code: 'zh-CN', label: 'ZH', name: '中文 (简体)' },
    { code: 'ja', label: 'JA', name: '日本語 (JP)' },
    { code: 'es', label: 'ES', name: 'Español (ES)' },
    { code: 'ar', label: 'AR', name: 'العربية (AR)' },
  ];

  const setGoogleTranslateCookie = (langCode) => {
    if (!langCode) return;
    const domain = window.location.hostname;
    
    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain};`;

    const triggerGoogleCombo = () => {
      const googleCombo = document.querySelector('.goog-te-combo');
      if (googleCombo) {
        googleCombo.value = langCode;
        googleCombo.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    triggerGoogleCombo();
    setTimeout(triggerGoogleCombo, 300);
  };

  const updateUnreadCountFromStorage = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;

      if (!currentUser) {
        setUnreadChatCount(0);
        localStorage.setItem('klick_unread_chat_count', '0');
        return;
      }

      const currentRole = currentUser?.user_metadata?.role || 'seller';
      const userIdStr = currentUser.id.toString();

      let roomQuery = supabase.from('chat_rooms').select('id');
      if (currentRole === 'seller') {
        roomQuery = roomQuery.eq('seller_id', userIdStr);
      } else {
        roomQuery = roomQuery.eq('buyer_id', userIdStr);
      }

      const { data: roomData } = await roomQuery;

      if (!roomData || roomData.length === 0) {
        setUnreadChatCount(0);
        localStorage.setItem('klick_unread_chat_count', '0');
        return;
      }

      const roomIds = roomData.map((r) => r.id);
      const { data: msgData } = await supabase
        .from('chat_messages')
        .select('*')
        .in('room_id', roomIds);

      if (msgData && msgData.length > 0) {
        const opponentRole = currentRole === 'seller' ? 'buyer' : 'seller';

        const unreadMsgs = msgData.filter((m) => {
          const isOpponent = m.sender_role === opponentRole;
          const isUnread = m.is_read === false || m.is_read === null;
          return isOpponent && isUnread;
        });

        const count = Math.min(unreadMsgs.length, 99);
        setUnreadChatCount(count);
        localStorage.setItem('klick_unread_chat_count', count.toString());
      } else {
        setUnreadChatCount(0);
        localStorage.setItem('klick_unread_chat_count', '0');
      }
    } catch (err) {
      console.error('Failed to calculate exact unread count:', err);
      setUnreadChatCount(0);
      localStorage.setItem('klick_unread_chat_count', '0');
    }
  };

  useEffect(() => {
    const fetchUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        updateUnreadCountFromStorage();
      } else {
        setUser(null);
        setUnreadChatCount(0);
        localStorage.setItem('klick_unread_chat_count', '0');
      }
    };
    fetchUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        updateUnreadCountFromStorage();
      } else {
        setUser(null);
        setUnreadChatCount(0);
        localStorage.setItem('klick_unread_chat_count', '0');
      }
    });

    const savedCode = localStorage.getItem('klick_lang_code') || 'en';
    const savedLabel = localStorage.getItem('klick_lang_label') || 'EN';
    setCurrentLang(savedLabel);

    const handleUnreadUpdate = () => {
      updateUnreadCountFromStorage();
    };
    window.addEventListener('klick_unread_chat_updated', handleUnreadUpdate);

    const realtimeChannel = supabase
      .channel('public:chat_messages_header_count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          updateUnreadCountFromStorage();
        }
      )
      .subscribe();

    if (!document.getElementById('google-translate-script')) {
      const addScript = document.createElement('script');
      addScript.id = 'google-translate-script';
      addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      addScript.async = true;
      document.body.appendChild(addScript);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,ko,zh-CN,ja,es,ar',
            autoDisplay: false,
          },
          'google_translate_element'
        );

        if (savedCode && savedCode !== 'en') {
          setTimeout(() => {
            setGoogleTranslateCookie(savedCode);
          }, 200);
        }
      };
    } else {
      if (savedCode && savedCode !== 'en') {
        setTimeout(() => {
          setGoogleTranslateCookie(savedCode);
        }, 200);
      }
    }

    return () => {
      authListener?.subscription?.unsubscribe();
      supabase.removeChannel(realtimeChannel);
      window.removeEventListener('klick_unread_chat_updated', handleUnreadUpdate);
    };
  }, []);

  useEffect(() => {
    updateUnreadCountFromStorage();

    const savedCode = localStorage.getItem('klick_lang_code');
    if (savedCode && savedCode !== 'en') {
      const timer = setTimeout(() => {
        setGoogleTranslateCookie(savedCode);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const changeLanguage = (langCode, label) => {
    setCurrentLang(label);
    setIsLangOpen(false);

    localStorage.setItem('klick_lang_code', langCode);
    localStorage.setItem('klick_lang_label', label);

    setGoogleTranslateCookie(langCode);
    window.location.reload();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUnreadChatCount(0);
    setIsUserMenuOpen(false);
    localStorage.setItem('klick_unread_chat_count', '0');
    localStorage.removeItem('klick_read_room_ids');
    router.push('/');
  };

  const userRole = user?.user_metadata?.role || 'seller';
  const myCompanyShowroomUrl = user?.id ? `/companies/${user.id}` : '/companies/1';

  return (
    <header className="sticky top-0 z-[99999] bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div id="google_translate_element" className="hidden"></div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* KLICK 브랜드 로고 */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer group notranslate flex-shrink-0" translate="no">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center font-extrabold text-white text-lg sm:text-xl shadow-lg group-hover:bg-blue-500 transition">
            K
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1">
              KLICK <span className="text-[10px] sm:text-xs font-semibold bg-blue-600/30 text-blue-400 px-1.5 sm:px-2 py-0.5 rounded-full border border-blue-500/30">B2B</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wider hidden xs:block">
              Global Trade
            </span>
          </div>
        </Link>

        {/* 내비게이션 영역 */}
        <nav className="flex items-center gap-1.5 sm:gap-3">
          <Link
            href="/"
            title="Home"
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center justify-center"
          >
            <Home className="w-4 h-4 text-blue-400" />
            <span className="sr-only">Home</span>
          </Link>

          <Link
            href="/factories"
            className={`p-2 lg:px-3.5 lg:py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              pathname === '/factories'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20'
            }`}
          >
            <Factory className="w-4 h-4 text-blue-400" />
            <span className="hidden lg:inline">Factories</span>
          </Link>

          <Link
            href="/catalog"
            className={`p-2 lg:px-3.5 lg:py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              pathname === '/catalog'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20'
            }`}
          >
            <Package className="w-4 h-4 text-blue-400" />
            <span className="hidden lg:inline">Products</span>
          </Link>

          <Link
            href="/rfq"
            className="p-2 lg:px-3.5 lg:py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline">RFQ Board</span>
          </Link>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsLangOpen(false);
                }}
                className="px-2.5 py-1.5 lg:px-3.5 lg:py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1.5 relative"
              >
                <div className="relative">
                  <User className="w-4 h-4 text-blue-400" />
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                </div>

                <span className="font-extrabold hidden lg:inline">
                  {userRole === 'seller' ? 'Seller Hub' : 'Buyer Hub'}
                </span>
                
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 sm:w-56 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {userRole === 'seller' ? 'Seller Control Hub' : 'Buyer Sourcing Center'}
                  </div>

                  {userRole === 'seller' ? (
                    <>
                      <Link
                        href={myCompanyShowroomUrl}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
                      >
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <span>My Company & Showroom</span>
                      </Link>

                      {/* Product Dashboard 클릭 시 /products 페이지로 고정 */}
                      <Link
                        href="/products"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                        <span>Product Dashboard</span>
                      </Link>

                      <Link
                        href="/chat"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-purple-500" />
                          <span>Live Chat Hub</span>
                        </div>
                        {unreadChatCount > 0 && (
                          <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full">
                            {unreadChatCount} new
                          </span>
                        )}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/buyer/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2"
                      >
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <span>Buyer Profile Hub</span>
                      </Link>

                      <Link
                        href="/chat"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-purple-500" />
                          <span>Live Chat Hub</span>
                        </div>
                        {unreadChatCount > 0 && (
                          <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full">
                            {unreadChatCount} new
                          </span>
                        )}
                      </Link>
                    </>
                  )}

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-2.5 py-1.5 lg:px-3.5 lg:py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span className="hidden lg:inline">Sign In / Up</span>
            </Link>
          )}

          <div className="relative border-l border-slate-800 pl-1.5 sm:pl-2 ml-0.5 sm:ml-1">
            <button
              type="button"
              onClick={() => {
                setIsLangOpen(!isLangOpen);
                setIsUserMenuOpen(false);
              }}
              className="px-2 py-1.5 lg:px-3 lg:py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1"
              aria-label="Select Language"
            >
              <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="notranslate hidden lg:inline" translate="no">{currentLang}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden lg:inline" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-40 sm:w-44 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fadeIn">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Language
                </div>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => changeLanguage(lang.code, lang.label)}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                      currentLang === lang.label ? 'text-blue-600 bg-blue-50/60' : 'text-slate-700'
                    }`}
                  >
                    <span className="notranslate" translate="no">{lang.name}</span>
                    {currentLang === lang.label && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}