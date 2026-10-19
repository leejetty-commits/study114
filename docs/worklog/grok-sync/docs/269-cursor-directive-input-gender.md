# 269 지시서 — 입력 폭·라벨 정리(248 묶음 9번): 상세등록 1단계 라디오 글자 깨짐, 확대카드 라벨 2개, 학생 성별 입력 시작선 맞춤

> **상태: 확정본 (2026-10-20 종현 승인 완료).** 이 문서에 적은 것만 확정이다. 아래에 없는 문구·수치·구조는 임의로 만들거나 함께 고치지 마라.
> 이 문서가 저장소에 올라가 있어도 **시작 조건(1장)을 충족하기 전에는 착수하지 마라.** 조건이 안 맞으면 코드를 고치지 말고 보고하고 멈춰라(8장).

- 작업 번호: 269
- 날짜: 2026-10-20
- 브랜치 이름: `cursor/269-input-gender-20261020`
- 로컬 정식본: `/workspace/study114/handoffs/269-input-gender-directive-2026-10-20.md`
- 저장소 경로: `docs/worklog/grok-sync/docs/269-cursor-directive-input-gender.md`
- 기준 코드: 최신 `origin/main` (`665a8db110f7ab46921fd0cde72a3aaca84db4ff`, `Merge branch 'cursor/268-empty-copy-20261020' into main`, 268 병합 완료, 이 지시서 작성 시점) 이후. **이 해시를 고정 기준으로 착수하지 마라.** 시작 조건을 맞춘 뒤 최신 `origin/main`에서 다시 확인한다(1장).
- 성격: 과외쌤 248 묶음 **9번 3건**을 묶은 작업이다. (1) 과외쌤 상세등록 1단계 라디오 카드 글자가 음절 단위로 꺾이는 문제, (2) 과외쌤 확대카드(상세) 라벨 2개 교체, (3) 학생 상세에서 「학생 성별」 입력 시작선이 옆 칸과 어긋나는 문제. **표시(CSS·라벨 문자열)만 바꾼다. 값·저장 로직·가져오는 함수·렌더 구조는 바꾸지 않는다. 지시서 작성 단계에서는 앱 코드를 고치지 않았다. 코드 수정은 이 지시서를 받은 작업자만 한다.**

> 쉬운 말 안내: 상세등록 첫 화면의 선택 카드 글자가 「단/독」「4명/이상」처럼 음절로 찢어져 보입니다. 글자를 줄이지 않고, 한 단어가 한 줄에 들어가게 하고 자리가 없으면 카드째 다음 줄로 넘깁니다. 이 고침은 그 화면에만 걸리게 좁힙니다. 또 확대카드에서 「성별」「원생수」라고만 적혀 뜻이 흐린 라벨 2개를 「과외쌤 성별」「학생구성」으로 바꿉니다(값은 그대로). 학생 상세에서는 힌트(작은 안내)가 없는 「학생 성별」 칸만 입력칸이 위로 붙어 옆 칸과 시작선이 어긋나는데, 안내 문구를 다시 넣지 않고 CSS로 시작선만 맞춥니다.

---

## 0. 종현 확정 (2026-10-20 — 전부 결정 완료, 임의로 바꾸지 마라)

| # | 항목 | 확정안 |
|---|---|---|
| 1 | 출처 묶음 | 과외쌤 248 묶음 **9번 3건**만 한다. 아래 5장의 1·2·3번이 전부다. |
| 2 | 라디오 (L-11) | 과외쌤 상세등록 1단계(`preview/tutor-ui/src/screens/step-lesson.js` 화면)에만 한정한다. 라벨이 음절 단위로 꺾이지 않게 `white-space: nowrap` 류 + 자리가 없으면 그룹(카드)이 다음 줄로 넘어가는 `flex-wrap` 방식. **이 화면 전용으로 좁히는 방법(전용 클래스 추가)을 5-1로 확정한다.** 공용 CSS를 무범위로 고치지 마라. **글자 크기 축소 금지.** |
| 3 | 확대카드 라벨 (L-19) | `preview/home-ui/src/detail-decision/tutor-detail.js`에서 「성별」→「과외쌤 성별」, 「원생수」→「학생구성」으로 **라벨만** 교체. 값·가져오는 곳(`formatGender`, `formatTutorStudentTarget`) 변경 금지. 베이직·가로카드(`exposure-render.js`) 라벨은 **이번 범위 밖**이다. |
| 4 | 학생 성별 높이 | `preview/home-ui/src/styles/student-detail.css`에 그리드 안 입력 시작선을 맞추는 규칙(약 3줄, 5-3 확정 선택자). **안내 문구(힌트) 다시 넣기 금지, `student-reg/screens.js` 렌더 구조 변경 금지.** 힌트 있는 다른 칸·모바일 1열에 영향 없게 한다. |
| 5 | 커밋 분리 | **커밋 2개 분리 권장: 커밋 1 = 라디오+확대카드, 커밋 2 = 학생 높이.** 자연스러우면 3개(라디오/확대카드/학생 높이)까지 허용하되 **섞지 마라**(3장). |

