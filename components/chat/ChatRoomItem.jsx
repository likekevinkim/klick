// components/chat/ChatRoomItem.jsx
'use client';

import { User, Clock, ChevronDown, ChevronUp, MessageSquare, FileText } from 'lucide-react';
import ChatMessageBubble from './ChatMessageBubble';

export default function ChatRoomItem({ 
  room, 
  isOpen, 
  userRole, 
  messages, 
  onToggle, 
  onOpenQuoteModal, 
  onOpenDocModal, 
  onOpenPaymentModal, 
  messagesEndRef 
}) {
  const targetName = userRole === 'seller' ? room.buyer_name : room.seller_name;

  return (
    <div
      className={`bg-white rounded-3xl border transition overflow-hidden shadow-sm ${
        isOpen ? 'border-blue-600 ring-2 ring-blue-600/10' : 'border-slate-200 hover:border-blue-300'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-6 flex items-center justify-between gap-4 cursor-pointer bg-white hover:bg-slate-50/80 transition"
      >
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              {targetName}
            </span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              Inquiry Item
            </span>
          </div>

          <h3 className="text-xs md:text-sm font-extrabold text-slate-700">
            {room.product_title}
          </h3>

          <p className="text-xs text-slate-500 truncate pt-0.5">
            Last Message: <span className="font-medium text-slate-800">{room.last_message || 'No messages yet'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {room.updated_at}
          </span>

          <div className={`p-2 rounded-xl transition ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 bg-slate-50/50 flex flex-col">
          <div className="px-6 py-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              Direct Discussion Stream
            </span>

            {userRole === 'seller' && (
              <button
                onClick={onOpenQuoteModal}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Send Official Quote (RFQ)</span>
              </button>
            )}
          </div>

          <div className="p-6 space-y-4 max-h-[520px] overflow-y-auto bg-white">
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                msg={msg}
                room={room}
                userRole={userRole}
                onOpenDocModal={onOpenDocModal}
                onOpenPaymentModal={onOpenPaymentModal}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}