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
  Layers
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SellerProductsDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Hankook Precision Co., Ltd.');

  useEffect(() => {
    setMounted(true);
    fetchUserAndProducts();
  }, []);

  const fetchUserAndProducts = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        const meta = session.user.user_metadata || {};
        if (meta.company_name_en) {
          setCompanyName(meta.company_name_en);
        } else if (meta.company_name) {
          setCompanyName(meta.company_name);
        }
      }

      // 1. 쇼룸(companies) 테이블에서 최신 공식 회사명 조회하여 완벽 동기화
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single();

      if (companyData && companyData.company_name) {
        setCompanyName(companyData.company_name);
      }

      // 2. Supabase에서 등록된 상품 목록 조회
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
            company_name: companyName,
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
            company_name: companyName,
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

  // 상품 삭제 핸들러
  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product from the global catalog?')) return;

    try {
      await supabase.from('products').delete().eq('id', id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-8">
        {/* 상단 대시보드 브랜딩 헤더 (쇼룸과 동기화된 정식 회사명 출력) */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              <Building2 className="w-3.5 h-3.5" /> Manufacturer Export Showroom Center
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {companyName}
            </h1>
            <p className="text-slate-400 text-xs md:text-sm">
              Manage your registered Korean products exposed to global buyers worldwide.
            </p>
          </div>

          <Link
            href="/products/new"
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer self-start md:self-auto flex-shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ Register Product</span>
          </Link>
        </div>

        {/* 등록된 상품 리스트 영역 */}
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
              <p className="text-xs text-slate-400">Loading catalog items...</p>
            </div>
          ) : products.length === 0 ? (
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
                  <span>+ Register First Product</span>
                </Link>
              </div>
            </div>
          ) : (
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
    </div>
  );
}