# 260-1 보완 지시서 — 검수 조건부 합격을 닫는 좁은 보완 (과외쌤 카드 사진 아래 학적·경력 칸 + 등록점검 학교급 빈칸)

- 작업 번호: 260-1 (260 검수 조건부 합격 보완)
- 날짜: 2026-10-19
- 원 지시서: `docs/worklog/grok-sync/docs/260-cursor-directive-internal-code-exposure.md` (260). **원 260 지시서 파일 자체는 수정하지 마라. 이 문서(260-1)와 함께 읽고, 이 문서가 정하는 2곳만 추가로 고친다.**
- 브랜치: `cursor/260-internal-code-exposure-20261019` (260 브랜치 그대로 이어서. **새 브랜치를 만들지 마라** — 작업 순서는 6장)
- 기준 코드: 위 브랜치 커밋 `6ded32e4` (`260 fix(tutor): 모르는 값은 빼고 서버 500 알림은 확정 문구만 보이게 한다`, 기준 `origin/main` `70c39134`). 이 커밋 위에 보완 커밋을 쌓는다.
- 작업 모델: **grok-4.7 high** 로 작업하라.
- 성격: 260 커밋 `6ded32e4`의 **검수 조건부 합격**을 닫는 좁은 보완이다. 남은 조건은 **조건1·조건2 2건뿐**이다. 조건1은 260 허용 파일 밖에 있던 파일이라 당시 고치지 못한 것이고, 조건2는 260에서 빈 표시로 바꾼 값이 렌더 규칙과 어긋나 빈칸이 된 것이다. **종현 최종 결정(2026-10-19): 사진 아래 학적·경력 칸도 하이픈으로 맞춘다. 즉 조건1도 고친다.** 이 문서가 정하는 2곳 밖은 고치지 않는다. **지시서 작성 단계에서는 앱 코드를 고치지 않았다. 코드 수정은 이 지시서를 받은 작업자만 한다.**

> 쉬운 말 안내: 260에서 모르는 값은 하이픈(`—`)으로 통일하기로 했는데, 두 곳이 남았습니다. 하나는 과외쌤 프라임·픽 카드 사진 아래 학적·경력 칸인데, 하이픈이 만들어져도 그 칸만 다시 빈칸으로 되돌리고 있었습니다. 다른 하나는 등록점검에서 학교급 `general`·`other`처럼 채웠다고 인정되는 값인데 이름표가 없어 빈칸으로 보이는 경우입니다. 이번에는 이 두 곳만 하이픈으로 보이게 하고, 나머지 확정 표시·상태·개수는 한 글자도 바꾸지 않습니다.

---

## 1. 시작 조건 (하나라도 안 맞으면 착수 금지)

1. **기존 브랜치 `cursor/260-internal-code-exposure-20261019`의 커밋 `6ded32e4` 위에 보완 커밋을 쌓을 것.** `git fetch` 후 그 브랜치를 checkout/pull 해서 이어서 작업한다. **새 브랜치를 만들지 마라.** 이미 push된 브랜치이므로 rebase 하지 마라(force-push가 필요해지므로 금지).
2. 작업 시작 전 `git status`가 깨끗한지, 현재 HEAD가 `6ded32e4` 또는 그 위에 쌓인 260-1 보완 커밋인지 확인한다. 기준 코드가 3장의 전(before)과 크게 다르면 억지로 맞추지 말고 멈추고 보고하라(7장).
3. **`main` 병합·배포·force-push 금지. push까지만 한다.** `main`에서 직접 작업하지 마라.
4. 커밋할 때는 허용 파일만 이름으로 `git add` 하라. **`git add -A` 금지.**

---

## 2. 배경 — 왜 조건부 합격인가