이 표와 어긋나는 방식을 작업자가 임의로 고르지 마라. 확정안대로 하려면 허용 파일 밖이 필요해지면 고치지 말고 중단 보고하라(8장).

---

## 1. 시작 조건 (하나라도 안 맞으면 착수 금지)

1. **268이 병합된 최신 `origin/main`에서 시작한다.** 착수 전에 `git fetch` 하고, 이 지시서 작성 기준 커밋 `665a8db1`가 최신 `origin/main`의 조상(ancestor)인지 확인한다. 확인이 안 되면 착수하지 말고 보고하고 멈춰라.
2. 위가 확인된 뒤 **최신 `origin/main`에서** 새 브랜치 `cursor/269-input-gender-20261020`를 만든다. 이미 같은 이름의 브랜치가 있으면 새로 파지 말고 그 존재와 상태를 보고에 적고 멈춰 확인을 받아라.
3. 작업 시작 전 `git status`가 깨끗한지 확인한다. 더럽혀져 있으면 그 내용을 보고에 적고 멈춰라.
4. `main`에서 직접 작업하지 마라. **push까지만 한다. `main` 병합·배포·force-push 금지.** 병합·배포는 우동공과2 검수·종현 승인 뒤에만 한다.
5. 운영 DB를 직접 고치지 마라. 마이그레이션·SQL 적용은 이 작업에 포함되지 않는다.
6. 기준 커밋 확인 명령(완료 보고에 그대로 적어라):

```bash
git fetch origin
git rev-parse origin/main
git merge-base --is-ancestor 665a8db110f7ab46921fd0cde72a3aaca84db4ff origin/main && echo ANCESTOR-OK
git status --short
git checkout -b cursor/269-input-gender-20261020 origin/main
```

---

## 2. 전수 확인 결과 (기준 `origin/main` `665a8db1` — 실제 파일:줄, 2026-10-20 직접 확인)

줄 번호는 `665a8db1` 기준 참고값이다. 최신 `origin/main`에서 줄이 밀렸으면 같은 함수·문장·선택자를 찾아 확인하고, 내용이 2장과 크게 다르면 억지로 맞추지 말고 멈추고 보고하라(8장).

### 2-1. L-11 라디오 카드 글자 깨짐 — 화면·라벨·공용 CSS 근거

실제 화면: `preview/tutor-ui/src/screens/step-lesson.js` `renderLesson()` (`:56-119`). 이 파일이 과외쌤 **상세등록 1단계(수업·가격)** 화면이다.

| 확인 | 실제 위치 (`665a8db1`) |
|---|---|
| 라디오 마크업 헬퍼 | 같은 파일 `:25-35` `radios(name, options, selected)` — `<label class="form-radio"><input type="radio" … /><span class="form-radio__label">…</span></label>`를 찍는다. |
| 라디오 그룹 ① 지도 대상 성별 | 같은 파일 `:79-83` `<div class="register-grid-2">` 안 `<div class="form-radio-group">${radios('student_gender_group', GENDER_GROUP_OPTIONS, …)}</div>` (`:82`) |
| 라디오 그룹 ② 수업인원 | 같은 파일 `:84-87` `<div class="form-radio-group">${radios('student_count_group', STUDENT_COUNT_OPTIONS, …)}</div>` (`:86`) |
| 라디오 그룹 ③ 과외쌤 연령대 | 같은 파일 `:89-92` `<div class="form-radio-group">${radios('age_band', AGE_BAND_OPTIONS, …)}</div>` (`:91`) |
| 라디오 그룹 ④ 산정방식 | 같은 파일 `:96-100` `<div class="form-radio-group">${feeBasis}</div>` (`:99`). `feeBasis` 마크업은 `:65-71`에서 같은 `form-radio`/`form-radio__label` 구조로 찍힌다. |
| 폼 요소 (전용 클래스를 걸 자리) | 같은 파일 `:75` `<form data-form="lesson">` — 지금은 클래스가 없다. 5-1에서 여기에 전용 클래스 1개를 추가한다. |
| 라벨 정본 (값·문구 변경 금지) | `preview/tutor-ui/src/state.js:37-41` `GENDER_GROUP_OPTIONS`(남학생·여학생·혼성), `:43-48` `STUDENT_COUNT_OPTIONS`(**단독**·2명·3명·**4명 이상**), `:50-58` `AGE_BAND_OPTIONS`(**20대 전반**·20대 후반·30대 전반·30대 후반·40대 전반·40대 후반·50대 이상), `:78-81` `FEE_BASIS_OPTIONS`(주 회수 기준·월 총 횟수 기준). 실측 대상 「단독」「4명 이상」「20대 전반」이 여기서 나온다. **이 파일은 허용 파일이 아니다. 라벨 문구·값을 바꾸지 마라.** |

**왜 꺾이는가 (공용 CSS — 전부 수정 금지, 근거로만 적는다):**

