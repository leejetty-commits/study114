# 270 가입 이메일 인증 — 다시 보내기 시간: 원인 확인 후 서버도 10분으로 맞추기

> **상태: 확정됨 (2026-10-20 종현 확정).** 이 문서에 적힌 것만 한다. 아래 「허용 파일」 밖은 손대지 않는다.
> 이 문서는 저장소에 올라가 있어도 **시작 조건(1장)을 지키기 전에는 시작하지 않는다.** 범위 밖 수정이 필요하면 고치지 말고 멈추고 보고한다(8장).

- 작업 번호: 270
- 날짜: 2026-10-20
- 브랜치 이름: `cursor/270-resend-timer-20261020`
- 박스 사본: `/workspace/study114/handoffs/270-cursor-directive-resend-timer.md`
- 저장소 경로: `docs/worklog/grok-sync/docs/270-cursor-directive-resend-timer.md`
- 기준 코드: `origin/main` `524ae692` (`Merge branch 'cursor/269-input-gender-20261020' into main`). 시작할 때 최신 `origin/main`에서 다시 확인한다(1장).
- 모델: **grok-4.7 high만** 쓴다. fast 모델 금지.
- 요약: 가입 인증 메일 대기 화면은 「다시 보내기는 10분 뒤에 할 수 있어요.」라고 안내하는데, 실제 사이트(10-18, 10-20 점검)에서는 버튼 카운트다운이 **약 5분**이다. **먼저 원인을 코드로 확인하고**, 코드로 고칠 수 있는 원인이면 최소로 고친다. 실제 서버 파일을 종현이 바꿔야 하는 원인이면 **고치지 말고 할 일을 보고**한다. **화면 문구는 이미 10분이 맞으므로 바꾸지 않는다.**

> 쉬운 말 안내: 화면 글씨는 「10분」인데 버튼 숫자는 5분부터 줄어듭니다. 버튼 숫자는 서버가 알려 주는 「남은 시간」을 그대로 셉니다. 그래서 서버 쪽이 5분(300초)으로 계산하고 있다는 뜻입니다. 왜 그런지 찾고, 서버를 10분(600초)으로 맞춥니다.

---

## 0. 결정 확인 (2026-10-20 종현 확정, 임의로 바꾸지 말 것)

| # | 항목 | 확정값 |
|---|---|---|
| 1 | 목표 | 다시 보내기 대기 시간은 **화면 문구·서버 모두 10분(600초)**. |
| 2 | 순서 | **원인 확인 먼저**, 그다음 수정. 원인이 확인되지 않으면 고치지 않고 보고. |
| 3 | 화면 문구 | 「…다시 보내기는 10분 뒤에 할 수 있어요.」 **그대로 둔다.** |
| 4 | 약관 「보기」 | 새 탭으로 여는 지금 동작 **유지. 건드리지 말 것.** |
| 5 | 비밀번호 찾기 | 재설정 메일 대기 **5분(300초) 값은 그대로.** 바꾸지 말 것. |
| 6 | 링크 유효 시간 | 인증 링크 24시간 그대로. |

---

## 1. 시작 조건

1. `git fetch` 후 `524ae692`가 최신 `origin/main`의 조상인지 확인한다. 아니면 시작하지 말고 보고한다.
2. 최신 `origin/main`에서 새 브랜치 `cursor/270-resend-timer-20261020`을 만든다. 같은 이름 브랜치가 이미 있으면 멈추고 보고한다.
3. `git status`가 깨끗한지 확인한다.
4. **push까지만 한다. `main` 병합·배포·force-push 금지.**
5. 운영 DB·운영 서버 파일·FTP는 건드리지 않는다.

```bash
git fetch origin
git rev-parse origin/main
git merge-base --is-ancestor 524ae692 origin/main && echo ANCESTOR-OK
git status --short
git checkout -b cursor/270-resend-timer-20261020 origin/main
```

---

## 2. 현재 확인된 사실 (`524ae692` 기준, 파일:줄)

### 2-1. 화면 쪽 (바꾸지 않음, 근거로만)

