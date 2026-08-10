// app/chat/page.jsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Header from '@/components/Header';
import B2bPaymentModal from '@/components/B2bPaymentModal';
import ChatRoomItem from '@/components/chat/ChatRoomItem';
import TradeDocModal from '@/components/chat/TradeDocModal';
import SampleTrackingModal from '@/components/chat/SampleTrackingModal';
import { Sparkles, Loader2, FileText, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function ChatContent() {
  const searchParams = useSearchParams();
  const paramProductId = searchParams.get('productId');
  const paramCompany = searchParams.get('company');
  const paramTitle = searchParams.get('title');
  const paramSellerId = searchParams.get('sellerId');

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('seller');

  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [roomMessagesMap, setRoomMessagesMap] = useState({});
  const [loading, setLoading] = useState(true);

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
  }, [paramProductId, paramCompany, paramTitle, paramSellerId]);

  const initChatSession = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const currentUserObj = session?.user || null;
      setUser(currentUserObj);

      const role = currentUserObj?.user_metadata?.role || 'seller';
      setUserRole(role);

      await fetchChatRoomsAndInit(currentUserObj);
    } catch (error) {
      console.error('Failed to init chat session:', error);
    } finally {
      setLoading(false);
    }
  };

  // ★ Supabase DB 대화방 생성 및 해당 셀러와의 직통 채팅 실시간 연결
  const fetchChatRoomsAndInit = async (currentUserObj) => {
    try {
      // 1. 기존 DB 대화방 조회
      const { data: existingRooms, error: roomFetchError } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('updated_at', { ascending: false });

      if (roomFetchError) {
        console.error('Room fetch error from Supabase:', roomFetchError);
      }

      let currentRoomsList = existingRooms || [];

      // 2. 상세페이지에서 채팅 문의 버튼을 눌러 들어온 경우 (URL 파라미터 감지)
      if (paramCompany || paramTitle) {
        const companyTitle = paramTitle ? decodeURIComponent(paramTitle) : 'Export Product';
        const companySeller = paramCompany ? decodeURIComponent(paramCompany) : 'Hankook Precision Co., Ltd.';

        // 기존 대화방 중 매칭되는 방 찾기
        let matchedRoom = currentRoomsList.find(
          (r) => r.product_title === companyTitle && r.seller_name === companySeller
        );

        // 해당 셀러 대화방이 없으면 DB에 즉시 생성(INSERT)
        if (!matchedRoom) {
          const newRoomPayload = {
            product_id: paramProductId ? paramProductId.toString() : null,
            product_title: companyTitle,
            buyer_id: currentUserObj?.id ? currentUserObj.id.toString() : 'guest_buyer',
            buyer_name: currentUserObj?.email ? currentUserObj.email.split('@')[0] : 'Global Buyer',
            seller_id: paramSellerId ? paramSellerId.toString() : null,
            seller_name: companySeller,
            last_message: `Hello! I am inquiring about [${companyTitle}].`,
            updated_at: new Date().toISOString()
          };

          const { data: createdRoomData, error: createError } = await supabase
            .from('chat_rooms')
            .insert([newRoomPayload])
            .select();

          if (createError) {
            console.error('Failed to create chat room in DB:', createError);
          } else if (createdRoomData && createdRoomData.length > 0) {
            matchedRoom = createdRoomData[0];
            currentRoomsList = [matchedRoom, ...currentRoomsList];

            // 대화방 첫 문의 메시지 자동 발송
            await supabase.from('chat_messages').insert([
              {
                room_id: matchedRoom.id,
                sender_id: currentUserObj?.id ? currentUserObj.id.toString() : 'guest_buyer',
                sender_role: 'buyer',
                message: `Hello! I am inquiring about [${companyTitle}] from ${companySeller}. Could you please share the FOB pricing and official catalog?`,
                translated_message: `안녕하세요! ${companySeller}의 [${companyTitle}] 상품에 대해 문의드립니다. FOB 단가 및 공식 카탈로그를 전달해 주실 수 있나요?`,
                is_quote: false
              }
            ]);
          }
        }

        // ★ 매칭되거나 새로 생성된 대화방을 activeRoomId로 지정하여 즉시 펼침(오픈)
        if (matchedRoom) {
          setActiveRoomId(matchedRoom.id);
        }
      } else if (currentRoomsList.length > 0) {
        setActiveRoomId(currentRoomsList[0].id);
      }

      setRooms(currentRoomsList);

      if (currentRoomsList.length > 0) {
        await fetchMessagesForRooms(currentRoomsList);
      }
    } catch (err) {
      console.error('Error fetching chat rooms:', err);
    }
  };

  // DB에서 대화 메시지 전체 불러오기
  const fetchMessagesForRooms = async (roomList) => {
    try {
      const roomIds = roomList.map((r) => r.id);
      const { data: msgData, error } = await supabase
        .from('chat_messages')
        .select('*')
        .in('room_id', roomIds)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch messages:', error);
        return;
      }

      if (msgData) {
        const map = {};
        msgData.forEach((msg) => {
          if (!map[msg.room_id]) map[msg.room_id] = [];
          map[msg.room_id].push(msg);
        });
        setRoomMessagesMap(map);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  const handleToggleRoom = (roomId) => {
    if (activeRoomId === roomId) {
      setActiveRoomId(null);
    } else {
      setActiveRoomId(roomId);
    }
  };

  // 특정 대화방 메시지 DB 저장 및 실시간 전송
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
      room_id: targetRoomId,
      sender_id: user?.id ? user.id.toString() : 'guest_user',
      sender_role: userRole,
      message: text,
      translated_message: autoTranslation,
      is_quote: false,
      file: finalFilePayload,
      created_at: new Date().toISOString()
    };

    // UI 화면에 먼저 즉시 반영
    setRoomMessagesMap((prevMap) => ({
      ...prevMap,
      [targetRoomId]: [...(prevMap[targetRoomId] || []), newMsgObj],
    }));

    setRooms((prevRooms) =>
      prevRooms.map((r) =>
        r.id === targetRoomId
          ? { ...r, last_message: text || attachedFile?.name || 'File sent', updated_at: new Date().toISOString() }
          : r
      )
    );

    try {
      const { error: msgInsertError } = await supabase.from('chat_messages').insert([newMsgObj]);
      if (msgInsertError) {
        console.error('Failed to insert message to Supabase:', msgInsertError);
        alert('메시지 DB 저장 실패: ' + msgInsertError.message);
        return;
      }

      await supabase
        .from('chat_rooms')
        .update({
          last_message: text || attachedFile?.name || 'File sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetRoomId);
    } catch (err) {
      console.error('DB Insert error:', err);
    }
  };

  const handleSendSampleCoupon = async (targetRoomId) => {
    const couponMsgObj = {
      room_id: targetRoomId,
      sender_id: user?.id ? user.id.toString() : 'guest_seller',
      sender_role: 'seller',
      message: '[B2B Special Offer] Exclusive Sample Discount Voucher Issued! ($20 Off Air Freight)',
      translated_message: '[B2B 전용 혜택] 바이어 전용 샘플 항공 배송 $20 할인 쿠폰이 발급되었습니다!',
      is_quote: false,
      created_at: new Date().toISOString()
    };

    setRoomMessagesMap((prevMap) => ({
      ...prevMap,
      [targetRoomId]: [...(prevMap[targetRoomId] || []), couponMsgObj],
    }));

    try {
      const { error } = await supabase.from('chat_messages').insert([couponMsgObj]);
      if (error) {
        console.error('Coupon DB Error:', error);
        alert('쿠폰 전송 실패: ' + error.message);
        return;
      }
      alert('Sample $20 Discount Voucher sent directly to buyer!');
    } catch (err) {
      console.error('Coupon DB error:', err);
    }
  };

  const handleSendQuote = async () => {
    if (!activeRoomId) return;

    const quoteMsgObj = {
      room_id: activeRoomId,
      sender_id: user?.id ? user.id.toString() : 'guest_seller',
      sender_role: 'seller',
      message: `[Official B2B Quote Sent] ${quoteNote}`,
      translated_message: `[공식 B2B 견적서 발송] ${quoteNote}`,
      is_quote: true,
      quote_price: `${quotePrice} USD / Unit`,
      quote_moq: quoteMoq,
      created_at: new Date().toISOString()
    };

    setRoomMessagesMap((prevMap) => ({
      ...prevMap,
      [activeRoomId]: [...(prevMap[activeRoomId] || []), quoteMsgObj],
    }));

    setIsQuoteModalOpen(false);

    try {
      const { error } = await supabase.from('chat_messages').insert([quoteMsgObj]);
      if (error) {
        console.error('Quote DB error:', error);
        alert('견적서 전송 실패: ' + error.message);
        return;
      }

      await supabase
        .from('chat_rooms')
        .update({
          last_message: `[Official Quote] ${quotePrice} USD`,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeRoomId);
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

  const handleUpdateTracking = async (roomId, courier, trackingNo) => {
    setRooms((prevRooms) =>
      prevRooms.map((r) => (r.id === roomId ? { ...r, courier, tracking_no: trackingNo } : r))
    );

    try {
      await supabase
        .from('chat_rooms')
        .update({ courier, tracking_no: trackingNo })
        .eq('id', roomId);
    } catch (err) {
      console.error('Update tracking error:', err);
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
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-16 antialiased">
      <Header />

      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-6">
        <div className="bg-[#0F172A] text-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
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

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading live chat channels from Supabase Database...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3 shadow-sm">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-slate-800">No Chat Inquiries Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When a buyer clicks "Chat with Representative" on a product detail page, a direct real-time chat room with the seller will be created here!
            </p>
          </div>
        ) : (
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
        )}
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
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
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