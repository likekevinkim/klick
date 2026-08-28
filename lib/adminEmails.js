// lib/adminEmails.js
// 이 프로젝트는 별도 서버 인증 계층 없이 클라이언트에서 role을 분기하는 구조라서,
// 관리자 화면도 로그인 이메일을 이 배열과 비교하는 UI 가드로 접근을 제한한다.
// 진짜 보안 경계는 각 테이블의 RLS 정책에 있는 동일 이메일 carve-out이다.
export const ADMIN_EMAILS = ['sportskevinkim@gmail.com', 'info@klick.biz'];