| 확인 | 위치 |
|---|---|
| 안내 문구 「…다시 보내기는 10분 뒤에 할 수 있어요.」 | `preview/shared/auth-welcome-copy.js:31` |
| 그 문구를 쓰는 화면 | `preview/auth-ui/src/screens/signup-verify-email.js:115` |
| 버튼 카운트다운은 서버가 준 남은 시간(`resend_available_in`)을 셈 | 같은 파일 `:221-241`, `:264`, `:273` |

→ 화면은 자기가 10분을 정하지 않는다. **숫자는 서버가 정한다.**

### 2-2. 서버 쪽

| 확인 | 위치 |
|---|---|
| 설정값 600초 | `config/auth.php:31-32` `'email_verify_resend_cooldown_seconds' => 600` |
| 비밀번호 찾기 300초 (바꾸지 않음) | `config/auth.php:28-29` `'password_reset_resend_cooldown_seconds' => 300` |
| 설정을 읽는 곳, **없으면 300초** | `src/Auth/EmailVerificationService.php:32` `?? 300` |
| **0 이하이면 300초** | 같은 파일 `:33-34` |
| 아직 기다려야 하면 남은 시간 돌려줌 | 같은 파일 `:54-57` (`resendSecondsRemaining` 호출) |
| 막 보냈을 때 돌려주는 값 = 쿨다운 그대로 | 같은 파일 `:75` `'resend_available_in' => $cooldown` |
| 남은 시간 계산 | `src/Auth/AuthTokenRepository.php:83-109` |
| └ 생성 시각은 DB 값 | `:89-96` `SELECT created_at …` (토큰은 `:21` `DATE_ADD(NOW(), …)` 등 DB 시계로 저장) |
| └ 현재 시각은 PHP 값 | `:101` `strtotime(created_at)`, `:106` `time() - $createdAt` |

### 2-3. 배포 워크플로 (작성자가 미리 본 것, 작업자가 다시 확인)

| 확인 | 위치 |
|---|---|
| `Deploy public/ via FTP` → 서버 `/hosting/study114/html/` | `.github/workflows/deploy.yml:178-189` (`local-dir: "./public/"`) |
| `Deploy src/ via FTP` → 서버 `/hosting/study114/src/` | `.github/workflows/deploy.yml:196-206` (`local-dir: "./src/"`) |
| **`config/`를 올리는 단계는 찾지 못함** | `deploy.yml` 전체에서 다시 확인할 것 |
| `config/auth.php`는 다른 워크플로의 감시 경로에만 나옴 | `.github/workflows/cur-006-resend.yml:52` |
| 서버 전용 설정 예시 | `config/dothome.env.example`, `config/database.php.dothome.example` |

---

## 3. 추정 원인 (작업자가 코드로 확정할 것)

| # | 추정 | 지금 근거 | 맞으면 누가 고치나 |
|---|---|---|---|
| ① | **실제 서버의 `config/auth.php`가 예전 파일**이라 `email_verify_resend_cooldown_seconds` 키가 없음 → `:32` 대체값 **300초** 사용 | 배포가 `public/`·`src/`만 올림(2-3). 증상이 정확히 5분 = 300초. | 서버 파일은 **종현**(4-2), 대체값은 작업자(5-1) |
| ② | DB `NOW()`와 PHP `time()` 시간대 차이로 남은 시간이 어긋남 | `AuthTokenRepository.php:101,106`이 두 시계를 섞음 | 작업자(5-2) |

- 참고: ②만으로는 보통 **몇 시간 단위**(예: 9시간)로 어긋나 「0초」나 「10분 그대로」가 되기 쉽다. 「정확히 약 5분」은 ①에 더 잘 맞는다. 단, **막 보낸 직후 값은 `:75`에서 쿨다운을 그대로 돌려주므로 ②와 무관**하다. 처음 보낸 직후에도 5분이면 ①이 원인이다.
- 둘 다 해당할 수 있다. 각각 따로 판정해 보고한다.

---

## 4. 원인 진단 (코드만 읽는다. 운영 서버 접속 금지)

