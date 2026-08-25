// app/api/notify/new-inquiry/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// 바이어가 셀러에게 첫 채팅을 시작하면 셀러에게 "새 문의가 왔어요" 이메일을 보낸다.
// 셀러의 실제 이메일 주소는 여기서 서버(서비스 롤 키)로만 조회하고, 응답으로는
// 절대 돌려주지 않는다 — 바이어/셀러가 채팅을 건너뛰고 서로 이메일로 직접
// 거래하게 되는 걸 막기 위함 (KLICK의 역할은 채팅으로 연결해주는 것까지).
export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      // 서비스 롤 키가 아직 설정 안 됐으면 알림은 그냥 조용히 건너뜀 (채팅 자체는 정상 동작).
      return NextResponse.json({ skipped: true });
    }

    const body = await request.json().catch(() => ({}));
    const { sellerId, buyerName, productTitle } = body || {};

    if (!sellerId || typeof sellerId !== 'string') {
      return NextResponse.json({ skipped: true });
    }

    const { data: sellerUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(sellerId);
    const sellerEmail = sellerUser?.user?.email;

    if (userError || !sellerEmail) {
      return NextResponse.json({ skipped: true });
    }

    const rawApiKey = process.env.RESEND_API_KEY || '';
    const apiKey = rawApiKey.replace(/["'\r\n]/g, '').trim();
    if (!apiKey) {
      return NextResponse.json({ skipped: true });
    }

    const safeBuyerName = (buyerName || 'A global buyer').toString().slice(0, 120);
    const safeProductTitle = (productTitle || 'your product').toString().slice(0, 160);

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'KLICK B2B <noreply@klick.biz>',
        to: [sellerEmail],
        subject: `[KLICK B2B] New Buyer Inquiry: ${safeProductTitle}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <span style="background-color: #eff6ff; color: #1d4ed8; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; border: 1px solid #bfdbfe;">
              KLICK Global B2B Network
            </span>
            <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 20px 0 12px;">You have a new buyer inquiry</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              <strong>${safeBuyerName}</strong> just sent you a message about <strong>${safeProductTitle}</strong> on KLICK.
            </p>
            <a href="https://${request.headers.get('host') || 'klick'}/chat" style="display:inline-block; margin-top: 16px; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px;">
              Reply in Chat
            </a>
            <p style="color: #94a3b8; font-size: 11px; margin-top: 24px;">
              Reply only inside the KLICK chat so your conversation stays translated and protected.
            </p>
          </div>
        `
      })
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('new-inquiry notification error:', err);
    return NextResponse.json({ skipped: true });
  }
}