| 확인 | 실제 위치 (`665a8db1`) |
|---|---|
| tutor-ui가 실제로 읽는 라디오 원본 CSS | `preview/auth-ui/src/styles/base.css:633-664`. `:633-636` `.form-radio-group { display: flex; gap: var(--space-3); }` (**`flex-wrap` 없음**), `:638-649` `.form-radio { … flex: 1; … }` (전 카드 균등 축소), `:660-664` `.form-radio__label` (**`white-space` 지정 없음**). tutor-ui 진입점 `preview/tutor-ui/src/main.js:1` `import '@auth-styles/base.css';`가 이 파일을 읽는다. |
| 같은 규칙의 사본 (home-ui 임베드용) | `preview/shared/register-form-primitives.css:110-146` — `:110-114` `.register-flow .form-radio-group, .register-edit-dialog .form-radio-group { display: flex; gap: …; }`, `:116-128` `.form-radio { flex: 1; … }`, `:141-146` `.form-radio__label`. 머리말 `:1-4`대로 home-ui 마이페이지 임베드가 읽는 사본이며, `preview/home-ui/src/main.js:29`에서 import 된다. |
| 폰트 크기만 덧씌우는 공용 규칙 | `preview/shared/register-flow.css:383-386` `.register-flow .form-radio__label, .register-flow .form-check__label { font-size: var(--reg-body); }`. tutor-ui는 `preview/tutor-ui/src/main.js:5`에서 이 파일을 읽고, 화면 껍데기는 `preview/tutor-ui/src/layout.js:95` `<div class="register-card register-card--wide panel register-flow">`이다. |

- 즉 그룹은 **줄바꿈 없이(`flex-wrap` 없음) 전 카드를 `flex: 1`로 균등하게 조이므로**, 좁은 칸(특히 2열 그리드 `:79` 안 그룹 ①·②, 7개가 한 줄인 그룹 ③)에서는 라벨이 음절 단위로 꺾인다. 글자 크기를 줄이는 것은 해법이 아니며 **금지**다(0장 2번).
- **공용 파일을 그대로 고치면 안 되는 이유:** `base.css`는 인증·등록 전반이, `register-form-primitives.css`는 마이페이지 상세수정 임베드(`.register-edit-dialog` 포함)가, `register-flow.css`는 과외쌤·공부방 상세등록 공통이 함께 읽는다. 무범위로 고치면 마이페이지 상세수정·공부방 화면까지 함께 바뀐다. 그래서 5-1은 **전용 클래스 + tutor-ui 전용 CSS 파일**로 범위를 이 화면 하나로 좁힌다.
- **전용 CSS 파일 근거:** `preview/tutor-ui/src/styles/register.css:1` 머리말 「tutor-ui 전용 — 공통은 shared/register-flow.css」. 진입점 `preview/tutor-ui/src/main.js:6` `import './styles/register.css';`로 tutor-ui에서만 읽는다. 여기에 **전용 클래스로 시작하는 선택자**로만 규칙을 추가하면, 클래스 자체가 이 화면 폼에만 있으므로 마이페이지·공부방·tutor-ui의 다른 단계(기본정보·학력·연락)에는 닿지 않는다.

### 2-2. L-19 확대카드 라벨 — 바꿀 2개 / 건드리지 않을 것

실제 파일: `preview/home-ui/src/detail-decision/tutor-detail.js` `renderTutorDetailBody(item, viewer)` (`:17-57`). 과외쌤 **확대카드(상세)** 본문이다.

| 확인 | 실제 위치 (`665a8db1`) |
|---|---|
| 바꿀 것 ① | `:36` `<dt>성별</dt><dd>${esc(formatGender(item.gender))}</dd>` — 라벨만 「과외쌤 성별」로. 값 `formatGender(item.gender)`는 그대로. |
| 바꿀 것 ② | `:41` `<dt>원생수</dt><dd>${esc(formatTutorStudentTarget(item))}</dd>` — 라벨만 「학생구성」으로. 값 `formatTutorStudentTarget(item)`은 그대로. |
| 가져오는 곳 (변경 금지) | 같은 파일 `:7-8` import — `formatTutorStudentTarget`, `formatGender`는 `../exposure-format.js`에서 온다. 정의는 `preview/home-ui/src/exposure-format.js:66` `formatTutorStudentTarget(item)`, `:93` `formatGender(gender)`. **두 파일 모두 허용 파일이 아니다.** |
| 범위 밖 (고치지 마라) | 베이직·가로카드 라벨은 `preview/home-ui/src/exposure-render.js`에 있다. 예: `:467`·`:488`·`:821` `labeled('원생수', formatTutorStudentTarget(item)…)`, `:858` `renderHcardSlot('원생수', formatTutorStudentTarget(item))`, 공부방 쪽 `:427`·`:439`·`:750`·`:780`의 「원생수」도 마찬가지다. **이번에는 확대카드(`tutor-detail.js`) 2개만 바꾼다.** 눈에 띄어도 건드리지 말고 「범위 밖 관찰」에만 적어라(6장). 성별 값을 값만으로 찍는 자리(같은 파일이 아닌 `exposure-render.js:98-102` 주석 「(성별) + 성명」 등)도 범위 밖이다. |

