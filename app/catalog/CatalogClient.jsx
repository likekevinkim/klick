// app/catalog/CatalogClient.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Klick from '@/components/Klick';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Package,
  ShieldCheck,
  Search,
  Loader2,
  Globe
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FILTER_CATEGORIES } from '@/lib/categories';

// Google Translate turns "All" into stiff literal Korean ("모두") — show the
// more natural phrasing directly instead when Korean is selected.
const CATEGORY_LABEL_KO = { All: '전체' };

export default function CatalogClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = FILTER_CATEGORIES;

  useEffect(() => {
    setMounted(true);
    setCurrentLang(localStorage.getItem('klick_lang_code') || 'en');
    fetchAllProducts();
  }, []);

  // 특정 셀러가 아닌, DB에 등록된 모든 셀러의 전체 제품을 한 번에 조회
  const fetchAllProducts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // is_verified는 companies 테이블에만 있으므로 실제 인증된 셀러의 user_id만 별도 조회해
      // "Verified" 표시가 진짜 인증 여부와 무관하게 항상 뜨지 않도록 함
      const { data: verifiedCompanies } = await supabase
        .from('companies')
        .select('user_id')
        .eq('is_verified', true);
      const verifiedSellerIds = new Set((verifiedCompanies || []).map((c) => c.user_id));

      const formatted = (data || []).map((item) => {
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

        return { ...item, image_url: mainImg, is_verified: verifiedSellerIds.has(item.user_id) };
      });

      setProducts(formatted);
    } catch (err) {
      console.error('Failed to load product catalog:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      (item.title_en || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.title_ko || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      {/* 상단 히어로 배너 */}
      <section className="bg-[#0F172A] text-white relative overflow-hidden border-b border-slate-800 py-14 px-6">
        <div className="max-w-7xl mx-auto space-y-6 relative z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-extrabold border border-blue-500/20">
            <Globe className="w-4 h-4" />
            <span>Full Product Catalog from All Verified Sellers</span>
          </div>

          <div className="space-y-2 max-w-3xl">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-snug">
              Browse Every Product Listed by <span className="text-blue-400">Korean Manufacturers</span>
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
              One place to see all products uploaded across every seller on <Klick /> — search, filter by category, and open any listing.
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
                placeholder="Search product name, category, or company..."
                className="w-full bg-transparent text-white placeholder-slate-400 text-xs md:text-sm focus:outline-none"
              />
            </div>
            <button
              type="button"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition flex-shrink-0"
            >
              <span className="notranslate" translate="no">{currentLang === 'ko' ? '찾기' : 'Search'}</span>
            </button>
          </div>

          {/* 카테고리 필터 버튼 */}
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

      {/* 전체 제품 그리드 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-extrabold text-slate-900">
              All Products
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Click any product to view full specs and contact the seller.</span>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading product catalog from database...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3 p-6 shadow-sm">
            <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-sm font-bold text-slate-800">No Products Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {searchQuery || selectedCategory !== 'All'
                ? 'There are no products matching your search criteria.'
                : 'There are currently no products registered in the database.'}
            </p>
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
                    <span className="truncate">{item.company_name || 'Korean Manufacturer'}</span>
                    {item.is_verified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>

                  <h3 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition min-h-[32px]">
                    {item.title_en || item.title_ko || item.product_name || 'B2B Export Product'}
                  </h3>

                  <div className="pt-1 border-t border-slate-100 space-y-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-extrabold text-emerald-600">{item.price || '$0.00'}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">/ Unit</span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-medium">
                      MOQ: <span className="font-extrabold text-slate-800">{item.moq || '1 Unit'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
