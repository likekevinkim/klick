// components/products/ProductCard.jsx
'use client';

import { Package, CheckCircle2, ArrowRight, Trash2 } from 'lucide-react';

export default function ProductCard({ item, onClick, onDelete }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition duration-200 overflow-hidden flex flex-col justify-between group cursor-pointer p-6 space-y-4"
    >
      <div className="space-y-4">
        {/* 대표 이미지 */}
        <div className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 relative flex items-center justify-center">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title_en}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <Package className="w-12 h-12 text-slate-300" />
          )}

          <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
            {item.category}
          </span>
        </div>

        {/* 타이틀 및 스펙 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-blue-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Live in Global Catalog</span>
          </div>

          <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
            {item.title_en}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {item.tagline || item.description_en}
          </p>
        </div>

        {/* FOB 가격 및 MOQ */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold">FOB Unit Price</span>
            <span className="font-extrabold text-emerald-600">${item.price} USD</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-bold">Min Order</span>
            <span className="font-bold text-slate-800">{item.moq}</span>
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