// app/buyer/profile/page.jsx
'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
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
  Clock, 
  Settings, 
  X, 
  Loader2, 
  ArrowRight, 
  Mail, 
  Plus, 
  Briefcase, 
  Layers, 
  Image as ImageIcon, 
  Paperclip 
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
  
  // Settings Modal Toggle
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Buyer Profile State Fields
  const [contactPerson, setContactPerson] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('United States');
  const [businessType, setBusinessType] = useState('Wholesaler / Distributor');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [interestCategory, setInterestCategory] = useState('Industrial Machinery');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');

  // RFQ List State
  const [myRfqs, setMyRfqs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // New RFQ Modal State
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [isSubmittingRfq, setIsSubmittingRfq] = useState(false);
  const [rfqProductName, setRfqProductName] = useState('');
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqCategory, setRfqCategory] = useState('Industrial Machinery');
  const [rfqTargetPrice, setRfqTargetPrice] = useState('');
  const [rfqOrderQuantity, setRfqOrderQuantity] = useState('');
  const [rfqDetails, setRfqDetails] = useState('');

  // Drawing File Attachment State
  const [rfqAttachment, setRfqAttachment] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

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
        buyerEmail = session.user.email || '';
        setEmail(buyerEmail);

        const meta = session.user.user_metadata || {};
        if (meta.contact_person || meta.buyer_name) {
          setContactPerson(meta.contact_person || meta.buyer_name);
        }
        if (meta.company_name) setCompanyName(meta.company_name);
        if (meta.country) setCountry(meta.country);
      }

      // 1. Fetch Buyer Profile from Supabase — `buyers` has the identity fields set at
      // signup (buyer_name, interest_category); `buyer_profiles` has the extended
      // business-profile fields (business_type, website_url, description).
      const userIdStr = session?.user?.id ? session.user.id.toString() : null;

      if (userIdStr) {
        const { data: buyerRow } = await supabase
          .from('buyers')
          .select('*')
          .eq('auth_user_id', userIdStr)
          .maybeSingle();

        if (buyerRow) {
          setContactPerson(buyerRow.buyer_name || contactPerson);
          setCompanyName(buyerRow.company_name || companyName);
          setCountry(buyerRow.country || country);
          setInterestCategory(buyerRow.interest_category || interestCategory);
        }

        const { data: profile } = await supabase
          .from('buyer_profiles')
          .select('*')
          .eq('auth_user_id', userIdStr)
          .maybeSingle();

        if (profile) {
          setCompanyName(profile.company_name || companyName);
          setCountry(profile.country || country);
          setBusinessType(profile.business_type || businessType);
          setWebsiteUrl(profile.website_url || websiteUrl);
          setDescription(profile.description || description);
        }
      }

      // 2. Fetch Buyer's Real Active RFQs from DB
      if (userIdStr) {
        const { data: rfqList } = await supabase
          .from('public_rfqs')
          .select('*')
          .eq('user_id', userIdStr)
          .order('created_at', { ascending: false });

        if (rfqList) {
          setMyRfqs(rfqList);
        } else {
          setMyRfqs([]);
        }
      } else {
        setMyRfqs([]);
      }
    } catch (error) {
      console.error('Failed to load buyer profile data:', error);
      setMyRfqs([]);
    } finally {
      setLoading(false);
    }
  };

  // Drawing File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `rfq_drawing_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `rfq_drawings/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('company-images')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('company-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setRfqAttachment({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type: file.type.includes('image') ? 'image' : 'drawing',
          url: publicUrlData.publicUrl
        });
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Failed to upload drawing/photo: ' + (err.message || 'Storage error'));
    } finally {
      setUploadingFile(false);
    }
  };

  // Save Buyer Profile Settings
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const userIdStr = user?.id ? user.id.toString() : 'guest_buyer';

      await supabase.from('buyers').upsert([
        {
          auth_user_id: userIdStr,
          buyer_name: contactPerson,
          buyer_email: email,
          company_name: companyName,
          country: country,
          interest_category: interestCategory,
        }
      ], { onConflict: 'auth_user_id' });

      await supabase.from('buyer_profiles').upsert([
        {
          auth_user_id: userIdStr,
          company_name: companyName,
          country: country,
          business_type: businessType,
          website_url: websiteUrl,
          description: description,
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'auth_user_id' });

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

  // Create New Public RFQ
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
      const validCompanyName = companyName || 'Global Sourcing LLC';

      const newRfqPayload = {
        user_id: userIdStr,
        buyer_name: contactPerson || 'Global Buyer',
        company_name: validCompanyName,
        buyer_company_name: validCompanyName,
        product_name: rfqProductName || rfqTitle,
        title: rfqTitle,
        category: rfqCategory,
        target_price: rfqTargetPrice,
        moq: rfqOrderQuantity,
        order_quantity: rfqOrderQuantity,
        details: rfqDetails,
        drawing_url: rfqAttachment?.url || null,
        drawing_name: rfqAttachment?.name || null,
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
      setRfqProductName('');
      setRfqTitle('');
      setRfqTargetPrice('');
      setRfqOrderQuantity('');
      setRfqDetails('');
      setRfqAttachment(null);
      alert('New public RFQ published successfully to Korean Suppliers!');
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
        {/* Top Hero Banner */}
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
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>Contact Person: <strong className="text-white">{contactPerson || 'Buyer'}</strong></span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-emerald-400" /> {country}
                </span>
                {email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4 text-purple-400" /> {email}
                  </span>
                )}
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
          
          {/* 1. Buyer Company Information Card */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Buyer Company Information
                </h2>
                <p className="text-xs text-slate-500 mt-1">Official information verified by Korean suppliers.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Settings className="w-4 h-4 text-slate-600" />
                <span>Edit Settings</span>
              </button>
            </div>

            {/* Profile Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Person</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  {contactPerson || 'Not Specified'}
                </span>
              </div>

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

            {/* Website URL */}
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

            {/* Sourcing Scope & Description */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-extrabold text-slate-900 block">Sourcing Scope & Company Description</span>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium">
                {description || 'No detailed description provided.'}
              </div>
            </div>
          </div>

          {/* 2. My Active RFQs List */}
          <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  My Active RFQs ({myRfqs.length})
                </h2>
                <p className="text-xs text-slate-500 mt-1">Purchasing demands you requested to Korean suppliers.</p>
              </div>

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
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {rfq.category || 'Manufacturing'}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(rfq.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      {rfq.product_name && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 mb-1 inline-block">
                          Product: {rfq.product_name}
                        </span>
                      )}
                      <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">{rfq.title}</h4>
                    </div>

                    {rfq.drawing_url && (
                      <div className="pt-1">
                        <a
                          href={rfq.drawing_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600 hover:underline bg-white px-2 py-1 rounded-md border border-slate-200"
                        >
                          <Paperclip className="w-3 h-3 text-blue-500" />
                          <span>View Product Drawing / Photo</span>
                        </a>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500">
                      Target Price: <span className="font-bold text-emerald-600">{rfq.target_price || 'Negotiable'}</span> | Order Qty: <span className="font-bold text-slate-800">{rfq.order_quantity || rfq.moq || '1 Unit'}</span>
                    </p>

                    {rfq.details && (
                      <p className="text-[10px] text-slate-600 line-clamp-2 bg-white p-2 rounded-lg border border-slate-100 font-medium">
                        {rfq.details}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md">
                        {rfq.quote_count || 0} Factory Quotes
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

      {/* Modal 1: Buyer Profile Settings Edit Modal */}
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

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Name (Optional)</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder=""
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
                  placeholder=""
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
                <label className="block text-slate-700 font-extrabold mb-1">Sourcing Scope & Company Description</label>
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

      {/* Modal 2: Post New Public RFQ Modal */}
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
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRfq} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Product Name</label>
                <input
                  type="text"
                  value={rfqProductName}
                  onChange={(e) => setRfqProductName(e.target.value)}
                  placeholder=""
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">RFQ Subject Title</label>
                <input
                  type="text"
                  value={rfqTitle}
                  onChange={(e) => setRfqTitle(e.target.value)}
                  placeholder=""
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
                    placeholder=""
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Estimated Order Quantity</label>
                <input
                  type="text"
                  value={rfqOrderQuantity}
                  onChange={(e) => setRfqOrderQuantity(e.target.value)}
                  placeholder="e.g. 500 Units"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                />
              </div>

              {/* 제품 사진 및 CAD/블루프린트 도면 첨부 파일 업로더 */}
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Attach Product Drawing or Specification Photo</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.cad,.dwg"
                  className="hidden"
                />

                {rfqAttachment ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      {rfqAttachment.type === 'image' ? <ImageIcon className="w-4 h-4 text-emerald-600" /> : <Paperclip className="w-4 h-4 text-blue-600" />}
                      <span className="font-extrabold text-blue-900 truncate max-w-[200px]">{rfqAttachment.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRfqAttachment(null)}
                      className="text-rose-600 hover:underline text-[10px] font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={uploadingFile}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-600 font-bold transition cursor-pointer"
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <>
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <span>Upload Product Photo or Technical Drawing</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Detailed Technical Specifications</label>
                <textarea
                  rows={3}
                  value={rfqDetails}
                  onChange={(e) => setRfqDetails(e.target.value)}
                  placeholder=""
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
                  disabled={isSubmittingRfq || uploadingFile}
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