### 4-1. 확인할 것

1. `deploy.yml`의 모든 단계에서 `config/`를 업로드하거나 제외(`exclude`)하는 부분이 있는지. 다른 워크플로가 서버에 `config/`를 올리는지(`rg -n "config" .github/workflows`).
2. 서버 코드가 설정을 어디서 읽는지: `config/auth.php`를 `require`하는 곳을 찾고(`rg -n "auth.php" src public`), 서버에서 그 경로가 `/hosting/study114/` 아래 어디인지(배포 경로와 비교).
3. 서버 전용 설정 파일·환경변수(`study114_env`, `dothome.env`)가 `email_verify_resend_cooldown_seconds`를 덮어쓸 수 있는지.
4. DB 연결 시 시간대 지정(`SET time_zone` 등)과 PHP `date_default_timezone_set`이 있는지(`rg -n "time_zone|timezone" src public config`). 서로 같은지.
5. `auth_tokens.created_at` 컬럼 종류(`sql/` 안 스키마) — `TIMESTAMP`/`DATETIME`, 기본값 `CURRENT_TIMESTAMP` 여부.

### 4-2. 판정 기준

- 배포가 `config/`를 올리지 않는다 → **①은 「코드로 못 고치는 원인」**. 실제 서버 `config/auth.php`는 고치지 말고, 종현이 할 일을 보고(11장)한다. 예: 「서버 `/hosting/study114/config/auth.php`에 `'email_verify_resend_cooldown_seconds' => 600,` 한 줄 추가(또는 저장소 최신 파일로 교체, 단 서버 비밀값 보존)」.
- 그래도 같은 사고를 줄이기 위해 **대체값 300 → 600**은 코드로 고친다(5-1). 이 코드 수정은 `src/` 배포로 서버에 반영된다.
- 시간대가 서로 다를 수 있다(4-1의 4번이 없거나 다름) → ②는 코드로 고친다(5-2).

---

## 5. 수정 (최소로. 원인이 확인된 것만)

### 5-1. 대체값 600초 (원인 ① 확인 시)

| 파일:줄 | 전 | 후 |
|---|---|---|
| `src/Auth/EmailVerificationService.php:32` | `?? 300` | `?? 600` |
| 같은 파일 `:34` | `$cooldown = 300;` | `$cooldown = 600;` |

- **비밀번호 찾기 쪽 300(다른 서비스·`config/auth.php:29`)은 바꾸지 않는다.**

### 5-2. 남은 시간을 한 시계로 (원인 ② 확인 시)

- `src/Auth/AuthTokenRepository.php:83-109` `resendSecondsRemaining`에서 경과 시간을 **DB 시계 하나로** 계산한다. 예: `SELECT TIMESTAMPDIFF(SECOND, created_at, NOW()) AS elapsed …`로 바꾸고 `strtotime`/`time()`을 쓰지 않는다.
- 함수 이름·인자·돌려주는 값 의미(0 = 지금 가능)는 그대로. 다른 함수(`:49` 만료 확인 등)는 이번에 바꾸지 않는다. 같은 문제가 보이면 **보고만** 한다.

### 5-3. `config/auth.php`

- 이미 600이다. **바꿀 필요가 없으면 바꾸지 않는다.** 주석만 고치는 것도 하지 않는다.

### 5-4. 배포 워크플로

- **읽기만.** `config/`를 배포에 넣는 것이 낫다고 판단되면 **고치지 말고 제안만 보고**한다(서버 비밀값 덮어쓰기 위험).

---

## 6. 금지 범위

1. **허용 파일 밖 수정 금지.** 허용: `config/auth.php`, `src/Auth/EmailVerificationService.php`, `src/Auth/AuthTokenRepository.php`, (읽기 위주) `.github/workflows/*`.
2. 화면 문구(`preview/shared/auth-welcome-copy.js`, `signup-verify-email.js` 등 `preview/**` 전부) 금지.
3. 약관 화면·약관 「보기」 새 탭 동작 금지.
4. 비밀번호 찾기 5분(300초) 값과 그 코드 금지.
5. 운영 DB·운영 서버 파일·FTP·시크릿 금지. 마이그레이션·SQL 추가 금지.
6. `git add -A` 금지(파일 이름으로 add), **force-push 금지**, `main` 병합·배포 금지.

