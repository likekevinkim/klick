// components/products/ProductMediaUploader.jsx
'use client';

import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Video, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';

export default function ProductMediaUploader({ 
  mainImageUrl, 
  setMainImageUrl, 
  galleryImages, 
  setGalleryImages, 
  videoUrl, 
  setVideoUrl 
}) {
  const [mediaInputType, setMediaInputType] = useState('file');

  const mainFileInputRef = useRef(null);
  const galleryFileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);

  // 파일 업로드 시 DB 저장이 가능한 Data URL(Base64) 변환 함수
  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // 메인 커버 사진 선택
  const handleMainFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        setMainImageUrl(dataUrl);
      } catch (err) {
        console.error('Main image load error:', err);
      }
    }
  };

  // 추가 갤러리 사진 선택 (다중)
  const handleGalleryFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      try {
        const dataUrls = await Promise.all(files.map(fileToDataUrl));
        setGalleryImages(prev => [...prev, ...dataUrls]);
      } catch (err) {
        console.error('Gallery image load error:', err);
      }
    }
  };

  // 동영상 파일 선택
  const handleVideoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        setVideoUrl(dataUrl);
      } catch (err) {
        console.error('Video load error:', err);
      }
    }
  };

  const handleRemoveGalleryImage = (index) => {
    setGalleryImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveImageLeft = (index) => {
    if (index === 0) return;
    setGalleryImages(prev => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleMoveImageRight = (index) => {
    if (index === galleryImages.length - 1) return;
    setGalleryImages(prev => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-1">
        <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
          4. Product Photos & Factory Demo Video
        </span>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setMediaInputType('file')}
            className={`px-2.5 py-1 rounded-md transition ${mediaInputType === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setMediaInputType('url')}
            className={`px-2.5 py-1 rounded-md transition ${mediaInputType === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            Paste URL
          </button>
        </div>
      </div>

      {mediaInputType === 'file' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 메인 커버 사진 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Main Cover Image *</label>
              <input
                type="file"
                ref={mainFileInputRef}
                accept="image/*"
                onChange={handleMainFileChange}
                className="hidden"
              />
              <div
                onClick={() => mainFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-3 text-center cursor-pointer transition space-y-1"
              >
                {mainImageUrl ? (
                  <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200">
                    <img src={mainImageUrl} alt="Main Cover" className="w-full h-full object-cover" />
                    <span className="absolute top-1 right-1 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded">Change</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-blue-600 mx-auto" />
                    <span className="text-xs font-extrabold text-slate-700 block">Click to Select Cover Image File</span>
                    <span className="text-[10px] text-slate-400 block">PNG, JPG, WEBP</span>
                  </>
                )}
              </div>
            </div>

            {/* 제품 홍보 동영상 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Factory Demo Video File</label>
              <input
                type="file"
                ref={videoFileInputRef}
                accept="video/*"
                onChange={handleVideoFileChange}
                className="hidden"
              />
              <div
                onClick={() => videoFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-rose-500 bg-slate-50 hover:bg-rose-50/30 rounded-2xl p-3 text-center cursor-pointer transition space-y-1"
              >
                {videoUrl ? (
                  <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200 bg-black flex items-center justify-center">
                    <video src={videoUrl} className="w-full h-full object-contain" />
                    <span className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">Change Video</span>
                  </div>
                ) : (
                  <>
                    <Video className="w-6 h-6 text-rose-600 mx-auto" />
                    <span className="text-xs font-extrabold text-slate-700 block">Click to Upload Demo Video File</span>
                    <span className="text-[10px] text-slate-400 block">MP4, MOV, WEBM</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 추가 갤러리 사진 */}
          <div className="space-y-2 border-t pt-3 border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Additional Gallery Photos ({galleryImages.length})
              </label>
              <button
                type="button"
                onClick={() => galleryFileInputRef.current?.click()}
                className="text-[11px] font-extrabold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" /> + Add Photos
              </button>
            </div>

            <input
              type="file"
              ref={galleryFileInputRef}
              accept="image/*"
              multiple
              onChange={handleGalleryFilesChange}
              className="hidden"
            />

            {galleryImages.length === 0 ? (
              <div
                onClick={() => galleryFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 p-4 rounded-2xl text-center cursor-pointer text-xs text-slate-500"
              >
                Click to select multiple product photo files for the gallery.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {galleryImages.map((url, idx) => (
                  <div key={idx} className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group h-28">
                    <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 p-1">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImageLeft(idx)}
                          className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow cursor-pointer"
                          title="Move Left"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow cursor-pointer"
                        title="Delete Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {idx < galleryImages.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImageRight(idx)}
                          className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow cursor-pointer"
                          title="Move Right"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Main Cover Image URL *</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={mainImageUrl}
              onChange={(e) => setMainImageUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Factory Short Demo Video URL (MP4 / Embed)</label>
            <input
              type="url"
              placeholder="https://www.w3schools.com/html/mov_bbb.mp4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}