# 252 지시서 — 학생 S-M4 모르는 값이면 영어 코드가 화면에 그대로 찍히는 것 고치기

- 작업 번호: 252
- 날짜: 2026-10-18
- 확정: 종현이 2026-10-18에 `/workspace/study114/audits/s-m4-sample/sample.html`의 샘플 전(sample-before)·후(sample-after)를 승인했다. 확정 문구: "모르는 값은 영어 코드 대신 안전하게 — 모르는 값만 빠지고, 남는 말이 없으면 그 화면 규칙대로 '미입력'으로 보이게."
- 식별: S-M4
- 브랜치 이름: `cursor/252-unknown-value-label-20261018`
- 기준 코드: `origin/main` `9f7df3ad` (재검사 기준). 작업 시작 시점의 최신 `origin/main`에서 브랜치를 만들어라. 줄 번호가 밀렸으면 아래 함수 이름으로 같은 코드를 찾아 확인하고, 함수 내용 자체가 이 지시서와 크게 다르면 멈추고 보고해라(9번).
- 이 글의 목적: 무엇을, 어느 파일만 건드려서, 어떻게 확인할지를 정하는 지시서다. 이 지시서에 없는 변경은 하지 마라.

> 쉬운 말 안내: 코드에 한글 이름표가 없는 값이 화면에 오면, 지금은 영어 코드가 그대로 찍힌다. 이번에는 그 값만 조용히 빼고, 남는 한글이 하나도 없으면 그 칸이 원래 빈값일 때 쓰는 표시(빈칸 → '미입력', 또는 '—')로 보이게만 한다. 정상 값의 문장은 한 글자도 바꾸지 않는다.

---

## 1. 목적

- 라벨 목록(코드→한글 표)에 없는 값(모르는 값)이 화면 표시 문자열에 섞여도, 영어 코드 원값이 화면에 노출되지 않게 한다.
- 모르는 값만 목록에서 빼고, 아는 값은 지금과 똑같이 보여 준다.
- 전부 모르는 값이거나 남는 말이 없으면, 그 함수·그 화면이 원래 빈값일 때 쓰는 규칙대로 보인다(아래 5번 표가 함수별로 정한다. 새 문구를 지어내지 마라).

---

## 2. 샘플 기준 (승인된 전후 문구 — 이 문구와 다르게 만들지 마라)

- 샘플 파일: `study114/audits/s-m4-sample/sample.html` (전후 그림: `sample-before.png` / `sample-after.png`)
- 가짜 코드 2개는 실제 데이터가 아니라 설명용 예시다: `online_zoom`(희망 수업장소), `mock_exam_drill`(희망 강의스타일). 이 두 값을 실제 라벨 목록에 추가하지 마라(6번).
- 승인된 전후 (학생 본인 마이프로필 → 상세정보):

| 경우 | 전 (지금) | 후 (고친 뒤 — 승인됨) |
|---|---|---|
| 정상 | 희망 수업장소 "학생자택, 공공장소" · 희망 강의스타일 "친절, 개념중심" | **그대로 (불변)** |
| 모르는 값 섞임 | 희망 수업장소 "학생자택, `online_zoom`" | 희망 수업장소 "학생자택" (모르는 값만 빠짐) |
| 전부 모르는 값 | 희망 강의스타일 "`mock_exam_drill`" | 희망 강의스타일 "미입력" (회색, 이 화면의 빈값 표시) |

- 위 화면에서 '미입력'이 나오는 이유: `student-reg/profile-read.js`가 빈값(value가 비었거나 '—')을 ''로 넘기고, 렌더가 빈 행을 '미입력'으로 그린다. 즉 함수 쪽이 '—' 또는 빈 문자열을 돌려주면 화면은 자동으로 '미입력'이 된다. **호출 파일(profile-read.js)은 고치지 마라(4번).**

---

## 3. 재검사 결과 (기준: `origin/main` `9f7df3ad`, 줄 번호는 재검사 시점)

