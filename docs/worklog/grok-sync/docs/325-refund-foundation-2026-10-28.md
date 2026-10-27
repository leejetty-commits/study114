# 325 — 환불 기반 (Refund Foundation) · 2026-10-28

**티켓:** 325
**브랜치:** `cursor/325-refund-foundation-20261028`
**정본:** `docs/ssot/18c-memo-ticket-refund-lock.md` (DB 기반 섹션 추가)

## 범위

324(계산기) 후속. 환불 신청 UI/API(326)·노출상품 환불(327) 전 기반.

| 구분 | 내용 |
|------|------|
| SQL | `083_refund_foundation.sql` — ENUM 6값 + `provider_refund_requests` (order_ref UNIQUE) |
| PHP | `AdminMemberRepository` · `AdminMemberDeleteService` → `refund_requested` 추가 |
| JS 라벨 | `mypage-copy` '진행중' · `a28` '환불 진행중' (통일 금지) |
| 카피 | order-blocks·screens "환불 없음" → "잔여 소멸(환불액 0) · 연장 없음" |
| verify | `verify-refund-foundation.mjs` 34건 PASS |

## 다음 (이 PR 밖)

- **326:** 환불 신청 UI/API · 팩 freeze · 자동승인 · 탈퇴 연동
- **327:** PositionRefundCalculator · 18d · 배지 revoke · 번들 회수
