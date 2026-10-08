# 2026-10-09 과외쌤 기본정보 필수 = 베이직카드 항목 (tutor-basic-required)

- 브랜치: `cursor/tutor-basic-required-20261009` (worktree `.wt/tutor-basic-required`)
- 기준: `origin/main` merge-base `90cc0f0`
- 정본: `docs/internal/73-tutor-basic-card-lock.md` (문서 브랜치 `cursor/tutor-basic-card-20261008` 에서 가져옴, 2절 표만 구현 기준으로 고침)
- 작업: 하위 에이전트(작업자). 검수·승인 전. 이 세션은 자기 작업을 승인하지 않는다.

## 1. 지시서

원문 전문은 메인 에이전트의 지시 메시지다. 작업 중 대화 기록 파일에 다시 접근할 수 없어 전문을 붙이지 못했다. 아래는 지시 요약과, 원문 그대로 인용한 구절이다.

요약:

1. 베이직카드 9항목(성별 제외)을 세 기본정보 화면(가입 `renderTutorBasic()`, 마이페이지 `renderBasicForm()`, tutor-ui `step-basic.js`)에 필수로 넣는다. 상세 화면의 기존 UI를 그대로 옮기고 상세에서는 뺀다. 슬로건·대상 칸은 최소로.
   - 9항목: 표시명, 과외지역 1(2·3 선택), 대상(학교급), 과목, 수업장소, 특징 1(2·3은 상세), 슬로건, 월 과외비, 사진 1장. 여기에 주 ○회·○분, 원생수(지도 대상 성별 + 수업인원).
   - 기존 컬럼만 쓴다.
2. 동반 필드는 필요할 때만 옮기고 보고한다.
3. 미리 채운 값(`'middle'`, `'mixed'`, `'solo'`) 금지. 필수 표시 = 실제 검사.
4. 서버 검사: 가입 기본등록 경로와 마이페이지 basic 저장 경로. C4(한 칸 고치면 지역 3개를 다시 골라야 함) 고침. `TutorRegionUnit` 은 바꾸지 않음.
5. 가입 사진은 같은 화면에서 기존 업로드 API로. 막히면 멈추고 보고.
6. 등록점검 `buildBoard()` 와 공개 판정은 같은 목록 하나로 센다. 픽·프라임 조건은 바꾸지 않고, 픽이 특징 1·원생수를 쓴다는 사실만 보고.
7. 견본·시드 금지. 학생·공부방 화면 안 건드림.
8. 검증: `scripts/verify-tutor-basic-required.mjs` + `verify:tutor-basic-required`(전/후 `--ref`), 기존 게이트 실행, 지시와 충돌하는 기존 단언은 지시에 맞게 고치고 목록화.

원문 인용:

- 「작업 브랜치에서만, main push·병합 금지, `git add -A` 금지, push된 커밋 amend 금지. 묻기 전에 정본·기존 코드부터 확인. 이미 있는 것을 새 구조로 덧씌우지 말 것.」
- 「운영 계정·비밀 파일은 쓰지 않는다. 운영 사이트에 쓰기 하지 않는다.」
- 「견본/가짜 데이터·시드 추가 금지. 학생·공부방 화면과 흐름은 건드리지 않는다.」
- 「픽·프라임 조건은 이번에 바꾸지 말 것」, 「새 컬럼 만들지 말 것」, 「새 정책 문장 추가 금지」

사용자 결정 원문 (지시서에 인용된 것):

- 10/8 「베이직카드에 들어가는 항목은 기본등록단계에서 받아야 해. 필수로. 선택은 과외지역 2번 3번만 선택이야. 기본등록 후에 상세등록에서 또 항목을 채워야 카드노출이 된다면 이중으로 동선이 생겨」
- 10/9 02:42 「성별은 계정단계에서 받으니, 제외하고, 저거 9개가 필수로 들어가게 된다면…」
- 10/9 02:44 「저 9개를 과외샘 기본등록정보에 필수로 넣어. 상세정보에서 빼오면 되지. 레이아웃도 그대로 유지하고... 그러면 기본정보에서는 지역2,3만 선택이 돼.」
- 10/9 00:05 정상 가입으로 만들 수 없는 옛 데이터는 무시한다. 마이그레이션·자동 보정 없음(해당 계정은 삭제).

