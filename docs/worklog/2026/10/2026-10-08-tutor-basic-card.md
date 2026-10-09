# 2026-10-08 과외쌤 기본정보 필수 항목 = 베이직카드 항목 (정본 73)

- 브랜치: `cursor/tutor-basic-card-20261008` (기준 `origin/main` `bc76015`)
- worktree: `d:\work\study114\.wt\tutor-basic-card`
- 정본: `docs/internal/73-tutor-basic-card-lock.md`
- 작업 종류: 문서만 작성. 코드는 바꾸지 않았다.
- 위험도: 낮음 (문서만). 정본 승인 뒤 이어질 구현 과제는 위험도 높음(가입·마이페이지·서버·검색이 함께 바뀜)으로 보고 다른 모델의 독립 리뷰가 필요하다.

## 사용자 결정 원문 (2026-10-08)

- 「계정을 만들고, 기본정보를 모두 입력해야 베이직카드가 노출이 돼. 즉 등록이 된거지. 만약 중간에 이탈되면 다음 로그인시 이 기본정보 등록화면부터 만나게 돼.」
- 「베이직카드에 들어가는 항목은 기본등록단계에서 받아야 해. 필수로. 선택은 과외지역 2번 3번만 선택이야. 왜냐하면 기본등록 후에 상세등록에서 또 항목을 채워야 카드노출이 된다면 이중으로 동선이 생겨...」
- 「계정은 기본정보 입력 전 단계이니, 계정과 관련된 것은 범위에서 제외돼」
- 「카드에서 빼면 안돼. 기본정보입력으로 올려야 돼.」
- 「증빙자료 제외... 이건 상세정보입력에 가야 해.」
- 「네가 표로 제시한거 전부 필수로 넣으면 돼. 저건 노출되어야 해.」

## 작업 내용

1. 새 worktree와 브랜치를 만들었다. 같은 이름의 worktree와 브랜치가 없음을 먼저 확인했다.
2. 문서 번호를 정했다. `docs/internal` 의 마지막 번호는 71이고, 원격 브랜치 `cursor/region-unit-lock-20261008` 가 72를 쓰고 있다. 원격 브랜치 전체와 로컬 브랜치 전체에서 `docs/internal/7*-` 파일을 찾아보니 71과 72만 쓰이고 있었다. 그래서 73으로 정했다.
3. 지시서에 적힌 파일과 함수를 worktree에서 직접 검색해 위치와 줄 번호를 확인한 뒤 정본에 적었다. 확인하지 못한 것은 정본에 「미확인」으로 적었다.
4. `docs/internal/73-tutor-basic-card-lock.md` 를 새로 만들었다. 목적과 원칙, 필수 항목 표, 범위 밖, 화면별 적용 지점, 게이트 제안, 충돌 문서 표, 관련 과제, 열린 질문, 레드라인 제안, 배포 전 사용자 할 일을 담았다.
5. `docs/internal/README.md` 문서 목록에 73번 한 줄을 더했다.
6. 충돌 문서(`docs/ssot/13`, `docs/ssot/14`, `docs/internal` 45·47·48·58·69)는 내용을 고치지 않고 정본 6절에 목록만 남겼다.

### 지시서와 다르게 확인된 사실

조사하면서 지시서 내용과 실제 코드가 다른 점을 찾았다. 정본에는 실제 코드 기준으로 적었다.

