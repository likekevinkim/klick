// components/GoogleTranslateScript.jsx
'use client';

import { useEffect } from 'react';

export default function GoogleTranslateScript() {
  useEffect(() => {
    // 이미 구글 번역 스크립트가 주입되어 있다면 중복 주입 방지
    if (document.getElementById('google-translate-script')) return;

    const addScript = document.createElement('script');
    addScript.id = 'google-translate-script';
    addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    addScript.async = true;
    document.body.appendChild(addScript);

    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'auto',
            includedLanguages: 'en,ko,zh-CN,ja,es,ar,ru,vi', // 주요 무역 국적 언어 지원
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };
  }, []);

  return (
    <div id="google_translate_element" className="hidden" />
  );
}