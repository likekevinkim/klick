// app/api/auth/send-otp/route.js
import { NextResponse } from 'next/server';
import { signOtpSession, verifyOtpSession } from '@/lib/otpSession';

export const runtime = 'nodejs';

const RESEND_COOLDOWN_MS = 60 * 1000;

export async function POST(request) {
  try {
    // 0. 재전송 쿨다운: 이전 OTP 세션이 60초 이내에 발급됐으면 재발송 거부
    const existingSession = verifyOtpSession(request.cookies.get('klick_otp_session')?.value);
    if (existingSession) {
      const issuedAt = existingSession.expiresAt - 10 * 60 * 1000;
      const msSinceIssued = Date.now() - issuedAt;
      if (msSinceIssued < RESEND_COOLDOWN_MS) {
        const waitSec = Math.ceil((RESEND_COOLDOWN_MS - msSinceIssued) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSec} seconds before requesting another code.` },
          { status: 429 }
        );
      }
    }

    // 1. Vercel 환경 변수 추출 및 공백/따옴표 안전 정제
    const rawApiKey = process.env.RESEND_API_KEY || '';
    const apiKey = rawApiKey.replace(/["'\r\n]/g, '').trim();

    const keyPreview = apiKey ? `${apiKey.substring(0, 5)}...` : 'EMPTY';

    if (!apiKey) {
      console.error('RESEND_API_KEY is not defined in environment variables.');
      return NextResponse.json(
        { error: 'Server configuration error: RESEND_API_KEY is missing in environment variables.' },
        { status: 500 }
      );
    }

    // 2. 요청 바디 데이터 파싱
    const body = await request.json().catch(() => ({}));
    const email = body?.email;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // 3. 6자리 RANDOM OTP 생성
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10분 유효

    // 4. Resend Direct REST API 직접 호출 (글로벌 표준 영문 이메일 템플릿)
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'KLICK B2B <noreply@true-k.net>',
        to: [email],
        subject: `[KLICK B2B] Verification Code: ${generatedOtp}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="margin-bottom: 24px;">
              <span style="background-color: #eff6ff; color: #1d4ed8; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; border: 1px solid #bfdbfe;">
                KLICK Global B2B Network
              </span>
            </div>
            
            <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.5px;">
              Email Verification
            </h2>
            
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              Thank you for registering with KLICK B2B Network. Please enter the following 6-digit verification code on the registration page to complete your account verification:
            </p>
            
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 24px; border-radius: 12px; text-align: center; margin: 28px 0;">
              <span style="font-family: monospace, Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb;">
                ${generatedOtp}
              </span>
            </div>
            
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 8px;">
              • This code is valid for <strong>10 minutes</strong>.<br />
              • If you did not request this verification, please safely ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0 24px 0;" />
            
            <p style="color: #94a3b8; font-size: 11px; text-align: center;">
              © ${new Date().getFullYear()} KLICK Global B2B Network. All rights reserved.
            </p>
          </div>
        `
      })
    });

    const resendResult = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      console.error('Resend REST API Error Response:', resendResult);

      const errorMessage = resendResult?.message || 'Failed to communicate with Resend API.';

      if (errorMessage.includes('only send testing emails')) {
        return NextResponse.json(
          { error: 'Resend Sandbox Restriction: Testing emails can only be sent to truek.work@gmail.com until domain session is fully propagated.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Email delivery failed [Reason: ${errorMessage} / Key: ${keyPreview}]` },
        { status: 500 }
      );
    }

    // 5. 서버리스 메모리 소실 방지를 위한 보안 쿠키 생성
    const response = NextResponse.json({
      success: true,
      message: 'Verification code has been sent to your email address.'
    });

    const sessionPayload = signOtpSession({
      email,
      code: generatedOtp,
      expiresAt,
      attempts: 0
    });

    response.cookies.set('klick_otp_session', sessionPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600, // 10분
      path: '/'
    });

    return response;
  } catch (err) {
    console.error('Send OTP Handler Exception Dump:', err);
    return NextResponse.json(
      { error: `Internal Server Error: ${err?.message || String(err)}` },
      { status: 500 }
    );
  }
}