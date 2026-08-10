// components/products/ProductCard.jsx
'use client';

import { Package, CheckCircle2, ArrowRight, Trash2 } from 'lucide-react';

export default function ProductCard({ item, onClick, onDelete }) {
  // 3중 이미지 주소 추출 (image_url -> gallery_images 0번째 -> 기본 이미지)
  let displayImage = item?.image_url || '';
  if (!displayImage && item?.gallery_images) {
    if (Array.isArray(item.gallery_images) && item.gallery_images.length > 0) {
      displayImage = item.gallery_images[0];
    } else if (typeof item.gallery_images === 'string') {
      try {
        const parsed = JSON.parse(item.gallery_images);
        if (Array.isArray(parsed) && parsed.length > 0) displayImage = parsed[0];
      } catch (e) {
        displayImage = item.gallery_images;
      }
    }
  }

  const titleText = item?.title_en || item?.title_ko || item?.product_name || 'Verified B2B Product';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition duration-200 overflow-hidden flex flex-col justify-between group cursor-pointer p-5 space-y-4"
    >
      <div className="space-y-4">
        {/* 대표 이미지 박스 */}
        <div className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 relative flex items-center justify-center">
          {displayImage ? (
            <img
              src={displayImage}
              alt={titleText}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <Package className="w-12 h-12 text-slate-300" />
          )}

          <span className="absolute top-3 left-3 bg-[#0F172A]/80 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
            {item?.category || 'Manufacturing'}
          </span>
        </div>

        {/* 타이틀 및 스펙 요약 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-blue-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{item?.company_name || 'Verified Korean Factory'}</span>
          </div>

          <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
            {titleText}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {item?.tagline || item?.description_en || 'High durability factory export product verified for global buyers.'}
          </p>
        </div>

        {/* FOB 가격 및 MOQ */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold">FOB Unit Price</span>
            <span className="font-extrabold text-emerald-600">${item?.price || '0.00'} USD</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-bold">Min Order (MOQ)</span>
            <span className="font-bold text-slate-800">{item?.moq || '1 Unit'}</span>
          </div>
        </div>
      </div>

      {/* 하단 상세 진입 및 삭제 버튼 */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-blue-600 group-hover:underline flex items-center gap-1">
          <span>View Specifications</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>

        {onDelete && (
          <button
            type="button"
            onClick={(e) => onDelete(e, item.id)}
            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}