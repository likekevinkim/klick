// components/chat/TradeDocModal.jsx
'use client';

import { useState } from 'react';
import { FileText, X, Printer, ShieldCheck } from 'lucide-react';

export default function TradeDocModal({ isOpen, onClose, msg, room }) {
  const [docType, setDocType] = useState('PI'); // PI, CI, PL, BL

  if (!isOpen) return null;

  const buyerDisplayName = room?.buyer_profile_name || room?.buyer_contact_person || room?.buyer_company_name || 'Global Buyer';
  const sellerCompany = room?.seller_name || room?.company_name || 'Korean Manufacturer Co., Ltd.';
  const productName = msg?.product_name || room?.product_title || room?.title || '';
  const price = msg?.quote_price || '';
  const orderQuantity = msg?.quote_moq || ''; // 오더 예상 수량 표출
  const docNumber = `KLICK-${Date.now().toString().substring(6)}`;
  const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-fadeIn">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-extrabold text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                Official B2B Trade Document Generator
              </h3>
              <p className="text-xs text-slate-400">Verified document ready for international export and customs clearance.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Type Switcher Tabs */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDocType('PI')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                docType === 'PI' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              Proforma Invoice (PI)
            </button>

            <button
              type="button"
              onClick={() => setDocType('CI')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                docType === 'CI' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              Commercial Invoice (CI)
            </button>

            <button
              type="button"
              onClick={() => setDocType('PL')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                docType === 'PL' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              Packing List (PL)
            </button>

            <button
              type="button"
              onClick={() => setDocType('BL')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                docType === 'BL' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              Bill of Lading (BL)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF Export</span>
            </button>
          </div>
        </div>

        {/* Trade Document Printable Sheet */}
        <div className="p-8 md:p-12 space-y-8 bg-white text-slate-900 notranslate" id="printable-trade-doc">
          
          {/* Sheet Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100 mb-2">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> KLICK Export Certified
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {docType === 'PI' && 'PROFORMA INVOICE'}
                {docType === 'CI' && 'COMMERCIAL INVOICE'}
                {docType === 'PL' && 'PACKING LIST'}
                {docType === 'BL' && 'BILL OF LADING (DRAFT)'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">Document No: <strong className="text-slate-900">{docNumber}</strong></p>
            </div>

            <div className="text-right text-xs space-y-1">
              <p className="font-extrabold text-slate-900">Date: {issueDate}</p>
            </div>
          </div>

          {/* Parties Info */}
          <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exporter / Seller</span>
              <p className="font-extrabold text-slate-900 text-sm">{sellerCompany}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Importer / Buyer (Contact Person)</span>
              <p className="font-extrabold text-slate-900 text-sm">{buyerDisplayName}</p>
            </div>
          </div>

          {/* Item Specs Table (Estimated Order Quantity 용어 교정) */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Item Specifications</h3>
            
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold">
                  <th className="p-3 rounded-l-xl">Product Name</th>
                  <th className="p-3">Order Quantity</th>
                  <th className="p-3 rounded-r-xl text-right">Unit Price / Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr>
                  <td className="p-3.5 font-extrabold text-slate-900">{productName}</td>
                  <td className="p-3.5 text-slate-800 font-bold">{orderQuantity}</td>
                  <td className="p-3.5 text-right font-extrabold text-blue-600">{price}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature Area */}
          <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs">
            <div className="space-y-1">
              <p className="text-slate-500">Authorized Signature</p>
              <p className="font-extrabold text-slate-900">{sellerCompany}</p>
            </div>

            <div className="w-48 h-16 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 font-bold text-[10px]">
              [ Official Seal ]
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer"
          >
            Close Document
          </button>
        </div>

      </div>
    </div>
  );
}