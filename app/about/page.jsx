// app/about/page.jsx
import Header from '@/components/Header';
import Klick from '@/components/Klick';
import { Building2, Target, Globe2, MessageSquare, Mail, Phone, MapPin } from 'lucide-react';

export const metadata = {
  title: 'About Us',
  description: 'Learn about KLICK — the B2B export platform connecting verified South Korean manufacturers with global buyers.',
  alternates: { canonical: '/about' }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-3xl mx-auto px-6 mt-10 space-y-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-md border border-slate-800 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            <Building2 className="w-3.5 h-3.5" /> About <Klick />
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Connecting Korean Manufacturers with the World
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
            <Klick /> is a B2B export platform built for Korean manufacturers who don't have a dedicated
            overseas sales team — and for global buyers looking to source directly from verified Korean factories.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Our Mission</h2>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                Small and mid-sized Korean manufacturers often make excellent products but lack the resources to
                market themselves internationally. <Klick /> removes that barrier: sellers describe their products in
                Korean, and the platform helps present them professionally to a global audience — no export team required.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Globe2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Who <Klick /> Is For</h2>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                <strong className="text-slate-800">Sellers</strong> are Korean manufacturers who want to list their
                products for an international audience. <strong className="text-slate-800">Buyers</strong> are
                companies anywhere in the world looking to source directly from Korean factories, request quotes,
                and negotiate terms.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">What <Klick /> Does — and Doesn't — Do</h2>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                <Klick />'s role is to connect buyers and sellers: product listings, RFQ sourcing requests, and
                real-time translated chat so language is never a barrier to doing business. <Klick /> does not process
                payments or act as a party to any transaction — buyers and sellers negotiate and settle deals
                directly with each other.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900">Company Information</h2>
          <div className="text-xs text-slate-600 space-y-2">
            <p className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> TRUE K CO., LTD. (operator of <Klick />)</p>
            <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> 16, Sure-ro 116beon-gil, Wabu-eup, Namyangju-si, Gyeonggi-do, South Korea</p>
            <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> +82-507-1345-2432</p>
            <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> truek.work@gmail.com</p>
            <p className="pt-1 text-[11px] text-slate-400">Business Registration No. 829-32-00630 · E-Commerce Registration No. 2025-WABUJOAN-0341</p>
          </div>
        </div>
      </main>
    </div>
  );
}
