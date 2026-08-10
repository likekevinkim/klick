// components/products/ProductDetailVisual.jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, ShieldCheck, Play, Building2, ExternalLink, MapPin, Award } from 'lucide-react';

export default function ProductDetailVisual({ product }) {
  const [selectedImage, setSelectedImage] = useState(product?.image_url || '');
  const [isVideoActive, setIsVideoActive] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* [좌측 1열]: 대표 사진 & 비디오 플레이어 갤러리 */}
      <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="w-full h-80 md:h-96 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center relative group">
          {isVideoActive && product?.video_url ? (
            <video src={product.video_url} controls autoPlay className="w-full h-full object-contain bg-black" />
          ) : selectedImage ? (
            <img src={selectedImage} alt={product?.title_en} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
          ) : (
            <Package className="w-16 h-16 text-slate-300" />
          )}

          <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[10px] font-extrabold px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Factory Product
          </span>
        </div>

        {/* 썸네일 & 비디오 선택 버튼 */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {product?.video_url && (
            <button
              type="button"
              onClick={() => setIsVideoActive(true)}
              className={`w-16 h-16 rounded-xl border-2 transition flex-shrink-0 cursor-pointer bg-slate-900 flex flex-col items-center justify-center text-white space-y-0.5 ${
                isVideoActive ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-700 opacity-80'
              }`}
            >
              <Play className="w-5 h-5 text-rose-500 fill-rose-500" />
              <span className="text-[9px] font-bold">Video</span>
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
              className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition flex-shrink-0 cursor-pointer ${
                !isVideoActive && selectedImage === img ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* [우측 2열]: 모달에서 입력된 공장명/위치/인증 정보가 실시간 연동 표시되는 우측 프로필 카드 */}
      <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 h-fit">
        <div className="border-b border-slate-100 pb-3 space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
            Verified Korean Supplier
          </span>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5 pt-1">
            <Building2 className="w-4 h-4 text-blue-600" />
            {product?.company_name || 'Hankook Precision Co., Ltd.'}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
            <span className="text-slate-400 block text-[10px] font-bold">Business</span>
            <span className="font-extrabold text-slate-800">Manufacturer</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
            <span className="text-slate-400 block text-[10px] font-bold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-600" /> Location
            </span>
            <span className="font-bold text-slate-800 truncate block">
              {product?.factory_location || 'Incheon, S.Korea 🇰🇷'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
            <span className="text-slate-400 block text-[10px] font-bold flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-500" /> Certifications
            </span>
            <span className="font-extrabold text-blue-600 truncate block">
              {product?.certifications || 'ISO 9001, CE'}
            </span>
          </div>
        </div>

        <Link
          href={`/companies/${product?.company_id || 1}`}
          className="w-full py-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Visit Official Factory Showroom</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}