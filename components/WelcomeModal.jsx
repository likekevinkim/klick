// components/WelcomeModal.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Sparkles, Gift, Users } from 'lucide-react';

const STORAGE_KEY = 'klick_welcome_seen_v2';

const PERKS = [
  {
    icon: Gift,
    title: '입점 지원 100% 무료',
    desc: '상품 등록부터 다국어 상세페이지 제작까지 KLICK이 무료로 도와드려요.'
  },
  {
    icon: Users,
    title: '선착순 100개 업체 한정',
    desc: '오픈 기념 특별 혜택으로, 정해진 인원이 채워지면 종료돼요.'
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-extrabold rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            KLICK 오픈 기념
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
          선착순 100개 업체,<br />무료 입점을 도와드려요
        </h2>

        <div className="space-y-4">
          {PERKS.map(({ icon: Icon, title, desc }) => (
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

        <div className="space-y-3 pt-2 border-t border-slate-100">
          <Link
            href="/login"
            onClick={handleClose}
            className="block w-full text-center px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow transition cursor-pointer"
          >
            무료로 입점 신청하기
          </Link>

          <label className="flex items-center justify-center gap-2 text-sm text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            다시 보지 않기
          </label>
        </div>
      </div>
    </div>
  );
}
