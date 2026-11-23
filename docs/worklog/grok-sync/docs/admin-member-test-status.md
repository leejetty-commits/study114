# 관리자 회원 목록 — 상태 칩에 「테스트」추가, 「정상」은 테스트 제외 (2026-11-24)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 전제: PR #297(`work/admin-search-region-filter`)이 `origin/main`에 **먼저 병합된 뒤**, 그 `origin/main`에서 시작한다. #297이 아직 병합되지 않았으면 코드를 고치지 말고 「#297 미병합이라 시작 못 함」만 보고한다.
- 작업 브랜치: 최신 `origin/main`에서 `work/admin-member-test-status`. 워크트리는 `D:\work\study114\.wt\` 안에만 만든다.
- PR까지만 올린다. **병합 금지.**

## 종현 확정 (2026-11-24 「확정」)

관리자 회원 목록(`#/admin/members`) 상태 칩을 다섯 개로 바꾼다.

- **정상(테스트 제외)**: `users.status = 'active'` 이면서 테스트 목록에 없는 회원만.
- **대기**: 지금처럼 `users.status = 'pending'`. 테스트 계정이 대기이면 여기에도 나온다.
- **정지**: 지금처럼 `users.status = 'blocked'`. 테스트 계정이 정지면 여기에도 나온다.
- **탈퇴**: 지금처럼 `users.status = 'withdrawn'`. 탈퇴한 테스트 계정도 여기서 본다.
- **테스트**: `TestAccountAllowlist::userIds()`(env `STUDY114_TEST_ACCOUNT_EMAILS`)에 있는 회원만. `users.status`는 가리지 않는다. 다만 **탈퇴는 뺀다.** 이유는 아래 「상태 전체」와 같게 맞추기 위해서다.

**「상태 전체」(칩 글자는 지금처럼 「전체」, 선택지 글자는 「상태 전체」)**  
지금과 같이 `u.status <> 'withdrawn'`이고, **테스트 계정을 포함한다.** (기존 동작 유지. 확정 추천)

역할 필터 네 개(학생·공부방·과외쌤·운영자)는 값과 글자를 그대로 둔다. 상태와 역할은 AND다. 예: 「테스트」+「공부방 포함」은 테스트 목록이면서 공부방 역할이 있는 회원만.

테스트 목록이 비어 있으면 「테스트」는 0건이고, 「정상」은 지금 `active`와 같다.

스키마는 바꾸지 않는다. `user_roles.role_type` ENUM에 `test`를 넣지 않는다. 「테스트」는 역할이 아니라 검색용 상태 값(`status=test`)이다. `users.status` 칸 값 자체가 `test`가 되면 안 된다.

목록·상세의 상태 칸은 계속 DB 값을 보여 준다. 테스트이면서 정상이면 행에는 「정상」이 나오고, 칩·선택지에서만 「테스트」로 고른다.

## 진단 (우동공과3, 읽기만 함)

| 무엇 | 어디 |
|---|---|
| 회원 목록 상태 칩·상태 선택지 | `preview/home-ui/src/admin/a28-screens.js` `renderMembers()` 안. 칩은 1529~1533행 부근(`chip('all'…'withdrawn')`), 선택지는 1538~1543행 부근. 미리보기 건수는 `countMemberSeed()` 1577행 부근 |
| 행·상세 상태 글자 | `preview/home-ui/src/admin/a28-copy.js` `A28_MEMBER_STATUS_LABELS` (573행 부근). 키는 `active`·`pending`·`blocked`·`withdrawn`이고 글자는 정상·대기·정지·탈퇴. **행 글자 「정상」은 그대로 둔다.** 「정상(테스트 제외)」는 칩·선택지에만 쓴다 |
| 칩 클릭·검색 제출 | `preview/home-ui/src/admin/a28-screens-bind-members.js` 520~565행 부근. `status`를 그대로 넘긴다 |
| 필터 기본값 | `preview/home-ui/src/admin/a28-screens-state.js` `memberFilters.status = 'all'` |
| 목록 호출·칩 숫자 보관 | `preview/home-ui/src/admin/admin-backend.js` `hydrateMembersCache()`. `counts`에 `all`·`active`·`pending`·`blocked`·`withdrawn`만 넣고 있어, API가 `test`를 줘도 칩에 안 남는다 |
| 목록 API | `public/api/admin/members.php` GET `status`를 검사 없이 전달. 기본값 `all` |
| 목록 서비스 | `src/Admin/AdminMemberService.php` `list()`. 필터를 저장소에 그대로 넘긴다. phpdoc의 `counts` 키에 `test`가 없다 |
| 목록 SQL | `src/Admin/AdminMemberRepository.php` `buildListWhere()`. `status=all`(또는 빈 값)은 `u.status <> 'withdrawn'`, 그 외는 `u.status = ?`. 역할은 `user_roles.role_type` + `ur.status='active'` EXISTS. 목록·총건수·상태 칩이 이 함수를 같이 쓴다. `countByStatus()`는 상태 필터를 빼고 q·역할·지역만 반영한 뒤 상태별로 센다 |
| 테스트 목록 | `src/Auth/TestAccountAllowlist.php` `userIds(PDO)`. env `STUDY114_TEST_ACCOUNT_EMAILS`(정확 이메일, 소문자). **이 파일은 읽기만 한다.** 목록이 비면 `[]`이고 지금은 통계·공개 검색에서만 쓴다. 회원 목록은 아직 안 쓴다 |

