// app/privacy/page.jsx
import Header from '@/components/Header';
import { protectKlick } from '@/components/Klick';
import { ShieldCheck } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `We collect information you provide directly: account details (email, password), profile information (company name, contact person, country, business type), product listings, sourcing requests, and the content of chat messages and files exchanged through the Service. Sellers applying for Verified status must also submit a copy of their Korean business registration certificate (사업자등록증). Buyers who submit a product review may voluntarily include photos of the product received. We do not collect payment information, as KLICK does not process payments.`,
  },
  {
    title: '2. How We Use Information',
    body: `We use collected information to operate the Service — creating and managing accounts, displaying product and company listings, connecting Buyers and Sellers, translating and delivering chat messages, reviewing Seller business registration certificates to grant Verified status, and generating trade documents you request. We do not sell Member information to third parties.`,
  },
  {
    title: '3. Information Sharing',
    body: `Profile and listing information you make public (company name, product details) is visible to other Members and, where applicable, to the public pages of the Service. Product reviews you submit — including your display name and any photos you choose to upload — are publicly visible to all visitors of the Service, not only to registered Members; please avoid including personal information (such as an address label) in review photos. Chat messages are shared only with the counterparty in that conversation. We may disclose information where required by law.`,
  },
  {
    title: '4. International Data Transfers & Sub-processors',
    body: `To operate the Service we use the following sub-processors, which may store or process your information outside of Korea: Supabase (database and file storage), OpenAI (used to generate AI-assisted product descriptions from Seller-provided text), and Resend (used to deliver verification-code emails) — each based in, or storing data in, the United States. These providers are contractually restricted to processing your information only to provide the function described and may not use it for their own purposes. This notice is provided under Article 28-8 of the Personal Information Protection Act; to ask a question about a specific transfer or to object, contact our Privacy Officer below.`,
  },
  {
    title: '5. Cookies and Translation',
    body: `The Service uses a Google Translate widget to let visitors browse the site in their preferred language; this sets a cookie to remember that preference. We do not use cookies for advertising or third-party tracking.`,
  },
  {
    title: '6. Data Retention',
    body: `We retain account and listing information for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us; some information may be retained where required for legal or accounting purposes.`,
  },
  {
    title: '7. Your Rights',
    body: `You may access, correct, or request deletion of your personal information by signing in and editing your profile, or by contacting our Privacy Officer below. You may also withdraw consent to data collection at any time, which may limit your ability to use certain features of the Service. If you are located in the European Economic Area, you additionally have the right under the GDPR to access, correct, delete, or receive a copy of your personal data, and to object to or restrict certain processing; contact our Privacy Officer below to exercise these rights.`,
  },
  {
    title: '8. Security',
    body: `We use industry-standard measures, including encrypted connections and access controls, to protect Member information. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.`,
  },
  {
    title: "9. Children's Privacy",
    body: `The Service is intended for business use and is not directed at individuals under the age of 18. We do not knowingly collect information from minors.`,
  },
  {
    title: '10. Changes to This Policy',
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
              <p className="text-xs text-slate-600 leading-relaxed">{protectKlick(section.body)}</p>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-xs text-slate-600 space-y-1">
          <p className="font-extrabold text-slate-900 text-sm">Privacy Officer</p>
          <p>Bo-an Kim</p>
          <p>info@klick.biz · +82-2-1234-5678</p>
        </div>
      </main>
    </div>
  );
}
