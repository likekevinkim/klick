# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 역할

당신은 이 프로젝트(KLICK)를 사용자와 함께 만들어가는 시니어 풀스택 개발자이자, 사용자의 전담 개발 파트너입니다.

## 프로젝트 개요

KLICK은 한국 제조업 기업을 위한 글로벌 B2B 수출 플랫폼입니다 (Alibaba 벤치마킹). 국내 제조업체가 한글로 상품 정보를 입력하면 AI가 다국어 상품 상세페이지를 자동으로 기획·생성해주는 것이 핵심 가치입니다.

## 사용자 및 커뮤니케이션 원칙

- 프로젝트 소유자는 개발 초보자입니다. 전문 용어는 쉬운 말로 풀어서 설명하고, 새로운 설정이나 배포처럼 낯선 단계를 안내할 때는 단계별로 친절하게 설명하세요.
- 코드는 파일을 직접 생성·수정해서 반영하고, 채팅(응답)에는 "무엇을 왜 바꿨는지"만 간결하게 요약하세요. 수정한 파일 전체 내용을 채팅에 다시 옮겨 적을 필요는 없습니다.

## 비즈니스 로드맵

초기 MVP는 빠른 개발과 배포를 위해 Next.js 풀스택 구조(Route Handlers)로 진행하며, 향후 확장성에 대비합니다.

1. **1단계 (MVP)**: 한글로 사진·제품 정보·가격·판매자 정보를 입력하면 AI API를 연동해 영어/다국어 상품 상세페이지(레이아웃 및 카피라이팅)를 자동으로 기획·생성. → `app/api/ai/generate-product`로 구현됨.
2. **2단계**: 판매자-바이어 간 언어 장벽을 없애는 실시간 번역 채팅. → `app/chat/page.jsx` + `chat_rooms`/`chat_messages`로 구현됨 (현재 핵심 기능).
3. **3단계 (장기 비전, 결제는 보류)**: 해외 바이어를 위한 소셜 로그인(구글, 링크드인) 및 글로벌 결제/멤버십 구조 도입. **결제 연동은 법적 문제로 당분간 보류 중이며, 지금 KLICK의 역할은 바이어-셀러를 채팅으로 연결해주는 것까지입니다.** 사용자가 다시 명시적으로 요청하기 전까지 실제 결제 기능을 임의로 구현하지 마세요 (관련 배경: 아래 "What this app is" 참고).

## 디자인 & UX 원칙

