// app/buyers/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Building2, 
  Globe, 
  MapPin, 
  ShoppingBag, 
  ShieldCheck, 
  ExternalLink, 
  ArrowRight, 
  FileText,
  Mail,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function BuyerPublicProfilePage() {
  const params = useParams();
  const buyerId = params.id;

  const [mounted, setMounted] = useState(false);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [buyerRfqs, setBuyerRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchBuyerData();
  }, [buyerId]);

  const fetchBuyerData = async () => {
    try {
      setLoading(true);

      // 1. 바이어 회사 정보 조회
      const { data: profile } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('id', buyerId)
        .single();

      if (profile) {
        setBuyerProfile(profile);
      } else {
        // 목업 바이어 프로필
        setBuyerProfile({
          id: buyerId,
          company_name: 'Global Sourcing LLC (US Import Agent)',
          country: 'United States',
          business_type: 'Wholesaler / Distributor',
          website_url: 'https://globalsourcingllc.com',
          description: 'Leading North American importer and wholesale distributor specializing in Korean high-precision industrial components, hydraulic machinery parts, and beauty products. Operating since 2012 with extensive distribution networks across USA and Canada.',
        });
      }

      // 2. 바이어가 요청한 공개 RFQ 목록 조회
      const { data: rfqs } = await supabase
        .from('public_rfqs')
        .select('*')
        .order('created_at', { ascending: false });

      setBuyerRfqs(rfqs || []);
    } catch (error) {
      console.error('Failed to fetch buyer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 antialiased">
      <Header />

      {/* 상단 히어로 커버 */}
      <section className="bg-slate-900 text-white relative overflow-hidden border-b border-slate-800 pt-12 pb-16 px-6">
        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Global Buyer
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
              <Building2 className="w-3.5 h-3.5" /> {buyerProfile?.business_type || 'Wholesaler / Distributor'}
            </span>
          </div>

          <div className="space-y-3 max-w-4xl">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-snug">
              {buyerProfile?.company_name}
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium">
              Verified Wholesale Importer & Sourcing Partner
            </p>
          </div>

          {/* 바이어 요약 정보 바 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Base Location</span>
                <span className="font-bold">{buyerProfile?.country || 'United States'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Official Website</span>
                <a
                  href={buyerProfile?.website_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Visit Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Active Sourcing Requests</span>
                <span className="font-bold text-emerald-400">{buyerRfqs.length} Open RFQs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 메인 컨텐츠 영역 */}
      <main className="max-w-6xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 바이어 회사 상세 소개 */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Buyer Company Profile & Sourcing Scope
            </h2>
            <p className="text-xs text-slate-500 mt-1">Information provided for Korean manufacturing sellers.</p>
          </div>

          <div className="prose text-slate-600 text-sm leading-relaxed space-y-4">
            <p>{buyerProfile?.description}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-900 block">Target Sourcing Categories:</span>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white text-blue-600 rounded-lg border border-slate-200 font-bold">Industrial Machinery</span>
              <span className="px-3 py-1 bg-white text-blue-600 rounded-lg border border-slate-200 font-bold">K-Beauty & Cosmetics</span>
              <span className="px-3 py-1 bg-white text-blue-600 rounded-lg border border-slate-200 font-bold">Smart IT Components</span>
            </div>
          </div>
        </div>

        {/* 바이어의 활성 RFQ 목록 */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Open RFQs from This Buyer ({buyerRfqs.length})
              </h3>
            </div>

            <div className="space-y-3">
              {buyerRfqs.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400">No active RFQs requested by this buyer.</p>
                </div>
              ) : (
                buyerRfqs.map((rfq) => (
                  <div
                    key={rfq.id}
                    className="p-4 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-2 group shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {rfq.category}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Open Quote
                      </span>
                    </div>

                    <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition">
                      {rfq.title}
                    </h4>

                    <p className="text-[11px] text-slate-500">
                      Target Price: <span className="font-bold text-slate-800">${rfq.target_price}</span> | MOQ: <span className="font-bold text-slate-800">{rfq.target_moq}</span>
                    </p>

                    <Link
                      href={`/rfq/${rfq.id}`}
                      className="w-full py-2 bg-slate-900 hover:bg-blue-600 text-white text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer mt-2"
                    >
                      <span>Submit Seller Proposal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}