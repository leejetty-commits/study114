# 작업 기록: 공부방 원장 고민방 표시 이름 fallback (board-studyroom-displayname-fallback)

- 작업 일자: 2026-10-08
- 작업 브랜치: `cursor/board-studyroom-displayname-fallback-20261008` (기반 origin/main: `4fcb5ea`)
- 작업 디렉토리: `d:\work\study114\.wt\b1-displayname`
- 상태: 검수·승인 대기

---

## 1. 지시서 원문

```markdown
한국어로 작업·보고하라. 너는 study114 저장소의 작업자다. 검수·승인은 메인 에이전트와 사용자가 한다.

## 작업 폴더 (여기서만 수정)
- worktree: `d:\work\study114\.wt\b1-displayname`
- 브랜치: `cursor/board-studyroom-displayname-fallback-20261008` (origin/main `4fcb5ea` 기준, 이미 생성됨)
- 다른 폴더는 절대 수정하지 마라. node_modules는 상위 `d:\work\study114\node_modules`에서 해석된다.

## 금지
- `main` push·병합 금지. `git add -A` 금지(파일 이름으로 stage). push된 커밋 amend 금지.
- 운영 사이트 로그인·쓰기 금지. SQL·.env·.htaccess·Secrets 변경 금지. DB 스키마 변경 금지.

## 장애 (확정됨)
공부방 원장(role study_room_owner)이 「공부방 고민방」에 글을 쓰면 서버가 422 `display_name_required`로 막는다.
- `src/Board/ConcernService.php` 77~80행 근처: 글쓴이 표시 이름이 비면 422.
- `src/Board/AuthorDisplayNameResolver.php` `fromStudyRoom()` (62~71행): `SELECT operator_display_name FROM study_rooms WHERE user_id = ? ORDER BY id ASC LIMIT 1`.
- 운영 DB 확인 결과: 테스트 공부방(id 7)의 `operator_display_name`은 NULL.
- 근본 원인: `operator_display_name`을 저장하는 곳은 옛 화면 `preview/study-room-ui`뿐이고, 현재 공부방 등록 화면(`preview/home-ui`)은 이 값을 보내지 않는다. 신규 등록은 `StudyRoomRegisterService.php` 378행 `INSERT INTO study_rooms (user_id, study_room_name, ...)`로 `study_room_name`만 들어간다. 따라서 사실상 모든 공부방 원장이 글을 못 쓸 가능성이 높다.

## 사용자가 고른 해결책
「이름이 비어 있으면 공부방 이름으로 대신 표시」 — 코드 수정만, SQL 없음.

## 할 일
1. `fromStudyRoom()`을 고쳐, `operator_display_name`이 NULL·공백이면 같은 행의 `study_room_name`(trim)을 돌려주게 한다. 둘 다 비면 기존처럼 ''. 쿼리 하나로(예: 두 컬럼 SELECT 후 PHP에서 선택) 처리. 컬럼명은 `sql/schema/rest-schema.sql`·`005_study_room_ssot_align.sql`에서 실제 이름을 확인하라.
2. 이 resolver를 쓰는 다른 곳(`rg -n "AuthorDisplayNameResolver|resolve\(" src`)에서 동작이 어떻게 바뀌는지 확인하고 보고하라(예: 다른 게시판 글쓴이명에도 영향). 튜터(`fromTutor`)·학생(`fromStudent`)에 같은 빈값 문제가 있는지도 조사만 하고(해당 컬럼을 현재 등록 화면이 저장하는지 rg로 확인) 고치지는 말고 보고하라.
3. 검증 스크립트 추가: `scripts/verify-board-studyroom-displayname-fallback.php` — SQLite 메모리 DB(PDO sqlite) 등으로 study_rooms 테이블을 만들어 (a) operator_display_name 값 있음→그 값, (b) NULL→study_room_name, (c) 공백 문자열→study_room_name, (d) 둘 다 빈값→'' 를 확인. 기존 PHP verify 스크립트(`scripts/verify-*.php`) 작성 방식을 따라라. PHP 실행 파일 위치는 `Get-Command php`나 기존 스크립트/문서에서 찾아라. PHP가 없으면 그 사실을 보고하고 코드 읽기 기반으로 검증.
4. 기존 게시판 관련 검증(예: `npm run` 중 board/acl 관련, `scripts/verify-board-*.php`)과 `npm run verify:shop-page` 실행. 무관 실패는 origin/main에서도 실패하는지로 구분.
5. 작업 기록 `docs/worklog/2026/10/2026-10-08-board-studyroom-displayname-fallback.md` — 장애 내용, 원인(위), 사용자 선택, 변경, 영향 범위, 검증 결과, 튜터·학생 조사 결과, 남은 문제.
6. 파일 이름으로 stage → 커밋 → `git push -u origin cursor/board-studyroom-displayname-fallback-20261008`.

## 최종 보고
커밋 hash, push 여부, 변경 파일, diff 요약, 영향 범위, 검증 명령별 결과, 튜터·학생 빈값 조사 결과, 남은 문제.
```

