// app/layout.jsx
import './globals.css';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'KLICK | Global B2B Export Platform',
  description: 'Connect directly with verified South Korean manufacturers. Zero middleman markup.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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