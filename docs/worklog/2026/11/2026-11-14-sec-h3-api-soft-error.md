# H3 · API 오류를 화면 요청만 HTTP 200으로

**날짜:** 2026-11-14  
**브랜치:** `work/sec-h3-api-soft-error`  
**기준:** origin/main `efc881f7`  
**지시:** `docs/worklog/grok-sync/docs/sec-H3-api-error-soft200-2026-11-14.md`  
**머지·force push·운영 SQL:** 하지 않음. 이 세션은 자기 작업을 승인하지 않음.

## 지시 요지

닷홈이 4xx JSON 본문을 HTML로 바꿔 화면이 `error`·`message`를 못 읽는다. 화면이 `X-Study114-Soft-Error: 1`을 보내면 4xx만 HTTP 200 + `{ok:false, error, message, http_status}`로 돌린다. 헤더가 없으면 지금과 같은 4xx. 5xx는 그대로 두고, 결제 확인 502(문구 고정)만 예외. 웹훅·문구·데스크톱 레이아웃은 그대로.

## 한 일

- `study114_json_error($status, $body, $allow5xx = false)`를 `src/bootstrap.php`에 추가했다. 헤더 값이 정확히 `1`이고 4xx일 때만 200. `$allow5xx`가 true인 5xx도 같다. 그때 `X-Study114-Status`에 원래 코드를 넣는다.
- `PaidApi::fail`·`MessagesApi::fail`이 이 함수를 탄다. 500은 `$allow5xx` 기본값 false라 헤더가 있어도 500이다.
- `checkout.php`의 결제 확인 502만 `PaidApi::fail(..., [], true)`로 예외에 넣었다. 422 `payment_verify_failed`는 원래 `PaidApi::fail`이라 4xx soft가 같이 적용된다.
- 가입 422 두 곳, 계정 연락처 401·422, 인증메일 401·422를 `study114_json_error`로 바꿨다. 503·500·405는 그대로다.
- 결제·쪽지 클라이언트는 모든 요청에 헤더를 붙이고 `err.status = data.http_status ?? res.status`로 읽는다. `postJson`, 이메일 인증 오버레이, 퀵매칭 저장(409)도 같다.
- 가입 화면은 `signupApi`를 쓰지 않고 `signup-role.js`가 `signup.php`를 직접 호출한다. 지시 목록의 `postJson`만 고치면 가입 화면에 헤더가 안 간다. 그래서 그 fetch에도 헤더를 넣고 `http_status`를 오류 문구 계산에 쓴다.

## 502 처리

`PaidApi::fail`의 다섯 번째 인자 `$allow5xx`. 기본 false. checkout 502만 true.

## PaidApi::fail · MessagesApi::fail 을 쓰는 곳

클래스 안:

- `PaidApi.php` 401·403·400·`email_verify_required`·`paid_gate`·409·`tier_fields_missing`·422·500
- `MessagesApi.php` 401·400·422·`paid_gate`·`email_verify_required`·500(고정 문구)

공개 엔드포인트: `public/api/paid/`의 catalog, checkout, history, notices, refund, roi, status, tier-check, waitlist. `public/api/messages/`의 attachments, entitlements, threads. `public/api/quick-match/settings.php`.

## 다음 묶음

`fail()`이 아직 원래 4xx인 곳: `BoardApi`, `AdminApi`, `SupportApi`, `RegistrationApi`, `HandoffApi`, `ProviderReviewApi`. 권장: 관리자 콘솔 2차 비번(B1) 때 Admin부터.

## 검사

- `docker exec study114-api-dev php scripts/verify-soft-error.php` → **37 PASS, 0 FAIL**
  - 헤더 있음 422/401/409 → 200 + `http_status`
  - 헤더 없음·헤더 값이 `0` → 원래 4xx, `http_status` 없음
  - 헤더 있어도 500·503 → 그대로
  - 502 + allow5xx + 헤더 → 200 + `http_status` 502. 헤더 없으면 502
  - checkout 비로그인 + 헤더 → 200, `http_status` 401, `unauthorized`
  - checkout 비로그인 헤더 없음 → 401, JSON, `http_status` 없음
- 호스트 curl `POST /api/paid/checkout.php` 빈 본문 (세션 쿠키는 적지 않음)
  - 헤더 있음: HTTP 200, `Content-Type: application/json`, `X-Study114-Status: 401`, 본문 `ok:false`, `error:unauthorized`, `http_status:401`
  - 헤더 없음: HTTP 401, JSON, `error:unauthorized`, `http_status` 없음
- 호스트 curl `POST /api/auth/signup.php` 빈 본문
  - 헤더 있음: HTTP 200, `X-Study114-Status: 422`, `error:validation`, `message`는 「이메일을 입력해 주세요.」, `http_status:422`
  - 헤더 없음: HTTP 422, 같은 JSON, `http_status` 없음
- `node scripts/verify-paid-complete-gate.mjs` → ok
- `node scripts/verify-paid-renewal.mjs` → PASS 38 / FAIL 0
- `node scripts/verify-refund-apply.mjs` → 109 passed, 2 failed. 실패는 `RefundService`의 K3·N10이고 이번 diff에 그 파일은 없다.

## 하지 않은 확인

- 가입 화면 4번째 번호·Gmail 별칭, 쪽지권 없는 공급자 구매 안내창의 390·1280 스크린샷. 로컬 계정을 새로 만들지 않았다.
- 기존 e2e 전체. 이 worktree에는 `node_modules`가 없고, 스펙은 미리보기 `:5174`와 시드 로그인을 쓴다. e2e는 헤더를 보내지 않는 `request`라 4xx 기대는 코드상 그대로다.
- 배포 뒤 운영 curl. 머지·배포를 하지 않았다.

## 발견 목록 (이번 범위에서 고치지 않음)

- `preview/auth-ui/src/screens/signup-verify-email.js`의 인증메일 재발송 fetch는 헤더가 없다.
- `auth-api.js`의 `fetchMeApi`(`/api/auth/me.php`)는 `postJson`이 아니라 헤더가 없다.
- 퀵매칭 GET(`/api/quick-match/settings.php`)은 헤더가 없다. 저장 POST만 붙였다.
- 가입 400·405, 계정 연락처 405, 인증메일 405는 직접 4xx다.
- `PaidApi::run`의 500은 예외 문구를 본문에 넣는다. 헤더가 있어도 500이라 soft로 바뀌지 않는다.
- 같은 출처 요청이라 사전요청은 없다. `Access-Control-Allow-Headers`는 여전히 `Content-Type`만이다.
- `verify-refund-apply.mjs` K3·N10은 이 기준 커밋에서 이미 실패한다.
