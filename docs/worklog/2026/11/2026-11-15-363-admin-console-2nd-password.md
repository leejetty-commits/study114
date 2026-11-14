# 363 관리자 콘솔 2차 비밀번호

- 날짜: 2026-11-15
- 브랜치: `work/363-admin-console-2nd-password`
- 기준: `origin/main` `f527a26d`
- 지시: `docs/sec-high-fixes-2026-11-14` `f406b71c` 의 `docs/worklog/grok-sync/docs/sec-B1-admin-console-2nd-password-2026-11-14.md`. 정본과 다르면 B1이 우선. 운영 반영 순서는 이번 지시 「092 실행 → 해시 등록 → 머지·배포」.
- 이 세션은 승인하지 않는다. 머지·force push·운영 SQL 없음.

## A~E (5장 권장안, 상수 1곳)

`src/Admin/AdminConsolePolicy.php`

- A 유휴 30분(1800초), 슬라이딩, 절대 만료 없음
- B 5회 실패 후 15분(900초) 잠금. 만료나 성공 때 횟수 초기화
- C `admin_level` 이 있는 계정 전부 (최고관리자·부마스터)
- D 비상코드 없음
- E 특수문자는 `!@#$%^&*?` 만. 길이 6, 대문자 1·소문자 1·숫자 2·특수문자 2

## 막힌 곳

`AdminApi::requireAdmin(true)` 가 로그인·운영 권한·이메일 인증 뒤에 콘솔 잠금을 본다. 예외는 `public/api/admin/console-unlock.php` 의 GET과 잠금해제 POST만 `requireAdmin(false)`. 변경 POST는 해제 뒤다.

같은 `requireAdmin()` 을 쓰는 공개 파일 21개도 해제 전 403 `console_unlock_required` 다. 지원 공지·문의(`SupportApi` → `AdminApi::requireAdmin`)도 포함한다.

- `public/api/admin/commerce.php`
- `public/api/admin/content/channels.php`
- `public/api/admin/content/migrate.php`
- `public/api/admin/content/right-rails.php`
- `public/api/admin/exposure.php`
- `public/api/admin/home-popups.php`
- `public/api/admin/member-mail.php`
- `public/api/admin/members-bulk-delete.php`
- `public/api/admin/members.php`
- `public/api/admin/operation-logs.php`
- `public/api/admin/operators.php`
- `public/api/admin/registrations.php`
- `public/api/admin/reports.php`
- `public/api/admin/session.php`
- `public/api/admin/settlement-lines.php`
- `public/api/admin/settlement-report.php`
- `public/api/admin/site-settings.php`
- `public/api/admin/submission-queue.php`
- `public/api/admin/withdraw-reasons.php`
- `public/api/support/notices.php`
- `public/api/support/tickets.php`

`AdminApi::fail()` 은 `study114_json_error` 로 보낸다. 헤더 `X-Study114-Soft-Error: 1` 이면 4xx가 HTTP 200이고 본문에 `http_status` 가 있다. 5xx는 그대로다.

## SQL

`git fetch` 후 `origin/main` 과 다른 ref에 `092` 스키마가 없었다. `090`·`091` 다음이다.

`sql/schema/092_admin_console_auth.sql` 과 `docs/worklog/grok-sync/sql/sec-B1-admin-console-auth-092.sql` 은 `f406b71c` 원문과 바이트가 같다(841). 그 파일의 주석은 머지·배포 뒤를 말한다. 실행 순서는 `docs/internal/32-admin-console-password-ops.md` 가 정한다. 092 실행 → 해시 등록 → 머지·배포. 롤백은 `sql/schema/092_admin_console_auth_rollback.sql`.

## 검증

로컬 Docker MySQL에만 일회용 DB `study114_b1test` 를 만들고 끝에서 삭제했다. 운영 DB는 쓰지 않았다.

`php scripts/verify-admin-console-password.php` → **34 PASS / 0 FAIL**. 해시 스크립트는 `password_verify`를 통과하고, 형식이 아니거나 확인이 다르면 해시를 내지 않는다.

포함: 형태 거절, 헤더 있으면 200 `console_unlock_required` `http_status` 403, 헤더 없으면 403, 해제, 세션 쿠키 값 변경(값은 기록하지 않음), 해제 후 members 200, 유휴 30분, 회원 403, 비로그인 401, 5회 잠금, 잠금 중 맞는 비밀번호 거절, 만료 후 재시도, 로그아웃, 미설정, 변경 성공·기존 비밀번호 불일치, 감사 로그 5종, 로그에 비밀번호·해시 없음.

스크린샷은 입력칸이 비어 있다. 견본 문구이며 운영 화면이 아니다.

- `docs/worklog/2026/11/shots-363/unlock-390.png`
- `docs/worklog/2026/11/shots-363/unlock-1280.png`
- `docs/worklog/2026/11/shots-363/locked-390.png`
- `docs/worklog/2026/11/shots-363/locked-1280.png`
- `docs/worklog/2026/11/shots-363/fail-390.png`
- `docs/worklog/2026/11/shots-363/fail-1280.png`

## 보완 (같은 PR)

- `scripts/admin-console-password-hash.php` 는 DB 없이 숨긴 입력 두 번으로 해시 한 줄만 낸다. 운영 문서 32의 해시 절차를 이 스크립트와 Docker 명령으로 바꿨다.
- 092 주석은 저장소와 grok-sync 사본 모두 「머지 전」이다.
- 관리자 API가 `console_unlock_required` 이면 세션을 다시 받고 콘솔 잠금 화면을 연다.
- 콘텐츠 설정, 고객센터 관리자 요청, 홈 팝업 미리보기에 soft-error 헤더를 붙였다.
- 잠금해제 입력칸은 제목과 같이 가운데다.

## 최종 검수 묶음

- 위험: 콘솔 입구. 셸·메뉴·홈 레이아웃 파일은 그대로. `shell.js` 변경 없음.
- 운영 전 사용자 할 일: 092 실행, 해시 등록. 그 다음 머지·배포.
- 이 작업 세션은 자기 커밋을 승인하지 않는다.
