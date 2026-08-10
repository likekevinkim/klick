// app/chat/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import B2bPaymentModal from '@/components/B2bPaymentModal';
import Link from 'next/link';
import { 
  Send, 
  Building2, 
  Globe, 
  MessageSquare, 
  DollarSign, 
  Sparkles, 
  FileText,
  User,
  Clock,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Download,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  X,
  FileCheck,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RealtimeChatPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('seller');

  // 대화방 목록 및 선택 상태
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(1);
  const [roomMessagesMap, setRoomMessagesMap] = useState({});
  const [newMessage, setNewMessage] = useState('');

  // 첨부파일 관련 상태
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  // RFQ 견적서 작성 팝업 모달 상태
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quotePrice, setQuotePrice] = useState('145.00');
  const [quoteMoq, setQuoteMoq] = useState('500 Units');
  const [quoteNote, setQuoteNote] = useState('Includes FOB shipping to Incheon Port. Lead time 14 days.');

  // 무역 서류(PI/CI/PL) 다운로드 모달 상태
  const [isDocModalOpen, setIsQuoteDocModalOpen] = useState(false);
  const [selectedMsgForDoc, setSelectedMsgForDoc] = useState(null);
  const [selectedRoomForDoc, setSelectedRoomForDoc] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState('PI'); // 'PI', 'CI', 'PL'

  // 결제 모달 상태
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentQuoteData, setPaymentQuoteData] = useState(null);

  // PDF 다운로드 로딩 상태
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // DOM 참조
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    initChatSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessagesMap, activeRoomId, attachedFile]);

  const initChatSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const role = session.user.user_metadata?.role || 'seller';
      setUserRole(role);
      fetchChatRooms(session.user.id);
    } else {
      initMockMultiRooms();
    }
  };

  const initMockMultiRooms = () => {
    const mockRooms = [
      {
        id: 1,
        product_title: 'Precision Hydraulic Control Valve HV-300',
        buyer_name: 'John Smith (US Sourcing LLC)',
        seller_name: 'Hankook Precision Co., Ltd.',
        last_message: 'Can you send us a formal FOB quote for 500 units?',
        updated_at: '10:24 AM',
      },
      {
        id: 2,
        product_title: 'Organic K-Beauty Repair Serum 50ml',
        buyer_name: 'Elena Rostova (Euro Cosmetics Import)',
        seller_name: 'Hankook Precision Co., Ltd.',
        last_message: 'Is OEM private labeling available for this serum?',
        updated_at: 'Yesterday',
      }
    ];

    const initialMessages = {
      1: [
        {
          id: 101,
          room_id: 1,
          sender_role: 'buyer',
          message: 'Hello! We are interested in ordering 500 units of HV-300. Can you send us a formal FOB quote?',
          translated_message: '안녕하세요! HV-300 모델 500개 주문에 관심이 있습니다. 공식 FOB 견적서를 보내주실 수 있나요?',
          is_quote: false,
          file: null,
          created_at: '10:20 AM',
        },
        {
          id: 102,
          room_id: 1,
          sender_role: 'seller',
          message: 'Hello Mr. Smith! Thank you for your inquiry. Here is our official catalog and specification.',
          translated_message: '안녕하세요 스미스님! 문의해주셔서 감사합니다. 공식 카탈로그와 스펙 문서를 전달드립니다.',
          is_quote: false,
          file: {
            name: 'Hankook_Precision_Catalog_2026.pdf',
            size: '3.4 MB',
            type: 'pdf',
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          },
          created_at: '10:22 AM',
        },
        {
          id: 103,
          room_id: 1,
          sender_role: 'seller',
          message: 'Here is our official quotation for 500 units.',
          translated_message: '500개 기준 공식 견적서를 전달드립니다.',
          is_quote: true,
          quote_price: '145.00 USD / Unit',
          quote_moq: '500 Units',
          file: null,
          created_at: '10:24 AM',
        }
      ],
      2: [
        {
          id: 201,
          room_id: 2,
          sender_role: 'buyer',
          message: 'Is OEM private labeling available for this serum? We need custom packaging.',
          translated_message: '이 세럼 제품에 대해 OEM 자사 브랜드 라벨링이 가능한가요? 맞춤형 패키징이 필요합니다.',
          is_quote: false,
          file: null,
          created_at: 'Yesterday',
        }
      ]
    };

    setRooms(mockRooms);
    setActiveRoomId(1);
    setRoomMessagesMap(initialMessages);
  };

  const fetchChatRooms = async (userId) => {
    try {
      const { data } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('updated_at', { ascending: false });

      if (data && data.length > 0) {
        setRooms(data);
        setActiveRoomId(data[0].id);
        fetchMessagesForRooms(data);
      } else {
        initMockMultiRooms();
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      initMockMultiRooms();
    }
  };

  const fetchMessagesForRooms = async (roomList) => {
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (data) {
        const map = {};
        data.forEach((msg) => {
          if (!map[msg.room_id]) map[msg.room_id] = [];
          map[msg.room_id].push(msg);
        });
        setRoomMessagesMap(map);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  // 문서 파일 선택 처리
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type.includes('pdf')
      ? 'pdf'
      : file.type.includes('sheet') || file.type.includes('excel')
      ? 'excel'
      : 'document';

    setAttachedFile({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: fileType,
      url: URL.createObjectURL(file),
      fileObject: file,
    });
  };

  // 이미지 파일 선택 처리
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFile({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: 'image',
      url: URL.createObjectURL(file),
      fileObject: file,
    });
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // 메시지 및 첨부파일 발송 핸들러
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachedFile) return;

    setUploading(true);

    const currentText = newMessage.trim();
    let autoTranslation = '';

    if (currentText) {
      if (/[ㄱ-ㅎ|가-힣]/.test(currentText)) {
        autoTranslation = `[AI Trans] ${currentText}`;
      } else {
        autoTranslation = `[AI 번역] ${currentText}`;
      }
    }

    let finalFilePayload = null;
    if (attachedFile) {
      finalFilePayload = {
        name: attachedFile.name,
        size: attachedFile.size,
        type: attachedFile.type,
        url: attachedFile.url,
      };
    }

    const newMsgObj = {
      id: Date.now(),
      room_id: activeRoomId,
      sender_id: user?.id || null,
      sender_role: userRole,
      message: currentText,
      translated_message: autoTranslation,
      is_quote: false,
      file: finalFilePayload,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setRoomMessagesMap((prevMap) => ({
      ...prevMap,
      [activeRoomId]: [...(prevMap[activeRoomId] || []), newMsgObj],
    }));

    setRooms((prevRooms) =>
      prevRooms.map((r) =>
        r.id === activeRoomId ? { ...r, last_message: currentText || attachedFile.name, updated_at: 'Just now' } : r
      )
    );

    setNewMessage('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    setUploading(false);

    try {
      if (user) {
        await supabase.from('chat_messages').insert([newMsgObj]);
      }
    } catch (err) {
      console.error('DB Insert error:', err);
    }
  };

  // RFQ 견적서 전송
  const handleSendQuote = async () => {
    if (!activeRoomId) return;

    const quoteMsgObj = {
      id: Date.now(),
      room_id: activeRoomId,
      sender_id: user?.id || null,
      sender_role: 'seller',
      message: `[Official B2B Quote Sent] ${quoteNote}`,
      translated_message: `[공식 B2B 견적서 발송] ${quoteNote}`,
      is_quote: true,
      quote_price: `${quotePrice} USD / Unit`,
      quote_moq: quoteMoq,
      file: null,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setRoomMessagesMap((prevMap) => ({
      ...prevMap,
      [activeRoomId]: [...(prevMap[activeRoomId] || []), quoteMsgObj],
    }));

    setIsQuoteModalOpen(false);

    try {
      if (user) {
        await supabase.from('chat_messages').insert([quoteMsgObj]);
      }
    } catch (err) {
      console.error('DB Quote Insert error:', err);
    }
  };

  // 무역 서류(PI, CI, PL) 팝업 열기
  const handleOpenDocModal = (msg, room) => {
    setSelectedMsgForDoc(msg);
    setSelectedRoomForDoc(room);
    setIsQuoteDocModalOpen(true);
  };

  // 선택한 무역 서류 3종 (PI / CI / PL) 생성 및 인쇄/다운로드
  const handleGenerateTradeDoc = async () => {
    if (!selectedMsgForDoc || !selectedRoomForDoc) return;

    setPdfDownloading(true);

    try {
      const response = await fetch('/api/pdf/trade-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: selectedDocType, // 'PI', 'CI', 'PL'
          itemTitle: selectedRoomForDoc.product_title,
          sellerCompany: selectedRoomForDoc.seller_name,
          buyerCompany: selectedRoomForDoc.buyer_name,
          quantity: selectedMsgForDoc.quote_moq ? parseInt(selectedMsgForDoc.quote_moq) : 500,
          unitPrice: selectedMsgForDoc.quote_price ? parseFloat(selectedMsgForDoc.quote_price.split(' ')[0]) : 145.00,
        }),
      });

      const htmlContent = await response.text();

      // 새 창에서 국제 표준 무역 서류 즉시 호출
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
      }
      setIsQuoteDocModalOpen(false);
    } catch (error) {
      console.error('Failed to generate trade document:', error);
      alert('Failed to generate official trade document.');
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleOpenPaymentModal = (msg, room) => {
    setPaymentQuoteData({
      amount: msg.quote_price ? msg.quote_price.split(' ')[0] : '145.00',
      title: room.product_title,
      sellerCompany: room.seller_name,
    });
    setIsPaymentModalOpen(true);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 antialiased">
      <Header />

      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-6">
        <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              <Sparkles className="w-3.5 h-3.5" /> KLICK Direct Accordion Chat
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              Real-time AI Multilingual Chat & Trade Document Hub
            </h1>
            <p className="text-xs text-slate-400">
              Negotiate with global buyers and generate official trade documents (PI, Commercial Invoice, Packing List).
            </p>
          </div>

          <div className="text-xs text-slate-300 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
            Account Role: <span className="font-extrabold text-blue-400">{userRole === 'seller' ? 'Korean Seller' : 'Global Buyer'}</span>
          </div>
        </div>

        <div className="space-y-4">
          {rooms.map((room) => {
            const isOpen = activeRoomId === room.id;
            const targetName = userRole === 'seller' ? room.buyer_name : room.seller_name;
            const messages = roomMessagesMap[room.id] || [];

            return (
              <div
                key={room.id}
                className={`bg-white rounded-3xl border transition overflow-hidden shadow-sm ${
                  isOpen ? 'border-blue-600 ring-2 ring-blue-600/10' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <button
                  onClick={() => setActiveRoomId(isOpen ? null : room.id)}
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
                          onClick={() => setIsQuoteModalOpen(true)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Send Official Quote (RFQ)</span>
                        </button>
                      )}
                    </div>

                    <div className="p-6 space-y-4 max-h-[520px] overflow-y-auto bg-white">
                      {messages.map((msg) => {
                        const isMyMsg = msg.sender_role === userRole;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMyMsg ? 'items-end' : 'items-start'}`}
                          >
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

                                {/* 무역 서류 3종 (PI, CI, PL) 모달 및 결제 진입 버튼 */}
                                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDocModal(msg, room)}
                                    className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Trade Docs (PI/CI/PL)</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenPaymentModal(msg, room)}
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

                                {/* 파일/사진 첨부카드 렌더링 */}
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
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* 첨부 파일 사전 미리보기 바 */}
                    {attachedFile && (
                      <div className="px-6 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between text-xs animate-fadeIn">
                        <div className="flex items-center gap-2 text-blue-900 font-bold">
                          {attachedFile.type === 'image' ? (
                            <ImageIcon className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-600" />
                          )}
                          <span>Ready to attach:</span>
                          <span className="font-extrabold text-blue-600 truncate max-w-[200px]">
                            {attachedFile.name} ({attachedFile.size})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleRemoveAttachment}
                          className="p-1 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-lg border border-slate-200 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* 하단 입력 폼 및 파일/사진 첨부 아이콘 */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 flex items-center gap-2 bg-slate-50">
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
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl transition cursor-pointer border border-slate-200"
                        title="Attach Document / Quotation"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="p-2.5 bg-white hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 rounded-xl transition cursor-pointer border border-slate-200"
                        title="Attach Photos / Catalog"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>

                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message in your language (AI translates automatically)..."
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                      />

                      <button
                        type="submit"
                        disabled={uploading || (!newMessage.trim() && !attachedFile)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>Send</span>
                            <Send className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* 1. 셀러 RFQ 견적서 발송 모달 */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Create Official Wholesale Quote (RFQ)
              </h3>
              <p className="text-xs text-slate-500 mt-1">Please enter unit price, MOQ, and terms for the global buyer.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price ($ USD)</label>
                  <input
                    type="text"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    placeholder="145.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Order (MOQ)</label>
                  <input
                    type="text"
                    value={quoteMoq}
                    onChange={(e) => setQuoteMoq(e.target.value)}
                    placeholder="500 Units"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shipping Terms & Notes</label>
                <textarea
                  rows={3}
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsQuoteModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendQuote}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Send Quotation Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 무역 서류 3종 (PI, CI, PL) 선택 인쇄/다운로드 모달 */}
      {isDocModalOpen && selectedMsgForDoc && selectedRoomForDoc && (
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
                onClick={() => setIsQuoteDocModalOpen(false)}
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
                onClick={() => setIsQuoteDocModalOpen(false)}
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
      )}

      {/* 3. B2B 3가지 통합 결제 팝업 모달 */}
      <B2bPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        quoteData={paymentQuoteData}
      />
    </div>
  );
}