# H1 · 결제는 됐는데 지급이 막히면 자동으로 전액 취소 (2026-11-14)

- 작성: 우동공과3 · 실행: Cursor · 최종검수: 우동공과3
- 기준: origin/main `efc881f7`
- 근거: `docs/worklog/grok-sync/docs/integrity-security-2026-11-14.md` H1
- 브랜치: `work/sec-h1-paid-conflict-auto-cancel` (main 최신 pull 후 새로 만듦)
- **규칙: 새 브랜치에서 PR만 열고 보고. 머지·force push·운영 SQL 금지.**

## 1. 배경 (무슨 문제인가)

포트원은 결제 완료(PAID)라고 확인했는데, 우리 서버의 완료 처리(지급) 단계에서 충돌이 나면 지금은 이렇게 된다.

- 주문이 `pending`(결제 대기)으로 남는다. 트랜잭션이 롤백되기 때문이다.
- 포트원 결제를 취소하는 코드가 완료 경로에 없다. 손님 돈은 빠진 채로 남는다.
- 구매이력은 `paid / refund_requested / refunded`만 보여 주므로(PR #212) 손님 화면에 아무 기록이 없다.
- 웹훅은 500을 돌려준다. 포트원이 다시 보내도 같은 충돌로 또 실패한다.
- 이미 `paid`인데 묶음권이 지급되지 않은 주문은 환불 신청도 `pack_not_found`로 거절된다.

충돌이 나는 실제 경우:
1. 쪽지 묶음권: 주문을 만들 때는 "사용 중인 묶음권"만 본다. 결제 전 주문 2개를 만들고 둘 다 결제하면, 두 번째는 완료 때 막힌다.
2. Prime: 주문을 만들 때 자리를 잡아 두지 않는다. 마지막 자리를 두 곳이 동시에 결제하면 늦은 쪽이 완료 때 막힌다.
3. 이미 `paid`인데 다른 묶음권이 먼저 켜진 경우: `fulfillment=failed`로 두고 끝난다.

## 2. 정확한 위치 (origin/main `efc881f7` 기준)

| 파일:줄 | 지금 하는 일 |
|---|---|
| `src/Paid/ProviderCheckoutService.php:440-460` | 웹훅용 `completePortOneByPaymentId`: 포트원 단건 조회(`assertPaidMatchesOrder`) 뒤 `completeOrder` |
| 같은 파일 `:418-433` | 화면용 `completePortOneOrder`: 같은 경로 |
| 같은 파일 `:466-487` | `completeOrder` 시작. 주문 행 잠금(FOR UPDATE). 상태가 `pending/paid`가 아니면 `완료할 수 없는 주문 상태` 예외 |
| 같은 파일 `:508-511` | pending + 활성 묶음권 있음 → `PaidConflictException` |
| 같은 파일 `:512-530` | paid + 활성 묶음권 있음 + 이 주문 묶음권 없음 → `fulfillment=failed`, 돈은 그대로 |
| 같은 파일 `:908-914` | Prime 자리 다 참 → `PaidConflictException` (position 경로 `:537-547`에서 롤백) |
| 같은 파일 `:613-625` | position·즉시권 외 지급 실패 → `fulfillment=failed`, 돈은 그대로 |
| 같은 파일 `:646-657` | 바깥 catch: 롤백 후 예외를 그대로 던짐 |
| 같은 파일 `:1145-1167` | 주문 만들 때 묶음권 검사(활성만 봄) |
| `src/Paid/Pg/PortOneCheckout.php:62-77` | `cancel(paymentId, amount, remainingBefore, reason)` — 이미 있음. 재사용 |
| `src/Paid/Pg/PortOneCancelOpsLog.php:34-79` | 취소 기록(별도 연결, 롤백에 안 지워짐) — 이미 있음. 재사용 |
| `src/Paid/ProviderCheckoutRepository.php:284-309` | `markPaid`, `markFulfillment` |
| 같은 파일 `:317-341` | `listByUser` (구매이력): `status IN ('paid','refund_requested','refunded')` |
| `public/api/paid/checkout.php:49-59` | 완료 요청. `InvalidArgumentException`(PaidConflict 포함) → 422 |
| `public/api/paid/portone-webhook.php:101-115` | 완료 실패 → 500 |
| `preview/home-ui/src/plans/screens-orders.js:253-293` | `resolveV3Cells` (구매이력 칸·배지) |

DB: `provider_payment_orders.status` ENUM에는 이미 `cancelled`가 있다(`sql/schema/083_refund_foundation.sql:15-19`). `fulfillment_status`·`fulfillment_error`도 있다(063). **새 SQL은 필요 없다.** 운영에 들어가 있는지만 종현이 확인한다(아래 7절).

## 3. 바꿀 것

### 3-1. 자동 전액 취소 (핵심)
`ProviderCheckoutService`에 `autoCancelAfterPaidConflict(string $orderRef, string $reason): array`(이름은 자유)를 만든다. **포트원 주문(`PgProvider::usesPortOne`)이고, 포트원 단건 조회로 PAID가 확인된 경로(`$pgVerified=true`)에서만** 부른다. mock 주문에서는 부르지 않는다.

부르는 때:
- (a) `completeOrder`에서 `PaidConflictException`이 나고, 그 주문 상태가 `pending`이던 경우 (묶음권 충돌 `:509-511`, Prime 만석 `:910-913`, 과외 축 등 같은 예외 전부)
- (b) `paid`인데 묶음권이 지급되지 않은 경우 (`:512-530`, 그리고 `:613-625`에서 묶음권 주문이고 `packExistsForOrderRef`가 false일 때)

하는 일 (순서 지킬 것):
1. 원래 트랜잭션은 이미 롤백된 상태에서 시작한다. 새 트랜잭션을 열고 `getByRefForUpdate`로 주문 행을 다시 잠근다.
2. 상태를 다시 본다. 이미 `cancelled`면 아무것도 하지 않고 "이미 취소됨" 결과를 돌려준다(중복 취소 방지). 묶음권이 그새 지급됐으면(`packExistsForOrderRef` true) 취소하지 않는다.
3. `PortOneCheckout::cancel(pg_payment_id, amount_won, amount_won, '지급 불가 자동취소')` 호출. 전액.
4. 성공하면 주문을 `status='cancelled'`, `fulfillment_status='failed'`, `fulfillment_error='auto_cancelled: <짧은 이유>'`로 바꾸고 커밋한다. (`paid_at`은 건드리지 않는다.) Repository에 `markAutoCancelled($orderRef, $reason)` 같은 메서드를 하나 만든다. 조건 `WHERE order_ref=? AND status IN ('pending','paid')`.
5. 커밋 뒤 `PortOneCancelOpsLog::record(paymentId, cancel_id, amount, orderRef, 'auto_cancel_conflict')`. 이 로그는 DB 저장이 실패해도 남도록 4번 앞에서 한 번 더 남겨도 된다(포트원 취소 성공 직후).
6. 포트원 취소가 실패하면: 주문 상태를 바꾸지 않는다. `error_log('[portone] auto_cancel_failed order_ref=… paymentId=…')`만 남기고 원래 예외를 다시 던진다. (웹훅은 500 → 포트원 재전송 → 다시 시도.)
7. 이유 문구는 손님용 짧은 말: 「선택한 상품을 지금 지급할 수 없어 결제를 자동으로 취소했어요. 카드사에 따라 환불까지 3~5영업일 걸릴 수 있어요.」(문구 바꾸지 말 것. 바꾸려면 보고에 제안만.)

돌려주는 값: `buildCompletePayload`와 같은 모양에 `auto_cancelled: true`, `status: 'cancelled'`, `fulfilled: false`, `message`(위 문구). **HTTP 200 + ok:true**로 돌려준다(돈 처리는 끝났고 오류가 아니므로). 화면용 `checkout.php`, 웹훅 모두 200.

### 3-2. 취소된 주문 다시 들어올 때 (멱등)
- `completePortOneByPaymentId` / `completePortOneOrder` 맨 앞(포트원 조회 **전**)에서 주문이 `cancelled`이고 `fulfillment_error`가 `auto_cancelled:`로 시작하면, 포트원을 다시 조회하지 말고 위와 같은 "자동취소됨" 결과를 200으로 돌려준다. (취소된 결제를 다시 조회하면 status가 PAID가 아니어서 예외 → 웹훅 500 무한 재시도가 되기 때문.)

### 3-3. 구매이력에 "결제 취소됨" 한 줄
- `ProviderCheckoutRepository::listByUser`(`:334`) 조건을
  `status IN ('paid','refund_requested','refunded') OR (status='cancelled' AND fulfillment_status='failed' AND fulfillment_error LIKE 'auto\_cancelled:%')` 로 넓힌다. `fulfillment_status` 컬럼이 없을 때(`hasColumn` false)는 지금 조건 그대로.
- `preview/home-ui/src/plans/screens-orders.js` `resolveV3Cells`: `status === 'cancelled'`이면 배지 「결제 취소됨」, 클래스는 기존 `plans-hist-row__st--no` 재사용, 환불 칸·진행상황 칸 숨김, 내역 칸만. 새 CSS 클래스·색 추가 금지.
- 내역 패널에는 3-1의 문구 한 줄만.

### 3-4. 화면 안내 (결제 직후)
- `paid-api.js` `completePaidCheckout`를 부르는 곳에서 결과에 `auto_cancelled: true`가 있으면 기존 안내창/토스트 틀로 3-1 문구를 보여 준다. 새 모달·새 스타일 금지. 부르는 곳을 찾아 파일:줄을 보고에 적는다.

## 4. 바꾸지 말 것
- 주문 생성 단계(`:1145-1167`)의 검사 규칙. pending 주문 막기는 이번에 하지 않는다(창 닫은 주문이 쌓이면 손님이 다시 못 사는 문제가 생김). ⚠ 열린 질문 Q2 참고.
- 환불표·환불 신청·`RefundService` 동작. `pack_not_found` 거절 로직도 그대로(자동취소로 그 경우가 안 생기게 하는 것이 목적).
- 포트원 금액·통화 검증(`PortOneCheckout::assertPaidMatchesOrder`).
- 즉시권(1회) 실패 경로 `recordImmediateFailure`(`:603-607`). 이번 범위 밖, 보고에 현황만.
- badge_addon 지급 실패. 이번 범위 밖, 보고에 현황만.
- 결제 켜기/끄기 변수, `STUDY114_PAID_MOCK_COMPLETE`, 배포 파일.
- 구매이력의 기존 칸 높이·여백(PR #215 결과) 1px도.

## 5. 수락 기준 (테스트)
새 `scripts/verify-paid-conflict-auto-cancel.php` (기존 `scripts/verify-*.php`의 check/PASS/FAIL 형식, 가짜 `PortOneApi` 주입. 실제 포트원 호출 금지):
1. pending 묶음권 주문 2개 → 첫 번째 완료 성공 → 두 번째 완료 → 포트원 cancel 1회 호출, 금액=주문금액, 주문 `cancelled`, 응답 200·`auto_cancelled:true`.
2. 같은 두 번째 주문을 웹훅으로 한 번 더 → cancel 호출 0회 추가, 200, 같은 결과.
3. Prime 자리 다 찬 상태에서 완료 → 자동취소, Prime 노출 행 0개 추가.
4. 포트원 cancel이 예외 → 주문 상태 그대로(pending/paid), 웹훅 500, 로그 `auto_cancel_failed`.
5. paid + 묶음권 미지급(`:512-530` 경우) → 자동취소, `cancelled`.
6. 정상 결제(충돌 없음) → 기존과 똑같이 지급, cancel 호출 0회.
7. mock 주문(dev_mock)에서 충돌 → 자동취소 안 부름(기존 동작 유지).
8. `listByUser`가 자동취소 주문은 보여 주고, 그냥 버려진 pending·일반 cancelled는 안 보여 줌.
9. 기존 결제·환불 verify 전부 PASS (`scripts/verify-*paid*`, `*refund*`, `*portone*`). 명령과 PASS/FAIL 개수를 보고.
10. 구매이력 「결제 취소됨」 줄 스크린샷 390·1280 (로컬 견본 가능, 견본이면 그렇게 적기).

## 6. 열린 질문 (종현 결정 · Q1은 위 문구로 구현, Q2·Q3는 구현하지 않고 보고에만 적기)
- Q1. 자동취소 안내 문구(3-1-7) 그대로 쓸지.
- Q2. 결제 전 pending 묶음권 주문을 프로필당 1개로 묶을지(예: 새 주문 만들 때 같은 프로필의 30분 지난 pending은 `cancelled`). 이번 PR에서는 **안 함**.
- Q3. 관리자 화면에 자동취소 목록을 따로 보여 줄지. 이번에는 ops 로그(091 테이블)와 error_log로만.

## 7. 운영 확인 (종현이 phpMyAdmin에서 · 읽기 전용)
`docs/worklog/grok-sync/sql/sec-H1-check-2026-11-14.sql` 참고. 새 SQL 적용은 없다.

## 8. 보고 형식
변경 파일(`git diff --stat`), 파일별 1~2줄 요약, 테스트 명령과 PASS/FAIL 수, 스크린샷 경로, 열린 질문 Q1~Q3, PR 번호·커밋.

## 공통 금지
- 새 브랜치에서 PR만 열고 보고. **머지·force push·운영 SQL 금지.** `reset --hard`, `stash drop` 금지.
- 키·비밀번호·토큰·세션값·paymentId 원문을 문서·커밋·로그·보고에 쓰지 않음(로그는 기존 형식 유지).
- 범위 밖에서 찾은 버그는 고치지 말고 보고서 「발견 목록」에만.
- 데스크톱 레이아웃 1px도 변경 금지(구매이력 새 배지 글자 외).
