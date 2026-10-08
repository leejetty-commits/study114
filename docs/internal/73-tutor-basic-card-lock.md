# 73. 과외쌤 기본정보 필수 항목 = 베이직카드 항목 (정본)

- 상태: 정본 초안. 사용자 승인 대기.
- 작성: 2026-10-08
- 범위: 과외쌤만. 공부방과 학생은 이 정본을 바로 적용하지 않고 후속 정본에서 정한다.
- 브랜치: `cursor/tutor-basic-card-20261008` (문서만 추가. 코드는 바꾸지 않았다.)
- 코드 기준: `origin/main` `bc76015`. 아래 파일 이름, 함수 이름, 줄 번호는 이 기준에서 직접 검색해 확인한 것만 적었다. 확인하지 못한 것은 「미확인」이라고 적었다.
- 작업 기록: `docs/worklog/2026/10/2026-10-08-tutor-basic-card.md`

---

## 1. 목적과 원칙

### 1-1. 사용자 결정 원문 (2026-10-08)

- 「계정을 만들고, 기본정보를 모두 입력해야 베이직카드가 노출이 돼. 즉 등록이 된거지. 만약 중간에 이탈되면 다음 로그인시 이 기본정보 등록화면부터 만나게 돼.」
- 「베이직카드에 들어가는 항목은 기본등록단계에서 받아야 해. 필수로. 선택은 과외지역 2번 3번만 선택이야. 왜냐하면 기본등록 후에 상세등록에서 또 항목을 채워야 카드노출이 된다면 이중으로 동선이 생겨...」
- 「계정은 기본정보 입력 전 단계이니, 계정과 관련된 것은 범위에서 제외돼」
- 「카드에서 빼면 안돼. 기본정보입력으로 올려야 돼.」
- 「증빙자료 제외... 이건 상세정보입력에 가야 해.」
- 「네가 표로 제시한거 전부 필수로 넣으면 돼. 저건 노출되어야 해.」

### 1-2. 원칙

1. 과외쌤은 계정을 만든 뒤 기본정보를 모두 입력해야 등록이 끝난다. 등록이 끝난 때부터 베이직카드가 노출된다.
2. 베이직카드에 보이는 항목은 모두 기본정보 단계에서 필수로 받는다. 선택 항목은 과외지역 2번과 3번 두 칸뿐이다.
3. 기본정보를 다 넣지 않고 나간 과외쌤은 다음 로그인 때 기본정보 화면부터 다시 만난다. 이미 로그인한 상태로 홈에 들어와도 같다.
4. 기본정보 화면은 세 곳이다. 가입 기본정보 화면, 마이페이지 기본정보 탭, `/register/tutor` 기본 단계다. 세 화면과 서버 필수 검사는 같은 필수 목록을 쓴다.
5. 상세정보 화면은 기본정보 항목을 다시 묻지 않는다. 상세정보 화면에서는 기본정보 요약을 보여 주고 기본정보 수정 화면으로 연결만 한다.
6. 카드에서 항목을 빼는 방식으로 문제를 풀지 않는다. 카드에 보이는 항목이 비어 있으면, 그 항목을 기본정보 입력으로 올린다.
7. 계정 단계 값(이메일, 비밀번호, 이름, 휴대폰, 성별 등)과 증빙자료는 이 필수 목록에 넣지 않는다.

### 1-3. 노션 정본 UDX-STD-002 와의 관계

작업 지시서에 따르면 노션 정본 UDX-STD-002(2026-09-24)에는 「기본등록은 Basic 카드에 표시되는 모든 사용자 입력값을 받는 단계」, 「상세등록은 Basic 항목을 반복해서 받지 않는다」는 원칙이 있다. 이번 작업에서는 노션 원문을 직접 열어 보지 않았으므로 이 인용은 지시서 기준이다(노션 원문 대조는 미확인).

이 정본은 그 원칙을 코드 기준으로 잠근다. 노션 정본과 다른 점은 두 가지다.

1. 증빙자료 보유 여부는 노션 6장에서 기본등록 항목이었으나, 사용자 결정으로 상세정보로 옮긴다.
2. 월 과외비, 프로필 사진, 주 횟수와 1회 시간, 원생수(지도 대상 성별과 수업인원)도 기본정보 필수로 명시한다.

---

## 2. 필수 항목 표

카드의 「위치」 칸은 과외지역 1번 이름을 보여 준다. 그래서 과외지역 1번이 곧 카드의 위치 항목이다.

