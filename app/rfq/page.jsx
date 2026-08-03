// app/rfq/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { 
  FileText, 
  Globe, 
  Search, 
  ArrowRight, 
  Clock, 
  DollarSign, 
  Building2, 
  Send, 
  PlusCircle, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PublicRfqMarketplacePage() {
  const [mounted, setMounted] = useState(false);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

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
    fetchPublicRfqs();
  }, []);

  const fetchPublicRfqs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('public_rfqs')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setRfqs(data);
      } else {
        // 기본 목업 공개 RFQ 데이터 세팅
        setRfqs([
          {
            id: 1,
            buyer_company_name: 'Global Sourcing LLC',
            buyer_country: 'United States',
            title: 'Hydraulic Flow Control Valves (1,000 Units Monthly Batch)',
            category: 'Industrial Machinery',
            target_price: '140 - 160 USD',
            target_moq: '1,000 Units',
            delivery_destination: 'Los Angeles Port, USA',
            deadline_date: '2026-10-15',
            description: 'We are seeking verified Korean manufacturers for high-durability hydraulic valves. Must be ISO 9001 certified. Long-term OEM supply agreement.',
            created_at: '2 hours ago',
          },
          {
            id: 2,
            buyer_company_name: 'Euro Cosmetics Import GmbH',
            buyer_country: 'Germany',
            title: 'Organic Korean Anti-Aging Repair Serum 50ml (Private Label)',
            category: 'K-Beauty & Cosmetics',
            target_price: '5.00 - 8.00 USD',
            target_moq: '3,000 Units',
            delivery_destination: 'Hamburg Port, Germany',
            deadline_date: '2026-11-01',
            description: 'Looking for a Korean CPK/CPNP certified cosmetic lab for OEM private labeling. CPNP registration documents required.',
            created_at: '5 hours ago',
          },
          {
            id: 3,
            buyer_company_name: 'Tokyo Trading Corp',
            buyer_country: 'Japan',
            title: 'Smart Precision Industrial Micro Sensors & PCB Modules',
            category: 'Electronics & Smart IT',
            target_price: '25.00 USD',
            target_moq: '500 Units',
            delivery_destination: 'Tokyo, Japan',
            deadline_date: '2026-09-30',
            description: 'Direct factory quotes required for precision PCB modules used in industrial automation. Japanese specification sheet provided.',
            created_at: '1 day ago',
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch public RFQs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const filteredRfqs = rfqs.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.buyer_company_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      {/* 히어로 배너 */}
      <section className="bg-slate-900 text-white relative overflow-hidden py-14 px-6 border-b border-slate-800">
        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Public RFQ Marketplace
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
              <Globe className="w-3.5 h-3.5" /> Global Buyer Sourcing Demands
            </span>
          </div>

          <div className="space-y-3 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Global Buyer <span className="text-blue-400">RFQ Marketplace</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Explore active purchasing demands posted by verified global buyers. Korean manufacturers can submit direct wholesale proposals and win export deals.
            </p>
          </div>

          {/* 검색 바 */}
          <div className="bg-white p-2 rounded-2xl shadow-xl max-w-3xl flex items-center gap-2 border border-slate-200 text-slate-900">
            <Search className="w-5 h-5 text-slate-400 ml-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search RFQ demand titles, products, or buyer countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-slate-900 text-sm focus:outline-none placeholder:text-slate-400 py-2"
            />
          </div>
        </div>
      </section>

      {/* 카테고리 태그 바 */}
      <section className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* RFQ 목록 마켓플레이스 */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Active Purchasing Demands ({filteredRfqs.length})</h2>
            <p className="text-xs text-slate-500 mt-0.5">Submit your manufacturing quotation directly to the buyer.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <p className="text-slate-500 font-semibold text-sm">Loading Global Public RFQs...</p>
          </div>
        ) : filteredRfqs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-slate-800">No Matching RFQs Found</h3>
            <p className="text-xs text-slate-500">Try selecting a different category or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRfqs.map((rfq) => (
              <div
                key={rfq.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition p-6 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                      {rfq.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {rfq.created_at}
                    </span>
                  </div>

                  {/* 바이어 정보 연동 (바이어 프로필 이동 링크) */}
                  <Link
                    href={`/buyers/${rfq.id}`}
                    className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    <span className="truncate">{rfq.buyer_company_name} ({rfq.buyer_country})</span>
                    <Globe className="w-3 h-3 text-slate-400 ml-auto" />
                  </Link>

                  <h3 className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                    {rfq.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {rfq.description}
                  </p>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Target Price</span>
                      <span className="font-extrabold text-blue-600">${rfq.target_price}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Target MOQ</span>
                      <span className="font-bold text-slate-800">{rfq.target_moq}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Deadline: {rfq.deadline_date}
                  </span>

                  <Link
                    href={`/rfq/${rfq.id}`}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Submit Quote</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}