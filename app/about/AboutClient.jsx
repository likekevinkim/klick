// app/about/AboutClient.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Klick from '@/components/Klick';
import { Building2, Target, Globe2, MessageSquare, Mail, Phone, MapPin } from 'lucide-react';

export default function AboutClient() {
  const [isKo, setIsKo] = useState(false);

  useEffect(() => {
    setIsKo(localStorage.getItem('klick_lang_code') === 'ko');
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-3xl mx-auto px-6 mt-10 space-y-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-md border border-slate-800 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 notranslate" translate="no">
            <Building2 className="w-3.5 h-3.5" /> {isKo ? 'KLICK 소개' : <>About <Klick /></>}
          </span>
          {isKo ? (
            <>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight notranslate break-keep" translate="no">
                한국 제조기업을 세계와 연결합니다
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl notranslate break-keep" translate="no">
                <span className="notranslate" translate="no">KLICK</span>은 해외 영업 인력이 없는 한국 제조기업과, 검증된 한국 공장에서 직접 소싱하려는 해외 바이어를 위한 B2B 수출 플랫폼입니다.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Connecting Korean Manufacturers with the World
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                <Klick /> is a B2B export platform built for Korean manufacturers who don&apos;t have a dedicated
                overseas sales team — and for global buyers looking to source directly from verified Korean factories.
              </p>
            </>
          )}
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            {isKo ? (
              <div className="notranslate break-keep" translate="no">
                <h2 className="text-sm font-extrabold text-slate-900">미션</h2>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  국내 중소 제조기업은 우수한 제품력을 갖추고도 해외 마케팅에 필요한 자원이 부족한 경우가 많습니다.{' '}
                  <span className="notranslate" translate="no">KLICK</span>은 이 장벽을 없애줍니다 — 셀러가 한국어로 상품 정보를 입력하면, 플랫폼이 이를
                  전문적으로 정리해 해외 바이어에게 소개합니다. 별도의 수출 전담 인력은 필요 없습니다.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Our Mission</h2>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  Small and mid-sized Korean manufacturers often make excellent products but lack the resources to
                  market themselves internationally. <Klick /> removes that barrier: sellers describe their products in
                  Korean, and the platform helps present them professionally to a global audience — no export team required.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-start gap-3">
            <Globe2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            {isKo ? (
              <div className="notranslate break-keep" translate="no">
                <h2 className="text-sm font-extrabold text-slate-900">
                  <span className="notranslate" translate="no">KLICK</span>은 누구를 위한 플랫폼인가요
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  <strong className="text-slate-800">셀러</strong>는 자사 제품을 해외 시장에 알리고 싶은 한국 제조기업입니다.{' '}
                  <strong className="text-slate-800">바이어</strong>는 한국 공장에서 직접 상품을 소싱하고, 견적을 요청하고,
                  거래 조건을 협의하려는 전 세계 어디든의 기업입니다.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Who <Klick /> Is For</h2>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  <strong className="text-slate-800">Sellers</strong> are Korean manufacturers who want to list their
                  products for an international audience. <strong className="text-slate-800">Buyers</strong> are
                  companies anywhere in the world looking to source directly from Korean factories, request quotes,
                  and negotiate terms.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            {isKo ? (
              <div className="notranslate break-keep" translate="no">
                <h2 className="text-sm font-extrabold text-slate-900">
                  <span className="notranslate" translate="no">KLICK</span>이 하는 일, 하지 않는 일
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  <span className="notranslate" translate="no">KLICK</span>의 역할은 바이어와 셀러를 연결하는 것입니다 — 상품 등록, 견적 요청(RFQ),
                  실시간 번역 채팅을 통해 언어가 비즈니스의 걸림돌이 되지 않도록 합니다. <span className="notranslate" translate="no">KLICK</span>은 결제를
                  대행하거나 거래 당사자로 참여하지 않으며, 실제 협상과 대금 결제는 바이어와 셀러가 직접 진행합니다.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">What <Klick /> Does — and Doesn&apos;t — Do</h2>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  <Klick />&apos;s role is to connect buyers and sellers: product listings, RFQ sourcing requests, and
                  real-time translated chat so language is never a barrier to doing business. <Klick /> does not process
                  payments or act as a party to any transaction — buyers and sellers negotiate and settle deals
                  directly with each other.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 notranslate break-keep" translate="no">
            {isKo ? '회사 정보' : 'Company Information'}
          </h2>
          <div className="text-xs text-slate-600 space-y-2 notranslate break-keep" translate="no">
            <p className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> <Klick /></p>
            <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> 16, Sure-ro 116beon-gil, Wabu-eup, Namyangju-si, Gyeonggi-do, South Korea</p>
            <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> +82-507-1345-2432</p>
            <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> info@klick.biz</p>
            <p className="pt-1 text-[11px] text-slate-400">
              {isKo ? '사업자등록번호 829-32-00630 · 통신판매업신고번호 2025-WABUJOAN-0341' : 'Business Registration No. 829-32-00630 · E-Commerce Registration No. 2025-WABUJOAN-0341'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
