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
      // TEMP DIAGNOSTIC: no Authorization header reached the server at all.
      console.error('[delete-account] no bearer token in request');
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    const userId = userData?.user?.id;
    if (userError || !userId) {
      // TEMP DIAGNOSTIC: decode the JWT payload (no signature check, no
      // secrets involved) to see if it's expired vs simply invalid/wrong-project.
      let decoded = null;
      try {
        const payload = token.split('.')[1];
        decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
      } catch {}
      console.error('[delete-account] auth.getUser failed:', {
        message: userError?.message,
        status: userError?.status,
        exp: decoded?.exp,
        now: Math.floor(Date.now() / 1000),
        expired: decoded?.exp ? decoded.exp < Math.floor(Date.now() / 1000) : null,
        iss: decoded?.iss,
      });
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    // 로그인 계정 자체는 지우지 않는다 — 회사 정보/상품만 지우고, 계정은 살려서
    // 같은 계정으로 다시 회사 정보를 새로 등록할 수 있게 한다. 로그인까지 완전히
    // 지우는 "회원 탈퇴"는 별도 기능으로 계정 설정 쪽에서 다뤄야 함.
    //
    // supabase-js delete()는 실패해도 throw하지 않고 { error }만 돌려주므로,
    // 반드시 확인해야 한다 (예: 다른 테이블의 외래키가 이 행을 참조 중이면
    // 삭제가 조용히 실패하는데, 이걸 체크 안 하면 "성공"이라고 응답해버림).
    const { error: productsError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('user_id', userId);
    if (productsError) {
      console.error('[delete-account] products delete failed:', productsError.message);
      return NextResponse.json({ error: `Failed to delete products: ${productsError.message}` }, { status: 500 });
    }

    const { error: companyError } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('user_id', userId);
    if (companyError) {
      console.error('[delete-account] company delete failed:', companyError.message);
      return NextResponse.json({ error: `Failed to delete company: ${companyError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete seller account failed:', err);
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 });
  }
}
