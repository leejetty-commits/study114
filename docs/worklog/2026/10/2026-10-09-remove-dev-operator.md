# 작업 기록: 개발용 운영자 계정 ops@dev.local 제거 (remove-dev-operator)

- 작업 일자: 2026-10-09
- 작업 브랜치: `cursor/remove-dev-operator-20261009` (기반 origin/main: `bc76015`)
- 작업 디렉토리: `d:\work\study114\.wt\remove-dev-operator`
- 상태: 검수·승인 대기 (작업자 세션은 자기 작업을 승인하지 않는다)

---

## 1. 지시서 원문 요지

사용자 승인 (2026-10-09 00:30)

- 「진행」 — 개발용 이메일 목록(`ops@dev.local`·`ops2@dev.local`·`ops3@dev.local`)으로 등급을 주는 코드와 「개발용 운영자 로그인」 버튼 제거.
- 「필요할 때가 있나? 없으면 제거」 — 운영 DB의 `ops@dev.local` 계정 제거.

메인 에이전트 지시서 (원문)

```markdown
## Goal (user-approved 2026-10-09 00:30)
Remove the development-only operator account `ops@dev.local` (and the legacy dev emails `ops2@dev.local`, `ops3@dev.local`) from production code paths, and prepare a production SQL to delete the `ops@dev.local` row. Background: `sql/schema/026_admin_dev_seed.sql` (also copied into `sql/schema/rest-schema.sql` ~line 1404) created `ops@dev.local` with a well-known dev password and fake phone 010-9999-0001 on the production DB. The user already set it to 정지 (blocked) in the admin console. The real admins are `jetty@naver.com` (master/super_admin, 공부방) and `leejetty@gmail.com` (student, admin). ops2/ops3 do not exist in production DB.

## Tasks
1. Code removal:
   - `src/Admin/AdminRoleService.php`: remove `LEGACY_SUB_MASTER_EMAILS` fallback (ops/ops2/ops3) and any code that grants a level from that list. Keep DB-based level resolution (`users.admin_level`). Check callers so nothing breaks.
   - `preview/home-ui/src/admin/admin-permissions.js`: remove `SUB_MASTER_EMAILS` list and email-based level logic; rely on server `admin_level`. Check all importers.
   - `preview/home-ui/src/admin/admin-guard.js`: remove the 「개발용 운영자 로그인」 button (`data-action="dev-login-admin"`) and its handler.
   - `preview/home-ui/src/auth-session.js`: remove the `admin: { email: 'ops@dev.local', password: 'password', ... }` dev account entry. Do NOT remove other dev accounts / the preview toolbar 시험용 buttons for parent/room/tutor unless they reference ops@dev.local — report them in your summary as "남은 개발용 로그인" for the user to decide.
   - grep the whole worktree (`git grep -n "ops@dev.local\|ops2@dev\|ops3@dev\|dev-login-admin\|SUB_MASTER_EMAILS\|LEGACY_SUB_MASTER"`) and handle each production-code hit. For local verify scripts under `scripts/` and docs, decide minimally: scripts that use ops@dev.local against local Docker DB may keep it only if the local seed still sets `admin_level` for it; otherwise update them. Report what you did per file.
   - Local dev seed: `026_admin_dev_seed.sql` / `rest-schema.sql` — do not break local Docker setup. If local admin testing needs ops@dev.local, make the seed set `users.admin_level='sub_master'` explicitly (since the email fallback is gone) and add a header comment that it is local-only and must never be applied to production. Do not delete schema files.
2. Production SQL (user will run in phpMyAdmin; Actions never runs SQL): create `sql/ops/2026-10-09-delete-ops-dev-local.sql`:
   - Step 1: pre-check SELECTs (users row, user_roles/user_profiles rows, counts in every table that references users.id; list tables with RESTRICT/NO ACTION that would block deletion; admin operation log tables).
   - Step 2: a transaction that deletes dependent rows where needed (or relies on CASCADE) and then deletes the single `ops@dev.local` row with safe guards (never touch jetty@naver.com or leejetty@gmail.com). Prefer preserving historical admin log rows.
   - Step 3: post-check SELECTs.
   - MySQL 8.0 compatible; phpMyAdmin may run each statement in separate sessions, so avoid TEMPORARY tables.
3. Verification: `php -l`, `npm run build`/admin verify scripts, `npm run verify:shop-page`. Unrelated failures → compare with clean main.
4. Worklog: this file.
5. Git: stage by name, commit, `git push -u origin cursor/remove-dev-operator-20261009`. No main merge/push, no amend, no `git clean`.
```

---

## 2. 변경 파일

| 파일 | 변경 |
|------|------|
| `src/Admin/AdminRoleService.php` | `LEGACY_SUB_MASTER_EMAILS` 상수, `@dev.local` 이메일→부마스터 분기, `listSubMasterEmails()` 삭제 |
| `src/Admin/AdminMemberService.php` | 운영자 계정 표시(`isOperatorAccount`)에서 개발 이메일 목록 비교 삭제 (등급·bootstrap 이메일만 본다) |
| `src/Admin/AdminMemberDeleteService.php` | 삭제 보호(`isProtectedOperator`)에서 개발 이메일 목록 비교 삭제 (등급·bootstrap 이메일만 본다) |
| `src/Admin/AdminCommerceService.php` | `sessionInfo()` 응답의 `sub_master_emails` 키 삭제 (앞단·스크립트 사용처 없음 확인) |
| `preview/home-ui/src/admin/admin-permissions.js` | `SUB_MASTER_EMAILS` 와 이메일 기반 등급 판정 삭제. `resolveAdminLevel(adminLevel)` 은 서버 `admin_level` 만 정규화. admin 역할인데 등급이 비면 부마스터(서버와 같은 규칙) |
| `preview/home-ui/src/admin/admin-guard.js` | 「운영자 전용」 화면의 「개발용 운영자 로그인」 버튼과 안내 문구 삭제 (클릭 처리는 `layout.js` 공통 핸들러에 있었다) |
| `preview/home-ui/src/auth-session.js` | `DEV_ACCOUNTS.admin`(ops@dev.local / password) 삭제, `devLoginAs` 의 admin 분기 삭제 |
| `preview/home-ui/src/layout.js` | 미리보기 툴바 「시험용·운영」 버튼과 `dev-login-admin` 처리 분기 삭제 (ops@dev.local 로 로그인하던 버튼) |
| `scripts/capture-admin-report-menu.mjs` | 없어진 `dev-login-admin` 버튼 클릭 블록 삭제 (이 스크립트는 me.php 를 super_admin 으로 목킹하므로 영향 없음) |
| `e2e/submission-attachment-flow.spec.js` | 「운영자 전용」 화면에 「개발용 운영자 로그인」 버튼이 **없어야** 한다로 단언 변경 |
| `sql/schema/026_admin_dev_seed.sql` | 머리 주석: 로컬 Docker 전용·운영 적용 금지·등급은 036 백필 |
| `sql/schema/032_admin_accounts_seed.sql` | 머리 주석: ops2/ops3 로컬 전용·운영 적용 금지 |
| `sql/schema/rest-schema.sql` | 026 블록(ops@dev.local INSERT 3문장)을 주석 처리하고 사유 기록 |
| `docs/ssot/09-appendix-login-and-auth-policy.md` | `ops@dev.local` 행: 이메일 fallback 제거 반영 |
| `docs/internal/30-admin-account-provisioning.md` | 시드 표·체크리스트 #7: 이메일 목록·Dev 로그인 버튼 제거 반영 |
| `sql/ops/2026-10-09-delete-ops-dev-local.sql` | **신규.** 운영 phpMyAdmin 용 삭제 SQL (확인 → 삭제 → 사후 확인) |