### 2-3. 학생 성별 입력 시작선 — 그리드·힌트·CSS 근거

실제 렌더: `preview/home-ui/src/student-reg/screens.js` (학생 상세정보 폼). **이 파일은 허용 파일이 아니다. 렌더 구조를 바꾸지 마라(근거로만 적는다).**

| 확인 | 실제 위치 (`665a8db1`) |
|---|---|
| 칸 렌더 함수 | `:370-379` `renderDetailField(label, hint, control)` — `<div class="student-detail-field"><span class="student-detail-label">…</span>${hintHtml}${control}</div>` 순서로 찍는다. 힌트가 빈 문자열이면 `hintHtml`은 빈 값이라 힌트 줄 자체가 없다(`:371-373`). |
| 문제의 두 칸 (같은 그리드) | `:422-449` `<div class="student-detail-grid">` 안 — 왼쪽 `:423-436` 「희망 과외쌤 성별」은 힌트 `'원하는 과외쌤 성별입니다.'`(`:425`)가 있고, 오른쪽 `:437-449` 「학생 성별」은 힌트 인자가 빈 문자열 `''`(`:439`)이다. 두 칸 모두 컨트롤은 `renderSelect(…)` → `<select class="p19-input p19-select">`이다. |
| 다른 그리드 (영향 없어야 할 자리) | `:405-416` `<div class="student-detail-grid">` 안 「주 회수」(`:406-410`)·「1회 수업시간」(`:411-415`) — 둘 다 힌트가 있어 지금도 시작선이 같다. 5-3 규칙이 이 두 칸의 보이는 모습을 바꾸면 실패다. |
| 그리드 밖 칸들 (영향 없어야 할 자리) | 같은 폼 `:392-468`의 나머지 칸(희망지역 추가값·희망 수업장소·희망 강의스타일·출생연도·특이요청사항 등)은 `.student-detail-grid` 밖이다. 5-3 선택자는 그리드 안으로만 좁히므로 닿지 않아야 한다. |
| 지금 CSS | `preview/home-ui/src/styles/student-detail.css` — `:44-49` `.student-detail-field { display: flex; flex-direction: column; gap: 0; min-width: 0; }`, `:51-56` `.student-detail-label`, `:58-64` `.student-detail-hint { … margin-top: 2px; margin-bottom: var(--space-2); }`, `:66-70` `.student-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }`, `:72-85` `.student-detail-form .p19-input` 높이 44px 등. 모바일은 `:154-167` `@media (max-width: 640px)`에서 `.student-detail-grid { grid-template-columns: 1fr; }`(`:164-166`)로 1열이 된다. 이 파일을 `preview/home-ui/src/main.js:35`에서 import 한다. |

- **어긋나는 이유:** 같은 행에서 왼쪽 칸은 「라벨+힌트+입력」, 오른쪽 칸은 「라벨+입력」이라 오른쪽 입력이 힌트 한 줄만큼 위에서 시작한다. 267에서 빈 힌트 줄을 없앤 뒤 남은 어긋남이며, **힌트 문구를 다시 넣는 것은 금지**다(0장 4번). 남은 여백을 입력 쪽에서 메우는 CSS로만 맞춘다.
- **맞추는 원리 (5-3):** 그리드 칸은 행 높이만큼 늘어나므로(`display: grid` 기본 stretch + 칸이 flex column), 입력에 `margin-top: auto`를 주면 남는 공간이 입력 위로 가서 두 입력이 모두 칸 아래쪽에 붙고, 입력 높이가 같아(44px) **시작선이 같아진다.** 모바일 1열에서는 각 칸 높이가 내용과 같아 남는 공간이 없으므로 `margin-top: auto`는 0으로 계산되어 **보이는 모습이 바뀌지 않아야 한다.**

---

## 3. 소작업 구성과 커밋 분리 (섞지 마라)

| 커밋 | 내용 | 허용 파일 | 섞으면 안 되는 이유 |
|---|---|---|---|
| **커밋 1** | 라디오+확대카드 (5-1·5-2): 상세등록 1단계 전용 클래스+전용 CSS 규칙, 확대카드 라벨 2개 | 3개 (`tutor-ui/src/screens/step-lesson.js`, `tutor-ui/src/styles/register.css`, `home-ui/src/detail-decision/tutor-detail.js`) | 라디오 실측(1280px)과 라벨 대조를 학생 높이 실측과 따로 되돌릴 수 있어야 한다. |
| **커밋 2** | 학생 높이 (5-3): 그리드 입력 시작선 규칙만 | 1개 (`home-ui/src/styles/student-detail.css`) | 힌트 문구·렌더와 무관한 CSS 한 가지라, 시작선 실측만 따로 대조할 수 있어야 한다. |

