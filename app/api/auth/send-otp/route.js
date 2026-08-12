// app/api/auth/send-otp/route.js
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    // 1. Vercel 환경 변수 추출 및 공백/따옴표 제거
    const rawApiKey = process.env.RESEND_API_KEY || '';
    const apiKey = rawApiKey.replace(/["'\r\n]/g, '').trim();

    const keyPreview = apiKey ? `${apiKey.substring(0, 5)}...` : 'EMPTY';

    if (!apiKey) {
      console.error('RESEND_API_KEY가 Vercel 환경 변수에 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'Vercel 서버의 RESEND_API_KEY 환경 변수가 설정되지 않았습니다. Resend에서 Full Access 키 생성 후 Vercel Settings에 등록하고 Redeploy를 진행해 주세요.' },
        { status: 500 }
      );
    }

    // 2. 요청 바디 데이터 파싱
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

    // 4. 대표님 도메인(true-k.net)을 이용한 Resend Direct REST API 호출
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
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
        `
      })
    });

    const resendResult = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      console.error('Resend REST API Error Response:', resendResult);

      const errorMessage = resendResult?.message || 'Resend API 세션 연결 거부';

      return NextResponse.json(
        { error: `Resend 발송 실패 [원인: ${errorMessage} / 인식된 Key: ${keyPreview}]` },
        { status: 500 }
      );
    }

    // 5. 서버리스 메모리 소실 방지를 위한 보안 쿠키 생성
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
      maxAge: 600, // 10분
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