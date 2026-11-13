# 339 — 포트원 V2 + 토스 테스트 채널 샌드박스

**날짜:** 2026-11-11  
**브랜치:** `work/339-pg-portone-sandbox`  
**worktree:** `D:\work\study114\.wt\work-339-pg-portone-sandbox`  
**범위:** 로컬 결제창 → 승인 → 부분취소. 운영·배포·운영 DB 없음.

## 지시 요점

- `PG_PROVIDER=portone_test`일 때만 포트원. 아니면 기존 `dev_mock`.
- 금액은 서버 `PaidCatalog`만. Secret은 프런트 미전송.
- 확정: `GET /payments/{paymentId}` → PAID·금액·통화 일치 시에만 complete/fulfill (멱등).
- 환불: `RefundService::submit` 자동승인 직전 cancel. 실패 시 `requested` 유지.
- 웹훅: 서명 검증. 시크릿 없으면 거절. 로컬은 수동 재조회.
- CSP: Vite 로컬·preview 헤더만. 운영 CF CSP 무변경.

## 변경 파일

| 경로 | 내용 |
|------|------|
| `sql/schema/090_pg_portone_columns.sql` | `pg_payment_id` · 환불 cancel 메타 컬럼 추가 |
| `src/Paid/Pg/*` | PgProvider · PortOneClient · WebhookVerifier · PortOneCheckout |
| `src/Paid/ProviderCheckoutRepository.php` | pg_provider·pg_payment_id 저장 · getByPaymentId |
| `src/Paid/ProviderCheckoutService.php` | 어댑터 분기 create · completePortOne* |
| `src/Paid/RefundService.php` / `RefundRepository.php` | 승인 전 cancel · remaining 부분취소 |
| `public/api/paid/checkout.php` | portone complete 분기 |
| `public/api/paid/refund.php` | `pg_partial_cancel` |
| `public/api/paid/portone-webhook.php` | 웹훅 수신 |
| `preview/home-ui/src/plans/portone-checkout.js` | Browser SDK V2 |
| `preview/home-ui/src/plans/screens.js` · `paid-api.js` | 결제창·완료 |
| `preview/home-ui/vite.config.js` | 로컬 CSP |
| `docker/docker-compose.dev.yml` | PORTONE_* env 전달 |
| `.env.example` | 이름만 |
| `docs/internal/cur-006-email-verify-open-apis.md` | 웹훅 등록 |
| `scripts/verify-cur-006-email-verify-inventory.mjs` | intentional |
| `scripts/verify-339-pg-portone-sandbox.php` | 게이트·스키마 검증 |

## 환경변수 이름 (값 제외)

`PG_PROVIDER`, `PORTONE_STORE_ID`, `PORTONE_CHANNEL_KEY`, `PORTONE_API_SECRET`, `PORTONE_WEBHOOK_SECRET`

## 확인 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | 쪽지권 1건 결제 → DB·지급·콘솔 | 로컬 API·스키마·어댑터 준비. **브라우저 테스트카드·콘솔 캡처는 PR 후 수동 확인 권장** |
| 2 | 부분취소 2회 · 초과 거절 | `submit` cancel + `pg_partial_cancel` · 서버 remaining 가드 |
| 3 | 금액/paymentId 위조 거절 | completePortOneOrder 단건 조회 대조 |
| 4 | 동일 paymentId 완료 2번 | 기존 completeOrder 멱등 |
| 5 | PG_PROVIDER 주석 → dev_mock | PgProvider 검증 OK |
| 6 | 결제창 닫기 → 미결제·안내 | 프런트 cancel 문구 |
| 7 | CI inventory 등 | `verify-339` 14/14 · CUR-006 inventory OK |

## 배포 전 사용자 할 일

- 운영 SQL은 `090`·`091`. 종현이 phpMyAdmin에서 089 뒤에 적용. 롤백은 091 다음 090.
- 운영 `.env` / CSP / `STUDY114_PAID_MOCK_COMPLETE` 변경 금지.
- 로컬 Docker에만 `085`(+필요 시 `083`) 적용.

## 리뷰 수정 (2026-11-11)

- `pg_partial_cancel` API 제거 → `scripts/339-portone-partial-cancel-cli.php` (상한=`refund_won`)
- 본주문→배지 순 취소, 실패 시 전체 롤백 + orphan cancel ops 로그
- portone_test만 `refunded` 마감, dev_mock은 `approved`
- 철회: `refunded`/`pg_cancel_id` 거절 · UI 환불 완료·철회 숨김
- immediate `dispatch_status` → 계산기 `sent`
- pack `source_order_ref`만 · `pack_not_found`
- 통화 KRW만 · dotenv는 `PG_`/`PORTONE_`만 · cancel ID JSON 누적
- `verify-339` 모의 클라이언트 25/25

## 검수 보강 (2026-11-11, 승인 후)

- `sql/schema/091_pg_cancel_ops_log.sql` + `PortOneCancelOpsLog` + `Connection::openIndependent` — 취소 성공 후 meta 실패·중간 실패 orphan을 TX 롤백과 분리 기록
- `verify-339`: 노출 submit 배지 취소 중간 실패 → DB 롤백·ops 로그 · meta fail ops · 중복 complete 팩 COUNT=1
- 로컬 Docker만 056·061·066·091 적용. `verify-339` **34/34**
- `RefundRepository` `final` 해제(메타 실패 목용)

## orphan 바깥 롤백·중복 제거 (2026-11-11)

- submit/CLI/withdraw 바깥 catch: rollBack 전 `logOrphanPortOneCancels(orphan_after_commit_fail)`
- `payment_id+cancel_id` 요청 내 dedup — meta 실패 경로 이중 INSERT 제거
- verify: finalize 실패 → ops 1 · 환불 0 · paid. **39/39**

