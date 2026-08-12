// components/company/AddProductModal.jsx
'use client';

import { X, Plus, Loader2, Sparkles } from 'lucide-react';

export default function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  productTitleKo,
  setProductTitleKo,
  productTitleEn,
  setProductTitleEn,
  productCategory,
  setProductCategory,
  productPrice,
  setProductPrice,
  productMoq,
  setProductMoq,
  productImageUrl,
  setProductImageUrl,
  productDescriptionKo,
  setProductDescriptionKo
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-200 shadow-2xl space-y-5 animate-fadeIn">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Add Showroom Product
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Products created here will automatically appear on the global Product Dashboard!
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">제품명 (한글) *</label>
            <input
              type="text"
              required
              value={productTitleKo}
              onChange={(e) => setProductTitleKo(e.target.value)}
              placeholder="예: 초정밀 유압 제어 밸브 HV-300"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Product Title (English) *</label>
            <input
              type="text"
              required
              value={productTitleEn}
              onChange={(e) => setProductTitleEn(e.target.value)}
              placeholder="e.g. High-Precision Hydraulic Control Valve HV-300"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              >
                <option value="Industrial Machinery">Industrial Machinery & Parts</option>
                <option value="K-Beauty & Cosmetics">K-Beauty & Cosmetics</option>
                <option value="K-Food & Beverages">K-Food & Beverages</option>
                <option value="Electronics & Smart IT">Electronics & Smart IT</option>
                <option value="General Manufacturing">General Manufacturing</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">FOB Unit Price ($ USD) *</label>
              <input
                type="text"
                required
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="145.00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Minimum Order (MOQ) *</label>
              <input
                type="text"
                required
                value={productMoq}
                onChange={(e) => setProductMoq(e.target.value)}
                placeholder="500 Units"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Image URL</label>
              <input
                type="url"
                value={productImageUrl}
                onChange={(e) => setProductImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">제품 주요 설명 (한글)</label>
            <textarea
              rows={3}
              value={productDescriptionKo}
              onChange={(e) => setProductDescriptionKo(e.target.value)}
              placeholder="공장 특허 기술, 소재 및 품질 검증 스펙을 자유롭게 입력하세요."
              className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Publish to Showroom & Dashboard</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}