정리하면, 테스트 계정은 지금 `status=active`이면 「정상」과 「전체」에 그대로 들어간다.

## 대상 (이 파일만 수정)

1. `src/Admin/AdminMemberRepository.php` — `buildListWhere()`와 `countByStatus()`(및 그 phpdoc)만 고친다.
2. `public/api/admin/members.php` — GET `status` 값 검사만 추가한다. 허용: `all`, `active`, `pending`, `blocked`, `withdrawn`, `test`. 그 외는 422.
3. `src/Admin/AdminMemberService.php` — `list()` phpdoc의 `counts` 키에 `test`를 추가한다. 목록·조치 로직은 고치지 않는다.
4. `preview/home-ui/src/admin/a28-screens.js` — `renderMembers()`의 상태 칩·상태 선택지, `countMemberSeed()`만 고친다.
5. `preview/home-ui/src/admin/a28-copy.js` — 칩·선택지용 글자 상수를 **새로** 넣어도 된다. 예: `A28_MEMBER_STATUS_FILTER_LABELS`. 기존 `A28_MEMBER_STATUS_LABELS`의 `active` 글자(「정상」)는 바꾸지 않는다.
6. `preview/home-ui/src/admin/admin-backend.js` — `hydrateMembersCache()`의 `counts`에 `test`를 보관한다. 다른 화면 캐시는 건드리지 않는다.
7. `scripts/verify-admin-member-test-status.php` — **새 파일**. 아래 「검증 스크립트」만 따른다.
8. 작업 기록 1개: `docs/worklog/2026/11/` 아래.

`a28-screens-bind-members.js`, `a28-screens-state.js`, `admin-api.js`는 `status`를 문자열로 그대로 넘기므로, 칩·선택지 값만 맞으면 고치지 않는다. 고칠 필요가 있으면 보고서 「발견 목록」에 이유를 적고, 정말 이 동작에 필요할 때만 최소로 고친다.

## 필수 작업

### A. 상태 규칙 (서버)

테스트 회원 id는 `TestAccountAllowlist::userIds($this->pdo)`만 쓴다. 이메일을 코드에 적지 않는다. id는 PDO 위치 바인딩(`?`)으로 넣는다. 목록을 SQL 문자열에 이어 붙이지 않는다.

1. `status`가 없거나 `all`이면 지금처럼 `u.status <> 'withdrawn'`만 붙인다. 테스트 계정을 빼지 않는다.
2. `status=active`(정상): `u.status = 'active'`이고, 테스트 id가 하나라도 있으면 `u.id NOT IN (…)`을 더한다. 목록이 비면 `NOT IN`을 붙이지 않는다.
3. `status=pending` / `blocked` / `withdrawn`: 지금처럼 `u.status = ?`만. 테스트 여부를 여기서 빼지 않는다.
4. `status=test`: 테스트 id 목록에 있는 회원만, 그리고 `u.status <> 'withdrawn'`. 목록이 비면 0건이 되게 한다(`0=1` 등). 대기·정지 테스트 계정은 여기 포함되고, 탈퇴 테스트 계정은 포함되지 않는다.
5. 역할(`role_type`)과 지역·서술 조건은 지금처럼 그 위에 AND로 붙는다. 「테스트」+「공부방 포함」이 되어야 한다.
6. 목록·총건수·상태 칩이 같은 규칙을 쓰도록 `buildListWhere()` 한곳에서만 고친다.

