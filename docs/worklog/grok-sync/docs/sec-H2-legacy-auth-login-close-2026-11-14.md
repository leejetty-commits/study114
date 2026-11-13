# H2 · 옛 PHP 로그인 주소(/auth/login) 닫기 (2026-11-14)

- 작성: 우동공과3 · 실행: Cursor · 최종검수: 우동공과3
- 기준: origin/main `efc881f7`
- 근거: `docs/worklog/grok-sync/docs/integrity-security-2026-11-14.md` H2 (같이 정리: L5 `GET /auth/logout`)
- 브랜치: `work/sec-h2-legacy-auth-close` (main 최신 pull 후 새로 만듦)
- **규칙: 새 브랜치에서 PR만 열고 보고. 머지·force push·운영 SQL 금지.**

## 1. 배경
지금 로그인은 SPA 화면(`/auth/#/login`)이 `POST /api/auth/login.php`를 부른다. 여기에는 로그인 횟수 제한(이메일 5회·IP 15회, `LoginRateLimiter`)이 있다.

그런데 예전 PHP 화면 경로가 운영에 그대로 살아 있다.
- `GET https://study114.net/auth/login` → 200, `<form method="post" action="/auth/login">`
- `POST /auth/login` → PHP `AuthController::loginSubmit`이 처리한다. **횟수 제한도, CSRF 토큰도 없다.**
- 그래서 관리자를 포함한 모든 계정 비밀번호를 제한 없이 대입해 볼 수 있다.
- 덤으로 이 경로는 `admin_level`·`must_change_password`를 세션에 넣지 않는다(SPA 경로와 다르게 로그인됨).
- `GET /auth/logout`만으로 로그아웃된다(다른 사이트가 링크·이미지로 로그아웃시킬 수 있음, L5).

SPA·e2e·메일 어디에서도 이 PHP 경로를 쓰지 않는다(아래 근거).

## 2. 정확한 위치 (origin/main `efc881f7`)
| 파일:줄 | 내용 |
|---|---|
| `public/.htaccess:16-17` | `RewriteRule ^auth/(login\|logout\|find-id\|find-password)/?$ index.php [L,QSA]` ← PHP로 보내는 줄 (보고서에는 16줄로 적었으나 실제 규칙은 17줄) |
| `public/.htaccess:18-23` | signup 경로들은 이미 SPA 해시로 302 (참고: 이 방식을 그대로 따라 함) |
| `src/routes/web.php:14-17` | `get/post /auth/login`, `post/get /auth/logout` |
| `src/routes/web.php:27-28` | `get /auth/find-id`, `get /auth/find-password` (PHP 빈 화면) |
| `src/Controllers/AuthController.php:33-50` | `loginSubmit` — 제한기 호출 없음 |
| `src/Controllers/AuthController.php:52-56` | `logout` — GET으로도 동작 |
| `public/api/auth/login.php:40-46` | 비교용: `LoginRateLimiter::assertPasswordAllowed` 있음 |
| `preview/auth-ui/src/layout.js:21,30-31,57` | SPA 해시 경로 `/login`, `/find-id`, `/find-password` |

쓰는 곳 조사 결과(main 기준): `preview/`·`e2e/`·`.github/`에서 `/auth/login`(PHP 경로)을 부르는 곳 0. e2e는 모두 `/api/auth/login.php`. PHP 뷰(`src/Views/auth/*.php`)끼리만 서로 링크한다.

## 3. 바꿀 것
1. `public/.htaccess` 17줄을 지우고, 같은 자리에 18~23줄과 같은 형식으로 4줄을 넣는다.
   ```
   RewriteRule ^auth/login/?$ /auth/#/login [R=302,NE,L]
   RewriteRule ^auth/logout/?$ /auth/#/login [R=302,NE,L]
   RewriteRule ^auth/find-id/?$ /auth/#/find-id [R=302,NE,L]
   RewriteRule ^auth/find-password/?$ /auth/#/find-password [R=302,NE,L]
   ```
   - `/auth/logout`은 로그아웃하지 않고 로그인 화면으로만 보낸다. 실제 로그아웃은 SPA가 쓰는 `/api/auth/logout.php`(POST) 그대로.
   - 16줄 주석은 「PHP MVC 인증 라우트는 닫음. SPA 해시로 보냄 (sec H2 2026-11-14)」로 바꾼다.
2. `src/routes/web.php`: `->post('/auth/login', …)`, `->get('/auth/logout', …)`, `->post('/auth/logout', …)` 3줄을 지운다. (htaccess를 누가 되돌려도 PHP가 받지 않게 이중으로 막음.) GET 화면 라우트는 남겨도 되고 지워도 된다 — 지우면 보고에 적기.
3. `src/Controllers/AuthController.php`: `loginSubmit()`·`logout()`을 지운다. 다른 곳에서 부르는지 `rg "loginSubmit|->logout\("`로 확인하고 결과를 보고에 적는다. 부르는 곳이 있으면 지우지 말고 맨 앞에 `http_response_code(404); return;`만 넣는다.
4. 정적 검사 `scripts/verify-legacy-auth-closed.mjs`(또는 .php): `.htaccess`에 `auth/(login|logout|find-id|find-password).*index.php` 규칙이 없을 것, `web.php`에 `post('/auth/login'`·`'/auth/logout'`이 없을 것. CI의 기존 verify 묶음에 넣을 수 있으면 넣고, 넣은 곳을 보고.

## 4. 바꾸지 말 것
- `public/api/auth/login.php`·`LoginRateLimiter`·`LoginService` 동작.
- `.htaccess`의 다른 줄, 특히 `SetEnv … "__…__"` 자리표시 줄들, 캐시 헤더, SPA fallback 순서. 배포 단계 자리표시 검사가 깨지면 안 됨.
- SPA 로그인 화면·문구·스타일.
- OAuth 경로(`/api/auth/oauth/*`).

## 5. 수락 기준
1. 로컬(Apache 또는 htaccess를 읽는 환경)에서: `GET /auth/login` → 302 `Location: /auth/#/login`. `POST /auth/login` → 302, 세션 생성 없음. `GET /auth/logout` → 302, 로그인 세션 유지됨.
2. `GET /auth/find-id` → 302 `/auth/#/find-id`, `GET /auth/find-password` → 302 `/auth/#/find-password`.
3. SPA 로그인·로그아웃·아이디 찾기·비번 찾기 e2e(`e2e/core-flow-auth.spec.js` 등) PASS.
4. 새 정적 검사 PASS, 기존 `scripts/check-no-committed-secrets.sh`와 배포 자리표시 검사 PASS.
5. 보고에 명령과 PASS/FAIL 수.
6. 배포 뒤 확인(종현 또는 우동공과3, 읽기만): `curl -sI https://study114.net/auth/login` → 302, `Location`에 `#/login`.

## 6. 열린 질문
- 없음. (PHP 뷰 파일 `src/Views/auth/*.php` 자체를 지울지는 이번 범위 밖. 보고에 남은 파일 목록만.)

## 공통 금지
- 새 브랜치에서 PR만 열고 보고. **머지·force push·운영 SQL 금지.** `reset --hard`, `stash drop` 금지.
- 키·비밀번호·세션값을 문서·커밋·보고에 쓰지 않음. 테스트 계정 비밀번호 포함.
- 범위 밖 버그는 고치지 말고 「발견 목록」에만.
- 데스크톱 레이아웃 1px도 변경 금지.
