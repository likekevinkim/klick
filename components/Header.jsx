// components/Header.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe, PlusCircle, LayoutDashboard, UserCheck, ChevronDown } from 'lucide-react';

export default function Header() {
  const [currentLang, setCurrentLang] = useState('EN');
  const [isLangOpen, setIsLangOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'EN', name: 'English (US)' },
    { code: 'ko', label: 'KO', name: '한국어 (KR)' },
    { code: 'zh-CN', label: 'ZH', name: '中文 (简体)' },
    { code: 'ja', label: 'JA', name: '日本語 (JP)' },
    { code: 'es', label: 'ES', name: 'Español (ES)' },
    { code: 'ar', label: 'AR', name: 'العربية (AR)' },
  ];

  useEffect(() => {
    // 1. 구글 번역 스크립트 글로벌 주입
    if (!document.getElementById('google-translate-script')) {
      const addScript = document.createElement('script');
      addScript.id = 'google-translate-script';
      addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      addScript.async = true;
      document.body.appendChild(addScript);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,ko,zh-CN,ja,es,ar',
            autoDisplay: false,
          },
          'google_translate_element'
        );

        // 2. 접속 국가 감지 (한국 접속 시 한국어로 즉시 자동 변경)
        const userLang = navigator.language || navigator.userLanguage;
        if (userLang.includes('ko')) {
          changeLanguage('ko', 'KO');
        }
      };
    }
  }, []);

  // 구글 번역 드롭다운 셀렉트 변경 트리거
  const changeLanguage = (langCode, label) => {
    setCurrentLang(label);
    setIsLangOpen(false);

    const googleCombo = document.querySelector('.goog-te-combo');
    if (googleCombo) {
      googleCombo.value = langCode;
      googleCombo.dispatchEvent(new Event('change'));
    }
  };

  return (
    <header className="sticky top-0 z-[99999] bg-slate-900 text-white border-b border-slate-800 shadow-md">
      {/* 구글 번역 숨김 요소 */}
      <div id="google_translate_element" className="hidden"></div>

      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-4">
        {/* KLICK 브랜드 로고 - notranslate 적용하여 로고/그림 변형 방지 */}
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer group notranslate" translate="no">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-extrabold text-white text-xl shadow-lg group-hover:bg-blue-500 transition notranslate">
            K
          </div>
          <div className="flex flex-col notranslate">
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1 notranslate">
              KLICK <span className="text-xs font-semibold bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 notranslate">B2B</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider notranslate">
              Global Trade Marketplace
            </span>
          </div>
        </Link>

        {/* 내비게이션 & 언어 변경 메뉴 */}
        <nav className="flex items-center gap-3">
          {/* 구글 실시간 언어 전환 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Globe className="w-4 h-4 text-blue-400 notranslate" />
              <span className="notranslate" translate="no">{currentLang}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 notranslate" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fadeIn">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Language
                </div>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code, lang.label)}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                      currentLang === lang.label ? 'text-blue-600 bg-blue-50/60' : 'text-slate-700'
                    }`}
                  >
                    <span className="notranslate" translate="no">{lang.name}</span>
                    {currentLang === lang.label && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 글로벌 B2B 마켓플레이스 메인 홈 */}
          <Link
            href="/"
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <span>Marketplace</span>
          </Link>

          {/* 등록 상품 대시보드 */}
          <Link
            href="/products"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400 notranslate" />
            <span>My Dashboard</span>
          </Link>

          {/* 제조사/셀러 로그인 */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <UserCheck className="w-4 h-4 text-blue-400 notranslate" />
            <span>Seller Login</span>
          </Link>

          {/* 입점 상품 등록 CTA */}
          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-md transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 notranslate" />
            <span className="hidden sm:inline">AI Product Setup</span>
            <span className="sm:hidden">Setup</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}