1. 260 커밋 `6ded32e4`는 검수에서 **조건부 합격**을 받았다. 남은 조건은 아래 **조건1·조건2 2건뿐**이다.
2. **조건1 (과외쌤 프라임/픽 카드 사진 오버레이 하단 칸 빈칸):** `preview/home-ui/src/exposure-format.js`가 모르는 값에 `—`를 반환해도, `preview/home-ui/src/exposure-render.js`의 `blankDash`가 그 `—`를 `''`(빈칸)로 되돌린 뒤 `renderTutorOverlayBottomGrid`가 그대로 출력한다. 그래서 전부 모르는 값이면 `—`가 아니라 빈칸이 된다. `exposure-render.js`는 260 허용 파일 밖이라 당시 못 고쳤다.
3. **조건2 (등록점검 D2 학교급 `general`·`other` 빈칸):** `preview/home-ui/src/tutor-reg/registration-check-model.js:232` 부근이 이름표에 없으면 `''`를 반환한다. 그런데 행 상태는 `filled`인데 렌더는 `empty`일 때만 `—`를 찍어서, 채웠는데도 빈칸이 된다. 완전히 모르는 값 `unknown_xyz`는 상태가 `empty`라 정상으로 `—`가 찍힌다.
4. **종현 최종 결정 (2026-10-19): 사진 아래 학적·경력 칸도 하이픈으로 맞춘다. 즉 조건1도 고친다.** 되돌리거나 임의로 해석을 바꾸지 마라.

---

## 3. 전수 확인 결과 — 정확한 위치와 호출 관계 (기준 커밋 `6ded32e4`)

줄 번호는 기준 커밋 `6ded32e4` 기준 참고값이다. 줄이 밀렸으면 같은 함수·문장을 찾아 확인하고, 내용이 크게 다르면 억지로 맞추지 말고 멈추고 보고하라(7장).

### 3-1. 조건1 — 오버레이 하단 경로

| 위치 (`6ded32e4` 기준) | 역할 | 지금 동작 |
|---|---|---|
| `preview/home-ui/src/exposure-format.js` `formatUniversityStatus` | 학적상태 코드 → 이름표, 모르면 `—` (260에서 확정) | 모르는 값·빈값이면 `—` 반환 |
| `preview/home-ui/src/exposure-format.js` `formatCareerYearBand` | 경력 구간 코드 → 이름표, 모르면 `—` (260에서 확정) | 모르는 값·빈값이면 `—` 반환 |
| `preview/home-ui/src/exposure-render.js:376-383` `renderTutorFeeOverlay` | 주 회수·회당 분·월 과외비를 `, `로 연결, 없으면 `—` | 남는 조각이 없으면 `—` 반환 (`formatMonthlyWon`의 `—` 조각은 이미 빼고 합성) |
| `preview/home-ui/src/exposure-render.js:69-71` `blankDash(text)` | `text === '—' ? '' : text` | **`—`만 골라 빈칸으로 되돌린다** |
| `preview/home-ui/src/exposure-render.js:362-374` `renderTutorOverlayBottomGrid(item)` | 오버레이 하단 4칸(학적·학교/전공·경력·수강료)을 만든다 | 4칸 모두 `blankDash(...)`를 거치므로, 전부 모름/빈값이면 각 칸이 빈칸이 된다 |
| `preview/home-ui/src/exposure-render.js:385-390` `renderTutorMediaOverlay` | `bl: renderTutorOverlayBottomGrid(item)` 로 하단 그리드를 사진 오버레이에 넣는다 | 과외쌤 전용 |
| `preview/home-ui/src/exposure-render.js:512-519` `renderPrimeTutor`, `:530-537` `renderPickTutor` | 각각 `renderTutorMediaOverlay(item, 'prime'/'pick')` 호출 | 프라임·픽만 이 경로를 탄다 |

- 하단 4칸의 값 출처: ① 학적 `formatUniversityStatus(item.university_status)`, ② 학교/전공 `[item.university_name, item.major_name].filter(Boolean).join(' ')` (자유 입력 문구, 코드 변환 아님), ③ 경력 `formatCareerYearBand(item.career_year_band)`, ④ 수강료 `renderTutorFeeOverlay(item)`.
- 공부방 경로는 이 함수를 쓰지 않는다: `renderStudyRoomMediaOverlay`·`renderPickStudyRoomMedia`는 사진 오버레이에 왼쪽 위 지역(`tl`)만 넣고 하단 그리드를 만들지 않는다. 따라서 4장의 국소 수정은 **공부방 카드에 닿는 경로가 없다**(그래도 8장대로 영향 범위를 확인·보고한다).

### 3-2. `blankDash` 전수 확인과 전역/국소 판단 (반드시 이 판단대로 할 것)

`blankDash`는 저장소 전체에서 **`preview/home-ui/src/exposure-render.js` 한 파일 안에서만** 쓰인다(정의 1곳 + 호출 6곳). 전수 결과는 아래와 같다.

