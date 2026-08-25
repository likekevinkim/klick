// app/api/rfq/increment-quote-count/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// RFQ의 quote_count +1 전용 서버 라우트.
// 이 값은 셀러가 견적서를 제출할 때 올라가는데, public_rfqs RLS를 "글쓴 바이어
// 본인만 수정 가능"으로 제한하면 셀러(글쓴이 아님)는 더 이상 anon 키로 이 컬럼을
// 못 올리게 되므로, 서비스 롤 키로 서버에서 이 컬럼 하나만 증가시켜준다.
export async function POST(request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ skipped: true });

    const { rfqId } = await request.json().catch(() => ({}));
    if (!rfqId) return NextResponse.json({ skipped: true });

    const { data: rfq } = await supabaseAdmin
      .from('public_rfqs')
      .select('quote_count')
      .eq('id', rfqId)
      .maybeSingle();

    if (!rfq) return NextResponse.json({ skipped: true });

    const { error } = await supabaseAdmin
      .from('public_rfqs')
      .update({ quote_count: (rfq.quote_count || 0) + 1 })
      .eq('id', rfqId);
    if (error) return NextResponse.json({ skipped: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('quote count increment error:', err);
    return NextResponse.json({ skipped: true });
  }
}
