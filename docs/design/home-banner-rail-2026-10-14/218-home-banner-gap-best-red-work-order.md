# 218 · 홈 홍보 3칸 유지 · 상단 여백 통일 · 「이달의 베스트」 빨강 — Cursor 작업지시서 (2026-10-14)

- 작성: 우동공과2(개발팀장) · 요청: 종현 (2026-10-14)
- 기준 코드: `origin/main` @ `4446404` (최초) → 2026-10-14 t1582 갱신 기준 `9bcabca`(문서만 추가, 앱 코드 행 번호 동일)
- 범위: 아래 티켓 218-1 ~ 218-4 (+ 218-5 문서 반영). **배포 금지 · commit/push는 종현 지시 후.**

## 확정 기록 (2026-10-14~15 · 근거: 종현 t1581 · t1582 · t1583 · t1595 · t1610 · t1611 · t1625 · t1636 · t1651 · t1652)
| 항목 | 상태 |
|---|---|
| 218-1 홍보 화면 3칸 유지 | **확정·진행** (종현 2026-10-14 t1582. 이전 t1581 「조건부」에서 변경) |
| 218-2 비회원 홈 3칸 아래 여백 20→8px | **승인** |
| 218-4 「이달의 베스트」 읽기 팝업 머리 색 = 레일 띠와 같은 빨강 #BE123C | **승인** — 허용 범위에 `home-right-rail.css:634-637` 추가 |
| 「고민방 3칸」이 홈 전용인지 | **보류** — 정책 논의 중, 아무것도 적용하지 않음 |
| 218-6 홈 「오늘의 현장 · 지금 고민 HOT」 → 팝업 | **확정** (종현 2026-10-14 t1582). 찾기·등록과 같은 읽기 팝업, 팝업 안 「게시판에서 보기」로 게시판 이동. 198의 「홈 hash 유지」를 홈에 한해 대체 · 작업지시 231(224 대체, 2026-10-15) |
| 218-7 「이달의 베스트」 0건일 때 눌러도 빈 팝업 | **확정** (종현 2026-10-14 t1582). 같은 팝업 틀·빨강 머리 #BE123C·빈 문구 |
| 218-8 화면 문구 「원장」 제거 | **확정** (종현 2026-10-14 t1582). 「원장」을 빼고, 남는 대상어가 없으면 「공부방 고민방 더 보기」 · 작업지시 231(224 대체, 2026-10-15) |
| 218-8 나머지 「원장」 7곳(원장성별 ×5, 원장 소개·경력, 공부방 원장, 학부모·원장, 관리자 a28-copy) | **수정 안 함** (종현 2026-10-14 t1583). 변경 시 불합격 |
| 218-7 보완 · 0건 베스트 팝업 제목 | **확정** (종현 2026-10-15 t1595). 0건일 때 팝업 제목은 방 이름 없이 「이달의 베스트」. 글이 있을 때는 지금처럼 「<방 이름> · 이달의 베스트」. 작업지시 225(B2) |
| 218-7 보완 · 베스트 빈 문구 글자 | **확정** (종현 2026-10-15 t1595). 다른 레일 칸 빈 문구와 같은 12px / 18px. 원인: 222 diff의 `.live-rail-best__open { font: inherit; }`가 `.live-rail-empty` 글자 크기를 덮음. 고침: `button.live-rail-empty.live-rail-best__open` 에 `font-size: var(--fs-12);` 한 줄. 작업지시 225(B2) |
| 218-9 찾기·등록 레일 팝업 「게시판에서 보기」 → 게시판 이동 | **확정** (종현 2026-10-15 t1651). 홈 오른쪽 레일과 같게 팝업을 닫고 게시판으로(지금은 팝업 안 목록으로 내려가기만 = inpage). 고민방 팝업 `rail-concern-popup.js`. 작업지시 231(개정 1, C에 포함) |
| 218-10 방 이름 「학생·학부모 고민방」(가운뎃점) | **확정** (종현 2026-10-15 t1651). 지금 화면 「학생/학부모 고민방」(빗금) 5줄 → 작업지시 232 |
| 218-11 비회원 찾기 레일 순서 | **현행 유지** (종현 2026-10-15 t1651). 학생·학부모 먼저, 변경 없음 |
| 218-6 재확인 | **확정** (종현 2026-10-15 t1652). 홈 「지금 고민 HOT」 카드·아래 버튼 팝업, t1582 그대로. 지금 동작(더보기·팝업 없음, 아래 버튼은 게시판 이동) 코드로 확인 → 231 0-1절 |
| 218-9 넓힘 | **확정** (종현 2026-10-15 t1652). 찾기·등록의 **모든** 배너 팝업(고민방·자료실 정보 게시판) 「게시판에서 보기」 → 그 게시판, **같은 탭**. 검증 스크립트 갱신 포함. 작업지시 231 개정 2 |
| 218-10 넓힘 | **확정** (종현 2026-10-15 t1652). 문장 속 「학생/학부모」 6줄도 가운뎃점. 작업지시 232 개정 1(11줄·7파일) |
| 카탈로그 화면 HOT 팝업 | **대기** — 「공부방 카탈로그」「과외쌤 카탈로그」「학생 카탈로그」 화면도 홈 레일을 같이 씀. 팝업 여부 종현 확인 전까지 231 시작 보류 |
| 찾기 레일 고민방 칸 수 (219 E3 보류 닫음) | **확정** (종현 2026-10-15 t1610·t1611·t1625). 찾기 화면 레일 고민방: 공부방·과외쌤 = 홈과 같은 세 방(자기 방 먼저), 학생 = 학생/학부모 고민방 1칸, 비회원 = 세 방, 글은 **제목만**(작성자·본문 없음). 홈 레일은 바뀌지 않음. **t1625: DB·서버 기본값·화면 기본값을 모두 세 방으로 맞춤** — 화면은 저장 목록을 따르고(강제 채우기 없음), 운영 DB는 081을 종현이 phpMyAdmin으로 적용. 코드 브랜치 cursor/home-find-rail-three-20261015, 보완 지시 227(개정) |
| 찾기 레일 저장 목록 = 세 방 + 자료실 (운영 반영) | **확정·운영 DB 반영** (종현 2026-10-15 t1636). 운영 ① 확인 결과 `search_right_rail` = `['faq','library-template','safe-guide']`(2026-07-17 저장, 고민방 없음 → 227 의 081 은 0행이었을 것). 결정: 자료실 유지 + 세 방 추가. **2026-10-15 02:28 KST 종현이 운영 UPDATE, 1행** → `["faq","concern-director","concern-tutor","concern-parent","library-template","safe-guide"]`. 화면 기본값·서버 seed·081 을 같은 6개로 맞추는 보완 지시 229. 사용자 레일은 고민방 키만 그리므로 화면 결과는 227/228 과 같음 |
| 찾기 레일 6개 목록 코드 반영 | **검수 PASS** (2026-10-15, 230). 브랜치 cursor/home-find-rail-three-20261015 `73e88e97`: 화면 기본값·seed 2곳·081 모두 6개, seed 점검은 운영 6개 값에 noop, 081 운영 0행. 종현 승인 뒤 merge·배포 |
- 측정 방법: 로컬 vite(`preview/home-ui`, port 5179) + playwright chromium, `/api/auth/me.php` 응답을 역할별로 흉내(role_type = `study_room_owner` / `tutor` / `guardian_student`)해 실제 역할 홈을 그림. 값은 `getBoundingClientRect()` 차이(px, 반올림).
- 잠긴 정책(재질문 금지): 이달의 베스트 = 우측 레일 맨 위(위치 유지) · 고민방 3칸 「공부방 고민방」「과외쌤 고민방」「학생 학부모 고민방」은 「이번 시즌 추천 행동」 위 · 0건이어도 구역·제목 유지 · 정보 게시판 레일 배너 「공부방 쏙쏙정보」「과외쌤 따끈 팁가이드」 · 화면 문구는 「학생」, 개발 용어 화면 노출 금지.

