# 관리자 회원 목록·등록 목록 — 지역(광역시/도 → 시군구) 선택 검색 (2026-11-24)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 기준: `origin/main` (ab2bcfe, PR #296 머지 시점)
- 작업 브랜치: 최신 `origin/main`에서 `work/admin-search-region-filter`. 워크트리는 `D:\work\study114\.wt\` 안에만 만든다.
- PR까지만 올린다. **병합 금지.**

## 종현 확정 (2026-11-24 「확정」)

**회원 목록** (`#/admin/members`)
- 검색 줄을 두 줄로 나눈다.
  - 1줄: `광역시/도` → `시군구` → `상태` → `역할` 선택 칸. 시군구 칸에는 고른 광역시/도 아래 지역만 나온다.
  - 2줄: 서술형 칸 → `검색` → `새로고침`.
- 서술형 칸은 아래 네 가지만 찾는다: 공부방·과외쌤 이름, 회원 이름, 전화번호, 이메일.
  - 전화번호는 하이픈과 관계없이 찾는다. 양쪽 다 숫자만 남겨서 비교한다.
- 모든 조건은 AND로 묶는다. 비워 둔 칸은 「전체」로 본다.
- 지역 기준은 공부방 홍보지역1(사업장주소를 따르는 칸)이다. 과외쌤은 과외지역 1순위를 쓴다. 지역이 없는 회원(학생 등)은 지역을 골랐을 때만 빠진다.

**등록 목록** (`#/admin/registrations`)
- 숫자를 넣던 `홍보지역`(과외지역·희망지역) 칸을 회원 목록과 같은 `광역시/도` → `시군구` 선택으로 바꾼다.
- 공부방·과외쌤·학생 탭과 시작일·종료일은 그대로 둔다.
- 서술형 `이름` 칸을 하나 추가한다. AND 검색이다.

**공통**
- 시군구 목록은 사이트가 이미 쓰는 `regions` 표와 API에서 가져온다. 목록을 코드에 적지 않는다.
- DB 스키마는 바꾸지 않는다.

## 진단 (우동공과3, 읽기만 함)

| 무엇 | 어디 |
|---|---|
| 회원 목록 화면(검색 폼 `data-member-filter`) | `preview/home-ui/src/admin/a28-screens.js` `renderMembers()` 안 1534행 부근 |
| 회원 검색 제출·상태 칩·새로고침 | `preview/home-ui/src/admin/a28-screens-bind-members.js` 520~565행 부근 (`a28Ui.memberFilters`) |
| 회원 필터 상태 기본값 | `preview/home-ui/src/admin/a28-screens-state.js` `memberFilters` |
| 회원 목록 호출 | `preview/home-ui/src/admin/admin-backend.js` `hydrateMembersCache()` → `preview/home-ui/src/admin/admin-api.js` `fetchAdminMembers()` |
| 회원 API | `public/api/admin/members.php` GET (`q`, `status`, `role_type`, `limit`) |
| 회원 SQL | `src/Admin/AdminMemberService.php` `list()` → `src/Admin/AdminMemberRepository.php` `buildListWhere()`. 목록·총건수·상태 칩 세 곳이 이 함수를 같이 쓴다 |
| 등록 목록 화면 | `preview/home-ui/src/admin/a28-registration-list.js` (지역은 숫자 `input name="region"`) · 글자는 `a28-registration-list-copy.js` |
| 등록 목록 호출 | `preview/home-ui/src/admin/registration-list-api.js` `fetchRegistrationList()` |
| 등록 목록 API | `public/api/admin/registrations.php` GET (`role`, `from`, `to`, `region`=regions.id, `page`, `perPage`) |
| 등록 목록 SQL | `src/Admin/AdminRegistrationListRepository.php` `page()` → `src/Registration/BasicCardRegisteredQuery.php` `listByRoleForAdmin()` · `countRoleForAdmin()` · `adminWhere()` · `adminBounds()` · `regionFilterSql()` · `representativeRegionExpr()` |
| 지역 표 | `regions`: `sido_code`, `sido_name`, `sigungu_code`, `sigungu_name`, `dong_name`, `unit_level`(sido/sigungu/dong), `official_code`, `is_selectable`, `is_active` (`sql/schema/001`, `072`, `073`) |
| 지역 목록 API (이미 있음) | `GET /api/auth/regions.php?action=cities` → `SidoRegionEnsure::ensureAndListCities()`. 읽기만 하고 `is_active=1 AND is_selectable=1` 행을 준다. 항목: `id`, `label`, `sido_code`, `sido_name`, `official_code`, `city_name`, `gu_name`, `kind`. 공개 GET이고 하루 캐시다 |
| 홍보지역1 저장 | `study_room_regions` (`study_room_id`, `slot`=1, `region_id`→`regions.id`, 대부분 **동 행**) |
| 과외지역 1순위 저장 | `tutor_regions` (`tutor_id`, `priority_order`=0, `region_id`→**과외 단위 행**: 특별·광역시·세종은 시도 행, 도는 시·군 행, 옛 광주 5개 구는 「광주」 행 `sigungu_code='12200'`) — `src/Region/TutorRegionUnit.php` |

