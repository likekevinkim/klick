// app/companies/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Users, 
  Award, 
  CheckCircle2, 
  Globe, 
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
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CompanyShowroomLandingPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id;

  const [mounted, setMounted] = useState(false);
  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false); // 셀러 자신인지 판단 유무

  // Factory Overview & Certifications 탭을 기본(First)으로 설정
  const [activeTab, setActiveTab] = useState('about'); // 'about' (First) or 'products'

  // 공장 실사 동영상 팝업 모달 상태
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');

  // 공장 실사 동영상 & 360도 검증 투어 갤러리 데이터
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

  // 샘플 공장 데이터베이스 매핑 사전
  const mockCompaniesMaster = {
    '1': {
      id: '1',
      company_name: 'Hankook Precision Co., Ltd. (한국정밀공업)',
      tagline: 'Leading Manufacturer of High-Precision Hydraulic Valves & Industrial Automation Parts',
      description: 'Established in 1998, Hankook Precision specializes in manufacturing ultra-durable hydraulic control valves, industrial automation components, and customized machinery parts. With state-of-the-art CNC production facilities and strict ISO 9001 quality assurance, we export premium Korean manufacturing goods to over 35 countries worldwide.',
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
    },
    '2': {
      id: '2',
      company_name: 'Seoul Bio Cosmetics Ltd. (서울바이오화장품)',
      tagline: 'OEM/ODM Global Manufacturing Leader in Organic Derma Skincare & Anti-Aging Serums',
      description: 'Seoul Bio Cosmetics is a top-tier CGMP and FDA registered K-Beauty OEM/ODM manufacturer. We operate automated cleanrooms for high-efficiency production of anti-aging serums, botanical toners, and functional cosmetics exported globally.',
      business_type: 'OEM / ODM Manufacturer',
      location: 'Seoul, South Korea 🇰🇷',
      established_year: '2008',
      employees_count: '100 - 200 Employees',
      factory_size: '8,200 sq. meters',
      certifications: ['CGMP', 'FDA Registered', 'ISO 22716', 'USDA Organic'],
      gallery_images: [
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80'
      ]
    },
    '3': {
      id: '3',
      company_name: 'Gyeonggi Smart Tech Industries (경기스마트텍)',
      tagline: 'High-Tech Electronics Factory Producing Smart IoT Sensors & PCB Controllers',
      description: 'Gyeonggi Smart Tech specializes in surface-mount technology (SMT) and automated assembly of industrial IoT sensors, automotive controllers, and high-performance micro-circuit boards.',
      business_type: 'High-Tech Direct Manufacturer',
      location: 'Suwon, Gyeonggi-do, South Korea 🇰🇷',
      established_year: '2015',
      employees_count: '30 - 50 Employees',
      factory_size: '3,500 sq. meters',
      certifications: ['KC Certified', 'RoHS', 'FCC Compliant', 'ISO 14001'],
      gallery_images: [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
      ]
    }
  };

  useEffect(() => {
    setMounted(true);
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);

      // 세션 유저 및 권한 파악 (셀러일 경우 수정 버튼 노출)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const role = session.user.user_metadata?.role || 'seller';
        if (role === 'seller') {
          setIsOwner(true);
        }
      }

      // 1. 제조 공장 회사 데이터 조회
      let companyData = null;
      if (companyId) {
        const { data } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();
        if (data) companyData = data;
      }

      if (!companyData) {
        // 매핑 사전 또는 기본 템플릿 반환
        companyData = mockCompaniesMaster[companyId] || mockCompaniesMaster['1'];
      }
      setCompany(companyData);

      // 2. 해당 공장이 등록한 전체 수출 상품 조회 (Supabase DB 연동)
      const { data: productList } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productList && productList.length > 0) {
        // 회사 이름이나 ID로 필터링 (없으면 전체 노출 fallback)
        const matched = productList.filter(
          p => (p.company_name || '').toLowerCase().includes((companyData.company_name || '').toLowerCase().slice(0, 5)) ||
               p.company_id === companyId
        );
        setProducts(matched.length > 0 ? matched : productList);
      } else {
        // 백업 보장 샘플 상품 데이터
        setProducts([
          {
            id: '1',
            title_en: 'High-Precision Hydraulic Control Valve HV-300',
            category: 'Industrial Machinery',
            price: '145.00',
            moq: '500 Units',
            tagline: 'ISO 9001 certified industrial solution engineered with Korean precision technology.',
            image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          },
          {
            id: '2',
            title_en: 'Heavy-Duty Hydraulic Actuator Cylinder AC-500',
            category: 'Industrial Machinery',
            price: '320.00',
            moq: '100 Units',
            tagline: 'Heavy industrial grade actuator built for zero-leakage durability.',
            image_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch company showroom details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVideo = (url) => {
    setSelectedVideoUrl(url);
    setIsVideoModalOpen(true);
  };

  // 공장과 직통 1:1 대화방 연결
  const handleStartCompanyChat = () => {
    const compName = encodeURIComponent(company?.company_name || 'Hankook Precision Co., Ltd.');
    const title = encodeURIComponent('Factory Partnership & Wholesale Inquiry');
    router.push(`/chat?company=${compName}&title=${title}`);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 antialiased">
      <Header />

      {/* 1. 회사 상단 히어로 배너 & 미니홈피 커버 */}
      <section className="bg-slate-900 text-white relative overflow-hidden border-b border-slate-800 pt-12 pb-16 px-6">
        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Korean Factory
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
              <Factory className="w-3.5 h-3.5" /> {company?.business_type || 'Direct Manufacturer'}
            </span>
          </div>

          <div className="space-y-3 max-w-4xl">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-snug">
              {company?.company_name}
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium">
              {company?.tagline || 'Leading Manufacturer in South Korea'}
            </p>
          </div>

          {/* 핵심 공장 스펙 요약 바 */}
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

      {/* 2. 네비게이션 탭 (Factory Overview를 첫번째 탭으로 배치 & 셀러 전용 수정 버튼 포함) */}
      <section className="bg-white border-b border-slate-200 sticky top-18 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* 첫번째 탭: Factory Overview & Certifications */}
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

            {/* 두번째 탭: Export Product Lineup */}
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
              <span>Export Product Lineup ({products.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* 셀러 자신일 때만 노출되는 [Edit Factory Profile] 정보 수정 버튼 */}
            {isOwner && (
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Manage Factory Catalog</span>
              </Link>
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

      {/* 3. 탭별 메인 컨텐츠 영역 */}
      <main className="max-w-6xl mx-auto px-6 mt-10">
        {activeTab === 'about' ? (
          /* [첫번째 기본 탭] 공장 상세 개요, 동영상 투어 갤러리, 사진 갤러리, 품질 인증서 */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Company Overview & Manufacturing Strength</h2>
                <p className="text-xs text-slate-500 mt-1">Detailed information about our factory capacity and mission.</p>
              </div>

              <div className="prose text-slate-600 text-sm leading-relaxed space-y-4 border-t border-slate-100 pt-4">
                <p>{company?.description}</p>
              </div>

              {/* 검증된 공장 실사 동영상 & 360도 투어 갤러리 */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-600" />
                      Verified Factory Production Video Tour (공장 실사 비디오)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time production facility and automated CNC inspection videos.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {factoryVideos.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => handleOpenVideo(vid.video_url)}
                      className="bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-md hover:shadow-xl transition cursor-pointer group space-y-2 relative"
                    >
                      <div className="w-full h-44 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                        <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-80" />
                        
                        {/* 재생 버튼 아이콘 */}
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

              {/* 공장 전경 및 생산 현장 사진 갤러리 */}
              {company?.gallery_images && Array.isArray(company.gallery_images) && company.gallery_images.length > 0 && (
                <div className="space-y-3 border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    Factory Facilities & Production Line Gallery
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {company.gallery_images.map((imgUrl, idx) => (
                      <div key={idx} className="h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group">
                        <img
                          src={imgUrl}
                          alt={`Factory Facility ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 품질 인증서 태그 */}
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

            {/* 우측 공장 연락처 및 Direct Inquiry 카드 */}
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
          /* [두번째 탭] 셀러의 전체 수출 상품 라인업 Grid */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Official Product Catalog</h2>
                <p className="text-xs text-slate-500 mt-1">Direct factory pricing with AI-translated specifications.</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                <p className="text-slate-500 font-semibold text-sm">Loading Factory Showroom Products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-3 p-8">
                <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
                <h3 className="text-base font-bold text-slate-800">No Products Displayed Yet</h3>
                <p className="text-xs text-slate-500">This factory has not registered any public catalog items.</p>
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
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
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
                          <span>Verified Item</span>
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

      {/* 동영상 재생 모달 팝업 */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 max-w-3xl w-full border border-slate-800 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Verified Factory Video Stream
              </span>

              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-80 md:h-96 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <video src={selectedVideoUrl} controls autoPlay className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}