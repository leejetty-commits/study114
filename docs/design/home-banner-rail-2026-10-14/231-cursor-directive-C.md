# 231 · Cursor 작업지시 C (224 갱신판) — 홈 「오늘의 현장 · 지금 고민 HOT」 읽기 팝업 + 「원장」 문구 2곳 (218-6 · 218-8)

- 작성: 우동공과2(개발팀장), 2026-10-15 · **개정 1 (종현 t1651, 05:2x KST)**: 찾기·등록 팝업 「게시판에서 보기」도 게시판으로 이동(218-9) 추가 → 파일 3개.
- 기준: 줄 확인은 origin/main `40264c14`. **2026-10-15 05:2x 확인 결과 origin/main 은 `58036395`(B2 `a49f256` merge 됨)로 앞서 있음.** B2 는 right-rail.js 494·497 두 줄을 제자리에서 바꿔 아래 줄 번호는 그대로이고, `231-C.diff` 는 `58036395` 위에서 `git apply --check` 통과.
- 방 이름 「학생·학부모 고민방」 통일(218-10)은 다른 파일이라 **별도 작은 지시 232**.
- 이 문서만 보고 작업할 수 있게 썼습니다(대화 기록 없음 전제). **224를 대체**합니다(내용은 같고, 기준·줄 확인·브랜치 이름·시험 방식만 새로 씀). 224는 아직 아무도 시작하지 않았음(원격에 home-c 브랜치 없음, 확인 2026-10-15 05:1x).
- 한 줄 요약: 홈 레일 「지금 고민 HOT」 카드와 그 아래 버튼을 **읽기 팝업**으로 열고, 「원장」 문구 **2곳**을 바꾸고, 찾기·등록 화면 고민방 팝업의 「게시판에서 보기」가 **게시판으로 이동**하게 한다. 파일 3개.

## 0. 확정 기록 (종현이 이미 정한 것만)

| 날짜 | 근거 | 확정 내용 | 문서 |
|---|---|---|---|
| 2026-10-14 | 종현 t1582 | **218-6** 홈 레일 「오늘의 현장 · 지금 고민 HOT」 카드와 아래 버튼도 찾기·등록처럼 **읽기 팝업**. 팝업 안 「게시판에서 보기」는 홈의 다른 팝업과 같이 게시판으로 이동. 198의 「홈 hash 유지」는 홈 HOT 칸에 한해 대체 | 218 확정 기록 14행, 218-6 절(208행~) |
| 2026-10-14 | 종현 t1582 | **218-8** 화면 문구에서 「원장」을 뺀다. 대상어가 안 남으면 「공부방 고민방 더 보기」. 대상 2곳: HOT 아래 버튼(공부방 모드), 커뮤니티 공부방 고민방 입구 설명 | 218 확정 기록 16행, 218-8 절(305행~) |
| 2026-10-14 | 종현 t1583 | 나머지 「원장」 7곳(행 9건)은 **수정 안 함**, 바꾸면 불합격 | 218 확정 기록 17행 |
| 2026-10-15 | 종현 t1651 | **218-9** 찾기·등록 화면 레일 팝업의 「게시판에서 보기」도 홈 오른쪽 레일처럼 **게시판으로 이동**(지금은 팝업 안 목록으로 내려가기만 함 = inpage) | 218 218-9 절 |
| 2026-10-15 | 종현 t1651 | 비회원 찾기 레일 순서는 지금 그대로(학생·학부모 먼저). **변경 없음** | 218 218-11 |
| 2026-10-14 | 종현 t1582 | 적용 순서 218-4 → 218-7 → 218-6 → 218-8 (218-4·218-7은 작업 B·B2로 끝) | 218 343행 |

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
| R15 | `right-rail.js:117-121` + `preview/search-ui/src/layout.js:75-78` | 찾기 레일은 `search_right_rail` → `inpage`. 찾기 화면은 **다른 앱**(search-ui)이라 `#/community/…` 만 쓰면 찾기 앱 안에 머묾 → 홈 주소(`homeBase`, 비면 `HOME_UI_BASE`, right-rail.js:68)를 붙여야 함 |

## 2. 바꿀 내용 — 이 폴더 `231-C.diff` 그대로 (글자 하나까지)

`git apply 231-C.diff` 로 적용(우동공과2: origin/main `40264c14` 와 B2 `a49f256` 둘 다 `git apply --check` 통과). 결과는 3파일 +19/−8.

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
 
