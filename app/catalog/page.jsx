// app/catalog/page.jsx
// 카탈로그 전용 메타데이터를 위한 얇은 서버 래퍼 — 실제 로직은 CatalogClient('use client')에 그대로 있음
import CatalogClient from './CatalogClient';

export const metadata = {
  title: 'Product Catalog',
  description: 'Browse every export product listed by verified Korean manufacturers on KLICK — search by keyword or filter by category.',
  alternates: { canonical: '/catalog' }
};

export default function ProductCatalogPage() {
  return <CatalogClient />;
}
