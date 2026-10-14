# 218 · 홈 홍보 3칸 유지 · 상단 여백 통일 · 「이달의 베스트」 빨강 — Cursor 작업지시서 (2026-10-14)

- 작성: 우동공과2(개발팀장) · 요청: 종현 (2026-10-14)
- 기준 코드: `origin/main` @ `4446404` (Merge 기록: 10-14 인수인계)
- 범위: 아래 티켓 218-1 ~ 218-4 (+ 218-5 문서 반영). **배포 금지 · commit/push는 종현 지시 후.**

## 확정 기록 (2026-10-14 · 근거: 종현 t1581)
| 항목 | 상태 |
|---|---|
| 218-1 홍보 화면 3칸 유지 | **조건부: 쉬우면 진행, 어려우면 취소** (종현: 「상단 이미지 링크일 뿐, 풀페이지마다 유지가 어려우면 취소」). 난이도 평가는 218-1 본문 참고. 진행/취소는 종현 결정 |
| 218-2 비회원 홈 3칸 아래 여백 20→8px | **승인** |
| 218-4 「이달의 베스트」 읽기 팝업 머리 색 = 레일 띠와 같은 빨강 #BE123C | **승인** — 허용 범위에 `home-right-rail.css:634-637` 추가 |
| 「고민방 3칸」이 홈 전용인지 | **보류** — 정책 논의 중, 아무것도 적용하지 않음 |
- 측정 방법: 로컬 vite(`preview/home-ui`, port 5179) + playwright chromium, `/api/auth/me.php` 응답을 역할별로 흉내(role_type = `study_room_owner` / `tutor` / `guardian_student`)해 실제 역할 홈을 그림. 값은 `getBoundingClientRect()` 차이(px, 반올림).
- 잠긴 정책(재질문 금지): 이달의 베스트 = 우측 레일 맨 위(위치 유지) · 고민방 3칸 「공부방 고민방」「과외쌤 고민방」「학생 학부모 고민방」은 「이번 시즌 추천 행동」 위 · 0건이어도 구역·제목 유지 · 정보 게시판 레일 배너 「공부방 쏙쏙정보」「과외쌤 따끈 팁가이드」 · 화면 문구는 「학생」, 개발 용어 화면 노출 금지.

## 공통 금지 (모든 티켓)
- 허용 파일 목록 밖 파일 변경 = **불합격**.
- 재디자인 금지(카드 모양·글자·색 체계 변경 금지, 이 지시서에 적힌 값만).
- 관련 없는 정리(리팩터·주석 정리·포맷 변경·이름 변경) 금지.
- 기능 추가 금지(활성 카드 표시, 애니메이션, 새 문구 등).
- 화면 문구 변경 금지.

---

## 218-1 · 홍보 화면에서도 홍보 3칸 유지 (전역, 모든 모드) — 【조건부: 쉬우면 진행, 어려우면 취소】

### 난이도 평가 (우동공과2, 결정 아님)
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

## Cursor 보고 형식
1. 티켓별 변경 파일·diff(허용 목록과 일치 확인).
2. 표의 실측값(모드 × 1280/1023/390) 그대로 채운 표.
3. 캡처: 공부방 홈 1280·390, 과외쌤 홈 1280, 홍보 화면 1280, 레일 베스트 1280.
4. 범위 밖 발견사항은 고치지 말고 목록으로만.