## 2. 옮긴 항목

필수 목록 한 벌: `preview/shared/tutor-basic-fields.js` `TUTOR_BASIC_FIELDS` ↔ `src/Tutor/TutorBasicFields.php` `LABELS` (13키, 같은 순서·라벨. 검사 스크립트가 일치 확인).

| 항목 (키) | 이전 위치 | 지금 위치 (세 화면 모두 필수) |
|---|---|---|
| 표시명 (`display_name`) | 세 기본정보 화면 | 그대로 |
| 과외지역 1 (`primary_region`) | 세 기본정보 화면 | 그대로. 2·3은 선택 |
| 대상(학교급) (`school_level`) | 가입·마이페이지 없음(가입은 `'middle'` 고정), tutor-ui 과목 행 | 세 기본정보 화면 select. 대표 과목 행 `school_level` 에 저장 |
| 주력과목 (`main_subject`) | 세 기본정보 화면 + 상세 과목 행의 「주력」 체크 | 기본정보만. 상세 과목 행은 추가 과목(선택) |
| 월 과외비 (`fee`) | 마이페이지 상세, tutor-ui 수업·상세 단계 | 기본정보 |
| 주 회수 (`lessons_per_week`) | 같음 | 기본정보 |
| 1회 수업시간 (`minutes`) | 같음 | 기본정보 |
| 수업장소 (`lesson_places`) | 같음 | 기본정보 |
| 지도 대상 성별·수업인원 (`student_gender_group`, `student_count_group`) | 같음 (마이페이지는 `'mixed'`·`'solo'` 미리 선택) | 기본정보. 빈 선택에서 시작 |
| 특징 1 (`feature_1`) | 마이페이지 상세, tutor-ui 연락·상세 단계 | 기본정보. 특징 2·3은 상세 |
| 슬로건 (`slogan`) | 입력칸 없음 | 기본정보 |
| 프로필 사진 (`profile_image`) | 마이페이지 상세 사진 편집기, tutor-ui 는 「곧 연결」 안내 | 기본정보 (아래 4절) |

레이아웃: 세 화면 모두 기존 2단(왼쪽 입력칸, 오른쪽 과외지역)을 유지하고 왼쪽 열에 칸을 더했다. 사진은 표 아래 한 줄.

## 3. 동반 필드

- 옮기지 않음: 산정방식(`fee_basis_type`), 월 총 횟수, 가격 설명, 과외쌤 연령대. 상세정보에 남는다. 산정방식은 상세정보 필수 그대로(기본값 `'monthly_by_weekly_schedule'` 은 없앰).
- 과외쌤 성별 라디오(tutor-ui 기본 단계)는 범위 밖이라 그대로 둠.

## 4. 사진

막히지 않았다. 기존 `/api/tutor/profile-image.php`(upload)를 그대로 쓴다.

- 공용: `preview/shared/tutor-profile-photo.js` — 기존 `profile-photos.js` 의 규격·검사·가공 함수를 옮기고 `uploadTutorProfilePhotoApi`, `prepareTutorProfilePhoto`(가운데 자르기) 추가. `profile-photos.js` 는 이 모듈을 다시 내보낸다.
- 가입·tutor-ui: 화면에서 사진을 골라 두고(대기), 과외쌤 행이 이미 있으면 먼저 올린 뒤 저장, 행이 없으면 저장으로 행을 만든 뒤 바로 올린다. 올리기에 실패하면 화면에 남아 다시 저장을 누르게 한다(그때는 행이 있으므로 먼저 올림).
- 마이페이지: 기존 사진 편집기(최대 3장)를 기본정보 탭으로 통째로 옮겼다. 2·3번째 사진을 상세로 나누지는 않았다(모호점 2).
- 마지막 1장 삭제는 화면(버튼 비활성)과 서버(`TutorProfileImageService::delete`) 모두에서 막는다. 지우면 기본정보 미완료로 돌아가 가입 화면으로 보내지기 때문.

## 5. 서버

