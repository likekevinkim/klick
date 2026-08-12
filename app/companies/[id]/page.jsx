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
  Phone,
  Video,
  Image as ImageIcon,
  Edit3,
  Play,
  Plus,
  PlusCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CompanyShowroomLandingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const companyId = params?.id;
  const autoEditParam = searchParams.get('edit');

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const [activeTab, setActiveTab] = useState('about');

  // 모달 토글 및 상태 (초기 상태값 비워두기)
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

  const factoryVideos = [
    {
      id: 1,
      title: 'CNC Precision Machining & Valve Assembly Line Tour',
      duration: '02:15',
      thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
    {
      id: 2,
      title: 'Zero-Defect Quality Control (QC) Pressure Testing Process',
      duration: '01:45',
      thumbnail: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    }
  ];

  useEffect(() => {
    setMounted(true);
    fetchCompanyAndProductsData();
  }, [companyId]);

  const fetchCompanyAndProductsData = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      let fetchedCompany = null;

      // 1. Supabase DB에서 실제 등록된 회사 데이터만 조회
      if (companyId) {
        const { data: dbCompany } = await supabase
          .from('companies')
          .select('*')
          .or(`id.eq.${companyId},user_id.eq.${companyId}`)
          .single();

        if (dbCompany) fetchedCompany = dbCompany;
      }

      // 본인 소유 권한 확인
      if (currentUser) {
        if (fetchedCompany && (fetchedCompany.user_id === currentUser.id || companyId === currentUser.id)) {
          setIsOwner(true);
        } else if (currentUser.user_metadata?.role === 'seller' && (companyId === currentUser.id || !fetchedCompany)) {
          setIsOwner(true);
        }
      }

      // 2. 가짜 데이터 완전 제거: DB에 없으면 null 상태 유지하고 유저 메타데이터 기본 입력값만 세팅
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
      } else {
        setCompany(null);
        if (currentUser) {
          setEditCompanyNameKo(currentUser.user_metadata?.company_name_ko || '');
          setEditCompanyNameEn(currentUser.user_metadata?.company_name_en || currentUser.user_metadata?.company_name || '');
        }
      }

      if (autoEditParam === 'true') {
        setIsEditCompanyModalOpen(true);
      }

      // 3. 해당 회사 소유의 실제 등록 제품만 조회
      if (currentUser?.id || companyId) {
        const targetUserId = currentUser?.id || companyId;
        const { data: matchedProducts } = await supabase
          .from('products')
          .select('*')
          .or(`user_id.eq.${targetUserId},company_id.eq.${companyId}`)
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

      const updatedPayload = {
        user_id: activeUserId,
        company_name: editCompanyNameEn || editCompanyNameKo || 'Korean Manufacturer',
        company_name_ko: editCompanyNameKo,
        company_name_en: editCompanyNameEn,
        category: editCategory,
        tagline: editTagline,
        description: editDescription,
        business_type: editBusinessType,
        location: editLocation,
        established_year: editEstablishedYear,
        employees_count: editEmployeesCount,
        factory_size: editFactorySize,
        updated_at: new Date().toISOString()
      };

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

      if (saveError && saveError.message.includes('company_name_ko')) {
        const fallbackPayload = { ...updatedPayload };
        delete fallbackPayload.company_name_ko;

        if (existingComp) {
          await supabase.from('companies').update(fallbackPayload).eq('user_id', activeUserId);
        } else {
          await supabase.from('companies').insert([fallbackPayload]);
        }
      } else if (saveError) {
        throw saveError;
      }

      alert('회사 정보가 성공적으로 저장되었습니다!');
      setCompany(prev => ({ ...(prev || {}), ...updatedPayload }));
      setIsEditCompanyModalOpen(false);
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
    setSelectedVideoUrl(url);
    setIsVideoModalOpen(true);
  };

  const handleStartCompanyChat = () => {
    const compName = encodeURIComponent(company?.company_name_en || company?.company_name || 'Korean Manufacturer');
    const title = encodeURIComponent('Company Partnership & Wholesale Inquiry');
    router.push(`/chat?company=${compName}&title=${title}`);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 antialiased">
      <Header />

      {/* 1. 회사 히어로 배너 */}
      <section className="bg-slate-900 text-white relative overflow-hidden border-b border-slate-800 pt-12 pb-16 px-6">
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
              {company?.company_name_en || company?.company_name || user?.user_metadata?.company_name_en || user?.user_metadata?.company_name || 'My Company Showroom'}
            </h1>
            {company?.company_name_ko && (
              <p className="text-slate-400 text-sm font-bold">Company Name (Korean): {company.company_name_ko}</p>
            )}
            <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium">
              {company?.tagline || 'Please register your company details and capacity to attract global buyers.'}
            </p>
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

            <button
              type="button"
              onClick={handleStartCompanyChat}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Direct RFQ</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. 탭별 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-6 mt-10">
        {activeTab === 'about' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Company Overview & Manufacturing Strength</h2>
                  <p className="text-xs text-slate-500 mt-1">Detailed information about our company capacity and mission.</p>
                </div>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setIsEditCompanyModalOpen(true)}
                    className="p-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {/* 공장 상세 소개가 없을 때 초기화된 Empty State */}
              {!company?.description ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3 p-6">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                  <h3 className="text-sm font-bold text-slate-800">No Company Specifications Registered Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {isOwner 
                      ? 'Register your production capabilities, factory size, and ISO certifications to receive direct buyer inquiries!'
                      : 'This company has not provided detailed specifications yet.'}
                  </p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setIsEditCompanyModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition mt-2 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Register Company Specifications</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="prose text-slate-600 text-sm leading-relaxed space-y-4 border-t border-slate-100 pt-4">
                  <p>{company.description}</p>
                </div>
              )}

              {/* 품질 인증서 */}
              <div className="border-t border-slate-100 pt-6 space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  Quality Certifications & Licenses
                </h3>
                <div className="flex flex-wrap gap-2">
                  {company?.certifications && Array.isArray(company.certifications) && company.certifications.length > 0 ? (
                    company.certifications.map((cert, index) => (
                      <span
                        key={index}
                        className="px-3.5 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        {cert}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 font-medium italic">
                      No quality certifications registered yet.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 우측 인적사항 카드 */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-4 shadow-md">
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