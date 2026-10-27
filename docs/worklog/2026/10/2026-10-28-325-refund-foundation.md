# 325 — 환불 기반 (Refund Foundation)

**날짜:** 2026-10-28
**브랜치:** `cursor/325-refund-foundation-20261028` (base `a440d85b`)
**지시:** 환불 신청 UI/API(326)·노출상품 환불(327) 전 DB·쿼리·라벨·카피 기반 마련

---

## 전후 요약

| 구분 | 이전 (324까지) | 이후 (325) |
|------|---------------|-----------|
| `provider_payment_orders.status` | ENUM 4값 (`pending`·`paid`·`failed`·`cancelled`) | ENUM **6값** (+`refund_requested`·`refunded`) |
| `provider_refund_requests` 테이블 | 없음 | 신규 (order_ref UNIQUE, status 5값) |
| 관리자 쿼리 | `'paid', 'refunded'` | `'paid', 'refund_requested', 'refunded'` |
| 사용자 라벨 `refund_requested` | 없음 | **「진행중」** (mypage-copy) |
| 관리자 라벨 `refund_requested` | 없음 | **「환불 진행중」** (a28) |
| order-blocks·screens 카피 | "환불 없음" / "환불·연장되지 않습니다" | "잔여 소멸(환불액 0) · 연장 없음" + "7일 이내" |

---

## 잠금표 (A1 ~ D3)

| | 1 SQL/스키마 | 2 PHP/서버 | 3 JS/프론트 |
|---|---|---|---|
| **A 상태 ENUM** | ENUM 6값 순서 잠금 | `refund_requested` 쿼리 포함 | `ORDER_STATUS_LABELS` + `ORDER_STATUS_KO` |
| **B 테이블** | `provider_refund_requests` DDL | 컬럼 15개 + 인덱스 3개 | — (UI는 326) |
| **C 라벨** | — | — | 사용자 '진행중' ≠ 관리자 '환불 진행중' |
| **D 카피** | — | — | "환불 없음" → 0건, accordion 구조 불변 |

---

## 같이 움직인 파일 (diff a440d85b 기준)

1. `sql/schema/083_refund_foundation.sql` (신규)
2. `src/Admin/AdminMemberRepository.php`
3. `src/Admin/AdminMemberDeleteService.php`
4. `preview/home-ui/src/mypage/mypage-copy.js`
5. `preview/home-ui/src/admin/a28-screens-state.js`
6. `preview/home-ui/src/plans/order-blocks.js`
7. `preview/home-ui/src/plans/screens.js`
8. `scripts/verify-refund-foundation.mjs` (신규)
9. `docs/ssot/18c-memo-ticket-refund-lock.md`
10. `docs/ssot/18-paid-services-rough.md`
11. `docs/worklog/grok-sync/docs/325-refund-foundation-2026-10-28.md` (신규)
12. `docs/worklog/2026/10/2026-10-28-325-refund-foundation.md` (신규)

---

## verify 결과

| 스크립트 | 결과 |
|----------|------|
| `verify-refund-foundation.mjs` | **34 PASS / 0 FAIL** |
| `verify-mypage-no-dev-terms.mjs` | 34 PASS / 0 FAIL |
| `verify-paid-pricing.mjs` | 4 PASS / 0 FAIL |
| `verify-paid-renewal.mjs` | 38 PASS / 0 FAIL |
| `verify-paid-catalog.mjs` | 50 PASS / 0 FAIL |
| `verify-memo-ticket-refund.php` | **미실행 (로컬 PHP 없음)** — CI에서 확인 필요 |
| `verify-paid-catalog.php` | **미실행 (로컬 PHP 없음)** — CI에서 확인 필요 |
| `git grep "환불 없음" plans/` | **0건** ✅ |
| `git grep "'refunded'" src/Admin` | **refund_requested와 함께만** ✅ |

---

## 326/327 넘김 (명시)

- **326:** 환불 신청 UI/API 본체, 팩 freeze(FOR UPDATE/packLockKey, remaining=0 같은 txn), 자동승인, 탈퇴 연동, 관리자 ticket_remaining 보정 차단(환불 진행중), 노출 탭 disabled 스켈레톤, 자격판정+락, historyCache 무효화, 목 행 환불 숨김
- **327:** 18d PositionRefundCalculator, extend-only 체인, 배지 revoke, 번들(expireOpenPositionBundles) 회수

---

## 배포 전 사용자 할 일

- **phpMyAdmin에서 `sql/schema/083_refund_foundation.sql` 실행** (Actions는 SQL을 실행하지 않음)
