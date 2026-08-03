// app/chat/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import B2bPaymentModal from '@/components/B2bPaymentModal';
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
  ArrowRight
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

  // RFQ 견적서 작성 팝업 모달 상태
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quotePrice, setQuotePrice] = useState('150.00');
  const [quoteMoq, setQuoteMoq] = useState('100 Units');
  const [quoteNote, setQuoteNote] = useState('Includes FOB shipping to Incheon Port. Lead time 14 days.');

  // ★ B2B 3가지 결제 모달 연동 상태
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentQuoteData, setPaymentQuoteData] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    initChatSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessagesMap, activeRoomId]);

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
          created_at: '10:20 AM',
        },
        {
          id: 102,
          room_id: 1,
          sender_role: 'seller',
          message: 'Hello Mr. Smith! Thank you for your inquiry. Here is our official quotation for 500 units.',
          translated_message: '안녕하세요 스미스님! 문의해주셔서 감사합니다. 500개 기준 공식 견적서를 전달드립니다.',
          is_quote: true,
          quote_price: '145.00 USD / Unit',
          quote_moq: '500 Units',
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoomId) return;

    const currentText = newMessage;
    setNewMessage('');

    let autoTranslation = '';
    if (/[ㄱ-ㅎ|가-힣]/.test(currentText)) {
      autoTranslation = `[AI Trans] ${currentText}`;
    } else {
      autoTranslation = `[AI 번역] ${currentText}`;
    }

    const newMsgObj = {
      id: Date.now(),
      room_id: activeRoomId,
      sender_id: user?.id || null,
      sender_role: userRole,
      message: currentText,
      translated_message: autoTranslation,
      is_quote: false,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setRoomMessagesMap((prevMap) => ({
      ...prevMap,
      [activeRoomId]: [...(prevMap[activeRoomId] || []), newMsgObj],
    }));

    setRooms((prevRooms) =>
      prevRooms.map((r) =>
        r.id === activeRoomId ? { ...r, last_message: currentText, updated_at: 'Just now' } : r
      )
    );

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

  // ★ 결제 모달 열기 함수
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
              Real-time AI Multilingual Chat & RFQ Hub
            </h1>
            <p className="text-xs text-slate-400">
              Click any buyer or inquiry subject to directly expand the conversation thread below.
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
                {/* 대화 제목 헤더 */}
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

                {/* 제목 클릭 시 바로 전개되는 메시지 스레드 */}
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

                    <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto bg-white">
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

                            {/* 견적서 카드 타입인 경우 */}
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

                                {/* ★ 바이어 결제 진입 초록색 버튼 (항상 명확히 노출!) */}
                                <div className="pt-2 border-t border-slate-800">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPaymentModal(msg, room)}
                                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ring-2 ring-emerald-500/30"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                    <span>Pay / Proceed to Checkout</span>
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* 일반 대화 말풍선 */
                              <div
                                className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed shadow-sm space-y-2 ${
                                  isMyMsg
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
                                }`}
                              >
                                <p className="font-semibold text-sm">{msg.message}</p>

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

                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 flex items-center gap-2 bg-slate-50">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message in your language (AI translates automatically)..."
                        className="flex-1 px-4 py-3.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                      />

                      <button
                        type="submit"
                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Send</span>
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* 셀러 RFQ 견적서 발송 모달 */}
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
                    placeholder="150.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Order (MOQ)</label>
                  <input
                    type="text"
                    value={quoteMoq}
                    onChange={(e) => setQuoteMoq(e.target.value)}
                    placeholder="100 Units"
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

      {/* ★ 바이어용 3가지 통합 B2B 결제 팝업 모달 연결 */}
      <B2bPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        quoteData={paymentQuoteData}
      />
    </div>
  );
}