// app/api/auth/verify-otp/route.js
import { NextResponse } from 'next/server';

global.otpStore = global.otpStore || new Map();

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body?.email;
    const code = body?.code;

    if (!email || !code) {
      return NextResponse.json(
        { error: '이메일과 6자리 인증번호를 모두 입력해 주세요.' },
        { status: 400 }
      );
    }

    const storedData = global.otpStore.get(email);

    if (!storedData) {
      return NextResponse.json(
        { error: '인증번호 발송 기록이 없습니다. 인증번호 발송 버튼을 누른 후 다시 시도해 주세요.' },
        { status: 400 }
      );
    }

    if (Date.now() > storedData.expiresAt) {
      global.otpStore.delete(email);
      return NextResponse.json(
        { error: '인증번호 유효시간(10분)이 만료되었습니다. 다시 발송해 주세요.' },
        { status: 400 }
      );
    }

    if (storedData.code !== String(code).trim()) {
      return NextResponse.json(
        { error: '인증번호가 일치하지 않습니다. 메일함의 최신 번호를 확인해 주세요.' },
        { status: 400 }
      );
    }

    // 검증 완료 처리
    storedData.verified = true;
    global.otpStore.set(email, storedData);

    return NextResponse.json({
      success: true,
      message: '이메일 인증이 성공적으로 완료되었습니다.'
    });
  } catch (err) {
    console.error('Verify OTP Route Handler Exception:', err);
    return NextResponse.json(
      { error: '인증번호 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}