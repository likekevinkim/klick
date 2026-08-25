// app/api/rfq/delete-rfq/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// 바이어가 자신이 올린 공개 RFQ를 삭제한다. 딸린 셀러 견적(rfq_proposals)도
// 함께 지워서 고아 레코드가 남지 않게 한다.
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

    const { rfqId } = await request.json();
    if (!rfqId) {
      return NextResponse.json({ error: 'rfqId is required.' }, { status: 400 });
    }

    const { data: rfq, error: rfqError } = await supabaseAdmin
      .from('public_rfqs')
      .select('id, user_id')
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq) {
      return NextResponse.json({ error: 'RFQ not found.' }, { status: 404 });
    }
    if (rfq.user_id !== userId) {
      return NextResponse.json({ error: 'Not the owner of this RFQ.' }, { status: 403 });
    }

    const { error: proposalsError } = await supabaseAdmin.from('rfq_proposals').delete().eq('rfq_id', rfqId);
    if (proposalsError) {
      return NextResponse.json({ error: 'Failed to delete linked quotes.' }, { status: 500 });
    }

    const { error: deleteError } = await supabaseAdmin.from('public_rfqs').delete().eq('id', rfqId);
    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete RFQ.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete RFQ failed:', err);
    return NextResponse.json({ error: 'Failed to delete RFQ.' }, { status: 500 });
  }
}