### 2-1. grep 대상별 처리

| 위치 | 처리 |
|------|------|
| `src/Admin/*` (운영 코드) | 삭제 (위 표) |
| `preview/home-ui/src/*` (운영 번들) | 삭제 (위 표). 빌드 산출물에 `ops@dev.local`·`dev-login-admin` 0건 확인 |
| `e2e/helpers/admin-api.js`, `e2e/a28-07-ops-smoke.spec.js`, `e2e/submission-attachment-flow.spec.js`(로그 화면 `ops@dev.local` 단언) | **유지.** 로컬 Docker 전용이고, 로컬 시드에서 036 백필이 `admin_level='sub_master'` 를 채운다 |
| `scripts/verify-board-acl-live.mjs` | **유지.** 로컬 Docker API 로그인. 같은 이유 |
| `scripts/verify-hide-inquiry-bundle.mjs` | **유지.** `ops@dev.local` 은 로그 operator 문자열로만 쓴다 (등급 판정 없음) |
| `scripts/capture-admin-report-menu.mjs` | 없어진 버튼 클릭 블록 삭제 |
| `docs/ssot/30-first-route-map-and-screen-inventory.md` (로컬 QA 전제) | **유지.** 로컬 Docker 계정 설명이라 그대로 맞다 |

### 2-2. 로컬 시드에 대한 판단

- 로컬 적용 순서(`scripts/apply-schema-dev.ps1`): 026 → 032 → **036**. 026 시점에는 `users.admin_level` 컬럼이 아직 없어 026 안에서 등급을 넣을 수 없다.
- 036 이 `admin` 역할(is_primary=1, active)이면서 등급이 빈 계정을 `sub_master` 로 백필한다 (jetty 제외). 따라서 로컬의 ops@dev.local·ops2·ops3 은 이메일 fallback 없이도 `admin_level='sub_master'` 를 갖는다. 036 은 이미 운영에 적용된 마이그레이션이라 손대지 않았다.
- `rest-schema.sql` 은 로컬 적용 스크립트가 쓰지 않는다(참고용 통합본). 이 통합본이 운영에 ops@dev.local 을 만든 경로라서 해당 INSERT 를 주석 처리했다.

---

## 3. 운영 SQL 요약 (`sql/ops/2026-10-09-delete-ops-dev-local.sql`)

### 3-1. users.id 를 가리키는 테이블 (저장소 스키마 기준)

| 삭제 규칙 | 테이블.칼럼 |
|-----------|-------------|
| **RESTRICT (지정 없음)** — 행이 있으면 users 삭제를 막는다 | `user_profiles.user_id`, `user_roles.user_id`, `students.guardian_user_id`, `study_rooms.user_id`, `tutors.user_id` |
| CASCADE — 같이 지워진다 | `user_favorites`, `user_compare_items`, `user_recent_views`, `provider_student_reviews.provider_user_id`, `message_threads`(low/high/initiated_by), `messages.sender_user_id`, `message_thread_reads`, `message_thread_participant_state`, `provider_entitlements`, `user_oauth_accounts`, `auth_tokens`, `provider_ticket_packs`, `provider_request_unlocks.provider_user_id`, `provider_system_notices`, `provider_reminder_dispatches`, `provider_reviews.author_user_id`, `provider_review_replies.provider_user_id`, `user_recommendations`, `provider_review_quotas.author_user_id`, `provider_review_blocks`(blocked_author/blocked_by) |
| SET NULL | `provider_profile_views.viewer_user_id`, `support_tickets.user_id` |
| FK 없음 (071 이후) | `provider_payment_orders.user_id`, `provider_position_subscriptions.user_id` |
| FK 없음 (숫자만) | `board_posts.author_user_id`, `board_post_comments.author_user_id`, `board_post_reactions.user_id`, `board_post_reports.reporter_user_id` |
| FK 없음 (이메일 문자열) | `admin_operation_logs.operator_id` — **보존** |

운영 DB에는 저장소에 없는 FK가 있을 수 있어서, STEP 1-3·1-4 는 `information_schema` 에서 실제 FK 목록을 읽어 테이블별 행 수를 자동으로 센다.

### 3-2. 무엇을 지우나

- STEP 1: SELECT 만. 대상·보호 계정 상태, 프로필·역할 행, FK 목록과 테이블별 행 수, FK 없는 칼럼 행 수, 운영 로그 건수, 남은 `@dev.local` 계정(참고).
- STEP 2 (한 트랜잭션, 한 번에 실행):
  1. 운영 로그에 삭제 기록 1줄 추가 (`log_key='LOG-20261009-OPS-DEV-LOCAL'`, `action_kind='dev_account_purge'`, operator `jetty@naver.com`). `account_delete` 로 쓰지 않은 이유: 보고서(162)의 「관리자 삭제」 건수에 잡히기 때문.
  2. `user_roles` → `user_profiles` → `users` 순서로 삭제.
  3. 모든 문장에 같은 조건: `email='ops@dev.local'`, jetty·leejetty 제외, `admin_level` 이 `sub_master` 또는 NULL, `status='blocked'`, 공부방·과외쌤·학생 카드 0개. 조건이 하나라도 안 맞으면 어느 문장도 지우지 않는다.
  4. CASCADE 테이블은 MySQL 이 같이 지운다. 운영 로그(`admin_operation_logs`)는 지우지 않는다.