| 번호 | 카드 항목 | 저장 위치 (테이블·컬럼) | 입력 방식 제안 | 현재 입력 위치 | 변경 후 위치 |
|---|---|---|---|---|---|
| 1 | 표시명 | `tutors.tutor_display_name` (최대 50자) | 글자 입력 | 가입 기본정보, 마이페이지 기본정보, `/register/tutor` 기본 단계. 세 곳 모두 필수 | 기본정보 필수 (그대로) |
| 2 | 과외지역 1번 (카드 위치) | `tutor_regions` 의 `priority_order = 0`, `is_primary = 1` 행 | 지역 선택칸. 선택 단위는 정본 72를 따른다 | 위 세 곳. 필수 | 기본정보 필수 (그대로) |
| 3 | 과외지역 2번·3번 | `tutor_regions` 의 `priority_order = 1, 2` 행 | 지역 선택칸 | 위 세 곳. 선택 | 기본정보 선택 (그대로) |
| 4 | 대상 (학교급) | `tutor_subject_targets.school_level` (대표 과목 행). 같은 테이블에 `grade_band` 컬럼도 있으나, 카드의 대상 값은 `TutorHubRepository::gradeBand()` 가 `school_level` 을 읽어 만든다 | 학교급 선택 | 가입 기본정보와 마이페이지에는 입력칸이 없다. 가입 저장 때 `'middle'` 로 고정 저장된다. `/register/tutor` 수업 단계와 상세 단계의 과목 행에는 학교급 선택칸이 있다 | 기본정보 필수 |
| 5 | 과목 (주력과목) | `tutors.main_subject_note` 와 `tutor_subject_targets` 의 대표 행(`is_primary = 1`) | 목록에서 1개 선택 | 위 세 곳. 필수 | 기본정보 필수 (그대로) |
| 6 | 수업장소 | `tutor_lesson_places.place_type` (학생자택방문, 공공장소, 강사자택) | 1개 이상 체크 | 마이페이지 상세정보, `/register/tutor` 수업 단계와 상세 단계 | 기본정보 필수 |
| 7 | 특징 | `tutors.feature_1` (최대 100자). 특징 2·3(`feature_2`, `feature_3`)은 현재 프라임 조건 | 짧은 글 입력 | 마이페이지 상세정보, `/register/tutor` 연락 단계와 상세 단계 | 특징 1은 기본정보 필수. 특징 2·3은 상세정보 |
| 8 | 슬로건 | `tutors.slogan` (최대 255자) | 한 줄 글 입력 | 마이페이지(home-ui)에는 입력칸이 없다. `/register/tutor` 는 상태값(`state.js`)과 저장값(`form-collect.js`)에는 있으나 화면 입력칸은 검색으로 찾지 못했다 | 기본정보 필수 |
| 9 | 월 과외비 | `tutors.preferred_fee_amount` (원 단위 저장, 화면은 천원 단위) | 숫자 입력 (천원) | 마이페이지 상세정보, `/register/tutor` 수업 단계와 상세 단계 | 기본정보 필수. 산정방식(`tutors.fee_basis_type`) 포함 여부는 열린 질문 |
| 10 | 프로필 사진 | `tutor_images` 의 첫 번째 사진. 첫 번째는 `sort_order` 가 가장 작은 사진이고, 같으면 `id` 가 작은 사진이다 (`TutorHubRepository.php` 276~277줄 조회 순서) | 사진 1장 올리기 | 마이페이지 상세정보의 사진 편집기 | 1장은 기본정보 필수. 2·3번째 사진은 상세정보 |
| 11 | 주 ○회·○분 | `tutors.lessons_per_week`, `tutors.minutes_per_lesson` | 목록 선택 2개 | 마이페이지 상세정보, `/register/tutor` 수업 단계와 상세 단계 | 기본정보 필수 |
| 12 | 원생수 (지도 대상 성별과 수업인원) | `tutors.student_gender_group`, `tutors.student_count_group` | 선택 2개 | 마이페이지 상세정보(화면이 `'mixed'`, `'solo'` 를 미리 골라 둔다), `/register/tutor` 수업 단계와 상세 단계 | 기본정보 필수 |

위 표의 모든 컬럼은 `sql/schema/008_tutors.sql` 에 이미 정의되어 있다(`tutors` 8~50줄, `tutor_subject_targets` 52~65줄, `tutor_regions` 67~79줄, `tutor_lesson_places` 81~88줄, `tutor_images` 90~100줄).

### 2-1. 필수 값을 미리 채우지 않는다

사용자가 직접 고르지 않은 값이 저장되면, 필수 검사를 해도 「입력됨」으로 세어진다. 그러면 필수로 받는다는 결정이 의미가 없어진다. 현재 아래 코드가 필수 항목에 값을 미리 채운다. 구현 과제에서 모두 없앤다.

