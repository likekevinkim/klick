// app/rfq/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Building2, 
  Globe, 
  MapPin, 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  ArrowLeft,
  Package,
  Layers,
  Award
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RfqDetailPage() {
  const params = useParams();
  const rfqId = params.id;

  const [mounted, setMounted] = useState(false);
  const [rfq, setRfq] = useState(null);
  const [proposals, setProposals] = useState([]);
  
  // 셀러 견적 투찰 양식 상태
  const [offeredPrice, setOfferedPrice] = useState('145.00');
  const [offeredMoq, setOfferedMoq] = useState('500 Units');
  const [leadTime, setLeadTime] = useState('14 Days FOB Incheon');
  const [proposalMessage, setProposalMessage] = useState('We are a direct ISO 9001 certified Korean factory. We can satisfy your technical requirements with premium quality assurance.');
  
  const [submitting, setSaving] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchRfqDetailAndProposals();
  }, [rfqId]);

  const fetchRfqDetailAndProposals = async () => {
    try {
      // 1. RFQ 상세 데이터 조회
      const { data: rfqData } = await supabase
        .from('public_rfqs')
        .select('*')
        .eq('id', rfqId)
        .single();

      if (rfqData) {
        setRfq(rfqData);
      } else {
        // 목업 상세 데이터
        setRfq({
          id: rfqId,
          buyer_company_name: 'Global Sourcing LLC',
          buyer_country: 'United States',
          title: 'Hydraulic Flow Control Valves (1,000 Units Monthly Batch)',
          category: 'Industrial Machinery',
          target_price: '140 - 160 USD',
          target_moq: '1,000 Units',
          delivery_destination: 'Los Angeles Port, USA',
          deadline_date: '2026-10-15',
          description: 'We are seeking verified Korean manufacturers for high-durability hydraulic control valves. Must be ISO 9001 certified with test certificates provided. Long-term OEM supply agreement for North American distribution.',
          created_at: '2026-08-01',
        });
      }

      // 2. 이미 제출된 투찰 견적서 목록 조회
      const { data: proposalList } = await supabase
        .from('rfq_proposals')
        .select('*')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: false });

      setProposals(proposalList || []);
    } catch (error) {
      console.error('Failed to fetch RFQ detail:', error);
    }
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSubmitSuccess(false);

    const newProposal = {
      rfq_id: rfqId,
      seller_company_name: '한국정밀공업 (Hankook Precision Co., Ltd.)',
      offered_price: `${offeredPrice} USD / Unit`,
      offered_moq: offeredMoq,
      lead_time: leadTime,
      proposal_message: proposalMessage,
      status: 'Pending',
    };

    try {
      const { data } = await supabase.from('rfq_proposals').insert([newProposal]).select();
      if (data?.[0]) {
        setProposals([data[0], ...proposals]);
      } else {
        setProposals([{ ...newProposal, id: Date.now() }, ...proposals]);
      }

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 2500);
    } catch (error) {
      console.error('Failed to submit proposal:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        <Link
          href="/rfq"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to RFQ Marketplace</span>
        </Link>

        {/* 상단 RFQ 타이틀 헤더 */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-md border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              {rfq?.category}
            </span>
            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Purchasing Demand
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-snug">
            {rfq?.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <Link href={`/buyers/${rfqId}`} className="font-bold hover:underline text-blue-400">
                {rfq?.buyer_company_name} ({rfq?.buyer_country})
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Destination: {rfq?.delivery_destination}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Deadline: {rfq?.deadline_date}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 바이어 요구 스펙 및 제출된 투찰 목록 */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Buyer Purchasing Specifications
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">
                {rfq?.description}
              </p>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs mt-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Buyer Target Price</span>
                  <span className="font-extrabold text-blue-600 text-sm">${rfq?.target_price}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Target MOQ</span>
                  <span className="font-bold text-slate-800 text-sm">{rfq?.target_moq}</span>
                </div>
              </div>
            </div>

            {/* 이미 제출된 다른 셀러 투찰 내역 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Submitted Seller Proposals ({proposals.length})</span>
                <Award className="w-4 h-4 text-blue-600" />
              </h3>

              <div className="space-y-3">
                {proposals.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400">Be the first Korean manufacturer to submit a proposal!</p>
                  </div>
                ) : (
                  proposals.map((prop) => (
                    <div
                      key={prop.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          {prop.seller_company_name}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Offered: {prop.offered_price}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{prop.proposal_message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 한국 셀러 견적 투찰 제출 폼 */}
          <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                Submit Seller B2B Proposal
              </h2>
              <p className="text-xs text-slate-500 mt-1">Submit your factory price and supply terms directly to this buyer.</p>
            </div>

            <form onSubmit={handleProposalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Offered Unit Price ($ USD)</label>
                <input
                  type="text"
                  required
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(e.target.value)}
                  placeholder="145.00"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Offered MOQ</label>
                  <input
                    type="text"
                    required
                    value={offeredMoq}
                    onChange={(e) => setOfferedMoq(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lead Time & Term</label>
                  <input
                    type="text"
                    required
                    value={leadTime}
                    onChange={(e) => setLeadTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Proposal Message & Factory Advantage</label>
                <textarea
                  rows={4}
                  required
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed"
                />
              </div>

              {submitSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> B2B Proposal Submitted Successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting Quote...' : 'Submit Wholesale Proposal'}</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}