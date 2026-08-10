// components/products/ProductDetailVisual.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  ShieldCheck, 
  Play, 
  Building2, 
  ExternalLink, 
  MapPin, 
  Award, 
  CheckCircle2, 
  MessageSquare, 
  Mail 
} from 'lucide-react';

export default function ProductDetailVisual({ product }) {
  const router = useRouter();
  
  const [selectedImage, setSelectedImage] = useState('');
  const [isVideoActive, setIsVideoActive] = useState(false);

  // product 데이터 로드 시 대표 사진 및 갤러리 이미지 동기화
  useEffect(() => {
    let mainImg = product?.image_url || '';
    if (!mainImg && product?.gallery_images) {
      if (Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
        mainImg = product.gallery_images[0];
      } else if (typeof product.gallery_images === 'string') {
        try {
          const parsed = JSON.parse(product.gallery_images);
          if (Array.isArray(parsed) && parsed.length > 0) mainImg = parsed[0];
        } catch (e) {
          mainImg = product.gallery_images;
        }
      }
    }
    setSelectedImage(mainImg);
  }, [product]);

  // 대표 사진과 추가 갤러리 사진 병합
  const displayGallery = [];
  if (product?.image_url) displayGallery.push(product.image_url);

  if (product?.gallery_images) {
    let list = [];
    if (Array.isArray(product.gallery_images)) list = product.gallery_images;
    else if (typeof product.gallery_images === 'string') {
      try {
        const parsed = JSON.parse(product.gallery_images);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {
        list = [product.gallery_images];
      }
    }
    list.forEach((img) => {
      if (img && typeof img === 'string' && !displayGallery.includes(img)) {
        displayGallery.push(img);
      }
    });
  }

  // ★ [Chat with Representative] 클릭 시 셀러와 1:1 직통 대화방 자동 생성 파라미터 전달
  const handleStartChat = () => {
    const pId = product?.id || '';
    const compName = encodeURIComponent(product?.company_name || 'Hankook Precision Co., Ltd.');
    const pTitle = encodeURIComponent(product?.title_en || product?.title_ko || product?.product_name || 'Export Product');
    const sellerId = product?.user_id || '';
    
    router.push(`/chat?productId=${pId}&company=${compName}&title=${pTitle}&sellerId=${sellerId}`);
  };

  const handleSendEmail = () => {
    const targetEmail = product?.company_email || 'export@hankookprecision.co.kr';
    const subject = encodeURIComponent(`[KLICK B2B Inquiry] Quote Request for ${product?.title_en || product?.title_ko || 'Product'}`);
    const body = encodeURIComponent(
      `Dear Sales Manager at ${product?.company_name || 'Hankook Precision Co., Ltd.'},\n\n` +
      `I found your product "${product?.title_en || product?.title_ko || product?.product_name}" on the KLICK B2B Trade Platform.\n` +
      `We are interested in sourcing this item and would like to request official pricing, MOQ terms, and delivery lead time.\n\n` +
      `Product Item: ${product?.title_en || product?.title_ko || product?.product_name}\n` +
      `Category: ${product?.category || 'Industrial'}\n` +
      `Target Order Quantity: ${product?.moq || '100 Units'}\n\n` +
      `Please provide us with your official Proforma Invoice (PI) or quotation catalog.\n\n` +
      `Best regards,\n` +
      `Global B2B Buyer`
    );

    window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      {/* [좌측 7열]: 고화질 대표 비주얼 갤러리 */}
      <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
        <div className="w-full h-80 md:h-[420px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center relative group">
          {isVideoActive && product?.video_url ? (
            <video src={product.video_url} controls autoPlay className="w-full h-full object-contain bg-black" />
          ) : selectedImage ? (
            <img 
              src={selectedImage} 
              alt={product?.title_en || product?.title_ko || 'Product Visual'} 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <Package className="w-16 h-16 text-slate-300" />
          )}

          <span className="absolute top-4 left-4 bg-[#0F172A]/80 backdrop-blur-md text-emerald-400 text-[10px] font-extrabold px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Factory Direct
          </span>
        </div>

        {/* 미디어 썸네일 선택 바 */}
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

          {displayGallery.map((img, idx) => (
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

      {/* [우측 5열]: 제조 공장 프로필 & 소통 버튼 */}
      <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
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

          <div className="space-y-2.5 text-xs">
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
        </div>

        {/* 하단 담당자 채팅하기 및 이메일 버튼 */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleStartChat}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat with Representative</span>
          </button>

          <button
            type="button"
            onClick={handleSendEmail}
            className="w-full py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>Send Email Inquiry</span>
          </button>

          <Link
            href={`/companies/${product?.company_id || 1}`}
            className="w-full py-2.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Visit Official Factory Showroom</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}