| 항목 | 위치 | 현재 동작 |
|---|---|---|
| 대상 | `src/Auth/BasicRegisterService.php` `registerTutor()` 786줄, 817줄 | 가입 저장 때 `school_level` 을 `'middle'` 로 고정 저장한다 |
| 대상 | `src/Tutor/TutorRegisterService.php` `syncSubjects()` 836줄 | 과목 목록이 비어 있으면 `'middle'` 로 채운다 |
| 원생수 | `preview/home-ui/src/tutor-reg/inline-save.js` `saveTutorBasicInline()` 54~55줄 | 값이 없으면 `'mixed'`, `'solo'` 를 보낸다 |
| 원생수 | 같은 파일 `saveTutorDetailInline()` 115줄 | 값이 없으면 `'mixed'` 를 보낸다 |
| 원생수 | `preview/home-ui/src/tutor-reg/screens.js` `renderDetailForm()` 417~418줄 | 화면에서 `'mixed'`, `'solo'` 를 미리 고른다 |
| 원생수 | `src/Tutor/TutorRegisterService.php` `hydrateTutor()` 1245줄 | 읽을 때 값이 없으면 `'mixed'` 로 내려 준다 |

서버의 `TutorRegisterService::saveBasic()`(415줄)은 기본 저장 때 `student_gender_group` 과 `student_count_group` 을 필수로 요구한다(459줄, 461줄). 그래서 마이페이지 기본정보 저장이 위 미리 채운 값을 보내고 있다. 원생수를 기본정보 입력칸으로 올리면 이 미리 채우기는 필요 없어진다.

---

## 3. 범위 밖

### 3-1. 계정 항목

계정은 기본정보 입력 전 단계이므로 이 정본에서 다루지 않는다. 이메일, 비밀번호, 이름, 휴대폰, 수신동의, 성별(`user_profiles.gender`)이 여기에 속한다.

카드는 표시명 앞에 과외쌤 성별을 보여 준다(`preview/home-ui/src/exposure-render.js` `renderBasicTutorRow()` 856줄, 878~882줄). 성별은 계정 단계 값이므로 이 정본의 필수 목록에 넣지 않는다.

다만 성별이 비어 있을 때 `'male'` 로 채우는 코드가 세 곳 있다. 이것은 **별도 버그 과제**로 기록하고, 이 정본에서는 고치지 않는다.

| 위치 | 코드 |
|---|---|
| `preview/home-ui/src/tutor-reg/inline-save.js` `saveTutorBasicInline()` 57줄 | `gender: basic.gender \|\| current.gender \|\| 'male'` |
| `src/Tutor/TutorRegisterService.php` `hydrateTutor()` 1235줄 | `ProfileGenderSync::get(...) ?? 'male'` |
| `preview/tutor-ui/src/screens/step-basic.js` `renderBasic()` 85줄 | 성별 라디오에서 `s.gender \|\| 'male'` 로 남 항목을 미리 선택 |

이 세 곳이 함께 작동하면 실제 피해가 생길 수 있다. 서버가 빈 성별을 `'male'` 로 내려 주고, 마이페이지 기본정보 저장이 그 값을 다시 보내면, `TutorRegisterService::saveStep()` 192줄이 `ProfileGenderSync::sync()` 를 불러 `user_profiles.gender` 에 `'male'` 을 저장한다(`src/Auth/ProfileGenderSync.php` 34~48줄). 그래서 성별을 고른 적 없는 과외쌤이 남성으로 저장될 수 있다.

### 3-2. 증빙자료

증빙자료 보유 여부(`tutors.proof_document_available`)와 제출 파일은 상세정보에서 받는다. 현재 `/register/tutor` 연락 단계(`step-contact.js` 74줄)와 상세 단계(`step-detail.js` 182줄)에 체크칸이 있다. 이 위치는 그대로 상세정보로 둔다.

### 3-3. 상세정보에 남는 항목

상세정보는 아래 항목을 받는다. 기본정보 항목은 다시 묻지 않는다.

- 학교, 전공, 학적상태 (`university_name`, `major_name`, `university_status`)
- 경력 상세 (`career_year_band` 등)
- 주교재 (`main_material_note`)
- 강의스타일 배지 (`tutor_teaching_style_badges`)
- 짧은 소개와 긴 소개 (`intro_short`, `intro_long`)
- 추가 사진 (2·3번째 사진)
- 증빙자료
- 특징 2·3 (`feature_2`, `feature_3`)
- 가격 설명, 연락 가능 시간 등 카드에 나오지 않는 칸

---

## 4. 화면별 적용 지점

아래 줄 번호는 `origin/main` `bc76015` 기준이다. 구현 과제에서 고칠 위치를 가리킬 뿐이며, 이번 작업에서는 고치지 않았다.

### 4-1. 가입 기본정보 화면 (auth-ui)

- `preview/auth-ui/src/screens/signup-basic.js` `renderTutorBasic()` 266줄. 지금은 표시명(289~292줄), 주력과목(295줄), 과외지역 1~3번(301~304줄)만 있다.
- 같은 파일 `bindSignupBasicEvents()` 437줄. 과외쌤 제출 검사는 679~742줄에 있고, 표시명·주력과목·과외지역만 검사한다.
- 서버 저장: `src/Auth/BasicRegisterService.php` `registerTutor()` 747줄. 표시명 필수(749줄), 지역 정리(`normalizeTutorSignupRegions()` 832줄), 대상 `'middle'` 고정 저장(786줄, 817줄).
- 바꿀 내용: 필수 표의 4번, 6번~12번 입력칸을 더한다. 화면 검사와 서버 검사가 같은 필수 목록을 쓴다.

