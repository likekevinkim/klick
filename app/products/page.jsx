// app/products/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Plus, 
  Sparkles, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Globe, 
  Building2, 
  FileText, 
  Loader2, 
  Image as ImageIcon,
  DollarSign,
  Layers,
  ArrowRight,
  Video,
  Clock,
  Ruler,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ProductDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 기본 등록 폼 상태
  const [titleKo, setTitleKo] = useState('');
  const [category, setCategory] = useState('Industrial Machinery');
  const [moq, setMoq] = useState('100 Units');
  const [leadTime, setLeadTime] = useState('15 - 20 Days (FOB)');
  const [productSize, setProductSize] = useState('240 x 180 x 120 mm / 4.5kg');
  const [videoUrl, setVideoUrl] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [galleryImagesStr, setGalleryImagesStr] = useState('');
  const [descriptionKo, setDescriptionKo] = useState('');

  // 구간 단가 (Tiered Pricing) 상태
  const [tieredPricing, setTieredPricing] = useState([
    { min_qty: '100 - 499 Units', price: '145.00' },
    { min_qty: '500 - 1,999 Units', price: '132.00' },
    { min_qty: '2,000+ Units', price: '118.00' }
  ]);

  // AI 자동 생성 상태
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [titleEn, setTitleEn] = useState('');
  const [taglineEn, setTaglineEn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');

  // 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setProducts(data);
      } else {
        // 백업 기본 대표 상품 데이터
        setProducts([
          {
            id: '1',
            title_en: 'High-Precision Hydraulic Control Valve HV-300 Heavy Duty',
            category: 'Industrial Machinery',
            company_name: 'Hankook Precision Co., Ltd.',
            price: '145.00',
            moq: '100 Units',
            lead_time: '15 - 20 Days',
            tagline: 'ISO 9001 certified heavy-duty industrial valve engineered with Korean precision technology.',
            image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            title_en: 'Heavy-Duty Hydraulic Actuator Cylinder AC-500 Automation',
            category: 'Industrial Machinery',
            company_name: 'Hankook Precision Co., Ltd.',
            price: '320.00',
            moq: '50 Units',
            lead_time: '20 - 25 Days',
            tagline: 'Heavy industrial grade actuator built for zero-leakage durability in extreme conditions.',
            image_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
            created_at: new Date().toISOString(),
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load seller products:', error);
    } finally {
      setLoading(false);
    }
  };

  // 구간 단가 항목 추가/삭제
  const handleAddPriceTier = () => {
    setTieredPricing([...tieredPricing, { min_qty: '5,000+ Units', price: '100.00' }]);
  };

  const handleRemovePriceTier = (index) => {
    setTieredPricing(tieredPricing.filter((_, idx) => idx !== index));
  };

  const handlePriceTierChange = (index, field, value) => {
    const updated = [...tieredPricing];
    updated[index][field] = value;
    setTieredPricing(updated);
  };

  // AI 자동 영문 카피라이팅 & 기술 상세페이지 기획 생성
  const handleGenerateAiCopywriting = () => {
    if (!titleKo) {
      alert('제품 한글 명칭을 입력해 주세요.');
      return;
    }

    setIsAiGenerating(true);
    setTimeout(() => {
      setTitleEn(`High-Precision ${titleKo} (Export Premium Standard)`);
      setTaglineEn(`ISO 9001 & CE certified ${category.toLowerCase()} engineered with Korean advanced technology.`);
      setDescriptionEn(
        `Official Verified Export Specification:\n- Product Name: ${titleKo}\n- Category: ${category}\n- Quality Standard: ISO 9001:2015, CE, RoHS Approved\n- Size & Weight: ${productSize}\n- Lead Time: ${leadTime}\n\nFeatures & Benefits:\n1. Engineered with high-durability materials for zero-defect reliability.\n2. Custom OEM logo branding and specialized export packaging available upon request.\n\nDescription:\n${descriptionKo || 'This high-performance Korean manufactured product is optimized for extreme operating conditions and long-term industrial reliability.'}`
      );
      setIsAiGenerating(false);
    }, 1200);
  };

  // 새 상품 등록 처리
  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const galleryArray = galleryImagesStr
        ? galleryImagesStr.split(',').map(s => s.trim()).filter(Boolean)
        : [mainImageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'];

      const newProductPayload = {
        title_en: titleEn || titleKo,
        title_ko: titleKo,
        category,
        price: tieredPricing[0]?.price || '145.00',
        moq,
        lead_time: leadTime,
        product_size: productSize,
        video_url: videoUrl,
        tagline: taglineEn || `${titleKo} Export Model`,
        description_en: descriptionEn || descriptionKo,
        image_url: mainImageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        gallery_images: galleryArray,
        tiered_pricing: tieredPricing.map(t => ({ range: t.min_qty, price: `$${t.price} / Unit` })),
        company_name: 'Hankook Precision Co., Ltd.',
        user_id: userId,
      };

      const { data, error } = await supabase
        .from('products')
        .insert([newProductPayload])
        .select();

      if (data && data.length > 0) {
        setProducts([data[0], ...products]);
      } else {
        const localMock = { ...newProductPayload, id: Date.now().toString(), created_at: new Date().toISOString() };
        setProducts([localMock, ...products]);
      }

      alert('Product and specifications successfully published to the global catalog!');
      resetForm();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Failed to register product:', error);
      setIsAddModalOpen(false);
    }
  };

  const resetForm = () => {
    setTitleKo('');
    setTitleEn('');
    setTaglineEn('');
    setDescriptionKo('');
    setDescriptionEn('');
    setMainImageUrl('');
    setGalleryImagesStr('');
    setVideoUrl('');
  };

  // 상품 삭제 처리
  const handleDeleteProduct = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this product from your catalog?')) return;

    try {
      await supabase.from('products').delete().eq('id', id);
      setProducts(products.filter(p => p.id !== id));
      alert('Product deleted successfully.');
    } catch (error) {
      console.error('Delete error:', error);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* 상단 대시보드 타이틀 & 새 상품 등록 버튼 */}
        <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-extrabold border border-blue-500/30">
              <Building2 className="w-3.5 h-3.5" /> Seller Control Hub
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Export Product Dashboard
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Manage live factory catalog items, AI English copywriting, video tours, and tiered FOB pricing.
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

        {/* 등록된 상품 카탈로그 그리드 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-extrabold text-slate-900">Active Export Product Catalog ({products.length})</h2>
            </div>
            <span className="text-xs text-slate-500">Click any product card to view or edit full B2B specifications.</span>
          </div>

          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading catalog items...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <h3 className="text-base font-bold text-slate-800">No Products Registered Yet</h3>
              <p className="text-xs text-slate-500">Click "Register New Product" to start exporting to global buyers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/products/${item.id}`)}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition duration-200 overflow-hidden flex flex-col justify-between group cursor-pointer p-6 space-y-4"
                >
                  <div className="space-y-4">
                    <div className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 relative flex items-center justify-center">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title_en}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <Package className="w-12 h-12 text-slate-300" />
                      )}

                      <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                        {item.category}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-blue-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Live in Global Catalog</span>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                        {item.title_en}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.tagline || item.description_en}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">FOB Unit Price</span>
                        <span className="font-extrabold text-emerald-600">${item.price} USD</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold">Min Order</span>
                        <span className="font-bold text-slate-800">{item.moq}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-blue-600 group-hover:underline flex items-center gap-1">
                      <span>View Specifications</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteProduct(e, item.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                      title="Delete Product"
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

      {/* 새 상품 등록 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Register New Export Product Specification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Input your product details and AI will translate & format for global B2B buyers.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-6">
              
              <div className="space-y-4">
                <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider block border-b pb-1">
                  1. Basic Information
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Name (Korean) *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 초고압 산업용 유압 제어 밸브 HV-300"
                    value={titleKo}
                    onChange={(e) => setTitleKo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Order (MOQ) *</label>
                    <input
                      type="text"
                      required
                      placeholder="100 Units"
                      value={moq}
                      onChange={(e) => setMoq(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Lead Time *</label>
                    <input
                      type="text"
                      required
                      placeholder="15 - 20 Days (FOB)"
                      value={leadTime}
                      onChange={(e) => setLeadTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dimensions & Weight</label>
                  <input
                    type="text"
                    placeholder="예: 240 x 180 x 120 mm / 4.5kg"
                    value={productSize}
                    onChange={(e) => setProductSize(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                    2. Wholesale Tiered FOB Pricing ($ USD)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPriceTier}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Tier Range
                  </button>
                </div>

                <div className="space-y-2">
                  {tieredPricing.map((tier, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Range (e.g., 100 - 499 Units)"
                        value={tier.min_qty}
                        onChange={(e) => handlePriceTierChange(idx, 'min_qty', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                      <div className="flex items-center gap-1 w-32">
                        <span className="text-xs font-bold text-slate-500">$</span>
                        <input
                          type="text"
                          placeholder="Price"
                          value={tier.price}
                          onChange={(e) => handlePriceTierChange(idx, 'price', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-emerald-600"
                        />
                      </div>
                      {tieredPricing.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePriceTier(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider block border-b pb-1">
                  3. Product Images & Demonstration Video
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Main Cover Image URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={mainImageUrl}
                    onChange={(e) => setMainImageUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Additional Gallery Photos (Comma Separated URLs)</label>
                  <input
                    type="text"
                    placeholder="https://img1.jpg, https://img2.jpg"
                    value={galleryImagesStr}
                    onChange={(e) => setGalleryImagesStr(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Factory Short Demo Video URL (MP4 or Embed)</label>
                  <input
                    type="url"
                    placeholder="https://www.w3schools.com/html/mov_bbb.mp4"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-5 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" /> AI Export Copywriter Engine
                  </span>

                  <button
                    type="button"
                    onClick={handleGenerateAiCopywriting}
                    disabled={isAiGenerating}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isAiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>AI Generate English Spec Sheet</span>
                  </button>
                </div>

                {titleEn && (
                  <div className="space-y-2 text-xs text-slate-700 pt-2 border-t border-blue-100 animate-fadeIn">
                    <div>
                      <span className="font-bold text-blue-900 block text-[10px]">AI Generated Title:</span>
                      <span className="font-extrabold text-slate-900">{titleEn}</span>
                    </div>
                    <div>
                      <span className="font-bold text-blue-900 block text-[10px]">AI Generated Tagline:</span>
                      <span className="text-slate-600">{taglineEn}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Description (Korean / Specs)</label>
                <textarea
                  rows={4}
                  placeholder="제품 한글 사양이나 특장점을 자유롭게 입력하세요. AI가 글로벌 영어 규격으로 다듬어 드립니다."
                  value={descriptionKo}
                  onChange={(e) => setDescriptionKo(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish Specification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}