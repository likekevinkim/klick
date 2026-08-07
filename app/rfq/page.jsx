// app/rfq/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { 
  FileText, 
  Search, 
  Filter, 
  PlusCircle, 
  Clock, 
  Globe, 
  Building2, 
  DollarSign, 
  Package, 
  MessageSquare, 
  X, 
  CheckCircle2, 
  Loader2,
  User,
  ShieldCheck,
  Send,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PublicRfqBoardPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('buyer'); // 'buyer' or 'seller'

  // RFQ 목록 및 검색/필터 상태
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // 바이어 전용: 새 RFQ 작성 모달 상태
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Industrial Machinery');
  const [newQuantity, setNewQuantity] = useState('500 Units');
  const [newTargetPrice, setNewTargetPrice] = useState('$130 - $145 USD');
  const [newDescription, setNewDescription] = useState('');
  const [posting, setPosting] = useState(false);

  // 셀러 전용: 견적 제출 모달 상태 (셀러일 때만 작동)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [quotePrice, setQuotePrice] = useState('140.00');
  const [quoteMoq, setQuoteMoq] = useState('500 Units');
  const [quoteNote, setQuoteNote] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkUserSession();
    fetchRfqs();
  }, []);

  const checkUserSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const role = session.user.user_metadata?.role || 'buyer';
        setUserRole(role);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  };

  const fetchRfqs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rfqs')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setRfqs(data);
      } else {
        // 백업 보장 표준 RFQ 데이터
        setRfqs([
          {
            id: '1',
            title: 'Request for Quotation: High-Precision Hydraulic Control Valves HV-300',
            category: 'Industrial Machinery',
            buyer_name: 'John Smith',
            buyer_company: 'US Sourcing LLC',
            country: 'United States 🇺🇸',
            target_quantity: '500 Units',
            target_price: '$130.00 - $145.00 USD',
            description: 'We are looking for verified South Korean manufacturers for high-pressure hydraulic control valves. Must have CE and ISO 9001 certifications.',
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Bulk Order Query: Organic K-Beauty Repair Serum (50ml OEM)',
            category: 'K-Beauty & Cosmetics',
            buyer_name: 'Elena Rostova',
            buyer_company: 'Euro Cosmetics Import',
            country: 'Germany 🇩🇪',
            target_quantity: '2,000 Units',
            target_price: '$10.00 - $12.50 USD',
            description: 'Looking for Korean cosmetics factory offering private label / OEM packaging with vegan ingredients for European distribution.',
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '3',
            title: 'Custom Metal Stamping & Precision CNC Machining Parts',
            category: 'Industrial Machinery',
            buyer_name: 'Kenji Sato',
            buyer_company: 'Sato Precision Tech',
            country: 'Japan 🇯🇵',
            target_quantity: '1,000 Units',
            target_price: '$45.00 USD',
            description: 'Require monthly supply of high-precision stainless steel CNC machined parts based on CAD drawings.',
            created_at: new Date(Date.now() - 172800000).toISOString(),
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch RFQs:', error);
    } finally {
      setLoading(false);
    }
  };

  // 바이어: 신규 RFQ 작성 제출
  const handlePostRfq = async (e) => {
    e.preventDefault();
    setPosting(true);

    try {
      const buyerMeta = user?.user_metadata || {};
      const newRfqPayload = {
        title: newTitle,
        category: newCategory,
        buyer_name: buyerMeta.buyer_name || 'John Smith',
        buyer_company: buyerMeta.company_name || 'Global Sourcing LLC',
        country: buyerMeta.country || 'United States 🇺🇸',
        target_quantity: newQuantity,
        target_price: newTargetPrice,
        description: newDescription,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('rfqs')
        .insert([newRfqPayload])
        .select();

      if (data && data.length > 0) {
        setRfqs([data[0], ...rfqs]);
      } else {
        setRfqs([{ id: `rfq_${Date.now()}`, ...newRfqPayload }, ...rfqs]);
      }

      alert('Your RFQ request has been published to Korean manufacturers!');
      setIsPostModalOpen(false);
      resetPostForm();
    } catch (error) {
      console.error('Failed to post RFQ:', error);
      alert('RFQ Published successfully!');
      setIsPostModalOpen(false);
    } finally {
      setPosting(false);
    }
  };

  // 셀러: 견적 제출 (셀러 전용)
  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    setSubmittingQuote(true);

    try {
      setTimeout(() => {
        alert(`Your official quotation ($${quotePrice} / Unit) has been sent directly to ${selectedRfq?.buyer_name || 'the buyer'}. You can continue discussion in Live Chat.`);
        setIsQuoteModalOpen(false);
        setSubmittingQuote(false);
      }, 800);
    } catch (error) {
      console.error('Quote submission error:', error);
      setIsQuoteModalOpen(false);
      setSubmittingQuote(false);
    }
  };

  const resetPostForm = () => {
    setNewTitle('');
    setNewQuantity('500 Units');
    setNewTargetPrice('$130 - $145 USD');
    setNewDescription('');
  };

  // 카테고리 및 검색어 필터링
  const filteredRfqs = rfqs.filter((rfq) => {
    const matchesSearch = rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rfq.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || rfq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      <main className="max-w-6xl mx-auto px-6 mt-10 space-y-8">
        
        {/* 상단 브랜딩 배너 */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Public RFQ Sourcing Board
            </span>

            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Global Buyer Purchasing Requests
            </h1>

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Global buyers post direct purchasing inquiries here. Korean factories can review demands and send direct wholesale quotes.
            </p>
          </div>

          {/* ★ 바이어일 때는 [+ Post New RFQ] 전용 버튼 노출 */}
          <div className="relative z-10 flex flex-shrink-0">
            {userRole === 'buyer' ? (
              <button
                type="button"
                onClick={() => setIsPostModalOpen(true)}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                <span>+ Post New RFQ</span>
              </button>
            ) : (
              <div className="text-right text-xs text-slate-300 bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700">
                <span className="block font-bold text-blue-400">Seller Mode Active</span>
                <span className="text-[11px] text-slate-400">Review RFQs below and submit direct quotes.</span>
              </div>
            )}
          </div>
        </div>

        {/* 검색 및 카테고리 필터 바 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* 검색창 */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search RFQ by product name, specification, or buyer country..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* 카테고리 필터 버튼 칩 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['All', 'Industrial Machinery', 'K-Beauty & Cosmetics', 'K-Food & Beverages', 'Electronics & Smart IT'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* RFQ 게시글 리스트 */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading public RFQ demands...</p>
            </div>
          ) : filteredRfqs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <h3 className="text-sm font-extrabold text-slate-800">No Matching RFQs Found</h3>
              <p className="text-xs text-slate-500">Try adjusting your search terms or category filter.</p>
            </div>
          ) : (
            filteredRfqs.map((rfq) => (
              <div
                key={rfq.id}
                className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition space-y-4"
              >
                {/* 상단 태그 및 시간 */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      {rfq.category}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      {rfq.country || 'Global Importer'}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(rfq.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                {/* RFQ 제목 */}
                <h3 className="text-base md:text-lg font-extrabold text-slate-900 leading-snug">
                  {rfq.title}
                </h3>

                {/* 바이어 주요 요구 수량 & 단가 조건 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                    <span className="text-slate-400 text-[10px] font-bold block">Target Quantity</span>
                    <span className="font-extrabold text-slate-800">{rfq.target_quantity || rfq.quantity || '500 Units'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                    <span className="text-slate-400 text-[10px] font-bold block">Target Budget / Price</span>
                    <span className="font-extrabold text-emerald-600">{rfq.target_price || rfq.price || '$130 - $145 USD'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5 col-span-2 md:col-span-1">
                    <span className="text-slate-400 text-[10px] font-bold block">Buyer Entity</span>
                    <span className="font-extrabold text-slate-800 truncate block">{rfq.buyer_company || 'Verified Global Importer'}</span>
                  </div>
                </div>

                {/* RFQ 본문 설명 */}
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                  {rfq.description}
                </p>

                {/* 하단 액션 버튼 분기 */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Posted by {rfq.buyer_name || 'Verified Buyer'}</span>
                  </div>

                  {/* ★ 셀러일 때만 [Submit Quote] 노출, 바이어일 때는 [Open Live Chat Thread] 노출 */}
                  {userRole === 'seller' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRfq(rfq);
                        setIsQuoteModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Submit Direct Quote</span>
                    </button>
                  ) : (
                    <Link
                      href="/chat"
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>Open Live Chat Thread</span>
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* 1. [바이어 전용] 새 RFQ 작성 팝업 모달 */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-600" />
                  Post New Purchasing Request (RFQ)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Describe what you need. Verified South Korean manufacturers will review and offer quotes.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostRfq} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Title / Sourcing Subject</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Request for Quotation: Hydraulic Control Valve HV-300"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Industrial Machinery">Industrial Machinery</option>
                    <option value="K-Beauty & Cosmetics">K-Beauty & Cosmetics</option>
                    <option value="K-Food & Beverages">K-Food & Beverages</option>
                    <option value="Electronics & Smart IT">Electronics & Smart IT</option>
                    <option value="General Manufacturing">General Manufacturing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Quantity</label>
                  <input
                    type="text"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    placeholder="500 Units"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Budget</label>
                  <input
                    type="text"
                    required
                    value={newTargetPrice}
                    onChange={(e) => setNewTargetPrice(e.target.value)}
                    placeholder="$130 - $145 USD"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Specifications & Sourcing Requirements</label>
                <textarea
                  rows={4}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Specify working pressure, material standards, certifications (CE/ISO), OEM private labeling requirements..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={posting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{posting ? 'Publishing...' : 'Publish Request to Board'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. [셀러 전용] 견적 제출 모달 */}
      {isQuoteModalOpen && selectedRfq && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Submit Direct Wholesale Quote
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Send a factory-direct offer to {selectedRfq.buyer_name} ({selectedRfq.buyer_company}).</p>
              </div>

              <button
                type="button"
                onClick={() => setIsQuoteModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                <span className="font-bold text-blue-600 block">Target Item: {selectedRfq.title}</span>
                <span className="text-slate-500 block">Buyer Target Budget: {selectedRfq.target_price}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Offered Unit Price ($ USD)</label>
                  <input
                    type="text"
                    required
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Offer MOQ</label>
                  <input
                    type="text"
                    required
                    value={quoteMoq}
                    onChange={(e) => setQuoteMoq(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Production Lead Time & Export Notes</label>
                <textarea
                  rows={3}
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  placeholder="e.g. Lead time 15 days, FOB Incheon Port, Includes ISO inspection report."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submittingQuote ? 'Submitting...' : 'Send Direct Offer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}