| # | 위치 | 감싸는 값 | 지금 의도/동작 | 전역으로 바꾸면 어떻게 달라지나 |
|---|---|---|---|---|
| 정의 | `:69-71` `blankDash` | — | `—` → `''`, 나머지는 그대로 | — |
| 가 | `:105` `nameWithGenderCell` | 성명 `name \|\| ''` (과외쌤 표의 이름 칸. 프라임/픽 표·베이직 표가 사용) | 이름이 정확히 `—`이면 빈칸으로 숨긴다 | 이름 칸에 `—`가 그대로 찍히게 된다. **오버레이 하단이 아닌 과외쌤 표 화면이 달라진다** |
| 나 | `:363` 오버레이 학적 `grad` | `formatUniversityStatus(...)` | `—` → 빈칸 (**조건1 본건**) | 이번에 고쳐야 할 칸 |
| 다 | `:365` 오버레이 학교/전공 `edu` | 대학명·전공 `join(' ')` | 빈 문자열이면 원래도 빈칸, `—` 한 글자 조합이면 빈칸 | 빈값일 때 `—`가 되어야 할 칸 (**조건1 본건**) |
| 라 | `:366` 오버레이 경력 `career` | `formatCareerYearBand(...)` | `—` → 빈칸 (**조건1 본건**) | 이번에 고쳐야 할 칸 |
| 마 | `:367` 오버레이 수강료 `fee` | `renderTutorFeeOverlay(item)` | `—` → 빈칸 (**조건1 본건**) | 이번에 고쳐야 할 칸 |
| 바 | `:710` `renderHcardMetaItem` | 학생 베이직(hcard) `과목`·`희망` 값 (`:977-978`에서 호출) | `blankDash` 뒤 `if (!v) return ''` — 값이 `—`이면 **항목 자체를 만들지 않는다** | 값이 `—`인 학생 항목이 `과목 —`·`희망 —`으로 새로 생겨 **학생 베이직 카드의 항목 생략 규칙과 높이가 달라진다**. 이번 범위(과외쌤 프라임/픽 오버레이)가 아니다 |

**판단: `blankDash`를 전역으로 바꾸면 안전하지 않다. 바꾸지 마라.**

- 근거 1: (가) 성명 칸은 오버레이 하단이 아니다. 전역 변경은 260에서 확정한 다른 표시를 건드린다.
- 근거 2: (바) 학생 베이직 카드는 `—`이면 항목을 아예 빼는 것이 지금 규칙이다. 전역 변경(예: `blankDash`를 그대로 두는 함수나 `slotDash`로 교체)은 이 생략 규칙을 깨고 학생 화면을 바꾼다. 260의 역할 범위는 과외쌤이며, 학생·공부방 표시를 바꾸는 것은 이번 보완의 목적이 아니다.
- 근거 3: 같은 파일에 이미 목적에 맞는 함수가 있다. `:74-77` `slotDash(text)`는 `String(text ?? '').trim()` 뒤 빈값이면 `—`를 반환하고, 아는 값은 글자 그대로 돌려준다. 오버레이 하단 4칸에만 이 함수를 쓰면 (가)·(바)는 한 글자도 달라지지 않는다.

**따라서 조건1은 오버레이 하단 경로만 최소로 고친다: `renderTutorOverlayBottomGrid` 안 4줄의 `blankDash(...)`만 `slotDash(...)`로 바꾼다. `blankDash` 정의(`:69-71`)와 (가) `:105`, (바) `:710` 호출은 건드리지 마라.** 새 헬퍼를 만들 필요도 없다.

### 3-3. 조건2 — 등록점검 학교급 경로