- STEP 3: SELECT 만. ops 행 0, 보호 계정 2개 유지, 고아 프로필·역할 없음, 운영 로그 보존, active super_admin 1명 이상.

---

## 4. 검증 결과

| 명령 | 결과 |
|------|------|
| `php -l` (변경한 PHP 4개, PHP 8.2 `D:\php8.2\php.exe`) | 통과 |
| `bash scripts/php-syntax-check.sh` (Git Bash, PATH 에 PHP 8.2) | 통과 — files=309 ok |
| `AdminRoleService::resolveLevel` 직접 호출 (DB 연결 없음) | `ops@dev.local`+admin 역할 → `sub_master`(일반 「admin 역할·등급 없음」 규칙), `ops@dev.local`+시장 역할 → `null`, `jetty@naver.com`+admin → `super_admin`, `listSubMasterEmails` 없음 |
| `npx vite build` (`preview/home-ui`, worktree 에 `npm ci`) | 통과. 산출 JS 에 `ops@dev.local`·`dev-login-admin` 0건 |
| `npm run verify:shop-page` | 통과 — pass 54 / fail 0 |
| `verify-admin-today-hub.mjs` | 통과 — 61 / 0 |
| `verify-admin-162-settlement.mjs` | 통과 — 57 / 0 |
| `verify-admin-preview-labels.mjs` | 통과 — 202 / 0 |
| `verify-message-permissions-admin.mjs` | 통과 — 132 / 0 |
| `verify-role-home-guard.mjs` (`--root preview/home-ui`) | 통과 — 56 / 0 |
| `scripts/check-no-committed-secrets.sh` | 통과 |
| `verify-admin-registration-list.mjs` | **실패 3건 — 이번 변경과 무관.** 고정 커밋 `2723c5f` 대비 diff 를 보는 과제 전용 검사다. `a28-copy.js`·`a28-screens.js` 삭제 줄은 `2723c5f..bc76015`(main) 에서 생긴 것이고 이 브랜치는 두 파일을 건드리지 않았다. `_base-main`(4fcb5ea) 에서도 `diff-allowed` 실패 |
| `npm run sync:inventory:check` | **실패 — 무관.** `_base-main` 에서도 같은 drift 실패 |

실행하지 못한 것: 로컬 Docker(데몬 꺼짐)라 e2e(Playwright)와 운영 SQL 의 실제 실행 시험은 하지 못했다. SQL 은 저장소 스키마 기준으로 작성·검토만 했다.

---

## 5. 배포 전 사용자 할 일

1. 이 브랜치 검수·승인 → main 반영 → Actions 배포.
2. 배포 뒤 운영 phpMyAdmin 에서 `sql/ops/2026-10-09-delete-ops-dev-local.sql` 을 단계별로 실행:
   - STEP 1 결과를 확인한다. 특히 1-1 에서 `status='blocked'`, `admin_level` 이 `sub_master`(또는 NULL) 인지, 1-4 에서 user_profiles·user_roles 외 RESTRICT 줄이 0 인지, CASCADE 중 `message_threads`·`provider_review_blocks` 가 0 인지.
   - 문제가 없으면 STEP 2 블록 전체를 한 번에 실행 → `ops_rows_left = 0` 확인.
   - STEP 3 으로 사후 확인.
3. 계정은 이미 정지 상태라 SQL 실행 전에도 로그인은 막혀 있다 (`LoginService` 는 `status <> 'active'` 거부).
4. 코드 배포와 SQL 순서는 상관없다. 코드는 SQL 없이도 동작하고, SQL 은 코드 없이도 동작한다.

---

## 6. 남은 개발용 로그인 (사용자 결정 필요 · 이번에 손대지 않음)

| 위치 | 내용 | 운영 노출 |
|------|------|-----------|
| `preview/home-ui/src/auth-session.js` `DEV_ACCOUNTS` | `guardian1@dev.local`·`room-owner1@dev.local`·`tutor-owner1@dev.local` / `password` | 버튼은 DEV 에서만 보이지만 **문자열은 운영 JS 번들에 들어간다** (빌드 산출물에서 확인) |
| `preview/home-ui/src/layout.js` 툴바 「시험용·학부모/공부방/과외」 | 위 계정으로 로그인 | `SHOW_PREVIEW_TOOLBAR`(= `import.meta.env.DEV`) 일 때만 렌더 |
| `preview/study-room-ui/src/layout.js` · `register-api.js` 「Dev 로그인」 | `room-owner1@dev.local` | DEV 툴바 전용 |
| `preview/tutor-ui/src/layout.js` · `register-api.js` 「Dev 로그인」 | `tutor-owner1@dev.local` | DEV 툴바 전용 |
| `preview/auth-ui/src/screens/login.js` | DEV 에서 이메일 칸에 `guardian1@dev.local` 미리 채움 | DEV 전용 |
| `src/Views/auth/login.php` | 「dev 시드 계정: guardian1@dev.local / password」 문구 | 이 PHP 뷰가 운영에서 열리는지 **미확인** |

---

## 7. 미확인 목록

- 운영 DB 의 ops@dev.local 실제 `admin_level` 값 (036 백필로 `sub_master` 로 예상). SQL 은 `sub_master` 또는 NULL 둘 다 허용한다.
- 운영 DB 의 실제 FK 목록이 저장소 스키마와 같은지 — STEP 1-3 으로 확인한다.
- `rest-schema.sql` 의 012 시드(`room-owner1@dev.local` 등 dev 계정)도 운영에 들어갔을 가능성. STEP 1-8 이 목록만 보여주고 지우지 않는다.
- `admin` 역할 행이 있는데 `admin_level` 이 비어 있는 계정은 여전히 부마스터로 본다(서버·앞단 공통 규칙, 이메일과 무관). ops@dev.local 은 운영에서 지우면 해당 없음.
- `src/Views/auth/login.php` 의 dev 시드 안내 문구가 운영 화면에 보이는지.
- e2e(Playwright) 는 로컬 Docker 가 꺼져 있어 실행하지 못했다.

---

