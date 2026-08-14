// app/buyer/profile/page.jsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  X,
  Loader2,
  ArrowRight,
  Mail,
  Plus,
  Briefcase,
  Layers
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function BuyerProfileHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading KLICK Buyer Sourcing Hub...</span>
          </div>
        </div>
      }
    >
      <BuyerProfileContent />
    </Suspense>
  );
}

function BuyerProfileContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  
  // 편집 모드 토글 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 바이어 프로필 상태값 (2번 수정: Contact Person 연동 / 3번 수정: Company Name 연동)
  const [contactPerson, setContactPerson] = useState('Kevin');
  const [companyName, setCompanyName] = useState('Global Sourcing LLC');
  const [country, setCountry] = useState('United States');
  const [businessType, setBusinessType] = useState('Wholesaler / Distributor');
  const [websiteUrl, setWebsiteUrl] = useState('https://globalsourcingllc.com');
  const [interestCategory, setInterestCategory] = useState('Industrial Machinery');
  const [description, setDescription] = useState('Leading North American importer and wholesale distributor specializing in Korean high-precision industrial components and hydraulic machinery parts.');
  const [email, setEmail] = useState('john.smith@globalsourcingllc.com');

  // 바이어가 제출한 실제 RFQ 내역
  const [myRfqs, setMyRfqs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1번 수정: 신규 RFQ 작성 모달 상태
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [isSubmittingRfq, setIsSubmittingRfq] = useState(false);
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqCategory, setRfqCategory] = useState('Industrial Machinery');
  const [rfqTargetPrice, setRfqTargetPrice] = useState('$130 - $145 USD');
  const [rfqMoq, setRfqMoq] = useState('500 Units');
  const [rfqDetails, setRfqDetails] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchBuyerSessionAndData();
  }, []);

  const fetchBuyerSessionAndData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      let buyerEmail = email;

      if (session?.user) {
        setUser(session.user);
        buyerEmail = session.user.email || email;
        setEmail(buyerEmail);

        const meta = session.user.user_metadata || {};
        if (meta.contact_person || meta.buyer_name) {
          setContactPerson(meta.contact_person || meta.buyer_name);
        }
        if (meta.company_name) setCompanyName(meta.company_name);
        if (meta.country) setCountry(meta.country);
      }

      // 1. Supabase에서 바이어 프로필 조회
      const userIdStr = session?.user?.id ? session.user.id.toString() : null;
      let query = supabase.from('buyer_profiles').select('*');
      if (userIdStr) {
        query = query.eq('user_id', userIdStr);
      }

      const { data: profile } = await query.maybeSingle();

      if (profile) {
        setContactPerson(profile.contact_person || profile.buyer_name || contactPerson);
        setCompanyName(profile.company_name || companyName);
        setCountry(profile.country || country);
        setBusinessType(profile.business_type || businessType);
        setWebsiteUrl(profile.website_url || websiteUrl);
        setInterestCategory(profile.interest_category || profile.target_category || interestCategory);
        setDescription(profile.description || description);
      }

      // 2. Supabase DB 'public_rfqs' 또는 'rfqs' 테이블에서 해당 바이어의 실제 RFQ 목록 연동
      let rfqQuery = supabase.from('public_rfqs').select('*');
      if (userIdStr) {
        rfqQuery = rfqQuery.eq('user_id', userIdStr);
      }

      const { data: rfqList } = await rfqQuery.order('created_at', { ascending: false });

      if (rfqList && rfqList.length > 0) {
        setMyRfqs(rfqList);
      } else {
        // 샘플 RFQ 데이터
        setMyRfqs([
          {
            id: '1',
            title: 'Request for Quotation: Hydraulic Control Valve HV-300 Series',
            category: 'Industrial Machinery',
            moq: '500 Units',
            target_price: '$130 - $145 USD',
            status: 'Active',
            quote_count: 3,
            created_at: '2026-08-14T09:00:00.000Z',
          },
          {
            id: '2',
            title: 'Organic K-Beauty Repair Serum (Private Label OEM)',
            category: 'K-Beauty & Cosmetics',
            moq: '2,000 Units',
            target_price: '$10 - $12 USD',
            status: 'Quoted',
            quote_count: 5,
            created_at: '2026-08-13T14:00:00.000Z',
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load buyer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // 프로필 정보 저장
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const userIdStr = user?.id ? user.id.toString() : 'guest_buyer';

      const payload = {
        user_id: userIdStr,
        contact_person: contactPerson,
        buyer_name: contactPerson,
        company_name: companyName,
        country: country,
        business_type: businessType,
        website_url: websiteUrl,
        interest_category: interestCategory,
        target_category: interestCategory,
        description: description,
        updated_at: new Date().toISOString()
      };

      await supabase.from('buyer_profiles').upsert([payload], { onConflict: 'user_id' });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditModalOpen(false);
      }, 1200);
    } catch (error) {
      console.error('Failed to save buyer profile:', error);
      alert('Failed to save profile settings: ' + (error.message || 'Database error'));
    } finally {
      setSaving(false);
    }
  };

  // 1번 수정: 신규 RFQ 작성 및 게시 처리
  const handleCreateRfq = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Login is required to post an RFQ.');
      router.push('/login');
      return;
    }

    try {
      setIsSubmittingRfq(true);
      const userIdStr = user.id.toString();

      const newRfqPayload = {
        user_id: userIdStr,
        buyer_name: contactPerson || 'Kevin',
        company_name: companyName || 'Global Buyer',
        title: rfqTitle,
        category: rfqCategory,
        target_price: rfqTargetPrice,
        moq: rfqMoq,
        details: rfqDetails,
        quote_count: 0,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('public_rfqs')
        .insert([newRfqPayload])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMyRfqs((prev) => [data, ...prev]);
      }

      setIsRfqModalOpen(false);
      setRfqTitle('');
      setRfqDetails('');
      alert('New public RFQ posted successfully to Korean Suppliers!');
    } catch (err) {
      console.error('Create RFQ error:', err);
      alert('Failed to publish RFQ: ' + (err.message || 'Database error'));
    } finally {
      setIsSubmittingRfq(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-8">
        {/* 상단 바이어 브랜드 배너 */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Global Buyer Sourcing Hub
              </span>

              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                {companyName ? `${companyName} (${country})` : `Buyer (${country})`}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
                {/* 2번 수정: Contact Person (Kevin) 연동 */}
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>Contact Person: <strong className="text-white">{contactPerson}</strong></span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-emerald-400" /> {country}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4 text-purple-400" /> {email}
                </span>
              </div>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 1. 바이어 회사 정보 프로필 카드 */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Buyer Company Information
                </h2>
                <p className="text-xs text-slate-500 mt-1">Official information verified by Korean suppliers.</p>
              </div>

              {/* Edit Settings 버튼 */}
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Settings className="w-4 h-4 text-slate-600" />
                <span>Edit Settings</span>
              </button>
            </div>

            {/* 회사 정보 데이터 그리드 */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* 2번 수정: Contact Person 필드 표출 */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Person</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  {contactPerson}
                </span>
              </div>

              {/* 3번 수정: Company Name (선택값) 필드 추가 */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Company Name (Optional)</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  {companyName || 'Not Specified'}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Base Country</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  {country}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Business Type</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  {businessType}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Category</span>
                <span className="font-extrabold text-blue-600 text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  {interestCategory}
                </span>
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
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium">
                {description || 'No detailed description provided.'}
              </div>
            </div>
          </div>

          {/* 2. My Active RFQs 현황 카드 및 1번 수정: RFQ 요청 버튼 */}
          <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  My Active RFQs ({myRfqs.length})
                </h2>
                <p className="text-xs text-slate-500 mt-1">Purchasing demands you requested to Korean suppliers.</p>
              </div>

              {/* 1번 수정: 바이어가 새 RFQ(견적 요청)를 등록하는 핵심 플러스 버튼 */}
              <button
                type="button"
                onClick={() => setIsRfqModalOpen(true)}
                className="w-9 h-9 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center transition cursor-pointer shadow-sm"
                title="Post New RFQ Request"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading active RFQs from database...</p>
                </div>
              ) : myRfqs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3 p-6">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                  <p className="text-xs text-slate-500 font-semibold">No active RFQs posted yet.</p>
                  <button
                    type="button"
                    onClick={() => setIsRfqModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow hover:bg-emerald-500 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Post First Public RFQ</span>
                  </button>
                </div>
              ) : (
                myRfqs.map((rfq) => (
                  <div
                    key={rfq.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {rfq.category || 'Manufacturing'}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(rfq.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">{rfq.title}</h4>

                    <p className="text-[11px] text-slate-500">
                      Target Price: <span className="font-bold text-emerald-600">{rfq.target_price || rfq.price || '$145 USD'}</span> | MOQ: <span className="font-bold text-slate-800">{rfq.target_quantity || rfq.moq || '500 Units'}</span>
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md">
                        {rfq.quote_count || rfq.quotes_count || 3} Factory Quotes
                      </span>

                      <Link
                        href="/chat"
                        className="font-bold text-slate-700 hover:text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <span>Check Quotes in Chat</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 1번 수정: 하단 신규 RFQ 요청 버튼 */}
            <button
              type="button"
              onClick={() => setIsRfqModalOpen(true)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post New RFQ Request to Factories</span>
            </button>
          </div>

        </div>
      </main>

      {/* 모달 1: Buyer Profile Settings Edit Modal */}
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

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* 2번 수정: Contact Person 필드 */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person (Real Name)</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* 3번 수정: Company Name (선택값) 필드 */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Name (Optional)</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Global Sourcing LLC"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Country / Region</label>

                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                  <label className="block font-bold text-slate-700 mb-1">Business Type</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Wholesaler / Distributor">Wholesaler / Distributor</option>
                    <option value="Import Agent">Import Agent</option>
                    <option value="Retailer / Brand Owner">Retailer / Brand Owner</option>
                    <option value="End Manufacturer">End Manufacturer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Website URL</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://company.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Main Target Category</label>
                <select
                  value={interestCategory}
                  onChange={(e) => setInterestCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="Industrial Machinery">Industrial Machinery & Parts</option>
                  <option value="K-Beauty & Cosmetics">K-Beauty & Cosmetics</option>
                  <option value="K-Food & Beverages">K-Food & Beverages</option>
                  <option value="Electronics & Smart IT">Electronics & Smart IT</option>
                  <option value="General Manufacturing">General Manufacturing</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sourcing Scope & Company Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed"
                />
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Profile settings updated successfully!
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

      {/* 모달 2: 1번 수정 - Post New Public RFQ Request Modal */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Post New Public RFQ Request
              </h3>
              <button
                type="button"
                onClick={() => setIsRfqModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRfq} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">RFQ Title / Product Required</label>
                <input
                  type="text"
                  value={rfqTitle}
                  onChange={(e) => setRfqTitle(e.target.value)}
                  placeholder="e.g. Request for Quotation: CNC Machined Stainless Steel Parts"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">Target Category</label>
                  <select
                    value={rfqCategory}
                    onChange={(e) => setRfqCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium bg-white"
                  >
                    <option value="Industrial Machinery">Industrial Machinery</option>
                    <option value="K-Beauty & Cosmetics">K-Beauty & Cosmetics</option>
                    <option value="K-Food & Beverages">K-Food & Beverages</option>
                    <option value="Electronics & Smart IT">Electronics & Smart IT</option>
                    <option value="General Manufacturing">General Manufacturing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">Target FOB Price Range</label>
                  <input
                    type="text"
                    value={rfqTargetPrice}
                    onChange={(e) => setRfqTargetPrice(e.target.value)}
                    placeholder="$130 - $145 USD"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Minimum Order Quantity (MOQ)</label>
                <input
                  type="text"
                  value={rfqMoq}
                  onChange={(e) => setRfqMoq(e.target.value)}
                  placeholder="500 Units"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Detailed Technical Specifications</label>
                <textarea
                  rows={4}
                  value={rfqDetails}
                  onChange={(e) => setRfqDetails(e.target.value)}
                  placeholder="Provide material specs, certifications required, packaging terms, and lead time requirements..."
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRfq}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRfq ? 'Publishing...' : 'Publish Public RFQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}