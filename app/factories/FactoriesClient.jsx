// app/factories/FactoriesClient.jsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Klick from '@/components/Klick';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2,
  MapPin,
  Award,
  ArrowRight,
  Search, 
  ShieldCheck, 
  Loader2, 
  Factory 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FILTER_CATEGORIES } from '@/lib/categories';

export default function FactoriesClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading <Klick /> Company Directory...</span>
          </div>
        </div>
      }
    >
      <FactoriesDirectoryContent />
    </Suspense>
  );
}

function FactoriesDirectoryContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = FILTER_CATEGORIES;

  useEffect(() => {
    setMounted(true);
    fetchRealCompaniesFromDb();
  }, []);

  // Supabase DB에서 실제 저장된 셀러 회사 레코드만 스캔
  const fetchRealCompaniesFromDb = async () => {
    try {
      setLoading(true);

      // 1. DB의 companies 테이블 전체 레코드 조회
      const { data: dbCompanies, error: compError } = await supabase
        .from('companies')
        .select('*')
        .order('updated_at', { ascending: false });

      if (compError) throw compError;

      // 2. 순수 DB 데이터 기반 매핑
      const mappedList = (dbCompanies || []).map((fac) => {
        // 셀러의 고유 식별자 (user_id 또는 테이블 PK id)
        const sellerTargetId = fac.user_id || fac.id;

        // 인증서 문자열 변환
        let certDisplay = '';
        if (fac.certifications && Array.isArray(fac.certifications) && fac.certifications.length > 0) {
          certDisplay = fac.certifications.join(', ');
        } else if (typeof fac.certifications === 'string') {
          certDisplay = fac.certifications;
        }

        // 대표 이미지: 셀러가 프로필 편집에서 고른 대표 사진은 banner_url에 저장됨
        // (cover_image 컬럼은 어느 화면에서도 채워지지 않는 죽은 컬럼) — 없으면 갤러리 첫 장으로 대체
        let coverImg = fac.banner_url || fac.cover_image || '';
        if (!coverImg && fac.gallery_images) {
          if (Array.isArray(fac.gallery_images) && fac.gallery_images.length > 0) {
            coverImg = fac.gallery_images[0];
          } else if (typeof fac.gallery_images === 'string') {
            try {
              const parsed = JSON.parse(fac.gallery_images);
              if (Array.isArray(parsed) && parsed.length > 0) coverImg = parsed[0];
            } catch (e) {
              coverImg = fac.gallery_images;
            }
          }
        }

        return {
          id: fac.id,
          target_id: sellerTargetId, // 쇼룸 URL 파라미터로 연결될 고유 셀러 ID
          company_name_en: fac.company_name_en || fac.company_name || 'Registered Korean Company',
          company_name_ko: fac.company_name_ko || '',
          category: fac.category || 'General Manufacturing',
          location: fac.location || 'South Korea',
          certifications: certDisplay,
          tagline: fac.tagline || fac.description || '',
          cover_image: coverImg,
          established_year: fac.established_year || (fac.created_at ? new Date(fac.created_at).getFullYear().toString() : ''),
          is_verified: !!fac.is_verified
        };
      });

      setFactories(mappedList);
    } catch (err) {
      console.error('Failed to load companies from DB:', err);
      setFactories([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFactories = factories.filter((fac) => {
    const matchesCategory = selectedCategory === 'All' || fac.category === selectedCategory;
    const matchesSearch = 
      (fac.company_name_en || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fac.company_name_ko || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fac.tagline || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fac.location || '').toLowerCase().includes(searchQuery.toLowerCase());

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
                placeholder="Search company name, location, or category..."
                className="w-full bg-transparent text-white placeholder-slate-400 text-xs md:text-sm focus:outline-none"
              />
            </div>

            <button
              type="button"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition flex-shrink-0"
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

      {/* 회사 쇼룸 목록 그리드 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-extrabold text-slate-900">
              Active Company Showrooms
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Click any card to inspect the exact company showroom.</span>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading verified company directory from database...</p>
          </div>
        ) : filteredFactories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-4 p-6 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Building2 className="w-8 h-8 stroke-1" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Registered Companies Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {searchQuery || selectedCategory !== 'All'
                ? 'There are no manufacturers matching your search criteria.'
                : 'There are currently no company showrooms in the database.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFactories.map((fac) => (
              <div
                key={fac.id}
                onClick={() => router.push(`/companies/${fac.target_id}`)} // 클릭한 회사의 고유 target_id 파라미터 전달
                className="bg-white rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer p-6 space-y-4"
              >
                <div className="space-y-4">
                  {/* 회사 대표 커버 사진 */}
                  <div className="w-full h-44 bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-100 flex items-center justify-center">
                    {fac.cover_image ? (
                      <img
                        src={fac.cover_image}
                        alt={fac.company_name_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Building2 className="w-12 h-12 text-slate-300 stroke-1" />
                    )}

                    {fac.is_verified && (
                      <span className="absolute top-3 left-3 bg-[#0F172A]/80 backdrop-blur-md text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Company
                      </span>
                    )}

                  </div>

                  {/* 회사 헤더 정보 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                        {fac.category}
                      </span>
                      {fac.established_year && (
                        <span className="text-[10px] text-slate-400 font-bold">Est. {fac.established_year}</span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-2 line-clamp-1">
                      <Building2 className="w-4.5 h-4.5 text-blue-600 flex-shrink-0" />
                      {fac.company_name_en}
                    </h3>

                    {fac.company_name_ko && (
                      <p className="text-[11px] text-slate-400 font-bold pl-6">
                        {fac.company_name_ko}
                      </p>
                    )}

                    {fac.tagline && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium pt-0.5">
                        {fac.tagline}
                      </p>
                    )}
                  </div>

                  {/* 위치 및 인증 정보 */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    {fac.location && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400 font-bold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" /> Location:
                        </span>
                        <span className="font-bold text-slate-800 truncate max-w-[160px]">{fac.location}</span>
                      </div>
                    )}

                    {fac.certifications && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400 font-bold flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" /> Certs:
                        </span>
                        <span className="font-extrabold text-blue-600 line-clamp-1 text-right max-w-[160px]">
                          {fac.certifications}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 쇼룸 진입 버튼 */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-blue-600 group-hover:underline">
                  <span>Inspect Company Showroom</span>
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