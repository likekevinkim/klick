// app/products/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { Package, Plus, Building2, Loader2 } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import ProductFormModal from '@/components/products/ProductFormModal';
import { supabase } from '@/lib/supabase';

export default function ProductDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

  // Supabase DB에서 실제 상품 목록 조회
  const fetchProducts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
        setProducts([]);
      } else if (data) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Failed to load seller products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ★ product_name 필수 제약조건 호환 처리가 포함된 INSERT 로직
  const handleCreateProduct = async (payload) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || null;

      const titleEn = payload.title_en || 'Export Product';
      const titleKo = payload.title_ko || '';

      const fullPayload = {
        product_name: titleEn || titleKo || 'Export Product', // product_name NOT NULL 호환 대응
        title_en: titleEn,
        title_ko: titleKo,
        category: payload.category || 'General Manufacturing',
        price: payload.price || '0.00',
        moq: payload.moq || '1 Unit',
        lead_time: payload.lead_time || '14 Days',
        product_size: payload.product_size || '',
        company_name: payload.company_name || 'Hankook Precision Co., Ltd.',
        factory_location: payload.factory_location || 'South Korea 🇰🇷',
        certifications: payload.certifications || 'ISO 9001, CE Certified',
        tagline: payload.tagline || '',
        description_en: payload.description_en || '',
        image_url: payload.image_url || '',
        gallery_images: payload.gallery_images || [],
        video_url: payload.video_url || '',
        tiered_pricing: payload.tiered_pricing || [],
        created_at: new Date().toISOString()
      };

      if (currentUserId) {
        fullPayload.user_id = currentUserId;
      }

      // 1차 DB 저장을 시도
      let { data, error } = await supabase
        .from('products')
        .insert([fullPayload])
        .select();

      // user_id 컬럼 누락 에러 발생 시 fallback 처리
      if (error && error.message?.includes('user_id')) {
        console.warn('user_id 컬럼 누락 감지, user_id 제외 후 안전 저장 재시도...');
        const payloadWithoutUserId = { ...fullPayload };
        delete payloadWithoutUserId.user_id;

        const retryResult = await supabase
          .from('products')
          .insert([payloadWithoutUserId])
          .select();

        if (!retryResult.error && retryResult.data) {
          data = retryResult.data;
          error = null;
        }
      }

      // 2차 기본 필수 컬럼 유연 저장 (기타 B2B 컬럼 누락 대응)
      if (error && error.message?.includes('column')) {
        console.warn('기타 DB 컬럼 누락 감지, 최소 필수 컬럼으로 저장 시도...');
        const minimalPayload = {
          product_name: titleEn || titleKo || 'Export Product',
          title_en: titleEn,
          category: payload.category || 'General Manufacturing',
          price: payload.price || '0.00',
          moq: payload.moq || '1 Unit',
          image_url: payload.image_url || '',
          created_at: new Date().toISOString()
        };

        const minimalResult = await supabase
          .from('products')
          .insert([minimalPayload])
          .select();

        if (!minimalResult.error && minimalResult.data) {
          data = minimalResult.data;
          error = null;
        }
      }

      if (error) {
        console.error('Supabase DB Insert Error:', error);
        alert('DB 저장 오류: ' + error.message + '\n\nSupabase SQL Editor에서 안내 스크립트를 실행해 주세요.');
        return;
      }

      if (data && data.length > 0) {
        setProducts([data[0], ...products]);
        alert('Product successfully saved to Supabase Database!');
        setIsAddModalOpen(false);
      } else {
        fetchProducts();
        setIsAddModalOpen(false);
      }
    } catch (err) {
      console.error('Error creating product:', err);
      alert('Failed to save product to database.');
    }
  };

  // 상품 삭제 시 Supabase DB에서 삭제
  const handleDeleteProduct = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this product permanently from the database?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete error:', error);
        alert('Delete failed: ' + error.message);
        return;
      }

      setProducts(products.filter(p => p.id.toString() !== id.toString()));
      alert('Product deleted successfully from Database.');
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        <div className="bg-[#0F172A] text-white p-8 rounded-3xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-extrabold border border-blue-500/30">
              <Building2 className="w-3.5 h-3.5" /> Seller Control Hub
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Export Product Dashboard
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Manage live factory catalog items connected directly to Supabase Database.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Product</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-extrabold text-slate-900">Active Export Product Catalog ({products.length})</h2>
            </div>
            <span className="text-xs text-slate-500">Click any product card to view or edit full B2B specifications.</span>
          </div>

          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading live catalog items from Database...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3 shadow-sm">
              <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <h3 className="text-base font-bold text-slate-800">No Products Registered Yet</h3>
              <p className="text-xs text-slate-500">Click "Register New Product" to add your first product to Supabase DB.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onClick={() => router.push(`/products/${item.id}`)}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 등록 모달 팝업 */}
      <ProductFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        isEditMode={false}
        onSubmit={handleCreateProduct}
      />
    </div>
  );
}