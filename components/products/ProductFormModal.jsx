'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import ImageCropModal from '@/components/products/ImageCropModal';
import { sanitizeProductHtml } from '@/lib/sanitizeHtml';

export default function ProductFormModal({ isOpen, onClose, onProductCreated, isEditMode = false, initialData = null, onSubmit = null, adminMode = false, targetUserId = null, targetCompanyName = null, targetCompanyLocation = null }) {
  const router = useRouter();
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
  const [hsCode, setHsCode] = useState('');

  const [certifications, setCertifications] = useState('');

  // OEM/ODM 지원 여부 — 셀러가 직접 선택하기 전까지는 미정 상태 (섣불리 "가능"으로 단정하지 않음)
  const [oemOdmAvailable, setOemOdmAvailable] = useState('');
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
  // 대표 사진 자르기 모달에 띄울 원본 이미지 (선택 직후, 업로드 전 단계)
  const [coverCropSrc, setCoverCropSrc] = useState(null);
  const [demoVideo, setDemoVideo] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // 추가 갤러리 사진 (복수)
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  // 갤러리 사진도 대표 사진처럼 한 장씩 자르기 모달을 거친 뒤 업로드 — 여러 장을 고르면 큐에 쌓아서 순서대로 처리
  const [galleryCropQueue, setGalleryCropQueue] = useState([]);

  // 상세 설명 본문에 삽입하는 사진 업로드
  const [uploadingDetailImage, setUploadingDetailImage] = useState(false);

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
  const detailImageInputRef = useRef(null);
  const detailsEditorRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        populateFromInitialData(initialData);
      } else if (adminMode) {
        resetForm();
        setLoadingProfile(false);
        setCompanyName(targetCompanyName || '');
        setFactoryLocation(targetCompanyLocation || 'South Korea');
      } else {
        resetForm();
        fetchSellerProfile();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditMode, initialData, adminMode]);

  // 상세 설명 에디터: 코드(태그)가 아니라 실제 렌더링된 모습(사진 포함)을 그대로 보여주기 위해
  // textarea 대신 contentEditable을 쓴다. AI 자동생성/사진삽입/서식버튼처럼 state가 바깥에서
  // 바뀔 때만 DOM에 반영하고, 사용자가 직접 타이핑할 때는 건드리지 않아 커서가 안 튀게 한다.
  useEffect(() => {
    if (detailsEditorRef.current && detailsEditorRef.current.innerHTML !== detailsText) {
      detailsEditorRef.current.innerHTML = sanitizeProductHtml(detailsText);
    }
  }, [detailsText]);

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
    setHsCode(data.hs_code || '');
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
      setOemOdmAvailable('');
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
    setHsCode('');
    setCertifications('');
    setOemOdmAvailable('');
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

        const activeName = compProf?.company_name_en || compProf?.company_name || meta.company_name_en || meta.company_name || 'Company Name Not Registered';
        const activeLoc = compProf?.location || 'South Korea';

        setCompanyName(activeName);
        setFactoryLocation(activeLoc);
      } else {
        // 로그인하지 않은 방문자는 등록 폼을 채울 수 없도록 즉시 닫고 로그인 페이지로 보낸다
        alert('상품을 등록하려면 셀러로 로그인해야 합니다.');
        onClose();
        router.push('/login');
        return;
      }
    } catch (err) {
      console.error('Error fetching seller profile:', err);
      setCompanyName('Company Name Not Registered');
      setFactoryLocation('South Korea');
    } finally {
      setLoadingProfile(false);
    }
  };

  // 대표 사진은 바로 업로드하지 않고, 먼저 자르기 모달을 띄운다
  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverCropSrc(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCoverCropConfirm = async (blob) => {
    setCoverCropSrc(null);
    try {
      setUploadingCover(true);
      const fileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
      const filePath = `product_covers/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('company-images')
        .upload(filePath, blob);

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('company-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setCoverImage({ name: fileName, url: publicUrlData.publicUrl });
      }
    } catch (err) {
      console.error('Cover upload error:', err);
      alert('대표 사진 업로드에 실패했습니다: ' + (err.message || 'Storage error'));
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
      alert('영상 업로드에 실패했습니다: ' + (err.message || 'Storage error'));
    } finally {
      setUploadingVideo(false);
    }
  };

  // 갤러리 사진 여러 장 선택 → 바로 업로드하지 않고 한 장씩 자르기 큐에 넣는다
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (files.length === 0) return;

    const dataUrls = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));

    setGalleryCropQueue((prev) => [...prev, ...dataUrls]);
  };

  // 큐의 맨 앞 사진을 자른 뒤 업로드하고, 큐에서 빼서 다음 사진으로 넘어간다
  const handleGalleryCropConfirm = async (blob) => {
    try {
      setUploadingGallery(true);
      const fileName = `gallery_${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
      const filePath = `product_gallery/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('company-images')
        .upload(filePath, blob);

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('company-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setGalleryImages((prev) => [...prev, { name: fileName, url: publicUrlData.publicUrl }]);
      }
    } catch (err) {
      console.error('Gallery upload error:', err);
      alert('사진 업로드에 실패했습니다: ' + (err.message || 'Storage error'));
    } finally {
      setUploadingGallery(false);
      setGalleryCropQueue((prev) => prev.slice(1));
    }
  };

  // 자르기를 취소하면 그 사진만 건너뛰고 큐의 다음 사진으로
  const handleGalleryCropSkip = () => {
    setGalleryCropQueue((prev) => prev.slice(1));
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
      alert('상품명을 먼저 입력해주세요 (한글 또는 영문).');
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
      alert('상품명을 먼저 입력해주세요 (한글 또는 영문).');
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

  // 상세 설명 서식 툴바 — 굵게/기울임/제목/목록 태그를 본문 끝에 덧붙인다
  // (EditCompanyModal.jsx의 회사 소개글 에디터와 동일한 패턴)
  const handleInsertEditorTag = (tagType) => {
    const tags = {
      bold: ['<b>', '</b>'],
      italic: ['<i>', '</i>'],
      heading: ['<h3>', '</h3>'],
      list: ['<ul>\n  <li>', '</li>\n</ul>']
    };
    const [prefix, suffix] = tags[tagType] || [];
    if (!prefix) return;
    setDetailsText((prev) => (prev || '') + `\n${prefix}${suffix}`);
  };

  // 상세 설명 본문에 넣을 사진 업로드 — 업로드 후 <img> 태그를 본문 끝에 삽입
  const handleDetailImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDetailImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `detail_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `product_detail_images/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('company-images')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('company-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        const imgTag = `<img src="${publicUrlData.publicUrl}" alt="Product Detail Image" class="w-full my-3 rounded-2xl border" />`;
        setDetailsText((prev) => `${imgTag}\n${prev || ''}`);
      }
    } catch (err) {
      console.error('Detail image upload error:', err);
      alert('상세 설명 사진 업로드에 실패했습니다: ' + (err.message || 'Storage error'));
    } finally {
      setUploadingDetailImage(false);
      if (detailImageInputRef.current) detailImageInputRef.current.value = '';
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
        hs_code: hsCode,
        certifications: certifications || '',
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

      // 관리자 대행 등록: 서비스 롤로 우회 삽입하는 관리자 전용 API 호출
      if (adminMode) {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/admin/create-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
          body: JSON.stringify({ ...payload, targetUserId })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || '상품 등록에 실패했습니다.');

        alert('상품이 성공적으로 등록되었습니다!');
        if (onProductCreated) onProductCreated(json.product);
        onClose();
        return;
      }

      // 등록 모드: 신규 상품 insert
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (!currentUser) {
        alert('상품을 등록하려면 로그인이 필요합니다.');
        return;
      }

      const userIdStr = currentUser.id.toString();

      const { data, error } = await supabase
        .from('products')
        .insert([{ ...payload, user_id: userIdStr, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;

      alert('상품이 성공적으로 등록되었습니다!');
      if (onProductCreated) onProductCreated(data);
      onClose();
    } catch (err) {
      console.error('Submit product error:', err);
      setErrorMessage(`상품 ${isEditMode ? '수정' : '등록'}에 실패했습니다: ` + (err.message || 'Database error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
    {coverCropSrc && (
      <ImageCropModal
        imageSrc={coverCropSrc}
        aspect={1}
        onCancel={() => setCoverCropSrc(null)}
        onConfirm={handleCoverCropConfirm}
      />
    )}
    {galleryCropQueue.length > 0 && (
      <ImageCropModal
        key={galleryCropQueue.length}
        imageSrc={galleryCropQueue[0]}
        aspect={1}
        onCancel={handleGalleryCropSkip}
        onConfirm={handleGalleryCropConfirm}
      />
    )}
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto animate-fadeIn text-sm">

        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="space-y-1">
            <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              {isEditMode ? '수출 상품 정보 수정' : '신규 수출 상품 등록'}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {isEditMode
                ? '사진, 영상, 공장 정보, 수량별 가격, 상세 설명을 수정할 수 있어요. 모두 나중에 다시 고칠 수 있습니다.'
                : '아래 순서대로 하나씩 입력해주세요. 사진, 영상, 공장 정보, 수량별 가격, 상세 설명 — 전부 나중에 수정 가능합니다.'}
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

        {/* 진행 단계 표시 바 — 클릭하면 해당 섹션으로 스크롤 이동 */}
        <div className="sticky top-0 z-10 -mx-6 md:-mx-8 px-6 md:px-8 py-2 bg-white/95 backdrop-blur-sm border-b border-slate-100 flex items-center gap-1 overflow-x-auto text-[11px] font-bold text-slate-500">
          {[
            { id: 'product-form-section-1', label: '1.기본정보' },
            { id: 'product-form-section-2', label: '2.제조사' },
            { id: 'product-form-section-3', label: '3.스펙표' },
            { id: 'product-form-section-4', label: '4.가격' },
            { id: 'product-form-section-5', label: '5.사진/영상' },
            { id: 'product-form-section-6', label: '6.AI요약' },
            { id: 'product-form-section-7', label: '7.상세설명' },
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="px-2.5 py-1 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition whitespace-nowrap cursor-pointer"
            >
              {step.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmitProduct} className="space-y-6 mt-6">

          {/* 1. 기본 정보 */}
          <div id="product-form-section-1" className="space-y-3">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <span>1단계. 기본 상품 정보</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">상품명 (한글) *</label>
                <input
                  type="text"
                  required
                  value={titleKo}
                  onChange={(e) => setTitleKo(e.target.value)}
                  placeholder="예: 고압 유압 밸브"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">상품명 (영문, 비워두면 AI가 자동 번역)</label>
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
              <label className="block text-slate-700 font-extrabold mb-1">한 줄 소개 (핵심 세일즈 포인트)</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="예: 24시간 연속 가동에도 견디는 산업용 고압 유압 밸브"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">카테고리 *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold bg-white"
                >
                  <option value="Industrial Machinery">산업 기계</option>
                  <option value="K-Beauty & Cosmetics">K-뷰티 / 화장품</option>
                  <option value="K-Food & Beverages">K-푸드 / 음료</option>
                  <option value="Electronics & Smart IT">전자 / 스마트 IT</option>
                  <option value="General Manufacturing">일반 제조업 / 기타</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">최소 주문 수량 (MOQ) *</label>
                <input
                  type="text"
                  required
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                  placeholder="예: 500개"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">제작/납기 기간 *</label>
                <input
                  type="text"
                  required
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  placeholder="예: 15-20일"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">크기 및 무게 정보 (선택)</label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="예: 30 x 20 x 15 cm, 2.5kg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">HS 코드 (선택)</label>
                <input
                  type="text"
                  value={hsCode}
                  onChange={(e) => setHsCode(e.target.value)}
                  placeholder="예: 8481.80"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium bg-white"
                />
              </div>
            </div>
          </div>

          {/* 2. 제조사 프로필 & 인증 & OEM/ODM */}
          <div id="product-form-section-2" className="space-y-3">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>2단계. 제조사 정보 및 인증</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">회사 / 공장명 *</label>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{loadingProfile ? '불러오는 중...' : companyName}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">공장 위치 *</label>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{loadingProfile ? '불러오는 중...' : factoryLocation}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">보유 인증 (선택)</label>
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="예: ISO 9001, CE 인증"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold bg-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-slate-700 font-extrabold flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5 text-blue-600" /> OEM / ODM 가능 여부
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={oemOdmAvailable}
                  onChange={(e) => setOemOdmAvailable(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold bg-white"
                >
                  <option value="" disabled>선택해주세요</option>
                  <option value="Available">가능</option>
                  <option value="Not Available">불가능</option>
                </select>

                <input
                  type="text"
                  value={oemOdmNote}
                  onChange={(e) => setOemOdmNote(e.target.value)}
                  placeholder="예: 로고 각인, 맞춤 포장 가능 (최소 500개부터)"
                  disabled={oemOdmAvailable !== 'Available'}
                  className="md:col-span-2 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium bg-white disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* 3. 제품 속성 스펙 테이블 */}
          <div id="product-form-section-3" className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>3단계. 상세 스펙표</span>
              </h3>

              <button
                type="button"
                onClick={handleAddAttribute}
                className="text-blue-600 hover:underline font-extrabold text-sm flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> 항목 추가
              </button>
            </div>

            <p className="text-sm text-slate-400">예: 모델명 / 재질 / 작동 압력 / 원산지 — 바이어가 궁금해할 만한 정보를 자유롭게 추가하세요.</p>

            <div className="space-y-2">
              {attributes.map((attr) => (
                <div key={attr.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={attr.name}
                      onChange={(e) => handleAttributeChange(attr.id, 'name', e.target.value)}
                      placeholder="항목명 (예: 모델명)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-slate-900 bg-white"
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => handleAttributeChange(attr.id, 'value', e.target.value)}
                      placeholder="값 (예: HV-300-KR)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900 bg-white"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(attr.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      title="삭제"
                    >
                      <X className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. 수량별 단가 */}
          <div id="product-form-section-4" className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <span>4단계. 수량별 단가 (달러 기준)</span>
              </h3>

              <button
                type="button"
                onClick={handleAddTier}
                className="text-blue-600 hover:underline font-extrabold text-sm flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> 구간 추가
              </button>
            </div>

            <p className="text-sm text-slate-400">주문 수량이 많아질수록 개당 가격을 낮게 매길 수 있어요. 구간을 나눠서 입력해주세요.</p>

            <div className="grid grid-cols-12 gap-3 text-sm font-extrabold text-slate-700 px-1">
              <div className="col-span-3">최소 수량</div>
              <div className="col-span-3">최대 수량</div>
              <div className="col-span-5">개당 가격 (USD)</div>
              <div className="col-span-1 text-center">삭제</div>
            </div>

            <div className="space-y-2">
              {pricingTiers.map((tier) => (
                <div key={tier.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={tier.minQty}
                      onChange={(e) => handleTierChange(tier.id, 'minQty', e.target.value)}
                      placeholder="예: 100"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-slate-900 bg-white"
                    />
                  </div>

                  <div className="col-span-3">
                    <input
                      type="text"
                      value={tier.maxQty}
                      onChange={(e) => handleTierChange(tier.id, 'maxQty', e.target.value)}
                      placeholder="예: 499"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-slate-900 bg-white"
                    />
                  </div>

                  <div className="col-span-5 flex items-center gap-1">
                    <span className="font-extrabold text-slate-500">$</span>
                    <input
                      type="text"
                      value={tier.price}
                      onChange={(e) => handleTierChange(tier.id, 'price', e.target.value)}
                      placeholder="개당 가격"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-extrabold text-emerald-600 bg-white"
                    />
                  </div>

                  <div className="col-span-1 text-center">
                    {pricingTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(tier.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="삭제"
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
          <div id="product-form-section-5" className="space-y-3">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <span>5단계. 상품 사진 및 공장 영상</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">대표 사진 *</label>
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
                      className="text-rose-600 hover:underline font-bold text-sm cursor-pointer"
                    >
                      삭제
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
                        <span className="font-extrabold">클릭해서 대표 사진 올리기</span>
                        <span className="text-sm text-slate-400">PNG, JPG, WEBP</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">공장 소개 영상 (선택)</label>
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
                      className="text-rose-600 hover:underline font-bold text-sm cursor-pointer"
                    >
                      삭제
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
                        <span className="font-extrabold">클릭해서 영상 올리기</span>
                        <span className="text-sm text-slate-400">MP4, MOV, WEBM</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-extrabold mb-1">추가 사진 (여러 장 올릴 수 있어요)</label>
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
                    <span className="font-extrabold">사진 추가하기</span>
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
          <div id="product-form-section-6" className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>6단계. AI 짧은 요약</span>
              </h3>

              <button
                type="button"
                disabled={isAiSummaryGenerating}
                onClick={handleAiSummaryGenerate}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAiSummaryGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span>AI로 요약 만들기</span>
              </button>
            </div>

            <p className="text-sm text-slate-400">상품 상세페이지 맨 위에 보이는 2~3문장 요약이에요. 위 정보를 입력한 뒤 버튼을 누르면 AI가 자동으로 써줍니다. 직접 수정도 가능해요.</p>

            <textarea
              rows={3}
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              placeholder=""
              className="w-full p-4 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium leading-relaxed bg-white"
            />
          </div>

          {/* 7. 상세 스펙 에디터 (전체 상세페이지 설명) */}
          <div id="product-form-section-7" className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <span>7단계. 상세 설명 (전체 상세페이지)</span>
              </h3>

              <button
                type="button"
                disabled={isAiGenerating}
                onClick={handleAiAutoGenerate}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span>AI로 전체 상세페이지 자동 작성</span>
              </button>
            </div>

            <p className="text-sm text-slate-400">타이틀과 스펙만 입력했다면, 버튼 한 번으로 AI가 영문 상세 설명 전체를 자동으로 써드려요. 사진 아이콘을 누르면 상세페이지 본문에 사진을 넣을 수 있어요. 이후 직접 수정도 가능합니다.</p>

            <input
              type="file"
              ref={detailImageInputRef}
              onChange={handleDetailImageUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="p-2 bg-slate-50 border border-slate-200 rounded-t-2xl flex items-center gap-2 border-b-0 text-slate-600">
              <button type="button" onClick={() => handleInsertEditorTag('bold')} title="굵게" className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"><Bold className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => handleInsertEditorTag('italic')} title="기울임" className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"><Italic className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => handleInsertEditorTag('heading')} title="제목" className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"><Heading className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => handleInsertEditorTag('list')} title="목록" className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"><List className="w-3.5 h-3.5" /></button>
              <div className="w-px h-4 bg-slate-300 mx-0.5" />
              <button
                type="button"
                disabled={uploadingDetailImage}
                onClick={() => detailImageInputRef.current?.click()}
                title="사진 삽입"
                className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
              >
                {uploadingDetailImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div
              ref={detailsEditorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setDetailsText(e.currentTarget.innerHTML)}
              data-placeholder="상품 상세 설명을 입력하세요. 사진 아이콘으로 넣은 사진은 바로 여기에 보입니다."
              className="empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 whitespace-pre-wrap w-full min-h-[140px] p-4 rounded-b-2xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium leading-relaxed bg-white prose prose-sm max-w-none"
            />
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2 font-medium">
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
              취소
            </button>

            <button
              type="submit"
              disabled={isSubmitting || uploadingCover || uploadingVideo || uploadingGallery || uploadingDetailImage}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEditMode ? '저장 중...' : '등록 중...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isEditMode ? '변경사항 저장' : '상품 등록하기'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
    </>
  );
}
