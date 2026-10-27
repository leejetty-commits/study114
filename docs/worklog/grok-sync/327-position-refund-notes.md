# 327 — 노출상품(프라임·픽) 환불 계산기 + 정본 18d + 결제내역 노출 탭 활성화

**날짜:** 2026-10-28
**브랜치:** `cursor/327-position-refund-20261028`
**기반:** `d2042a76` (326+326b main 병합)

## 변경 요약

### A. 계산기 (순수 계산)
- `src/Paid/PositionRefundCalculator.php` 신규
- 시작 전 전액 / 시작 후 일할(floor) / 종료 후 불가
- extend = 추가 구간만. amount_won = 배지 포함. table_won = refund_won

### B. 신청·정지·회수·철회
- `src/Paid/RefundService.php` position 분기 추가
- submit: txn(FOR UPDATE → 재계산 → INSERT → 노출 정지 → 배지 revoke → 번들 0 → order refund_requested → approved). PG 0, refunded 0
- withdraw: 326b WITHDRAW_CONFIRM_TEXT='환불철회' 재사용. 기간·배지·번들 복원. 프라임 자리 충돌→거부
- 326b 재사용: hasWithdrawnRefund, parseFrozenRemainingStrict(position은 parseReasonJsonStrict), resolveOrderRefForPack

### C. UI
- 노출 탭 「준비 중」 게이트 제거 → 활성 (canRefund에서 historyTab 제한 제거)
- 서버 breakdown 표시. 배지는 프라임/픽 행에 묶어 표시 (badge_addon에 별도 액션 없음)
- position 전용 카피: positionFrozenNote, positionWithdrawNote 등

### D. 관리자
- `AdminCommerceService` position_ends_at 차단 추가 (isPositionBlockedByRefund)

### E. 문서
- `docs/ssot/18d-position-refund-lock.md` 신규
- `docs/ssot/18c-memo-ticket-refund-lock.md` 후속 줄 수정 (327→18d)

### F. ProviderCheckoutService
- snapshot에 `segment_started_on` 추가 (extend 주문용)

## 재사용 (326b에서, 새로 만들지 않음)
- WITHDRAW_CONFIRM_TEXT = '환불철회'
- hasWithdrawnRefund → withdrawn_no_rerefund
- parseFrozenRemainingStrict (count 경로), parseReasonJsonStrict (position 경로 — 같은 엄격 파싱 원칙)
- resolveOrderRefForPack fallback

## Q1~Q5 기본값
- Q1: 원 단위 내림(floor)
- Q2: 시작 당일 요청 = 그날 사용으로 침
- Q3: 프라임 철회 시 자리가 차면 철회 거부
- Q4: 종료된 구간 = period_ended
- Q5: badge_addon 단독 신청 불가

## 멈추고 보고 결과
- 노출 조회: 모두 end_exclusive_on 기준 (SearchService, PaidBadgeResolver, MemberMailScheduler) ✅
- 배지 grant 형식: orderRef:code ✅
- segment_started_on 없는 과거 extend: reconstructExtendSegStart()로 주문 이력 기반 재구성 (불가 시 started_on fallback)
