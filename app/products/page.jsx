'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Plus, 
  Eye, 
  Trash2, 
  ShieldCheck, 
  Loader2, 
  Building2, 
  MapPin, 
  Search, 
  PlusCircle,
  Award
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ProductFormModal from '@/components/products/ProductFormModal';

export default function ProductsDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  
  // 셀러 프로필 및 상품 목록 상태
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('South Korea');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 신규 상품 등록 팝업 모달 상태
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchSellerProducts();
  }, []);

  const fetchSellerProducts = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (!currentUser) {
        // 비로그인 사용자 접속 시 전체 공개 카탈로그 조회
        const { data: publicProducts } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        setProducts(publicProducts || []);
        setLoading(false);
        return;
      }

      const userIdStr = currentUser.id.toString();

      // 1. 셀러 회사 정보 자동 조회
      const { data: sellerProf } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', userIdStr)
        .maybeSingle();

      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userIdStr)
        .maybeSingle();

      const meta = currentUser.user_metadata || {};
      const activeName = sellerProf?.company_name_en || sellerProf?.company_name || companyData?.company_name_en || companyData?.company_name || meta.company_name_en || meta.company_name || 'My Factory';
      const activeLoc = sellerProf?.country || companyData?.location || 'South Korea';

      setCompanyName(activeName);
      setLocation(activeLoc);

      // 2. 현재 로그인한 셀러가 올린 실제 제품 목록 DB 조회
      const { data: myProducts } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userIdStr)
        .order('created_at', { ascending: false });

      setProducts(myProducts || []);
    } catch (err) {
      console.error('Error fetching seller products dashboard:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 상품 삭제 핸들러
  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to remove this product from your export catalog?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts((prev) => prev.filter((item) => item.id !== id));
      alert('Product deleted successfully.');
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Failed to delete product: ' + (err.message || 'Database error'));
    }
  };

  // 신규 등록 완료 시 목록에 즉시 추가 반영
  const handleProductCreated = (newProduct) => {
    if (newProduct) {
      setProducts((prev) => [newProduct, ...prev]);
    }
  };

  // 검색어 필터링
  const filteredProducts = products.filter((item) => {
    const title = item.title_en || item.title || item.title_ko || '';
    const cat = item.category || '';
    return (
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // 카드에 노출할 짧은 설명 스니펫 (AI 요약 우선, 없으면 상세설명 앞부분)
  const getSummarySnippet = (item) => {
    const raw = item.tagline || item.ai_summary || item.description || item.details || '';
    if (!raw) return 'No description provided yet.';
    return raw.length > 90 ? `${raw.slice(0, 90)}...` : raw;
  };

  // 카드에 노출할 인증 배지 목록 (콤마 구분 문자열 -> 배열, 최대 2개만 표시)
  const getCertBadges = (item) => {
    if (!item.certifications) return [];
    return item.certifications
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, 2);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        
        {/* 1. 상단 메인 대시보드 헤더 배너 */}
        <div className="bg-[#0F172A] text-white rounded-3xl p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Seller Product Management Dashboard
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {companyName ? `${companyName} Catalog` : 'Export Product Catalog'}
            </h1>
            <p className="text-slate-400 text-xs md:text-sm">
              Manage your registered export products displayed on global buyer showrooms.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/seller/profile"
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-700 transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Factory Profile</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register New Product</span>
            </button>
          </div>
        </div>

        {/* 2. 검색 및 필터 컨트롤 바 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product by title or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="text-xs text-slate-500 font-extrabold">
            Total Products: <strong className="text-blue-600">{filteredProducts.length}</strong>
          </div>
        </div>

        {/* 3. 내가 올린 등록 제품 리스트 그리드 카탈로그 */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs font-bold text-slate-400">Loading your export products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 space-y-4 p-8">
            <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">No Export Products Found</h3>
              <p className="text-xs text-slate-400">You haven't uploaded any products yet or no product matches your search query.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow hover:bg-blue-500 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload First Product</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:border-blue-400 hover:shadow-lg transition flex flex-col justify-between group"
              >
                {/* 메인 이미지 영역 */}
                <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title_en || item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <Package className="w-10 h-10 text-slate-300 stroke-1" />
                  )}

                  <span className="absolute top-3 left-3 text-[10px] font-extrabold text-blue-700 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-blue-100 shadow-sm">
                    {item.category || 'General'}
                  </span>
                </div>

                {/* 상품 스펙 요약 정보 카드 */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                      {item.title_en || item.title || item.title_ko}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium truncate">
                      {item.company_name || companyName}
                    </p>

                    {/* 제품설명 요약 스니펫 */}
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                      {getSummarySnippet(item)}
                    </p>

                    {/* 인증내역 배지 */}
                    {getCertBadges(item).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {getCertBadges(item).map((cert, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100"
                          >
                            <Award className="w-2.5 h-2.5" />
                            {cert}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold text-[11px]">Target FOB Price:</span>
                      <strong className="text-emerald-600 font-extrabold">{item.fob_price || item.price || 'Negotiable'}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold text-[11px]">MOQ:</span>
                      <strong className="text-slate-800 font-bold">{item.moq || 'Negotiable'}</strong>
                    </div>
                  </div>

                  {/* 카드 하단 액션 버튼 */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/products/${item.id}`}
                      className="text-xs font-extrabold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Showroom</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 등록 모달 팝업 연동 */}
      <ProductFormModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onProductCreated={handleProductCreated}
      />
    </div>
  );
}