## 8. 추가 지시 — 남은 개발용 로그인·가짜 등록 SEED 전부 제거 (2026-10-09)

### 8-1. 지시서 원문

> 추가 지시 (사용자 승인 2026-10-09 00:43, 원문: 「모두 제거」). 같은 worktree `d:\work\study114\.wt\remove-dev-operator`, 같은 브랜치 `cursor/remove-dev-operator-20261009`에서 이어서 작업하라. `ebe3b60`은 이미 push되어 독립 리뷰 중이니 amend 금지, 새 커밋으로만.
>
> 1. 네가 "남은 개발용 로그인"으로 보고한 것 전부 제거: home-ui `DEV_ACCOUNTS`·`devLogin`/`devLoginAs` 및 호출부(운영 번들에 `@dev.local`·dev 비밀번호 문자열 0건), home-ui 툴바 「시험용·학부모/공부방/과외」 버튼과 핸들러, study-room-ui·tutor-ui의 「Dev 로그인」 버튼과 핸들러, auth-ui 로그인 화면의 `guardian1@dev.local` 미리 채움, `src/Views/auth/login.php`의 "dev 시드 계정" 안내 문구. 참조하는 e2e/verify 스크립트는 깨지지 않게 최소 수정(버튼이 "없어야 한다" 쪽으로 바꾸거나, 로컬 전용 로그인은 API 직접 호출로 대체). 로컬 Docker 시드 SQL 자체는 지우지 말고 "로컬 전용" 주석만.
> 2. 견본 제거 작업자가 남겨 둔 가짜 등록 SEED도 제거: `preview/home-ui/src/tutor-reg/store.js`, `preview/home-ui/src/student-reg/store.js`의 API 모드가 아닐 때 쓰는 가짜 등록 데이터(김수학 등, `tutor-card-sample.jpg` 참조). 새 대체 데이터를 만들지 말고, 빈 초기값으로. 이미지 파일 `tutor-card-sample.jpg`가 다른 곳에서 안 쓰이면 삭제. 다른 브랜치(`cursor/remove-samples-20261009`)가 이 두 파일을 건드렸는지 `git diff origin/main origin/cursor/remove-samples-20261009 --stat`로 확인하고, 겹치면 고치지 말고 보고만.
> 3. 전체 grep: `git grep -n "@dev.local\|devLogin\|dev-login\|Dev 로그인\|시험용·"` (preview/, src/, public/ 기준) 결과를 정리해 보고.
> 4. 검증: `vite build`(home-ui 등 바뀐 앱) 후 산출물에 `@dev.local` 0건 확인, `npm run verify:shop-page`, 관련 verify 스크립트, PHP `php -l`. main에서도 실패하는 건 구분해 보고.
> 5. worklog `docs/worklog/2026/10/2026-10-09-remove-dev-operator.md`에 이 추가 지시 원문과 결과 덧붙임. 파일명 지정 stage, 새 커밋, push. main 병합 금지.
>
> 보고: 새 커밋 hash, 파일별 1줄 변경, grep 결과, 검증 결과, 겹침 여부, 미확인.

### 8-2. 변경 파일 (기준 `ebe3b60` 위 새 커밋)

| 파일 | 변경 |
|------|------|
| `preview/home-ui/src/auth-session.js` | `DEV_ACCOUNTS`·`devLogin()`·`devLoginAs()` 와 안 쓰게 된 `JSON_HEADERS` 삭제 |
| `preview/home-ui/src/layout.js` | 툴바 「시험용·학부모/공부방/과외」 버튼·dev-login 핸들러·import 삭제. 툴바 「로그아웃」(`dev-logout`)은 유지 |
| `preview/home-ui/src/tutor-reg/store.js` | 가짜 과외쌤 `SEED`(김수학·박국어·이영어, `tutor-card-sample.jpg`)·`withDefaults` 삭제, 초기값 `[]` |
| `preview/home-ui/src/student-reg/store.js` | 가짜 학생 `SEED`(김하늘·김왕자·김별) 삭제, 초기값 `[]` |
| `preview/home-ui/src/messages/thread-store.js` | 머리 주석 "Dev 로그인 시 API" → "로그인 시 API" |
| `preview/study-room-ui/src/layout.js` | 「Dev 로그인」 버튼·핸들러·안 쓰는 import 삭제 |
| `preview/study-room-ui/src/register-api.js` | `devLogin()`(room-owner1@dev.local) 삭제 |
| `preview/tutor-ui/src/layout.js` | 「Dev 로그인」 버튼·핸들러·안 쓰는 import 삭제 |
| `preview/tutor-ui/src/register-api.js` | `devLogin()`(tutor-owner1@dev.local) 삭제 |
| `preview/auth-ui/src/screens/login.js` | DEV 때 이메일 칸 `guardian1@dev.local` 미리 채움 삭제 |
| `src/Views/auth/login.php` | 「dev 시드 계정: …」 안내 문구 삭제 |
| `e2e/helpers/messages-flow.js` | `devLoginParent`/`devLoginTutor` 를 툴바 클릭 대신 `/api/auth/login.php` 직접 호출로 변경 |
| `e2e/board-channel-acl.spec.js` | 「시험용·과외」 보임 검사 → 운영 빌드 툴바(`dev-logout`) 0개 검사 |
| `scripts/e2e-inquiry-settings-closeout.mjs` | 툴바 클릭 대신 로그인 API 직접 호출 |
| `scripts/verify-student-count-halt-and-gate.mjs` | SEED 대신 `addStudent` 로 검증용 학생 3명(공개·임시·숨김)을 직접 만든 뒤 검사 |
| `scripts/verify-student-mypage-metrics.mjs` | 1번 학생이 없으면 `addStudent` 로 만든 뒤 검사 |
| `scripts/capture-student-mypage-shots.mjs` | 위와 같음 |
| `sql/schema/012_search_dev_seed.sql` | "로컬 Docker 전용·운영 적용 금지·앞단 로그인 버튼 없음" 머리 주석 |
| `sql/schema/029_dev_email_verified.sql` | "로컬 Docker 전용" 주석 1줄 |
| `preview/tutor-ui/DOC-CHECKLIST.md` | 시드 계정은 auth-ui 로그인 화면으로 로그인한다고 수정 |
| `preview/home-ui/DOC-CHECKLIST.md` | auth-ui 줄에 "툴바 시험용 로그인은 2026-10-09 제거" 표기 |

