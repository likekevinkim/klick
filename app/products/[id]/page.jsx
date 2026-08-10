// app/products/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Edit3, Trash2, Loader2, Star, CheckCircle2, User } from 'lucide-react';
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

  // 실시간 바이어 리뷰 상태
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewRatingText] = useState('');
  const [buyerName, setBuyerName] = useState('');

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

      // 로컬 스토리지에 수정된 영구 백업 데이터가 존재하는지 검증
      const savedLocal = localStorage.getItem(`klick_product_${productId}`);
      if (savedLocal) {
        try {
          foundProduct = JSON.parse(savedLocal);
        } catch (e) {
          console.error(e);
        }
      }

      const mockReviews = [
        {
          id: 1,
          buyer_name: 'David Miller (US Machinery Corp)',
          rating: 5,
          comment: 'Outstanding quality and fast delivery to Los Angeles port. The ISO 9001 certification report was fully provided.',
          created_at: '2026-08-01'
        },
        {
          id: 2,
          buyer_name: 'Elena Rostova (Euro Industrial GbmH)',
          rating: 5,
          comment: 'Very professional Korean manufacturer. Spool precision meets our extreme high pressure standards.',
          created_at: '2026-07-28'
        }
      ];

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
          rating: 5.0,
          reviews_count: 2,
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

      setReviews(mockReviews);
      setProduct(foundProduct);
      setIsOwner(true);
    } catch (error) {
      console.error('Failed to load product detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    const newReviewObj = {
      id: Date.now(),
      buyer_name: buyerName.trim() || 'Global Buyer',
      rating: Number(newRating),
      comment: newReviewText.trim(),
      created_at: new Date().toISOString().split('T')[0]
    };

    const updatedReviews = [newReviewObj, ...reviews];
    setReviews(updatedReviews);

    const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (totalRating / updatedReviews.length).toFixed(1);

    setProduct(prev => ({
      ...prev,
      rating: parseFloat(avgRating),
      reviews_count: updatedReviews.length
    }));

    setNewRatingText('');
    setBuyerName('');
    alert('Thank you! Your review and rating have been submitted.');
  };

  // ★ 사진 삭제 및 수정 정보 저장 (Supabase DB + LocalStorage 영구 보존)
  const handleUpdateProduct = async (payload) => {
    try {
      const updatedData = { ...product, ...payload };

      // 1. DB 업데이트
      if (product.id && product.id !== '1') {
        await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id);
      }

      // 2. 새로고침 시에도 지운 사진이 원복되지 않도록 LocalStorage에 영구 갱신 저장
      localStorage.setItem(`klick_product_${productId}`, JSON.stringify(updatedData));

      setProduct(updatedData);
      alert('Product specifications and updated gallery successfully saved!');
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
      localStorage.removeItem(`klick_product_${productId}`);
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
            <ProductDetailVisual product={product} />

            <ProductDetailSpecs product={product} isOwner={isOwner} />

            {/* 바이어 리뷰 세션 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                    Verified Buyer Reviews & Ratings ({product?.reviews_count || reviews.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Average Rating: <strong className="text-slate-900">{product?.rating} / 5.0</strong> based on verified global transactions.</p>
                </div>
              </div>

              <form onSubmit={handleAddReview} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-extrabold text-slate-800 block">Leave a Review for this Factory Product</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Your Name / Company</label>
                    <input
                      type="text"
                      placeholder="e.g. John Smith (US Import LLC)"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Rating (1 to 5 Stars)</label>
                    <select
                      value={newRating}
                      onChange={(e) => setNewRating(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-amber-600"
                    >
                      <option value={5}>★★★★★ (5.0 - Excellent Quality)</option>
                      <option value={4}>★★★★☆ (4.0 - Very Good)</option>
                      <option value={3}>★★★☆☆ (3.0 - Average)</option>
                      <option value={2}>★★☆☆☆ (2.0 - Below Expectations)</option>
                      <option value={1}>★☆☆☆☆ (1.0 - Poor)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Write your review about product quality, shipping speed, or seller response..."
                    value={newReviewText}
                    onChange={(e) => setNewRatingText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Review</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3 pt-2">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-extrabold text-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-extrabold text-slate-900">{rev.buyer_name}</span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                        <span className="text-slate-400 text-[10px] ml-1">{rev.created_at}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 font-medium pl-9 leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 수정 모달 */}
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