```

뜻:
- `concernInPageControl` 에 `leave` 인자(기본 `'inpage'`)만 추가 → 찾기·등록은 지금 그대로.
- 새 `railConcernControl`: 슬롯이 `home_right_rail` 이고 고민방 주소(`isConcernPath`)일 때만 팝업 버튼, 나가는 방식은 `railLeaveMode`(홈 = `hash` → 팝업 안 「게시판에서 보기」는 같은 탭에서 게시판). 그 밖은 기존 `railSlotAnchor`.
- 바꿔 부르는 곳은 HOT 카드(`renderLivePostCard`)와 HOT 아래 버튼(`renderHotSection`) **두 곳뿐**.
- 218-8: 문구 2곳(`공부방 고민방 더 보기`, `이웃 공부방과 나눠 보세요.`).
- 218-9: `rail-concern-popup.js` 에서 `inpage` 를 「목록으로 스크롤」(`continueInPage`) 대신 `leaveToHome` 으로 넘김 → 「게시판에서 보기」가 `<a href="{홈 주소}/#/community/…" data-rail-popup-leave>`(같은 탭, 새 탭 아님)가 되어 팝업을 닫고 홈 게시판으로 이동. 레일 버튼(`railLeaveMode`·`data-concern-rail-leave="inpage"`)은 그대로. 자료실 팝업(`library/info-rail.js`)은 건드리지 않음(열린 질문 Q3).

## 3. 허용 파일 (이 밖은 한 줄이라도 바꾸면 불합격)
1. `preview/home-ui/src/right-rail.js` — 2절 diff 범위만
2. `preview/home-ui/src/concern/copy.js` — 64행 문구만
3. `preview/home-ui/src/concern/rail-concern-popup.js` — 2절 diff 세 곳(133 타입 한 줄, 142-144, 209 — 적용 뒤 줄 번호)만

## 4. 금지
- `railSlotAnchor`·`renderActionItem` 수정 금지(「이번 시즌 추천 행동」 카드는 `<a>` 그대로).
- `rail-popup.js`, `library/info-rail.js`(자료실 팝업), CSS 수정 금지. `rail-concern-popup.js` 는 3절 범위만.
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

1. `git diff --stat origin/main...HEAD` = 정확히 3파일: `concern/copy.js | 2 +-`, `concern/rail-concern-popup.js | 7 +++++--`, `right-rail.js | 18 +++++++++++++-----`
2. (Git Bash) `git diff origin/main...HEAD | grep -v '^index ' | diff - <(grep -v '^index ' docs/design/home-banner-rail-2026-10-14/231-C.diff)` → 빈 출력
3. `git grep -nE "원장 고민방|이웃 원장" HEAD -- preview` → 0건
4. `git grep -n "railConcernControl" HEAD -- preview/home-ui/src/right-rail.js` → 정확히 3줄(정의 1 + 호출 2)
5. `git grep -n "continueInPage\|leaveToHome" HEAD -- preview/home-ui/src/concern/rail-concern-popup.js` → 5줄(타입 2, `toHome` 1, `goBoard` 조건 1, `leaveToHome:` 1). `continueInPage: section` 은 0건

화면 측정·Docker·스크린숏 **하지 않음**.

## 7. 진행 순서
1. `git fetch origin` → 1절 R1~R11 (다르면 멈추고 보고).
2. `git switch -c cursor/home-c-hot-popup-20261015 origin/main`
3. `git apply docs/design/home-banner-rail-2026-10-14/231-C.diff`
4. `git add preview/home-ui/src/right-rail.js preview/home-ui/src/concern/copy.js preview/home-ui/src/concern/rail-concern-popup.js`
5. 커밋: `fix(rail): 홈 현장·HOT 읽기 팝업 + 「원장」 문구 2곳 + 찾기·등록 팝업 게시판 이동 (218-6·218-8·218-9, 종현 t1582·t1651)`
6. 6절 다섯 명령 실행.
7. `git push origin cursor/home-c-hot-popup-20261015` (브랜치만, 일반 push).
8. 답장: **브랜치 커밋 해시 + 6절 다섯 명령의 출력만**(보고서 파일·그림·work-queue 줄 없음).

## 8. 열린 질문 (종현 확인 필요 — 이번 작업은 diff 그대로 하되, 검수 때 화면으로 보여 드림)
- Q1. `home_right_rail` 은 홍보 전체 화면(`preview/home-ui/src/promo/shell.js`)도 같이 씀 → 홍보 화면 레일의 HOT 도 같은 팝업이 됨. 218-6 은 「홈 레일」만 적었음. 홍보 화면도 팝업이 맞는지?
- Q2. 학생·비회원의 HOT 아래 버튼 「커뮤니티 더 보기」(`#/community`)는 팝업에서 학생/학부모 고민방을 열고, 「게시판에서 보기」는 `#/community/parent` 로 감(찾기 화면과 같은 규칙). 버튼 이름 「커뮤니티 더 보기」를 그대로 둘지?
- Q3. 찾기·등록 레일의 **자료실** 팝업(`library/info-rail.js:223-225`, `:264`)도 지금 「게시판에서 보기」가 목록으로 내려가기만 함(같은 inpage). t1651 은 「레일 팝업」이라 적었는데 고민방 팝업만 바꿀지, 자료실 팝업도 같이 바꿀지? (이번 C 는 고민방 팝업만. 자료실도라면 `info-rail.js` 같은 두 줄 + `scripts/verify-rail-info-banners.mjs:926-1023` 의 continue 확인도 손봐야 해 별도 작은 지시로)
- Q4. 「게시판에서 보기」를 누르면 찾기 화면을 떠나 홈 게시판으로 같은 탭에서 이동함(뒤로 가기로 찾기 복귀). 새 탭이 아니라 같은 탭이 맞는지? (이번 C 는 홈과 같게 같은 탭)
