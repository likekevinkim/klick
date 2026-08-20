// app/buyers/[id]/page.jsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Globe2, 
  FileText, 
  MessageSquare, 
  ShieldCheck, 
  Loader2, 
  ArrowRight,
  Briefcase,
  Layers,
  User,
  ShoppingBag,
  Clock,
  Paperclip
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PublicBuyerShowroomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading Buyer Showroom Profile...</span>
          </div>
        </div>
      }
    >
      <PublicBuyerShowroomContent />
    </Suspense>
  );
}

function PublicBuyerShowroomContent() {
  const params = useParams();
  const buyerId = params?.id;

  const [mounted, setMounted] = useState(false);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (buyerId) {
      fetchPublicBuyerData();
    }
  }, [buyerId]);

  const fetchPublicBuyerData = async () => {
    try {
      setLoading(true);

      const buyerIdStr = buyerId ? buyerId.toString() : '';

      // 1. `buyers` has the real name (buyer_name) set at signup; `buyer_profiles` has the
      // optional extended business-profile fields. Merge both, buyers as the name source.
      const { data: buyerRow } = await supabase
        .from('buyers')
        .select('*')
        .eq('auth_user_id', buyerIdStr)
        .maybeSingle();

      const { data: profile } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('auth_user_id', buyerIdStr)
        .maybeSingle();

      if (buyerRow || profile) {
        setBuyerProfile({
          contact_person: buyerRow?.buyer_name || 'Global Buyer',
          company_name: profile?.company_name || buyerRow?.company_name || 'Verified Importer',
          country: profile?.country || buyerRow?.country || 'United States',
          business_type: profile?.business_type || 'Wholesaler / Distributor',
          target_category: buyerRow?.interest_category || 'Industrial Machinery',
          website_url: profile?.website_url || '',
          description: profile?.description || 'Verified global wholesale buyer on KLICK platform.'
        });
      } else {
        setBuyerProfile({
          contact_person: 'Global Buyer',
          company_name: 'Verified Importer',
          country: 'United States',
          business_type: 'Wholesaler / Distributor',
          target_category: 'Industrial Machinery',
          website_url: '',
          description: 'Verified global wholesale buyer on KLICK platform.'
        });
      }

      // 2. 해당 바이어(user_id)가 게시한 실제 public_rfqs 목록 정밀 연동
      if (buyerIdStr) {
        const { data: rfqList, error: rfqErr } = await supabase
          .from('public_rfqs')
          .select('*')
          .eq('user_id', buyerIdStr)
          .order('created_at', { ascending: false });

        if (rfqErr) {
          console.error('Error fetching public RFQ list:', rfqErr);
        }

        if (rfqList && rfqList.length > 0) {
          setRfqs(rfqList);
        } else {
          setRfqs([]);
        }
      } else {
        setRfqs([]);
      }
    } catch (err) {
      console.error('Error fetching public buyer data:', err);
      setRfqs([]);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const contactPerson = buyerProfile?.contact_person || buyerProfile?.buyer_name || 'Global Buyer';
  const companyName = buyerProfile?.company_name || 'Verified Importer';
  const country = buyerProfile?.country || 'United States';
  const businessType = buyerProfile?.business_type || 'Wholesaler / Distributor';
  const targetCategory = buyerProfile?.target_category || buyerProfile?.interest_category || 'Industrial Machinery';
  const websiteUrl = buyerProfile?.website_url || '';
  const description = buyerProfile?.description || '';

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      {/* Hero Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="bg-[#0F172A] text-white rounded-3xl p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-extrabold border border-blue-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Global Buyer Sourcing Profile</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              {companyName ? `${companyName} (${country})` : `Buyer (${country})`}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-bold pt-1">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-400" />
                <span>Contact Person: <strong className="text-white">{contactPerson}</strong></span>
              </div>

              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>{country}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <Link
              href={`/chat?buyerId=${buyerId}&company=${encodeURIComponent(companyName)}`}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Start Direct Chat with Buyer</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Company Information */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-extrabold text-slate-900">Buyer Company Information</h2>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">Official profile information verified by KLICK.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Contact Person</span>
                <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  {contactPerson}
                </span>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Company Name</span>
                <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  {companyName}
                </span>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Base Country</span>
                <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  {country}
                </span>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Business Type</span>
                <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  {businessType}
                </span>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1 sm:col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Target Category</span>
                <span className="text-sm font-extrabold text-blue-600 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  {targetCategory}
                </span>
              </div>
            </div>

            {websiteUrl && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">Official Website:</span>
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-extrabold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>{websiteUrl}</span>
                  <Globe2 className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Sourcing Scope & Company Description
              </h3>
              <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                {description || 'No detailed sourcing scope provided.'}
              </div>
            </div>
          </div>

          {/* Active RFQs List (마이페이지 RFQ와 100% 실시간 연동) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Active RFQs ({rfqs.length})
                  </h2>
                </div>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Loading buyer active RFQs...</p>
                  </div>
                ) : rfqs.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                    <p className="text-xs text-slate-500 font-semibold">No active RFQs posted by this buyer yet.</p>
                  </div>
                ) : (
                  rfqs.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-100/60 px-2.5 py-0.5 rounded-md border border-blue-200">
                          {item.category || 'Manufacturing'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Active'}
                        </span>
                      </div>

                      <div>
                        {item.product_name && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 mb-1 inline-block">
                            Product: {item.product_name}
                          </span>
                        )}
                        <h3 className="text-xs font-extrabold text-slate-900 leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                      </div>

                      {item.drawing_url && (
                        <div className="pt-1">
                          <a
                            href={item.drawing_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600 hover:underline bg-white px-2 py-1 rounded-md border border-slate-200"
                          >
                            <Paperclip className="w-3 h-3 text-blue-500" />
                            <span>View Product Drawing / Photo</span>
                          </a>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-500 space-y-0.5 font-medium">
                        <p>Target Price: <strong className="text-emerald-600 font-bold">{item.target_price || 'Negotiable'}</strong></p>
                        <p>Order Qty: <strong className="text-slate-800 font-bold">{item.order_quantity || item.moq || '1 Unit'}</strong></p>
                      </div>

                      {item.details && (
                        <p className="text-[10px] text-slate-600 line-clamp-2 bg-white p-2 rounded-lg border border-slate-100 font-medium">
                          {item.details}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          {item.quote_count || 0} Factory Quotes
                        </span>

                        <Link
                          href={`/chat?buyerId=${buyerId}&rfqTitle=${encodeURIComponent(item.title)}`}
                          className="text-xs font-extrabold text-slate-700 hover:text-blue-600 transition flex items-center gap-1"
                        >
                          <span>Send Quote in Chat</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}