1. 과외비 산정방식 컬럼 이름은 `fee_basis` 가 아니라 `tutors.fee_basis_type` 이다. 등록점검 항목 이름으로는 `fee_basis` 를 쓴다.
2. 대상(학교급)은 「어디에도 없음」이 아니다. 가입 기본정보와 마이페이지에는 입력칸이 없지만, `/register/tutor` 수업 단계(`step-lesson.js` 49줄)와 상세 단계(`step-detail.js`)의 과목 행에는 학교급 선택칸이 있다. 또 `TutorRegisterService::syncSubjects()` 836줄도 과목 목록이 비면 `'middle'` 로 채운다.
3. 카드의 대상 값은 `tutor_subject_targets.grade_band` 가 아니라 `school_level` 을 읽어 만든다(`TutorHubRepository::gradeBand()` 225줄).
4. 정본 72 브랜치가 직접 고치는 파일은 `preview/shared/tutor-region-slots.js`, `src/Tutor/TutorRegisterService.php`, `src/Registration/TutorHubRepository.php` 이다. 지시서에 적힌 `signup-basic.js`, `tutor-reg/screens.js`, `inline-save.js`, `tutor-ui` `step-basic.js` 는 72 브랜치 변경 목록에 직접 들어 있지 않다. 다만 이 네 화면이 함께 쓰는 지역 칸 파일(`tutor-region-slots.js`)을 72 브랜치가 고치므로 순서 조율은 여전히 필요하다.
5. 성별 `'male'` 기본값은 화면 표시에서 그치지 않을 수 있다. 마이페이지 기본정보 저장이 `'male'` 을 보내면 `TutorRegisterService::saveStep()` 192줄이 `ProfileGenderSync::sync()` 를 불러 `user_profiles.gender` 에 저장한다. 별도 버그 과제에 이 경로를 함께 적어야 한다.
6. 원생수(`student_gender_group`, `student_count_group`)도 마이페이지 화면과 저장 코드가 `'mixed'`, `'solo'` 를 미리 채운다. 필수로 받는다는 결정과 맞지 않으므로 정본 2-1절에 따로 적었다.
7. `docs/internal` 의 69번은 두 문서다. 충돌하는 것은 `69-publish-inquiry-region-address-fix.md` 이고, `69-paid-storefront-shell-fit.md` 는 충돌하지 않는다.

### 미확인 목록

- ~~노션 정본 UDX-STD-002 원문 대조~~ (2차에서 해제. 메인이 노션 원문을 직접 읽어 전달했다.)
- `/register/tutor` 화면에 슬로건 입력칸이 있는지 (상태값과 저장값에는 있으나 화면 파일에서는 검색으로 찾지 못했다).
- 가입 단계에서 과외쌤 행이 만들어지기 전에 사진을 올릴 수 있는지.
- 운영 데이터베이스에 필수 항목 컬럼이 모두 있는지.
- 기존 행의 자동값을 정리하는 SQL이 필요한지.
- 자동으로 들어간 값과 사용자가 고른 값을 구분할 방법.
- 상세 완료 판정(`TutorDetailCompletionEvaluator::evaluate()`)에서 뺄 항목의 구체 목록.

## 확인 명령

worktree `d:\work\study114\.wt\tutor-basic-card` 에서 실행했다.

```powershell
git -C d:\work\study114 fetch origin
git -C d:\work\study114 worktree add d:\work\study114\.wt\tutor-basic-card -b cursor/tutor-basic-card-20261008 origin/main
Get-ChildItem docs/internal -Name
git branch -r
git ls-tree --name-only <각 브랜치> docs/internal/
git diff --name-only origin/main...origin/cursor/region-unit-lock-20261008
rg -n "function |..." preview/auth-ui/src/screens/signup-basic.js
rg -n "function renderBasicForm|function renderDetailForm" preview/home-ui/src/tutor-reg/screens.js
rg -n "function |'male'|gender" preview/home-ui/src/tutor-reg/inline-save.js
rg -n "getPublishReadiness" preview/home-ui/src/tutor-reg/store.js
rg -n "TRC_BASIC_FIELD_IDS|TRC_PICK_FIELD_IDS|TRC_PRIME_FIELD_IDS|BASIC_VIA_COMPLETE" preview/home-ui/src
rg -n "export function|male|gender" preview/tutor-ui/src/screens/step-basic.js
rg -n "school_level|lesson_places|fee_basis_type|feature_1|slogan|proof_document" preview/tutor-ui/src/screens
rg -n "function |middle|region" src/Auth/BasicRegisterService.php
rg -n "function |'male'|gender" src/Tutor/TutorRegisterService.php
rg -n "function " src/Registration/TutorHubService.php
rg -n "function searchTutors|function tutorSlot1Sql" src/Search/SearchService.php
rg -n "function renderBasicTutorRow|function featureTagList|function distinctSlogan" preview/home-ui/src/exposure-render.js
rg -n "function mapTutor" preview/home-ui/src/home-basic-live.js
rg -n "EXPOSURE_TUTORS|\.\.\.base" preview/search-ui/src/search-exposure-mapper.js
rg -n "needs_basic_register|needsBasicRegister" src public/api
rg -n "function |needs_basic" preview/shared/auth-redirect.js preview/home-ui/src/auth-session.js
rg -n "grade_band|slogan|feature_1|fee_basis_type" sql/schema
rg -n "^#{1,4} " docs/ssot/13-search-page-fields.md docs/ssot/14-registration-input-flow.md docs/internal/45-*.md docs/internal/47-*.md docs/internal/48-*.md docs/internal/58-*.md docs/internal/69-*.md
```