고칠 곳은 아래 11곳이 전부다. 전부 같은 패턴 — `목록[값] || 값`처럼 목록에 없으면 원값을 그대로 돌려준다.

| # | 파일 | 줄·함수 | 지금 코드 (원값 반환 부분) |
|---|------|---------|----------------------------|
| 1 | `preview/home-ui/src/student-reg/format.js` | 45 `formatStudentSummaryLine` (현재 호출자 0곳 — 그래도 같은 패턴이라 함께 고친다) | `LESSON_TYPE_LABELS[s.preferred_lesson_type] \|\| s.preferred_lesson_type \|\| '—'` |
| 2 | `preview/home-ui/src/student-reg/format.js` | 52 `labelPlaces` | `STUDENT_PLACE_LABELS[c] \|\| c` |
| 3 | `preview/home-ui/src/student-reg/format.js` | 57 `labelTeachingStyles` | `TEACHING_STYLE_LABELS[c] \|\| c` |
| 4 | `preview/home-ui/src/student-reg/format.js` | 81 `labelSchoolLevel` | `SCHOOL_LEVEL_LABELS[code] \|\| code \|\| '—'` |
| 5 | `preview/home-ui/src/exposure-format.js` | 135 `formatTeachingStyleBadges` | `TEACHING_STYLE_LABELS[b] \|\| b` |
| 6 | `preview/home-ui/src/exposure-format.js` | 181 `formatStudentPlaces` | `STUDENT_PLACE_LABELS[p] \|\| p` |
| 7 | `preview/home-ui/src/exposure-format.js` | 186 `formatStudentCountGroup` | `STUDENT_COUNT_LABELS[code] \|\| code` |
| 8 | `preview/home-ui/src/exposure-format.js` | 199 `formatLessonFormat` | `LESSON_FORMAT_LABELS[lesson_format] \|\| lesson_format` |
| 9 | `preview/home-ui/src/exposure-format.js` | 204 `formatStudentGenderGroup` | `STUDENT_GENDER_GROUP_LABELS[code] \|\| code` |
| 10 | `preview/home-ui/src/detail-decision/student-request-card.js` | 56, 59 `renderStudentRequestBody` 안 places·styles | `STUDENT_PLACE_LABELS[p] \|\| p`, `TEACHING_STYLE_LABELS[b] \|\| b` |
| 11 | `preview/home-ui/src/lifecycle-copy.js` | 71, 76 `profileStatusLabel`·`exposureStatusLabel` | `\|\| key \|\| '—'`, `\|\| status \|\| '—'` (상태값 — 5번의 특별 규칙을 따른다) |

### 안전한 선례 (이미 이렇게 하고 있는 코드 — 방식을 맞추는 근거, 고치지 마라)

- `student-reg/profile-read.js` 희망 유형·희망 과외쌤 성별·학생 성별: 목록에 없으면 `|| ''`로 비운다.
- `detail-decision/student-request-card.js` 렌더 쪽: `esc(places || '—')`, `esc(styles || '—')` — 값이 비면 '—'.
- `exposure-format.js` `formatStudyRoomCapacity`: 모르는 코드형 값이면 '—'로 비운다(자유 입력 문구는 그대로 두는 그 함수의 분기는 이번에 건드리지 마라).

### 참고·제외 (같은 파일에 있어도 이번에 고치지 않는다)

- `exposure-format.js`의 위 11곳 밖에 있는 원값 반환(예: 경력·과외 수업장소·대학교 상태·나이대 등 다른 함수)은 **이번 범위 밖**이다. 보였더라도 고치지 말고, 완료 보고에 "범위 밖 잔존"으로만 적어라. 넓혀야 한다고 생각되면 임의로 고치지 말고 9번대로 멈추고 보고해라.
- `format.js`에서 이미 `|| ''`로 안전하게 비우는 줄(46, 62, 63줄 등)은 그대로 둔다.

---

