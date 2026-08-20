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
import ProductFormModal from '@/components/products/ProductFormModal';

export default function SellerCompanyProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [companyId, setCompanyId] = useState('1');

  // 셀러 공장 프로필 상태값
  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [businessType, setBusinessType] = useState('Direct Manufacturer');
  const [location, setLocation] = useState('South Korea');
  const [establishedYear, setEstablishedYear] = useState('');
  const [employeesCount, setEmployeesCount] = useState('');
  const [factorySize, setFactorySize] = useState('');
  const [certificationsText, setCertificationsText] = useState('');
  
  // 미디어 URL 상태값
  const [videoUrl, setVideoUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // 셀러 등록 수출 상품 데이터 및 모달 상태
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchSellerProfileAndProducts();
  }, []);

  const fetchSellerProfileAndProducts = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;

      if (currentUser) {
        setUser(currentUser);
        const userIdStr = currentUser.id.toString();

        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', userIdStr)
          .maybeSingle();

        const meta = currentUser.user_metadata || {};
        const activeCompany = companyData || {};
        
        setCompanyId(activeCompany.id || '1');
        setCompanyName(activeCompany.company_name || meta.company_name_en || meta.company_name || '');
        setTagline(activeCompany.tagline || '');
        setDescription(activeCompany.description || '');
        setBusinessType(activeCompany.business_type || 'Direct Manufacturer');
        setLocation(activeCompany.location || activeCompany.country || 'South Korea');
        setEstablishedYear(activeCompany.established_year || '');
        setEmployeesCount(activeCompany.employees_count || '');
        setFactorySize(activeCompany.factory_size || '');
        setVideoUrl(activeCompany.video_url || '');

        if (Array.isArray(activeCompany.certifications)) {
          setCertificationsText(activeCompany.certifications.join(', '));
        }
        if (Array.isArray(activeCompany.gallery_images)) {
          setGalleryImages(activeCompany.gallery_images);
        }

        // 셀러가 등록한 전체 제품 리스트 DB 조회
        const { data: productList } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', userIdStr)
          .order('created_at', { ascending: false });

        setProducts(productList || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Failed to load seller factory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setGalleryImages([...galleryImages, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleDeleteImage = (index) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const userIdStr = user?.id ? user.id.toString() : null;

      const certArray = certificationsText
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const profilePayload = {
        user_id: userIdStr,
        company_name: companyName,
        company_name_en: companyName,
        tagline: tagline,
        description: description,
        business_type: businessType,
        location: location,
        country: location,
        established_year: establishedYear,
        employees_count: employeesCount,
        factory_size: factorySize,
        certifications: certArray,
        video_url: videoUrl,
        gallery_images: galleryImages,
        updated_at: new Date().toISOString()
      };

      if (userIdStr) {
        await supabase
          .from('companies')
          .upsert(profilePayload, { onConflict: 'user_id' });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save factory profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product from your factory catalog?')) return;

    try {
      await supabase.from('products').delete().eq('id', id);
      setProducts(products.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleProductCreated = (newProduct) => {
    if (newProduct) {
      setProducts((prev) => [newProduct, ...prev]);
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
              Factory Profile & Export Product Management Center
            </h1>
            <p className="text-slate-400 text-xs md:text-sm">
              Set up the factory homepage (mini showroom) shown to overseas buyers and manage your product specs.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/companies/${companyId || 1}`}
              target="_blank"
              className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>View My Company Showroom</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-md transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Product</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 1. 셀러 공장 프로필 폼 */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Factory Profile & Media (Photos/Video) Settings
                </h2>
                <p className="text-xs text-slate-500 mt-1">Enter spec details, factory photos, and a video URL that build trust with overseas buyers.</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Company / Factory Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder=""
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder=""
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Business Type</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  >
                    <option value="Direct Manufacturer">Direct Manufacturer</option>
                    <option value="Trading Company">Trading Company</option>
                    <option value="OEM / ODM Specialist">OEM / ODM Specialist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Factory Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder=""
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Established Year</label>
                  <input
                    type="text"
                    value={establishedYear}
                    onChange={(e) => setEstablishedYear(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Employees</label>
                  <input
                    type="text"
                    value={employeesCount}
                    onChange={(e) => setEmployeesCount(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Factory Size</label>
                  <input
                    type="text"
                    value={factorySize}
                    onChange={(e) => setFactorySize(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Quality Certifications (comma-separated)</label>
                <input
                  type="text"
                  value={certificationsText}
                  onChange={(e) => setCertificationsText(e.target.value)}
                  placeholder=""
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-blue-600" />
                  <span>Factory Promo Video URL (YouTube / Embed Link)</span>
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder=""
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>Factory & Production Line Photo Gallery</span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder=""
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Add Photo
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Detailed Factory & Company Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder=""
                  className="w-full p-4 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed"
                />
              </div>

              {saveSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Factory profile and media info saved successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Profile...' : 'Save Factory Profile'}</span>
              </button>
            </form>
          </div>

          {/* 2. 원래 올렸던 셀러 제품 리스트 카탈로그 */}
          <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  Registered Export Catalog ({products.length})
                </h2>
                <p className="text-xs text-slate-500 mt-1">Products currently visible to global buyers.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition cursor-pointer"
                title="Add Product"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-xs text-slate-400">Loading product list...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <Package className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                  <p className="text-xs text-slate-500 font-semibold">No export products registered yet.</p>
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Register Your First Export Product ➡️
                  </button>
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
                          <img src={item.image_url} alt={item.title_en || item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div className="space-y-0.5 max-w-[180px]">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-900 truncate">{item.title_en || item.title}</h4>
                        <p className="text-[11px] font-bold text-emerald-600">${item.price || item.fob_price} USD</p>
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

      <ProductFormModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onProductCreated={handleProductCreated}
      />
    </div>
  );
}