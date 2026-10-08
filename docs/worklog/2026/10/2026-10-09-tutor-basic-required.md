# 2026-10-09 과외쌤 기본등록 필수 8개 (tutor-basic-required)

- 브랜치: `cursor/tutor-basic-required-20261009` (worktree `.wt/tutor-basic-required`)
- 기준: `origin/main` `bd853f6` (merge `d04e796` 으로 반영. 이번 변경 파일은 이전 기준 `90cc0f0` 과 같음)
- 정본: `docs/internal/73-tutor-basic-card-lock.md` 0절 「최종 결정 (2026-10-09)」 — `origin/main` 판과 같음(`git diff origin/main` 비어 있음)
- 작업: 하위 에이전트(작업자). 이 세션은 자기 작업을 검수·승인하지 않는다.

## 1. 지시서

처음 지시(13항목 필수)는 작업 중 중지됐고, 아래 최종 사양이 이전 지시보다 우선한다. 대화 기록 파일에 최종 사양 메시지 전문이 남아 있지 않아, 작업 세션이 보관한 원문 구절을 그대로 옮긴다.

원문 인용:

- 「중지했던 작업을 다시 진행하세요. 다만 사양이 최종 정본으로 바뀌었습니다. 이전 지시보다 아래가 우선합니다.」
- 정본: `docs/internal/73-tutor-basic-card-lock.md` 0절 「최종 결정 (2026-10-09)」 (origin/main `bd853f6`). `git fetch origin` 후 73을 origin/main 판에 맞추고 0절을 읽는다.
- 「기본등록 필수 8개: 표시명, 과외지역 1번, 대상, 과목, 월 과외비, 주 ○회, ○분, 슬로건. 성별은 계정 단계에서 받습니다.」
- 「수업장소, 원생수, 특징, 사진은 기본등록으로 올리지 않고 상세등록 선택 항목으로 둡니다. 이미 기본등록으로 옮긴 부분이 있으면 되돌리세요. 서버의 기본등록 필수 검사에도 넣지 마세요.」
- 「화면에 「필수」 표시를 하지 마세요. 과외지역 2·3번에만 「선택」 표시를 합니다.」
- 「미리 채우기(가짜 기본값)는 하지 마세요.」
- 「사진: 없으면 이름 첫 글자를 보여 줍니다(현재 동작). 상세등록에서 사진을 올리면 첫 글자를 대체합니다(두 장이 되지 않음). 과외쌤에게 공부방 로고 기본 이미지는 쓰지 않습니다.」
- 「주의: 테스트 계정·비밀 파일은 사용하지 마세요. 실제 사이트 가입 테스트는 하지 마세요. SQL이 필요하면 만들지 말고 보고만 하세요.」
- 「작업 브랜치에서만, main push·병합 금지, `git add -A` 금지, push된 커밋 amend 금지」
- 「견본/가짜 데이터·시드 추가 금지」, 「픽·프라임 조건은 이번에 바꾸지 말 것」, 「새 컬럼 만들지 말 것」, 「과외지역 단위(TutorRegionUnit) 바꾸지 말 것」
- 「보고(짧게): 커밋 hash, 바뀐 파일 목록, 되돌린 것, 검증 숫자, SQL 필요 여부.」

할 일 (지시 순서):

1. 현재 변경과 새 파일 3개를 최종 사양에 맞게 정리하고, 필요 없어진 것은 되돌린다. 공용 필드 정의는 8개.
2. 정본과 충돌하는 기존 단언(lesson-optional, check-frame)을 고친다. 정본과 맞는 단언은 그대로 둔다.
3. 새 검사 `scripts/verify-tutor-basic-required.mjs` + npm 스크립트: 8개 중 하나 빠지면 서버 거절, 상세 4개 없이 통과, 「필수」 글자 없음, 지역 2·3번 「선택」, 미리 채우기 없음, 변조 검사.
4. 관련 검사 전부와 `npm run verify:shop-page` 실행.
5. 이 작업기록 작성(지시서 원문, 한 일, 검증 숫자, 승인 대기).
6. 허용 파일만 stage, commit, `cursor/tutor-basic-required-20261009` 로 push.

