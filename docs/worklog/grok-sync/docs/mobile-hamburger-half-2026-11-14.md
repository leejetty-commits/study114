# 모바일 햄버거 메뉴 — 반폭·오른쪽 정렬·플로팅 숨김·문의하기 (2026-11-14)

- 작성: 우동공과3 · 실행·1차 셀프검수: Cursor · 최종검수: 우동공과3
- 브랜치: 최신 main에서 `work/mobile-hamburger-half` 워크트리. `D:\work\study114\.wt\` 안에만 만든다.
- 기준 커밋: 이 지시서를 쓸 당시 origin/main은 `ead5ec91`(PR #207 머지). 작업 시작 전 최신 main을 다시 받아 거기서 시작한다.

## 종현 확정 (2026-11-14)

1. 모바일 햄버거 메뉴 패널은 **오른쪽에서** 나오므로, 너비를 **화면의 1/2**로 한다.
2. 메뉴 항목은 **오른쪽 정렬**한다. 아이콘·하위 메뉴·배지가 있으면 함께 오른쪽으로 맞춘다.
3. 메뉴가 열려 있는 동안 플로팅 버튼(문의하기, 맨 위, 맨 아래)을 **숨기고**, 닫으면 다시 보인다. 메뉴 열림은 body(또는 루트)의 **클래스 하나**로 표시하고 **CSS로 숨긴다**. 문의하기 펼침 패널이 열려 있었다면 함께 닫는다.
4. 메뉴 맨 아래에 「문의하기」한 줄을 넣어, 기존 플로팅 문의하기와 **같은 동작**을 쓴다.
   - 로그인: 자주 묻는 질문 · 운영문의 · 카카오톡 문의
   - 비로그인: 자주 묻는 질문 · 카카오톡 문의
   - 기존 문의 링크와 카카오 URL `https://pf.kakao.com/_xkeMNX/chat`를 재사용한다. **새 문구를 지어내지 말 것.**
5. **데스크톱 화면은 바꾸지 않는다.** 실시간 퀵매칭 작업(마이페이지 메뉴, 쪽지함·후기함, 쪽지 발송) 파일은 **건드리지 않는다.**

## 범위

- **하는 일:** 모바일(햄버거가 보이는 폭, 현재 `max-width: 899px`)에서 드로어 너비·정렬, 열림 중 플로팅 숨김, 메뉴 하단 문의하기만 고친다.
- **하지 말 일:** 데스크톱(≥900px) 헤더·GNB·유틸바·플로팅 위치·크기. 메뉴 항목 이름·순서·권한. 소개영상 라벨·재생 로직. 카카오 URL·FAQ·운영문의 경로 변경. 실시간 퀵매칭. 금액·환불. SQL.

## 현재 코드 위치 (origin/main `ead5ec91` 기준)

렌더·열기/닫기가 **두 곳**에 같다. 한곳만 고치면 앱이 갈린다. **둘 다** 같은 동작으로 맞출 것.

