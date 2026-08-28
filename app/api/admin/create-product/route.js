// app/api/admin/create-product/route.js
// Admin adds a product on behalf of a seller (targetUserId), bypassing RLS
// via the service-role client since the caller isn't that seller's own session.
// The request body is the exact same `payload` object ProductFormModal.jsx
// builds for a normal seller submit, plus targetUserId.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminRequest } from '@/lib/verifyAdmin';

export async function POST(request) {
  const { error: authError, status } = await verifyAdminRequest(request);
  if (authError) return NextResponse.json({ error: authError }, { status });

  try {
    const { targetUserId, ...payload } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId가 필요합니다.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([{ ...payload, user_id: targetUserId, created_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ product: data });
  } catch (err) {
    console.error('admin create-product error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
