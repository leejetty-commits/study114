# 2026-11-14 sec-H1 지급 불가 자동취소

지시 요지: 포트원에서 결제는 됐는데 묶음권 충돌, Prime 자리 없음, 결제됐으나 팩이 없는 경우에는 전액 취소하고 주문을 `cancelled`로 둔다. mock 주문은 취소하지 않는다. 새 SQL 없음. 머지·force push·운영 SQL 없음.

이 세션은 자기 작업을 승인하지 않는다.

## 바꾼 것

- 포트원 검증을 통과한 뒤 지급이 막히면 전액 취소. 사유는 `지급 불가 자동취소`.
- 취소가 실패하면 주문 상태는 그대로 두고 예외를 다시 던진다. 웹훅은 기존처럼 500.
- 이미 `auto_cancelled:` 인 주문은 포트원 재조회 없이 같은 안내를 돌려준다.
- 구매이력은 자동취소 행만 추가하고, pending·일반 취소는 그대로 숨긴다.
- 화면 배지는 `결제 취소됨`. 상세는 안내 문장만. 새 CSS 없음.
- 결제 직후 `auto_cancelled` 이면 구매이력에 결제 완료 줄을 붙이지 않고 결과 화면으로 보낸다.

고객 문구: 선택한 상품을 지금 지급할 수 없어 결제를 자동으로 취소했어요. 카드사에 따라 환불까지 3~5영업일 걸릴 수 있어요.

## 그대로 둔 것

- 주문 생성 검사(`assertMemoPurchaseAllowed`)는 수정하지 않았다.
- 쪽지 즉시권 실패는 기존처럼 `recordImmediateFailure` 후 지급 실패 응답이다. 자동취소하지 않는다.
- `badge_addon` 지급 실패는 기존처럼 fulfillment failed 로 남기고 끝난다. 자동취소하지 않는다.
- dev_mock 충돌은 `PaidConflictException` 이고 주문은 pending 이다.

## 열린 질문

- Q1. 위 안내 문구 그대로 구현했다.
- Q2. 결제 전 pending 묶음권을 프로필당 1개로 묶는 일은 하지 않았다.
- Q3. 관리자 자동취소 목록은 만들지 않았다. ops 로그(091)와 error_log 만 사용한다.

## 운영

새 SQL 없음. 종현이 phpMyAdmin에서 `docs/worklog/grok-sync/sql/sec-H1-check-2026-11-14.sql` 을 읽기 전용으로 확인한다. 083 `cancelled`, 063 fulfillment 컬럼, 091 ops 로그 테이블.

## 테스트

- `php scripts/verify-paid-conflict-auto-cancel.php` — 9 PASS / 0 FAIL (PHP 이미지의 SQLite).
- 로컬 MySQL 8 임시 DB에서 같은 LIKE 조건 — 자동취소 행과 paid 행만 조회된 뒤 DB를 삭제했다. SQLite는 백슬래시를 LIKE 이스케이프로 보지 않아, 운영 SQL은 MySQL 이스케이프를 유지했다.
- 기존 검증은 아래 발견 목록. K3·N10·foundation 문구 불일치는 이번 변경으로 고치지 않았다.

## 스크린샷

견본. 운영 데이터가 아니다.

- `docs/worklog/2026/11/h1-history-fixture.html`
- `docs/worklog/2026/11/h1-history-390.png` — 배지 `결제 취소됨`과 안내 문장 전체.
- `docs/worklog/2026/11/h1-history-1280.png` — 같은 견본. 캡처 프레임이 카드 오른쪽을 잘라 문장 끝이 프레임 밖에 있다. CSS는 바꾸지 않았다.

## 보완

- GET_LOCK 5초 실패는 `PaidLockBusyException`이다. 자동취소 조건에서 빼 두어 주문은 그대로 두고 다시 시도한다.
- 취소 직전에 `fulfillment_status=succeeded` 인 주문은 노출권을 포함해 취소하지 않는다. 묶음권은 기존처럼 이 주문 팩이 있으면 취소하지 않는다.
- 검증 9·10: 11 PASS / 0 FAIL.

## 발견 목록

- `verify-refund-apply.mjs` 109 passed, 2 failed. K3, N10. 기존.
- `verify-refund-foundation.mjs` 27 passed, 7 failed. D5 D6 D8 D9 D10 E1 E2. 이번 diff가 그 문구를 지우지 않았다.
- docker PHP 이미지에는 `config/database.php` 가 없어 complete-gate의 MySQL 구간, 339 샌드박스, PR-A/PR-B integration 은 설정 없음으로 끝났다. 게이트의 플래그 거절 구간은 PASS.