| 역할 | 경로 | 위치 | 쓰는 곳 |
|------|------|------|---------|
| 홈 헤더 렌더 | `preview/home-ui/src/layout.js` | `renderHeader` 248–298행 부근. 햄버거 `data-action="hamburger-toggle"` 281행, 드로어 마크업 289–298행 | home-ui만 |
| 홈 열기/닫기 | 같은 파일 | `openDrawer` 467–474행, `closeDrawer` 476–483행, 바인딩은 `bindLayoutEvents` 485–520행 | home-ui만 |
| 공통 헤더 렌더 | `preview/shared/site-chrome.js` | `renderSiteHeader` 132–182행. 햄버거 160행, 드로어 마크업 168–179행 | search-ui, tutor-ui, study-room-ui, auth-ui (`bindSiteChrome`) |
| 공통 열기/닫기 | 같은 파일 | `openDrawer` 223–230행, `closeDrawer` 232–239행, 바인딩은 `bindSiteChrome` 241–274행 | 위 앱들 |
| 드로어·햄버거 CSS | `preview/home-ui/src/styles/home.css` | 햄버거 928–968행, 드로어 970–1112행 | home-ui·search-ui·tutor-ui·study-room-ui·auth-ui가 이 파일을 import. **CSS는 여기 한곳** |
| 패널 너비(현행) | 같은 파일 | `.home-drawer__panel` 987–999행, **992행 `width: min(18rem, 85vw);`** · `right: 0`(오른쪽에서 나옴) | 이번 핵심. 360폭에서는 약 288px(화면의 80% 가까이) |
| 열림 클래스(이미 있음) | JS + CSS | `openDrawer`/`closeDrawer`가 `document.body`에 `is-drawer-open`을 붙이거나 뗀다. CSS는 `home.css` 1110–1112행에서 `overflow: hidden`만 지정 | **새 클래스를 만들지 말 것.** 이 클래스로 플로팅을 숨긴다 |
| 플로팅 생성·문의 패널 | `preview/shared/back-to-top.js` | `ensureBackToTop` 284행. 맨 위 `ensureTopButton` 164행(`#study114-back-to-top`, 라벨 「맨위」). 맨 아래 `ensureBottomButton` 182행(`#study114-back-to-bottom`, 라벨 「맨아래」, 모바일 ≤768px만 표시). 문의하기 `ensureInquiryFab` 201행(`#study114-inquiry-fab`, 패널 `#study114-inquiry-panel`). 패널 닫기 `closeInquiryPanel` 106–113행(**지금은 export 되어 있지 않음**) | `layout.js` 9·659행, `site-chrome.js` 19·395행에서 `ensureBackToTop` 호출 |
| 문의 상수 | `preview/shared/inquiry-contact.js` | `INQUIRY_FAQ_HASH` = `#/support/faq`(10행). `inquiryContactUrl()` → `supportUiUrl('/support/contact')`(13–15행). `KAKAO_CHAT_URL` = `https://pf.kakao.com/_xkeMNX/chat`(18행) | 여기 상수를 import 해서 쓴다. URL을 다른 파일에 다시 적지 말 것 |
| 문의 항목·문구(현행) | `back-to-top.js` | 토글 라벨 「문의하기」(216–221행). 패널 기본: 「자주 묻는 질문」「카카오톡 문의」(229–232행). 로그인 때만 「운영문의」를 카카오톡 앞에 넣음(`syncInquiryContactItem` 115–137행). 순서는 **자주 묻는 질문 → 운영문의(로그인만) → 카카오톡 문의** | 메뉴 안 문의하기 문구·순서·로그인 분기를 이와 **똑같이** 맞춘다 |
| 플로팅 CSS | `preview/home-ui/src/styles/design-system.css` | `.back-to-top` 429–475행(z-index 1200). `.back-to-bottom` 478–487행. `.inquiry-fab` 490–590행(z-index 1200). 드로어 z-index는 1500(`home.css` 974행) | 열림 중 숨김 규칙은 이 파일 또는 `home.css`에 둔다. `product-chrome.css` 144행 hover는 건드리지 말 것 |
| 메뉴 항목 이름 | `preview/shared/site-nav-config.js` `GNB_MAIN`(69–78행), 유틸은 `resolveUtilMenuItems`. home-ui는 `preview/home-ui/src/nav-config.js`를 씀 | 「공부방상세등록」「과외쌤상세등록」등. 소개영상 라벨은 `DRAWER_PROMO_LABELS`(「우동공과 공부방 소개영상」「우동공과 과외쌤 소개영상」) | **이름은 바꾸지 말 것.** 정렬만 |
| 아이콘·배지·하위 메뉴 | 기준 커밋에서 드로어 항목은 **글자만** 있다. GNB·소개영상·유틸에 아이콘·배지·하위 메뉴는 없음 | 나중에 생기더라도 오른쪽 정렬이 깨지지 않게 `justify-content: flex-end` 등으로 맞출 것 |

