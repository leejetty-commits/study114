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
| `sql/schema/085_pg_portone_sandbox.sql` | `pg_payment_id` · 환불 cancel 메타 컬럼 추가 |
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

- 운영 DB에 `085` **적용 금지** (파일만 PR).
- 운영 `.env` / CSP / `STUDY114_PAID_MOCK_COMPLETE` 변경 금지.
- 로컬 Docker에만 `085`(+필요 시 `083`) 적용.

## 남은 위험

- 웹훅 시크릿 비어 있으면 수신 불가(의도). 로컬은 complete 수동 재조회.
- 토스/포트원 CSP 도메인은 콘솔 차단 로그로 추가 조정 가능.
- 주문당 환불 행 UNIQUE → 2차 부분취소는 `pg_partial_cancel` 액션.
