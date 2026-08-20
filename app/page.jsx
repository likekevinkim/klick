// app/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Globe, 
  ArrowRight, 
  ShieldCheck, 
  Package, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  Send,
  Loader2,
  MessageSquare,
  Plus,
  X,
  Edit3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [unreadCount, setUnreadCount] = useState(0);

  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('seller');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const categories = [
    'All',
    'Industrial Machinery',
    'K-Beauty & Cosmetics',
    'K-Food & Beverages',
    'Electronics & Smart IT',
    'General Manufacturing'
  ];

  useEffect(() => {
    setMounted(true);
    fetchHomeProducts();
    updateUnreadCount();
    checkOnboardingStatus();

    const handleUnreadUpdate = () => {
      updateUnreadCount();
    };
    window.addEventListener('klick_unread_chat_updated', handleUnreadUpdate);

    return () => {
      window.removeEventListener('klick_unread_chat_updated', handleUnreadUpdate);
    };
  }, []);

  // ★ 로그인 직후 플래그(klick_show_onboarding)가 명시적으로 존재하는 경우에만 모달 트리거
  const checkOnboardingStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userObj = session?.user || null;
      setCurrentUser(userObj);

      if (userObj) {
        const role = userObj.user_metadata?.role || 'seller';
        setUserRole(role);

        // 로그인/회원가입 직후 설정되는 온보딩 플래그 확인
        const isLoginTriggered = localStorage.getItem('klick_show_onboarding');

        if (isLoginTriggered === 'true') {
          if (role === 'seller') {
            const { data: compData } = await supabase
              .from('companies')
              .select('*')
              .eq('user_id', userObj.id)
              .maybeSingle();

            const { data: prodData } = await supabase
              .from('products')
              .select('id')
              .eq('user_id', userObj.id);

            const hasCompanyDetails = compData && (compData.description || compData.certifications);
            const hasProducts = prodData && prodData.length > 0;

            if (!hasCompanyDetails || !hasProducts) {
              setShowOnboardingModal(true);
            } else {
              localStorage.removeItem('klick_show_onboarding');
            }
          } else {
            const { data: buyerData } = await supabase
              .from('buyers')
              .select('*')
              .eq('auth_user_id', userObj.id)
              .maybeSingle();

            const hasBuyerDetails = buyerData && (buyerData.company_name_en || buyerData.country);

            if (!hasBuyerDetails) {
              setShowOnboardingModal(true);
            } else {
              localStorage.removeItem('klick_show_onboarding');
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to check onboarding status:', err);
    }
  };

  // 모달 닫기 시 플래그 즉시 삭제 -> 이후 홈 화면 방문 시 재노출 방지
  const handleCloseOnboarding = () => {
    localStorage.removeItem('klick_show_onboarding');
    setShowOnboardingModal(false);
  };

  // 정보 입력 페이지로 이동
  const handleGoToProfileEdit = () => {
    localStorage.removeItem('klick_show_onboarding');
    setShowOnboardingModal(false);

    if (userRole === 'seller') {
      const myId = currentUser?.id || '1';
      router.push(`/companies/${myId}?edit=true`);
    } else {
      router.push('/buyer/profile');
    }
  };

  const updateUnreadCount = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserObj = session?.user || null;

    if (!currentUserObj) {
      setUnreadCount(0);
      localStorage.setItem('klick_unread_chat_count', '0');
      return;
    }

    const savedCount = localStorage.getItem('klick_unread_chat_count');
    const parsed = parseInt(savedCount || '0', 10);
    setUnreadCount(isNaN(parsed) ? 0 : parsed);
  };

  const fetchHomeProducts = async () => {
    try {
      setLoadingProducts(true);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error on homepage:', error);
        setProducts([]);
      } else if (data) {
        const formattedData = data.map(item => {
          let mainImg = item.image_url || '';
          if (!mainImg && item.gallery_images) {
            if (Array.isArray(item.gallery_images) && item.gallery_images.length > 0) {
              mainImg = item.gallery_images[0];
            } else if (typeof item.gallery_images === 'string') {
              try {
                const parsed = JSON.parse(item.gallery_images);
                if (Array.isArray(parsed) && parsed.length > 0) mainImg = parsed[0];
              } catch (e) {
                mainImg = item.gallery_images;
              }
            }
          }

          return {
            ...item,
            image_url: mainImg,
            title_en: item.title_en || item.product_name || item.title_ko || '',
            title_ko: item.title_ko || item.product_name || item.title_en || ''
          };
        });

        setProducts(formattedData);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Failed to load products for homepage:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = 
      (item.title_en || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.title_ko || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      <section className="bg-[#0F172A] text-white relative overflow-hidden border-b border-slate-800 py-16 px-6">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-6 relative z-10 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-extrabold border border-blue-500/20">
              <Globe className="w-4 h-4" />
              <span>KLICK - Direct B2B Gateway to South Korean Manufacturers</span>
            </div>

            {unreadCount > 0 && (
              <Link
                href="/chat"
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500 text-white text-xs font-extrabold shadow-lg animate-pulse"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{unreadCount} Unread Trade Messages</span>
              </Link>
            )}
          </div>

          <div className="space-y-3 max-w-3xl">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-snug">
              Source High-Quality Products Directly From <br className="hidden md:block" />
              <span className="text-blue-400">Verified Korean Factories</span>
            </h1>

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
              Zero middleman markup. Connect with verified South Korean manufacturers with AI-translated English specifications, instant RFQs, and official B2B trade documents.
            </p>
          </div>

          <div className="max-w-2xl bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 flex items-center gap-2 shadow-2xl">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Korean products, factories, or specifications..."
                className="w-full bg-transparent text-white placeholder-slate-400 text-xs md:text-sm focus:outline-none"
              />
            </div>

            <button
              type="button"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer flex-shrink-0"
            >
              <span>Search</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white border border-blue-500'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
                Featured B2B Factory Products
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Verified South Korean manufacturers ready for wholesale export.
            </p>
          </div>

          <Link
            href="/products"
            className="text-xs font-extrabold text-blue-600 hover:underline flex items-center gap-1 self-start md:self-auto"
          >
            <span>View Dashboard ({products.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading catalog items from database...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3 p-6 shadow-sm">
            <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-sm font-bold text-slate-800">No Products Registered Yet</h3>
            <p className="text-xs text-slate-500">
              There are no live products matching your criteria in the database. Please register a product from the Seller Dashboard!
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Register First Product</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {filteredProducts.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/products/${item.id}`)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition duration-200 overflow-hidden flex flex-col justify-between group p-3.5 space-y-3 cursor-pointer"
              >
                <div className="space-y-2.5">
                  <div className="w-full aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-100 relative flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title_en || item.title_ko || item.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Package className="w-8 h-8 text-slate-300" />
                    )}

                    <span className="absolute top-2 left-2 bg-[#0F172A]/80 backdrop-blur-sm text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                      {item.category || 'Manufacturing'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 truncate">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{item.company_name || 'Verified Factory'}</span>
                  </div>

                  <h3 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition min-h-[32px]">
                    {item.title_en || item.title_ko || item.product_name || 'Verified B2B Product'}
                  </h3>

                  <div className="pt-1 border-t border-slate-100 space-y-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-extrabold text-emerald-600">${item.price || '0.00'}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">/ Unit</span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-medium">
                      MOQ: <span className="font-extrabold text-slate-800">{item.moq || '1 Unit'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-blue-600 font-bold">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified Spec
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))}
          </div>
        )}

        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900">Verified Factory Direct</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">
                Direct export deals with Korean manufacturers without middleman markup.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900">AI Spec Copywriting</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">
                Specifications translated into clear English for global buyers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 flex-shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900">Instant Trade Invoices</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">
                Generate official Proforma Invoices (PI) and trade documents in chat.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 로그인 직후 온보딩 플래그가 존재할 때만 딱 1회 노출되는 권유 모달 */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-extrabold text-blue-600 flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <Sparkles className="w-3.5 h-3.5" /> Welcome to KLICK B2B Network!
              </span>

              <button
                type="button"
                onClick={handleCloseOnboarding}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                {userRole === 'seller'
                  ? '공장 상세 스펙 및 세부 프로필을 지금 등록하시겠습니까?'
                  : 'Would you like to complete your buyer sourcing profile now?'}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {userRole === 'seller'
                  ? '공장 위치, 주요 생산 설비, 품질 인증서(ISO/CE) 및 판매 물품을 사전에 세밀히 등록하시면 해외 바이어들에게 3배 더 많은 견적 문의를 받을 수 있습니다.'
                  : 'Complete your buyer sourcing profile to receive direct wholesale factory quotes and verified manufacturer discounts.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseOnboarding}
                className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {userRole === 'seller' ? '나중에 작성하기 (둘러보기)' : 'Skip for Now (Explore First)'}
              </button>

              <button
                type="button"
                onClick={handleGoToProfileEdit}
                className="py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>{userRole === 'seller' ? '지금 정보 입력하기' : 'Complete Profile Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}