햄버거는 `@media (max-width: 899px)`에서만 보인다(`home.css` 954–968행). 너비·정렬 변경도 이 구간에 두어, 데스크톱에서는 패널 규칙이 바뀌지 않게 한다. 「맨 아래로」는 768px 이하만 보이지만, 769–899px에서도 「문의하기」「맨 위」가 메뉴와 겹칠 수 있으므로 **햄버거가 열리는 폭에서는 세 버튼 모두** 숨긴다.

## 구현

### 1. 패널 너비 (화면의 1/2)

- `@media (max-width: 899px)`에서 `.home-drawer__panel` 너비를 **화면의 1/2**(`50vw`)로 바꾼다. 기존 `min(18rem, 85vw)`는 이 구간에서 쓰지 않는다.
- 왼쪽 절반은 배경(`home-drawer__backdrop`)으로 남겨, 눌러 닫을 수 있어야 한다.
- **너무 좁은 폭(360px 이하) 최소 너비:** `min-width: 12.5rem`(200px)를 둔다.
  - 이유: 360폭에서 50vw는 180px이다. 좌우 패딩이 각 `var(--space-5)`(1.25rem, `tokens.css` 113행)이면 글자 칸은 약 140px이다. 긴 항목 「우동공과 공부방 소개영상」이 잘리지 않고 두 줄로 접히게 하려는 값이다. 360폭에서 패널은 화면의 약 56%가 된다(반쪽에서 약 20px만 큼).
  - `14rem`(224px, 360폭의 62%)이나 `16rem`(256px, 71%)은 반쪽 목표를 흔들므로 **쓰지 말 것.** 200px로도 글자가 잘리거나 터치 영역이 무너지면 **보고만** 하고, 임의로 키우지 말 것.
- `white-space: nowrap`으로 글자를 자르거나 숨기지 말 것. 긴 항목은 줄바꿈을 허용한다(드로어 GNB는 이미 `white-space: normal`).
- 기존 18rem 상한은 모바일에서 제거한다. 899px 직전에서 50vw는 약 450px가 되며, 이것이 종현이 정한 「화면의 1/2」이다.
- 데스크톱(≥900px)의 `.home-drawer__panel` 너비 선언은 그대로 둔다.

### 2. 오른쪽 정렬

- 드로어 안의 GNB(`.home-drawer__gnb .home-gnb__item`), 소개영상(`.home-drawer__promo-item`, 지금은 `text-align: left`), 유틸 링크·계정(`.home-drawer__util`), 하단 「문의하기」와 그 하위 항목을 모두 오른쪽 정렬한다. `justify-content: flex-end`와 `text-align: right`를 항목 형태에 맞게 쓴다.
- 아이콘·배지가 생기면 글자와 한 덩어리로 오른쪽에 붙인다. 아이콘만 왼쪽에 남지 않게 한다.
- 헤더(`.home-drawer__head`)는 지금처럼 제목 「메뉴」는 왼쪽, 닫기(✕)는 오른쪽을 **유지**한다. 닫기 버튼 위치를 옮기지 말 것.
- 이 정렬도 `@media (max-width: 899px)` 안에만 둔다.

### 3. 메뉴가 열려 있는 동안 플로팅 숨김

- 이미 있는 `body.is-drawer-open`을 쓴다. 클래스를 하나 더 만들지 말 것.
- CSS로 `#study114-back-to-top`, `#study114-back-to-bottom`, `#study114-inquiry-fab`(클래스 `.back-to-top`, `.back-to-bottom`, `.inquiry-fab`)를 숨긴다. `pointer-events: none`을 함께 두어 숨긴 버튼을 누를 수 없게 한다. `.back-to-bottom`은 모바일 미디어쿼리에서 `display: inline-flex`이므로, `display`만 바꿔 싸우지 말고 `visibility`·`opacity`·`pointer-events` 또는 필요한 경우 `display: none !important`로 확실히 숨긴다.
- `openDrawer`(두 파일 모두)에서 메뉴를 열 때 문의하기 펼침 패널을 닫는다. `closeInquiryPanel`을 `back-to-top.js`에서 export 하고 두 `openDrawer`에서 호출한다. 숨기기만 하고 `is-open`·`aria-expanded`가 열린 채로 남지 않게 한다.
- 메뉴를 닫으면(`closeDrawer`가 `is-drawer-open`을 제거) 플로팅은 CSS만으로 다시 보인다. 닫힌 뒤의 표시 규칙은 기존 `syncTop`/`syncBottom`/`syncInquiry`(모달·스크롤)를 그대로 따른다. 데스크톱에서 「맨 아래로」가 보이게 만들지 말 것.
- 플로팅의 닫힌 상태 위치·크기·문구는 바꾸지 말 것.