| 위치 (`6ded32e4` 기준) | 역할 | 지금 동작 |
|---|---|---|
| `preview/shared/school-grade.js` `SCHOOL_LEVEL_FORM_LABELS` | 학교급 이름표. `preschool`·`elementary`·`middle`·`high`·`n_su` 5개만 있다 | `general`·`other` 이름표 없음 (**여기에 값을 추가하지 마라** — 5장) |
| `preview/shared/tutor-basic-fields.js:23` `TUTOR_SCHOOL_LEVEL_CODES` | 채움 인정 코드 목록 | `preschool, elementary, middle, high, n_su, general, other` — **`general`·`other`도 채운 값으로 인정된다** |
| `preview/shared/tutor-basic-fields.js:59` `tutorBasicOkMap` | `school_level: TUTOR_SCHOOL_LEVEL_CODES.includes(...)` | `general`·`other` → `true`, `unknown_xyz` → `false`, 빈값 → `false` |
| `preview/home-ui/src/tutor-reg/registration-check-model.js:228` | `const basicOk = tutorBasicOkMap(tutorBasicValuesFromRecord(tutor));` | `basicValues`보다 **먼저** 계산된다 (4-2가 이 순서를 이용한다) |
| `preview/home-ui/src/tutor-reg/registration-check-model.js:232` | `school_level: SCHOOL_LEVEL_FORM_LABELS[tutor?.school_level] \|\| '',` | 이름표에 없으면 표시값 `''` (**조건2 본건**) |
| 같은 파일 기본 행 생성 | `row(f.id, f.label, basicValues[f.id], basicOk[f.id] ? 'filled' : 'empty')` | `general`·`other`는 표시값 `''`인데 상태는 `filled` |
| 같은 파일 `row()` | `value: blank(value) ? String(value) : ''` | 표시값이 빈값이면 `''`로 저장된다 |
| `preview/home-ui/src/tutor-reg/registration-check-render.js` `renderTable` (읽기만, 수정 금지) | `empty ? '—' : esc(r.value)` | 상태가 `empty`일 때만 `—`. 따라서 `filled` + `''`이면 **빈칸**이 되고, `unknown_xyz`는 `empty`라 정상으로 `—`가 찍힌다 |
| 같은 파일 `sectionSummary` (읽기만) | 채움 개수는 `rows.filter((r) => r.status === 'filled')` 로 **상태만** 센다. 부족 이름은 `r.label`을 쓴다 | 표시값(`value`)을 바꾸어도 개수·부족 이름은 달라지지 않는다 |

---

## 4. 확정 보완안 — 이 2곳만 반영한다 (범위 확대 금지)

### 4-1. 조건1: 오버레이 하단 4칸만 `slotDash`로 교체

위치: `preview/home-ui/src/exposure-render.js` `renderTutorOverlayBottomGrid` (`:362-367` 부근)

| 칸 | 전 (before) | 후 (after, 확정) |
|---|---|---|
| 학적 | `const grad = blankDash(formatUniversityStatus(item.university_status) \|\| '');` | `const grad = slotDash(formatUniversityStatus(item.university_status) \|\| '');` |
| 학교/전공 | `const edu = blankDash([item.university_name, item.major_name].filter(Boolean).join(' '));` | `const edu = slotDash([item.university_name, item.major_name].filter(Boolean).join(' '));` |
| 경력 | `const career = blankDash(formatCareerYearBand(item.career_year_band) \|\| '');` | `const career = slotDash(formatCareerYearBand(item.career_year_band) \|\| '');` |
| 수강료 | `const fee = blankDash(renderTutorFeeOverlay(item));` | `const fee = slotDash(renderTutorFeeOverlay(item));` |

- 바꾸는 것은 이 **4줄의 함수 이름뿐**이다. 값 조립(`filter(Boolean).join(' ')`, `renderTutorFeeOverlay` 호출, `|| ''`)과 HTML 구조·클래스(`expo-overlay-bl-grid`·`expo-overlay-bl-grid__cell`)·`esc(...)`는 그대로 둔다.
- 칸은 **칸마다 따로** 판단한다. 네 칸을 하나의 문장으로 합치거나, 한 칸이 비었다고 다른 칸까지 비우거나 `—`로 바꾸지 마라.
- `slotDash`는 이미 같은 파일 `:74-77`에 있다. 새로 import하거나 새 함수를 만들지 마라.
- **`blankDash` 정의와 나머지 호출 2곳(`:105` 성명 칸, `:710` 학생 hcard 항목)은 수정 금지.** 이유와 근거는 3-2와 같다. 이 둘 중 하나라도 함께 바꿔야 한다고 판단되면 고치지 말고 중단 보고하라(7장).

### 4-2. 조건2: 학교급 표시값만 `—`로 (상태·셈법 불변)

위치: `preview/home-ui/src/tutor-reg/registration-check-model.js:232` 부근 (`basicValues.school_level` 한 줄)

| 전 (before) | 후 (after, 확정) |
|---|---|
| `school_level: SCHOOL_LEVEL_FORM_LABELS[tutor?.school_level] \|\| '',` | `school_level: SCHOOL_LEVEL_FORM_LABELS[tutor?.school_level] \|\| (basicOk.school_level ? '—' : ''),` |

