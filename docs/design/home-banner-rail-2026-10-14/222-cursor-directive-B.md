# 222 · Cursor 작업지시 B — 「이달의 베스트」 빨강 띠 + 빈 베스트 팝업 (218-4 · 218-7)

- 작성: 우동공과2(개발팀장), 2026-10-14 · 기준 origin/main `f167481`
- 이 문서만 보고 작업할 수 있게 썼습니다(대화 기록 없음 전제).
- 원본 티켓: `docs/design/home-banner-rail-2026-10-14/218-home-banner-gap-best-red-work-order.md` 의 **218-4, 218-7만**. 같은 문서의 다른 티켓(218-1·2·3은 작업 A로 끝남, 218-5·6·8)은 이 작업에서 **손대면 불합격**.

## 0. 배경과 확정 기록

| 날짜 | 근거 | 확정 내용 |
|---|---|---|
| 2026-10-14 | 종현 t1578 | 오른쪽 레일 「이달의 베스트」 띠 배경을 빨강으로. 사이트에 있는 빨강(「오늘의 현장」 띠와 같은 `--rail-tone-hot` = `#BE123C`). 글자 AA 대비 유지. 레일 맨 위 위치·나머지 동작 그대로. |
| 2026-10-14 | 종현 t1581 | 「이달의 베스트」 읽기 팝업 머리띠도 레일 띠와 같은 빨강 `#BE123C` 승인(home-right-rail.css:634-637 범위 추가). |
| 2026-10-14 | 종현 t1582 | 「이달의 베스트」 글 0건일 때 눌러도 아무것도 안 열림 → 같은 모양의 **빈 팝업**(빨강 머리띠, 빈 문구)을 연다. 누르는 곳 = 띠(제목 줄) + 빈 문구 줄. |

현재 문제(우동공과2 확인, origin/main f167481 로컬 실행):
- 띠 색이 고민방 3칸과 같은 보라 `rgb(109,40,217)` — `.live-rail-slot--best, .live-rail-slot--room` 공용 규칙 때문.
- 팝업 머리띠도 보라 — `concern-room`, `concern-best` 공용 규칙 때문.
- 0건이면 `railStateBody()` 가 `<p class="live-rail-empty">` 만 그려 누를 곳(`data-concern-best-open`)이 없음 → 팝업 안 열림(종현이 겪은 현상).

## 1. 손대기 전 다시 확인(필수)

`git fetch origin main` 후 `origin/main` 에서 아래 줄을 그대로 확인하세요. **줄이 옮겨졌거나 내용이 다르면 짐작해서 고치지 말고 멈춘 뒤 보고**하세요.

| # | 파일:줄 (f167481 기준) | 있어야 할 내용 |
|---|---|---|
| R1 | `preview/home-ui/src/styles/home-right-rail.css:33-36` | `.live-rail-slot--best,` / `.live-rail-slot--room {` / `  --rail-tone: var(--rail-tone-community);` / `}` |
| R2 | `preview/home-ui/src/styles/home-right-rail.css:38-40` | `.live-rail-slot--field { --rail-tone: var(--rail-tone-hot); }` (빨강 토큰이 이미 있음 — 새 색 만들지 말 것) |
| R3 | `preview/home-ui/src/styles/home-right-rail.css:196-200` | `.live-rail-slot__band` — `margin: var(--space-2) calc(-1 * var(--space-4)) 0;` 와 `background: var(--rail-tone, …)` |
| R4 | `preview/home-ui/src/styles/home-right-rail.css:634-637` | `.rail-popup[data-rail-popup-kind='concern-room'],` / `.rail-popup[data-rail-popup-kind='concern-best'] {` / `--rail-tone: var(--rail-tone-community);` |
| R5 | `preview/home-ui/src/styles/home-right-rail.css:904` | 파일 끝(총 904줄) |
| R6 | `preview/home-ui/src/right-rail.js:483-501` | `function renderBestSection(boardKeys, attrs, liveId)` — 489 `const stateBody = railStateBody(...)`, 490-491 `const body = stateBody ?? ...`, 498 `<div class="live-rail-slot__band">…bestTitle…</div>` |
| R7 | `preview/home-ui/src/right-rail.js:396` | `function railStateBody(status, count, emptyCopy)` — **수정 금지**(다른 칸도 씀) |
| R8 | `preview/home-ui/src/right-rail.js:354` | `renderBestSection(boardKeys, …)` 호출 — boardKeys 는 이미 역할 순서(공부방→공부방 고민방, 과외쌤→과외쌤 고민방, 학생·비회원→학생/학부모 고민방이 첫째) |
| R9 | 기존 클릭 처리 | `data-concern-best-open="<boardKey>"` 를 누르면 이미 베스트 팝업이 열림(글 있는 줄 `renderBestItem` 이 쓰는 방식). **새 핸들러 만들지 말 것.** |

