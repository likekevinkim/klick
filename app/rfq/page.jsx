// app/rfq/page.jsx
// 공개 RFQ 게시판 전용 메타데이터를 위한 얇은 서버 래퍼 — 실제 로직은 RfqBoardClient('use client')에 그대로 있음
import RfqBoardClient from './RfqBoardClient';

export const metadata = {
  title: 'Public RFQ Board — Request a Quote',
  description: 'Post a public sourcing request and get quotes from multiple verified Korean manufacturers on KLICK.',
  alternates: { canonical: '/rfq' }
};

export default function PublicRfqBoardPage() {
  return <RfqBoardClient />;
}
