// app/layout.jsx
import './globals.css';
import Script from 'next/script';
import Footer from '@/components/Footer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://klick.biz';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'KLICK | Global B2B Export Platform for Korean Manufacturers',
    template: '%s | KLICK'
  },
  description: 'Connect directly with verified South Korean manufacturers. Browse export products, request quotes, and chat with sellers in real time — zero middleman markup.',
  keywords: ['Korean manufacturers', 'B2B export platform', '한국 제조업 수출', '해외 바이어', 'sourcing Korea', 'wholesale Korea'],
  openGraph: {
    type: 'website',
    siteName: 'KLICK',
    title: 'KLICK | Global B2B Export Platform for Korean Manufacturers',
    description: 'Connect directly with verified South Korean manufacturers. Browse export products, request quotes, and chat with sellers in real time.',
    url: SITE_URL
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KLICK | Global B2B Export Platform for Korean Manufacturers',
    description: 'Connect directly with verified South Korean manufacturers.'
  }
};

// Organization 구조화 데이터 — 검색엔진이 KLICK을 하나의 브랜드/기업 개체로 인식하게 도와줌
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'KLICK',
  url: SITE_URL,
  description: 'Global B2B export platform connecting verified South Korean manufacturers with international buyers.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />

        {/* Google Analytics (GA4) — 레이아웃 한 곳에만 넣으면 모든 페이지에 자동 적용됨 */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-ED6Q83590J" strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ED6Q83590J');
          `}
        </Script>
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-[#F9FAFB]">
        {/* 모든 페이지의 본문 내용이 렌더링되는 영역 */}
        <div className="flex-1">
          {children}
        </div>

        {/* 모든 페이지 하단에 공통으로 나타날 푸터 영역 */}
        <Footer />
      </body>
    </html>
  );
}