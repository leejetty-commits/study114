# 2026-10-09 우동공과 편지 A단계 — 가입 확인·비밀번호 재설정 메일 따뜻하게

- 브랜치: `cursor/auth-mail-warm-20261009` (기준 `origin/main` `b5ffeb5`)
- worktree: `d:\work\study114\.wt\auth-mail-warm`
- 작업자: 하위 에이전트(작업자). 검수·승인은 메인 에이전트·사용자가 따로 한다(작업 세션은 자기 작업을 승인하지 않음).
- 기획 근거: `cursor/plan-growth-20261008` 브랜치 `docs/worklog/2026/10/2026-10-08-growth-plan-welcome-shorts-mail.md` 「③ 우동공과 편지」

## 1. 지시서 원문

```text
You are a WORKER for the study114 repo (우동공과, a neighborhood 공부방/과외 matching site). Report in Korean.

Work ONLY in worktree `d:\work\study114\.wt\auth-mail-warm`, branch `cursor/auth-mail-warm-20261009` (created from origin/main b5ffeb5). Rules: never push to main; stage explicit files only (no `git add -A`); no amend of pushed commits; no `git clean`; no secrets (Resend API key etc. never in code/docs/logs); do not log in to production or send real mail; no DB changes on production. Push your branch at the end.

## Background
The user (site owner) complained: the email verification mail is dry (3 plain-text lines) and it is unclear whether the account is 공부방 / 과외쏘 / 학생. They want transactional mails to be warm, detailed and kind. Also the mail lands in Gmail spam; a proper HTML+text multipart helps a little. Earlier approved plan (2026-10-08, branch `cursor/plan-growth-20261008`, see its worklog for the 「우동공과 편지」 section and copy style) decided: sender name 「우동공과」, signature 「— 우동공과 드림」, every mail footer must say it's send-only and cannot receive replies, pointing to 고객센터 1:1 문의; never use the member's real name (실명) — address by role (원장님 / 선생님 / 학생·학부모님); avoid words implying we certify/guarantee members (승인, 인증 같은 보증 뉘앙스) in member-facing copy except the neutral 「이메일 확인」; no advertising/promotions in transactional mail. Read `git show origin/cursor/plan-growth-20261008:docs/worklog/2026/10/` files (list with `git ls-tree`) for that plan.

This task = phase A only: verification mail + password reset mail (+ any other AuthMailer mail such as find-id/email-change if present). Lifecycle mails (카드 게시 환영, Prime/Pick 구매 감사, 탈퇴) are a later task that needs an outbox SQL table — do NOT implement them now, but design the template helper so they can reuse it.

## Code facts
- `src/Auth/EmailVerificationService.php::sendVerification(int $userId)` builds subject '[우동공과] 이메일 확인' and a 3-line text body, calls `AuthMailer::send($to, $subject, $body, ?$htmlBody)`. Link: `api_base . '/api/auth/email/verify.php?token=...'`. TTL config `email_verify_ttl_minutes`.
- `src/Auth/AuthMailer.php` (Resend transport, `mailKind()` classifies by subject containing '이메일 확인'/'확인 메일' -> email_verify, '비밀번호'/'재설정' -> password_reset). Keep these subject keywords so log classification still works (or update mailKind consistently).
- Role: find the user's role from `user_roles` (role_type values like study_room_owner, tutor, guardian_student, admin — confirm in code). Unknown role -> neutral copy.
- Find the password reset mail sender (grep AuthMailer usages) and any others.

## Copy (use this; you may polish wording slightly but keep tone/structure)
Common footer (text + HTML):
「이 메일은 우동공과(study114.net)에서 입력하신 주소로 보내드렸어요. 보내기 전용 메일이라 답장을 받을 수 없어요. 궁금한 점은 고객센터 1:1 문의로 남겨 주시면 빠르게 답해 드릴게요.」 + link to the customer center page (find the real route, e.g. support/inquiry page, from site-nav-config).

Verification mail — a big, clear role badge at the TOP of the HTML body (not tiny): 「공부방 원장님 가입」 / 「과외쏘 선생님 가입」 / 「학생·학부모님 가입」, and the role also in the subject:
- 공부방: subject 「[우동공과] 공부방 원장님, 이메일 확인만 남았어요」. Body: 「원장님, 우동공과에 오신 것을 진심으로 환영해요. 우리 동네 학부모님과 학생이 원장님의 공부방을 만날 준비를 하고 있어요. 아래 버튼을 한 번만 눌러 이메일을 확인해 주세요. 확인이 끝나면 공부방 기본정보를 입력하고 우리 동네 카드를 올릴 수 있어요.」
- 과외쏘: subject 「[우동공과] 과외쏘 선생님, 이메일 확인만 남았어요」. Body: 「선생님, 우동공과에 오신 것을 진심으로 환영해요. 근처 학생과 학부모님이 선생님을 찾을 수 있도록 준비하고 있어요. 아래 버튼을 한 번만 눌러 이메일을 확인해 주세요. 확인이 끝나면 과외 기본정보와 수업 가능한 지역을 입력할 수 있어요.」
- 학생: subject 「[우동공과] 학생·학부모님, 이메일 확인만 남았어요」. Body: 「안녕하세요, 우동공과에 오신 것을 환영해요. 우리 동네에서 꼭 맞는 공부방과 과외쏘을 함께 찾아 드릴게요. 아래 버튼을 한 번만 눌러 이메일을 확인해 주세요. 전화번호와 상세 주소는 다른 회원에게 공개되지 않아요.」
- Neutral (unknown role): 「[우동공과] 이메일 확인만 남았어요」.
Then for all: button 「이메일 확인하고 계속하기」, the raw link below the button for clients that block buttons, bullets: 「이 링크는 {TTL 표시, e.g. 24시간 / 30분} 동안 쓸 수 있어요. 시간이 지났다면 가입 화면의 「확인 메일 다시 보내기」를 눌러 주세요.」 「링크는 새 탭에서 열려요. 확인이 끝나면 가입을 시작했던 원래 화면으로 돌아가 기본정보를 이어서 입력해 주세요.」 「메일이 스팸함에 있었다면 ‘스팸 아님’을 눌러 주세요. 다음 안내를 놓치지 않게 돼요.」 「직접 가입하신 적이 없다면 이 메일은 무시하셔도 괜찮아요. 아무 일도 일어나지 않아요.」 then 「— 우동공과 드림」 and the footer.

Password reset: warm version, subject keeps 「비밀번호 재설정」 (e.g. 「[우동공과] 비밀번호 재설정 안내드려요」); role badge too if role is known; button 「새 비밀번호 만들기」; TTL; 「요청하지 않았다면 무시하세요. 비밀번호는 바뀌지 않아요. 걱정되면 고객센터로 알려 주세요.」; signature + footer.

## Implementation
1. Create a small reusable template helper (e.g. `src/Mail/MemberMailTemplate.php`) producing [subject, text, html] from: role badge, heading, paragraphs, button label+url, bullet notes, footer. HTML: table-based, inline styles, max-width ~560px, brand colors already used by the site (find in CSS, e.g. primary blue #1d5bbf or whatever the site uses), logo via absolute https URL of an existing public asset (e.g. `https://study114.net/assets/brand/logo-wordmark.png` — confirm it exists in public/), escape all dynamic values with htmlspecialchars, no external CSS/JS, no tracking pixels. Text version mirrors HTML.
2. Use it from EmailVerificationService and the password reset sender (pass `$htmlBody`). Keep token/link logic untouched. Keep AuthMailer meta log free of body/token.
3. TTL display helper: minutes -> 「N분」 / 「N시간」.
4. Tests: follow existing PHP test style if there is one (look for tests/ or scripts/verify-*.php / *.mjs with php -l). Add a verify script that renders each role variant with a fake link and asserts: role badge text present at top, subject contains role, footer no-reply text present, link escaped, no real-name placeholder, text+html both non-empty; also writes preview HTML files to `%TEMP%\study114-mail-preview\*.html` (outside repo) so the owner can look. Run `php -l` on changed PHP files (php may be available via docker or local; if not available, report).
5. Run `node scripts/verify-no-sample-data.mjs` and `npm run verify:shop-page` (shouldn't be affected) and the secrets check if bash exists.
6. Worklog `docs/worklog/2026/10/2026-10-09-auth-mail-warm.md`: section 1 = this instruction verbatim; then design, files, copy as implemented (all variants, full text), verification, preview file paths, remaining (phase B lifecycle mails need outbox SQL). Commit code+worklog with explicit paths, push branch.

Final report: commits, files (one line each), the final subject lines per variant, verification results, preview file paths, and pre-deploy user tasks (expected none: no SQL/env/.htaccess).
```

## 2. 확인한 사실

- `AuthMailer::send()`를 부르는 곳: `EmailVerificationService`(가입 확인·재전송·이메일 교체 후 재발송 — 모두 `sendVerification()` 한 곳), `PasswordResetService`(재설정 링크 / 소셜 전용 안내 2경로), `_mail-probe.php`(운영 시험 발송, 사용자 대상 아님), `ProviderReminderService`(유료 리마인더, 기본 비활성 — B단계 범위). 아이디 찾기·이메일 변경 전용 메일은 **없음**(이메일 교체는 `AccountContactService`가 `sendVerification()`을 다시 부름 → 이번 확인 메일로 함께 바뀜).
- 역할: `user_roles.role_type` = `study_room_owner` / `tutor` / `guardian_student` (`SignupService`·`OAuthRoleService` 매핑), 관리자는 `admin`. 대표 역할은 `is_primary = 1`, `status = 'active'`.
- 고객센터 1:1 문의 화면: `/support/contact` (`preview/home-ui/src/support/nav.js` 「운영문의」, `site-nav-config.js` `homeHashUrl`이 `/support/*`는 pathname 딥링크). 운영 `home_ui` = `https://study114.net` → `https://study114.net/support/contact`. 로그인 필요 화면이라 비로그인이면 로그인 안내가 먼저 뜬다.
- 로고: `public/assets/brand/logo-wordmark.png` (Git 추적, 운영 `https://study114.net/assets/brand/logo-wordmark.png` 로 브라우저에서 실제 로드 확인).
- 브랜드 색: `preview/home-ui/src/styles/tokens.css` — CTA `--brand-blue #266bc4`, 역할 강조 `--role-accent-study #266bc4 / tutor #0f766e / student #6d5bd0` (+soft 배경). 지시서 예시 `#1d5bbf` 대신 사이트 실제 값을 썼다.
- TTL: 가입 확인 `email_verify_ttl_minutes = 1440`(24시간), 재설정 `password_reset_ttl_minutes = 30`.
- 가입 화면 재전송 버튼 문구: 「확인 메일 다시 보내기」(`signup-verify-email.js`), 비밀번호 찾기 화면 제목 「비밀번호 찾기」(`find-password.js`) — 메일 안내 문구와 일치.

## 3. 설계

- `src/Mail/MemberMailTemplate.php` — 「우동공과 편지」 공통 틀. 입력: 제목·배지·역할·미리보기 문구(preheader)·제목줄(heading)·문단·버튼(문구+주소)·안내 목록·고객센터 주소 → 출력 `['subject','plain','html']`.
  - HTML: 표(table) 레이아웃, 인라인 스타일만, 폭 560px, 외부 CSS/JS 없음, 이미지는 로고 1개뿐(추적 픽셀 없음), 모든 동적 값 `htmlspecialchars(ENT_QUOTES|ENT_SUBSTITUTE)`.
  - 순서: 로고 → **역할 배지(20px 굵게, 역할 색 왼쪽 띠 + 옅은 배경)** → 제목줄 → 문단 → 버튼(브랜드 파랑) → 「버튼이 눌리지 않으면…」 + 원본 주소 → 회색 안내 상자 → 「— 우동공과 드림」 → 바닥글(보내기 전용 고지 + 「고객센터 1:1 문의하기」 링크).
  - text 본문은 HTML과 같은 순서(`[배지]` 첫 줄, `▶ 버튼문구` + 주소, `·` 안내, 서명, 구분선, 바닥글).
  - `ttlLabel(분)` → 「30분」/「24시간」/「1시간 30분」. `supportUrl(home_ui)` → `{home_ui}/support/contact` (비어 있으면 운영 주소).
  - B단계(게시 환영·Prime/Pick 감사·탈퇴)는 같은 `render()`에 문단·안내만 바꿔 넣으면 된다. 광고·할인 문구 금지는 검증 스크립트 금지어로 막는다.
- `src/Mail/MemberMailRole.php` — 역할 정규화·호칭·배지 이름·배지 색, `lookup(PDO, userId)`(대표·활성 역할, 조회 실패나 없음이면 `''` → 중립 문구). 실명(`real_name`)은 쓰지 않는다.
- `src/Auth/EmailVerifyMailTemplate.php` — 가입 확인 메일 4변형(공부방/과외쌤/학생·학부모/중립).
- `src/Auth/PasswordResetMailTemplate.php` — 기존 클래스 유지, 내부를 공통 틀로 교체. `build()`·`buildSocialOnly()`에 역할·고객센터 주소(·로그인 주소) 인자를 **뒤에 선택 인자로** 추가해 기존 호출 형태 호환.
- 서비스: `EmailVerificationService::sendVerification()`·`PasswordResetService::requestReset()`이 역할을 조회해 템플릿을 만들고 `$mail['html']`을 `AuthMailer::send()` 넷째 인자로 넘긴다. 토큰 생성·링크 조립·쿨다운·실패 시 토큰 무효화 로직은 그대로.
- `AuthMailer`는 변경 없음. 제목에 「이메일 확인」(→`email_verify`)·「비밀번호」(→`password_reset`)를 남겨 로그 분류 유지. 소셜 전용 안내도 제목에 「비밀번호」가 들어가 이제 `other` 대신 `password_reset`으로 분류된다. 메타 로그에는 여전히 본문·토큰·URL 없음(검증 스크립트로 확인).
- 문구 다듬기: 지시서의 「과외쏘」는 사이트 공식 역할명 **「과외쌤」**으로 썼다(「과외쌤 선생님」, 「공부방과 과외쌤」). 문단은 읽기 쉽게 두 문단으로 나눴다.

## 4. 바뀐 파일

| 파일 | 내용 |
|---|---|
| `src/Mail/MemberMailTemplate.php` (신규) | 회원 메일 공통 틀(text+HTML)·TTL 표시·고객센터 주소 |
| `src/Mail/MemberMailRole.php` (신규) | 역할 정규화·호칭·배지 이름/색·대표 역할 조회 |
| `src/Auth/EmailVerifyMailTemplate.php` (신규) | 가입 확인 메일 역할별 문안 |
| `src/Auth/PasswordResetMailTemplate.php` | 재설정·소셜 전용 안내를 공통 틀·역할 배지로 교체 |
| `src/Auth/EmailVerificationService.php` | 역할 조회 + 새 템플릿 + HTML 본문 전달 |
| `src/Auth/PasswordResetService.php` | 역할 조회 + 고객센터·로그인 주소 전달 |
| `scripts/verify-auth-mail-warm.php` (신규) | 문안 검증 + 미리보기 파일 생성 |
| `package.json` | `verify:auth-mail-warm` 스크립트 |
| `.github/workflows/cur-006-resend.yml` | 새 템플릿 경로 트리거 + 검증 단계 추가 |
| `docs/internal/cur-006-authmailer-callers.md` | 공통 틀·검증 스크립트 한 줄 |
| `docs/worklog/2026/10/2026-10-09-auth-mail-warm.md` | 이 기록 |

## 5. 구현된 문안 (전문)

공통 바닥글(모든 메일, text·HTML 동일):

```text
— 우동공과 드림

────────────
이 메일은 우동공과(study114.net)에서 입력하신 주소로 보내드렸어요. 보내기 전용 메일이라 답장을 받을 수 없어요. 궁금한 점은 고객센터 1:1 문의로 남겨 주시면 빠르게 답해 드릴게요.
고객센터 1:1 문의하기: https://study114.net/support/contact
```

HTML에서만: 버튼 아래 「버튼이 눌리지 않으면 아래 주소를 복사해 브라우저 주소창에 붙여 넣어 주세요.」 + 원본 주소 링크, 받은편지함 미리보기 문구(preheader, 화면에는 숨김).

### 5-1. 가입 확인 메일 (공통 부분)

- 제목줄: 「이메일 확인만 남았어요」
- 버튼: 「이메일 확인하고 계속하기」 → `{api_base}/api/auth/email/verify.php?token=…`
- preheader: 「버튼 한 번이면 가입 확인이 끝나요. 링크는 24시간 동안 쓸 수 있어요.」
- 안내:
  - 이 링크는 24시간 동안 쓸 수 있어요. 시간이 지났다면 가입 화면의 「확인 메일 다시 보내기」를 눌러 주세요.
  - 링크는 새 탭에서 열려요. 확인이 끝나면 가입을 시작했던 원래 화면으로 돌아가 기본정보를 이어서 입력해 주세요.
  - 메일이 스팸함에 있었다면 ‘스팸 아님’을 눌러 주세요. 다음 안내를 놓치지 않게 돼요.
  - 직접 가입하신 적이 없다면 이 메일은 무시하셔도 괜찮아요. 아무 일도 일어나지 않아요.

| 변형 | 제목 | 배지 | 문단 |
|---|---|---|---|
| 공부방 | [우동공과] 공부방 원장님, 이메일 확인만 남았어요 | 공부방 원장님 가입 | 원장님, 우동공과에 오신 것을 진심으로 환영해요. 우리 동네 학부모님과 학생이 원장님의 공부방을 만날 준비를 하고 있어요. / 아래 버튼을 한 번만 눌러 이메일을 확인해 주세요. 확인이 끝나면 공부방 기본정보를 입력하고 우리 동네 카드를 올릴 수 있어요. |
| 과외쌤 | [우동공과] 과외쌤 선생님, 이메일 확인만 남았어요 | 과외쌤 선생님 가입 | 선생님, 우동공과에 오신 것을 진심으로 환영해요. 근처 학생과 학부모님이 선생님을 찾을 수 있도록 준비하고 있어요. / 아래 버튼을 한 번만 눌러 이메일을 확인해 주세요. 확인이 끝나면 과외 기본정보와 수업 가능한 지역을 입력할 수 있어요. |
| 학생·학부모 | [우동공과] 학생·학부모님, 이메일 확인만 남았어요 | 학생·학부모님 가입 | 안녕하세요, 우동공과에 오신 것을 환영해요. 우리 동네에서 꼭 맞는 공부방과 과외쌤을 함께 찾아 드릴게요. / 아래 버튼을 한 번만 눌러 이메일을 확인해 주세요. 전화번호와 상세 주소는 다른 회원에게 공개되지 않아요. |
| 중립(역할 모름·관리자) | [우동공과] 이메일 확인만 남았어요 | 우동공과 가입 (회색) | 안녕하세요, 우동공과에 오신 것을 환영해요. / 아래 버튼을 한 번만 눌러 이메일을 확인해 주세요. 확인이 끝나면 가입을 시작했던 화면에서 기본정보를 이어서 입력할 수 있어요. |

공부방 text 본문 전체 예:

```text
[공부방 원장님 가입]

이메일 확인만 남았어요

원장님, 우동공과에 오신 것을 진심으로 환영해요. 우리 동네 학부모님과 학생이 원장님의 공부방을 만날 준비를 하고 있어요.

아래 버튼을 한 번만 눌러 이메일을 확인해 주세요. 확인이 끝나면 공부방 기본정보를 입력하고 우리 동네 카드를 올릴 수 있어요.

▶ 이메일 확인하고 계속하기
https://study114.net/api/auth/email/verify.php?token=…

· 이 링크는 24시간 동안 쓸 수 있어요. 시간이 지났다면 가입 화면의 「확인 메일 다시 보내기」를 눌러 주세요.
· 링크는 새 탭에서 열려요. 확인이 끝나면 가입을 시작했던 원래 화면으로 돌아가 기본정보를 이어서 입력해 주세요.
· 메일이 스팸함에 있었다면 ‘스팸 아님’을 눌러 주세요. 다음 안내를 놓치지 않게 돼요.
· 직접 가입하신 적이 없다면 이 메일은 무시하셔도 괜찮아요. 아무 일도 일어나지 않아요.

— 우동공과 드림

────────────
이 메일은 우동공과(study114.net)에서 입력하신 주소로 보내드렸어요. 보내기 전용 메일이라 답장을 받을 수 없어요. 궁금한 점은 고객센터 1:1 문의로 남겨 주시면 빠르게 답해 드릴게요.
고객센터 1:1 문의하기: https://study114.net/support/contact
```

### 5-2. 비밀번호 재설정 메일

- 제목: 「[우동공과] 비밀번호 재설정 안내드려요」(모든 역할 공통)
- 배지(역할을 알 때만): 「공부방 원장님 계정」 / 「과외쌤 선생님 계정」 / 「학생·학부모님 계정」, 역할 모름이면 배지 없음
- 제목줄: 「새 비밀번호를 만들어 주세요」
- 문단: 「{원장님|선생님|학생·학부모님|안녕하세요}, 비밀번호 재설정 요청을 받았어요.」 / 「아래 버튼을 눌러 새 비밀번호를 만들어 주세요. 새 비밀번호를 정하면 바로 그 비밀번호로 로그인할 수 있어요.」 / (소셜 연결 계정만) 「참고로 이 계정은 {구글} 로그인과도 연결되어 있어요. 소셜 로그인으로도 들어오실 수 있어요.」
- 버튼: 「새 비밀번호 만들기」 → `{auth_ui}/#/reset-password?token=…`
- preheader: 「버튼을 눌러 새 비밀번호를 만들어 주세요. 링크는 30분 동안 쓸 수 있어요.」
- 안내:
  - 이 링크는 30분 동안 쓸 수 있어요. 시간이 지났다면 로그인 화면의 「비밀번호 찾기」에서 다시 요청해 주세요.
  - 링크는 한 번만 쓸 수 있어요. 새 비밀번호를 정하면 이전 비밀번호로는 로그인할 수 없어요.
  - 요청하지 않았다면 이 메일은 무시하셔도 괜찮아요. 비밀번호는 바뀌지 않아요. 걱정되면 고객센터로 알려 주세요.

### 5-3. 소셜 전용 계정 안내 (비밀번호 없는 계정이 재설정을 요청했을 때)

- 제목: 「[우동공과] 비밀번호 대신 소셜 로그인으로 들어와 주세요」 (이전 「[우동공과] 소셜 로그인 안내」)
- 배지: 역할을 알면 「… 계정」
- 제목줄: 「{카카오} 로그인으로 들어와 주세요」
- 문단: 「{호칭}, 비밀번호 재설정 요청을 받았어요.」 / 「이 계정은 {카카오} 로그인으로 가입·연결되어 있어서 따로 만든 비밀번호가 없어요. 로그인 화면에서 {카카오} 버튼을 눌러 들어와 주세요.」
- 버튼: 「로그인 화면으로 가기」 → `{auth_ui}/#/login`
- 안내: 「요청하지 않았다면 이 메일은 무시하셔도 괜찮아요. 계정에는 아무 변화가 없어요. 걱정되면 고객센터로 알려 주세요.」

## 6. 검증

| 항목 | 결과 |
|---|---|
| `php -l` (로컬 `D:\php8.2\php.exe` 8.2.33) — 바뀐 PHP 7개 | 모두 No syntax errors |
| `php -d extension=pdo_sqlite scripts/verify-auth-mail-warm.php` | **passed=423 failed=0** (역할 조회 sqlite 검사 포함) |
| `php scripts/verify-auth-mail-warm.php` (sqlite 없이, CI 기본형) | passed=416 failed=0, 역할 조회만 SKIP |
| `php -d extension=curl -d extension=mbstring scripts/verify-cur-006-resend.php` | passed=89 failed=0 (로컬 PHP는 curl 기본 미로드라 `-d` 필요 — 기존 환경 사정) |
| `node scripts/verify-no-sample-data.mjs` | no-sample-data OK |
| `npm run verify:shop-page` | 통과(exit 0) — worktree에 `node_modules` 연결(junction) 후 실행 |
| `bash scripts/check-no-committed-secrets.sh` (Git Bash) | OK |
| 미리보기 브라우저 확인 | 로고(운영 주소) 로드·배지·버튼·안내 상자·바닥글 배치 정상 |

검증 스크립트가 보는 것: 변형별 제목(역할 포함)·`mailKind` 분류, text 첫 줄 배지·HTML 배지가 제목줄보다 위·배지 20px, 보내기 전용 고지·고객센터 1:1 문의·고객센터 주소 정확 일치·서명(text/HTML 각각), 링크 escape(버튼·원본 주소), 금지어(승인·인증·보증·할인·이벤트·광고·`{name}`·`real_name`·`고객님` 등) 없음, 외부 CSS/JS·추적 이미지 없음(이미지=로고 1개), 폭 560px, TTL 문구, 역할 조회(대표 우선·비활성/관리자/없음/오류 → 중립), 서비스가 HTML 본문을 넘기는지·실명 조회 없음, fake 발송 시 `mail.log`에 본문·토큰 없음.

## 7. 미리보기 파일 (저장소 밖)

`C:\Users\jetty\AppData\Local\Temp\study114-mail-preview\` (= `%TEMP%\study114-mail-preview\`)

- `index.html` — 전체 목록
- `verify-study-room.html` · `verify-tutor.html` · `verify-student.html` · `verify-neutral.html`
- `reset-study-room.html` · `reset-tutor.html` · `reset-student.html` · `reset-neutral.html` · `reset-tutor-social-linked.html`
- `reset-social-only-student.html`
- 같은 이름의 `.txt` = text 본문(첫 줄 Subject)

다시 만들기: `php scripts/verify-auth-mail-warm.php`

## 8. 배포 전 사용자 할 일

- 없음. SQL·환경변수·Secrets·`.htaccess` 변경 없음. 실메일 발송·운영 로그인·운영 DB 변경 하지 않음.
- 배포 후 확인 제안: 시험 계정으로 가입 1회·비밀번호 찾기 1회 받아 지메일에서 배지·버튼·바닥글이 보이는지, 스팸함 여부.

## 9. 남은 일

- **B단계(생활 메일)**: 카드 게시 환영 3종·Prime/Pick 구매 감사(Prime 「이 동네 단 3자리」 블록)·탈퇴(떠나는 이유 연결) — 「주문번호·메일 종류」당 1회 발송 기록 표(outbox) **SQL이 먼저 필요**. 같은 `MemberMailTemplate::render()`·`MemberMailRole`을 재사용한다.
- `ProviderReminderService`(유료 리마인더, 기본 비활성)는 이번에 손대지 않음 — B단계에서 같은 틀로 옮길 후보.
- SSOT `docs/ssot/09-appendix-login-and-auth-policy.md` §17-5의 메일 문안 설명은 이번 문안 확정(사용자 승인) 후 갱신.
- 지메일 스팸 근본 대책(SPF·DKIM·DMARC·발송 도메인 평판)은 이번 범위 밖.
