// app/api/admin/buyer-chat-counts/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ADMIN_EMAILS } from '@/lib/adminEmails';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user?.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { buyerIds } = await request.json();
    if (!Array.isArray(buyerIds) || buyerIds.length === 0) {
      return NextResponse.json({ counts: {} });
    }

    const { data, error } = await supabaseAdmin
      .from('chat_rooms')
      .select('buyer_id')
      .in('buyer_id', buyerIds);
    if (error) throw error;

    const counts = {};
    (data || []).forEach((r) => { counts[r.buyer_id] = (counts[r.buyer_id] || 0) + 1; });

    return NextResponse.json({ counts });
  } catch (err) {
    console.error('buyer-chat-counts error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
