# 09. 오픈 전 안전한 찾기·상세등록 속도

기준: `origin/main` `c8b90545`(PR #246). 코드를 고치기 전에 측정(공부방 계정, 2026-11-17)과 코드를 대조했다.
작성: 우동공과3(검수). 문서만. 이번 지시서는 **오픈(2026-11-20) 전에 안전하게 넣을 두 항목만** 실행한다.

## 명령

```
git fetch origin
git switch -c work/09-perf-safe-preopen origin/main
# 아래 A 수정 후 커밋, 이어서 B 수정 후 커밋 (A·B 커밋 분리)
npm run build:dothome
```

A만 먼저 빌드·검사해도 된다. B를 같은 브랜치에 이어서 넣고, PR은 하나다.

## 허용 파일 (이것만)

1. `preview/home-ui/src/exposure-bridge.js` (A)
2. `scripts/verify-find-pool-once.mjs` (A, 찾기 SPA 기대값만)
3. `preview/shared/naver-map.js` (B)
4. 기록 `docs/worklog/2026/11/2026-11-17-perf-safe-preopen.md` (+ 캡처 `docs/worklog/2026/11/shots-perf-safe-preopen/*.png`)

금지: 위 밖 모든 파일. 모든 `main.js`(home-ui·search-ui·study-room-ui·tutor-ui·auth-ui). CSS 파일 전부(새 규칙·전역 CSS·`!important`·`display:none` 금지). `auth-session.js`·로그인·세션 확인·`allowFindBoot`·진입 순서. `loadNaverMapsSdk`의 호출 시점·스크립트 주소·지연 로딩(#235는 오픈 뒤 단독 PR, 이번 금지). `register.php` 호출 순서·`#/register/basic`→`#/register/lesson` 이동. capture 클릭 가로채기·새 이벤트 리스너·`rerender()` 호출 추가 금지. 포맷 정리·리팩터·주석 손질 금지(아래 A·B에 적힌 주석만 추가).

---

## 조사에서 확인한 것 (고치지 않는 항목 포함)

측정은 공부방 계정만 있었다. 아래는 `c8b90545` 코드로 출처를 확인한 결과다.

| 현상 | 코드 출처 | 이번 지시서 |
|---|---|---|
| 메뉴를 누르면 홈·찾기·상세등록이 서로 다른 HTML로 전체가 다시 열린다. 받은 JS·CSS를 버리고 앱마다 다시 읽는다. | Vite 다중 앱. 오픈 전 구조 변경 금지. | **오픈 뒤** |
| 찾기 첫 글자는 `me.php`가 끝나야 나온다. `#app`은 그 전까지 비어 있다. | `preview/search-ui/src/main.js` 59~61행: `allowFindBoot`가 꺼져 있으면 `render()`가 바로 돌아온다. 45행 주석(「첫 셸은 me.php를 기다리지 않는다」)과 실제 코드가 다르다. 게스트 화면이 깜빡이지 않게 일부러 막은 것(0843a89c 등). | **금지** (main.js·세션) |
| 찾기 `render()`가 세션 직후 한 번, `auth:session-hydrated`에서 `changed !== false`이면 또 한 번 돈다. `innerHTML`로 지도를 지우고 다시 만든다. | `search-ui/src/main.js` 112행·136~139행. `auth-session.js` 399~400행이 `changed`를 보낸다. 서명(등록·안 읽은 쪽지·유료·찜/비교/최근)이 바뀌면 다시 그린다. | **오픈 뒤** (main.js) |
| 학생찾기 `search.php` 3~4번. | 목록 1건: `search-page.js` 241~242행 `bootStudyRoomStudentDemand` → `study-room-home-seed.js` 391~395행(학생, limit 20). 노출 풀 3건: `auth-session.js` 333~336행이 `hydrateExposureBridge()`를 **한꺼번에** 부른다(`deferExposurePool`은 공부방찾기 주소일 때만, `search-ui/src/main.js` 54~56·106행). `exposure-bridge.js` 107~119행이 room 3·tutor 2·student 2를 `Promise.all`로 보낸다. 찾기 첫 화면 카드는 이 풀이 아니다(`docs/worklog/2026/10/2026-10-16-234c-3b-find-pool-once.md`). | **A에서 고침** |
| 공부방찾기 `search.php` 6번, 큰 3개가 한 줄. | 목록 1건: `search-page.js` 237~239행 `bootStudyRoomHome` → `study-room-home-seed.js` 608행(공부방, limit 20). 노출 풀 3건: 234c-3b(`7ee8fad9`). 목록을 먼저 보낸 뒤 `hydrateExposureBridge({ sequential: true })`로 한 탭씩(`exposure-bridge.js` 101·113~118행, `search-ui/src/main.js` 113~119행). 이유: 공유 호스팅에서 `search.php`가 한꺼번에 나가지 않게. 학생 수 1건: `search-find-surface.js` 1162~1168행 `readStudyRoomRegionStudentCount`(limit 1, 배너 숫자). 나머지 1건은 등록 정보가 첫 그림 뒤에 오면 목록 키가 바뀌어 목록이 한 번 더 나가거나, 해시 복원 검색일 수 있다. | 풀 3건의 **한 줄 보내기는 유지**. 학생찾기처럼 한꺼번에 나가는 경로만 A에서 막는다. 목록 중복·학생 수 요청은 **오픈 뒤**. |
| 같은 지오코드 3~5번, 스타일 JSON `basic` 최대 23번. 지도가 여러 번 붙는다. | 찾기에서 지도를 붙이는 곳은 `search-map.js` 269행 `bindSearchMapPinLinks` → `naver-map.js` 556행 `bindStudyRoomMapSection` → 340행 `mountStudyRoomMap`. 화면을 다시 그릴 때마다 `#app` `innerHTML`로 옛 칸이 사라지는데, 이미 시작된 `mountStudyRoomMap`은 끊기지 않고 SDK·지오코드 뒤에 `new naver.maps.Map`을 계속 만든다(368·381·406행). `geocodeRegionAfterReady`(317~323행)는 실패 시 0.5초 뒤 한 번 더 찾는다. `geocodeMemberLabel`(306~313행)은 동을 빼고 한 번 더 찾는다. 캐시 없음(`geocodeRegionCenter` 184~207행). | **B에서 고침** (SDK를 늦게 받는 방식은 건드리지 않음) |
| 상세등록: 누른 주소는 `#/register/basic`인데 `#/register/lesson?room_id=22`로 간다. | **의도된 동작.** `study-room-ui/src/main.js` 205~217행: 기본정보가 끝났고 수정 쿼리가 없으면 lesson으로 보낸다. 메뉴 링크는 `preview/shared/preview-links.js` 33행 `#/register/basic`. 기록: `docs/design/room-audit-2026-10-15/REPORT-공부방모드-점검.md` 69행. | **고치지 않음** |
| `register.php`가 직렬로 두 번(48KB 다음 4KB). | `study-room-ui/src/register-api.js` 24~26행 `masters`, 29~33행 `load`. `main.js` 185~188행: masters는 세션과 같이 시작하지만, `loadRoom`은 세션과 masters가 끝난 뒤에야 시작한다. | **오픈 뒤** (main.js 부트 순서) |
| 상세등록에서 정보글 3건이 약 700ms에 끝난다. | `study-room-ui/src/layout.js` 181행 `renderRegisterRightRail` → `right-rail.js` 1227행, 슬롯 `register_right_rail`. 데스크톱은 본문 오른쪽, 좁은 화면은 본문 아래. 폼 첫 그림에 필요 없다. 다만 레일 받기 시점을 바꾸면 예전에 「글을 불러오는 중이에요」에 머무른 적(점검 E3)이 있어 오픈 전에는 손대지 않는다. | **오픈 뒤** |

찾기 첫 그림에 **지금 필요한** 요청: `me.php`(세션, 이번에는 못 줄임), 목록용 `search.php` 1건, 지도 SDK와 지오코드 1번.

첫 그림에 **당장 필요 없는** 요청: 노출 풀 `search.php` 3건, 레일 고민글·정보글, 찜·비교·최근, 쪽지, 유료 상태, 학생 수(배너 숫자, limit 1), 조회수(이미 목록 뒤).

---

## A. 찾기에서 노출 풀이 목록과 한꺼번에 나가지 않게

커밋: `09 fix(search): 찾기 노출 풀 search.php를 목록과 한꺼번에 보내지 않음`

파일: `preview/home-ui/src/exposure-bridge.js`만 로직 변경. 검사 `scripts/verify-find-pool-once.mjs`.

### 규칙

1. **홈**은 지금과 같다. 로그인하면 세 탭을 한꺼번에 받는다.
2. **찾기 SPA**(`pathname`이 `/search`로 시작하거나, 해시 경로가 `/search` 또는 `/search/…`)에서 `hydrateExposureBridge()`를 `sequential: true` 없이 부르면, 바로 돌아주고 실제 3건은 `requestIdleCallback`(제한 200ms) 또는 `setTimeout(0)` 뒤에 **한 탭씩** 보낸다. 학생찾기·과외쌤찾기가 이 경로다. `auth-session.js`가 풀을 기다리다가 세션 부가 로딩을 늦추지 않게, **기다리지 않고** 돌아온다.
3. `hydrateExposureBridge({ sequential: true })`는 지금처럼 그 자리에서 한 탭씩 보내고, 끝날 때까지 기다린다. 공부방찾기 234c-3b(`search-ui/src/main.js`가 목록을 보낸 뒤 부르는 경로)는 그대로다.
4. 이미 채웠거나(`bridged`) 로그인 아니면 지금처럼 바로 끝낸다. 같은 채우기가 두 번 시작되지 않게 한다. 비회원·확인 실패는 지금처럼 풀을 부르지 않는다(호출부가 막는다. 이 파일의 `isLoggedIn()` 가드도 유지).
5. 카드 id·순서·개수·등급은 풀과 무관하다. 바꾸지 않는다. 풀을 없애지 않는다(찜·상세 보조 조회에 쓰인다). 한 요청으로 세 탭을 합치지 않는다.

찾기 SPA 판별은 **pathname과 해시를 함께** 본다. 검사 스크립트는 `pathname`이 `/`이고 해시가 `#/search/room`이라, 해시만 보면 찾기이고 pathname만 보면 홈으로 오해한다.

`isFindSpa` 같은 작은 함수를 이 파일 안에만 둔다. export는 필요 없으면 하지 않는다.

### 검사 스크립트

`scripts/verify-find-pool-once.mjs`만 고친다.

- 카드 id·등급 검사, 손님 0건, 확인 실패 0건은 그대로.
- **홈 위치**를 따로 두고(`pathname: '/'`, 해시는 `/search`가 아니게): `initAuthSession(false)` 직후 풀 3건이 **한꺼번에**(최대 동시 3). 기존 `before_member_count_3`·`before_member_parallel_3`을 이 위치로 옮긴다.
- **찾기 위치**(지금처럼 해시 `#/search/room`): `initAuthSession(false)`(defer 없음) 직후 풀은 0건. 돌려준 Promise가 끝났다고 3건이 나가 있으면 실패다. idle/`setTimeout`을 기다린 뒤에는 3건이 한 줄로 나가고(`room:3`·`tutor:2`·`student:2`, 필터 `{}`, 최대 동시 1).
- `hydrateExposureBridge({ sequential: true })`를 직접 기다리면, 찾기 위치에서도 지금처럼 3건이 한 줄로 끝나야 한다.

실행: `cd preview/search-ui && npx vite-node ../../scripts/verify-find-pool-once.mjs` — 전부 통과.

---

## B. 같은 지오코드는 한 번만, 끊긴 지도는 스타일을 받지 않음

커밋: `09 fix(map): 같은 지역 지오코드를 재사용하고 끊긴 지도 생성을 멈춤`

파일: `preview/shared/naver-map.js`만.

### B-1. 지오코드 캐시

`geocodeRegionCenter`(184~207행)에 같은 질의(앞뒤 공백 제거) 캐시를 둔다.

- 성공한 `{ lat, lng }`만 기억한다. 실패·준비 안 됨(`null`)은 기억하지 않는다. 지오코더가 늦게 열리는 경우를 막기 위함이다.
- 같은 질의가 동시에 나가면 요청을 하나만 보내고, 그 결과를 같이 쓴다.
- `geocodeRegionAfterReady`·`geocodeMemberLabel`·`geocodeBusinessAddress`는 이 함수를 그대로 쓴다. 재시도(실패 후 0.5초)와 「동을 빼고 다시 찾기」는 그대로 두되, 성공한 질의는 두 번째에 네트워크를 다시 쓰지 않는다.
- 캐시 키는 질의 문자열만. 좌표를 지어내지 않는다. 못 찾으면 지금처럼 `null`이고, 대치역으로 대신하지 않는다.

### B-2. 끊긴 마운트는 지도를 만들지 않음

`bindStudyRoomMapSection`(556행)~`mountStudyRoomMap`(340행).

지금: 이전 컨트롤러는 `destroy`하지만, `#app`이 통째로 바뀌면 옛 칸은 이미 사라지고, 옛 `mountStudyRoomMap`의 `await`(SDK·지오코드)는 이어져 `new naver.maps.Map`(406행)과 스타일 JSON을 계속 받는다.

바꿀 것:

1. 마운트마다 세대 번호를 올린다. `bindStudyRoomMapSection`이 부를 때마다 그 칸의 세대를 올린다.
2. `loadNaverMapsSdk`·지오코드 등 `await`가 끝난 뒤, (가) 칸이 문서에서 떨어졌거나(나) 세대가 더 새것이면, `new naver.maps.Map`을 만들지 않고 `null`로 끝낸다. 떨어진 칸에 상태 문구를 쓰지도 않는다.
3. 늦게 끝난 옛 호출이 `mount._mapController`를 새 컨트롤러 위로 덮어쓰지 않는다.
4. 이전 컨트롤러 `destroy`는 지금처럼 새 마운트 앞에 둔다.

금지: SDK 스크립트를 늦게 받기, 스크립트 URL·서브모듈 바꾸기, 기본 중심을 대치역으로 바꾸기, 핀·줌·맞춤 로직 리팩터, 홈·상세 지도 API 모양 바꾸기. 홈 히어로와 상세 모달도 이 함수를 쓰므로, 찾기에서만 분기를 나누지 말고 같은 가드를 쓴다.

기존 지도 검사(`scripts/verify-map-center-by-role.mjs`, `scripts/verify-room-map-pins.mjs`, `scripts/verify-guest-baseline-map-cards.mjs`)는 고치지 말고 그대로 돌려서 통과하는지 본다. 실패하면 멈추고 보고한다.

---

## 수락 점검

주소창 직접 입력이 아니라 **화면의 메뉴를 눌러서** 확인한다. 비밀번호·토큰은 문서·채팅·커밋에 적지 않는다.

계정: 공부방 · 과외쌤 · 학생(과외 분기·공부방 분기) 각 1개. 일반 창과 시크릿 창.

공통(00-INDEX와 같음):

1. 각 계정으로 로그인 → 그 계정 GNB에 보이는 메뉴를 전부 누른다. 역할에 없는 메뉴는 안 보이는 게 정상이다.
2. 홈 → 찾기 → 뒤로 → 홈. 각 계정 1회.
3. 공부방: 홈 → 공부방찾기 → 홈 → 공부방찾기(두 번째, 캐시 경로). **두 번 모두 3초 안·멈춤 없음.**
4. 공부방·과외쌤: 홈 → 상세등록. 기본정보가 끝난 계정은 lesson으로 넘어가는 것이 정상이다. **폼이 3초 안에 나오고 멈추지 않는다.**
5. 매 화면 3초 안 전환, F12가 열리고, 스크롤된다.
6. 권장: 콘솔에 `__renderCount` 관찰(00-INDEX 공통 6). 화면 하나당 한 자릿수, 5초 가만히 두면 두 번 읽은 값이 같아야 한다.

이번 작업 측정(일반 창·시크릿, 캐시 있는 2회째 기준을 표에 적는다):

| 화면 | 볼 것 | 목표 |
|---|---|---|
| 학생찾기(공부방 계정, 과외쌤 계정) | Network의 `search.php` | 첫 400ms 안에 **목록 1건**만. 노출 풀 3건(room limit 3, tutor 2, student 2, 필터 거의 빈 값)은 그 뒤에 한 줄로. 한꺼번에 3건이 나가면 실패. |
| 공부방찾기 | `search.php` | 목록(limit 20)이 먼저. 노출 풀 3건은 목록이 시작된 뒤에 한 줄로(234c-3b 유지). 최대 동시 풀 요청 1. |
| 공부방찾기 지도 | 같은 지역 지오코드, 스타일 JSON(`basic`) | 지오코드는 같은 질의 **1번**(실패 재시도 1번은 허용). 스타일 JSON은 화면에 남아 있는 지도 1개 분량. 끊긴 지도가 스타일을 더 받아 20회 가까이 늘지 않아야 한다. 핀 클릭·카드 강조는 유지. |
| 과외 분기 학생 → 공부방찾기 | 지도·안내 | 「지역을 선택해 주세요」·「아래 검색창에서 지역을 선택하여 검색하세요」 유지(08에서 확인한 문구). |
| 공부방 분기 학생 → 공부방찾기 | 예전과 같음 | 대표 동 기준 목록·지도가 나온다. |
| 상세등록 | 동작 | basic→lesson 이동은 그대로. 폼이 먼저 나오고 멈추지 않음. |

결과를 PR 본문에 계정·창(일반/시크릿)별 표로 적는다. `search.php` 횟수·스타일 JSON 횟수는 숫자로. 캡처는 기록 폴더.

---

## 예상 이득 (약속이 아니라 조사 기준의 기대)

- A: 학생찾기에서 목록과 노출 풀이 부딪히지 않는다. 캐시가 있을 때 목록이 더 빨리 끝날 여지가 있다(측정 약 0.3~0.8초 구간). 공부방찾기 한 줄 3건은 유지되어, 그 화면의 횟수 6은 이번만으로 줄이지 못할 수 있다.
- B: 같은 지역을 여러 번 찾지 않고, 지워진 지도가 스타일을 받아 오지 않는다. 지도가 늦게 뜨거나 잠깐 멈추는 느낌을 줄이는 것이 목적이다.

첫 글자가 `me.php`를 기다리는 300~370ms(캐시)~710ms(첫 방문)는 이번 범위 밖이다.

---

## 되돌리기

머지 뒤 문제가 생기면 그 PR의 merge 커밋만 `git revert -m 1 <merge>`로 새 PR. force push·reset 금지.
