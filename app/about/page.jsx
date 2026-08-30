// app/about/page.jsx
import AboutClient from './AboutClient';

export const metadata = {
  title: 'About Us',
  description: 'Learn about KLICK — the B2B export platform connecting verified South Korean manufacturers with global buyers.',
  alternates: { canonical: '/about' }
};

export default function AboutPage() {
  return <AboutClient />;
}
