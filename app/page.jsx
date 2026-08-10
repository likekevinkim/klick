// app/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { 
  Building2, 
  Globe, 
  ArrowRight, 
  ShieldCheck, 
  Package, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  TrendingUp, 
  Layers, 
  Factory, 
  Send,
  Loader2,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
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
    fetchFeaturedProducts();
    updateUnreadCount();

    // ★ localStorage 및 커스텀 이벤트 기반 실시간 안읽은 뱃지 연동 리스너
    const handleUnreadUpdate = () => {
      updateUnreadCount();
    };
    window.addEventListener('klick_unread_chat_updated', handleUnreadUpdate);

    return () => {
      window.removeEventListener('klick_unread_chat_updated', handleUnreadUpdate);
    };
  }, []);

  // ★ localStorage 읽음 상태 동기화 로직 (채팅창 방문 시 0으로 동기화)
  const updateUnreadCount = () => {
    const savedCount = localStorage.getItem('klick_unread_chat_count');
    if (savedCount !== null) {
      setUnreadCount(parseInt(savedCount, 10));
    } else {
      setUnreadCount(0); // 기본값 0 설정으로 고정 무한 뱃지 방지
    }
  };

  // Supabase DB에서 실제 셀러가 업로드한 최신 상품 목록 조회
  const fetchFeaturedProducts = async () => {
    try {
      setLoadingProducts(true);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setProducts(data);
      } else {
        // DB 데이터가 없을 경우 가동되는 기본 대표 K-제조업 상품 리스트
        setProducts([
          {
            id: '1',
            title_en: 'High-Precision Hydraulic Control Valve HV-300',
            category: 'Industrial Machinery',
            company_name: 'Hankook Precision Co., Ltd.',
            price: '145.00',
            moq: '500 Units',
            tagline: 'ISO 9001 certified heavy-duty industrial valve engineered with Korean precision technology.',
            image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          },
          {
            id: '2',
            title_en: 'Heavy-Duty Hydraulic Actuator Cylinder AC-500',
            category: 'Industrial Machinery',
            company_name: 'Hankook Precision Co., Ltd.',
            price: '320.00',
            moq: '100 Units',
            tagline: 'Heavy industrial grade actuator built for zero-leakage durability in extreme conditions.',
            image_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
          },
          {
            id: '3',
            title_en: 'Organic K-Beauty Repair Serum 50ml (Private Labeling)',
            category: 'K-Beauty & Cosmetics',
            company_name: 'Corea Bio Cosmetics Inc.',
            price: '12.50',
            moq: '1,000 Units',
            tagline: 'Premium Korean skincare repair serum with vegan certification and custom OEM packaging.',
            image_url: 'https://images.unsplash.com/photo-1608248597263-00079e9614f2?auto=format&fit=crop&w=800&q=80',
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load featured products for homepage:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // 카테고리 및 검색어 필터링
  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = (item.title_en || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 antialiased">
      <Header />

      {/* 1. 히어로 비주얼 대형 섹션 */}
      <section className="bg-slate-900 text-white relative overflow-hidden border-b border-slate-800 py-16 md:py-24 px-6">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-extrabold border border-blue-500/20">
              <Globe className="w-4 h-4" />
              <span>Direct B2B Gateway to South Korean Manufacturers</span>
            </div>

            {/* ★ 실시간 안읽은 채팅 메시지 뱃지 (0개보다 많을 때만 노출) */}
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

          <div className="space-y-4 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-snug">
              Source High-Quality Products Directly From <br className="hidden md:block" />
              <span className="text-blue-500">Verified Korean Factories</span>
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium">
              Zero middleman markup. AI automatically generates buyer-customized English detail pages for Korean manufacturers. Connect with verified factories and trade globally.
            </p>
          </div>

          {/* 검색 바 */}
          <div className="max-w-2xl bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 flex items-center gap-2 shadow-2xl">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Korean products, factories, or categories..."
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

          {/* 주요 카테고리 태그 */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
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

      {/* 2. 셀러가 업로드한 실제 상품이 보이고 노출되는 Featured Products */}
      <main className="max-w-6xl mx-auto px-6 mt-12 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                Featured Factory Products
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-500">
              Live products uploaded by verified South Korean manufacturers ready for global export.
            </p>
          </div>

          <Link
            href="/products"
            className="text-xs font-extrabold text-blue-600 hover:underline flex items-center gap-1 self-start md:self-auto"
          >
            <span>View All Products ({products.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 상품 카드 목록 그리드 */}
        {loadingProducts ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading live factory products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-slate-800">No Products Found</h3>
            <p className="text-xs text-slate-500">There are no products matching your search or category selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition duration-300 overflow-hidden flex flex-col justify-between group"
              >
                <div className="p-6 space-y-4">
                  {/* 대표 이미지 */}
                  <div className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-slate-300" />
                    )}

                    <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                      {item.category}
                    </span>
                  </div>

                  {/* 상품 주요 스펙 및 타이틀 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span className="truncate">{item.company_name || 'Korean Manufacturer'}</span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                      {item.title_en}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.tagline || item.description_en}
                    </p>
                  </div>

                  {/* 가격 및 MOQ 박스 */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">FOB Unit Price</span>
                      <span className="font-extrabold text-emerald-600">${item.price} USD</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">Min Order</span>
                      <span className="font-bold text-slate-800">{item.moq}</span>
                    </div>
                  </div>
                </div>

                {/* 하단 상세페이지 바로가기 버튼 */}
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <Link
                    href={`/products/${item.id}`}
                    className="w-full py-3 bg-white hover:bg-blue-600 hover:text-white text-blue-600 font-extrabold text-xs rounded-xl border border-blue-200 transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>View Specifications & Direct RFQ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. 플랫폼 신뢰성 배너 */}
        <section className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">Verified Factory Registration</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                All Korean sellers pass business license verification and manufacturing facility checks.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">AI Copywriting & Translation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                AI translates Korean specifications into clear English copywriting tailored for global buyers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 flex-shrink-0">
              <Send className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">Direct Factory Quotation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Buyers communicate directly with Korean factories and issue official Proforma Invoices (PI).
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}