### 4-2. 마이페이지 기본정보 탭 (home-ui)

- `preview/home-ui/src/tutor-reg/screens.js` `renderBasicForm()` 352줄. 지금은 표시명(374~377줄), 주력과목(378~383줄), 과외지역(385~390줄)만 있다.
- `preview/home-ui/src/tutor-reg/inline-save.js` `saveTutorBasicInline()` 34줄. 화면 검사는 41~44줄이고, 서버에는 `basic` 단계 저장(48~58줄)과 `regions` 단계 저장(59~65줄)을 차례로 보낸다. 51줄에서 슬로건은 기존 값을 그대로 다시 보낸다.
- 바꿀 내용: 가입 기본정보와 같은 필수 입력칸을 둔다. 미리 채우는 기본값(2-1절)을 없앤다.

### 4-3. `/register/tutor` (tutor-ui)

- 화면 목록: `preview/tutor-ui/src/main.js` 47~52줄 (basic, regions, lesson, contact, detail, complete).
- 기본 단계: `preview/tutor-ui/src/screens/step-basic.js` `renderBasic()` 56줄(입력칸 73~92줄), `bindBasicEvents()` 109줄(검사 120~130줄). 지금은 표시명, 주력과목, 과외쌤 성별, 과외지역만 있다.
- 수업 단계: `preview/tutor-ui/src/screens/step-lesson.js` `renderLesson()` 70줄. 학교급(49줄), 수업장소(75줄), 산정방식(82줄), 지도 대상 성별(96줄), 수업인원(100줄), 월 과외비(112줄), 주 횟수(120줄), 1회 시간(122줄)이 여기에 있다.
- 상세 단계: `preview/tutor-ui/src/screens/step-detail.js` `renderDetail()` 86줄. 수업 단계와 같은 칸들과 특징 1(177줄), 증빙 체크(182줄)가 있다.
- 연락 단계: `preview/tutor-ui/src/screens/step-contact.js` `renderContact()` 35줄. 특징 1(69줄), 증빙 체크(74줄).
- 바꿀 내용: 필수 표 항목을 기본 단계로 옮긴다. 수업·상세·연락 단계에서는 그 칸을 뺀다.

### 4-4. 상세정보에서 빠질 칸 (마이페이지 상세정보 탭)

`preview/home-ui/src/tutor-reg/screens.js` `renderDetailForm()` 407줄 안의 칸이다.

| 칸 | 줄 | 처리 |
|---|---|---|
| 월 과외비 | 427~430 | 기본정보로 옮긴다 |
| 산정방식 | 431~436 | 열린 질문 3번 결정에 따른다 |
| 주 회수 | 437~440 | 기본정보로 옮긴다 |
| 월 총 횟수 | 441~444 | 열린 질문 3번 결정에 따른다 |
| 1회 수업시간 | 445~448 | 기본정보로 옮긴다 |
| 지도 대상 성별 | 449~454 | 기본정보로 옮긴다 |
| 수업인원 | 455~460 | 기본정보로 옮긴다 |
| 강의장소 | 461~464 | 기본정보로 옮긴다 |
| 특징 1 | 496~499 | 기본정보로 옮긴다 |
| 프로필 사진 | 512~515 | 1번 사진은 기본정보로 옮긴다. 2·3번째 사진은 상세정보에 남긴다 |
| 가격 설명, 대학, 전공, 학적, 특징 2·3, 짧은 소개, 상세 소개, 연락 가능 시간 | 465~468, 476~495, 500~511, 516~523 | 상세정보에 남긴다 |

옮긴 칸 자리에는 기본정보 요약과 「기본정보에서 수정」 연결만 둔다. 저장 함수 `saveTutorDetailInline()`(`inline-save.js` 86줄)도 옮긴 항목을 보내지 않게 한다.

### 4-5. 서버