## 2. 기본등록 필수 8개

공용 목록 한 벌: `preview/shared/tutor-basic-fields.js` `TUTOR_BASIC_FIELDS` ↔ `src/Tutor/TutorBasicFields.php` `LABELS` (8키, 같은 순서·라벨. 검사 스크립트가 일치 확인).

| 항목 (키) | 이전 위치 (base) | 지금 |
|---|---|---|
| 표시명 (`display_name`) | 세 기본정보 화면 | 그대로 |
| 과외지역 1 (`primary_region`) | 세 기본정보 화면 | 그대로. 2·3번 제목에만 「(선택)」 |
| 대상 (`school_level`) | 가입은 `'middle'` 고정, tutor-ui 과목 행 | 세 기본정보 화면 select(빈 선택에서 시작). 대표 과목 행 `school_level` 에 저장 |
| 과목 (`main_subject`) | 세 기본정보 화면 | 그대로 |
| 월 과외비 (`fee`) | 마이페이지 상세, tutor-ui 수업·상세 단계 | 기본정보 (천원 입력 → 원 저장) |
| 주 ○회 (`lessons_per_week`) | 같음 | 기본정보 |
| ○분 (`minutes`) | 같음 | 기본정보 |
| 슬로건 (`slogan`) | 입력칸 없음 | 기본정보 |

세 화면: 가입 `signup-basic.js` `renderTutorBasic()`, 마이페이지 `screens.js` `renderBasicForm()`, tutor-ui `step-basic.js`. 기존 2단 배치(왼쪽 입력칸, 오른쪽 과외지역) 유지. 「필수」 글자·`form-label--required`·`reqMark` 없음.

성별: 계정 단계에서 받으므로 tutor-ui 기본 단계의 과외쌤 성별 라디오를 뺐고 기본 저장 요청에 gender 를 보내지 않는다. 서버는 gender 가 왔을 때만 동기화한다.

## 3. 되돌린 것 (13항목 작업 → 최종 사양)

| 대상 | 되돌린 내용 |
|---|---|
| 수업장소 (`lesson_places`) | 기본정보에서 빼고 상세(마이페이지 상세·tutor-ui 수업 단계·상세 단계)로 되돌림. 선택 항목 |
| 원생수 (`student_gender_group`, `student_count_group`) | 같음. 선택 라디오, 빈 선택에서 시작 |
| 특징 1 (`feature_1`) | 상세로 되돌림(특징 2·3과 같이). 선택 |
| 사진 | 기본정보 사진 칸·가입/tutor-ui 업로드 연결 제거. `preview/shared/tutor-profile-photo.js` 삭제, `profile-photos.js`·`step-contact.js`·`save-flow.js`·`TutorProfileImageService.php` 는 base 그대로(마지막 사진 삭제 거절도 되돌림). 사진 편집기는 마이페이지 상세(base 위치) |
| 서버 기본등록 검사 | `TutorBasicFields` 에서 수업장소·원생수·특징 1·사진 검사 제거. `missingForTutor` 는 `tutor_images`·`tutor_lesson_places` 를 읽지 않음 |
| 등록점검 보드 | 기본 섹션 8행. 상세1에 지도 대상 성별·수업인원·강의장소(선택) 복원, 상세2에 특징 1·프로필 사진(선택) 복원 |

사진 동작은 base 그대로다: 사진이 없으면 이름 첫 글자, 상세등록에서 올리면 그 사진이 첫 글자를 대체한다. 공부방 로고 기본 이미지는 과외쌤 쪽에 쓰지 않는다(코드 변경 없음).

## 4. 서버

