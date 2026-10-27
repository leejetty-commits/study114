# 327 — 노출상품 환불 계산기 + 18d + 노출 탭 활성화

**날짜:** 2026-10-28
**브랜치:** `cursor/327-position-refund-20261028`
**기반:** `d2042a76`
**상태:** 코드 완료 · 미커밋

## 지시서 원문
327 — 노출상품(프라임·픽) 환불 계산기 + 정본 18d + 결제내역 노출 탭 환불 활성화

## 같이 움직일 파일
- `src/Paid/PositionRefundCalculator.php` (신규)
- `src/Paid/RefundService.php`
- `src/Paid/RefundRepository.php` (변경 없음 — 326b에서 완료)
- `public/api/paid/refund.php` (변경 없음 — 326에서 완료)
- `src/Paid/ProviderCheckoutService.php` (snapshot segment_started_on)
- `src/Admin/AdminCommerceService.php` (position_ends_at 차단)
- `preview/home-ui/src/plans/screens.js` (노출 탭 활성)
- `preview/home-ui/src/plans/order-blocks.js` (카피 18d 정합)
- `preview/home-ui/src/mypage/mypage-copy.js` (position 카피)
- `preview/home-ui/src/admin/a28-copy.js` (관리자 카피)
- `docs/ssot/18d-position-refund-lock.md` (신규)
- `docs/ssot/18c-memo-ticket-refund-lock.md` (후속 줄만)
- `scripts/verify-position-refund.php` (신규)
- `scripts/verify-refund-apply.mjs` (position 확장)
- `scripts/verify-refund-history-ui.mjs` (노출 탭 확장)

## Q 기본값
- Q1: floor(원 단위 내림)
- Q2: 요청 당일 = 사용일
- Q3: 프라임 자리 충돌 → 철회 거부
- Q4: period_ended
- Q5: badge_addon 단독 불가

## 검수
미커밋. verify 실행 후 보고 예정.
