// app/products/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { PlusCircle, Building2, Eye, Trash2, Globe, ShieldCheck, ArrowRight, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ProductsDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 antialiased">
      <Header />

      <main className="max-w-7xl mx-auto px-6 mt-10 space-y-8">
        {/* Top Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Seller Factory Dashboard
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Manage Registered Export Products
            </h1>
            <p className="text-slate-400 text-xs md:text-sm">
              Overview and manage your AI-generated product listings for global buyers.
            </p>
          </div>

          <Link
            href="/products/new"
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-md transition inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>AI New Product Setup</span>
          </Link>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <p className="text-slate-500 font-semibold text-sm">Loading Factory Products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-4">
            <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-lg font-bold text-slate-800">No Export Products Registered Yet</h3>
            <p className="text-slate-500 text-xs md:text-sm">
              Register your factory product using AI automatic copywriting generator.
            </p>
            <Link
              href="/products/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Product Now</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="w-full h-48 bg-slate-100 border-b border-slate-100 flex items-center justify-center relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title_en}
                        className="w-full h-full object-contain bg-white"
                      />
                    ) : (
                      <div className="text-slate-400 text-xs font-medium">No Factory Image</div>
                    )}
                    <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="truncate">{item.company_name}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug">
                      {item.title_en}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.tagline}
                    </p>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Price</span>
                        <span className="font-extrabold text-blue-600">${item.price} USD</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">MOQ</span>
                        <span className="font-bold text-slate-700">{item.moq}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                  <Link
                    href={`/products/${item.id}`}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Showroom</span>
                  </Link>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}