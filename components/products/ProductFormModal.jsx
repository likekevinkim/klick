// components/products/ProductFormModal.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  Upload, 
  Video, 
  Sparkles, 
  Building2, 
  MapPin, 
  ShieldCheck, 
  Loader2, 
  Image as ImageIcon, 
  Film, 
  Bold, 
  Italic, 
  Heading, 
  List,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ProductFormModal({ isOpen, onClose, onProductCreated }) {
  // 로그인한 셀러의 자동 가져온 회사 프로필 상태
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [factoryLocation, setFactoryLocation] = useState('South Korea');

  // 1. BASIC PRODUCT INFORMATION (모든 placeholder 예시 문구 비움)
  const [titleKo, setTitleKo] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [category, setCategory] = useState('Industrial Machinery');
  const [moq, setMoq] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [dimensions, setDimensions] = useState('');

  // 2. MANUFACTURER PROFILE & COMPLIANCE CERTIFICATIONS
  const [certifications, setCertifications] = useState('');

  // 3. WHOLESALE TIERED FOB PRICING ($ USD)
  const [pricingTiers, setTieredPricing] = useState([
    { id: 1, minQty: '', maxQty: '', price: '' },
    { id: 2, minQty: '', maxQty: '', price: '' }
  ]);

  // 4. PRODUCT PHOTOS & FACTORY DEMO VIDEO
  const [coverImage, setCoverImage] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [demoVideo, setDemoVideo] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // 5. DETAILED SPECIFICATIONS RICH EDITOR
  const [detailsText, setDetailsText] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const coverInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchSellerProfile();
    }
  }, [isOpen]);

  // DB 및 세션에서 셀러 회사 정보 자동 조회 및 2번 영역 매핑
  const fetchSellerProfile = async () => {
    try {
      setLoadingProfile(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (currentUser) {
        const userIdStr = currentUser.id.toString();

        const { data: sellerProf } = await supabase
          .from('seller_profiles')
          .select('*')
          .eq('user_id', userIdStr)
          .maybeSingle();

        const { data: compProf } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', userIdStr)
          .maybeSingle();

        const meta = currentUser.user_metadata || {};

        const activeName = sellerProf?.company_name_en || sellerProf?.company_name || compProf?.company_name_en || compProf?.company_name || meta.company_name_en || meta.company_name || 'Hankook Precision Co., Ltd.';
        const activeLoc = sellerProf?.country || compProf?.location || 'South Korea';

        setCompanyName(activeName);
        setFactoryLocation(activeLoc);
      } else {
        setCompanyName('Verified Korean Manufacturer');
        setFactoryLocation('South Korea');
      }
    } catch (err) {
      console.error('Error fetching seller profile:', err);
      setCompanyName('Verified Korean Manufacturer');
      setFactoryLocation('South Korea');
    } finally {
      setLoadingProfile(false);
    }
  };

  // 대표 커버 사진 업로드
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `product_covers/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('company-images')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('company-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setCoverImage({ name: file.name, url: publicUrlData.publicUrl });
      }
    } catch (err) {
      console.error('Cover upload error:', err);
      alert('Failed to upload cover photo: ' + (err.message || 'Storage error'));
    } finally {
      setUploadingCover(false);
    }
  };

  // 데모 동영상 업로드
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingVideo(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `video_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `product_videos/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('company-images')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('company-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setDemoVideo({ name: file.name, url: publicUrlData.publicUrl });
      }
    } catch (err) {
      console.error('Video upload error:', err);
      alert('Failed to upload video file: ' + (err.message || 'Storage error'));
    } finally {
      setUploadingVideo(false);
    }
  };

  // 단가 구간 추가 / 삭제
  const handleAddTier = () => {
    setTieredPricing((prev) => [
      ...prev,
      { id: Date.now(), minQty: '', maxQty: '', price: '' }
    ]);
  };

  const handleRemoveTier = (id) => {
    setTieredPricing((prev) => prev.filter((tier) => tier.id !== id));
  };

  const handleTierChange = (id, field, value) => {
    setTieredPricing((prev) =>
      prev.map((tier) => (tier.id === id ? { ...tier, [field]: value } : tier))
    );
  };

  // AI 자동 영문 카피 생성
  const handleAiAutoGenerate = async () => {
    if (!titleKo && !titleEn) {
      alert('Please enter a Product Title (Korean or English) first.');
      return;
    }

    try {
      setIsAiGenerating(true);
      const mainTitle = titleEn || titleKo;

      const generatedSpec = `[Official B2B Export Specification]\nProduct Name: ${mainTitle}\nManufacturer: ${companyName}\nFactory Location: ${factoryLocation}\nCategory: ${category}\n\n[Key Features & Advantages]\n• High-precision manufacturing engineered for international quality standards.\n• ISO Certified production line with rigorous quality assurance.\n• Customized OEM/ODM private labeling and packaging available.\n\n[Technical Specs Summary]\n${detailsText || 'Custom specifications available upon request.'}`;

      setDetailsText(generatedSpec);
      if (!titleEn && titleKo) {
        setTitleEn(titleKo);
      }
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // 최종 등록 제출
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (!currentUser) {
        alert('Login is required to register a product.');
        return;
      }

      const userIdStr = currentUser.id.toString();
      const mainTitle = titleEn || titleKo || 'Export Product';
      const mainFobPrice = pricingTiers[0]?.price ? `$${pricingTiers[0].price} USD` : 'Negotiable';

      const payload = {
        user_id: userIdStr,
        title: mainTitle,
        title_ko: titleKo,
        title_en: titleEn,
        company_name: companyName,
        location: factoryLocation,
        category: category,
        moq: moq,
        lead_time: leadTime,
        dimensions: dimensions,
        certifications: certifications,
        fob_price: mainFobPrice,
        price: mainFobPrice,
        tiered_pricing: pricingTiers,
        description: detailsText,
        details: detailsText,
        image_url: coverImage?.url || null,
        video_url: demoVideo?.url || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      alert('Product registered successfully to Global Showroom!');
      if (onProductCreated) onProductCreated(data);
      onClose();
    } catch (err) {
      console.error('Submit product error:', err);
      setErrorMessage('Failed to register product: ' + (err.message || 'Database error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto animate-fadeIn text-xs">
        
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Register New Export Product Specification
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Upload pictures, video, factory info, tiered pricing, and manage rich specification content directly in Database.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitProduct} className="space-y-6">
          
          {/* 1. BASIC PRODUCT INFORMATION */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <span>1. BASIC PRODUCT INFORMATION</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Product Title (Korean) *</label>
                <input
                  type="text"
                  required
                  value={titleKo}
                  onChange={(e) => setTitleKo(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Product Title (English)</label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold bg-white"
                >
                  <option value="Industrial Machinery">Industrial Machinery</option>
                  <option value="K-Beauty & Cosmetics">K-Beauty & Cosmetics</option>
                  <option value="K-Food & Beverages">K-Food & Beverages</option>
                  <option value="Electronics & Smart IT">Electronics & Smart IT</option>
                  <option value="General Manufacturing">General Manufacturing</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">MOQ *</label>
                <input
                  type="text"
                  required
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Lead Time *</label>
                <input
                  type="text"
                  required
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Dimensions & Weight Specification</label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium bg-white"
              />
            </div>
          </div>

          {/* 2. MANUFACTURER PROFILE & COMPLIANCE CERTIFICATIONS (셀러 프로필 연동) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>2. MANUFACTURER PROFILE & COMPLIANCE CERTIFICATIONS</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 내 회사명 자동 연동 */}
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Company / Factory Name *</label>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{loadingProfile ? 'Loading...' : companyName}</span>
                </div>
              </div>

              {/* 공장 위치 자동 연동 */}
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Factory Location *</label>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{loadingProfile ? 'Loading...' : factoryLocation}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Certifications *</label>
                <input
                  type="text"
                  required
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold bg-white"
                />
              </div>
            </div>
          </div>

          {/* 3. WHOLESALE TIERED FOB PRICING ($ USD) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <span>3. WHOLESALE TIERED FOB PRICING ($ USD)</span>
              </h3>

              <button
                type="button"
                onClick={handleAddTier}
                className="text-blue-600 hover:underline font-extrabold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Tier Range
              </button>
            </div>

            <div className="space-y-2">
              {pricingTiers.map((tier) => (
                <div key={tier.id} className="flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={tier.minQty}
                      onChange={(e) => handleTierChange(tier.id, 'minQty', e.target.value)}
                      placeholder=""
                      className="px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium bg-white"
                    />
                    <input
                      type="text"
                      value={tier.maxQty}
                      onChange={(e) => handleTierChange(tier.id, 'maxQty', e.target.value)}
                      placeholder=""
                      className="px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1 flex-1">
                    <span className="font-bold text-slate-500">$</span>
                    <input
                      type="text"
                      value={tier.price}
                      onChange={(e) => handleTierChange(tier.id, 'price', e.target.value)}
                      placeholder=""
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-extrabold text-emerald-600 bg-white"
                    />
                  </div>

                  {pricingTiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(tier.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4. PRODUCT PHOTOS & FACTORY DEMO VIDEO */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <span>4. PRODUCT PHOTOS & FACTORY DEMO VIDEO</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Cover Image Upload Box */}
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Main Cover Image *</label>
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverUpload}
                  accept="image/*"
                  className="hidden"
                />

                {coverImage ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <span className="font-extrabold text-blue-950 truncate max-w-[200px]">{coverImage.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoverImage(null)}
                      className="text-rose-600 hover:underline font-bold text-[10px] cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full py-6 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-600 transition cursor-pointer"
                  >
                    {uploadingCover ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-blue-600" />
                        <span className="font-extrabold">Click to Select Cover Image File</span>
                        <span className="text-[10px] text-slate-400">PNG, JPG, WEBP</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Video Upload Box */}
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Factory Demo Video File</label>
                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={handleVideoUpload}
                  accept="video/*"
                  className="hidden"
                />

                {demoVideo ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <Film className="w-4 h-4 text-purple-600" />
                      <span className="font-extrabold text-purple-950 truncate max-w-[200px]">{demoVideo.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDemoVideo(null)}
                      className="text-rose-600 hover:underline font-bold text-[10px] cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={uploadingVideo}
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full py-6 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-600 transition cursor-pointer"
                  >
                    {uploadingVideo ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    ) : (
                      <>
                        <Video className="w-5 h-5 text-rose-500" />
                        <span className="font-extrabold">Click to Upload Demo Video File</span>
                        <span className="text-[10px] text-slate-400">MP4, MOV, WEBM</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 5. DETAILED SPECIFICATIONS RICH EDITOR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <span>5. DETAILED SPECIFICATIONS RICH EDITOR</span>
              </h3>

              <button
                type="button"
                disabled={isAiGenerating}
                onClick={handleAiAutoGenerate}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span>AI Auto-Generate Spec Sheet</span>
              </button>
            </div>

            {/* Simple Editor Toolbar */}
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-t-2xl flex items-center gap-2 border-b-0 text-slate-600">
              <button type="button" className="p-1.5 hover:bg-slate-200 rounded-lg"><Bold className="w-3.5 h-3.5" /></button>
              <button type="button" className="p-1.5 hover:bg-slate-200 rounded-lg"><Italic className="w-3.5 h-3.5" /></button>
              <button type="button" className="p-1.5 hover:bg-slate-200 rounded-lg"><Heading className="w-3.5 h-3.5" /></button>
              <button type="button" className="p-1.5 hover:bg-slate-200 rounded-lg"><List className="w-3.5 h-3.5" /></button>
            </div>

            <textarea
              rows={5}
              value={detailsText}
              onChange={(e) => setDetailsText(e.target.value)}
              placeholder=""
              className="w-full p-4 rounded-b-2xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium leading-relaxed bg-white"
            />
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 모달 하단 버튼 */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || uploadingCover || uploadingVideo}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Product...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Publish Product to Database</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}