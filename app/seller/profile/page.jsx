// app/seller/profile/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Users, 
  Award, 
  Save, 
  CheckCircle2, 
  PlusCircle, 
  Eye, 
  Trash2, 
  ShieldCheck, 
  ExternalLink,
  Package,
  Globe,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SellerCompanyProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [companyId, setCompanyId] = useState('1');

  // 셀러 공장 프로필 상태값
  const [companyName, setCompanyName] = useState('한국정밀공업 (Hankook Precision Co., Ltd.)');
  const [tagline, setTagline] = useState('Leading Manufacturer of Industrial Machinery & Precision Components in South Korea');
  const [description, setDescription] = useState('Established in 1998, Hankook Precision specializes in manufacturing ultra-durable hydraulic valves, industrial automation parts, and customized machinery components exported to over 30 countries worldwide.');
  const [businessType, setBusinessType] = useState('Direct Manufacturer');
  const [location, setLocation] = useState('Incheon, South Korea');
  const [establishedYear, setEstablishedYear] = useState('1998');
  const [employeesCount, setEmployeesCount] = useState('50 - 100 Employees');
  const [factorySize, setFactorySize] = useState('5,000 sq. meters');
  const [certificationsText, setCertificationsText] = useState('ISO 9001, CE Certified, IATF 16949');
  
  // 공장 사진 및 동영상 URL 상태값
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [galleryImages, setGalleryImages] = useState([
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // 셀러 등록 수출 상품 데이터
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchSellerProfileAndProducts();
  }, []);

  const fetchSellerProfileAndProducts = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }

      // 1. 공장 대표 프로필 정보 불러오기
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single();

      if (company) {
        setCompanyId(company.id);
        setCompanyName(company.company_name || '한국정밀공업');
        setTagline(company.tagline || '');
        setDescription(company.description || '');
        setBusinessType(company.business_type || 'Direct Manufacturer');
        setLocation(company.location || 'South Korea');
        setEstablishedYear(company.established_year || '1998');
        setEmployeesCount(company.employees_count || '50 - 100 Employees');
        setFactorySize(company.factory_size || '5,000 sq. meters');
        setVideoUrl(company.video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ');

        if (Array.isArray(company.certifications)) {
          setCertificationsText(company.certifications.join(', '));
        }
        if (Array.isArray(company.gallery_images) && company.gallery_images.length > 0) {
          setGalleryImages(company.gallery_images);
        }
      }

      // 2. 해당 셀러가 등록한 전체 수출 상품 목록 불러오기
      const { data: productList } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      setProducts(productList || []);
    } catch (error) {
      console.error('Failed to load seller factory data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 공장 사진 추가 핸들러
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setGalleryImages([...galleryImages, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  // 공장 사진 삭제 핸들러
  const handleDeleteImage = (index) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  };

  // 공장 프로필 정보 저장 및 업데이트 핸들러
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const certArray = certificationsText
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const profilePayload = {
        company_name: companyName,
        tagline: tagline,
        description: description,
        business_type: businessType,
        location: location,
        established_year: establishedYear,
        employees_count: employeesCount,
        factory_size: factorySize,
        certifications: certArray,
        video_url: videoUrl,
        gallery_images: galleryImages,
      };

      if (companyId) {
        await supabase
          .from('companies')
          .update(profilePayload)
          .eq('id', companyId);
      } else {
        const { data } = await supabase
          .from('companies')
          .insert([profilePayload])
          .select();
        if (data?.[0]) setCompanyId(data[0].id);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save factory profile:', error);
    } finally {
      setSaving(false);
    }
  };

  // 등록 상품 삭제 핸들러
  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product from your factory catalog?')) return;

    try {
      await supabase.from('products').delete().eq('id', id);
      setProducts(products.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-10">
        {/* 상단 배너 섹션 */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Seller Factory Control Center
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              공장 프로필 및 전체 수출 상품 관리 센터
            </h1>
            <p className="text-slate-400 text-xs md:text-sm">
              해외 바이어에게 노출될 공장 홈페이지(미니 쇼룸)를 설정하고 상품 스펙을 관리하세요.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/companies/${companyId || 1}`}
              target="_blank"
              className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>내 회사 홈페이지 바로가기 (View Showroom)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/products/new"
              className="px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-md transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>AI Product Setup</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 1. 셀러 공장 프로필 및 미디어 관리 폼 카드 */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  제조 공장 프로필 & 미디어(사진/영상) 설정
                </h2>
                <p className="text-xs text-slate-500 mt-1">해외 바이어에게 신뢰감을 전달할 스펙 정보와 전경 사진, 영상 URL을 입력해 주세요.</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">회사명 / 공장명 (Company Name)</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">한 줄 태그라인 (Tagline - 영문 권장)</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Leading Manufacturer of Precision Industrial Valves"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">사업 형태 (Business Type)</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Direct Manufacturer">Direct Manufacturer (제조 공장)</option>
                    <option value="Trading Company">Trading Company (무역상사)</option>
                    <option value="OEM / ODM Specialist">OEM / ODM Specialist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">공장 소재지 (Location)</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">설립연도 (Est.)</label>
                  <input
                    type="text"
                    value={establishedYear}
                    onChange={(e) => setEstablishedYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">임직원 수</label>
                  <input
                    type="text"
                    value={employeesCount}
                    onChange={(e) => setEmployeesCount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">공장 규모</label>
                  <input
                    type="text"
                    value={factorySize}
                    onChange={(e) => setFactorySize(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">보유 품질 인증서 (Certifications - 쉼표 분리)</label>
                <input
                  type="text"
                  value={certificationsText}
                  onChange={(e) => setCertificationsText(e.target.value)}
                  placeholder="ISO 9001, CE Certified, IATF 16949"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* 홍보 동영상 임베드 URL 입력 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-blue-600" />
                  <span>공장 홍보 동영상 URL (YouTube / Embed Link)</span>
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* 공장 전경 및 생산 라인 사진 갤러리 등록 */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>공장 전경 및 생산 라인 사진 갤러리</span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    사진 추가
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  {galleryImages.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 h-24 bg-slate-100">
                      <img src={img} alt={`Factory ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Delete Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">공장 및 회사 상세 소개글</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed"
                />
              </div>

              {saveSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> 공장 프로필 및 미디어 정보가 성공적으로 저장되었습니다!
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? '프로필 저장 중...' : '공장 프로필 업데이트 저장'}</span>
              </button>
            </form>
          </div>

          {/* 2. 셀러 등록 전체 상품 관리 현황 */}
          <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  등록된 수출 카탈로그 ({products.length})
                </h2>
                <p className="text-xs text-slate-500 mt-1">글로벌 바이어에게 노출되고 있는 등록 상품 목록입니다.</p>
              </div>

              <Link
                href="/products/new"
                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition"
                title="Add Product"
              >
                <PlusCircle className="w-5 h-5" />
              </Link>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-xs text-slate-400">상품 목록을 불러오는 중입니다...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <Package className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                  <p className="text-xs text-slate-500 font-semibold">등록된 수출 상품이 없습니다.</p>
                  <Link
                    href="/products/new"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> AI 첫 상품 등록하기 ➡️
                  </Link>
                </div>
              ) : (
                products.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 hover:border-blue-300 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title_en} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div className="space-y-0.5 max-w-[180px]">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-900 truncate">{item.title_en}</h4>
                        <p className="text-[11px] font-bold text-emerald-600">${item.price} USD</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/products/${item.id}`}
                        className="p-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 rounded-xl transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleDeleteProduct(item.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}