### B. 상태 칩 숫자 (`countByStatus()`)

지금처럼 현재 고른 상태 값은 무시하고, q·역할·지역만 반영한다.

- `all`: 지금처럼 탈퇴가 아닌 건수. 테스트 포함.
- `active`: `status=active`이면서 테스트가 아닌 건수.
- `pending` · `blocked` · `withdrawn`: 지금처럼 해당 `users.status` 건수. 테스트여도 그 상태면 센다.
- `test`: 테스트 목록이면서 탈퇴가 아닌 건수. 목록이 비면 0.

대기 중인 테스트 계정은 `pending`과 `test`에 둘 다 잡힐 수 있다. 칩 합이 「전체」와 같지 않을 수 있다. 이는 의도된 동작이다. 설명 문구를 화면에 새로 넣을 필요는 없다.

`AdminMemberService::list()` phpdoc의 `counts`에 `test` 키를 반영한다.

### C. API 검사

`members.php` GET의 `status`는 `all`·`active`·`pending`·`blocked`·`withdrawn`·`test`만 받는다. 다른 값이면 422. 메시지는 짧게, 허용 값을 알려 주면 된다. `role_type` 검사는 지금 없으면 이번에도 넣지 않는다.

상세(`id=`), 정지·복구·탈퇴 조치, 삭제, 비밀번호 재설정은 건드리지 않는다. 조치 API의 `status`(active/blocked/withdrawn)와 목록 필터 값 `test`를 섞지 않는다.

### D. 화면

1. 칩 다섯 개(「전체」다음): `정상(테스트 제외)`, `대기`, `정지`, `탈퇴`, `테스트`. 「전체」칩은 그대로 두고, 값은 `all`이다.
2. 상태 선택지도 같은 값·같은 글자. `active`의 글자는 `정상(테스트 제외)`, `test`의 글자는 `테스트`. 값 `test`를 추가한다.
3. 역할 선택지 네 개는 값·글자·순서 그대로.
4. `hydrateMembersCache()`의 `counts`에 `test: Number(data.counts?.test ?? 0)`를 넣는다. 없으면 테스트 칩이 항상 0으로 보인다.
5. 미리보기 모드(`isAdminApiMode()`가 false): 시드에 테스트 계정을 만들지 않는다. `countMemberSeed()`의 `test`는 0, `active`는 지금처럼 시드의 `active` 수. `status=test`로 고르면 빈 목록.
6. 목록 행·상세의 상태 글자는 `A28_MEMBER_STATUS_LABELS`를 그대로 쓴다. 테스트 회원의 행 상태를 「테스트」로 바꾸지 않는다.

### E. 검증 스크립트

`scripts/verify-admin-member-test-status.php`를 새로 만든다.

- **빈 임시 데이터베이스만** 쓴다. 이름에 시각·난수를 넣어 겹치지 않게 한다. 끝나면 그 임시 데이터베이스만 지운다.
- `study114_dev`, 운영 DB, 실데이터가 있는 로컬 DB에는 접속하지 않는다. `DROP TABLE` / `DROP DATABASE`는 방금 만든 임시 데이터베이스에만 허용한다.
- 기존 `scripts/verify-admin-registration-list.php`는 이 작업에서 **실행하지 않는다.** (그 스크립트는 `study114_dev` 표를 지운다.)
- 테스트 이메일은 과정 안에서만 `putenv` / `$_ENV`로 넣고, `example.com` 가짜 주소만 쓴다. 파일을 만들거나 커밋하거나 보고서에 실제 허용목록 이메일을 적지 않는다.
- 확인할 것:
  - 목록이 비면 「테스트」0건, 「정상」= `active` 전체(기존과 같음).
  - 목록에 정상 테스트 1명·일반 정상 1명을 넣으면 「정상」1, 「테스트」1, 「전체」는 둘 다 포함.
  - 대기 테스트는 「대기」와 「테스트」에 둘 다 잡히고 「정상」에는 안 잡힌다.
  - 탈퇴 테스트는 「테스트」·「전체」에 없고 「탈퇴」에만 있다.
  - 「테스트」+ 공부방 역할 AND.
  - `status=nope`는 422.
