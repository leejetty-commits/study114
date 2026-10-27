# 326+326b — 쪽지권 환불 신청 UI + API 노트

**날짜:** 2026-10-28
**브랜치:** `cursor/326-refund-apply-20261028`
**BASE:** `c67c0a75` (325 merged)

## 주요 변경

### 서버 (PHP)

- `RefundService.php`: 자격확인 · 신청(txn+freeze) · 철회(본인확인) · 관리자차단
- `RefundRepository.php`: provider_refund_requests CRUD + identity 기록
- `public/api/paid/refund.php`: GET 자격 · POST submit · POST withdraw (confirm_text 필수)
- `AdminCommerceService.php`: 환불 진행 중 팩 수량 보정 차단

### 프론트엔드 (JS)

- `screens.js`: 결제내역 탭(쪽지권/노출) · 확장행 · 환불 액션 박스 · 철회 본인확인 입력
- `paid-api.js`: refund endpoint + fetchRefundEligibility/submitRefund/withdrawRefund
- `mypage-copy.js`: 환불 사유·라벨·확인 문구
- `history-mock.js`: invalidateHistoryCache · normalizeStatus
- `a28-copy.js`: 관리자 환불 라벨·사유 코드
- `a28-screens-state.js`: ORDER_STATUS_KO (325에서 이미 반영)
- `mypage/screens.js`: "환불규정" → 구체 문구로 정리

### 문서

- `docs/ssot/18c-memo-ticket-refund-lock.md`: 326 섹션 추가

## 326b 필수 수정 사항

### 1. 본인확인 (B5)
- 기존 탈퇴 패턴 재사용: 확인 문구 `환불철회` 입력 필수
- 서버: `withdraw()` → `confirm_text !== '환불철회'` 시 422 (500 아님)
- DB 기록: `identity_checked_at=NOW`, `identity_method='confirm_text'`, `withdraw_linked=1`

### 2. 재환불 차단 (B5)
- `cancelled + withdraw_linked=1` 이력 확인 → `withdrawn_no_rerefund` 반환
- GET(자격확인)·POST(신청) 양쪽 모두 차단
- UNIQUE 충돌 → PDOException 잡아서 사용자 문구로 변환 (500 안 뜸)

### 3. 관리자 차단 보강 (B6)
- `isPackBlockedByRefund()`: `source_order_ref` 없을 때 `user_id+pack_size→variant→주문` fallback
- `resolveOrderRefForPack()` 공용 헬퍼로 추출
- `position_ends_at` 차단 → **327로 이월** (position = 노출상품, 326은 쪽지권만)

### 4. frozen_remaining 가드
- `parseFrozenRemainingStrict()`: JSON 없음·파싱 실패·필드 없음 → RuntimeException (롤백)
- 0으로 조용한 복원 금지

## 이월 (327)
- `position_ends_at` 관리자 차단 (노출상품 환불)
- PG 실 환불 처리 (refunded 상태)
- PositionRefundCalculator / 18d
