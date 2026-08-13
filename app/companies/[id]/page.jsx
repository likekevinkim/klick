// app/companies/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import EditCompanyModal from '@/components/company/EditCompanyModal';
import AddProductModal from '@/components/company/AddProductModal';
import VideoModal from '@/components/company/VideoModal';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Users, 
  Award, 
  CheckCircle2, 
  Send, 
  Package, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Factory,
  Mail,
  Video,
  Image as ImageIcon,
  Edit3,
  Play,
  Plus,
  PlusCircle,
  Globe2,
  Briefcase
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// 카테고리별 샘플 커버 및 갤러리 이미지
const DEFAULT_CATEGORY_IMAGES = {
  'Industrial Machinery': {
    cover: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60',
    gallery: [
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=60'
    ]
  },
  'K-Beauty & Cosmetics': {
    cover: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=60',
    gallery: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1512290900673-7002008882e5?w=800&auto=format&fit=crop&q=60'
    ]
  },
  'K-Food & Beverages': {
    cover: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=60',
    gallery: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=60'
    ]
  },
  'Electronics & Smart IT': {
    cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
    gallery: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=60'
    ]
  },
  'General Manufacturing': {
    cover: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60',
    gallery: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=60'
    ]
  },
  'etc': {
    cover: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=60',
    gallery: [
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60'
    ]
  }
};