## 공통 금지 (모든 티켓)
- 허용 파일 목록 밖 파일 변경 = **불합격**.
- 재디자인 금지(카드 모양·글자·색 체계 변경 금지, 이 지시서에 적힌 값만).
- 관련 없는 정리(리팩터·주석 정리·포맷 변경·이름 변경) 금지.
- 기능 추가 금지(활성 카드 표시, 애니메이션, 새 문구 등).
- 화면 문구 변경 금지.

---

## 218-1 · 홍보 화면에서도 홍보 3칸 유지 (전역, 모든 모드) — 【확정·진행, 종현 2026-10-14 t1582】

### 난이도 평가 (참고, t1581 때 기록)
- 난이도: **쉬움** — 1파일(`promo/shell.js`) 2줄(import 1 + 호출 1). 로컬에 임시 적용해 3모드 × 3폭에서 확인함.
- 중복: 홍보 화면에는 원래 3칸이 없음 → 같은 줄이 두 번 나오지 않음. 홍보 본문 히어로(카탈로그 제목·소개)와는 다른 요소.
- 레이아웃: 3칸 아래 8px 뒤에 「홈 › 홍보」 경로·제목이 이어짐. 우측 레일 위치·폭 변화 없음.
- 활성 표시: 지금 보는 홍보 화면의 카드가 따로 강조되지 않음(세 장 모두 같은 모양). 강조는 기능 추가라 이번 범위 아님.
- 모바일(390): 3칸이 1열로 쌓여 본문이 대략 400px(추정, 카드 3장+간격) 아래로 밀림. 이게 부담이면 취소 사유가 될 수 있음.
- 클릭: 기존 `[data-nav]` 처리로 이동, 추가 코드 없음.

