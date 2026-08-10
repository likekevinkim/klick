// app/products/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Plus, 
  Sparkles, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Building2, 
  FileText, 
  Loader2, 
  Image as ImageIcon,
  DollarSign,
  ArrowRight,
  Video,
  X,
  Upload,
  Bold,
  Italic,
  List,
  Heading,
  Link as LinkIcon
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
  
  // 미디어 입력 방식 선택 ('file' or 'url')
  const [mediaInputType, setMediaInputType] = useState('file'); 
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');

  // 에디터 및 상세설명 상태
  const [descriptionKo, setDescriptionKo] = useState('');
  const [editorContent, setEditorContent] = useState('');

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

  // 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // DOM 참조
  const mainFileInputRef = useRef(null);
  const galleryFileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);

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

  // 대표 이미지 파일 업로드 처리
  const handleMainFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMainImageUrl(url);
    }
  };

  // 추가 갤러리 이미지 파일 업로드 처리
  const handleGalleryFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newUrls = files.map(file => URL.createObjectURL(file));
      setGalleryImages(prev => [...prev, ...newUrls]);
    }
  };

  // 비디오 파일 업로드 처리
  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
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

  // 에디터 서식 태그 주입 조작 함수
  const handleInsertEditorTag = (tagType) => {
    let insertedText = '';
    if (tagType === 'bold') insertedText = ' **Bold Spec Text** ';
    if (tagType === 'italic') insertedText = ' *Italic Text* ';
    if (tagType === 'heading') insertedText = '\n### Technical Specification Heading\n';
    if (tagType === 'list') insertedText = '\n- Specification Item 1\n- Specification Item 2\n';
    if (tagType === 'image') {
      const imgUrl = prompt('Enter Image URL to embed in description:', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80');
      if (imgUrl) insertedText = `\n![Product Image](${imgUrl})\n`;
    }
    if (tagType === 'video') {
      const vidUrl = prompt('Enter Demo Video URL to embed:', 'https://www.w3schools.com/html/mov_bbb.mp4');
      if (vidUrl) insertedText = `\n[Video Embed: ${vidUrl}]\n`;
    }
    if (tagType === 'link') {
      const linkUrl = prompt('Enter Website or Document Link URL:', 'https://klick.trade');
      if (linkUrl) insertedText = ` [Download Spec PDF](${linkUrl}) `;
    }

    setEditorContent(prev => prev + insertedText);
  };

  // AI 영문 카피라이팅 & 리치 에디터 본문 자동 기획 생성
  const handleGenerateAiCopywriting = () => {
    if (!titleKo) {
      alert('제품 한글 명칭을 먼저 입력해 주세요.');
      return;
    }

    setIsAiGenerating(true);
    setTimeout(() => {
      const aiGeneratedTitle = `High-Precision ${titleKo} (Export Premium Standard)`;
      const aiGeneratedTagline = `ISO 9001 & CE certified ${category.toLowerCase()} engineered with Korean advanced technology.`;
      
      const aiRichFormattedContent = `### Official Verified Export Specification Sheet
- **Product Name**: ${titleKo}
- **Category**: ${category}
- **Quality Standard**: ISO 9001:2015, CE Certified
- **Size & Weight**: ${productSize}
- **Lead Time**: ${leadTime}

### Key Industrial Features
1. **High Durability Alloy**: Built with high-grade Korean materials for extreme pressure environments.
2. **Zero-Defect Quality Assurance**: 100% factory pressure test report provided with bulk export shipments.
3. **OEM / ODM Customization**: Custom logo laser engraving and specialized export packaging available.

### Description
${descriptionKo || 'This high-performance Korean manufactured product is optimized for heavy industrial automation and long-term operating reliability.'}`;

      setTitleEn(aiGeneratedTitle);
      setTaglineEn(aiGeneratedTagline);
      setEditorContent(aiRichFormattedContent);
      setIsAiGenerating(false);
    }, 1200);
  };

  // 새 상품 등록 처리
  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

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
        description_en: editorContent || descriptionKo,
        image_url: mainImageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        gallery_images: galleryImages.length > 0 ? galleryImages : [mainImageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
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

      alert('Product and rich specifications successfully published to the global catalog!');
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
    setEditorContent('');
    setMainImageUrl('');
    setGalleryImages([]);
    setVideoUrl('');
  };

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
        
        {/* 상단 대시보드 헤더 */}
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

        {/* 카탈로그 상품 리스트 */}
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

      {/* ★ 파일 선택기 & 리치 텍스트 에디터가 탑재된 상품 등록 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Register New Export Product Specification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Upload photos/videos or paste URLs, and let AI build your rich specification sheet.</p>
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
              
              {/* 1. 기본 인포메이션 */}
              <div className="space-y-4">
                <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider block border-b pb-1">
                  1. Basic Product Information
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dimensions & Weight Specification</label>
                  <input
                    type="text"
                    placeholder="예: 240 x 180 x 120 mm / 4.5kg"
                    value={productSize}
                    onChange={(e) => setProductSize(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* 2. 수량별 구간 단가 (Tiered Pricing) */}
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

              {/* 3. ★ 미디어 업로더 (파일 선택 & URL 입력 탭 전환 지원) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                    3. Product Photos & Video Upload
                  </span>

                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMediaInputType('file')}
                      className={`px-2.5 py-1 rounded-md transition ${mediaInputType === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      File Select
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaInputType('url')}
                      className={`px-2.5 py-1 rounded-md transition ${mediaInputType === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Paste URL
                    </button>
                  </div>
                </div>

                {mediaInputType === 'file' ? (
                  /* 파일 선택 방식 (Drag & Drop Zone) */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* 메인 커버 이미지 파일 선택 */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Main Cover Image *</label>
                      <input
                        type="file"
                        ref={mainFileInputRef}
                        accept="image/*"
                        onChange={handleMainFileChange}
                        className="hidden"
                      />
                      <div
                        onClick={() => mainFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-4 text-center cursor-pointer transition space-y-1"
                      >
                        {mainImageUrl ? (
                          <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200">
                            <img src={mainImageUrl} alt="Main Cover" className="w-full h-full object-cover" />
                            <span className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">Change</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-blue-600 mx-auto" />
                            <span className="text-xs font-extrabold text-slate-700 block">Click to Upload Cover Image</span>
                            <span className="text-[10px] text-slate-400 block">PNG, JPG, WEBP up to 10MB</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 추가 갤러리 이미지 다중 파일 선택 */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Additional Gallery Photos</label>
                      <input
                        type="file"
                        ref={galleryFileInputRef}
                        accept="image/*"
                        multiple
                        onChange={handleGalleryFilesChange}
                        className="hidden"
                      />
                      <div
                        onClick={() => galleryFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-4 text-center cursor-pointer transition space-y-1"
                      >
                        {galleryImages.length > 0 ? (
                          <div className="flex items-center gap-1.5 overflow-x-auto h-28">
                            {galleryImages.map((url, gIdx) => (
                              <div key={gIdx} className="w-20 h-full rounded-xl overflow-hidden border flex-shrink-0 relative">
                                <img src={url} alt={`Gallery ${gIdx + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 text-emerald-600 mx-auto" />
                            <span className="text-xs font-extrabold text-slate-700 block">Click to Add Gallery Photos</span>
                            <span className="text-[10px] text-slate-400 block">Select multiple image files</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* URL 입력 방식 */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Main Cover Image URL *</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={mainImageUrl}
                        onChange={(e) => setMainImageUrl(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Factory Short Demo Video URL (MP4 / Embed)</label>
                      <input
                        type="url"
                        placeholder="https://www.w3schools.com/html/mov_bbb.mp4"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. ★ AI 자동 기획 & 리치 텍스트 에디터 (Rich Specification Editor) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                    4. Detailed Specifications & Rich Media Description
                  </span>

                  <button
                    type="button"
                    onClick={handleGenerateAiCopywriting}
                    disabled={isAiGenerating}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                    <span>AI Auto-Generate Spec Sheet</span>
                  </button>
                </div>

                {/* 리치 에디터 툴바 (Rich Editor Toolbar) */}
                <div className="border border-slate-300 rounded-2xl overflow-hidden bg-slate-50 space-y-0">
                  <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1 flex-wrap text-slate-700">
                    <button
                      type="button"
                      onClick={() => handleInsertEditorTag('bold')}
                      className="p-1.5 bg-white hover:bg-blue-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Bold Text"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInsertEditorTag('italic')}
                      className="p-1.5 bg-white hover:bg-blue-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Italic Text"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInsertEditorTag('heading')}
                      className="p-1.5 bg-white hover:bg-blue-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Add Heading Section"
                    >
                      <Heading className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInsertEditorTag('list')}
                      className="p-1.5 bg-white hover:bg-blue-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Bullet List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-px h-4 bg-slate-300 mx-1" />

                    <button
                      type="button"
                      onClick={() => handleInsertEditorTag('image')}
                      className="p-1.5 bg-white hover:bg-emerald-50 text-emerald-700 rounded-lg border border-slate-200 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                      title="Embed Spec Image in Description"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Add Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInsertEditorTag('video')}
                      className="p-1.5 bg-white hover:bg-rose-50 text-rose-700 rounded-lg border border-slate-200 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                      title="Embed Video Link"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Add Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInsertEditorTag('link')}
                      className="p-1.5 bg-white hover:bg-blue-50 text-blue-700 rounded-lg border border-slate-200 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                      title="Add Web Link or PDF Download"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Add Link</span>
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    placeholder="자유롭게 제품 사양, 글, 이미지, 동영상 링크를 추가하세요. (AI 자동 생성 버튼을 누르면 영어 전문 카피가 자동 입력됩니다)"
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="w-full p-4 text-xs font-mono leading-relaxed bg-white focus:outline-none"
                  />
                </div>
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
                  <span>Publish Product Specification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}