| 파일 | 변경 |
|---|---|
| `src/Tutor/TutorBasicFields.php` (새) | 8개 목록·검사(`normalizeInput`)·저장(`write`)·저장된 행 판정(`missingForTutor`). 과외지역 1은 `TutorRegionUnit::labelForId` 가 있을 때만 충족 |
| `src/Auth/BasicRegisterService.php` | `registerTutor()` 가 8개 검사 후 저장. `needsBasicRegister` = `missingForTutor` 비었는지. `'middle'` 고정 제거 |
| `src/Tutor/TutorRegisterService.php` | `saveBasic()` = `normalizeInput` + `write`. 지역은 `saved_regions` 가 왔을 때만(C4). gender 는 왔을 때만 동기화. `saveLesson`·`saveCareer` 는 보낸 키만 갱신(원생수·수업장소·특징 1은 선택). `hydrateTutor` 의 `'male'`·`'mixed'`·`'solo'`·산정방식 기본값 제거 |
| `src/Registration/TutorHubService.php` | `publishMissing()` = `missingForTutor`(8개) + base 의 강의장소·상세등록 완료·프로필 이미지·소개문 |
| `src/Registration/TutorHubRepository.php` | 마이페이지 레코드에 `school_level`, `slogan`, `feature_2`, `feature_3` 추가 |

C4: 마이페이지 기본정보 저장은 지역 칸을 건드렸거나 저장된 1번 지역이 없을 때만 지역을 보낸다.

## 5. 미리 채우기 제거

- tutor-ui `registerState`: `gender`·`student_gender_group`·`student_count_group`·`fee_basis_type`·`school_level` 빈 값, 대표 과목 `'middle'` 행 제거, 가짜 사진 `profile.jpg` 상태값 제거.
- 마이페이지: 지도 대상 성별·수업인원·산정방식 select 를 빈 선택에서 시작(`'mixed'`·`'solo'`·`'monthly…'` 미리 선택 제거). 기본 저장이 성별을 `'male'` 로 덮어쓰던 문제 제거.
- 서버 `hydrateTutor`: gender `?? 'male'` → `?? ''` 등.

## 6. 지시와 충돌해 고친 기존 단언

| 스크립트 | 단언 | 고친 내용 |
|---|---|---|
| `verify-tutor-registration-check-frame.mjs` | basic tab 1:1 | `display_name,primary_region,school_level,main_subject,fee,lessons_per_week,minutes,slogan` |
| 같은 파일 | detail1 1:1 | `fee_basis,monthly_session_count,student_gender_group,student_count_group,lesson_places,fee_description` |
| `verify-tutor-lesson-optional-step.mjs` | 수업 단계의 주 회수·1회 시간·과외비·강의장소 필수, 주 회수 형식, UI 라벨 | 8개는 기본정보 공용 검사(`tutorBasicOkMap`/`tutorBasicMissing`, `TutorBasicFields::positiveInt`) 기준으로 옮김. 강의장소는 선택(기본 목록에 없음, 수업 단계 요청에 기본값 없이 실림). 새 1b·4c 단언 |
| `verify-tutor-draft-reuse.mjs` | basic 저장 입력 | 입력에 8개(대상·과목·과외비·주 회수·시간·슬로건) 추가. 13항목 때 넣은 가짜 사진 응답·강의장소·특징 1 제거 |

나머지 단언(픽 id, detail2 순서 등)은 정본과 맞아 그대로 뒀다.

## 7. 새 검사 `verify:tutor-basic-required`

`npx vite-node scripts/verify-tutor-basic-required.mjs [--ref <commit>]` (+ `scripts/verify-tutor-basic-required.php`)

- A. 서버: 8개 중 하나라도 빠지면 그 라벨로 거절, 형식 검사
- B. 상세 4개(수업장소·원생수·특징·사진) 없이 통과, 상세 4개만으로는 8개 모두 빠짐으로 거절, 상세 화면에서 저장
- C. 기본등록 화면 3곳에 「필수」 표시 없음
- D. 과외지역 2·3번에만 「선택」
- E. 미리 채운 값 없음(소스 대체값·`registerState`·렌더된 selected/checked)
- F. 등록점검 보드·공개 판정이 같은 8개 목록
- G. 바뀌면 안 되는 것(`TutorRegionUnit`·픽·프라임·SQL 없음·학생·공부방)
- T. 변조 검사: 검사 함수에 틀린 입력을 넣어 실제로 잡는지 확인(JS 15 + PHP 서버 사본 4)

## 8. 검증 (worktree, 커밋 전 작업트리)

