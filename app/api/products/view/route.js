// app/api/products/view/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// 상품 조회수 +1 전용 서버 라우트.
// products RLS의 UPDATE를 "본인 상품만" 으로 제한하면, 방문자(본인 아닌 사람)가
// 조회수를 올리는 이 동작은 anon 키로는 더 이상 불가능해지므로, 서비스 롤 키로
// 서버에서만 딱 이 컬럼 하나만 증가시켜준다.
export async function POST(request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ skipped: true });

    const { productId } = await request.json().catch(() => ({}));
    if (!productId) return NextResponse.json({ skipped: true });

    const { data: product } = await supabaseAdmin
      .from('products')
      .select('view_count')
      .eq('id', productId)
      .maybeSingle();

    if (!product) return NextResponse.json({ skipped: true });

    await supabaseAdmin
      .from('products')
      .update({ view_count: (product.view_count || 0) + 1 })
      .eq('id', productId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('view count increment error:', err);
    return NextResponse.json({ skipped: true });
  }
}
