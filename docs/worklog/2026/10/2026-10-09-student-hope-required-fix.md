# 작업 기록: 학생 가입 「공부방 찾기」 선택 시 「다음」 무반응 (student-hope-required-fix)

- 작업 일자: 2026-10-09
- 작업 브랜치: `cursor/student-hope-required-fix-20261009` (기반: `origin/main` `b5ffeb5`)
- 작업 디렉토리: `d:\work\study114\.wt\student-hope-fix`
- 커밋: `e89333d` (코드) · 이 기록 커밋
- 상태: 검수·승인 대기

---

## 1. 지시서 원문

````text
You are a WORKER for the study114 repo. Answer/report in Korean.

Work ONLY in worktree `d:\work\study114\.wt\student-hope-fix` on branch `cursor/student-hope-required-fix-20261009` (already created from origin/main b5ffeb5). Do not touch other folders. Rules: never push to main, no `git add -A` (stage explicit files only), no amend of pushed commits, no `git clean`, no secrets. Do not log in to production or use any accounts. Push your branch when done.

## Bug (confirmed on production with Playwright, 2026-10-09)
auth-ui signup basic step `/signup/basic?role=student` (`preview/auth-ui/src/screens/signup-basic.js`). When the student picks 希望 유형 = 「공부방 찾기」 (preferred_lesson_type=study_room), the tutor block `[data-student-tutor-block]` gets the `hidden` attribute, but the tutor region cascade inside it is rendered by `renderTutorUnitCascade({ idPrefix: 'student_hope', ..., required: tutorUnits.length > 0 })`, so `select#student_hope_sido` keeps `required`. Hidden-but-enabled required controls still take part in HTML constraint validation, so clicking 「다음」 does nothing: the submit event never fires, no alert, no message (Chrome just logs "An invalid form control is not focusable"). Diagnostic on prod: all visible fields filled, `form.querySelectorAll(':invalid')` = only `SELECT#student_hope_sido` (hiddenAncestor=true). So every student who wants 공부방 cannot finish signup. Students who pick 과외 work.

## Task
1. Fix in `syncStudentHopeBlocks()` (or equivalent) so controls inside the hidden block never block submit: e.g. remember original required (`data-required-when-shown`) and set `required` only while the block is visible; or disable controls of the hidden block if that is safe (check that values are still read correctly: tutor block values are read via querySelector `.value`, study block via `readStudentHopeRegion`). Keep the existing JS validation messages (alerts) as the real validation. Apply the same treatment symmetrically to the study-room block if it contains any required control. Prefer the smallest change; match surrounding code style; no explanatory comments unless a constraint is not obvious.
2. Search the other places with the same pattern (a hidden branch block containing `required` controls inside a form that is submitted), at least: `preview/home-ui/src/student-reg/**`, mypage registrations student edit forms, `preview/shared/*` forms that toggle `hidden` on blocks with `renderTutorUnitCascade`/`renderRegionCascade` `required: true`, tutor/study-room basic forms. Fix the ones that have the identical bug in the same way; list the ones you checked.
3. Add a verify script `scripts/verify-student-hope-hidden-required.mjs` (node, no browser needed if possible; follow the style of existing `scripts/verify-*.mjs`, e.g. string/DOM checks with jsdom if already a devDependency — check package.json; do not add new dependencies). It must fail on b5ffeb5 code and pass after the fix. Register it in package.json scripts only if similar verify scripts are registered there.
4. Run: the new verify script, `node scripts/verify-tutor-region-unit.mjs`, `node scripts/verify-no-sample-data.mjs`, `npm run verify:shop-page`, and `npm run build:dothome` if node_modules exist (if the build writes into public/, do NOT commit build outputs; report them). Report pass/fail with numbers.
5. Worklog: create `docs/worklog/2026/10/2026-10-09-student-hope-required-fix.md` with: section 1 = this instruction verbatim (copy this whole prompt), then cause, change, files, verification, remaining risks. Commit code + worklog (explicit paths) and push the branch.

Final report: commit hash(es), files changed with one line each, verification results, other places checked, anything the user must do before deploy (SQL/env/.htaccess — expected none).
````

## 2. 원인