### 원인
- 홍보 3칸(공부방 카탈로그 / 과외쌤 카탈로그 / 우리동네 학생)은 `preview/home-ui/src/home-marketing-banner.js:203-225`(`HOME_PROMO_TRIO`) → `:230-242`(`renderHomePromoTrio`) → `:248-249`(`renderHomeMarketingBanner(surface)`, surface가 `guest|parent|study_room|tutor`이면 3칸).
- 3칸은 **역할 홈 화면만** 그린다: `screens/study-room.js:147`, `screens/tutor.js:143`, `screens/parent.js:29`, `screens/guest.js:40`.
- 카드를 누르면 `#/promo/study-room|tutor|parent`로 이동 → `main.js:78` `renderPromo` → `promo/shell.js:49-53` `renderPromo()` → `promo/shell.js:10-36` `renderPromoShell()`.
- `promo/shell.js:16-25`의 `mainHtml`에 `renderHomeMarketingBanner` 호출이 **없다** → 홍보 화면에서는 3칸이 사라짐(숨김 CSS가 아니라 애초에 안 그림).

### 바꿀 것 (정확히)
`preview/home-ui/src/promo/shell.js`
1. import 1줄 추가: `import { renderHomeMarketingBanner } from '../home-marketing-banner.js';`
2. `mainHtml` 맨 앞(17행 `<div class="promo-layout">` 바로 위)에 `${renderHomeMarketingBanner(role)}` 1줄 추가. (`role` = 11행 `getNavRole()`, 홍보 화면에서는 `guest|study_room|tutor|parent`만 반환 → 항상 3칸.)
- 카드 클릭은 기존 `bindPromoShellEvents`(`promo/shell.js:38-46`)의 `[data-nav]` 처리로 그대로 이동한다. 이벤트 코드 추가 금지.

### 허용 파일
- `preview/home-ui/src/promo/shell.js` (이것만)

### 합격 기준
| 폭 | 화면 | 기준 |
|---|---|---|
| 1280 / 1023 / 390 | `#/promo/study-room`, `#/promo/tutor`, `#/promo/parent` × guest·공부방·과외쌤·학생 | `.home-promo-trio` 1개 존재, 카드 3장, 순서 공부방 카탈로그→과외쌤 카탈로그→우리동네 학생 |
| 같음 | 홍보 화면에서 다른 카드 클릭 | 해당 `#/promo/*`로 이동, 3칸 계속 보임 |
| 같음 | 우측 레일 | 변경 전과 같은 블록(지금 필요한 안내 + 정보 게시판 배너) — 이번 티켓에서 레일 변경 없음 |
| 390 | 3칸 | 1열 세로(기존 `@media (max-width:720px)` 그대로) |

전/후 확인(로컬 렌더): 전 `trio=false` → 후 `trio=true` (3 모드 × 3 폭 모두). 캡처: `png/after-promo-banner-row-1280.png`.

---

## 218-2 · 홍보 3칸 ↔ 공지 박스 여백 (모든 모드 통일)
## 218-3 · 공지/새로 왔어요 ↔ 「우리동네 공부방 | 우리동네 학생」 탭 여백 (모든 모드 통일)

(같은 CSS 파일이라 한 티켓으로 묶어 작업, 검수는 따로)

### 현재 값 (실측, 1280·1023·390 모두 동일)
| 모드 | 간격 #2 (3칸 → 공지) | 간격 #3 (공지 → 탭) | 원인 |
|---|---|---|---|
| 공부방(study_room) | **0px** | 20px | 공부방 홈만 `<div class="home-mkt-wrap">`로 감싼다(`screens/study-room.js:146-149`). `home-marketing-banner.css:342-344` `.home-mkt-wrap .home-promo-trio { margin-bottom: 0 }` → #2 = 0. #3은 `:337-340` `.home-mkt-wrap { margin-bottom: var(--space-5) }` = 20 |
| 과외쌤(tutor) | 20px | 20px | 감싸지 않음(`screens/tutor.js:143-145`). #2 = `:121` `.home-promo-trio { margin: 0 0 var(--space-5) }` = 20. #3 = `:206` `.home-news-row { margin: 0 0 var(--space-5) }` = 20 |
| 학생(parent) | 20px | 20px | tutor와 같음(`screens/parent.js:29-31`) |
| 비회원(guest) | 20px | (탭 없음) | `:121` |

