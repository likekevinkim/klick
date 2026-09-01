// components/Footer.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const [isKo, setIsKo] = useState(false);

  useEffect(() => {
    setIsKo(localStorage.getItem('klick_lang_code') === 'ko');
  }, []);

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* 1. Company intro & logo */}
        <div className="space-y-4 md:col-span-2">
          <div className="notranslate" translate="no">
            <Image
              src={isKo ? '/brand/klick-logo-ko.png' : '/brand/klick-logo-en.png'}
              alt="KLICK"
              width={1078}
              height={398}
              className="h-8 w-auto"
            />
          </div>
          {isKo ? (
            <p className="leading-relaxed font-medium max-w-sm notranslate break-keep" translate="no">
              <span className="notranslate" translate="no">KLICK</span>(클릭)은 한국 제조기업과 해외 바이어를 실시간 채팅으로 연결하는 B2B 수출·무역 플랫폼입니다. 언어 장벽 없이 빠르고 투명하게 글로벌 무역을 진행할 수 있도록 돕습니다.
            </p>
          ) : (
            <p className="leading-relaxed font-medium max-w-sm">
              <span className="notranslate" translate="no">KLICK</span> is a B2B export platform that directly connects Korean manufacturers with global buyers.
              We support transparent, fast global trade with no language barrier.
            </p>
          )}
        </div>

        {/* 2. Customer Center */}
        <div className="space-y-4">
          <h3 className="text-white font-extrabold uppercase tracking-wider">Customer Center</h3>
          <div className="space-y-2.5 font-medium">
            <p className="flex items-center gap-2 hover:text-white transition">
              <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" /> 
              <span>+82-507-1345-2432</span>
            </p>
            <p className="flex items-center gap-2 hover:text-white transition">
              <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" /> 
              <span>info@klick.biz</span>
            </p>
            <p className="flex items-start gap-2 hover:text-white transition">
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" /> 
              <span>16, Sure-ro 116beon-gil, Wabu-eup, Namyangju-si, Gyeonggi-do, South Korea</span>
            </p>
          </div>
        </div>

        {/* 3. Legal & Policy */}
        <div className="space-y-4">
          <h3 className="text-white font-extrabold uppercase tracking-wider">Legal & Policy</h3>
          <ul className="space-y-2.5 font-medium">
            <li>
              <Link href="/terms" className="hover:text-white transition">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition font-bold text-blue-400">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white transition">
                About Us
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom business info & copyright */}
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 font-medium text-[10px] text-slate-500">
        <div className="space-y-1 text-center md:text-left">
          <p>Business Registration No.: 829-32-00630</p>
          <p>E-Commerce Registration No.: 2025-WABUJOAN-0341</p>
        </div>
        <p>© {new Date().getFullYear()} <span className="notranslate" translate="no">KLICK</span> Corporation. All rights reserved.</p>
      </div>
    </footer>
  );
}
