// app/factories/page.jsx
// 팩토리 디렉토리 전용 메타데이터를 위한 얇은 서버 래퍼 — 실제 로직은 FactoriesClient('use client')에 그대로 있음
import FactoriesClient from './FactoriesClient';

export const metadata = {
  title: 'Verified Korean Factories & Manufacturers',
  description: 'Explore verified Korean manufacturing companies on KLICK — direct manufacturers, business type, location, and certifications.',
  alternates: { canonical: '/factories' }
};

export default function FactoriesPage() {
  return <FactoriesClient />;
}
