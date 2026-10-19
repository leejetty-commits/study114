# 264 지시서 — 이름 불일치 표기 통일 (248 묶음 6번 중 L-10만, 돈 표기 제외)

> **상태: 확정본 (2026-10-20 종현 확정).** 이 문서에 적은 표기만 확정이다. 아래 표에 없는 표기는 임의로 만들거나 함께 고치지 마라.
> 이 문서가 저장소에 올라가 있어도 **시작 조건(1장)을満た기 전에는 착수하지 마라.** 조건이 안 맞으면 코드를 고치지 말고 보고하고 멈춰라(t1844, 8장).

- 작업 번호: 264
- 날짜: 2026-10-20
- 브랜치 이름: `cursor/264-label-unify-20261020`
- 로컬 정식본: `/workspace/study114/handoffs/264-label-unify-directive-2026-10-20.md`
- 저장소 경로: `docs/worklog/grok-sync/docs/264-cursor-directive-label-unify.md`
- 기준 코드: 최신 `origin/main` (`a24140f0`, `Merge branch 'cursor/263-internal-terms-20261019' into main`, 263 병합 커밋 확인 시점) 이후. **이 해시를 고정 기준으로 착수하지 마라.** 시작 조건을 맞춘 뒤 최신 `origin/main`에서 다시 확인한다(1장).
- 성격: 표시 글자만 바꾸는 작은 작업이다. 동작·판정·저장값·내부 값·DB 구조는 바꾸지 않는다. **지시서 작성 단계에서는 앱 코드를 고치지 않았다. 코드 수정은 이 지시서를 받은 작업자만 한다.**
- 출처(읽기만, 수정 금지): `ds/docs/248-tutor-mode-audit-memo-2026-10-18.md` L-10, `ds/docs/248-1-tutor-work-bundles-proposal-2026-10-19.md` 묶음 6번(L-09·L-10 중 L-10만 이번 범위).

> 쉬운 말 안내: 같은 뜻인데 화면마다 다르게 보이는 이름 세 가지를 하나로 맞춥니다. 과외쌤이 지도할 학생 성별 구성은 「혼성」, 한 번 수업 길이는 「1회 수업시간」, 과외비를 매기는 한쪽 방식은 「주 회수 기준」으로 맞춥니다. 돈 표기(「300천원」 같은 천원 표기)는 이번에 절대 건드리지 않습니다.

---

## 0. 종현 확정 (2026-10-20 — 전부 결정 완료, 임의로 바꾸지 마라)

| # | 항목 | 확정안 |
|---|---|---|
| 1 | 성별 표기 (과외쌤 지도 대상 성별, 내부 값 `mixed`) | **「혼성」으로 통일**한다. 지금 「남여」·「남녀」로 보이는 같은 값 자리만 바꾼다(2·4장). |
| 2 | 수업 시간 표기 | **「1회 수업시간」으로 통일**한다. 지금 「1회 시간」인 한 곳만 바꾼다. |
| 3 | 돈 매기는 방식(산정방식, 내부 값 `monthly_by_weekly_schedule`) | **「주 회수 기준」으로 통일**한다. 지금 「주간 일정 기준」「주간 일정 기준 월액」로 보이는 같은 값 자리만 바꾼다. 짝인 「월 총 횟수 기준」(`monthly_by_total_sessions`)은 **그대로 유지**한다. |
| 4 | 돈 표기 L-09 (「300천원」 등 천원 표기) | **원래 표기 그대로 둔다. 이번 작업에서 절대 건드리지 마라.** 만원 전환은 작업이 커져서 현행 유지로 확정됐다(2026-10-20). |
| 5 | 학생 그룹 구성 표기 | 학생이 그룹 구성을 고르는 「남/여/남여」 계열은 성격이 달라 **이번 범위에서 제외**한다(2-3). 확정 전까지 함께 바꾸지 마라. |
| 6 | 내부 값 | `mixed`, `monthly_by_weekly_schedule`, `monthly_by_total_sessions` 등 내부 코드·저장값은 **절대 바꾸지 않는다. 표시 글자만 바꾼다.** |

이 표와 어긋나는 방식을 작업자가 임의로 고르지 마라. 확정안대로 하려면 허용 파일 밖이 필요해지면 고치지 말고 중단 보고하라(8장).