| 파일 | 함수 (줄) | 현재 | 바꿀 내용 |
|---|---|---|---|
| `src/Auth/BasicRegisterService.php` | `needsBasicRegister()` (40), `tutorAccountHasSlot1()` (54) | 과외지역 1번만 보고 기본정보 완료로 판정한다 | 필수 목록 전체를 보고 판정한다 |
| `public/api/auth/me.php` | 117줄에서 `needsBasicRegister()` 호출, 155줄 `needs_basic_register` 응답 | 위 판정을 그대로 내려 준다 | 판정 함수만 바뀌면 따라 바뀐다 |
| `src/Auth/OAuthRoleService.php` | 55줄에서 `needsBasicRegister()` 호출 | 같음 | 같음 |
| `src/Auth/BasicRegisterService.php` | `registerTutor()` (747) | 표시명, 주력과목, 지역만 받는다 | 필수 목록 전체를 받고 검사한다 |
| `src/Tutor/TutorRegisterService.php` | `saveStep()` (109), `saveBasic()` (415), `syncSubjects()` (826), `syncLessonPlaces()` (925), `syncImages()` (1011), `hydrateTutor()` (1109) | 카드 항목이 `basic`, `lesson`, `career`, `contact` 단계에 나뉘어 저장된다 | `basic` 단계에서 필수 목록 전체를 받고 검사한다. 미리 채우는 기본값을 없앤다 |
| `src/Registration/TutorHubService.php` | `publish()` (53), `publishMissing()` (96) | 공개하려면 상세등록 완료(110줄)와 소개문(112줄)까지 요구한다 | 공개 버튼의 의미는 열린 질문 8번 |
| `src/Tutor/TutorDetailCompletionEvaluator.php` | `evaluate()` (34) | 상세 완료 판정에 학교명 등이 들어간다 | 상세 완료 판정은 상세정보 항목만 보도록 정리한다(구체 목록은 구현 과제에서 확인) |

### 4-6. 검색과 홈 목록

- `src/Search/SearchService.php` `searchTutors()` 745줄. 노출 조건(747~752줄)은 숨김 제외, 탈퇴 제외, `tutorSlot1Sql()`(308줄, 과외지역 1번 있음)뿐이다. 바꿀 내용: 노출 조건을 필수 목록 전체로 바꾼다.
- 같은 함수의 조회 항목(830~841줄)과 응답 항목(895~927줄)에는 대상, 수업장소, 특징, 슬로건, 사진, 원생수가 없다. 바꿀 내용: 카드 항목을 모두 조회해서 내려 보낸다.
- `preview/home-ui/src/home-basic-live.js` `mapTutor()` 86줄. 검색 응답을 홈 카드 값으로 바꾸는 함수인데, 위 카드 항목 키가 없다. 바꿀 내용: 검색 응답의 카드 항목을 버리지 않고 넘긴다.
- `preview/search-ui/src/search-exposure-mapper.js` `mapToExposureItem()` 49줄. 과외쌤 분기(108~138줄)는 견본 데이터(`EXPOSURE_TUTORS`)를 `...base`(112줄)로 먼저 깔고 응답 값을 덮는다. 응답에 값이 없거나 비어 있으면 견본 값이 화면에 보인다. 이 문제는 7절 「관련 과제」의 별도 긴급 과제다.
- `scripts/verify-basic-exposure-gate.mjs`. 실행 방법은 3줄에 적혀 있다(`npx --prefix preview/home-ui vite-node scripts/verify-basic-exposure-gate.mjs`). 지금은 과외지역 1번 노출 게이트를 검사한다. 바꿀 내용: 같은 필수 목록으로 검사한다.

### 4-7. 카드

`preview/home-ui/src/exposure-render.js` `renderBasicTutorRow()` 831줄이 과외쌤 베이직카드를 그린다. 카드가 읽는 키는 아래와 같다.

| 카드 항목 | 키 | 줄 |
|---|---|---|
| 표시명, 성별 | `tutor_display_name`, `gender` | 856, 878~882 |
| 대상 | `grade_band` | 856, 890 |
| 과목 | `main_subject_note` | 857, 902 |
| 월 과외비 | `formatTutorFeeCard(item)` | 858, 899 |
| 위치 | `location_label` | 845~847, 861, 897 |
| 수업장소 | `lesson_places` | 862, 904 |
| 원생수 | `formatTutorStudentTarget(item)` (`exposure-format.js` 66줄, `student_gender_group`·`student_count_group`) | 863, 903 |
| 주 ○회·○분 | `lessons_per_week`, `minutes_per_lesson` | 841~844 |
| 특징 | 표 형태는 `feature_1`(865줄). 가로 카드 형태는 `featureTagList()`(740줄)로 특징 1~3을 최대 3개 보여 준다 | 865, 875~877 |
| 슬로건 | `distinctSlogan()` (745줄) | 867, 878 |
| 사진 | `image_path` | 889 |

가로 카드 형태는 특징 2·3이 있으면 베이직카드에도 보여 준다. 특징 2·3을 상세정보에 두는 이 정본과 함께 볼 점이므로 열린 질문 2번에 적었다.

### 4-8. 등록점검