`tutor-card-sample.jpg`(`preview/home-ui/public/assets/brand/`, `public/assets/brand/`)는 **삭제하지 않았다.** 이 브랜치에서 아직 `home-card-samples/presets.js`·`tutor-reg/registration-check-sample.js` 와 verify 스크립트 2개(`verify-tutor-inquiries-settings`·`verify-tutor-registration-check-frame`)가 참조한다. 견본 제거 브랜치가 main 에 들어간 뒤 다시 확인해서 지운다.

### 8-3. 다른 브랜치와 겹침 (`origin/cursor/remove-samples-20261009` @ `763d39f`)

- `tutor-reg/store.js`·`student-reg/store.js`: 견본 제거 브랜치가 **건드리지 않음** → 이번에 고쳤다.
- `layout.js`·`auth-session.js`: 겹치지 않음.
- 양쪽이 모두 고친 파일(서로 다른 위치): `scripts/e2e-inquiry-settings-closeout.mjs`, `scripts/verify-student-count-halt-and-gate.mjs`, `scripts/verify-student-mypage-metrics.mjs`, `scripts/capture-student-mypage-shots.mjs`. 병합 시 충돌 여부는 커밋 뒤 `git merge-tree` 로 확인(보고에 기재).
- `scripts/measure-inquiry-basic-cards.mjs`: 견본 제거 브랜치가 **삭제**하는 파일이라 손대지 않았다. 이 브랜치만 단독으로는 이 스크립트가 없는 버튼(`dev-login-tutor`)을 찾다 실패한다.
- `preview/home-ui/src/exposure-bridge.js` 2행 "Dev 로그인 시" 주석: 견본 제거 브랜치가 같은 줄을 바꾸므로 손대지 않았다.

### 8-4. 전체 grep (`preview/ src/ public/`)

`git grep -n -e "@dev.local" -e "devLogin" -e "dev-login" -e "Dev 로그인" -e "시험용·" -- preview src public` — 코드 실행 경로 0건. 남은 것은 문서·주석뿐:

| 위치 | 내용 |
|------|------|
| `preview/home-ui/DOC-CHECKLIST.md` 62·80·99·133·382행 | 2026-07-06 기록 "Dev 로그인 시 … API" (과거 이력) |
| `preview/home-ui/src/exposure-bridge.js` 2행 | 주석 (견본 제거 브랜치 담당 줄) |
| `preview/tutor-ui/DOC-CHECKLIST.md` 9행 | 이번에 쓴 "로컬 시드 계정은 auth-ui 로 로그인 · 툴바 버튼 제거" 안내 |

`src/`·`public/` 0건.

### 8-5. 검증

| 항목 | 결과 |
|------|------|
| `vite build` home-ui·study-room-ui·tutor-ui·auth-ui | 4개 모두 성공 |
| 빌드 산출물(js·html) `@dev.local`·`dev-login`·`Dev 로그인`·`시험용·`·`password: 'password'` | 4개 앱 모두 **0건** |
| `npm run verify:shop-page` | 54 통과 / 0 실패 |
| `verify-student-count-halt-and-gate` | 28 / 0 (SEED 제거로 처음 7건 실패 → 검증용 학생 직접 생성으로 고침) |
| `verify-student-mypage-metrics` | 통과 (위와 같은 방식으로 고침) |
| `verify-student-location-flow` 189/0 · `verify-student-branch-two-tabs` 162/0 · `verify-role-home-guard` 56/0 · `verify-admin-today-hub` 61/0 · `verify-admin-162` 57/0 · `verify-admin-preview-labels` 202/0 · `verify-message-permissions-admin` 132/0 · `verify-mypage-account-region` 41/0 | 통과 |
| `verify-tutor-inquiries-settings` · `verify-study-room-registration-check-frame` · `verify-study-room-inquiries-samples` · `verify-tutor-mypage-route-integrity` · `verify-tutor-register-same-tab` · `verify-tutor-lesson-optional-step` · `verify-tutor-signup-seed` · `verify-cur-006-email-verify-gate` · `verify-home-news-row` | 통과 |
| `php -l src/Views/auth/login.php` | 문법 오류 없음 |
| `node --check` (고친 e2e·scripts) | 통과 |
| `verify-input-fill-rule`(3건) · `verify-tutor-registration-check-frame`(3건) · `verify-cur-006-post-verify-role`(2건) | **실패 — 무관.** 이번 변경을 stash 한 `ebe3b60` 에서도 같은 실패 |
| `verify-admin-registration-list` · `sync:inventory:check` | **실패 — 무관** (4절과 같음, main 에서도 실패) |

실행하지 못한 것: e2e(Playwright, 로컬 Docker 꺼짐), `capture-student-mypage-shots`(스크린샷 캡처, 브라우저 필요).

### 8-6. 남은 가짜·데모 데이터 (사용자 결정 필요 · 이번 범위 밖)

- `preview/home-ui/src/mypage/recent-store.js` `ensureRecentDemo` — 최근 본 목록 데모(김수학·박국어·오영어 등).
- `preview/home-ui/src/messages/thread-store.js` 비로그인 데모 쪽지(맑은하늘).
- 빌드 산출물에 남은 `김수학`·`맑은하늘`·`tutor-card-sample` 문자열은 위 두 파일과 견본 제거 브랜치 담당 파일(`exposure-data.js`·`presets.js`)에서 온다.

### 8-7. 배포 전 사용자 할 일 (추가분)

- SQL 파일 수정은 **주석만**(012·029, 로컬 전용 표기). 운영 DB 에 실행할 것 없음.
- 환경변수·Secrets·`.htaccess` 변경 없음.

---

## 9. 3차 지시 원문 (2026-10-09 00:57)