빌드: 실행하지 않았다(문서만 바꿨으므로 빌드 산출물에 영향이 없다).

1차 커밋: `37b96e4` (push 완료). 메인 확인: `fee_basis_type`, `school_level` 지적이 맞다고 확인함.

## 사용자 추가 결정 (2026-10-08 21:04~21:07)

### 추가 확정 1: 픽·프라임 추가 조건

사용자 원문: 「맞아」, 「아마 그것들은 상세정보에서 받을거야」.

- 베이직 = 기본정보 필수 11개(기존 표).
- 픽 추가(상세정보에서 받음) = 학교·학과 또는 경력, 주교재, 강의스타일 1개.
- 프라임 추가(상세정보) = 픽 조건 + 소개 + 특징 2·3 + 강의스타일 3개까지.
- 학적(`university_status`)·증빙자료도 상세정보에서 받고 픽·프라임 카드에 표시.

### 추가 확정 2: 일관성 원칙

사용자 원문: 「가입단계에서 기본등록정보, 상세정보(1또는 2), 마이페이지에서의 레이아웃, 카드에서의 구성 등이 일관되게 동일해야 해.」

- 항목 목록 하나(단일 정의). 항목마다 라벨, 입력 방식, 받는 단계(기본정보·상세 1·상세 2), 필수 여부, 표시 카드 등급(베이직·픽·프라임), 순서를 둔다. 가입 기본정보, `/register/tutor` 기본·상세 1·2, 마이페이지 기본·상세 탭, 등록점검, 베이직·픽·프라임 카드가 이 목록을 따른다.
- 순서(노션 공통 순서): 1 표시명, 2 과외지역, 3 대상, 4 과목, 5 과외비·주○회·○분, 6 수업장소·원생수, 7 신뢰정보(학교·경력·학적·증빙, 상세), 8 특징·슬로건·소개, 9 공개 설정. 카드는 「신원, 주요 비교 메타, 짧은 설명, 행동」 안에서 같은 순서.
- 화면 틀: 공부방 등록 화면을 기준으로 준용.

### 노션 UDX-STD-002 원문 (메인이 노션에서 직접 읽음, 2026-09-24 편집본)

