// components/chat/TradeDocModal.jsx
'use client';

import { useState } from 'react';
import { Printer, X, CheckCheck, Loader2 } from 'lucide-react';

export default function TradeDocModal({ isOpen, onClose, msg, room }) {
  const [selectedDocType, setSelectedDocType] = useState('PI'); // 'PI', 'CI', 'PL'
  const [pdfDownloading, setPdfDownloading] = useState(false);

  if (!isOpen || !msg || !room) return null;

  const handleGenerateTradeDoc = async () => {
    setPdfDownloading(true);

    try {
      const response = await fetch('/api/pdf/trade-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: selectedDocType, // 'PI', 'CI', 'PL'
          itemTitle: room.product_title,
          sellerCompany: room.seller_name,
          buyerCompany: room.buyer_name,
          quantity: msg.quote_moq ? parseInt(msg.quote_moq) : 500,
          unitPrice: msg.quote_price ? parseFloat(msg.quote_price.split(' ')[0]) : 145.00,
        }),
      });

      const htmlContent = await response.text();

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
      }
      onClose();
    } catch (error) {
      console.error('Failed to generate trade document:', error);
      alert('Failed to generate official trade document.');
    } finally {
      setPdfDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6 animate-fadeIn">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" />
              Generate Trade Document
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Select the official B2B trade document type to issue.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">Select Document Type:</label>
          
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSelectedDocType('PI')}
              className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                selectedDocType === 'PI'
                  ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div>
                <span className="font-extrabold text-xs block text-slate-900">Proforma Invoice (PI)</span>
                <span className="text-[10px] text-slate-500">Official preliminary quotation before payment</span>
              </div>
              {selectedDocType === 'PI' && <CheckCheck className="w-4 h-4 text-blue-600" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedDocType('CI')}
              className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                selectedDocType === 'CI'
                  ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div>
                <span className="font-extrabold text-xs block text-slate-900">Commercial Invoice (CI)</span>
                <span className="text-[10px] text-slate-500">Final bill of sale for customs clearance & shipping</span>
              </div>
              {selectedDocType === 'CI' && <CheckCheck className="w-4 h-4 text-blue-600" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedDocType('PL')}
              className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                selectedDocType === 'PL'
                  ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div>
                <span className="font-extrabold text-xs block text-slate-900">Packing List (PL)</span>
                <span className="text-[10px] text-slate-500">Package dimensions, gross/net weight specification</span>
              </div>
              {selectedDocType === 'PL' && <CheckCheck className="w-4 h-4 text-blue-600" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGenerateTradeDoc}
            disabled={pdfDownloading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {pdfDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            <span>Generate {selectedDocType} Document</span>
          </button>
        </div>
      </div>
    </div>
  );
}