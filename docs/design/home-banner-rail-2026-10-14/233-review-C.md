# 233 · 작업 C 검수 (231 개정 3) — 판정 **PASS**

- 검수: 우동공과2(Grok Bot), 2026-10-15 06:3x KST · 검수만(앱 코드 수정·push 없음)
- 브랜치 `origin/cursor/home-c-hot-popup-20261015` = `93034ef8`
  - 1단계 `8f2bce1f` fix(rail): 홈 현장·HOT 읽기 팝업 + 「원장」 2곳 + 찾기·등록 팝업 게시판 이동
  - 2단계 `93034ef8` feat(rail): HOT 팝업 10개(방별 3·해결 1) + 학생 HOT 해결 후기 서버 제외
- 기준 main `219706f`. 지시: 231 개정 3(§2 `231-C.diff`, §9 2단계)
- 아래 줄 번호는 `93034ef8` 기준(1단계만 말할 때는 `8f2bce1f`)

## 판정 요약

| 항목 | 결과 |
|---|---|
| 1단계 = `231-C.diff` 글자 그대로(②) | PASS — `index` 줄 빼고 diff 빈 출력, 5파일 +49/−35 |
| ⑤ `data-rail-popup-continue` 2줄 | **기대값 오류(231 수정함)**, 코드 결함 아님 |
| 찾기·등록 「게시판에서 보기」 같은 탭 이동(고민방·자료실) | PASS |
| 2단계 파일 = 허용 6개 | PASS (+149/−3) |
| ConcernService 방별 할당·학생 해결 후기 제외 | PASS |
| SQL 가져오기 크기 | PASS — LIMIT 없음, 할당 뒤에 자름 |
| concern-hot.php `hot-popup`, 레일 상한 20 유지 | PASS |
| store.js 로더 / right-rail.js / openHotPopup / copy.js | PASS |
| 화면 개발 용어·「학부모」 오용 | 없음 |
| `php -l` | **실행 못 함**(박스에 php 없음, 설치 권한 없음 — Docker 금지) → 눈으로 확인, 문법 이상 없음 |
| `node --check` 6파일 | 모두 통과 |

## 1. ⑤ 판단 — 기대값이 틀렸음

`git grep -n "data-rail-popup-continue" 8f2bce1f -- preview/home-ui/src/concern preview/home-ui/src/library scripts/verify-rail-info-banners.mjs` → 2줄:

1. `preview/home-ui/src/concern/rail-concern-popup.js:147`(2단계 뒤 `:150`) — `opts.continueInPage ? <button … data-rail-popup-continue> : <a …>`. `231-C.diff` 는 이 삼항을 **지우지 않고** 넘기는 값만 `continueInPage` → `leaveToHome` 으로 바꿨음(`:206`, 2단계 뒤 `:285` 부근 `leaveToHome: … === 'inpage'`). `openConcernRailPopup` 을 부르는 곳은 `rail-concern-popup.js` 의 `onDocumentClick` 하나뿐이고(`git grep openConcernRailPopup` 확인) 거기서 `continueInPage` 를 넘기지 않음 → 이 갈래는 **도달 불가**, 화면에는 항상 `<a … data-rail-popup-leave>` 가 나옴.
2. `scripts/verify-rail-info-banners.mjs:931` — `cont: Boolean(document.querySelector('#rail-popup [data-rail-popup-continue]'))` 이고 합격 조건이 `!goS.cont`. 즉 그 버튼이 **없어야** 통과하는 검사.

`library/info-rail.js` 는 0건(버튼 갈래 자체를 지움, `:223`). ②(diff 동일)가 통과했으므로 2줄은 지시 diff 가 만든 결과 그대로이고, 231 §6-5 「0건」이 잘못 적힌 것. → **231 §6-5 를 「정확히 2줄」로 고침**(이 커밋).

