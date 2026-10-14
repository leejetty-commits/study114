# 231 · Cursor 작업지시 C (224 갱신판) — 홈 「오늘의 현장 · 지금 고민 HOT」 읽기 팝업 + 「원장」 문구 2곳 (218-6 · 218-8)

- 작성: 우동공과2(개발팀장), 2026-10-15 · **개정 1 (종현 t1651, 05:2x KST)**: 찾기·등록 팝업 「게시판에서 보기」도 게시판으로 이동(218-9) 추가.
- **개정 2 (종현 t1652, 05:3x KST)**: 찾기·등록의 **모든** 배너 팝업(고민방 + 자료실 정보 게시판)으로 넓힘, 같은 탭 확정, 검증 스크립트 갱신 포함 → 파일 5개. 홈 HOT 지금 동작을 0-1절에 정확히 적음.
- ⛔ **시작 보류(대기)**: 아래 8절 P1(홈 레일을 같이 쓰는 「공부방 카탈로그」「과외쌤 카탈로그」「학생 카탈로그」 화면도 팝업이 되는지) 종현 답이 오기 전에는 시작하지 말 것. 이 diff 그대로면 세 카탈로그 화면 레일의 HOT 도 팝업이 됨(코드에서 홈과 구분되지 않음, `promo/shell.js:34` `slotKey: 'home_right_rail'`).
- 기준: origin/main `e50ab987`(문서 커밋, 코드는 B2 merge `58036395` 와 같음). 아래 줄 번호는 `40264c14`·`58036395`·`e50ab987` 에서 모두 같음(B2 는 494·497 제자리 수정). `231-C.diff` 는 `e50ab987` 위에서 `git apply --check` 통과.
- 방 이름 「학생·학부모 고민방」 통일(218-10)은 다른 파일이라 **별도 작은 지시 232**.
- 이 문서만 보고 작업할 수 있게 썼습니다(대화 기록 없음 전제). **224를 대체**합니다(내용은 같고, 기준·줄 확인·브랜치 이름·시험 방식만 새로 씀). 224는 아직 아무도 시작하지 않았음(원격에 home-c 브랜치 없음, 확인 2026-10-15 05:1x).
- 한 줄 요약: 홈 레일 「지금 고민 HOT」 카드와 그 아래 버튼을 **읽기 팝업**으로 열고, 「원장」 문구 **2곳**을 바꾸고, 찾기·등록 화면 고민방 팝업의 「게시판에서 보기」가 **게시판으로 이동**하게 한다. 파일 5개(코드 4 + 검증 스크립트 1).

## 0. 확정 기록 (종현이 이미 정한 것만)

| 날짜 | 근거 | 확정 내용 | 문서 |
|---|---|---|---|
| 2026-10-14 | 종현 t1582 | **218-6** 홈 레일 「오늘의 현장 · 지금 고민 HOT」 카드와 아래 버튼도 찾기·등록처럼 **읽기 팝업**. 팝업 안 「게시판에서 보기」는 홈의 다른 팝업과 같이 게시판으로 이동. 198의 「홈 hash 유지」는 홈 HOT 칸에 한해 대체 | 218 확정 기록 14행, 218-6 절(208행~) |
| 2026-10-14 | 종현 t1582 | **218-8** 화면 문구에서 「원장」을 뺀다. 대상어가 안 남으면 「공부방 고민방 더 보기」. 대상 2곳: HOT 아래 버튼(공부방 모드), 커뮤니티 공부방 고민방 입구 설명 | 218 확정 기록 16행, 218-8 절(305행~) |
| 2026-10-14 | 종현 t1583 | 나머지 「원장」 7곳(행 9건)은 **수정 안 함**, 바꾸면 불합격 | 218 확정 기록 17행 |
| 2026-10-15 | 종현 t1651 | **218-9** 찾기·등록 화면 레일 팝업의 「게시판에서 보기」도 홈 오른쪽 레일처럼 **게시판으로 이동**(지금은 팝업 안 목록으로 내려가기만 함 = inpage) | 218 218-9 절 |
| 2026-10-15 | 종현 t1651 | 비회원 찾기 레일 순서는 지금 그대로(학생·학부모 먼저). **변경 없음** | 218 218-11 |
| 2026-10-15 | 종현 t1652 | (Q1 답) 홈 「지금 고민 HOT」 카드와 아래 버튼을 팝업으로 — t1582 그대로 | 218-6 |
| 2026-10-15 | 종현 t1652 | (Q2 답) 찾기·등록 화면의 **모든** 배너 팝업(고민방, 자료실 정보 게시판 등) 「게시판에서 보기」는 그 게시판으로 이동 | 218-9 |
| 2026-10-15 | 종현 t1652 | (Q3 답) 이동은 **같은 탭** | 218-9 |
| 2026-10-14 | 종현 t1582 | 적용 순서 218-4 → 218-7 → 218-6 → 218-8 (218-4·218-7은 작업 B·B2로 끝) | 218 343행 |

