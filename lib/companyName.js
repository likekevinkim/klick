// lib/companyName.js
// 회사명도 상품명과 동일하게 영문을 먼저, 그 뒤에 한글명을 슬래시로 붙여서 보여준다.
export function formatCompanyName(company) {
  const en = (company?.company_name_en || company?.company_name || '').trim();
  const ko = (company?.company_name_ko || '').trim();

  if (en && ko && en !== ko) return `${en} / ${ko}`;
  return en || ko || 'Korean Manufacturer';
}