---

## 2. 장애 내용 및 원인

- **장애 현상**:
  - 공부방 원장(역할 `study_room_owner`, alias `study_room`)이 「공부방 고민방」(`concern-director`) 등에 글을 쓰거나 댓글을 작성할 때 HTTP 422 `display_name_required` 에러가 발생하며 저장이 거부됨.
- **원인 분석**:
  1. `src/Board/ConcernService.php` (77~80행, 325~328행)에서 글 및 댓글 작성 시 `$this->nameResolver->resolve($auth)`를 호출하여 표시 이름을 가져오며, 빈 문자열이면 422 `display_name_required` 예외를 발생시킴.
  2. `src/Board/AuthorDisplayNameResolver.php`의 `fromStudyRoom()`은 `SELECT operator_display_name FROM study_rooms WHERE user_id = ? ORDER BY id ASC LIMIT 1`로 `operator_display_name` 단일 컬럼만 조회함.
  3. 현재 운영 사이트의 공부방 등록 화면(`preview/home-ui`) 및 등록 서비스(`src/StudyRoom/StudyRoomRegisterService.php` 378행)는 `study_room_name`만 INSERT하고 `operator_display_name`을 입력받거나 저장하지 않음 (`operator_display_name` 저장은 구 레거시 화면 `preview/study-room-ui`에서만 존재).
  4. 따라서 최근 등록된 공부방 원장은 `operator_display_name`이 NULL인 상태이며, 고민방에 글이나 댓글을 일절 작성할 수 없었음.

---

## 3. 사용자 선택 해결책

- **해결책**: 「`operator_display_name`이 비어 있으면 공부방 이름(`study_room_name`)으로 대신 표시」
- **방침**: DB 스키마나 DDL/DML 변경 없이 순수 PHP 코드 수정 및 단일 쿼리로 해결.

---

## 4. 변경 내용

### 1) `src/Board/AuthorDisplayNameResolver.php`
- `sql/schema/005_study_room_ssot_align.sql` 및 `sql/schema/rest-schema.sql` 스키마 확인 결과:
  - 공부방명 컬럼: `study_room_name` (VARCHAR(100))
  - 운영자 표시명 컬럼: `operator_display_name` (VARCHAR(50))
- `fromStudyRoom()`을 수정하여 단일 쿼리로 두 컬럼을 조회:
  ```php
  private function fromStudyRoom(int $userId): string
  {
      $stmt = $this->pdo->prepare(
          'SELECT operator_display_name, study_room_name FROM study_rooms WHERE user_id = ? ORDER BY id ASC LIMIT 1'
      );
      $stmt->execute([$userId]);
      $row = $stmt->fetch(PDO::FETCH_ASSOC);
      if (!is_array($row)) {
          return '';
      }

      $operator = isset($row['operator_display_name']) && is_string($row['operator_display_name'])
          ? trim($row['operator_display_name'])
          : '';
      if ($operator !== '') {
          return $operator;
      }

      $studyRoomName = isset($row['study_room_name']) && is_string($row['study_room_name'])
          ? trim($row['study_room_name'])
          : '';

      return $studyRoomName;
  }
  ```
