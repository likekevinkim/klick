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
  Plus
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

  // 모달 토글 및 상태
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  const [editCompanyNameKo, setEditCompanyNameKo] = useState('');
  const [editCompanyNameEn, setEditCompanyNameEn] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBusinessType, setEditBusinessType] = useState('Direct Manufacturer');
  const [editLocation, setEditLocation] = useState('Incheon, South Korea 🇰🇷');
  const [editEstablishedYear, setEditEstablishedYear] = useState('1998');
  const [editEmployeesCount, setEditEmployeesCount] = useState('50 - 100 Employees');
  const [editFactorySize, setEditFactorySize] = useState('5,000 sq. meters');

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

      if (companyId) {
        const { data: dbCompany } = await supabase
          .from('companies')
          .select('*')
          .or(`id.eq.${companyId},user_id.eq.${companyId}`)
          .single();

        if (dbCompany) fetchedCompany = dbCompany;
      }

      if (currentUser) {
        if (fetchedCompany && (fetchedCompany.user_id === currentUser.id || companyId === currentUser.id)) {
          setIsOwner(true);
        } else if (currentUser.user_metadata?.role === 'seller') {
          setIsOwner(true);
        }
      }

      if (!fetchedCompany) {
        fetchedCompany = {
          id: companyId || currentUser?.id || '1',
          user_id: currentUser?.id || null,
          company_name: currentUser?.user_metadata?.company_name_en || currentUser?.user_metadata?.company_name_ko || 'Hankook Precision Co., Ltd.',
          company_name_ko: currentUser?.user_metadata?.company_name_ko || '(주)한국정밀공업',
          company_name_en: currentUser?.user_metadata?.company_name_en || 'Hankook Precision Co., Ltd.',
          tagline: 'Leading Manufacturer of High-Precision Hydraulic Valves & Industrial Automation Parts',
          description: 'Established in 1998, Hankook Precision specializes in manufacturing ultra-durable hydraulic control valves, industrial automation components, and customized machinery parts.',
          business_type: 'Direct Manufacturer',
          location: 'Incheon, South Korea 🇰🇷',
          established_year: '1998',
          employees_count: '50 - 100 Employees',
          factory_size: '5,000 sq. meters',
          certifications: ['ISO 9001', 'CE Certified', 'IATF 16949', 'KOTRA Verified'],
          gallery_images: [
            'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
          ]
        };
      }

      setCompany(fetchedCompany);

      setEditCompanyNameKo(fetchedCompany.company_name_ko || '');
      setEditCompanyNameEn(fetchedCompany.company_name_en || fetchedCompany.company_name || '');
      setEditTagline(fetchedCompany.tagline || '');
      setEditDescription(fetchedCompany.description || '');
      setEditBusinessType(fetchedCompany.business_type || 'Direct Manufacturer');
      setEditLocation(fetchedCompany.location || 'Incheon, South Korea 🇰🇷');
      setEditEstablishedYear(fetchedCompany.established_year || '1998');
      setEditEmployeesCount(fetchedCompany.employees_count || '50 - 100 Employees');
      setEditFactorySize(fetchedCompany.factory_size || '5,000 sq. meters');

      if (autoEditParam === 'true') {
        setIsEditCompanyModalOpen(true);
      }

      const { data: allProducts } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (allProducts && allProducts.length > 0) {
        const targetUserId = currentUser?.id || companyId;
        const matchedProducts = allProducts.filter(
          p => p.user_id === targetUserId || p.company_id === companyId || (p.company_name && p.company_name.toLowerCase().includes((fetchedCompany.company_name_en || '').toLowerCase().slice(0, 5)))
        );
        setProducts(matchedProducts.length > 0 ? matchedProducts : allProducts);
      } else {
        setProducts([
          {
            id: '1',
            title_en: 'High-Precision Hydraulic Control Valve HV-300',
            category: 'Industrial Machinery',
            price: '145.00',
            moq: '500 Units',
            tagline: 'ISO 9001 certified industrial solution engineered with Korean precision technology.',
            image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch company details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompanyProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSavingCompany(true);

      const updatedPayload = {
        user_id: user.id,
        company_name: editCompanyNameEn || editCompanyNameKo || 'Korean Manufacturer',
        company_name_ko: editCompanyNameKo,
        company_name_en: editCompanyNameEn,
        tagline: editTagline,
        description: editDescription,
        business_type: editBusinessType,
        location: editLocation,
        established_year: editEstablishedYear,
        employees_count: editEmployeesCount,
        factory_size: editFactorySize,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('companies')
        .upsert([updatedPayload], { onConflict: 'user_id' });

      if (error) {
        const fallbackPayload = { ...updatedPayload };
        delete fallbackPayload.company_name_ko;

        const { error: fallbackError } = await supabase
          .from('companies')
          .upsert([fallbackPayload], { onConflict: 'user_id' });

        if (fallbackError) throw fallbackError;
      }

      alert('공장 정보가 성공적으로 수정되었습니다!');
      setCompany(prev => ({ ...prev, ...updatedPayload }));
      setIsEditCompanyModalOpen(false);
    } catch (err) {
      console.error('Company save error:', err);
      alert('공장 프로필 저장 중 오류가 발생했습니다: ' + (err.message || '데이터베이스 연동 오류'));
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
      const companyNameForProduct = company?.company_name_en || company?.company_name || 'Verified Korean Manufacturer';

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
    const compName = encodeURIComponent(company?.company_name_en || company?.company_name || 'Hankook Precision Co., Ltd.');
    const title = encodeURIComponent('Factory Partnership & Wholesale Inquiry');
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
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Korean Factory
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                <Factory className="w-3.5 h-3.5" /> {company?.business_type || 'Direct Manufacturer'}
              </span>
            </div>

            {isOwner && (
              <button
                type="button"
                onClick={() => setIsEditCompanyModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Factory Info & Specs</span>
              </button>
            )}
          </div>

          <div className="space-y-3 max-w-4xl">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-snug">
              {company?.company_name_en || company?.company_name}
            </h1>
            {company?.company_name_ko && (
              <p className="text-slate-400 text-sm font-bold">상호명: {company.company_name_ko}</p>
            )}
            <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium">
              {company?.tagline || 'Leading Manufacturer in South Korea'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Location</span>
                <span className="font-bold">{company?.location || 'South Korea'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Established</span>
                <span className="font-bold">{company?.established_year || '1998'} Year</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Employees</span>
                <span className="font-bold">{company?.employees_count || '50+ Staff'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Factory Area</span>
                <span className="font-bold">{company?.factory_size || '5,000 sq.m'}</span>
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
              <span>Factory Overview & Certifications</span>
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
                  <p className="text-xs text-slate-500 mt-1">Detailed information about our factory capacity and mission.</p>
                </div>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setIsEditCompanyModalOpen(true)}
                    className="p-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              <div className="prose text-slate-600 text-sm leading-relaxed space-y-4 border-t border-slate-100 pt-4">
                <p>{company?.description}</p>
              </div>

              {/* 비디오 투어 */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-600" />
                  Verified Factory Production Video Tour (공장 실사 비디오)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {factoryVideos.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => handleOpenVideo(vid.video_url)}
                      className="bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-md hover:shadow-xl transition cursor-pointer group space-y-2 relative"
                    >
                      <div className="w-full h-44 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                        <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-80" />
                        <div className="w-12 h-12 bg-blue-600/90 rounded-full flex items-center justify-center shadow-2xl group-hover:bg-blue-500 group-hover:scale-110 transition">
                          <Play className="w-5 h-5 text-white ml-0.5 fill-white" />
                        </div>
                        <span className="absolute bottom-2.5 right-2.5 bg-black/80 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          {vid.duration}
                        </span>
                      </div>

                      <div className="p-3.5 space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-100 group-hover:text-blue-400 transition line-clamp-1">
                          {vid.title}
                        </h4>
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verified Audit Video
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 품질 인증서 */}
              <div className="border-t border-slate-100 pt-6 space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  Quality Certifications & Licenses
                </h3>
                <div className="flex flex-wrap gap-2">
                  {company?.certifications && Array.isArray(company.certifications) ? (
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
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">
                      ISO 9001 / CE Certified
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
                  Direct Factory Contact
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Send a direct inquiry to our export sales team for custom production, OEM requests, and wholesale quotations.
                </p>

                <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>{company?.location || 'Incheon, South Korea'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    <span>+82-32-123-4567 (Export Dept.)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartCompanyChat}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Contact Manufacturer</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* [Showroom 탭] */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Factory Showroom Catalog</h2>
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
                <p className="text-slate-500 font-semibold text-sm">Loading Factory Showroom Products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-3 p-8">
                <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
                <h3 className="text-base font-bold text-slate-800">No Showroom Products Yet</h3>
                <p className="text-xs text-slate-500">
                  {isOwner 
                    ? 'Click "Add Showroom Product" above to publish your first export product!'
                    : 'This factory has not registered any public showroom catalog items.'}
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
                          {item.tagline || item.description_en || 'High durability factory export product verified for global buyers.'}
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