'use client';

import Link from 'next/link';
import { Globe, Star, Clock, Package, MessageSquare, ShoppingBag, Layers, FileText, Ruler, Sparkles, Factory, Award, Heart, Eye } from 'lucide-react';

export default function ProductDetailSpecs({
  product,
  isOwner,
  avgRating = 0,
  reviewCount = 0,
  viewerRole = null,
  isFavorited = false,
  onToggleFavorite = null,
  favoriteBusy = false
}) {
  const displayTitle = product?.title_en || product?.title_ko || product?.title || 'Export Product';

  return (
    <div className="space-y-8">
      {/* 1. 알리바바 B2B 핵심: 수량별 구간 단가표 (Tiered FOB Pricing) & 발주 요약 */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <Globe className="w-3.5 h-3.5" /> {product?.category}
              </span>

              {typeof product?.view_count === 'number' && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400" title="Total views">
                  <Eye className="w-3.5 h-3.5" /> {product.view_count}
                </span>
              )}
            </div>

            {/* Real rating/review count, computed from actual submitted reviews */}
            {reviewCount > 0 ? (
              <div className="flex items-center gap-1 text-xs font-extrabold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{avgRating.toFixed(1)}</span>
                <span className="text-slate-400 font-medium">({reviewCount} Buyer Review{reviewCount === 1 ? '' : 's'})</span>
              </div>
            ) : (
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                No reviews yet
              </span>
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {displayTitle}
            </h1>

            {viewerRole === 'buyer' && onToggleFavorite && (
              <button
                type="button"
                onClick={onToggleFavorite}
                disabled={favoriteBusy}
                title={isFavorited ? 'Remove from Saved Products' : 'Save this product'}
                className={`flex-shrink-0 p-2.5 rounded-xl border transition cursor-pointer disabled:opacity-50 ${
                  isFavorited
                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500' : ''}`} />
              </button>
            )}
          </div>

          {product?.tagline && (
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
              {product.tagline}
            </p>
          )}
        </div>

        {/* AI 요약 (바이어가 가장 먼저 읽는 짧은 요약) */}
        {product?.ai_summary && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">AI Product Summary</span>
              <p className="text-xs text-blue-950 leading-relaxed font-medium">{product.ai_summary}</p>
            </div>
          </div>
        )}

        {/* 알리바바 B2B 수량별 단가 구간 (Tiered Pricing Box) */}
        <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
            Wholesale Tiered FOB Price Range
          </span>

          <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-800">
            {(product?.tiered_pricing?.length > 0 ? product.tiered_pricing : [
              { minQty: '100', maxQty: '499', price: product?.price?.replace(/[^0-9.]/g, '') || '150.00' },
              { minQty: '500', maxQty: '1999', price: '132.00' },
              { minQty: '2000', maxQty: '', price: '118.00' }
            ]).map((tier, idx) => (
              <div key={idx} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-0.5">
                <span className="text-slate-400 text-[10px] block font-bold">
                  {tier.range || `${tier.minQty}${tier.maxQty ? ` - ${tier.maxQty}` : '+'} Units`}
                </span>
                <span className="text-emerald-400 font-extrabold text-sm md:text-base">
                  {tier.price?.toString().startsWith('$') ? tier.price : `$${tier.price}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 납기일, MOQ, 제품 규격 */}
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
            <span className="font-extrabold text-slate-800 truncate block">{product?.dimensions || 'Available upon request'}</span>
          </div>
        </div>

        {/* 바이어 문의/샘플 신청 버튼 */}
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

      <div className="space-y-8">

        {/* [스펙 카드 1]: B2B 속성 스펙 테이블 */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Product Attribute Specifications Table
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Verified technical properties and export compliance details.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {(product?.attributes?.length > 0 ? product.attributes : [
              { name: 'Category', value: product?.category || 'General Manufacturing' },
              { name: 'Country of Origin', value: product?.location || 'South Korea (Made in Korea)' },
              { name: 'Certification', value: product?.certifications || 'Standard Export Certification' },
              { name: 'OEM / ODM', value: product?.oem_odm || 'Contact Supplier' }
            ]).map((attr, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-bold">{attr.name}</span>
                <span className="font-extrabold text-slate-800 text-right">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* [스펙 카드 2]: 인증서 & OEM/ODM 강조 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-amber-500" />
              Certifications & Compliance
            </h2>
            <div className="flex flex-wrap gap-2">
              {(product?.certifications || 'Standard Export Certification')
                .split(',')
                .map((c) => c.trim())
                .filter(Boolean)
                .map((cert, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100"
                  >
                    {cert}
                  </span>
                ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Factory className="w-4.5 h-4.5 text-blue-600" />
              OEM / ODM Support
            </h2>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {product?.oem_odm || 'Contact the supplier to confirm OEM/ODM customization options.'}
            </p>
          </div>
        </div>

        {/* [스펙 카드 3]: 상세 사양서 / 상세페이지 설명 (글, 사진, 영상 텍스트 콘텐츠) */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Detailed Specification Sheet & Features
            </h2>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs md:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-mono">
            {product?.description || product?.details || 'No additional description provided.'}
          </div>
        </div>
      </div>
    </div>
  );
}
