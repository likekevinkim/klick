// app/companies/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import EditCompanyModal from '@/components/company/EditCompanyModal';
import ProductFormModal from '@/components/products/ProductFormModal';
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
  Globe2,
  Briefcase
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Helper: UUID 문자열 판별 함수
const isUuid = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

// Helper: Integer 문자열 판별 함수
const isInteger = (str) => {
  if (!str) return false;
  return /^\d+$/.test(str.toString());
};

export default function CompanyShowroomLandingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL에서 전달된 파라미터 ID
  const routeParamId = params?.id;
  const autoEditParam = searchParams.get('edit');

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const [activeTab, setActiveTab] = useState('about');

  // 모달 토글 및 Form 상태
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
  const [editBizCertKo, setEditBizCertKo] = useState('');
  const [editBizCertEn, setEditBizCertEn] = useState('');

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchExactCompanyProfile();
  }, [routeParamId]);

  // 안전한 타입 검증 기반 DB 정밀 스캔 함수
  const fetchExactCompanyProfile = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      let fetchedCompany = null;

      if (routeParamId) {
        // 1. routeParamId가 UUID 형식일 때 안전하게 user_id 및 id 순차 조회
        if (isUuid(routeParamId)) {
          try {
            const { data: byUserId } = await supabase
              .from('companies')
              .select('*')
              .eq('user_id', routeParamId)
              .maybeSingle();

            if (byUserId) fetchedCompany = byUserId;
          } catch (e) {
            console.warn('user_id UUID scan skipped:', e);
          }

          if (!fetchedCompany) {
            try {
              const { data: byId } = await supabase
                .from('companies')
                .select('*')
                .eq('id', routeParamId)
                .maybeSingle();

              if (byId) fetchedCompany = byId;
            } catch (e) {
              console.warn('id UUID scan skipped:', e);
            }
          }
        } 
        // 2. routeParamId가 숫자(Integer) 형식일 때 안전하게 id 조회
        else if (isInteger(routeParamId)) {
          try {
            const { data: byIntId } = await supabase
              .from('companies')
              .select('*')
              .eq('id', parseInt(routeParamId, 10))
              .maybeSingle();

            if (byIntId) fetchedCompany = byIntId;
          } catch (e) {
            console.warn('integer id scan skipped:', e);
          }
        } 
        // 3. 기타 일반 문자열 형식일 때 안전하게 id 조회
        else {
          try {
            const { data: byStrId } = await supabase
              .from('companies')
              .select('*')
              .eq('id', routeParamId)
              .maybeSingle();

            if (byStrId) fetchedCompany = byStrId;
          } catch (e) {
            console.warn('string id scan skipped:', e);
          }
        }
      }

      // 4. 내 소유 쇼룸 접속 시 fallback
      if (!fetchedCompany && currentUser?.id && routeParamId === currentUser.id) {
        try {
          const { data: myCompany } = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (myCompany) fetchedCompany = myCompany;
        } catch (e) {
          console.warn('myCompany scan skipped:', e);
        }
      }

      // 5. 소유자(편집 권한) 여부 정밀 확인
      if (currentUser && fetchedCompany) {
        setIsOwner(fetchedCompany.user_id === currentUser.id);
      } else {
        setIsOwner(false);
      }

      // 6. DB에서 스캔한 클릭 회사의 실제 데이터만 화면 및 Form에 매핑
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

        setEditCoverImage(fetchedCompany.banner_url || '');
        setEditGalleryImages(fetchedCompany.gallery_images || []);
        setEditVideoUrl(fetchedCompany.video_url || '');
        setEditCertifications(fetchedCompany.certifications || []);
        setEditBizCertKo(fetchedCompany.business_reg_cert_ko || '');
        setEditBizCertEn(fetchedCompany.business_reg_cert_en || '');
      } else {
        setCompany(null);
      }

      if (autoEditParam === 'true' && isOwner) {
        setIsEditCompanyModalOpen(true);
      }

      // 7. 조회된 셀러의 등록 상품만 DB 스캔
      const targetSellerUserId = fetchedCompany?.user_id || fetchedCompany?.id || routeParamId;
      if (targetSellerUserId) {
        try {
          const { data: matchedProducts } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', targetSellerUserId)
            .order('created_at', { ascending: false });

          setProducts(matchedProducts || []);
        } catch (e) {
          console.warn('products scan skipped:', e);
          setProducts([]);
        }
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Unexpected error in fetchExactCompanyProfile:', err);
      setCompany(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Supabase DB 영구 저장 처리 (셀러 본인일 때만 실행)
  const handleSaveCompanyProfile = async (e) => {
    e.preventDefault();

    try {
      setIsSavingCompany(true);

      const { data: { session } } = await supabase.auth.getSession();
      const activeUser = session?.user || user;

      if (!activeUser) {
        alert('Your login session has expired. Please sign in again.');
        router.push('/login');
        return;
      }

      const activeUserId = activeUser.id;

      const updatedPayload = {
        user_id: activeUserId,
        company_name: editCompanyNameEn || editCompanyNameKo || 'Korean Company',
        company_name_ko: editCompanyNameKo,
        company_name_en: editCompanyNameEn,
        category: editCategory || 'Industrial Machinery',
        tagline: editTagline,
        description: editDescription,
        business_type: editBusinessType,
        location: editLocation,
        established_year: editEstablishedYear,
        employees_count: editEmployeesCount,
        factory_size: editFactorySize,
        banner_url: editCoverImage,
        gallery_images: editGalleryImages,
        video_url: editVideoUrl,
        certifications: editCertifications,
        business_reg_cert_ko: editBizCertKo,
        business_reg_cert_en: editBizCertEn,
        updated_at: new Date().toISOString()
      };

      const { data: existingComp } = await supabase
        .from('companies')
        .select('id, user_id')
        .eq('user_id', activeUserId)
        .maybeSingle();

      const { error: saveError } = existingComp
        ? await supabase.from('companies').update(updatedPayload).eq('user_id', activeUserId)
        : await supabase.from('companies').insert([updatedPayload]);

      if (saveError) throw saveError;

      alert('Company profile saved successfully!');

      setCompany(updatedPayload);
      setIsEditCompanyModalOpen(false);

      await fetchExactCompanyProfile();
    } catch (err) {
      console.error('Company save error:', err);
      alert('An error occurred while saving your company profile: ' + (err.message || 'Database connection error'));
    } finally {
      setIsSavingCompany(false);
    }
  };

  // Register New Product와 동일한 ProductFormModal을 쓰므로, 등록 성공 시 목록에 바로 반영만 하면 됨
  const handleProductCreated = (newProduct) => {
    if (newProduct) {
      setProducts((prev) => [newProduct, ...prev]);
    }
    setIsAddProductModalOpen(false);
  };

  const handleOpenVideo = (url) => {
    setSelectedVideoUrl(url || 'https://www.w3schools.com/html/mov_bbb.mp4');
    setIsVideoModalOpen(true);
  };

  // ★ [핵심 교정] 셀러의 진짜 user_id를 sellerId 파라미터로 명확히 넘기는 채팅 이동 함수
  const handleStartCompanyChat = () => {
    const compName = encodeURIComponent(company?.company_name_en || company?.company_name || 'Korean Manufacturer');
    const title = encodeURIComponent('Company Partnership & Wholesale Inquiry');
    const targetSellerId = company?.user_id || routeParamId || '';
    router.push(`/chat?company=${compName}&title=${title}&sellerId=${targetSellerId}`);
  };

  const hasDescriptionData = company?.description && company.description.trim() !== '';
  const hasCustomCertifications = company?.certifications && Array.isArray(company.certifications) && company.certifications.length > 0;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 antialiased">
      <Header />

      {/* 1. 회사 히어로 배너 */}
      <section className="bg-slate-900 text-white relative overflow-hidden border-b border-slate-800 pt-12 pb-16 px-6">
        {company?.banner_url && (
          <div className="absolute inset-0 opacity-25">
            <img src={company.banner_url} alt="Company Cover Background" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {company?.business_reg_cert_ko && company?.business_reg_cert_en ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Korean Company
                </span>
              ) : isOwner ? (
                <button
                  type="button"
                  onClick={() => setIsEditCompanyModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 cursor-pointer hover:bg-amber-500/30 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Upload Business Registration Cert to Get Verified
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-700/40 text-slate-400 text-xs font-bold border border-slate-600/40">
                  <ShieldCheck className="w-3.5 h-3.5" /> Not Yet Verified
                </span>
              )}
              {company?.business_type && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                  <Factory className="w-3.5 h-3.5" /> {company.business_type}
                </span>
              )}
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
              {company?.company_name_en || company?.company_name_ko || company?.company_name || 'Unregistered Company Showroom'}
            </h1>
            {company?.company_name_ko && (
              <p className="text-slate-400 text-sm font-bold">Company Name (Korean): {company.company_name_ko}</p>
            )}
            {company?.tagline && (
              <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium">
                {company.tagline}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Location</span>
                <span className="font-bold">{company?.location || 'Not Specified'}</span>
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

              {/* 스캔된 실제 셀러의 등록 스펙 정보 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-blue-600" /> Main Category
                  </span>
                  <span className="font-extrabold text-slate-900 block truncate">
                    {company?.category || 'Not Specified'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-blue-600" /> Business Type
                  </span>
                  <span className="font-extrabold text-slate-900 block truncate">
                    {company?.business_type || 'Not Specified'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-600" /> Location
                  </span>
                  <span className="font-extrabold text-slate-900 block truncate">
                    {company?.location || 'Not Specified'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" /> Established
                  </span>
                  <span className="font-extrabold text-slate-900 block truncate">
                    {company?.established_year ? `${company.established_year} Year` : 'Not Specified'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-600" /> Staff Size
                  </span>
                  <span className="font-extrabold text-slate-900 block truncate">
                    {company?.employees_count || 'Not Specified'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Layers className="w-3 h-3 text-blue-600" /> Factory Area
                  </span>
                  <span className="font-extrabold text-slate-900 block truncate">
                    {company?.factory_size || 'Not Specified'}
                  </span>
                </div>
              </div>

              {/* 스캔된 실제 셀러의 소개글 렌더링 */}
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
                    No detailed overview registered for this company yet.
                  </div>
                )}
              </div>

              {/* 비디오 투어 Stream */}
              {company?.video_url && company.video_url.trim() !== '' && (
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-600" />
                    Facility Video Stream
                  </h3>

                  <div
                    onClick={() => handleOpenVideo(company.video_url)}
                    className="bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-md hover:shadow-xl transition cursor-pointer group space-y-2 relative h-56 flex items-center justify-center"
                  >
                    {company.banner_url && (
                      <img src={company.banner_url} alt="Video Cover" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-300" />
                    )}
                    
                    <div className="w-16 h-16 bg-blue-600/90 rounded-full flex items-center justify-center shadow-2xl group-hover:bg-blue-500 group-hover:scale-110 transition absolute">
                      <Play className="w-7 h-7 text-white ml-1 fill-white" />
                    </div>

                    <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-lg">
                      Click to Play Video Stream
                    </span>
                  </div>
                </div>
              )}

              {/* 갤러리 사진 */}
              {company?.gallery_images && Array.isArray(company.gallery_images) && company.gallery_images.length > 0 && (
                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    Facilities & Operations Gallery
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {company.gallery_images.map((imgUrl, idx) => (
                      <div key={idx} className="h-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-sm relative">
                        <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                      <span>{company?.location || 'South Korea'}</span>
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
                            <span className="font-extrabold text-blue-600">{item.price || '$0.00 USD'}</span>
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
        editBizCertKo={editBizCertKo}
        setEditBizCertKo={setEditBizCertKo}
        editBizCertEn={editBizCertEn}
        setEditBizCertEn={setEditBizCertEn}
      />

      <ProductFormModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onProductCreated={handleProductCreated}
      />

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={selectedVideoUrl}
      />
    </div>
  );
}