# 2026-10-09 과외쌤 검색 응답에 카드 칸 싣기 (searchTutors · mapTutor)

- 브랜치: `cursor/tutor-search-fields-20261009` (기준 `origin/main` `3f03aaa`, 찜 확대카드·확대카드 전 항목 반영 상태)
- worktree: `d:\work\study114\.wt\tutor-search-fields`
- 작업자: Cursor 하위 에이전트 (작업한 세션은 자기 작업을 검수·승인하지 않는다)
- 위험도: 높음 (공개 검색 응답에 칸 추가 · 손님 노출 범위). 다른 모델 독립 리뷰 예정.
- 검수: **대기** (독립 리뷰 예정)
- 승인: **대기**

## 1. 지시서 원문

````text
과외쌤 검색 응답(`searchTutors`)과 홈 `mapTutor`에 카드 항목(사진·성별·대상·주회·분·수업장소·원생수·특징·슬로건)을 실어 보내고 소개 대체값을 고친다. 사용자 승인 2026-10-09 「ㅇㅋ 모두 승인한다」
````

근거 정본: `docs/internal/73-tutor-basic-card-lock.md` 0-3절 5번, 7-6절, 8-2절 8번(「검색 응답 한 건에 카드 항목 키가 모두 있다. 홈 `mapTutor()` 와 검색 화면 변환 함수가 그 키를 버리지 않는다」).

## 2. 한 일

### 2-1. 서버 `src/Search/SearchService.php` `searchTutors()`

공부방 `searchRooms()` 방식(같은 SELECT 에 카드 칸 · 목록형 칸은 결과 id 로 한 번 더 조회해 붙임 · 등급별 사진)을 따랐다. WHERE·COUNT·FROM/JOIN·ORDER BY·LIMIT·바인딩은 글자 하나 바꾸지 않았다(검사로 고정).

| 응답 키 | 출처 | 값이 없을 때 |
|---|---|---|
| `image_path_basic` | `tutor_images` 1번 사진(`sort_order`, `id` 순 — `TutorHubRepository::profileImages` 와 같은 순서). 증빙 보조(`proof_aux`) 제외, `/uploads/` 공개 경로만 | `''` |
| `image_path_prime` | 위 경로의 `_basic_720` → `_prime_1280` (마이페이지 `TutorHubRepository`·`TutorProfileImageService` 와 같은 변환) | `''` |
| `image_path` | 프라임 등급이면 프라임 경로, 그 밖에는 기본 경로 (공부방과 같은 규칙) | `''` |
| `gender` | `user_profiles.gender` (정본 13 §4 13행 「`user_profiles.gender` 조인」). 스칼라 하위조회로 **gender 한 칸만** 읽는다. `male`/`female` 이 아니면 null | `null` |
| `grade_band` | 대표 과목 행(`tutor_subject_targets.is_primary = 1`)의 `school_level` → 기존 `SCHOOL_LEVEL_LABELS`(초등·중등·고등 …). 정본 73 2절 3행 | `''` |
| `slogan`, `intro_short`, `feature_1~3`, `main_material_note` | `tutors` 같은 이름 칸 | `''` |
| `student_gender_group`, `student_count_group` | `tutors` 같은 이름 칸 (원생수) | `null` |
| `lesson_places` | `tutor_lesson_places.place_type` 목록 (코드값, 화면이 라벨로 바꿈) | `[]` |
| `teaching_style_badges` | `tutor_teaching_style_badges.badge_name` 목록 (`display_order` 순) | `[]` |
| `lessons_per_week`, `minutes_per_lesson` | 이미 응답에 있었음 (그대로) | `null` |

- 추가 함수 2개는 클래스 끝(`loadRoomGalleryMap` 뒤)에 두었다: `tutorCoverImageExpr()`, `loadTutorCodeMap()`. `searchRooms`·`searchTutors` 사이(정본 72 잠금 검사가 글자 비교하는 구간)는 건드리지 않았다.
- 성별·대상은 `LEFT JOIN` 대신 스칼라 하위조회로 넣어 행 수·`DISTINCT`·`COUNT` 가 바뀌지 않게 했다.
- 찜 카드(`publicCardsByIds`)는 같은 `searchTutors` 를 쓰므로 같은 칸이 함께 나온다.

### 2-2. 화면 매퍼

- `preview/home-ui/src/home-basic-live.js`: `tutorSearchCardFields(item)` 를 새로 내보내고 `mapTutor()` 가 이것으로 카드 칸 18개(위 표 + `main_subject_note`)를 그대로 넘긴다. **summary 줄 대체를 없앴다** — 소개가 없으면 `''`(전에는 「경력 y4_6」 줄이 소개로 들어갔다). 과목도 summary 첫 줄(과목이 비면 학교명이 들어감)로 채우지 않는다.
- `preview/search-ui/src/search-exposure-mapper.js` 과외쌤 분기: `...apiItem` 그대로 펼치고, 소개·과목 summary 대체 제거, 목록형 칸·사진 정리.
- `preview/home-ui/src/exposure-bridge.js` `mapTutorItem()`(로그인 노출 풀): 같은 `tutorSearchCardFields` 사용. 과외비를 서버가 보내지 않는 `price_amount` 에서만 읽던 것을 `preferred_fee_amount` 우선으로 맞췄다(전에는 늘 null).

