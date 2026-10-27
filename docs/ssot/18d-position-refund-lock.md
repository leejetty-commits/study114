# 18d — 노출상품(프라임·픽) 환불액 계산 잠금

**상태:** 잠금 (2026-10-28 종현)
**코드:** `src/Paid/PositionRefundCalculator.php`
**검증:** `scripts/verify-position-refund.php`
**서비스:** `src/Paid/RefundService.php` (position 분기)

> 쪽지권 환불은 별도: `docs/ssot/18c-memo-ticket-refund-lock.md`

---

## 달력·반개구간

- `PositionPeriodCalculator::BUSINESS_TZ = Asia/Seoul`
- 오늘 = `PositionPeriodCalculator::today()`
- 구간 = `[seg_start, seg_end_exclusive)` 반개구간
- 활성 = `today < end_exclusive_on` (`isActiveOn`)
- 구간 일수 `seg_days = days(seg_start → seg_end_exclusive)` — 월 상품도 실제 달력 일수

---

## 환불 공식

| 조건 | 환불액 | reason_code |
|------|--------|-------------|
| `today < seg_start` (시작 전) | `amount_won` (전액) | `before_start_full` |
| `seg_start ≤ today < seg_end_exclusive` | `floor(amount_won × remaining_days / seg_days)` | `after_start_prorata` |
| `remaining_days = 0` (마지막 날) | 0 | `last_day` |
| `today ≥ seg_end_exclusive` (종료 후) | 0 | `period_ended` |

- `remaining_days = days(today+1 → seg_end_exclusive)` — 요청 당일은 사용한 날로 침
- `amount_won = 실제 결제금액(배지 포함)`
- `table_won = refund_won` (노출엔 별도 표 없음)
- 원 단위 내림(`floor`). Q1: 10원/100원 절사 원하면 종현 지시

---

## 신규(new) 주문

- `seg_start = snapshot.started_on`
- `seg_end_exclusive = snapshot.end_exclusive_on`

## 재구독 (종료 후 새 주문, grant_mode=new)

- 위 신규 주문과 완전히 같은 규칙
- 이전 종료 주문은 `period_ended`로 불가 — 별도 규칙 없음

## 종료 전 이어 결제 (grant_mode=extend)

- 정본: Notion 34·34-1
- 추가 구간: `seg_start = 기존 end_exclusive_on (결제 시점)`, `seg_end_exclusive = 새 end_exclusive_on`
- 시작 전(today < seg_start) → 그 주문 전액 `before_start_full`
- 추가 구간 중 → 일할 `after_start_prorata`
- 추가 구간 종료 후 → `period_ended`
- **이전 이용 구간·이전 주문은 계산·정지·환불 대상 아님**
- `snapshot.segment_started_on` (327 추가) — 없는 과거 extend는 주문 이력으로 재구성

## badge_addon (배지 단독 추가)

- 단독 신청 불가 (`badge_follows_position`)
- 노출 환불 시 같은 txn에서 같이 처리 (A4)

---

## 종료된 구간 불가

- 이미 종료된 이전 구간/주문은 언제나 불가 (`period_ended` · 「종료됨」)
- 재구독(종료 후 새 주문)은 자기 구간만 환불 가능

---

## reason_code 표

| code | 의미 |
|------|------|
| `before_start_full` | 시작 전 전액 |
| `after_start_prorata` | 시작 후 일할 |
| `last_day` | 마지막 날 (환불 불가) |
| `period_ended` | 이용 기간 종료 (환불 불가) |
| `badge_follows_position` | 배지 단독 불가 |
| `not_paid` | 결제 미완료 |
| `already_requested` | 진행 중 |
| `withdrawn_no_rerefund` | 철회 후 재신청 차단 |

---

## 배지·번들 회수

- **배지 (A4):** 노출 환불 시 배지도 같이 회수 (`revoked`). badge_addon 주문도 각자 요청 행 INSERT → `refund_requested` → `approved`
- **번들 (A5):** 쓴 건 그대로, 남은 것만 0 (금액 차감 없음). `reason_text` JSON에 원래 remaining 보존

---

## 정지·철회 JSON

```json
{
  "orig_end_exclusive_on": "2026-12-01",
  "orig_ends_at": "2026-12-01 00:00:00",
  "seg_start": "2026-11-01",
  "seg_end_exclusive": "2026-12-01",
  "badge_order_refs": ["dev-abc123"],
  "revoked_badge_ids": [42, 43],
  "bundle_pack_ids": [99],
  "bundle_frozen_remaining": {"99": 5}
}
```

---

## PG HOLD

- 자동승인이어도 `refunded` 상태 전환 **금지**
- PG 취소 호출 **금지**
- 「환불 완료」 UI 표시 **금지**
- `requested` → `approved` 까지만 (이후 PG tip에서 처리)

---

## 후속 (이 문서 밖)

- PG 실 환불 처리 → `refunded` · 「환불 완료」 (이후 tip)
- 관리자 환불 상세/수동 처리
- 관리자 가격·비율 편집 (D3)
