# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

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
