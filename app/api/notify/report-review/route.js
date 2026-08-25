// app/api/notify/report-review/route.js
import { NextResponse } from 'next/server';
import { ADMIN_EMAILS } from '@/lib/adminEmails';

export const runtime = 'nodejs';

// 리뷰 신고를 받으면 관리자에게 이메일로 알린다 — 새 테이블 없이
// app/api/notify/new-inquiry의 이메일 알림 패턴을 그대로 재사용.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { productId, productTitle, reviewId, reviewComment, reporterName, reason } = body || {};

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    const rawApiKey = process.env.RESEND_API_KEY || '';
    const apiKey = rawApiKey.replace(/["'\r\n]/g, '').trim();
    if (!apiKey) {
      return NextResponse.json({ skipped: true });
    }

    const safeReporter = (reporterName || 'A buyer').toString().slice(0, 120);
    const safeReason = (reason || 'No reason given').toString().slice(0, 500);
    const safeComment = (reviewComment || '').toString().slice(0, 500);
    const safeProductTitle = (productTitle || 'a product').toString().slice(0, 160);

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'KLICK B2B <noreply@klick.biz>',
        to: ADMIN_EMAILS,
        subject: `[KLICK B2B] Review reported on: ${safeProductTitle}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px;">A review was reported</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              <strong>${safeReporter}</strong> reported a review on <strong>${safeProductTitle}</strong>.
            </p>
            <p style="color: #475569; font-size: 13px; margin-top: 12px;"><strong>Reason:</strong> ${safeReason}</p>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;">"${safeComment}"</p>
            <a href="https://${request.headers.get('host') || 'klick'}/products/${productId || ''}" style="display:inline-block; margin-top: 16px; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px;">
              View Product Page
            </a>
          </div>
        `
      })
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('report-review notification error:', err);
    return NextResponse.json({ skipped: true });
  }
}