→ 「과외쌤 모드가 더 넓다」는 사용자 관찰 = 공부방 0px vs 과외쌤 20px 차이.

### 목표 값과 규칙
- 요청: #2 = 「현재 #3의 1/3」, #3 = 「현재의 1/3」. 현재 #3 = 20px → 20/3 = 6.67px.
- 규칙: 디자인 매뉴얼 간격 계단 `tokens.css:109-119`(`--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 · `--space-5` 20 …)과 UDX-20 「그리드와 간격은 공통 spacing token으로만」에 따라 **가장 가까운 토큰으로 반올림** → 6.67 → **8px = `var(--space-2)`** (4px까지 2.67, 8px까지 1.33).
- 결과: **#2 = 8px, #3 = 8px, 공부방·과외쌤·학생 동일.** 비회원 #2도 8px(**종현 승인 2026-10-14 t1581**). 비회원 홈의 공지 아래 여백은 탭이 없으므로 그대로 20px.

### 바꿀 것 (정확히) — `preview/home-ui/src/styles/home-marketing-banner.css`
```diff
@@ .home-promo-trio  (121행)
-  margin: 0 0 var(--space-5, 1.25rem);
+  margin: 0 0 var(--space-2, 0.5rem);
@@ .home-mkt-wrap  (339행)
-  margin-bottom: var(--space-5, 1.25rem);
+  margin-bottom: var(--space-2, 0.5rem);
 }
