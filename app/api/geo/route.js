// app/api/geo/route.js
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Vercel이 배포 환경에서 모든 요청에 자동으로 붙여주는 국가 코드 헤더를 그대로 읽어서
// 돌려준다. 로컬 개발 환경 등 이 헤더가 없는 곳에서는 country가 빈 문자열로 오고,
// 호출하는 쪽(Header.jsx)이 이를 영어 기본값으로 처리한다.
export async function GET(request) {
  const country = request.headers.get('x-vercel-ip-country') || '';
  return NextResponse.json({ country });
}
