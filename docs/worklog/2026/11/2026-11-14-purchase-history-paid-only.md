# 구매이력 — 결제 완료 이후만

**날짜:** 2026-11-14  
**브랜치:** `work/purchase-history-paid-only`  
**기준:** main `7e91fa77`  
**머지·force push·운영 SQL:** 하지 않음.

## 지시

마이페이지 구매이력(쪽지권·노출상품 탭)에 결제되지 않은 주문(status pending·failed)이 결제된 것처럼 보인다. `listByUser`가 status를 거르지 않는다.

구매이력에는 결제 완료와 그 이후(환불 진행·환불됨·종료 등)만 보인다. pending·failed·만료된 대기 주문은 숨긴다. 관리자 화면·정산·환불 계산은 건드리지 않는다.

## 한 일

- `listByUser`는 `paid` · `refund_requested` · `refunded`만 조회한다.
- `cancelled`는 환불 정본에서 미결제로 보므로 구매이력에서 뺀다. 주문 status에 만료 값은 없고, 대기 만료는 pending으로 남아 같이 빠진다.
- 종료된 이용은 주문 status가 `paid`라 구매이력에 남는다.