## 남은 위험

- 웹훅 시크릿 비어 있으면 수신 불가(의도). 로컬은 complete 수동 재조회.
- 토스/포트원 CSP 도메인은 콘솔 차단 로그로 추가 조정 가능.
- 취소 성공 후 이후 배지 취소 실패 시 PortOne orphan cancel은 운영 확인 필요(로그·`provider_pg_cancel_ops_log`).
- 테스트카드·포트원 콘솔 캡처는 수동 확인.
- 운영에 `090`·`091` 미적용 — 종현이 phpMyAdmin에서 089 뒤에 적용. 롤백은 091 다음 090.

---

## 로컬 결제창 디버그 — CSP 3단계 + PDO 버그 (2026-11-11)

커밋 3건(`077f46b2` · `5208a78b` · `08137136`), PR [#164](https://github.com/leejetty-commits/study114/pull/164) CI 전부 통과.

### 증상

로컬 `http://127.0.0.1:5174` 에서 10회권 결제하기 클릭 시 두 가지 오류 발생:

1. `Failed to fetch` — 결제창이 전혀 열리지 않음
2. 브라우저 콘솔 `ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep` (CSP 프레임 차단)

### 원인1 — connect-src 누락 → 커밋 `077f46b2`

포트원 V2 SDK가 결제 준비 시 `https://checkout-service.prod.iamport.co/api/prepare/v2` 에 POST 요청을 보내는데, 로컬 Vite dev server의 `Content-Security-Policy` `connect-src`에 이 호스트가 없어 브라우저가 차단.

**수정:** `preview/home-ui/vite.config.js` — server·preview 양쪽의 `connect-src` 에 `https://checkout-service.prod.iamport.co` 추가.

```
connect-src … https://checkout-service.prod.iamport.co …
```

### 원인2 — frame-src 차단 → 커밋 `5208a78b`

SDK 자체(`cdn.portone.io/v2/browser-sdk.js`) 로드는 정상이었으나, SDK가 결제 화면을 표시할 때 내부적으로 `https://checkout-service.prod.iamport.co/driver-host?…` iframe을 삽입함.  
기존 `frame-src` 에 `*.portone.io`, `*.tosspayments.com`, `cdn.portone.io` 는 있었지만 `checkout-service.prod.iamport.co` 는 없어 CSP가 iframe을 차단.

**수정:** `preview/home-ui/vite.config.js` — server·preview 양쪽의 `frame-src` 에 `https://checkout-service.prod.iamport.co` 추가.

> **주의:** `vite.config.js` CSP 변경은 **Vite dev server 재시작 후에만 반영**된다.  
> 브라우저(크롬) 탭을 새로고침해도 이전 CSP 헤더가 유지되므로, 수정 후에는 반드시 `vite dev` 재기동 후 테스트할 것.

### 원인3 — ProviderCheckoutRepository 생성자 PDO 인자 누락 → 커밋 `08137136`

커밋 `166b9edf`에서 `ProviderCheckoutRepository::__construct(PDO $pdo)` 로 변경됐으나 `public/api/paid/checkout.php` 의 `action=complete` 분기는 `new ProviderCheckoutRepository()` (인자 없음)으로 남아 있었음.  
결과: `Too few arguments to function … __construct(), 0 passed … exactly 1 expected` Fatal Error.

`ProviderCheckoutService`, `RefundService` 등 다른 호출부는 이미 PDO를 주입하고 있었고, `verify-339` 는 서비스 클래스를 직접 호출하여 `checkout.php` HTTP 엔드포인트를 거치지 않아 잡히지 않았음.

**수정:**
- `use Study114\Database\Connection;` import 추가
- `new ProviderCheckoutRepository(Connection::get())` 로 PDO 주입
- `verify-339` 에 `checkout_complete: ProviderCheckoutRepository(PDO) 생성자+getByRef` 회귀 테스트 1건 추가

### 결과

| 항목 | 내용 |
|---|---|
| 결제창 | 토스 테스트 결제창(`checkout-service.prod.iamport.co/driver-host?…`) 정상 표시 |
| 결제 | 4,000원 dev_mock 완료, status=`paid` |
| 결제 완료 화면 | `#/plans/result` — "결제 완료 · 쪽지권 · 10회권 · 4,000원" |
| 쪽지권 | `pack_size=10, remaining=10` (DB 직접 확인) |
| 테스트 | **40/40** 통과 (회귀 테스트 포함) |
| CI | PR #164 — 9/9 체크 모두 SUCCESS |
| CSP 위반 | 없음 |

### 운영 반영 전 필수 (아직 로컬 전용)

지금 수정한 CSP는 **Vite dev server(`vite.config.js`) 한정**이다. 운영 배포 시 아래를 추가해야 한다.

| CSP 지시어 | 추가 호스트 |
|---|---|
| `connect-src` | `https://checkout-service.prod.iamport.co` |
| `frame-src` | `https://checkout-service.prod.iamport.co` |
| `script-src` | (SDK 로드 도메인이 바뀌면 재검토) |

적용 위치: 운영 `.htaccess` / CF 헤더 변환 규칙 (운영 CSP 담당자 확인 후 진행).

### 남은 수동 테스트 (머지 전 필수)

아래 3가지를 수동으로 통과해야 PR #164 머지 가능:

1. **쪽지 1~3회 사용 후 환불** — 사용 구간별 환불 금액 서버 계산 정확 여부
2. **노출상품 + 배지 시작 전 환불** — 전액 환불 정상 처리 여부
3. **결제창 닫기 시 미결제 유지** — 창 닫기 후 주문 `pending` 유지, 재결제 가능 여부
