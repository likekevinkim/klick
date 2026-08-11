// app/api/auth/verify-otp/route.js
import { NextResponse } from 'next/server';

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

    // 쿠키 세션에서 OTP 데이터 복호화 수신
    const otpCookie = request.cookies.get('klick_otp_session')?.value;

    if (!otpCookie) {
      return NextResponse.json(
        { error: '인증번호 발송 기록이 없거나 세션이 만료되었습니다. [인증번호 발송] 버튼을 눌러 다시 시도해 주세요.' },
        { status: 400 }
      );
    }

    let storedData = null;
    try {
      const decodedPayload = Buffer.from(otpCookie, 'base64').toString('utf-8');
      storedData = JSON.parse(decodedPayload);
    } catch (parseErr) {
      return NextResponse.json(
        { error: '인증 세션이 유효하지 않습니다. 다시 발송해 주세요.' },
        { status: 400 }
      );
    }

    if (!storedData || storedData.email !== email) {
      return NextResponse.json(
        { error: '요청한 이메일과 인증 세션 정보가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    if (Date.now() > storedData.expiresAt) {
      return NextResponse.json(
        { error: '인증번호 유효시간(10분)이 만료되었습니다. 다시 발송해 주세요.' },
        { status: 400 }
      );
    }

    if (String(storedData.code).trim() !== String(code).trim()) {
      return NextResponse.json(
        { error: '인증번호가 일치하지 않습니다. 메일함의 최신 번호를 확인해 주세요.' },
        { status: 400 }
      );
    }

    // 검증 성공 응답 및 사용 완료된 쿠키 제거
    const response = NextResponse.json({
      success: true,
      message: '이메일 인증이 성공적으로 완료되었습니다.'
    });

    response.cookies.delete('klick_otp_session');

    return response;
  } catch (err) {
    console.error('Verify OTP Route Handler Exception:', err);
    return NextResponse.json(
      { error: '인증번호 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}