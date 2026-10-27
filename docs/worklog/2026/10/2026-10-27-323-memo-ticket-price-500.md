# 323 + 323b — 쪽지권 가격 500세트 + e2e 기대값

**브랜치**: `cursor/323-memo-ticket-price-500-20261027`
**RESTORE_BASE**: `8354babc` (origin/main)
**정본 원칙**: 이번 코드 값이 새 정본. 옛 문서·노션 추종 아님.

## 변경 가격 (정본)

| 상품 | list | rate | discount | **sale** | expire |
|------|-----:|-----:|---------:|--------:|--------|
| 1회 즉시권 | 500 | 0 | 0 | **500** | null |
| 5회권 | 2500 | 0.10 | 250 | **2250** | 120일 |
| 10회권 | 5000 | 0.20 | 1000 | **4000** | 120일 |

VERSION: `2026-09-04.1` → `2026-10-27.1`
locked_on: `2026-09-04` → `2026-10-27`

## 수정 파일

### 323 (9개)
1. `src/Paid/PaidCatalog.php` — MEMO_TICKETS 상수, VERSION, locked_on
2. `scripts/verify-paid-catalog.php` — version 체크 + memo expectQuote
3. `scripts/verify-paid-catalog.mjs` — MEMO 상수 + policy_memo 체크
4. `scripts/verify-paid-pr-a.mjs` — VERSION 체크 + src_memo 기대값
5. `scripts/verify-paid-pr-a-integration.php` — 5회권 2250, 10회권 4000
6. `scripts/verify-paid-pr-b-integration.php` — t01 price 500/2250/4000, t21 4000
7. `scripts/verify-paid-pricing.mjs` — resolveCheckoutAmount(4000)

### 323b (e2e 보강)
8. `e2e/p18-d-checkout.spec.js` — 5회권 4500→2250 (4곳), version 2026-10-27.1
9. `e2e/p18-pr-a-history.spec.js` — 10회권 8000→4000 (2곳), version·list·discount 갱신

## 검증 결과

```
node scripts/verify-paid-catalog.mjs   → 50 PASS / 0 FAIL ✅
node scripts/verify-paid-pr-a.mjs      → 85 PASS / 0 FAIL ✅
node scripts/verify-paid-pricing.mjs   →  4 PASS / 0 FAIL ✅
php scripts/verify-paid-catalog.php    → SKIP (로컬 PHP 없음, CI에서 확인)

rg "toBe\((4500|8000|1000)\)" e2e/p18-d-checkout.spec.js e2e/p18-pr-a-history.spec.js
→ 1건: discount_won 1000 = 10회권 신규 할인액 (옛 판매가 아님) ✅
```

## 불변 확인
- 노출상품·배지·TUTOR_MEMO_BUNDLE 가격 변경 없음
- 환불 엔진 신규 생성 없음
- quoteMemo/exportMemoProduct 로직 변경 없음

## 위험도
낮음 — 상수값·기대값만 변경, 로직 없음. PHP verify는 CI에서 확인 필요.
