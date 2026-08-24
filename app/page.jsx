// app/page.jsx
// 홈 화면 전용 메타데이터를 위한 얇은 서버 래퍼 — 실제 로직은 HomeClient('use client')에 그대로 있음
import HomeClient from './HomeClient';

export const metadata = {
  title: 'KLICK | Global B2B Export Platform for Korean Manufacturers',
  description: 'Browse export products from verified South Korean manufacturers, request quotes, and chat directly with sellers — zero middleman markup.',
  alternates: { canonical: '/' }
};

export default function HomePage() {
  return <HomeClient />;
}