> 수고했다. 같은 worktree·브랜치에서 새 커밋으로 아래를 반영하라 (amend 금지).
>
> A. 독립 리뷰(다른 모델, `ebe3b60` 대상) 결과 「조건부 승인 권고」. 지적 반영:
>  1. [중간] `e2e/submission-attachment-flow.spec.js` 8·64·97행과 `e2e/helpers/admin-api.js` 8·75행이 아직 `ops@dev.local`로 로그인·단언함. 로컬 Docker 시드는 남아 있어 지금은 동작하지만, 로컬 전용 계정임을 분명히 하라: e2e 전용 운영자 계정 상수를 한 곳(`e2e/helpers/` 공용)에 두고 "로컬 Docker 시드 전용(026/036), 운영 DB엔 없음" 주석과 함께 참조하게 정리. 실제 사람 계정(jetty@naver.com, leejetty@gmail.com)을 테스트에 쓰지 마라.
>  2. [낮음] `sql/ops/2026-10-09-delete-ops-dev-local.sql` STEP 1-4 앞에 「아래 SET/PREPARE/EXECUTE/DEALLOCATE 문장은 phpMyAdmin SQL 탭에 함께 붙여넣고 실행을 한 번만 누르세요」 주석 추가. 2단계 트랜잭션 블록도 같은 안내가 있는지 확인.
>  3. [낮음] `e2e/a28-07-ops-smoke.spec.js` 3행 주석: 로컬 Docker 전용임을 명시.
>
> B. 사용자 원칙(「견본카드들은 다 제거해」, 「모두 제거」)에 따라 남은 데모 데이터도 제거:
>  - `preview/home-ui/src/mypage/recent-store.js` `ensureRecentDemo()`와 데모 항목(김수학·박국어·오영어 등) 및 호출부.
>  - `preview/home-ui/src/messages/thread-store.js`의 쪽지 데모(맑은하늘 등)와 그 시드 경로.
>  - 대체 데이터 만들지 말고 빈 상태(기존 빈 상태 처리)로. 다른 브랜치 `origin/cursor/remove-samples-20261009`가 이 파일들을 건드렸는지 먼저 확인하고, 겹치면 고치지 말고 보고만.
>  - 이를 기대하는 verify/e2e 단언은 "데모 0건" 방향으로 반전(삭제만 하지 말 것).
>
> C. 검증: 바뀐 앱 빌드, `verify:shop-page`, 관련 verify 스크립트, `node --check`. 전과 같이 main/이전 커밋에서도 실패하는 건 구분. `git merge-tree`로 `origin/cursor/remove-samples-20261009`와 충돌 여부 재확인.
>
> D. worklog에 「독립 리뷰 결과·반영」과 B 결과 절 추가. 파일명 지정 stage, 새 커밋, push.
>
> 보고: 새 커밋 hash, 파일별 1줄, 검증 결과, 충돌 여부, 미확인.

---

## 10. 독립 리뷰 결과·반영 (대상 `ebe3b60`, 결과 「조건부 승인 권고」)

| 지적 | 등급 | 반영 |
|------|------|------|
| e2e 가 `ops@dev.local` 을 파일마다 문자열로 들고 로그인·단언 | 중간 | 새 공용 파일 `e2e/helpers/local-seed-accounts.js` 에 `LOCAL_SEED_ACCOUNTS`·`LOCAL_SEED_PASSWORD`·`E2E_OPERATOR_EMAIL` 를 "로컬 Docker 시드 전용(012·026/036) · 운영 DB 에 없음 · 실제 사람 계정 금지" 주석과 함께 정의. `admin-api.js` 의 `ACCOUNTS`·`DEV_PASSWORD` 는 이 파일을 다시 내보내고(기존 import 유지), `expectLog` 기본 운영자 = `E2E_OPERATOR_EMAIL`. `submission-attachment-flow.spec.js` 는 자체 계정 표를 지우고 공용 상수를 import, 운영 로그 단언도 `E2E_OPERATOR_EMAIL`. 실제 사람 계정은 어떤 테스트에도 쓰지 않았다 |
| 삭제 SQL STEP 1-4 동적 쿼리 실행 안내 | 낮음 | 1-4 의 `SET` 앞에 「아래 SET/PREPARE/EXECUTE/DEALLOCATE 문장은 phpMyAdmin SQL 탭에 함께 붙여넣고 실행을 한 번만 누르세요」 + 이유(연결이 바뀌면 `@s114_q` 사라짐) 주석 추가 |
| STEP 2 트랜잭션 블록도 같은 안내 | 낮음 | 기존엔 "아래 블록 전체를 한 번에 실행"만 있었다. 「START TRANSACTION 부터 COMMIT 까지 … 함께 붙여넣고 실행을 한 번만 누르세요」 주석을 추가했다 |
| `a28-07-ops-smoke.spec.js` 머리 주석 | 낮음 | "로컬 Docker(study114_dev) 전용 · 시드 운영자 계정(026/036, 운영 DB 에 없음) · 운영 사이트 대상으로 돌리지 않는다"로 수정. 본문의 `'password'` 문자열 2곳도 공용 상수 `DEV_PASSWORD` 로 |

리뷰 범위 밖이라 그대로 둔 것: `scripts/verify-board-acl-live.mjs`(로컬 API 대상 스크립트, 자체 계정 표)와 `scripts/verify-hide-inquiry-bundle.mjs`(PHP 단위 검사에 운영자 이름 문자열로 전달)도 `ops@dev.local` 을 쓴다. 둘 다 로컬 전용이며 운영 번들에 들어가지 않는다.

---

## 11. 남은 데모 데이터 제거 결과 (최근열람·쪽지)

### 11-1. 겹침 확인

`git diff --name-only origin/main origin/cursor/remove-samples-20261009` (처음 `763d39f`, 커밋 뒤 최신 `d72de7a` 로 재확인 — 결과 같음) 에 `mypage/recent-store.js`·`mypage/index.js`·`messages/thread-store.js`·`messages/index.js`·`messages/screens.js`·`scripts/verify-message-permissions-admin.mjs`·`e2e/*` 는 **없음** → 겹치지 않아 직접 고쳤다.

### 11-2. 변경

| 파일 | 변경 |
|------|------|
| `preview/home-ui/src/mypage/recent-store.js` | `ensureRecentDemo()`(대치 우등생 공부방·드림스터디 대치·아이빌 공부방·김수학·박국어·오영어) 삭제 |
| `preview/home-ui/src/messages/thread-store.js` | `ensureDemoThreads()`(대치맘·맑은하늘·김학부모 쪽지 3건, 사업자등록증.pdf 첨부 표시) 삭제 |
| `preview/home-ui/src/mypage/index.js` | 마이페이지 진입 시 두 데모 시드 호출·import 삭제 |
| `preview/home-ui/src/messages/index.js` | 쪽지 화면 진입 시 데모 시드 호출·import 삭제 |
| `preview/home-ui/src/messages/screens.js` | 요약 건수(`getMessagesSummaryCounts`) 계산 전 데모 시드 호출·import 삭제 |
| `scripts/verify-message-permissions-admin.mjs` | 「데모 시드 함수 없음」·「빈 저장소에서 쪽지 0건」 단언 추가, 권한 검사용 스레드 3건(공부방·과외·학생, 이름 `검증상대-*`)은 스크립트가 저장소에 직접 넣는다 |
| `e2e/core-flow-messages.spec.js` | 「guest 쪽지함 · 데모 스레드 노출」 → 「데모 스레드 0건」으로 반전 (`.msg-row` 0 · 대치맘·맑은하늘 0 · 답장 폼 0). 비로그인은 로그인 안내로 막히므로 쪽지 패널 또는 로그인 안내 중 하나를 기다린다 |