---

## 1. 시작 조건 (하나라도 안 맞으면 착수 금지)

1. **263이 `main`에 병합된 뒤에 시작한다.** 기준 병합 커밋은 `a24140f0`이다. 착수 전에 `git fetch` 하고, 이 커밋이 최신 `origin/main`의 조상(ancestor)인지 확인한다. 확인이 안 되면 착수하지 말고 보고하고 멈춰라.
2. 위가 확인된 뒤 **최신 `origin/main`에서** 새 브랜치 `cursor/264-label-unify-20261020`를 만든다. 이미 같은 이름의 브랜치가 있으면 새로 파지 말고 그 존재와 상태를 보고에 적고 멈춰 확인을 받아라.
3. 작업 시작 전 `git status`가 깨끗한지 확인한다. 더럽혀져 있으면 그 내용을 보고에 적고 멈춰라.
4. `main`에서 직접 작업하지 마라. **push까지만 한다. `main` 병합·배포·force-push 금지.**
5. 운영 DB를 직접 고치지 마라. 마이그레이션·SQL 적용은 이 작업에 포함되지 않는다.

---

## 2. 전수 확인 결과 (기준 `origin/main` `a24140f0` — 실제 문자열·파일:줄, 2026-10-20 직접 확인)

### 2-1. 지금도 남아 있어 이번에 고치는 것 (같은 내부 값, 화면에 보이는 자리)

| 묶음 출처 | 같은 값(내부 코드, 변경 금지) | 화면(사용자가 보는 기준) | 지금 글자가 있는 곳 |
|---|---|---|---|
| L-10 성별 | 과외쌤 지도 대상 성별 `student_gender_group=mixed` (`tutors.student_gender_group`) | 과외쌤 상세등록 라디오 (상세·수업 화면이 공용으로 읽음) | `preview/tutor-ui/src/state.js:40` `GENDER_GROUP_OPTIONS` — `{ value: 'mixed', label: '남여' }`. `preview/tutor-ui/src/screens/step-detail.js:104`·`step-lesson.js:82`가 `radios('student_gender_group', GENDER_GROUP_OPTIONS, ...)`로 화면에 뿌린다(읽기만, 수정 금지). |
| L-10 성별 | 같은 값 `mixed` (찾기 쪽 과외쌤 축) | 과외쌤찾기 필터·표시의 지도 대상 성별 | `preview/search-ui/src/search-enums.js:64` `GENDER_GROUP_LABELS` — `mixed: '남녀'`. `preview/search-ui/src/search-schema.js:60`이 `db: 'tutors.student_gender_group'`, `optionsKey: 'gender_group'`로 이 사전을 쓰므로 **같은 필드·같은 값의 다른 표기가 맞다. 이번에 포함한다.** (같은 파일 `:86-90` `STUDENT_GENDER_GROUP_LABELS`는 학생 축이라 제외 — 2-3.) |
| L-10 수업 시간 | 수업 길이 항목 (`minutes_per_lesson`) | 과외쌤 기본정보 현황(개요) 한 줄 | `preview/tutor-ui/src/screens/step-basic.js:98` 한 곳만 `{ label: '1회 시간', ... focus: 'minutes_per_lesson' }`. 같은 파일 `:144` 입력 라벨은 이미 「1회 수업시간」이다. |
| L-10 산정방식 | `monthly_by_weekly_schedule` | 과외쌤 상세등록 산정방식 선택 | `preview/tutor-ui/src/state.js:79` `FEE_BASIS_OPTIONS` — `label: '주간 일정 기준'`. `step-detail.js:81`·`step-lesson.js:65`가 화면 선택지로 뿌린다(읽기만). |
| L-10 산정방식 | 같은 값 `monthly_by_weekly_schedule` | 마이페이지 > 내 등록 > 상세정보 산정방식 선택 | `preview/home-ui/src/tutor-reg/screens.js:396` `FEE_BASIS_OPTS` — `label: '주간 일정 기준 월액'`. `:515` `name="fee_basis_type"` 선택칸이 이 목록을 쓴다. |

