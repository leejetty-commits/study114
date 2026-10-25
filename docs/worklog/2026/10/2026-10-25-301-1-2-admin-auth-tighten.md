# 301-1-2 관리자 requireAuth·등급 DB 우선

**기준:** origin/main `efae664b` (301-1-1 병합 후)  
**브랜치:** `cursor/301-1-2-admin-auth-tighten-20261025`  
**작업일:** 2026-10-25  
**검수 근거:** `_local/full-sweep-20261025/drafts/VERIFY-FS-T5-security-repeat.md` FS-T5-001  
**승인:** 이 세션은 자기 커밋을 승인하지 않는다.

## 지시서 원문 요약

1. `AdminApi::requireAuth()`를 `AuthSession::userIfActive()`로 교체 — 탈퇴·차단 계정 세션 거르기.
2. `AdminRoleService::resolveLevel()`에서 DB 값을 먼저, 세션 `admin_level`은 DB 실패 시 폴백으로.
3. 비로그인 401 · 일반 회원 403 · 관리자 200 스모크 유지. 새 미들웨어/헬퍼/PoC 금지.

원본: `D:\work\study114\_local\directives\301-1-2-admin-auth-tighten.md`

## 변경 내용

### AdminApi.php (1줄)

`requireAuth()` 안에서 `AuthSession::user()`를 `AuthSession::userIfActive()`로 바꿈. `userIfActive()`는 세션 사용자가 있으면 DB `users.status = 'active'`를 확인하고, 활성이 아니면 `logout()` + `close()` 후 null을 돌려준다. null이면 기존 401.

19개 admin/content API 전부 `requireAdmin()` → `requireAuth()` 순서를 타므로, 이 1줄이 모든 관리자 API에 적용된다.

### AdminRoleService.php (resolveLevel)

원래 순서:
1. 세션 `admin_level` → 있으면 바로 리턴
2. DB `fetchLevelByUserId` → `fetchLevelByEmail`
3. bootstrap 이메일 / admin 역할 degrade

고친 순서:
1. DB `fetchLevelByUserId` → `fetchLevelByEmail` (먼저)
2. 세션 `admin_level` (DB 실패 시 폴백)
3. 나머지 동일

이로써 권한을 회수(DB `admin_level = NULL`)하면 세션에 옛 값이 남아도 다음 요청에서 null 리턴 → `hasAdminCapability` false → 403.

## 수용 기준 확인

| 기준 | 결과 |
|------|------|
| 세션-only 관리자 승격 경로 | **없음.** DB 조회가 먼저. 세션값은 DB miss 시 폴백 전용. |
| 비로그인 `/api/admin/members.php` → 401 | **유지.** `userIfActive()`도 세션 없으면 null → 401. |
| 탈퇴/차단 계정 → 401 | **유지.** `userIfActive()`가 `status !== 'active'` → `logout()` → null → 401. 이 PC에 PHP 없어 라이브 테스트 미실행. 정적 근거: `AuthSession::userIfActive()` 135–144행. |
| 최고관리자(`isSuperAdmin`/`requireMaster`) 회귀 | **없음.** `resolveLevel` 반환값만 바뀌고 비교 로직은 그대로. DB에 `super_admin`이 있으면 첫 번째로 리턴. |
| 일반 회원 403 | **유지.** DB에 `admin_level` 없고 세션에도 없고 role_type ≠ admin → null → `hasAdminCapability` false → 403. |

## 보완 (같은 브랜치 2번째 커밋)

### 배경

1번째 커밋(`e7ea0e61`)은 `resolveLevel`에서 DB를 먼저 보게 순서를 바꿨다. 하지만 기존 `fetchLevelByUserId`/`fetchLevelByEmail`은 행이 있는데 `admin_level`이 NULL(권한 회수)일 때와, 행이 없거나 예외일 때를 모두 `null`로 돌려줬다. 따라서 회수 후에도 세션 폴백으로 승격되는 빈틈이 남았다.

### 고친 방식

같은 클래스에 `private fetchLevelTriState(?int $userId, ?string $email): array`를 추가했다. `[bool $found, ?string $level]`을 돌려준다.

- `$found = true, $level = 'super_admin'|'sub_master'` — DB 행이 있고 유효 등급이 있다.
- `$found = true, $level = null` — DB 행이 있지만 `admin_level`이 NULL 또는 인식 불가(회수됨). 정본이다. 세션 폴백·bootstrap·admin degrade 금지.
- `$found = false, $level = null` — 행이 없거나 예외. 이때만 세션 폴백 등 이하 로직이 동작한다.

`resolveLevel`은 `fetchLevelTriState`를 쓴다. 기존 공개 메서드 `fetchLevelByUserId`/`fetchLevelByEmail`은 다른 호출부가 없지만 시그니처를 바꾸지 않았다.

### 회수 시나리오 정적 근거

1. 운영자가 phpMyAdmin에서 `UPDATE users SET admin_level = NULL WHERE id = 42` 실행.
2. 사용자 42가 세션에 `admin_level: 'super_admin'`을 갖고 관리자 API 호출.
3. `requireAuth()` → `userIfActive()` → `status = 'active'` → 통과.
4. `requireAdmin()` → `hasAdminCapability()` → `resolveLevel()`.
5. `fetchLevelTriState(42, null)` → `SELECT admin_level FROM users WHERE id = 42` → `fetchColumn()` = `null` (PHP PDO: 행은 있지만 컬럼이 SQL NULL이면 PHP null 반환) → `$raw !== false` → `[true, normalizeLevel(null)]` = `[true, null]`.
6. `$found = true` → `return null`. 세션 폴백·bootstrap·degrade 도달 없음.
7. `hasAdminCapability` → `null !== null` = false → `fail(403)`.

PDO `fetchColumn()` 반환값: 행 없음 = `false`, 행 있음·값 NULL = PHP `null`. 이 구분이 tri-state의 핵심이다.

## 범위 밖

- 게스트 좌표(301-1-1 완료)
- 결제 PG 대조(301-1-3 보류)
- `AuthSession::login()`의 세션 기록은 안 고침 — 로그인 시점 DB 등급 반영은 이미 `fetchAuthFlags`로 하고 있음
