// app/chat/page.jsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Header from '@/components/Header';
import B2bPaymentModal from '@/components/B2bPaymentModal';
import ChatRoomItem from '@/components/chat/ChatRoomItem';
import TradeDocModal from '@/components/chat/TradeDocModal';
import SampleTrackingModal from '@/components/chat/SampleTrackingModal';
import { Sparkles, Loader2, FileText } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function ChatContent() {
  const searchParams = useSearchParams();
  const paramProductId = searchParams.get('productId');
  const paramCompany = searchParams.get('company');
  const paramTitle = searchParams.get('title');

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('seller');

  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [roomMessagesMap, setRoomMessagesMap] = useState({});

  // 모달 상태
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quotePrice, setQuotePrice] = useState('145.00');
  const [quoteMoq, setQuoteMoq] = useState('500 Units');
  const [quoteNote, setQuoteNote] = useState('Includes FOB shipping to Incheon Port. Lead time 14 days.');

  const [isDocModalOpen, setIsQuoteDocModalOpen] = useState(false);
  const [selectedMsgForDoc, setSelectedMsgForDoc] = useState(null);
  const [selectedRoomForDoc, setSelectedRoomForDoc] = useState(null);

  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [selectedRoomForSample, setSelectedRoomForSample] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentQuoteData, setPaymentQuoteData] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    initChatSession();
  }, [paramProductId, paramCompany]);

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
    const readRoomIds = (localStorage.getItem('klick_read_room_ids') || '').split(',');

    let mockRooms = [
      {
        id: 1,
        product_title: 'Precision Hydraulic Control Valve HV-300',
        buyer_name: 'John Smith (US Sourcing LLC)',
        seller_name: 'Hankook Precision Co., Ltd.',
        last_message: 'Can you send us a formal FOB quote for 500 units?',
        updated_at: '10:24 AM',
        courier: 'DHL Express',
        tracking_no: 'DHL-8829-4019-KR',
        unread_count: readRoomIds.includes('1') ? 0 : 1
      },
      {
        id: 2,
        product_title: 'Organic K-Beauty Repair Serum 50ml',
        buyer_name: 'Elena Rostova (Euro Cosmetics Import)',
        seller_name: 'Hankook Precision Co., Ltd.',
        last_message: 'Is OEM private labeling available for this serum?',
        updated_at: 'Yesterday',
        courier: 'FedEx Express',
        tracking_no: 'FDX-9901-2048-KR',
        unread_count: readRoomIds.includes('2') ? 0 : 1
      }
    ];

    let initialMessages = {
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

    if (paramCompany || paramTitle) {
      const companyTitle = paramTitle ? decodeURIComponent(paramTitle) : 'Hydraulic Control Valve HV-300';
      const companySeller = paramCompany ? decodeURIComponent(paramCompany) : 'Hankook Precision Co., Ltd.';
      
      const newRoomId = Date.now();
      const directRoom = {
        id: newRoomId,
        product_title: companyTitle,
        buyer_name: 'Global Buyer (Direct Inquiry)',
        seller_name: companySeller,
        last_message: `Hello! I am inquiring about [${companyTitle}]. Please send us full specifications.`,
        updated_at: 'Just Now',
        courier: 'DHL Express',
        tracking_no: 'DHL-DIRECT-2026-KR',
        unread_count: 0
      };

      const directInitialMsg = {
        id: Date.now() + 1,
        room_id: newRoomId,
        sender_role: 'buyer',
        message: `Hello! I am inquiring about [${companyTitle}] from ${companySeller}. Could you please share the FOB pricing and official catalog?`,
        translated_message: `안녕하세요! ${companySeller}의 [${companyTitle}] 상품에 대해 문의드립니다. FOB 단가 및 공식 카탈로그를 전달해 주실 수 있나요?`,
        is_quote: false,
        file: null,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      mockRooms = [directRoom, ...mockRooms];
      initialMessages[newRoomId] = [directInitialMsg];

      setActiveRoomId(newRoomId);
    } else {
      setActiveRoomId(1);
    }

    setRooms(mockRooms);
    setRoomMessagesMap(initialMessages);
    syncTotalUnreadCount(mockRooms);
  };

  const fetchChatRooms = async (userId) => {
    try {
      const { data } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('updated_at', { ascending: false });

      if (data && data.length > 0) {
        const readRoomIds = (localStorage.getItem('klick_read_room_ids') || '').split(',');
        const formatted = data.map(r => ({
          ...r,
          unread_count: readRoomIds.includes(r.id.toString()) ? 0 : (r.unread_count || 0)
        }));
        setRooms(formatted);
        
        if (paramProductId) {
          const matched = formatted.find(r => r.id.toString() === paramProductId);
          if (matched) setActiveRoomId(matched.id);
          else setActiveRoomId(formatted[0].id);
        } else {
          setActiveRoomId(formatted[0].id);
        }

        syncTotalUnreadCount(formatted);
        fetchMessagesForRooms(formatted);
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

  const handleToggleRoom = (roomId) => {
    if (activeRoomId === roomId) {
      setActiveRoomId(null);
    } else {
      setActiveRoomId(roomId);

      const readRoomIds = new Set((localStorage.getItem('klick_read_room_ids') || '').split(',').filter(Boolean));
      readRoomIds.add(roomId.toString());
      localStorage.setItem('klick_read_room_ids', Array.from(readRoomIds).join(','));

      const updatedRooms = rooms.map(r => r.id === roomId ? { ...r, unread_count: 0 } : r);
      setRooms(updatedRooms);

      syncTotalUnreadCount(updatedRooms);
    }
  };

  const syncTotalUnreadCount = (roomList) => {
    const total = roomList.reduce((acc, curr) => acc + (curr.unread_count || 0), 0);
    localStorage.setItem('klick_unread_chat_count', total.toString());
    window.dispatchEvent(new Event('klick_unread_chat_updated'));
  };

  // ★ 특정 대화방 메시지 독립 발송 처리
  const handleSendMessage = async (targetRoomId, text, attachedFile) => {
    let autoTranslation = '';
    if (text) {
      if (/[ㄱ-ㅎ|가-힣]/.test(text)) {
        autoTranslation = `[AI Trans] ${text}`;
      } else {
        autoTranslation = `[AI 번역] ${text}`;
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
      room_id: targetRoomId,
      sender_id: user?.id || null,
      sender_role: userRole,
      message: text,
      translated_message: autoTranslation,
      is_quote: false,
      file: finalFilePayload,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setRoomMessagesMap((prevMap) => ({
      ...prevMap,
      [targetRoomId]: [...(prevMap[targetRoomId] || []), newMsgObj],
    }));

    setRooms((prevRooms) =>
      prevRooms.map((r) =>
        r.id === targetRoomId ? { ...r, last_message: text || attachedFile?.name || 'File sent', updated_at: 'Just now' } : r
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

  const handleSendSampleCoupon = (targetRoomId) => {
    const couponMsgObj = {
      id: Date.now(),
      room_id: targetRoomId,
      sender_id: user?.id || null,
      sender_role: 'seller',
      message: '[B2B Special Offer] Exclusive Sample Discount Voucher Issued! ($20 Off Air Freight)',
      translated_message: '[B2B 전용 혜택] 바이어 전용 샘플 항공 배송 $20 할인 쿠폰이 발급되었습니다!',
      is_quote: false,
      file: null,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setRoomMessagesMap((prevMap) => ({
      ...prevMap,
      [targetRoomId]: [...(prevMap[targetRoomId] || []), couponMsgObj],
    }));

    alert('Sample $20 Discount Voucher sent directly to buyer!');
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

  const handleOpenSampleModal = (room) => {
    setSelectedRoomForSample(room);
    setIsSampleModalOpen(true);
  };

  const handleUpdateTracking = (roomId, courier, trackingNo) => {
    setRooms(prevRooms =>
      prevRooms.map(r => r.id === roomId ? { ...r, courier, tracking_no: trackingNo } : r)
    );
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
              <Sparkles className="w-3.5 h-3.5" /> KLICK Direct Accordion Chat Hub
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

        {/* 대화방 카드 목록 (각 카드 내부에 독립 메신저 입력창 탑재) */}
        <div className="space-y-4">
          {rooms.map((room) => (
            <ChatRoomItem
              key={room.id}
              room={room}
              isOpen={activeRoomId === room.id}
              userRole={userRole}
              messages={roomMessagesMap[room.id] || []}
              onToggle={() => handleToggleRoom(room.id)}
              onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
              onOpenDocModal={handleOpenDocModal}
              onOpenPaymentModal={handleOpenPaymentModal}
              onOpenSampleModal={handleOpenSampleModal}
              onSendMessage={handleSendMessage}
              onSendSampleCoupon={handleSendSampleCoupon}
              messagesEndRef={messagesEndRef}
            />
          ))}
        </div>
      </main>

      {/* 모달 구역 */}
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

      <TradeDocModal
        isOpen={isDocModalOpen}
        onClose={() => setIsQuoteDocModalOpen(false)}
        msg={selectedMsgForDoc}
        room={selectedRoomForDoc}
      />

      <SampleTrackingModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        room={selectedRoomForSample}
        userRole={userRole}
        onUpdateTracking={handleUpdateTracking}
      />

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

export default function RealtimeChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading KLICK Real-time AI Chat Hub...</span>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}