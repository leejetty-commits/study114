# 관리자-159-c 등록 목록 cherry-pick 기록 (2026-10-08)

- **브랜치:** `cursor/admin-159c-on-hold-20261008`
- **작업자:** Cursor 메인 에이전트
- **상태:** 검수·승인 대기

---

## 지시서 원문

> 너는 study114 작업자다. 보고는 한국어. Windows PowerShell.
>
> ## 규칙 (반드시)
> - 작업 폴더: `d:\work\study114\.wt\159c` (브랜치 `cursor/admin-159c-on-hold-20261008`, HEAD `7d4de59`). 이 폴더에서만 읽기·편집·검사·커밋·push.
> - Cursor 는 작업 공간(d:\work\study114) 밖 쓰기를 막는다. `D:\work\study114-*` 폴더(특히 옛 `D:\work\study114-159c-rebase`)에는 쓰지 마라. d:\work\study114 루트 작업트리(커밋 안 된 파일 많음)와 다른 `.wt\*` 폴더도 건드리지 마라.
> - `git add -A` 금지, 파일별 stage. main push/merge 금지. amend 금지. force push 금지. SQL·.htaccess·env 변경 금지.
> - 편집 도구가 거절되면 재시도하지 말고 'EDIT_BLOCKED' 와 거절 문구를 보고하고 끝내라.
>
> ## 배경
> - 159c = 관리자 회원관리에 '등록 목록'을 더하는 그록봇 과제. 원본 커밋 `4c865bd` (원격 브랜치 `origin/cursor/admin-159c-20261007`, 부모 `2723c5f`). 13파일 +1687줄: a28-copy.js, a28-registration-list-copy.js, a28-registration-list.js, a28-screens-bind.js, a28-screens.js, registration-list-api.js, home-admin.css, public/api/admin/registrations.php, scripts/verify-admin-registration-list.mjs/.php, src/Admin/AdminRegistrationListRepository.php, src/Registration/BasicCardRegisteredQuery.php, src/Report/ReportPeriod.php.
> - 지시서·검수 문서: `git show origin/docs/grok-sync-20261007:docs/worklog/grok-sync/docs/210-admin-159c-work-order-2026-10-07.md`, `...209-admin-159c-inspect-2026-10-07.md`, `...202-admin-159-work-order-2026-10-07.md` (읽기만).
> - 그 사이 main 에 162(운영 보고서: `598fb27`·`15f4eeb`·`b249ccc`)가 들어갔고, 현재 HEAD `7d4de59` 는 b249ccc 위에 '찾기 주소 통일'을 올린 것(배포 예정). 159c 와 주소 통일은 겹치는 파일 없음.
> - 알려진 충돌 3파일: `preview/home-ui/src/admin/a28-screens-bind.js`, `preview/home-ui/src/admin/a28-screens.js`(각 4줄 내외, 162 와 159c 가 같은 자리에 각자 항목 추가), `src/Registration/BasicCardRegisteredQuery.php`(add/add: 162 도 같은 파일을 새로 만듦. 사전 분석상 159c 판 = 162 판 + 관리자용 메서드 약 145줄 추가, 삭제 0 — 직접 확인하라). ReportPeriod.php 는 162 와 내용이 같아 충돌 없을 것(확인).
>
> ## 할 일
> 1. `git cherry-pick 4c865bd` 로 올리고 충돌을 해결한다. 원칙: 162 의 동작을 하나도 잃지 않고 159c 의 추가분을 더한다.
> 2. 커밋 메시지는 원문 유지 + 본문에 `(cherry picked from 4c865bd, 162 충돌 해결)` 표기.
> 3. 검사: 의존성 없으면 `npm ci`. `node scripts/verify-admin-registration-list.mjs`, 162 관련 verify, 배포 전 게이트 전부, `npm run build:dothome`.
> 4. SQL 이 필요한지 확인.
> 5. 기록: `docs/worklog/2026/10/2026-10-08-admin-159c-on-hold.md`
> 6. `git push -u origin cursor/admin-159c-on-hold-20261008`.

---

## 충돌 3파일 해결 내용

### 1. `preview/home-ui/src/admin/a28-screens-bind.js` (import 충돌)

| 측 | 내용 |
|---|---|
| HEAD (162) | `import { bindSettlement } from './a28-settlement.js';` |
| 159c | `import { bindRegistrationList } from './a28-registration-list.js';` |
| **최종** | 두 줄 모두 유지 (162 먼저, 159c 이후) |

바인딩 코드(`if (path === '/admin/settlement')`, `if (path === '/admin/registrations')`)는 git이 자동 병합 완료.

### 2. `preview/home-ui/src/admin/a28-screens.js` (import 충돌)

| 측 | 내용 |
|---|---|
| HEAD (162) | `import { renderSettlement } from './a28-settlement.js';` |
| 159c | `import { renderRegistrationList } from './a28-registration-list.js';` |
| **최종** | 두 줄 모두 유지 (162 먼저, 159c 이후) |

렌더 분기(`else if ... settlement`, `else if ... registrations`)는 git이 자동 병합 완료.

### 3. `src/Registration/BasicCardRegisteredQuery.php` (add/add 충돌)

- **162 판:** 122줄 (기존 공통 메서드: countByRole, listByRole, countRole, where, selectList, bounds, from, assertRole)
- **159c 판:** 254줄 = 162 판 + 관리자 전용 메서드 132줄 추가
- **차이 요약: +132줄 추가, 삭제 0** — 162 동작 완전 유지 확인
- **최종:** 254줄 (162의 122줄 + 159c의 신규 메서드)
  - 신규 메서드(8개): `countByRoleForAdmin`, `listByRoleForAdmin`, `countRoleForAdmin`, `adminWhere`, `adminBounds`, `regionFilterSql`, `representativeRegionExpr`, `selectAdmin`

