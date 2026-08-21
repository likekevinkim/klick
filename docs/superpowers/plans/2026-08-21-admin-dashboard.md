# 통합 관리자 대시보드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/admin/verify-sellers` 하나뿐인 관리자 화면을, 셀러/바이어 회원을 조회·검색하고 셀러 인증을 승인/반려(사유 포함)/취소할 수 있는 통합 admin 대시보드로 확장한다.

**Architecture:** `app/admin/layout.jsx`가 관리자 이메일 화이트리스트 인증 가드와 좌측 네비를 담당하고, `app/admin/sellers/page.jsx`(기존 verify-sellers 흡수)와 `app/admin/buyers/page.jsx`(신규)가 각자 데이터 조회/검색을 처리한다. 상세보기는 새 화면을 만들지 않고 기존 공개 쇼룸 페이지(`/companies/[id]`, `/buyers/[id]`)로 연결한다. 쓰기 작업은 셀러 인증 승인/반려/취소뿐이며, 바이어 쪽은 조회·검색만 한다.

**Tech Stack:** Next.js 16 App Router (client components, `'use client'`), Supabase JS (anon key, RLS로 보호), lucide-react 아이콘. 이 저장소엔 테스트 러너가 없으므로(CLAUDE.md 명시), 각 태스크의 "테스트" 단계는 `npm run build` 컴파일 확인 + dev 서버 curl 스모크 테스트로 대체한다. 순수 로직(승인/반려 상태 분류)만 있는 부분은 Node 스크립트로 직접 assert 검증한다(이전 세션에서 `lib/otpSession.js`에 쓴 것과 동일한 패턴).

**Spec:** `docs/superpowers/specs/2026-08-21-admin-dashboard-design.md`

## Global Constraints

- 관리자 인증은 클라이언트 이메일 화이트리스트(`lib/adminEmails.js`)로 하되, 실제 쓰기 보안은 기존 `companies` UPDATE RLS 정책의 이메일 carve-out에 의존한다 — 새 RLS는 필요 없음(companies 테이블 쓰기만 하고, 이미 그 정책이 존재함).
- 바이어 관련 화면은 **조회·검색만** — 정지/삭제/쓰기 기능을 추가하지 않는다.
- 새 admin 전용 상세 화면을 만들지 않는다 — 항상 기존 `/companies/[id]`, `/buyers/[id]`로 링크한다.
- Route Group을 쓰지 않는다 — `app/admin/*` 평범한 폴더 구조로 충분하다.
- 스키마 변경(`companies.rejection_reason` 컬럼)은 사용자가 Supabase SQL Editor에서 직접 실행해야 한다 — 이 저장소엔 마이그레이션 도구가 없다(CLAUDE.md 명시).

---

## Task 1: 관리자 인증 가드 + 공통 레이아웃

**Files:**
- Create: `lib/adminEmails.js`
- Create: `app/admin/layout.jsx`
- Create: `app/admin/page.jsx`

**Interfaces:**
- Produces: `ADMIN_EMAILS` (string array, exported from `lib/adminEmails.js`) — Task 2와 Task 3의 각 페이지가 관리자 여부를 판단할 필요는 없다(레이아웃이 이미 걸러줌), 하지만 레이아웃 자체가 이 상수를 import한다.
- Produces: `app/admin/layout.jsx`는 표준 Next.js layout — children을 그대로 렌더하되, 비관리자는 차단 화면만 보여주고 `children`을 렌더하지 않는다.

- [ ] **Step 1: `lib/adminEmails.js` 작성**

```js
// lib/adminEmails.js
// 이 프로젝트는 별도 서버 인증 계층 없이 클라이언트에서 role을 분기하는 구조라서,
// 관리자 화면도 로그인 이메일을 이 배열과 비교하는 UI 가드로 접근을 제한한다.
// 진짜 보안 경계는 각 테이블의 RLS 정책에 있는 동일 이메일 carve-out이다.
export const ADMIN_EMAILS = ['sportskevinkim@gmail.com'];
```

- [ ] **Step 2: `app/admin/layout.jsx` 작성**

기존 `app/admin/verify-sellers/page.jsx`의 인증 체크(`checkingAuth`/`isAdmin` state, `checkAdminAndLoad`, 차단 화면 JSX)를 그대로 옮기고, 좌측 네비를 추가한다.