| 파일 | 변경 |
|---|---|
| `src/Tutor/TutorBasicFields.php` (새) | 목록·검사(`normalizeInput`)·저장(`write`)·저장된 행 판정(`missingForTutor`). 과외지역 1은 `TutorRegionUnit::labelForId` 가 있을 때만 충족 |
| `src/Auth/BasicRegisterService.php` | `registerTutor()` 가 13항목 검사 후 저장. 이미 다 채운 행은 그대로 돌려줌. `needsBasicRegister` 판정 = `missingForTutor` 비었는지. `'middle'` 고정 제거 |
| `src/Tutor/TutorRegisterService.php` | `saveBasic()` = `normalizeInput` + `write`. 지역은 `saved_regions` 가 왔을 때만 검사·저장(C4). 성별 동기화는 gender 가 왔을 때만. `saveLesson`·`saveCareer` 는 보낸 키만 갱신(정본 73 10절 2번의 지움 문제도 같이 해결). `syncSubjects` 는 추가 과목 행만 다루고 `'middle'` 대체값 제거. `hydrateTutor` 의 `'mixed'`·`'solo'`·산정방식 기본값 제거 |
| `src/Registration/TutorHubService.php` | `publishMissing()` 기본 항목 = `missingForTutor` + 기존 상세등록 완료·소개문 |
| `src/Registration/TutorHubRepository.php` | 마이페이지 레코드에 `school_level`, `slogan`, `feature_2`, `feature_3` 추가 |
| `src/Media/TutorProfileImageService.php` | 마지막 사진 삭제 거절 |

C4: 마이페이지 기본정보 저장은 지역 칸을 건드렸거나 저장된 1번 지역이 없을 때만 지역을 보낸다. 따로 보내던 `regions` 단계 요청은 없앴다.

## 6. 등록점검 · 공개 판정

- 등록점검 보드 기본 섹션 = 공용 목록 13행(순서·라벨 같음). 상세1 = 산정방식·월 총 횟수·가격 설명, 상세2 = 대학·전공·학적·특징 2·3·짧은 소개·상세 소개·연락 가능 시간.
- 화면 공개 판정 `getPublishReadiness()` 와 서버 `publishMissing()` 이 같은 목록을 쓴다. 검사 스크립트가 13항목을 하나씩 비워 보며 「보드 빈칸 = 공개 판정 빠진 항목 = Basic 배지 남은 수」를 확인한다.
- 픽·프라임 조건은 바꾸지 않았다. 보고: 픽 조건 `TRC_PICK_FIELD_IDS` = `feature_1`, `student_target`(원생수) 두 개 모두 이제 기본정보 필수라서, 기본정보를 마친 과외쌤은 픽 조건을 자동으로 채운다.

## 7. 지시와 충돌해 고친 기존 단언

| 스크립트 | 단언 | 고친 내용 |
|---|---|---|
| `verify-tutor-registration-check-frame.mjs` | pick extras disjoint from basic | 픽 id 가 그대로인지 + `feature_1` 이 기본 필수인지로 바꿈 |
| 같은 파일 | basic tab 1:1 / detail1 1:1 / detail2 1:1 | 새 보드 행 순서로 바꿈 |
| `verify-tutor-lesson-optional-step.mjs` | lesson payload 의 주 회수·1회 수업시간, 과외비·강의장소·주력과목 누락 차단, 주 회수 형식, UI 라벨, inline-save 문구, `saveLesson` optionalInt | 기본정보 공용 검사(`tutorBasicOkMap`/`tutorBasicMissing`)와 `TutorBasicFields::positiveInt` 기준으로 같은 경우를 검사하도록 옮김. 수업 단계 검사(산정방식·월 총 횟수·추가 과목)는 그대로 |
| `verify-tutor-draft-reuse.mjs` | basic 저장 입력 | 입력에 기본정보 항목을 모두 넣고, 가짜 DB 가 기존 행의 사진 있음을 답하게 함 |

## 8. 검증 (worktree)

커밋: `14a4d48` 서버·공용 목록, `bbfdd46` 화면, `0378cbc` 검사 스크립트, 그 뒤 문서 커밋(정본 73 2절·README·이 기록).

