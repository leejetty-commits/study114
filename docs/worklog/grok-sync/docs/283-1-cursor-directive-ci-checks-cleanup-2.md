# 283-1 지시서 — 남은 빨간 검사 3개 정리 (C·D·E, 검사 파일만)

- 기준: origin/main **de553125** (Merge 283, 5d8e317d). 줄 번호는 2026-10-22에 이 코드로 확인함.
- 브랜치: **cursor/283-1-ci-checks-20261022** (de553125에서 새로 만든다). **이 브랜치에만 push, main 병합 금지.**
- 근거: main de553125 Verify bundle run 39763043936 — 실패 단계는 Tutor search fields(E), Tutor basic required(D), Student hope hidden required(C) 3개뿐. 나머지 단계와 다른 검사 워크플로 5개는 초록.

## 0. 앞 지시서 결과 확인 (먼저)
- `git log --oneline -2 origin/main`에 `de553125 Merge 283`이 있는지 확인. 없으면 멈추고 보고.
- 루트 `npm ci` 뒤 아래 세 개를 돌려 지금 실패가 이 지시서와 같은지 확인. 다르면(실패 수·문장이 다름) 고치지 말고 멈추고 보고.
  - `npm run verify:student-hope-hidden-required` → FAIL 1개 「희망지역 비움: submit 은 나고 JS 검사 alert 로 멈춤 · 저장 안 함」
  - `npm run verify:tutor-basic-required` → FAIL 6개(아래 D 표)
  - `npm run verify:tutor-search-fields` → FAIL 1개 「확대카드 손님 「로그인 후 확인」 4칸 … 유지 · 파일 = 기준 커밋」

## 쉬운 말 요약 (종현 확인용)
- 화면은 그대로 두고, 화면이 예전에 바뀐 것(246, 269)을 검사가 못 따라간 3곳만 검사 쪽에서 고친다.
- 검사를 끄거나 건너뛰게 하지 않는다.

## 1. 고칠 곳

### C — scripts/verify-student-hope-hidden-required.mjs:582 (섹션 3, :574-583)
- 지금: 희망지역을 비우면 `alerts`에 「행정동」 안내가 떠야 한다고 기대.
- 화면 사실: 학생 기본정보는 alert를 쓰지 않고 칸 아래 오류를 보인다. `preview/auth-ui/src/screens/signup-basic.js:883-888`(`studentBasicTried` → `collectStudentIssues` → `applyStudentFieldErrors` → return), 오류 문구 만들기 `:205-215`, 칸 오류 표시 `:235-246`(오류 칸 `hidden=false`, 문구 넣기).
- 고침: 같은 줄을 「submit 은 남 · 저장 API 0번 · 희망지역(preferred_region) 오류 칸이 보이고 문구가 비어 있지 않음」으로 바꾼다. 가짜 DOM에서 오류 칸을 찾는 방법이 없으면 stub만 보탠다.

### D — scripts/verify-tutor-basic-required.mjs (246 = 11fe6e49가 renderBasic을 나눔)
- 화면 사실: `preview/tutor-ui/src/screens/step-basic.js`의 입력칸은 이제 `renderBasicFields`(:114)에 있고, `renderBasic`(:217)은 겉틀이다. `renderBasic`은 그리는 중에 `document.body.classList.toggle`(:222)을 쓴다.
- 고침:
  1. 렌더 부분(:308-322) 가짜 환경에 `globalThis.document = { body: { classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } } } }`처럼 **없을 때만** 넣는다.
  2. 글자 검사용 본문 `:155` `'tutor-ui renderBasic': fnBody(files.stepBasic, 'renderBasic')`를 `renderBasic` + `renderBasicFields` 본문을 합친 것으로 바꾼다(:449·:461 변조 검사도 같은 값을 쓰므로 함께 따라옴).