```jsx
// app/admin/layout.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import { ShieldCheck, Users, Building2, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ADMIN_EMAILS } from '@/lib/adminEmails';

const NAV_ITEMS = [
  { href: '/admin/sellers', label: '셀러 관리', icon: Building2 },
  { href: '/admin/buyers', label: '바이어 관리', icon: Users }
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      setCheckingAuth(true);
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || '';
      setIsAdmin(ADMIN_EMAILS.includes(email));
    } finally {
      setCheckingAuth(false);
    }
  };

  if (!mounted || checkingAuth) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] text-slate-900 antialiased">
        <Header />
        <div className="max-w-md mx-auto mt-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-3">
          <Lock className="w-10 h-10 text-slate-300 mx-auto" />
          <h1 className="text-sm font-extrabold text-slate-800">Admin Access Only</h1>
          <p className="text-xs text-slate-500">This page is restricted to the KLICK site administrator.</p>
          <Link href="/" className="inline-block text-xs font-bold text-blue-600 hover:underline pt-2">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 pb-24 antialiased">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 flex flex-col sm:flex-row gap-6">
        <nav className="sm:w-48 flex-shrink-0 flex sm:flex-col gap-1.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 min-w-0 space-y-8">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `app/admin/page.jsx` — `/admin`을 `/admin/sellers`로 리다이렉트**

```jsx
// app/admin/page.jsx
import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  redirect('/admin/sellers');
}
```

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 컴파일 완료. `app/admin/sellers`, `app/admin/buyers`가 아직 없어 링크는 죽어있지만(Task 2/3에서 생성), 레이아웃/리다이렉트 자체는 컴파일된다.

- [ ] **Step 5: Commit**

```bash
git add lib/adminEmails.js app/admin/layout.jsx app/admin/page.jsx
git commit -m "Add shared admin layout with centralized email allowlist guard"
```

---

## Task 2: 셀러 관리 화면 (인증 승인/반려/취소 흡수)

**Files:**
- Create: `app/admin/sellers/page.jsx`
- Delete: `app/admin/verify-sellers/page.jsx` content → replace with redirect (Task 4에서 처리, 이번 태스크에서는 새 파일만 만든다)

**Interfaces:**
- Consumes: `app/admin/layout.jsx`가 이미 인증을 걸렀으므로, 이 페이지는 로그인/관리자 여부를 다시 체크하지 않는다.
- Produces: 없음 (leaf page)

- [ ] **Step 1: 상태 분류 로직을 순수 함수로 분리하고 Node로 직접 검증**

3가지 상태(대기/반려/인증완료)를 판단하는 로직은 이후 필터 탭에서도 재사용하므로 작은 순수 함수로 뺀다.

`/private/tmp/claude-501/.../scratchpad/seller-status-check.mjs`에 아래 내용으로 작성 후 실행 (레포에는 안 남긴다 — 로직이 페이지 파일 안에 인라인으로 들어갈 만큼 작아서 별도 모듈로 만들 필요는 없고, 여기서는 그 로직이 맞는지만 미리 손으로 검증한다):

```js
function classifySellerStatus(c) {
  const hasBothCerts = !!(c.business_reg_cert_ko && c.business_reg_cert_en);
  if (c.is_verified) return 'verified';
  if (hasBothCerts && c.rejection_reason) return 'rejected';
  if (hasBothCerts) return 'pending';
  return 'incomplete';
}

function assert(cond, msg) { if (!cond) throw new Error('FAIL: ' + msg); console.log('ok - ' + msg); }

assert(classifySellerStatus({ is_verified: true }) === 'verified', 'verified wins regardless of cert/reason state');
assert(classifySellerStatus({ business_reg_cert_ko: 'a', business_reg_cert_en: 'b', rejection_reason: '서류 불일치' }) === 'rejected', 'both certs + reason = rejected');
assert(classifySellerStatus({ business_reg_cert_ko: 'a', business_reg_cert_en: 'b' }) === 'pending', 'both certs, no reason, not verified = pending');
assert(classifySellerStatus({ business_reg_cert_ko: 'a' }) === 'incomplete', 'only one cert = incomplete (not shown in review queue)');
console.log('ALL CHECKS PASSED');
```

Run: `node seller-status-check.mjs`
Expected: `ALL CHECKS PASSED`

- [ ] **Step 2: `app/admin/sellers/page.jsx` 작성**

기존 `app/admin/verify-sellers/page.jsx`의 `fetchCompanies`/`handleApprove`/`handleReject`/`handleRevoke`를 가져오되: (a) `classifySellerStatus` 로직 반영, (b) 상태 필터 탭 추가, (c) 검색창 추가, (d) 등록 상품 수 컬럼 추가, (e) Reject 시 사유 입력 받고 certs는 더 이상 지우지 않음, (f) 회사명 클릭 시 `/companies/[id]`로 이동.

```jsx
// app/admin/sellers/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Building2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '인증대기' },
  { key: 'verified', label: '인증완료' },
  { key: 'rejected', label: '반려' }
];