### 같은 탭 게시판 이동 확인
- 고민방 팝업: `rail-concern-popup.js:144-152` — 찾기·등록(`inpage`)이면 `toHome = leaveToHome` → `href = {homeBase}/#/community/…`, `blank` 는 `leaveInNewTab`(=`blank`)일 때만 → `target` 없음 = **같은 탭**. 찾기 화면은 다른 앱(search-ui)이라 홈 주소가 붙어야 하는데 붙음.
- 자료실 팝업: `library/info-rail.js:222-224` — `leaveInNewTab || continueInPage` 이면 홈 주소, `target="_blank"` 는 `leaveInNewTab` 일 때만 → 같은 탭 `<a … data-rail-popup-leave>`. 찾기·등록 `continueInPage` 는 `right-rail.js:689`·`info-rail.js:263` 에서 그대로 들어옴.
- 검증 스크립트 3개(`search_go_board_link_same_tab`·`search_concern_go_board_link_same_tab`·`${label}_info_go_board_link_same_tab`, `:925-937`·`:984-991`·`:1024-1031`)가 `A` 태그·`/#/library`·`/#/community` 포함·`_blank` 없음을 확인 — 뜻 맞음.

## 2. 2단계(§9) 검수

`git diff --stat 8f2bce1f 93034ef8` = 정확히 6파일: `concern/copy.js | 1`, `concern/rail-concern-popup.js | 79`, `concern/store.js | 21`, `right-rail.js | 24`, `public/api/board/concern-hot.php | 4`, `src/Board/ConcernService.php | 23`. 허용 밖 파일 없음. 금지 대상(`listLatest`·`listBest`·`DEMAND_HIDDEN_FEED_KEYS`·`isHiddenFromFeed`·점수·`railCardLimit`·레일 HOT 로더·CSS·`rail-popup.js`·SQL) 변경 없음.

### 2-1. `src/Board/ConcernService.php`
- `:37` `HOT_POPUP_LIMIT = 10`, `:39` `HOT_POPUP_QUOTA` = director 3 · tutor 3 · parent 3 · solved 1 — §9-1 글자 그대로.
- `:543` `listHot(?array $auth = null, int $limit = 10, bool $perRoom = false)` — 기본값 false 라 레일(`view=hot`)·기존 호출은 그대로.
- `:557-559` `demand` 이면 `concern-solved` 건너뜀 — `isHiddenFromFeed` 다음, `DEMAND_HIDDEN_FEED_KEYS` 는 그대로(최신·베스트 영향 없음).
- `:609-620` 할당은 `$perRoom && $boardRole !== 'demand'` 일 때만, 점수 정렬(`:608`) **뒤**, `array_slice`(`:621`) **앞**. 할당에 없는 방은 `?? 0` → 빠짐. 모자란 방을 다른 방으로 채우지 않음(필터만 함).
- 학생(demand): 숨김 목록이 director·tutor 를 빼고 solved 도 빠지므로 **concern-parent 만**, 할당 없이 점수순 상위 10개.
- SQL(`:575-583`): `created_at >= -7 days`, **LIMIT 없음** → 7일 글 전체를 받아 점수 계산·정렬·할당 뒤에 10개로 자름. 「할당 전에 limit 로 잘림」 버그 없음. (글이 아주 많아지면 무거워지는 건 원래 구조 그대로, 이번 범위 밖.)
- 7일 창·점수·`mapHotItem`·`listLatest`·`listBest` 변경 없음.

### 2-2. `public/api/board/concern-hot.php`
- `:34-36` `view === 'hot-popup'` → `listHot($auth, ConcernService::HOT_POPUP_LIMIT, true)`. `limit` 안 받음.
- `:38` 레일 `limit` 상한 `min(…, 20)` 그대로.

### 2-3. `preview/home-ui/src/concern/store.js`
- `:503-508` `HOT_POPUP_LIMIT = 10`, `fetchHotPopupPosts()` → `view: 'hot-popup'`, `.slice(0, 10)`.
- `:513` `_hotPopupLoader`, `:613-624` `ensureHotPopupPosts`·`getHotPopupPosts`·`getHotPopupStatus` (계정별 `railOwnerKey()`). `_hotLoader` 그대로.

### 2-4. `preview/home-ui/src/right-rail.js`
- `:152-172` 새 `hotPopupControl` — 글 주소면 `data-concern-hot-post`, 아래 버튼이면 없음. `data-concern-hot-board` = `communityHubForRole(ctx.navRole).href` 경로(공부방 `/community/director`, 과외쌤 `/community/tutor`, 그 밖 `/community`). 뒤 네 속성은 `concernInPageControl` 과 같은 값.
- `:175-180` `railConcernControl` 의 `home_right_rail` 갈래만 `hotPopupControl` 로 바뀜. 찾기·등록·상세는 기존 `railSlotAnchor`/방 팝업 그대로.
- 카탈로그 3화면: `promo/shell.js:34` `slotKey: 'home_right_rail'` → 같이 적용(§9-4 대로).