## 2. 바꿀 내용(검증한 diff 그대로)

우동공과2가 worktree 에 임시 적용 → 4모드×3폭 측정 → 되돌림까지 마친 diff 입니다. 이것과 **글자 하나까지 같게** 적용하세요.

```diff
diff --git a/preview/home-ui/src/right-rail.js b/preview/home-ui/src/right-rail.js
index 51fd652..e3ab6c8 100644
--- a/preview/home-ui/src/right-rail.js
+++ b/preview/home-ui/src/right-rail.js
@@ -487,15 +487,24 @@ function renderBestSection(boardKeys, attrs, liveId) {
     ? boardKeys.map((key) => ({ key, post: bestPostsForBoard(boards, key)[0] })).filter((item) => item.post)
     : [];
   const stateBody = railStateBody(status, items.length, CONCERN_RAIL_COPY.bestEmpty);
-  const body =
-    stateBody ?? `<ul class="live-rail-best__list">${items.map((item) => renderBestItem(item.key, item.post)).join('')}</ul>`;
+  // 0건(받기 끝)일 때만 띠·빈 문구를 눌러 그 역할 첫 방의 빈 베스트 팝업을 연다(218-7).
+  const emptyOpenKey = status === 'ready' && !items.length ? boardKeys[0] || '' : '';
+  const titleHtml = `<strong class="live-rail-slot__title">${esc(CONCERN_RAIL_COPY.bestTitle)}</strong>`;
+  const band = emptyOpenKey
+    ? `<button type="button" class="live-rail-slot__band live-rail-best__open" data-concern-best-open="${esc(emptyOpenKey)}">${titleHtml}</button>`
+    : `<div class="live-rail-slot__band">${titleHtml}</div>`;
+  const body = emptyOpenKey
+    ? `<button type="button" class="live-rail-empty live-rail-best__open" data-concern-best-open="${esc(emptyOpenKey)}">${esc(
+        CONCERN_RAIL_COPY.bestEmpty,
+      )}</button>`
+    : stateBody ?? `<ul class="live-rail-best__list">${items.map((item) => renderBestItem(item.key, item.post)).join('')}</ul>`;
   const liveAttr = liveId ? ` ${LIVE_FIELD_ATTR}="${esc(liveId)}"` : '';
   return `
     <section class="live-rail-slot live-rail-slot--best" data-rail-best data-rail-state="${railStateName(
       status,
       items.length,
     )}"${attrs}${liveAttr}>
-      <div class="live-rail-slot__band"><strong class="live-rail-slot__title">${esc(CONCERN_RAIL_COPY.bestTitle)}</strong></div>
+      ${band}
       ${body}
     </section>`;
 }
diff --git a/preview/home-ui/src/styles/home-right-rail.css b/preview/home-ui/src/styles/home-right-rail.css
index 9152fb7..3991c83 100644
--- a/preview/home-ui/src/styles/home-right-rail.css
+++ b/preview/home-ui/src/styles/home-right-rail.css
@@ -30,11 +30,14 @@
   overflow: hidden;
 }
 
-.live-rail-slot--best,
 .live-rail-slot--room {
   --rail-tone: var(--rail-tone-community);
 }
 
+.live-rail-slot--best {
+  --rail-tone: var(--rail-tone-hot);
+}
+
 .live-rail-slot--field {
   --rail-tone: var(--rail-tone-hot);
 }
@@ -631,11 +634,14 @@ body.is-rail-popup-open {
   padding: var(--space-4, 1rem);
 }
 
-.rail-popup[data-rail-popup-kind='concern-room'],
-.rail-popup[data-rail-popup-kind='concern-best'] {
+.rail-popup[data-rail-popup-kind='concern-room'] {
   --rail-tone: var(--rail-tone-community);
 }
 
+.rail-popup[data-rail-popup-kind='concern-best'] {
+  --rail-tone: var(--rail-tone-hot);
+}
+
 .rail-popup[data-rail-popup-kind='info-board'] {
   --rail-tone: var(--rail-tone-info);
 }
@@ -902,3 +908,27 @@ button.rail-popup__go {
     border-radius: var(--radius-surface, 0.75rem) var(--radius-surface, 0.75rem) 0 0;
   }
 }
+
+/* 218-7 · 이달의 베스트 0건: 띠·빈 문구를 버튼으로(모양은 그대로) */
+.live-rail-best__open {
+  display: block;
+  width: 100%;
+  border: 0;
+  font: inherit;
+  text-align: left;
+  cursor: pointer;
+}
+
+.live-rail-slot__band.live-rail-best__open {
+  width: calc(100% + 2 * var(--space-4));
+}
+
+button.live-rail-empty.live-rail-best__open {
+  background: transparent;
+  padding: 0;
+}
+
+.live-rail-best__open:focus-visible {
+  outline: 2px solid var(--uds-ink, #1c1917);
+  outline-offset: 2px;
+}
```

