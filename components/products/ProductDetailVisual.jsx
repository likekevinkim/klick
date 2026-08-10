// components/products/ProductDetailVisual.jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, ShieldCheck, Play, Building2, ExternalLink, MapPin, Award, CheckCircle2 } from 'lucide-react';

export default function ProductDetailVisual({ product }) {
  const [selectedImage, setSelectedImage] = useState(product?.image_url || '');
  const [isVideoActive, setIsVideoActive] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* [좌측 7열]: 고화질 대표 미디어 갤러리 (사진 슬라이더 & 비디오) */}
      <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="w-full h-80 md:h-[420px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center relative group">
          {isVideoActive && product?.video_url ? (
            <video src={product.video_url} controls autoPlay className="w-full h-full object-contain bg-black" />
          ) : selectedImage ? (
            <img src={selectedImage} alt={product?.title_en} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
          ) : (
            <Package className="w-16 h-16 text-slate-300" />
          )}

          <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[10px] font-extrabold px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Factory Direct
          </span>
        </div>

        {/* 미디어 썸네일 바 */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {product?.video_url && (
            <button
              type="button"
              onClick={() => setIsVideoActive(true)}
              className={`w-18 h-18 rounded-xl border-2 transition flex-shrink-0 cursor-pointer bg-slate-900 flex flex-col items-center justify-center text-white space-y-0.5 ${
                isVideoActive ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-700 opacity-80'
              }`}
            >
              <Play className="w-5 h-5 text-rose-500 fill-rose-500" />
              <span className="text-[9px] font-bold">Video Tour</span>
            </button>
          )}

          {(product?.gallery_images || [product?.image_url]).map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setIsVideoActive(false);
                setSelectedImage(img);
              }}
              className={`w-18 h-18 rounded-xl overflow-hidden border-2 transition flex-shrink-0 cursor-pointer ${
                !isVideoActive && selectedImage === img ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* [우측 5열]: 알리바바 규격 검증 제조 공장(Verified Supplier) 프로필 카드 */}
      <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 h-fit sticky top-28">
        <div className="border-b border-slate-100 pb-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Supplier
            </span>
            <span className="text-[10px] text-slate-400 font-bold">South Korea 🇰🇷</span>
          </div>

          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5 pt-1.5">
            <Building2 className="w-4.5 h-4.5 text-blue-600 flex-shrink-0" />
            {product?.company_name || 'Hankook Precision Co., Ltd.'}
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-bold">Business Type:</span>
            <span className="font-extrabold text-slate-800">Direct Manufacturer</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" /> Factory Location:
            </span>
            <span className="font-extrabold text-slate-800">
              {product?.factory_location || 'Incheon, South Korea 🇰🇷'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" /> Certifications:
            </span>
            <span className="font-extrabold text-blue-600">
              {product?.certifications || 'ISO 9001, CE Certified'}
            </span>
          </div>
        </div>

        <Link
          href={`/companies/${product?.company_id || 1}`}
          className="w-full py-3.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Visit Official Factory Showroom</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}