- 바꾸는 것은 이 **1줄뿐**이다. `basicOk`는 같은 함수에서 이 줄보다 먼저(`:228`) 이미 계산되어 있으므로, 새로 판정 로직을 만들거나 import를 추가할 필요가 없다.
- 의미: 이름표가 있는 학교급은 기존 한글 그대로, 이름표는 없지만 채움으로 인정되는 값(`general`·`other`)은 표시값만 `—`, 그 외(빈값·완전히 모르는 값)는 지금처럼 `''`로 두어 렌더의 `empty` 규칙이 `—`를 찍게 한다.
- **상태·셈법 불변:** 행 상태(`basicOk[f.id] ? 'filled' : 'empty'`), `tutorBasicOkMap`, `TUTOR_SCHOOL_LEVEL_CODES`, `sectionSummary`의 개수 세는 법, 부족 판정은 한 글자도 바꾸지 마라. 표시값만 바뀌므로 채움 개수와 상태 표시는 그대로여야 한다(5장 기대 결과 표, 8장 확인 방법).
- 동등한 다른 방식(예: 원본 값이 비어 있지 않은지를 직접 검사)이 더 낫다고 판단되어도, 임의로 넓히지 말고 위 확정안대로 하라. 위 한 줄로 닫히지 않으면 고치지 말고 중단 보고하라(7장).

### 4-3. 기대 결과 표 (이 표가 정본이다)

과외쌤 프라임·픽 카드 사진 오버레이 하단 4칸 (칸마다 따로 적용):

| 경우 | 기대 표시 |
|---|---|
| 아는 값만 있을 때 | 글자 그대로 유지한다. 예: 학적 `졸업`, 경력 `4~6년`, 학교/전공 `서울대 수학과`, 수강료 조립 문구 그대로 |
| 아는 값과 모르는 값이 섞일 때 | 아는 값만 글자 그대로 보이고, 모르는 칸만 `—`가 된다. 예: 학적을 모르면 학적 칸만 `—`, 학교/전공·경력이 알면 그 칸은 그대로 |
| 전부 모름/빈값일 때 | 네 칸 모두 `—`가 된다. **빈칸이 되면 안 된다 (카드 오버레이 하단 포함)** |
| 학교/전공처럼 한 칸 안에 조각이 섞일 때 | 아는 조각만 보인다. 예: 대학명만 있으면 대학명만, 전공만 있으면 전공만, 둘 다 없으면 그 칸은 `—` |

등록점검 기본정보 「대상(학교급)」 행:

| 저장값 | 표시값 (화면) | 행 상태 | 채움 개수 |
|---|---|---|---|
| 이름표 있는 값 (예: `high`) | 기존 한글 그대로 (예: `고등`) | 지금 그대로 | 지금 그대로 |
| `general`·`other` | **`—`** (빈칸 아님) | **`filled` 그대로** | **그대로 (줄지도 늘지도 않음)** |
| 완전히 모르는 값 (예: `unknown_xyz`) | `—` (지금과 같음) | `empty` 그대로 | 그대로 |
| 빈값/없음 | `—` (렌더의 `empty` 규칙, 지금과 같음) | `empty` 그대로 | 그대로 |

- 새 문구를 만들지 마라. `알 수 없음`·`일반`·`기타` 같은 새 이름표를 만들지 마라.
- `—`는 반각 하이픈(`-`)이 아니라 지금 화면들이 쓰는 전각 하이픈 `—`다.

---

## 5. 허용 파일과 금지 영역

### 5-1. 허용 파일 — 아래 2개뿐, 추가 없음

| # | 허용 파일 (경로 정확히) | 이번 보완에서 바꾸는 곳 |
|---|---|---|
| 1 | `preview/home-ui/src/exposure-render.js` | `renderTutorOverlayBottomGrid` 안 **4줄만** (`blankDash` → `slotDash`). 정의·다른 호출 수정 금지 (4-1, 3-2) |
| 2 | `preview/home-ui/src/tutor-reg/registration-check-model.js` | `basicValues.school_level` **1줄만** (4-2) |

- 예상 변경: 핵심 **5줄 안팎**, 전체 diff **20줄 안팎**을 넘기지 않는다. **30줄을 넘을 것 같으면 진행하지 말고 중단 보고하라(7장).**
- 줄 번호는 기준 커밋 `6ded32e4` 기준 참고값이다. 줄이 밀렸으면 같은 함수·문장을 찾아 확인하고, 내용이 크게 다르면 억지로 맞추지 말고 멈추고 보고하라(7장).

