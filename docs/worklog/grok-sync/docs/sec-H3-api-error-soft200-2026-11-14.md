# H3 · 닷홈이 API 오류(4xx) JSON을 HTML로 바꾸는 문제 피하기 (2026-11-14)

- 작성: 우동공과3 · 실행: Cursor · 최종검수: 우동공과3
- 기준: origin/main `efc881f7`
- 근거: `docs/worklog/grok-sync/docs/integrity-security-2026-11-14.md` H3
- 브랜치: `work/sec-h3-api-soft-error` (main 최신 pull 후 새로 만듦)
- **규칙: 새 브랜치에서 PR만 열고 보고. 머지·force push·운영 SQL 금지.**

## 1. 배경
운영(닷홈)에서는 PHP가 4xx 상태와 JSON 본문을 보내도, 서버가 본문을 Apache 기본 HTML로 바꿔 버린다. 그래서 화면이 오류 코드(`err.code`)와 안내 문구를 못 읽는다.

운영에서 확인한 것 (2026-11-14):
- `POST /api/auth/signup.php` 빈 본문 → **422 text/html "Unknown Reason"** (JSON 아님)
- `/api/messages/threads.php` 비로그인 → 401 text/html
- `/api/board/posts.php?board=nonexistent` → 422 text/html
- 서명 없는 웹훅 → 400 text/html

그래서 지금 운영에서 안 보이는 안내:
- 쪽지권이 없을 때 구매 안내창(`paid_gate`), 이메일 미인증 안내(`email_verify_required`), 결제 직전 필수항목 누락(`tier_fields_missing`), 묶음권 충돌(409), 결제 확인 실패 이유(422/502)
- **가입 화면의 「한 번호 3계정 초과」(`phone_account_limit`)와 「Gmail 별칭」 거절 문구** → 손님은 「입력값을 확인해 주세요.」만 본다.
- 퀵매칭 설정 「이번 주는 이미 저장했어요」(409)

이미 이 문제를 피해 간 곳이 있다: `public/api/tutor/profile-image.php:16-29`는 항상 HTTP 200으로 보내고 `ok:false`로 실패를 알린다. 이번에는 이 방식을 **요청한 화면에만** 쓰는 방식으로 넓힌다. (서버 설정은 우리가 못 바꾼다. 앞단 프록시가 오류 본문을 가로채는 것으로 보이며 `.htaccess`로 끄는 방법은 확인되지 않음.)

## 2. 방식 (한 줄 요약)
**화면이 요청 헤더 `X-Study114-Soft-Error: 1`을 보내면, 서버는 4xx 오류를 HTTP 200 + `{ok:false, error, message, http_status}`로 돌려준다.** 헤더가 없으면 지금과 똑같이 4xx. → e2e·외부 호출·웹훅은 그대로, 우리 화면만 오류 내용을 받는다.

## 3. 정확한 위치와 바꿀 것

### 3-1. 서버 공통 함수 (1곳)
- `src/bootstrap.php` (`study114_send_cors_headers` 근처, `:241`)에 새 함수:
  ```php
  function study114_json_error(int $status, array $body): never
  // 요청 헤더 HTTP_X_STUDY114_SOFT_ERROR === '1' 이고 400 <= $status < 500 이면:
  //   http_response_code(200); $body['http_status'] = $status; header('X-Study114-Status: '.$status);
  // 아니면: http_response_code($status);
  // Content-Type 은 호출한 쪽이 이미 보냄. echo json_encode($body, JSON_UNESCAPED_UNICODE); exit;
  ```
- 5xx는 바꾸지 않는다(서버 예외 문구가 밖으로 보이는 것을 막기 위해 — 보고서 L2). 예외: 아래 3-2의 `checkout.php:58` 502는 문구가 고정 안내라 soft 대상에 넣는다(함수에 `$allow5xx` 인자 또는 그 줄만 422 대신 처리 — 방법은 자유, 보고에 적기).

### 3-2. 서버에서 이 함수를 쓰게 할 곳 (이번 범위)
| 파일:줄 | 지금 | 바꿈 |
|---|---|---|
| `src/Paid/PaidApi.php:86-95` `fail()` | `http_response_code($status)` + echo | 본문을 만들어 `study114_json_error($status, …)` 호출 |
| `src/Messages/MessagesApi.php:133-141` `fail()` | 같음 | 같음 |
| `public/api/paid/checkout.php:55,58` | 422 / 502 `payment_verify_failed` | `PaidApi::fail` 경유로 soft 적용(502 포함, 문구 고정) |
| `public/api/auth/signup.php:65-87` | 503·422·422 직접 출력 | 422 두 곳은 `study114_json_error(422, …)`. 503·500은 그대로 |
| `public/api/auth/account-contact.php:24-26, 76-81` | 401·422 직접 출력 | `study114_json_error` |
| `public/api/auth/email/send-verification.php:30, 51` | 401·422 직접 출력 | `study114_json_error` (500은 그대로) |