## 4. 손대도 되는 파일 (아래 4개 파일로 한정, 이 밖은 금지)

1. `preview/home-ui/src/student-reg/format.js` — 3번 표 #1~#4 함수만
2. `preview/home-ui/src/exposure-format.js` — 3번 표 #5~#9 함수만
3. `preview/home-ui/src/detail-decision/student-request-card.js` — 3번 표 #10의 places·styles 두 줄만
4. `preview/home-ui/src/lifecycle-copy.js` — 3번 표 #11의 두 함수 반환 줄만 (5번 특별 규칙)

- 이 밖의 파일(호출 파일, 라벨 목록 파일 `student-enums.js`, 화면·렌더 파일, CSS)이 필요해지면 임의로 고치지 말고 멈추고 보고해라(9번).
- 위 4개 파일 안에서도 지정한 함수·줄 외에는 고치지 마라.

---

## 5. 작업 방법 (이 순서로, 함수별 규칙)

1. 작업 시작 시점의 최신 `origin/main`을 받고, 거기서 브랜치 `cursor/252-unknown-value-label-20261018`을 만든다.
2. 3번 표의 파일·함수를 열어 지금 코드를 직접 읽고 표와 같은지 확인한다.
3. 아래 규칙대로만 고친다. **공통 원칙: 모르는 값은 빼고(filter), 남는 말이 없으면 그 함수가 원래 빈 입력일 때 돌려주는 값과 같게 한다.** 일괄 치환(파일·저장소 전체 찾기·바꾸기)은 금지한다. 함수 하나씩 직접 고쳐라.

| # | 함수 | 고치는 방법 | 전부 모름/빈값일 때 |
|---|------|-------------|----------------------|
| 1 | `formatStudentSummaryLine` | 중간 원값 반환만 뺀다: `LESSON_TYPE_LABELS[...] \|\| '—'` (기존 마지막 '—' 유지) | 지금과 같이 '—' |
| 2 | `labelPlaces` | `list.map((c) => STUDENT_PLACE_LABELS[c]).filter(Boolean).join(', ') \|\| '—'` 형태로, 라벨 없는 값은 빼고 join | '—' (그대로 유지 — profile-read가 '미입력'으로 그림) |
| 3 | `labelTeachingStyles` | #2와 같은 방식 (`TEACHING_STYLE_LABELS`) | '—' (그대로 유지) |
| 4 | `labelSchoolLevel` | `SCHOOL_LEVEL_LABELS[code] \|\| '—'` (중간 `\|\| code`만 뺀다) | '—' |
| 5 | `formatTeachingStyleBadges` | 기존 `.slice(0, max)` 순서·개수 규칙은 그대로 두고, map한 뒤 라벨 없는 값을 빼고 join한다. 끝에 `\|\| '—'`를 붙여 전부 모르면 빈 입력일 때와 같게 한다 | '—' (빈 입력일 때와 동일) |
| 6 | `formatStudentPlaces` | map한 뒤 라벨 없는 값을 빼고 join, 끝에 `\|\| '—'` (빈 입력일 때와 동일하게) | '—' |
| 7 | `formatStudentCountGroup` | `STUDENT_COUNT_LABELS[code] \|\| '—'` (원값 대신 기존 빈값 표시) | '—' (지금 빈값일 때와 동일) |
| 8 | `formatLessonFormat` | `LESSON_FORMAT_LABELS[lesson_format] \|\| '—'` | '—' (지금 빈값일 때와 동일) |
| 9 | `formatStudentGenderGroup` | `STUDENT_GENDER_GROUP_LABELS[code] \|\| '—'` | '—' (지금 빈값일 때와 동일) |
| 10 | `renderStudentRequestBody` places·styles | map한 뒤 라벨 없는 값을 빼고 join한다. 렌더 쪽 `esc(places \|\| '—')`·`esc(styles \|\| '—')`는 이미 있으니 그대로 둔다 | '' → 렌더에서 '—' (지금 빈 목록일 때와 동일) |
| 11 | `profileStatusLabel`·`exposureStatusLabel` | **아래 상태값 특별 규칙** 참조 | '—' |