## 0-1. 지금 홈 「지금 고민 HOT」 동작 (origin/main 코드 확인, 우동공과2)
- 종현 설명(t1652) 「지금 HOT 에는 더보기·팝업이 없고, 「커뮤니티 더 보기」는 게시판으로 간다」 → **맞음**. 정확히는:
  - 머리(「오늘의 현장」·「지금 고민 HOT」)에는 더보기 링크가 **없음**(`right-rail.js:527-530`).
  - 글 카드: 누르면 팝업 없이 **그 글의 게시판 화면으로 바로 이동**(`renderLivePostCard` → `railSlotAnchor` → 홈은 일반 링크, `right-rail.js:415`·`159`).
  - 아래 버튼 하나: 이름은 모드마다 다름 — 공부방 「원장 고민방 더 보기」, 과외쌤 「과외쌤 고민방 더 보기」, 학생·비회원 「커뮤니티 더 보기」(`right-rail.js:244-248`). 누르면 팝업 없이 **게시판으로 이동**(`:535`).
- 바꾼 뒤: 카드 → 그 글을 연 읽기 팝업, 아래 버튼 → 그 방 읽기 팝업(학생·비회원은 학생·학부모 고민방). 팝업 안 「게시판에서 보기」 → 같은 탭 게시판. 공부방 버튼 이름은 「공부방 고민방 더 보기」(218-8).

## 1. 손대기 전 다시 확인(필수, 다르면 짐작하지 말고 멈춘 뒤 보고)

`git fetch origin` 후 origin/main 에서. main 이 `40264c14` 보다 앞서 있으면 `git log 40264c14..origin/main -- preview/home-ui/src/right-rail.js preview/home-ui/src/concern/copy.js` 결과도 보고(B2가 먼저 merge 됐다면 right-rail.js 494·497 두 줄만 바뀌어 있음 → 아래 줄 번호는 그대로, 진행).

