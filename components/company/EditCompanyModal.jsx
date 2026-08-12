// components/company/EditCompanyModal.jsx
'use client';

import { X, Edit3, Save, Loader2 } from 'lucide-react';

export default function EditCompanyModal({
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  editCompanyNameKo,
  setEditCompanyNameKo,
  editCompanyNameEn,
  setEditCompanyNameEn,
  editCategory,
  setEditCategory,
  editTagline,
  setEditTagline,
  editBusinessType,
  setEditBusinessType,
  editLocation,
  setEditLocation,
  editEstablishedYear,
  setEditEstablishedYear,
  editEmployeesCount,
  setEditEmployeesCount,
  editFactorySize,
  setEditFactorySize,
  editDescription,
  setEditDescription
}) {
  if (!isOpen) return null;

  // 설립연도 셀렉트 옵션 (1950년부터 2026년까지)
  const currentYear = 2026;
  const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              Edit My Company Profile & Specs
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your company capacity and information displayed to global buyers.
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
          {/* 상호명 (한글 / 영문) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company Name (Korean)</label>
              <input
                type="text"
                value={editCompanyNameKo}
                onChange={(e) => setEditCompanyNameKo(e.target.value)}
                placeholder="e.g. (주)한국정밀공업"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Company Name (English) *</label>
              <input
                type="text"
                required
                value={editCompanyNameEn}
                onChange={(e) => setEditCompanyNameEn(e.target.value)}
                placeholder="e.g. Hankook Precision Co., Ltd."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* 한 줄 소개 (Tagline) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tagline (One-line Summary)</label>
            <input
              type="text"
              value={editTagline}
              onChange={(e) => setEditTagline(e.target.value)}
              placeholder="e.g. Leading Manufacturer of High-Precision Hydraulic Valves"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* 카테고리 및 비즈니스 타입 선택 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Main Category *</label>
              <select
                required
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
              >
                <option value="" disabled>Select Main Category</option>
                <option value="Industrial Machinery">Industrial Machinery</option>
                <option value="K-Beauty & Cosmetics">K-Beauty & Cosmetics</option>
                <option value="K-Food & Beverages">K-Food & Beverages</option>
                <option value="Electronics & Smart IT">Electronics & Smart IT</option>
                <option value="General Manufacturing">General Manufacturing</option>
                <option value="etc">etc</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Type *</label>
              <select
                required
                value={editBusinessType}
                onChange={(e) => setEditBusinessType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
              >
                <option value="" disabled>Select Business Type</option>
                <option value="Direct Manufacturer">Direct Manufacturer</option>
                <option value="OEM / ODM Manufacturer">OEM / ODM Manufacturer</option>
                <option value="High-Tech Direct Manufacturer">High-Tech Direct Manufacturer</option>
                <option value="Export Trading House">Export Trading House</option>
                <option value="etc">etc</option>
              </select>
            </div>
          </div>

          {/* 위치 및 설립연도 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company Location</label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="e.g. Incheon, South Korea 🇰🇷"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Established Year</label>
              <select
                value={editEstablishedYear}
                onChange={(e) => setEditEstablishedYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
              >
                <option value="">Select Established Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 직원 수 및 공장 면적 (선택 드롭다운) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Employees Count</label>
              <select
                value={editEmployeesCount}
                onChange={(e) => setEditEmployeesCount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
              >
                <option value="">Select Employee Range</option>
                <option value="1 - 10 Employees">1 - 10 Employees</option>
                <option value="11 - 50 Employees">11 - 50 Employees</option>
                <option value="51 - 200 Employees">51 - 200 Employees</option>
                <option value="201 - 500 Employees">201 - 500 Employees</option>
                <option value="500+ Employees">500+ Employees</option>
                <option value="etc">etc</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Factory Area</label>
              <select
                value={editFactorySize}
                onChange={(e) => setEditFactorySize(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
              >
                <option value="">Select Factory Size</option>
                <option value="Under 1,000 sq.m">Under 1,000 sq.m</option>
                <option value="1,000 - 3,000 sq.m">1,000 - 3,000 sq.m</option>
                <option value="3,000 - 10,000 sq.m">3,000 - 10,000 sq.m</option>
                <option value="Over 10,000 sq.m">Over 10,000 sq.m</option>
                <option value="No Physical Factory (Office)">No Physical Factory (Office)</option>
                <option value="etc">etc</option>
              </select>
            </div>
          </div>

          {/* 세부 소개 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Detailed Overview & Manufacturing Strength</label>
            <textarea
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Describe your manufacturing facility, production capacity, and export experience..."
              className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed"
            />
          </div>

          {/* 모달 하단 버튼 액션 */}
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
                  <Save className="w-4 h-4" />
                  <span>Save Company Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}