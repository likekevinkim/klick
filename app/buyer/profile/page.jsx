// app/buyer/profile/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { 
  Building2, 
  Globe, 
  MapPin, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  FileText, 
  MessageSquare, 
  User, 
  ShoppingBag,
  ExternalLink,
  PlusCircle,
  Clock,
  Settings,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function BuyerProfileHubPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  
  // 편집 모드 토글 상태 (기본값: false - 조회 모드)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 바이어 프로필 상태값
  const [buyerName, setBuyerName] = useState('John Smith');
  const [companyName, setCompanyName] = useState('Global Sourcing LLC');
  const [country, setCountry] = useState('United States');
  const [businessType, setBusinessType] = useState('Wholesaler / Distributor');
  const [websiteUrl, setWebsiteUrl] = useState('https://globalsourcingllc.com');
  const [interestCategory, setInterestCategory] = useState('Industrial Machinery');
  const [description, setDescription] = useState('Leading North American importer and wholesale distributor specializing in Korean high-precision industrial components and hydraulic machinery parts.');

  // 바이어가 제출한 RFQ 내역
  const [myRfqs, setMyRfqs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchBuyerSessionAndData();
  }, []);

  const fetchBuyerSessionAndData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        const meta = session.user.user_metadata || {};
        if (meta.buyer_name) setBuyerName(meta.buyer_name);
        if (meta.company_name) setCompanyName(meta.company_name);
      }

      // Supabase에서 바이어 프로필 조회
      const { data: profile } = await supabase
        .from('buyer_profiles')
        .select('*')
        .limit(1)
        .single();

      if (profile) {
        setBuyerName(profile.buyer_name || buyerName);
        setCompanyName(profile.company_name || companyName);
        setCountry(profile.country || country);
        setBusinessType(profile.business_type || businessType);
        setWebsiteUrl(profile.website_url || websiteUrl);
        setInterestCategory(profile.interest_category || interestCategory);
        setDescription(profile.description || description);
      }

      // 해당 바이어가 등록한 RFQ 목록 조회
      const { data: rfqList } = await supabase
        .from('public_rfqs')
        .select('*')
        .order('created_at', { ascending: false });

      setMyRfqs(rfqList || []);
    } catch (error) {
      console.error('Failed to load buyer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        buyer_name: buyerName,
        company_name: companyName,
        country: country,
        business_type: businessType,
        website_url: websiteUrl,
        interest_category: interestCategory,
        description: description,
      };

      await supabase.from('buyer_profiles').upsert([payload]);

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditModalOpen(false); // 저장 완료 후 모달 닫기
      }, 1500);
    } catch (error) {
      console.error('Failed to save buyer profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-8">
        {/* 상단 바이어 브랜드 배너 */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Global Buyer Sourcing Hub
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {companyName} ({country})
            </h1>
            <p className="text-slate-400 text-xs md:text-sm">
              Global buyer company profile and active purchasing demands for Korean suppliers.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/rfq"
              className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition inline-flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Explore Public RFQ Board</span>
            </Link>

            <Link
              href="/chat"
              className="px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-md transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Live Chat Hub</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 1. 바이어 회사 정보 프로필 카드 (기본 조회 화면) */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Buyer Company Information
                </h2>
                <p className="text-xs text-slate-500 mt-1">Official information verified by Korean suppliers.</p>
              </div>

              {/* 세팅(편집 모드 전환) 버튼 */}
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Settings className="w-4 h-4 text-slate-600" />
                <span>Edit Settings</span>
              </button>
            </div>

            {/* 회사 정보 리드온리 데이터 그리드 */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Contact Person</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  {buyerName}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Base Country</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {country}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Business Type</span>
                <span className="font-bold text-slate-800">{businessType}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Target Category</span>
                <span className="font-bold text-blue-600">{interestCategory}</span>
              </div>
            </div>

            {/* 회사 웹사이트 */}
            {websiteUrl && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs flex items-center justify-between">
                <span className="text-slate-500 font-bold">Official Website:</span>
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-extrabold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>{websiteUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* 바이어 회사 상세 개요 */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-extrabold text-slate-900 block">Sourcing Scope & Company Description</span>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                {description || 'No detailed description provided.'}
              </div>
            </div>
          </div>

          {/* 2. 바이어 내 RFQ 관리 현황 카드 */}
          <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  My Active RFQs ({myRfqs.length})
                </h2>
                <p className="text-xs text-slate-500 mt-1">Purchasing demands you requested to Korean suppliers.</p>
              </div>

              <Link
                href="/rfq"
                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition"
                title="View All RFQs"
              >
                <PlusCircle className="w-5 h-5" />
              </Link>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-xs text-slate-400">Loading active RFQs...</p>
                </div>
              ) : myRfqs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                  <p className="text-xs text-slate-500 font-semibold">No active RFQs posted yet.</p>
                  <Link
                    href="/rfq"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <span>Browse Public RFQ Board ➡️</span>
                  </Link>
                </div>
              ) : (
                myRfqs.map((rfq) => (
                  <div
                    key={rfq.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {rfq.category}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {rfq.created_at || 'Active'}
                      </span>
                    </div>

                    <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">{rfq.title}</h4>

                    <p className="text-[11px] text-slate-500">
                      Target Price: <span className="font-bold text-slate-800">${rfq.target_price}</span> | MOQ: <span className="font-bold text-slate-800">{rfq.target_moq}</span>
                    </p>

                    <Link
                      href={`/rfq/${rfq.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline pt-1"
                    >
                      <span>Check Submitted Supplier Quotes ➡️</span>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 3. [세팅 버튼 클릭 시 팝업] 바이어 정보 수정 팝업 모달 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Buyer Profile Settings
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Update your company details and sourcing preferences.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Country / Region</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="United States">United States</option>
                    <option value="China">China</option>
                    <option value="Japan">Japan</option>
                    <option value="Germany">Germany</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Other">Other Global Region</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business Type</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Wholesaler / Distributor">Wholesaler / Distributor</option>
                    <option value="Import Agent">Import Agent</option>
                    <option value="Retailer / Brand Owner">Retailer / Brand Owner</option>
                    <option value="End Manufacturer">End Manufacturer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Website URL</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://company.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Main Target Category</label>
                <select
                  value={interestCategory}
                  onChange={(e) => setInterestCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="Industrial Machinery">Industrial Machinery & Parts</option>
                  <option value="K-Beauty & Cosmetics">K-Beauty & Cosmetics</option>
                  <option value="K-Food & Beverages">K-Food & Beverages</option>
                  <option value="Electronics & Smart IT">Electronics & Smart IT</option>
                  <option value="General Manufacturing">General Manufacturing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed"
                />
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Profile updated successfully!
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}