+
+.home-news-row:has(+ .provider-home-tabs) {
+  margin-bottom: var(--space-2, 0.5rem);
+}
@@ .home-mkt-wrap .home-promo-trio  (343행)
-  margin-bottom: 0;
+  margin-bottom: var(--space-2, 0.5rem);
```
- `.home-news-row` 기본 margin(206행)은 **건드리지 않는다**(비회원 홈·다른 곳 영향 방지). 탭 바로 앞의 공지 줄에만 `:has(+ .provider-home-tabs)`로 적용.
- `screens/*.js` 마크업 변경 금지(공부방만 `home-mkt-wrap`인 구조는 이번에 정리하지 않음 — 관련 없는 정리 금지).

### 허용 파일
- `preview/home-ui/src/styles/home-marketing-banner.css` (이것만)

### 전 → 후 표 (합격 기준, 허용 오차 ±1px)
| 모드 | 폭 | #2 전 → 후 | #3 전 → 후 |
|---|---|---|---|
| 공부방 | 1280 | 0 → **8** | 20 → **8** |
| 공부방 | 1023 | 0 → **8** | 20 → **8** |
| 공부방 | 390 | 0 → **8** | 20 → **8** |
| 과외쌤 | 1280 | 20 → **8** | 20 → **8** |
| 과외쌤 | 1023 | 20 → **8** | 20 → **8** |
| 과외쌤 | 390 | 20 → **8** | 20 → **8** |
| 학생 | 1280 | 20 → **8** | 20 → **8** |
| 학생 | 1023 | 20 → **8** | 20 → **8** |
| 학생 | 390 | 20 → **8** | 20 → **8** |
| 비회원 | 1280/1023/390 | 20 → **8** (종현 승인 2026-10-14 t1581) | 탭 없음(공지 아래 20 유지) |

측정식: #2 = `.home-news-row.top − .home-promo-trio.bottom`, #3 = `.provider-home-tabs.top − .home-news-row.bottom`. 위 diff를 로컬에 임시 적용해 실측으로 확인함(전 모드·3폭 모두 8/8). 캡처: `png/before-*`, `png/after-*`.

추가 기준: 3칸·공지 박스·탭 자체의 높이·글자·색 변화 0. 3칸 카드 사이 가로 gap 12px 그대로.

---

## 218-4 · 「이달의 베스트」 머리띠 빨강

### 원인
- 블록 마크업: `preview/home-ui/src/right-rail.js:494-498` (`live-rail-slot--best` 안 `.live-rail-slot__band`).
- 띠 색 = `styles/home-right-rail.css:196-200` `.live-rail-slot__band { background: var(--rail-tone, …) }`.
- 베스트의 `--rail-tone`은 `home-right-rail.css:33-36`에서 고민방(`--room`)과 묶여 `--rail-tone-community` **#6d28d9(보라)**.

### 색 선택
- 사이트 안 기존 빨강: `--rail-tone-hot` **#be123c** (`home-right-rail.css:9`, 「오늘의 현장」 왼쪽 선·띠 색, `:38-40`), `--color-error` #b42318(`tokens.css:65`, 오류 전용 의미).
- 선택: **`var(--rail-tone-hot)` #be123c** — 레일 안에서 이미 쓰는 빨강, 오류 의미 색(#b42318)과 섞지 않음, 새 색 추가 없음.
- 대비: 흰 글자(#fff) on #be123c = **6.29 : 1** (WCAG AA 일반 글자 4.5 : 1 통과). 참고 기존 보라 7.10 : 1.

### 바꿀 것 (정확히) — `preview/home-ui/src/styles/home-right-rail.css`
```diff
@@ 33-36
-.live-rail-slot--best,
 .live-rail-slot--room {
   --rail-tone: var(--rail-tone-community);
 }
+
+.live-rail-slot--best {
+  --rail-tone: var(--rail-tone-hot);
+}
```
- 효과: 베스트 머리띠·왼쪽 2px 선·항목 hover 글자색이 같은 빨강(같은 변수 하나 사용). 고민방 3칸은 보라 그대로.
- **위치 변경 금지**: `right-rail.js:354-359`(best → rooms → hot 순서)와 모바일 `home-right-rail.css:521-523`(`order:-1`) 손대지 않음.
- 베스트 읽기 팝업 머리 색도 같은 빨강으로(**종현 승인 2026-10-14 t1581**). `home-right-rail.css:634-637`:
```diff
-.rail-popup[data-rail-popup-kind='concern-room'],
-.rail-popup[data-rail-popup-kind='concern-best'] {
+.rail-popup[data-rail-popup-kind='concern-room'] {
   --rail-tone: var(--rail-tone-community);
 }
+
+.rail-popup[data-rail-popup-kind='concern-best'] {
+  --rail-tone: var(--rail-tone-hot);
+}
```
  고민방 읽기 팝업은 보라 그대로.

### 허용 파일
- `preview/home-ui/src/styles/home-right-rail.css` — 33-36행 블록과 634-637행 블록만

### 합격 기준
| 폭 | 모드 | 기준 |
|---|---|---|
| 1280 / 1023 | 비회원·공부방·과외쌤·학생 홈, 찾기 3종 | `.live-rail-slot--best .live-rail-slot__band` 배경 = `rgb(190, 18, 60)`, 제목 글자 = `rgb(255,255,255)`, 블록이 레일 첫 블록 |
| 390 | 같음 | 같은 색, 레일 묶음 안 맨 위(order −1) 유지 |
| 전체 | 고민방 3칸 | 띠 = `rgb(109, 40, 217)` 그대로 |
| 전체 | 0건 | 제목 「이달의 베스트」·빈 안내 그대로 보임 |
| 1280 / 390 | 베스트 줄을 눌러 연 읽기 팝업 | 팝업 머리 색 = `rgb(190, 18, 60)`, 흰 글자. 고민방 팝업은 `rgb(109, 40, 217)` 그대로 (베스트 글이 있어야 열 수 있음) |
전/후: 띠 `#6d28d9 → #be123c` (로컬 임시 적용으로 확인, `png/after-rail-best-red-1280.png`).

---

## 218-5 · 디자인 매뉴얼 반영 (문서, Cursor가 적용)

허용 파일: `docs/003-global-design-manual.md`(study114-ds) — §2 표에 2줄, 변경 이력 1줄 추가. 다른 줄 변경 금지.

```diff
@@ ## 2. 한눈에 쓰는 잠금 요약 (5A→5B) — 표 마지막 행(그림자) 아래
 | 그림자 | sticky용 약한 그림자만 (광고판식 과다 그림자 지양) |
+| 홈 상단 세로 간격 | 홍보 3칸 → [공지 \| 동네 인사] → 「우리동네 공부방 \| 우리동네 학생」 탭 사이는 **8px(`--space-2`)**, 모든 모드 동일. 간격은 `tokens.css` 계단(4·8·12·16·20…)의 가장 가까운 값으로만 정한다 |
+| 우측 레일 머리띠 색 | 이달의 베스트 = 빨강 `--rail-tone-hot` #BE123C(흰 글자 6.29:1) · 고민방 = 보라 `--rail-tone-community` #6D28D9 · 정보 게시판 = `--rail-tone-info` #475569. 오류색 #B42318은 레일에 쓰지 않는다 |
@@ ## 변경 이력
 | 2026-09-23 | Stage 5B·UDX-05를 docs에 전역 매뉴얼로 등록 · 홍보 페이지 이례 허용 추가 |
+| 2026-10-14 | 홈 상단 세로 간격 8px 통일 · 레일 머리띠 색(베스트 빨강) 추가 (218) |
```

---

---

## 218-6 · 홈 레일 「오늘의 현장 · 지금 고민 HOT」을 읽기 팝업으로 (확정 t1582)

블록: 홈 레일 HOT 칸(위 작은 글 「오늘의 현장」, 띠 제목 「지금 고민 HOT」, `right-rail.js:507-528` `renderHotSection`).

### 원인
- 링크 방식 결정 `right-rail.js:117-121` `railLeaveMode`: 찾기·등록만 `inpage`(팝업), 홈은 `hash`(주소 이동).
- `right-rail.js:152-160` `railSlotAnchor`: 고민방 주소를 팝업 버튼(`concernInPageControl`, `:124-150`)으로 바꾸는 건 찾기·등록 슬롯일 때뿐 → 홈은 `railAnchor`(일반 링크).
- HOT 카드 `right-rail.js:412-424` `renderLivePostCard`와 HOT 아래 버튼 `:526`이 모두 `railSlotAnchor`를 거침 → 홈에서는 게시판으로 이동.
- `concernInPageControl`은 `data-concern-rail-leave="inpage"`를 고정으로 씀(`:149`) → 팝업 아래 버튼이 「페이지 안에서 이어 보기」가 됨. 홈은 게시판으로 가야 하므로 이 값이 달라야 함.

### 바꿀 것 (정확히, `right-rail.js` 한 파일)
1. `concernInPageControl(hrefOrPath, className, ctx, inner)`에 4번째 뒤 인자 `leave = 'inpage'` 추가, `:149`의 `data-concern-rail-leave="inpage"`를 `data-concern-rail-leave="${esc(leave)}"`로.
2. 새 함수 1개(`railSlotAnchor` 바로 아래):
```js
/** HOT 카드·HOT 아래 버튼. 홈도 읽기 팝업(팝업 안 「게시판에서 보기」는 게시판으로 이동). */
function railHotAnchor(hrefOrPath, className, ctx, inner, slotKey) {
  if (slotKey === 'home_right_rail' && isConcernPath(hrefOrPath)) {
    return concernInPageControl(hrefOrPath, className, ctx, inner, 'hash');
  }
  return railSlotAnchor(hrefOrPath, className, ctx, inner, slotKey);
}
```
3. `:415`(`renderLivePostCard`)와 `:526`(`renderHotSection` 아래 버튼)의 `railSlotAnchor(`를 `railHotAnchor(`로. **이 두 곳만.**
- 팝업 안 이동: `concern/rail-concern-popup.js:142-144` 기존 「게시판에서 보기」 링크를 그대로 씀(`leave="hash"` → `leaveInNewTab=false, continueInPage=false` → `<a href="#/community/...">`). 팝업 파일 수정 없음.

### 허용 파일
- `preview/home-ui/src/right-rail.js` (위 3곳만)

### 금지
- `railLeaveMode`·`railSlotAnchor` 자체 변경 금지 → 홈 「이번 시즌 추천 행동」 카드(`#/community/director` 등)는 지금처럼 링크로 남아야 함.
- 찾기·등록·상세 레일 동작 변경 금지. 팝업 모양·문구 변경 금지.

### 합격 기준 (행동)
| 폭 | 모드 | 동작 | 기대 |
|---|---|---|---|
| 1280 / 1023 / 390 | 공부방·과외쌤·학생·비회원 홈 | HOT 카드 클릭 | 주소(hash) 그대로, `.rail-popup[data-rail-popup-kind='concern-room']` 열림, 그 글 선택 상태 |
| 같음 | 같음 | HOT 아래 「… 고민방 더 보기」 클릭 | 주소 그대로, 해당 역할 고민방 목록 팝업 |
| 같음 | 같음 | 팝업 안 「게시판에서 보기」 | 같은 탭에서 `#/community/...` 게시판으로 이동 |
| 같음 | 비회원 | HOT 카드 | 팝업에서 기존 규칙대로 제목만·로그인 안내 |
| 1280 | 공부방 홈 | 「이번 시즌 추천 행동」 카드 | 변경 없음(링크 이동) |
| 1280 | 찾기 3종 | HOT 카드 | 변경 없음(팝업, 「이어 보기」 버튼) |
| 전체 | HOT 0건 | — | 구역·제목·빈 문구 그대로 |

---

## 218-7 · 「이달의 베스트」 0건일 때 빈 팝업 (확정 t1582)

### 원인
- `right-rail.js:483-499` `renderBestSection`: 누를 수 있는 것은 베스트 글 줄 버튼(`:466-475`, `data-concern-best-open`)뿐. 0건이면 빈 문구 `<p class="live-rail-empty">`(`:401`, 문구 `concern/copy.js:201` 「이달의 베스트, 아직 글이 미도착중...」)만 그려지고, 띠(`:498`)는 일반 `div` → 누를 곳이 없음.
- 클릭 받는 곳 `concern/rail-concern-popup.js:186-207`은 `[data-concern-best-open]`만 봄(섹션에 `data-concern-rail-nav`는 이미 있음, `attrs`).

### 클릭 대상 (정의)
- **0건(`status === 'ready'` 이고 항목 0개)일 때만**: ① 띠 제목 「이달의 베스트」 전체와 ② 빈 문구 줄, 두 곳을 버튼으로. 둘 다 `data-concern-best-open="${boardKeys[0]}"`(그 레일 역할의 첫 방: 공부방→공부방 고민방, 과외쌤→과외쌤 고민방, 학생·비회원→학생 학부모 고민방. `orderBoardKeysForRole` 결과 첫 값).
- 받는 중(loading)·실패(failed)일 때는 버튼 아님(지금 그대로).
- 글이 있을 때는 지금처럼 줄 버튼만(띠는 버튼 아님).

### 바꿀 것 (정확히)
`right-rail.js` `renderBestSection` 안에서, `status === 'ready' && items.length === 0`이면:
```html
<button type="button" class="live-rail-slot__band live-rail-best__open" data-concern-best-open="{boardKeys[0]}"><strong class="live-rail-slot__title">이달의 베스트</strong></button>
<button type="button" class="live-rail-empty live-rail-best__open" data-concern-best-open="{boardKeys[0]}">{CONCERN_RAIL_COPY.bestEmpty}</button>
```
그 외 상태는 현행 마크업 그대로. 팝업은 기존 `openConcernRailPopup` best 모드가 0건이면 빈 문구(`popupCopy(COPY.bestEmpty)`, `rail-popup.js:167`)를 보여 줌 → 팝업 코드 수정 없음.

`styles/home-right-rail.css` 끝에 버튼 모양 맞춤만 추가(새 모양 금지):
```css
.live-rail-best__open {
  display: block;
  width: 100%;
  border: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
button.live-rail-empty.live-rail-best__open { background: transparent; padding: 0; }
```
(띠 버튼은 `.live-rail-slot__band` 기존 배경·여백을 그대로 받음.)

### 허용 파일
- `preview/home-ui/src/right-rail.js` (`renderBestSection`만)
- `preview/home-ui/src/styles/home-right-rail.css` (위 블록 추가만)

### 금지
- 베스트 위치·순서·0건 문구 변경 금지. 글 있을 때 동작 변경 금지. 팝업 파일 수정 금지.

### 합격 기준
| 폭 | 상태 | 동작 | 기대 |
|---|---|---|---|
| 1280 / 1023 / 390 | 0건, 4모드 | 띠 「이달의 베스트」 클릭 | `.rail-popup[data-rail-popup-kind='concern-best']` 열림, 머리 배경 `rgb(190, 18, 60)`(218-4), 목록 자리에 「이달의 베스트, 아직 글이 미도착중...」, 「게시판에서 보기」 있음 |
| 같음 | 0건 | 빈 문구 줄 클릭 | 위와 같음 |
| 같음 | 0건 | 키보드 Tab → Enter | 위와 같음, 닫으면 포커스가 누른 버튼으로 돌아옴 |
| 같음 | 0건 | 레일 겉모습 | 띠 높이·색·글자, 빈 문구 위치가 변경 전과 같음(±1px) |
| 같음 | 글 있음 | 줄 클릭 | 현행 그대로 |
| 같음 | 받는 중·실패 | 띠 클릭 | 아무 일 없음(현행) |

---

## 218-8 · 화면 문구 「원장」 제거 (확정 t1582)

규칙(종현 t1582): 「원장」을 뺀다. 빼고 나서 가리킬 대상어가 남지 않으면 「공부방 고민방 더 보기」.

### 변경 대상 (이번 티켓)
| 위치 | 현재 | 변경 |
|---|---|---|
| `preview/home-ui/src/right-rail.js:245` (HOT 아래 버튼, 공부방 모드) | 「원장 고민방 더 보기」 | **「공부방 고민방 더 보기」** |
| `preview/home-ui/src/concern/copy.js:64` (커뮤니티 공부방 고민방 입구 설명) | 「…이웃 원장과 나눠 보세요.」 | **「…이웃 공부방과 나눠 보세요.」** |

### 수정 안 함 — 종현 확정 t1583 (2026-10-14), 변경 시 불합격
아래 7곳(행 단위 9건)은 직함·항목 이름이라 그대로 둔다.
| 위치 | 문구 | 화면 |
|---|---|---|
| `preview/shared/study-room-basic-form.js:305`, `:809` | 「원장성별」, 「원장성별을 선택해 주세요.」 | 공부방 기본등록 입력칸 |
| `preview/study-room-ui/src/summary.js:148`, `preview/study-room-ui/src/screens/step-basic.js:90` | 「원장성별」 | 공부방 등록 요약 |
| `preview/auth-ui/src/screens/signup-basic.js:273` | 「… 원장성별 …은 필수입니다」 | 가입 기본정보 안내 |
| `preview/home-ui/src/study-room-reg/myshop-render.js:155` | 「원장 소개 · 경력」 | 공부방 마이샵 |
| `preview/home-ui/src/promo/study-room-content.js:77` | 「공부방 원장」 | 공부방 홍보 화면 배지 |
| `preview/home-ui/src/promo/catalog.js:22` | 「학부모 · 원장」 | 홍보 목록 대상(내부 목록 값, 화면 노출 경로 미확인) |
| `preview/home-ui/src/admin/a28-copy.js:566` | 「학부모 · 원장」→「학생 · 원장」 | 관리자 화면 |
(검색: `preview/**` `.js/.html`, node_modules 제외, 주석 제외. PHP·서버 문구는 이번 범위 아님.)

### 허용 파일
- `preview/home-ui/src/right-rail.js` (245행 문구만)
- `preview/home-ui/src/concern/copy.js` (64행 문구만)
- 위 「수정 안 함」 7곳 파일·행 변경 = 불합격 (t1583)

### 합격 기준
| 폭 | 모드 | 기대 |
|---|---|---|
| 1280 / 390 | 공부방 홈 | HOT 아래 버튼 글자 = 「공부방 고민방 더 보기」 |
| 1280 | 커뮤니티 공부방 고민방 입구 | 설명 끝 = 「이웃 공부방과 나눠 보세요.」 |
| — | `rg "원장 고민방" preview --glob '!**/node_modules/**'` | 0건 |

---

## 218-9 · 찾기·등록 레일 팝업 「게시판에서 보기」도 게시판으로 (확정 t1651)
- 지금: 찾기(`search_right_rail`)·등록(`register_right_rail`)은 `right-rail.js:117-121` `railLeaveMode` = `inpage` → `rail-concern-popup.js:206` `continueInPage` → 「게시판에서 보기」가 `data-rail-popup-continue` 버튼(`rail-popup.js:201-212`, 목록으로 스크롤만).
- 바꿈: `inpage` 일 때 홈 주소를 붙인 같은 탭 링크(`{{homeBase}}/#/community/…`, `data-rail-popup-leave`). 찾기 화면은 다른 앱(`search-ui/src/layout.js:75`)이라 홈 주소가 꼭 필요. 지시 231 개정 1.
- t1652: 자료실 팝업(`library/info-rail.js`)도 포함, 같은 탭. 검증 스크립트 `scripts/verify-rail-info-banners.mjs` 검사 4개 갱신. 231 개정 2.

## 218-10 · 방 이름 「학생·학부모 고민방」 (확정 t1651)
- 화면 5줄: `concern/copy.js:45`, `board-engine-copy.js:436`·`:440`, `board-channel-acl.js:140`, `src/Board/BoardChannelAcl.php:417`. 지시 232. t1652: 문장 속 「학생/학부모」 6줄(`concern/copy.js:14`, `policy-copy.js:22`·`:104`·`:144`, `admin-red-line-copy.js:15`, `promo/study-room-content.js:72`)도 바꿈.

## 218-11 · 비회원 찾기 레일 순서 (현행 유지 t1651)
- 학생·학부모 먼저, 변경 없음.

## 티켓 묶음 순서 (충돌 방지)
- 218-6과 218-8은 같은 `right-rail.js`지만 다른 행. 218-7도 `right-rail.js`(`renderBestSection`)와 `home-right-rail.css`(218-4와 다른 블록). 한 사람이 순서대로 적용: 218-4 → 218-7 → 218-6 → 218-8.

---

## Cursor 보고 형식
1. 티켓별 변경 파일·diff(허용 목록과 일치 확인).
2. 표의 실측값(모드 × 1280/1023/390) 그대로 채운 표.
3. 캡처: 공부방 홈 1280·390, 과외쌤 홈 1280, 홍보 화면 1280, 레일 베스트 1280.
4. 범위 밖 발견사항은 고치지 말고 목록으로만.