- `operator_display_name`이 존재하고 공백이 아니면 기존과 동일하게 운영자 표시명을 반환.
- `operator_display_name`이 NULL이거나 공백이면 `study_room_name`(trim 적용)을 fallback으로 반환.
- 둘 다 비어있거나 행이 없으면 기존과 동일하게 `''` 반환.

### 2) `scripts/verify-board-studyroom-displayname-fallback.php` (신규 작성)
- SQLite 인메모리 PDO 및 Mock PDO fallback을 지원하는 회귀 검증 스크립트 작성.
- 검증 케이스:
  - (a) `operator_display_name` 값 있음 → 운영자 표시명 반환
  - (b) `operator_display_name` NULL → `study_room_name` fallback 반환
  - (c) `operator_display_name` 공백 문자열 → `study_room_name` fallback 반환
  - (d) 둘 다 NULL/공백인 경우 → `''` 반환 (d1~d4 세부 케이스)
  - (e) 행 없음 (미등록 사용자) → `''` 반환
  - (f) `study_room_name` 앞뒤 공백 trim 처리 확인
  - (g) 동일 user_id 복수 행 존재 시 `ORDER BY id ASC LIMIT 1` 확인
  - (h) `role_type`이 `study_room_owner`와 `study_room` 둘 다 정상 동작
  - (i) `user_id <= 0`이거나 미인증 시 `''` 반환

---

## 5. 영향 범위 분석

1. **`AuthorDisplayNameResolver` 호출처 조사 (`rg -n "AuthorDisplayNameResolver|resolve\(" src`)**:
   - `AuthorDisplayNameResolver`는 `src/Board/ConcernService.php`에서만 생성 및 사용됨.
   - `ConcernService::savePost()` (글쓰기/수정) 및 `ConcernService::addComment()` (댓글 등록).
   - 다른 게시판 클래스(`BoardPostService`, `InfoBoardService`)는 `AuthorDisplayNameResolver`를 사용하지 않음:
     - `BoardPostService`: `author_role`만 검증하며 작성자 표시 이름 자체를 다루지 않음.
     - `InfoBoardService`: 자체 `authorLabel()` 헬퍼를 통해 학생은 `students.student_name` 마스킹, 제공자는 역할 라벨(선생님/원장님)을 사용함.
2. **동작 변화 영향**:
   - 고민방 게시판(`concern-director`, `concern-solved` 등)에서 공부방 원장이 글을 쓰거나 댓글을 달 때, 기존에는 422 `display_name_required` 에러가 발생하던 것이 정상적으로 통과됨.
   - 저장되는 글 메타(`meta_json.authorDisplayName`) 및 댓글 행(`concern_comments.author_display_name`)에 원장의 공부방 이름이 글쓴이명으로 등록됨.
   - 기존에 이미 `operator_display_name`이 채워져 있던 계정은 그 이름이 우선 유지되므로 하위 호환성 100% 보장.

---

## 6. 튜터(`fromTutor`)·학생(`fromStudent`) 빈값 조사 결과

1. **과외선생님 (`fromTutor`)**:
   - 컬럼: `tutors.tutor_display_name`
   - 현재 가입/등록 흐름 확인:
     - `src/Auth/BasicRegisterService.php` 762행: `$displayName = $this->requireString($input, 'tutor_display_name');`
     - `src/Tutor/TutorRegisterService.php` 393행: `$name = $this->requireString($input, 'tutor_display_name');`
     - 프론트엔드(`preview/auth-ui/src/screens/signup-basic.js` 289행, `preview/home-ui/src/tutor-reg/screens.js` 374행): 필수 입력(`required`)으로 지정되어 있음.
   - **결론**: 과외선생님은 등록 시 `tutor_display_name` 저장이 강제되므로 일반적인 경우 빈값으로 인한 422 차단 문제가 발생하지 않음.
