// components/products/ProductMediaUploader.jsx
'use client';

import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Video } from 'lucide-react';

export default function ProductMediaUploader({ 
  mainImageUrl, 
  setMainImageUrl, 
  galleryImages, 
  setGalleryImages, 
  videoUrl, 
  setVideoUrl 
}) {
  const [mediaInputType, setMediaInputType] = useState('file'); // 'file' or 'url'

  const mainFileInputRef = useRef(null);
  const galleryFileInputRef = useRef(null);

  const handleMainFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageUrl(URL.createObjectURL(file));
    }
  };

  const handleGalleryFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newUrls = files.map(file => URL.createObjectURL(file));
      setGalleryImages(prev => [...prev, ...newUrls]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b pb-1">
        <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
          3. Product Photos & Video Upload
        </span>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setMediaInputType('file')}
            className={`px-2.5 py-1 rounded-md transition ${mediaInputType === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            File Select
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-4 text-center cursor-pointer transition space-y-1"
            >
              {mainImageUrl ? (
                <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200">
                  <img src={mainImageUrl} alt="Main Cover" className="w-full h-full object-cover" />
                  <span className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">Change</span>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-blue-600 mx-auto" />
                  <span className="text-xs font-extrabold text-slate-700 block">Click to Upload Cover Image</span>
                  <span className="text-[10px] text-slate-400 block">PNG, JPG up to 10MB</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Additional Gallery Photos</label>
            <input
              type="file"
              ref={galleryFileInputRef}
              accept="image/*"
              multiple
              onChange={handleGalleryFilesChange}
              className="hidden"
            />
            <div
              onClick={() => galleryFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-4 text-center cursor-pointer transition space-y-1"
            >
              {galleryImages.length > 0 ? (
                <div className="flex items-center gap-1.5 overflow-x-auto h-28">
                  {galleryImages.map((url, gIdx) => (
                    <div key={gIdx} className="w-20 h-full rounded-xl overflow-hidden border flex-shrink-0 relative">
                      <img src={url} alt={`Gallery ${gIdx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <ImageIcon className="w-6 h-6 text-emerald-600 mx-auto" />
                  <span className="text-xs font-extrabold text-slate-700 block">Click to Add Gallery Photos</span>
                  <span className="text-[10px] text-slate-400 block">Select multiple files</span>
                </>
              )}
            </div>
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