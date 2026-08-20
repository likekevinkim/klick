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

There is no test suite in this repo (no test runner configured, no `*.test.*` files).

## What this app is

KLICK is a B2B export platform connecting Korean manufacturers (sellers) with global buyers (Alibaba-style), built as a single Next.js App Router app (no separate backend). **Payments are intentionally out of scope for now (legal/regulatory reasons)** — the platform's job ends at getting buyer and seller to a deal inside the chat; settlement happens off-platform. Don't add real payment processing unless explicitly asked.

## Data layer

One Supabase client (`lib/supabase.js`), reading `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local` (gitignored). No server-side/service-role Supabase access exists in this repo — all reads/writes go through the anon client with RLS. There is no Supabase CLI or migration tooling set up; **schema changes (new tables/columns) require handing the user a SQL script to run manually in the Supabase SQL editor** — don't assume you can alter the schema yourself.

Core tables and what actually reads/writes them:

- `companies` — seller company profile (one per seller `user_id`). This is the **single source of truth for seller profile data** — `app/login/page.jsx`, `app/products/page.jsx`, `app/seller/profile/page.jsx`, and `ProductFormModal.jsx` all read/write only this table. (A parallel `seller_profiles` table was written to by the same pages until 2026-08-20 — that duplication was removed; don't reintroduce a second seller-profile write path.)
- `products` — seller's export product listings (rich fields: bilingual titles, tiered pricing, attributes jsonb, gallery images, AI-generated summary).
- `buyers` / `buyer_profiles` — buyer accounts; `buyer_profiles.contact_person`/`company_name` is what chat and RFQ screens display for a buyer.
- `public_rfqs` / `rfq_proposals` — buyer posts a public sourcing request, sellers respond with proposals. Independent of the chat system.
- `chat_rooms` / `chat_messages` — see below, this is the core connective feature.
- `inquiries` and `buyer_sourcing_products` exist in the schema but **nothing in the codebase reads or writes them** — treat any feature request touching "inquiries" or buyer sourcing as needing new wiring, not existing functionality to find.

## Auth & roles

Supabase Auth, with a custom 6-digit email OTP step (`app/api/auth/send-otp`, `app/api/auth/verify-otp`) gating signup before `supabase.auth.signUp` runs. Role (`seller` | `buyer`) is stored in `user_metadata.role`; sign-in re-derives the role from whichever of `companies`/`buyer_profiles` has a row for that `user_id` if metadata is missing, and blocks cross-role login (a seller account can't sign in on the buyer tab). All role-gated UI branches on `userRole` client-side, not RLS policy — there is no server-side authorization layer.

## Chat system (`app/chat/page.jsx` + `components/chat/`)

This is the most complex and most actively-developed part of the app — buyer and seller share a `chat_rooms` row, with all messages in `chat_messages`. Several message "types" are layered onto the same table without schema changes, all detected by convention rather than a dedicated column:

- **Regular message**: plain `message`/`translated_message`.
- **Quote**: `is_quote = true`, plus `quote_price`/`quote_moq`. Rendered as a card in `ChatRoomItem.jsx` with buyer-only Accept/Decline actions.
- **Quote acceptance**: not a DB column — detected by scanning messages for a buyer message whose text starts with the literal string `"We accept this quotation"` (see `hasAcceptedOrder` in `ChatRoomItem.jsx` and `handleRespondToQuote` in `app/chat/page.jsx`). This gates whether the seller's shipping-update button appears at all.
- **Shipping/tracking update**: encoded in the `file` jsonb column as `{type: 'tracking', courier, trackingNo}` (the same column normal file attachments use with `{name, size, type, url}` — always check `file.type` before assuming shape). Rendered as a clickable card that opens `SampleTrackingModal` in read-only mode.

If you add another message "type," follow this same pattern (a marker in `file` or a recognizable `message` prefix) rather than asking for a new column, unless the user wants to invest in a real migration.

**Translation**: `translateTextWithApi()` in `app/chat/page.jsx` currently calls the unofficial `translate.googleapis.com/translate_a/single` endpoint (no API key, but undocumented and can break/rate-limit without notice). A tested alternative, `app/api/ai/translate/route.js` (Claude Haiku 4.5 via `@ai-sdk/anthropic`), exists but is **not wired in** — the user reverted to Google Translate on 2026-08-20 because `ANTHROPIC_API_KEY` in `.env.local` is still an empty placeholder. Don't delete that route as dead code; it's parked, not abandoned.

Language preference is tracked per-room (`chat_rooms.seller_lang` / `buyer_lang`), and also mirrors the site-wide Google Translate widget cookie (`components/GoogleTranslateScript.jsx`, `components/Header.jsx`) via `getSiteTranslateLang()` — two separate translation mechanisms coexist (the page-wide widget vs. per-message API translation), which is worth knowing before touching either.

## AI integration

- `app/api/ai/generate-product/route.js` — OpenAI (`gpt-5.4-mini` via `ai` + `@ai-sdk/openai`) generates the English product title/tagline/spec sheet from a seller's Korean input. Called from `ProductFormModal.jsx`. Falls back to a hardcoded template on any error (including OpenAI quota exhaustion, which has happened before — check https://platform.openai.com/settings/organization/billing/ if this silently stops working).
- `app/api/ai/translate/route.js` — see Chat system above.
- Both routes read their provider key straight from `.env.local` (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) — no Vercel AI Gateway is configured.

## General repo hygiene notes

This codebase has accumulated duplicate/orphaned files from iterative rebuilds (e.g. an old `app/products/new/page.jsx` prototype and a stray `app/api/products/new/page.jsx`, plus a `ChatMessageBubble.jsx` that was never imported anywhere — all since removed). **Before editing a component, grep for where it's actually imported/rendered** — a file existing under a plausible path doesn't mean it's the live one.