정리하면 지금 상태는 이렇다.
- 회원 `q`는 이메일·이름·휴대폰(하이픈 그대로 LIKE), 회원번호, 공부방·과외쌤 이름, **지역 이름 LIKE**까지 한 칸에서 찾는다.
- 등록 목록은 이미 `region`(시군구 `regions.id`)으로 거를 수 있다. 다만 화면에서 번호를 직접 넣어야 한다. 시도만 고르는 필터와 이름 필터는 없다.
- 스키마를 바꿀 필요는 없다. 모든 필터는 저장된 `region_id`를 `regions`에 조인해서 만든다.

## 대상 (이 파일만 수정)

1. `preview/home-ui/src/admin/admin-region-options.js` — **새 파일**. 지역 목록을 불러오고, 두 선택 칸을 그리고 연결하는 공통 모듈이다.
2. `preview/home-ui/src/admin/a28-screens.js` — `renderMembers()`의 `data-member-filter` 폼만 고친다.
3. `preview/home-ui/src/admin/a28-screens-bind-members.js` — 회원 검색 제출과 선택 칸 연결만 고친다.
4. `preview/home-ui/src/admin/a28-screens-state.js` — `memberFilters`에 `sido`, `region`을 추가한다.
5. `preview/home-ui/src/admin/admin-backend.js` — `hydrateMembersCache()`가 `sido`, `region`을 넘기고 보관하게 한다.
6. `preview/home-ui/src/admin/admin-api.js` — `fetchAdminMembers()`가 `sido`, `region`을 넘기게 한다.
7. `preview/home-ui/src/admin/a28-registration-list.js`
8. `preview/home-ui/src/admin/a28-registration-list-copy.js` — 칸 이름 글자만 고친다.
9. `preview/home-ui/src/admin/registration-list-api.js`
10. `public/api/admin/members.php`
11. `public/api/admin/registrations.php`
12. `src/Admin/AdminMemberRepository.php` — `buildListWhere()`와 그 phpdoc만 고친다.
13. `src/Admin/AdminRegistrationListRepository.php` — `page()`만 고친다.
14. `src/Registration/BasicCardRegisteredQuery.php` — `listByRoleForAdmin()`, `countRoleForAdmin()`, `adminWhere()`, `adminBounds()`, `regionFilterSql()`만 고친다.
15. `src/Admin/AdminRegionFilter.php` — **새 파일, 선택**. 두 저장소가 같은 지역 규칙을 쓰도록 SQL 조각을 만드는 도우미다. 만들지 않으면 두 곳에 같은 규칙을 똑같이 쓴다.
16. `preview/home-ui/src/styles/home-admin.css` — 두 줄 배치에 필요한 **새 클래스만** 추가한다. 예: `.admin-filter-bar__row`. 기존 규칙은 건드리지 않는다.
17. `scripts/verify-admin-registration-list.php` — 시험용 `CREATE TABLE regions`에 `sido_code`를 추가하고 새 경우를 추가한다. 기존 검사는 지우거나 느슨하게 하지 않는다.
18. 작업 기록 1개: `docs/worklog/2026/11/` 아래.

## 필수 작업

### A. 지역 규칙 (서버, 두 화면 공통)