### 2-5. `preview/home-ui/src/concern/rail-concern-popup.js` `openHotPopup`
- `:205-252` `openRailPopup` 공용 틀, `kind: 'concern-hot'`, `title: COPY.hotTitle`, 빈 문구 `COPY.hotEmpty`(기존 `copy.js:200`), `pageSize: CONCERN_POPUP_PAGE_SIZE`.
- 비회원: `guest()`(`:212`) → `renderSelectedPost(…, guest())`(`:248`). 서버가 비회원 글을 `titlesOnly` 로 줌(`ConcernService::listHot` → `mapHotItem($isGuest …)`) → `:89-101` 제목·날짜·반응 수 + 로그인 안내만, 본문 없음.
- 「게시판에서 보기」(`:206-211`): `data-concern-hot-board` 경로 → 공부방 = 공부방 고민방, 과외쌤 = 과외쌤 고민방, 학생·비회원 = 커뮤니티. 아래 버튼(`communityHubForRole`)과 같은 곳. 홈은 `#경로`, 같은 탭.
- 학생: 서버가 concern-parent 만, 10개 이하 + store `.slice(0,10)`.
- `onDocumentClick`(`:255-288`): 방·베스트가 먼저, 그다음 `[data-concern-hot-open]` → `openHotPopup`. 기존 팝업 그대로.

### 2-6. `preview/home-ui/src/concern/copy.js`
- `:204` `hotTitle: '지금 고민 HOT'` 한 줄만(레일 제목과 같은 글자).

### 2-7. 화면 문구
- 새로 화면에 나오는 글자: 「지금 고민 HOT」(기존 제목), 「게시판에서 보기」(기존). 개발 용어 없음. 「학부모」는 PHP 주석에만(「학생·학부모 고민방」 방 이름 뜻 그대로) — 화면 문구 아님.

## 3. 직접 돌린 명령 (Docker 없음)

| 명령 | 결과 |
|---|---|
| `git diff 219706f 8f2bce1f \| grep -v '^index' \| diff - <(grep -v '^index' 231-C.diff)` | 빈 출력 |
| `git diff --stat 8f2bce1f 93034ef8` | 6파일 +149/−3 |
| `php -l` ×2 | 실행 불가(php 없음) |
| `node --check` store.js·right-rail.js·rail-concern-popup.js·copy.js·info-rail.js·verify-rail-info-banners.mjs | 모두 통과 |
| §9-7-4 `HOT_POPUP_QUOTA\|=== 'concern-solved'` | 3줄(`:39`·`:557`·`:613`) |
| §9-7-5 `hot-popup` | `concern-hot.php:34`·`:35` + `store.js:506` = 3줄 |
| §9-7-6 `data-concern-hot-open` | rail-concern-popup.js 3 · right-rail.js 1 |
| §6-3 `원장 고민방\|이웃 원장` | 0건 |
| §6-4 `railConcernControl` | 3줄(`:175`·`:445`·`:565`) |
| §6-5 `data-rail-popup-continue` | 2줄(위 1절, 기대값 고침) |

## 4. 결함
없음.

### 참고(결함 아님, 고치지 말 것)
- `openHotPopup` 은 `leaveInNewTab` 이어도 `target="_blank"` 를 붙이지 않음(`:206-211`). `home_right_rail` 은 지금 모두 `linkMode: 'hash'` 라 `railLeaveMode` 가 `hash` 만 돌려줌 → 도달 안 함. 나중에 홈 레일을 absolute 로 쓰는 화면이 생기면 다시 볼 것.
- `rail-concern-popup.js:149-150` `continueInPage` 갈래·`rail-popup.js` continue 처리는 쓰는 곳 없음 — 231 §2 「지우지 않음」 그대로.
- `php -l` 은 merge 전 Docker/로컬 PHP 있는 곳에서 한 번 돌려 둘 것(권장).

## 5. 다음
- 종현 승인 뒤 `cursor/home-c-hot-popup-20261015` main merge. 그다음 232.