### #11 상태값(lifecycle-copy) 특별 규칙 — 뜻이 바뀌면 안 되므로 제일 신중히

상태값은 장소·스타일 같은 "고른 값"이 아니라 카드의 현재 상태다. 모르는 상태라고 해서 아는 상태인 것처럼 보이면 뜻이 바뀐다. 그래서:

- **하는 것**: 목록에 없는 상태면 영어 원값(`key`/`status`)을 그대로 보여주지 말고, 두 함수가 원래 빈값일 때 돌려주는 `'—'`를 돌려준다. 즉 `PROFILE_STATUS_LABELS[key] || '—'`, `EXPOSURE_STATUS_LABELS[status] || '—'`처럼 원값 반환 부분만 뺀다.
- **절대 하지 말 것**:
  - 모르는 상태를 '저장중'·'노출중'·'관리자 숨김'·'삭제' 중 하나로 바꿔 보여주지 마라. 상태를 아는 것처럼 꾸미는 것이 되어 뜻이 바뀐다.
  - 모르는 상태를 '미입력'이라고 적지 마라. 이 두 함수의 호출 화면(마이페이지·공부방 목록 배지 등)은 빈 상태를 '미입력'으로 바꾸는 규칙이 없고, 상태가 비어 있다는 뜻도 아니다.
  - `normalizeProfileStatus`(pending → draft 변환 포함)와 `PROFILE_STATUS_LABELS`·`EXPOSURE_STATUS_LABELS` 목록은 한 글자도 바꾸지 마라.
  - 호출 쪽에서 배지 class 등에 쓰는 원본 상태값(`r.profile_status` 등)도 바꾸지 마라. 이번에 바꾸는 것은 화면에 찍히는 글자 반환뿐이다.
- 아는 상태의 표시('저장중'·'노출중'·'관리자 숨김'·'삭제', pending의 '저장중')는 지금과 완전히 같아야 한다.

4. 고친 파일만 하나씩 이름으로 지정해서 add하고, 커밋 메시지 앞머리를 `252`로 시작해서 커밋한다.
   - 예: `252 fix(labels): 모르는 값은 영어 코드 대신 빼고 빈값 표시로 보인다`
5. 브랜치를 push하고 **멈춘다**. main에 합치지 않는다.

---

## 6. 금지 사항

