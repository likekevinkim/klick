// app/chat/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import B2bPaymentModal from '@/components/B2bPaymentModal';
import ChatRoomItem from '@/components/chat/ChatRoomItem';
import TradeDocModal from '@/components/chat/TradeDocModal';
import { 
  Send, 
  Sparkles, 
  FileText,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  X,
  Truck,
  PackageCheck
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

  // 첨부파일 상태
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  // RFQ 견적서 작성 모달 상태
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quotePrice, setQuotePrice] = useState('145.00');
  const [quoteMoq, setQuoteMoq] = useState('500 Units');
  const [quoteNote, setQuoteNote] = useState('Includes FOB shipping to Incheon Port. Lead time 14 days.');

  // 무역 서류(PI/CI/PL) 다운로드 모달 상태
  const [isDocModalOpen, setIsQuoteDocModalOpen] = useState(false);
  const [selectedMsgForDoc, setSelectedMsgForDoc] = useState(null);
  const [selectedRoomForDoc, setSelectedRoomForDoc] = useState(null);

  // 샘플 주문 및 트래킹 모달 상태
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [sampleTrackingNo, setSampleTrackingNo] = useState('DHL-8829-4019-KR');
  const [courierCompany, setCourierCompany] = useState('DHL Express');

  // 결제 모달 상태
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentQuoteData, setPaymentQuoteData] = useState(null);

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

  const handleOpenDocModal = (msg, room) => {
    setSelectedMsgForDoc(msg);
    setSelectedRoomForDoc(room);
    setIsQuoteDocModalOpen(true);
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSampleModalOpen(true)}
              className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold text-xs rounded-xl border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Sample Order & Shipping</span>
            </button>

            <div className="text-xs text-slate-300 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              Account Role: <span className="font-extrabold text-blue-400">{userRole === 'seller' ? 'Korean Seller' : 'Global Buyer'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {rooms.map((room) => (
            <ChatRoomItem
              key={room.id}
              room={room}
              isOpen={activeRoomId === room.id}
              userRole={userRole}
              messages={roomMessagesMap[room.id] || []}
              onToggle={() => setActiveRoomId(activeRoomId === room.id ? null : room.id)}
              onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
              onOpenDocModal={handleOpenDocModal}
              onOpenPaymentModal={handleOpenPaymentModal}
              messagesEndRef={messagesEndRef}
            />
          ))}
        </div>

        {/* 대화방 내부 입력 하단 폼 */}
        {activeRoomId && (
          <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-2 shadow-sm">
            {attachedFile && (
              <div className="px-4 py-2 bg-blue-50 border border-blue-100 flex items-center justify-between text-xs rounded-xl">
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

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
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
                className="p-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl transition cursor-pointer border border-slate-200"
                title="Attach Document / Quotation"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 rounded-xl transition cursor-pointer border border-slate-200"
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

      {/* 2. 무역 서류 3종 (PI, CI, PL) 선택 인쇄 모달 */}
      <TradeDocModal
        isOpen={isDocModalOpen}
        onClose={() => setIsQuoteDocModalOpen(false)}
        msg={selectedMsgForDoc}
        room={selectedRoomForDoc}
      />

      {/* 3. 샘플 주문 & 글로벌 배송 트래킹 모달 */}
      {isSampleModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-500" />
                  Sample Order & Express Shipping
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Order evaluation sample or track DHL/FedEx shipping.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsSampleModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <span className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
                  <PackageCheck className="w-4 h-4 text-amber-600" /> Express Air Sample Shipping Status
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Courier</span>
                    <span className="font-bold text-slate-900">{courierCompany}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tracking Number</span>
                    <span className="font-bold text-blue-600">{sampleTrackingNo}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Update Tracking Information (Seller):</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={courierCompany}
                    onChange={(e) => setCourierCompany(e.target.value)}
                    placeholder="Courier (e.g., DHL, FedEx)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={sampleTrackingNo}
                    onChange={(e) => setSampleTrackingNo(e.target.value)}
                    placeholder="Tracking Number"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsSampleModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  alert(`Tracking info updated: ${courierCompany} [${sampleTrackingNo}]`);
                  setIsSampleModalOpen(false);
                }}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Save Tracking Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. B2B 3가지 통합 결제 팝업 모달 */}
      {isPaymentModalOpen && (
        <B2bPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          quoteData={paymentQuoteData}
        />
      )}
    </div>
  );
}