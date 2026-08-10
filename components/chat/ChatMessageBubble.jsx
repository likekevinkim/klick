// components/chat/ChatMessageBubble.jsx
'use client';

import { DollarSign, CheckCheck, Printer, CreditCard, Download, FileCheck, Globe } from 'lucide-react';

export default function ChatMessageBubble({ msg, room, userRole, onOpenDocModal, onOpenPaymentModal }) {
  const isMyMsg = msg.sender_role === userRole;

  return (
    <div className={`flex flex-col ${isMyMsg ? 'items-end' : 'items-start'}`}>
      <span className="text-[10px] text-slate-400 font-semibold mb-1">
        {msg.sender_role === 'seller' ? 'Korean Seller' : 'Global Buyer'} • {msg.created_at}
      </span>

      {msg.is_quote ? (
        <div className="max-w-md w-full bg-slate-900 text-white p-5 rounded-2xl shadow-lg space-y-4 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1">
              <DollarSign className="w-4 h-4" /> Official Wholesale Quotation
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Offer
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800 p-2.5 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Price per Unit</span>
              <span className="font-extrabold text-emerald-400 text-sm">{msg.quote_price}</span>
            </div>
            <div className="bg-slate-800 p-2.5 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Minimum MOQ</span>
              <span className="font-bold text-slate-200 text-sm">{msg.quote_moq}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {msg.message}
          </p>

          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOpenDocModal(msg, room)}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Trade Docs (PI/CI/PL)</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenPaymentModal(msg, room)}
              className="py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pay / Checkout</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed shadow-sm space-y-2 ${
            isMyMsg
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
          }`}
        >
          {msg.message && <p className="font-semibold text-sm">{msg.message}</p>}

          {msg.file && (
            <div className="pt-1">
              {msg.file.type === 'image' ? (
                <div className="space-y-1.5">
                  <div className="rounded-xl overflow-hidden border border-black/10 bg-black/5 max-h-56">
                    <img
                      src={msg.file.url}
                      alt={msg.file.name}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                      onClick={() => window.open(msg.file.url, '_blank')}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] opacity-90">
                    <span className="font-bold truncate">{msg.file.name} ({msg.file.size})</span>
                    <a href={msg.file.url} download target="_blank" rel="noreferrer" className="p-1 hover:bg-black/10 rounded">
                      <Download className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <a
                  href={msg.file.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isMyMsg
                      ? 'bg-blue-700/80 hover:bg-blue-700 border-blue-500 text-white'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${isMyMsg ? 'bg-blue-800 text-blue-200' : 'bg-blue-50 text-blue-600'}`}>
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs block truncate max-w-[180px]">
                        {msg.file.name}
                      </span>
                      <span className={`text-[10px] ${isMyMsg ? 'text-blue-200' : 'text-slate-400'}`}>
                        {msg.file.size} • Verified B2B Document
                      </span>
                    </div>
                  </div>

                  <Download className="w-3.5 h-3.5 opacity-80" />
                </a>
              )}
            </div>
          )}

          {msg.translated_message && (
            <div
              className={`pt-2 border-t text-[11px] flex items-start gap-1.5 ${
                isMyMsg ? 'border-blue-500 text-blue-100' : 'border-slate-200 text-slate-600'
              }`}
            >
              <Globe className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{msg.translated_message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}