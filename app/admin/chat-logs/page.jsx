// app/admin/chat-logs/page.jsx
// Read-only admin view of chat rooms + their full message history — the
// primary evidence trail for buyer/seller disputes since KLICK never
// touches the actual payment/settlement.
'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Loader2, Search, ArrowLeft, Tag, Paperclip } from 'lucide-react';
import { supabase } from '@/lib/supabase';

async function callAdminApi(path) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${session?.access_token || ''}` }
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `요청 실패 (${res.status})`);
  return json;
}

export default function AdminChatLogsPage() {
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [search, setSearch] = useState('');

  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { rooms } = await callAdminApi('/api/admin/chat-logs');
        setRooms(rooms || []);
      } catch (err) {
        console.error('Failed to load chat rooms:', err);
      } finally {
        setLoadingRooms(false);
      }
    })();
  }, []);

  const openRoom = async (room) => {
    setActiveRoom(room);
    setLoadingMessages(true);
    try {
      const { messages } = await callAdminApi(`/api/admin/chat-logs/${room.id}`);
      setMessages(messages || []);
    } catch (err) {
      console.error('Failed to load room messages:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const visibleRooms = rooms.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (r.product_title || '').toLowerCase().includes(q)
      || (r.buyer_name || '').toLowerCase().includes(q)
      || (r.seller_name || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Chat Logs
        </h1>
        <p className="text-xs text-slate-500 mt-1">분쟁 발생 시 증거 확인용 읽기 전용 채팅 로그입니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 방 목록 */}
        <div className={`lg:col-span-4 space-y-3 ${activeRoom ? 'hidden lg:block' : ''}`}>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="상품명 / 바이어 / 셀러 검색"
              className="w-full text-xs focus:outline-none"
            />
          </div>

          {loadingRooms ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading rooms...</p>
            </div>
          ) : visibleRooms.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              No chat rooms found.
            </div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {visibleRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => openRoom(room)}
                  className={`w-full text-left bg-white rounded-2xl border p-3.5 transition cursor-pointer ${
                    activeRoom?.id === room.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <p className="text-xs font-extrabold text-slate-900 truncate">{room.product_title || 'Untitled Inquiry'}</p>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    {room.buyer_name || 'Buyer'} ↔ {room.seller_name || 'Seller'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">{room.last_message || '-'}</p>
                  <p className="text-[10px] text-slate-300 mt-1">
                    {room.updated_at ? new Date(room.updated_at).toLocaleString() : '-'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 메시지 타임라인 */}
        <div className={`lg:col-span-8 ${activeRoom ? '' : 'hidden lg:block'}`}>
          {!activeRoom ? (
            <div className="h-full min-h-[300px] flex items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
              왼쪽에서 채팅방을 선택하세요.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 flex flex-col max-h-[75vh]">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveRoom(null)}
                  className="lg:hidden text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 truncate">{activeRoom.product_title || 'Untitled Inquiry'}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {activeRoom.buyer_name || 'Buyer'} ↔ {activeRoom.seller_name || 'Seller'}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">No messages in this room.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
                        msg.sender_role === 'seller' ? 'ml-0 bg-slate-50 border border-slate-100' : 'ml-auto bg-blue-50 border border-blue-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="font-extrabold text-slate-700 capitalize">{msg.sender_role || 'unknown'}</span>
                        <span className="text-[10px] text-slate-400">{msg.created_at ? new Date(msg.created_at).toLocaleString() : '-'}</span>
                      </div>
                      {msg.is_quote && (
                        <p className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 mb-1">
                          <Tag className="w-3 h-3" /> Quote: {msg.quote_price || '-'} {msg.quote_moq ? `(MOQ ${msg.quote_moq})` : ''}
                        </p>
                      )}
                      <p className="text-slate-800 whitespace-pre-wrap break-words">{msg.message}</p>
                      {msg.translated_message && msg.translated_message !== msg.message && (
                        <p className="text-slate-400 whitespace-pre-wrap break-words mt-1 italic">{msg.translated_message}</p>
                      )}
                      {msg.file && (
                        <p className="inline-flex items-center gap-1 text-[10px] text-blue-600 mt-1">
                          <Paperclip className="w-3 h-3" />
                          {msg.file.type === 'tracking'
                            ? `Tracking: ${msg.file.courier || ''} ${msg.file.trackingNo || ''}`
                            : (msg.file.name || 'Attachment')}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
