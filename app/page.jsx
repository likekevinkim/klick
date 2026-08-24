// app/page.jsx
// 홈 화면 전용 메타데이터를 위한 얇은 서버 래퍼 — 실제 로직은 HomeClient('use client')에 그대로 있음
import HomeClient from './HomeClient';

const title = 'KLICK | 한국 제조업체와 해외 바이어를 연결하는 B2B 수출·무역 플랫폼';
const description = '한국 제조기업(셀러)과 해외 바이어를 실시간 채팅으로 연결하는 B2B 수출 플랫폼 KLICK. 검증된 한국 제조업체의 상품을 둘러보고, 견적을 요청하고, 바이어를 찾아보세요.';

export const metadata = {
  title,
  description,
  keywords: ['한국제조업', '수출', '무역', '셀러', '제조기업', '바이어찾기', 'B2B 수출 플랫폼', 'Korean manufacturers', 'B2B export platform'],
  alternates: { canonical: '/' },
  openGraph: { title, description, url: '/' }
};

export default function HomePage() {
  return <HomeClient />;
}