### 2-3. 기존 잠금 검사

- `scripts/verify-tutor-region-unit.mjs` 는 `searchRooms` 본문만 기준 커밋 `6b37357` 과 비교한다(`searchTutors` 는 비교하지 않음). 그 비교 구간 안에 `searchTutors` 의 문서 주석이 들어가므로 주석을 바꾸지 않았다. 잠금은 그대로 통과(135/0) — 고치지 않았다.

### 2-4. 새 검사 `scripts/verify-tutor-search-fields.mjs` (+ `.php`), `npm run verify:tutor-search-fields`

- (1) PHP 가짜 PDO: 응답 카드 칸 값·빈값, 숨김·탈퇴·과외지역1 없음 미노출, 비공개 키·값 없음, 조회 SQL 에 비공개 칸 없음(`user_profiles` 는 `gender` 만), 사진 조건(증빙 보조 제외 · `/uploads/`), 찜 카드 키 = 검색 카드 키.
- (2) 정적: `searchTutors` WHERE·COUNT·정렬식, FROM~LIMIT, 바인딩부 = `3f03aaa` 글자 그대로. `searchRooms`·`guestScopedFilters`·`search.php`·`tutor-detail.js` = `3f03aaa`. 홈·찾기·브리지 매퍼에 summary 대체 없음.
- (3) 화면(vite-node): (1)의 실제 응답을 홈 `mapTutor`·찾기 `mapToExposureItem`·브리지 `mapTutorItem` 에 넣어 18칸 그대로, 프라임·픽·베이직(가로·표) 카드와 확대카드에 값이 그려짐, 손님 확대카드 「로그인 후 확인」 4칸.

## 3. 손님 노출 판단 근거

- 정본 확인: `docs/ssot/13-search-page-fields.md`(§4·§8 — 손님 칸 규칙 없음, 학생 요청문만 권한별), `docs/ssot/24-detail-decision-layer.md`(§4 「Guest → 공급자: 조건 요약 · 로그인 유도」, §16 「제한 Basic · CTA 로그인」 — 화면·CTA 규칙이며 서버가 뺄 칸 목록은 없음), `docs/internal/73-tutor-basic-card-lock.md`(손님 언급 없음, 0-3 5번은 카드 칸을 **모두** 보내라고 함).
- 기존 서버 동작: `public/api/search/search.php` 는 손님이면 `guestScopedFilters()` 로 **지역만** 기준 행으로 덮고, 칸을 빼는 것은 학생 탭 요청문(`StudentRequestTextAccess`)뿐이다. `search()` 는 보는 사람을 모른다. 과외쌤 학교·학과·학적상태·주회·분은 지금도 손님 응답에 들어 있고, 확대카드 화면만 「로그인 후 확인」으로 가린다(`tutor-detail.js`).
- 판단: 정본에 서버 제거 규칙이 없으므로 **기존 서버 동작을 따랐다(손님에게 서버가 빼는 칸 없음)**. `search.php`·`guestScopedFilters` 는 바꾸지 않았고 검사로 고정했다. 확대카드의 손님 가림(일정·강의스타일·학적상태·학교·학과)도 그대로다.
- **손님에게 새로 열리는 칸(보고):** 사진 경로, 성별, 대상, 슬로건, 소개(`intro_short`), 특징 1~3, 주교재, 원생수 2칸, 수업장소, 강의스타일 배지.
  - 이 중 강의스타일은 확대카드가 손님에게 「로그인 후 확인」으로 가리는 칸이지만, 픽·프라임 카드(`tutorTableRows`)는 지금도 손님에게 강의스타일 칸을 그린다. 서버에서 빼야 한다면 별도 결정이 필요하다.
- 끝까지 넣지 않은 것: 실명, 연락처, 이메일, 주소, 생년월일, 연락 가능 시간, 상세 소개(`intro_long`), 가격 설명, 연령대, SNS 링크, 증빙 파일 경로, 주인 user_id.

## 4. DB 에 없어 빠진 칸

- **제출자료 수(`verification_doc_count`)**: `tutor_verification_documents` 에 「공개 선택」 칸이 없다(`008_tutors.sql` 112~124줄: `review_status` 만). 정본 24 §11 은 「공개 선택 ON 만」 세라고 하므로, 전체나 승인 건수를 「N개 공개」로 보내면 틀린 값이 된다. 보내지 않았다. 카드는 기존대로 `proof_document_available`(이미 응답에 있음)로 1개를 센다. SQL 은 만들지 않았다.
- 그 밖의 칸은 모두 `008_tutors.sql`(·`002` `user_profiles.gender`) 에 있다.