R은 카드의 대표 지역 행이다. 공부방은 `study_room_regions.slot=1`, 과외쌤은 `tutor_regions.priority_order=0`, 학생은 지금의 `representativeRegionExpr('student')`를 쓴다. 고른 시도는 `sido`(2자리 `sido_code`), 고른 시군구는 `region`(`regions.id`, `action=cities`의 한 행)이다.

1. **`region`(시군구 G)을 골랐을 때** R이 G와 맞는 조건. 하나라도 맞으면 된다.
   - a. `R.id = G.id`
   - b. R이 동 행이고 `LEFT(R.sigungu_code,5) = LEFT(G.official_code,5)`. 지금 `regionFilterSql()`이 쓰는 규칙이다.
   - c. G가 시도 행(세종처럼 `unit_level='sido'`)이면 `R.sido_code = G.sido_code`
   - d. 과외 단위가 G를 품는 경우:
     - R이 시도 행(특별·광역시 과외 단위)이고 `R.sido_code = G.sido_code`
     - R이 시·군 행이고 `R.sido_code = G.sido_code AND G.sigungu_name LIKE CONCAT(R.sigungu_name, ' %')`. 예: 과외 「수원시」는 「수원시 영통구」를 품는다.
     - R이 「광주」 단위 행(`sigungu_code = TutorRegionUnit::GWANGJU_SIGUNGU_CODE`)이고 `LEFT(G.official_code,5)`가 `TutorRegionUnit::GWANGJU_GU_CODES` 안에 있다. 값은 상수에서 가져온다. 코드에 다시 적지 않는다.
2. **`sido`만 골랐을 때** R이 그 시도에 속하는 조건: `R.sido_code = :sido` **또는** 그 시도의 선택 단위 중 하나(`regions sel WHERE sel.sido_code = :sido AND sel.is_selectable = 1 AND sel.is_active = 1`)가 1번 규칙으로 R과 맞는다.
3. `region`과 `sido`를 같이 받으면 `region`으로 거른다. 그런데 G의 `sido_code`가 `sido`와 다르면 422를 낸다. 메시지: 「시군구가 고른 광역시/도에 속하지 않습니다.」
4. 입력 검사:
   - `sido`는 `/^[0-9]{2}$/`이어야 한다.
   - `region`은 지금처럼 양의 정수여야 한다.
   - `region`이 `is_selectable=1`인 행이 아니면 결과 0건이 아니라 422를 낸다.
   - 값이 없거나 빈 문자열이면 「전체」로 본다.
5. 모든 값은 PDO 바인딩으로 넣는다. `AdminMemberRepository`는 `?` 위치 바인딩을, `BasicCardRegisteredQuery`는 `:이름` 바인딩을 쓴다. 한 SQL 안에서 두 방식을 섞지 않는다.

### B. 회원 목록 서버

6. `members.php` GET에 `sido`, `region`을 추가한다. 1~4번 규칙대로 검사한다.
7. `AdminMemberRepository::buildListWhere()`
   - 지역을 골랐으면 아래 둘 중 하나가 1~2번 규칙에 맞는 회원만 남긴다. 지역을 안 고르면 이 조건은 붙지 않는다.
     - 이 회원의 삭제 안 된 공부방(`sr.deleted_at IS NULL`)의 `slot=1` 지역
     - 이 회원의 과외쌤 카드의 `priority_order=0` 지역
   - `q`는 아래 네 가지만 찾는다(OR).
     - `p.real_name LIKE`
     - `u.email LIKE`
     - 삭제 안 된 공부방 `study_room_name LIKE`
     - `tutor_display_name LIKE`
     - 전화번호: `q`에서 숫자만 뽑아 **3자리 이상**일 때만 `REPLACE(REPLACE(REPLACE(COALESCE(p.phone,''),'-',''),' ',''),'.','') LIKE %숫자%`로 찾는다.
   - **지역 이름 LIKE와 회원번호(`CAST(u.id AS CHAR) = ?`) 조건은 `q`에서 뺀다.** 회원번호로 바로 여는 `#/admin/members?user=번호` 경로는 그대로 둔다.
   - 목록·총건수·상태 칩이 모두 같은 조건을 쓰도록 `buildListWhere()` 한 곳에서만 고친다.

### C. 등록 목록 서버

