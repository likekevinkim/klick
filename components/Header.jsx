// components/Header.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Building2, 
  MessageSquare, 
  Package, 
  Globe, 
  User, 
  LogOut, 
  LogIn, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('seller');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    initHeaderSession();

    // ★ Supabase Realtime 기반 실시간 새 메시지 감지 리스너
    const channel = supabase
      .channel('public:chat_messages_header')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          // 새 메시지가 들어오면 안읽은 메시지 수 재계산 및 뱃지 업데이트
          handleNewRealtimeMessage(payload.new);
        }
      )
      .subscribe();

    // 로컬 커스텀 이벤트 연동 (채팅방 진입 시 즉시 0으로 차감)
    const handleUnreadUpdate = () => {
      const savedCount = localStorage.getItem('klick_unread_chat_count');
      if (savedCount !== null) {
        setUnreadCount(parseInt(savedCount, 10));
      } else {
        setUnreadCount(0);
      }
    };

    window.addEventListener('klick_unread_chat_updated', handleUnreadUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('klick_unread_chat_updated', handleUnreadUpdate);
    };
  }, [pathname]);

  const initHeaderSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user || null;
    setUser(currentUser);

    if (currentUser) {
      const role = currentUser.user_metadata?.role || 'seller';
      setUserRole(role);
    }

    // 안읽은 메시지 수 초기 계산
    calculateUnreadCount(currentUser);
  };

  // DB 및 로컬 상태 기반 안읽은 메시지 수 계산
  const calculateUnreadCount = async (currentUser) => {
    try {
      const savedCount = localStorage.getItem('klick_unread_chat_count');
      
      // 현재 채팅방(/chat)에 진입해 있는 상태라면 안읽은 개수 0 처리
      if (pathname === '/chat') {
        setUnreadCount(0);
        localStorage.setItem('klick_unread_chat_count', '0');
        return;
      }

      if (savedCount !== null) {
        setUnreadCount(parseInt(savedCount, 10));
      } else {
        // DB에서 최근 대화방 내역 기반 안읽은 개수 계산
        const { data: roomData } = await supabase
          .from('chat_rooms')
          .select('id');

        if (roomData && roomData.length > 0) {
          const roomIds = roomData.map(r => r.id);
          const { data: msgData } = await supabase
            .from('chat_messages')
            .select('*')
            .in('room_id', roomIds);

          if (msgData) {
            // 내가 보낸 메시지가 아닌 상대방이 보낸 메시지 수 카운트
            const targetRole = userRole === 'seller' ? 'buyer' : 'seller';
            const unreadMsgs = msgData.filter(m => m.sender_role === targetRole);
            const count = Math.min(unreadMsgs.length, 99); // 최대 99+
            
            setUnreadCount(count);
            localStorage.setItem('klick_unread_chat_count', count.toString());
          }
        }
      }
    } catch (err) {
      console.error('Failed to calculate unread count:', err);
    }
  };

  // 실시간으로 새 메시지가 INSERT 되었을 때 호출되는 스위치
  const handleNewRealtimeMessage = (newMsg) => {
    // 채팅 페이지에 접속 중일 때는 뱃지 증가시키지 않음
    if (window.location.pathname === '/chat') return;

    // 상대방이 보낸 메시지일 때 알림 뱃지 +1 증가
    setUnreadCount((prev) => {
      const nextCount = prev + 1;
      localStorage.setItem('klick_unread_chat_count', nextCount.toString());
      return nextCount;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('klick_unread_chat_count');
    alert('성공적으로 로그아웃되었습니다.');
    router.push('/');
  };

  return (
    <header className="bg-[#0F172A] text-white border-b border-slate-800 sticky top-0 z-[99999] backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-4">
        
        {/* 1. 플랫폼 로고 */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-xl tracking-wider shadow-lg shadow-blue-600/30 group-hover:scale-105 transition">
            K
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
              KLICK <span className="text-[10px] bg-blue-500/20 text-blue-400 font-extrabold px-1.5 py-0.5 rounded border border-blue-500/30">B2B</span>
            </span>
            <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Global Export Gateway</span>
          </div>
        </Link>

        {/* 2. 대메뉴 네비게이션 */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-extrabold">
          <Link
            href="/"
            className={`px-4 py-2 rounded-xl transition ${
              pathname === '/' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            카탈로그 (Home)
          </Link>

          <Link
            href="/products"
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              pathname.startsWith('/products') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>판매자 대시보드</span>
          </Link>

          {/* ★ 실시간 안읽은 메시지 뱃지가 적용된 채팅 메뉴 */}
          <Link
            href="/chat"
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 relative ${
              pathname === '/chat' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>실시간 무역 채팅</span>

            {/* 안읽은 메시지가 1개 이상일 때 노출되는 빨간색 알림 뱃지 */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-[#0F172A] animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </nav>

        {/* 3. 로그인 / 사용자 프로필 제어 구역 */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 transition cursor-pointer text-xs font-bold"
              >
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs">
                  {user.email ? user.email[0].toUpperCase() : 'S'}
                </div>
                <span className="text-slate-200 hidden sm:inline max-w-[120px] truncate">{user.email}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* 프로필 드롭다운 메뉴 */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1 z-[999999] animate-fadeIn">
                  <div className="px-3 py-2 border-b border-slate-100 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Role</span>
                    <span className="text-xs font-black text-blue-600 uppercase block">{userRole}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>로그아웃</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/chat"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>로그인 / 가입</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}