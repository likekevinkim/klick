// components/Footer.jsx
'use client';

import Link from 'next/link';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* 1. 회사 소개 및 로고 */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 text-white font-black text-lg">
            <Building2 className="w-6 h-6 text-blue-500" />
            <span>KLICK</span>
          </div>
          <p className="leading-relaxed font-medium max-w-sm">
            KLICK은 한국 제조업체와 글로벌 바이어를 직접 연결하는 B2B 수출 플랫폼입니다. 
            언어 장벽 없이 투명하고 빠른 글로벌 무역을 지원합니다.
          </p>
        </div>

        {/* 2. 고객센터 (Customer Center) */}
        <div className="space-y-4">
          <h3 className="text-white font-extrabold uppercase tracking-wider">Customer Center</h3>
          <div className="space-y-2.5 font-medium">
            <p className="flex items-center gap-2 hover:text-white transition">
              <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" /> 
              <span>+82-2-1234-5678</span>
            </p>
            <p className="flex items-center gap-2 hover:text-white transition">
              <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" /> 
              <span>truek.work@gmail.com</span>
            </p>
            <p className="flex items-start gap-2 hover:text-white transition">
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" /> 
              <span>서울특별시 강남구 테헤란로 123, 45층 TRUE K CO., LTD.</span>
            </p>
          </div>
        </div>

        {/* 3. 법적 고지 및 약관 (Legal & Policy) */}
        <div className="space-y-4">
          <h3 className="text-white font-extrabold uppercase tracking-wider">Legal & Policy</h3>
          <ul className="space-y-2.5 font-medium">
            <li>
              <Link href="/terms" className="hover:text-white transition">
                이용약관 (Terms of Service)
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition font-bold text-blue-400">
                개인정보처리방침 (Privacy Policy)
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white transition">
                회사소개 (About Us)
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* 하단 사업자 정보 및 카피라이트 */}
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 font-medium text-[10px] text-slate-500">
        <div className="space-y-1 text-center md:text-left">
          <p>상호명: TRUE K CO., LTD. | 사업자등록번호: 829-32-00630</p>
          <p>통신판매업신고: 2026-서울송파-01234 </p>
        </div>
        <p>© {new Date().getFullYear()} KLICK Corporation. All rights reserved.</p>
      </div>
    </footer>
  );
}