### 5-2. 금지 영역

1. **허용 2개 파일 밖의 모든 파일 수정 금지.** 특히 아래를 건드리지 마라.
   - **이름표 목록에 값 추가 금지:** `preview/shared/school-grade.js`(`SCHOOL_LEVEL_FORM_LABELS`·옵션 목록), `preview/home-ui/src/tutor-enums.js`, `preview/shared/tutor-basic-fields.js`(`TUTOR_SCHOOL_LEVEL_CODES`) 등 어떤 이름표·코드 목록에도 `general`·`other` 등의 값을 추가하거나 이름을 만들지 마라.
   - **저장값·판정·셈법 변경 금지:** 저장되는 값, `tutorBasicOkMap`·`tutorFieldOkMap` 등 판정, `sectionSummary`·개수·부족 셈법, 행 상태 결정 방식을 바꾸지 마라.
   - **259 문구 변경 금지:** 259·259-1·259-2에서 확정한 등록점검 문구를 바꾸지 마라.
   - **공부방 전용 파일 변경 금지:** `preview/home-ui/src/study-room-reg/**`, `preview/study-room-ui/**` 등 공부방 전용 파일은 건드리지 마라. 공유 함수를 통한 간접 효과와 전용 파일 직접 수정은 다르다.
   - **260에서 확정한 다른 표시 변경 금지:** `preview/home-ui/src/exposure-format.js`의 260 확정 반환값, 완료 화면·마이프로필·서버 오류 확정 문구 「요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요」 등을 되돌리거나 바꾸지 마라.
   - **서버 파일 변경 금지:** `public/api/**`를 비롯한 서버 파일을 건드리지 마라.
   - 렌더 파일 `preview/home-ui/src/tutor-reg/registration-check-render.js`도 허용 파일이 아니다. 여기서 고쳐야 한다고 판단되면 중단 보고하라(7장).
2. **`blankDash` 전역 변경 금지** (3-2). 정의(`:69-71`)와 성명 칸(`:105`)·학생 hcard 항목(`:710`) 호출을 바꾸지 마라.
3. 그 밖: **`git add -A` 금지** (허용 파일만 이름으로 `git add` 하라), **force-push 금지**, **`main` 직접 작업·병합·배포 금지**, 이미 push된 브랜치의 rebase 금지, 새 브랜치 생성 금지.

---

## 6. 작업 순서 — 260 브랜치에서 이어서

1. `git fetch` 한다. 브랜치 `cursor/260-internal-code-exposure-20261019`를 checkout/pull 해서 **이어서** 작업한다. **새 브랜치를 만들지 마라.** 기준은 그 브랜치 커밋 `6ded32e4`다.
2. 작업 시작 전 `git status`가 깨끗한지 확인한다. 더럽혀져 있으면 그 내용을 보고에 적고 멈춰라. 기준 코드가 4장의 전(before)과 크게 다르면 억지로 맞추지 말고 멈추고 보고하라(7장).
3. 허용 파일(5-1) **2개만** 수정한다: `exposure-render.js`의 오버레이 하단 4줄(4-1), `registration-check-model.js`의 학교급 1줄(4-2). 범위 밖 파일이 필요하다고 판단되면 멈추고 보고한다(7장).
4. 바꾼 곳이 정확히 2곳(5줄 안팎)인지 `git diff`로 확인한다. 허용 범위 밖 무변경인지, 전체 diff가 20줄 안팎을 넘지 않는지 함께 확인한다. 30줄을 넘으면 중단 보고하라.
5. 8장의 확인을 함수별 케이스로 실행하고 전후 비교를 남긴다.
6. 커밋한다. `git add`는 허용 파일 2개만 이름으로 지정한다 (`git add -A` 금지). 커밋 메시지는 바꾼 내용이 드러나게 쓴다. 예: `260-1 fix(tutor): 카드 사진 아래 칸과 등록점검 학교급 빈칸을 하이픈으로 맞춘다`
7. **push 후 멈춘다.** `main` 병합·배포는 **종현 승인 후에만** 한다. force-push 금지.

---

## 7. 중단 보고 규칙 (t1844)