- `renderStudentBasic()` 은 희망 유형과 상관없이 과외 희망지역 칸(`[data-student-tutor-block]`)을 항상 그린다. 과외 단위 목록이 있으면 `renderTutorUnitCascade({ required: tutorUnits.length > 0 })` 라서 `select#student_hope_sido` 에 `required` 가 붙는다.
- `syncStudentHopeBlocks()` 는 공부방 찾기일 때 이 칸에 `hidden` 만 붙이고 `required`·`disabled` 는 그대로 둔다. 예산 칸은 `disabled` 로 같이 바꾸지만 희망지역 칸은 빠져 있었다.
- 브라우저 제약검사는 숨은 조상이 있어도 `disabled` 가 아니면 검사한다. 빈 `required` select 가 숨어 있으니 「다음」을 눌러도 submit 이벤트가 안 나고, 포커스할 칸도 안 보여 안내 없이 멈춘다. JS 검사(alert)는 submit 리스너 안에 있어서 아예 돌지 않는다.
- 공부방 희망지역 칸(`renderStudentHopeRegion`)에는 `required` 칸이 없다(검색 칸은 readonly, 값은 hidden input). 과외를 고르면 이 칸이 숨어도 막히지 않는다. 그래서 과외 쪽만 성공했다.

## 3. 변경

- `preview/auth-ui/src/screens/signup-basic.js` `syncStudentHopeBlocks()`:
  공부방·과외 두 칸 모두, 처음 `required` 였던 칸에 `data-required-when-shown` 표시를 남기고 `required` 는 칸이 보일 때만 켠다. 두 칸에 똑같이 적용(공부방 칸은 지금 required 가 없어 바뀌는 것 없음).
- `disabled` 방식은 쓰지 않았다. `collectFormData()` 가 `FormData` 로 읽어서 disabled 칸은 빠지고, `bindInputFill` 표시도 바뀌기 때문이다. `required` 만 끄면 값 읽기(과외 칸 `querySelector(...).value`, 공부방 칸 `readStudentHopeRegion`)는 그대로다.
- 과외 칸이 보일 때는 `required` 가 그대로라서 시·도를 안 고르면 예전처럼 브라우저가 막는다. 실제 검사는 기존 alert(「희망지역을 선택해 주세요」「행정동을 찾지 못했습니다…」 등) 그대로.
- 검사 스크립트 `scripts/verify-student-hope-hidden-required.mjs` 추가, `package.json` 에 `verify:student-hope-hidden-required` 등록(같은 꼴의 `verify:no-sample-data`·`verify:location-ssot` 가 등록돼 있음).

## 4. 같은 모양 점검 (다른 곳)

| 위치 | 결과 |
|---|---|
| `preview/home-ui/src/student-reg/screens.js` (마이페이지 학생 기본정보 수정) | 문제 없음. `renderTutorUnitCascade` 에 `required` 안 넘김. `syncBasic()` 이 숨은 `[data-p19-hope-panel]` 안의 칸을 모두 `disabled` 로 바꿈 |
| `preview/home-ui/src/tutor-reg/screens.js` (과외쌤 마이페이지 기본·상세) | 문제 없음. required 칸(표시명·주력과목·예산·대학)은 숨는 분기 블록 안에 있지 않음 |
| `preview/home-ui/src/mypage/screens.js` (표시명·비밀번호·탈퇴) | 문제 없음. 숨는 패널마다 자기 `<form>` 이 따로 있어 숨은 폼은 제출되지 않음 |
| `preview/shared/tutor-region-slots.js` (과외쌤 가입·마이페이지 지역 1~3) | 문제 없음. 1번 칸 required 는 항상 보임 |
| `preview/shared/study-room-basic-form.js` (공부방 가입·마이페이지 기본) | 문제 없음. required 칸(교습형태·이름·주력과목·성별·슬로건·주소)은 숨는 블록 밖. 숨는 `data-dong-search`/`data-complex-search` 안 칸은 required 아님(readonly) |
| `preview/shared/region-cascade.js` 사용처 (`search-find-surface.js` 찾기 폼) | 문제 없음. `required` 안 넘김 |
| `preview/auth-ui/src/screens/signup-basic.js` 과외쌤·공부방 분기 | 문제 없음. 역할별로 따로 그려 숨는 블록 없음 |
| `preview/auth-ui/src/screens/signup-account-contact.js` | 문제 없음. 이메일 칸은 보일 때 `required = true` 로 켬(같은 방향) |

## 5. 검증 (worktree, 2026-10-09)

