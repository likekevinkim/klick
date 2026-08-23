// app/api/chat/delete-room/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// 채팅방을 완전히 종료(삭제)한다. buyer_id/seller_id 둘 중 하나라도 요청자와
// 일치해야만 삭제를 허용 — 클라이언트가 보낸 roomId만 믿지 않고 서버에서
// 실제 참여자인지 재확인한다.
export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    const userId = userData?.user?.id;
    if (userError || !userId) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { roomId } = await request.json();
    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required.' }, { status: 400 });
    }

    const { data: room, error: roomError } = await supabaseAdmin
      .from('chat_rooms')
      .select('id, buyer_id, seller_id')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Chat room not found.' }, { status: 404 });
    }
    if (room.buyer_id !== userId && room.seller_id !== userId) {
      return NextResponse.json({ error: 'Not a participant in this chat room.' }, { status: 403 });
    }

    await supabaseAdmin.from('chat_messages').delete().eq('room_id', roomId);
    await supabaseAdmin.from('chat_rooms').delete().eq('id', roomId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete chat room failed:', err);
    return NextResponse.json({ error: 'Failed to delete chat room.' }, { status: 500 });
  }
}