## 5. 검증 숫자

| 검사 | 결과 |
|---|---|
| `npm run verify:tutor-search-fields` (새) | 64 PASS / 0 FAIL (php 35 · 정적 11 · 화면 18) |
| `verify-tutor-region-unit.mjs` | 135 passed, 0 failed |
| `verify:detail-card-all-fields` | 142 passed, 0 failed |
| `verify:wishlist-card-zoom` | 41 PASS / 0 FAIL (php 15 · screen 26) |
| `verify-position-region-tier.mjs` | client 7 PASS / 0 FAIL · 19 PASS / 0 FAIL |
| `verify:shop-page` (배포 게이트) | pass 54 · fail 0 |
| `check-no-committed-secrets.sh` (배포 게이트) | OK |
| `verify:tutor-inquiries-settings` · `verify:study-room-inquiries-samples` (배포 게이트) | OK · OK |
| `verify:board-acl` (배포 게이트) | JS↔PHP ACL matrix match (75 rows) |
| `verify:no-sample-data` | OK (415 파일) |
| `php-syntax-check.sh` | files=312 ok |
| 같은 응답 쓰는 검사: `verify-guest-baseline-map-cards` · `verify-tutor-home-student-tab` · `verify-card-visual-penetration` | 78/78 · 63/0 · 1차_완료_가능 |
| 임시 폴더 빌드 (home-ui · search-ui → `%TEMP%\tsf-build`) | 성공. `public/` 무변경 |

- `verify-basic-exposure-gate.mjs` 는 10 passed / 1 failed(PHP 프로세스 `TutorRegionUnit` 예외). **기준 `3f03aaa` 에서도 같은 실패**(정본 72 지역 단위 변경 뒤 옛 검사 입력). 이번 변경과 무관, 배포 게이트 아님.

변조 검사(각각 넣고 돌린 뒤 되돌림, 되돌린 뒤 64/0 확인):

| 변조 | 결과 |
|---|---|
| 서버 `slogan` 칸 삭제 | 9 FAIL |
| 홈 `mapTutor` 소개 summary 대체 복원 | 6 FAIL |
| 숨김 제외 WHERE 변경 | 4 FAIL (숨김 노출 · WHERE 글자 비교) |
| SELECT 에 `up.phone` 추가 | 1 FAIL |
| 사진 증빙보조 제외 삭제 | 1 FAIL |
| 찾기 매퍼 소개 summary 대체 복원 | 2 FAIL |
| `lesson_places` 붙이기 삭제 | 10 FAIL |
| ORDER BY 변경 | 1 FAIL |
| 브리지 `...card` 제거 | 3 FAIL |

## 6. 남은 위험

- 손님에게 새로 열리는 칸(3절). 특히 강의스타일·소개는 확대카드 손님 화면과 픽·프라임 카드 손님 화면의 처리 기준이 다르다. 서버 제거가 필요하면 정본 결정 후 별도 과제.
- 대상(`grade_band`)은 가입 때 `'middle'` 로 자동 저장된 행(정본 73 2-1)이 그대로 「중등」으로 보인다. 데이터 정리는 정본 73 열린 질문 13번.
- 사진은 `/uploads/` 로 시작하는 경로만 쓴다. `/register/tutor` 옛 흐름이 파일 이름만(`profile.jpg`) 저장한 행은 사진 없이 이름 첫 글자로 보인다(의도). 프라임 파생본 파일이 실제로 있는지는 확인하지 않는다(마이페이지와 같은 변환).
- 성별을 고른 적 없는 과외쌤이 `'male'` 로 저장될 수 있는 기존 버그(정본 73 6-1)는 이번 범위 밖이다. 그 값이 그대로 카드에 나온다.
- 운영 DB 에 `008` 칸이 모두 있는지는 확인하지 않았다(정본 73 13절과 같음). 칸이 없으면 검색이 500 이 난다 — 공부방처럼 칸 존재 검사를 넣지 않은 것은 모두 `008`·`002` 기본 칸이기 때문이다.
- 결과 한 페이지(최대 50건)마다 하위조회 3개와 목록 조회 2번이 늘어난다.

## 7. 배포 전 사용자 할 일

- SQL·환경변수·Secrets·`.htaccess` 변경 없음.

## 8. 바뀐 파일

- `src/Search/SearchService.php`
- `preview/home-ui/src/home-basic-live.js`
- `preview/home-ui/src/exposure-bridge.js`
- `preview/search-ui/src/search-exposure-mapper.js`
- `scripts/verify-tutor-search-fields.mjs` (새)
- `scripts/verify-tutor-search-fields.php` (새)
- `package.json` (`verify:tutor-search-fields`)
- `docs/worklog/2026/10/2026-10-09-tutor-search-fields.md` (이 파일)