| 명령 | 결과 |
|---|---|
| `node scripts/verify-student-hope-hidden-required.mjs` (수정 후) | **18 passed, 0 failed** |
| `node scripts/verify-student-hope-hidden-required.mjs --ref b5ffeb5` (수정 전 소스) | **11 passed, 7 failed** — 숨은 `SELECT#student_hope_sido` 가 :invalid, submit 없음, 저장 API 0회, alert 0회 (운영 진단과 같음) |
| `node scripts/verify-no-sample-data.mjs` | PASS 5/5, 검사 파일 415개, `no-sample-data OK` |
| `npm run verify:shop-page` | exit 0 (PASS) |
| `node scripts/verify-tutor-region-unit.mjs` | **127 passed, 7 failed** — 7개 모두 이번 변경과 무관(아래) |
| `npm run build:dothome` | 성공(home-ui·auth-ui·search-ui·study-room-ui·tutor-ui 빌드). worktree 에 node_modules 가 없어 스크립트가 각 앱에 `npm install` 후 빌드 |

- 검사 스크립트 방식: jsdom 이 devDependency 에 없어 새 의존성 없이 작은 가짜 DOM(HTML 파서·선택자·폼 값·이벤트)을 스크립트 안에 둔다. 실제 `signup-basic.js` 소스의 import 만 바꿔 끼우고(공용 모듈은 실제 것, 주소검색·API·라우팅만 대체) `renderStudentBasic` · `bindSignupBasicEvents` 를 그대로 돌린다. 「다음」은 브라우저 제약검사 규칙(disabled·readonly·hidden input 제외, 숨은 조상은 제외 안 함)을 통과해야만 submit 리스너가 돈다.
- 검사 항목: 공부방으로 바꾼 뒤 제출 → 저장 API(study_room, 공부방 희망지역 id) / 저장값이 공부방인 채로 처음 열기 / 공부방 희망지역 비움 → 기존 alert 로 멈춤 / 과외로 되돌리면 required 복원 / 과외 시·도 미선택은 브라우저가 막음(기존) / 과외 서울특별시 저장 / 마이페이지 학생 폼 disabled 처리 정적 확인.
- `verify-tutor-region-unit.mjs` 7 FAIL: 4부의 「origin/main 과 같음」 비교가 `origin/main` 의 `coarseRegionForGuest(locationLabel)` 옛 시그니처를 정규식으로 찾는데, `origin/main`(= `b5ffeb5`)에 이미 과외지역 단위 변경이 병합돼 시그니처가 `(locationLabel, kind = 'study_room')` 로 바뀌어 「main 읽기 실패」가 난다. 이번 변경은 `preview/home-ui`·`preview/search-ui`·`preview/shared`·`src` 를 건드리지 않는다(`git diff --stat b5ffeb5` 해당 경로 0).
- 빌드 산출물(커밋 안 함): `public/assets/Pretendard-{Bold,Medium,Regular,SemiBold}.subset-*.woff2`, `public/assets/teaser-DcYkIyu_.js` (untracked), 그 밖의 `public/index.html`·`public/assets/index-*` 등은 gitignore.

## 6. 커밋

- 코드 `e89333d`: `signup-basic.js` · `verify-student-hope-hidden-required.mjs` · `package.json`
- 기록: 이 파일

## 7. 남은 위험

- 운영 실제 브라우저 확인은 하지 않았다(계정 로그인 금지). 배포 후 학생 가입에서 「공부방 찾기」 → 모든 칸 입력 → 「다음」 → 완료 화면 이동을 사람이 한 번 확인해야 한다.
- 가짜 DOM 은 브라우저 제약검사를 흉내 낸 것이다. 운영 진단(`:invalid` = 숨은 `SELECT#student_hope_sido` 하나)과 같은 결과를 내는 것까지 확인했다.
- `verify-tutor-region-unit.mjs` 4부의 origin/main 비교 정규식은 이미 병합된 main 과 맞지 않는다. 별도 과제로 고쳐야 한다(이번 범위 밖, 보고만).
- 배포 전 사용자 할 일: 없음(SQL·환경변수·Secrets·`.htaccess` 변경 없음).

## 독립 검수 (메인 기록, 2026-10-09 01:55)

- 검수자: 다른 모델(claude-4.6-sonnet), 읽기 전용, 별도 worktree(df08bb7). 판정: **승인 권고**, 결함 없음.
- 숨은 블록 required 토글 7개 시나리오 정상, 캐스케이드가 나중에 required를 추가하는 경로 없음, 검사 스크립트 수정 전 7 실패·수정 후 18/18, 변경 파일 4개만, no-sample-data OK.
- 사용자 승인: 대기 (승인 대상 `e89333d`). 배포 전 사용자 할 일 없음.
