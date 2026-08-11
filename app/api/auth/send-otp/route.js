// app/api/auth/send-otp/route.js
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// 메모리 기반 임시 OTP 저장소 (글로벌 싱글톤 저장)
global.otpStore = global.otpStore || new Map();

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: '올바른 이메일 주소를 입력해 주세요.' },
        { status: 400 }
      );
    }

    // 6자리 랜덤 숫자 OTP 생성
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10분 유효기간

    // OTP 저장소에 세션 저장
    global.otpStore.set(email, {
      code: generatedOtp,
      expiresAt: expiresAt,
      verified: false
    });

    // Resend Direct SDK를 통한 직접 발송
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
      return NextResponse.json(
        { error: `메일 발송 실패: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '인증번호가 메일함으로 발송되었습니다.'
    });
  } catch (err) {
    console.error('Send OTP Route Handler Error:', err);
    return NextResponse.json(
      { error: '서버 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}