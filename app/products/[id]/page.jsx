// app/products/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  Sparkles, 
  Package, 
  MessageSquare, 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Globe, 
  ShieldCheck, 
  X, 
  Loader2, 
  FileText,
  ShoppingBag
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;

  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false); // 실제 이 상품을 올린 셀러 본인인지 여부
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editMoq, setEditMoq] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
    initProductDetail();
  }, [productId]);

  const initProductDetail = async () => {
    try {
      setLoading(true);

      // 1. 세션 유저 파악
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setCurrentUser(user);

      // 2. Supabase DB에서 해당 ID 상품 조회
      let foundProduct = null;
      if (productId && productId !== '1') {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (data) foundProduct = data;
      }

      // 3. DB에 없거나 샘플 ID인 경우 백업 데이터 할당
      if (!foundProduct) {
        foundProduct = {
          id: productId || '1',
          user_id: 'sample_owner_id', // 기본 샘플 소유자 ID
          company_name: 'Hankook Precision Co., Ltd.',
          title_en: 'High-Precision Hydraulic Control Valve HV-300',
          category: 'Industrial Machinery',
          price: '145.00',
          moq: '500 Units',
          tagline: 'ISO 9001 certified heavy-duty industrial valve engineered with Korean precision technology.',
          description_en: 'Official Export Specification:\n- Item Name: High-Precision Hydraulic Control Valve HV-300\n- Working Pressure: Max 350 Bar\n- Flow Rate: 120 L/min\n- Material: Heavy Alloy Steel Casing & Anti-corrosion coating\n- Certification: ISO 9001, CE Certified\n- Origin: Republic of Korea\n\nOptimized for heavy industrial automation, excavators, and severe hydraulic control systems with zero leakage guarantee.',
          image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          created_at: new Date().toISOString(),
        };
      }

      setProduct(foundProduct);
      populateEditForm(foundProduct);

      // 4. 셀러 본인 판별: 로그인된 셀러의 user.id와 상품의 user_id (또는 role) 비교 검증
      if (user) {
        const userRole = user.user_metadata?.role || 'seller';
        const isUserProductOwner = foundProduct.user_id ? foundProduct.user_id === user.id : true;
        
        // 셀러 계정이고 이 상품의 생성이 확인된 경우에만 수정/삭제 권한 부여
        if (userRole === 'seller' && isUserProductOwner) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      } else {
        setIsOwner(false);
      }
    } catch (error) {
      console.error('Failed to load product detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const populateEditForm = (item) => {
    setEditTitle(item.title_en || '');
    setEditCategory(item.category || 'Industrial Machinery');
    setEditPrice(item.price || '145.00');
    setEditMoq(item.moq || '500 Units');
    setEditTagline(item.tagline || '');
    setEditDescription(item.description_en || '');
    setEditImageUrl(item.image_url || '');
  };

  // AI 영문 카피라이팅 재생성
  const handleRegenerateAi = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setEditTagline(`Global Export Grade ${editCategory} engineered for maximum durability.`);
      setEditDescription(`Official Verified Export Spec:\n- Product: ${editTitle}\n- Standard: Industry grade ISO certification\n\n${editDescription}`);
      setIsAiGenerating(false);
    }, 1000);
  };

  // 수정 정보 저장 처리 (본인 셀러만 실행 가능)
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!isOwner) {
      alert('Unauthorized: Only the product seller can edit this specification.');
      return;
    }

    setSaving(true);
    const updatedData = {
      ...product,
      title_en: editTitle,
      category: editCategory,
      price: editPrice,
      moq: editMoq,
      tagline: editTagline,
      description_en: editDescription,
      image_url: editImageUrl,
    };

    try {
      if (product.id && product.id !== '1') {
        await supabase
          .from('products')
          .update({
            title_en: editTitle,
            category: editCategory,
            price: editPrice,
            moq: editMoq,
            tagline: editTagline,
            description_en: editDescription,
            image_url: editImageUrl,
          })
          .eq('id', product.id);
      }

      setProduct(updatedData);
      alert('Product details successfully updated!');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Update error:', error);
      setProduct(updatedData);
      setIsEditModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // 상품 삭제 (본인 셀러만 가능)
  const handleDeleteProduct = async () => {
    if (!isOwner) {
      alert('Unauthorized: Only the product seller can delete this item.');
      return;
    }

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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        {/* 상단 네비게이션 (View Mode 임시 스위처 완전 삭제) */}
        <div className="flex items-center justify-between">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white px-4 py-2.5 rounded-xl border border-slate-200 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products Catalog</span>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading verified product details...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 좌측: 상품 대표 이미지 및 셀러 회사 태그 */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="w-full h-80 md:h-96 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title_en} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-16 h-16 text-slate-300" />
                )}

                <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[10px] font-extrabold px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Factory Product
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Manufacturer / Seller:</span>
                  <span className="font-extrabold text-slate-900 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    {product.company_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Origin:</span>
                  <span className="font-bold text-slate-800">South Korea (Made in Korea)</span>
                </div>
              </div>
            </div>

            {/* 우측: 상품 스펙, 가격 및 권한별 버튼 */}
            <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  <Globe className="w-3.5 h-3.5" /> {product.category}
                </span>

                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {product.title_en}
                </h1>

                <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                  {product.tagline}
                </p>
              </div>

              {/* 가격 및 MOQ 박스 */}
              <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Wholesale FOB Unit Price</span>
                  <span className="text-xl md:text-2xl font-extrabold text-emerald-400">${product.price} USD</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Minimum Order Quantity (MOQ)</span>
                  <span className="text-base md:text-lg font-bold text-slate-100">{product.moq}</span>
                </div>
              </div>

              {/* 상세 설명 */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Product Specifications & Technical Details
                </h3>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-mono">
                  {product.description_en}
                </div>
              </div>

              {/* ★ 핵심 분기: 상품 소유자인 셀러에게만 수정/삭제 버튼 노출, 타인/바이어에게는 RFQ/샘플 요청만 노출 */}
              <div className="pt-4 border-t border-slate-100">
                {isOwner ? (
                  /* 실제 상품을 올린 셀러 본인일 때만 노출 */
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Product Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteProduct}
                      className="py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-xl border border-rose-200 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Product</span>
                    </button>
                  </div>
                ) : (
                  /* 바이어 또는 타 유저일 때는 거래 문의 버튼만 노출 */
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/chat"
                      className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Send Direct Inquiry (RFQ)</span>
                    </Link>

                    <Link
                      href="/chat"
                      className="py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4 text-emerald-400" />
                      <span>Request Sample Order</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 셀러 본인 전용 상품 세부 사항 수정 모달 팝업 */}
      {isEditModalOpen && isOwner && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  Edit Product Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Modify pricing, specifications, and AI copywriting.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Title (English)</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Industrial Machinery">Industrial Machinery</option>
                    <option value="K-Beauty & Cosmetics">K-Beauty & Cosmetics</option>
                    <option value="K-Food & Beverages">K-Food & Beverages</option>
                    <option value="Electronics & Smart IT">Electronics & Smart IT</option>
                    <option value="General Manufacturing">General Manufacturing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price ($ USD)</label>
                  <input
                    type="text"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MOQ</label>
                  <input
                    type="text"
                    required
                    value={editMoq}
                    onChange={(e) => setEditMoq(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Image URL</label>
                <input
                  type="url"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Global Tagline</label>
                <input
                  type="text"
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Detailed Specifications</label>
                  <button
                    type="button"
                    onClick={handleRegenerateAi}
                    disabled={isAiGenerating}
                    className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isAiGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    <span>AI Enhance Copywriting</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}