- **기본은 위 2개 커밋이다.** 작업 흐름상 자연스러우면 커밋 1을 「라디오」와 「확대카드 라벨」로 나눈 **3개까지 허용**하되, 한 커밋에 서로 다른 소작업을 섞지 마라. 순서는 라디오·확대카드 → 학생 높이 순서를 유지한다.
- `git add`는 허용 파일만 이름으로 지정한다(`git add -A` 금지). 커밋 메시지는 소작업 번호와 바꾼 내용이 드러나게 쓴다. 예: `269-1 fix(tutor): …`, `269-2 style(student): …` (최종 문구는 작업자 관례를 따르되 번호를 넣어라).

---

## 4. (없음 — 작업 정본은 5장이 정본이다)

---

## 5. 작업 내용 (이 장대로만 바꿔라)

### 5-1. 커밋 1 전반 — L-11 상세등록 1단계 라디오 (2파일)

**확정 방식: 전용 클래스 `tutor-lesson-step` 1개 + tutor-ui 전용 CSS 파일에 좁힌 규칙.** 다른 방식(공용 파일 수정, 인라인 스타일, 다른 클래스명)으로 바꾸지 마라. 같은 이름의 클래스가 이미 있으면 새로 만들지 말고 중단 보고하라(8장).

| # | 파일:줄 (`665a8db1` 기준) | 전 → 후 |
|---|---|---|
| 1-1 | `preview/tutor-ui/src/screens/step-lesson.js:75` 폼 요소 | 지금: `<form data-form="lesson">` → **후: `<form data-form="lesson" class="tutor-lesson-step">`** (클래스 1개만 추가. `data-form`·폼 안의 그룹 마크업·`radios()` 헬퍼·이벤트 연결은 한 글자도 바꾸지 마라.) |
| 1-2 | `preview/tutor-ui/src/styles/register.css` 파일 끝(기존 규칙 뒤)에 추가 | 아래 3규칙을 **글자 그대로** 추가한다. 기존 규칙은 한 줄도 바꾸거나 지우지 마라. |

```css
/* 상세등록 1단계(수업·가격) 라디오만 — 라벨을 꺾지 않고 카드째 다음 줄로 (269) */
.tutor-lesson-step .form-radio-group {
  flex-wrap: wrap;
}
.tutor-lesson-step .form-radio {
  flex: 1 1 auto;
}
.tutor-lesson-step .form-radio__label {
  white-space: nowrap;
}
```

- **적용 범위 확인:** 위 규칙은 `.tutor-lesson-step` 아래에서만 성립하고, 그 클래스는 1-1로 이 화면 폼에만 붙는다. 따라서 그룹 ①~④(`step-lesson.js:82·86·91·99`)에만 적용되고, tutor-ui의 다른 단계·마이페이지 상세수정·공부방 화면에는 적용되지 않아야 한다. 실측(10-2)에서 함께 확인한다.
- **하지 마라:** (a) 글자 크기(`font-size`)를 줄이거나 바꾸는 것. (b) `preview/auth-ui/src/styles/base.css`, `preview/shared/register-flow.css`, `preview/shared/register-form-primitives.css`를 비롯한 공용 CSS 수정. (c) 라벨 문구·옵션 값(`state.js`)·선택 동작·저장 로직 수정. (d) `word-break`·`letter-spacing` 등으로 음절 꺾임을 흉내 내는 것 — 확정은 `white-space: nowrap` + `flex-wrap`이다. (e) 카드 폭을 고정 px로 박는 것. 자리가 없으면 카드가 다음 줄로 넘어가는 것이 확정 동작이다.
- 예상 diff: **2개 파일 합계 약 10줄** (JS 1줄 + CSS 약 9줄).

### 5-2. 커밋 1 후반 — L-19 확대카드 라벨 2개 (1파일)

| # | 파일:줄 (`665a8db1` 기준) | 전 → 후 |
|---|---|---|
| 2-1 | `preview/home-ui/src/detail-decision/tutor-detail.js:36` | `<dt>성별</dt>` → `<dt>과외쌤 성별</dt>` (뒤 `<dd>${esc(formatGender(item.gender))}</dd>`는 그대로) |
| 2-2 | 같은 파일 `:41` | `<dt>원생수</dt>` → `<dt>학생구성</dt>` (뒤 `<dd>${esc(formatTutorStudentTarget(item))}</dd>`는 그대로) |

- **라벨 문자열만 바꾼다.** 값·`esc()`·가져오는 함수(`formatGender`·`formatTutorStudentTarget`)·import 줄·다른 `<dt>`(사진·과목·과외지역·수업장소·대상·수업료 등)는 한 글자도 바꾸지 마라.
- **베이직·가로카드(`preview/home-ui/src/exposure-render.js`)의 「원생수」 라벨은 이번 범위 밖이다.** 함께 바꾸지 마라(2-2, 6장).
- 예상 diff: **1개 파일 2줄.**

### 5-3. 커밋 2 — 학생 성별 입력 시작선 (1파일, 약 3줄)