- **극도의 단순함**: 알리바바처럼 화면을 빽빽하게 채우지 않고, 구글이나 토스 같은 여백 있는 심플한 레이아웃을 지향합니다.
- **초보자 친화적 인터페이스**: 대상 사용자(50~60대 제조업 사장님, 해외 바이어)가 가이드 없이도 쓸 수 있어야 합니다. 버튼은 크게, 단어는 쉽게, 툴팁과 단계별(Step-by-step) 안내를 적극 활용하세요.
- **기능 재해석**: 알리바바의 핵심 기능(대량 문의, 견적 요청 RFQ, 상품 스펙 테이블)은 벤치마킹하되, 복잡하게 나열하지 말고 모던한 카드나 탭(Tab) 구조로 단순화합니다.
- **컬러**: 메인 컬러는 딥블루/네이비. CTA는 눈에 띄는 블루 또는 그린 포인트 컬러를 절제해서 사용. 배경은 화이트(#FFFFFF)와 연한 그레이(#F9FAFB) 위주로 구성합니다. *(텍스트 컬러 등 나머지 세부 규칙은 원본 메시지가 중간에 끊겨서 미반영 — 필요하면 이어서 알려주세요.)*

## Commands

```bash
npm run dev      # start dev server (Turbopack, http://localhost:3000)
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
```

**참고:** 이 환경에서는 `npm run lint`가 현재 실패합니다 (`eslint-config-next` 내부에서 `Cannot find module 'typescript'`) — 코드 문제 아님. 문법/타입 오류 확인은 `npm run build`로 대신하세요.

There is no test suite in this repo (no test runner configured, no `*.test.*` files).

## What this app is

KLICK is a B2B export platform connecting Korean manufacturers (sellers) with global buyers (Alibaba-style), built as a single Next.js App Router app (no separate backend). **Payments are intentionally out of scope for now (legal/regulatory reasons)** — the platform's job ends at getting buyer and seller to a deal inside the chat; settlement happens off-platform. Don't add real payment processing unless explicitly asked.

## Data layer

Two Supabase clients: `lib/supabase.js` (anon key, used by all client components — RLS applies) and `lib/supabaseAdmin.js` (service-role key, **server-only**, used only inside Route Handlers for the handful of writes that must bypass RLS — e.g. `app/api/notify/new-inquiry`, `app/api/products/view`, `app/api/rfq/increment-quote-count`). Never import `supabaseAdmin` from a `'use client'` file or return anything it reads (like an email) in an API response — see the no-direct-contact-exposure rule below. There is no Supabase CLI or migration tooling set up; **schema changes (new tables/columns/RLS policies) require handing the user a SQL script to run manually in the Supabase SQL editor** — don't assume you can alter the schema yourself.

**`supabase-js` `.delete()`/`.update()` never throw on failure** — they return `{ data, error }` silently, so a Route Handler that doesn't check `error` will respond `{ success: true }` even when a DB constraint blocked the write. Found and fixed in `app/api/seller/delete-account/route.js` (2026-08-22); `app/api/rfq/delete-rfq/route.js`'s two `.delete()` calls still don't check `error` as of this writing — same latent bug class, fix if you touch that file.

**Prod-only `supabaseAdmin.auth.getUser(token)` failing with "Invalid API key"** (while the client's JWT itself decodes fine and isn't expired) means `SUPABASE_SERVICE_ROLE_KEY` in Vercel's production env is stale/wrong — not a client-auth bug. Fix: copy the `service_role` key fresh from the Supabase dashboard (Settings → API) into Vercel's env vars and trigger a manual redeploy (env var changes don't apply to already-built deployments).

**RLS reality check (2026-08-21):** every table has RLS enabled, but many carried 3-5 duplicate/conflicting policies per action from past fix attempts, including loose `USING (true)` ones alongside properly-scoped ones (Postgres OR's permissive policies, so one loose policy defeats the strict ones). A cleanup pass fixed the tables listed below, but don't assume a table's RLS is sane just because it exists — before writing new RLS SQL, ask the user to paste the full Supabase Advisor/Linter JSON rather than guessing from the anon key (which can't read `pg_policies`).

**Never expose a buyer's or seller's real email** anywhere reachable outside the chat UI (no public table column, no API response) — they'd bypass KLICK's chat entirely and deal directly. To email someone server-side, resolve their address via `supabaseAdmin.auth.admin.getUserById()` inside a Route Handler only.

Core tables and what actually reads/writes them:

- `companies` — seller company profile (one per seller `user_id`). This is the **single source of truth for seller profile data** — `app/login/page.jsx`, `app/products/page.jsx`, `app/seller/profile/page.jsx`, and `ProductFormModal.jsx` all read/write only this table. (A parallel `seller_profiles` table was written to by the same pages until 2026-08-20 — that duplication was removed; don't reintroduce a second seller-profile write path.)
  - Two separate **editing UIs** for this table's media fields (video/gallery) also diverged: `components/company/EditCompanyModal.jsx` (reachable only via the owner's "편집" button on `app/companies/[id]`) had real file upload while the actual primary seller dashboard, `app/seller/profile/page.jsx`, only had URL-paste inputs — fixed 2026-08-30 by adding matching upload handlers there. If you add a new `companies` media field, add it to both UIs or you'll recreate this gap.
  - `app/companies/[id]/CompanyDetailClient.jsx`'s `isOwner` must stay `true` when `routeParamId === currentUser.id` even if no `companies` row exists yet — a seller who hasn't registered a company is still the owner of their own (empty) profile page. Computing `isOwner` only from `fetchedCompany.user_id` hides the "Register Company Info" CTA entirely (bug fixed 2026-08-23); watch for the same stale-state trap where a value just set via `setState()` is read back in the same function instead of using the locally computed variable.
- Product categories live in `lib/categories.js` (`PRODUCT_CATEGORIES` / `FILTER_CATEGORIES`) — the single source of truth, matching the `<select>` options in `ProductFormModal.jsx`. `app/page.jsx`, `app/catalog/page.jsx`, `app/rfq/page.jsx`, and `app/factories/page.jsx` all import from there; don't reintroduce a per-page hardcoded copy.
- `products` — seller's export product listings (rich fields: bilingual titles, tiered pricing, attributes jsonb, gallery images, AI-generated summary, `view_count` incremented server-side via `/api/products/view` so non-owner RLS restrictions don't block it).
- `buyers` / `buyer_profiles` — **both actively read/written in parallel**, unresolved duplication (unlike `companies`/`seller_profiles`, which was cleaned up). `buyers.buyer_name` (not `contact_person` — that column doesn't exist on `buyer_profiles`) is what chat/RFQ/review screens display for a buyer; always re-resolve it live rather than trusting a denormalized snapshot, and never fall back to an email-derived name.
  - `buyers.auth_user_id` had **no unique constraint** until 2026-08-30, so `app/buyer/profile/page.jsx`'s `.upsert(..., { onConflict: 'auth_user_id' })` against it failed every time with `no unique or exclusion constraint matching the ON CONFLICT specification` (silently blocking every buyer from ever saving their profile). Fixed by adding `UNIQUE (auth_user_id)` on `buyers` via manual SQL. `buyer_profiles.auth_user_id` already had one — don't assume the two tables have matching constraints just because the code treats them symmetrically.
    - **Debugging tip:** any `.upsert(..., { onConflict: 'col' })` failure with that exact Postgres error means `col` has no unique index/constraint on that table — verify with `select indexname, indexdef from pg_indexes where tablename = '<table>'` in the Supabase SQL editor before assuming a code bug.
- `public_rfqs` / `rfq_proposals` — buyer posts a public sourcing request, sellers respond with proposals. Independent of the chat system. `quote_count` increments go through `/api/rfq/increment-quote-count` (service-role) since the incrementer is the responding seller, not the RFQ's owning buyer.
- `chat_rooms` / `chat_messages` — see below, this is the core connective feature.
- `buyer_favorites` — buyer's saved products (`/buyer/favorites`).
- `product_reviews` — buyer reviews with `photos` jsonb (buyer-uploaded photos of the real product received); buyer can edit/delete their own.
- `companies.is_verified` / `business_reg_cert_ko` / `business_reg_cert_en` — seller uploads both cert files to become *eligible*; an admin must approve at `/admin/verify-sellers` (gated by a hardcoded email allowlist, currently just `sportskevinkim@gmail.com` — client-side check + a matching JWT-email carve-out in the `companies` UPDATE RLS policy) before the "Verified Korean Company" badge shows anywhere.
- `inquiries` and `buyer_sourcing_products` **do not exist in the schema** (confirmed via PostgREST — not merely unused). Any feature request touching "inquiries" or buyer sourcing needs a new table, not existing functionality to find.

## Next.js 16 gotcha

동적 라우트의 `params`(페이지 컴포넌트든 Route Handler든)는 여기서는 Promise입니다 — `.id` 등을 읽기 전에 항상 `await params` 해야 합니다 (`app/api/products/[id]/route.js` 참고). 빠뜨려도 에러 없이 조용히 `undefined`가 됩니다.

## Auth & roles

Supabase Auth, with a custom 6-digit email OTP step (`app/api/auth/send-otp`, `app/api/auth/verify-otp`) gating signup before `supabase.auth.signUp` runs. Role (`seller` | `buyer`) is stored in `user_metadata.role`; sign-in re-derives the role from whichever of `companies`/`buyer_profiles` has a row for that `user_id` if metadata is missing, and blocks cross-role login (a seller account can't sign in on the buyer tab). Most role-gated UI branches on `userRole` client-side, but RLS is real and enforced at the DB (see Data layer above) — don't treat client-side role checks as the only guard when adding a write path.

## Chat system (`app/chat/page.jsx` + `components/chat/`)

This is the most complex and most actively-developed part of the app — buyer and seller share a `chat_rooms` row, with all messages in `chat_messages`. Several message "types" are layered onto the same table without schema changes, all detected by convention rather than a dedicated column:

- **Regular message**: plain `message`/`translated_message`.
- **Quote**: `is_quote = true`, plus `quote_price`/`quote_moq`. Rendered as a card in `ChatRoomItem.jsx` with buyer-only Accept/Decline actions.
- **Quote acceptance**: not a DB column — detected by scanning messages for a buyer message whose text starts with the literal string `"We accept this quotation"` (see `hasAcceptedOrder` in `ChatRoomItem.jsx` and `handleRespondToQuote` in `app/chat/page.jsx`). This gates whether the seller's shipping-update button appears at all.
- **Shipping/tracking update**: encoded in the `file` jsonb column as `{type: 'tracking', courier, trackingNo}` (the same column normal file attachments use with `{name, size, type, url}` — always check `file.type` before assuming shape). Rendered as a clickable card that opens `SampleTrackingModal` in read-only mode.
- **Schema mismatch (found 2026-08-21):** a live `chat_rooms` row has no `title` or `company_name` column, yet the RFQ-initiated and company-page-initiated room-creation payloads in `app/chat/page.jsx` include both keys — confirm those specific `.insert()` calls aren't silently failing (`PGRST204`) before assuming new-room creation works end-to-end.

If you add another message "type," follow this same pattern (a marker in `file` or a recognizable `message` prefix) rather than asking for a new column, unless the user wants to invest in a real migration.

**Translation**: `translateTextWithApi()` in `app/chat/page.jsx` currently calls the unofficial `translate.googleapis.com/translate_a/single` endpoint (no API key, but undocumented and can break/rate-limit without notice). A tested alternative, `app/api/ai/translate/route.js` (Claude Haiku 4.5 via `@ai-sdk/anthropic`), exists but is **not wired in** — the user reverted to Google Translate on 2026-08-20 because `ANTHROPIC_API_KEY` in `.env.local` is still an empty placeholder. Don't delete that route as dead code; it's parked, not abandoned.

Language preference is tracked per-room (`chat_rooms.seller_lang` / `buyer_lang`), and also mirrors the site-wide Google Translate widget cookie (injected by `components/Header.jsx` — a separate `GoogleTranslateScript.jsx` component existed but was unused dead code and has been removed) via `getSiteTranslateLang()` — two separate translation mechanisms coexist (the page-wide widget vs. per-message API translation), which is worth knowing before touching either.

**Mistranslated UI labels**: the Google Translate widget sometimes literal-translates short English UI words into stiff/wrong Korean (`Home`→`집`, `All`→`모두`, `etc`→`등`). Fix pattern (see `components/Header.jsx`, `app/page.jsx`, `app/catalog/page.jsx`): read `localStorage.getItem('klick_lang_code')` client-side and conditionally render the correct Korean string wrapped in `notranslate` / `translate="no"`, leaving every other label to the widget.

**`notranslate` on user-entered names/companies** (buyer contact name, company name): applied 2026-08-30 across every render site — chat room list, product reviews, buyer public profile, RFQ board/detail, AND the buyer's own `/buyer/profile` summary card (the owner's own view is easy to forget when the rest of the pass is about what *other* people see — that exact spot was missed on the first pass). Wrap any new render site for these fields in `notranslate` / `translate="no"` too.

## SEO

`app/products/[id]`와 `app/companies/[id]`는 서버 `page.jsx`(가벼운 Supabase 조회로 `generateMetadata` 처리)가 `'use client'`인 `ProductDetailClient.jsx` / `CompanyDetailClient.jsx`(기존 로직 그대로)를 감싸는 구조로 분리되어 있습니다. 같은 패턴이 2026-08-24에 홈/카탈로그/팩토리/RFQ 게시판에도 적용됐습니다 — 실제 UI/로직은 `app/HomeClient.jsx`, `app/catalog/CatalogClient.jsx`, `app/factories/FactoriesClient.jsx`, `app/rfq/RfqBoardClient.jsx`에 있고, 각 디렉토리의 `page.jsx`는 `export const metadata`만 갖는 얇은 서버 래퍼입니다 — **이 네 페이지를 고칠 땐 `page.jsx`가 아니라 `*Client.jsx`를 편집하세요.** SEO가 필요한 다른 `'use client'` 페이지도 이 패턴을 따르세요.

실제 프로덕션 도메인은 **`klick.biz`**입니다 (`true-k.net`이 아님 — Vercel 프로젝트의 실제 domains 목록으로 2026-08-24에 확인). `NEXT_PUBLIC_SITE_URL=https://klick.biz`가 `.env.local`과 Vercel 프로덕션 환경변수 양쪽에 설정되어 있어야 `app/sitemap.js`/`app/robots.js`가 올바른 도메인으로 나갑니다.

**Google Analytics(GA4, 측정 ID `G-ED6Q83590J`)는 `app/layout.jsx`에 `next/script`로 이미 추가되어 있습니다** — 모든 페이지에 한 번만 적용되면 되므로, 다시 추가해 달라는 요청이 와도 개별 페이지에 중복으로 넣지 마세요.

## AI integration

- `app/api/ai/generate-product/route.js` — OpenAI (`gpt-5.4-mini` via `ai` + `@ai-sdk/openai`) generates the English product title/tagline/spec sheet from a seller's Korean input. Called from `ProductFormModal.jsx`. Falls back to a hardcoded template on any error (including OpenAI quota exhaustion, which has happened before — check https://platform.openai.com/settings/organization/billing/ if this silently stops working).
- `app/api/ai/translate/route.js` — see Chat system above.
- Both routes read their provider key straight from `.env.local` (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) — no Vercel AI Gateway is configured.

## General repo hygiene notes

This codebase has accumulated duplicate/orphaned files from iterative rebuilds (e.g. an old `app/products/new/page.jsx` prototype and a stray `app/api/products/new/page.jsx`, plus a `ChatMessageBubble.jsx` that was never imported anywhere — all since removed). **Before editing a component, grep for where it's actually imported/rendered** — a file existing under a plausible path doesn't mean it's the live one.

**No local seed/test data**: the dev Supabase project has ~1 seller, 0 buyers, and little/no chat history. Seeding via a service-role script that creates/modifies auth users (buyers, password resets, magic links) gets blocked by the auto-mode permission classifier even for local test data — ask the user to run the script themselves with a `!`-prefixed command instead of retrying.