대체 데이터는 만들지 않았다. 비로그인(API 아님) 상태의 최근열람·쪽지함은 각 화면의 기존 빈 상태 문구로 보인다. 최근열람 데모를 기대하던 verify/e2e 단언은 없었다(로그인 e2e 는 API 기록을 본다).

### 11-3. 검증 (작업 트리, 커밋 전)

| 항목 | 결과 |
|------|------|
| home-ui `vite build` | 성공. 산출물 `@dev.local`·`dev-login`·`ensureDemoThreads`·`ensureRecentDemo`·`대치맘` 0건 |
| 산출물에 남은 `드림스터디 대치`·`아이빌 공부방`·`오영어`·`맑은하늘`·`김수학` 각 1건 | 출처는 `exposure-data.js` 한 파일 — 견본 제거 브랜치가 지우는 파일이라 손대지 않음 |
| `npm run verify:shop-page` | 통과 |
| `verify-message-permissions-admin` | 134 / 0 (전 132 + 새 단언 2) |
| `verify-role-home-guard` 56/0 · `verify-admin-today-hub` 61/0 · `verify-admin-162-settlement` 57/0 · `verify-admin-preview-labels` 202/0 · `verify-mypage-account-region` 41/0 · `verify-mypage-notice-top` 49/0 · `verify-student-location-flow` 189/0 · `verify-student-branch-two-tabs` 162/0 · `verify-student-count-halt-and-gate` 28/0 · `verify-hide-inquiry-bundle` 30 OK | 통과 |
| `verify-student-mypage-metrics` · `verify-parent-review-positive` · `verify-paid-renewal` · `verify-tutor-mypage-route-integrity` · `verify-tutor-mypage-frame-ia` · `verify-tutor-register-same-tab` · `verify-study-room-registration-check-frame` · `verify-cur-006-email-verify-gate` · `verify-home-news-row` | 통과 |
| `node --check` (바뀐 e2e·scripts·src 11개) | 통과 |
| `verify-input-fill-rule`(3건) · `verify-tutor-registration-check-frame`(3건) | **실패 — 무관.** 같은 3건이 `ebe3b60` 에서도 실패(8-5 와 동일 항목) |

실행하지 못한 것: e2e(Playwright, 로컬 Docker 꺼짐) — 바뀐 e2e 4개는 문법 검사만 했다.

### 11-4. 아직 남은 데모 시드 (이번 지시 범위 밖 · 사용자 결정 필요)

`mypage/index.js` 가 마이페이지 진입 때 아직 부르는 `ensureWishlistDemo()`(찜), `ensureStudentReviewDemo()`(학생 후기), `ensureSubmissionBoardSeed()`(제출자료 게시판). → 12절에서 제거.

### 11-5. 배포 전 사용자 할 일 (추가분)

- `sql/ops/2026-10-09-delete-ops-dev-local.sql` 은 **주석만** 바뀌었다. 실행 순서·내용은 5절과 같다.
- 환경변수·Secrets·`.htaccess` 변경 없음.

---

## 12. 4차 지시 — 남은 마이페이지 데모 시드 제거 (2026-10-09 01:08)

### 12-1. 지시서 원문

> 수고했다. 사용자 원칙(「모두 제거」)에 따라 네가 보고한 남은 마이페이지 데모 시드도 같은 worktree·브랜치에서 새 커밋으로 제거하라 (amend 금지).
> - `ensureWishlistDemo`(찜 데모), `ensureStudentReviewDemo`(학생 후기 데모), `ensureSubmissionBoardSeed`(제출자료 게시판 시드)와 그 호출부. 이 밖에 preview/(admin 제외)에서 `ensure*Demo`/`*Seed`/`demo` 형태로 가짜 데이터를 채우는 함수가 더 있으면 같이 정리하고 목록 보고.
> - 대체 데이터 만들지 말고 기존 빈 상태로. 이를 기대하는 verify/e2e 단언은 "데모 0건" 방향으로 반전.
> - 겹침 규칙: 먼저 `git fetch` 후 `git diff origin/main origin/cursor/remove-samples-20261009 --stat`로 견본 제거 브랜치(현재 `d72de7a`, 승인 대기 중)가 고친 파일 목록을 확인. 특히 `user-actions-state.js`는 그 브랜치가 고쳤다. 겹치는 파일은 수정 위치가 그 브랜치 변경과 떨어져 있고 `git merge-tree` 충돌 0이면 고쳐도 되고, 충돌이 나면 고치지 말고 보고만.
> - 검증: home-ui 빌드 후 산출물에서 데모 이름 0건(단 `exposure-data.js` 출처는 견본 제거 브랜치 범위라 제외하고 보고), `verify:shop-page`, 관련 verify, `node --check`. 이전 커밋에서도 실패하던 것은 구분.
> - worklog 11-1절 겹침 기준을 최신 `d72de7a`로 고치고, 이번 결과 절 추가. 파일명 지정 stage, 새 커밋, push.
> 보고: 새 커밋 hash, 파일별 1줄, 검증, 충돌 여부, 남은 데모 목록.

### 12-2. 겹침 확인 (`origin/cursor/remove-samples-20261009` @ `d72de7a`)

- 이번에 고친 파일 중 그 브랜치도 고친 파일: `preview/home-ui/src/user-actions-state.js` 하나. 그 브랜치는 51~75행 근처(`findProvider` 풀 확장·import 2줄)를 바꾸고, 이번 변경은 176~189행 `ensureWishlistDemo()` 삭제라 떨어져 있다. `git merge-tree` 충돌 0 (12-5).
- `plans/history-mock.js` 의 가짜 결제내역(`demo-prime-001`·`demo-pick-002`)은 그 브랜치가 이미 지운다 → 손대지 않음.