- 2-2: 「기본등록: Basic 카드에 표시되는 모든 사용자 입력값을 받는 단계다. Basic 카드의 사용자 입력 필드는 기본등록과 1:1로 연결한다. 가입정보에서 먼저 받은 값은 기본등록에 미리 채워 수정 가능하게 한다.」
- 2-3: 「상세등록: Basic 카드 항목을 반복해서 받는 단계가 아니다.」
- 2-4: 「같은 의미의 값을 가입정보·기본등록·상세등록에서 각각 다른 필드로 만들지 않는다.」
- 6: 과외쌤 Basic 카드 정보 우선순위 = 표시명 또는 과외 제목 / 활동지역 / 대상·과목 / 방문·온라인·혼합 등 수업 형태 / 경력 또는 대표 특징 / 조건부 대표 과외비 / 짧은 소개 / 증빙자료 보유 여부. 「위 사용자 입력값을 기본등록에서 모두 받는다. 활동지역은 1·2·3을 제공하고 1만 필수다.」
- 8: 「공부방 등록 페이지를 기준 화면으로 사용한다. 모든 역할이 그대로 준용: 페이지 Shell과 콘텐츠 폭, 상단 제목·설명·단계 표시, 입력 섹션 순서와 여백, 라벨·도움말·필수/선택 표기, 저장·이전·다음 버튼 위치, 필드별 오류 표시와 로딩 복구, 임시저장·재진입·완료 흐름, 미리보기·공개 구조. 공통 항목 순서 1 이름·표시명 2 지역 3 대상 4 과목 5 가격·예산 6 수업 방식과 조건 7 역할별 신뢰정보 8 짧은 소개·요청 9 공개 관련 설정.」
- 12: 「기존 화면의 필수/선택 표기와 실제 검증 규칙은 일치해야 한다. 필수값의 범위 자체를 바꾸는 일은 별도 정책 조율 후 정본문서와 검증 규칙을 함께 수정한다.」
- 노션 대비 사용자 변경점: 증빙은 상세로. 과외비(노션은 조건부)·사진·횟수·시간·원생수·슬로건도 베이직 필수(사용자 「전부 필수로 넣으면 돼. 저건 노출되어야 해.」).

### 메인 권고

- 작업 순서: 정본 72(지역 단위)를 먼저, 73을 다음에 한다. 지역 칸 구조가 정해져야 기본정보 배치를 확정할 수 있다.

## 2차 작업 내용

1. 정본 73을 다시 구성했다. 3절 픽·프라임 추가 조건(확정), 4절 단일 항목 목록(베이직 11개, 픽·프라임 추가, 상세 전용, 공통 순서, 카드 배치 순서, 공부방 화면 틀 준용), 5절 현재 어긋남 비교표(입력 화면 8곳, 카드 4종)를 더했다.
2. 1-3절에 노션 원문을 인용하고 노션 6장과 다른 점을 표로 정리했다. 「미확인」을 해제했다.
3. 열린 질문을 닫은 질문(픽 추가 조건, 노션 대조, 일관성 기준)과 남은 질문 13개로 나눴다. 작업 순서 질문에 메인 권고를 적었다.
4. 게이트 제안에 「각 화면·카드의 항목 순서·라벨이 단일 목록과 같은지」, 「필수 표시와 검사 규칙이 같은지」, 「저장이 화면에 없는 항목을 지우지 않는지」 검사를 더했다.

### 2차 조사에서 새로 확인한 사실

1. **마이페이지 상세정보 저장이 데이터를 지울 수 있다.** 마이페이지 상세 탭에는 경력, 주교재, 강의스타일, 증빙 입력칸이 없다. 그런데 저장 함수 `saveTutorDetailInline()`(`inline-save.js` 127~138줄)이 이 항목을 빈 값으로 서버에 보내고, 서버 `saveCareer()`(631줄)와 `syncStyleBadges()`(965줄, 979줄 삭제)가 그대로 덮어쓴다. `/register/tutor` 에서 넣은 값이 마이페이지 상세 저장 한 번으로 지워질 수 있다. 코드 읽기로 확인했고 실행 확인은 하지 않았다. 정본 10절 2번에 별도 버그로 기록했다.
2. 마이페이지 상세 탭만으로는 픽 조건(경력, 주교재, 강의스타일)을 채울 수 없다. 입력칸이 `/register/tutor` 연락·상세 단계에만 있다.
3. 프라임 카드의 「소개」 칸은 `intro_short` 를 보여 주지만, 등록점검 프라임 조건은 `intro_long` 이다. 남은 질문 9번으로 올렸다.
4. 마이페이지 상세 탭은 특징 1과 상세 소개에 필수 표시를 하지만, 저장 검사는 두 항목을 검사하지 않는다(노션 12장 위반 예).
5. 모든 기본정보 화면에서 과목이 과외지역보다 앞에 있다. 공통 순서(지역, 대상, 과목)와 다르다.
6. `/register/tutor` 에는 특징 3, 소개, 사진 입력칸이 없다(`step-contact.js` 107줄 「사진 업로드는 곧 연결됩니다」).
7. 공부방 등록 화면 틀 함수(`study-room-ui/src/layout.js` 159줄)와 과외쌤 틀 함수(`tutor-ui/src/layout.js` 80줄)를 하나씩 대조하지는 않았다(미확인).