2. **학생/보호자 (`fromStudent`)**:
   - 컬럼: `students.public_display_name`
   - 현재 가입/등록 흐름 확인:
     - `src/Auth/BasicRegisterService.php` 242행: `$publicName = $this->optionalBoundedString($input, 'public_display_name', 40);` (선택 사항)
     - `src/Views/auth/partials/basic-student.php` 24행: `required` 속성 없음.
   - **결론**: 학생/보호자의 경우 `public_display_name`이 필수가 아니므로 DB에 NULL 또는 빈값으로 남아 있을 가능성이 존재함. 만약 `public_display_name`이 없는 계정이 고민방(`concern-parent`, `concern-solved`)에 글이나 댓글 작성을 시도하면 동일하게 422 `display_name_required` 에러를 겪을 수 있음.
   - 다만 학생의 경우 원칙적으로 실명(`student_name`) 노출이 금지되어 있어(`users.name(실명)은 절대 사용하지 않는다`), 단순히 `student_name`으로 대체할 수 없고 별도의 익명 표기 규칙(예: `익명학생`, 닉네임 유도 등)에 대한 기획 결정이 필요함.

---

## 7. 검증 결과

| 검증 항목 / 명령어 | 결과 | 비고 |
|---|---|---|
| `php -d extension=pdo_sqlite scripts/verify-board-studyroom-displayname-fallback.php` | **PASS (12/12 PASS, 0 FAIL)** | SQLite in-memory DB 실 쿼리 검증 |
| `php scripts/verify-board-studyroom-displayname-fallback.php` | **PASS (12/12 PASS, 0 FAIL)** | Mock PDO fallback 모드 검증 |
| `npm run verify:shop-page` | **PASS (54/54 PASS, 0 FAIL)** | ShopPage 레드라인 4 규칙 및 회귀 검증 |
| `npm run verify:board-acl` | **PASS (JS 75 / PHP 36, 0 FAIL)** | 게시판 채널 ACL 및 매트릭스 일치 검증 |
| `npm run verify:board-acl:js` | **PASS (65 PASS, 0 FAIL)** | JS ACL 회귀 검증 |
| `npm run verify:board-acl:php` | **PASS (36 PASS, 0 FAIL)** | PHP ACL 회귀 검증 |
| `php scripts/verify-student-tips-board.php` | **PASS (230 PASS, 0 FAIL)** | 꿀팁 게시판 기능 및 ACL 회귀 검증 |
| `php scripts/verify-concern-feed-demand-exclusion.php` | **PASS (37 PASS, 0 FAIL)** | 고민방 피드 학생 배제 회귀 검증 |
| `php scripts/verify-info-boards-acl.php` | **PASS (69 PASS, 0 FAIL)** | 정보 게시판 접근 권한 회귀 검증 |

---

## 8. 남은 문제 및 후속 제안

1. **학생 계정 `public_display_name` 빈값 대응**:
   - 학생/보호자 계정이 `public_display_name` 없이 등록된 경우 고민방 참여 시 422 에러가 발생할 수 있으므로, 기본 익명 닉네임 자동 부여(예: `익명`, `회원#123` 등) 또는 가입/마이페이지 시 닉네임 입력 유도에 대한 정책 결정 필요.
2. **공부방 원장 개인 닉네임 관리 UI**:
   - 현재 등록 화면은 `study_room_name`만 입력받으므로 모든 신규 원장은 공부방명으로 글이 작성됨. 원장이 공부방명이 아닌 개인 호칭(예: "행복원장님")으로 활동하길 원하는 경우, 마이페이지/등록정보 수정 화면에서 `operator_display_name`을 입력·수정할 수 있는 폼 필드 추가 검토 필요.
