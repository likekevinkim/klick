// app/HomeClient.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Klick from '@/components/Klick';
import WelcomeModal from '@/components/WelcomeModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Globe, 
  ArrowRight, 
  ShieldCheck, 
  Package,
  Sparkles,
  Search,
  Send,
  Loader2,
  MessageSquare,
  Plus,
  X,
  Edit3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FILTER_CATEGORIES } from '@/lib/categories';
import { formatProductTitle } from '@/lib/productTitle';
import { formatCompanyName } from '@/lib/companyName';

// Google Translate turns "All" into stiff literal Korean ("모두") — show the
// more natural phrasing directly instead when Korean is selected.
const CATEGORY_LABEL_KO = {
  All: '전체',
  'Industrial Machinery': '산업 기계',
  'K-Beauty & Cosmetics': 'K-뷰티/화장품',
  'K-Food & Beverages': 'K-푸드/식품',
  'Electronics & Smart IT': '전자/IT',
  'General Manufacturing': '일반 제조업'
};

export default function HomeClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentLang, setCurrentLang] = useState('en');

  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('seller');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [brokenImageIds, setBrokenImageIds] = useState(new Set());

  const categories = FILTER_CATEGORIES;

  useEffect(() => {
    setMounted(true);
    setCurrentLang(localStorage.getItem('klick_lang_code') || 'en');
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

  // 홈 화면의 "첫 상품 등록" 버튼 — 비로그인 상태면 상품 등록 페이지로 보내지 않고 바로 안내
  const handleRegisterProductClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      // alert()는 브라우저 네이티브 다이얼로그라 Google Translate 위젯이 번역하지 못함 — 직접 언어 분기 필요
      alert(currentLang === 'ko' ? '셀러로 등록해야 제품을 올릴 수 있습니다.' : 'Please sign in as a seller to list a product.');
      router.push('/login');
      return;
    }
    router.push('/products');
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

      // is_verified와 회사명(영/한)은 companies 테이블에만 있으므로 별도 조회 후 user_id로 병합
      const { data: allCompanies } = await supabase
        .from('companies')
        .select('user_id, company_name_en, company_name_ko, is_verified');
      const verifiedSellerIds = new Set((allCompanies || []).filter((c) => c.is_verified).map((c) => c.user_id));
      const companyNameById = new Map((allCompanies || []).map((c) => [c.user_id, c]));

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

          const sellerCompany = companyNameById.get(item.user_id);

          return {
            ...item,
            image_url: mainImg,
            title_en: item.title_en || item.product_name || item.title_ko || '',
            title_ko: item.title_ko || item.product_name || item.title_en || '',
            company_name_en: sellerCompany?.company_name_en || item.company_name || '',
            company_name_ko: sellerCompany?.company_name_ko || '',
            is_verified: verifiedSellerIds.has(item.user_id)
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <WelcomeModal />
      <Header />

      <section className="bg-[#0F172A] text-white relative overflow-hidden border-b border-slate-800 py-16 px-6">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-6 relative z-10 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-extrabold border border-blue-500/20">
              <Globe className="w-4 h-4" />
              <span><Klick /> - Direct B2B Gateway to South Korean Manufacturers</span>
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

          <div className="space-y-2 max-w-3xl">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-snug break-keep">
              Source High-Quality Products Directly From <span className="text-blue-400">Business-Verified Korean Manufacturers</span>
            </h1>

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium break-keep">
              Zero middleman markup. Connect with South Korean manufacturers with AI-translated English specifications, instant RFQs, and standard-format B2B trade documents.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="max-w-2xl bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 flex items-center gap-2 shadow-2xl">
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
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer flex-shrink-0"
            >
              <span className="notranslate" translate="no">{currentLang === 'ko' ? '찾기' : 'Search'}</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white border border-blue-500'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {currentLang === 'ko' && CATEGORY_LABEL_KO[cat] ? (
                  <span className="notranslate" translate="no">{CATEGORY_LABEL_KO[cat]}</span>
                ) : (
                  cat
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        <div id="product-grid" className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-200 pb-3 scroll-mt-24">
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
              South Korean manufacturers ready for wholesale export.
            </p>
          </div>

          <Link
            href="/catalog"
            className="text-xs font-extrabold text-blue-600 hover:underline flex items-center gap-1 self-start md:self-auto"
          >
            <span>View All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3 p-6 shadow-sm">
              <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <h3 className="text-sm font-bold text-slate-800">No Products Registered Yet</h3>
              <p className="text-xs text-slate-500">
                There are no live products in the database yet. Please register a product from the Seller Dashboard!
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRegisterProductClick}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register First Product</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3 p-6 shadow-sm">
              <Search className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <h3 className="text-sm font-bold text-slate-800">No Matching Products</h3>
              <p className="text-xs text-slate-500">
                No products match your search or category filter. Try different keywords or clear the filters.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  <span>Clear Filters</span>
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredProducts.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/products/${item.id}`)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition duration-200 overflow-hidden flex flex-col justify-between group p-3.5 space-y-3 cursor-pointer"
              >
                <div className="space-y-2.5">
                  <div className="w-full aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-100 relative flex items-center justify-center">
                    {item.image_url && !brokenImageIds.has(item.id) ? (
                      <img
                        src={item.image_url}
                        alt={item.title_en || item.title_ko || item.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={() => {
                          setBrokenImageIds((prev) => new Set(prev).add(item.id));
                        }}
                      />
                    ) : (
                      <Package className="w-8 h-8 text-slate-300" />
                    )}

                    <span className="absolute top-2 left-2 bg-[#0F172A]/80 backdrop-blur-sm text-white text-xs font-extrabold px-2 py-0.5 rounded-md">
                      {item.category || 'Manufacturing'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-slate-500 truncate">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span className="notranslate truncate" translate="no">{formatCompanyName(item)}</span>
                    {item.is_verified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>

                  <h3 className="notranslate text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition min-h-[32px]" translate="no">
                    {formatProductTitle(item)}
                  </h3>

                  <div className="pt-1 border-t border-slate-100 space-y-0.5">
                    {item.price ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-extrabold text-emerald-600">{item.price}</span>
                        <span className="text-xs text-slate-400 font-semibold">/ Unit</span>
                      </div>
                    ) : (
                      <div className="text-sm font-extrabold text-slate-500">Price on Request</div>
                    )}

                    <div className="text-xs text-slate-500 font-medium">
                      MOQ: <span className="font-extrabold text-slate-800">{item.moq || 'Contact Seller'}</span>
                    </div>
                  </div>
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
              <h3 className="font-extrabold text-slate-900">Business-Verified Factory Direct</h3>
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
                Generate standard-format Proforma Invoices (PI) and trade documents in chat.
              </p>
            </div>
          </div>

          <p className="md:col-span-3 text-[11px] text-slate-400 text-center border-t border-slate-100 pt-4">
            <Klick /> connects you with the seller — payment and settlement happen directly between you and your counterparty, outside the platform.
          </p>
        </section>
      </main>

      {/* 로그인 직후 온보딩 플래그가 존재할 때만 딱 1회 노출되는 권유 모달 */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-extrabold text-blue-600 flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <Sparkles className="w-3.5 h-3.5" /> Welcome to <Klick /> B2B Network!
              </span>

              <button
                type="button"
                onClick={handleCloseOnboarding}
                aria-label="Close"
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                {userRole === 'seller'
                  ? 'Would you like to complete your factory profile now?'
                  : 'Would you like to complete your buyer sourcing profile now?'}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {userRole === 'seller'
                  ? 'Add your factory location, key production equipment, and quality certifications (ISO/CE) in detail to receive up to 3x more quote inquiries from global buyers.'
                  : 'Complete your buyer sourcing profile to receive direct wholesale factory quotes.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseOnboarding}
                className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Skip for Now (Explore First)
              </button>

              <button
                type="button"
                onClick={handleGoToProfileEdit}
                className="py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Complete Profile Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}