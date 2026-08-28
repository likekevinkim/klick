// app/api/admin/chat-logs/[roomId]/route.js
// Admin-only read of every message in one chat room, oldest first (evidence
// timeline for dispute resolution). Read-only — no delete/update endpoint.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminRequest } from '@/lib/verifyAdmin';

export async function GET(request, { params }) {
  const { error: authError, status } = await verifyAdminRequest(request);
  if (authError) return NextResponse.json({ error: authError }, { status });

  try {
    const { roomId } = await params;

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    return NextResponse.json({ messages: data || [] });
  } catch (err) {
    console.error('admin chat-logs detail error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