8. `registrations.php` GET에 `sido`, `q`(이름)를 추가한다. `region`은 지금 뜻(시군구 `regions.id`) 그대로 둔다.
9. `AdminRegistrationListRepository::page()`에는 새 인자를 **맨 뒤에 기본값 null로** 붙인다. 지금 부르는 쪽(`page($role,$from,$to,$regionId,$page,$perPage)`)이 그대로 돌아야 한다.
10. `BasicCardRegisteredQuery`
    - `adminWhere()`와 `adminBounds()`에 시도와 이름 조건을 추가한다.
    - `regionFilterSql()`은 1번 규칙으로 넓힌다.
    - 이름 조건: 공부방은 `sr.study_room_name`, 과외쌤은 `t.tutor_display_name`, 학생은 `COALESCE(s.public_display_name,'')`에 `LIKE`를 건다.
    - `where()`, `bounds()`, `from()`, `selectList()`, `countByRole()`, `listByRole()`, `countRole()`, `assertRole()`은 **한 글자도 바꾸지 않는다**. 검증 스크립트가 이 함수들이 그대로인지 바이트 단위로 비교한다.

### D. 공통 지역 선택 (화면)

11. `admin-region-options.js`
    - `GET /api/auth/regions.php?action=cities`를 **한 번만** 불러서 모듈 안에 보관한다. 실패하면 빈 목록을 쓰고 「전체」만 보인다. 오류 알림은 한 번만 띄운다.
    - 시도 목록은 `sido_code` 기준으로 중복을 뺀다. 이름은 `sido_name`이고 순서는 `official_code` 오름차순이다.
    - 시군구 목록은 고른 `sido_code`의 행만 보여 준다. 값은 `id`, 글자는 `label`이다.
    - 시도가 시도 행 하나뿐이면(세종) 시군구 칸을 비활성화하고 「전체」로 둔다.
    - 시도를 바꾸면 시군구는 「전체」로 돌아간다.
    - 첫 선택지 글자는 「광역시/도 전체」, 「시군구 전체」다.
    - 내보내는 함수 예: `loadRegionOptions()`, `renderRegionSelects({ sido, region, namePrefix })`, `bindRegionSelects(root)`. 이름은 바꿔도 된다.
    - 미리보기 모드(`isAdminApiMode()`가 false)에서는 부르지 않는다. 이때는 「전체」만 보여 준다.

### E. 회원 목록 화면

12. `data-member-filter` 폼을 두 줄로 바꾼다.
    - 1줄: 광역시/도, 시군구, 상태, 역할. 상태와 역할 선택지의 값과 글자는 지금 그대로 둔다.
    - 2줄: 서술형 칸, 검색, 새로고침.
    - 서술형 placeholder: 「공부방·과외쌤 이름 · 회원 이름 · 휴대폰 · 이메일」
13. 제출하면 `a28Ui.memberFilters = { q, status, role_type, sido, region }`로 저장한다.
    - 상태 칩, 새로고침, `?q=` 해시로 들어오는 경로는 이 값을 그대로 이어 쓴다. 기존 `...a28Ui.memberFilters` 패턴을 유지한다.
    - `hydrateMembersCache()`와 `fetchAdminMembers()`는 값이 있을 때만 `sido`, `region`을 보낸다.
14. 다시 그린 뒤에도 고른 시도와 시군구가 그대로 남아 있어야 한다.

### F. 등록 목록 화면

15. 숫자 `input name="region"`을 시도·시군구 선택으로 바꾼다.
    - 칸 이름은 지금처럼 탭별 단어(홍보지역·과외지역·희망지역)를 앞에 두고 「광역시/도」, 「시군구」로 붙인다.
    - 서술형 `이름` 칸(`name="q"`)을 추가한다.
    - 시작일·종료일·조회 버튼과 공부방·과외쌤·학생 탭은 그대로 둔다.
16. `readRegistrationQuery()`, `registrationHash()`, `fetchRegistrationList()`에 `sido`, `q`를 추가한다.
    - 탭을 바꿔도 지역과 이름 조건은 남는다(`...query`).
    - 페이지 이동도 같은 조건을 유지한다.
17. 목록 표의 열과 「이 조건에 해당하는 등록이 없습니다.」 문구는 바꾸지 않는다.

