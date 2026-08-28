// lib/productTitle.js
// 상품명은 항상 영문을 먼저, 그 뒤에 셀러가 입력한 한글명을 슬래시로 붙여서 보여준다.
// 예: "High-Pressure Hydraulic Valve / 고압 유압 밸브"
export function formatProductTitle(product) {
  const en = (product?.title_en || '').trim();
  const ko = (product?.title_ko || '').trim();
  const fallback = (product?.title || product?.product_name || '').trim();

  if (en && ko && en !== ko) return `${en} / ${ko}`;
  return en || ko || fallback || 'Export Product';
}
