// app/layout.jsx
import './globals.css';

export const metadata = {
  title: 'KLICK - Global B2B Trade Marketplace',
  description: 'Verified Korean Manufacturers Direct Trade Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}