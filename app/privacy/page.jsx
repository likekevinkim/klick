// app/privacy/page.jsx
import Header from '@/components/Header';
import { ShieldCheck } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `We collect information you provide directly: account details (email, password), profile information (company name, contact person, country, business type), product listings, sourcing requests, and the content of chat messages and files exchanged through the Service. We do not collect payment information, as KLICK does not process payments.`,
  },
  {
    title: '2. How We Use Information',
    body: `We use collected information to operate the Service — creating and managing accounts, displaying product and company listings, connecting Buyers and Sellers, translating and delivering chat messages, and generating trade documents you request. We do not sell Member information to third parties.`,
  },
  {
    title: '3. Information Sharing',
    body: `Profile and listing information you make public (company name, product details) is visible to other Members and, where applicable, to the public pages of the Service. Chat messages are shared only with the counterparty in that conversation. We may disclose information where required by law.`,
  },
  {
    title: '4. Cookies and Translation',
    body: `The Service uses a Google Translate widget to let visitors browse the site in their preferred language; this sets a cookie to remember that preference. We do not use cookies for advertising or third-party tracking.`,
  },
  {
    title: '5. Data Retention',
    body: `We retain account and listing information for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us; some information may be retained where required for legal or accounting purposes.`,
  },
  {
    title: '6. Your Rights',
    body: `You may access, correct, or request deletion of your personal information by signing in and editing your profile, or by contacting our Privacy Officer below. You may also withdraw consent to data collection at any time, which may limit your ability to use certain features of the Service.`,
  },
  {
    title: '7. Security',
    body: `We use industry-standard measures, including encrypted connections and access controls, to protect Member information. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.`,
  },
  {
    title: "8. Children's Privacy",
    body: `The Service is intended for business use and is not directed at individuals under the age of 18. We do not knowingly collect information from minors.`,
  },
  {
    title: '9. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. Material changes will be announced on the Service prior to taking effect.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-3xl mx-auto px-6 mt-10 space-y-8">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <ShieldCheck className="w-3.5 h-3.5" /> Legal
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Privacy Policy</h1>
          <p className="text-xs text-slate-400">Effective Date: August 20, 2026</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {SECTIONS.map((section) => (
            <div key={section.title} className="p-6 md:p-8 space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900">{section.title}</h2>
              <p className="text-xs text-slate-600 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-xs text-slate-600 space-y-1">
          <p className="font-extrabold text-slate-900 text-sm">Privacy Officer</p>
          <p>Bo-an Kim · TRUE K CO., LTD.</p>
          <p>truek.work@gmail.com · +82-2-1234-5678</p>
        </div>
      </main>
    </div>
  );
}
