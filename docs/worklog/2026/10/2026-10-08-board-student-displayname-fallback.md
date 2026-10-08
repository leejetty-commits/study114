# 작업 기록: 학생 고민방 표시 이름 fallback (board-student-displayname-fallback)

- 작업 일자: 2026-10-08
- 작업 브랜치: `cursor/board-student-displayname-fallback-20261008` (기반 origin/main: `ec50fcd`)
- 작업 디렉토리: `d:\work\study114\.wt\student-displayname`
- 상태: 검수·승인 대기

---

## 1. 지시서 및 사용자 결정 원문

### 사용자 결정 (원문)
> 「역할 이름을 학생으로 해.」 — 별명(`public_display_name`)이 비어 있으면 고민방 글쓴이를 「학생」으로 표시.

### 지시서 요약
1. `src/Board/AuthorDisplayNameResolver.php` `fromStudent()`: `public_display_name`이 NULL·공백이거나 students 행이 없으면 `'학생'`을 돌려준다. 값이 있으면 기존처럼 trim한 값. 문구 하드코딩은 클래스 상수(`private const STUDENT_FALLBACK_NAME = '학생';`)로.
   - 단, students 행이 없는 경우까지 '학생'으로 허용하는 것이 보안·정책상 문제인지(예: ACL이 따로 있어 글쓰기 권한은 여기서 결정되지 않는지) `ConcernService`·`BoardChannelAcl`을 읽고 보고서에 적어라. 권한을 넓히는 결과가 된다면 행이 없을 때는 기존처럼 ''를 유지하고 그 이유를 보고.
2. 프론트에서 `display_name_required`를 별도로 처리하거나 글쓰기 전에 별명 입력을 강제하는 코드가 있는지 `rg -n "display_name_required|public_display_name|publicDisplayName" preview/home-ui/src`로 확인하고 보고만 하라.
3. 기존 검증 스크립트 참고하여 새 스크립트 `scripts/verify-board-student-displayname-fallback.php` 작성: (a) 별명 있음→그 값, (b) NULL→'학생', (c) 공백→'학생', (d) 행 없음→결정한 값, (e) student_name이 있어도 절대 반환되지 않음, (f) 공부방·튜터 기존 동작 불변 확인.
4. 실행: 검증 스크립트(sqlite 모드), `php -l`, `verify-board-acl`, `verify-concern-feed-demand-exclusion.php`, `verify:shop-page`.
5. 작업 기록 작성 및 파일 이름 지정 커밋·push.

---

## 2. 배경 및 원인 분석

1. **현상**:
   - 학생/학부모(navRole `parent`, role_type `guardian_student` / `parent` / `student`)가 고민방(`concern-parent`, `concern-solved`)에 글이나 댓글을 작성할 때 422 `display_name_required` 에러로 저장이 거부되는 현상 발생.
2. **원인**:
   - `src/Board/ConcernService.php` (77~80행, 325~328행)는 글·댓글 저장 시 `AuthorDisplayNameResolver::resolve($auth)` 결과가 빈 문자열이면 422 `display_name_required`를 발생시킴.
   - `AuthorDisplayNameResolver::fromStudent()`는 `students.public_display_name` 단일 컬럼을 읽음.
   - 학생/학부모 가입 시 `public_display_name`은 선택 입력(`src/Auth/BasicRegisterService.php` 242행 `optionalBoundedString`)이므로 입력하지 않으면 DB에 NULL로 남음.
   - 직전 작업(`7510691`)에서 공부방 원장은 `study_room_name`으로 fallback 처리되었으나, 학생/학부모는 fallback이 없어 422 에러가 지속됨.
   - 또한, 실명(`students.student_name`, `users.name`)은 개인정보 보호 원칙상 고민방 작성자명으로 노출할 수 없음.

---

## 3. students 행 없음 처리 판단 근거 (결론: `''` 유지)

지시서의 분석 과제:
> "단, students 행이 없는 경우까지 '학생'으로 허용하는 것이 보안·정책상 문제인지(예: ACL이 따로 있어 글쓰기 권한은 여기서 결정되지 않는지) ConcernService·BoardChannelAcl을 읽고 보고서에 적어라. 권한을 넓히는 결과가 된다면 행이 없을 때는 기존처럼 ''를 유지하고 그 이유를 보고."

### 1) ACL 계층 분석 (`BoardChannelAcl.php`)
- `BoardChannelAcl::boardRoleFromAuth($auth)`는 DB 조회 없이 `$auth['role_type']`만으로 역할을 판정함 (`guardian_student`, `parent`, `student` → `demand`).
- `BoardChannelAcl::canCompose('concern-parent', 'demand')`는 `true`이며, 심지어 `concern-parent`는 `['demand', 'member']` 모두에게 열려 있음.
- 즉, 접근 제어(Authorization) 계층 관점에서는 학생 계정의 글쓰기 자격이 이미 부여되어 있으며, DB의 `students` 테이블 존재 유무를 검사하지 않음.

