// app/buyer/favorites/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { Heart, Package, Building2, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatProductTitle } from '@/lib/productTitle';
import { formatCompanyName } from '@/lib/companyName';

export default function BuyerFavoritesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buyerId, setBuyerId] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    setMounted(true);
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;

      if (!user) {
        setProducts([]);
        setCompanies([]);
        return;
      }

      const userIdStr = user.id.toString();
      setBuyerId(userIdStr);

      const { data: favRows, error: favError } = await supabase
        .from('buyer_favorites')
        .select('product_id, company_id')
        .eq('buyer_id', userIdStr)
        .order('created_at', { ascending: false });

      if (favError) throw favError;

      const productIds = (favRows || []).map((r) => r.product_id).filter(Boolean);
      const companyIds = (favRows || []).map((r) => r.company_id).filter(Boolean);

      const [productsResult, companiesResult] = await Promise.all([
        productIds.length
          ? supabase.from('products').select('*').in('id', productIds)
          : Promise.resolve({ data: [] }),
        companyIds.length
          ? supabase.from('companies').select('*').in('id', companyIds)
          : Promise.resolve({ data: [] })
      ]);

      // 찜한 순서(최신순)를 그대로 유지
      const productById = new Map((productsResult.data || []).map((p) => [p.id, p]));
      setProducts(productIds.map((id) => productById.get(id)).filter(Boolean));

      const companyById = new Map((companiesResult.data || []).map((c) => [c.id, c]));
      setCompanies(companyIds.map((id) => companyById.get(id)).filter(Boolean));
    } catch (err) {
      console.error('Failed to load saved items:', err);
      setProducts([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!buyerId) return;
    try {
      const { error } = await supabase
        .from('buyer_favorites')
        .delete()
        .eq('buyer_id', buyerId)
        .eq('product_id', productId);

      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error('Failed to remove saved product:', err);
      alert('Failed to remove: ' + (err.message || 'Database error'));
    }
  };

  const handleRemoveCompany = async (companyId) => {
    if (!buyerId) return;
    try {
      const { error } = await supabase
        .from('buyer_favorites')
        .delete()
        .eq('buyer_id', buyerId)
        .eq('company_id', companyId);

      if (error) throw error;
      setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    } catch (err) {
      console.error('Failed to remove saved company:', err);
      alert('Failed to remove: ' + (err.message || 'Database error'));
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            My Saved Items
          </h1>
          <p className="text-xs text-slate-500 mt-1">Products and companies you've saved for later.</p>
        </div>

        {buyerId && (
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`py-3 px-1 text-sm font-extrabold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'products'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products ({products.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('companies')}
              className={`py-3 px-1 text-sm font-extrabold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'companies'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Companies / Factories ({companies.length})</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading saved items...</p>
          </div>
        ) : !buyerId ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3 p-6 shadow-sm">
            <Heart className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-sm font-bold text-slate-800">Sign In as a Buyer</h3>
            <p className="text-xs text-slate-500">Sign in to save and view your favorite products and companies.</p>
          </div>
        ) : activeTab === 'products' ? (
          products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3 p-6 shadow-sm">
              <Heart className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <h3 className="text-sm font-bold text-slate-800">No Saved Products Yet</h3>
              <p className="text-xs text-slate-500">Tap the heart icon on any product page to save it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {products.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/products/${item.id}`)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition duration-200 overflow-hidden flex flex-col justify-between group p-3.5 space-y-3 cursor-pointer"
                >
                  <div className="space-y-2.5">
                    <div className="w-full aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-100 relative flex items-center justify-center">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title_en || item.title_ko || item.product_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-300" />
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveProduct(item.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow transition cursor-pointer"
                        title="Remove from Saved Products"
                      >
                        <Heart className="w-3.5 h-3.5 fill-white" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 truncate">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{item.company_name || 'Verified Factory'}</span>
                    </div>

                    <h3 className="notranslate text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition min-h-[32px]" translate="no">
                      {formatProductTitle(item)}
                    </h3>

                    <div className="pt-1 border-t border-slate-100">
                      <span className="text-sm font-extrabold text-emerald-600">{item.price || '$0.00'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end text-[10px] text-blue-600 font-bold">
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : companies.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3 p-6 shadow-sm">
            <Heart className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-sm font-bold text-slate-800">No Saved Companies Yet</h3>
            <p className="text-xs text-slate-500">Tap the heart icon on any company page to save it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {companies.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/companies/${item.id}`)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition duration-200 overflow-hidden flex flex-col justify-between group p-3.5 space-y-3 cursor-pointer"
              >
                <div className="space-y-2.5">
                  <div className="w-full aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-100 relative flex items-center justify-center">
                    {item.banner_url ? (
                      <img
                        src={item.banner_url}
                        alt={item.company_name_en || item.company_name_ko}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-slate-300" />
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCompany(item.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow transition cursor-pointer"
                      title="Remove from Saved Companies"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" />
                    </button>
                  </div>

                  <h3 className="notranslate text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition min-h-[32px]" translate="no">
                    {formatCompanyName(item)}
                  </h3>

                  <div className="pt-1 border-t border-slate-100 text-[10px] text-slate-500 font-bold">
                    {item.category || 'Manufacturing'}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end text-[10px] text-blue-600 font-bold">
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