| # | 파일:줄 (`665a8db1` 기준) | 바꿀 것 |
|---|---|---|
| 3-1 | `preview/home-ui/src/styles/student-detail.css` — `.student-detail-grid` 규칙(`:66-70`) 뒤에 추가 | 아래 규칙을 추가한다. 기존 규칙은 한 줄도 바꾸거나 지우지 마라. |

```css
.student-detail-grid .student-detail-field > .p19-input {
  margin-top: auto;
}
```

- **선택자 확정 근거:** 컨트롤은 `renderDetailField`가 칸의 직계 자식으로 찍는 `<select class="p19-input p19-select">`이므로 `> .p19-input`이 정확히 그 입력이다(2-3). 그리드 접두사로 그리드 밖 칸에는 닿지 않고, 입력 요소 한정으로 체크박스 그룹(`.p19-chip-group`)에는 닿지 않는다.
- **기대 동작:** 「희망 과외쌤 성별」(힌트 있음)과 「학생 성별」(힌트 없음) 두 입력의 **시작선(윗변)이 같아진다.** 힌트 있는 다른 그리드 두 칸(주 회수·1회 수업시간)은 지금과 보이는 모습이 같아야 하고, 그리드 밖 칸·모바일 1열(640px 이하)에서도 보이는 모습이 바뀌면 실패다(10-2).
- **하지 마라:** (a) 「학생 성별」에 힌트·안내 문구를 다시 넣는 것. (b) `preview/home-ui/src/student-reg/screens.js`의 렌더 구조·문구·값 수정. (c) 힌트 칸 높이를 고정 px로 맞추는 것, 라벨·힌트 여백(`.student-detail-hint` 등) 수정. (d) 토큰 값 변경.
- 예상 diff: **1개 파일 약 3줄.**

---

## 6. 금지 영역

1. **허용 4개 파일 밖의 모든 파일 수정 금지**(7장). 특히 아래는 건드리지 마라.
   - **공용 라디오 CSS 무범위 수정 금지:** `preview/auth-ui/src/styles/base.css`, `preview/shared/register-flow.css`, `preview/shared/register-form-primitives.css` 전부. 라디오는 5-1의 전용 클래스 방식으로만 좁힌다.
   - **공부방 화면 전부:** `preview/study-room-ui/**` (같은 `form-radio` 구조를 써도 이번 화면이 아니다).
   - **마이페이지 상세수정·학생 상세 렌더:** `preview/home-ui/src/student-reg/screens.js`를 비롯한 렌더·문구 파일 전부. 학생 높이는 5-3의 CSS 규칙만으로 끝낸다.
   - **값·포맷 함수:** `preview/home-ui/src/exposure-format.js`(`formatGender`·`formatTutorStudentTarget` 정의), `preview/tutor-ui/src/state.js`(옵션 라벨·값) 전부.
   - **베이직·가로카드 라벨:** `preview/home-ui/src/exposure-render.js`의 「원생수」 등 라벨 전부(2-2). 확대카드 2개만 바꾼다.
   - **홍보 파일 전부 금지:** 홍보·랜딩·배너·캠페인 관련 화면과 스타일 일체. 전역 제외다.
2. **PHP·토큰 값·결제 금지.** `src/**` PHP 전부, 인증 토큰·세션, 결제·상품 파일과 로직을 건드리지 마라. CSS 토큰(`--*` 값)도 새로 만들거나 바꾸지 마라 — 5장에서 지정한 리터럴 규칙 추가만 예외다.
3. **값·저장 로직 변경 금지.** 라디오 선택값·학생 성별 값·저장·이동·이벤트 동작을 바꾸지 마라. 5-1은 폼 클래스 1개와 표시 규칙, 5-2는 라벨 문자열, 5-3은 여백 규칙만 바꾼다. **글자 크기 축소도 금지**다(0장 2번).
4. **새 문구 창작·의미 변경 금지.** 5장에 적은 라벨(「과외쌤 성별」「학생구성」)이 정본이다. 글자 단위로 그대로 쓰고, 없는 안내·조건을 새로 넣지 마라. 「학생 성별」 힌트를 다시 넣는 것도 금지다. 애매하면 만들지 말고 중단 보고하라(8장).
5. 그 밖: `git add -A` 금지(허용 파일만 이름으로 `git add`), **force-push 금지**, `main` 직접 작업 금지, 운영 DB·서버 설정 변경 금지.

---

## 7. 허용 파일 목록 (이름 단위 — 이 4개 밖은 절대 수정 금지)

| # | 허용 파일 | 커밋 | 무엇을 고치는지 (한 줄) | 예상 diff |
|---|---|---|---|---|
| 1 | `preview/tutor-ui/src/screens/step-lesson.js` | 1 | 폼에 전용 클래스 `tutor-lesson-step` 1개 추가 (5-1 1-1) | 1줄 |
| 2 | `preview/tutor-ui/src/styles/register.css` | 1 | 전용 클래스로 좁힌 라디오 규칙 3개 추가 (5-1 1-2) | 약 9줄 |
| 3 | `preview/home-ui/src/detail-decision/tutor-detail.js` | 1 | 확대카드 라벨 2개 교체 (5-2) | 2줄 |
| 4 | `preview/home-ui/src/styles/student-detail.css` | 2 | 그리드 입력 시작선 규칙 추가 (5-3) | 약 3줄 |

