// app/companies/[id]/page.jsx
'use client';

import { useEffect, useState, use } from 'react';
import Header from '@/components/Header';
import { Building2, MapPin, Calendar, Users, Award, ShieldCheck, Mail, Phone, ExternalLink, ArrowRight, CheckCircle2, Package } from 'lucide-react';
import Link from 'next/link';

export default function CompanyShowroomPage({ params }) {
  const unwrappedParams = use(params);
  const companyId = unwrappedParams.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompanyShowroom() {
      try {
        setLoading(true);
        const response = await fetch(`/api/companies/${companyId}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch company showroom:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCompanyShowroom();
  }, [companyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-semibold text-sm">Loading Verified Factory Showroom...</p>
      </div>
    );
  }

  const company = data?.company;
  const products = data?.products || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      {/* 1. 회사 배너 & 프로필 상단 헤더 */}
      <section className="bg-slate-900 text-white py-12 px-6 border-b border-slate-800">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Korean Factory Showroom
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-800/80 p-8 rounded-3xl border border-slate-700/60 backdrop-blur-sm">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-extrabold text-white text-2xl shadow-lg">
                  {company?.company_name?.[0] || 'F'}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
                    {company?.company_name}
                  </h1>
                  <p className="text-xs text-blue-400 font-semibold mt-0.5">{company?.business_type}</p>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed pt-2">
                {company?.description}
              </p>

              {/* 공장 스펙 요약 배지 */}
              <div className="flex flex-wrap gap-4 pt-3 text-xs text-slate-400 font-medium border-t border-slate-700/60">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span>{company?.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Est. {company?.established_year}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>{company?.employees_count}</span>
                </div>
              </div>
            </div>

            {/* 바이어 컨택 버튼 */}
            <div className="flex flex-col gap-3 min-w-[200px]">
              <Link
                href="/products"
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition text-center"
              >
                Inquire Factory Direct
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 제조 공장 주요 인증 및 스펙 정보 */}
      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-12">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Quality Assurance & Certifications
          </h2>
          <div className="flex flex-wrap gap-3">
            {company?.certifications?.map((cert, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {cert}
              </span>
            ))}
          </div>
        </div>

        {/* 3. 제조사가 보유한 전체 수출 상품 라인업 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Showroom Catalog</span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Export Products ({products.length})</h2>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1 mb-2" />
              <p className="text-slate-500 font-semibold text-sm">No products listed in this factory showroom yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-full h-48 bg-slate-100 border-b border-slate-100 flex items-center justify-center relative">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title_en}
                          className="w-full h-full object-contain bg-white group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="text-slate-400 text-xs font-medium">No Image</div>
                      )}
                      <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                        {item.category}
                      </span>
                    </div>

                    <div className="p-6 space-y-2">
                      <h3 className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug">
                        {item.title_en}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{item.tagline}</p>
                      <div className="pt-2 text-xs">
                        <span className="text-slate-400">Price: </span>
                        <span className="font-extrabold text-blue-600">${item.price} USD</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-100 mt-2">
                    <Link
                      href={`/products/${item.id}`}
                      className="w-full py-2.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}