// app/chat/page.jsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Header from '@/components/Header';
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
  Languages 
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// 실시간 AI 번역 API 헬퍼 함수
const translateTextWithApi = async (text, targetLanguage) => {
  if (!text || !text.trim()) return text;
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`
    );
    const data = await res.json();
    if (data && data[0] && Array.isArray(data[0])) {
      return data[0].map((item) => item[0]).join('');
    }
    return text;
  } catch (e) {
    console.error('Translation error:', e);
    return text;
  }
};

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

  // 수신자 기본 지원 언어
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

    // 1. 실시간 메시지 수신 (Realtime Live Socket)
    const msgChannel = supabase
      .channel('public:chat_messages_page_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          handleRealtimeMessageReceived(payload.new);
        }
      )
      .subscribe();

    // 2. 실시간 대화방 수신
    const roomChannel = supabase
      .channel('public:chat_rooms_page_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_rooms' },
        () => {
          if (user) fetchChatRoomsAndInit(user, userRole);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [paramProductId, paramCompany, paramTitle, paramSellerId]);

  // 3. 내 언어(targetLang) 변경 시 현재 대화방 메시지 중 상대방 메시지만 내 언어로 즉시 번역
  useEffect(() => {
    if (!activeRoomId || !roomMessagesMap[activeRoomId]) return;

    const translateCurrentRoomMessages = async () => {
      const currentMsgs = roomMessagesMap[activeRoomId] || [];
      const translatedList = await Promise.all(
        currentMsgs.map(async (msg) => {
          if (msg.sender_role !== userRole) {
            const trans = await translateTextWithApi(msg.message, targetLang);
            return { ...msg, translated_message: trans };
          }
          return msg;
        })
      );

      setRoomMessagesMap((prev) => ({
        ...prev,
        [activeRoomId]: translatedList,
      }));
    };

    translateCurrentRoomMessages();
  }, [targetLang, activeRoomId]);

  // ★ 상대방이 전송한 실시간 라이브 메세지가 들어올 때 수신자의 내 언어(targetLang)로 실시간 번역
  const handleRealtimeMessageReceived = async (newMsg) => {
    let msgWithTrans = newMsg;

    if (newMsg.sender_role !== userRole) {
      const trans = await translateTextWithApi(newMsg.message, targetLang);
      msgWithTrans = { ...newMsg, translated_message: trans };
    }

    setRoomMessagesMap((prevMap) => {
      const roomMsgs = prevMap[newMsg.room_id] || [];
      if (roomMsgs.some((m) => m.id === newMsg.id || (m.created_at === newMsg.created_at && m.sender_role === newMsg.sender_role))) {
        return prevMap;
      }
      return {
        ...prevMap,
        [newMsg.room_id]: [...roomMsgs, msgWithTrans],
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

  const fetchChatRoomsAndInit = async (currentUserObj, currentRole) => {
    try {
      if (!currentUserObj) {
        setRooms([]);
        return;
      }

      const userIdStr = currentUserObj.id.toString();

      let query = supabase.from('chat_rooms').select('*');
      if (currentRole === 'seller') {
        query = query.or(`seller_id.eq.${userIdStr},seller_id.eq.${currentUserObj.id}`);
      } else {
        query = query.or(`buyer_id.eq.${userIdStr},buyer_id.eq.${currentUserObj.id}`);
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

            const opponentRole = currentRole === 'seller' ? 'buyer' : 'seller';
            const isUnread = msg.sender_role === opponentRole && (msg.is_read === false || msg.is_read === null);

            if (isUnread) {
              unreadMap[msg.room_id] = (unreadMap[msg.room_id] || 0) + 1;
            }
          });

          setRoomMessagesMap(map);

          currentRoomsList = currentRoomsList.map((r) => ({
            ...r,
            unread_count: unreadMap[r.id] || 0
          }));
        }
      }

      // URL 파라미터 처리
      if (paramCompany || paramTitle) {
        const companyTitle = paramTitle ? decodeURIComponent(paramTitle) : 'Export Product Inquiry';
        const companySeller = paramCompany ? decodeURIComponent(paramCompany) : 'Verified Korean Company';

        let matchedRoom = currentRoomsList.find(
          (r) => (r.product_title === companyTitle || r.title === companyTitle) && 
                 (r.seller_name === companySeller || r.seller_id === paramSellerId)
        );

        if (!matchedRoom) {
          const targetSellerIdPayload = paramSellerId && paramSellerId.trim() !== '' ? paramSellerId : 'seller_default';

          const newRoomPayload = {
            product_id: paramProductId ? paramProductId.toString() : null,
            product_title: companyTitle,
            buyer_id: userIdStr,
            buyer_name: currentUserObj?.email ? currentUserObj.email.split('@')[0] : 'Global Buyer',
            seller_id: targetSellerIdPayload,
            seller_name: companySeller,
            company_name: companySeller,
            title: companyTitle,
            last_message: `Hello! I am inquiring about [${companyTitle}].`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: createdRoomData, error: createError } = await supabase
            .from('chat_rooms')
            .insert([newRoomPayload])
            .select();

          if (!createError && createdRoomData && createdRoomData.length > 0) {
            matchedRoom = { ...createdRoomData[0], unread_count: 0 };
            currentRoomsList = [matchedRoom, ...currentRoomsList];

            const initialMsgText = `Hello! I am inquiring about [${companyTitle}] from ${companySeller}. Could you please share the FOB pricing and official catalog?`;
            const initialTrans = await translateTextWithApi(initialMsgText, targetLang);

            const initialMsg = {
              room_id: matchedRoom.id,
              sender_id: userIdStr,
              sender_role: 'buyer',
              message: initialMsgText,
              translated_message: initialTrans,
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
          await markRoomMessagesAsRead(matchedRoom.id, currentRole);
        }
      } 
      else if (currentRoomsList.length > 0) {
        setActiveRoomId(currentRoomsList[0].id);
        await markRoomMessagesAsRead(currentRoomsList[0].id, currentRole);
      }

      setRooms(currentRoomsList);
      window.dispatchEvent(new Event('klick_unread_chat_updated'));
    } catch (err) {
      console.error('Error fetching chat rooms:', err);
    }
  };

  const markRoomMessagesAsRead = async (roomId, currentRole) => {
    try {
      const opponentRole = currentRole === 'seller' ? 'buyer' : 'seller';

      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .eq('sender_role', opponentRole);

      setRoomMessagesMap((prevMap) => {
        const currentMsgs = prevMap[roomId] || [];
        const updatedMsgs = currentMsgs.map((m) =>
          m.sender_role === opponentRole ? { ...m, is_read: true } : m
        );
        return { ...prevMap, [roomId]: updatedMsgs };
      });

      setRooms((prevRooms) =>
        prevRooms.map((r) => (r.id === roomId ? { ...r, unread_count: 0 } : r))
      );

      window.dispatchEvent(new Event('klick_unread_chat_updated'));
    } catch (e) {
      console.error('Failed to mark as read in DB:', e);
    }
  };

  const handleToggleRoom = async (roomId) => {
    if (activeRoomId === roomId) {
      setActiveRoomId(null);
    } else {
      setActiveRoomId(roomId);
      await markRoomMessagesAsRead(roomId, userRole);
    }
  };

  // 내 메시지 전송 시 원문 100% 보존하여 DB 저장
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

    try {
      const newMsgPayload = {
        room_id: targetRoomId,
        sender_id: user?.id ? user.id.toString() : 'guest_user',
        sender_role: userRole,
        message: text, // 내가 작성한 원문 그대로 100% 보존
        translated_message: text,
        is_quote: false,
        is_read: false,
        file: finalFilePayload,
        created_at: new Date().toISOString()
      };

      const { data: insertedMsg, error: msgInsertError } = await supabase
        .from('chat_messages')
        .insert([newMsgPayload])
        .select()
        .single();

      if (msgInsertError) {
        console.error('Failed to insert message to Supabase:', msgInsertError);
        return;
      }

      if (insertedMsg) {
        setRoomMessagesMap((prevMap) => {
          const roomMsgs = prevMap[targetRoomId] || [];
          if (roomMsgs.some((m) => m.id === insertedMsg.id)) return prevMap;
          return {
            ...prevMap,
            [targetRoomId]: [...roomMsgs, insertedMsg],
          };
        });
      }

      await supabase
        .from('chat_rooms')
        .update({
          last_message: text || attachedFile?.name || 'File sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetRoomId);

      setRooms((prevRooms) =>
        prevRooms.map((r) =>
          r.id === targetRoomId
            ? { ...r, last_message: text || attachedFile?.name || 'File sent', updated_at: new Date().toISOString() }
            : r
        )
      );
    } catch (err) {
      console.error('DB Insert error:', err);
    }
  };

  const handleSendQuote = async () => {
    if (!activeRoomId) return;

    try {
      const quoteMsgPayload = {
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

      setIsQuoteModalOpen(false);

      const { data: insertedQuoteMsg } = await supabase
        .from('chat_messages')
        .insert([quoteMsgPayload])
        .select()
        .single();

      if (insertedQuoteMsg) {
        setRoomMessagesMap((prevMap) => ({
          ...prevMap,
          [activeRoomId]: [...(prevMap[activeRoomId] || []), insertedQuoteMsg],
        }));
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
      title: room.product_title || room.title,
      sellerCompany: room.seller_name || room.company_name,
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
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" /> KLICK Direct Accordion Chat Hub
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" /> Realtime AI Dual-Text Translation
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              Real-time AI Multilingual Chat & Trade Document Hub
            </h1>
            <p className="text-xs text-slate-400">
              Negotiate with global buyers and generate official trade documents (PI, Commercial Invoice, Packing List).
            </p>
          </div>

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
              When a buyer clicks "Contact Company" or "Send Direct RFQ" on a company showroom page, a direct real-time chat room with the seller will be created here!
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