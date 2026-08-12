// app/api/auth/verify-otp/route.js
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body?.email;
    const code = body?.code;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Please enter both email and 6-digit verification code.' },
        { status: 400 }
      );
    }

    // 쿠키 세션에서 OTP 데이터 복호화 수신
    const otpCookie = request.cookies.get('klick_otp_session')?.value;

    if (!otpCookie) {
      return NextResponse.json(
        { error: 'No verification record found or session expired. Please click [Send Code] again.' },
        { status: 400 }
      );
    }

    let storedData = null;
    try {
      const decodedPayload = Buffer.from(otpCookie, 'base64').toString('utf-8');
      storedData = JSON.parse(decodedPayload);
    } catch (parseErr) {
      return NextResponse.json(
        { error: 'Invalid verification session. Please resend code.' },
        { status: 400 }
      );
    }

    if (!storedData || storedData.email !== email) {
      return NextResponse.json(
        { error: 'The requested email does not match the active verification session.' },
        { status: 400 }
      );
    }

    if (Date.now() > storedData.expiresAt) {
      return NextResponse.json(
        { error: 'Verification code has expired (10 min limit). Please request a new code.' },
        { status: 400 }
      );
    }

    if (String(storedData.code).trim() !== String(code).trim()) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check your inbox for the latest code.' },
        { status: 400 }
      );
    }

    // 검증 성공 응답 및 사용 완료된 쿠키 제거
    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully!'
    });

    response.cookies.delete('klick_otp_session');

    return response;
  } catch (err) {
    console.error('Verify OTP Route Handler Exception:', err);
    return NextResponse.json(
      { error: 'Error occurred during verification process.' },
      { status: 500 }
    );
  }
}