| 게이트 | 이전(main 기준 기록) | 지금 |
|---|---|---|
| `verify:tutor-basic-required` (새) | — | OK. 정적 80항목: merge-base 4 통과 → 작업트리 80 통과. 바뀌면 안 되는 것 5/5(TutorRegionUnit · 픽 · 프라임 · SQL 없음 · 학생·공부방). 동작 85/85. PHP 26/26 |
| `verify:tutor-region-unit` | 127 pass / 7 fail | 127 / 7 (같은 7개, 「main 읽기 실패」) |
| `verify:tutor-registration-check-frame` | FAILED (2) | FAILED (2) (같은 2개: publish wrap, CTA after board) |
| `verify:tutor-lesson-optional-step` | OK | OK (7절 수정 후) |
| `verify-tutor-draft-reuse.mjs` | (실행 안 함) | 10/10 (7절 수정 후) |
| `verify:tutor-signup-seed`, `tutor-register-same-tab`, `tutor-mypage-frame-ia`, `tutor-mypage-route-integrity`, `tutor-inquiries-settings` | OK | OK |
| `verify-tutor-box-real-values.mjs` | — | 49/0 |
| `verify-tutor-region-label.mjs` | — | 커밋 전 114/1(「클라이언트 파일 diff vs HEAD」 가드가 커밋 전 작업트리 diff 를 봄) → 코드 커밋 `0378cbc` 뒤 115/0 |
| `verify-tutor-home-student-tab.mjs` | — | 시작 실패(`@home-enums` 별칭 해석). 이번 변경 파일은 이 별칭을 쓰지 않음 |
| `verify:no-sample-data`, `verify:shop-page`, `verify:location-ssot` | OK | OK |
| PHP 문법 (`php -l`, 바뀐 PHP 7개) | — | 오류 없음 |
| vite build (auth-ui, home-ui, tutor-ui, tmp 출력) | — | 성공 |

로컬 PHP(`D:\php8.2`)에는 mbstring 이 꺼져 있어 `PHP_INI_SCAN_DIR` 로 확장만 켜서 돌렸다(시스템 php.ini 는 안 바꿈). 서버 코드는 이미 `src/` 19개 파일에서 mb 함수를 쓴다.

## 9. 배포 전 사용자 할 일

- SQL: 없음. 새 컬럼 없이 `008_tutors.sql` 의 기존 컬럼만 쓴다.
- 환경변수·Secrets·`.htaccess`: 없음.
- 알아둘 것: 판정이 바뀌어 기존 과외쌤 계정 중 13항목이 하나라도 빈 계정은 다음 로그인 때 기본정보 화면으로 간다(10/9 00:05 결정대로 옛 데이터 보정 없음).

## 10. 멈춘 곳 · 모호점

1. 이미 로그인한 상태로 홈에 들어올 때 기본정보 화면으로 보내는 조건(`auth-session.js`, 정본 73 7-9)은 학생만이다. 이번 지시 범위 밖이라 안 고쳤다.
2. 마이페이지 사진 편집기를 3장 통째로 기본정보 탭에 옮겼다. 2·3번째 사진을 상세로 나눌지 결정이 필요하다.
3. 지도 대상 성별 `mixed` 라벨이 마이페이지는 「혼성」, 공용·가입·tutor-ui 는 「남여」다. 어느 쪽으로 맞출지 결정이 필요하다.
4. 공개 버튼은 여전히 상세등록 완료·소개문을 요구한다(정본 73 11-2절 7번, 열린 질문).
5. 검색 노출 조건(정본 73 7-6)과 카드 배치는 이번 범위 밖이라 그대로다.
6. tutor-ui 의 연령대 `'early_30s'`, 학적 `'graduated'`, 경력 `'y1_3'`, 과외쌤 성별 `'male'` 기본값은 기본정보 필수 항목이 아니라 그대로 뒀다.
7. 지나가며 고친 것(보고): 마이페이지 상세 저장이 화면에 없는 항목을 지우던 문제(정본 73 10절 2번), 마이페이지 기본 저장이 성별을 `'male'` 로 덮어쓰던 문제, tutor-ui 가짜 사진 `profile.jpg` 상태값.

## 검수

(검수자 기록란)

## 승인

승인: 대기 (사용자, 커밋 hash 단위)
