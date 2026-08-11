// app/api/auth/send-otp/route.js
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      console.error('RESEND_API_KEY is missing or invalid in environment variables.');
      return NextResponse.json(
        { error: '서버 환경 변수(RESEND_API_KEY) 설정이 누락되었습니다. .env.local 파일을 확인해 주세요.' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const body = await request.json();
    const email = body?.email;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: '올바른 이메일 주소를 입력해 주세요.' },
        { status: 400 }
      );
    }

    // 6자리 랜덤 숫자 OTP 생성
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10분 유효기간

    // Resend Direct SDK 발송 요청
    const { data, error } = await resend.emails.send({
      from: 'KLICK B2B <onboarding@resend.dev>',
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
      
      // Resend 테스트 모드 제한 에러 처리
      if (error.message && error.message.includes('only send testing emails')) {
        return NextResponse.json(
          { error: 'Resend 무료 테스트 모드 제한: 현재는 Resend 계정 가입 이메일(truek.work@gmail.com)로만 테스트 메일 발송이 가능합니다. 해당 이메일 주소를 입력해 주세요!' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `메일 발송 실패: ${error.message}` },
        { status: 500 }
      );
    }

    // 서버리스 메모리 소실 방지를 위한 보안 쿠키 생성
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
    console.error('Send OTP Route Handler Exception:', err);
    return NextResponse.json(
      { error: `서버 내부 오류: ${err.message || '알 수 없는 에러'}` },
      { status: 500 }
    );
  }
}