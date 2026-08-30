// app/page.jsx
// 홈 화면 전용 메타데이터를 위한 얇은 서버 래퍼 — 실제 로직은 HomeClient('use client')에 그대로 있음
import HomeClient from './HomeClient';

const title = 'KLICK | Global B2B Export Platform for Korean Manufacturers';
const description = 'Connect directly with verified South Korean manufacturers. Browse export products, request quotes, and chat with sellers in real time — zero middleman markup.';

export const metadata = {
  title,
  description,
  keywords: ['한국제조업', '수출', '무역', '셀러', '제조기업', '바이어찾기', 'B2B 수출 플랫폼', 'Korean manufacturers', 'B2B export platform'],
  alternates: { canonical: '/' },
  openGraph: { title, description, url: '/' }
};

export default function HomePage() {
  return (
    <>
      <HomeClient />

      {/* 서버에서 바로 렌더링되는 한글 SEO 소개문 — 홈 화면 본문은 클라이언트 컴포넌트라
          네이버 크롤러가 자바스크립트를 실행하지 못하면 놓칠 수 있어, 검색 키워드가
          포함된 문장을 여기 별도로 둔다. */}
      <section className="bg-white border-t border-slate-100 py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-slate-500 leading-relaxed text-center">
            KLICK(클릭)은 한국 제조기업과 해외 바이어를 연결하는 B2B 수출·무역 플랫폼입니다. 검증된 한국제조업 셀러의 상품을 카테고리별로 둘러보고, 견적을 요청하고, 실시간 채팅으로 바이어를 찾아보세요. 한국 제조기업의 우수한 제품을 전 세계 바이어에게 알리는 가장 빠른 방법, KLICK에서 시작하세요.
          </p>
        </div>
      </section>
    </>
  );
}
