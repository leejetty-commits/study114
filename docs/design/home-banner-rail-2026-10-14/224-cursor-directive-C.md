# 224 · Cursor 작업지시 C — 홈 「오늘의 현장」·「지금 고민 HOT」 읽기 팝업 + 「원장」 문구 2곳 (218-6 · 218-8)

- 작성: 우동공과2(개발팀장), 2026-10-14 · 기준 origin/main `2cb8ae1` (작업 B merge `da26876` 포함, 운영 배포됨)
- 이 문서만 보고 작업할 수 있게 썼습니다(대화 기록 없음 전제).
- 원본 티켓: `docs/design/home-banner-rail-2026-10-14/218-home-banner-gap-best-red-work-order.md` 의 **218-6, 218-8만**. 다른 티켓(218-1~5·7)은 손대면 불합격. 작업 B(218-4·218-7) 결과를 되돌리면 불합격.

> **2026-10-15: 이 문서는 231(`231-cursor-directive-C.md`)이 대체한다.** 내용(218-6·218-8, diff)은 같고 기준·줄 확인·브랜치(`cursor/home-c-hot-popup-20261015`)·가벼운 합격 기준만 새로 씀. a28-copy 「원장」 줄은 566 이 아니라 574.

## 0. 배경과 확정 기록

| 날짜 | 근거 | 확정 내용 |
|---|---|---|
| 2026-10-14 | 종현 t1582 | 홈 레일 「오늘의 현장」 카드와 「지금 고민 HOT」 아래 버튼도 찾기·등록 화면처럼 **읽기 팝업**으로 연다. 팝업 안 「게시판에서 보기」는 다른 홈 팝업과 똑같이 게시판으로 간다. 문서 198의 「홈은 hash 유지」 규칙은 **홈 HOT 칸에 한해 대체**(198 문서에 이미 기록). |
| 2026-10-14 | 종현 t1582 | 화면 문구에서 「원장」을 뺀다. 대상어가 안 남으면 「공부방 고민방 더 보기」. |
| 2026-10-14 | 종현 t1583 | 나머지 「원장」 7곳(행 9건)은 **수정 안 함**. 바꾸면 불합격(목록 4절). |

현재(main 2cb8ae1, 운영 study114.net 로그아웃 확인 2026-10-14 23:4x KST): 홈 HOT 칸 아래 버튼을 누르면 팝업 없이 `#/community` 로 화면이 바뀜. 카드도 `<a href="#/community/...">` 링크.

## 1. 손대기 전 다시 확인(필수)

`git fetch origin main` 후 origin/main 에서 아래를 확인하세요. **줄이 옮겨졌거나 내용이 다르면 짐작하지 말고 멈춘 뒤 보고**하세요. main 이 `2cb8ae1` 보다 앞서 있으면 그 사이 커밋이 아래 두 파일을 건드렸는지(`git log 2cb8ae1..origin/main -- <파일>`)도 보고하세요.