---

## 7. 허용 파일과 예상 크기

| # | 파일 | 바뀔 수 있는 것 | 예상 |
|---|---|---|---|
| 1 | `src/Auth/EmailVerificationService.php` | 대체값 300→600 (5-1) | 2줄 |
| 2 | `src/Auth/AuthTokenRepository.php` | 남은 시간 한 시계 계산 (5-2) | 약 10줄 이하 |
| 3 | `config/auth.php` | 원칙적으로 변경 없음 | 0줄 |
| 4 | `.github/workflows/*` | 읽기만 | 0줄 |

- **합계 약 15줄 이하.** 30줄을 넘거나 허용 밖 파일이 필요하면 멈추고 보고(8장).

---

## 8. 멈추고 보고할 때

1. 허용 파일 밖을 고쳐야 할 때, 또는 30줄을 넘을 때.
2. 원인이 ①·② 어느 것도 아니거나 코드로 확정되지 않을 때 → **고치지 말고** 확인한 것만 보고.
3. 서버에서만 고칠 수 있는 원인일 때 → 종현이 할 일을 정확히 적어 보고(서버 경로, 넣을 줄).
4. 배포 워크플로를 바꿔야 한다고 판단될 때 → 바꾸기 전에 보고.
5. 비밀번호 찾기 300초·화면 문구·약관 동작이 함께 바뀌어야 할 것처럼 보일 때.
6. 시작 조건(1장)이 안 맞을 때.

---

## 9. 작업 순서

1. 시작 조건 확인(1장) → 브랜치 생성.
2. 원인 진단(4장) → 각 원인 판정 정리.
3. 확인된 원인만 수정(5장). 커밋은 원인별로 나눠도 된다(예: 커밋 1 = 5-1, 커밋 2 = 5-2).
4. 확인(10장).
5. 파일 이름으로 `git add` → 커밋 → `git push origin cursor/270-resend-timer-20261020`.
6. **push 후 멈춤.**

---

## 10. 확인 방법

```bash
git grep -n "email_verify_resend_cooldown_seconds" -- src config
git grep -n "?? 300\|= 300;" -- src/Auth/EmailVerificationService.php
git grep -n "password_reset_resend_cooldown_seconds" -- config src
git diff --stat origin/main...HEAD
git diff --name-only origin/main...HEAD
```

- 기대: `EmailVerificationService.php`에 300이 **0건**(5-1 했을 때). 비밀번호 찾기 300은 그대로. 바뀐 파일은 허용 목록 안.
- PHP 문법 확인: `php -l src/Auth/EmailVerificationService.php src/Auth/AuthTokenRepository.php`.
- 가능하면 로컬(도커)에서 인증 메일을 보내 첫 응답 `resend_available_in`이 600인지, 잠시 뒤 다시 요청했을 때 600보다 조금 작은 값인지 확인. 못 하면 못 했다고 적는다.

---

## 11. 완료 보고 형식

1. **원인**: ①·② 각각 「맞음/아님/확정 못 함」과 근거(파일:줄). 배포가 `config/`를 올리는지 결론.
2. **커밋**: 브랜치 이름, 커밋 해시, 시작 기준 `origin/main` 해시.
3. **바뀐 파일:줄**: 파일별 바뀐 줄과 전/후.
4. **종현이 할 일**(있다면): 예) 서버 `config/auth.php`에 넣을 정확한 줄과 위치, 배포 뒤 확인 방법(가입 인증 화면에서 버튼이 10:00부터 세는지).
5. 범위 확인 문장: 「허용 파일 밖, 화면 문구, 약관 「보기」, 비밀번호 찾기 5분, 운영 DB·서버 파일은 건드리지 않았습니다.」
6. 상태: push까지 했고 병합·배포는 하지 않았다.