### 2) 서비스 및 유효성 계층 분석 (`ConcernService.php` & `AuthorDisplayNameResolver.php`)
- `ConcernService`는 `BoardChannelAcl`을 통과한 뒤, `$displayName = $this->nameResolver->resolve($auth)`를 호출하고, `$displayName === ''`이면 422 `display_name_required`를 던짐.
- 현재 시스템에서 이 422는 단순 표시명 누락 검증을 넘어, **"해당 역할의 유효한 프로필(DB 엔티티)이 생성되어 있는지를 검증하는 실질적인 2차 게이트"**로 작동하고 있음:
  - 공부방(`fromStudyRoom`): `study_rooms`에 행이 없으면(`!is_array($row)`) `''` 반환 → 422 차단 (커밋 `7510691`에서도 유지됨).
  - 튜터(`fromTutor`): `tutors`에 행이 없으면 `''` 반환 → 422 차단.
  - 일반 회원(`role_type=member`): `navRole`이 `guest`가 되어 `''` 반환 → 422 차단.

### 3) 권한 확장 여부 판정
- `SignupService.php`를 확인한 결과, 회원가입 시 `users`, `profiles`, `roles`만 생성되고 `students` 행은 생성되지 않음. `students` 행은 이후 기본정보 등록(`BasicRegisterService`)을 진행해야 생성됨.
- 만약 `students` 행이 없는 경우까지 `'학생'`을 반환하도록 허용한다면:
  - 기본정보 등록을 마치지 않은 미완성/가계정이나 삭제된 계정도 `role_type`만 있으면 고민방 글/댓글을 즉시 작성할 수 있게 됨.
  - 공급자(공부방, 튜터)는 프로필 미등록 시 글 작성이 차단되는데 반해, 학생만 미등록 상태에서 글 작성이 열리게 됨.
  - 이는 기존에 차단되던 미등록 계정에게 새로이 작성 권한을 열어주는 **"권한(기능 허용 범위)을 넓히는 결과"**에 해당함.

### 4) 최종 결론
- **`students` 행이 없을 때는 기존처럼 `''`를 반환하여 422 차단을 유지한다.**
- **`students` 행이 존재하는 경우에 한하여 `public_display_name`이 NULL이거나 공백이면 `self::STUDENT_FALLBACK_NAME` ('학생')을 반환한다.**
- 이렇게 함으로써:
  1. 가입 시 선택 입력인 별명을 입력하지 않아 고민방 이용이 막히던 실제 문제(사용자 불편 사항)가 100% 안전하게 해결됨.
  2. 공급자(공부방, 튜터)와의 정책적·구조적 일관성(`행 없음 → ''`)이 완벽하게 유지됨.
  3. 미등록 가계정의 무분별한 게시물 작성 방지 및 최소 권한 원칙(Principle of Least Privilege) 준수.

---

## 4. 프론트엔드 조사 결과 (`rg -n "display_name_required|public_display_name|publicDisplayName" preview/home-ui/src`)

- **검색 결과**:
  - `preview/home-ui/src` 내에 `display_name_required` 에러 코드를 별도로 분기 처리하거나 가로채는 코드는 **전무함** (0건).
  - 고민방 글쓰기 폼(`preview/home-ui/src/concern/screens.js`)은 제목(`title`), 본문(`description`), 글 종류(`type`)만 입력받으며, 작성자 이름/별명을 묻거나 입력받는 필드가 전혀 없음.
  - 학생 등록 관련 화면(`preview/home-ui/src/student-reg/`)에서만 `public_display_name` 입력 필드가 존재함.
- **영향 및 프론트 수정 필요 여부**:
  - 프론트엔드는 서버 응답의 `authorDisplayName`을 그대로 렌더링하도록 구현되어 있음.
  - 서버에서 `fromStudent()`가 `'학생'`을 정상 반환하므로 422 에러가 발생하지 않으며, 프론트엔드 수정 없이 즉시 완벽하게 동작함.
  - **프론트 수정 불필요 (0건 수정)**.

---

## 5. 변경 내용

### 1) `src/Board/AuthorDisplayNameResolver.php`
- 클래스 상수 추가:
  ```php
  private const STUDENT_FALLBACK_NAME = '학생';
  ```
- `fromStudent()` 메서드 개선:
  ```php
  private function fromStudent(int $userId): string
  {
      $stmt = $this->pdo->prepare(
          'SELECT public_display_name FROM students WHERE guardian_user_id = ? ORDER BY id ASC LIMIT 1'
      );
      $stmt->execute([$userId]);
      $row = $stmt->fetch(PDO::FETCH_ASSOC);
      if (!is_array($row)) {
          return '';
      }

      $publicName = isset($row['public_display_name']) && is_string($row['public_display_name'])
          ? trim($row['public_display_name'])
          : '';
      if ($publicName !== '') {
          return $publicName;
      }

      return self::STUDENT_FALLBACK_NAME;
  }
  ```