- **라벨 목록 자체 추가·변경 금지**: `student-enums.js` 등 어떤 라벨 표에도 새 코드·새 한글을 넣거나 기존 한글을 바꾸지 마라. 가짜 코드 `online_zoom`·`mock_exam_drill`을 목록에 넣는 것도 금지다. 없는 값은 "빼는" 것으로만 처리한다.
- **정상 값 표시 변경 금지**: 목록에 있는 값의 한글, 구분자(`, ` / ` · `), 순서, 개수 규칙(`slice(0, max)` 포함), 빈 입력일 때 표시를 바꾸지 마라. 정상 입력의 결과 문장은 고치기 전과 글자 단위로 같아야 한다.
- **데이터 저장 방식 변경 금지**: 저장값·코드값·DB·API·요청/응답 형태를 바꾸지 마라. 이번 작업은 화면에 보여주는 문자열을 만들 때만 모르는 값을 거른다.
- **호출 파일 변경 금지**: `profile-read.js`, `exposure-render.js`, `mypage/*`, `study-room-reg/*` 등 호출하는 쪽은 고치지 마라. '미입력'·'—' 표시는 기존 호출 규칙이 이미 만든다.
- **범위 밖 원값 반환 확대 수정 금지**: 3번 "참고·제외"의 다른 함수들까지 함께 고치지 마라.
- **새 문구 창작 금지**: '미입력'·'—'·빈칸처럼 그 화면이 이미 쓰는 빈값 표시만 쓴다. '알 수 없음' 같은 새 말을 만들지 마라.
- **일괄 치환 금지**: `|| c`·`|| code` 등을 파일 전체·저장소 전체에 한 번에 적용하지 마라. 지정한 함수 하나씩 읽고 고쳐라.
- **뜻 변경 금지**: 특히 상태값(5번 #11)에서 뜻이 바뀔 것 같으면 고치지 말고 보고해라.
- **main 병합 금지**: main에 합치지 마라. 브랜치에 커밋하고 push한 뒤 멈춘다.
- **force-push(강제 밀어넣기) 금지**
- **`git add -A` 금지**: 고친 파일만 하나씩 이름으로 지정해서 담아라.

---

## 7. 확인 방법

아래를 모두 확인하고 보고해라. 눈으로만 보지 말고, 가능하면 가짜 값을 넣은 작은 실행(함수 단위 확인 또는 화면 확인)으로 전후를 남겨라.

### 필수 확인 (하나라도 빠지면 완료가 아니다)

1. **정상 값 문장 불변**: 고치기 전후로 아래 정상 입력의 결과가 글자 단위로 같은지 확인하고 전후를 보고에 적어라.
   - `labelPlaces(['student_home','public_place'])` → `학생자택, 공공장소`
   - `labelTeachingStyles(['kind','concept_focus'])` → `친절, 개념중심`
   - `formatTeachingStyleBadges`, `formatStudentPlaces`, #7~#9 단일값 함수, 요청카드 places·styles도 아는 값 1개씩으로 같은지 확인
   - 상태값: `profileStatusLabel('published')` → `노출중`, `profileStatusLabel('pending')` → `저장중`, `exposureStatusLabel('hidden')` → `관리자 숨김`이 그대로인지 확인
2. **가짜 코드 샘플 전후 확인** (승인 샘플과 같은 값으로):
   - 섞인 경우: `labelPlaces(['student_home','online_zoom'])` → 전 `학생자택, online_zoom` / 후 `학생자택`
   - 전부 모름: `labelTeachingStyles(['mock_exam_drill'])` → 전 `mock_exam_drill` / 후 이 화면 기준 '미입력'으로 보이는 값('—' → profile-read 렌더에서 '미입력'). 화면으로 확인할 수 있으면 학생 마이프로필 상세정보에서 두 행을 캡처·대조하고, 함수 단위로만 확인했으면 그 사실을 그대로 적어라.
   - 단일값 함수: 모르는 코드 1개를 넣으면 영어 원값이 아닌 '—'가 나오는지 (#7~#9, #4, #11 상태값 포함). 상태값은 '저장중' 등으로 둔갑하지 않는지도 함께 확인한다.
   - 요청카드: places·styles에 가짜 코드를 섞어, 아는 값만 남고 전부 모르면 '—'로 보이는지 확인한다.
3. **원값 반환 제거 확인**: 허용 4개 파일의 지정 함수 안에서 `|| c`, `|| code`, `|| b`, `|| p`, `|| key`, `|| status`, `|| s.preferred_lesson_type`, `|| lesson_format` 같은 원값 반환이 남지 않았는지 검색 명령과 결과를 보고에 적어라. 단, 3번 "참고·제외"로 남겨 둔 다른 함수의 원값 반환이 파일 검색에 걸리는 것은 실패가 아니다 — 어느 함수에 남았는지 구분해서 적어라.
4. **라벨 목록 무변경**: `git diff`로 `student-enums.js`를 포함한 라벨 표와 상태 목록이 바뀌지 않았는지 확인한다.
5. **금지 파일 무변경**: `git diff --stat` 기준으로 고친 파일이 4번 허용 파일 4개 안에만 있고, 각 파일에서도 지정 함수 외 줄이 바뀌지 않았는지 확인한다.

### 회귀 확인

6. **빈 입력 불변**: 빈 배열·빈 문자열·없는 값(null/undefined)을 넣었을 때 결과가 고치기 전과 같은지 함수별로 확인한다(예: `labelPlaces([])` → '—', `formatStudentCountGroup('')` → '—').
7. **구분자·개수 불변**: `labelPlaces`의 `, `, 나머지 목록 함수의 ` · ` 구분자와 `formatTeachingStyleBadges`의 `slice(0, max)` 개수 제한이 정상 값에서 전과 같은지 확인한다.

---

## 8. 완료 기준

- 대상 11곳에서 모르는 값이 화면 문자열에 영어 원값으로 나오지 않는다.
- 정상 값·빈 입력의 결과 문장이 고치기 전과 같다.
- 라벨 목록·저장 방식·호출 파일이 무변경이고, 고친 파일이 허용 파일 4개 안에만 있다.
- 상태값은 모르는 값일 때 '—'로만 비고, 아는 상태의 뜻·문구가 그대로다.

---

## 9. 범위 밖 수정이 필요하면 중단하고 보고해라 (t1844 규칙)

- **이 지시서에 적힌 범위(허용 파일·작업 방법) 밖의 수정이 필요하다고 판단되면, 임의로 넓히지 말고 그 자리에서 멈추고 보고해라.** 이것이 t1844 규칙이다. 고친 뒤에 "필요해서 같이 고쳤다"고 사후 보고하는 것은 안 된다.
- 특히 아래 경우는 스스로 판단해서 넓히지 말고 반드시 멈추고 보고해라.
  - 허용 파일 밖의 파일(호출·렌더·라벨 목록 파일 포함)을 고쳐야 할 것 같은 경우
  - 3번 "참고·제외"의 다른 원값 반환까지 고쳐야 할 것 같은 경우
  - 고치기 전 코드가 3번 표와 크게 다르거나, 줄이 밀려 같은 함수를 찾을 수 없는 경우
  - 전부 모르는 값일 때 '—'·빈칸이 아닌 다른 표시를 새로 만들어야 할 것 같은 경우, 특히 상태값에서 어떤 아는 상태로 보여줘야 할지 정해야 할 것 같은 경우
  - 정상 값 문장이 바뀔 수밖에 없는 경우
- 중단 보고에는 **어느 파일·어느 함수의 값이, 왜 필요한지/왜 못 고치는지, 허용 범위 안에서는 왜 안 되는지**와 전후 문장을 적어라. 대안까지 임의로 실행하지 말고, 종현의 다음 지시를 기다려라.

---

## 10. 보고 항목 (이대로 보고해라)

작업이 끝나면 아래를 빠짐없이 보고해라.

1. 브랜치 이름(`cursor/252-unknown-value-label-20261018`)과 커밋 번호
2. 바꾼 파일 목록과 파일별 바꾼 줄 수
3. **함수별 전후 대조표**: 3번 표 11곳 모두에 대해 파일·함수, 바꾸기 전 코드, 바꾼 뒤 코드를 적어라.
4. **정상 값 불변 확인 결과**: 7번-1의 입력→출력 전후(글자 단위 동일 여부)
5. **가짜 코드 샘플 확인 결과**: `online_zoom`·`mock_exam_drill`을 섞은 경우와 전부 모르는 경우의 전후. 화면으로 확인했으면 어느 화면인지, 함수 단위로만 확인했으면 그 사실을 적어라.
6. **상태값 확인 결과**: 아는 상태(노출중·저장중·관리자 숨김 등) 불변과, 모르는 상태가 '—'로 비고 다른 상태로 둔갑하지 않았는지
7. **원값 반환 제거 검색 결과**: 쓴 검색 명령과 결과. 범위 밖으로 남겨 둔 다른 함수의 잔존이 있으면 함수 이름을 구분해서 적어라.
8. **라벨 목록·저장 방식 무변경 확인 결과**
9. 허용 파일 밖을 고친 것이 없는지. 만약 범위 밖이 필요해서 멈췄다면, 9번 양식대로 어느 파일·함수가 왜 필요한지 적어라.