- `preview/home-ui/src/tutor-reg/registration-check-copy.js` `TRC_BASIC_FIELD_IDS` 76~88줄. 지금 베이직 항목은 `display_name`, `main_subject`, `primary_region`, `lesson_places`, `fee`, `fee_basis`, `schedule`, `minutes`, `intro`, `university`, `profile_image` 이다. 대상, 특징, 슬로건, 원생수가 없고, 카드에 나오지 않는 짧은 소개와 학교가 들어 있다.
- 같은 파일 `TRC_PICK_FIELD_IDS` 91줄(`feature_1`, `student_target`), `TRC_PRIME_FIELD_IDS` 94줄(`intro_long`, `feature_2`, `feature_3`).
- `preview/home-ui/src/tutor-reg/registration-check-model.js` `tutorFieldOkMap()` 74줄, `BASIC_VIA_COMPLETE` 96줄, `basicIdsForTutor()` 98줄, `buildTutorRegistrationCheckModel()` 346줄(베이직 부족 개수 350줄, 배지 366줄).
- `preview/home-ui/src/tutor-reg/store.js` `getPublishReadiness()` 242~293줄. 공개 가능 여부에 상세등록 완료와 소개문을 요구한다.
- 바꿀 내용: 베이직 섹션은 이 정본의 필수 목록 하나로 센다. `BASIC_VIA_COMPLETE` 같은 예외를 두지 않는다. 기본정보를 다 넣은 과외쌤에게는 「베이직카드 N개 부족」이 나올 수 없다.
- 픽 추가 조건(`feature_1`, `student_target`)은 둘 다 기본 필수가 되므로 픽 추가 조건을 다시 정해야 한다(열린 질문 1번). 프라임 추가 조건(상세 소개, 특징 2·3)은 그대로 둔다.

### 4-9. 기본정보 화면으로 보내는 경로

- `preview/shared/auth-redirect.js` `resolveAfterAuthUrl()` 297줄. 로그인 뒤 서버 값 `needs_basic_register` 가 참이면 기본정보 화면으로 보낸다(316~318줄). 주소는 `basicRegisterPathForMe()`(197줄)가 만든다. 과외쌤에게도 이미 적용된다. 서버 판정만 필수 목록 전체로 바뀌면 된다.
- `preview/home-ui/src/auth-session.js` `fetchSession()` 89줄. 이미 로그인한 상태로 홈에 들어올 때 기본정보 화면으로 보내는 조건(136줄)이 학생(`guardian_student`)만이다. 바꿀 내용: 과외쌤도 보낸다.
- 기존 계정은 모두 테스트 계정이다. 판정이 바뀌면 기존 과외쌤 계정도 다음 로그인 때 기본정보 화면부터 만난다(사용자 결정).

---

## 5. 게이트 제안 (구현하지 않음)

### 5-1. 필수 목록은 한 곳에 둔다

- 서버(PHP) 한 곳과 화면(JS) 한 곳에만 필수 항목 목록을 둔다. 파일 이름 제안: `src/Tutor/TutorBasicRequiredFields.php`, `preview/shared/tutor-basic-required.js`. 두 파일 모두 아직 없다.
- 가입 기본정보, 마이페이지 기본정보, `/register/tutor` 기본 단계, 서버 저장 검사, 서버 미완료 판정, 검색 노출 조건, 등록점검 베이직 섹션이 모두 이 목록을 쓴다.

### 5-2. 검사 스크립트

- 이름 제안: `scripts/verify-tutor-basic-card-lock.mjs`, `package.json` 명령 `verify:tutor-basic-card`.
- 검사 항목:
  1. 서버 목록과 화면 목록의 항목 이름이 같다.
  2. 가입 기본정보, 마이페이지 기본정보, `/register/tutor` 기본 단계 화면에 목록의 모든 입력칸이 있고, 과외지역 2·3번만 선택이다.
  3. 상세정보 화면(마이페이지 상세정보, `/register/tutor` 수업·상세·연락 단계)에 목록 항목 입력칸이 없다.
  4. 서버 미완료 판정, 서버 저장 검사, 검색 노출 조건이 같은 목록을 쓴다. 목록 항목이 하나라도 빈 과외쌤은 미완료이고 검색에 나오지 않는다.
  5. 등록점검 베이직 섹션 항목이 목록과 같다. 목록을 모두 채운 견본 과외쌤의 베이직 부족 개수는 0이다.
  6. 검색 응답 한 건에 카드 항목 키가 모두 있다. 홈 `mapTutor()` 와 검색 화면 변환 함수가 그 키를 버리지 않는다.
  7. 카드 `renderBasicTutorRow()` 가 읽는 키(성별 제외)가 모두 목록 안에 있다.
  8. 필수 항목에 사용자 선택 없이 값을 채우는 코드(`'middle'`, `'mixed'`, `'solo'` 기본값)가 없다.
  9. 기본정보 미완료 과외쌤은 로그인 때와 홈 진입 때 모두 기본정보 화면 주소로 보내진다.
- 배포 게이트(`deploy.yml`)에 넣을지는 사용자가 정한다.

---

## 6. 충돌 문서

아래 문서는 이 정본과 어긋나는 부분이 있다. 과외쌤 기본정보와 베이직카드 항목에 관해서는 **이 정본(73)이 우선한다.** 이번 작업에서는 아래 문서 내용을 고치지 않고 목록만 남긴다.