- 허용 파일 2개 밖을 고쳐야 하거나, `blankDash` 정의·다른 호출까지 바꿔야 말이 맞다고 판단되면, **고치지 말고 작업을 멈추고 보고**하라. 보고에는 무엇이 왜 범위 밖인지 한 줄로 적는다.
- 허용 파일 안이라도 `renderTutorOverlayBottomGrid`·`basicValues.school_level` 이외의 줄을 고쳐야 하면 중단 보고하라.
- 기준 코드(브랜치 `6ded32e4`)가 이 문서의 전(before) 문구와 크게 다르면, 비슷한 문구를 찾아 억지로 맞추지 말고 멈추고 보고하라.
- 예상 diff(20줄 안팎)를 크게 넘기거나 **30줄을 넘길 것 같으면 진행하지 말고 먼저 보고**하라.
- 이름표 목록에 값을 추가해야 하거나, 저장값·판정·셈법·259 문구·서버 파일을 바꿔야 닫힌다고 판단되면 중단 보고하라.
- 이 문서 4장에 없는 새 문안·새 이름표를 만들 필요가 생기면 임의로 만들지 말고 멈추고 보고하라.

---

## 8. 확인 방법 (함수별 케이스 전후 비교 — 필수)

아래를 채워서 보고하라. 하나라도 빠지면 완료로 보지 않는다. 확인용 임시 스크립트·임시 파일은 커밋에 넣지 마라(허용 파일 2개만 커밋한다).

### 8-1. 조건1 — `renderTutorOverlayBottomGrid` 경로 (프라임·픽 공통)

이 함수는 직접 export되지 않으므로, `renderExposureBox('tutor', 'prime', item, '', opts)`와 `renderExposureBox('tutor', 'pick', item, '', opts)` 결과에서 `expo-overlay-bl-grid`의 칸 4개를 뽑아 전(수정 전 커밋)·후를 비교한다. 최소 케이스:

| 케이스 | 입력 예시 | 기대 (후) |
|---|---|---|
| 아는 값 | `university_status: 'graduated'`, `university_name: '서울대'`, `major_name: '수학과'`, `career_year_band: 'y4_6'`, 수강료 조각 있음(주 회수·회당 분·월 과외비 중 하나 이상) | `졸업` / `서울대 수학과` / `4~6년` / 수강료 문구 그대로. 전과 동일 |
| 섞임 | 아는 칸과 모르는 칸을 섞는다. 예: `university_status: 'unknown_xyz'`, 대학명만 있음, `career_year_band: 'y1_3'`, 수강료 조각 없음 | 모르는 칸만 `—`, 아는 칸은 그대로. 전에는 모르는 칸이 빈칸이었음을 함께 적는다 |
| 전부 모름/빈값 | `university_status: 'unknown_xyz'` 또는 없음, 대학명·전공 없음, `career_year_band: 'unknown_xyz'` 또는 없음, 수강료 조각 없음 | 네 칸 모두 `—`. **빈칸 0개** |
| 학교/전공 한 칸 섞임 | 대학명만 있음 / 전공만 있음 / 둘 다 없음 | 각각 대학명만 / 전공만 / `—` |

- 프라임과 픽 **양쪽**에서 같은 결과가 나오는지 확인한다(같은 함수를 공유하므로 결과는 같아야 한다).
- 전역 무변경 확인: 성명 칸(`nameWithGenderCell`)과 학생 베이직 항목(`renderHcardMetaItem`)은 이번에 손대지 않았으므로, 값이 `—`일 때의 기존 동작(성명 빈칸·학생 항목 생략)이 그대로인지 diff와 함께 확인해 적는다. 이 둘의 표시가 달라졌다면 전역으로 번진 것이므로 중단 보고 대상이다.

### 8-2. 조건2 — 등록점검 학교급 행

`buildTutorRegistrationCheckModel`이 만드는 기본정보 행 중 `school_level` 행의 표시값·상태와, 그 섹션의 채움 개수를 전후로 비교한다. 최소 케이스:

| 케이스 | `school_level` 입력 | 기대 표시값 (후) | 기대 상태 | 기대 개수 변화 |
|---|---|---|---|---|
| 아는 값 | `'high'` | `고등` (전과 동일) | 전과 동일 | 없음 |
| 채움인데 이름표 없음 | `'general'`, `'other'` 각각 | **`—`** (전에는 빈칸) | **`filled` 그대로** | **없음** |
| 완전 모름 | `'unknown_xyz'` | `—` (전과 동일) | `empty` 그대로 | 없음 |
| 빈값 | `''` 또는 없음 | `—` (렌더 기준, 전과 동일) | `empty` 그대로 | 없음 |

