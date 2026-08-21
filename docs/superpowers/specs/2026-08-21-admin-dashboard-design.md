# 통합 관리자 대시보드 설계

- 날짜: 2026-08-21
- 상태: 승인됨 (구현 대기)
- 관련 리서치: security-privacy-expert, ux-ui-expert, trust-safety-expert, fullstack-lead (2026-08-21, 본 대화 내 병렬 조사)

## 배경

현재 관리자 화면은 `app/admin/verify-sellers/page.jsx` 하나뿐이며, 셀러가 올린 사업자등록증을 승인/반려/취소하는 기능만 있다. 관리자는 사이트 소유자 1명(`sportskevinkim@gmail.com`)이고, 인증은 클라이언트에서 로그인 이메일을 하드코딩된 배열과 비교하는 UI 가드일 뿐이며, 실제 보안 경계는 `companies` 테이블 UPDATE RLS 정책의 이메일 carve-out이다(파일 자체에 "진짜 보안 경계가 아님"이라는 주석 있음).

사용자 요청: 바이어·셀러 회원 정보를 조회하고 인증마크를 부여하는 작업을 admin 페이지 한 곳에서 처리하고 싶다. 범위 확인 결과 **조회·검색만** — 계정 정지/삭제 같은 파괴적 기능은 이번 범위에서 제외.

## 목표

- 셀러 목록 조회/검색 + 기존 인증 승인/반려/취소 워크플로우를 한 화면에 통합
- 바이어 목록 조회/검색
- 반려 시 사유를 남겨 셀러에게 보여주기 (신뢰&안전 리서치에서 나온 가장 저비용·고가치 개선)
- 여러 admin 페이지가 인증 가드와 네비게이션을 반복 구현하지 않도록 공통 레이아웃 도입

## 비목표 (이번 범위 아님)

- 계정 정지·삭제, 신고 처리 파이프라인 — 신고 기능 자체가 앱에 없고, 이번에 "조회·검색만"으로 범위를 명시적으로 좁혔음
- 통계/대시보드 요약 홈 — 실사용 데이터가 거의 없어 지금 만들어도 보여줄 내용이 없음. `/admin` 접속 시 `/admin/sellers`로 리다이렉트
- `admin_users` 테이블 기반 다중 관리자 체계 — 관리자가 실제로 2명 이상이 될 때 전환 (아래 "향후 과제" 참고)
- Auth Hook 기반 JWT 커스텀 클레임 — 이 규모에서 과설계

## 인증 방식

현재 방식(하드코딩 이메일 배열 + RLS carve-out)을 유지하되 중앙화한다.

- `lib/adminEmails.js` 신설: `export const ADMIN_EMAILS = ['sportskevinkim@gmail.com'];` — 지금 `verify-sellers/page.jsx`에 있는 배열을 여기로 옮기고 재사용
- `app/admin/layout.jsx` 신설: 로그인 세션 확인 → 이메일이 `ADMIN_EMAILS`에 없으면 "Admin Access Only" 차단 화면, 있으면 좌측 네비 + `{children}` 렌더. 지금 `verify-sellers/page.jsx`에 있는 `checkAdminAndLoad` 로직을 그대로 옮긴다.
- 이 레이아웃은 여전히 **클라이언트 사이드 UI 가드**일 뿐이다. 실제 쓰기 작업(승인/반려/취소, 향후 바이어 관련 쓰기)은 반드시 RLS 정책의 이메일 carve-out으로 막혀 있어야 한다 — 이번에 바이어 테이블을 읽기만 할 것이므로 새 RLS 정책은 필요 없지만, 나중에 바이어 관련 쓰기 기능을 추가한다면 그때 SQL을 추가해야 한다.

### 향후 과제 (이번엔 안 함)

관리자가 2명 이상이 되는 시점에 `admin_users(user_id)` 테이블 + RLS `EXISTS` 서브쿼리 방식으로 전환. 코드 재배포 없이 관리자 추가/제거가 가능해짐. 지금은 YAGNI.

## 라우트/파일 구조

```
lib/adminEmails.js              # 신규 — ADMIN_EMAILS 상수
app/admin/
  layout.jsx                    # 신규 — 인증 가드 + 좌측 네비 (셀러 관리 / 바이어 관리)
  page.jsx                      # 신규 — /admin 접속 시 /admin/sellers로 redirect
  sellers/page.jsx              # 신규 — 셀러 목록 + 인증 승인/반려/취소 (verify-sellers 대체)
  buyers/page.jsx                # 신규 — 바이어 목록/검색
  verify-sellers/                # 삭제 — sellers/page.jsx로 흡수
```

Route Group(`(admin)`)은 쓰지 않는다 — 모든 admin 페이지가 `/admin/*` 경로 하나로 묶여 있고 다른 세그먼트와 URL을 공유할 필요가 없어 굳이 나눌 이유가 없다 (fullstack-lead 리서치).