### 12-3. 변경

| 파일 | 변경 |
|------|------|
| `preview/home-ui/src/user-actions-state.js` | `ensureWishlistDemo()`(공부방 1·4·5·10, 과외 1·3·7 찜) 삭제 |
| `preview/home-ui/src/student-review-store.js` | `ensureStudentReviewDemo()`(관심 학생 1·4) 삭제 |
| `preview/home-ui/src/submission-board/submission-store.js` | `ensureSubmissionBoardSeed()`(가짜 제출자료 `sub-seed-1` 학력 증명서 사본·`sub-seed-2` 경력 확인 서류) 삭제. `listSubmissionPosts` 는 API 모드면 캐시, 아니면 저장된 글만(없으면 빈 목록) |
| `preview/home-ui/src/submission-board/index.js` | `ensureSubmissionBoardSeed` 다시 내보내기 삭제 |
| `preview/home-ui/src/provider-reviews/store.js` | `seedDefaults()`(가짜 후기 3건 · 작성 횟수 시드) 삭제. 저장된 후기가 없으면 빈 목록 |
| `preview/home-ui/src/mypage/index.js` | 마이페이지 진입 때 찜·관심 학생·제출자료 시드 호출 3개와 import 삭제 |

대체 데이터는 만들지 않았다. 각 화면은 기존 빈 상태 문구로 보인다. 이 데모를 기대하던 verify/e2e 단언은 없었다(찜·후기 e2e 는 로그인 API 로 직접 만든 뒤 본다).

### 12-4. preview/(admin 제외) 가짜 데이터 채우기 함수 전수 점검

| 함수 | 판단 |
|------|------|
| `ensureWishlistDemo` · `ensureStudentReviewDemo` · `ensureSubmissionBoardSeed` · `provider-reviews` `seedDefaults` | **가짜 데이터 → 이번에 삭제** |
| `ensureRecentDemo` · `ensureDemoThreads` | 3차(`c1def04`)에서 삭제 |
| `plans/history-mock.js` `getSeedHistory` | 가짜 결제내역 — 견본 제거 브랜치가 삭제 |
| `exposure-data.js` `STUDY_ROOM_SEED`·`TUTOR_SEED`·`STUDENT_SEED` · `home-card-samples/*` · `tutor-reg/registration-check-sample.js` | 견본 카드 — 견본 제거 브랜치 범위 |
| `exposure-rules.js` `demo_prime_filled`·`demo_prime_tutor_pool` | 데이터가 아니라 견본 풀(`exposure-data`)에 대표 노출 자리를 채우는 규칙. 실DB 풀이면 쓰지 않는다. 견본 풀이 지워지면 의미 없음 — 이번에 손대지 않음(사용자 결정) |
| `support/notice-store.js` `seedIfEmpty` · `operational-board-store.js` 공지·FAQ·가이드 seed | 실제 서비스 안내 문구(고객센터 공지 2건·FAQ·안전과외 가이드) — 가짜 아님, 유지 |
| `board-channel-store.js` `seedChannels` · `right-rail-store.js` 기본 슬롯 | 게시판 채널·우측 배너 **설정 기본값** — 가짜 아님, 유지 |
| `home-popup/gate.js` `readPopupDemo`/`writePopupDemo` | 관리자 전용 팝업 미리보기(`?popupDemo=`) — 데이터 아님, 유지 |
| `study-room-home-seed.js` · `tutor-home-seed.js` · search-ui `seedStudyRoomPromoLabel` | 이름만 seed. 내 등록·저장 지역에서 실제 값을 읽는다 — 유지 |

preview 밖이라 손대지 않았지만 알릴 것: `sql/schema/021_board_engine.sql` 이 서버 DB 에 제출자료 글 `sub-seed-1`·`sub-seed-2`·`sub-seed-room-1` 을 넣는다(e2e `a28-07-exposure-patch`·`admin-api.restoreExposureDefaults` 가 이 행을 쓴다). 운영 DB 에 들어갔는지는 미확인.

### 12-5. 검증 (작업 트리)

| 항목 | 결과 |
|------|------|
| home-ui `vite build` | 성공 |
| 산출물 데모 문자열 (`sub-seed-`·가짜 제출자료 제목·가짜 후기 3문장·`ensure*Demo`/`ensureSubmissionBoardSeed`·대치맘·김하늘·김왕자·`@dev.local`) | **0건** |
| 산출물에 남은 김수학·박국어·오영어·이영어·맑은하늘·드림스터디 대치·아이빌 공부방·대치 우등생 공부방 각 1건 | 출처 `exposure-data.js` — 견본 제거 브랜치 범위 |
| 산출물 `demo-prime-001` 1건 | 출처 `plans/history-mock.js` — 견본 제거 브랜치가 지움 |
| 산출물 `김학부모` 1건 | 출처 `admin/a28-screens-state.js` — admin 제외 범위 |
| `npm run verify:shop-page` | 통과 |
| `verify-card-visual-penetration` · `verify-parent-review-positive` · `verify-board-channel-acl` · `verify-cur-006-email-verify-gate` · `verify-message-permissions-admin` 134/0 · `verify-tutor-mypage-frame-ia` · `verify-tutor-mypage-route-integrity` · `verify-hide-inquiry-bundle` 30 · `verify-role-home-guard` 56/0 · `verify-mypage-account-region` 41/0 · `verify-mypage-notice-top` 49/0 · `verify-student-mypage-metrics` · `verify-student-count-halt-and-gate` 28/0 · `verify-admin-today-hub` 61/0 · `verify-admin-preview-labels` 202/0 · `verify-admin-162-settlement` 57/0 | 통과 |
| `node --check` (바뀐 src 6개) | 통과 |
| `verify-input-fill-rule`(3건) · `verify-tutor-registration-check-frame`(3건) | **실패 — 무관.** 8-5·11-3 과 같은 항목 |
| `verify-cur-006-email-verify-inventory`(1건: `public/api/search/search.php` 미분류) | **실패 — 무관.** 이번 변경을 stash 한 `c1def04` 에서도 같은 실패 |

실행하지 못한 것: e2e(Playwright, 로컬 Docker 꺼짐).

### 12-6. 배포 전 사용자 할 일 (추가분)

- 없음. SQL·환경변수·Secrets·`.htaccess` 변경 없음.
