// app/api/auth/verify-otp/route.js
import { NextResponse } from 'next/server';
import { verifyOtpSession, signOtpSession, constantTimeEqual, OTP_MAX_ATTEMPTS } from '@/lib/otpSession';

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

    // 쿠키 세션에서 서명된 OTP 데이터 검증 (위조/변조된 쿠키는 여기서 거부됨)
    const otpCookie = request.cookies.get('klick_otp_session')?.value;
    const storedData = verifyOtpSession(otpCookie);

    if (!storedData) {
      return NextResponse.json(
        { error: 'No verification record found or session expired. Please click [Send Code] again.' },
        { status: 400 }
      );
    }

    if (storedData.email !== email) {
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

    if ((storedData.attempts || 0) >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please click [Send Code] again to get a new code.' },
        { status: 429 }
      );
    }

    if (!constantTimeEqual(String(storedData.code).trim(), String(code).trim())) {
      // 틀린 시도 횟수를 쿠키에 반영해 재서명 — 브루트포스 방지
      const attempts = (storedData.attempts || 0) + 1;
      const response = NextResponse.json(
        { error: 'Invalid verification code. Please check your inbox for the correct code.' },
        { status: 400 }
      );
      response.cookies.set('klick_otp_session', signOtpSession({ ...storedData, attempts }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 600,
        path: '/'
      });
      return response;
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