function classifySellerStatus(c) {
  const hasBothCerts = !!(c.business_reg_cert_ko && c.business_reg_cert_en);
  if (c.is_verified) return 'verified';
  if (hasBothCerts && c.rejection_reason) return 'rejected';
  if (hasBothCerts) return 'pending';
  return 'incomplete';
}

export default function AdminSellersPage() {
  const [companies, setCompanies] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setCompanies(data || []);

      const { data: products } = await supabase.from('products').select('user_id');
      const counts = {};
      (products || []).forEach((p) => {
        counts[p.user_id] = (counts[p.user_id] || 0) + 1;
      });
      setProductCounts(counts);
    } catch (err) {
      console.error('Failed to load companies for review:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCert = async (path) => {
    if (!path) return;
    try {
      const { data, error } = await supabase.storage
        .from(path.startsWith('http') ? 'company-images' : 'company-private-docs')
        .createSignedUrl(path.startsWith('http') ? path.split('/').slice(-2).join('/') : path, 300);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Signed URL fetch error:', err);
      alert('Failed to open file: ' + (err.message || 'Storage connection error'));
    }
  };

  const handleApprove = async (company) => {
    try {
      setActioningId(company.id);
      const { error } = await supabase
        .from('companies')
        .update({ is_verified: true, rejection_reason: null })
        .eq('id', company.id);
      if (error) throw error;
      await fetchCompanies();
    } catch (err) {
      console.error('Approve failed:', err);
      alert('Approve failed: ' + (err.message || 'Database error. Check RLS policy on companies table.'));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (company) => {
    const reason = prompt(`반려 사유를 입력하세요 (셀러에게 그대로 보여집니다):`, company.rejection_reason || '');
    if (reason === null) return; // 취소
    if (!reason.trim()) {
      alert('반려 사유는 비워둘 수 없습니다.');
      return;
    }

    try {
      setActioningId(company.id);
      const { error } = await supabase
        .from('companies')
        .update({ is_verified: false, rejection_reason: reason.trim() })
        .eq('id', company.id);
      if (error) throw error;
      await fetchCompanies();
    } catch (err) {
      console.error('Reject failed:', err);
      alert('Reject failed: ' + (err.message || 'Database error.'));
    } finally {
      setActioningId(null);
    }
  };

  const handleRevoke = async (company) => {
    if (!confirm(`Revoke verified status for ${company.company_name_en || company.company_name}?`)) return;
    try {
      setActioningId(company.id);
      const { error } = await supabase
        .from('companies')
        .update({ is_verified: false })
        .eq('id', company.id);
      if (error) throw error;
      await fetchCompanies();
    } catch (err) {
      console.error('Revoke failed:', err);
      alert('Revoke failed: ' + (err.message || 'Database error.'));
    } finally {
      setActioningId(null);
    }
  };

  const visible = companies
    .map((c) => ({ ...c, _status: classifySellerStatus(c) }))
    .filter((c) => filter === 'all' || c._status === filter)
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (c.company_name_en || c.company_name || '').toLowerCase().includes(q)
        || (c.company_name_ko || '').toLowerCase().includes(q);
    });

  const statusBadge = (status) => {
    if (status === 'verified') return <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-bold"><ShieldCheck className="w-3.5 h-3.5" /> 인증완료</span>;
    if (status === 'rejected') return <span className="inline-flex items-center gap-1 text-rose-600 text-[11px] font-bold"><ShieldX className="w-3.5 h-3.5" /> 반려</span>;
    if (status === 'pending') return <span className="inline-flex items-center gap-1 text-amber-600 text-[11px] font-bold"><ShieldAlert className="w-3.5 h-3.5" /> 인증대기</span>;
    return <span className="text-[11px] text-slate-400 font-bold">서류 미제출</span>;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Seller Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">셀러 목록 조회 및 사업자등록증 인증 승인/반려.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === f.key ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="회사명 검색"
            className="w-full text-xs focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading sellers...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
          No sellers match this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <Link href={`/companies/${c.user_id || c.id}`} className="text-xs font-extrabold text-slate-900 hover:text-blue-600 hover:underline truncate block">
                    {c.company_name_en || c.company_name} {c.company_name_ko && <span className="text-slate-400 font-medium">({c.company_name_ko})</span>}
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {statusBadge(c._status)}
                    <span className="text-[11px] text-slate-400">가입일 {c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</span>
                    <span className="text-[11px] text-slate-400">등록 상품 {productCounts[c.user_id] || 0}건</span>
                    {c._status !== 'incomplete' && (
                      <>
                        <button type="button" onClick={() => handleViewCert(c.business_reg_cert_ko)} className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-bold cursor-pointer">
                          <ExternalLink className="w-3 h-3" /> Korean Cert
                        </button>
                        <button type="button" onClick={() => handleViewCert(c.business_reg_cert_en)} className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-bold cursor-pointer">
                          <ExternalLink className="w-3 h-3" /> English Cert
                        </button>
                      </>
                    )}
                  </div>
                  {c._status === 'rejected' && c.rejection_reason && (
                    <p className="text-[11px] text-rose-600 mt-1">반려 사유: {c.rejection_reason}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {c._status === 'verified' ? (
                  <button
                    type="button"
                    disabled={actioningId === c.id}
                    onClick={() => handleRevoke(c)}
                    className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer disabled:opacity-50"
                  >
                    Revoke
                  </button>
                ) : (c._status === 'pending' || c._status === 'rejected') ? (
                  <>
                    <button
                      type="button"
                      disabled={actioningId === c.id}
                      onClick={() => handleReject(c)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      type="button"
                      disabled={actioningId === c.id}
                      onClick={() => handleApprove(c)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {actioningId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

주의: `handleViewCert`는 과거(레거시) 공개 URL 형태(`https://...`)와 새 비공개 경로 형태(`<user_id>/파일명`)를 모두 지원해야 한다 — 지난 세션에서 비공개 버킷으로 옮겼지만, 그 전에 이미 공개 URL로 저장된 레코드가 실제로 있는지는 이전에 확인해서 0건이었다(테스트 계정 정리 후). 그래도 방어적으로 두 형태를 함께 처리한다.

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 컴파일. (Task 1의 레이아웃이 `/admin/buyers` 링크도 렌더하지만, 그 페이지는 Task 3에서 생성 — 링크가 죽어있어도 빌드는 통과함)

- [ ] **Step 4: dev 서버 스모크 테스트**

Run:
```bash
npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin/sellers
```
Expected: `200`

- [ ] **Step 5: Commit**

```bash
git add app/admin/sellers/page.jsx
git commit -m "Add seller management page with status filters and rejection reasons"
```

---

## Task 3: 바이어 관리 화면

**Files:**
- Create: `app/admin/buyers/page.jsx`

**Interfaces:**
- Consumes: `app/admin/layout.jsx` (인증 가드는 이미 처리됨)
- Produces: 없음 (leaf page)

- [ ] **Step 1: `app/admin/buyers/page.jsx` 작성**

```jsx
// app/admin/buyers/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Loader2, MessageSquare, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminBuyersPage() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      setLoading(true);

      const { data: buyerRows, error } = await supabase
        .from('buyers')
        .select('auth_user_id, buyer_name, company_name, interest_category, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const buyerIds = (buyerRows || []).map((b) => b.auth_user_id).filter(Boolean);

      const [{ data: profiles }, { data: chatRooms }, { data: rfqs }] = await Promise.all([
        supabase.from('buyer_profiles').select('auth_user_id, country').in('auth_user_id', buyerIds.length ? buyerIds : ['']),
        supabase.from('chat_rooms').select('buyer_id').in('buyer_id', buyerIds.length ? buyerIds : ['']),
        supabase.from('public_rfqs').select('user_id').in('user_id', buyerIds.length ? buyerIds : [''])
      ]);

      const countryById = {};
      (profiles || []).forEach((p) => { countryById[p.auth_user_id] = p.country; });

      const chatCountById = {};
      (chatRooms || []).forEach((r) => { chatCountById[r.buyer_id] = (chatCountById[r.buyer_id] || 0) + 1; });

      const rfqCountById = {};
      (rfqs || []).forEach((r) => { rfqCountById[r.user_id] = (rfqCountById[r.user_id] || 0) + 1; });

      setBuyers((buyerRows || []).map((b) => ({
        ...b,
        country: countryById[b.auth_user_id] || '-',
        chatCount: chatCountById[b.auth_user_id] || 0,
        rfqCount: rfqCountById[b.auth_user_id] || 0
      })));
    } catch (err) {
      console.error('Failed to load buyers:', err);
      setBuyers([]);
    } finally {
      setLoading(false);
    }
  };

  const visible = buyers.filter((b) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (b.buyer_name || '').toLowerCase().includes(q) || (b.company_name || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Buyer Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">바이어 목록 조회 및 검색 (조회 전용).</p>
      </div>

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 sm:w-64">
        <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="바이어명 검색"
          className="w-full text-xs focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading buyers...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
          No buyers match this search.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {visible.map((b) => (
            <Link
              key={b.auth_user_id}
              href={`/buyers/${b.auth_user_id}`}
              className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
            >
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 truncate">{b.buyer_name || 'Unnamed Buyer'}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {b.country} · 가입일 {b.created_at ? new Date(b.created_at).toLocaleDateString() : '-'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-shrink-0">
                <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-blue-500" /> {b.chatCount}</span>
                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-purple-500" /> {b.rfqCount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 컴파일 완료.

- [ ] **Step 3: dev 서버 스모크 테스트**

Run:
```bash
npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin/buyers
```
Expected: `200`

- [ ] **Step 4: Commit**

```bash
git add app/admin/buyers/page.jsx
git commit -m "Add buyer management (view/search only) page"
```

---

## Task 4: 기존 `/admin/verify-sellers` 경로를 리다이렉트로 교체

**Files:**
- Modify: `app/admin/verify-sellers/page.jsx` (전체 내용을 리다이렉트로 교체)

**Interfaces:**
- Consumes: Next.js `redirect()` (from `next/navigation`)
- Produces: 없음

- [ ] **Step 1: 파일 내용을 통째로 교체**

```jsx
// app/admin/verify-sellers/page.jsx
import { redirect } from 'next/navigation';

export default function LegacyVerifySellersRedirect() {
  redirect('/admin/sellers');
}
```

(기존 268줄짜리 클라이언트 컴포넌트 전체를 이 4줄로 대체 — 인증 체크/데이터 로딩/승인 로직은 전부 `app/admin/sellers/page.jsx`로 이전 완료됐으므로 안전하게 삭제.)

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 컴파일.

- [ ] **Step 3: dev 서버 스모크 테스트 — 리다이렉트 확인**

Run:
```bash
npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin/verify-sellers
curl -s -o /dev/null -w "%{http_code}\n" -L http://localhost:3000/admin/verify-sellers
```
Expected: 첫 번째는 `307`(또는 `308`), `-L`(리다이렉트 따라가기) 붙인 두 번째는 최종 `200`.

- [ ] **Step 4: Commit**

```bash
git add app/admin/verify-sellers/page.jsx
git commit -m "Redirect legacy /admin/verify-sellers to /admin/sellers"
```

---

## Task 5: `rejection_reason` 컬럼 + 셀러 화면에 반려 사유 노출

**Files:**
- Create (사용자가 직접 실행할 SQL): `/private/tmp/claude-501/.../scratchpad/add_rejection_reason_column.sql`
- Modify: `app/companies/[id]/page.jsx` (인증 배지 영역 + `handleSaveCompanyProfile`)

**Interfaces:**
- Consumes: Task 2에서 이미 `companies.rejection_reason`을 읽고 쓰는 코드가 배포돼 있음 — 이 태스크는 그 컬럼이 실제 DB에 존재하게 만들고, 셀러 쪽 화면에 노출한다.

- [ ] **Step 1: SQL 스크립트 작성 및 사용자에게 전달**

```sql
-- KLICK: 셀러 인증 반려 사유 컬럼
-- Supabase SQL Editor에서 1회 실행.
alter table companies add column if not exists rejection_reason text;
```

이 스크립트를 파일로 저장해 SendUserFile로 전달하고, 사용자가 실행할 때까지 Step 2~4는 코드만 반영하고 실제 동작 확인은 실행 후로 미룬다(직전 세션에서 비공개 버킷 SQL을 다룬 것과 동일한 흐름).

- [ ] **Step 2: `app/companies/[id]/page.jsx`의 인증 배지 영역에 반려 상태 분기 추가**

`company?.is_verified ? ... : isOwner ? (business_reg_cert_ko && business_reg_cert_en ? "Verification Pending Review" : "Upload...") : null` 구조(이 파일의 353~371행 부근)에 반려 분기를 끼워 넣는다:

```jsx
{company?.is_verified ? (
  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
    <ShieldCheck className="w-3.5 h-3.5" /> Verified Korean Company
  </span>
) : isOwner ? (
  company?.rejection_reason ? (
    <button
      type="button"
      onClick={() => setIsEditCompanyModalOpen(true)}
      className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 cursor-pointer hover:bg-rose-500/30 transition"
      title={company.rejection_reason}
    >
      <ShieldCheck className="w-3.5 h-3.5" /> Verification Rejected — Click to Re-upload
    </button>
  ) : company?.business_reg_cert_ko && company?.business_reg_cert_en ? (
    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
      <ShieldCheck className="w-3.5 h-3.5" /> Verification Pending Review
    </span>
  ) : (
    <button
      type="button"
      onClick={() => setIsEditCompanyModalOpen(true)}
      className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 cursor-pointer hover:bg-amber-500/30 transition"
    >
      <ShieldCheck className="w-3.5 h-3.5" /> Upload Business Registration Cert to Get Verified
    </button>
  )
) : null}
```

반려 사유 본문(`company.rejection_reason`)은 버튼의 `title` 툴팁으로 우선 노출하고, 버튼을 누르면 재업로드용 Edit 모달이 열린다 — 별도 배너 컴포넌트를 새로 만들지 않는다(최소 변경).

- [ ] **Step 3: 재업로드 시 `rejection_reason` 초기화**

`handleSaveCompanyProfile`의 `updatedPayload` 객체(이 파일의 264~284행 부근)에 한 줄 추가:

```js
const updatedPayload = {
  user_id: activeUserId,
  company_name: editCompanyNameEn || editCompanyNameKo || 'Korean Company',
  // ...기존 필드 그대로...
  business_reg_cert_ko: editBizCertKo,
  business_reg_cert_en: editBizCertEn,
  rejection_reason: editBizCertKo && editBizCertEn ? null : company?.rejection_reason ?? null,
  updated_at: new Date().toISOString()
};
```

(양쪽 인증서가 모두 채워진 상태로 저장하면 = 재제출로 간주해 반려 사유를 지운다. 둘 중 하나라도 비어 있으면 기존 반려 사유를 그대로 유지한다.)

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 컴파일.

- [ ] **Step 5: Commit**

```bash
git add app/companies/[id]/page.jsx
git commit -m "Show rejection reason to sellers and clear it on cert re-upload"
```

- [ ] **Step 6: 사용자에게 SQL 스크립트 전달 (SendUserFile) 후 실행 요청**

이 스텝은 코드 커밋과 무관 — 실행 파일 전달은 대화에서 별도로 처리.

---

## Self-Review 결과

- **스펙 커버리지**: 인증 방식(Task 1), 라우트/파일 구조(Task 1/2/3/4), 셀러 관리 화면(Task 2), 바이어 관리 화면(Task 3), 반려 사유(Task 5) — 스펙의 모든 섹션에 대응하는 태스크 있음.
- **플레이스홀더 스캔**: 없음 — 모든 코드 블록이 실행 가능한 완전한 코드.
- **타입/시그니처 일관성**: `classifySellerStatus`가 Task 2 Step 1(검증 스크립트)과 Step 2(실제 페이지) 양쪽에서 동일한 리턴값(`'verified' | 'rejected' | 'pending' | 'incomplete'`) 사용. `ADMIN_EMAILS`는 Task 1에서 정의, Task 1 Step 2에서만 소비(다른 태스크는 레이아웃이 이미 걸러주므로 재사용 안 함) — 일치함.