### G. 검증 스크립트

18. `scripts/verify-admin-registration-list.php`
    - 시험 `regions` 표에 `sido_code`를 추가하고, `regionId()` 도우미가 값을 넣게 한다.
    - 아래 경우를 추가한다.
      - 시도만(서울) 골라도 강남 동 공부방이 나온다.
      - 부산을 고르면 0건이다.
      - 과외 「서울특별시」 시도 단위 카드는 서울 강남구를 골랐을 때 나온다.
      - 이름 `q` AND 지역 조합.
      - 시도와 맞지 않는 시군구는 422다.
    - 로컬 시험 DB(`study114_dev`)에서만 돌린다.

## 금지사항

- 위 「대상」에 없는 파일은 열어서 고치지 않는다. 범위 밖에서 버그를 발견하면 고치지 말고 보고서 「발견 목록」에만 적는다.
- **DB 스키마 변경 금지.** `sql/` 아래 새 파일, `ALTER`, 새 표나 열, 인덱스 추가를 하지 않는다.
- **운영 DB에 SQL을 실행하지 않는다.** phpMyAdmin, 운영 접속, 운영 데이터 조회·수정 모두 금지다. 검증은 로컬 시험 DB에서만 한다.
- `.env`, `secrets`, `secrets.env`, `.wt` 설정, 키·비밀번호·토큰·세션값은 읽어서 옮기거나 문서·커밋·로그·보고에 쓰지 않는다.
- `public/api/auth/regions.php`, `src/Region/*`, `src/Auth/BasicRegisterService.php`는 수정하지 않는다. 읽기 호출만 한다.
- 회원 상세, 일괄 조치, 삭제, 비밀번호 재설정, 노출 보정 등 회원 화면의 다른 기능은 건드리지 않는다.
- 관련 없는 리팩터링, 이름 바꾸기, 포맷 정리, 다른 화면의 CSS·문구 변경은 하지 않는다.
- 지역 목록이나 시군구 이름을 코드에 직접 적지 않는다. 광주 5개 구 코드는 `TutorRegionUnit` 상수를 참조한다.
- force push, `reset --hard`, `stash drop`은 하지 않는다. 더러운 워크트리에서 rebase하지 않는다.
- 커밋, push, PR까지만 한다. **병합하지 않는다.** 배포하지 않는다.
- 글자 수, 유사도, 줄 수, 커버리지 퍼센트 같은 기계 수치는 합격 기준으로 쓰지 않는다.

## 셀프검수 (Cursor)

- 로컬에서 `php -l`로 바꾼 PHP 파일을 확인하고 `php scripts/verify-admin-registration-list.php`를 돌린다. 로컬 시험 DB만 쓴다. 실행할 수 없으면 「실행 못 함」과 그 이유를 적는다.
- 화면은 로컬에서 테스트 계정으로 확인한다. 실명·실제 전화번호는 캡처에 나오지 않게 한다.

## 완료 보고

1. 바꾼 파일 목록. 새 파일은 「새 파일」로 표시한다.
2. 화면 캡처, 너비 1280px:
   - 회원 목록: 두 줄 검색 줄이 보이는 첫 화면 1장, 시도를 고른 뒤 시군구 칸이 열린 화면 1장.
   - 등록 목록: 공부방 탭에서 시도·시군구·이름 칸이 보이는 화면 1장, 과외쌤 탭 1장.
3. AND 검색 예시와 그 결과 건수(로컬 시험 데이터):
   - 서울특별시 + 강남구 + 상태 정상 + 공부방 포함
   - 서울특별시만 + 역할 전체
   - 서술형 `01012345678`과 `010-1234-5678`이 같은 회원을 찾는다
   - 서술형 이메일 일부(예: `+room1`) AND 시도
   - 학생 포함 + 지역 선택 → 0건(지역 없는 회원 제외 확인)
   - 등록 목록: 과외쌤 탭 + 시도 + 이름
   - 시도와 맞지 않는 시군구 → 422 메시지
4. `verify-admin-registration-list.php` 결과 요약(통과/실패 항목 이름).
5. 발견 목록: 범위 밖에서 보인 문제.
6. PR 링크. 병합하지 않은 상태로 보고한다.