- 이미 「혼성」이라 그대로 두는 같은 값 자리(읽기만, 수정 금지): `preview/home-ui/src/tutor-reg/screens.js:403` `GENDER_GROUP_OPTS`, `preview/home-ui/src/exposure-format.js:62`, `preview/home-ui/src/tutor-reg/profile-read.js:14`, `preview/home-ui/src/tutor-reg/registration-check-model.js:24`, `preview/auth-ui/src/register-enums.js:110` `GENDER_GROUP_OPTIONS`, `src/Auth/RegisterEnums.php:113` `tutorGenderGroups()`. 마이페이지가 이미 「혼성」인 것이 통일 기준이다.
- 이미 「1회 수업시간」이라 그대로 두는 자리(읽기만): `preview/tutor-ui/src/screens/step-basic.js:144`를 비롯해 가입·학생·공부방·찾기·마이페이지 각 화면과 `preview/shared/lesson-duration-options.js:6`, `src/Tutor/TutorBasicFields.php:26` 등 다수. 이번에 바꿀 곳은 위 현황 한 줄뿐이다.
- 이미 「주 회수 기준」이라 그대로 두는 자리(읽기만, 수정 금지): `preview/home-ui/src/tutor-reg/profile-read.js:39-40`, `preview/home-ui/src/tutor-reg/registration-check-model.js:73-74`. 이 두 곳이 통일 기준이다. 짝인 「월 총 횟수 기준」은 모든 자리에서 그대로 둔다.

### 2-2. 확인했지만 이번 허용에 넣지 않은 것 — 서버 사전·가입 사전 (화면 표기에 직접 쓰이지 않음)

| 곳 | 지금 글자 | 넣지 않는 근거 (최신 `origin/main`에서 직접 확인) |
|---|---|---|
| `src/Auth/RegisterEnums.php:183` `feeBasisTypes()` | `monthly_by_weekly_schedule` → 「주간 일정 기준 월액」 | **화면 표기에 쓰이지 않아 이번 허용에서 뺀다.** 저장소 전체에서 `feeBasisTypes()` 호출처가 0건이다(`git grep feeBasisTypes` 결과 정의 한 곳뿐). 이 파일 머리말도 「auth-ui register-enums.js와 동일 code → label」인 짝 사전일 뿐, 어떤 PHP 화면(`src/Views/**`)도 이 함수를 읽어 뿌리지 않는다. 그래서 이 파일을 고쳐도 사용자 화면 글자는 바뀌지 않는다. **고치지 마라.** 화면이 실제로 이 사전을 읽는다고 확인되면 임의로 넣지 말고 중단 보고하라(8장). 같은 파일 `genderGroups():103` 「남여」는 학생 축(2-3)이라 역시 제외하고, `tutorGenderGroups():113`은 이미 「혼성」이라 손댈 곳이 없다. |
| `preview/auth-ui/src/register-enums.js:76` `FEE_BASIS_OPTIONS` | `monthly_by_weekly_schedule` → 「주간 일정 기준 월액」 | **가입 화면에서 쓰이지 않아 이번 허용에서 뺀다.** 이 상수를 가져다 쓰는 곳이 저장소에 0건이다. 가입 기본 화면 `preview/auth-ui/src/screens/signup-basic.js:2-7`은 이 파일에서 `PREFERRED_LESSON_TYPE_LABELS·PERSONAL_GENDER_OPTIONS·LESSON_FORMAT_OPTIONS·STUDENT_COUNT_OPTIONS`만 가져가고, 산정방식은 가져가지 않는다. 고쳐도 화면이 바뀌지 않는 정의만 있는 자리이므로 **고치지 마라.** 실제로 화면에 뿌려진다고 확인되면 중단 보고하라(8장). 같은 파일 `GENDER_GROUP_OPTIONS:110`은 이미 「혼성」이다. |

### 2-3. 성격이 달라 이번 범위에서 뺀 것 — 학생이 그룹 구성을 고르는 표기 (확정 전까지 제외)

아래는 모두 **학생 쪽** `students.student_gender_group`(학생이 그룹과외 희망 구성을 고르는 값)의 「남/여/남여」 표기다. 과외쌤이 지도 대상을 고르는 「남학생/여학생/혼성」과 **필드·주체·짝 글자가 다르다.** 종현 확정(0장 5번)대로 이번에는 바꾸지 않는다. 왜 뺐는지 완료 보고에도 그대로 적어라.

