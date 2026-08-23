// app/products/[id]/ProductDetailClient.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Edit3, Trash2, Loader2, Star, CheckCircle2, User, Package, Image as ImageIcon, Flag } from 'lucide-react';
import ProductDetailVisual from '@/components/products/ProductDetailVisual';
import ProductDetailSpecs from '@/components/products/ProductDetailSpecs';
import ProductFormModal from '@/components/products/ProductFormModal';
import { supabase } from '@/lib/supabase';

export default function ProductDetailClient() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;

  const [mounted, setMounted] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // 실시간 바이어 리뷰 상태 — product_reviews 테이블과 연동
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewRatingText] = useState('');
  const [newReviewPhotos, setNewReviewPhotos] = useState([]);
  const [uploadingReviewPhoto, setUploadingReviewPhoto] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // 내가 쓴 리뷰 수정 상태
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editText, setEditText] = useState('');
  const [editPhotos, setEditPhotos] = useState([]);
  const [uploadingEditPhoto, setUploadingEditPhoto] = useState(false);
  const [savingEditReview, setSavingEditReview] = useState(false);

  // Only a signed-in buyer can leave a review, using their verified name
  const [viewerRole, setViewerRole] = useState(null);
  const [viewerBuyerId, setViewerBuyerId] = useState(null);
  const [viewerBuyerName, setViewerBuyerName] = useState('');
  // 이 상품에 대해 견적을 수락한 이력이 있는 바이어만 리뷰 작성 가능 — chat_messages의
  // "We accept this quotation" 관례를 재사용 (ChatRoomItem.jsx의 hasAcceptedOrder와 동일 패턴)
  const [canReview, setCanReview] = useState(false);

  // 바이어 찜하기 상태
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;
  const hasAlreadyReviewed = viewerBuyerId
    ? reviews.some((r) => r.buyer_auth_user_id === viewerBuyerId)
    : false;

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

      // 조회수는 정확한 카운터가 아니라 대략적인 관심도 지표 — 소유자 본인의 열람은 제외.
      // products RLS가 "본인 상품만 수정 가능"으로 제한돼 있어서, 남의 조회수를 올리는
      // 이 동작은 서버 라우트(서비스 롤 키)를 통해서만 가능하다.
      if (foundProduct?.id && user?.id !== foundProduct.user_id) {
        fetch('/api/products/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: foundProduct.id })
        }).catch(() => {});
      }

      // 소유권 판단: 로그인한 셀러 본인이 올린 상품일 때만 true
      const userRole = user?.user_metadata?.role || 'seller';
      setIsOwner(!!(user && userRole === 'seller' && foundProduct?.user_id && user.id === foundProduct.user_id));

      setViewerRole(user ? userRole : null);

      if (user && userRole === 'buyer') {
        const userIdStr = user.id.toString();
        const { data: buyerRow } = await supabase
          .from('buyers')
          .select('buyer_name, company_name')
          .eq('auth_user_id', userIdStr)
          .maybeSingle();

        setViewerBuyerId(userIdStr);
        setViewerBuyerName(buyerRow?.buyer_name || buyerRow?.company_name || 'Global Buyer');

        if (foundProduct?.id) {
          const { data: favRow } = await supabase
            .from('buyer_favorites')
            .select('id')
            .eq('buyer_id', userIdStr)
            .eq('product_id', foundProduct.id)
            .maybeSingle();

          setIsFavorited(!!favRow);

          const { data: buyerRooms } = await supabase
            .from('chat_rooms')
            .select('id')
            .eq('product_id', foundProduct.id.toString())
            .eq('buyer_id', userIdStr);

          if (buyerRooms?.length) {
            const { data: acceptMsg } = await supabase
              .from('chat_messages')
              .select('id')
              .in('room_id', buyerRooms.map((r) => r.id))
              .eq('sender_role', 'buyer')
              .like('message', 'We accept this quotation%')
              .limit(1)
              .maybeSingle();

            setCanReview(!!acceptMsg);
          }
        }
      }

      if (foundProduct?.id) {
        const { data: reviewRows } = await supabase
          .from('product_reviews')
          .select('*')
          .eq('product_id', foundProduct.id)
          .order('created_at', { ascending: false });

        // 리뷰 작성 시점에 저장해둔 이름 스냅샷 대신, 현재 실제 바이어 이름으로
        // 항상 다시 해석해서 보여준다. 예전에 저장된 이메일-앞부분 스냅샷은
        // 절대 그대로 다시 쓰지 않는다 (이메일 형태면 무조건 버림).
        const reviewList = reviewRows || [];
        const buyerIds = [...new Set(reviewList.map((r) => r.buyer_auth_user_id).filter(Boolean))];
        const looksLikeEmail = (s) => typeof s === 'string' && s.includes('@');
        const nameById = new Map();

        if (buyerIds.length > 0) {
          const [{ data: buyerRows }, { data: buyerProfileRows }] = await Promise.all([
            supabase.from('buyers').select('auth_user_id, buyer_name, company_name').in('auth_user_id', buyerIds),
            supabase.from('buyer_profiles').select('auth_user_id, company_name').in('auth_user_id', buyerIds)
          ]);

          (buyerProfileRows || []).forEach((b) => {
            if (b.company_name) nameById.set(b.auth_user_id, b.company_name);
          });
          (buyerRows || []).forEach((b) => {
            const resolved = b.buyer_name || b.company_name;
            if (resolved) nameById.set(b.auth_user_id, resolved);
          });
        }

        reviewList.forEach((r) => {
          const live = nameById.get(r.buyer_auth_user_id);
          const stored = r.buyer_name;
          r.buyer_name = live && !looksLikeEmail(live)
            ? live
            : (stored && !looksLikeEmail(stored) ? stored : 'Global Buyer');
        });

        setReviews(reviewList);
      }
    } catch (error) {
      console.error('Failed to load product detail:', error);
      setIsOwner(false);
    } finally {
      setLoading(false);
    }
  };

  // 바이어 찜하기 토글 (buyer_favorites 테이블에 insert/delete)
  const handleToggleFavorite = async () => {
    if (!viewerBuyerId) {
      alert('Please sign in as a buyer to save products.');
      return;
    }
    if (favoriteBusy || !product?.id) return;

    try {
      setFavoriteBusy(true);

      if (isFavorited) {
        const { error } = await supabase
          .from('buyer_favorites')
          .delete()
          .eq('buyer_id', viewerBuyerId)
          .eq('product_id', product.id);

        if (error) throw error;
        setIsFavorited(false);
      } else {
        const { error } = await supabase
          .from('buyer_favorites')
          .insert([{ buyer_id: viewerBuyerId, product_id: product.id }]);

        if (error) throw error;
        setIsFavorited(true);
      }
    } catch (err) {
      console.error('Toggle favorite error:', err);
      alert('Failed to update saved products: ' + (err.message || 'Database error'));
    } finally {
      setFavoriteBusy(false);
    }
  };

  // 사진 여러 장을 Storage에 올리고 public URL 배열을 돌려주는 공용 헬퍼
  // (새 리뷰 작성 / 기존 리뷰 수정 둘 다에서 재사용)
  const uploadReviewPhotos = async (files) => {
    const uploaded = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `review_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `review_photos/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('company-images')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('company-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) uploaded.push(publicUrlData.publicUrl);
    }
    return uploaded;
  };

  const handleReviewPhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingReviewPhoto(true);
      const uploaded = await uploadReviewPhotos(files);
      setNewReviewPhotos((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error('Review photo upload error:', err);
      alert('Failed to upload photo: ' + (err.message || 'Storage error'));
    } finally {
      setUploadingReviewPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemoveReviewPhoto = (idx) => {
    setNewReviewPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // 내가 쓴 리뷰 수정
  const handleEditReviewPhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingEditPhoto(true);
      const uploaded = await uploadReviewPhotos(files);
      setEditPhotos((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error('Review photo upload error:', err);
      alert('Failed to upload photo: ' + (err.message || 'Storage error'));
    } finally {
      setUploadingEditPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemoveEditPhoto = (idx) => {
    setEditPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleStartEditReview = (rev) => {
    setEditingReviewId(rev.id);
    setEditRating(rev.rating);
    setEditText(rev.comment || '');
    setEditPhotos(Array.isArray(rev.photos) ? rev.photos : []);
  };

  const handleCancelEditReview = () => {
    setEditingReviewId(null);
  };

  const handleSaveEditReview = async (reviewId) => {
    if (!editText.trim()) return;

    try {
      setSavingEditReview(true);

      const { error } = await supabase
        .from('product_reviews')
        .update({ rating: Number(editRating), comment: editText.trim(), photos: editPhotos })
        .eq('id', reviewId)
        .eq('buyer_auth_user_id', viewerBuyerId);

      if (error) throw error;

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, rating: Number(editRating), comment: editText.trim(), photos: editPhotos } : r
        )
      );
      setEditingReviewId(null);
    } catch (err) {
      console.error('Review update error:', err);
      alert('Failed to update review: ' + (err.message || 'Database error'));
    } finally {
      setSavingEditReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('buyer_auth_user_id', viewerBuyerId);

      if (error) throw error;

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error('Review delete error:', err);
      alert('Failed to delete review: ' + (err.message || 'Database error'));
    }
  };

  const handleReportReview = async (rev) => {
    const reason = prompt('Why are you reporting this review? (e.g. fake, offensive, spam)');
    if (reason === null) return;

    try {
      await fetch('/api/notify/report-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?.id,
          productTitle: product?.title_en || product?.title,
          reviewId: rev.id,
          reviewComment: rev.comment,
          reporterName: viewerBuyerName || 'A visitor',
          reason
        })
      });
      alert('Thanks — we\'ve flagged this review for the KLICK team to review.');
    } catch (err) {
      console.error('Report review error:', err);
      alert('Failed to send the report. Please try again.');
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    if (!viewerBuyerId) {
      alert('Please sign in as a buyer to leave a review.');
      return;
    }
    if (hasAlreadyReviewed) {
      alert("You've already reviewed this product.");
      return;
    }
    if (!canReview) {
      alert('You can review a product after the seller has accepted your order in chat.');
      return;
    }

    try {
      setSubmittingReview(true);

      const { data: insertedReview, error } = await supabase
        .from('product_reviews')
        .insert([{
          product_id: product.id,
          buyer_auth_user_id: viewerBuyerId,
          buyer_name: viewerBuyerName,
          rating: Number(newRating),
          comment: newReviewText.trim(),
          photos: newReviewPhotos,
        }])
        .select()
        .single();

      if (error) {
        alert('Failed to submit review: ' + error.message);
        return;
      }

      setReviews((prev) => [insertedReview, ...prev]);
      setNewRatingText('');
      setNewRating(5);
      setNewReviewPhotos([]);
      alert('Thank you! Your review and rating have been submitted.');
    } catch (err) {
      console.error('Review submit error:', err);
    } finally {
      setSubmittingReview(false);
    }
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

            <ProductDetailSpecs
              product={product}
              isOwner={isOwner}
              avgRating={avgRating}
              reviewCount={reviewCount}
              viewerRole={viewerRole}
              isFavorited={isFavorited}
              onToggleFavorite={handleToggleFavorite}
              favoriteBusy={favoriteBusy}
            />

            {/* 바이어 리뷰 세션 — product_reviews 테이블과 실제로 연동됨 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                    Verified Buyer Reviews & Ratings ({reviewCount})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {reviewCount > 0
                      ? <>Average Rating: <strong className="text-slate-900">{avgRating.toFixed(1)} / 5.0</strong></>
                      : 'No reviews yet — be the first buyer to leave one.'}
                  </p>
                </div>
              </div>

              {viewerRole === 'buyer' && !hasAlreadyReviewed && !canReview && (
                <p className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                  You can leave a review once the seller has accepted your order for this product in chat.
                </p>
              )}

              {viewerRole === 'buyer' && !hasAlreadyReviewed && canReview && (
                <form onSubmit={handleAddReview} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-xs font-extrabold text-slate-800 block">Leave a Review for this Factory Product (as {viewerBuyerName})</span>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Rating (1 to 5 Stars)</label>
                    <select
                      value={newRating}
                      onChange={(e) => setNewRating(Number(e.target.value))}
                      className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-amber-600"
                    >
                      <option value={5}>★★★★★ (5.0 - Excellent Quality)</option>
                      <option value={4}>★★★★☆ (4.0 - Very Good)</option>
                      <option value={3}>★★★☆☆ (3.0 - Average)</option>
                      <option value={2}>★★☆☆☆ (2.0 - Below Expectations)</option>
                      <option value={1}>★☆☆☆☆ (1.0 - Poor)</option>
                    </select>
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

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Photos of the Actual Product You Received (Optional)
                    </label>

                    <label className="w-full sm:w-auto inline-flex px-3.5 py-2 bg-white border border-slate-300 hover:border-blue-500 rounded-xl cursor-pointer items-center justify-center gap-2 transition text-slate-700 font-bold text-[11px]">
                      {uploadingReviewPhoto ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>{uploadingReviewPhoto ? 'Uploading...' : 'Add Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleReviewPhotoUpload}
                        className="hidden"
                      />
                    </label>

                    {newReviewPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {newReviewPhotos.map((url, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                            <img src={url} alt={`Review photo ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveReviewPhoto(idx)}
                              className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white text-[10px] font-bold"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{submittingReview ? 'Submitting...' : 'Submit Review'}</span>
                    </button>
                  </div>
                </form>
              )}

              {viewerRole !== 'buyer' && (
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  Sign in as a buyer to leave a review for this product.
                </p>
              )}

              {viewerRole === 'buyer' && hasAlreadyReviewed && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                  You've already reviewed this product — thank you!
                </p>
              )}

              <div className="space-y-3 pt-2">
                {reviews.map((rev) => {
                  const isMyReview = viewerBuyerId && rev.buyer_auth_user_id === viewerBuyerId;
                  const isEditing = editingReviewId === rev.id;

                  if (isEditing) {
                    return (
                      <div key={rev.id} className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Rating</label>
                          <select
                            value={editRating}
                            onChange={(e) => setEditRating(Number(e.target.value))}
                            className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-amber-600"
                          >
                            <option value={5}>★★★★★ (5.0 - Excellent Quality)</option>
                            <option value={4}>★★★★☆ (4.0 - Very Good)</option>
                            <option value={3}>★★★☆☆ (3.0 - Average)</option>
                            <option value={2}>★★☆☆☆ (2.0 - Below Expectations)</option>
                            <option value={1}>★☆☆☆☆ (1.0 - Poor)</option>
                          </select>
                        </div>

                        <textarea
                          rows={2}
                          required
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />

                        <div>
                          <label className="w-full sm:w-auto inline-flex px-3.5 py-2 bg-white border border-slate-300 hover:border-blue-500 rounded-xl cursor-pointer items-center justify-center gap-2 transition text-slate-700 font-bold text-[11px]">
                            {uploadingEditPhoto ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            <span>{uploadingEditPhoto ? 'Uploading...' : 'Add Photo'}</span>
                            <input type="file" accept="image/*" multiple onChange={handleEditReviewPhotoUpload} className="hidden" />
                          </label>

                          {editPhotos.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {editPhotos.map((url, idx) => (
                                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                                  <img src={url} alt={`Review photo ${idx + 1}`} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEditPhoto(idx)}
                                    className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white text-[10px] font-bold"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEditReview}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={savingEditReview}
                            onClick={() => handleSaveEditReview(rev.id)}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{savingEditReview ? 'Saving...' : 'Save Changes'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
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
                          <span className="text-slate-400 text-[10px] ml-1">
                            {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 font-medium pl-9 leading-relaxed">
                        "{rev.comment}"
                      </p>

                      {Array.isArray(rev.photos) && rev.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-9 pt-1">
                          {rev.photos.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 block"
                            >
                              <img src={url} alt={`${rev.buyer_name} review photo ${idx + 1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}

                      {!isMyReview && viewerRole && (
                        <div className="pl-9 pt-1">
                          <button
                            type="button"
                            onClick={() => handleReportReview(rev)}
                            className="text-[11px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                          >
                            <Flag className="w-3 h-3" /> Report
                          </button>
                        </div>
                      )}

                      {isMyReview && (
                        <div className="pl-9 pt-1 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleStartEditReview(rev)}
                            className="text-[11px] font-extrabold text-blue-600 hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            className="text-[11px] font-extrabold text-rose-600 hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
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
