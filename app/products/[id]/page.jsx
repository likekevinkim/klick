// app/products/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Edit3, Trash2, Loader2 } from 'lucide-react';
import ProductDetailVisual from '@/components/products/ProductDetailVisual';
import ProductDetailSpecs from '@/components/products/ProductDetailSpecs';
import ProductFormModal from '@/components/products/ProductFormModal';
import { supabase } from '@/lib/supabase';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;

  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwner, setIsOwner] = useState(true);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // 셀러 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (productId) {
      initProductDetail();
    }
  }, [productId]);

  const initProductDetail = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setCurrentUser(user);

      let foundProduct = null;
      if (productId && productId !== '1') {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (data) foundProduct = data;
      }

      if (!foundProduct) {
        foundProduct = {
          id: productId || '1',
          user_id: user?.id || 'sample_owner_id',
          company_name: 'Hankook Precision Co., Ltd. (한국정밀공업)',
          company_id: '1',
          factory_location: 'Incheon, South Korea 🇰🇷',
          certifications: 'ISO 9001, CE Certified',
          title_en: 'High-Precision Hydraulic Control Valve HV-300 Heavy Duty',
          title_ko: '초고압 산업용 유압 제어 밸브 HV-300',
          category: 'Industrial Machinery',
          price: '145.00',
          moq: '100 Units',
          rating: 4.9,
          reviews_count: 28,
          lead_time: '15 - 20 Days (FOB Incheon Port)',
          product_size: '240 x 180 x 120 mm / 4.5kg',
          tagline: 'ISO 9001 & CE certified heavy-duty hydraulic valve engineered with Korean precision technology.',
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          tiered_pricing: [
            { range: '100 - 499 Units', price: '$145.00 / Unit' },
            { range: '500 - 1,999 Units', price: '$132.00 / Unit' },
            { range: '2,000+ Units', price: '$118.00 / Unit' }
          ],
          attributes: [
            { name: 'Model No.', value: 'HV-300-KR' },
            { name: 'Working Pressure', value: 'Max 350 Bar (5,076 PSI)' },
            { name: 'Flow Rate', value: '120 L/min' },
            { name: 'Body Material', value: 'Ductile Iron GGG40 / Heavy Alloy' },
            { name: 'Operating Temp', value: '-20°C to +80°C' },
            { name: 'Certification', value: 'ISO 9001:2015, CE Certified' },
            { name: 'Country of Origin', value: 'South Korea (Made in Korea)' },
            { name: 'OEM / ODM', value: 'Available (Custom Logo & Packaging)' }
          ],
          description_en: `### Official Verified Export Specification Sheet
- **Product Name**: High-Precision Hydraulic Control Valve HV-300
- **Category**: Industrial Machinery
- **Manufacturer**: Hankook Precision Co., Ltd.
- **Factory Location**: Incheon, South Korea 🇰🇷
- **Quality Standard**: ISO 9001:2015, CE Certified
- **Lead Time**: 15 - 20 Days (FOB Incheon Port)

### Key Industrial Features
1. **High Durability Alloy**: Built with high-grade Korean forged alloy steel for extreme 350 Bar pressure.
2. **Zero-Defect Quality Assurance**: 100% factory pressure test report provided with bulk export shipments.
3. **OEM / ODM Customization**: Custom logo laser engraving and specialized export packaging available.`,
          image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          gallery_images: [
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
          ],
          created_at: new Date().toISOString(),
        };
      }

      setProduct(foundProduct);
      setIsOwner(true);
    } catch (error) {
      console.error('Failed to load product detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (payload) => {
    try {
      const updatedData = { ...product, ...payload };

      if (product.id && product.id !== '1') {
        await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id);
      }

      setProduct(updatedData);
      alert('Product specifications successfully updated!');
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm('Are you sure you want to delete this product from your global catalog?')) return;
    try {
      if (product.id && product.id !== '1') {
        await supabase.from('products').delete().eq('id', product.id);
      }
      alert('Product deleted successfully.');
      router.push('/products');
    } catch (error) {
      console.error('Delete error:', error);
      router.push('/products');
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-10">
        {/* 브레드크럼 네비게이션 및 제어 버튼 */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link href="/products" className="hover:text-blue-600">Products Catalog</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 truncate max-w-[200px] md:max-w-none">{product?.category}</span>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Product Specs</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteProduct}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-xl border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading verified B2B product specifications...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* 1. 알리바바 미디어 갤러리 & 공장 프로필 카너 */}
            <ProductDetailVisual product={product} />

            {/* 2. 수량별 구간 단가표 & 기술 스펙 속성 테이블 */}
            <ProductDetailSpecs product={product} isOwner={isOwner} />
          </div>
        )}
      </main>

      {/* 3. 통합 수정 모달 */}
      {isEditModalOpen && (
        <ProductFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          isEditMode={true}
          initialData={product}
          onSubmit={handleUpdateProduct}
        />
      )}
    </div>
  );
}