| 곳 | 지금 글자 | 쓰는 화면·근거 |
|---|---|---|
| `preview/home-ui/src/student-enums.js:12` `STUDENT_GENDER_GROUP_LABELS` | `mixed: '남여'` (짝: 남/여) | 파일 머리말 「그룹과외 희망 구성 (`students.student_gender_group`)」. 학생 표시·학생 등록 양식이 읽는다. |
| `preview/search-ui/src/search-enums.js:89` `STUDENT_GENDER_GROUP_LABELS` | `mixed: '남여'` (짝: 남/여) | `search-schema.js:82` `db: 'students.student_gender_group'`, `label: '그룹 구성'`인 학생 축. 같은 파일이라도 `:64` 과외쌤 축과 섞지 마라. |
| `preview/auth-ui/src/register-enums.js:104` `STUDENT_GENDER_GROUP_OPTIONS` | `mixed` → 「남여」 (짝: 남/여) | 학생 그룹 구성 선택지. 같은 파일 과외쌤용 `GENDER_GROUP_OPTIONS:110`은 이미 「혼성」이다. |
| `src/Auth/RegisterEnums.php:103` `genderGroups()` | `mixed` → 「남여」 (짝: 남/여) | 학생 축 짝 사전. 과외쌤용 `tutorGenderGroups():113`은 이미 「혼성」이다. |
| `src/Search/SearchService.php:61` `GENDER_GROUP_LABELS` | `mixed` → 「남여」 (짝: 남/여) | `:1275`에서 학생 찾기 결과 행(`students` 행)의 그룹 구성 요약 문구를 만들 때만 쓴다. 학생 축이라 제외한다. |

- 그 밖에 문서·SQL 주석에만 있는 「남여」(예: `docs/ssot/**`, `sql/schema/011_student_gender_group.sql` 주석)는 화면 글자가 아니라 이번 범위 밖이다. 고치지 마라.
- `src/Tutor/TutorDetailCompletionEvaluator.php:90`의 「1회 수업 시간」(띄어 쓴 표기)은 서버가 돌려주는 부족 항목 이름 목록 쪽 글자로, 이번 확정인 현황 「1회 시간」 한 곳과 문자열·자리가 다르고 미리보기 화면에서 그대로 뿌려지는지 확인되지 않았다. **이번에 함께 고치지 마라.** 화면에 그대로 노출된다고 확인되면 임의로 넣지 말고 중단 보고하라(8장).

줄 번호는 `a24140f0` 기준 참고값이다. 최신 `origin/main`에서 줄이 밀렸으면 같은 상수·문장을 찾아 확인하고, 내용이 2장과 크게 다르면 억지로 맞추지 말고 멈추고 보고하라.

---

## 3. (없음 — 문구는 4장 표가 정본이다)

---

## 4. 문구 전후 표 (이 표대로만 바꿔라)

| # | 화면(사용자가 보는 기준) | 지금 문구 | 바꿀 문구 | 위치 (내부 값은 그대로) |
|---|---|---|---|---|
| 1 | 과외쌤 상세등록 > 지도 대상 성별 라디오 | `남여` | `혼성` | `preview/tutor-ui/src/state.js` `GENDER_GROUP_OPTIONS`의 `mixed` (짝 남학생·여학생은 그대로) |
| 2 | 과외쌤찾기 > 지도 대상 성별(학생 성별 구성) 필터·표시 | `남녀` | `혼성` | `preview/search-ui/src/search-enums.js` `GENDER_GROUP_LABELS`의 `mixed`만 (같은 파일 학생용 `STUDENT_GENDER_GROUP_LABELS`는 금지 — 6장) |
| 3 | 과외쌤 등록 > 기본정보 현황 한 줄 | `1회 시간` | `1회 수업시간` | `preview/tutor-ui/src/screens/step-basic.js` 현황 목록의 `minutes_per_lesson` 한 줄만 |
| 4 | 과외쌤 상세등록 > 과외비 산정방식 선택 | `주간 일정 기준` | `주 회수 기준` | `preview/tutor-ui/src/state.js` `FEE_BASIS_OPTIONS`의 `monthly_by_weekly_schedule` (짝 「월 총 횟수 기준」은 그대로) |
| 5 | 마이페이지 > 내 등록 > 상세정보 > 과외비 산정방식 선택 | `주간 일정 기준 월액` | `주 회수 기준` | `preview/home-ui/src/tutor-reg/screens.js` `FEE_BASIS_OPTS`의 `monthly_by_weekly_schedule` (짝 「월 총 횟수 기준」은 그대로) |

