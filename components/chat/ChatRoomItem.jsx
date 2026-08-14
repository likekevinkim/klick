// components/chat/ChatRoomItem.jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  X, 
  CreditCard, 
  Truck,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const isSameText = (str1, str2) => {
  if (!str1 || !str2) return true;
  const clean1 = str1.replace(/[\s\p{P}]/gu, '').toLowerCase();
  const clean2 = str2.replace(/[\s\p{P}]/gu, '').toLowerCase();
  return clean1 === clean2;
};

export default function ChatRoomItem({
  room,
  isOpen,
  userRole,
  messages,
  targetLang = 'en',
  onToggle,
  onOpenQuoteModal,
  onOpenDocModal,
  onOpenPaymentModal,
  onOpenSampleModal,
  onSendMessage,
  messagesEndRef
}) {
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, attachedFile]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `chat_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `chat_files/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('company-images')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('company-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setAttachedFile({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type: file.type.includes('image') ? 'image' : 'document',
          url: publicUrlData.publicUrl
        });
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('File upload failed: ' + (err.message || 'Storage connection error'));
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    onSendMessage(room.id, inputText.trim(), attachedFile);
    setInputText('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent.isComposing) {
        return;
      }
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // 바이어 프로필 담당자 이름(Kevin) 바인딩
  const partnerName = userRole === 'seller' 
    ? (room.buyer_profile_name || room.buyer_contact_person || room.buyer_name || 'Global Buyer') 
    : (room.seller_name || room.company_name || 'Korean Manufacturer');

  const productName = room.product_title || room.title || 'High Precision Industrial Component';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition hover:border-blue-400">
      {/* 1. Accordion Header */}
      <div
        onClick={onToggle}
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition select-none"
      >
        <div className="space-y-1 flex-1 pr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {partnerName}
            </span>

            {room.unread_count > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
                {room.unread_count} New
              </span>
            )}
          </div>

          <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1">
            Direct Trade Channel with {partnerName}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
            {room.updated_at ? new Date(room.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now'}
          </span>
          <button type="button" className="p-2 bg-slate-100 rounded-xl text-slate-600">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Accordion Expanded Content */}
      {isOpen && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              {/* 셀러와 바이어 컨트롤 버튼 역할 분리 */}
              {userRole === 'seller' ? (
                <>
                  <button
                    type="button"
                    onClick={onOpenQuoteModal}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Send Official Quotation</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenDocModal(null, room)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Generate Trade Docs (PI / PL / BL)</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onSendMessage(room.id, "[RFQ Request] Please provide the official Proforma Invoice (PI) and FOB pricing.", null)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Send RFQ Inquiry</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenSampleModal(room)}
                className="px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span>Product Tracking</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-400 font-bold">
              AI Real-time Multilingual Dual Translation Active
            </span>
          </div>

          {/* Message Thread */}
          <div className="max-h-[380px] overflow-y-auto space-y-3.5 pr-2 notranslate">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">
                No messages yet. Send a message to start trading!
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMine = msg.sender_role === userRole;

                const showTranslation = 
                  msg.translated_message && 
                  msg.translated_message.trim() !== '' && 
                  !isSameText(msg.message, msg.translated_message);

                return (
                  <div
                    key={msg.id || index}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold px-1">
                      <span>{isMine ? 'You' : partnerName}</span>
                      <span>•</span>
                      <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[75%] space-y-2 text-xs shadow-sm notranslate ${
                        isMine
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                      }`}
                    >
                      {/* Original Message */}
                      {msg.message && (
                        <p className="leading-relaxed font-semibold whitespace-pre-wrap notranslate">{msg.message}</p>
                      )}

                      {/* AI Translate Line */}
                      {showTranslation && (
                        <div className={`pt-2 border-t text-[11px] font-bold space-y-0.5 notranslate ${
                          isMine ? 'border-blue-400/50 text-blue-100' : 'border-slate-100 text-blue-600'
                        }`}>
                          <div className="flex items-center gap-1 text-[10px] font-extrabold">
                            <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span>[ AI translate : {msg.translated_message} ]</span>
                          </div>
                        </div>
                      )}

                      {/* File Attachment */}
                      {msg.file && (
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 mt-1 ${isMine ? 'bg-blue-700/60 border-blue-500' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center gap-2 truncate">
                            {msg.file.type === 'image' ? (
                              <ImageIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-amber-300 flex-shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="font-extrabold block truncate">{msg.file.name}</span>
                              <span className="text-[9px] opacity-75">{msg.file.size}</span>
                            </div>
                          </div>

                          <a
                            href={msg.file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-white text-slate-900 font-extrabold text-[10px] rounded-lg shadow transition hover:bg-slate-100 cursor-pointer flex-shrink-0"
                          >
                            View
                          </a>
                        </div>
                      )}

                      {/* Official Quotation Card (품명 정밀 연동) */}
                      {msg.is_quote && (
                        <div className="p-3.5 bg-[#0F172A] text-white rounded-xl border border-slate-800 space-y-2 mt-2">
                          <div className="flex items-center justify-between text-xs font-black text-emerald-400">
                            <span>Official FOB Quotation</span>
                            <span>{msg.quote_price}</span>
                          </div>
                          
                          {/* 품명(Product Name) 명시 */}
                          <div className="text-xs font-extrabold text-blue-300">
                            Product Name: {msg.product_name || productName}
                          </div>

                          <div className="text-[10px] text-slate-400 font-bold">MOQ: {msg.quote_moq}</div>

                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => onOpenDocModal(msg, room)}
                              className="py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3 h-3 text-blue-400" />
                              <span>Trade Docs (PI/CI/BL)</span>
                            </button>

                            {userRole === 'buyer' ? (
                              <button
                                type="button"
                                onClick={() => onOpenPaymentModal(msg, room)}
                                className="py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded-lg shadow transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Pay Escrow</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenDocModal(msg, room)}
                                className="py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] rounded-lg shadow transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span>Edit Order Specs</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {msg.is_quote && (
                      <button
                        type="button"
                        onClick={() => onOpenDocModal(msg, room)}
                        className="text-[10px] font-extrabold text-blue-600 hover:underline flex items-center gap-1 px-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>View Official Trade Document (PI/PL/BL)</span>
                      </button>
                    )}

                    <span className="text-[9px] text-slate-400 px-1">
                      {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-sm pt-2">
            {attachedFile && (
              <div className="px-3.5 py-1.5 bg-blue-50 border border-blue-100 flex items-center justify-between text-xs rounded-xl">
                <div className="flex items-center gap-2 text-blue-900 font-bold">
                  {attachedFile.type === 'image' ? (
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span className="text-[10px]">Attached:</span>
                  <span className="font-extrabold text-blue-600 text-[10px] truncate max-w-[180px]">
                    {attachedFile.name} ({attachedFile.size})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="p-1 bg-white hover:bg-rose-50 text-slate-500 rounded-md transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                className="hidden"
              />
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl transition cursor-pointer border border-slate-200"
                title="Attach Document / Spec Sheet"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 rounded-xl transition cursor-pointer border border-slate-200"
                title="Attach Image / Catalog"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder=""
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
              />

              <button
                type="submit"
                disabled={(!inputText.trim() && !attachedFile) || uploadingFile}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}