- `student_name`(실명)은 쿼리 자체에 포함하지 않아 실명 노출을 원천 방지함.

### 2) `scripts/verify-board-student-displayname-fallback.php` (신규 작성)
- SQLite in-memory PDO 및 Mock PDO 환경을 모두 지원하는 독립 검증 스크립트 작성.
- 검증 케이스:
  - (a) `public_display_name` 값 있음 → 그 값 반환 (`'맑은하늘'`)
  - (b) `public_display_name` NULL → `'학생'` 반환
  - (c) `public_display_name` 공백 문자열 → `'학생'` 반환
  - (d) 행 없음 (미등록 사용자) → `''` 반환 (결정한 값: 권한 확장 방지)
  - (e) `student_name` 실명이 존재해도 절대 반환되지 않음 (`'홍길동'` 노출 방지, `'학생'` 반환)
  - (f-1) 공부방 기존 동작 불변 (`operator_display_name` 우선, 없으면 `study_room_name`, 둘 다 없거나 행 없으면 `''`)
  - (f-2) 튜터 기존 동작 불변 (`tutor_display_name` 우선, 없거나 행 없으면 `''`)
  - (g) `role_type` alias 3종(`guardian_student`, `parent`, `student`) 모두 정상 동작
  - (h) 복수 행 존재 시 `ORDER BY id ASC LIMIT 1` (첫 번째 등록 행 기준)
  - (trim) 별명 앞뒤 공백 trim 처리 확인
  - (i) `user_id <= 0`이거나 미인증 시 `''` 반환

---

## 6. 검증 명령별 결과

| 검증 항목 / 명령어 | 결과 | 비고 |
|---|---|---|
| `D:\php8.2\php.exe -l src/Board/AuthorDisplayNameResolver.php` | **PASS (No syntax errors)** | PHP 구문 오류 없음 |
| `D:\php8.2\php.exe -l scripts/verify-board-student-displayname-fallback.php` | **PASS (No syntax errors)** | PHP 구문 오류 없음 |
| `D:\php8.2\php.exe -d extension=pdo_sqlite scripts/verify-board-student-displayname-fallback.php` | **PASS (11/11 PASS, 0 FAIL)** | SQLite in-memory 모드 실 쿼리 검증 |
| `D:\php8.2\php.exe scripts/verify-board-student-displayname-fallback.php` | **PASS (11/11 PASS, 0 FAIL)** | Mock PDO 모드 검증 |
| `D:\php8.2\php.exe -d extension=pdo_sqlite scripts/verify-board-studyroom-displayname-fallback.php` | **PASS (12/12 PASS, 0 FAIL)** | 공부방 회귀 검증 |
| `D:\php8.2\php.exe scripts/verify-board-channel-acl.php` | **PASS (36/36 PASS, 0 FAIL)** | PHP 게시판 ACL 검증 |
| `node scripts/compare-board-acl-matrix.mjs` | **PASS (75 rows match)** | JS ↔ PHP ACL 매트릭스 일치 검증 |
| `D:\php8.2\php.exe scripts/verify-concern-feed-demand-exclusion.php` | **PASS (37/37 PASS, 0 FAIL)** | 학생 피드 배제 회귀 검증 |
| `cmd /c "cd /d D:\work\study114\.wt\student-displayname\preview\home-ui && npx --yes vite-node --config D:\work\study114\preview\home-ui\vite.config.js D:\work\study114\.wt\student-displayname\scripts\verify-shop-page.mjs"` | **PASS (54/54 PASS, 0 FAIL)** | ShopPage 레드라인 4 규칙 및 회귀 검증 |
| `npm run verify:shop-page` (루트 디렉터리 실행) | **PASS (54/54 PASS, 0 FAIL)** | 루트 ShopPage 검증 |

---

## 7. 커밋 및 배포 영향

- **SQL / DB 스키마**: 변경 없음 (0건)
- **.env / .htaccess / Secrets**: 변경 없음 (0건)
- **프론트엔드 코드**: 변경 없음 (0건)
- **배포 전 사용자 할 일**: 없음 (순수 PHP 코드 반영)

---

## 메인 검수 (2026-10-08 17:42, 커밋 `5e9650c`)

- 판정: **통과** (작업 세션과 다른 메인 세션 검수)
- diff 확인: `fromStudent()`만 변경. 별명 있으면 그 값, NULL·공백이면 `'학생'`(클래스 상수), `students` 행 없으면 ''(기본정보 미등록 계정에 글쓰기 허용 범위를 넓히지 않음 — 공부방·과외쌤과 같은 기준). 실명 칼럼은 조회하지 않음.
- 메인 재실행 (`D:\php8.2\php.exe`): `php -l` 통과, 학생 대체 검증 0 failed, 공부방 대체 회귀 0 failed, `verify-board-channel-acl.php` ok.
- SQL·환경변수 변경 없음. 배포: 사용자 승인 대기.
