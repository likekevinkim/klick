// app/chat/page.jsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Header from '@/components/Header';
import GoogleTranslateScript from '@/components/GoogleTranslateScript';
import B2bPaymentModal from '@/components/B2bPaymentModal';
import ChatRoomItem from '@/components/chat/ChatRoomItem';
import TradeDocModal from '@/components/chat/TradeDocModal';
import SampleTrackingModal from '@/components/chat/SampleTrackingModal';
import { 
  Sparkles, 
  Loader2, 
  FileText, 
  MessageSquare, 
  Globe, 
  Languages, 
  Info 
} from 'lucide-react';
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

  // 무료 실시간 번역 엔진 상태 (토큰 소비 0원)
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [targetLang, setTargetLang] = useState('ko');

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

  const languages = [
    { code: 'ko', label: '한국어 (Korean)' },
    { code: 'en', label: 'English (US)' },
    { code: 'zh-CN', label: '中文 (Chinese)' },
    { code: 'ja', label: '日本語 (Japanese)' },
    { code: 'es', label: 'Español (Spanish)' },
    { code: 'ar', label: 'العربية (Arabic)' },
  ];

  useEffect(() => {
    setMounted(true);

    initChatSession();

    // 실시간 DB 메시지 수신 채널 구독
    const msgChannel = supabase
      .channel('public:chat_messages_page_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            handleRealtimeMessageReceived(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [paramProductId, paramCompany, paramTitle, paramSellerId]);

  // 구글 번역 쿠키 제어를 통한 0원 무료 실시간 번역 엔진 트리거
  useEffect(() => {
    if (autoTranslate) {
      triggerFreeGoogleTranslate(targetLang);
    } else {
      triggerFreeGoogleTranslate('auto');
    }
  }, [autoTranslate, targetLang, roomMessagesMap]);

  const triggerFreeGoogleTranslate = (langCode) => {
    if (typeof window === 'undefined') return;
    const domain = window.location.hostname;

    document.cookie = `googtrans=/auto/${langCode}; path=/;`;
    document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${domain};`;

    const googleCombo = document.querySelector('.goog-te-combo');
    if (googleCombo) {
      googleCombo.value = langCode;
      googleCombo.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const handleRealtimeMessageReceived = (newMsg) => {
    setRoomMessagesMap((prevMap) => {
      const roomMsgs = prevMap[newMsg.room_id] || [];
      if (roomMsgs.some((m) => m.id === newMsg.id)) return prevMap;
      return {
        ...prevMap,
        [newMsg.room_id]: [...roomMsgs, newMsg],
      };
    });

    setRooms((prevRooms) =>
      prevRooms.map((r) =>
        r.id === newMsg.room_id
          ? { 
              ...r, 
              last_message: newMsg.message || 'File sent', 
              updated_at: newMsg.created_at,
              unread_count: (r.unread_count || 0) + 1
            }
          : r
      )
    );

    // 헤더 수치 재계산 이벤트 동기화
    window.dispatchEvent(new Event('klick_unread_chat_updated'));
  };

  const initChatSession = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const currentUserObj = session?.user || null;
      setUser(currentUserObj);

      if (!currentUserObj) {
        setRooms([]);
        setLoading(false);
        return;
      }

      const role = currentUserObj?.user_metadata?.role || 'seller';
      setUserRole(role);

      await fetchChatRoomsAndInit(currentUserObj, role);
    } catch (error) {
      console.error('Failed to init chat session:', error);
    } finally {
      setLoading(false);
    }
  };

  // ★ [핵심 보안 수정] 로그인한 본인 ID의 대화방만 조회 (셀러는 seller_id = 내ID, 바이어는 buyer_id = 내ID)
  const fetchChatRoomsAndInit = async (currentUserObj, currentRole) => {
    try {
      if (!currentUserObj) {
        setRooms([]);
        return;
      }

      const userIdStr = currentUserObj.id.toString();

      // 내 역할에 따라 쿼리 보안 조건 분기
      let query = supabase.from('chat_rooms').select('*');
      if (currentRole === 'seller') {
        query = query.eq('seller_id', userIdStr);
      } else {
        query = query.eq('buyer_id', userIdStr);
      }

      const { data: existingRooms } = await query.order('updated_at', { ascending: false });

      let currentRoomsList = existingRooms || [];

      if (currentRoomsList.length > 0) {
        const roomIds = currentRoomsList.map((r) => r.id);
        const { data: msgData } = await supabase
          .from('chat_messages')
          .select('*')
          .in('room_id', roomIds)
          .order('created_at', { ascending: true });

        if (msgData) {
          const map = {};
          const unreadMap = {};

          msgData.forEach((msg) => {
            if (!map[msg.room_id]) map[msg.room_id] = [];
            map[msg.room_id].push(msg);

            // 상대방이 보낸 메시지 중, is_read = false (안 읽음) 레코드만 카운트
            const opponentRole = currentRole === 'seller' ? 'buyer' : 'seller';
            const isUnread = msg.sender_role === opponentRole && (msg.is_read === false || msg.is_read === null);

            if (isUnread) {
              unreadMap[msg.room_id] = (unreadMap[msg.room_id] || 0) + 1;
            }
          });

          setRoomMessagesMap(map);

          // 대화방 객체에 안읽은 메시지 수 부여
          currentRoomsList = currentRoomsList.map((r) => ({
            ...r,
            unread_count: unreadMap[r.id] || 0
          }));
        }
      }

      // 상세페이지에서 직통 문의 버튼으로 접근 시 대화방 생성 및 연결
      if (paramCompany || paramTitle) {
        const companyTitle = paramTitle ? decodeURIComponent(paramTitle) : 'Export Product';
        const companySeller = paramCompany ? decodeURIComponent(paramCompany) : 'Hankook Precision Co., Ltd.';

        let matchedRoom = currentRoomsList.find(
          (r) => r.product_title === companyTitle && r.seller_name === companySeller
        );

        if (!matchedRoom) {
          const newRoomPayload = {
            product_id: paramProductId ? paramProductId.toString() : null,
            product_title: companyTitle,
            buyer_id: userIdStr,
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

          if (!createError && createdRoomData && createdRoomData.length > 0) {
            matchedRoom = { ...createdRoomData[0], unread_count: 0 };
            currentRoomsList = [matchedRoom, ...currentRoomsList];

            const initialMsg = {
              room_id: matchedRoom.id,
              sender_id: userIdStr,
              sender_role: 'buyer',
              message: `Hello! I am inquiring about [${companyTitle}] from ${companySeller}. Could you please share the FOB pricing and official catalog?`,
              translated_message: `Hello! I am inquiring about [${companyTitle}] from ${companySeller}. Could you please share the FOB pricing and official catalog?`,
              is_quote: false,
              is_read: false,
              created_at: new Date().toISOString()
            };

            await supabase.from('chat_messages').insert([initialMsg]);
            setRoomMessagesMap((prev) => ({
              ...prev,
              [matchedRoom.id]: [initialMsg]
            }));
          }
        }

        if (matchedRoom) {
          setActiveRoomId(matchedRoom.id);
          // 직통 진입 시 즉시 DB 읽음 처리
          await markRoomMessagesAsRead(matchedRoom.id, currentRole);
        }
      } else {
        setActiveRoomId(null);
      }

      setRooms(currentRoomsList);
      window.dispatchEvent(new Event('klick_unread_chat_updated'));
    } catch (err) {
      console.error('Error fetching chat rooms:', err);
    }
  };

  // ★ [안 읽은 메시지 수 처리] 해당 대화방 메시지를 DB 및 로컬 상태에서 완벽 읽음(is_read=true) 처리
  const markRoomMessagesAsRead = async (roomId, currentRole) => {
    try {
      const opponentRole = currentRole === 'seller' ? 'buyer' : 'seller';

      // 1. DB 상의 안 읽은 레코드 업데이트
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .eq('sender_role', opponentRole);

      // 2. 로컬 메모리 상태 상 메시지들의 is_read 상태 일괄 true 변환
      setRoomMessagesMap((prevMap) => {
        const currentMsgs = prevMap[roomId] || [];
        const updatedMsgs = currentMsgs.map((m) =>
          m.sender_role === opponentRole ? { ...m, is_read: true } : m
        );
        return { ...prevMap, [roomId]: updatedMsgs };
      });

      // 3. 채팅방 카드 목록의 unread_count 0 초기화
      setRooms((prevRooms) =>
        prevRooms.map((r) => (r.id === roomId ? { ...r, unread_count: 0 } : r))
      );

      // 4. 헤더 / 메인화면 뱃지 수치 즉시 갱신 이벤트 전송
      window.dispatchEvent(new Event('klick_unread_chat_updated'));
    } catch (e) {
      console.error('Failed to mark as read in DB:', e);
    }
  };

  // 대화방 아코디언 토글 클릭 시 즉시 안 읽은 수 0 차감 및 읽음 처리
  const handleToggleRoom = async (roomId) => {
    if (activeRoomId === roomId) {
      setActiveRoomId(null);
    } else {
      setActiveRoomId(roomId);
      await markRoomMessagesAsRead(roomId, userRole);
    }
  };

  const handleSendMessage = async (targetRoomId, text, attachedFile) => {
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
      sender_id: user?.id ? user.id.toString() : 'guest_user',
      sender_role: userRole,
      message: text,
      translated_message: text,
      is_quote: false,
      is_read: false,
      file: finalFilePayload,
      created_at: new Date().toISOString()
    };

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
      const { error: msgInsertError } = await supabase.from('chat_messages').insert([{
        room_id: targetRoomId,
        sender_id: newMsgObj.sender_id,
        sender_role: newMsgObj.sender_role,
        message: newMsgObj.message,
        translated_message: newMsgObj.translated_message,
        is_quote: false,
        is_read: false,
        file: newMsgObj.file,
        created_at: newMsgObj.created_at
      }]);

      if (msgInsertError) {
        console.error('Failed to insert message to Supabase:', msgInsertError);
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

  const handleSendQuote = async () => {
    if (!activeRoomId) return;

    const quoteMsgObj = {
      id: Date.now(),
      room_id: activeRoomId,
      sender_id: user?.id ? user.id.toString() : 'guest_seller',
      sender_role: 'seller',
      message: `[Official B2B Quote Sent] ${quoteNote}`,
      translated_message: `[Official B2B Quote Sent] ${quoteNote}`,
      is_quote: true,
      is_read: false,
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
      await supabase.from('chat_messages').insert([{
        room_id: activeRoomId,
        sender_id: quoteMsgObj.sender_id,
        sender_role: 'seller',
        message: quoteMsgObj.message,
        translated_message: quoteMsgObj.translated_message,
        is_quote: true,
        is_read: false,
        quote_price: quoteMsgObj.quote_price,
        quote_moq: quoteMsgObj.quote_moq,
        created_at: quoteMsgObj.created_at
      }]);

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
      <GoogleTranslateScript />

      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-6">
        {/* 상단 무제한 무료 번역 컨트롤러 내장 헤더 바 */}
        <div className="bg-[#0F172A] text-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" /> KLICK Direct Accordion Chat Hub
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" /> 100% Free Translation (0 Tokens)
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              Real-time AI Multilingual Chat & Trade Document Hub
            </h1>
            <p className="text-xs text-slate-400">
              Negotiate with global buyers and generate official trade documents (PI, Commercial Invoice, Packing List).
            </p>
          </div>

          {/* 무료 실시간 번역 컨트롤러 */}
          <div className="flex items-center gap-3 bg-slate-800/90 p-2 rounded-2xl border border-slate-700/80">
            <div className="flex items-center gap-1.5 pl-2">
              <Languages className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-300">My Lang:</span>
            </div>

            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setAutoTranslate(!autoTranslate)}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                autoTranslate 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <span>{autoTranslate ? 'Auto ON' : 'OFF'}</span>
            </button>
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
                targetLang={targetLang}
                onToggle={() => handleToggleRoom(room.id)}
                onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
                onOpenDocModal={handleOpenDocModal}
                onOpenPaymentModal={handleOpenPaymentModal}
                onOpenSampleModal={handleOpenSampleModal}
                onSendMessage={handleSendMessage}
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