| # | 파일:줄 (2cb8ae1) | 있어야 할 내용 |
|---|---|---|
| R1 | `preview/home-ui/src/right-rail.js:117-121` | `railLeaveMode` — 찾기·등록 `inpage`, 상세·absolute `blank`, 나머지(홈) `hash` |
| R2 | `right-rail.js:124` | `function concernInPageControl(hrefOrPath, className, ctx, inner) {` |
| R3 | `right-rail.js:149` | `)}" data-concern-rail-leave="inpage">${inner}</button>`;` |
| R4 | `right-rail.js:152-160` | `function railSlotAnchor(...)` — **수정 금지** |
| R5 | `right-rail.js:245` | `if (role === 'study_room') return { href: '#/community/director', label: '원장 고민방 더 보기' };` |
| R6 | `right-rail.js:415` | `renderLivePostCard` 안 `return railSlotAnchor(` |
| R7 | `right-rail.js:535` | `${railSlotAnchor(copy.ctaHref, 'live-rail-slot__cta', ctx, esc(copy.ctaLabel), slotKey)}` |
| R8 | `right-rail.js:637-649` | `renderActionItem` 끝 `return railSlotAnchor(item.href, cls, ctx, inner, slotKey);` — **수정 금지**(추천 행동 카드는 일반 링크로 남음) |
| R9 | `preview/home-ui/src/concern/copy.js:64` | `desc: '운영·모집·공간 운영 질문을 남기고 이웃 원장과 나눠 보세요.',` |
| R10 | `concern/rail-concern-popup.js:140-144, 199-204` | 팝업이 `data-concern-rail-leave` 로 게시판 링크를 고름: `hash` → `<a href="#/community/…" data-rail-popup-leave>`(같은 탭), `inpage` → 이어 보기 버튼. **파일 수정 금지** |
| R11 | `preview/home-ui/src/styles/home-right-rail.css:276`, `:613` | `button.live-rail-card`, `button.live-rail-slot__cta` 스타일이 이미 있음 → CSS 수정 불필요 |

## 2. 바꿀 내용(검증한 diff 그대로)

우동공과2가 main 2cb8ae1 worktree 에 임시 적용 → 4모드×3폭 측정 → 되돌림까지 한 diff 입니다. **글자 하나까지 같게** 적용하세요.

```diff
diff --git a/preview/home-ui/src/concern/copy.js b/preview/home-ui/src/concern/copy.js
index 53b4c89..7bca12d 100644
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
diff --git a/preview/home-ui/src/right-rail.js b/preview/home-ui/src/right-rail.js
index e3ab6c8..3d0dbd7 100644
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

설명:
- `concernInPageControl` 에 `leave` 인자(기본 `'inpage'`)만 추가. 찾기·등록은 지금처럼 `inpage`.
- 새 `railConcernControl`: 슬롯이 `home_right_rail` 이고 고민방 주소일 때만 팝업 버튼, 나가는 방식은 `railLeaveMode`(홈 = `hash`, 즉 팝업 안 「게시판에서 보기」가 같은 탭에서 게시판으로 감 — 홈 고민방 배너 팝업과 같음). 그 밖은 기존 `railSlotAnchor` 그대로.
- 바꿔 부르는 곳은 HOT 카드(`renderLivePostCard`)와 HOT 아래 버튼(`renderHotSection`) 두 곳뿐. 추천 행동·정보 배너는 그대로.
- 218-8: 문구 2곳만.
- 참고: `home_right_rail` 은 홍보 전체 화면(`promo/shell.js:34`)도 같이 씀 → 그 화면 레일 HOT도 같은 팝업이 됨(홈 레일과 같은 레일이라 의도와 맞음).
- 참고: 학생·비회원 HOT 아래 버튼(「커뮤니티 더 보기」, `#/community`)은 팝업에서 학생/학부모 고민방을 열고, 「게시판에서 보기」는 `#/community/parent` 로 감(찾기 화면과 같은 규칙).

## 3. 허용 파일(이 밖은 한 줄이라도 바꾸면 불합격)

1. `preview/home-ui/src/right-rail.js` — 위 diff 범위(`concernInPageControl`, 새 `railConcernControl`, 245행 문구, `renderLivePostCard` 의 호출 1곳, `renderHotSection` 의 호출 1곳)
2. `preview/home-ui/src/concern/copy.js` — 64행 문구만

CSS 수정은 필요 없음(R11).

## 4. 금지

- `railSlotAnchor` 자체 수정 금지. 「이번 시즌 추천 행동」 카드는 일반 링크(`<a>`)로 남아야 함.
- 팝업 파일(`concern/rail-concern-popup.js`, `rail-popup.js`, `library/info-rail.js`) 수정 금지. CSS 수정 금지.
- 작업 B 되돌리기 금지(베스트 빨강 띠·팝업, 0건 버튼).
- 아래 「원장」 7곳(행 9건)은 **수정 안 함 — 종현 확정 t1583, 바꾸면 불합격**:
  `preview/shared/study-room-basic-form.js:305, :809` 「원장성별」 · `preview/study-room-ui/src/summary.js:148` · `preview/study-room-ui/src/screens/step-basic.js:90` 「원장성별」 · `preview/auth-ui/src/screens/signup-basic.js:273` · `preview/home-ui/src/study-room-reg/myshop-render.js:155` 「원장 소개 · 경력」 · `preview/home-ui/src/promo/study-room-content.js:77` 「공부방 원장」 · `preview/home-ui/src/promo/catalog.js:22` 「학부모 · 원장」 · `preview/home-ui/src/admin/a28-copy.js:566`
- 218-1~5·7, 디자인 변경, 관련 없는 정리, 기능 추가 금지. 화면에 개발 용어 금지.
- 하위 에이전트를 쓰면 빠른(fast) 모델 금지. `git add -A`/`git add .` 금지, force-push 금지, 비밀값 커밋 금지. main 에 코드 merge 금지(검수 뒤 종현 승인).

## 5. 합격 기준

흉내: `/api/auth/me.php`(역할), `/api/board/concern-hot.php`(HOT·최신·베스트 글 각 방 1개). 홈 `#/guest`·`#/study-room`·`#/tutor`·`#/parent`, 찾기 `search-ui #/search/room?role=…`.

4모드(공부방/과외쌤/학생/비회원) × 1280/1023/390 = 12칸 모두:

| 항목 | 기준 |
|---|---|
| 홈 HOT 카드 | `<button>` + `data-concern-rail-open` + `data-concern-rail-leave="hash"`. 클릭 → 읽기 팝업(`concern-room`), **주소(hash) 그대로** |
| 홈 HOT 아래 버튼 | `<button>`. 클릭 → 팝업, hash 그대로. 팝업 제목: 공부방 → 공부방 고민방, 과외쌤 → 과외쌤 고민방, 학생·비회원 → 학생/학부모 고민방 |
| 팝업 「게시판에서 보기」 | `<a href="#/community/…">`. 누르면 팝업 닫히고 **같은 탭**에서 그 게시판(`#/community/director|tutor|parent`), 탭 수 1 |
| 키보드 | 카드에 초점 → Enter, Space 각각 열림. Esc 로 닫힘. 초점이 연 버튼(또는 팝업 중 레일이 다시 그려졌으면 같은 방·같은 글의 버튼, 팝업 파일 기존 동작)으로 돌아옴 |
| 추천 행동 카드 | `<a>` 그대로, 클릭 → 그 화면으로 이동, 팝업 없음. 목록이 main 과 같음 |
| 찾기 화면 | 레일 순서·색·카드(`inpage` 버튼)·팝업(이어 보기 버튼)이 main 과 같음. 바뀌는 것은 공부방 모드 HOT 아래 버튼 문구뿐 |
| 문구 | 공부방 모드 HOT 아래 버튼 = 「공부방 고민방 더 보기」. 커뮤니티(`#/community`) 공부방 고민방 입구 = 「…이웃 공부방과 나눠 보세요.」. 이 두 곳에 「원장」 0건 |
| 레일 | 순서·띠 색이 main 과 같음(베스트 `rgb(190,18,60)`, 고민방 `rgb(109,40,217)`, 현장 `rgb(190,18,60)`, 추천 행동 `rgb(38,107,196)`, 정보 `rgb(71,85,105)`) |
| 검색 | `rg -n "원장 고민방|이웃 원장" preview --glob '!**/node_modules/**'` 0건. 4절 7곳은 그대로 |

우동공과2 측정(임시 적용): **12/12 통과**. 그림 `png/224-C-after-hot-popup-1280-studyroom.png`.

## 6. 측정 스크립트

`224-measure-C.py`(측정) + `224-judge-C.py`(판정). 브랜치와 main 을 각각 띄움:
```
# 브랜치
cd preview/home-ui && npx vite --port 5183 --host 127.0.0.1 &
cd preview/search-ui && npx vite --port 5185 --host 127.0.0.1 &
# main (다른 worktree)
... home-ui 5184, search-ui 5186
python3 224-measure-C.py 5183 5185 && python3 224-measure-C.py 5184 5186
python3 224-judge-C.py /tmp/c-5183.json /tmp/c-5184.json   # 기대: 12/12 PASS []
```
Node 로 다시 쓰면 같은 항목·흉내를 지키고 리포트에 적으세요.

```python
# 224 작업 C 측정: python3 224-measure-C.py <home포트> <search포트>  → /tmp/c-<home포트>.json
import json,sys
from playwright.sync_api import sync_playwright
HP,SP=sys.argv[1],sys.argv[2]
C=[('비회원',None,'/guest','guest'),('공부방','study_room_owner','/study-room','study_room'),('과외쌤','tutor','/tutor','tutor'),('학생','guardian_student','/parent','parent')]
BK={'concern-director':'director','concern-tutor':'tutor','concern-parent':'parent'}
def post(i,bk,r=9): return {'id':str(i),'title':f'고민글{i}','board_key':bk,'boardKey':bk,'reaction_total':r,'reactionTotal':r,'comment_count':2,'commentCount':2,'created_at':'2026-10-01'}
ALL=[post(10+i,k) for i,k in enumerate(BK)]
def api(route,req):
  u=req.url
  if 'view=best' in u: body={'ok':True,'boards':{k:[post(1+i,k)] for i,k in enumerate(BK)}}
  else: body={'ok':True,'posts':ALL}
  route.fulfill(status=200,content_type='application/json',body=json.dumps(body))
RAIL='''()=>{const a=document.querySelector('[data-right-rail-slot]');if(!a)return null;const q=(s)=>[...a.querySelectorAll(s)];
const hot=a.querySelector('.live-rail-slot--field');const cta=hot&&hot.querySelector('.live-rail-slot__cta');
return {order:q('.live-rail-slot').map(e=>(e.className.match(/live-rail-slot--(\\w+)/)||[])[1]).join('|'),
bands:q('.live-rail-slot').map(e=>{const b=e.querySelector('.live-rail-slot__band');return b?getComputedStyle(b).backgroundColor:''}).join('|'),
cards:q('.live-rail-slot--field .live-rail-card').map(e=>e.tagName+':'+(e.dataset.concernRailOpen||'')+':'+(e.dataset.concernRailLeave||'')),
cta:cta?[cta.tagName,cta.textContent.trim(),cta.dataset.concernRailOpen||'',cta.dataset.concernRailLeave||'',cta.getAttribute('href')||'']:null,
action:q('.live-rail-slot--action .live-rail-action').map(e=>e.tagName+':'+(e.getAttribute('href')||'')),
won:(hot?hot.innerText:'').includes('원장')}}'''
POP='''()=>{const p=document.querySelector('.rail-popup');if(!p||p.hidden)return null;const g=p.querySelector('.rail-popup__go');
return {kind:p.dataset.railPopupKind,title:(p.querySelector('.rail-popup__head')||p).innerText.split('\\n')[0],go:g?[g.tagName,g.getAttribute('href')||'',g.hasAttribute('data-rail-popup-continue')]:null}}'''
def safe(f):
  try: return f()
  except Exception as e: return {'error':str(e).split('\n')[0][:120]}
def tryopen(pg,sel,how,home_url=None): return safe(lambda: _tryopen(pg,sel,how,home_url))
def _tryopen(pg,sel,how,home_url):
  if home_url: pg.goto(home_url);pg.wait_for_timeout(1200)
  h0=pg.evaluate('location.hash');el=pg.locator(sel).first
  if not el.count(): return {'missing':sel}
  key=safe(lambda: el.evaluate("e=>[e.dataset.concernRailOpen||'',e.dataset.concernRailPost||'']"))
  el.scroll_into_view_if_needed()
  if how=='click': el.click(timeout=3000)
  else: el.focus(); pg.keyboard.press(how)
  pg.wait_for_timeout(700); pop=pg.evaluate(POP); h1=pg.evaluate('location.hash')
  pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
  back=pg.evaluate('''(k)=>{const a=document.activeElement;return !!a&&a!==document.body&&(a.dataset.concernRailOpen||'')===k[0]&&(a.dataset.concernRailPost||'')===k[1]}''',key if isinstance(key,list) else ['',''])
  # 레일이 팝업 중 다시 그려지면 팝업 파일 refocus가 같은 글(같은 방·글 id)의 첫 버튼으로 돌려준다(기존 동작).
  closed=pg.evaluate(POP) is None
  return {'pop':pop,'hashSame':h0==h1,'closed':closed,'focusBack':back}
res={}
with sync_playwright() as p:
  br=p.chromium.launch()
  for w in (1280,1023,390):
    for n,rt,home,r in C:
      ctx=br.new_context(viewport={'width':w,'height':1100});pg=ctx.new_page()
      if rt: ctx.route('**/api/auth/me.php',lambda route,req,rt=rt: route.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'authenticated':True,'email_verified':True,'role_type':rt,'user_id':1,'email':'t@t','name':'t','phone_verified':True})))
      ctx.route('**/api/board/concern-hot.php*',api)
      d={}
      pg.goto(f'http://127.0.0.1:{HP}/#'+home);pg.wait_for_timeout(2000)
      d['hashHome']=pg.evaluate('location.hash')
      d['rail']=pg.evaluate(RAIL)
      d['card_click']=tryopen(pg,'.live-rail-slot--field .live-rail-card','click')
      d['card_enter']=tryopen(pg,'.live-rail-slot--field .live-rail-card','Enter',f'http://127.0.0.1:{HP}/#'+home)
      d['card_space']=tryopen(pg,'.live-rail-slot--field .live-rail-card',' ',f'http://127.0.0.1:{HP}/#'+home)
      d['cta_click']=tryopen(pg,'.live-rail-slot--field .live-rail-slot__cta','click',f'http://127.0.0.1:{HP}/#'+home)
      if w==1280 and n=='공부방':
        def shot():
          pg.goto(f'http://127.0.0.1:{HP}/#'+home);pg.wait_for_timeout(1500)
          pg.locator('.live-rail-slot--field .live-rail-card').first.click(timeout=3000);pg.wait_for_timeout(700);pg.screenshot(path=f'/tmp/c-{HP}-hot-popup-1280-studyroom.png');pg.keyboard.press('Escape')
        safe(shot)
      # 팝업 안 게시판에서 보기
      def gostep():
        pg.goto(f'http://127.0.0.1:{HP}/#'+home);pg.wait_for_timeout(1500)
        pg.locator('.live-rail-slot--field .live-rail-slot__cta').first.click(timeout=3000);pg.wait_for_timeout(700)
        go=pg.locator('.rail-popup .rail-popup__go').first
        if go.count(): go.click(timeout=3000);pg.wait_for_timeout(1000)
        return {'hash':pg.evaluate('location.hash'),'popupGone':pg.evaluate(POP) is None,'tabs':len(ctx.pages)}
      d['go']=safe(gostep)
      # 추천 행동
      pg.goto(f'http://127.0.0.1:{HP}/#'+home);pg.wait_for_timeout(1500)
      a=pg.locator('.live-rail-slot--action .live-rail-action').first
      h0=pg.evaluate('location.hash'); a.scroll_into_view_if_needed(); a.click(); pg.wait_for_timeout(800)
      d['action']={'from':h0,'to':pg.evaluate('location.hash'),'popup':pg.evaluate(POP)}
      # 커뮤니티 공부방 고민방 소개 문구
      pg.goto(f'http://127.0.0.1:{HP}/#/community');pg.wait_for_timeout(1500)
      t=pg.evaluate('document.body.innerText')
      d['copy']={'new':'이웃 공부방과 나눠 보세요' in t,'old':'이웃 원장과' in t}
      # 찾기 화면(그대로여야 함)
      pg.goto(f'http://127.0.0.1:{SP}/#/search/room?role={r}');pg.wait_for_timeout(2200)
      d['find']={'rail':pg.evaluate(RAIL),'card':tryopen(pg,'.live-rail-slot--field .live-rail-card','click')}
      res[f'{w}|{n}']=d;ctx.close()
  br.close()
json.dump(res,open(f'/tmp/c-{HP}.json','w'),ensure_ascii=False,indent=1)
for k,v in res.items(): print(k,json.dumps(v,ensure_ascii=False)[:600])
```

```python
import json,sys
a=json.load(open(sys.argv[1]));b=json.load(open(sys.argv[2]))
room={'공부방':'공부방 고민방','과외쌤':'과외쌤 고민방','학생':'학생/학부모 고민방','비회원':'학생/학부모 고민방'}
cta={'공부방':'공부방 고민방 더 보기','과외쌤':'과외쌤 고민방 더 보기','학생':'커뮤니티 더 보기','비회원':'커뮤니티 더 보기'}
ok=0;bad=[]
for k,v in a.items():
  w,n=k.split('|');y=b[k];r=v['rail']
  o=lambda x: bool(x.get('pop')) and x['hashSame'] and x['closed'] and x['focusBack'] and x['pop']['go'][0]=='A' and x['pop']['go'][1].startswith('#/community/')
  c={'order':r['order']==y['rail']['order'],'bands':r['bands']==y['rail']['bands'],'cards':bool(r['cards']) and all(c.startswith('BUTTON') and c.endswith(':hash') for c in r['cards']),
  'cta':r['cta'][0]=='BUTTON' and r['cta'][1]==cta[n],'won':not r['won'],
  'click':o(v['card_click']),'enter':o(v['card_enter']),'space':o(v['card_space']),'ctaopen':o(v['cta_click']) and v['cta_click']['pop']['title'].startswith(room[n]),
  'go':v['go'].get('hash','').startswith('#/community/') and v['go'].get('popupGone') and v['go'].get('tabs')==1,
  'action':v['action']['to']!=v['action']['from'] and v['action']['popup'] is None and r['action']==y['rail']['action'],
  'copy':v['copy']['new'] and not v['copy']['old'],'find':{**v['find']['rail'],'cta':v['find']['rail']['cta'][2:],'won':0}=={**y['find']['rail'],'cta':y['find']['rail']['cta'][2:],'won':0} and v['find']['rail']['cta'][1]==cta[n],'findpop':v['find']['card']==y['find']['card']}
  if all(c.values()): ok+=1
  else: bad.append((k,[x for x,t in c.items() if not t]))
print(f'{ok}/{len(a)} PASS',bad)
```

## 7. 진행 순서

1. `git fetch origin main` → 1절 확인(다르면 멈추고 보고).
2. `git switch -c cursor/home-c-hot-popup-20261014 origin/main`
3. 2절 diff 적용 → `git add preview/home-ui/src/right-rail.js preview/home-ui/src/concern/copy.js`
4. 커밋: `fix(rail): 홈 현장·HOT 읽기 팝업 + 「원장」 문구 2곳 (218-6·218-8, 종현 2026-10-14)`
5. 5절 측정(브랜치·main), 그림(공부방 홈 1280·390 HOT 팝업, 비회원 홈 1280 HOT 아래 버튼 팝업, 커뮤니티 입구 문구, 찾기 화면 1280).
6. `git push origin cursor/home-c-hot-popup-20261014` (브랜치만, main merge 금지).
7. **작업 기록은 main 에 바로 커밋**(문서만, 파일 이름으로 add):
   - `docs/worklog/2026/10/2026-10-14-home-c-report.md` — 브랜치, 커밋 해시, 바뀐 파일·줄, 5절 12칸 결과표, 판정 출력, 그림 경로(`docs/worklog/2026/10/img/2026-10-14-home-c-*.png`), 지시와 다른 점, 확인 못 한 것.
   - `docs/worklog/2026/10/2026-10-10-work-queue.md` 한 줄: `- 2026-10-14 작업 C(218-6·218-8) 브랜치 cursor/home-c-hot-popup-20261014 <해시> push, 검수 대기`
8. 답장: 보고서 경로, 브랜치 커밋 해시, main 기록 커밋 해시.
