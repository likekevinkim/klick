'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Loader2, Check, X, ZoomIn } from 'lucide-react';
import { getCroppedImageBlob } from '@/lib/cropImage';

export default function ImageCropModal({ imageSrc, aspect = 4 / 3, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      setProcessing(true);
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999999] bg-slate-900/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 w-full max-w-lg space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">사진 자르기 및 크기 조정</h3>
          <button type="button" onClick={onCancel} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="relative w-full h-80 bg-slate-900 rounded-2xl overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center gap-3">
          <ZoomIn className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
