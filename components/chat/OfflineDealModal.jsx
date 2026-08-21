// components/chat/OfflineDealModal.jsx
'use client';

import { X, Handshake, ShieldAlert, MessageSquareText } from 'lucide-react';

export default function OfflineDealModal({ isOpen, onClose, quoteData }) {
  if (!isOpen) return null;

  // ponytail: only ever show a price we actually parsed from the quote — a guessed
  // fallback here would look like a real agreed amount and could get wired to.
  const rawAmount = quoteData?.amount;
  const parsedAmount = Number(String(rawAmount ?? '').replace(/[^0-9.]/g, ''));
  const itemAmount = rawAmount && Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount.toFixed(2) : '';
  const itemTitle = quoteData?.title || 'this order';
  const sellerCompany = quoteData?.sellerCompany || 'the seller';

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn">
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2">
            <Handshake className="w-5 h-5 text-emerald-400" />
            Deal Confirmed in Chat
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Order</span>
            <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">{itemTitle}</h4>
            <p className="text-[11px] text-slate-500">Counterparty: {sellerCompany}</p>
            {itemAmount && (
              <p className="text-[11px] text-slate-500">Agreed price: <span className="font-bold text-slate-800">${itemAmount} USD</span></p>
            )}
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              KLICK does not process payments on the platform yet. Please finalize payment (e.g. bank wire transfer)
              and the formal contract directly with your counterparty, outside of KLICK.
            </p>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
            <MessageSquareText className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" />
            <span>
              Use the <strong>Trade Docs</strong> button to generate a Proforma Invoice for reference, and always
              verify your counterparty's banking details independently before sending any funds.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
