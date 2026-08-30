// app/chat/page.jsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Header from '@/components/Header';
import Klick from '@/components/Klick';
import OfflineDealModal from '@/components/chat/OfflineDealModal';
import ChatRoomItem from '@/components/chat/ChatRoomItem';
import TradeDocModal from '@/components/chat/TradeDocModal';
import SampleTrackingModal from '@/components/chat/SampleTrackingModal';
import { 
  Sparkles, 
  Loader2, 
  FileText, 
  MessageSquare, 
  Globe
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Real-time Translation API Helper (Google Translate unofficial endpoint — no API key required)
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

// Global Google Translate Cookie Helper
const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

const getSiteTranslateLang = (fallback) => {
  const raw = getCookie('googtrans') || (typeof window !== 'undefined' ? window.localStorage.getItem('googtrans') : null);
  if (!raw) return fallback;

  const parts = raw.split('/').filter(Boolean);
  const target = parts[1];

  if (target && target !== 'auto') return target;
  return fallback;
};

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramProductId = searchParams.get('productId');
  const paramCompany = searchParams.get('company');
  const paramTitle = searchParams.get('title');
  const paramSellerId = searchParams.get('sellerId');
  const paramBuyerId = searchParams.get('buyerId');
  const paramRfqId = searchParams.get('rfqId');
  const paramRfqTitle = searchParams.get('rfqTitle');

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('seller');

  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [roomMessagesMap, setRoomMessagesMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Global default language English
  const [targetLang, setTargetLang] = useState('en');

  // Ref snapshots for async callbacks
  const userRef = useRef(null);
  const userRoleRef = useRef('seller');
  const targetLangRef = useRef('en');
  const roomsRef = useRef([]);
  const roomMessagesMapRef = useRef({});
  const activeRoomIdRef = useRef(null);
  const lastPersistedLangRef = useRef(null);

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { userRoleRef.current = userRole; }, [userRole]);
  useEffect(() => { targetLangRef.current = targetLang; }, [targetLang]);
  useEffect(() => { roomsRef.current = rooms; }, [rooms]);
  useEffect(() => { roomMessagesMapRef.current = roomMessagesMap; }, [roomMessagesMap]);
  useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);

  // Modal States & Quotation Form Fields (예시 문장 전면 제거)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteProductName, setQuoteProductName] = useState(''); // 품명 필드 (기본 빈 값)
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteMoq, setQuoteMoq] = useState('');
  const [quoteNote, setQuoteNote] = useState(''); // 예시 문장 제거 (빈 값)

  const [isDocModalOpen, setIsQuoteDocModalOpen] = useState(false);
  const [selectedMsgForDoc, setSelectedMsgForDoc] = useState(null);
  const [selectedRoomForDoc, setSelectedRoomForDoc] = useState(null);

  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [selectedRoomForSample, setSelectedRoomForSample] = useState(null);
  const [selectedTrackingMsg, setSelectedTrackingMsg] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentQuoteData, setPaymentQuoteData] = useState(null);

  const getOpponentLang = (room, role) => {
    if (role === 'seller') return room?.buyer_lang || 'en';
    return room?.seller_lang || 'ko';
  };

  useEffect(() => {
    const detect = () => {
      const fallback = userRoleRef.current === 'seller' ? 'ko' : 'en';
      const detected = getSiteTranslateLang(fallback);
      if (detected && detected !== targetLangRef.current) {
        setTargetLang(detected);
      }
    };

    detect();
    const interval = setInterval(detect, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user || rooms.length === 0) return;
    if (lastPersistedLangRef.current === targetLang) return;
    persistMyLang(targetLang);
  }, [targetLang, rooms.length, user]);

  const persistMyLang = async (newLang) => {
    try {
      const langField = userRoleRef.current === 'seller' ? 'seller_lang' : 'buyer_lang';
      const roomIds = roomsRef.current.map((r) => r.id);
      if (roomIds.length === 0) return;

      const { error } = await supabase
        .from('chat_rooms')
        .update({ [langField]: newLang })
        .in('id', roomIds);

      if (error) {
        console.error('Failed to persist language preference in DB:', error);
        return;
      }

      lastPersistedLangRef.current = newLang;
      setRooms((prev) => prev.map((r) => ({ ...r, [langField]: newLang })));
    } catch (err) {
      console.error('Failed to persist language preference:', err);
    }
  };

  useEffect(() => {
    setMounted(true);
    initChatSession();

    // 1. Realtime Messages Socket
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

    // 2. Realtime Rooms Socket
    const roomChannel = supabase
      .channel('public:chat_rooms_page_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_rooms' },
        async () => {
          if (userRef.current) {
            await fetchChatRoomsAndInit(userRef.current, userRoleRef.current);
            if (activeRoomIdRef.current) {
              refreshRoomTranslations(activeRoomIdRef.current);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [paramProductId, paramCompany, paramTitle, paramSellerId, paramBuyerId, paramRfqId, paramRfqTitle]);

  useEffect(() => {
    if (!activeRoomId) return;
    refreshRoomTranslations(activeRoomId);
  }, [activeRoomId, targetLang]);

  const refreshRoomTranslations = async (roomId) => {
    const room = roomsRef.current.find((r) => r.id === roomId);
    const role = userRoleRef.current;
    const myLang = targetLangRef.current;
    const opponentLang = getOpponentLang(room, role);
    const currentMsgs = roomMessagesMapRef.current[roomId] || [];

    if (currentMsgs.length === 0) return;

    const translatedList = await Promise.all(
      currentMsgs.map(async (msg) => {
        if (!msg.message) return msg;
        const isMine = msg.sender_role === role;
        const destLang = isMine ? opponentLang : myLang;
        if (msg._translatedFor === destLang) return msg;
        const trans = await translateTextWithApi(msg.message, destLang);
        return { ...msg, translated_message: trans, _translatedFor: destLang };
      })
    );

    setRoomMessagesMap((prev) => ({
      ...prev,
      [roomId]: translatedList,
    }));
  };

  const handleRealtimeMessageReceived = async (newMsg) => {
    const role = userRoleRef.current;
    const myLang = targetLangRef.current;
    const room = roomsRef.current.find((r) => r.id === newMsg.room_id);
    const isMine = newMsg.sender_role === role;
    const destLang = isMine ? getOpponentLang(room, role) : myLang;

    const trans = newMsg.message ? await translateTextWithApi(newMsg.message, destLang) : '';
    const msgWithTrans = { ...newMsg, translated_message: trans, _translatedFor: destLang };

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
    refreshRoomTranslations(newMsg.room_id);
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

  // 바이어 프로필 담당자 실명(contact_person) 및 회사명(company_name) 정밀 바인딩
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
        const buyerUserIds = currentRoomsList.map((r) => r.buyer_id).filter(Boolean);

        if (buyerUserIds.length > 0) {
          // `buyers` is the table actually populated at signup (buyer_name, company_name).
          // `buyer_profiles` has no personal-name column — only an optional company_name override.
          const { data: rawBuyers } = await supabase
            .from('buyers')
            .select('auth_user_id, buyer_name, company_name')
            .in('auth_user_id', buyerUserIds);

          const { data: buyerProfiles } = await supabase
            .from('buyer_profiles')
            .select('auth_user_id, company_name')
            .in('auth_user_id', buyerUserIds);

          const profileMap = {};
          const companyMap = {};

          (rawBuyers || []).forEach((b) => {
            if (b.buyer_name) profileMap[b.auth_user_id] = b.buyer_name;
            if (b.company_name) companyMap[b.auth_user_id] = b.company_name;
          });

          (buyerProfiles || []).forEach((p) => {
            if (p.company_name) companyMap[p.auth_user_id] = p.company_name;
          });

          currentRoomsList = currentRoomsList.map((r) => ({
            ...r,
            buyer_profile_name: profileMap[r.buyer_id] || companyMap[r.buyer_id] || r.buyer_name || 'Not specified',
            buyer_company_name: companyMap[r.buyer_id] || ''
          }));
        }

        // Keep seller company names fresh too (mirrors the buyer lookup above),
        // so a buyer viewing the room always sees the seller's current company name.
        const sellerUserIds = currentRoomsList.map((r) => r.seller_id).filter(Boolean);
        if (sellerUserIds.length > 0) {
          const { data: sellerCompanies } = await supabase
            .from('companies')
            .select('user_id, company_name_en, company_name')
            .in('user_id', sellerUserIds);

          const sellerNameMap = {};
          (sellerCompanies || []).forEach((c) => {
            sellerNameMap[c.user_id] = c.company_name_en || c.company_name;
          });

          currentRoomsList = currentRoomsList.map((r) => ({
            ...r,
            seller_profile_name: sellerNameMap[r.seller_id] || r.seller_name || r.company_name || 'Korean Manufacturer'
          }));
        }

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

          const prevMap = roomMessagesMapRef.current;
          Object.keys(map).forEach((rid) => {
            const prevMsgs = prevMap[rid];
            if (!prevMsgs) return;
            map[rid] = map[rid].map((msg) => {
              const prevMatch = prevMsgs.find(
                (pm) => pm.id === msg.id || (pm.created_at === msg.created_at && pm.sender_role === msg.sender_role)
              );
              return prevMatch ? { ...msg, translated_message: prevMatch.translated_message, _translatedFor: prevMatch._translatedFor } : msg;
            });
          });

          setRoomMessagesMap(map);

          currentRoomsList = currentRoomsList.map((r) => ({
            ...r,
            unread_count: unreadMap[r.id] || 0
          }));
        }
      }

      // Direct URL Parameters — two directions: a buyer messaging a seller (company/title/sellerId),
      // or a seller messaging a buyer (buyerId, from a buyer profile or an RFQ listing).
      if (paramBuyerId) {
        const targetBuyerId = paramBuyerId;
        const rfqProductTitle = paramTitle
          ? decodeURIComponent(paramTitle)
          : (paramRfqTitle ? decodeURIComponent(paramRfqTitle) : 'Sourcing Inquiry');

        let matchedRoom = currentRoomsList.find(
          (r) => r.buyer_id === targetBuyerId || r.buyer_id === targetBuyerId?.toString()
        );

        if (!matchedRoom) {
          // Resolve our own (seller's) company name
          const { data: myCompany } = await supabase
            .from('companies')
            .select('company_name_en, company_name')
            .eq('user_id', userIdStr)
            .maybeSingle();
          const meta = currentUserObj.user_metadata || {};
          const mySellerName = myCompany?.company_name_en || myCompany?.company_name || meta.company_name_en || meta.company_name || 'Korean Manufacturer';

          // Resolve the target buyer's name — `buyers` is the reliable source (buyer_name is
          // required at signup); `buyer_profiles` only has an optional company_name override.
          let buyerDisplayName = paramCompany ? decodeURIComponent(paramCompany) : '';
          if (!buyerDisplayName) {
            const { data: buyerRow } = await supabase
              .from('buyers')
              .select('buyer_name, company_name')
              .eq('auth_user_id', targetBuyerId)
              .maybeSingle();
            const { data: buyerProf } = await supabase
              .from('buyer_profiles')
              .select('company_name')
              .eq('auth_user_id', targetBuyerId)
              .maybeSingle();
            buyerDisplayName = buyerProf?.company_name || buyerRow?.company_name || buyerRow?.buyer_name || 'Not specified';
          }

          const newRoomPayload = {
            product_id: paramRfqId ? null : (paramProductId ? paramProductId.toString() : null),
            product_title: rfqProductTitle,
            buyer_id: targetBuyerId,
            buyer_name: buyerDisplayName,
            seller_id: userIdStr,
            seller_name: mySellerName,
            seller_lang: 'ko',
            buyer_lang: 'en',
            last_message: 'Inquiry initialized.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: createdRoomData, error: createError } = await supabase
            .from('chat_rooms')
            .insert([newRoomPayload])
            .select();

          if (createError) {
            console.error('Failed to create chat room from RFQ:', createError);
            alert('Failed to start the chat. Please try again: ' + createError.message);
          } else if (createdRoomData && createdRoomData.length > 0) {
            matchedRoom = { ...createdRoomData[0], unread_count: 0, buyer_profile_name: buyerDisplayName };
            currentRoomsList = [matchedRoom, ...currentRoomsList];

            const initialMsgText = `Hello! We saw your sourcing request${rfqProductTitle ? ` for [${rfqProductTitle}]` : ''} and would like to offer our products. Could we discuss your requirements?`;
            const initialTrans = await translateTextWithApi(initialMsgText, matchedRoom.buyer_lang || 'en');

            const initialMsg = {
              room_id: matchedRoom.id,
              sender_id: userIdStr,
              sender_role: 'seller',
              message: initialMsgText,
              translated_message: initialTrans,
              is_quote: false,
              is_read: false,
              created_at: new Date().toISOString()
            };

            await supabase.from('chat_messages').insert([initialMsg]);
            setRoomMessagesMap((prev) => ({
              ...prev,
              [matchedRoom.id]: [{ ...initialMsg, _translatedFor: matchedRoom.buyer_lang || 'en' }]
            }));
          }
        }

        if (matchedRoom) {
          setActiveRoomId(matchedRoom.id);
          await markRoomMessagesAsRead(matchedRoom.id, currentRole);
        }
      } else if (paramCompany || paramTitle) {
        const companyTitle = paramTitle ? decodeURIComponent(paramTitle) : 'Export Product Inquiry';
        const companySeller = paramCompany ? decodeURIComponent(paramCompany) : 'Not specified';

        let matchedRoom = currentRoomsList.find(
          (r) => (r.product_title === companyTitle || r.title === companyTitle) &&
                 (r.seller_name === companySeller || r.seller_id === paramSellerId)
        );

        if (!matchedRoom) {
          const targetSellerIdPayload = paramSellerId && paramSellerId.trim() !== '' ? paramSellerId : 'seller_default';

          // 바이어 실명/회사명이 없으면 채팅을 시작할 수 없음 — 이메일 앞부분 같은
          // 대체값을 셀러에게 보여주지 않기 위해, 프로필 미입력 시 여기서 막고
          // 입력 페이지로 유도한다 (CLAUDE.md 규칙: 이메일로 이름 대체 금지).
          const { data: myBuyerRow } = await supabase
            .from('buyers')
            .select('buyer_name, company_name')
            .eq('auth_user_id', userIdStr)
            .maybeSingle();
          const { data: myBuyerProfile } = await supabase
            .from('buyer_profiles')
            .select('company_name')
            .eq('auth_user_id', userIdStr)
            .maybeSingle();

          const myBuyerName = myBuyerProfile?.company_name || myBuyerRow?.company_name || myBuyerRow?.buyer_name || '';

          if (!myBuyerName) {
            const goToProfile = window.confirm(
              '셀러와 대화를 시작하려면 먼저 이름 또는 회사명을 등록해야 해요.\n지금 정보를 입력하러 가시겠습니까?'
            );
            if (goToProfile) {
              router.push('/buyer/profile');
            } else {
              router.replace('/chat');
            }
            setRooms(currentRoomsList);
            return;
          }

          const newRoomPayload = {
            product_id: paramProductId ? paramProductId.toString() : null,
            product_title: companyTitle,
            buyer_id: userIdStr,
            buyer_name: myBuyerName,
            seller_id: targetSellerIdPayload,
            seller_name: companySeller,
            seller_lang: 'ko',
            buyer_lang: getSiteTranslateLang('en'),
            last_message: `Inquiry initialized.`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: createdRoomData, error: createError } = await supabase
            .from('chat_rooms')
            .insert([newRoomPayload])
            .select();

          if (createError) {
            console.error('Failed to create chat room from company page:', createError);
            alert('Failed to start the chat. Please try again: ' + createError.message);
          } else if (createdRoomData && createdRoomData.length > 0) {
            matchedRoom = { ...createdRoomData[0], unread_count: 0 };
            currentRoomsList = [matchedRoom, ...currentRoomsList];

            const initialMsgText = `Hello! I am inquiring about [${companyTitle}] from ${companySeller}. Could you please share the FOB pricing and official catalog?`;
            const initialTrans = await translateTextWithApi(initialMsgText, matchedRoom.seller_lang || 'ko');

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
              [matchedRoom.id]: [{ ...initialMsg, _translatedFor: matchedRoom.seller_lang || 'ko' }]
            }));

            // 셀러에게 "새 문의가 왔어요" 이메일 알림 — 실패해도 채팅 자체엔 영향 없음
            if (targetSellerIdPayload !== 'seller_default') {
              fetch('/api/notify/new-inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sellerId: targetSellerIdPayload,
                  buyerName: myBuyerName,
                  productTitle: companyTitle
                })
              }).catch(() => {});
            }
          }
        }

        if (matchedRoom) {
          setActiveRoomId(matchedRoom.id);
          await markRoomMessagesAsRead(matchedRoom.id, currentRole);
        }
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

  const handleDeleteRoom = async (roomId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/chat/delete-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roomId })
      });
      if (!res.ok) throw new Error('Failed to delete chat room');

      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      setRoomMessagesMap((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
      if (activeRoomId === roomId) setActiveRoomId(null);
      window.dispatchEvent(new Event('klick_unread_chat_updated'));
    } catch (e) {
      console.error('Failed to delete chat room:', e);
      alert('Failed to delete this chat. Please try again.');
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

    try {
      const room = roomsRef.current.find((r) => r.id === targetRoomId);
      const opponentLang = getOpponentLang(room, userRoleRef.current);
      const autoTrans = text ? await translateTextWithApi(text, opponentLang) : '';

      const newMsgPayload = {
        room_id: targetRoomId,
        sender_id: user?.id ? user.id.toString() : 'guest_user',
        sender_role: userRole,
        message: text,
        translated_message: autoTrans,
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
            [targetRoomId]: [...roomMsgs, { ...insertedMsg, _translatedFor: opponentLang }],
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

      refreshRoomTranslations(targetRoomId);
    } catch (err) {
      console.error('DB Insert error:', err);
    }
  };

  // 품명(Product Name) 포함 견적서 전송
  const handleSendQuote = async () => {
    if (!activeRoomId) return;
    if (!quotePrice || Number.isNaN(Number(quotePrice)) || Number(quotePrice) <= 0) {
      alert('Please enter a valid unit price.');
      return;
    }

    try {
      const activeRoomObj = roomsRef.current.find(r => r.id === activeRoomId);
      const targetProdName = quoteProductName || activeRoomObj?.product_title || activeRoomObj?.title || '';
      const opponentLang = getOpponentLang(activeRoomObj, 'seller');

      const quoteMsgText = `[Official B2B Quotation Sent] ${quoteNote}`;
      const quoteMsgTrans = await translateTextWithApi(quoteMsgText, opponentLang);

      const quoteMsgPayload = {
        room_id: activeRoomId,
        sender_id: user?.id ? user.id.toString() : 'guest_seller',
        sender_role: 'seller',
        product_name: targetProdName,
        message: quoteMsgText,
        translated_message: quoteMsgTrans,
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

  const handleRespondToQuote = async (quoteMsg, room, accepted) => {
    const responseText = accepted
      ? `We accept this quotation (${quoteMsg.quote_price}, MOQ ${quoteMsg.quote_moq}). Let's proceed with the next steps.`
      : `We would like to decline this quotation. Could we discuss adjusted terms?`;
    await handleSendMessage(room.id, responseText, null);
  };

  const handleOpenDocModal = (msg, room) => {
    setSelectedMsgForDoc(msg);
    setSelectedRoomForDoc(room);
    setIsQuoteDocModalOpen(true);
  };

  // Post a generated trade document (PI/CI/PL/BL) into the chat thread so the other party can view it
  const handleSendDocument = async (room, docSnapshot, summaryText) => {
    try {
      const opponentLang = getOpponentLang(room, userRoleRef.current);
      const summaryTrans = await translateTextWithApi(summaryText, opponentLang);

      const docMsgPayload = {
        room_id: room.id,
        sender_id: user?.id ? user.id.toString() : 'guest_seller',
        sender_role: userRoleRef.current,
        message: summaryText,
        translated_message: summaryTrans,
        is_quote: false,
        is_read: false,
        file: { type: 'trade_doc', ...docSnapshot },
        created_at: new Date().toISOString()
      };

      const { data: insertedDocMsg } = await supabase
        .from('chat_messages')
        .insert([docMsgPayload])
        .select()
        .single();

      if (insertedDocMsg) {
        setRoomMessagesMap((prevMap) => ({
          ...prevMap,
          [room.id]: [...(prevMap[room.id] || []), insertedDocMsg],
        }));
      }

      await supabase
        .from('chat_rooms')
        .update({ last_message: `📄 ${summaryText}`, updated_at: new Date().toISOString() })
        .eq('id', room.id);

      setRooms((prevRooms) =>
        prevRooms.map((r) =>
          r.id === room.id ? { ...r, last_message: `📄 ${summaryText}`, updated_at: new Date().toISOString() } : r
        )
      );
    } catch (err) {
      console.error('Failed to send trade document:', err);
    }
  };

  const handleOpenSampleModal = (room, msg = null) => {
    setSelectedRoomForSample(room);
    setSelectedTrackingMsg(msg);
    setIsSampleModalOpen(true);
  };

  const handleUpdateTracking = async (roomId, courier, trackingNo) => {
    setRooms((prevRooms) =>
      prevRooms.map((r) => (r.id === roomId ? { ...r, courier, tracking_no: trackingNo } : r))
    );

    // Post the shipping update into the chat thread so the buyer sees it as a message
    try {
      const room = roomsRef.current.find((r) => r.id === roomId);
      const opponentLang = getOpponentLang(room, 'seller');
      const trackingText = `[Shipping Update] ${courier} — Tracking No: ${trackingNo}`;
      const trackingTrans = await translateTextWithApi(trackingText, opponentLang);

      const trackingMsgPayload = {
        room_id: roomId,
        sender_id: user?.id ? user.id.toString() : 'guest_seller',
        sender_role: 'seller',
        message: trackingText,
        translated_message: trackingTrans,
        is_quote: false,
        is_read: false,
        file: { type: 'tracking', courier, trackingNo },
        created_at: new Date().toISOString()
      };

      const { data: insertedTrackingMsg } = await supabase
        .from('chat_messages')
        .insert([trackingMsgPayload])
        .select()
        .single();

      if (insertedTrackingMsg) {
        setRoomMessagesMap((prevMap) => ({
          ...prevMap,
          [roomId]: [...(prevMap[roomId] || []), insertedTrackingMsg],
        }));
      }

      await supabase
        .from('chat_rooms')
        .update({ last_message: `📦 Shipping update: ${courier}`, updated_at: new Date().toISOString() })
        .eq('id', roomId);

      setRooms((prevRooms) =>
        prevRooms.map((r) =>
          r.id === roomId ? { ...r, last_message: `📦 Shipping update: ${courier}`, updated_at: new Date().toISOString() } : r
        )
      );
    } catch (err) {
      console.error('Failed to post tracking message:', err);
    }

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
      // ponytail: no fallback number — a guessed amount here would render as a
      // real "Agreed price" in OfflineDealModal and could get wired to.
      amount: msg.quote_price ? msg.quote_price.split(' ')[0] : '',
      title: room.product_title || room.title,
      sellerCompany: room.seller_name || room.company_name,
    });
    setIsPaymentModalOpen(true);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-16 antialiased">
      <Header />

      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-4">
        <div className="bg-[#0F172A] text-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" /> <Klick /> Direct Chat
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
                onRespondToQuote={handleRespondToQuote}
                onDeleteRoom={handleDeleteRoom}
              />
            ))}
          </div>
        )}
      </main>

      {/* Quotation Modal (예시 문장 전면 제거) */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 my-8">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Create Official Wholesale Quotation
              </h3>
              <p className="text-xs text-slate-500 mt-1">Please enter product name, unit price, MOQ, and terms for the buyer.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={quoteProductName}
                  onChange={(e) => setQuoteProductName(e.target.value)}
                  placeholder=""
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    placeholder=""
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Order (MOQ)</label>
                  <input
                    type="text"
                    value={quoteMoq}
                    onChange={(e) => setQuoteMoq(e.target.value)}
                    placeholder=""
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shipping Terms & Notes</label>
                <textarea
                  rows={3}
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  placeholder=""
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
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

      {/* Trade Document Generator Modal */}
      <TradeDocModal
        isOpen={isDocModalOpen}
        onClose={() => setIsQuoteDocModalOpen(false)}
        msg={selectedMsgForDoc}
        room={selectedRoomForDoc}
        userRole={userRole}
        onSendDocument={handleSendDocument}
      />

      <SampleTrackingModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        room={selectedRoomForSample}
        trackingMsg={selectedTrackingMsg}
        userRole={userRole}
        onUpdateTracking={handleUpdateTracking}
      />

      {isPaymentModalOpen && (
        <OfflineDealModal
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
            <span>Loading <Klick /> Real-time AI Chat Hub...</span>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}