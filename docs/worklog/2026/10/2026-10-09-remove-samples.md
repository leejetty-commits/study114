# 작업 기록: 견본·가짜 카드 전부 제거 (remove-samples)

- 작업 일자: 2026-10-09
- 작업 브랜치: `cursor/remove-samples-20261009` (기반: `origin/main` `bc76015`)
- 작업 디렉토리: `d:\work\study114\.wt\remove-samples`
- 커밋: `1ac704f` (가) · `3bb07fb` (나) · `1fbe4ae` (다) · `542b599` (검사 스크립트) · 이 기록 커밋
- 상태: 검수·승인 대기

---

## 1. 지시서 원문

> 주의: 작업 도중 대화가 요약되어, 지시서 메시지 원문 파일을 다시 열 수 없었다. 아래는 작업자가 보관한 사용자 인용(따옴표 부분은 원문 그대로)과 지시 항목을 그대로 옮긴 것이다. 메인 에이전트는 원문 전체를 이 절에 덧붙여 주기 바란다.

### 1-0. 지시서 원문 전체 (2026-10-09 메인 에이전트가 대화 기록에서 복구해 덧붙임)

````text
너는 study114 작업자다. 보고는 한국어. Windows PowerShell(한글 출력 전 `[Console]::OutputEncoding=[Text.Encoding]::UTF8`).

