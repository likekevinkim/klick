// app/api/seller/delete-account/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// 셀러가 "회사 정보 전체 삭제"를 누르면 호출됨. 클라이언트가 보낸 user_id를
// 그대로 믿지 않고, Authorization 헤더의 access token으로 실제 로그인된
// 사용자를 서버에서 다시 확인한 뒤 그 사람 소유의 데이터만 지운다.
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

    await supabaseAdmin.from('products').delete().eq('user_id', userId);
    await supabaseAdmin.from('companies').delete().eq('user_id', userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete seller account failed:', err);
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 });
  }
}