### 4. 메뉴 맨 아래 「문의하기」

- 드로어 패널에서 유틸(`.home-drawer__util`) **아래**에 「문의하기」한 줄을 넣는다. `renderHeader`와 `renderSiteHeader` **둘 다**.
- 이 줄을 누르면 **메뉴 안에서** 기존 플로팅과 같은 항목이 펼쳐진다. 메뉴가 열린 동안 플로팅은 숨기므로, 플로팅 패널을 대신 열지 말 것.
- 문구는 기존 그대로만 쓴다: 「문의하기」, 「자주 묻는 질문」, 「운영문의」, 「카카오톡 문의」. 항목 순서도 기존 플로팅과 같다: 자주 묻는 질문 → 운영문의(로그인만) → 카카오톡 문의.
- 링크는 `inquiry-contact.js` 상수만 사용한다. 카카오톡은 지금처럼 `target="_blank"` `rel="noopener noreferrer"`. FAQ·운영문의는 기존 드로어 링크처럼 이동하고 메뉴를 닫는다. mailto·이메일 항목을 다시 넣지 말 것. 카카오 JS SDK·외부 위젯 금지.
- 로그인 분기는 플로팅과 같은 기준을 쓴다. home-ui는 기존 `isLoggedIn()`, 공통 헤더는 렌더 시점의 로그인 값과 `auth:login` / `auth:logout` / `auth:session-hydrated`로 맞춘다. `auth-session.js`를 `preview/shared`에 직접 import하지 말 것.
- 비로그인에서 「운영문의」빈 칸을 남기지 말 것. 로그아웃하면 빠지고, 로그인하면 다시 생긴다.

### 5. 건드리지 말 파일·작업

- 실시간 퀵매칭: 마이페이지 메뉴, 쪽지함·후기함, 쪽지 발송 관련 파일. 이번 대상은 헤더 드로어·플로팅 문의하기·관련 CSS만이다.
- 프로모 잠금: `preview/home-ui/src/promo-video-config.js`, 우측 레일 프로모 부분. 소개영상 **라벨·재생**은 그대로 두고, 드로어에서의 **정렬만** 해도 된다.
- `home.css`를 이 작업 때문에 쪼개지 말 것. CSS를 고치면 그 파일의 괄호 짝이 맞아야 한다(파일마다 따로 파싱됨).

## 금지 (공통)

- force push, `reset --hard`, `stash drop` 금지.
- 운영 `.env`·운영 DB 쓰기·운영 SQL 금지. 키·비밀번호·토큰·세션값을 문서·커밋·로그·보고에 쓰지 않음.
- 데스크톱 레이아웃은 1px도 바꾸지 말 것.
- 프로모 잠금 손대지 않음.
- PR #198은 머지하지 말 것.
- 로컬 `D:\work\study114`와 각 `.wt\work-*`의 더티 워크트리는 건드리지 말 것. 더티 워크트리에서 rebase 하지 말 것. 실시간 퀵매칭 워크트리가 있으면 이어서 고치지 말 것.
- 커밋·push·PR까지. **머지는 우동공과3 최종검수 후 종현 승인으로.** 머지 전에 보고한다.
- 범위 밖에서 발견한 버그는 고치지 말고 보고서 「발견 목록」에만 적음.

## 확인 (셀프검수)

