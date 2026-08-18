// app/products/new/page.jsx
'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Package, 
  Plus, 
  ArrowLeft, 
  ShieldCheck, 
  Loader2, 
  User, 
  MapPin, 
  Image as ImageIcon, 
  Sparkles, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function NewProductCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading AI Product Creator Portal...</span>
          </div>
        </div>
      }
    >
      <NewProductCreateContent />
    </Suspense>
  );
}

function NewProductCreateContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // 셀러 회사 프로필 자동 연동 상태
  const [companyNameEn, setCompanyNameEn] = useState('');
  const [companyNameKo, setCompanyNameKo] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [location, setLocation] = useState('South Korea');

  // 상품 입력 폼 상태 (모든 placeholder 예시글 완전히 비움)
  const [productTitle, setProductTitle] = useState('');
  const [category, setCategory] = useState('Industrial Machinery');
  const [fobPrice, setFobPrice] = useState('');
  const [moq, setMoq] = useState('');
  const [description, setDescription] = useState('');

  // AI 자동 생성 상태
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState('');

  // 상품 사진 첨부 상태
  const [productImage, setProductImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  // 등록 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchSellerProfile();
  }, []);

  // 로그인한 셀러의 DB 회사 프로필 자동 조회 및 매핑
  const fetchSellerProfile = async () => {
    try {
      setLoadingProfile(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (!currentUser) {
        alert('Login is required to register a product.');
        router.push('/login');
        return;
      }

      const userIdStr = currentUser.id.toString();

      // DB 및 메타데이터에서 회사 프로필 정보 자동 추출
      const { data: sellerProf } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', userIdStr)
        .maybeSingle();

      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userIdStr)
        .maybeSingle();

      const meta = currentUser.user_metadata || {};

      const nameEn = sellerProf?.company_name_en || companyData?.company_name_en || meta.company_name_en || meta.company_name || 'Hankook Precision Co., Ltd.';
      const nameKo = sellerProf?.company_name_ko || companyData?.company_name_ko || meta.company_name_ko || '';
      const contact = sellerProf?.contact_person || meta.contact_person || 'Seller Manager';
      const loc = sellerProf?.country || companyData?.location || 'South Korea';

      setCompanyNameEn(nameEn);
      setCompanyNameKo(nameKo);
      setContactPerson(contact);
      setLocation(loc);
    } catch (err) {
      console.error('Error fetching seller profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // 상품 이미지 파일 업로드
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `product_images/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('company-images')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('company-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setProductImage({
          name: file.name,
          url: publicUrlData.publicUrl
        });
      }
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Failed to upload image: ' + (err.message || 'Storage error'));
    } finally {
      setUploadingImage(false);
    }
  };

  // AI 다국어 카피라이팅 자동 생성 핸들러
  const handleGenerateAiCopy = async () => {
    if (!productTitle.trim()) {
      alert('Please enter a Product Title first to generate AI copy.');
      return;
    }

    try {
      setIsAiGenerating(true);
      setErrorMessage('');

      const res = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: productTitle,
          category: category,
          description: description,
          companyName: companyNameEn || companyNameKo
        })
      });

      const data = await res.json();

      if (data?.generatedText) {
        setAiGeneratedContent(data.generatedText);
      } else {
        // AI API 연동 전 표준 고품질 다국어 템플릿 생성
        setAiGeneratedContent(
          `[Official Export Product Overview]\nName: ${productTitle}\nCategory: ${category}\nManufacturer: ${companyNameEn || companyNameKo}\n\n[Key Manufacturing Highlights]\n• ISO 9001 Certified High-Precision Production in ${location}.\n• Customized OEM/ODM Private Labeling Available for Overseas Importers.\n• Premium Export Packaging & Strict QC Inspection Guarantee.\n\n[Technical Specifications & Features]\n${description || 'High-durability manufacturing specifications built for international B2B standards.'}`
        );
      }
    } catch (err) {
      console.error('AI Generation Error:', err);
      setAiGeneratedContent(
        `[Official Export Product Overview]\nName: ${productTitle}\nCategory: ${category}\nManufacturer: ${companyNameEn || companyNameKo}\n\n[Key Manufacturing Highlights]\n• High-precision manufacturing certified by Korean export standards.\n• Direct factory wholesale supply with OEM customization options.`
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  // 상품 등록 제출 핸들러 (스키마 오류 원인이었던 details 필드 제외하고 description만 전송)
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const userIdStr = user.id.toString();
      const activeCompanyName = companyNameEn || companyNameKo || 'Hankook Precision Co., Ltd.';

      const finalDescription = aiGeneratedContent 
        ? `${description}\n\n${aiGeneratedContent}`
        : description;

      const newProductPayload = {
        user_id: userIdStr,
        title: productTitle,
        company_name: activeCompanyName,
        location: location,
        category: category,
        fob_price: fobPrice,
        price: fobPrice,
        moq: moq,
        description: finalDescription,
        image_url: productImage?.url || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('products')
        .insert([newProductPayload])
        .select()
        .single();

      if (error) throw error;

      alert('Product published successfully to KLICK Global Showroom!');
      router.push('/seller/profile');
    } catch (err) {
      console.error('Failed to publish product:', err);
      setErrorMessage('Failed to register product: ' + (err.message || 'Database error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        
        {/* 상단 네비게이션 및 헤더 */}
        <div className="flex items-center justify-between">
          <Link
            href="/seller/profile"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Seller Dashboard</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> AI Export Page Creator
          </span>
        </div>

        {/* 메인 폼 카드 */}
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          
          <div className="border-b border-slate-100 pb-4 space-y-1">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Upload New Product to Global Showroom
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Enter product details in Korean or English. AI will automatically generate an optimized multi-lingual B2B detail page.
            </p>
          </div>

          {/* 1. 자동 매핑된 셀러 회사 정보 카드 */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Automatically Linked Factory Profile
              </span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-extrabold border border-emerald-200">
                Linked
              </span>
            </div>

            {loadingProfile ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading your company profile...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-extrabold">
                  <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{companyNameEn || companyNameKo || 'My Factory'}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>{contactPerson}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>{location}</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. 상품 등록 폼 (Placeholder 완전히 비움) */}
          <form onSubmit={handleSubmitProduct} className="space-y-6 text-xs">
            
            {/* 상품 제목 */}
            <div>
              <label className="block text-slate-800 font-extrabold mb-1.5 text-xs">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                placeholder=""
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-sm bg-white"
              />
            </div>

            {/* 카테고리 & FOB 가격 & MOQ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-800 font-extrabold mb-1.5 text-xs">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-xs bg-white"
                >
                  <option value="Industrial Machinery">Industrial Machinery</option>
                  <option value="K-Beauty & Cosmetics">K-Beauty & Cosmetics</option>
                  <option value="K-Food & Beverages">K-Food & Beverages</option>
                  <option value="Electronics & Smart IT">Electronics & Smart IT</option>
                  <option value="General Manufacturing">General Manufacturing</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1.5 text-xs">
                  Target FOB Price ($ USD)
                </label>
                <input
                  type="text"
                  value={fobPrice}
                  onChange={(e) => setFobPrice(e.target.value)}
                  placeholder=""
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-xs text-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1.5 text-xs">
                  Minimum Order Quantity (MOQ)
                </label>
                <input
                  type="text"
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                  placeholder=""
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-xs bg-white"
                />
              </div>
            </div>

            {/* 상품 사진 첨부 업로더 */}
            <div>
              <label className="block text-slate-800 font-extrabold mb-1.5 text-xs">
                Product Main Photo
              </label>
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              {productImage ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3 truncate">
                    <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="font-extrabold text-blue-900 truncate max-w-[300px]">{productImage.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductImage(null)}
                    className="text-rose-600 hover:underline text-xs font-bold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full py-4 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-slate-600 font-extrabold transition cursor-pointer"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                      <span>Upload Product Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 상세 스펙 및 기본 설명 */}
            <div>
              <label className="block text-slate-800 font-extrabold mb-1.5 text-xs">
                Technical Specifications & Features
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder=""
                className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium leading-relaxed bg-white"
              />
            </div>

            {/* AI 다국어 카피라이팅 자동 생성 영역 */}
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-extrabold text-blue-950 text-xs">
                    AI Automated B2B Detail Page Copywriting
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isAiGenerating || !productTitle.trim()}
                  onClick={handleGenerateAiCopy}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAiGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>{isAiGenerating ? 'Generating...' : 'Auto-Generate AI Copy'}</span>
                </button>
              </div>

              {aiGeneratedContent && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-blue-600 block">Generated Copy Preview:</span>
                  <div className="p-4 bg-white rounded-xl border border-blue-200 text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                    {aiGeneratedContent}
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 하단 최종 제출 버튼 */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/seller/profile"
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSubmitting || uploadingImage}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Publish Product to Showroom</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}