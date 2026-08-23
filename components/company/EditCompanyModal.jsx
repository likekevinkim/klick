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
  Link as LinkIcon,
  Upload,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Klick from '@/components/Klick';

export default function EditCompanyModal({
  isOpen,
  onClose,
  onSubmit,
  onDeleted,
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
  setEditCertifications,
  editBizCertKo,
  setEditBizCertKo,
  editBizCertEn,
  setEditBizCertEn
}) {
  if (!isOpen) return null;

  const currentYear = 2026;
  const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => (currentYear - i).toString());

  // 직접 파일 업로드 상태
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingBizCertKo, setUploadingBizCertKo] = useState(false);
  const [uploadingBizCertEn, setUploadingBizCertEn] = useState(false);

  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newCertText, setNewCertText] = useState('');

  // 회사 정보 전체 삭제 (Caution)
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteCompany = async () => {
    if (deleteConfirmText.trim() !== editCompanyNameEn.trim()) return;
    if (!confirm('This will permanently delete your company profile and all your product listings. Your login will stay active. This cannot be undone. Continue?')) return;

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');

      const res = await fetch('/api/seller/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || '삭제에 실패했습니다.');

      onDeleted?.();
    } catch (err) {
      console.error('Failed to delete company:', err);
      alert('삭제에 실패했습니다: ' + (err.message || 'Unknown error'));
      setDeleting(false);
    }
  };

  // 1. 대표 사진 컴퓨터 파일 직접 업로드 (Supabase Storage)
  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('company-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setEditCoverImage(publicUrlData.publicUrl);
      }
    } catch (err) {
      console.error('Cover upload error:', err);
      alert('대표 사진 업로드에 실패했습니다: ' + (err.message || 'Storage connection error'));
    } finally {
      setUploadingCover(false);
    }
  };

  // 2. 갤러리 기타 사진 컴퓨터 파일 직접 업로드 (Supabase Storage)
  const handleGalleryFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingGallery(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `gallery_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('company-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setEditGalleryImages([...(editGalleryImages || []), publicUrlData.publicUrl]);
      }
    } catch (err) {
      console.error('Gallery upload error:', err);
      alert('갤러리 사진 업로드에 실패했습니다: ' + (err.message || 'Storage connection error'));
    } finally {
      setUploadingGallery(false);
    }
  };

  // 3. 비디오 파일 직접 업로드 (Supabase Storage)
  const handleVideoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingVideo(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `video_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('company-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setEditVideoUrl(publicUrlData.publicUrl);
      }
    } catch (err) {
      console.error('Video upload error:', err);
      alert('영상 업로드에 실패했습니다: ' + (err.message || 'Storage connection error'));
    } finally {
      setUploadingVideo(false);
    }
  };

  // 4. 사업자등록증 파일 직접 업로드 (한글판 / 영문판 공용 헬퍼)
  // 사업자등록증에는 대표자명/주소/사업자번호 같은 개인정보가 들어있어, 커버/갤러리 사진과
  // 달리 공개 버킷에 올리면 안 됨 — 비공개 버킷(company-private-docs)에 "본인 폴더" 안으로만
  // 올리고, DB에는 공개 URL이 아니라 파일 경로만 저장한다. 실제 열람은 handleViewBizCert가
  // 그때그때 서명된(만료되는) URL을 발급받아서 처리.
  const handleBizCertFileUpload = async (e, lang) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = lang === 'ko' ? setUploadingBizCertKo : setUploadingBizCertEn;
    const setUrl = lang === 'ko' ? setEditBizCertKo : setEditBizCertEn;

    try {
      setUploading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');

      const fileExt = file.name.split('.').pop();
      const fileName = `bizcert_${lang}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-private-docs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUrl(filePath);
    } catch (err) {
      console.error('Business registration certificate upload error:', err);
      alert('사업자등록증 업로드에 실패했습니다: ' + (err.message || 'Storage connection error'));
    } finally {
      setUploading(false);
    }
  };

  // 저장된 경로로 그때그때 만료되는 서명 URL을 발급받아 새 탭에서 연다
  const handleViewBizCert = async (path) => {
    try {
      const { data, error } = await supabase.storage
        .from('company-private-docs')
        .createSignedUrl(path, 300);

      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Signed URL fetch error:', err);
      alert('파일을 여는 데 실패했습니다: ' + (err.message || 'Storage connection error'));
    }
  };

  // 사진 URL 입력 추가
  const handleAddGalleryImageByUrl = () => {
    if (!newGalleryUrl.trim()) return;
    setEditGalleryImages([...(editGalleryImages || []), newGalleryUrl.trim()]);
    setNewGalleryUrl('');
  };

  // 갤러리 사진 삭제
  const handleRemoveGalleryImage = (index) => {
    const updated = editGalleryImages.filter((_, i) => i !== index);
    setEditGalleryImages(updated);
  };

  // 인증서 추가 (+ 버튼)
  const handleAddCertification = () => {
    if (!newCertText.trim()) return;
    setEditCertifications([...(editCertifications || []), newCertText.trim()]);
    setNewCertText('');
  };

  // 인증서 삭제
  const handleRemoveCertification = (index) => {
    const updated = editCertifications.filter((_, i) => i !== index);
    setEditCertifications(updated);
  };

  // 에디터 서식 태그 주입 헬퍼
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
      const url = prompt('소개글에 넣을 이미지 URL을 입력하세요:');
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
              회사 프로필 및 스펙 수정
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              회사 소개, 대표 사진, 갤러리 사진, 홍보 영상, 인증서를 입력하고 수정할 수 있어요.
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

        <form onSubmit={onSubmit} className="space-y-5 text-sm">
          
          {/* 1. 상호명 (한글 / 영문) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">회사명 (한글)</label>
              <input
                type="text"
                value={editCompanyNameKo}
                onChange={(e) => setEditCompanyNameKo(e.target.value)}
                placeholder="예: 한국정밀 주식회사"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">회사명 (영문) *</label>
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
            <label className="block font-bold text-slate-700 mb-1">한 줄 소개</label>
            <input
              type="text"
              value={editTagline}
              onChange={(e) => setEditTagline(e.target.value)}
              placeholder="예: 고정밀 유압 밸브 전문 제조업체"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* 2. 대표 사진 (직접 파일 업로드 또는 URL) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <label className="block font-extrabold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                대표 사진
              </span>
              <span className="text-sm text-slate-400 font-semibold">회사 목록/쇼룸 맨 위에 보여요</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex-1 px-4 py-2.5 bg-white border border-slate-300 hover:border-blue-500 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition text-slate-700 font-bold">
                {uploadingCover ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Upload className="w-4 h-4 text-blue-600" />
                )}
                <span>{uploadingCover ? '업로드 중...' : '클릭해서 사진 올리기'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileUpload}
                  className="hidden"
                />
              </label>

              <input
                type="url"
                value={editCoverImage}
                onChange={(e) => setEditCoverImage(e.target.value)}
                placeholder="또는 이미지 URL 붙여넣기 (https://...)"
                className="flex-1 px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {editCoverImage && (
              <div className="h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-200 mt-2">
                <img src={editCoverImage} alt="대표 사진 미리보기" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* 3. 기타 사진 갤러리 (직접 파일 업로드 또는 URL) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <label className="block font-extrabold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                갤러리 사진
              </span>
              <span className="text-sm text-slate-400 font-semibold">여러 장 올릴 수 있어요</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <label className="sm:col-span-5 px-4 py-2.5 bg-white border border-slate-300 hover:border-emerald-500 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition text-slate-700 font-bold">
                {uploadingGallery ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <Upload className="w-4 h-4 text-emerald-600" />
                )}
                <span>{uploadingGallery ? '업로드 중...' : '사진 파일 올리기'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryFileUpload}
                  className="hidden"
                />
              </label>

              <div className="sm:col-span-7 flex gap-2">
                <input
                  type="url"
                  value={newGalleryUrl}
                  onChange={(e) => setNewGalleryUrl(e.target.value)}
                  placeholder="또는 URL 붙여넣기 (https://...)"
                  className="flex-1 px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryImageByUrl}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow transition flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>URL 추가</span>
                </button>
              </div>
            </div>

            {/* 등록된 갤러리 리스트 */}
            {editGalleryImages && editGalleryImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
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

          {/* 4. 홍보 비디오 (직접 동영상 파일 업로드 또는 URL) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <label className="block font-extrabold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-purple-600" />
                회사 소개 영상
              </span>
              <span className="text-sm text-slate-400 font-semibold">MP4 / WEBM / URL</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex-1 px-4 py-2.5 bg-white border border-slate-300 hover:border-purple-500 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition text-slate-700 font-bold">
                {uploadingVideo ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                ) : (
                  <Upload className="w-4 h-4 text-purple-600" />
                )}
                <span>{uploadingVideo ? '영상 업로드 중...' : '클릭해서 영상 올리기 (.mp4)'}</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  onChange={handleVideoFileUpload}
                  className="hidden"
                />
              </label>

              <input
                type="url"
                value={editVideoUrl}
                onChange={(e) => setEditVideoUrl(e.target.value)}
                placeholder="또는 영상 URL 붙여넣기 (https://...)"
                className="flex-1 px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {editVideoUrl && (
              <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-sm font-bold flex items-center justify-between">
                <span className="truncate max-w-[400px]">첨부된 영상: {editVideoUrl}</span>
                <button
                  type="button"
                  onClick={() => setEditVideoUrl('')}
                  className="text-rose-600 hover:underline cursor-pointer text-sm"
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          {/* 5. Certifications (+ 버튼으로 계속 추가) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <label className="block font-extrabold text-slate-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              보유 인증 및 자격
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCertText}
                onChange={(e) => setNewCertText(e.target.value)}
                placeholder="예: ISO 9001, CE 인증, KC 마크"
                className="flex-1 px-3.5 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCertification}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow transition flex items-center gap-1 cursor-pointer flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>추가</span>
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

          {/* 5-1. 사업자등록증 (한글판 / 영문판) — 둘 다 올려야 Verified Korean Company 마크 부여 */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
            <label className="block font-extrabold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              사업자등록증
            </label>
            <p className="text-sm text-slate-500 leading-relaxed">
              한글판과 영문판을 모두 올리면 심사 요청이 접수됩니다. <Klick /> 관리자가 승인하면 바이어에게 <strong>인증된 한국 기업</strong> 배지가 표시돼요. 이미지 또는 PDF 파일 모두 가능합니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 한글판 */}
              <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">한글판</span>
                  {editBizCertKo && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 업로드 완료
                    </span>
                  )}
                </div>

                <label className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 hover:border-emerald-500 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition text-slate-700 font-bold">
                  {uploadingBizCertKo ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>{uploadingBizCertKo ? '업로드 중...' : '파일 올리기'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleBizCertFileUpload(e, 'ko')}
                    className="hidden"
                  />
                </label>

                {editBizCertKo && (
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => handleViewBizCert(editBizCertKo)}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" /> 파일 보기
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditBizCertKo('')}
                      className="text-rose-600 hover:underline font-bold cursor-pointer"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>

              {/* 영문판 */}
              <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">영문판</span>
                  {editBizCertEn && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 업로드 완료
                    </span>
                  )}
                </div>

                <label className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 hover:border-emerald-500 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition text-slate-700 font-bold">
                  {uploadingBizCertEn ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>{uploadingBizCertEn ? '업로드 중...' : '파일 올리기'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleBizCertFileUpload(e, 'en')}
                    className="hidden"
                  />
                </label>

                {editBizCertEn && (
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => handleViewBizCert(editBizCertEn)}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" /> 파일 보기
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditBizCertEn('')}
                      className="text-rose-600 hover:underline font-bold cursor-pointer"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>

            {editBizCertKo && editBizCertEn ? (
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 두 파일 모두 업로드됐어요 — 저장하면 관리자 심사가 시작됩니다.
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm pt-1">
                <FileText className="w-3.5 h-3.5" /> 두 버전을 모두 올려야 인증 배지 심사를 요청할 수 있어요.
              </div>
            )}
          </div>

          {/* 카테고리 및 비즈니스 타입 선택 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">주요 카테고리 *</label>
              <select
                required
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
              >
                <option value="" disabled>카테고리 선택</option>
                <option value="Industrial Machinery">산업 기계</option>
                <option value="K-Beauty & Cosmetics">K-뷰티 / 화장품</option>
                <option value="K-Food & Beverages">K-푸드 / 음료</option>
                <option value="Electronics & Smart IT">전자 / 스마트 IT</option>
                <option value="General Manufacturing">일반 제조업 / 기타</option>
                <option value="etc">기타</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">사업 형태 *</label>
              <select
                required
                value={editBusinessType}
                onChange={(e) => setEditBusinessType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
              >
                <option value="" disabled>사업 형태 선택</option>
                <option value="Direct Manufacturer">직접 제조사</option>
                <option value="OEM / ODM Manufacturer">OEM / ODM 제조사</option>
                <option value="High-Tech Direct Manufacturer">첨단기술 직접 제조사</option>
                <option value="Export Trading House">수출 무역회사</option>
                <option value="etc">기타</option>
              </select>
            </div>
          </div>

          {/* 위치 및 설립연도 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">회사 위치</label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="예: 인천, 대한민국 🇰🇷"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">설립 연도</label>
              <select
                value={editEstablishedYear}
                onChange={(e) => setEditEstablishedYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
              >
                <option value="">설립 연도 선택</option>
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
              <label className="block font-bold text-slate-700 mb-1">직원 수</label>
              <select
                value={editEmployeesCount}
                onChange={(e) => setEditEmployeesCount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
              >
                <option value="">직원 수 선택</option>
                <option value="1 - 10 Employees">1 - 10명</option>
                <option value="11 - 50 Employees">11 - 50명</option>
                <option value="51 - 200 Employees">51 - 200명</option>
                <option value="201 - 500 Employees">201 - 500명</option>
                <option value="500+ Employees">500명 이상</option>
                <option value="etc">기타</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">공장 면적</label>
              <select
                value={editFactorySize}
                onChange={(e) => setEditFactorySize(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
              >
                <option value="">공장 면적 선택</option>
                <option value="Under 1,000 sq.m">1,000㎡ 미만</option>
                <option value="1,000 - 3,000 sq.m">1,000 - 3,000㎡</option>
                <option value="3,000 - 10,000 sq.m">3,000 - 10,000㎡</option>
                <option value="Over 10,000 sq.m">10,000㎡ 초과</option>
                <option value="No Physical Factory (Office)">공장 없음 (사무실)</option>
                <option value="etc">기타</option>
              </select>
            </div>
          </div>

          {/* 6. 리치 텍스트 에디터 (Detailed Overview & Manufacturing Strength) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-700">
                상세 소개 및 제조 강점
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!editDescription) return;
                    if (confirm('상세 소개 및 제조 강점 내용을 전체 삭제할까요? 저장 전까지는 되돌릴 수 있어요.')) {
                      setEditDescription('');
                    }
                  }}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center gap-1 text-sm font-bold"
                  title="전체 삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>전체 삭제</span>
                </button>

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
            </div>

            <textarea
              rows={6}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="공장 시설, 생산 능력 등을 자유롭게 소개해주세요. HTML/이미지 삽입도 가능합니다..."
              className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed font-mono text-sm"
            />
          </div>

          {/* 위험 구역: 회사 정보 전체 삭제 */}
          <div className="p-4 bg-white rounded-2xl border border-red-200 space-y-3">
            {!showDangerZone ? (
              <button
                type="button"
                onClick={() => setShowDangerZone(true)}
                className="text-sm font-bold text-red-500 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>회사 정보 삭제</span>
              </button>
            ) : (
              <>
                <div>
                  <label className="block font-extrabold text-red-600">Caution</label>
                  <p className="text-sm text-slate-500 mt-0.5">
                    회사 프로필과 등록한 상품을 전부 삭제합니다. 로그인 계정은 그대로 유지되며, 이 작업은 되돌릴 수 없습니다.
                  </p>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2.5 bg-white border border-red-300 hover:bg-red-50 text-red-600 font-extrabold rounded-xl transition inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>회사 정보 삭제</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      autoFocus
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={`확인을 위해 "${editCompanyNameEn}" 입력`}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-200 focus:outline-none"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteCompany}
                        disabled={deleting || !editCompanyNameEn || deleteConfirmText.trim() !== editCompanyNameEn.trim()}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold rounded-xl transition inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{deleting ? '삭제 중...' : '회사 정보 완전 삭제'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                        className="text-sm font-bold text-slate-500 hover:underline cursor-pointer"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 제출 버튼 */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              취소
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
                  <span>회사 프로필 저장</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}