// components/company/VideoModal.jsx
'use client';

import { X, ShieldCheck } from 'lucide-react';

export default function VideoModal({ isOpen, onClose, videoUrl }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-3xl p-6 max-w-3xl w-full border border-slate-800 shadow-2xl space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Verified Factory Video Stream
          </span>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-full h-80 md:h-96 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
          <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
        </div>
      </div>
    </div>
  );
}