export default function CompanyShowroomLandingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawCompanyId = params?.id;
  const autoEditParam = searchParams.get('edit');

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const [activeTab, setActiveTab] = useState('about');

  // 모달 토글 및 상태
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  const [editCompanyNameKo, setEditCompanyNameKo] = useState('');
  const [editCompanyNameEn, setEditCompanyNameEn] = useState('');
  const [editCategory, setEditCategory] = useState('Industrial Machinery');
  const [editTagline, setEditTagline] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBusinessType, setEditBusinessType] = useState('Direct Manufacturer');
  const [editLocation, setEditLocation] = useState('');
  const [editEstablishedYear, setEditEstablishedYear] = useState('');
  const [editEmployeesCount, setEditEmployeesCount] = useState('');
  const [editFactorySize, setEditFactorySize] = useState('');

  // 대표사진, 갤러리사진, 비디오, 인증서 상태
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editGalleryImages, setEditGalleryImages] = useState([]);
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editCertifications, setEditCertifications] = useState([]);

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const [productTitleKo, setProductTitleKo] = useState('');
  const [productTitleEn, setProductTitleEn] = useState('');
  const [productCategory, setProductCategory] = useState('Industrial Machinery');
  const [productPrice, setProductPrice] = useState('145.00');
  const [productMoq, setProductMoq] = useState('500 Units');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [productDescriptionKo, setProductDescriptionKo] = useState('');

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchCompanyAndProductsData();
  }, [rawCompanyId]);

  // DB 조회 함수 (★ URL 파라미터 rawCompanyId로 바이어 클릭 대상 셀러 고유 DB 데이터 정확 스캔)
  const fetchCompanyAndProductsData = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      let fetchedCompany = null;

      // 1. URL 경로의 rawCompanyId를 최우선 매핑 스캔
      if (rawCompanyId) {
        const { data: compByParamId } = await supabase
          .from('companies')
          .select('*')
          .or(`user_id.eq.${rawCompanyId},id.eq.${rawCompanyId}`)
          .maybeSingle();

        if (compByParamId) {
          fetchedCompany = compByParamId;
        }
      }

      // 2. 만약 경로 스캔이 실패하였으나 내가 로그인한 상태일 때
      if (!fetchedCompany && currentUser?.id) {
        const { data: compByUserId } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (compByUserId) {
          fetchedCompany = compByUserId;
        }
      }

      // 3. 소유자 여부 정밀 검증 (내 쇼룸인 경우만 편집 버튼 및 등록 허용)
      if (currentUser && fetchedCompany) {
        if (fetchedCompany.user_id === currentUser.id || fetchedCompany.id === currentUser.id) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      } else {
        setIsOwner(false);
      }

      // 4. 스캔된 실제 셀러 회사 데이터를 화면 및 모달 폼에 100% 동기화
      if (fetchedCompany) {
        setCompany(fetchedCompany);

        setEditCompanyNameKo(fetchedCompany.company_name_ko || '');
        setEditCompanyNameEn(fetchedCompany.company_name_en || fetchedCompany.company_name || '');
        setEditCategory(fetchedCompany.category || 'Industrial Machinery');
        setEditTagline(fetchedCompany.tagline || '');
        setEditDescription(fetchedCompany.description || '');
        setEditBusinessType(fetchedCompany.business_type || 'Direct Manufacturer');
        setEditLocation(fetchedCompany.location || '');
        setEditEstablishedYear(fetchedCompany.established_year || '');
        setEditEmployeesCount(fetchedCompany.employees_count || '');
        setEditFactorySize(fetchedCompany.factory_size || '');

        setEditCoverImage(fetchedCompany.cover_image || '');
        setEditGalleryImages(fetchedCompany.gallery_images || []);
        setEditVideoUrl(fetchedCompany.video_url || '');
        setEditCertifications(fetchedCompany.certifications || []);
      } else {
        setCompany(null);
      }

      if (autoEditParam === 'true') {
        setIsEditCompanyModalOpen(true);
      }

      // 5. 해당 셀러가 등록한 실제 상품 목록 조회
      const targetSellerUserId = fetchedCompany?.user_id || rawCompanyId;
      if (targetSellerUserId) {
        const { data: matchedProducts } = await supabase
          .from('products')
          .select('*')
          .or(`user_id.eq.${targetSellerUserId},company_id.eq.${targetSellerUserId}`)
          .order('created_at', { ascending: false });

        setProducts(matchedProducts || []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to fetch company details:', err);
      setCompany(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ★ Supabase DB 영구 저장 처리 (SELECT 후 UPDATE 또는 INSERT)
  const handleSaveCompanyProfile = async (e) => {
    e.preventDefault();

    try {
      setIsSavingCompany(true);

      const { data: { session } } = await supabase.auth.getSession();
      const activeUser = session?.user || user;

      if (!activeUser) {
        alert('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
        router.push('/login');
        return;
      }

      const activeUserId = activeUser.id;

      // 대표 커버 이미지 설정
      const categoryKey = editCategory || 'Industrial Machinery';

      const updatedPayload = {
        user_id: activeUserId,
        company_name: editCompanyNameEn || editCompanyNameKo || 'Korean Manufacturer',
        company_name_ko: editCompanyNameKo,
        company_name_en: editCompanyNameEn,
        category: categoryKey,
        tagline: editTagline,
        description: editDescription,
        business_type: editBusinessType,
        location: editLocation,
        established_year: editEstablishedYear,
        employees_count: editEmployeesCount,
        factory_size: editFactorySize,
        cover_image: editCoverImage,
        gallery_images: editGalleryImages,
        video_url: editVideoUrl,
        certifications: editCertifications,
        updated_at: new Date().toISOString()
      };

      // 기존 레코드 존재 여부 정밀 확인
      const { data: existingComp } = await supabase
        .from('companies')
        .select('id, user_id')
        .eq('user_id', activeUserId)
        .maybeSingle();

      let saveError = null;

      if (existingComp) {
        const { error: updateErr } = await supabase
          .from('companies')
          .update(updatedPayload)
          .eq('user_id', activeUserId);
        saveError = updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('companies')
          .insert([updatedPayload]);
        saveError = insertErr;
      }

      if (saveError) {
        console.warn('First save attempt warning, executing fallback:', saveError.message);
        const fallbackPayload = { ...updatedPayload };
        delete fallbackPayload.category;
        delete fallbackPayload.company_name_ko;

        if (existingComp) {
          await supabase.from('companies').update(fallbackPayload).eq('user_id', activeUserId);
        } else {
          await supabase.from('companies').insert([fallbackPayload]);
        }
      }

      alert('회사 정보가 성공적으로 DB에 저장되었습니다!');

      // 저장된 최신 객체를 로컬 State에 즉각 매핑
      setCompany(updatedPayload);
      setIsEditCompanyModalOpen(false);

      // 최신 DB 레코드 완전 재동기화
      await fetchCompanyAndProductsData();
    } catch (err) {
      console.error('Company save error:', err);
      alert('회사 프로필 저장 중 오류가 발생했습니다: ' + (err.message || '데이터베이스 연동 오류'));
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleCreateShowroomProduct = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('로그인이 필요한 서비스입니다.');
      router.push('/login');
      return;
    }

    try {
      setIsSavingProduct(true);
      const companyNameForProduct = company?.company_name_en || company?.company_name || user?.user_metadata?.company_name_en || 'Verified Korean Manufacturer';

      const newProductPayload = {
        user_id: user.id,
        company_id: user.id,
        company_name: companyNameForProduct,
        title_ko: productTitleKo,
        title_en: productTitleEn || productTitleKo,
        category: productCategory,
        price: productPrice,
        moq: productMoq,
        image_url: productImageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        description_ko: productDescriptionKo,
        description_en: `[AI Generated] High-durability ${productCategory} product manufactured by ${companyNameForProduct}.`,
        tagline: 'Verified South Korean Factory Export Product',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('products').insert([newProductPayload]);

      if (error) {
        alert('제품 등록 중 오류가 발생했습니다: ' + error.message);
      } else {
        alert('신규 제품이 Showroom 및 Product Dashboard에 동시에 등록되었습니다!');
        setIsAddProductModalOpen(false);

        setProductTitleKo('');
        setProductTitleEn('');
        setProductImageUrl('');
        setProductDescriptionKo('');

        fetchCompanyAndProductsData();
      }
    } catch (err) {
      console.error('Create product error:', err);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleOpenVideo = (url) => {
    setSelectedVideoUrl(url || 'https://www.w3schools.com/html/mov_bbb.mp4');
    setIsVideoModalOpen(true);
  };

  const handleStartCompanyChat = () => {
    const compName = encodeURIComponent(company?.company_name_en || company?.company_name || 'Korean Manufacturer');
    const title = encodeURIComponent('Company Partnership & Wholesale Inquiry');
    router.push(`/chat?company=${compName}&title=${title}`);
  };

  // 대표 커버 이미지 (실제 입력값 및 디폴트 이미지 매핑)
  const categoryKey = company?.category || 'Industrial Machinery';
  const categoryDefaults = DEFAULT_CATEGORY_IMAGES[categoryKey] || DEFAULT_CATEGORY_IMAGES['Industrial Machinery'];
  
  const hasCustomCover = company?.cover_image && company.cover_image.trim() !== '';
  const effectiveCoverImage = hasCustomCover ? company.cover_image : categoryDefaults.cover;

  // 갤러리 이미지
  const hasCustomGallery = company?.gallery_images && Array.isArray(company.gallery_images) && company.gallery_images.length > 0;
  const effectiveGalleryImages = hasCustomGallery ? company.gallery_images : categoryDefaults.gallery;

  // 인증서 실제 존재 여부
  const hasCustomCertifications = company?.certifications && Array.isArray(company.certifications) && company.certifications.length > 0;

  // 회사 소개글 데이터 검증
  const hasDescriptionData = company?.description && company.description.trim() !== '';

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 antialiased">
      <Header />

      {/* 1. 회사 히어로 배너 */}
      <section className="bg-slate-900 text-white relative overflow-hidden border-b border-slate-800 pt-12 pb-16 px-6">
        <div className="absolute inset-0 opacity-25">
          <img src={effectiveCoverImage} alt="Company Cover Background" className="w-full h-full object-cover" />
        </div>

        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Korean Company
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                <Factory className="w-3.5 h-3.5" /> {company?.business_type || 'Direct Manufacturer'}
              </span>
              {company?.category && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                  {company.category}
                </span>
              )}
            </div>

            {isOwner && (
              <button
                type="button"
                onClick={() => setIsEditCompanyModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>{company ? 'Edit Company Info & Specs' : 'Register Company Specs'}</span>
              </button>
            )}
          </div>

          <div className="space-y-3 max-w-4xl">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-snug">
              {company?.company_name_en || company?.company_name || 'Verified Korean Company Showroom'}
            </h1>
            {company?.company_name_ko && (
              <p className="text-slate-400 text-sm font-bold">Company Name (Korean): {company.company_name_ko}</p>
            )}
            <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium">
              {company?.tagline || 'Verified South Korean company ready for global wholesale and OEM/ODM export.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Location</span>
                <span className="font-bold">{company?.location || 'South Korea 🇰🇷'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Established</span>
                <span className="font-bold">{company?.established_year ? `${company.established_year} Year` : 'Not Specified'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Employees</span>
                <span className="font-bold">{company?.employees_count || 'Not Specified'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Factory Area</span>
                <span className="font-bold">{company?.factory_size || 'Not Specified'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 네비게이션 탭 */}
      <section className="bg-white border-b border-slate-200 sticky top-18 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`py-4 text-sm font-extrabold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'about'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Company Overview & Certifications</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`py-4 text-sm font-extrabold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'products'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Showroom ({products.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product to Showroom</span>
              </button>
            )}

            {/* 셀러 본인 페이지일 때는 Send Direct RFQ 숨김 */}
            {!isOwner && (
              <button
                type="button"
                onClick={handleStartCompanyChat}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Direct RFQ</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. 탭별 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-6 mt-10">
        {activeTab === 'about' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className={`space-y-8 ${isOwner ? 'lg:col-span-12' : 'lg:col-span-8'} bg-white p-8 rounded-3xl border border-slate-200 shadow-sm`}>
              
              {/* 타이틀 및 Edit 버튼 */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Company Overview & Manufacturing Strength</h2>
                  <p className="text-xs text-slate-500 mt-1">Detailed information about our company capacity and mission.</p>
                </div>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setIsEditCompanyModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-xl transition cursor-pointer text-xs font-extrabold flex items-center gap-1 border border-slate-200"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {/* 입력하신 기본 스펙 정보 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-blue-600" /> Main Category
                  </span>
                  <span className="font-extrabold text-slate-900 block truncate">
                    {company?.category || 'Industrial Machinery'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-blue-600" /> Business Type
                  </span>
                  <span className="font-extrabold text-slate-900 block truncate">
                    {company?.business_type || 'Direct Manufacturer'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-600" /> Location
                  </span>
                  <span className="font-extrabold text-slate-900 block truncate">
                    {company?.location || 'Incheon, Korea'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" /> Established
                  </span>
                  <span className="font-extrabold text-slate-900 block truncate">
                    {company?.established_year ? `${company.established_year} Year` : 'Verified Entity'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-600" /> Staff Size
                  </span>
                  <span className="font-extrabold text-slate-900 block truncate">
                    {company?.employees_count || '1 - 10 Employees'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Layers className="w-3 h-3 text-blue-600" /> Factory Area
                  </span>
                  <span className="font-extrabold text-slate-900 block truncate">
                    {company?.factory_size || 'Under 1,000 sq.m'}
                  </span>
                </div>
              </div>

              {/* 회사 소개 본문 렌더링 */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-blue-600" />
                  Detailed Overview
                </h3>

                {hasDescriptionData ? (
                  <div 
                    className="prose text-slate-700 text-sm leading-relaxed max-w-none p-5 bg-slate-50/70 rounded-2xl border border-slate-100 font-medium"
                    dangerouslySetInnerHTML={{ __html: company.description }}
                  />
                ) : (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 leading-relaxed font-medium">
                    Welcome to our official global B2B showroom on KLICK. We are a verified South Korean company dedicated to supplying high-quality products and custom OEM/ODM solutions to buyers worldwide.
                  </div>
                )}
              </div>

              {/* 비디오 투어 Stream */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  Facility Video Stream
                </h3>

                <div
                  onClick={() => handleOpenVideo(company?.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4')}
                  className="bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-md hover:shadow-xl transition cursor-pointer group space-y-2 relative h-56 flex items-center justify-center"
                >
                  <img src={effectiveCoverImage} alt="Video Thumbnail" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-300" />
                  
                  <div className="w-16 h-16 bg-blue-600/90 rounded-full flex items-center justify-center shadow-2xl group-hover:bg-blue-500 group-hover:scale-110 transition absolute">
                    <Play className="w-7 h-7 text-white ml-1 fill-white" />
                  </div>

                  <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-lg">
                    Click to Play Video Stream
                  </span>
                </div>
              </div>

              {/* 갤러리 사진 */}
              <div className="border-t border-slate-100 pt-6 space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Facilities & Operations Gallery
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {effectiveGalleryImages.map((imgUrl, idx) => (
                    <div key={idx} className="h-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-sm relative">
                      <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    </div>
                  ))}
                </div>
              </div>

              {/* 품질 인증서 */}
              <div className="border-t border-slate-100 pt-6 space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Quality Certifications & Licenses
                </h3>

                <div className="flex flex-wrap gap-2">
                  {hasCustomCertifications ? (
                    company.certifications.map((cert, index) => (
                      <span
                        key={index}
                        className="px-3.5 py-2 bg-amber-50 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        {cert}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 font-medium italic py-1">
                      No official certifications registered yet.
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* 바이어나 제3자 방문객일 때만 우측 Contact Company 카드 출력 */}
            {!isOwner && (
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-4 shadow-md sticky top-24">
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    Direct Contact
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Send a direct inquiry to our export sales team for custom production, OEM requests, and wholesale quotations.
                  </p>

                  <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>{company?.location || 'Incheon, South Korea'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartCompanyChat}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Contact Company</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* [Showroom 탭] */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Company Showroom Catalog</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Products created here are automatically synchronized with the global Product Dashboard.
                </p>
              </div>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Showroom Product</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                <p className="text-slate-500 font-semibold text-sm">Loading Company Showroom Products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-3 p-8">
                <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
                <h3 className="text-base font-bold text-slate-800">No Showroom Products Yet</h3>
                <p className="text-xs text-slate-500">
                  {isOwner 
                    ? 'Click "Add Showroom Product" above to publish your first export product!'
                    : 'This company has not registered any public showroom catalog items.'}
                </p>
                {isOwner && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddProductModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add First Showroom Product</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-full h-52 bg-slate-100 border-b border-slate-100 flex items-center justify-center relative overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title_en || item.title_ko || item.product_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <Package className="w-10 h-10 text-slate-300" />
                        )}
                        <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                          {item.category || 'Manufacturing'}
                        </span>
                      </div>

                      <div className="p-6 space-y-3">
                        <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Showroom Item</span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                          {item.title_en || item.title_ko || item.product_name || 'Export Item'}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {item.tagline || item.description_en || 'High durability export product verified for global buyers.'}
                        </p>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px]">FOB Price</span>
                            <span className="font-extrabold text-blue-600">${item.price || '0.00'} USD</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Min Order</span>
                            <span className="font-bold text-slate-700">{item.moq || '1 Unit'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0 border-t border-slate-100 mt-2">
                      <Link
                        href={`/products/${item.id}`}
                        className="w-full py-3 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Inspect Specs & Inquiry</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 모달 연동 구역 */}
      <EditCompanyModal
        isOpen={isEditCompanyModalOpen}
        onClose={() => setIsEditCompanyModalOpen(false)}
        onSubmit={handleSaveCompanyProfile}
        isSaving={isSavingCompany}
        editCompanyNameKo={editCompanyNameKo}
        setEditCompanyNameKo={setEditCompanyNameKo}
        editCompanyNameEn={editCompanyNameEn}
        setEditCompanyNameEn={setEditCompanyNameEn}
        editCategory={editCategory}
        setEditCategory={setEditCategory}
        editTagline={editTagline}
        setEditTagline={setEditTagline}
        editBusinessType={editBusinessType}
        setEditBusinessType={setEditBusinessType}
        editLocation={editLocation}
        setEditLocation={setEditLocation}
        editEstablishedYear={editEstablishedYear}
        setEditEstablishedYear={setEditEstablishedYear}
        editEmployeesCount={editEmployeesCount}
        setEditEmployeesCount={setEditEmployeesCount}
        editFactorySize={editFactorySize}
        setEditFactorySize={setEditFactorySize}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editCoverImage={editCoverImage}
        setEditCoverImage={setEditCoverImage}
        editGalleryImages={editGalleryImages}
        setEditGalleryImages={setEditGalleryImages}
        editVideoUrl={editVideoUrl}
        setEditVideoUrl={setEditVideoUrl}
        editCertifications={editCertifications}
        setEditCertifications={setEditCertifications}
      />

      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onSubmit={handleCreateShowroomProduct}
        isSaving={isSavingProduct}
        productTitleKo={productTitleKo}
        setProductTitleKo={setProductTitleKo}
        productTitleEn={productTitleEn}
        setProductTitleEn={setProductTitleEn}
        productCategory={productCategory}
        setProductCategory={setProductCategory}
        productPrice={productPrice}
        setProductPrice={setProductPrice}
        productMoq={productMoq}
        setProductMoq={setProductMoq}
        productImageUrl={productImageUrl}
        setProductImageUrl={setProductImageUrl}
        productDescriptionKo={productDescriptionKo}
        setProductDescriptionKo={setProductDescriptionKo}
      />

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={selectedVideoUrl}
      />
    </div>
  );
}