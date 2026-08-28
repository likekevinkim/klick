// app/terms/page.jsx
import Header from '@/components/Header';
import Klick, { protectKlick } from '@/components/Klick';
import { FileText, AlertTriangle } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Article 1 (Purpose)',
    body: `These Terms of Service ("Terms") govern the rights, obligations, and responsibilities between the operator of the KLICK platform ("Company," "we") and users of the KLICK platform ("KLICK," the "Service") in connection with the use of the Service.`,
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

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 md:p-6 space-y-2">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <h2 className="text-sm font-extrabold">통신판매중개자 고지 (전자상거래 등에서의 소비자보호에 관한 법률 제20조의2)</h2>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            <Klick />(이하 &quot;회사&quot;)은 통신판매의 당사자가 아닌 <strong>통신판매중개자</strong>로서, 셀러(판매자)와 바이어(구매자)가 서로를 찾고 정보를 교환할 수 있도록 상품 정보 게시, 견적 요청(RFQ), 실시간 번역 채팅 기능을 제공할 뿐입니다. 회사는 셀러가 등록한 상품 정보의 정확성, 거래조건, 대금 결제, 배송, 계약 이행 등에 대해 책임을 지지 않으며, 실제 거래는 플랫폼 밖에서 셀러와 바이어 당사자 간에 직접 이루어집니다. 거래 관련 분쟁이 발생한 경우 원칙적으로 당사자 간 해결을 원칙으로 하며, 회사는 관련 법령이 정한 범위 내에서만 협조합니다.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {SECTIONS.map((section) => (
            <div key={section.title} className="p-6 md:p-8 space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900">{section.title}</h2>
              <p className="text-xs text-slate-600 leading-relaxed">{protectKlick(section.body)}</p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          Questions about these Terms? Contact us at info@klick.biz.
        </p>
      </main>
    </div>
  );
}