- 바꾸는 것은 위 다섯 줄의 **표시 글자뿐**이다. 내부 값(`mixed`·`monthly_by_weekly_schedule`)·짝 선택지·주변 글자는 지금 그대로 둔다.
- 표에 없는 문구는 바꾸지 마라. 같은 파일에 있어도 표 밖 문구는 그대로 둔다. 특히 `search-enums.js`에서는 2번 상수만 고치고 학생용 상수는 건드리지 마라.

---

## 5. (없음 — 사전·서버 작업은 이번에 없다. 2-2 근거를 다시 확인하고, 필요해지면 중단 보고하라.)

---

## 6. 금지 영역

1. **허용 4개 파일 밖의 모든 파일 수정 금지**(7장). 특히 아래는 건드리지 마라.
   - 서버 사전 `src/Auth/RegisterEnums.php`와 가입 사전 `preview/auth-ui/src/register-enums.js` — 화면에 직접 쓰이지 않아 제외했다(2-2). 임의로 넣지 마라.
   - 학생 그룹 구성 표기 일체(2-3): `preview/home-ui/src/student-enums.js`, `search-enums.js`의 `STUDENT_GENDER_GROUP_LABELS`, `register-enums.js`의 `STUDENT_GENDER_GROUP_OPTIONS`, `RegisterEnums.php`의 `genderGroups()`, `src/Search/SearchService.php` — 학생 축이라 확정 전까지 제외다.
   - 학생·공부방·가입·고객센터 등 다른 화면의 같은 단어. 이번 통일은 4장 다섯 자리만이다.
2. **돈 표기(천원) 변경 절대 금지.** 「300천원」·「월 ○○천원」·「예산 (천원)」·「월 과외비 (천원)」 등 천원 표기와 금액 계산·단위 변환을 이번에 바꾸지 마라(L-09 현행 유지 확정). 눈에 보여도 고치지 말고 완료 보고의 「범위 밖 관찰」에도 이번에 고쳤다고 쓰지 마라.
3. **내부 값·저장값·판정 변경 금지.** `mixed`, `monthly_by_weekly_schedule`, `monthly_by_total_sessions`, `minutes_per_lesson`, `student_gender_group`, `fee_basis_type` 같은 내부 코드와, 성별·산정방식·수업시간 판정, 저장 동작을 바꾸지 마라. 바꾸는 것은 사용자에게 보이는 글자뿐이다.
4. **「월 총 횟수 기준」 변경 금지.** 산정방식 짝 선택지는 모든 자리에서 지금 글자 그대로 둔다.
5. **다른 묶음 항목 끌어오기 금지.** L-09(돈 표기)를 비롯해 248 다른 묶음·다른 항목을 이번에 함께 고치지 마라. 눈에 보여도 고치지 말고 완료 보고의 「범위 밖 관찰」에만 적어라.
6. 새 문구 창작 금지. 4장 표의 바꿀 문구와 글자 단위로 같게만 쓴다. 「혼성」·「1회 수업시간」·「주 회수 기준」 외 다른 표현으로 바꾸지 마라.
7. 그 밖: `git add -A` 금지(허용 파일만 이름으로 `git add`), **force-push 금지**, `main` 직접 작업 금지, CSS·레이아웃 변경 금지, 운영 DB·서버 설정 변경 금지.

---

## 7. 허용 파일 목록 (이름 단위 — 이 4개 밖은 절대 수정 금지)

| # | 허용 파일 | 무엇을 고치는지 (한 줄) | 예상 diff |
|---|---|---|---|
| 1 | `preview/tutor-ui/src/state.js` | 1·4번: 지도 대상 성별 「남여」→「혼성」, 산정방식 「주간 일정 기준」→「주 회수 기준」 (이 두 줄만) | 2줄 |
| 2 | `preview/search-ui/src/search-enums.js` | 2번: 과외쌤 축 `GENDER_GROUP_LABELS`의 「남녀」→「혼성」 (학생용 상수는 금지) | 1줄 |
| 3 | `preview/tutor-ui/src/screens/step-basic.js` | 3번: 기본정보 현황 「1회 시간」→「1회 수업시간」 (이 한 줄만) | 1줄 |
| 4 | `preview/home-ui/src/tutor-reg/screens.js` | 5번: 산정방식 「주간 일정 기준 월액」→「주 회수 기준」 (`FEE_BASIS_OPTS` 한 줄만) | 1줄 |

