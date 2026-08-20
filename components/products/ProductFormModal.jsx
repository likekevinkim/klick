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
  AlertCircle,
  Layers,
  Factory
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ProductFormModal({ isOpen, onClose, onProductCreated, isEditMode = false, initialData = null, onSubmit = null }) {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [factoryLocation, setFactoryLocation] = useState('South Korea');

  const [titleKo, setTitleKo] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('Industrial Machinery');
  const [moq, setMoq] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [dimensions, setDimensions] = useState('');

  const [certifications, setCertifications] = useState('');

  // OEM/ODM 지원 여부
  const [oemOdmAvailable, setOemOdmAvailable] = useState('Available');
  const [oemOdmNote, setOemOdmNote] = useState('');

  const [pricingTiers, setTieredPricing] = useState([
    { id: 1, minQty: '', maxQty: '', price: '' },
    { id: 2, minQty: '', maxQty: '', price: '' }
  ]);

  // 제품 속성 스펙 테이블 (반복 입력)
  const [attributes, setAttributes] = useState([
    { id: 1, name: '', value: '' },
    { id: 2, name: '', value: '' },
    { id: 3, name: '', value: '' }
  ]);

  const [coverImage, setCoverImage] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [demoVideo, setDemoVideo] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // 추가 갤러리 사진 (복수)
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // AI 짧은 요약 (바이어에게 가장 먼저 보이는 요약문)
  const [aiSummary, setAiSummary] = useState('');
  const [isAiSummaryGenerating, setIsAiSummaryGenerating] = useState(false);

  const [detailsText, setDetailsText] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const coverInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        populateFromInitialData(initialData);
      } else {
        resetForm();
        fetchSellerProfile();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditMode, initialData]);

  // 수정 모드: 기존 제품 데이터를 폼 필드에 채워넣기
  const populateFromInitialData = (data) => {
    setLoadingProfile(false);
    setTitleKo(data.title_ko || data.title || '');
    setTitleEn(data.title_en || data.title || '');
    setTagline(data.tagline || '');
    setCompanyName(data.company_name || '');
    setFactoryLocation(data.location || 'South Korea');
    setCategory(data.category || 'Industrial Machinery');
    setMoq(data.moq || '');
    setLeadTime(data.lead_time || '');
    setDimensions(data.dimensions || '');
    setCertifications(data.certifications && data.certifications !== 'Standard Production Spec' ? data.certifications : '');

    // OEM/ODM 문자열 파싱 ("Available - note" 또는 "Not Available")
    if (data.oem_odm) {
      if (data.oem_odm.toLowerCase().startsWith('not available')) {
        setOemOdmAvailable('Not Available');
        setOemOdmNote('');
      } else {
        setOemOdmAvailable('Available');
        const sepIdx = data.oem_odm.indexOf(' - ');
        setOemOdmNote(sepIdx >= 0 ? data.oem_odm.slice(sepIdx + 3) : '');
      }
    } else {
      setOemOdmAvailable('Available');
      setOemOdmNote('');
    }

    setTieredPricing(
      Array.isArray(data.tiered_pricing) && data.tiered_pricing.length > 0
        ? data.tiered_pricing.map((t, idx) => ({ id: t.id || Date.now() + idx, minQty: t.minQty || '', maxQty: t.maxQty || '', price: t.price || '' }))
        : [
            { id: 1, minQty: '', maxQty: '', price: '' },
            { id: 2, minQty: '', maxQty: '', price: '' }
          ]
    );

    setAttributes(
      Array.isArray(data.attributes) && data.attributes.length > 0
        ? data.attributes.map((a, idx) => ({ id: Date.now() + idx, name: a.name || '', value: a.value || '' }))
        : [
            { id: 1, name: '', value: '' },
            { id: 2, name: '', value: '' },
            { id: 3, name: '', value: '' }
          ]
    );

    setCoverImage(data.image_url ? { name: 'Current Cover Image', url: data.image_url } : null);
    setDemoVideo(data.video_url ? { name: 'Current Demo Video', url: data.video_url } : null);

    const galleryUrls = Array.isArray(data.gallery_images) ? data.gallery_images : [];
    setGalleryImages(galleryUrls.map((url, idx) => ({ name: `Gallery Image ${idx + 1}`, url })));

    setAiSummary(data.ai_summary || '');
    setDetailsText(data.description || data.details || '');
  };

  // 등록 모드: 새로 열 때마다 폼 초기화
  const resetForm = () => {
    setTitleKo('');
    setTitleEn('');
    setTagline('');
    setCategory('Industrial Machinery');
    setMoq('');
    setLeadTime('');
    setDimensions('');
    setCertifications('');
    setOemOdmAvailable('Available');
    setOemOdmNote('');
    setTieredPricing([
      { id: 1, minQty: '', maxQty: '', price: '' },
      { id: 2, minQty: '', maxQty: '', price: '' }
    ]);
    setAttributes([
      { id: 1, name: '', value: '' },
      { id: 2, name: '', value: '' },
      { id: 3, name: '', value: '' }
    ]);
    setCoverImage(null);
    setDemoVideo(null);
    setGalleryImages([]);
    setAiSummary('');
    setDetailsText('');
    setErrorMessage('');
  };

  const fetchSellerProfile = async () => {
    try {
      setLoadingProfile(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (currentUser) {
        const userIdStr = currentUser.id.toString();

        const { data: compProf } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', userIdStr)
          .maybeSingle();

        const meta = currentUser.user_metadata || {};

        const activeName = compProf?.company_name_en || compProf?.company_name || meta.company_name_en || meta.company_name || 'Hankook Precision Co., Ltd.';
        const activeLoc = compProf?.location || 'South Korea';

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

  // 갤러리 사진 여러 장 업로드 (알리바바 상세페이지 스타일 멀티 이미지)
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingGallery(true);
      const uploaded = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `gallery_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `product_gallery/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('company-images')
          .upload(filePath, file);

        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = supabase.storage
          .from('company-images')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          uploaded.push({ name: file.name, url: publicUrlData.publicUrl });
        }
      }

      setGalleryImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error('Gallery upload error:', err);
      alert('Failed to upload gallery photos: ' + (err.message || 'Storage error'));
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleRemoveGalleryImage = (idx) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== idx));
  };

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

  // 제품 속성 스펙 테이블 핸들러 (Model No., 재질, 인증 등 자유 입력)
  const handleAddAttribute = () => {
    setAttributes((prev) => [...prev, { id: Date.now(), name: '', value: '' }]);
  };

  const handleRemoveAttribute = (id) => {
    setAttributes((prev) => prev.filter((attr) => attr.id !== id));
  };

  const handleAttributeChange = (id, field, value) => {
    setAttributes((prev) =>
      prev.map((attr) => (attr.id === id ? { ...attr, [field]: value } : attr))
    );
  };

  // AI 짧은 요약 생성 (바이어가 제일 먼저 읽는 3줄 요약)
  const handleAiSummaryGenerate = async () => {
    if (!titleKo && !titleEn) {
      alert('Please enter a Product Title (Korean or English) first.');
      return;
    }

    try {
      setIsAiSummaryGenerating(true);
      const mainTitle = titleEn || titleKo;
      const validAttrs = attributes.filter((a) => a.name.trim() && a.value.trim());

      const res = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'summary',
          title: mainTitle,
          category,
          companyName,
          attributes: validAttrs,
          certifications,
          moq,
          leadTime
        })
      });

      const data = await res.json();

      if (data?.generatedText) {
        setAiSummary(data.generatedText);
      } else {
        setAiSummary(
          `${mainTitle} is a factory-direct export product manufactured by ${companyName || 'a verified Korean supplier'} in ${factoryLocation}. It ships with MOQ ${moq || 'negotiable'} and a lead time of ${leadTime || '15-20 days'}, backed by ${certifications || 'standard export certification'}.`
        );
      }
    } catch (err) {
      console.error('AI summary generation error:', err);
      setAiSummary(
        `${titleEn || titleKo} is a factory-direct export product manufactured by ${companyName || 'a verified Korean supplier'} in ${factoryLocation}.`
      );
    } finally {
      setIsAiSummaryGenerating(false);
    }
  };

  const handleAiAutoGenerate = async () => {
    if (!titleKo && !titleEn) {
      alert('Please enter a Product Title (Korean or English) first.');
      return;
    }

    try {
      setIsAiGenerating(true);
      const mainTitle = titleEn || titleKo;
      const validAttrs = attributes.filter((a) => a.name.trim() && a.value.trim());

      const res = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'full',
          title: mainTitle,
          titleKo,
          titleEn,
          category,
          companyName,
          factoryLocation,
          attributes: validAttrs,
          certifications,
          moq,
          leadTime,
          detailsText
        })
      });

      const data = await res.json();

      if (data?.generatedText) {
        setDetailsText(data.generatedText);
        if (!titleEn && data.titleEn) setTitleEn(data.titleEn);
        if (!tagline && data.tagline) setTagline(data.tagline);
      } else {
        throw new Error(data?.error || 'AI generation returned no content.');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      const mainTitle = titleEn || titleKo;
      // 실패 시에도 폼이 비어있지 않도록 기본 템플릿으로 대체
      const fallbackSpec = `[Official B2B Export Specification]\nProduct Name: ${mainTitle}\nManufacturer: ${companyName}\nFactory Location: ${factoryLocation}\nCategory: ${category}\n\n[Key Features & Advantages]\n• High-precision manufacturing engineered for international quality standards.\n• ISO Certified production line with rigorous quality assurance.\n• Customized OEM/ODM private labeling and packaging available.\n\n[Technical Specs Summary]\n${detailsText || 'Custom specifications available upon request.'}`;
      setDetailsText(fallbackSpec);
      if (!titleEn && titleKo) setTitleEn(titleKo);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const mainTitle = titleEn || titleKo || 'Export Product';
      const mainFobPrice = pricingTiers[0]?.price ? `$${pricingTiers[0].price} USD` : 'Negotiable';

      const fullDescription = dimensions
        ? `${detailsText}\n\n[Product Dimensions & Weight]\n${dimensions}`
        : detailsText;

      const validAttributes = attributes
        .filter((a) => a.name.trim() && a.value.trim())
        .map((a) => ({ name: a.name.trim(), value: a.value.trim() }));

      const oemOdmValue = oemOdmAvailable === 'Available'
        ? `Available${oemOdmNote.trim() ? ' - ' + oemOdmNote.trim() : ''}`
        : 'Not Available';

      const payload = {
        title: mainTitle,
        title_ko: titleKo,
        title_en: titleEn,
        tagline: tagline,
        company_name: companyName,
        location: factoryLocation,
        category: category,
        moq: moq,
        lead_time: leadTime,
        dimensions: dimensions,
        certifications: certifications || 'Standard Production Spec',
        oem_odm: oemOdmValue,
        fob_price: mainFobPrice,
        price: mainFobPrice,
        tiered_pricing: pricingTiers,
        attributes: validAttributes,
        ai_summary: aiSummary,
        description: fullDescription,
        details: fullDescription,
        image_url: coverImage?.url || null,
        gallery_images: galleryImages.map((g) => g.url),
        video_url: demoVideo?.url || null,
        updated_at: new Date().toISOString()
      };

      // 수정 모드: 실제 DB 업데이트는 부모(onSubmit)에게 위임
      if (isEditMode && onSubmit) {
        await onSubmit(payload);
        return;
      }

      // 등록 모드: 신규 상품 insert
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (!currentUser) {
        alert('Login is required to register a product.');
        return;
      }

      const userIdStr = currentUser.id.toString();

      const { data, error } = await supabase
        .from('products')
        .insert([{ ...payload, user_id: userIdStr, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;

      alert('Product registered successfully to Global Showroom!');
      if (onProductCreated) onProductCreated(data);
      onClose();
    } catch (err) {
      console.error('Submit product error:', err);
      setErrorMessage(`Failed to ${isEditMode ? 'update' : 'register'} product: ` + (err.message || 'Database error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto animate-fadeIn text-xs">

        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              {isEditMode ? 'Edit Export Product Specification' : 'Register New Export Product Specification'}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {isEditMode
                ? 'Update pictures, video, factory info, tiered pricing, and specification content for this product.'
                : 'Upload pictures, video, factory info, tiered pricing, and manage rich specification content directly in Database.'}
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

          {/* 1. 기본 정보 */}
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

            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Tagline (One-line Selling Point)</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Industrial-grade hydraulic valve engineered for 24/7 heavy operation"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900 bg-white"
              />
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

          {/* 2. 제조사 프로필 & 인증 & OEM/ODM */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>2. MANUFACTURER PROFILE, CERTIFICATIONS & OEM/ODM</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Company / Factory Name *</label>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{loadingProfile ? 'Loading...' : companyName}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Factory Location *</label>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{loadingProfile ? 'Loading...' : factoryLocation}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Certifications (Optional)</label>
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="e.g. ISO 9001, CE Certified"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold bg-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-slate-700 font-extrabold flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5 text-blue-600" /> OEM / ODM Support
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={oemOdmAvailable}
                  onChange={(e) => setOemOdmAvailable(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold bg-white"
                >
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                </select>

                <input
                  type="text"
                  value={oemOdmNote}
                  onChange={(e) => setOemOdmNote(e.target.value)}
                  placeholder="e.g. Custom logo, packaging, private label (min. 500 units)"
                  disabled={oemOdmAvailable !== 'Available'}
                  className="md:col-span-2 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium bg-white disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* 3. 제품 속성 스펙 테이블 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>3. PRODUCT ATTRIBUTE SPECIFICATIONS TABLE</span>
              </h3>

              <button
                type="button"
                onClick={handleAddAttribute}
                className="text-blue-600 hover:underline font-extrabold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Attribute
              </button>
            </div>

            <p className="text-[11px] text-slate-400">e.g. Model No. / Material / Working Pressure / Country of Origin</p>

            <div className="space-y-2">
              {attributes.map((attr) => (
                <div key={attr.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={attr.name}
                      onChange={(e) => handleAttributeChange(attr.id, 'name', e.target.value)}
                      placeholder="Attribute name (e.g. Model No.)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-slate-900 bg-white"
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => handleAttributeChange(attr.id, 'value', e.target.value)}
                      placeholder="Value (e.g. HV-300-KR)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900 bg-white"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(attr.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      title="Delete Attribute"
                    >
                      <X className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. 수량별 단가 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <span>4. WHOLESALE TIERED FOB PRICING ($ USD)</span>
              </h3>

              <button
                type="button"
                onClick={handleAddTier}
                className="text-blue-600 hover:underline font-extrabold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Tier Range
              </button>
            </div>

            <div className="grid grid-cols-12 gap-3 text-[11px] font-extrabold text-slate-700 px-1">
              <div className="col-span-3">Min Qty (최소 수량)</div>
              <div className="col-span-3">Max Qty (최대 수량)</div>
              <div className="col-span-5">Unit FOB Price ($ USD)</div>
              <div className="col-span-1 text-center">Del</div>
            </div>

            <div className="space-y-2">
              {pricingTiers.map((tier) => (
                <div key={tier.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={tier.minQty}
                      onChange={(e) => handleTierChange(tier.id, 'minQty', e.target.value)}
                      placeholder="Min Qty"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-slate-900 bg-white"
                    />
                  </div>

                  <div className="col-span-3">
                    <input
                      type="text"
                      value={tier.maxQty}
                      onChange={(e) => handleTierChange(tier.id, 'maxQty', e.target.value)}
                      placeholder="Max Qty"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-slate-900 bg-white"
                    />
                  </div>

                  <div className="col-span-5 flex items-center gap-1">
                    <span className="font-extrabold text-slate-500">$</span>
                    <input
                      type="text"
                      value={tier.price}
                      onChange={(e) => handleTierChange(tier.id, 'price', e.target.value)}
                      placeholder="Unit Price"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-extrabold text-emerald-600 bg-white"
                    />
                  </div>

                  <div className="col-span-1 text-center">
                    {pricingTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(tier.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="Delete Tier"
                      >
                        <X className="w-4 h-4 mx-auto" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. 사진 & 영상 */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <span>5. PRODUCT PHOTOS & FACTORY DEMO VIDEO</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Additional Gallery Photos (Multiple)</label>
              <input
                type="file"
                ref={galleryInputRef}
                onChange={handleGalleryUpload}
                accept="image/*"
                multiple
                className="hidden"
              />

              <button
                type="button"
                disabled={uploadingGallery}
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-slate-600 transition cursor-pointer mb-2"
              >
                {uploadingGallery ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span className="font-extrabold">Add Gallery Photos</span>
                  </>
                )}
              </button>

              {galleryImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {galleryImages.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 6. AI 요약 (바이어가 가장 먼저 보는 짧은 요약) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>6. AI PRODUCT SUMMARY (SHORT BUYER-FACING)</span>
              </h3>

              <button
                type="button"
                disabled={isAiSummaryGenerating}
                onClick={handleAiSummaryGenerate}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAiSummaryGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span>AI Generate Summary</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">2-3 sentence summary shown at the top of the product detail page.</p>

            <textarea
              rows={3}
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              placeholder=""
              className="w-full p-4 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium leading-relaxed bg-white"
            />
          </div>

          {/* 7. 상세 스펙 에디터 (전체 상세페이지 설명) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <span>7. DETAILED SPECIFICATIONS RICH EDITOR</span>
              </h3>

              <button
                type="button"
                disabled={isAiGenerating}
                onClick={handleAiAutoGenerate}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span>AI Auto-Generate Full Spec Sheet</span>
              </button>
            </div>

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
              disabled={isSubmitting || uploadingCover || uploadingVideo || uploadingGallery}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEditMode ? 'Saving Changes...' : 'Publishing Product...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isEditMode ? 'Save Changes' : 'Publish Product to Database'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
