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
