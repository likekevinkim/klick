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
  Factory, 
  Send,
  Loader2,
  MessageSquare,
  Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // 실시간 읽음 상태 동기화 안읽은 채팅 수 상태
  const [unreadCount, setUnreadCount] = useState(0);

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

    const handleUnreadUpdate = () => {
      updateUnreadCount();
    };
    window.addEventListener('klick_unread_chat_updated', handleUnreadUpdate);

    return () => {
      window.removeEventListener('klick_unread_chat_updated', handleUnreadUpdate);
    };
  }, []);

  const updateUnreadCount = () => {
    const savedCount = localStorage.getItem('klick_unread_chat_count');
    if (savedCount !== null) {
      setUnreadCount(parseInt(savedCount, 10));
    } else {
      setUnreadCount(0);
    }
  };

  // ★ Supabase DB에서 가짜 데이터 없이 오직 실제 등록된 상품만 조회
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
        setProducts(data);
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

  // 카테고리 및 검색어 필터링
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 antialiased">
      <Header />

      {/* 1. 히어로 비주얼 대형 섹션 */}
      <section className="bg-slate-900 text-white relative overflow-hidden border-b border-slate-800 py-12 md:py-16 px-6">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-6 relative z-10 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-extrabold border border-blue-500/20">
              <Globe className="w-4 h-4" />
              <span>Direct B2B Gateway to South Korean Manufacturers</span>
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
              <span className="text-blue-500">Verified Korean Factories</span>
            </h1>

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
              Zero middleman markup. Connect with verified South Korean manufacturers with AI-translated English specifications, instant RFQs, and official B2B trade documents.
            </p>
          </div>

          {/* 검색 바 */}
          <div className="max-w-2xl bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 flex items-center gap-2 shadow-2xl">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Korean products, factories, or specifications..."
                className="w-full bg-transparent text-white placeholder-slate-400 text-xs focus:outline-none"
              />
            </div>

            <button
              type="button"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer flex-shrink-0"
            >
              <span>Search</span>
            </button>
          </div>

          {/* 주요 카테고리 태그 바 */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
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

      {/* 2. 실제 DB 연동 카탈로그 그리드 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-blue-50 text-blue-600 rounded-md">
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

        {/* 알리바바 규격 4열 컴팩트 그리드 카드 */}
        {loadingProducts ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading catalog items from database...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3 p-6">
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
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition duration-200 overflow-hidden flex flex-col justify-between group p-3 space-y-3 cursor-pointer"
              >
                <div className="space-y-2.5">
                  {/* 이미지 박스 */}
                  <div className="w-full aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-100 relative flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title_en || item.title_ko}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-slate-300" />
                    )}

                    <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                  </div>

                  {/* 제조 회사명 */}
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 truncate">
                    <Building2 className="w-3 h-3 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{item.company_name || 'Verified Factory'}</span>
                  </div>

                  {/* 제목 */}
                  <h3 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition min-h-[32px]">
                    {item.title_en || item.title_ko}
                  </h3>

                  {/* 단가 & MOQ 표기 */}
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

                {/* 하단 검증 태그 */}
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

        {/* 3. B2B 신뢰성 요약 바 */}
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
    </div>
  );
}