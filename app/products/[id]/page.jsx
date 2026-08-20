// app/products/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Edit3, Trash2, Loader2, Star, CheckCircle2, User, Package } from 'lucide-react';
import ProductDetailVisual from '@/components/products/ProductDetailVisual';
import ProductDetailSpecs from '@/components/products/ProductDetailSpecs';
import ProductFormModal from '@/components/products/ProductFormModal';
import { supabase } from '@/lib/supabase';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;

  const [mounted, setMounted] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  
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

  // Supabase DB에서 실제 ID로 조회
  const initProductDetail = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;

      let foundProduct = null;
      if (productId) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (data) {
          foundProduct = {
            ...data,
            title_en: data.title_en || data.title || '',
            title_ko: data.title_ko || data.title || '',
            image_url: data.image_url || (data.gallery_images && data.gallery_images[0]) || ''
          };
        }
      }

      setProduct(foundProduct);

      // 소유권 판단
      const userRole = user?.user_metadata?.role || 'seller';
      if (user && userRole === 'seller' && foundProduct?.user_id) {
        if (user.id === foundProduct.user_id) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      } else if (userRole === 'seller' && foundProduct) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
    } catch (error) {
      console.error('Failed to load product detail:', error);
      setIsOwner(false);
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

  // 수정한 내용을 Supabase DB에 직접 UPDATE
  const handleUpdateProduct = async (payload) => {
    if (!isOwner) {
      alert('Access Denied: Only the seller who registered this product can edit its specifications.');
      setIsEditModalOpen(false);
      return;
    }

    try {
      if (product?.id) {
        // payload는 ProductFormModal에서 넘어온, products 테이블 스키마와 일치하는 필드만 포함합니다.
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id);

        if (error) {
          alert('Update failed: ' + error.message);
          return;
        }
      }

      setProduct(prev => ({ ...prev, ...payload }));
      alert('Product specifications successfully updated in Database!');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  // Supabase DB에서 레코드 완전 삭제
  const handleDeleteProduct = async () => {
    if (!isOwner) {
      alert('Access Denied: Only the seller who registered this product can delete it.');
      return;
    }

    if (!confirm('Are you sure you want to delete this product from the database?')) return;
    try {
      if (product?.id) {
        const { error } = await supabase.from('products').delete().eq('id', product.id);
        if (error) {
          alert('Delete failed: ' + error.message);
          return;
        }
      }
      alert('Product deleted successfully from Database.');
      router.push('/products');
    } catch (error) {
      console.error('Delete error:', error);
      router.push('/products');
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-10">
        {/* 브레드크럼 네비게이션 및 셀러 권한 컨트롤러 */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link href="/products" className="hover:text-blue-600">Products Catalog</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 truncate max-w-[200px] md:max-w-none">{product?.category || 'Catalog'}</span>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2 animate-fadeIn">
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
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading verified B2B product specifications from Database...</p>
          </div>
        ) : !product ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3 shadow-sm">
            <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-slate-800">Product Not Found</h3>
            <p className="text-xs text-slate-500">This product may have been deleted or does not exist in the database.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-md"
            >
              Back to Dashboard
            </Link>
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
                  <p className="text-xs text-slate-500 mt-0.5">Average Rating: <strong className="text-slate-900">{product?.rating || '5.0'} / 5.0</strong> based on verified global transactions.</p>
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

      {/* 셀러 전용 수정 모달 */}
      {isEditModalOpen && isOwner && (
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