## 규칙 (반드시)
- 새 worktree를 만들어 그 안에서만 작업: `cd d:\work\study114; git fetch origin; git worktree add .wt/remove-samples -b cursor/remove-samples-20261009 origin/main`. 다른 폴더(`d:\work\study114` 본체, 다른 .wt/*, d:\work\study114-*)는 절대 건드리지 마라.
- `git add -A`/`git add .` 금지. 파일명 지정 stage. amend 금지. main push·merge 금지. 작업 브랜치만 push.
- SQL·.htaccess·env·Secrets 변경 금지. 빌드 산출물(public/assets 등) 커밋 금지(빌드로 바뀐 추적 파일은 `git checkout -- <파일>`로 되돌림).
- 다른 기능(지역 단위, 베이직카드 항목, 저장 버그)은 이번에 고치지 마라. 발견하면 보고만.

## 사용자 지시 (2026-10-09 00:05, 원문)
「견본카드들은 다 제거해. 그 견본카드들의 항목을 수렴할려고 또 새로운 알고리즘을 만들면 안돼. 견본카드들은 그때 그때 필요에 의해 그냥 만든 것 뿐이야. 이건 없애면 돼. … 문제는 지금부터야. 제대로 된 로직대로 가동되고 있느냐만 따지면 돼.」
범위 선택: (가)(나)(다) 전부 제거. 사용자는 기존 계정을 전부 지우고 다시 만들 예정이다(옛 데이터 호환용 코드 만들지 말 것).

## 표면 목록 (메인이 origin/main bc76015 기준으로 고정. 빠진 게 있으면 추가 보고)

### (가) 가짜 회원 데이터 풀 — `preview/home-ui/src/exposure-data.js` 의 STUDY_ROOM_SEED·TUTOR_SEED·STUDENT_SEED 및 EXPOSURE_*/DUMMY_*
사용처(전부 처리):
1. `preview/search-ui/src/search-exposure-mapper.js` 55/109/141행: `const base = pooled || EXPOSURE_*[index % …]` 후 `...base` 펼침 → 실제 카드 빈칸에 가짜 값(대학 '서울대학교', 특징, 수업장소, 강의스타일, 성별·인원, 증빙, 유튜브 등)이 들어감. 가짜 base를 완전히 없애고, API 값만 쓴다. API에 없는 칸은 빈 값(카드에서 빈칸/미표시). `apiItem.x || base.x` 형태의 가짜 폴백 전부 제거.
2. `preview/home-ui/src/exposure-bridge.js` patchPool: 가짜 풀에 실데이터를 덮어쓰는 구조. 풀은 **실제 API 결과만 담는 빈 배열로 시작**하게 하라(시드 제거). 새 알고리즘 만들지 말고, 기존 배열을 비운 채로 쓰는 최소 변경.
3. `preview/home-ui/src/detail-decision/index.js` 47-50 (확대카드/상세가 풀에서 찾음), `user-actions-state.js` 54 (찜·비교), `handoff-lifecycle.js` 81, `student-review-store.js` 47, `myshop/public-resolve.js` 70, `search-ui/src/search-provider-self.js` 45 (PREVIEW_OWN_TUTOR_ID 가짜 내 카드), `home-ui/src/data.js` 9-15 재수출. → 가짜 레코드를 못 찾으면 가짜로 대체하지 말고 실제 데이터만. 실제 데이터가 없으면 기존 빈 상태/없음 처리 경로를 쓴다(없으면 null 반환하고 호출부가 이미 null을 다루는지 확인).
4. exposure-data.js의 SEED 데이터 자체 삭제. export 이름이 여러 곳에서 쓰이면 빈 배열로 남겨도 됨(단, 가짜 항목 0개).

### (나) 「샘플」 도장 카드 (실카드 0건일 때 1장)
- `preview/home-ui/src/exposure-render.js` 332(샘플 도장), 335-355(샘플 공부방/과외쌤 아이템), 655(실등록 0 — 샘플 1 + 빈 1), 1109 주변.
- `preview/search-ui/src/search-tier-render.js` 20, 36-48 (학생 홈 0건 샘플).
- `preview/search-ui/src/search-find-surface.js` 137, 180, 2495 (게스트 찾기 0건 샘플 블록).
- `preview/shared/guest-gate-ui.js` 282 (샘플 카드 클릭 처리 — 샘플이 없어지면 샘플 관련 분기만 제거, 빈카드 클릭은 유지).
→ 0건이면 샘플 없이 **기존 빈 카드 박스/빈 상태 문구만**. 새 빈 상태 디자인을 만들지 마라. 빈 칸 수는 기존 규칙(샘플이 차지하던 자리는 빈 칸으로) 그대로.

### (다) 설명용 예시 카드 (등록점검·쪽지설정)
- `preview/home-ui/src/home-card-samples/*` (presets.js buildStudyRoomSampleItem/buildTutorSampleItem, render.js renderInquirySampleCard/등록점검 샘플), `inquiry-settings/sample-*.js`, `study-room-reg/inquiries-sample.js`, `study-room-reg/registration-check-edit.js` 27, `tutor-reg/registration-check-edit.js` 5, `tutor-reg/registration-check-sample.js`, `study-room-reg/registration-check-render.js`(rc-tier 비교 샘플), 쪽지설정 화면의 「쪽지 설정시 카드 샘플」 블록(`tutor-reg/inquiries-render.js`, study-room-reg 쪽), `main.js` 26 주석 관련 토큰, `plans/screens.js` 341(Pick 5×2 미리보기 타일 — 샘플 재사용).
→ 예시 카드 블록과 그 블록 전용 안내 문구(registration-check-copy.js 36 「샘플은 홈 실제 카드와 같은 크기…」, inquiries-copy sampleTitle 등)를 삭제. 대체물을 만들지 마라. 단 화면이 깨지면 안 됨(빈 제목만 남는 등 금지).

### 확인만 (사용자 화면에 가짜 값이 보이면 제거, 아니면 그대로 두고 보고)
- `preview/home-ui/src/plans/history-mock.js` (결제내역: 'seed' 행이 화면에 나오는지), `preview/home-ui/src/mypage/preview-data.js`(프리뷰 더미가 실제 마이페이지에 나오는지).
- 관리자 화면 더미(a28-screens.js, sms-lab-store.js)는 이번 범위 밖. 건드리지 말고 목록만 보고.

## 검사 게이트
- `scripts/` 의 verify 스크립트 중 샘플 카드를 **기대하는** 단언(예: verify-guest-baseline-map-cards.mjs의 「실카드 0건이면 샘플 1장」)은 「샘플 0장」으로 바꾼다. 단언을 지우기만 하지 말고 반대 방향으로 바꿔라.
- 새 게이트 `scripts/verify-no-sample-data.mjs`: (1) preview/ 소스에서 TUTOR_SEED/STUDY_ROOM_SEED/STUDENT_SEED 정의 0, (2) search-exposure-mapper에 `EXPOSURE_` 폴백 0, (3) '샘플 과외쌓'/'샘플 공부방'/'expo-sample-stamp' 0, (4) home-card-samples presets import 0. 대상 경로는 preview/ (admin 제외).
- 기존 deploy.yml 배포 전 게이트 전부 실행(`npm run verify:shop-page` 포함) + `npm run build:dothome` 성공. 실패는 이번 변경 때문인지(main에서도 실패하는지) 구분해 보고.
- 로컬 화면 확인이 가능하면(vite dev) 손님 홈·과외쌤찾기·학생홈 0건 화면에 샘플이 안 보이고 빈 카드만 보이는지 확인. 불가하면 「미실행+사유」.

## 기록·커밋
- `docs/worklog/2026/10/2026-10-09-remove-samples.md`: '지시서 원문'에 이 메시지 전체, 바꾼 파일·함수 목록, 표면별 변경 전/후 표, 검사 결과 표, 표면 목록에서 빠져 있던 추가 발견, '배포 전 사용자 할 일'(없으면 없음), 검수·승인 칸 '대기'.
- 허용 파일만 개별 add → commit(여러 개여도 됨, (가)(나)(다) 단위 권장) → `git push -u origin cursor/remove-samples-20261009`.

## 보고
커밋 hash 목록, 바꾼 파일 수, 표면별 변경 요약, 검사 결과 표, 추가 발견, 확인만 항목 결과, 미확인 목록.
```` 

### 1-1. 작업자 재구성본 (참고)

```markdown
너는 study114 작업자다. 보고는 한국어. Windows PowerShell(한국어 출력 전 [Console]::OutputEncoding=[Text.Encoding]::UTF8).

## 사용자 지시 (2026-10-09 00:05, 원문)
「견본카드들은 다 제거해. 그 견본카드들의 항목을 수렴할려고 또 새로운 알고리즘을 만들면 안돼. 견본카드들은 그때 그때 필요에 의해 그냥 만든 것 뿐이야. 이건 없애면 돼. … 문제는 지금부터야. 제대로 된 로직대로 가동되고 있느냐만 따지면 돼.」
범위: (가)(나)(다) 전부 제거. 기존 계정은 지우고 새로 만들 것이므로 옛 데이터 호환 코드 불필요.

## 규칙 (반드시)
- 새 worktree를 만들어 그 안에서만 작업: `cd d:\work\study114; git fetch origin; git worktree add .wt/remove-samples -b cursor/remove-samples-20261009 origin/main`. 다른 폴더(`d:\work\study114` 본체, 다른 .wt/*, d:\work\study114-*)는 절대 건드리지 마라.
- `git add -A`/`git add .` 금지. 파일명 지정 stage. amend 금지. main push·merge 금지. 작업 브랜치만 push.
- SQL·.htaccess·env·Secrets 변경 금지. 빌드 산출물(public/assets 등) 커밋 금지(빌드로 바뀐 추적 파일은 `git checkout -- <파일>`로 되돌림).
- 다른 기능(지역 단위, 베이직카드 항목, 저장 버그)은 이번에 고치지 마라. 발견하면 보고만.

## 제거 대상
(가) exposure-data.js 가짜 회원 풀(STUDY_ROOM_SEED/TUTOR_SEED/STUDENT_SEED, EXPOSURE_*/DUMMY_*).
    매퍼는 API 값만 쓴다(`apiItem.x || base.x` 폴백 없음). bridge 풀은 빈 배열로 시작해 실제 API 결과만 담는다.
    detail-decision, user-actions-state, handoff-lifecycle, student-review-store, public-resolve,
    search-provider-self(PREVIEW_OWN_TUTOR_ID), data.js 재export 가 가짜로 대체하지 않게.
(나) 실카드 0장일 때 나오는 「샘플」 도장 카드(exposure-render, search-tier-render, search-find-surface, guest-gate-ui).
    0장이면 기존 빈 박스만. 샘플이 쓰던 칸은 빈 칸으로. 새 빈 상태 디자인 금지.
(다) 설명용 견본카드: home-card-samples/*, inquiry-settings/sample-*, inquiries-sample, registration-check 샘플,
    쪽지설정 「카드 샘플」 블록, main.js 토큰, plans/screens.js Pick 미리보기 타일.
    블록과 전용 문구를 지운다. 대체물 없음, 깨진 화면 없음.
확인만: history-mock.js, mypage/preview-data.js — 사용자에게 가짜 값이 보이면 제거.
관리자 더미(a28-screens.js, sms-lab-store.js)는 범위 밖: 목록만 보고.

## 검사
- scripts/ 의 verify 스크립트 중 샘플 카드를 기대하는 단언은 「샘플 0장」으로 바꾼다. 단언을 지우기만 하지 말고 반대 방향으로 바꿔라.
- 신규 `scripts/verify-no-sample-data.mjs` (preview/, admin 제외):
  1) TUTOR_SEED/STUDY_ROOM_SEED/STUDENT_SEED 정의 0
  2) search-exposure-mapper 의 `EXPOSURE_` 폴백 0
  3) '샘플 과외쌤'/'샘플 공부방'/'expo-sample-stamp' 0
  4) home-card-samples 프리셋 import 0
- 기존 deploy.yml 배포 전 게이트 전부 실행(`npm run verify:shop-page` 포함) + `npm run build:dothome` 성공.
  실패가 있으면 이번 변경 때문인지(main 에서도 실패하는지) 밝혀라.
- 가능하면 vite dev 에서 게스트 홈·과외쌤찾기·학생 홈(0장)에 샘플이 없고 빈 카드만 나오는지 확인. 못 하면 「미실행+사유」.

## 기록·커밋
- `docs/worklog/2026/10/2026-10-09-remove-samples.md`: '지시서 원문'(이 메시지 전체), 바꾼 파일·함수,
  화면별 전/후 표, 검사 결과 표, 추가 발견, '배포 전 사용자 할 일'(없으면 없음), 검수·승인 '대기'.
- 허용 파일만 개별 stage → commit((가)(나)(다)별 권장) → `git push -u origin cursor/remove-samples-20261009`.

## 보고
commit hash, 바꾼 파일 수, 화면별 요약, 검사 결과 표, 추가 발견, 확인만 항목 결과, 미확인 항목.
```

---

## 2. 바꾼 파일·함수

### (가) `1ac704f` — 가짜 회원 풀·시드 폴백 제거 (10파일)

| 파일 | 바뀐 내용 |
|---|---|
| `preview/home-ui/src/exposure-data.js` | STUDY_ROOM_SEED·TUTOR_SEED·STUDENT_SEED·expandSeed·DUMMY_*·`window.__STUDENT_PREVIEW_POOL` 삭제. `EXPOSURE_STUDY_ROOMS/TUTORS/STUDENTS` = 빈 배열(실제 검색 결과만 담김) |
| `preview/home-ui/src/data.js` | EXPOSURE_*/DUMMY_* 재export 삭제(가져다 쓰는 곳 없음) |
| `preview/home-ui/src/exposure-bridge.js` | 매퍼 `mapStudyRoom/mapTutor/mapStudent(item)` — base 인자 제거, API 값만(없으면 `''`/`null`/`0`). `patchPool` 은 풀을 비우고 API 결과만 채움. `resetExposureBridge()` 가 세 풀도 비움 |
| `preview/search-ui/src/search-exposure-mapper.js` | `mapToExposureItem` — resolveDetailItem·EXPOSURE_* 시드 폴백 삭제. `{ ...apiItem, 명시 필드(API 값만) }`. 배지는 병합값으로 계산 |
| `preview/search-ui/src/search-provider-self.js` | `PREVIEW_OWN_TUTOR_ID`(가짜 id 1) 삭제. `getProviderSelfFeed` 가 가짜 내 프라임 카드를 만들지 않음(null). 과외쌤 자기 필터는 `resolveOwnTutorId()`(내 등록: 공개 우선 → 첫 행) |
| `preview/home-ui/src/detail-decision/index.js` | 변수명 `seed`→`bridged`(이제 실제 검색 결과 풀만 조회) |
| `preview/home-ui/src/myshop/public-resolve.js` | 머리 주석만(시드 캐시 → 검색 결과 캐시) |
| `preview/home-ui/src/plans/history-mock.js` | `getSeedHistory`('샘플 공부방'/'샘플 과외쌤' 결제 견본 행) 삭제. `getLocalHistoryRows` = `[]` |
| `preview/home-ui/src/mypage/preview-data.js` | `SUBMISSION_DOC_ITEMS`(가짜 제출 상태) 삭제. `getSubmissionDocs` = `[]` |
| `preview/home-ui/src/mypage/screens.js` | `renderSubmissionDocs` — 자료가 있을 때만 요약 배지·표 |

수정하지 않음(이제 실제 결과 풀만 보며 null 처리 이미 있음): `user-actions-state.js`, `handoff-lifecycle.js`, `student-review-store.js`.

### (나) `3bb07fb` — 「샘플」 도장 카드 제거 (7파일)

| 파일 | 바뀐 내용 |
|---|---|
| `preview/home-ui/src/exposure-render.js` | presets·readGuestBaseline import, `zones.sample`, `isVacantSample`, `sampleStampHtml`, `vacantStudyRoomSample/vacantTutorSample/vacantStudentSample`, 샘플용 inert 레일 분기, 샘플 class/attr 삭제. `renderGuestVacantBasicList()` = 빈 칸 2개. 빈 프라임/픽 칸에 샘플 넣던 분기 삭제. 옵션 `vacantSamples`→`vacantFill` |
| `preview/search-ui/src/search-tier-render.js` | `studentHomeSample` 삭제. 학생 홈 0장 = 프라임 빈 칸 × primeSlots, 픽 빈 칸 × 5, 베이직 빈 칸 × 2 |
| `preview/home-ui/src/guest-sections.js` | `vacantSamples`→`vacantFill` (5곳) |
| `preview/search-ui/src/search-find-surface.js` | 주석 3곳 |
| `preview/shared/guest-gate-ui.js` | 빈카드 선택자에서 `[data-expo-sample]` 삭제 |
| `preview/home-ui/src/styles/home-listings.css`, `udx-std-apply.css` | `.expo-sample-stamp` 규칙 삭제 |

### (다) `1fbe4ae` — 설명용 견본카드 블록 제거 (24파일)

- 삭제: `home-card-samples/{presets,render,guides}.js`, `inquiry-settings/{sample-cards,sample-presets,sample-ui}.js`, `study-room-reg/inquiries-sample.js`, `tutor-reg/registration-check-sample.js`, `styles/home-card-samples.css`
- 등록점검(공부방·과외쌤): `registration-check-render.js` 의 `renderCards`(카드 샘플 블록) 삭제, `registration-check-edit.js` 의 확대 버튼 바인딩 삭제, `registration-check-copy.js` 의 cardsTitle·cardsLead(「샘플은 홈 실제 카드…」)·kicker·expandCard·expandHint 삭제
- 쪽지설정(공부방·과외쌤): `study-room-reg/screens.js`, `tutor-reg/inquiries-render.js`·`inquiries-edit.js` 의 「쪽지 설정시 카드 샘플」 블록·화살표 안내 삭제, `study-room-reg-copy.js`·`inquiries-copy.js` 의 sample*·previewTitle 삭제
- 유료상품: `plans/screens.js` 의 공부방 Pick 미리보기 타일·과외쌤 Prime/Pick 순환 미리보기 타일(가짜 이름) 삭제. P1~P10 칸 격자(이름 없음)는 유지
- `main.js`: home-card-samples.css import·주석 삭제
- CSS: `home-member-flows.css` 의 `.p21-inq-block--samples`·`.inq-sample*`, `inquiry-settings-catalog.css` 의 `.p20-inq-sample*` 삭제

### 검사 스크립트 `542b599` (15파일)

| 파일 | 바뀐 내용 |
|---|---|
| `scripts/verify-no-sample-data.mjs` (신규), `package.json` | 4항목 게이트, `npm run verify:no-sample-data` |
| `verify-study-room-inquiries-samples.mjs` (배포 게이트) | 샘플 카드 기대 단언 → 샘플 모듈·문구·블록·CSS 없음 단언. 프레임·저장·순서(설명→상태→수정→저장) 단언 유지 |
| `verify-tutor-inquiries-settings.mjs` (배포 게이트) | 같은 방식. 렌더 HTML 에 샘플 이름·사진·화살표·카드 없음 |
| `verify-study-room-registration-check-frame.mjs`, `verify-tutor-registration-check-frame.mjs` | 카드 샘플·확대 버튼·hcs CSS 기대 → 없음 단언, 「픽·프라임 블록 다음 바로 현황판」 |
| `verify-guest-baseline-map-cards.mjs` | P5/P9: 샘플 1장 → 샘플 0장(빈 칸만), `vacantFill` |
| `verify-student-branch-two-tabs.mjs` | (b) 샘플 도장·티어별 샘플 3장 → 샘플 0장 |
| `verify-student-count-halt-and-gate.mjs` | 샘플카드 클릭 → 로그인 창 열림 → 옛 `data-expo-sample` 요소는 게이트 대상 아님 + guest-gate-ui 선택자에 없음 |
| `verify-card-visual-penetration.mjs`, `verify-parent-review-positive.mjs` | 가짜 풀 `EXPOSURE_*[0]` fixture → 검사 전용 고정 입력. P19 「샘플 카드 없음」 PASS 항목 |
| `verify-student-mypage-metrics.mjs`, `capture-student-mypage-shots.mjs` | 삭제된 CSS 목록에서 제거 |
| `e2e-inquiry-settings-closeout.mjs` | 샘플 실측·화살표 부분 삭제, 저장·재진입·F5 단계마다 「샘플 없음」 확인 |
| `measure-inquiry-basic-cards.mjs` | 삭제(샘플 카드 폭 실측 전용 도구) |

---

## 3. 화면별 전/후

| 화면 | 전 | 후 |
|---|---|---|
| 실제 카드 전체(홈·찾기·확대카드) | API id 가 시드 id 와 겹치면 가짜 값(대학·경력·사진·배지 등) 섞임, 아니면 `EXPOSURE_[i % n]` 값으로 빈 칸 메움 | API 값만. 없는 값은 비어 보임 |
| 게스트 홈 (실카드 0) | 베이직·픽·프라임 칸에 「샘플」 도장 카드 1장씩 | 기존 빈 칸만(「등록하면 여기에 나와요」) |
| 공부방찾기·과외쌤찾기 게스트 첫 화면 (0건) | 베이직 샘플 1장 + 빈 칸 | 빈 칸 2개 |
| 학생 홈 분기 탭 (0건) | 프라임·픽·베이직 샘플 3장 + 빈 칸 | 프라임 빈 칸 3·픽 빈 칸 5·베이직 빈 칸 2 |
| 과외쌤 홈 「우리동네 과외쌤」 | 검색 전 가짜 내 프라임 카드(시드 id 1) | 없음(실제 결과만) |
| 공부방·과외쌤 등록점검 | BASIC/PICK/PRIME 카드 샘플(가상 이름·사진) + 확대 버튼 | 블록 없음. 픽·프라임 추가 입력 → 현황판 |
| 공부방·과외쌤 쪽지설정 | 「쪽지 설정시 카드 샘플」 2장 + 화살표 안내 | 블록 없음. 설명 → 현재상태 → 수정 → 저장 |
| 유료상품(Pick/Prime) | 가짜 이름 미리보기 타일·순환 페이저 | 타일 없음. P1~P10 칸 격자·현황판 유지 |
| 결제내역 | API 전·실패 시 '샘플 공부방/과외쌤' 견본 행 | 빈 목록 |
| 과외쌤 제출자료 상태 | 가짜 상태 표(검토중·승인 등) | 자료 없으면 표·요약 배지 없음 |

---

## 4. 확인만 항목 결과

- `plans/history-mock.js`: API 전·실패 시 사용자에게 견본 결제 행이 보였다 → 제거(위 표).
- `mypage/preview-data.js`: 과외쌤 /mypage/submission-docs 에 가짜 제출 상태가 보였다 → 제거. 같은 파일의 `getSummaryCounts`(가짜 `paidDaysLeft: 12` 등)는 어디서도 import 하지 않아 화면에 안 보임 → 그대로 둠.
- 관리자 더미(범위 밖, 목록만): `admin/a28-copy.js` A28_REPORT_SEED·A28_LOG_SEED, `admin/a28-screens-state.js` A28_MEMBER_SEED, `admin/a28-screens.js` 주소 더미, `admin/sms-lab-store.js` '학부모 샘플'·'공부방 샘플'.

---

## 5. 검사 결과

| 검사 | 명령 | 결과 | 비고 |
|---|---|---|---|
| 신규 게이트 | `node scripts/verify-no-sample-data.mjs` | **PASS** 4/4 (414파일) | origin/main 에서는 4항목 모두 FAIL — 게이트가 실제로 잡음 |
| 배포 게이트: ShopPage | `npm run verify:shop-page` | **PASS** 54/0 | |
| 배포 게이트: 비밀값 | `bash scripts/check-no-committed-secrets.sh` (Git Bash) | **PASS** | |
| 배포 게이트: 과외쌤 쪽지설정 | `npm run verify:tutor-inquiries-settings` | **PASS** | 샘플 0장 방향으로 반전 |
| 배포 게이트: 공부방 쪽지설정 | `npm run verify:study-room-inquiries-samples` | **PASS** | 샘플 0장 방향으로 반전 |
| 배포 게이트: 064 SQL 파일 | `Test-Path sql/schema/064_tutor_inquiry_status.sql` | **PASS** | |
| Board ACL: PHP 문법 | `bash scripts/php-syntax-check.sh` (PHP 8.2) | **PASS** 309파일 | |
| Board ACL: JS | `npm run verify:board-acl:js` | **PASS** | |
| Board ACL: PHP | `php scripts/verify-board-channel-acl.php` | **PASS** | |
| Board ACL: 비교 | `node scripts/compare-board-acl-matrix.mjs` | **PASS** 75행 일치 | |
| 빌드 | `npm run build:dothome` | **PASS** 5앱 | 추적 파일 변경 없음, 산출물 미커밋 |
| 게스트 기준 지역·카드 | `verify-guest-baseline-map-cards.mjs` | **PASS** 73/0 | |
| 학생 분기 두 탭 | `verify-student-branch-two-tabs.mjs` | **PASS** 162/0 | |
| 학생 수 안내·빈카드 게이트 | `verify-student-count-halt-and-gate.mjs` | **PASS** 29/0 | |
| 카드 정책 관통 | `verify-card-visual-penetration.mjs` | **PASS** 37/0 (INFO 1) | |
| 후기 작성 | `verify-parent-review-positive.mjs` | **PASS** 11/0 | |
| 공부방 등록점검 프레임 | `verify-study-room-registration-check-frame.mjs` | **PASS** | |
| 과외쌤 등록점검 프레임 | `verify-tutor-registration-check-frame.mjs` | **FAIL 2** | `render: publish wrap`, `page: CTA after board` — **origin/main 에서도 같은 2건 FAIL**(이번 변경과 무관, 공개 CTA 제거 이후 남은 옛 단언) |
| 관련 회귀 | basic-exposure-gate 24/0 · home-news-row ok · location-ssot ok · neighborhood-greeting-history 65/0 · role-home-guard 56/0 · student-home-tutor-tier 24/0 · student-location-flow 189/0 · tutor-box-real-values 49/0 · tutor-home-student-tab 63/0 · tutor-mypage-route-integrity ok · tutor-region-label 103/0 · student-mypage-metrics PASS | **PASS** | |
| 화면 확인 (vite dev) | home-ui 5174 · search-ui 5176 + 빈 결과 mock API(8080) | **PASS** | 아래 |

화면 확인 (DOM 판정, 실카드 0장 상태를 mock API 로 재현):

| 화면 | 「샘플」 글자 | 샘플 요소 | 가짜 이름 | 빈 칸 |
|---|---|---|---|---|
| 게스트 홈 `#/guest` | 0 | 0 | 없음 | 베이직 6 · 프라임 6 · 픽 10 |
| 과외쌤찾기(게스트) `5176/#/search/tutor` | 0 | 0 | 없음 | 베이직 2 |
| 학생 홈(과외 분기) `#/parent` | 0 | 0 | 없음 | 프라임 3 · 픽 5 · 베이직 2 |

한계: 실제 PHP·DB 대신 빈 결과를 돌려주는 mock 이다. 스크린샷 도구가 좁은 화면만 잡아 시각 캡처 대신 DOM 수치로 판정했다.

---

## 6. 추가 발견 (고치지 않음, 보고만)

1. 가짜 값이 실카드에 섞이던 원인: 검색 매퍼가 `resolveDetailItem` + 시드 폴백을 써서, API id 1 이 시드 id 1(서울대학교 등)과 합쳐지고 그 외 id 는 `EXPOSURE_[i % n]` 값으로 채워졌다. 이번에 제거.
2. 과외쌤 홈 자기 필터가 가짜 id 1 로 걸러졌다 → 이제 내 등록 기준(`resolveOwnTutorId`).
3. `tutor-reg/store.js` SEED(김수학·박국어·이영어, tutor-card-sample.jpg)·`student-reg/store.js` SEED: API 모드가 아닐 때 쓰는 sessionStorage 가짜 등록. 이번 범위(가)(나)(다) 밖이라 그대로 둠. API 아닌 모드에서는 `resolveOwnTutorId` 가 SEED id 1 을 고를 수 있음.
4. 남은 죽은 CSS: `registration-check.css` 의 rc-compare/hcs 주석(약 301·893·1002행), `plans-store.css`·`plans-theme.css` 의 `plans-room-pick`·`plans-tutor-circ` 규칙.
5. `auth-ui` 의 `DUMMY_USER`: 개발용 회원가입 미리 채움(운영 비노출로 보임).
6. `concern/store.js` 의 `getHotConcernSamples/getLatestConcernSamples`: 이름만 Samples, 실데이터.
7. `preview/home-ui/public/assets/brand/tutor-card-sample.jpg`: 위 3번 SEED 가 아직 참조.
8. 검색 매퍼가 이제 `...apiItem` 으로 실제 API 필드(paid_badges·is_new·proof_document_available·university_status·career_years·images 등)를 그대로 넘긴다. 전에는 이 칸들에 가짜 값이 보였다.
9. `study-room-reg/registration-check-edit.js` 의 `getStudyRoom` import 는 main 에서부터 쓰이지 않음(이번 변경 전부터).
10. 과외쌤 등록점검 프레임 검사 2건 FAIL 은 main 에서도 실패(옛 공개 CTA 단언). 별도 정리 필요.
11. 새 게이트 `verify:no-sample-data` 는 package.json 에만 등록했다. deploy.yml 에 붙일지는 사용자 결정.

---

## 7. 배포 전 사용자 할 일

없음 (SQL·.htaccess·env·Secrets 변경 없음).

선택: 새 게이트를 배포 파이프라인에 넣으려면 `deploy.yml` 에 `npm run verify:no-sample-data` 단계 추가(승인 시 별도 작업).

---

## 8. 미확인

- 실제 PHP·DB 를 띄운 로컬/운영 화면 확인(이번 화면 확인은 빈 결과 mock).
- 과외쌤·공부방 로그인 홈, 등록점검·쪽지설정·유료상품 화면의 브라우저 확인(정적 검사·렌더 함수 검사만).
- 배포 후 운영 사이트 확인(main 미병합).

---

## 9. 검수 및 승인 기록

| 항목 | 내용 |
|---|---|
| 독립 검수 | 대기 |
| 사용자 승인 | 대기 |
| 승인 대상 커밋 | — |
