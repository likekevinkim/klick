// components/company/EditCompanyModal.jsx
'use client';

import { useState } from 'react';
import { 
  X, 
  Edit3, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  ImageIcon, 
  Video, 
  Bold, 
  Italic, 
  List, 
  Heading, 
  Award,
  Link as LinkIcon
} from 'lucide-react';

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
  setEditDescription,
  editCoverImage,
  setEditCoverImage,
  editGalleryImages,
  setEditGalleryImages,
  editVideoUrl,
  setEditVideoUrl,
  editCertifications,
  setEditCertifications
}) {
  if (!isOpen) return null;

  const currentYear = 2026;
  const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => (currentYear - i).toString());

  // 기타 사진 URL 임시 입력
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  
  // 인증서 임시 입력
  const [newCertText, setNewCertText] = useState('');

  // 사진 추가 함수
  const handleAddGalleryImage = () => {
    if (!newGalleryUrl.trim()) return;
    setEditGalleryImages([...(editGalleryImages || []), newGalleryUrl.trim()]);
    setNewGalleryUrl('');
  };

  // 사진 삭제 함수
  const handleRemoveGalleryImage = (index) => {
    const updated = editGalleryImages.filter((_, i) => i !== index);
    setEditGalleryImages(updated);
  };

  // 인증서 추가 함수 (+ 버튼)
  const handleAddCertification = () => {
    if (!newCertText.trim()) return;
    setEditCertifications([...(editCertifications || []), newCertText.trim()]);
    setNewCertText('');
  };

  // 인증서 삭제 함수
  const handleRemoveCertification = (index) => {
    const updated = editCertifications.filter((_, i) => i !== index);
    setEditCertifications(updated);
  };

  // 경량 텍스트 에디터 서식 태그 주입 헬퍼
  const handleInsertEditorTag = (tagType) => {
    let prefix = '';
    let suffix = '';

    if (tagType === 'bold') {
      prefix = '<b>';
      suffix = '</b>';
    } else if (tagType === 'italic') {
      prefix = '<i>';
      suffix = '</i>';
    } else if (tagType === 'heading') {
      prefix = '<h3>';
      suffix = '</h3>';
    } else if (tagType === 'list') {
      prefix = '<ul>\n  <li>';
      suffix = '</li>\n</ul>';
    } else if (tagType === 'image') {
      const url = prompt('Enter Image URL to embed:');
      if (url) {
        prefix = `<img src="${url}" alt="Company Detail Image" class="w-full my-3 rounded-2xl border" />`;
      }
    }

    if (prefix) {
      setEditDescription((prev) => (prev || '') + `\n${prefix}${suffix}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              Edit My Company Profile & Specs
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your company capacity, cover photo, gallery images, video, and certifications.
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

        <form onSubmit={onSubmit} className="space-y-5 text-xs">
          
          {/* 1. 상호명 (한글 / 영문) */}
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

          {/* 한 줄 소개 */}
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

          {/* 2. 대표 사진 (Cover Image) 설정 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="block font-extrabold text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              Main Company Cover Photo URL (대표 사진)
            </label>
            <input
              type="url"
              value={editCoverImage}
              onChange={(e) => setEditCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {editCoverImage && (
              <div className="h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-200 mt-2">
                <img src={editCoverImage} alt="Cover Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* 3. 기타 사진 (Gallery Images) 관리 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <label className="block font-extrabold text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              Facility & Production Line Gallery Photos (기타 사진 갤러리)
            </label>

            <div className="flex gap-2">
              <input
                type="url"
                value={newGalleryUrl}
                onChange={(e) => setNewGalleryUrl(e.target.value)}
                placeholder="Enter Photo URL (https://...)"
                className="flex-1 px-3.5 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddGalleryImage}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow transition flex items-center gap-1 cursor-pointer flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Photo</span>
              </button>
            </div>

            {/* 등록된 갤러리 리스트 */}
            {editGalleryImages && editGalleryImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                {editGalleryImages.map((url, idx) => (
                  <div key={idx} className="relative h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-200 group">
                    <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. 홍보 비디오 URL */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="block font-extrabold text-slate-800 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-purple-600" />
              Company Video Tour Stream URL (관련 비디오 URL)
            </label>
            <input
              type="url"
              value={editVideoUrl}
              onChange={(e) => setEditVideoUrl(e.target.value)}
              placeholder="e.g. https://www.w3schools.com/html/mov_bbb.mp4"
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* 5. Certifications (+ 버튼으로 계속 추가) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <label className="block font-extrabold text-slate-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Quality Certifications & Licenses (인증서 목록 관리)
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCertText}
                onChange={(e) => setNewCertText(e.target.value)}
                placeholder="e.g. ISO 9001, CE Certified, KC Mark"
                className="flex-1 px-3.5 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCertification}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow transition flex items-center gap-1 cursor-pointer flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Cert</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {editCertifications && editCertifications.map((cert, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-amber-50 text-amber-800 font-bold rounded-xl border border-amber-200 flex items-center gap-2"
                >
                  <span>{cert}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCertification(idx)}
                    className="text-amber-600 hover:text-rose-600 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
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

          {/* 직원 수 및 공장 면적 */}
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

          {/* 6. 리치 텍스트 에디터 (Detailed Overview & Manufacturing Strength) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-700">
                Detailed Overview & Manufacturing Strength (에디터)
              </label>

              {/* 에디터 툴바 */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleInsertEditorTag('bold')}
                  className="p-1 hover:bg-white rounded text-slate-700 transition cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertEditorTag('italic')}
                  className="p-1 hover:bg-white rounded text-slate-700 transition cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertEditorTag('heading')}
                  className="p-1 hover:bg-white rounded text-slate-700 transition cursor-pointer"
                  title="Heading"
                >
                  <Heading className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertEditorTag('list')}
                  className="p-1 hover:bg-white rounded text-slate-700 transition cursor-pointer"
                  title="List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertEditorTag('image')}
                  className="p-1 hover:bg-white rounded text-slate-700 transition cursor-pointer"
                  title="Embed Image"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Describe your manufacturing facility, production capacity, and HTML/Image content..."
              className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed font-mono text-xs"
            />
          </div>

          {/* 제출 버튼 */}
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