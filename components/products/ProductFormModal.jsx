// components/products/ProductFormModal.jsx
'use client';

import { useState } from 'react';
import { Plus, Edit3, X, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import ProductMediaUploader from './ProductMediaUploader';
import RichSpecEditor from './RichSpecEditor';

export default function ProductFormModal({ isOpen, onClose, isEditMode, initialData, onSubmit }) {
  const [titleKo, setTitleKo] = useState(initialData?.title_ko || initialData?.title_en || '');
  const [titleEn, setTitleEn] = useState(initialData?.title_en || '');
  const [category, setCategory] = useState(initialData?.category || 'Industrial Machinery');
  const [moq, setMoq] = useState(initialData?.moq || '100 Units');
  const [leadTime, setLeadTime] = useState(initialData?.lead_time || '15 - 20 Days (FOB)');
  const [productSize, setProductSize] = useState(initialData?.product_size || '240 x 180 x 120 mm / 4.5kg');
  const [taglineEn, setTaglineEn] = useState(initialData?.tagline || '');
  const [editorContent, setEditorContent] = useState(initialData?.description_en || '');

  const [mainImageUrl, setMainImageUrl] = useState(initialData?.image_url || '');
  const [galleryImages, setGalleryImages] = useState(initialData?.gallery_images || []);
  const [videoUrl, setVideoUrl] = useState(initialData?.video_url || '');

  const [tieredPricing, setTieredPricing] = useState(
    initialData?.tiered_pricing
      ? initialData.tiered_pricing.map(t => ({ min_qty: t.range || '100 Units', price: (t.price || '145.00').replace(/[^0-9.]/g, '') }))
      : [
          { min_qty: '100 - 499 Units', price: '145.00' },
          { min_qty: '500 - 1,999 Units', price: '132.00' },
          { min_qty: '2,000+ Units', price: '118.00' }
        ]
  );

  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddPriceTier = () => {
    setTieredPricing([...tieredPricing, { min_qty: '5,000+ Units', price: '100.00' }]);
  };

  const handleRemovePriceTier = (index) => {
    setTieredPricing(tieredPricing.filter((_, idx) => idx !== index));
  };

  const handlePriceTierChange = (index, field, value) => {
    const updated = [...tieredPricing];
    updated[index][field] = value;
    setTieredPricing(updated);
  };

  const handleGenerateAi = () => {
    if (!titleKo) {
      alert('제품 한글 명칭을 입력해 주세요.');
      return;
    }

    setIsAiGenerating(true);
    setTimeout(() => {
      setTitleEn(`High-Precision ${titleKo} (Export Standard)`);
      setTaglineEn(`ISO 9001 & CE certified ${category.toLowerCase()} engineered with Korean advanced technology.`);
      setEditorContent(`### Official Verified Export Specification Sheet
- **Product Name**: ${titleKo}
- **Category**: ${category}
- **Quality Standard**: ISO 9001:2015, CE Certified
- **Lead Time**: ${leadTime}

### Key Features
1. High durability material engineered for long-term industrial reliability.
2. 100% factory pressure tested before shipment.`);
      setIsAiGenerating(false);
    }, 1000);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title_en: titleEn || titleKo,
      title_ko: titleKo,
      category,
      price: tieredPricing[0]?.price || '145.00',
      moq,
      lead_time: leadTime,
      product_size: productSize,
      tagline: taglineEn || `${titleKo} Export Model`,
      description_en: editorContent,
      image_url: mainImageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      gallery_images: galleryImages,
      video_url: videoUrl,
      tiered_pricing: tieredPricing.map(t => ({ range: t.min_qty, price: `$${t.price} / Unit` }))
    };

    await onSubmit(payload);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              {isEditMode ? <Edit3 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
              {isEditMode ? 'Edit Product Specifications & Rich Media' : 'Register New Export Product Specification'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload pictures, video, tiered pricing, and manage rich specification content.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-6">
          {/* 1. 기본 인포메이션 */}
          <div className="space-y-4">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider block border-b pb-1">
              1. Basic Product Information
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Title (Korean) *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 초고압 산업용 유압 제어 밸브 HV-300"
                  value={titleKo}
                  onChange={(e) => setTitleKo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Title (English)</label>
                <input
                  type="text"
                  placeholder="AI generated or manual English title"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="Industrial Machinery">Industrial Machinery</option>
                  <option value="K-Beauty & Cosmetics">K-Beauty & Cosmetics</option>
                  <option value="K-Food & Beverages">K-Food & Beverages</option>
                  <option value="Electronics & Smart IT">Electronics & Smart IT</option>
                  <option value="General Manufacturing">General Manufacturing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">MOQ *</label>
                <input
                  type="text"
                  required
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lead Time *</label>
                <input
                  type="text"
                  required
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. 수량별 구간 단가 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1">
              <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                2. Wholesale Tiered FOB Pricing ($ USD)
              </span>
              <button
                type="button"
                onClick={handleAddPriceTier}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Tier Range
              </button>
            </div>

            <div className="space-y-2">
              {tieredPricing.map((tier, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tier.min_qty}
                    onChange={(e) => handlePriceTierChange(idx, 'min_qty', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <div className="flex items-center gap-1 w-32">
                    <span className="text-xs font-bold text-slate-500">$</span>
                    <input
                      type="text"
                      value={tier.price}
                      onChange={(e) => handlePriceTierChange(idx, 'price', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-emerald-600"
                    />
                  </div>
                  {tieredPricing.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePriceTier(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. 미디어 업로더 컴포넌트 (비디오 및 사진 개별제어 지원) */}
          <ProductMediaUploader
            mainImageUrl={mainImageUrl}
            setMainImageUrl={setMainImageUrl}
            galleryImages={galleryImages}
            setGalleryImages={setGalleryImages}
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
          />

          {/* 4. 리치 에디터 컴포넌트 */}
          <RichSpecEditor
            content={editorContent}
            setContent={setEditorContent}
            onGenerateAi={handleGenerateAi}
            isAiGenerating={isAiGenerating}
          />

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Publish Specifications'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}