- 지금 FAIL 6개(이 6개만 고쳐져야 함):
  | # | FAIL 문장 |
  |---|---|
  | 1 | tutor-ui renderBasic: 대상·월 과외비·주 회수·1회 수업시간·슬로건 입력 있음 |
  | 2 | tutor-ui renderBasic: 과외지역 칸 = renderTutorRegionSlot |
  | 3 | tutor-ui renderBasic 렌더됨(새 등록 상태) |
  | 4 | tutor-ui renderBasic 렌더 html: 지역 2·3번만 「(선택)」 |
  | 5 | 변조 잡음: tutor-ui 기본등록에 form-label--required 추가 |
  | 6 | 변조 잡음: 렌더 html 에 학교급 미리 선택 |
- 기대 문장·조건 자체(무엇을 검사하는지)는 바꾸지 않는다. 읽는 위치만 바꾼다.

### E — scripts/verify-tutor-search-fields.mjs:142-145
- 화면 사실 (preview/home-ui/src/detail-decision/tutor-detail.js): 손님이 과외쌤 확대카드를 보면 **4칸이 「로그인 후 확인」**으로 가려진다 — **일정(:43), 강의스타일(:48), 학적상태(:49), 학교·학과(:50).** 검사가 기대하는 4칸과 같다.
- 실패 이유: 같은 줄이 파일 전체가 기준 커밋 `3f03aaa`(:23 BASE_REF)와 **글자까지 같기**를 요구한다. 그 뒤 이 파일을 바꾼 커밋은 269-1(a2b612cb) 하나뿐이고, 라벨 2개만 바꿨다: 「성별」→「과외쌤 성별」, 「원생수」→「학생구성」.
- 고침: 이 줄만, 기준 파일에 그 두 라벨 바꿈을 적용한 글자와 같은지로 비교한다(또는 이 파일만 비교 기준을 a2b612cb로). 4칸 개수 검사(:144)와 :273-274 런타임 검사는 그대로. 다른 기준 커밋 비교 줄은 건드리지 않는다.

## 2. 허용 파일
- scripts/verify-student-hope-hidden-required.mjs, scripts/verify-tutor-basic-required.mjs, scripts/verify-tutor-search-fields.mjs. 이 셋뿐.

## 3. 하지 않는 것
- 화면·서버 코드(preview/*/src, src/, public/) 고치기.
- 검사 끄기·지우기·skip·continue-on-error, 워크플로 파일, 기대값을 무조건 지금 결과로 덮기.
- 다른 검사 줄의 조건 바꾸기.
- **범위 밖이 필요하면 멈추고 보고.**

## 4. 멈출 때
- 246(11fe6e49)이나 269(a2b612cb)로 설명되지 않는 FAIL이 나오면(위 목록에 없거나, 고친 뒤에도 남으면) → 그 줄은 그대로 두고 파일:줄·FAIL 문장·이유 추정을 보고.
- C에서 화면이 희망지역을 비웠는데 저장하거나 오류 칸을 안 보이면 → 진짜 버그 후보로 보고(화면은 안 고침).

## 5. 확인 · 합격 기준
- 로컬: 루트 `npm ci` 후 세 검사 모두 FAIL 0.
- **합격 = cursor/283-1-ci-checks-20261022 push 후 GitHub Actions 「Verify bundle」 전체 초록**(모든 단계 success). 다른 워크플로가 이 push로 돌면 그것도 초록.

## 6. 커밋 나누기
1. 283-1 test(C): 학생 희망지역 비움 — 저장 안 함 + 칸 오류 표시로 검사
2. 283-1 test(D): 과외쌤 기본등록 검사 — document.body 가짜 + renderBasicFields 본문
3. 283-1 test(E): 확대카드 손님 칸 검사 — 269 라벨 2개 반영
- 파일 이름으로 add → `git push origin cursor/283-1-ci-checks-20261022` (force 아님) → **멈춤. main 병합 금지.**

## 7. 보고
- 커밋 3줄과 해시, 고친 파일:줄, 세 검사 로컬 결과(PASS/FAIL 수), Verify bundle run 번호와 단계별 결과, 멈춤 조건에 걸린 것(없으면 「없었다」). 쉬운 말로.
