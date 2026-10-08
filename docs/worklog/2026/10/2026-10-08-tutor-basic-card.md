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

- 노션 정본 UDX-STD-002 원문 대조 (이번 작업에서 노션을 열지 않았다. 인용은 지시서 기준).
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

## 검수

검수: 대기

## 승인

승인: 대기(사용자)