- **예상 합계: 바뀐 줄 기준 5줄, 4개 파일.** 전부 제자리 글자 교체라 순증가는 0이다.
- **범위 초과 시 중단 보고 (t1844):** 허용 파일이 **8개를 넘거나**, 바뀐 줄 합계가 **20줄을 넘을** 것 같거나, 서버 사전·학생 표기·서버 판정·DB·SQL 변경이 필요해지면 범위를 넓히고 있다는 신호이니 **임의로 넓히지 말고 중단 보고**하라(8장). 허용 파일 안에서도 4장에서 지정한 줄만 고친다.

---

## 8. 중단 보고 조건 (t1844 — 멈추고 보고할 것)

아래 중 하나라도 해당하면 **코드를 넓혀 고치지 말고, 그 시점에서 멈춰 보고**하라. 보고에는 막힌 지점, 확인한 근거(파일:줄), 필요한 결정을 적는다.

1. 허용 파일이 **8개를 넘거나**, 바뀐 줄 합계가 **20줄을 넘을** 것으로 보일 때.
2. 서버 사전(`RegisterEnums.php`)·가입 사전(`register-enums.js`)을 고쳐야 화면이 바뀐다고 판단될 때(2-2 근거와 어긋날 때).
3. 학생 그룹 구성 표기(2-3)까지 바꿔야 말이 맞는다고 판단될 때.
4. 글자만 바꿔서는 안 되고 동작·판정·저장값·내부 값을 바꿔야 할 때.
5. 돈 표기(천원)를 함께 바꿔야 한다고 판단될 때.
6. 4장 표의 지금 문구가 최신 코드에서 찾을 수 없거나, 내용이 2장과 크게 다를 때.
7. 시작 조건(1장)이 안 맞을 때 (263 병합 미포함, 같은 이름 브랜치 존재, 작업 트리가 깨끗하지 않음).

---

## 9. 작업 순서

1. 시작 조건(1장)을 확인한다. 263 병합(`a24140f0`)이 최신 `origin/main`에 포함되지 않았으면 착수하지 말고 보고하고 멈춘다.
2. `git fetch` 후 최신 `origin/main`에서 브랜치 `cursor/264-label-unify-20261020`를 만든다. 착수 직후 2장의 근거 줄들을 최신 코드로 다시 확인한다.
3. 허용 파일 4개만, 4장 표대로 표시 글자만 바꾼다. 범위 밖이 필요하다고 판단되면 멈추고 보고한다(8장).
4. 확인한다(10장). 문자열 검색 결과와 화면 확인을 보고에 적는다.
5. 커밋한다. `git add`는 허용 파일만 이름으로 지정한다(`git add -A` 금지). 커밋 메시지는 바꾼 내용이 드러나게 쓴다.
6. **push 후 멈춘다.** `main` 병합·배포는 종현 승인 후에만 한다. force-push 금지.

---

## 10. 확인 방법 (완료 보고에 그대로 적어라)

### 10-1. 문자열 검색 (허용 파일 안에서 옛 글자가 0인지, 범위 밖 잔존과 구분)

작업 브랜치에서 아래를 돌리고 결과를 보고에 적어라. 옛 글자가 남았으면 그 파일:줄과 이유를 적는다.

```bash
git grep -n -E '남여|남녀|주간 일정 기준|1회 시간' -- preview/tutor-ui/src/state.js preview/tutor-ui/src/screens/step-basic.js preview/home-ui/src/tutor-reg/screens.js
git grep -n -E '남여|남녀' -- preview/search-ui/src/search-enums.js
git grep -n -E '혼성|1회 수업시간|주 회수 기준' -- preview/tutor-ui/src/state.js preview/search-ui/src/search-enums.js preview/tutor-ui/src/screens/step-basic.js preview/home-ui/src/tutor-reg/screens.js
git grep -n -E '남여|남녀|주간 일정 기준' -- preview src
```