- **예상 합계: 바뀐·추가된 줄 기준 약 15줄, 4개 파일.** 커밋별로는 커밋 1 약 12줄(3개 파일), 커밋 2 약 3줄(1개 파일)이다. 3개 커밋으로 나눌 경우에도 파일 배합은 위 표의 소작업 경계를 지켜라(3장).
- **범위 초과 시 중단 보고:** 허용 파일이 **이 4개를 넘거나**, 바뀐 줄 합계가 **30줄을 넘을** 것 같거나, PHP·토큰·결제·홍보·공용 CSS 무범위 수정·렌더 구조 변경이 필요해지면 범위를 넓히고 있다는 신호이니 **임의로 넓히지 말고 중단 보고**하라(8장). 허용 파일 안에서도 5장에서 지정한 자리만 고친다.

---

## 8. 중단 보고 조건 (멈추고 보고할 것)

아래 중 하나라도 해당하면 **코드를 넓혀 고치지 말고, 그 시점에서 멈춰 보고**하라. 보고에는 막힌 지점, 확인한 근거(파일:줄), 필요한 결정을 적는다.

1. 허용 파일이 **4개를 넘거나**, 바뀐 줄 합계가 **30줄을 넘을** 것으로 보일 때.
2. 라디오를 전용 클래스 방식으로 좁힐 수 없고 공용 CSS(`base.css`·`register-flow.css`·`register-form-primitives.css`)를 직접 고쳐야만 할 때, 또는 `tutor-lesson-step` 같은 이름이 이미 다른 뜻으로 쓰이고 있을 때. **공용 파일을 넓혀 고치지 마라.**
3. 글자 크기를 줄여야만 깨짐이 해결된다고 판단될 때. **줄이지 마라.**
4. 확대카드 라벨을 바꾸는 데 값·포맷 함수(`formatGender`·`formatTutorStudentTarget`)·`exposure-render.js`(베이직·가로카드)까지 함께 바꿔야 말이 맞는다고 판단될 때. **고치지 말고 「범위 밖 관찰」로만 적어라.**
5. 학생 높이를 맞추는 데 힌트 문구를 다시 넣거나 `student-reg/screens.js` 렌더 구조·다른 칸 CSS까지 건드려야 할 때, 또는 5-3 규칙만으로 시작선이 맞지 않을 때. **문구를 넣지 마라.**
6. 5-3 규칙이 힌트 있는 다른 칸·그리드 밖 칸·모바일 1열의 보이는 모습을 바꿀 때.
7. 5장의 지금 문구·선택자가 최신 코드에서 찾을 수 없거나, 내용이 2장과 크게 다를 때.
8. 시작 조건(1장)이 안 맞을 때 (기준 커밋 미포함, 같은 이름 브랜치 존재, 작업 트리가 깨끗하지 않음).

---

## 9. 작업 순서

1. 시작 조건(1장)을 확인한다. 기준 커밋 `665a8db1`가 최신 `origin/main`에 포함되지 않았으면 착수하지 말고 보고하고 멈춘다.
2. `git fetch` 후 최신 `origin/main`에서 브랜치 `cursor/269-input-gender-20261020`를 만든다. 착수 직후 2장의 근거 줄들을 최신 코드로 다시 확인한다.
3. **커밋 1(라디오+확대카드 3파일) → 커밋 2(학생 높이 1파일)** 순서로, 커밋마다 허용 파일만 고치고 확인한 뒤 따로 커밋한다(3장). 3개로 나눌 때도 소작업을 섞지 마라. 범위 밖이 필요하다고 판단되면 멈추고 보고한다(8장).
4. 확인한다(10장). 문자열 검색과 실측(상세등록 1단계 라디오, 확대카드 라벨 2개, 학생 상세 시작선을 1280px·가능하면 390px에서)을 보고에 적는다.
5. 커밋한다. `git add`는 허용 파일만 이름으로 지정한다(`git add -A` 금지).
6. **push 후 멈춘다.** `main` 병합·배포는 우동공과2 검수·종현 승인 뒤에만 한다. force-push 금지.

---

## 10. 확인 방법 (완료 보고에 그대로 적어라)

### 10-1. 문자열·선택자 검색

작업 브랜치에서 아래를 돌리고 결과를 보고에 적어라.

```bash
git grep -n "tutor-lesson-step" -- preview/tutor-ui/src/screens/step-lesson.js preview/tutor-ui/src/styles/register.css
git grep -n "과외쌤 성별\|학생구성" -- preview/home-ui/src/detail-decision/tutor-detail.js
git grep -n "<dt>성별</dt>\|<dt>원생수</dt>" -- preview/home-ui/src/detail-decision/tutor-detail.js
git grep -n "margin-top: auto" -- preview/home-ui/src/styles/student-detail.css
git grep -n "원생수" -- preview/home-ui/src/exposure-render.js
git diff --stat origin/main...HEAD
```