| 문서 | 충돌하는 절 | 어긋나는 내용 |
|---|---|---|
| `docs/ssot/13-search-page-fields.md` | §4 과외쌤찾기 표 | 학교명(5행)과 경력구간(8행)을 「기본」 검색항목으로 둔다. 이 정본은 둘 다 상세정보 항목이다. 12행은 「원생수 표현 금지」라고 하지만, 카드는 「원생수」 라벨을 쓰고(`exposure-render.js` 863줄, 903줄) 사용자 결정 표도 「원생수」로 부른다 |
| `docs/ssot/13-search-page-fields.md` | §6 가입시 수집 원칙 | 「기본검색 항목 = 기본등록 필수」라고 한다. 이 정본은 「베이직카드 항목 = 기본정보 필수」가 기준이다 |
| `docs/ssot/14-registration-input-flow.md` | §4-3 과외쌤 | 기본등록 필수에 출신대학, 전공, 학적상태, 경력구간, 연령대, 주교재, 강의스타일 배지를 넣고, 슬로건, 특징, 프로필 사진은 넣지 않았다 |
| `docs/ssot/14-registration-input-flow.md` | §3 단계 표 5·6행 | 기본등록 뒤 상세등록에서 더 채우는 흐름을 전제로 한다. 이 정본은 상세정보가 카드 노출 조건이 아니다 |
| `docs/internal/45-tutor-expanded-complete-ssot.md` | §2 필수 필드, 상태 전이, §3, §7 | 상세 완료 필수에 학교명을 넣고, 검색 노출을 「공개(`published`)이면서 상세 완료(`expanded_complete`)」로 적었다. 현재 코드 `searchTutors()` 는 숨김만 빼므로 이미 코드와도 다르다. 이 정본은 검색 노출 조건을 기본정보 필수 목록으로 정한다 |
| `docs/internal/47-study-room-home-card-map.md` | 「입력 구간 × 홈 자리」 표 | 공부방 문서다. 베이직카드 항목(가격, 원생수, 수업형태)을 상세정보 1단계에서 받는 구조다. 이 정본은 과외쌤만 다루므로 공부방에는 바로 적용하지 않는다. 같은 원칙을 공부방 후속 정본에서 적용할지 정해야 한다 |
| `docs/internal/48-tutor-home-card-map.md` | 머리말, 「입력 구간 × 홈 자리」 표 | 「베이직 노출 = 공개만으로 들어가는 일반 목록」이라고 적었다. 표는 대상, 월·주·분, 수업장소, 학생구성을 상세 1단계에, 특징1과 슬로건을 상세 2단계에 두었다. 강의스타일을 베이직 항목에 넣었고, 베이직 프로필 사진은 없다 |
| `docs/internal/58-card-copy-tier-matrix.md` | 과외쌤 Basic 행 | 슬로건 칸을 「`slogan` 또는 `feature_1`」로 적었다. 현재 코드 `distinctSlogan()`(745줄)은 슬로건만 쓰고 특징과 같으면 숨긴다. 이 정본은 슬로건이 필수이므로 대체 표시가 필요 없다 |
| `docs/internal/69-publish-inquiry-region-address-fix.md` | §1 확정 정책 표 | 「베이직 노출 = `published` 만으로 가능 (빈 상세 허용)」. 공부방 계정 실측 문서이지만 일반 규칙처럼 적혀 있다. 과외쌤에서는 이 정본이 우선한다 |
| `docs/internal/69-paid-storefront-shell-fit.md` | 없음 | 유료상품 화면 치수 문서다. 번호만 같고 이 정본과 충돌하지 않는다 |

---

## 7. 관련 과제

1. **검색 화면 견본 값 덮어쓰기 (긴급, 이 정본의 선행 조건).** `preview/search-ui/src/search-exposure-mapper.js` `mapToExposureItem()` 과외쌤 분기가 견본 데이터 `EXPOSURE_TUTORS` 를 `...base`(112줄)로 먼저 깔고, 113~131줄에서 응답 값이 없으면 견본 값을 쓴다. 그래서 실제 과외쌤 카드에 견본 값이 섞여 보일 수 있다. 이 문제를 먼저 고치지 않으면 필수 항목이 비어 있어도 화면에서는 채워진 것처럼 보여 검수가 틀어진다.
2. **성별 `'male'` 기본값 버그.** 3-1절 표의 세 곳. 계정 범위이므로 별도 과제로 한다.
3. **정본 72 지역 단위 변경** (브랜치 `cursor/region-unit-lock-20261008`, 미배포). 열린 질문 6번 참고.

---

## 8. 열린 질문

