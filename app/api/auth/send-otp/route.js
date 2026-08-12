// app/api/auth/send-otp/route.js
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs'; // Vercel 런타임 호환성 고정

export async function POST(request) {
  try {
    // 1. 환경 변수 추출 및 공백 제거
    const rawApiKey = process.env.RESEND_API_KEY;
    const apiKey = rawApiKey ? rawApiKey.trim() : '';

    if (!apiKey) {
      console.error('RESEND_API_KEY가 Vercel 환경 변수에 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'Vercel 서버의 RESEND_API_KEY 환경 변수가 비어 있습니다. Vercel Settings에서 등록 후 Redeploy를 진행해 주세요.' },
        { status: 500 }
      );
    }

    // 2. 요청 데이터 파싱
    const body = await request.json().catch(() => ({}));
    const email = body?.email;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: '올바른 이메일 주소를 입력해 주세요.' },
        { status: 400 }
      );
    }

    // 3. 6자리 RANDOM OTP 생성
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10분 유효

    // 4. Resend 인스턴스 안전 생성
    const resend = new Resend(apiKey);

    // 5. Resend 발송 요청 (도메인 승인된 noreply@true-k.net 주소)
    const { data, error } = await resend.emails.send({
      from: 'KLICK B2B <noreply@true-k.net>',
      to: [email],
      subject: `[KLICK B2B] Your 6-Digit Email Verification Code: ${generatedOtp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: bold; margin-bottom: 8px;">KLICK B2B Network</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">Welcome to KLICK B2B Network. Below is your 6-digit email verification code:</p>
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb;">${generatedOtp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Direct Error:', error);

      if (error.message && error.message.includes('only send testing emails')) {
        return NextResponse.json(
          { error: 'Resend 테스트 제한: 도메인 인증 전에는 truek.work@gmail.com 으로만 발송 가능합니다.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Resend 발송 실패 [원인: ${error.message || 'API 세션 연결 거부'}]` },
        { status: 500 }
      );
    }

    // 6. 보안 세션 쿠키 생성 (10분 유효)
    const response = NextResponse.json({
      success: true,
      message: '인증번호가 메일함으로 발송되었습니다.'
    });

    const sessionPayload = Buffer.from(JSON.stringify({
      email: email,
      code: generatedOtp,
      expiresAt: expiresAt
    })).toString('base64');

    response.cookies.set('klick_otp_session', sessionPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600,
      path: '/'
    });

    return response;
  } catch (err) {
    console.error('Send OTP Handler Exception Dump:', err);
    return NextResponse.json(
      { error: `서버 실행 중 예외가 발생했습니다: ${err?.message || String(err)}` },
      { status: 500 }
    );
  }
}