설명:
- 218-4: 공용 규칙에서 `.live-rail-slot--best` 만 떼어 `--rail-tone-hot`(#BE123C). 고민방 3칸은 보라 그대로.
- 팝업: `concern-best` 만 떼어 빨강. `concern-room` 팝업은 보라 그대로.
- 218-7: `status === 'ready'` 이고 0건일 때만 띠와 빈 문구를 `<button data-concern-best-open="boardKeys[0]">` 으로 그림. 받는 중(loading)·실패(failed)는 지금처럼 누를 곳 없음. 글 있을 때는 지금 마크업 그대로(div 띠 + 줄마다 버튼).
- 버튼이 된 띠는 음수 좌우 여백 때문에 `width: calc(100% + 2 * var(--space-4))` 로 원래 폭과 같게(측정: 띠 x·폭·높이가 main 과 전 칸 동일).
- 빈 문구 버튼은 배경·안쪽 여백을 없애 모양 그대로. 키보드 초점 링 `outline 2px var(--uds-ink)`.

## 3. 허용 파일(이 밖은 한 줄이라도 바꾸면 불합격)

1. `preview/home-ui/src/right-rail.js` — **`renderBestSection` 함수 안만**
2. `preview/home-ui/src/styles/home-right-rail.css` — 위 diff 세 곳만

## 4. 금지

- 218-6(홈 HOT·현장 팝업), 218-8(「원장」 문구) 손대기 금지. 218-5 도 금지.
- `railSlotAnchor`, `railStateBody`, 팝업 파일(`concern/rail-concern-popup.js` 등 팝업 그리는 파일), `concern/copy.js` 수정 금지. 빈 문구는 기존 `CONCERN_RAIL_COPY.bestEmpty`(「이달의 베스트, 아직 글이 미도착중...」) 그대로.
- 비회원 팝업 동작(제목만 보임 / 로그인 안내 등)은 **지금 팝업이 하는 그대로** 따른다. 비회원용으로 바꾸거나 새로 막지 말 것.
- 새 색·토큰 만들기, 디자인 바꾸기, 관련 없는 정리, 기능 추가 금지. 레일 순서·다른 칸 변경 금지.
- 화면에 개발 용어 금지.
- 하위 에이전트를 쓰면 빠른(fast) 모델 금지.
- `git add -A`/`git add .` 금지(파일 이름으로 add), force-push 금지, 비밀값(토큰·비번·.env) 커밋 금지.
- main 에 코드 merge 금지 — 우동공과2 검수 후 종현 승인으로 진행.

## 5. 합격 기준

측정은 `/api/auth/me.php` 로 역할을, `/api/board/concern-hot.php` 로 0건(`boards: {}`)·글 있음(방마다 반응 9인 글 1개)을 흉내 내서 합니다(아래 스크립트).

### 5-1. 모드 × 폭 (공부방 / 과외쌤 / 학생 / 비회원 × 1280 / 1023 / 390 = 12칸, 0건·글 있음 각각)

| 항목 | 기준 |
|---|---|
| 베스트 띠 배경 | `rgb(190, 18, 60)` |
| 띠 제목 글자 | `rgb(255, 255, 255)`, 대비 6.29:1 (AA 4.5 이상) |
| 띠 위치·크기 | main 과 같음(x/폭/높이 — 1280: 1026/221/34, 1023: 34/956/34, 390: 18/355/34) |
| 레일 맨 위 | 베스트가 첫 칸 |
| 레일 순서 | main 과 같은 문자열(공부방·과외쌤·비회원: best│room×3│field│action│info×3, 학생: best│room│field│action│info) |
| 고민방 칸 띠 | `rgb(109, 40, 217)` 그대로(보라) |
| 팝업 머리띠 | `concern-best` 팝업 `.rail-popup__head` 배경 `rgb(190, 18, 60)` |

### 5-2. 0건

| 항목 | 기준 |
|---|---|
| 누를 곳 | 띠와 빈 문구 줄 모두 `<button>` + `data-concern-best-open` |
| 여는 방 | 공부방 → `concern-director`(공부방 고민방), 과외쌤 → `concern-tutor`(과외쌤 고민방), 학생·비회원 → `concern-parent`(학생/학부모 고민방) |
| 팝업 내용 | 제목 「<방 이름> · 이달의 베스트」, 빈 문구 「이달의 베스트, 아직 글이 미도착중...」, 「게시판에서 보기」 |
| 키보드 | 띠·빈 문구 버튼에 초점 → Enter, Space 각각 팝업 열림. Esc 닫은 뒤 초점이 띠 버튼으로 돌아옴. 초점 링 보임 |
| 받는 중·실패 | 지금과 같음(누를 곳 없음) |

### 5-3. 글 있음

- 띠는 `<div>` 그대로(누를 곳 아님), 줄마다 지금처럼 그 방 베스트 팝업이 열림. 팝업 머리띠만 빨강으로 바뀜, 나머지 같음.

### 5-4. 측정 결과(우동공과2, 임시 적용 후)

24칸 모두 위 기준 통과. main(f167481)은 띠·팝업 보라, 0건 클릭 시 팝업 없음(현상 재현). 참고 그림: `png/222-B-after-empty-popup-1280-studyroom.png`, `png/222-B-after-posts-popup-1280-studyroom.png`.
참고: 흉내 낸 환경에서 글 있음 팝업에 「글을 불러오는 중 길이 막혔어요…」 문구가 같이 보였는데, 팝업이 따로 부르는 주소를 흉내 내지 않아서 생긴 것이며 main 도 같습니다(이 작업 범위 밖, 고치지 말 것).

## 6. 측정 스크립트

같은 폴더 `222-measure-B.py` (Playwright, Python). 사용: `cd preview/home-ui && npx vite --port 5183 --host 127.0.0.1` 후 `python3 222-measure-B.py 5183` → `/tmp/b-5183.json`. main 을 다른 포트(5184)로 띄워 같이 돌리고 band·order 를 비교하세요.

```python
import json,sys
from playwright.sync_api import sync_playwright
C=[('비회원',None,'/guest'),('공부방','study_room_owner','/study-room'),('과외쌤','tutor','/tutor'),('학생','guardian_student','/parent')]
def post(i,bk,r=9): return {'id':str(i),'title':f'베스트글{i}','board_key':bk,'boardKey':bk,'reaction_total':r,'reactionTotal':r,'created_at':'2026-10-01'}
def hot(route,req,mode):
  u=req.url
  if 'view=best' in u:
    b={} if mode=='empty' else {'concern-director':[post(1,'concern-director')],'concern-tutor':[post(2,'concern-tutor')],'concern-parent':[post(3,'concern-parent')]}
    body={'ok':True,'boards':b}
  else: body={'ok':True,'posts':[]}
  route.fulfill(status=200,content_type='application/json',body=json.dumps(body))
INFO='''()=>{const s=document.querySelector('.live-rail-slot--best');if(!s)return null;const b=s.querySelector('.live-rail-slot__band');const r=b.getBoundingClientRect();
const t=s.querySelector('.live-rail-slot__title');const first=document.querySelector('[data-right-rail-slot] .live-rail-slot');
return {tag:b.tagName,bg:getComputedStyle(b).backgroundColor,fg:getComputedStyle(t).color,band:[Math.round(r.x),Math.round(r.width),Math.round(r.height)],
first:first===s,state:s.dataset.railState,openKeys:[...s.querySelectorAll('[data-concern-best-open]')].map(e=>e.dataset.concernBestOpen),
rooms:[...document.querySelectorAll('.live-rail-slot--room .live-rail-slot__band')].map(e=>getComputedStyle(e).backgroundColor),
order:[...document.querySelectorAll('[data-right-rail-slot] .live-rail-slot')].map(e=>e.className.replace(/live-rail-slot /,'')).join('|')}}'''
POP='''()=>{const p=document.querySelector('.rail-popup');if(!p)return null;const h=p.querySelector('.rail-popup__head');
return {kind:p.dataset.railPopupKind,bg:h?getComputedStyle(h).backgroundColor:null,text:p.innerText.slice(0,160).replace(/\\n/g,' / ')}}'''
port=sys.argv[1]; res={}
with sync_playwright() as p:
  br=p.chromium.launch()
  for mode in ('empty','posts'):
    for w in (1280,1023,390):
      for n,rt,home in C:
        ctx=br.new_context(viewport={'width':w,'height':1100});pg=ctx.new_page()
        if rt: pg.route('**/api/auth/me.php',lambda route,req,rt=rt: route.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'authenticated':True,'email_verified':True,'role_type':rt,'user_id':1,'email':'t@t','name':'t','phone_verified':True})))
        pg.route('**/api/board/concern-hot.php*',lambda route,req,mode=mode: hot(route,req,mode))
        pg.goto(f'http://127.0.0.1:{port}/#'+home);pg.wait_for_timeout(1800)
        d={'rail':pg.evaluate(INFO)}
        sel='.live-rail-slot--best .live-rail-slot__band' if mode=='empty' else '.live-rail-best__item'
        el=pg.locator(sel).first
        if el.count():
          el.scroll_into_view_if_needed(); el.click(); pg.wait_for_timeout(1000); d['pop']=pg.evaluate(POP)
          if w==1280 and n=='공부방': pg.screenshot(path=f'/tmp/b-{port}-{mode}.png')
          pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
          if mode=='empty':
            d['focusBack']=pg.evaluate("document.activeElement&&document.activeElement.className")
            e2=pg.locator('.live-rail-slot--best button.live-rail-empty')
            if e2.count(): e2.first.focus(); pg.keyboard.press('Enter'); pg.wait_for_timeout(800); d['enter']=pg.evaluate(POP); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
            b=pg.locator('.live-rail-slot--best .live-rail-slot__band')
            b.first.focus(); pg.keyboard.press(' '); pg.wait_for_timeout(800); d['space']=pg.evaluate(POP)
        res[f'{mode}|{w}|{n}']=d; ctx.close()
  br.close()
json.dump(res,open(f'/tmp/b-{port}.json','w'),ensure_ascii=False,indent=0)
for k,v in res.items(): print(k,json.dumps(v,ensure_ascii=False)[:420])
```

## 7. 진행 순서

1. `git fetch origin main` → 1절 표 확인(다르면 멈추고 보고).
2. `git switch -c cursor/home-b-best-red-20261014 origin/main`
3. 2절 diff 적용 → `git add preview/home-ui/src/right-rail.js preview/home-ui/src/styles/home-right-rail.css`
4. 커밋: `fix(rail): 이달의 베스트 빨강 띠·팝업 + 0건 빈 팝업 (218-4·218-7, 종현 2026-10-14)`
5. 5절 측정(브랜치·main 둘 다), 그림 저장(1280·390, 0건 팝업 / 글 있음 팝업 / 초점 링).
6. `git push origin cursor/home-b-best-red-20261014` (브랜치만, main merge 금지).
7. **작업 기록은 main 에 바로 커밋**(문서만):
   - `docs/worklog/2026/10/2026-10-14-home-b-report.md` — 브랜치, 커밋 해시, 바뀐 파일·줄, 5절 표 측정값(24칸), 그림 경로(`docs/worklog/2026/10/img/2026-10-14-home-b-*.png`), 지시와 다르게 한 것, 확인 못 한 것.
   - `docs/worklog/2026/10/2026-10-10-work-queue.md` 에 한 줄 추가: `- 2026-10-14 작업 B(218-4·218-7) 브랜치 cursor/home-b-best-red-20261014 <해시> push, 검수 대기`
   - 문서 파일만 이름으로 add, 앱 코드 섞지 말 것.
8. 답장: 보고서 경로, 브랜치 커밋 해시, main 기록 커밋 해시.
