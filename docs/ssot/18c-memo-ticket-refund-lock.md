# 18c — 쪽지권 환불액 계산 잠금

**상태:** 잠금 (2026-10-27 종현)
**코드:** `src/Paid/MemoTicketRefundCalculator.php`
**검증:** `scripts/verify-memo-ticket-refund.php`
**내부:** `docs/internal/70-memo-ticket-refund-calculator.md`

> **정본 우선:** 옛 문서의 6개월·1000/4500/8000 환불액 **추종 금지**. 이 문서 + PaidCatalog 코드가 정본.

---

## 판매가 (PaidCatalog · 변경 금지)

| 상품 | sale_price_krw | expire |
|------|---------------:|--------|
| 1회 즉시권 | 500 | null |
| 5회권 | 2250 | 120일 |
| 10회권 | 4000 | 120일 |

---

## 환불표

| 상품 | 조건 | 환불액(₩) |
|------|------|----------:|
| 1회 | 7일 이내 · 미발송(`dispatch_status` ≠ `sent`) | 500 |
| 1회 | 발송 완료(`sent`) 또는 7일 경과 | 0 |
| 5회권 | 7일 이내 · 사용 0 | 2250 |
| 5회권 | 7일 이내 · 사용 1 | 1125 |
| 5회권 | 7일 이내 · 사용 2 | 750 |
| 5회권 | 사용 3+ · 또는 7일 경과 · 또는 120일 만료 | 0 |
| 10회권 | 7일 이내 · 사용 0 | 4000 |
| 10회권 | 7일 이내 · 사용 1~3 | 2000 |
| 10회권 | 7일 이내 · 사용 4 | 1300 |
| 10회권 | 사용 5+ · 또는 7일 경과 · 또는 120일 만료 | 0 |

---

## 판정 규칙 (2026-10-27 잠금)

1. **7일:** `paid_at` 부터 **정확히 7×24시간**, 그 시각까지 포함(`now <= paid_at + 7 days`).
2. **사용 횟수(팩):** **해당 주문의 팩만** (`source_order_ref = order_ref`, `source=payment`). `used = pack_size - remaining`. 번들·타주문 합산 금지.
3. **1회권:** 팩 없음. `dispatch_status === 'sent'` 이면 사용으로 본다. `pending`/`failed`/`blocked` 는 미발송. **7일 경과 시 0원**(복구는 운영, 계산기 밖).
4. **자격:** `order_status === 'paid'` 만. `pending`/`failed`/`cancelled` → 0 · reason `not_paid`.
5. **상한:** `refund_won = min(표금액, amount_won)` (옛가격·테스트 10원 대비). 표금액은 `table_won`으로 같이 반환.
6. **만료:** 팩 `expires_at <= now` → 0 · `expired` (120일 정본=코드).
7. **alias:** `5회`→`5회권`, `10회`→`10회권`. `20회`/`20회권` → `unknown_variant`.
8. **정본 우선:** 옛 문서의 6개월·1000/4500/8000 환불액 **추종 금지**. 이번 표·PaidCatalog가 정본.

---

## DB 기반 (325 · 2026-10-28)

- `provider_payment_orders.status` ENUM 6값: `pending` · `paid` · `failed` · `cancelled` · **`refund_requested`** · **`refunded`**
- `provider_refund_requests` 테이블 (order_ref UNIQUE) — DDL: `sql/schema/083_refund_foundation.sql`
- 관리자 쿼리 2곳(`AdminMemberRepository` · `AdminMemberDeleteService`) → `paid` · `refund_requested` · `refunded`
- 사용자 라벨: `refund_requested` → **「진행중」**, 관리자: **「환불 진행중」**
- **적용 전 phpMyAdmin 실행 필수** (Actions는 SQL을 실행하지 않음)

---

## 후속 (이 문서 밖)

- PG 취소/부분취소 API 연동 (→ 326)
- 환불 신청 UI/API 본체 · 팩 freeze · 자동승인 (→ 326)
- 노출상품(프라임·픽) 환불 계산기 — **별도 티켓** (→ 327)
- 관리자 환불 화면
