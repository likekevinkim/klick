// app/terms/page.jsx
import Header from '@/components/Header';
import { FileText } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Article 1 (Purpose)',
    body: `These Terms of Service ("Terms") govern the rights, obligations, and responsibilities between TRUE K CO., LTD. ("Company," "we") and users of the KLICK platform ("KLICK," the "Service") in connection with the use of the Service.`,
  },
  {
    title: 'Article 2 (Definitions)',
    body: `"Service" means the B2B platform operated by the Company that connects Korean manufacturers ("Sellers") with global buyers ("Buyers"). "Member" means a Seller or Buyer who has registered an account. "Listing" means product or sourcing-request information posted by a Member on the Service.`,
  },
  {
    title: 'Article 3 (Role of the Service)',
    body: `KLICK provides tools for Sellers and Buyers to find each other, exchange information, and communicate — including product listings, sourcing requests (RFQ), and real-time translated chat. KLICK is not a party to any transaction between a Seller and a Buyer, does not process payments on behalf of Members, and does not guarantee the accuracy of listings, the quality of products, or the performance of either party. Any agreement, payment, or delivery arranged between a Seller and a Buyer is solely between those parties.`,
  },
  {
    title: 'Article 4 (Membership Registration)',
    body: `Members must register using accurate, current information and select the correct account type (Seller or Buyer) for their role. Members are responsible for maintaining the confidentiality of their account credentials and for all activity under their account.`,
  },
  {
    title: 'Article 5 (Member Obligations)',
    body: `Members shall not: (1) post false, misleading, or infringing content; (2) impersonate another person or company; (3) use the Service for any unlawful purpose; (4) attempt to circumvent the Service's security or access controls; or (5) harass or abuse other Members through chat or other features of the Service.`,
  },
  {
    title: 'Article 6 (Intellectual Property)',
    body: `Members retain ownership of the content they submit (product descriptions, images, messages). By posting content, a Member grants the Company a license to display that content within the Service for the purpose of operating the platform. The KLICK name, logo, and platform software are the property of the Company.`,
  },
  {
    title: 'Article 7 (Limitation of Liability)',
    body: `The Company provides the Service on an "as is" basis and is not liable for damages arising from transactions, communications, or agreements between Members, or from the accuracy of translated messages. The Company is not liable for indirect, incidental, or consequential damages to the fullest extent permitted by law.`,
  },
  {
    title: 'Article 8 (Termination)',
    body: `The Company may suspend or terminate a Member's account for violation of these Terms. Members may close their account at any time by contacting the Company.`,
  },
  {
    title: 'Article 9 (Governing Law and Jurisdiction)',
    body: `These Terms are governed by the laws of the Republic of Korea. Any dispute arising from the Service shall be subject to the exclusive jurisdiction of the competent court having jurisdiction over the Company's headquarters, unless otherwise required by applicable law.`,
  },
  {
    title: 'Article 10 (Amendments)',
    body: `The Company may amend these Terms as needed, with notice posted on the Service prior to the effective date of the change. Continued use of the Service after amendments take effect constitutes acceptance of the revised Terms.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-3xl mx-auto px-6 mt-10 space-y-8">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <FileText className="w-3.5 h-3.5" /> Legal
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Terms of Service</h1>
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

        <p className="text-[11px] text-slate-400 text-center">
          Questions about these Terms? Contact us at truek.work@gmail.com.
        </p>
      </main>
    </div>
  );
}