- 표시값은 모델의 행 `value`와, 가능하면 렌더 결과(`registration-check-render.js`의 `empty ? '—' : esc(r.value)` 적용 결과) 양쪽으로 확인한다. 렌더 파일은 읽기만 하고 고치지 마라.
- 다른 기본정보 행(표시명·지역·과목·수강료 등)의 표시값·상태가 전과 같은지도 함께 확인한다.

### 8-3. 공부방 카드 영향 범위

- `renderTutorOverlayBottomGrid`는 과외쌤 전용(`renderTutorMediaOverlay` → 프라임/픽 과외쌤)이며 공부방 오버레이는 이 함수를 쓰지 않음을 코드로 확인한다.
- 가능하면 공부방 프라임·픽 카드 1장씩을 전후로 렌더해 **출력 변화가 없음**을 확인하고, 변화가 있으면 그 범위를 보고에 적는다. 공부방 표시가 달라졌다면 임의로 맞추지 말고 중단 보고하라(7장).

---

## 9. 완료 보고 양식

아래를 채워서 보고하라. 하나라도 빠지면 완료로 보지 않는다.

1. **바꾼 2곳 전후**: 아래 두 곳의 전→후를 그대로 적는다. 브랜치 이름과 새 커밋 해시를 함께 적는다.
   - (가) `exposure-render.js` `renderTutorOverlayBottomGrid` 4줄: `blankDash(...)` → `slotDash(...)` (칸별 전→후 포함)
   - (나) `registration-check-model.js` `basicValues.school_level` 1줄: `SCHOOL_LEVEL_FORM_LABELS[...] || ''` → `SCHOOL_LEVEL_FORM_LABELS[...] || (basicOk.school_level ? '—' : '')`
   - 파일별 추가/삭제 줄 수 (`git diff --stat` 결과 그대로)와 전체 diff 줄 수도 함께 적는다. 20줄 안팎을 넘었으면 그 이유를 적는다.
2. **함수별 케이스 전후 비교**: 8-1·8-2 표의 케이스마다 전→후 결과를 적는다. 특히 오버레이 하단 전부 모름/빈값에서 네 칸 모두 `—`이고 빈칸이 없는지, 등록점검 `general`·`other`가 `—`로 보이면서 상태 `filled`와 개수가 그대로인지를 분명히 쓴다.
3. **`blankDash` 국소 변경 확인**: "`blankDash` 정의와 성명 칸·학생 hcard 호출은 건드리지 않았고, 오버레이 하단 4줄만 바꿨습니다"라는 취지를, 전역으로 바꾸지 않은 근거(3-2)와 함께 자기 말로 확인해 적는다.
4. **공부방 카드 영향 범위**: 영향이 없음을 어떻게 확인했는지, 또는 영향이 있으면 그 범위를 적는다.
5. **허용 범위 밖 무변경 확인**: "허용 파일 2개(실제 바꾼 파일 명시) 밖은 건드리지 않았습니다. 이름표 목록에 값을 추가하지 않았고, 저장값·판정·셈법·259 문구·서버 파일은 바꾸지 않았습니다."라는 취지를 자기 말로 확인해 적는다.
6. **멈춘 지점 보고**: push까지 했는지, 병합·배포는 하지 않았다는 것을 적는다.

---

## 10. 한 줄 요약

260 브랜치(`cursor/260-internal-code-exposure-20261019`, 기준 `6ded32e4`)에서 이어서, 과외쌤 프라임·픽 카드 사진 오버레이 하단 4칸만 기존 `slotDash`로 바꿔 전부 모름/빈값이어도 `—`가 보이게 하고(`blankDash` 전역 변경 금지 — 성명 칸과 학생 베이직 항목 생략 규칙이 달라지므로), 등록점검 학교급은 이름표가 없지만 채움인 `general`·`other`의 표시값만 `—`로 하되 상태와 개수는 그대로 두며, 허용 파일은 이 2개뿐(핵심 5줄 안팎·전체 20줄 안팎, 30줄 초과 시 중단 보고)이고 push 후 멈춰 종현 승인 뒤에 병합·배포한다.
