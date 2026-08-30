// app/rfq/[id]/page.jsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  ArrowLeft,
  Clock,
  Send,
  CheckCircle2,
  Award,
  Paperclip,
  Loader2,
  DollarSign,
  MessageSquare,
  FileText,
  PackageCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RfqDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading Buyer Purchasing Specification...</span>
          </div>
        </div>
      }
    >
      <RfqDetailContent />
    </Suspense>
  );
}

function RfqDetailContent() {
  const router = useRouter();
  const params = useParams();
  const rfqId = params?.id;

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('seller');

  const [rfq, setRfq] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // 셀러 견적 투찰 양식 상태
  const [offeredPrice, setOfferedPrice] = useState('');
  const [offeredMoq, setOfferedMoq] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [proposalIncoterms, setProposalIncoterms] = useState('FOB');
  const [proposalMessage, setProposalMessage] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkUserSession();
    if (rfqId) {
      fetchRfqDetailAndProposals();
    }
  }, [rfqId]);

  const checkUserSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const role = session.user.user_metadata?.role || 'seller';
        setUserRole(role);
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  };

  const fetchRfqDetailAndProposals = async () => {
    try {
      setLoading(true);

      // 1. RFQ 상세 데이터 DB 조회
      const { data: rfqData, error: rfqErr } = await supabase
        .from('public_rfqs')
        .select('*')
        .eq('id', rfqId)
        .maybeSingle();

      if (rfqData) {
        setRfq(rfqData);
      } else {
        setRfq(null);
      }

      // 2. 제출된 견적서 목록 조회
      const { data: proposalList } = await supabase
        .from('rfq_proposals')
        .select('*')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: false });

      setProposals(proposalList || []);
    } catch (error) {
      console.error('Failed to fetch RFQ detail:', error);
      setRfq(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Login is required to submit a quotation.');
      router.push('/login');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitSuccess(false);

      const sellerMeta = user?.user_metadata || {};
      const { data: myCompany } = await supabase
        .from('companies')
        .select('company_name_en, company_name')
        .eq('user_id', user.id.toString())
        .maybeSingle();
      const sellerCompanyName = myCompany?.company_name_en || myCompany?.company_name || sellerMeta.company_name_en || sellerMeta.company_name || 'Not specified';

      const newProposal = {
        rfq_id: rfqId,
        seller_id: user.id.toString(),
        seller_company_name: sellerCompanyName,
        offered_price: `$${offeredPrice} USD / Unit`,
        offered_moq: offeredMoq,
        lead_time: leadTime,
        incoterms: proposalIncoterms,
        proposal_message: proposalMessage,
        status: 'Pending',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('rfq_proposals')
        .insert([newProposal])
        .select();

      if (error) throw error;

      if (data?.[0]) {
        setProposals([data[0], ...proposals]);
      } else {
        setProposals([{ ...newProposal, id: Date.now().toString() }, ...proposals]);
      }

      // RFQ 테이블 quote_count + 1 증가 업데이트 — 글쓴 바이어가 아닌 셀러가 하는
      // 동작이라 RLS를 우회하는 서버 라우트를 통해 처리한다.
      fetch('/api/rfq/increment-quote-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfqId })
      }).catch(() => {});

      setSubmitSuccess(true);
      setOfferedPrice('');
      setOfferedMoq('');
      setLeadTime('');
      setProposalIncoterms('FOB');
      setProposalMessage('');
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to submit proposal:', error);
      alert('Failed to submit quote: ' + (error.message || 'Database connection error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  const buyerCompany = rfq?.company_name || rfq?.buyer_company_name || 'Global Buyer';
  const buyerCountry = rfq?.country || 'Not specified';
  const orderQuantity = rfq?.order_quantity || rfq?.moq || rfq?.target_quantity || '1 Unit';
  const isRfqOwner = !!(user?.id && rfq?.user_id && user.id === rfq.user_id);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        <Link
          href="/rfq"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to RFQ Marketplace Board</span>
        </Link>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-bold">Loading buyer purchasing specifications...</p>
          </div>
        ) : !rfq ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-4">
            <PackageCheck className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-base font-extrabold text-slate-800">RFQ Specification Not Found</h3>
            <p className="text-xs text-slate-400 font-medium">This buying request may have been closed or removed by the buyer.</p>
            <Link
              href="/rfq"
              className="px-5 py-2.5 bg-blue-600 text-white text-xs font-extrabold rounded-xl shadow transition inline-block"
            >
              Return to Board
            </Link>
          </div>
        ) : (
          <>
            {/* 상단 RFQ 상세 헤더 */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-md border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  {rfq?.category || 'General Manufacturing'}
                </span>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Buyer Request
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-snug">
                {rfq?.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <Link href={`/buyers/${rfq?.user_id}`} className="font-bold hover:underline text-blue-400">
                    {buyerCompany} ({buyerCountry})
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Posted: {rfq?.created_at ? new Date(rfq.created_at).toLocaleDateString() : 'Active'}</span>
                </div>
              </div>
            </div>

            {/* 메인 상세 스펙 및 견적 제출 그리드 — 셀러만 우측에 투찰 폼이 보이고,
                바이어는 좌측 제안 목록이 전체 폭을 차지한다 (바이어는 투찰할 필요가 없음) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* 왼쪽 영역: 바이어 상세 스펙 및 도면 파일 */}
              <div className={userRole === 'seller' ? 'lg:col-span-7 space-y-6' : 'lg:col-span-12 space-y-6'}>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Buyer Purchasing Specifications
                  </h2>

                  {rfq?.product_name && (
                    <div className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-extrabold">
                      Product Name: {rfq.product_name}
                    </div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/60 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                    {rfq?.details || rfq?.description || 'No detailed specifications provided.'}
                  </p>

                  {/* 도면 및 사진 첨부파일 검증 영역 */}
                  {rfq?.drawing_url && (
                    <div className="pt-2">
                      <a
                        href={rfq.drawing_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-extrabold text-blue-600 hover:underline bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100 shadow-sm"
                      >
                        <Paperclip className="w-4 h-4 text-blue-500" />
                        <span>Inspect Product Drawing / Specification Photo</span>
                      </a>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs mt-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Buyer Target Price</span>
                      <span className="font-extrabold text-emerald-600 text-sm">{rfq?.target_price || 'Negotiable'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Target Order Quantity</span>
                      <span className="font-bold text-slate-800 text-sm">{orderQuantity}</span>
                    </div>
                  </div>
                </div>

                {/* 이미 제출된 다른 셀러 투찰 내역 — RFQ를 올린 바이어 본인만 내용을 볼 수 있음 */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span>Submitted Factory Proposals ({proposals.length})</span>
                    <Award className="w-4 h-4 text-blue-600" />
                  </h3>

                  <div className="space-y-3">
                    {!isRfqOwner ? (
                      <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                        <ShieldCheck className="w-5 h-5 text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-400 font-semibold">
                          Quote details are private and only visible to the buyer who posted this request.
                        </p>
                      </div>
                    ) : proposals.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-400 font-semibold">Be the first Korean manufacturer to submit a quote!</p>
                      </div>
                    ) : (
                      proposals.map((prop) => (
                        <div
                          key={prop.id}
                          className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-blue-600" />
                              {prop.seller_company_name}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              Offered: {prop.offered_price}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-[11px]">
                            <div className="p-2 bg-white rounded-lg border border-slate-100">
                              <span className="text-slate-400 font-bold block">MOQ</span>
                              <span className="font-extrabold text-slate-800">{prop.offered_moq || 'N/A'}</span>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-slate-100">
                              <span className="text-slate-400 font-bold block">Lead Time</span>
                              <span className="font-extrabold text-slate-800">{prop.lead_time || 'N/A'}</span>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-slate-100">
                              <span className="text-slate-400 font-bold block">Incoterms</span>
                              <span className="font-extrabold text-slate-800">{prop.incoterms || 'N/A'}</span>
                            </div>
                          </div>

                          <p className="text-slate-600 leading-relaxed text-[11px] font-medium">{prop.proposal_message}</p>

                          <Link
                            href={`/chat?sellerId=${encodeURIComponent(prop.seller_id)}&company=${encodeURIComponent(prop.seller_company_name)}&title=${encodeURIComponent(rfq?.title || rfq?.product_name || 'RFQ Inquiry')}&rfqId=${encodeURIComponent(rfqId)}`}
                            className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-blue-600 hover:underline"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message This Factory</span>
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 오른쪽 영역: 한국 셀러 전용 견적 투찰 제출 폼 — 바이어는 투찰할 일이 없으므로 숨김 */}
              {userRole === 'seller' && (
              <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    Submit Factory Quotation
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Review specifications on left and submit your direct factory offer.</p>
                </div>

                <form onSubmit={handleProposalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Offered Unit Price ($ USD) *</label>
                    <input
                      type="text"
                      required
                      value={offeredPrice}
                      onChange={(e) => setOfferedPrice(e.target.value)}
                      placeholder="e.g. 145.00"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Offered Minimum Order (MOQ) *</label>
                      <input
                        type="text"
                        required
                        value={offeredMoq}
                        onChange={(e) => setOfferedMoq(e.target.value)}
                        placeholder="e.g. 500 Units"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Lead Time & Export Terms *</label>
                      <input
                        type="text"
                        required
                        value={leadTime}
                        onChange={(e) => setLeadTime(e.target.value)}
                        placeholder="e.g. 14 Days FOB Incheon"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Incoterms</label>
                    <select
                      value={proposalIncoterms}
                      onChange={(e) => setProposalIncoterms(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold bg-white"
                    >
                      <option value="FOB">FOB</option>
                      <option value="CIF">CIF</option>
                      <option value="EXW">EXW</option>
                      <option value="FCA">FCA</option>
                      <option value="DDP">DDP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Proposal Advantage & Technical Message *</label>
                    <textarea
                      rows={4}
                      required
                      value={proposalMessage}
                      onChange={(e) => setProposalMessage(e.target.value)}
                      placeholder="Specify material ISO standards, testing capabilities, packaging, and factory advantages..."
                      className="w-full p-4 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed font-medium"
                    />
                  </div>

                  {submitSuccess && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Quotation Submitted Successfully to Buyer!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Submitting Quote...' : 'Submit Official Factory Quote'}</span>
                  </button>

                  <div className="pt-2">
                    <Link
                      href={`/chat?rfqId=${rfq.id}&buyerId=${rfq.user_id}&title=${encodeURIComponent(rfq.title)}`}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                    >
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span>Start Direct Chat with Buyer</span>
                    </Link>
                  </div>
                </form>
              </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}