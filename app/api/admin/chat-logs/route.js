// app/api/admin/chat-logs/route.js
// Admin-only read of all chat rooms (dispute-resolution evidence), newest first.
// Read-only — no writes here.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminRequest } from '@/lib/verifyAdmin';

export async function GET(request) {
  const { error: authError, status } = await verifyAdminRequest(request);
  if (authError) return NextResponse.json({ error: authError }, { status });

  try {
    const { data, error } = await supabaseAdmin
      .from('chat_rooms')
      .select('id, product_id, product_title, buyer_id, buyer_name, seller_id, seller_name, last_message, updated_at, created_at')
      .order('updated_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ rooms: data || [] });
  } catch (err) {
    console.error('admin chat-logs list error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
