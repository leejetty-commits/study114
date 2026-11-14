# H2 · 옛 PHP 로그인 주소 닫기

**날짜:** 2026-11-14  
**브랜치:** `work/sec-h2-legacy-auth-close`  
**기준:** origin/main `efc881f7`  
**지시:** `docs/worklog/grok-sync/docs/sec-H2-legacy-auth-login-close-2026-11-14.md`  
**머지·force push·운영 SQL:** 하지 않음. 이 세션은 자기 작업을 승인하지 않음.

## 지시 요지

`/auth/login`·`/auth/logout`·`/auth/find-id`·`/auth/find-password`를 PHP로 보내지 않고 SPA 해시로 302. `POST /auth/login`과 GET·POST `/auth/logout` 라우트, `loginSubmit()`·`logout()`을 제거. 정적 검사를 verify 묶음에 넣는다. API 로그인·횟수 제한·`.htaccess` 자리표시·SPA 화면은 그대로.

## 한 일

- `.htaccess`의 PHP 전달 규칙 1줄을 302 4줄로 바꿨다. `/auth/logout`은 로그아웃하지 않고 `/auth/#/login`으로만 보낸다.
- `web.php`에서 `post /auth/login`, `get/post /auth/logout`과 GET 화면 라우트 `get /auth/login`, `get /auth/find-id`, `get /auth/find-password`를 지웠다.
- `AuthController::loginSubmit()`·`logout()`과 `LoginService` use를 지웠다. `loginForm()`·`findIdForm()`·`findPasswordForm()`는 남겼다.
- `scripts/verify-legacy-auth-closed.mjs`를 추가하고 `package.json` `verify:legacy-auth-closed`, `.github/workflows/verify-bundle.yml`에 넣었다.

## 호출 검색

- `loginSubmit`: 수정 전 `web.php` 라우트와 메서드 정의뿐. 다른 호출 0. 메서드를 삭제함.
- `AuthController::logout`: 수정 전 `web.php`의 get/post 라우트뿐. `->logout(` 호출 0. 메서드를 삭제함.
- `AuthSession::logout()`은 API 로그아웃 쪽 메서드라 그대로 둠.

## 검사

- `node scripts/verify-legacy-auth-closed.mjs` → 10 PASS, 0 FAIL
- `bash scripts/check-no-committed-secrets.sh` → PASS (`OK: 커밋된 OAuth/운영 비밀값 검사 통과`)
- `.htaccess` diff는 인증 리다이렉트 블록만. SetEnv 자리표시 줄은 변경 없음.
- Apache로 `GET/POST /auth/login` 302를 받지 못함. 이 환경에 httpd가 없음.
- `e2e/core-flow-auth.spec.js`는 실행하지 않음. 로컬 API `:8080`이 떠 있지 않고 Docker도 꺼져 있음. 스펙은 `/api/auth/login.php`만 호출한다.

## 남은 PHP 뷰

`src/Views/auth/login.php`, `find-id.php`, `find-password.php`, `signup-basic.php`, `signup-complete.php`, `signup-form.php`, `signup-role.php`, `signup-terms.php`, `partials/`

## 발견 목록 (이번 범위에서 고치지 않음)

- `src/Views/auth/signup-complete.php`에 `<form method="post" action="/auth/logout">`가 남아 있다. 운영에서는 `/auth/signup/complete`가 이미 SPA로 302라 이 폼이 나가지 않는다.
- `src/Views/auth/login.php`의 `action="/auth/login"` 폼은 파일로 남아 있다. 라우트는 제거했다.
- `web.php`의 `GET /`는 여전히 `study114_redirect('/auth/login')`이다. Apache에서는 그 주소가 다시 SPA 해시로 302된다.
