// app/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { 
  Search, 
  Globe, 
  ShieldCheck, 
  Send, 
  ArrowRight, 
  Building2, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  Package, 
  ChevronRight,
  TrendingUp,
  Award,
  PlusCircle,
  ChevronDown
} from 'lucide-react';

export default function GlobalMarketplaceHomePage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'All', name: 'All Categories', icon: Globe },
    { id: '기계/부품', name: 'Industrial Machinery', icon: Cpu },
    { id: '화장품/뷰티', name: 'K-Beauty & Cosmetics', icon: Sparkles },
    { id: '식품/음료', name: 'K-Food & Beverages', icon: Package },
    { id: '전자/IT', name: 'Electronics & Smart IT', icon: TrendingUp },
    { id: '기타', name: 'General Manufacturing', icon: Building2 },
  ];

  useEffect(() => {
    setMounted(true);
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setRecentProducts(data.slice(0, 6));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const currentCategoryName = categories.find((c) => c.id === selectedCategory)?.name || 'All Categories';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      {/* 1. 히어로 메인 비주얼 */}
      <section className="bg-slate-900 text-white relative overflow-hidden py-16 md:py-24 px-6 border-b border-slate-800">
        <div className="max-w-6xl mx-auto relative z-10 space-y-8 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold border border-blue-500/30">
              <Globe className="w-3.5 h-3.5" /> Verified Korean Factory Platform
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct Factory Trade
            </span>
          </div>

          <div className="space-y-4 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Connect Directly with <br className="hidden md:inline" />
              <span className="text-blue-400">Top Korean Manufacturers</span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed">
              Source high-quality industrial components, K-beauty, and manufactured goods directly from verified factories with AI-powered multilingual support.
            </p>
          </div>

          {/* B2B 검색 바 */}
          <div className="bg-white p-2 md:p-3 rounded-2xl shadow-xl max-w-4xl flex flex-col md:flex-row items-center gap-2 border border-slate-200 text-slate-900 relative z-30">
            {/* 커스텀 카테고리 선택 드롭다운 */}
            <div className="relative w-full md:w-auto border-b md:border-b-0 md:border-r border-slate-200 px-3 py-2">
              <button
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="flex items-center justify-between gap-2 w-full md:w-52 text-left font-bold text-slate-700 text-sm py-1 cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{currentCategoryName}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </button>

              {isCategoryOpen && (
                <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fadeIn">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setIsCategoryOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold transition flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                        selectedCategory === cat.id ? 'text-blue-600 bg-blue-50/60' : 'text-slate-700'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {selectedCategory === cat.id && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 검색어 입력란 */}
            <div className="flex items-center gap-2 px-3 py-2 flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search products, machinery, or factory names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-slate-900 text-sm focus:outline-none placeholder:text-slate-400"
              />
            </div>

            <button className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap">
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 text-xs md:text-sm text-slate-400">
            <span className="font-semibold text-slate-300">Are you a Korean Manufacturer?</span>
            <Link
              href="/products/new"
              className="inline-flex items-center gap-1.5 font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4"
            >
              <PlusCircle className="w-4 h-4" /> AI Free Setup & Product Registration
            </Link>
          </div>
        </div>
      </section>

      {/* 2. 카테고리 패널 */}
      <section className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between h-28 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400 hover:shadow-md'
                }`}
              >
                <IconComponent className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                <div>
                  <span className="block font-bold text-xs md:text-sm line-clamp-1">{cat.name}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>Explore Factory</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. RFQ 게시판 연결 배너 (수정: /rfq 로 연결!) */}
      <section className="max-w-7xl mx-auto px-6 mt-12">
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <Send className="w-3.5 h-3.5" /> One-Stop B2B Sourcing (RFQ Marketplace)
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Need custom factory quotes or open sourcing?
            </h2>
            <p className="text-slate-300 text-sm md:text-base">
              Browse global buyer purchasing demands or post your custom specifications. Korean manufacturers submit wholesale price proposals directly.
            </p>
          </div>

          <Link
            href="/rfq"
            className="w-full md:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-base rounded-2xl shadow-lg transition flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <span>Explore Public RFQ Board</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* 4. 대표 수출 상품 전시장 */}
      <section className="max-w-7xl mx-auto px-6 mt-16 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" /> Verified Suppliers
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
              Featured Factory Products
            </h2>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1 font-bold text-sm text-blue-600 hover:text-blue-700"
          >
            <span>View All Dashboard</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 font-medium">Loading products...</p>
          </div>
        ) : recentProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 space-y-4">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-lg font-bold text-slate-800">No Products Registered Yet</h3>
            <p className="text-slate-500 text-sm">Be the first Korean manufacturer on KLICK.</p>
            <Link
              href="/products/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition"
            >
              <PlusCircle className="w-4 h-4" /> Register Product Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProducts.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="w-full h-52 bg-slate-100 border-b border-slate-100 flex items-center justify-center relative overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title_en}
                        className="w-full h-full object-contain bg-white group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="text-slate-400 text-xs font-medium">No Factory Image</div>
                    )}
                    <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="truncate">{item.company_name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                      {item.title_en}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.tagline}
                    </p>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs mt-3">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Estimated Price</span>
                        <span className="font-extrabold text-blue-600">${item.price} USD</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Minimum Order</span>
                        <span className="font-bold text-slate-700">{item.moq}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 mt-2">
                  <Link
                    href={`/products/${item.id}`}
                    className="w-full py-3 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Inspect Details & Contact</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}