| # | 파일:줄 (40264c14) | 있어야 할 내용 |
|---|---|---|
| R1 | `preview/home-ui/src/right-rail.js:117-121` | `function railLeaveMode(slotKey, ctx) {` … 찾기·등록 `'inpage'`, 상세·absolute `'blank'`, 나머지 `return 'hash';` |
| R2 | `right-rail.js:92` | `function isConcernPath(hrefOrPath) {` (이미 있음, 새로 만들지 말 것) |
| R3 | `right-rail.js:124` | `function concernInPageControl(hrefOrPath, className, ctx, inner) {` |
| R4 | `right-rail.js:149` | `  )}" data-concern-rail-leave="inpage">${inner}</button>`;` |
| R5 | `right-rail.js:152` | `function railSlotAnchor(hrefOrPath, className, ctx, inner, slotKey) {` — **수정 금지** |
| R6 | `right-rail.js:245` | `  if (role === 'study_room') return { href: '#/community/director', label: '원장 고민방 더 보기' };` |
| R7 | `right-rail.js:415` | `  return railSlotAnchor(` (`renderLivePostCard` 안) |
| R8 | `right-rail.js:535` | `      ${railSlotAnchor(copy.ctaHref, 'live-rail-slot__cta', ctx, esc(copy.ctaLabel), slotKey)}` (`renderHotSection` 안) |
| R9 | `right-rail.js:637`, `:649` | `function renderActionItem(…` / `  return railSlotAnchor(item.href, cls, ctx, inner, slotKey);` — **수정 금지**(추천 행동은 일반 링크) |
| R10 | `preview/home-ui/src/concern/copy.js:64` | `    desc: '운영·모집·공간 운영 질문을 남기고 이웃 원장과 나눠 보세요.',` |
| R11 | `git log 40264c14..origin/main -- right-rail.js concern/copy.js concern/rail-concern-popup.js` | B2 `a49f256` 한 건만(우동공과2 확인 2026-10-15). 그 밖이 있으면 멈추고 보고 |
| R12 | `preview/home-ui/src/concern/rail-concern-popup.js:141` | `  const boardHref = opts.leaveInNewTab ? `…`/#${path}` : `#${path}`;` |
| R13 | `rail-concern-popup.js:143-145` | `opts.continueInPage` 이면 `<button … data-rail-popup-continue>`(목록으로 스크롤만, `rail-popup.js:201-212`), 아니면 `<a … data-rail-popup-leave>` |
| R14 | `rail-concern-popup.js:206` | `    continueInPage: section.getAttribute('data-concern-rail-leave') === 'inpage',` (이 값을 쓰는 곳은 여기 하나) |
| R16 | `preview/home-ui/src/library/info-rail.js:221-225` | 자료실 팝업도 `continueInPage` 이면 `data-rail-popup-continue` 버튼(목록 스크롤만), `:263` `continueInPage: … === 'inpage'` |
| R17 | `scripts/verify-rail-info-banners.mjs:911-940`, `:971-990`, `:1020-1028` | 찾기·등록 팝업 「게시판에서 보기」가 `BUTTON`·`data-rail-popup-continue` 이라고 확인하는 검사 4개(`search_go_board_in_page`, `search_go_board_stays_on_screen`, `search_concern_go_in_page`, `${label}_info_go_in_page`) |
| R15 | `right-rail.js:117-121` + `preview/search-ui/src/layout.js:75-78` | 찾기 레일은 `search_right_rail` → `inpage`. 찾기 화면은 **다른 앱**(search-ui)이라 `#/community/…` 만 쓰면 찾기 앱 안에 머묾 → 홈 주소(`homeBase`, 비면 `HOME_UI_BASE`, right-rail.js:68)를 붙여야 함 |

## 2. 바꿀 내용 — 이 폴더 `231-C.diff` 그대로 (글자 하나까지)

`git apply 231-C.diff` 로 적용(우동공과2: origin/main `40264c14` 와 B2 `a49f256` 둘 다 `git apply --check` 통과). 결과는 5파일 +49/−35.

```diff
diff --git a/preview/home-ui/src/concern/copy.js b/preview/home-ui/src/concern/copy.js
index 53b4c897..7bca12df 100644
--- a/preview/home-ui/src/concern/copy.js
+++ b/preview/home-ui/src/concern/copy.js
@@ -61,7 +61,7 @@ export const COMMUNITY_BOARD_VISUAL = {
   director: {
     kicker: '공부방',
     icon: '/assets/info-refresh/motif-room.svg',
-    desc: '운영·모집·공간 운영 질문을 남기고 이웃 원장과 나눠 보세요.',
+    desc: '운영·모집·공간 운영 질문을 남기고 이웃 공부방과 나눠 보세요.',
     cta: '입장하기',
     art: 'board-entry__art--room',
     accent: '',
diff --git a/preview/home-ui/src/concern/rail-concern-popup.js b/preview/home-ui/src/concern/rail-concern-popup.js
index 9ca529f3..fd54baa4 100644
--- a/preview/home-ui/src/concern/rail-concern-popup.js
+++ b/preview/home-ui/src/concern/rail-concern-popup.js
@@ -130,6 +130,7 @@ function findOpener(mode, boardKey, postId) {
  *   homeBase: string,
  *   leaveInNewTab: boolean,
  *   continueInPage?: boolean,
+ *   leaveToHome?: boolean,
  *   allRooms?: boolean,
  * }} opts
  */
@@ -138,7 +139,9 @@ export function openConcernRailPopup(opts) {
   // 레일 배너와 같은 규칙. 학생에게는 공부방·과외쌤 고민방 팝업도 요청도 없다.
   if (!boardKey || !canShowBoardInRail(boardKey, navRole, { guestFilter: opts.guestFilter })) return;
   const { label, path } = boardInfo(boardKey);
-  const boardHref = opts.leaveInNewTab ? `${String(opts.homeBase).replace(/\/$/, '')}/#${path}` : `#${path}`;
+  // 찾기·등록(inpage)도 홈처럼 게시판으로 간다. 찾기는 다른 앱이라 홈 주소를 붙인다.
+  const toHome = opts.leaveInNewTab || opts.leaveToHome;
+  const boardHref = toHome ? `${String(opts.homeBase).replace(/\/$/, '')}/#${path}` : `#${path}`;
   const blank = opts.leaveInNewTab ? ' target="_blank" rel="noopener"' : '';
   const goBoard = opts.continueInPage
     ? `<button type="button" class="rail-popup__go" data-rail-popup-continue>${esc(COPY.goBoard)}</button>`
@@ -203,7 +206,7 @@ function onDocumentClick(e) {
     guestFilter: section.getAttribute('data-concern-rail-guest') || '',
     homeBase: section.getAttribute('data-concern-rail-home') || '',
     leaveInNewTab: section.getAttribute('data-concern-rail-leave') === 'blank',
-    continueInPage: section.getAttribute('data-concern-rail-leave') === 'inpage',
+    leaveToHome: section.getAttribute('data-concern-rail-leave') === 'inpage',
     allRooms: !room && btn.hasAttribute('data-concern-best-all'),
   });
 }
diff --git a/preview/home-ui/src/library/info-rail.js b/preview/home-ui/src/library/info-rail.js
index 4072a037..41c66e76 100644
--- a/preview/home-ui/src/library/info-rail.js
+++ b/preview/home-ui/src/library/info-rail.js
@@ -24,7 +24,7 @@ import { openRailPopup, syncRailPopupSession } from '../rail-popup.js';
 /**
  * @typedef {{ navRole: string, homeBase: string, leaveInNewTab: boolean, continueInPage?: boolean }} InfoRailCtx
  * leaveInNewTab: 상세 레일·absolute 에서는 팝업의 게시판 이동을 홈 주소 새 탭으로 연다.
- * continueInPage: 찾기·등록은 팝업 안에서 본문·목록을 이어 본다.
+ * continueInPage: 찾기·등록. 팝업 「게시판에서 보기」는 홈 주소를 붙여 같은 탭에서 게시판으로 간다(218-9).
  */
 
 if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
@@ -216,13 +216,12 @@ function findOpener(boardKey, postId) {
  * @param {{ boardKey: string, postId: string, opener: HTMLElement|null, navRole: string, homeBase: string, leaveInNewTab: boolean, continueInPage?: boolean }} opts
  */
 function openInfoBoardPopup({ boardKey, postId, opener, navRole, homeBase, leaveInNewTab, continueInPage }) {
+  // 찾기·등록(continueInPage)도 홈처럼 게시판으로 간다. 찾기는 다른 앱이라 홈 주소를 붙인다(218-9).
   const board = LIBRARY_BOARDS.find((b) => b.boardKey === boardKey);
   if (!board || !canDiscoverBoard(boardKey, railViewer(navRole).boardRole)) return;
-  const boardHref = leaveInNewTab ? `${String(homeBase).replace(/\/$/, '')}/#${board.path}` : `#${board.path}`;
+  const boardHref = leaveInNewTab || continueInPage ? `${String(homeBase).replace(/\/$/, '')}/#${board.path}` : `#${board.path}`;
   const blank = leaveInNewTab ? ' target="_blank" rel="noopener"' : '';
-  const goBoard = continueInPage
-    ? `<button type="button" class="rail-popup__go" data-rail-popup-continue>${esc(COPY.goBoard)}</button>`
-    : `<a class="rail-popup__go" href="${esc(boardHref)}" data-rail-popup-leave${blank}>${esc(COPY.goBoard)}</a>`;
+  const goBoard = `<a class="rail-popup__go" href="${esc(boardHref)}" data-rail-popup-leave${blank}>${esc(COPY.goBoard)}</a>`;
   openRailPopup({
     kind: 'info-board',
     title: board.label,
diff --git a/preview/home-ui/src/right-rail.js b/preview/home-ui/src/right-rail.js
index 3635e523..625ab65e 100644
--- a/preview/home-ui/src/right-rail.js
+++ b/preview/home-ui/src/right-rail.js
@@ -121,7 +121,7 @@ function railLeaveMode(slotKey, ctx) {
 }
 
 /** 찾기·등록 HOT·고민 링크 → 방 배너와 같은 읽기 팝업 버튼. 주소는 바꾸지 않는다. */
-function concernInPageControl(hrefOrPath, className, ctx, inner) {
+function concernInPageControl(hrefOrPath, className, ctx, inner, leave = 'inpage') {
   const path = railPath(hrefOrPath);
   const posted = path.match(/^\/community\/(director|tutor|parent|solved)\/([^/]+)$/);
   let boardKey = '';
@@ -146,7 +146,15 @@ function concernInPageControl(hrefOrPath, className, ctx, inner) {
     ctx.navRole,
   )}" data-concern-rail-guest="${esc(ctx.guestFilter)}" data-concern-rail-home="${esc(
     ctx.homeBase,
-  )}" data-concern-rail-leave="inpage">${inner}</button>`;
+  )}" data-concern-rail-leave="${esc(leave)}">${inner}</button>`;
+}
+
+/** 홈 레일(218-6): 현장 카드·HOT 아래 버튼도 읽기 팝업. 게시판 이동은 홈의 다른 팝업과 같은 방식(railLeaveMode). */
+function railConcernControl(hrefOrPath, className, ctx, inner, slotKey) {
+  if (slotKey === 'home_right_rail' && isConcernPath(hrefOrPath)) {
+    return concernInPageControl(hrefOrPath, className, ctx, inner, railLeaveMode(slotKey, ctx));
+  }
+  return railSlotAnchor(hrefOrPath, className, ctx, inner, slotKey);
 }
 
 function railSlotAnchor(hrefOrPath, className, ctx, inner, slotKey) {
@@ -242,7 +250,7 @@ function resolveConcernBoardKeysForSlot(slotKey, ctx) {
 }
 
 function communityHubForRole(role) {
-  if (role === 'study_room') return { href: '#/community/director', label: '원장 고민방 더 보기' };
+  if (role === 'study_room') return { href: '#/community/director', label: '공부방 고민방 더 보기' };
   if (role === 'tutor') return { href: '#/community/tutor', label: '과외쌤 고민방 더 보기' };
   return { href: '#/community', label: '커뮤니티 더 보기' };
 }
@@ -412,7 +420,7 @@ function railStateName(status, count) {
 function renderLivePostCard(post, ctx, slotKey) {
   const board = getConcernBoardByKey(post.boardKey);
   const href = `${board?.path || '/community'}/${encodeURIComponent(post.id)}`;
-  return railSlotAnchor(
+  return railConcernControl(
     href,
     'live-rail-card',
     ctx,
@@ -532,7 +540,7 @@ function renderHotSection(slotKey, ctx, boardKeys, liveId) {
       </div>
       <div class="live-rail-slot__band"><strong class="live-rail-slot__title">${esc(copy.title)}</strong></div>
       ${body}
-      ${railSlotAnchor(copy.ctaHref, 'live-rail-slot__cta', ctx, esc(copy.ctaLabel), slotKey)}
+      ${railConcernControl(copy.ctaHref, 'live-rail-slot__cta', ctx, esc(copy.ctaLabel), slotKey)}
     </section>`;
 }
 
diff --git a/scripts/verify-rail-info-banners.mjs b/scripts/verify-rail-info-banners.mjs
index 6a0bd1f0..624822bd 100644
--- a/scripts/verify-rail-info-banners.mjs
+++ b/scripts/verify-rail-info-banners.mjs
@@ -908,7 +908,7 @@ try {
     s2 && (await ev(() => window.__store.getInfoRailList({ boardRole: 'supply-room', ownerKey: '11:study_room_owner:' }, 'info-room') === null)),
   );
 
-  // 찾기 레일(호출부가 absolute여도) → 팝업은 그대로, 「게시판에서 보기」는 인페이지
+  // 찾기 레일(호출부가 absolute여도) → 팝업은 그대로, 「게시판에서 보기」는 홈 게시판 같은 탭 링크(218-9)
   await session({ user_id: 11, role_type: 'study_room_owner', name: 'r', email: 'r@x' }, 'supply-room');
   await ev(() => {
     document.getElementById('rail').innerHTML = '';
@@ -923,19 +923,18 @@ try {
   }
   ok(`${B}search_rail_popup_opens_hash_unchanged`, sOpened && (await ev(() => location.hash)) === hashS);
   const goS = await ev((label) => {
-    const btn = [...document.querySelectorAll('#rail-popup [data-rail-popup-continue]')].find((x) => x.textContent.trim() === label);
-    const blank = [...document.querySelectorAll('#rail-popup a')].some((a) => a.getAttribute('target') === '_blank' || String(a.getAttribute('href') || '').includes('/#/library'));
-    return btn ? { tag: btn.tagName, blank } : { tag: '', blank };
+    const a = [...document.querySelectorAll('#rail-popup a[data-rail-popup-leave]')].find((x) => x.textContent.trim() === label);
+    return {
+      tag: a?.tagName || '',
+      href: a?.getAttribute('href') || '',
+      blank: a?.getAttribute('target') === '_blank',
+      cont: Boolean(document.querySelector('#rail-popup [data-rail-popup-continue]')),
+    };
   }, POLICY_COPY.goBoard);
-  ok(`${B}search_go_board_in_page`, sOpened && goS?.tag === 'BUTTON' && goS.blank === false, JSON.stringify(goS));
-  if (sOpened && goS?.tag === 'BUTTON') {
-    await page.click('#rail-popup [data-rail-popup-continue]').catch(() => {});
-  }
   ok(
-    `${B}search_go_board_stays_on_screen`,
-    sOpened &&
-      (await ev(() => location.hash)) === hashS &&
-      Boolean(await ev(() => document.getElementById('rail-popup') && document.getElementById('rail-popup').getAttribute('data-rail-popup-continued') === 'true')),
+    `${B}search_go_board_link_same_tab`,
+    sOpened && goS.tag === 'A' && goS.href.includes('/#/library') && !goS.blank && !goS.cont,
+    JSON.stringify(goS),
   );
   if (sOpened) await page.keyboard.press('Escape');
   await gone(popupSel);
@@ -968,7 +967,7 @@ try {
   if (peekOpen) await page.keyboard.press('Escape');
   await gone('#rail-guide-peek-overlay');
 
-  // 찾기: 고민 HOT·방 「게시판에서 보기」도 인페이지
+  // 찾기: 고민 HOT·방 레일 버튼은 인페이지(팝업), 팝업 「게시판에서 보기」는 홈 게시판 같은 탭 링크(218-9)
   const hotBtn = await ev(() => {
     const hot = document.querySelector('#rail-search [data-rail-hot]');
     const card = hot?.querySelector('[data-concern-rail-open]');
@@ -983,11 +982,14 @@ try {
   await page.click('#rail-search [data-rail-room] [data-concern-rail-more]').catch(() => {});
   const concernOpen = await wait(popupSel);
   const concernGo = await ev((label) => {
-    const btn = [...document.querySelectorAll('#rail-popup [data-rail-popup-continue]')].find((x) => x.textContent.trim() === label);
-    const blank = [...document.querySelectorAll('#rail-popup a')].some((a) => a.getAttribute('target') === '_blank');
-    return { tag: btn?.tagName || '', blank, hash: location.hash };
+    const a = [...document.querySelectorAll('#rail-popup a[data-rail-popup-leave]')].find((x) => x.textContent.trim() === label);
+    return { tag: a?.tagName || '', href: a?.getAttribute('href') || '', blank: a?.getAttribute('target') === '_blank', hash: location.hash };
   }, POLICY_COPY.goBoard);
-  ok(`${B}search_concern_go_in_page`, concernOpen && concernGo.tag === 'BUTTON' && !concernGo.blank && concernGo.hash === hashGuide, JSON.stringify(concernGo));
+  ok(
+    `${B}search_concern_go_board_link_same_tab`,
+    concernOpen && concernGo.tag === 'A' && concernGo.href.includes('/#/community') && !concernGo.blank && concernGo.hash === hashGuide,
+    JSON.stringify(concernGo),
+  );
   if (concernOpen) await page.keyboard.press('Escape');
   await gone(popupSel);
 
@@ -1020,12 +1022,14 @@ try {
       infoOpened = await wait(popupSel);
     }
     const infoGo = await ev((copy) => {
-      const btn = [...document.querySelectorAll('#rail-popup [data-rail-popup-continue]')].find((x) => x.textContent.trim() === copy);
-      const login = [...document.querySelectorAll('#rail-popup a.rail-popup__login')].map((a) => a.getAttribute('href') || '');
-      const blank = [...document.querySelectorAll('#rail-popup a')].some((a) => a.getAttribute('target') === '_blank' || String(a.getAttribute('href') || '').includes('/#/library'));
-      return { tag: btn?.tagName || '', blank, login, hash: location.hash };
+      const a = [...document.querySelectorAll('#rail-popup a[data-rail-popup-leave]')].find((x) => x.textContent.trim() === copy);
+      return { tag: a?.tagName || '', href: a?.getAttribute('href') || '', blank: a?.getAttribute('target') === '_blank', hash: location.hash };
     }, POLICY_COPY.goBoard);
-    ok(`${B}${label}_info_go_in_page`, infoOpened && infoGo.tag === 'BUTTON' && !infoGo.blank && infoGo.hash === hash0, JSON.stringify(infoGo));
+    ok(
+      `${B}${label}_info_go_board_link_same_tab`,
+      infoOpened && infoGo.tag === 'A' && infoGo.href.includes('/#/library') && !infoGo.blank && infoGo.hash === hash0,
+      JSON.stringify(infoGo),
+    );
     if (infoOpened) await page.keyboard.press('Escape');
     await gone(popupSel);
   }
```

뜻:
- `concernInPageControl` 에 `leave` 인자(기본 `'inpage'`)만 추가 → 찾기·등록은 지금 그대로.
- 새 `railConcernControl`: 슬롯이 `home_right_rail` 이고 고민방 주소(`isConcernPath`)일 때만 팝업 버튼, 나가는 방식은 `railLeaveMode`(홈 = `hash` → 팝업 안 「게시판에서 보기」는 같은 탭에서 게시판). 그 밖은 기존 `railSlotAnchor`.
- 바꿔 부르는 곳은 HOT 카드(`renderLivePostCard`)와 HOT 아래 버튼(`renderHotSection`) **두 곳뿐**.
- 218-8: 문구 2곳(`공부방 고민방 더 보기`, `이웃 공부방과 나눠 보세요.`).
- 218-9: `rail-concern-popup.js` 에서 `inpage` 를 「목록으로 스크롤」(`continueInPage`) 대신 `leaveToHome` 으로 넘김 → 「게시판에서 보기」가 `<a href="{홈 주소}/#/community/…" data-rail-popup-leave>`(같은 탭, 새 탭 아님)가 되어 팝업을 닫고 홈 게시판으로 이동. 레일 버튼(`railLeaveMode`·`data-concern-rail-leave="inpage"`)은 그대로. 
- 218-9 자료실(t1652): `library/info-rail.js` 도 같은 방식 — `continueInPage` 이면 홈 주소를 붙인 같은 탭 `<a … data-rail-popup-leave>`. 「계속 보기」 버튼은 없앰.
- 검증 스크립트: 위 검사 4개를 3개로 바꿈 — 찾기 자료실·찾기 고민방·등록(3곳) 자료실 팝업 「게시판에서 보기」가 `A` 링크, `/#/library` 또는 `/#/community` 포함, `target=_blank` 없음. (`search_go_board_stays_on_screen` 은 뜻이 반대가 되어 삭제)
- `rail-popup.js:201-212` 의 `data-rail-popup-continue` 처리는 이제 쓰는 곳이 없지만 **지우지 않음**(범위 밖, 정리 금지).

## 3. 허용 파일 (이 밖은 한 줄이라도 바꾸면 불합격)
1. `preview/home-ui/src/right-rail.js` — 2절 diff 범위만
2. `preview/home-ui/src/concern/copy.js` — 64행 문구만
3. `preview/home-ui/src/concern/rail-concern-popup.js` — 2절 diff 세 곳만
4. `preview/home-ui/src/library/info-rail.js` — 2절 diff 범위(설명 주석·`boardHref`·`goBoard`)만
5. `scripts/verify-rail-info-banners.mjs` — 2절 diff 의 검사 4개만

## 4. 금지
- `railSlotAnchor`·`renderActionItem` 수정 금지(「이번 시즌 추천 행동」 카드는 `<a>` 그대로).
- `rail-popup.js`, CSS 수정 금지. `rail-concern-popup.js`·`info-rail.js`·검증 스크립트는 3절 범위만.
- 세 카탈로그 화면(`promo/*`)만 따로 다르게 만드는 코드 추가 금지(8절 P1 답 전까지 짐작 금지).
- B2(main 에 들어감) 되돌리기 금지: `renderBestSection` 0건 버튼 두 줄(right-rail.js 494·497), 베스트 팝업 제목·빈 문구, `home-right-rail.css`. 작업 B 되돌리기 금지.
- 방 이름 「학생/학부모 고민방」 글자는 이 작업에서 **바꾸지 않음**(232 에서).
- 찾기 레일 결과(`right-rail-store.js`, PHP seed, `081`) 금지.
- 「원장」 **수정 안 함** 7곳(행 9건, 종현 t1583): `preview/shared/study-room-basic-form.js:305`, `:809` · `preview/study-room-ui/src/summary.js:148` · `preview/study-room-ui/src/screens/step-basic.js:90` · `preview/auth-ui/src/screens/signup-basic.js:273` · `preview/home-ui/src/study-room-reg/myshop-render.js:155` · `preview/home-ui/src/promo/study-room-content.js:77` · `preview/home-ui/src/promo/catalog.js:22` · `preview/home-ui/src/admin/a28-copy.js:574` (224·218 에 566 으로 적힌 줄. 지금 main 에서는 574 `'학부모 · 원장': '학생 · 원장',`)
- 새 문구·디자인 변경·정리·기능 추가 금지. 화면에 개발 용어 금지(메뉴 이름은 「공부방 고민방」「과외쌤 고민방」「학생/학부모 고민방」(232 전까지)「커뮤니티」 그대로).
- 하위 에이전트 빠른(fast) 모델 금지. `git add -A`/`git add .` 금지. force-push·rebase 후 push 금지. 비밀값 커밋 금지. main 에 코드 merge 금지(검수 뒤 종현 승인).

## 5. B2·232 와의 관계
- B2 는 이미 main(`58036395`)에 있음 → 순서 문제 없음. `231-C.diff` 는 B2 위에서 그대로 적용됨(우동공과2 `git apply --check` 확인).
- 232(방 이름)와는 `concern/copy.js` 만 같이 만지지만 줄이 다름(45 vs 64). C → 232 순서로 둘 다 적용 확인. 어느 쪽 먼저 merge 해도 충돌 없음.

## 6. 합격 기준 (가볍게 — 229 §10 방식. 화면 확인은 우동공과2가 검수 때)

1. `git diff --stat origin/main...HEAD` = 정확히 5파일: `concern/copy.js | 2`, `concern/rail-concern-popup.js | 7`, `library/info-rail.js | 9`, `right-rail.js | 18`, `scripts/verify-rail-info-banners.mjs | 48` (합계 +49/−35)
2. (Git Bash) `git diff origin/main...HEAD | grep -v '^index ' | diff - <(grep -v '^index ' docs/design/home-banner-rail-2026-10-14/231-C.diff)` → 빈 출력
3. `git grep -nE "원장 고민방|이웃 원장" HEAD -- preview` → 0건
4. `git grep -n "railConcernControl" HEAD -- preview/home-ui/src/right-rail.js` → 정확히 3줄
5. `git grep -n "data-rail-popup-continue" HEAD -- preview/home-ui/src/concern preview/home-ui/src/library scripts/verify-rail-info-banners.mjs` → 0건

화면 측정·Docker·스크린숏 **하지 않음**.

## 7. 진행 순서
0. 8절 P1 답이 왔는지 확인(안 왔으면 시작하지 말 것).
1. `git fetch origin` → 1절 R1~R17 (다르면 멈추고 보고).
2. `git switch -c cursor/home-c-hot-popup-20261015 origin/main`
3. `git apply docs/design/home-banner-rail-2026-10-14/231-C.diff`
4. `git add preview/home-ui/src/right-rail.js preview/home-ui/src/concern/copy.js preview/home-ui/src/concern/rail-concern-popup.js preview/home-ui/src/library/info-rail.js scripts/verify-rail-info-banners.mjs`
5. 커밋: `fix(rail): 홈 현장·HOT 읽기 팝업 + 「원장」 문구 2곳 + 찾기·등록 팝업 게시판 이동 (218-6·218-8·218-9, 종현 t1582·t1651·t1652)`
6. 6절 다섯 명령 실행.
7. `git push origin cursor/home-c-hot-popup-20261015` (브랜치만, 일반 push).
8. 답장: **브랜치 커밋 해시 + 6절 다섯 명령의 출력만**(보고서 파일·그림·work-queue 줄 없음).

## 8. 질문 상태
- ~~Q1 홈 HOT 팝업~~ → **답함** (t1652): t1582 그대로.
- ~~Q3 자료실 팝업도?~~ → **답함** (t1652): 모든 배너 팝업. 이 문서에 포함.
- ~~Q4 같은 탭?~~ → **답함** (t1652): 같은 탭.
- **P1 (대기, 시작 조건)**: 홈 레일을 같이 쓰는 화면 — 화면 제목 「공부방 카탈로그」(`#/promo/study-room`)·「과외쌤 카탈로그」(`#/promo/tutor`)·「학생 카탈로그」(`#/promo/parent`), 출처 `promo/catalog.js:21`·`:30`·`:39` → `promo/shell.js:14`·`:22` 제목. 들어가는 길: 홈 안내 3칸 카드 「공부방 카탈로그」「과외쌤 카탈로그」「우리동네 학생」(`home-marketing-banner.js:206`·`:213`·`:220`). 이 세 화면 레일 HOT 도 팝업이 되는지? 아니라면 diff 에 「카탈로그 화면 제외」 조건을 더해야 해서 이 문서를 다시 고침.
- **P2 (대기)**: 학생·비회원 HOT 아래 버튼 이름 「커뮤니티 더 보기」 — 누르면 학생·학부모 고민방 팝업이 열림. 이름 그대로 둘지? (diff 는 그대로 둠)
- 이용안내 「자세히」 미리보기(`right-rail.js:644`, 찾기·등록은 화면 안에서 펼침)는 「게시판에서 보기」가 없는 다른 종류라 범위 밖으로 봄 — 맞는지 확인 필요(P3).