### 2차 확인 명령

```powershell
rg -n "function tutorTableRows|function renderTutorOverlayBottomGrid|featureMax|verifyMax|showIntro|function renderPickTutor|function renderPrimeTutor" preview/home-ui/src/exposure-render.js
rg -n "main_material_note|teaching_style_badges|career_year_band|university_status|university_name|major_name|proof_document_available|intro_short" preview/home-ui/src/tutor-reg/screens.js preview/tutor-ui/src/screens preview/tutor-ui/src/form-collect.js
rg -n "main_material_note|teaching_style_badges|career_year_band" preview/home-ui/src/tutor-reg
rg -n "CREATE TABLE tutor_teaching_style_badges|CREATE TABLE tutor_verification_documents" sql/schema
rg -n "form-label|renderSectionTitle\(|label:" preview/tutor-ui/src/screens/step-lesson.js preview/tutor-ui/src/screens/step-contact.js preview/tutor-ui/src/screens/step-detail.js
rg -n "reqMark\(\)" preview/home-ui/src/tutor-reg/screens.js
rg -n "private function optionalEnum" src/Tutor/TutorRegisterService.php
rg -n "^\s+[a-z_]+: \{ render" preview/study-room-ui/src/main.js
rg -n "export function renderRegisterShell" preview/study-room-ui/src preview/tutor-ui/src
```

## 검수

검수: 대기

## 사용자 잠금 — 2026-10-08 21:21 (최우선 정책)

사용자 원문: 「맞아. 지금 결정한 것들은 가장 최우선 정책이므로 잠근다.」

아래 결정은 노션 정본보다 우선한다. 노션 문서는 그록봇이 갱신 중이라 일부가 옛 내용일 수 있다(사용자 21:20). 갱신된 노션과 다른 점이 있으면 고치지 말고 차이만 정리해 사용자에게 묻는다.

1. 계정을 만들고 기본정보를 모두 입력해야 베이직카드가 노출된다. 중간에 이탈하면 다음 로그인 때 기본정보 화면부터 만난다.
2. 계정 단계에서 받는 항목(성별 등)은 이 정책의 범위 밖이다.
3. 베이직카드 항목은 카드에서 빼지 않고 모두 기본정보 단계에서 필수로 받는다. 표시명, 과외지역 1번, 대상(학교급), 과목, 수업장소, 특징, 슬로건, 월 과외비, 프로필 사진, 주 ○회·○분, 원생수(지도 대상 성별·수업인원)다. 선택은 과외지역 2번과 3번뿐이다.
4. 증빙자료는 상세정보에서 받는다.
5. 픽 추가 조건은 상세정보에서 받는 학교·학과 또는 경력, 주교재, 강의스타일 1개다. 프라임 추가 조건은 픽 조건에 소개, 특징 2·3, 강의스타일 3개까지를 더한 것이다. 학적과 증빙도 상세정보에서 받아 픽·프라임 카드에 보여 준다.
6. 가입 기본정보, 상세정보(1·2단계), 마이페이지 화면 구성, 카드 구성은 같은 항목 목록, 같은 순서, 같은 라벨로 일관되게 맞춘다.

## 승인

승인: 대기(사용자)