- 기대 결과: 첫 검색은 **0건**이어야 한다. (`1회 시간`은 「1회 수업시간」에도 걸리니, 단독 표기가 남았는지는 줄 내용을 눈으로 확인해 구분해 적어라.)
- 둘째 검색(`search-enums.js`)은 학생용 `STUDENT_GENDER_GROUP_LABELS:89` 「남여」 **1건만 남는 것이 정상**이다. 이건 범위 밖 학생 표기(2-3)이니 고쳤다고 쓰지 말고, 과외쌤 축 `GENDER_GROUP_LABELS`는 「혼성」이 됐는지 셋째 검색으로 확인해 적어라.
- 마지막 저장소 전체 검색에서 걸리는 가입 사전·서버 사전·학생 표기·문서·SQL 주석의 옛 글자는 **범위 밖 잔존**으로 따로 적어라(2-2·2-3). 화면 노출분(4장 다섯 자리)이 0건인지와 섞어 보고하지 마라.
- 내부 코드(`mixed`·`monthly_by_weekly_schedule` 등)와 주석에 남은 옛 단어가 있으면 화면 노출과 구분해 적어라. 내부 값 자체는 검색 대상이 아니며 바꾸지 않는다.

### 10-2. 화면 확인 (바꾼 글자가 화면에 그대로 나오는지)

| 케이스 | 확인할 것 | 기대 결과 |
|---|---|---|
| (a) 성별 | 과외쌤 상세등록의 지도 대상 성별 라디오와, 과외쌤찾기 지도 대상 성별 필터·표시를 본다. | 두 곳 모두 「혼성」으로 보이고 「남여」·「남녀」가 없다. 학생 그룹 구성 화면은 이번 범위 밖이라 「남여」가 남아 있어도 고치지 않는다. |
| (b) 수업 시간 | 과외쌤 기본정보 현황 한 줄과 바로 아래 입력 라벨을 함께 본다. | 현황·입력 모두 「1회 수업시간」으로 보이고, 단독 「1회 시간」이 없다. |
| (c) 산정방식 | 과외쌤 상세등록과 마이페이지 상세정보의 산정방식 선택지를 연다. | 두 곳 모두 한쪽은 「주 회수 기준」, 짝은 「월 총 횟수 기준」 그대로이고, 「주간 일정 기준」 계열이 없다. |
| (d) 돈 표기 불변 | 월 과외비·예산이 보이는 자리를 본다. | 「○○천원」 표기가 작업 전과 같고, 금액·단위 계산이 바뀌지 않았다. |

- 바꾼 글자 외의 동작(선택·저장·필터 결과, 수업시간·금액 계산)이 수정 전과 같은지도 함께 적어라. 내부 값으로 저장·조회되는 값은 바뀌지 않았음을 확인해 적어라.
- 자동 검사(verify 스크립트 등)를 돌렸으면 이름과 결과를, 못 돌렸으면 이유를 적어라.

---

## 11. 완료 보고 양식

완료 보고에는 아래를 빠짐없이 적어라.

1. 브랜치 이름과 push한 커밋 해시. 시작 시점의 `origin/main` 해시와 263 병합 포함 확인 방법.
2. 바꾼 파일 목록과 파일별 실제 diff 줄수 (허용 4개 안인지 명시).
3. 4장 표 1~5번 항목별 전→후 대조 (실제로 바꾼 것만. 바꾸지 않은 항목이 있으면 이유).
4. 10-1 문자열 검색 결과와 10-2 케이스 (a)~(d) 확인 결과. 범위 밖 잔존(학생 표기·미사용 사전·문서·SQL 주석)은 화면 노출분과 분리해 적어라.
5. 범위 확인 문장: "허용 파일 4개(실제 바꾼 파일 명시) 밖은 건드리지 않았습니다. 돈 표기(천원)·내부 값·저장값·판정·「월 총 횟수 기준」·학생 그룹 구성 표기·서버 사전·다른 묶음 항목은 바꾸지 않았습니다."라는 취지를 자기 말로 확인해 적어라.
6. 범위 밖으로 본 관찰이 있으면 「범위 밖 관찰」로 분리해 적되, 이번에 고쳤다고 쓰지 마라.
7. 멈춘 지점 보고: push까지 했는지, 병합·배포는 하지 않았다는 것을 적어라.