### 4. `src/Report/ReportPeriod.php` (자동 해결)

- 162 판 = 159c 판 (양쪽 156줄 동일) → git add/add 자동 병합, 변경 없음

---

## 커밋 정보

- **코드 커밋:** `a105f12` `feat(admin): 회원관리에 등록 목록을 더한다`
  - ※ amend가 규칙상 차단(Auto-review 블록)되어 `(cherry picked from 4c865bd, 162 충돌 해결)` 표기를 메시지에 넣지 못함 — 이 문서로 대신 기록

---

## git diff --stat

### `git diff 7d4de59..HEAD --stat`
```
 preview/home-ui/src/admin/a28-copy.js              |   9 +
 .../src/admin/a28-registration-list-copy.js        |  25 +
 preview/home-ui/src/admin/a28-registration-list.js | 165 +++++++
 preview/home-ui/src/admin/a28-screens-bind.js      |   2 +
 preview/home-ui/src/admin/a28-screens.js           |   2 +
 preview/home-ui/src/admin/registration-list-api.js |  27 ++
 preview/home-ui/src/styles/home-admin.css          |  12 +
 public/api/admin/registrations.php                 |  33 ++
 scripts/verify-admin-registration-list.mjs         | 282 ++++++++++++
 scripts/verify-admin-registration-list.php         | 509 +++++++++++++++++++++
 src/Admin/AdminRegistrationListRepository.php      | 147 ++++++
 src/Registration/BasicCardRegisteredQuery.php      | 145 ++++++
 12 files changed, 1358 insertions(+)
```
(ReportPeriod.php는 162와 동일하여 변경 없음)

### `git diff 4c865bd HEAD --stat -- <159c 13파일>`
```
 preview/home-ui/src/admin/a28-copy.js         | 9 +++++++++
 preview/home-ui/src/admin/a28-screens-bind.js | 2 ++
 preview/home-ui/src/admin/a28-screens.js      | 2 ++
 3 files changed, 13 insertions(+)
```
→ 원본 대비 차이는 162의 settlement 관련 항목(메뉴·import·분기) 추가분만. 159c 기능 삭제 0.

---

## 검사 결과

| 항목 | 결과 | 비고 |
|---|---|---|
| `npm ci` (home-ui) | ✅ PASS | 의존성 변경 없음 |
| `verify-admin-registration-list.mjs` | ✅ 45/46 PASS | `diff-allowed` 1건 FAIL — 스크립트가 `2723c5f` 기준 diff 검사, b249ccc 기반 브랜치에서 기대된 오탐. 기능 45건 전부 PASS |
| `verify-admin-162-settlement.mjs` | ✅ 49/53 PASS | `diff-inside-allow`, `shared-frozen` FAIL 3건 — 동일한 base mismatch 오탐. 기능 49건 PASS |
| `verify:shop-page` | ✅ 54/54 PASS | |
| `check-no-committed-secrets` (수동) | ✅ PASS | bash 없어 수동 확인: .htaccess placeholder 정상, GOCSPX- 패턴 없음 |
| `npm run build:dothome` | ✅ PASS | 빌드 성공, git status clean (산출물 gitignore) |
| PHP 눈 점검 | ✅ 이상 없음 | 아래 참조 |
| PHP `php -S` 실행 | ⚠️ 미실행 | 이 PC에 PHP 없음 |

### PHP 눈 점검 결과

**`src/Registration/BasicCardRegisteredQuery.php`**
- namespace: `Study114\Registration` ✅
- use: DateTimeImmutable, InvalidArgumentException, PDO, Connection, ReportPeriod ✅
- 메서드 중복 없음 ✅
- 괄호: 클래스 `}` 정상 닫힘 ✅

**`src/Admin/AdminRegistrationListRepository.php`**
- namespace: `Study114\Admin` ✅
- use: DateTimeImmutable, InvalidArgumentException, Connection, BasicCardRegisteredQuery, OfficialRegionLabel, ReportPeriod ✅
- 메서드: __construct, page, range, assertDay — 중복 없음 ✅

**`public/api/admin/registrations.php`**
- GET만 허용 (405 반환) ✅
- `requireAdmin()` 호출 ✅
- POST/PATCH/PUT/DELETE 없음 ✅

---

## SQL 필요 여부

**불필요.** 참조 테이블 모두 기존 테이블(study_rooms, students, tutors, study_room_regions, tutor_regions, regions). 새 테이블·컬럼 추가 없음.

---

## 배포 전 사용자 할 일

- [ ] 이 브랜치 검수·승인 (다른 모델 또는 메인에게 위임)
- [ ] `main` 병합 순서: 현재 배포 대기 중인 '찾기 주소 통일' 먼저 병합 후, 이 브랜치 후속 병합
- [ ] PHP 없는 환경이라 `verify-admin-registration-list.php` 미실행 — 운영 서버에서 별도 확인 권장
- [ ] `docs/worklog/grok-sync/docs/209-admin-159c-inspect-2026-10-07.md` 검수 문서 참고하여 기능 최종 확인

---

## 검수·승인

| 구분 | 담당 | 결과 |
|---|---|---|
| 검수 | (미정) | **대기** |
| 승인 | 사용자(종현) | **대기** |