캡처는 `docs/worklog/2026/11/mobile-hamburger-half-captures/`에 두고, 폭을 파일명에 적는다. 테스트 계정만, 실명 금지.

1. **390·360 폭**, 홈(home-ui)과 공통 헤더 앱 하나(검색 또는 로그인 화면)에서:
   - 메뉴 **닫힘** — 햄버거만 보이고, 플로팅(문의하기·맨 위·맨 아래, 해당 폭에서 원래 보이는 것)이 보인다.
   - 메뉴 **열림** — 패널이 오른쪽에서 나와 너비가 화면의 약 1/2(360폭은 최소 200px까지). 항목은 오른쪽 정렬. 왼쪽 배경을 눌러 닫을 수 있다. 긴 소개영상 라벨이 잘리지 않는다.
   - 메뉴 맨 아래 **「문의하기」** — 펼치면 비로그인: 자주 묻는 질문·카카오톡 문의. 로그인: 자주 묻는 질문·운영문의·카카오톡 문의. 이메일 항목 없음.
   - 열림 중 **플로팅 숨김** — 문의하기·맨 위·맨 아래가 보이지 않고, 메뉴 하단 글자와 겹치지 않는다. 열기 전에 문의하기 패널을 열어 두었더라도 함께 닫혀 있다.
   - 닫은 뒤 **복귀** — 플로팅이 다시 보이고, 위치는 열기 전과 같다.
2. **데스크톱 1280** 회귀 없음: 햄버거 없음, 상단 GNB·유틸 그대로, 플로팅 위치·크기 그대로, 드로어가 보이지 않음. 가능하면 이전 캡처 또는 작업 전 캡처와 비교.
3. CSS: 고친 각 CSS 파일의 괄호 깊이가 파일 끝에서 0인지 검사한다. 규칙 밖으로 `}`가 떠 있지 않아야 한다.
4. 자주 묻는 질문·운영문의가 기존 경로로 가는지, 카카오톡 문의가 `https://pf.kakao.com/_xkeMNX/chat`로 새 탭에서 열리는지 확인한다.

### 셀프검수 체크리스트

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 390·360 메뉴 닫힘, 플로팅 보임 | | 스크린샷 |
| 2 | 390·360 메뉴 열림, 너비 약 1/2(360은 최소 200px), 오른쪽 정렬, 글자 안 잘림 | | |
| 3 | 메뉴 맨 아래 문의하기. 로그인/비로그인 항목이 기존과 같음 | | |
| 4 | 열림 중 플로팅 숨김. 미리 연 문의 패널도 닫힘 | | |
| 5 | 닫은 뒤 플로팅 복귀, 위치 유지 | | |
| 6 | 1280 회귀 없음 | | |
| 7 | CSS 파일별 괄호 깊이 0 | | |
| 8 | FAQ·운영문의·카카오 URL 기존과 동일 | | |
| 9 | 공통 금지·퀵매칭 파일 위반 없음 | | |
| 10 | home-ui와 공통 헤더 앱 모두 동일 동작 | | |

작업 기록은 `docs/worklog/2026/11/`에 남긴다.

## 최종검수 패키지 (우동공과3에게 넘길 것)

보고 맨 끝에 아래 형식 그대로 붙인다.

```
[최종검수 패키지 — 모바일 햄버거 메뉴]
브랜치 / 커밋: work/mobile-hamburger-half / <hash>
PR: (URL, 머지 안 함)
변경 파일: (경로 목록, 파일별 +/- 줄 수: git diff --stat main...HEAD)
diff 요약: (파일별 1~2줄, 무엇을 왜)
테스트: (명령 → PASS n / FAIL n, 기존 회귀 포함)
스크린샷: (경로 목록, 폭 표기 1280·390·360, 닫힘/열림/문의하기/플로팅 숨김/복귀)
셀프검수 체크리스트: (아래 표 채운 것)
360폭 최소 너비: 12.5rem 적용 여부, 잘림·보고 사항
미해결·종현 결정 필요: (없으면 「없음」)
```