| 게이트 | 결과 |
|---|---|
| `verify:tutor-basic-required` (새) | OK. PASS 160 / FAIL 0 (PHP 28/28, 변조 19/19 잡음) |
| `verify:tutor-registration-check-frame` | 89 pass / 2 fail — base 와 같은 2개(publish wrap, CTA after board) |
| `verify:tutor-lesson-optional-step` | 50 / 0 |
| `verify-tutor-draft-reuse.mjs` | 10 / 10 |
| `verify:tutor-region-unit` | 134 / 0 |
| `verify:tutor-signup-seed` | 25 pass |
| `verify:tutor-register-same-tab` | 25 pass |
| `verify:tutor-mypage-frame-ia` | 29 pass |
| `verify:tutor-mypage-route-integrity` | 60 pass |
| `verify:tutor-inquiries-settings` | 148 pass |
| `verify-tutor-box-real-values.mjs` | 49 / 0 |
| `verify:no-sample-data` | 5 pass |
| `verify:location-ssot` | 14 pass |
| `verify:shop-page` | 54 / 0 |
| `verify-tutor-home-student-tab.mjs` | 22 pass 후 `@home-enums` 별칭 해석 실패로 중단 — base 와 같음. 이번 변경 파일은 이 별칭을 쓰지 않음 |
| `verify-tutor-region-label.mjs` | 「클라이언트 파일 diff vs HEAD」 가드 때문에 커밋 후 실행 → 115 / 0 |
| PHP 문법 `php -l` (바뀐 PHP 5개) | 오류 없음 |
| vite build (auth-ui, home-ui, tutor-ui, tmp 출력) | 성공 (기존 CSS 경고만) |

로컬 PHP(`D:\php8.2`)는 mbstring 이 꺼져 있어 `PHP_INI_SCAN_DIR` 로 확장만 켜서 돌렸다(시스템 php.ini·저장소 파일 안 바꿈).

## 9. 커밋

- 이전 push(13항목 작업): `14a4d48` 서버·공용 목록, `bbfdd46` 화면, `0378cbc` 검사 스크립트, `e78ab11` 문서
- `d04e796` merge origin/main `bd853f6` (정본 73 최종)
- `542c1f4` 최종 사양 8개 정리(코드·검사·이 기록)
- `542c1f4` 뒤 재실행: `verify-tutor-region-label.mjs` 115 / 0, `verify:tutor-basic-required` OK(PASS 160), `verify:shop-page` 54 / 0

## 10. 배포 전 사용자 할 일

- SQL: 없음. 새 컬럼 없이 기존 컬럼만 쓴다.
- 환경변수·Secrets·`.htaccess`: 없음.
- 알아둘 것: 판정이 8개로 바뀌어, 기존 과외쌤 중 대상·과외비·주 회수·시간·슬로건이 빈 계정은 다음 로그인 때 기본정보 화면으로 간다(10/9 00:05 결정대로 옛 데이터 보정 없음).

## 11. 열린 질문 · 모호점

1. 공개 버튼(`publishMissing`·`getPublishReadiness`)은 base 대로 강의장소·프로필 이미지·상세등록 완료·소개문을 계속 요구한다. 정본 0절은 사진·수업장소를 상세 선택으로 두었으므로, 공개 조건에서도 뺄지 사용자 결정이 필요하다. 이번에는 바꾸지 않았다.
2. 지도 대상 성별 `mixed` 라벨이 마이페이지는 「혼성」, 공용·가입·tutor-ui 는 「남여」다.
3. 이미 로그인한 상태로 홈에 올 때 기본정보 화면으로 보내는 조건(`auth-session.js`, 정본 73 7-9)은 학생만이다. 범위 밖이라 안 고쳤다.
4. tutor-ui 의 연령대 `'early_30s'`, 학적 `'graduated'`, 경력 `'y1_3'` 기본값은 기본등록 항목이 아니라 그대로 뒀다.
5. 지나가며 고친 것: 마이페이지 상세 저장이 화면에 없는 항목을 지우던 문제(정본 73 10절 2번), 성별 `'male'` 덮어쓰기·대체값.

## 검수

(검수자 기록란)

## 승인

승인: 대기 (사용자, 커밋 hash 단위)
