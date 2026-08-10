// components/products/ProductDetailSpecs.jsx
'use client';

import Link from 'next/link';
import { Globe, Star, Clock, Package, MessageSquare, ShoppingBag, Layers, FileText, ShieldCheck, CheckCircle2, Ruler } from 'lucide-react';

export default function ProductDetailSpecs({ product, isOwner }) {
  return (
    <div className="space-y-8">
      {/* 1. 알리바바 B2B 핵심: 수량별 구간 단가표 (Tiered FOB Pricing) & 발주 요약 */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              <Globe className="w-3.5 h-3.5" /> {product?.category}
            </span>

            <div className="flex items-center gap-1 text-xs font-extrabold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{product?.rating || 4.9}</span>
              <span className="text-slate-400 font-medium">({product?.reviews_count || 28} Buyer Inquiries)</span>
            </div>
          </div>

          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {product?.title_en}
          </h1>

          <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
            {product?.tagline}
          </p>
        </div>

        {/* 알리바바 B2B 수량별 단가 구간 (Tiered Pricing Box) */}
        <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
            Wholesale Tiered FOB Price Range
          </span>

          <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-800">
            {(product?.tiered_pricing || [
              { range: '100 - 499 Units', price: `$${product?.price}` },
              { range: '500 - 1,999 Units', price: '$132.00' },
              { range: '2,000+ Units', price: '$118.00' }
            ]).map((tier, idx) => (
              <div key={idx} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-0.5">
                <span className="text-slate-400 text-[10px] block font-bold">{tier.range}</span>
                <span className="text-emerald-400 font-extrabold text-sm md:text-base">{tier.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 납기일, MOQ, 제품 사이즈/중량 안내 요약 바 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-slate-400 text-[10px] font-bold block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> Lead Time
            </span>
            <span className="font-extrabold text-slate-800">{product?.lead_time || '15 - 20 Days (FOB)'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-slate-400 text-[10px] font-bold block flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-blue-600" /> Minimum Order (MOQ)
            </span>
            <span className="font-extrabold text-slate-800">{product?.moq}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-slate-400 text-[10px] font-bold block flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 text-blue-600" /> Dimensions & Weight
            </span>
            <span className="font-extrabold text-slate-800 truncate block">{product?.product_size || '240 x 180 x 120 mm / 4.5kg'}</span>
          </div>
        </div>

        {/* 바이어 액션 버튼 (채팅 & 샘플 요청) */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            href="/chat"
            className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Send Direct Inquiry (RFQ)</span>
          </Link>

          <Link
            href="/chat"
            className="py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Request Sample Order</span>
          </Link>
        </div>
      </div>

      {/* 2. 알리바바 스펙 표 (Attribute Specifications Table) & 리치 포맷 기획 본문 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          {/* [스펙 카드 1]: B2B 속성 표 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Product Attribute Specifications Table
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Verified technical properties and export compliance details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {(product?.attributes || [
                { name: 'Model No.', value: 'HV-300-KR' },
                { name: 'Working Pressure', value: 'Max 350 Bar (5,076 PSI)' },
                { name: 'Flow Rate', value: '120 L/min' },
                { name: 'Body Material', value: 'Ductile Iron GGG40 / Heavy Alloy' },
                { name: 'Operating Temp', value: '-20°C to +80°C' },
                { name: 'Certification', value: 'ISO 9001:2015, CE Certified' },
                { name: 'Country of Origin', value: 'South Korea (Made in Korea)' },
                { name: 'OEM / ODM', value: 'Available (Custom Logo & Packaging)' }
              ]).map((attr, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 font-bold">{attr.name}</span>
                  <span className="font-extrabold text-slate-800">{attr.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* [스펙 카드 2]: AI 카피라이팅 & 리치 에디터로 제작된 기획 상세 설명 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Detailed Specification Sheet & Features
              </h2>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs md:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-mono">
              {product?.description_en}
            </div>
          </div>
        </div>

        {/* 우측 KLICK 거래 안심 보증 가이드 */}
        <div className="lg:col-span-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 h-fit">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            KLICK Safe Trade Guarantee
          </h3>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Direct contact with verified South Korean factory team.</span>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Real-time multilingual AI chat translation.</span>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Instant Proforma Invoice (PI) issuance & escrow payment support.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}