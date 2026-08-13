// app/factories/page.jsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Award, 
  Package, 
  ArrowRight, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  Loader2, 
  Factory 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// 대표 커버 이미지가 없을 경우 카테고리별 기본 이미지 매핑
const DEFAULT_CATEGORY_IMAGES = {
  'Industrial Machinery': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60',
  'K-Beauty & Cosmetics': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=60',
  'K-Food & Beverages': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=60',
  'Electronics & Smart IT': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
  'General Manufacturing': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60',
  'etc': 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=60'
};

function FactoriesDirectoryContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Industrial Machinery',
    'K-Beauty & Cosmetics',
    'K-Food & Beverages',
    'Electronics & Smart IT',
    'General Manufacturing',
    'etc'
  ];

  useEffect(() => {
    setMounted(true);
    fetchFactoriesWithProducts();
  }, []);

  const fetchFactoriesWithProducts = async () => {
    try {
      setLoading(true);

      // 1. Supabase DB에서 실제 등록된 회사(셀러) 전체 데이터 조회
      const { data: dbCompanies, error: compError } = await supabase
        .from('companies')
        .select('*')
        .order('updated_at', { ascending: false });

      if (compError) throw compError;

      // 2. 등록된 라이브 상품 수 조회를 위해 전체 상품 데이터 가져오기
      const { data: dbProducts } = await supabase.from('products').select('company_id, user_id');

      // 3. UI 렌더링 카드 매핑
      const mappedFactories = (dbCompanies || []).map(fac => {
        const facProducts = (dbProducts || []).filter(
          p => p.company_id === fac.user_id || p.company_id === fac.id || p.user_id === fac.user_id
        );

        const categoryKey = fac.category || 'Industrial Machinery';
        const fallbackImg = DEFAULT_CATEGORY_IMAGES[categoryKey] || DEFAULT_CATEGORY_IMAGES['Industrial Machinery'];

        let certText = 'No official certifications registered yet.';
        if (fac.certifications) {
          if (Array.isArray(fac.certifications) && fac.certifications.length > 0) {
            certText = fac.certifications.join(', ');
          } else if (typeof fac.certifications === 'string' && fac.certifications.trim() !== '') {
            certText = fac.certifications;
          }
        }

        return {
          id: fac.id, // DB 고유 PK
          user_id: fac.user_id || fac.id, // 라우팅 및 셀러 구분을 위한 고유 User UUID
          company_name: fac.company_name_en || fac.company_name || fac.company_name_ko || 'Verified Korean Manufacturer',
          company_name_ko: fac.company_name_ko || '',
          category: categoryKey,
          location: fac.location || 'South Korea 🇰🇷',
          certifications: certText,
          description: fac.tagline || fac.description || 'Verified manufacturer registered on KLICK B2B Network.',
          cover_image: fac.cover_image && fac.cover_image.trim() !== '' ? fac.cover_image : fallbackImg,
          established: fac.established_year || fac.established || (fac.created_at ? new Date(fac.created_at).getFullYear().toString() : '2024'),
          product_count: facProducts.length,
          verified: true
        };
      });

      setFactories(mappedFactories);
    } catch (err) {
      console.error('Failed to load factory directory from Supabase:', err);
      setFactories([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFactories = factories.filter((fac) => {
    const matchesCategory = selectedCategory === 'All' || fac.category === selectedCategory;
    const matchesSearch = 
      (fac.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fac.company_name_ko || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fac.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fac.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      {/* 상단 탐색 히어로 배너 */}
      <section className="bg-[#0F172A] text-white relative overflow-hidden border-b border-slate-800 py-14 px-6">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-6 relative z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-extrabold border border-blue-500/20">
            <Factory className="w-4 h-4" />
            <span>Verified South Korean Company Showroom Directory</span>
          </div>

          <div className="space-y-2 max-w-3xl">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-snug">
              Connect Directly with <span className="text-blue-400">Verified Korean Companies</span>
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
              Explore authentic company profiles, inspect production facilities, and access direct wholesale product catalogs without middleman markup.
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
                placeholder="Search company name, location, or certifications..."
                className="w-full bg-transparent text-white placeholder-slate-400 text-xs md:text-sm focus:outline-none"
              />
            </div>

            <button
              type="button"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition cursor-pointer flex-shrink-0"
            >
              Search
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
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 공장 쇼룸 카드 목록 구역 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-extrabold text-slate-900">
              Active Company Showrooms ({filteredFactories.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Click any company card to view live product catalogs.</span>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading verified manufacturing directory...</p>
          </div>
        ) : filteredFactories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-4 p-6 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Building2 className="w-8 h-8 stroke-1" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Companies Registered Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {searchQuery || selectedCategory !== 'All'
                ? 'There are no manufacturers matching your search criteria. Try adjusting your filters.'
                : 'There are currently no company showrooms registered in the database. Register your company now!'}
            </p>
            {!searchQuery && selectedCategory === 'All' && (
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow transition"
                >
                  <span>Register Company Showroom</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFactories.map((fac) => (
              <div
                key={fac.id}
                onClick={() => router.push(`/companies/${fac.user_id}`)} // ★ [핵심 교정] user_id로 직통 매핑 이동
                className="bg-white rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer p-6 space-y-4"
              >
                <div className="space-y-4">
                  {/* 공장 커버 사진 */}
                  <div className="w-full h-44 bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-100 flex items-center justify-center">
                    <img
                      src={fac.cover_image}
                      alt={fac.company_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        const fallbackKey = fac.category || 'Industrial Machinery';
                        e.currentTarget.src = DEFAULT_CATEGORY_IMAGES[fallbackKey] || DEFAULT_CATEGORY_IMAGES['Industrial Machinery'];
                      }}
                    />

                    <span className="absolute top-3 left-3 bg-[#0F172A]/80 backdrop-blur-md text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Company
                    </span>

                    <span className="absolute bottom-3 right-3 bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                      <Package className="w-3 h-3" /> {fac.product_count} Live Products
                    </span>
                  </div>

                  {/* 공장 헤더 정보 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                        {fac.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">Est. {fac.established}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-2 line-clamp-1">
                      <Building2 className="w-4.5 h-4.5 text-blue-600 flex-shrink-0" />
                      {fac.company_name}
                    </h3>

                    {fac.company_name_ko && (
                      <p className="text-[11px] text-slate-400 font-bold pl-6">
                        {fac.company_name_ko}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                      {fac.description}
                    </p>
                  </div>

                  {/* 위치 및 인증 정보 */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" /> Location:
                      </span>
                      <span className="font-bold text-slate-800">{fac.location}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" /> Certs:
                      </span>
                      <span className="font-extrabold text-blue-600 line-clamp-1 text-right max-w-[150px]">
                        {fac.certifications}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 쇼룸 진입 버튼 */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-blue-600 group-hover:underline">
                  <span>Enter Company Showroom & Catalog</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function FactoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading KLICK Company Showroom Directory...</span>
          </div>
        </div>
      }
    >
      <FactoriesDirectoryContent />
    </Suspense>
  );
}