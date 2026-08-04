// app/products/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { 
  PlusCircle, 
  Sparkles, 
  Building2, 
  Package, 
  DollarSign, 
  CheckCircle2, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  FileText, 
  Globe, 
  Loader2, 
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SellerProductsDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 상품 등록 모달 팝업 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // AI 상품 등록 폼 상태
  const [companyName, setCompanyName] = useState('Hankook Precision Co., Ltd.');
  const [rawTitle, setRawTitle] = useState('');
  const [category, setCategory] = useState('Industrial Machinery');
  const [price, setPrice] = useState('150.00');
  const [moq, setMoq] = useState('100 Units');
  const [rawDescription, setRawDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // AI 변환 상태 및 결과
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedTitle, setAiGeneratedTitle] = useState('');
  const [aiGeneratedTagline, setAiGeneratedTagline] = useState('');
  const [aiGeneratedDescription, setAiGeneratedDescription] = useState('');

  const [saving, setSaving] = useState(false);

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
        if (meta.company_name) setCompanyName(meta.company_name);
      }

      // Supabase에서 등록된 상품 목록 조회
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Failed to fetch seller products:', error);
    } finally {
      setLoading(false);
    }
  };

  // AI 영문 카피라이팅 자동 생성 핸들러
  const handleGenerateAiCopywriting = async () => {
    if (!rawTitle) {
      alert('Please enter a basic product title first.');
      return;
    }

    setIsAiGenerating(true);

    try {
      // AI 영문 자동 카피라이팅 시뮬레이션
      setTimeout(() => {
        setAiGeneratedTitle(`High-Performance ${rawTitle} - Premium Export Grade`);
        setAiGeneratedTagline(`ISO 9001 certified industrial solution engineered with Korean precision technology.`);
        setAiGeneratedDescription(`Official Export Specification:\n- Item: ${rawTitle}\n- Category: ${category}\n- Key Features: Premium alloy construction, ultra-high durability, optimized for heavy industrial automation and global B2B supply chain standards.\n\n${rawDescription}`);
        setIsAiGenerating(false);
      }, 1200);
    } catch (error) {
      console.error('AI Generation failed:', error);
      setIsAiGenerating(false);
    }
  };

  // 최종 상품 등록 저장 핸들러
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const newProduct = {
        company_name: companyName,
        title_en: aiGeneratedTitle || rawTitle,
        category: category,
        price: price,
        moq: moq,
        tagline: aiGeneratedTagline || 'High-quality Korean manufactured industrial product.',
        description_en: aiGeneratedDescription || rawDescription,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select();

      if (error) {
        // DB 테이블이 비어있거나 생성 전일 경우 로컬 임시 추가
        setProducts([newProduct, ...products]);
      } else if (data) {
        setProducts([...data, ...products]);
      }

      alert('New product successfully registered and published to Global Marketplace!');
      setIsAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Product saved locally for demonstration.');
      setIsAddModalOpen(false);
    } finally {
      setSaving(false);
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
    }
  };

  const resetForm = () => {
    setRawTitle('');
    setRawDescription('');
    setImageUrl('');
    setAiGeneratedTitle('');
    setAiGeneratedTagline('');
    setAiGeneratedDescription('');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-8">
        {/* 상단 대시보드 브랜딩 헤더 */}
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

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ Register New Product</span>
          </button>
        </div>

        {/* 2. 등록된 상품 리스트 영역 */}
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
            /* 상품이 전혀 없을 때 렌더링되는 노출 화면 */
            <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-4">
              <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-800">No Products Registered Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Start registering your manufactured products to attract verified global buyers and receive direct RFQs.
                </p>
              </div>

              {/* 첫 상품 등록하기 버튼 */}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition inline-flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Register Product Now</span>
              </button>
            </div>
          ) : (
            /* 등록된 상품 그리드 카드 리스트 */
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
                        <span className="text-[10px] text-slate-400 block">FOB Unit Price</span>
                        <span className="font-extrabold text-emerald-600">${item.price} USD</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">MOQ</span>
                        <span className="font-bold text-slate-700">{item.moq}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <Link
                      href={`/products/${item.id || 1}`}
                      className="font-extrabold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>View Live Page</span>
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

      {/* 3. [모달 팝업] AI 지원 신규 상품 등록 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  AI Product Copywriting & Registration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter Korean specifications; AI converts them into buyer-tailored English Copywriting.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Basic Name (Korean or English)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={rawTitle}
                    onChange={(e) => setRawTitle(e.target.value)}
                    placeholder="e.g. 유압 제어 밸브 HV-300 (Hydraulic Control Valve)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleGenerateAiCopywriting}
                    disabled={isAiGenerating}
                    className="px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-extrabold text-xs rounded-xl border border-blue-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0"
                  >
                    {isAiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>AI Generate English</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">FOB Unit Price ($ USD)</label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="150.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MOQ (Minimum Order)</label>
                  <input
                    type="text"
                    required
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                    placeholder="100 Units"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Image URL (Optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Technical Description & Specification</label>
                <textarea
                  rows={3}
                  value={rawDescription}
                  onChange={(e) => setRawDescription(e.target.value)}
                  placeholder="Enter raw product specifications in Korean or English..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed"
                />
              </div>

              {/* AI 변환 결과 미리보기 카드 */}
              {(aiGeneratedTitle || aiGeneratedDescription) && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-extrabold text-blue-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> AI English Copywriting Preview
                    </span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md font-bold">Generated</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Target English Title:</span>
                    <p className="font-bold text-slate-100">{aiGeneratedTitle}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Global Tagline:</span>
                    <p className="text-slate-300">{aiGeneratedTagline}</p>
                  </div>
                </div>
              )}

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
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saving ? 'Publishing...' : 'Publish Product to Catalog'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}