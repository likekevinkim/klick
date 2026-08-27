// app/rfq/RfqBoardClient.jsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Search, 
  Clock, 
  MapPin, 
  Building2, 
  ShieldCheck, 
  MessageSquare, 
  Loader2, 
  Plus, 
  Paperclip, 
  X,
  ShoppingBag,
  PlusCircle,
  ArrowRight,
  Send,
  Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FILTER_CATEGORIES } from '@/lib/categories';

export default function RfqBoardClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading Global Public RFQ Sourcing Board...</span>
          </div>
        </div>
      }
    >
      <PublicRfqBoardContent />
    </Suspense>
  );
}

function PublicRfqBoardContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('buyer');

  const [rfqList, setRfqList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Buyer modal state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newCategory, setNewCategory] = useState('Industrial Machinery');
  const [newQuantity, setNewQuantity] = useState('');
  const [newTargetPrice, setNewTargetPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [posting, setPosting] = useState(false);

  const categories = FILTER_CATEGORIES;

  useEffect(() => {
    setMounted(true);
    checkUserSession();
    fetchPublicRfqs();
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

  const fetchPublicRfqs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('public_rfqs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching public RFQs from DB:', error);
        setRfqList([]);
      } else if (data) {
        setRfqList(data);
      } else {
        setRfqList([]);
      }
    } catch (err) {
      console.error('Exception fetching public RFQs:', err);
      setRfqList([]);
    } finally {
      setLoading(false);
    }
  };

  // 로그인한 바이어만 RFQ를 등록할 수 있다 — 두 "Post New RFQ" 버튼 모두 이 핸들러로 진입시킨다
  const handleOpenPostModal = () => {
    if (!user) {
      alert('바이어로 로그인해야 RFQ를 등록할 수 있습니다.');
      router.push('/login');
      return;
    }
    setIsPostModalOpen(true);
  };

  const handlePostRfq = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('바이어로 로그인해야 RFQ를 등록할 수 있습니다.');
      router.push('/login');
      return;
    }

    setPosting(true);

    try {
      const buyerMeta = user.user_metadata || {};
      const newRfqPayload = {
        user_id: user.id.toString(),
        title: newTitle,
        product_name: newProductName || newTitle,
        category: newCategory,
        buyer_name: buyerMeta.contact_person || buyerMeta.buyer_name || 'Global Buyer',
        company_name: buyerMeta.company_name || 'Global Sourcing LLC',
        buyer_company_name: buyerMeta.company_name || 'Global Sourcing LLC',
        order_quantity: newQuantity,
        moq: newQuantity,
        target_price: newTargetPrice,
        details: newDescription,
        quote_count: 0,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('public_rfqs')
        .insert([newRfqPayload])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setRfqList([data, ...rfqList]);
      }

      alert('Your RFQ request has been published to Korean manufacturers!');
      setIsPostModalOpen(false);
      resetPostForm();
    } catch (error) {
      console.error('Failed to post RFQ:', error);
      alert('Failed to publish RFQ: ' + (error.message || 'Database error'));
    } finally {
      setPosting(false);
    }
  };

  const resetPostForm = () => {
    setNewTitle('');
    setNewProductName('');
    setNewQuantity('');
    setNewTargetPrice('');
    setNewDescription('');
  };

  const filteredRfqs = rfqList.filter((rfq) => {
    const matchesCategory = 
      selectedCategory === 'All' || 
      (rfq.category && rfq.category.trim().toLowerCase() === selectedCategory.toLowerCase());

    const searchLower = searchTerm.trim().toLowerCase();
    const matchesSearch = 
      !searchLower ||
      (rfq.title && rfq.title.toLowerCase().includes(searchLower)) ||
      (rfq.product_name && rfq.product_name.toLowerCase().includes(searchLower)) ||
      (rfq.buyer_name && rfq.buyer_name.toLowerCase().includes(searchLower)) ||
      (rfq.company_name && rfq.company_name.toLowerCase().includes(searchLower)) ||
      (rfq.details && rfq.details.toLowerCase().includes(searchLower));

    return matchesCategory && matchesSearch;
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      {/* 1. Hero Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="bg-[#0F172A] text-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-extrabold border border-blue-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Public RFQ Sourcing Board</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black tracking-tight">
              Global Buyer Purchasing Requests
            </h1>

            <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed">
              Global buyers post direct purchasing inquiries here. Korean factories can review specifications in detail and send direct wholesale quotes.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3">
            {userRole === 'buyer' ? (
              <button
                type="button"
                onClick={handleOpenPostModal}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post New RFQ</span>
              </button>
            ) : (
              <div className="text-right text-xs text-slate-300 bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700">
                <span className="block font-bold text-blue-400">Seller Mode Active</span>
                <span className="text-[11px] text-slate-400">Click any RFQ card below to inspect full specs & submit quotes.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Search & Filter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search RFQ by product, title or buyer..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none focus:bg-white transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="text-xs font-extrabold text-slate-500 flex items-center gap-1.5 self-end md:self-auto">
              <span>Active Buying Requests:</span>
              <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100 font-black">
                {filteredRfqs.length} Requests
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. RFQ Cards Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-bold">Loading live RFQ demands from database...</p>
          </div>
        ) : filteredRfqs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-4">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">No Matching RFQs Found</h3>
              <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                {searchTerm || selectedCategory !== 'All'
                  ? 'There are currently no buying requests matching your filter.'
                  : 'There are currently no buying requests posted in the database. Post the first RFQ!'}
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              {(searchTerm || selectedCategory !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Reset Filters
                </button>
              )}

              {userRole === 'buyer' && (
                <button
                  type="button"
                  onClick={handleOpenPostModal}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit First Buying Inquiry (RFQ)</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRfqs.map((rfq) => (
              /* 카드 블록 전체 클릭 시 상세 검증 페이지로 이동 */
              <div
                key={rfq.id}
                onClick={() => router.push(`/rfq/${rfq.id}`)}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-blue-500 hover:shadow-lg transition cursor-pointer flex flex-col justify-between space-y-4 group relative"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                      {rfq.category || 'General Manufacturing'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : 'Active'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {rfq.product_name && (
                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100 inline-block mb-1">
                        Product: {rfq.product_name}
                      </span>
                    )}
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition">
                      {rfq.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <strong className="text-slate-800">{rfq.company_name || rfq.buyer_company_name || rfq.buyer_name || 'Global Buyer'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{rfq.country || 'United States'}</span>
                    </span>
                  </div>

                  {/* Order Qty 표기 교정 */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Target Price:</span>
                      <strong className="text-emerald-600 font-extrabold">{rfq.target_price || 'Negotiable'}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Order Qty:</span>
                      <strong className="text-slate-900 font-extrabold">{rfq.order_quantity || rfq.moq || rfq.target_quantity || '1 Unit'}</strong>
                    </div>
                  </div>

                  {rfq.drawing_url && (
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                        <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                        <span>Attached CAD / Drawing / Photo Available</span>
                      </span>
                    </div>
                  )}

                  {rfq.details && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      {rfq.details}
                    </p>
                  )}
                </div>

                {/* 하단 버튼: 무조건 상세 스펙 검증 페이지로 이동하는 액션 유도 */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    {rfq.quote_count || 0} Factory Quotes
                  </span>

                  <span className="px-4 py-2 bg-blue-600 group-hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Specs & Offer Quote</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 바이어 새 RFQ 작성 모달 */}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder=""
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Title / Sourcing Subject</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder=""
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Order Quantity</label>
                  <input
                    type="text"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    placeholder="e.g. 500 Units"
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
                    placeholder=""
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Specifications & Requirements</label>
                <textarea
                  rows={4}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder=""
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
    </div>
  );
}