`PaidApi::fail`을 쓰는 다른 파일(`public/api/quick-match/settings.php:29-35` 등)은 자동으로 같이 바뀐다. 그 목록을 `rg "PaidApi::fail|MessagesApi::fail" public src`로 뽑아 보고에 적는다.

### 3-3. 화면 쪽 (헤더 보내기 + 상태 읽기)
| 파일:줄 | 바꿈 |
|---|---|
| `preview/home-ui/src/paid-api.js:20-34` `parseJson` + 이 파일의 모든 `fetch` | 모든 요청에 `X-Study114-Soft-Error: 1`. `err.status = data.http_status ?? res.status`. 나머지 판정(`!res.ok \|\| data.ok === false`)은 그대로 |
| `preview/home-ui/src/messages-api.js:41-50` + 이 파일의 모든 `fetch`(`postForm` 포함) | 같음 |
| `preview/auth-ui/src/auth-api.js:29-61` `postJson` | 헤더 추가. `const status = data.http_status ?? res.status;` 로 바꾸고 `fallback` 계산·`err.status`에 이 값을 씀 |
| `preview/home-ui/src/email-verify-overlay.js:36` 근처 fetch | 헤더 추가, 같은 방식 |
| `preview/home-ui/src/mypage/quick-match-screen.js:29-37` | 헤더 추가. `status === 409` 판정을 `(saved.http_status ?? status) === 409` 로 |

같은 출처 요청이라 CORS 사전요청(preflight)은 생기지 않는다. 로컬 Vite 프록시에서도 동작하는지 확인.

## 4. 바꾸지 말 것
- 헤더가 **없는** 요청의 응답 상태코드(e2e가 4xx를 기대함 — `e2e/`에 `status()).toBe(4xx)` 22곳). 
- `public/api/paid/portone-webhook.php`의 상태코드(포트원 재전송이 5xx에 의존). 이 파일은 손대지 않음.
- 5xx 응답(위 checkout 502 예외만).
- `public/api/tutor/profile-image.php`, `withdraw-reason.php`(이미 200 방식).
- 오류 문구 자체, 안내창 디자인.
- Board·Admin·Support·Registration·Handoff·Reviews API의 `fail()` — 이번 범위 밖. 보고서 「다음 묶음」 목록에만. (단, 관리자 콘솔 2차 비번 작업(B1)은 이 함수를 그대로 쓰게 됨.)

## 5. 수락 기준
1. 새 `scripts/verify-soft-error.php`: 헤더 있음 → 200 + `ok:false` + `http_status` = 원래 값 / 헤더 없음 → 원래 4xx / 5xx는 헤더 있어도 5xx(checkout 502 예외).
2. 로컬 curl로 `POST /api/paid/checkout.php`(비로그인) 헤더 있음·없음 두 번: 200+`http_status:401` / 401. 결과를 보고에 (세션값 가림).
3. 가입 화면에서 로컬 DB로 같은 번호 4번째 가입 → 화면에 `phone_account_limit` 원문 문구가 뜸. Gmail 별칭(`a.b@gmail.com` 있을 때 `ab+x@gmail.com`) → 358 원문 문구가 뜸. 390·1280 스크린샷.
4. 쪽지권 없는 공급자로 쪽지 보내기 → 구매 안내창이 뜸(로컬). 스크린샷.
5. 기존 e2e·verify 전부 PASS(명령, PASS/FAIL 수).
6. 배포 뒤 운영 확인(읽기만): `curl -s -X POST -H 'Content-Type: application/json' -H 'X-Study114-Soft-Error: 1' --data '{}' https://study114.net/api/auth/signup.php` → 200, JSON `http_status:422`. 헤더 없이 → 기존처럼 422.

## 6. 열린 질문
- Q1. 나머지 API(Board·Admin·Support 등)도 다음 묶음에서 같은 방식으로 넓힐지. 권장: 예, B1(콘솔 2차 비번) 때 Admin부터.

## 공통 금지
- 새 브랜치에서 PR만 열고 보고. **머지·force push·운영 SQL 금지.** `reset --hard`, `stash drop` 금지.
- 키·비밀번호·세션값을 문서·커밋·보고에 쓰지 않음.
- 범위 밖 버그는 고치지 말고 「발견 목록」에만.
- 데스크톱 레이아웃 1px도 변경 금지.