- 기대 결과: `tutor-lesson-step`이 JS 1건 + CSS 3규칙에서 잡힌다. `tutor-detail.js`에서 새 라벨 2개가 각 1건씩 잡히고, 옛 라벨 `<dt>성별</dt>`·`<dt>원생수</dt>`는 **0건**이어야 한다. `student-detail.css`에서 `margin-top: auto`는 5-3 규칙 **1건**이어야 한다. `exposure-render.js`의 「원생수」는 **작업 전과 같은 건수**로 남아 있어야 한다(사라졌으면 범위 초과다).
- 공용 파일 무변경 확인: `git diff --name-only origin/main...HEAD` 결과가 허용 4개 파일 안에만 있는지 적어라. `base.css`·`register-flow.css`·`register-form-primitives.css`·`exposure-render.js`·`exposure-format.js`·`student-reg/screens.js`·`state.js`가 diff에 있으면 실패다.

### 10-2. 화면 실측 (작업 전·후로 적어라. 너비 1280px 기준, 가능하면 390px도)

| 케이스 | 확인할 것 | 기대 결과 (작업 후) |
|---|---|---|
| (a) 상세등록 1단계 라디오 | 과외쌤 상세등록 1단계(수업·가격)에서 지도 대상 성별·수업인원·과외쌤 연령대·산정방식 네 그룹의 라벨 | 「단독」「4명 이상」「20대 전반」을 비롯해 모든 라벨이 **음절로 꺾이지 않고 한 줄**로 보인다. 자리가 없으면 카드가 **통째로 다음 줄**로 넘어간다. 글자 크기는 작업 전과 **같다** |
| (b) 다른 화면 무영향 | 마이페이지 상세수정 화면과 공부방 등록 화면의 라디오, tutor-ui의 다른 단계(기본정보·학력·연락) | 작업 전과 **보이는 모습이 같다** (전용 클래스가 이 화면에만 걸린 근거) |
| (c) 확대카드 라벨 | 과외쌤 확대카드(상세) 핵심 조건 목록 | 라벨이 「과외쌤 성별」「학생구성」으로 보인다. 그 값(성별 값·학생구성 값)은 작업 전과 **같다**. 베이직·가로카드의 「원생수」 라벨은 작업 전과 **같다** |
| (d) 학생 상세 시작선 | 학생 상세정보에서 「희망 과외쌤 성별」「학생 성별」 두 입력의 윗변 위치 (1280px, 가능하면 390px) | 1280px에서 두 입력의 **시작선이 같다**. 「학생 성별」에 힌트 문구가 새로 생기지 않았다. 주 회수·1회 수업시간 두 칸과 그리드 밖 칸은 작업 전과 같다. 390px(1열)에서는 작업 전과 보이는 모습이 **같다** |

- 캡처가 가능하면 (a)~(d)를 작업 전·후로 붙이고, 캡처가 어려우면 수치·DOM 확인 결과로 대신 적되 그 이유를 적어라.
- 바꾼 것 외의 동작(라디오 선택·상세등록 저장/이동·학생 상세 저장)이 수정 전과 같은지도 함께 적어라.

---

## 11. 완료 보고 양식

완료 보고에는 아래를 빠짐없이 적어라.

1. 브랜치 이름과 커밋 1·2(또는 1·2·3)의 해시. 시작 시점의 `origin/main` 해시와 기준 커밋 포함 확인 방법(1장 명령 결과).
2. 바꾼 파일 목록과 파일별 실제 diff 줄 수 (허용 4개 안인지, 커밋별로 나눠서 명시).
3. 항목별 전→후 대조: 5-1의 1-1~1-2, 5-2의 2-1~2-2, 5-3의 3-1 순서대로 전수. 바꾸지 않은 항목은 이유.
4. 10-1 검색 결과, 10-2 실측 (a)~(d) 확인 결과 (캡처 또는 수치).
5. 범위 확인 문장: "허용 파일 4개(실제 바꾼 파일 명시) 밖은 건드리지 않았습니다. 공용 라디오 CSS(base.css·register-flow.css·register-form-primitives.css) 무범위 수정, 글자 크기 축소, 값·포맷 함수(formatGender·formatTutorStudentTarget)·옵션(state.js) 변경, 베이직·가로카드(exposure-render.js) 라벨, 학생 힌트 문구 재추가와 렌더 구조(screens.js) 변경, 홍보 파일 전부, PHP·토큰 값·결제는 바꾸지 않았습니다."라는 취지를 자기 말로 확인해 적어라.
6. 범위 밖으로 본 관찰이 있으면 「범위 밖 관찰」로 분리해 적되, 이번에 고쳤다고 쓰지 마라.
7. 멈춘 지점 보고: push까지 했는지, 병합·배포는 하지 않았다는 것을 적어라.
