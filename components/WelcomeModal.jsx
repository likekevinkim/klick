// components/WelcomeModal.jsx
'use client';

import { useEffect, useState } from 'react';
import { X, PackageSearch, MessageCircle, Handshake } from 'lucide-react';

const STORAGE_KEY = 'klick_welcome_seen';

const STEPS = [
  {
    icon: PackageSearch,
    title: '1. 상품을 등록하거나 둘러보세요',
    desc: '판매자는 상품을 등록하고, 바이어는 원하는 상품을 검색해요.'
  },
  {
    icon: MessageCircle,
    title: '2. 채팅으로 편하게 문의하세요',
    desc: '언어가 달라도 자동 번역으로 실시간 대화할 수 있어요.'
  },
  {
    icon: Handshake,
    title: '3. 직접 대화하며 거래를 진행하세요',
    desc: 'KLICK은 채팅으로 셀러와 바이어를 연결해 드려요.'
  }
];

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, '1');
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">KLICK 이용 방법</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {STEPS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-10 h-10 flex-shrink-0 bg-blue-50 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            다시 보지 않기
          </label>

          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow transition cursor-pointer"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
