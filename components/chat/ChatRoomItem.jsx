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
  Handshake,
  XCircle,
  Truck,
  Sparkles,
  FileCheck,
  Loader2,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Helper to check if original and translated text are virtually identical
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
  onRespondToQuote,
  onDeleteRoom
}) {
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [respondedQuoteIds, setRespondedQuoteIds] = useState({});

  const cardRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const wasOpenRef = useRef(false);

  // Buyer RFQ Modal State in Chat
  const [isBuyerRfqModalOpen, setIsBuyerRfqModalOpen] = useState(false);
  const [isSubmittingRfq, setIsSubmittingRfq] = useState(false);
  const [rfqProductName, setRfqProductName] = useState('');
  const [rfqOrderQuantity, setRfqOrderQuantity] = useState(''); // 오더 예상 수량
  const [rfqPrice, setRfqPrice] = useState('');
  const [rfqDetails, setRfqDetails] = useState('');
  const [rfqAttachment, setRfqAttachment] = useState(null);
  const [uploadingRfqFile, setUploadingRfqFile] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const rfqFileInputRef = useRef(null);

  // Auto scroll to bottom only when a genuinely new message arrives (or the room
  // just opened) — scoped to the inner message box so it never drags the whole
  // page along with it. `messages` gets a brand-new array reference on every
  // translation refresh / chat_rooms realtime sync even when content is
  // unchanged (see fetchChatRoomsAndInit/refreshRoomTranslations in
  // app/chat/page.jsx); without the signature check those re-renders kept
  // snapping the view back down, making it impossible to scroll up and read
  // earlier messages.
  const lastMsgSignatureRef = useRef('');
  const wasOpenForScrollRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !messagesContainerRef.current) {
      wasOpenForScrollRef.current = false;
      return;
    }
    const last = messages[messages.length - 1];
    const signature = `${messages.length}:${last?.id ?? last?.created_at ?? ''}`;
    const justOpened = !wasOpenForScrollRef.current;
    const isNewMessage = signature !== lastMsgSignatureRef.current;
    lastMsgSignatureRef.current = signature;
    wasOpenForScrollRef.current = true;

    if (justOpened || isNewMessage || attachedFile) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen, attachedFile]);

  // When the accordion is first opened, bring the card's sticky header into view
  // once so both the header/controls and the message box start on-screen together.
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

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

  // RFQ Attachment Upload
  const handleRfqFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingRfqFile(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `rfq_drawing_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `rfq_drawings/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('company-images')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('company-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setRfqAttachment({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type: file.type.includes('image') ? 'image' : 'drawing',
          url: publicUrlData.publicUrl
        });
      }
    } catch (err) {
      console.error('RFQ file upload error:', err);
      alert('Failed to upload drawing/photo: ' + (err.message || 'Storage error'));
    } finally {
      setUploadingRfqFile(false);
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

  // Submit Buyer RFQ into Chat Stream
  const handleSendRfqInquiry = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingRfq(true);

      const rfqMsgText = `[Official RFQ Inquiry] Product: ${rfqProductName || 'Requested Item'} | Estimated Order Quantity: ${rfqOrderQuantity} | Target Price: ${rfqPrice}. Details: ${rfqDetails}`;

      onSendMessage(room.id, rfqMsgText, rfqAttachment);

      setIsBuyerRfqModalOpen(false);
      setRfqProductName('');
      setRfqOrderQuantity('');
      setRfqPrice('');
      setRfqDetails('');
      setRfqAttachment(null);
    } catch (err) {
      console.error('Failed to send RFQ inquiry in chat:', err);
    } finally {
      setIsSubmittingRfq(false);
    }
  };

  // Bind partner name correctly — prefer the live-looked-up company/contact name over
  // whatever was stored on the room at creation time (see fetchChatRoomsAndInit).
  const partnerName = userRole === 'seller'
    ? (room.buyer_profile_name || room.buyer_contact_person || room.buyer_name || 'Global Buyer')
    : (room.seller_profile_name || room.seller_name || room.company_name || 'Korean Manufacturer');

  const productName = room.product_title || room.title || '';

  // A deal only exists once the buyer has accepted a quote in this room —
  // gates the seller's shipping-update action so it isn't a standing button.
  const hasAcceptedOrder = messages.some(
    (m) => m.sender_role === 'buyer' && m.message?.startsWith('We accept this quotation')
  );

  return (
    <div ref={cardRef} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition hover:border-blue-400">
      <div className={isOpen ? 'sticky top-16 sm:top-[72px] z-30 bg-white rounded-t-3xl' : ''}>
      {/* 1. Accordion Header */}
      <div
        onClick={onToggle}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition select-none"
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this chat? This ends the conversation for both sides and cannot be undone.')) {
                onDeleteRoom?.(room.id);
              }
            }}
            title="Delete chat"
            className="p-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-xl text-slate-400 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button type="button" className="p-2 bg-slate-100 rounded-xl text-slate-600">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Top Control Bar — sticks together with the header above so who-you're-chatting-with and the quote/doc buttons stay visible while messages scroll */}
      {isOpen && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 pt-3 pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
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
                /* 바이어 전용: RFQ 요청 모달 팝업 오픈 버튼 */
                <button
                  type="button"
                  onClick={() => setIsBuyerRfqModalOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Send RFQ Inquiry (Attach Drawing)</span>
                </button>
              )}

              {userRole === 'seller' && hasAcceptedOrder && (
                <button
                  type="button"
                  onClick={() => onOpenSampleModal(room)}
                  className="px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Send Shipping Update</span>
                </button>
              )}
            </div>

            <span className="text-[10px] text-slate-400 font-bold">
              AI Real-time Multilingual Dual Translation Active
            </span>
          </div>
        </div>
      )}
      </div>

      {/* 2. Accordion Expanded Content — scrolls independently below the sticky header/controls */}
      {isOpen && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4 animate-fadeIn">
          {/* Message Thread */}
          <div ref={messagesContainerRef} className="max-h-[380px] overflow-y-auto space-y-3.5 pr-2 notranslate">
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
                            <span>Translated: {msg.translated_message}</span>
                          </div>
                        </div>
                      )}

                      {/* File Attachment */}
                      {msg.file && msg.file.type !== 'tracking' && (
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

                      {/* Shipping / Tracking Update Card — click to view details */}
                      {msg.file?.type === 'tracking' && (
                        <button
                          type="button"
                          onClick={() => onOpenSampleModal(room, msg)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 mt-1 w-full text-left cursor-pointer transition ${
                            isMine ? 'bg-blue-700/60 border-blue-500 hover:bg-blue-700/80' : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Truck className={`w-4 h-4 flex-shrink-0 ${isMine ? 'text-amber-300' : 'text-amber-600'}`} />
                            <div className="truncate">
                              <span className="font-extrabold block truncate">Shipment Update — {msg.file.courier}</span>
                              <span className="text-[9px] opacity-75">Tap to view tracking details</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-white text-slate-900 font-extrabold text-[10px] rounded-lg shadow flex-shrink-0">
                            View
                          </span>
                        </button>
                      )}

                      {/* Trade Document Card — click to view the sent PI/CI/PL/BL */}
                      {msg.file?.type === 'trade_doc' && (
                        <button
                          type="button"
                          onClick={() => onOpenDocModal(msg, room)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 mt-1 w-full text-left cursor-pointer transition ${
                            isMine ? 'bg-blue-700/60 border-blue-500 hover:bg-blue-700/80' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className={`w-4 h-4 flex-shrink-0 ${isMine ? 'text-blue-300' : 'text-blue-600'}`} />
                            <div className="truncate">
                              <span className="font-extrabold block truncate">{msg.file.docTitle} — {msg.file.invoiceNo}</span>
                              <span className="text-[9px] opacity-75">Tap to view document</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-white text-slate-900 font-extrabold text-[10px] rounded-lg shadow flex-shrink-0">
                            View
                          </span>
                        </button>
                      )}

                      {/* Official Quotation Card */}
                      {msg.is_quote && (
                        <div className="p-3.5 bg-[#0F172A] text-white rounded-xl border border-slate-800 space-y-2 mt-2">
                          <div className="flex items-center justify-between text-xs font-black text-emerald-400">
                            <span>Official FOB Quotation</span>
                            <span>{msg.quote_price}</span>
                          </div>
                          
                          {(msg.product_name || productName) && (
                            <div className="text-xs font-extrabold text-blue-300">
                              Product Name: {msg.product_name || productName}
                            </div>
                          )}

                          <div className="text-[10px] text-slate-400 font-bold">MOQ: {msg.quote_moq}</div>

                          <div className={`grid gap-2 pt-1 border-t border-slate-800 ${userRole === 'buyer' && !respondedQuoteIds[msg.id] ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            <button
                              type="button"
                              onClick={() => onOpenDocModal(msg, room)}
                              className="py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3 h-3 text-blue-400" />
                              <span>Trade Docs</span>
                            </button>

                            {userRole === 'buyer' ? (
                              respondedQuoteIds[msg.id] ? (
                                <div className={`py-1.5 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 ${
                                  respondedQuoteIds[msg.id] === 'accepted' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {respondedQuoteIds[msg.id] === 'accepted' ? 'Accepted' : 'Declined'}
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setRespondedQuoteIds((prev) => ({ ...prev, [msg.id]: 'accepted' }));
                                      await onRespondToQuote(msg, room, true);
                                      onOpenPaymentModal(msg, room);
                                    }}
                                    className="py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded-lg shadow transition flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Handshake className="w-3 h-3" />
                                    <span>Accept</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRespondedQuoteIds((prev) => ({ ...prev, [msg.id]: 'declined' }));
                                      onRespondToQuote(msg, room, false);
                                    }}
                                    className="py-1.5 bg-slate-800 hover:bg-rose-900 text-rose-300 font-extrabold text-[10px] rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>Decline</span>
                                  </button>
                                </>
                              )
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenDocModal(msg, room)}
                                className="py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-lg shadow transition flex items-center justify-center gap-1 cursor-pointer"
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

            <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2">
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
                className="shrink-0 p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl transition cursor-pointer border border-slate-200"
                title="Attach Document / Spec Sheet"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="shrink-0 p-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 rounded-xl transition cursor-pointer border border-slate-200"
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
                className="flex-1 min-w-0 px-3 sm:px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
              />

              <button
                type="submit"
                disabled={(!inputText.trim() && !attachedFile) || uploadingFile}
                className="shrink-0 px-3 sm:px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <span className="hidden sm:inline">Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 바이어 전용: RFQ 요청 제출 모달 */}
      {isBuyerRfqModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Send RFQ Inquiry to Manufacturer
              </h3>
              <button
                type="button"
                onClick={() => setIsBuyerRfqModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRfqInquiry} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Product Name (Required)</label>
                <input
                  type="text"
                  value={rfqProductName}
                  onChange={(e) => setRfqProductName(e.target.value)}
                  placeholder=""
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">Estimated Order Quantity</label>
                  <input
                    type="text"
                    value={rfqOrderQuantity}
                    onChange={(e) => setRfqOrderQuantity(e.target.value)}
                    placeholder=""
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">Target FOB Price Range</label>
                  <input
                    type="text"
                    value={rfqPrice}
                    onChange={(e) => setRfqPrice(e.target.value)}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* 제품 사진 및 CAD/블루프린트 도면 첨부 파일 업로더 */}
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Attach Product Drawing or Photo</label>
                <input
                  type="file"
                  ref={rfqFileInputRef}
                  onChange={handleRfqFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.cad,.dwg"
                  className="hidden"
                />

                {rfqAttachment ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      {rfqAttachment.type === 'image' ? <ImageIcon className="w-4 h-4 text-emerald-600" /> : <Paperclip className="w-4 h-4 text-blue-600" />}
                      <span className="font-extrabold text-blue-900 truncate max-w-[200px]">{rfqAttachment.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRfqAttachment(null)}
                      className="text-rose-600 hover:underline text-[10px] font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={uploadingRfqFile}
                    onClick={() => rfqFileInputRef.current?.click()}
                    className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-600 font-bold transition cursor-pointer"
                  >
                    {uploadingRfqFile ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <>
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <span>Upload CAD Drawing / Photo</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">Detailed Sourcing Requirements</label>
                <textarea
                  rows={3}
                  value={rfqDetails}
                  onChange={(e) => setRfqDetails(e.target.value)}
                  placeholder=""
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBuyerRfqModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRfq || uploadingRfqFile}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRfq ? 'Submitting...' : 'Send RFQ Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}