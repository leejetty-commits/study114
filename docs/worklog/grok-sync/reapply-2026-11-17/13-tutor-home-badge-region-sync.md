# 13. 과외쌤 홈 — 과외지역 배지를 누르면 아래 목록이 그 지역으로 (공부방 박스 방식 그대로)

기준: `origin/main` `3046a9b3` (PR #249 뒤). 작성: 우동공과3(검수). 코드 변경 없음. 문서만.
PR만 연다. 머지 금지.

## 목적 (11-18 종현)

- 공부방 홈은 공부방 박스의 홍보지역 배지를 누르면 지도·아래 프라임/픽/베이직 목록·「우리동네 학생」 탭이 그 동으로 바뀐다.
- 과외쌤 홈은 지금 대표 과외지역만 쓴다. 배지는 눌러도 아무 일이 없다.
- 과외쌤 홈도 2번째·3번째 배지를 누르면 아래 프라임/픽/베이직 목록이 그 지역으로 바뀌게 한다. 내 카드는 그대로 나온다.
- **과외쌤찾기·학생찾기는 대표지역 그대로.** 바꾸지 않는다.

## 지금 공부방은 이렇게 돈다 (직접 읽음)

| 단계 | 파일 : 함수 | 하는 일 |
|---|---|---|
| 배지 그리기 | `home-ui/src/screens/study-room.js` `renderStudyRoomRegionPills()` | `studyRoomPromoMapSlots()`(대표 + 홍보2·3) 순서로 `<button data-study-room-promo="idx" role="tab">`. 고른 것만 `is-active`. |
| 배지 누름 | 같은 파일 `bindStudyRoomEvents()` 의 `[data-study-room-promo]` click | 같은 번호면 `return`. 아니면 `state.studyRoomPromoIndex = idx` → `writeStudyRoomHomePromoIndex(idx)` → `searchExecuted=false` → `bootStudyRoomHome(rerender, { slotIndex: idx })` → `rerender()` 한 번. |
| 기억 | `study-room-home-seed.js` `HOME_PROMO_INDEX_KEY = 'study114.studyRoomHomePromoIndex'` (sessionStorage), `readStudyRoomHomePromoIndex()`(슬롯이 비면 지움), `restoreStudyRoomHomePromoIndex(state)` | 탭을 바꾸면 `resetFindState`가 `studyRoomPromoIndex=null`로 만든다. 그래서 `renderStudyRoom()`이 매번 세션 값을 되돌린다. |
| 목록 | `study-room-home-seed.js` `bootStudyRoomHome(rerender, opts)` | `slotIndex` 슬롯의 `region_id`로 `searchApi('room', …)`. 결과는 `roomListByKey`(키 `방id|region_id|complex_id|`)에 둔다. |
| 멈춤 가드 (#243) | 같은 함수, 캐시 적중 블록 `if (changed) { … queueMicrotask(rerender) }` | 키·상태가 바뀐 때만 한 번 다시 그린다. 그 밖엔 아래 `if (bootPromise && liveKey === key)` 가드로 넘긴다. 공부방찾기는 `bootStudyRoomHome(rerender, { viewsAfterList: true })`를 **slotIndex 없이** 불러서 늘 대표를 쓴다. |
| 학생 탭 | `bootStudyRoomStudentDemand(rerender, { homePick: true, state })` | 홈에서 고른 알약의 동으로 학생을 받는다. |
| 프라임/픽/베이직 | `search-ui/src/search-find-place.js` `regionFeedContext()` → `getStudyRoomHomeLiveItems()` | 서버가 그 지역 기준으로 티어를 나눠 준다. 내 카드는 서버 목록에 들어 있어서 나온다(화면에서 따로 꽂지 않음). |
| 로그아웃 | `shared/chrome-session.js` `CLIENT_RESIDUE_KEYS`에 `study114.studyRoomHomePromoIndex` | `clearAuthClientResidue()`가 지운다. `auth-session.js`도 `studyRoomPromoIndex = null`. |

## 지금 과외쌤 홈은 이렇다 (직접 읽음)

- **지도가 없다.** 오른쪽은 「과외지역 분포」 막대(`screens/tutor.js renderTutorActivityPanel()` → `tutor-activity-chart.js renderTutorActivityBars({ interactive: false })`). 이 함수는 `activeIndex`를 받지만 `void opts`로 버린다.
- 배지: `screens/tutor.js renderTutorRegionPills()`. `<span>`이라 누를 수 없다. `readTutorHomeRegions()` 3칸, 대표만 `is-primary`.
- 과외지역 데이터: `tutor-home-seed.js ensureHomeRegions()`. `tutor.saved_regions[0..2].region_id` → 라벨은 `activityLabelFromRegionId(id, getTutorCityUnits())`. 단위는 **과외 단위(광역시 하나, 또는 도의 시·군)** 다. 공부방처럼 동이 아니다.
- 「우리동네 과외쌤」 목록: `bootTutorHomeTutors(rerender)` → `tutorHomeRegionId(tutorHomePrimaryIndex())` → `searchApi('tutor', { tutor_region_id })`. **대표만.** 결과는 모듈 변수 `tutorLive` 하나(키 = regionId).
- 서버: `src/Search/SearchService.php` 과외쌤 검색은 `EXISTS (tutor_regions tr WHERE tr.region_id = :tutor_region_id)`, 티어 키는 `tutorTierScope()`의 `city_id`. 그래서 지역 id만 바꿔 보내면 프라임/픽/베이직이 그 시·군(광역시) 기준으로 나온다. 내 과외 프로필도 `tutor_regions`에 그 id가 있으니 공개 상태면 그대로 나온다(공부방과 같은 방식).
- 티어 제목의 지역 글자: `search-ui/src/search-tier-render.js` `tutorPrimaryRegionLabel()` → `tutorHomePrimaryLabel()`. 과외쌤 홈(`surfaceType === 'home'`, 학생 탭 아님)에서만 쓰인다(`pinTutorPrimary`). 지역을 바꿔도 제목은 대표로 남는다. 이번에 같이 바꿔야 한다.
- 「우리동네 학생」 탭: 이미 자기 3칸 지역 탭이 있다(`search-find-region.js` `resolveTutorStudentRegionIndex(state)` → `state.tutorStudentRegionIndex`, 누르는 곳은 `search-find-surface.js`의 `[data-tutor-region]`). 기억은 메모리만. 새로고침하면 대표.
- **주의: 과외쌤찾기도 같은 목록을 쓴다.** `search-ui/src/screens/search-page.js` 250~251행이 `bootTutorHome(rerender); bootTutorHomeTutors(rerender);`를 부르고, `search-find-place.js regionFeedContext()`의 `tutorFindInitial`이 `getTutorHomeTutorLiveItems()`를 읽는다. 그래서 `bootTutorHomeTutors`의 **기본값은 대표 그대로** 두고, 홈에서만 `slotIndex`를 넘긴다.

## 바꿀 것

### A. `preview/home-ui/src/tutor-home-seed.js`

1. 세션 키 하나와 읽기·쓰기 함수 추가. 공부방 키와 이름이 다르다.
   ```js
   /** 과외쌤 홈 과외지역 배지. 탭 이동·새로고침에는 남고, 로그아웃 때 지운다. */
   const TUTOR_HOME_PROMO_INDEX_KEY = 'study114.tutorHomePromoIndex';

   /** 저장된 배지 번호. 지역 조회 전이면 null(저장값은 그대로). 그 칸이 비었으면 지우고 null. */
   export function readTutorHomePromoIndex() { … }
   export function writeTutorHomePromoIndex(idx) { … }
   /** 고른 배지의 라벨. 고르지 않았으면 빈 문자열. */
   export function tutorHomeSelectedLabel() { … }
   ```
   - `readTutorHomePromoIndex`: `^\d+$`이고 0~2. `homeRegions`가 `null`이면 `null`만 돌려주고 지우지 않는다. 그 칸의 `regionId`나 `label`이 비었으면 키를 지우고 `null`. 공부방 `readStudyRoomHomePromoIndex()`와 같은 모양.
   - try/catch로 sessionStorage 실패를 삼킨다.
2. `bootTutorHomeTutors(rerender)` → `bootTutorHomeTutors(rerender, opts = {})`.
   - `opts.slotIndex`가 0~2 정수이고 그 칸에 `regionId`가 있으면 그 칸. 아니면 지금처럼 `tutorHomePrimaryIndex()`.
   - 아래 줄(키 = regionId, 가드 `if (tutorBoot && tutorKey === regionId) return tutorBoot;`, `.then` 안에서만 `rerender`)은 **그대로.**
   - 인자 없이 부르면 지금과 똑같다(과외쌤찾기 경로).
3. 새 캐시(Map)는 만들지 않는다. #228 같은 캐시 적중 반복을 다시 만들지 않기 위해서다.

### B. `preview/home-ui/src/screens/tutor.js`

1. `renderTutorRegionPills()`: 라벨이 있는 칸만 `<button type="button" class="my-box__region-pill …" data-tutor-home-promo="idx" role="tab" aria-selected="…">`. 빈 칸(「미선택」·「…」)은 지금처럼 `<span>`.
   - 고른 칸 = `readTutorHomePromoIndex() ?? tutorHomePrimaryIndex()`. 그 칸만 `is-active`. 대표는 계속 `is-primary` + 「대표」 글자.
   - **속성 이름은 `data-tutor-region`을 쓰지 않는다.** 그 이름은 `search-find-surface.js`가 이미 묶어서 다른 동작을 한다.
2. `renderTutor()`: 학생 탭 지역이 아직 없으면(`!Number.isInteger(previewState.tutorFind.tutorStudentRegionIndex)`) 저장된 배지 번호를 넣는다. 값만 넣고 다시 그리기는 하지 않는다(공부방 `restoreStudyRoomHomePromoIndex`와 같음).
3. `bindTutorEvents()`:
   - `bootTutorHomeTutors(rerender)` → 저장된 배지가 있으면 `bootTutorHomeTutors(rerender, { slotIndex })`.
   - 학생 탭 줄 `bootTutorStudentDemand(resolveTutorStudentRegionIndex(previewState.tutorFind), rerender);`는 **글자 하나도 바꾸지 않는다.** (`scripts/verify-tutor-home-student-tab.mjs`가 이 문자열을 찾는다.)
   - 배지 click 추가. 공부방 click과 같은 순서:
     ```js
     root.querySelectorAll('[data-tutor-home-promo]').forEach((btn) => {
       btn.addEventListener('click', () => {
         const raw = btn.getAttribute('data-tutor-home-promo') || '';
         if (!/^\d+$/.test(raw)) return;
         const idx = Number(raw);
         const current = readTutorHomePromoIndex() ?? tutorHomePrimaryIndex();
         if (current === idx) return;
         writeTutorHomePromoIndex(idx);
         previewState.tutorFind.tutorStudentRegionIndex = idx;
         previewState.tutorFind.searchExecuted = false;
         bootTutorHomeTutors(rerender, { slotIndex: idx });
         rerender();
       });
     });
     ```
4. 오른쪽 「과외지역 분포」 막대는 **이번에 바꾸지 않는다**(아래 질문 1).

### C. `preview/search-ui/src/search-tier-render.js` — 예외 2줄

과외쌤 홈 티어 제목의 지역 글자를 고른 배지로 맞춘다. 이 함수는 과외쌤 **홈**에서만 불린다(`pinTutorPrimary`는 `surfaceType === 'home'`이고 학생 탭이 아닐 때만 참). 과외쌤찾기·학생찾기 화면은 `surfaceType === 'search'`라 닿지 않는다.

```diff
-import { tutorHomePrimaryLabel } from '@home-ui/tutor-home-seed.js';
+import { tutorHomePrimaryLabel, tutorHomeSelectedLabel } from '@home-ui/tutor-home-seed.js';
 …
 function tutorPrimaryRegionLabel() {
-  return tutorHomePrimaryLabel();
+  return tutorHomeSelectedLabel() || tutorHomePrimaryLabel();
 }
```
이 두 줄 밖은 이 파일에서 한 줄도 바꾸지 않는다. 이 예외가 싫으면(종현 결정) 목록은 바뀌는데 제목은 대표로 남는다.

### D. `preview/home-ui/src/styles/udx-std-apply.css` — 과외쌤 범위만

지금 `.home-shell--tutor .my-box__region-pill.is-primary`와 `.is-active`가 같은 모양이다(455~464행). 고른 배지가 안 보인다. 공부방(478~494행)처럼 나눈다.
- `.home-shell--tutor .my-box__region-pill.is-primary`: 흰 바탕·회색 테두리(공부방과 같은 값). 「대표」 글자 색만 `var(--role-accent)`.
- `.home-shell--tutor .my-box__region-pill.is-active`: `border: 2px solid var(--role-accent)`, 글자 `var(--role-accent)`, 그림자 없음.
- `.home-shell--study_room …`과 전역 `.my-box__region-pill`은 건드리지 않는다.

### E. `preview/shared/chrome-session.js` — 한 줄

`CLIENT_RESIDUE_KEYS`에 `'study114.tutorHomePromoIndex'` 한 줄 추가. 로그아웃 때 지워진다. 다른 줄은 그대로.

## 허용 파일 (이것만)

1. `preview/home-ui/src/tutor-home-seed.js`
2. `preview/home-ui/src/screens/tutor.js`
3. `preview/search-ui/src/search-tier-render.js` — 위 C의 2줄만
4. `preview/home-ui/src/styles/udx-std-apply.css` — `.home-shell--tutor .my-box__region-pill…` 규칙만
5. `preview/shared/chrome-session.js` — 키 1줄만
6. 기록 1개: `docs/worklog/2026/11/2026-11-18-tutor-home-badge-region.md`

## 금지

- **모든 `main.js`** (home-ui·search-ui·tutor-ui·study-room-ui·auth-ui). 이번 작업엔 필요 없다.
- `search-ui`의 다른 파일 전부: `screens/search-page.js`, `search-find-surface.js`, `search-find-region.js`, `search-find-place.js`, `search-region-feed.js`, `state.js`. 과외쌤찾기·학생찾기는 대표지역 그대로다.
- `study-room-home-seed.js`, `screens/study-room.js` (공부방은 이미 잘 된다).
- `tutor-activity-chart.js`, `provider-home.js`, `find-state.js`, `auth-session.js`, `myshop/return-snapshot.js`.
- PHP·SQL 전부. 서버는 이미 지역 id로 나눠 준다.
- 새 캐시(Map)·TTL·스냅샷 추가, 함수 이름 바꾸기, 「김에」 정리.
- `.then` 밖에서 `rerender()` 부르기(배지 click 한 번은 공부방과 같이 예외).

## 위험과 막는 법

| 위험 | 막는 법 |
|---|---|
| 다시 그리기 무한 반복(#228) | `bootTutorHomeTutors` 가드·`.then` 안 rerender 그대로. 새 캐시 없음. 그리기(`renderTutor`)는 값만 읽고 boot를 부르지 않는다. click은 같은 번호면 `return`. |
| 과외쌤찾기가 고른 지역으로 뜸 | `search-page.js`는 `slotIndex` 없이 부른다 → 대표. 홈(2번째)→과외쌤찾기 때 키가 바뀌어 대표로 한 번 다시 받는다. 정상이다. |
| 홈↔찾기 오갈 때 요청이 한 번씩 더 남 | 목록 변수가 하나라서다. 반복은 아니다. 오픈 뒤 필요하면 따로 다룬다. |
| 공부방·과외쌤 기억 섞임 | 키가 다르다(`study114.studyRoomHomePromoIndex` / `study114.tutorHomePromoIndex`). 모듈 변수도 다르다. |
| 로그아웃 뒤 남음 | E에서 `clearAuthClientResidue()`가 지운다. |
| 기본정보에서 과외지역을 바꿈 | 그 칸이 비면 `readTutorHomePromoIndex()`가 지우고 대표로 돌아간다. 칸에 다른 시·군을 넣으면 그 번호의 새 지역이 뜬다. |
| 학생 탭 쪽 지역 탭을 누름 | 지금처럼 학생 탭만 바뀐다(배지는 그대로). 배지 → 학생 탭은 따라간다. 반대 방향은 이번에 안 한다(질문 2). |

## 수락

1. 00-INDEX 「공통 수락 점검」 전부. 공부방·과외쌤·학생 계정으로 로그인해서 보이는 메뉴를 전부 누른다. **일반 창과 시크릿 창 둘 다.** `__renderCount`는 화면마다 5초 두 번 읽어 같은 값.
2. 과외쌤(과외지역 3칸 다 있는 계정): 홈 「우리동네 과외쌤」에서 2번째 배지 → 그 배지만 진한 테두리. 아래 프라임·픽·베이직이 그 시·군(광역시) 카드로 바뀐다. 티어 제목 지역 글자도 같은 지역.
3. 3번째 배지 → 같은 확인. 대표 배지 → 원래 목록.
4. 내 카드: 세 배지 모두에서 내 카드가 보인다(공개 상태일 때). 찜·비교 막힘 안내(「내 카드에는…」)도 그대로.
5. 2번째 배지를 고른 채 「우리동네 학생」 탭 → 학생 탭 지역이 2번째. 다시 「우리동네 과외쌤」 → 배지 2번째 유지.
6. F5 뒤에도 2번째 유지. 로그아웃 → 다시 로그인 → 대표.
7. **2번째 배지를 고른 채** 메뉴 과외쌤찾기 → 대표 지역 목록. 학생찾기 → 대표 지역. 뒤로 → 홈은 2번째.
8. 과외지역이 1칸뿐인 계정: 배지 1개(대표), 빈 칸은 눌리지 않는다. 화면 그대로.
9. 공부방 홈 배지·지도·학생 탭이 전과 같다(회귀).
10. 네트워크: 배지 한 번 누를 때 `/api/search/search.php`(POST, tab tutor) 1번. 가만히 두면 더 안 나간다.
11. 빌드 `npm run build:dothome`. Verify bundle은 지금 실패 중인 4건(Hide inquiry bundle, Tutor search fields, Tutor basic required, Student hope hidden required) 말고 새 실패가 없어야 한다. `node scripts/verify-tutor-home-student-tab.mjs`, `node scripts/verify-tutor-box-real-values.mjs`도 돌려서 결과를 적는다.
12. PR 본문에 계정별 표(통과/실패, 캡처 경로). 비밀번호는 적지 않는다.

## 종현에게 물을 것

1. 과외쌤 홈엔 지도가 없다. 오른쪽 「과외지역 분포」 막대에서 고른 지역 줄을 강조할까? 하면 `tutor-activity-chart.js`가 허용 파일에 들어간다(이번엔 안 함).
2. 「우리동네 학생」 탭 안 지역 탭을 누르면 위 배지도 따라 바뀌게 할까? 하면 `search-find-surface.js`를 고쳐야 한다(이번엔 안 함).
3. C의 `search-tier-render.js` 2줄 예외를 허용할까? (허용 안 하면 제목만 대표로 남는다.)

## Cursor 한 줄 명령

`origin/main(3046a9b3)에서 docs/worklog/grok-sync/reapply-2026-11-17/13-tutor-home-badge-region-sync.md 그대로 실행. 허용 파일 6개 밖·모든 main.js·search-ui 다른 파일 수정 금지. 수락 1~12를 공부방·과외쌤·학생 일반·시크릿 창 실클릭으로 확인한 뒤 PR만, 머지 금지.`

## 되돌리기

`git revert -m 1 <이 PR merge 커밋>`으로 새 PR.
