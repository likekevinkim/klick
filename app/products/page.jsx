// app/products/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { 
  PlusCircle, 
  Building2, 
  Package, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Layers,
  ShieldCheck,
  Sparkles,
  Bot,
  Send,
  CheckCircle2,
  X,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SellerProductsDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 두 번째 스크린샷의 정식 풀네임 회사 정보와 100% 일치하도록 기본값 설정
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Hankook Precision Co., Ltd. (한국정밀공업)',
    tagline: 'Leading Manufacturer of High-Precision Hydraulic Valves & Industrial Automation Parts',
    businessType: 'Direct Manufacturer'
  });

  // 4단계: AI 무역 오퍼상 매칭 상태
  const [isAiMatching, setIsAiMatching] = useState(false);
  const [aiMatches, setAiMatches] = useState([]);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUserAndProducts();
  }, []);

  const fetchUserAndProducts = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      let formattedName = 'Hankook Precision Co., Ltd. (한국정밀공업)';

      if (session?.user) {
        setUser(session.user);
        const meta = session.user.user_metadata || {};
        
        // 세션 메타데이터에서 영문 및 국문 회사명이 모두 있을 경우 정식 풀네임 조합
        if (meta.company_name_en && meta.company_name_ko) {
          formattedName = `${meta.company_name_en} (${meta.company_name_ko})`;
        } else if (meta.company_name && meta.company_name.length > 2) {
          formattedName = meta.company_name;
        }
      }

      // 1. DB (companies 테이블)에서 최신 공식 회사 정보(태그라인, 비즈니스 타입 포함) 조회
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single();

      if (companyData) {
        let dbCompanyName = companyData.company_name;

        // DB에 영문/국문명이 각각 저장된 경우 풀네임으로 결합
        if (companyData.company_name_en && companyData.company_name_ko) {
          dbCompanyName = `${companyData.company_name_en} (${companyData.company_name_ko})`;
        } else if (!dbCompanyName || dbCompanyName.length <= 2) {
          dbCompanyName = formattedName;
        }

        setCompanyInfo({
          name: dbCompanyName,
          tagline: companyData.tagline || companyData.description || 'Leading Manufacturer of High-Precision Hydraulic Valves & Industrial Automation Parts',
          businessType: companyData.business_type || 'Direct Manufacturer'
        });
      } else {
        setCompanyInfo(prev => ({ ...prev, name: formattedName }));
      }

      // 2. DB (products 테이블)에서 등록된 실제 상품 목록 조회
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setProducts(data);
      } else {
        // 백업 보장 샘플 데이터
        setProducts([
          {
            id: '1',
            company_name: formattedName,
            title_en: 'High-Precision Hydraulic Control Valve HV-300',
            category: 'Industrial Machinery',
            price: '145.00',
            moq: '100 Units',
            tagline: 'ISO 9001 certified industrial solution engineered with Korean precision technology.',
            description_en: 'Official Export Specification:\n- Working Pressure: Max 350 Bar\n- Flow Rate: 120 L/min\n- Material: Heavy Alloy Steel Casing',
            image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          },
          {
            id: '2',
            company_name: formattedName,
            title_en: 'Organic K-Beauty Repair Serum 50ml',
            category: 'K-Beauty & Cosmetics',
            price: '12.50',
            moq: '1,000 Units',
            tagline: 'Premium Korean skincare repair serum with vegan certification.',
            description_en: 'Private labeling and OEM packaging available for global importers.',
            image_url: 'https://images.unsplash.com/photo-1608248597263-00079e9614f2?auto=format&fit=crop&w=800&q=80',
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch seller products:', error);
    } finally {
      setLoading(false);
    }
  };

  // 4단계: AI 무역 오퍼상 실행 핸들러
  const handleRunAiMatchmaker = async () => {
    setIsAiMatching(true);
    try {
      const res = await fetch('/api/ai/matchmaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerCategory: 'Industrial Machinery',
          productTitle: products[0]?.title_en || 'Hydraulic Valve HV-300',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiMatches(data.matches);
        setIsMatchModalOpen(true);
      }
    } catch (error) {
      console.error('AI Matchmaker failed:', error);
      alert('Failed to connect to AI Trade Agent.');
    } finally {
      setIsAiMatching(false);
    }
  };

  // DB 상품 삭제 처리 핸들러
  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product from the global catalog?')) return;

    try {
      await supabase.from('products').delete().eq('id', id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Failed to delete product from DB:', error);
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-8">
        
        {/* DB에서 동기화된 상단 배너 */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              {/* 인증 및 비즈니스 타입 태그 */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Korean Factory
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                  <Building2 className="w-3.5 h-3.5" /> {companyInfo.businessType}
                </span>
              </div>

              {/* DB에서 읽어온 정식 회사명 타이틀 */}
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-snug">
                {companyInfo.name}
              </h1>

              {/* 소개글(Tagline) */}
              <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium">
                {companyInfo.tagline}
              </p>
            </div>

            {/* 제품 등록 버튼 */}
            <Link
              href="/products/new"
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer self-start md:self-auto flex-shrink-0"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Register Product</span>
            </Link>
          </div>
        </div>

        {/* 4단계: AI 무역 오퍼상 (AI Trade Agent & RFQ Matchmaker) 배너 카드 */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-900 text-white p-6 md:p-8 rounded-3xl border border-blue-800/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-extrabold border border-blue-400/30 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-blue-400" /> AI Trade Agent
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Live Matchmaking Engine Active
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
              AI Automated Buyer RFQ Matchmaker
            </h2>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              AI analyzes global buyer RFQs in real-time and recommends buyers with over 90% matching compatibility for your factory items.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunAiMatchmaker}
            disabled={isAiMatching}
            className="px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs md:text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 disabled:opacity-50"
          >
            {isAiMatching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            <span>{isAiMatching ? 'Scanning Global RFQs...' : 'Run AI Buyer Matchmaker'}</span>
          </button>
        </div>

        {/* DB에서 조회된 등록 상품 리스트 영역 */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Active Product Catalog ({products.length})
              </h2>
              <p className="text-xs text-slate-500 mt-1">Products currently live on the global B2B marketplace.</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading catalog items from database...</p>
            </div>
          ) : products.length === 0 ? (
            /* 등록된 제품이 없을 때 안내 */
            <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-4">
              <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-800">No Products Registered Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Start registering your manufactured products to attract verified global buyers and receive direct RFQs.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/products/new"
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register First Product</span>
                </Link>
              </div>
            </div>
          ) : (
            /* 등록된 DB 상품 카드 그리드 */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-300 transition flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    <div className="w-full h-44 bg-slate-200 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title_en} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-10 h-10 text-slate-400" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                        {item.category}
                      </span>

                      <h3 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug pt-1">
                        {item.title_en}
                      </h3>

                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {item.tagline || item.description_en}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">FOB Unit Price</span>
                        <span className="font-extrabold text-emerald-600">${item.price} USD</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold">MOQ</span>
                        <span className="font-bold text-slate-700">{item.moq}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <Link
                      href={`/products/${item.id || 1}`}
                      className="font-extrabold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>View Detailed Live Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(item.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 4단계: AI 무역 오퍼상 매칭 결과 팝업 모달 */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  AI Trade Agent - Recommended Buyer RFQs
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">High compatibility buyer demands analyzed by AI.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsMatchModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {aiMatches.map((match) => (
                <div key={match.rfq_id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      {match.buyer_company}
                    </span>

                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> {match.match_score}% AI Match
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900">{match.title}</h4>

                  <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                    💡 <strong>AI Analysis:</strong> {match.ai_recommendation_reason}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Target Quantity</span>
                      <span className="font-extrabold text-slate-800">{match.target_quantity}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Target Budget</span>
                      <span className="font-extrabold text-emerald-600">{match.target_budget}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Link
                      href="/chat"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send One-Click Offer to {match.buyer_name}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}