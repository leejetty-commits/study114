# 11 오픈 전 찾기 화면 빠르게 (빈 화면 대신 회색 칸 · 지역 목록 미리 받기 · 공부방찾기 학생 수 중복 요청 묶기)

작성: 우동공과3(검수) · 2026-11-18 · 기준 `origin/main` `a738c84c` (PR #247 배포, run 44118863662)
상태: 지시서. 코드 변경 없음. Cursor가 PR만 연다. 머지 금지.
**시작 조건: 지시서 10 PR이 머지·배포된 뒤에 시작한다.** 10과 겹치는 파일은 없지만, 한 번에 한 작업 규칙(00-INDEX 공통 규칙 1)을 지킨다. 시작할 때 `origin/main`을 다시 받아 그 위에서 한다.
목표: 금요일(2026-11-20) 오픈 전에, 찾기 세 화면(공부방찾기·과외쌤찾기·학생찾기)에서 ① 첫 화면이 하얗게 비어 있는 시간을 없애고, ② 손님이 목록 카드까지 보는 시간을 줄이고, ③ 공부방 로그인 공부방찾기의 같은 `search.php` 중복을 없앤다. **`main.js`는 한 줄도 바꾸지 않는다.** 로그인 확인 순서, 그리는 횟수, 지도 만드는 방식은 그대로 둔다.

## 명령

```
git fetch 후 origin/docs/reapply-2026-11-17의 docs/worklog/grok-sync/reapply-2026-11-17/11-find-speed-preopen.md 그대로 실행(지시서 10 PR 머지 뒤 origin/main 기준, A·B·C 커밋 분리, D는 측정·보고만). 허용 파일 밖·모든 main.js·auth-session.js·세션 순서·지도 SDK 로딩 시점(#235)·capture 클릭·CSS 파일 수정 금지. 수락 표(첫 그림·첫 글자·me.php·마지막 그림·render 횟수·search.php·regions.php·지도 칸 횟수 전후)와 세 모드(공부방·과외쌤·학생 과외/공부방 분기) 일반·시크릿 실클릭, 공부방찾기 두 번 연속, 뒤로/앞으로, 지역 바꾸기, 로그아웃→다른 역할 로그인 확인 후 PR만, 머지 금지.
```

## 허용 파일 (이것만)

| 커밋 | 파일 | 하는 일 |
|---|---|---|
| A | `preview/search-ui/index.html` | 17행 `<div id="app"></div>` 안에 역할과 무관한 회색 칸(스켈레톤)만 넣는다 |
| B | `preview/search-ui/src/search-find-place.js` | 지역 목록(cities·tutor_units)을 me.php와 같이 미리 받기 + 손님 흔적일 때만 게스트 기준 위치 미리 받기. 기다리는 화면이 없을 때 실패 재그리기 몫을 쓰지 않게 두 곳 |
| C | `preview/home-ui/src/study-room-home-seed.js` | `readStudyRoomRegionStudentCount` 받는 중 약속 같이 쓰기(48행 근처 Map 하나, 653행 clear 한 줄, 664~681행) |
| 기록 | `docs/worklog/2026/11/2026-11-18-find-speed-preopen.md` | 결과 기록 (D 측정표 포함) |

**금지 (한 줄도 바꾸지 않는다)**
- 모든 `main.js`: `preview/search-ui/src/main.js`, `preview/home-ui/src/main.js`, `study-room-ui`·`tutor-ui`·`auth-ui`의 `main.js`. (search-ui `main.js` 59~61행 `allowFindBoot` 문, 112행·136~140행 render 호출 포함)
- `preview/home-ui/src/auth-session.js`(세션 확인·`hydrateSessionDependencies`·`auth:session-hydrated`), `preview/shared/session-snapshot.js`, `preview/shared/snap-clear.js`, `preview/shared/last-role.js`(읽기 import만 허용, 파일 수정 금지)
- 지도: `preview/shared/naver-map.js`, `preview/search-ui/src/search-map.js`, `loadNaverMapsSdk` 시점·주소(#235)
- capture 클릭 가로채기(`home-ui/src/main.js` 595~605행 등), `search-page.js`의 손님 capture 리스너
- CSS 파일 전부(새 클래스 추가 금지. A는 이미 있는 `.home-session-wait*` 클래스와 `style=""` 속성만 쓴다)
- `preview/search-ui/src/search-api.js`, `preview/home-ui/src/exposure-bridge.js`, `preview/home-ui/src/search-api.js`
- 검사 스크립트 수정 금지(실패가 새로 생기면 멈추고 보고)

---

## 조사에서 확인한 것

### 측정 방법 (2026-11-18 03시 KST, 박스)

`11-find-measure.mjs`(이 폴더)로 찾기 앱 빌드(dist)를 `https://study114.net/search/` 자리에 끼워 넣고 API는 운영 그대로 불렀다. 비로그인, 390폭, 빈 캐시, 탭마다 5~9회 중앙값. 박스는 미국 서부라 숫자 크기는 국내와 다르고, **전후 비교용**으로만 쓴다. 수정 후 값은 박스 임시 작업트리에서 A·B·C를 시험으로 넣고 잰 것이다(커밋 안 함, 지움).

| 탭 (비로그인) | 첫 그림(FCP) 전→후 | me.php 끝 전→후 | 첫 글자(h1) 전→후 | 마지막 그림(목록) 전→후 | render 횟수 | 지도 칸 | search.php | regions.php |
|---|---|---|---|---|---|---|---|---|
| 공부방찾기 | 280~300 → 36~68 ms | 226 → 203~252 | 237 → 215~261 | **1,149~1,174 → 651~715** | 4 → 4 | 4 → 4 | 1 → 1 | 3 → 3 |
| 과외쌤찾기 | 244 → 60 | 206 → 231 | 216 → 241 | **1,206 → 690** | 4 → 4 | 0 | 1 → 1 | 3 → 3 |
| 학생찾기 | 252~348 → 36~48 | 224 → 214 (9회) | 235 → 223 (9회) | **1,095 → 674** (9회) | 4 → 4 | 0 | 1 → 1 | 3 → 3 |

운영 그대로(dist 끼워 넣기 없이) 잰 값: 공부방찾기 FCP 808~1,784 ms, FCP는 항상 me.php 끝 + 10~110 ms. CSS는 280~490 ms에 이미 와 있다. **첫 그림이 me.php를 기다린다는 것을 숫자로 확인했다.** 앞선 국내 기준 측정(내부문서 1.2.2)은 그 차이를 300~370 ms(캐시 있음)·약 710 ms(빈 캐시)로 적었다.

요청 수는 전후가 같다. 늘어나는 요청이 없다(B는 시점만 앞당긴다). me.php는 9회 중앙값으로 늦어지지 않았다. 5회짜리 한 번은 학생찾기에서 +100~250 ms가 나왔는데, 9회로 다시 재면 차이가 없었다. 그래서 B는 me.php 요청을 먼저 보낸 뒤(다음 틱) 미리 받기를 시작한다. 이것이 수락 기준의 1번이다(아래).

로그인 화면은 박스에서 재지 못했다(계정을 쓰지 않는다). D에서 Cursor·종현이 잰다.

### 원인 1 — 첫 글자가 me.php를 기다린다 (`main.js` 59~61행)

- 코드: `render()` 첫 줄 `if (!allowFindBoot) return;`(59~61행). `allowFindBoot`는 `initAuthSession(...).then`(107~112행)과 `auth:login`·`auth:logout`(126~135행)에서만 켜진다. 그 전에는 `#app`이 비어 있다.
- **왜 있나**: `0843a89c`(2026-10-18, 256 「메뉴 전환 시 세션 확인 전 게스트 화면 깜빡임 수정」). 그 전(`42c92fb4`, 2026-09-22)에는 세션 전에 셸을 먼저 그렸는데, 찾기는 메뉴를 누를 때마다 새 문서로 열려서 **로그인한 사람도 매번 손님 헤더(로그인 버튼)가 잠깐 보였다.** 그래서 세션 전에는 아무것도 안 그리게 막았다. 같은 날 `dcac77d5`(세션 분리)는 바로 되돌렸다(`6c8feeb1`).
- `search-page.js` 208~212행에 `sessionReady: false`면 헤더·레일만 그리는 길이 남아 있지만, 헤더가 `getAuthUser()`(세션 전 null)로 손님 헤더를 그리므로 쓰면 같은 깜빡임이 돌아온다.
- 홈은 같은 문제를 `home-ui/src/main.js` 246~260행 `paintNeutralShell()`(로그인 흔적이 있으면 헤더 버튼 없이 회색 칸만)과 306~316행 `shouldPaintBeforeSession()`으로 풀었다. 그 회색 칸 클래스 `.home-session-wait*`는 `home-ui/src/styles/home.css` 402~438행에 있고, 찾기 앱도 `main.js` 4행에서 `home.css`를 이미 불러온다.

**판단: 오픈 전 A만 한다.** `index.html`의 `#app` 안에 역할과 무관한 회색 칸을 정적으로 넣는다. 첫 `render()`가 `app.innerHTML = html`(68행)로 통째로 바꾸므로 JS는 한 줄도 안 바꾼다. 헤더·로고·로그인 버튼·역할 글자는 넣지 않으니, 로그인한 사람에게 손님 화면이 보일 일이 없다. 진짜 제목(「공부방 찾기」)이 뜨는 시각은 그대로다. 대신 하얀 화면이 회색 칸 + 「불러오는 중…」으로 바뀐다(CSS가 오면 바로, me.php·JS 실행을 기다리지 않음).

**오픈 전 불가(오픈 후)**
- 세션 전에 손님 화면을 진짜로 그리기(홈처럼 `!readLastRoleHint()`일 때): `main.js` 59~61행과 부트 순서를 바꿔야 한다. 그리고 카카오·네이버 로그인으로 찾기 주소에 바로 돌아오는 경우는 `noteLastRole`을 부르지 않아(`auth-ui/src/screens/login.js` 156행은 이메일 로그인만) 흔적이 없다. 그 사람에게 손님 화면이 깜빡인다. 0843a89c가 막은 그 문제다.
- 세션 스냅샷(sessionStorage, #225)으로 역할 헤더를 먼저 그리기: 스냅샷은 탭마다 따로 있고, 다른 탭에서 로그아웃해도 이 탭 스냅샷은 남는다(`chromeLogout`은 그 탭만 지움). 그래서 지금 로그인돼 있다는 증거가 못 된다. 틀리면 로그인 헤더가 보였다가 손님으로 바뀐다.
- `<link rel=preload>`로 me.php 미리 받기: me.php는 `no-store`라 브라우저에 따라 같은 요청이 두 번 나갈 수 있다. 확인 없이 넣지 않는다.

예상 효과(A): 하얀 화면 시간이 me.php 한 번만큼(박스 약 0.2초, 국내 앞선 측정 0.3~0.7초) 줄어든다. 진짜 첫 글자 시각은 같다. 위험 **낮음**.

### 원인 2 — render()가 두 번 (112행, 136~140행)

- 112행: 세션 확인 직후 한 번. 136~140행: `auth:session-hydrated`. 이 이벤트는 `auth-session.js` 397~401행에서 `hydrateSessionDependencies`(320~346행)가 끝나면 쏜다.
- **이미 막혀 있다.** `c8d40473`(2026-11-16, #225)에서 `if (event.detail?.changed === false) return;`(138행)이 들어갔다. `changed`는 등록·미확인 쪽지 수·유료 상태·찜/비교/최근 본 개수 서명(`sessionPaintSignature`, 295~302행)이 바뀐 때만 참이다. 같은 탭에서 홈 → 찾기로 오면 스냅샷(`seedCachesFromSnapshot`, 349~364행)이 먼저 채워서 서명이 같고, 두 번째 그림은 없다.
- 두 번째 그림이 나는 경우는 새 탭·시크릿·즐겨찾기 바로 진입처럼 스냅샷이 없을 때다. 이때는 첫 그림에 공부방 등록(지역)이 아직 없어서 「지역 없음」 상태로 그려지고, 등록이 온 뒤의 두 번째 그림이 **진짜 내용**이다. 이걸 막으면 공부방찾기 지역·핀이 틀린 채로 남는다. `cc9728a1`(10-19)이 이 다시 그리기를 넣은 이유가 이것이다.
- 측정(비로그인 세 탭): render는 4번이고, 112행 1번 + **지역 목록 도착 2번(cities·tutor_units 기다리는 화면, `search-find-place.js` 625~633행·701~709행) + 손님 기준 위치·목록 1번**이다. 4번 모두 HTML이 달랐다(같은 HTML 다시 그리기 0번). 공부방찾기는 render마다 지도 칸을 새로 만든다(4번). 136~140행은 손님에게는 불리지 않는다.
- 11-17 멈춤(#228)은 공부방찾기 캐시 적중 때 그릴 때마다 다시 그리기를 예약한 무한 반복이었고, `2992032e`(#243)의 `if (changed)`로 고쳤다(`study-room-home-seed.js` 567~580행). 그리는 횟수를 줄이는 손질은 이 사슬을 다시 건드린다.

**판단: 오픈 전에는 render 횟수를 줄이는 수정을 하지 않는다.** 대신 B로 지역 목록·손님 기준 위치를 me.php와 같이 받기 시작해서, 2~4번째 그림이 **더 일찍** 끝나게 한다(목록까지 다 그린 시각 약 −0.4~0.5초, 박스). render 횟수와 지도 칸 횟수는 같다(cities 응답 JSON이 커서 첫 그림 전에 다 못 오는 경우가 많다. 오면 1번 줄어든다).

**오픈 전 불가(오픈 후)**
- 「같은 HTML이면 다시 그리지 않기」 가드: `main.js` 수정이다. 비로그인 측정에서 같은 HTML 다시 그리기가 0번이라 효과가 증명되지 않았다. 로그인 쪽 횟수는 D에서 잰 뒤 판단한다.
- 지역이 같으면 지도를 다시 만들지 않기: 지금은 `app.innerHTML`이 지도 칸까지 새로 만든다. 지도 DOM을 떼어 두었다가 다시 붙이거나 핀만 바꾸는 구조 변경이 필요하다(`naver-map.js` 363~432행 `mountStudyRoomMap`, 583~624행 `bindStudyRoomMapSection`). #235·#247 B와 같은 영역이다.
- cities·tutor_units 도착 그림 두 번을 한 번으로 묶기: 기다리는 화면 목록(`findCitiesWaiters`·`findTutorUnitsWaiters`)의 흐름을 바꾸는 일이라 화면 갱신 누락 위험이 있다.

### 원인 3 — 공부방찾기 search.php 중복

- 11-17 운영 공부방 로그인 측정: 공부방찾기 `search.php` 6번(지시서 09 조사). #247 기록(`docs/worklog/2026/11/2026-11-17-perf-safe-preopen.md`)도 「로그인 한 줄 3건은 유지라 6이 그대로일 수 있음」이라고 적었다.
- 코드로 확인한 구성:
  1. 목록: `bootStudyRoomHome(rerender, { viewsAfterList: true })`(`search-page.js` 239행 → `study-room-home-seed.js` 555~636행, `searchApi('room', 지역 필터, limit 20)` 608행).
  2. 학생 수(지도 배너 숫자): 그림마다 `bindFindSurfaceEvents`가 `readStudyRoomRegionStudentCount`를 부른다(`search-find-surface.js` 1162~1168행 → `study-room-home-seed.js` 664~681행, `searchApi('student', …, limit 1)`). 끝난 값은 `studentCountByRegion`(48행)에 저장하지만, **받는 중에 다시 그리면 같은 요청이 또 나간다.** 공부방찾기는 세션 그림 → 목록 도착 그림(→ 등록 도착 그림)으로 1~2번 더 그리므로, 같은 학생 수 요청이 2~3번 나갈 수 있다.
  3. 노출 풀 3건: `main.js` 113~120행 → `hydrateExposureBridge({ sequential: true })`(`exposure-bridge.js` 115~157행). 공부방·과외쌤·학생 전국 최신(필터 없음)을 한 줄로. 목록과 필터가 달라 같은 요청이 아니다. `7ee8fad9`(234c-3b, 10-16)와 #247 A에서 일부러 「목록 뒤에 한 건씩」으로 둔 것이다.
- 「목록 응답의 total로 학생 수를 대신하기」: 목록은 공부방(room) 요청이고 학생 수는 학생(student) 요청이라 total을 쓸 수 없다. 같은 학생 필터의 `loadStudentDemand`(388행)는 학생찾기 탭에서만 불리고 total을 버린다. **해당 없음.**

**판단: 오픈 전 C만 한다.** 학생 수 함수에 「받는 중이면 그 약속을 같이 쓴다」를 넣는다. 같은 지역 id, 같은 필터, 같은 페이지 안에서만 같이 쓰고, 끝나면 지운다. 끝난 값 저장(기존)은 그대로다. `searchApi` 전체에 같이 쓰기를 넣지 않는 이유: 여러 화면이 결과 객체를 받아 가공하는데(`runFindSearchWithFilters` 816~826행 등) 같은 객체를 나눠 쓰면 서로 영향을 줄 수 있고, 같은 목록 요청이 두 번 나간다는 증거가 아직 없다.
예상 효과(C): 공부방 로그인 공부방찾기 `search.php` 6 → 4~5(D에서 확인). 첫 글자 시각에는 거의 영향 없음, 닷홈 동시 처리 부담만 준다. 위험 **낮음**.

**오픈 전 불가(오픈 후)**
- 공부방찾기에서 노출 풀 3건 빼기: 풀을 쓰는 곳(상세·프라임·픽 예비 등)을 다 확인해야 한다. 지금 순서는 234c-3b·#247에서 정한 설계다.
- `searchApi` 전체 받는 중 같이 쓰기: 위 이유. D에서 같은 본문 목록 요청이 두 번 이상 보이면 그때 따로 지시서.

---

## A — 찾기 첫 화면 회색 칸 (`preview/search-ui/index.html`)

17행만 바꾼다. 다른 줄(`<head>`, `#site-biz-static`, `<script>`)은 그대로.

```html
    <div id="app"><div class="home-session-wait" aria-busy="true" style="max-width:72rem;margin:0 auto;padding:1.5rem 1rem 2rem"><p style="margin:0;font-size:0.875rem;color:#6b7280">불러오는 중…</p><div class="home-session-wait__bar"></div><div class="home-session-wait__block"></div><div class="home-session-wait__block home-session-wait__block--short"></div></div></div>
```

- 넣지 않는 것: 로고, 헤더, 메뉴, 로그인·회원가입 버튼, 「공부방 찾기」 같은 탭 제목(탭은 해시라 HTML이 모른다. 역할에 따라 탭이 바뀌기도 한다 — `search-page.js` 218~223행 `resolveAllowedTab`).
- 새 CSS 클래스·`<style>` 추가 금지. `.home-session-wait*`는 `home.css` 402~438행에 이미 있다. 빌드에서 CSS는 `<head>`의 `<link rel="stylesheet">`로 들어가므로(운영 `/search/` 16행 확인) JS 전에 칸이 그려진다.
- 「불러오는 중…」은 보이는 글자라 FCP로 잡힌다. `home-session-wait__label`(화면에서 숨김)은 쓰지 않는다.
- 왜 안전한가: 첫 `render()`의 `app.innerHTML = html`(`main.js` 68행)이 칸을 통째로 바꾼다. 그리지 못하는 경우(`paintBlocked`, 66행: 해시가 바뀌었거나 인증 이동 대기)는 지금은 빈 화면, 바뀐 뒤에는 회색 칸이 남는다. 둘 다 곧 다른 주소로 가거나 다음 그림이 덮는다. 이메일 미인증은 `renderSearchPage`가 `''`를 돌려줘 지금처럼 비운 뒤 이동한다(213~216행). JS를 못 받으면 지금은 하얀 화면, 바뀐 뒤에는 회색 칸이다.

## B — 지역 목록·손님 기준 위치를 me.php와 같이 받기 (`preview/search-ui/src/search-find-place.js`)

세 곳만 바꾼다.

1) import 한 줄(98행 `openKakaoPostcode` 다음):
```js
import { readLastRoleHint } from '../../shared/last-role.js';
```

2) 기다리는 화면이 없으면 실패 재그리기 몫을 쓰지 않는다. 미리 받기가 실패해도, 첫 그림이 다시 받다가 실패하면 지금처럼 한 번 다시 그려 오류 칸을 보여 주게 하려는 것이다.
- `settleFindCitiesWaiters()`(625행) `findCitiesWaiters.clear();` 다음 줄에 `if (!waiters.length) return;`
- `bootFindTutorUnits` 안 703행 `if (findTutorUnitsStatus === 'ready' || !findTutorUnitsFailRendered) {` → `if (waiters.length && (findTutorUnitsStatus === 'ready' || !findTutorUnitsFailRendered)) {`

3) 파일 맨 끝에 추가:
```js
/** 11 B: 찾기 문서에서만, me.php를 보낸 다음 틱에 지역 목록 두 개를 미리 받는다. 요청 수는 같고 시점만 앞당긴다. */
function isFindDocument() {
  if (typeof window === 'undefined' || !window.location) return false;
  if (typeof document === 'undefined' || !document.getElementById('app')) return false;
  const path = String(window.location.pathname || '');
  if (path.startsWith('/search')) return true;
  const hashPath = String(window.location.hash || '').replace(/^#/, '').split('?')[0];
  return hashPath === '/search' || hashPath.startsWith('/search/');
}
if (isFindDocument()) setTimeout(() => {
  bootFindCities();
  bootFindTutorUnits();
  // 로그인 흔적이 없을 때만(손님일 가능성) 게스트 기준 위치를 미리 받는다. 화면은 세션 뒤에 그대로 그린다.
  if (!readLastRoleHint()) loadGuestBaseline();
}, 0);
```

왜 안전한가 (코드로 확인):
- **요청이 늘지 않는다.** 찾기 화면은 역할과 상관없이 첫 그림에서 이미 둘 다 부른다. 손님 `bootGuestFindSurface`(`search-find-place.js` 240~245행), 로그인 `bindFindSurfaceEvents`(`search-find-surface.js` 855~857행), 학생 `bootStudentFindFeed`(509~511행). `bootFindCities`·`bootFindTutorUnits`는 약속 하나를 저장해 두고 다시 부르면 그걸 돌려준다(636~667행, 680~715행). `loadGuestBaseline`도 약속을 저장한다(`shared/location-display.js` 736~737행). 측정에서 regions.php·region-stats.php·search.php 수가 전후 같았다.
- **세션 잠금과 안 엮인다.** `regions.php`·`region-stats.php`는 세션을 열지 않는다(`src/bootstrap.php`는 세션을 시작하지 않고, 두 파일에 `session_start`·`AuthSession` 없음). cities·tutor_units는 `credentials: 'omit'`이다. `regions.php` GET은 하루 공개 캐시(`public/api/auth/regions.php` 46행).
- **me.php가 먼저 나간다.** 모듈이 읽힐 때 바로 부르지 않고 `setTimeout(…, 0)`이다. `main.js` `init()`(143행)이 같은 틱에 `initAuthSession`을 먼저 부른다. 측정 순서: me.php 79 ms → cities 95 ms.
- **로그인한 사람에게 손님 요청을 보내지 않는다.** `loadGuestBaseline`은 `readLastRoleHint()`가 비었을 때만(시크릿·처음 방문·로그아웃 뒤). 흔적이 없는데 로그인돼 있는 경우(카카오·네이버 로그인으로 찾기에 바로 온 경우)는 region-stats 한 번이 헛되이 나갈 뿐, 화면은 세션 뒤에 지금 그대로 그린다.
- **다른 앱에는 안 들어간다.** 이 파일은 search-ui만 import한다(`home-ui`·`study-room-ui`·`tutor-ui`에서 import 없음). node 검사 스크립트는 `document`가 없어서 미리 받기가 돌지 않는다(`verify-hold-find-address.mjs` 679~700행은 `window`·`fetch`를 흉내 내지만 `document`는 없다).
- **화면 결과는 같다.** 첫 그림 때 이미 받아 둔 상태(`findCitiesStatus === 'ready'`)는 지금도 2번째 이후 그림에서 늘 지나가는 길이다. 새 그리기 경로는 없고, 다시 그리기를 예약하는 곳도 늘지 않는다(멈춤 위험 없음).

## C — 공부방찾기 학생 수, 받는 중이면 같이 쓰기 (`preview/home-ui/src/study-room-home-seed.js`)

- 48행 `const studentCountByRegion = new Map();` 다음:
```js
/** 11 C: 같은 지역 학생 수를 받는 중이면 그 약속을 같이 쓴다. 끝나면 지운다. */
const studentCountPending = new Map();
```
- `forgetStudyRoomHomeMemory()` 653행 `studentCountByRegion.clear();` 다음: `studentCountPending.clear();`
- `readStudyRoomRegionStudentCount`(664~681행)를 아래로:
```js
export function readStudyRoomRegionStudentCount(regionId) {
  const id = String(regionId || '').trim();
  if (!/^\d+$/.test(id)) return Promise.resolve(null);
  if (studentCountByRegion.has(id)) return Promise.resolve(studentCountByRegion.get(id));
  const pending = studentCountPending.get(id);
  if (pending) return pending;
  const request = searchApi(
    'student',
    { preferred_lesson_type: 'study_room', preferred_studyroom_region_id: id },
    { limit: 1, sort: 'latest' },
  )
    .then((result) => {
      const total = Number(result?.total);
      if (!Number.isFinite(total)) return null;
      studentCountByRegion.set(id, total);
      return total;
    })
    .catch(() => null)
    .finally(() => {
      if (studentCountPending.get(id) === request) studentCountPending.delete(id);
    });
  studentCountPending.set(id, request);
  return request;
}
```
- 함수 위 주석(657~663행)은 그대로. 부르는 쪽(`search-find-surface.js` 1162~1168행)은 바꾸지 않는다. 그쪽은 이미 `studentCount.isConnected`로 사라진 칸에는 쓰지 않는다.
- 실패하면 지금처럼 `null`(대시 유지)이고, 받는 중 목록에서 지워져 다음 그림에서 다시 시도한다.

## D — 로그인 측정 (확인만, 코드 없음)

A·B·C 전(지시서 10 머지 뒤 main)과 후(이 브랜치)를 같은 방법으로 잰다. 로컬 로그인이 안 되면 「미확인」으로 적고, 종현 운영 확인 칸으로 넘긴다. 비밀번호·토큰은 적지 않는다.

1. 비로그인: `11-find-measure.mjs`로 세 탭 각 9회 중앙값(위 표와 같은 열).
2. 로그인(공부방 · 과외쌤 · 학생 과외 분기 · 학생 공부방 분기): 메뉴를 눌러 찾기에 들어간 뒤 5초 기다리고 콘솔에:
   ```js
   (()=>{const r=performance.getEntriesByType('resource');const c=s=>r.filter(e=>e.name.includes(s));const me=c('/api/auth/me.php')[0];const f=performance.getEntriesByName('first-contentful-paint')[0];return {fcp:Math.round(f?.startTime||0),meEnd:Math.round(me?.responseEnd||0),search:c('search.php').length,regions:c('regions.php').length,stats:c('region-stats.php').length,mapStyle:r.filter(e=>/naver|navercorp|pstatic/.test(e.name)&&/style/.test(e.name)).length}})()
   ```
   그리고 공통 수락 6번의 render 계측(00-INDEX)을 같이 본다.
3. 공부방 로그인 공부방찾기: DevTools Network에서 `search.php` 각 요청의 Payload(`tab`, `filters`, `limit`)를 표로 적는다. 전 6건이 무엇인지(목록 / 학생 수 / 풀 3건 / 그 밖) 나누고, **본문이 완전히 같은 요청이 몇 번인지** 적는다. C 뒤에 학생 수(limit 1) 요청이 지역당 1번인지 본다. 같은 목록(room, limit 20) 본문이 두 번 이상이면 고치지 말고 보고만 한다(다음 지시서).

---

## 수락 (PR 본문에 표로)

### 1. 숫자 (전 → 후)

| 화면 | 첫 그림(FCP) | me.php 끝 | 첫 글자(h1) | 마지막 그림 | render 횟수 | search.php | regions.php | 지도 칸(공부방찾기) |
|---|---|---|---|---|---|---|---|---|
| 비로그인 공부방찾기 | | | | | | | | |
| 비로그인 과외쌤찾기 | | | | | | | | |
| 비로그인 학생찾기 | | | | | | | | |
| 공부방 로그인 공부방찾기 | | | | — | | | | |
| 공부방 로그인 학생찾기 | | | | — | | | | |
| 과외쌤 로그인 과외쌤찾기 | | | | — | | | | |
| 학생(과외 분기) 과외쌤찾기 | | | | — | | | | |
| 학생(공부방 분기) 공부방찾기 | | | | — | | | | |

통과 기준:
- **me.php 끝·첫 글자(h1)가 늦어지지 않는다.** 비로그인 9회 중앙값 기준 +30 ms 넘게 늦어지면 B를 빼고 보고한다(A·C만 PR).
- 첫 그림(FCP)이 빨라진다(회색 칸). 회색 칸 뒤 진짜 화면이 그려진다.
- regions.php·region-stats.php·search.php 수가 늘지 않는다(로그인 행 포함). 공부방 로그인 공부방찾기 search.php는 같거나 줄어든다.
- render 횟수와 지도 칸 횟수가 늘지 않는다. 5초 뒤 두 번 읽은 render 계측 값이 같다(멈춤 없음).
- 공부방 로그인 지도 배너 「학생」 숫자가 지금과 같게 뜬다(대시로 남지 않음).

### 2. 실클릭 (00-INDEX 공통 수락 + 이 지시서 추가)

계정: 공부방 · 과외쌤 · 학생(과외 분기) · 학생(공부방 분기). 각각 일반 창과 시크릿 창.
1. 메뉴로 공부방찾기·과외쌤찾기·학생찾기(보이는 것만) 진입. 회색 칸 뒤에 **로그인 헤더가 바로** 나온다. 손님 헤더(로그인 버튼)가 한 번이라도 보이면 실패.
2. 공부방: 홈 → 공부방찾기 → 홈 → 공부방찾기(두 번째 진입, 11-17 멈춤 자리). 3초 안에 화면, F12, 스크롤.
3. 찾기 → 다른 찾기 → 브라우저 뒤로 → 앞으로. 각 계정 1회.
4. 지역 바꾸기: 찾기에서 지역(시·구·동 또는 과외 단위)을 바꿔 검색 → 목록·지도·제목 위치가 바뀐 지역. 학생은 희망유형(과외/공부방) 바꾸기 1회.
5. 로그아웃 → 다른 역할로 로그인 → 찾기. 앞 역할의 지역·숫자·헤더가 보이지 않는다.
6. 비로그인 일반·시크릿: 세 찾기 화면에서 목록 카드·지도 핀(공부방)·「공부방/과외쌤/학생」 숫자가 지금과 같다. 검색칸을 누르면 로그인 팝업(지금과 같음).
7. 회색 칸 확인: 느린 3G(DevTools)로 `/search/#/search/room` 새로고침 → 하얀 화면 대신 회색 칸과 「불러오는 중…」 → 진짜 화면. 회색 칸에 로고·메뉴·로그인 버튼이 없다.
8. 오류 경로(B): DevTools에서 `regions.php`를 막고(Request blocking) 찾기 새로고침 → 지금과 같은 오류/대체 표시가 뜨고 멈추지 않는다. 막기를 풀고 새로고침하면 정상.

### 3. 빌드·검사

- `npm run build:dothome` 종료 0.
- 전후 같은 결과여야 하는 검사(main 기준 박스 실행 결과): `verify-find-pool-once.mjs` 실패 0, `verify-room-map-pins.mjs` 실패 0, `verify-map-center-by-role.mjs` 실패 1(PHP), `verify-guest-baseline-map-cards.mjs` 실패 1(박스 기준. #247 기록은 48/52), `verify-hold-find-address.mjs` 실패 1(「1 안내 문구」), `verify-student-home-tutor-tier.mjs` 실패 5. 이 수보다 늘면 멈추고 보고. 「Verify bundle」은 00-INDEX 공통 규칙 5.

## 되돌리기

커밋별 `git revert`. A는 `index.html` 한 줄, B는 `search-find-place.js` 세 곳, C는 `study-room-home-seed.js` 한 함수. 머지 뒤 문제면 merge 커밋만 `git revert -m 1 <merge>`로 새 PR. force push·reset 금지.

## 위험 정리

| 항목 | 위험 | 멈춤 위험 | 이유 |
|---|---|---|---|
| A | 낮음 | 없음 | JS 무변경. 첫 그림이 통째로 덮는다. 역할 내용 없음 |
| B | 낮음~중간 | 없음 | 요청 수 같음, 시점만. me.php 늦어짐은 수락 1번으로 막는다. 실패 재그리기 몫은 2)로 지킨다 |
| C | 낮음 | 없음 | 함수 하나. 다시 그리기 예약 없음 |
| D | — | — | 측정만 |

오픈 후로 넘긴 것(내부문서 `docs/internal/perf/home-initial-load-plan.md` 1.2.2·1.2.3·1.2.7): 세션 전 손님 화면 그리기, 스냅샷 헤더, me.php preload, 같은 HTML 가드, 지도 다시 쓰기, 지역 목록 그림 묶기, 공부방찾기 노출 풀, `searchApi` 전체 같이 쓰기.