`/admin/verify-sellers`를 북마크해뒀을 가능성을 감안해, 그 경로에 `/admin/sellers`로의 redirect만 남긴다(`app/admin/verify-sellers/page.jsx`를 `redirect('/admin/sellers')` 한 줄짜리로 교체하거나 Next.js redirects 설정 — 구현 계획 단계에서 어느 쪽이 이 Next.js 버전에 맞는지 확인).

## 셀러 관리 화면 (`app/admin/sellers/page.jsx`)

기존 `verify-sellers`의 데이터 로딩(`companies` 테이블 전체 조회)과 승인/반려/취소 로직을 그대로 가져오되, 상태 필터를 추가한다.

- **상태 필터 탭**: 전체 / 인증대기(서류 2종 업로드, 미승인) / 인증완료 / 반려
- **목록 컬럼**: 회사명(한/영), 인증 상태 배지, 가입일(`created_at`), 등록 상품 수(`products` 테이블에서 `user_id`로 카운트, 기존 `factories/page.jsx`의 카운트 패턴 재사용), 증빙서류 보기 버튼(기존 서명 URL 발급 로직 재사용), 승인/반려/취소 버튼
- **검색**: 회사명(한/영) 기준 클라이언트 사이드 필터 (지금 규모에서 서버 검색 불필요)
- **상세 보기**: 회사명 클릭 시 기존 공개 쇼룸 페이지 `/companies/[id]`로 이동 — 별도 admin 전용 상세 화면을 새로 만들지 않는다 (중복 UI 방지)
- **반려 사유 (신규)**: Reject 버튼 클릭 시 사유 입력 프롬프트 → `companies.rejection_reason`에 저장. 셀러가 `/companies/[id]` 자기 프로필 화면에서 반려 상태일 때 사유를 볼 수 있게 노출 (구현 계획에서 정확한 위치 확정)

### 스키마 변경 (SQL 스크립트 필요)

```sql
alter table companies add column if not exists rejection_reason text;
```
컬럼 하나만 추가하는 것이라 RLS 정책 변경은 불필요(기존 UPDATE 정책이 이미 이 테이블 전체 컬럼에 적용됨). 사용자가 Supabase SQL Editor에서 직접 실행.

## 바이어 관리 화면 (`app/admin/buyers/page.jsx`)

- **데이터 소스**: `buyers` 테이블을 기준으로 한다 (`buyers.buyer_name`, `buyers.auth_user_id`) — `buyer_profiles`와 중복 존재하는 상태이지만, CLAUDE.md에 명시된 대로 채팅/RFQ/리뷰가 실제로 신뢰하는 쪽이 `buyers`이므로 admin 화면도 동일 기준을 따라 세 번째 읽기 경로를 만들지 않는다.
- **목록 컬럼**: 바이어명(`buyer_name`), 국가(`country` — `buyer_profiles`에만 있다면 보조 조회로 채움), 가입일, 진행 중 채팅방 수(`chat_rooms`를 `buyer_id`로 카운트), 등록 RFQ 수(`public_rfqs`를 `user_id`로 카운트)
- **검색**: 바이어명 기준 클라이언트 사이드 필터
- **상세 보기**: 이름 클릭 시 기존 공개 쇼룸 페이지 `/buyers/[id]`로 이동 (이미 buyers+buyer_profiles를 병합해서 보여주는 페이지가 있음 — 재사용)
- **쓰기 작업 없음**: 조회·검색만. 정지/삭제 버튼 없음.

## 테스트 계획

- `npm run build`로 새 라우트들이 정상 컴파일되는지 확인
- dev 서버로 `/admin/sellers`, `/admin/buyers`, `/admin` 리다이렉트, `/admin/verify-sellers` 리다이렉트를 curl로 스모크 테스트
- 관리자 계정으로 로그인해 실제 화면에서 셀러 목록/필터, 바이어 목록, 인증 승인/반려(사유 포함)까지 한 번 수동으로 확인 (이 부분은 로그인 세션이 필요해 이전 세션에서도 직접 클릭 테스트는 못 했음 — 이번에도 동일한 한계, 사용자에게 명시)

## 스펙 셀프 리뷰

- 플레이스홀더/TBD: 없음
- 내부 모순: 없음 — "조회·검색만"이라는 비목표와 각 화면의 "쓰기 작업 없음" 명시가 일치함
- 범위: 이번 스펙 하나로 구현 계획을 짤 수 있는 크기 (신규 파일 4개, 수정 파일 1개, SQL 1줄)
- 모호성: "반려 사유를 셀러 화면 어디에 정확히 보여줄지"는 구현 계획 단계에서 확정하기로 명시함 — 의도적으로 열어둔 것이지 누락이 아님