- `php -l`로 바꾼 PHP와 이 스크립트의 문법을 확인한다.

## 금지사항

- 위 「대상」에 없는 파일은 열어서 고치지 않는다. 범위 밖에서 버그를 발견하면 고치지 말고 보고서 「발견 목록」에만 적는다.
- **DB 스키마 변경 금지.** `sql/` 아래 새 파일, `ALTER`, 새 표나 열, 인덱스, `users.status` / `user_roles.role_type` ENUM 변경을 하지 않는다.
- **운영 DB에 SQL을 실행하지 않는다.** phpMyAdmin, 운영 접속, 운영 데이터 조회·수정 모두 금지다.
- 검증은 **빈 임시 데이터베이스에서만** 한다. `study114_dev`나 실데이터가 있는 DB에서 검증 스크립트를 실행하지 않는다. 그 DB에 `DROP`을 포함해 SQL을 실행하지 않는다.
- `.env`, `secrets`, `secrets.env`, `.wt` 설정, 키·비밀번호·토큰·세션값, **`STUDY114_TEST_ACCOUNT_EMAILS`의 실제 내용**을 읽어서 옮기거나 문서·커밋·로그·보고·화면 캡처에 쓰지 않는다. 허용목록 이메일 원문을 출력하지 않는다.
- `src/Auth/TestAccountAllowlist.php`, `src/Visibility/TestOwnerVisibility.php`, `src/Admin/AdminStatsRepository.php`는 수정하지 않는다. `userIds()` 호출만 한다. 통계·공개 검색·지메일 별칭·전화번호 제한 로직은 이번 범위가 아니다.
- 회원 상세, 일괄 조치, 삭제, 비밀번호 재설정, 노출 보정, 등록 목록, 지역 필터 로직은 건드리지 않는다. PR #297이 넣은 지역 조건이 깨지면 안 된다.
- 관련 없는 리팩터링, 이름 바꾸기, 포맷 정리, 다른 화면의 CSS·문구 변경은 하지 않는다.
- 테스트 이메일 주소를 코드·픽스처·커밋에 운영 값으로 적지 않는다. 검증용은 `example.com`만.
- force push, `reset --hard`, `stash drop`은 하지 않는다. 더러운 워크트리에서 rebase하지 않는다.
- 커밋, push, PR까지만 한다. **병합하지 않는다.** 배포하지 않는다.
- 글자 수, 유사도, 줄 수, 커버리지 퍼센트 같은 기계 수치는 합격 기준으로 쓰지 않는다.

## 셀프검수 (Cursor)

- 로컬에서 `php -l`과 `php scripts/verify-admin-member-test-status.php`를 돌린다. 빈 임시 DB만 쓴다. 실행할 수 없으면 「실행 못 함」과 그 이유를 적는다. 접속 값을 고쳐서 실데이터 DB에 돌리지 않는다.
- 화면은 로컬에서 확인한다. 실명·실제 전화번호·실제 테스트 이메일은 캡처와 보고에 나오지 않게 한다.

## 완료 보고

1. 바꾼 파일 목록. 새 파일은 「새 파일」로 표시한다.
2. 화면 캡처, 너비 1280px: 다섯 개 칩이 보이는 회원 목록 1장, 상태 선택지에 「테스트」·「정상(테스트 제외)」가 보이는 화면 1장. 실명·실제 연락처·실제 테스트 이메일은 가린다.
3. 로컬 시험(또는 검증 스크립트) 건수. 이름·이메일은 적지 않는다.
   - 상태 전체 / 정상(테스트 제외) / 테스트
   - 테스트 + 공부방 포함 AND
   - 목록이 비었을 때 정상 = 기존 active, 테스트 = 0
   - 대기 테스트는 대기·테스트에 보이고 정상에는 없음
   - 탈퇴 테스트는 탈퇴에만 있고 테스트·전체에는 없음
   - 잘못된 `status` → 422
4. 검증 스크립트 결과 요약(통과/실패 항목 이름). 허용목록 이메일은 적지 않는다.
5. 발견 목록: 범위 밖에서 보인 문제.
6. PR 링크. 병합하지 않은 상태로 보고한다.