1. **픽 추가 조건.** 지금 픽 추가 조건은 특징 1과 원생수(`TRC_PICK_FIELD_IDS`)다. 둘 다 기본 필수가 되므로 픽에 무엇을 더 요구할지 다시 정해야 한다.
2. **특징 몇 개를 필수로 할지.** 제안은 특징 1개(`feature_1`)다. 다만 가로 카드 형태는 특징 2·3이 있으면 베이직카드에도 보여 주므로, 베이직카드에서 특징을 1개만 보여 줄지도 함께 정해야 한다.
3. **과외비 산정방식 포함 여부.** `tutors.fee_basis_type`(주 횟수 기준 또는 월 총 횟수 기준)을 기본정보 필수에 넣을지 정해야 한다. 월 총 횟수 기준을 고르면 `monthly_session_count` 를 받는데, 카드는 주 ○회·○분만 보여 준다. 이 관계도 함께 정한다.
4. **가입 화면 구성.** 필수 항목이 12개(과외지역 2·3번 포함)로 늘어난다. 한 화면에 모두 둘지, 여러 단계로 나눌지 정해야 한다. 단계로 나누면 중간 이탈 때 어디부터 다시 보여 줄지도 정한다.
5. **사진 업로드 방식.** 지금 사진은 마이페이지 사진 편집기(`profile-photos.js` `renderTutorProfilePhotoEditor()` 377줄)가 `/api/tutor/profile-image.php` 로 올린다. 가입 기본정보 단계에서 같은 방식을 쓸 수 있는지, 과외쌤 행이 만들어지기 전에 사진을 받을 수 있는지는 미확인이다.
6. **지역 단위 작업(정본 72)과의 순서.** 72 브랜치는 `preview/shared/tutor-region-slots.js`, `src/Tutor/TutorRegisterService.php`, `src/Registration/TutorHubRepository.php` 를 고친다. `tutor-region-slots.js` 는 세 기본정보 화면(가입 기본정보, 마이페이지 기본정보, `/register/tutor` 기본 단계)이 함께 쓰는 지역 칸이고, `TutorRegisterService.php` 는 이 정본의 구현에서도 고칠 파일이다. 지시서에 적힌 `signup-basic.js`, `tutor-reg/screens.js`, `inline-save.js`, `tutor-ui` `step-basic.js` 는 72 브랜치 변경 목록에 직접 들어 있지 않았다(`git diff --name-only origin/main...origin/cursor/region-unit-lock-20261008` 로 확인). 어느 작업을 먼저 병합할지 정해야 한다.
7. **공부방과 학생.** 같은 원칙을 공부방·학생 카드에도 적용할지는 후속 정본에서 정한다.
8. **공개 버튼의 의미.** 지금 공개 검사(`TutorHubService::publishMissing()`, `store.js` `getPublishReadiness()`)는 상세등록 완료와 소개문을 요구한다. 그런데 검색은 공개 여부를 보지 않고 숨김 여부만 본다. 「기본정보 완료 = 베이직카드 노출」과 공개 버튼을 어떻게 맞출지 정해야 한다.
9. **대상(학교급) 입력 방식.** 학교급을 1개만 받을지 여러 개 받을지, `grade_band` 컬럼을 쓸지 정해야 한다.
10. **짧은 소개.** 짧은 소개(`intro_short`)는 지금 등록점검 베이직 항목이지만, 베이직카드에는 나오지 않는다(정본 58). 기본 필수에서 빼고 상세정보로 두는 것이 맞는지 확인이 필요하다.
11. **기존 행의 자동값.** 기존 테스트 계정 중 `'middle'`, `'mixed'`, `'solo'` 가 자동으로 들어간 행을 「입력됨」으로 볼지, 다시 입력받을지 정해야 한다. 자동으로 들어간 값인지 사용자가 고른 값인지 구분할 방법은 미확인이다.

---

## 9. 레드라인 (제안)

1. 베이직카드 항목은 기본정보에서만 받는다. 상세정보에서 다시 묻지 않는다.
2. 필수 목록은 서버 한 곳, 화면 한 곳에만 두고, 모든 화면과 서버 검사가 그 목록을 쓴다.
3. 필수 항목에 사용자가 고르지 않은 값을 미리 채우지 않는다.
4. 카드에서 항목을 빼는 방식으로 미완료 문제를 풀지 않는다.
5. 검색 화면과 홈 목록은 응답 값이 비었을 때 견본 값으로 채우지 않는다.
6. 기본정보 미완료 과외쌤은 검색과 홈 베이직 목록에 나오지 않는다.

---

## 10. 배포 전 사용자 할 일

- 이번 커밋은 문서만 추가한다. 배포해도 사이트 동작은 바뀌지 않는다.
- SQL: 새 컬럼은 필요 없어 보인다. 필수 목록의 모든 항목이 `sql/schema/008_tutors.sql` 에 이미 있는 테이블과 컬럼이다(코드 기준 확인). 운영 데이터베이스에 그 컬럼이 실제로 모두 있는지는 미확인이다. 기존 행의 자동값을 정리하는 SQL이 필요한지는 열린 질문 11번을 정한 뒤 판단한다(미확인).
- 환경변수, Secrets, `.htaccess`: 변경할 것이 없을 것으로 본다.
- 결정할 것: 이 정본 승인, 열린 질문 1~11 답변, 관련 과제(검색 견본 값 덮어쓰기)를 먼저 처리할지, 정본 72와의 작업 순서.
