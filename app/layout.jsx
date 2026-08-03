// app/layout.jsx
import './globals.css';

export const metadata = {
  title: 'KLICK - Global B2B Export Platform',
  description: '대한민국 제조업 전용 글로벌 B2B 수출 플랫폼',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}