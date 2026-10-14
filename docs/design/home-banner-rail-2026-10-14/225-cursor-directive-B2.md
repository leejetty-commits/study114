# 225 · Cursor 작업지시 B2 — 「이달의 베스트」 0건 팝업 제목 + 빈 문구 글자 크기 (218-7 보완)

- 작성: 우동공과2(개발팀장), 2026-10-15 · 기준 origin/main `d032222` (작업 B merge `da26876` 포함)
- 이 문서만 보고 작업할 수 있게 썼습니다(대화 기록 없음 전제).
- 원본: `docs/design/home-banner-rail-2026-10-14/218-home-banner-gap-best-red-work-order.md` 확정 기록 「218-7 보완」 두 줄. 작업 C(218-6·218-8, 지시서 224) 범위는 **손대면 불합격**.

## 0. 배경과 확정 기록

| 날짜 | 근거 | 확정 내용 |
|---|---|---|
| 2026-10-14 | 종현 t1582 | 218-7: 「이달의 베스트」 0건이어도 띠·빈 문구를 누르면 빈 팝업(빨강 머리, 빈 문구) |
| 2026-10-15 | 종현 t1595 | (a) 0건 팝업 제목은 방 이름 없이 **「이달의 베스트」**. 글이 있을 때는 지금 제목(「<방 이름> · 이달의 베스트」) 그대로. (b) 베스트 빈 문구는 다른 레일 칸과 같은 **12px / 18px** |

현재(main d032222, 운영 study114.net 로그아웃 확인):
- 0건 팝업 제목이 「학생/학부모 고민방 · 이달의 베스트」. 222는 0건 버튼이 역할의 첫 방(`boardKeys[0]`)으로 팝업을 열도록 했고, 팝업 파일이 제목을 `${label} · 이달의 베스트` 로 만들기 때문(rail-concern-popup.js:172).
- 베스트 빈 문구 16px / 24px, 다른 칸 12px / 18px. 원인: `home-right-rail.css:913-920` `.live-rail-best__open { font: inherit; }` 가 파일 뒤쪽에 있어, 같은 우선순위인 `.live-rail-empty { font-size: var(--fs-12) }`(:360-364)를 덮음. 222 지시서의 잘못(우동공과2)이고 Cursor는 지시대로 했음.

### 팝업 파일을 고쳐야 하는 이유
팝업 제목은 `openConcernRailPopup` 안(`rail-concern-popup.js:172`)에서만 만들어지고, 밖에서 제목을 넘길 길이 없습니다. 방(`boardKey`)을 비우면 172행 전 `:138` 에서 팝업이 아예 안 열리고, 「게시판에서 보기」 주소와 학생 방 제한(`canShowBoardInRail`)도 방 값을 씁니다. 그래서 **방 값은 그대로 두고 표시 하나(`data-concern-best-all`)만 더해** 제목만 바꾸는 것이 가장 작은 변경입니다. 팝업 파일 변경은 3줄(타입 주석 1, 제목 1(+설명 주석 1), 클릭 처리 1)뿐입니다.

## 1. 손대기 전 다시 확인(필수)

`git fetch origin main` 후 origin/main 에서 확인하세요. **다르면 짐작하지 말고 멈춘 뒤 보고**. main 이 `d032222` 보다 앞서 있으면 `git log d032222..origin/main -- <아래 세 파일>` 도 보고(작업 C가 먼저 merge 됐다면 right-rail.js 줄 번호가 +8 밀림: 아래 R1·R2가 502·505 근처. 내용이 같으면 진행).

| # | 파일:줄 (d032222) | 있어야 할 내용 |
|---|---|---|
| R1 | `preview/home-ui/src/right-rail.js:494` | `? `<button type="button" class="live-rail-slot__band live-rail-best__open" data-concern-best-open="${esc(emptyOpenKey)}">${titleHtml}</button>`` |
| R2 | `right-rail.js:497` | `? `<button type="button" class="live-rail-empty live-rail-best__open" data-concern-best-open="${esc(emptyOpenKey)}">${esc(` |
| R3 | `preview/home-ui/src/concern/rail-concern-popup.js:132-133` | ` *   continueInPage?: boolean,` / ` * }} opts` |
| R4 | `rail-concern-popup.js:172` | `title: mode === 'best' ? `${label} · ${COPY.bestTitle}` : label,` |
| R5 | `rail-concern-popup.js:204` | `continueInPage: section.getAttribute('data-concern-rail-leave') === 'inpage',` (onDocumentClick 안) |
| R6 | `preview/home-ui/src/styles/home-right-rail.css:926-929` | `button.live-rail-empty.live-rail-best__open {` / `background: transparent;` / `padding: 0;` / `}` |
| R7 | `concern/copy.js:203` | `bestTitle: '이달의 베스트',` (그대로 사용, 수정 금지) |

## 2. 바꿀 내용(검증한 diff 그대로)

main d032222 worktree 에 임시 적용 → 4모드×3폭×(0건/글 있음) 24칸 측정 → 되돌림. **글자 하나까지 같게** 적용하세요.

```diff
diff --git a/preview/home-ui/src/concern/rail-concern-popup.js b/preview/home-ui/src/concern/rail-concern-popup.js
index e94ba43..9ca529f 100644
--- a/preview/home-ui/src/concern/rail-concern-popup.js
+++ b/preview/home-ui/src/concern/rail-concern-popup.js
@@ -130,6 +130,7 @@ function findOpener(mode, boardKey, postId) {
  *   homeBase: string,
  *   leaveInNewTab: boolean,
  *   continueInPage?: boolean,
+ *   allRooms?: boolean,
  * }} opts
  */
 export function openConcernRailPopup(opts) {
@@ -169,7 +170,8 @@ export function openConcernRailPopup(opts) {
 
   openRailPopup({
     kind: mode === 'best' ? 'concern-best' : 'concern-room',
-    title: mode === 'best' ? `${label} · ${COPY.bestTitle}` : label,
+    // 0건 베스트(방을 고르지 않음)는 방 이름 없이 「이달의 베스트」(종현 t1595, 2026-10-15).
+    title: mode === 'best' ? (opts.allRooms ? COPY.bestTitle : `${label} · ${COPY.bestTitle}`) : label,
     copy: popupCopy(mode === 'best' ? COPY.bestEmpty : COPY.roomEmpty),
     pageSize: CONCERN_POPUP_PAGE_SIZE,
     selectedId: postId,
@@ -202,6 +204,7 @@ function onDocumentClick(e) {
     homeBase: section.getAttribute('data-concern-rail-home') || '',
     leaveInNewTab: section.getAttribute('data-concern-rail-leave') === 'blank',
     continueInPage: section.getAttribute('data-concern-rail-leave') === 'inpage',
+    allRooms: !room && btn.hasAttribute('data-concern-best-all'),
   });
 }
 
diff --git a/preview/home-ui/src/right-rail.js b/preview/home-ui/src/right-rail.js
index e3ab6c8..3635e52 100644
--- a/preview/home-ui/src/right-rail.js
+++ b/preview/home-ui/src/right-rail.js
@@ -491,10 +491,10 @@ function renderBestSection(boardKeys, attrs, liveId) {
   const emptyOpenKey = status === 'ready' && !items.length ? boardKeys[0] || '' : '';
   const titleHtml = `<strong class="live-rail-slot__title">${esc(CONCERN_RAIL_COPY.bestTitle)}</strong>`;
   const band = emptyOpenKey
-    ? `<button type="button" class="live-rail-slot__band live-rail-best__open" data-concern-best-open="${esc(emptyOpenKey)}">${titleHtml}</button>`
+    ? `<button type="button" class="live-rail-slot__band live-rail-best__open" data-concern-best-open="${esc(emptyOpenKey)}" data-concern-best-all>${titleHtml}</button>`
     : `<div class="live-rail-slot__band">${titleHtml}</div>`;
   const body = emptyOpenKey
-    ? `<button type="button" class="live-rail-empty live-rail-best__open" data-concern-best-open="${esc(emptyOpenKey)}">${esc(
+    ? `<button type="button" class="live-rail-empty live-rail-best__open" data-concern-best-open="${esc(emptyOpenKey)}" data-concern-best-all>${esc(
         CONCERN_RAIL_COPY.bestEmpty,
       )}</button>`
     : stateBody ?? `<ul class="live-rail-best__list">${items.map((item) => renderBestItem(item.key, item.post)).join('')}</ul>`;
diff --git a/preview/home-ui/src/styles/home-right-rail.css b/preview/home-ui/src/styles/home-right-rail.css
index 3991c83..5ab607c 100644
--- a/preview/home-ui/src/styles/home-right-rail.css
+++ b/preview/home-ui/src/styles/home-right-rail.css
@@ -926,6 +926,7 @@ button.rail-popup__go {
 button.live-rail-empty.live-rail-best__open {
   background: transparent;
   padding: 0;
+  font-size: var(--fs-12);
 }
 
 .live-rail-best__open:focus-visible {
```

## 3. 허용 파일(이 밖은 한 줄이라도 바꾸면 불합격)

1. `preview/home-ui/src/right-rail.js` — `renderBestSection` 안 0건 버튼 두 줄(R1·R2)에 ` data-concern-best-all` 추가만
2. `preview/home-ui/src/concern/rail-concern-popup.js` — R3·R4·R5 세 곳만(위 diff)
3. `preview/home-ui/src/styles/home-right-rail.css` — R6 규칙에 한 줄만

## 4. 금지

- 작업 C(218-6·218-8) 범위 금지: `concernInPageControl`, `railSlotAnchor`, `communityHubForRole`(245행), `renderLivePostCard`, `renderHotSection`, `concern/copy.js` 전체. 「원장」 문구 어떤 것도 바꾸지 말 것.
- 글 있을 때 팝업 제목·내용, 고민방 배너 팝업(`concern-room`), 빈 문구 내용, `bestTitle` 문구 변경 금지.
- 0건 팝업의 「게시판에서 보기」 주소·학생 방 제한·비회원 동작(제목만 / 로그인 안내)은 지금 그대로(방 값을 계속 넘김).
- 띠 색·띠 크기·초점 링·레일 순서 변경 금지(작업 B 결과 유지). 새 토큰, 디자인 변경, 관련 없는 정리 금지.
- 하위 에이전트는 빠른(fast) 모델 금지. `git add -A`/`git add .` 금지, force-push 금지, 비밀값 커밋 금지. main 에 코드 merge 금지(검수 뒤 종현 승인).

## 5. 작업 C와의 관계·merge 순서

- 겹치는 줄 없음. C는 right-rail.js 124-160·245·415·535 근처와 copy.js:64, B2는 right-rail.js 494·497, 팝업 파일, CSS. 
- 우동공과2 확인: C diff 위에 B2 diff, B2 diff 위에 C diff 둘 다 `git apply --check` 통과(충돌 없음).
- 순서: **C → B2** 권장(C 지시가 먼저 나갔음). 둘 다 origin/main 에서 브랜치를 따고, 나중 것은 merge commit 으로 들어감(rebase·force-push 불필요). B2를 먼저 해도 충돌은 없음.

## 6. 합격 기준 (공부방/과외쌤/학생/비회원 × 1280/1023/390, 0건·글 있음 = 24칸)

| 경우 | 항목 | 기준 |
|---|---|---|
| 공통 | 띠 | `rgb(190, 18, 60)`, 흰 글자, 맨 위, 위치·크기와 레일 순서가 main 과 같음, 고민방 띠 보라 그대로 |
| 공통 | 팝업 머리띠 | `concern-best`, `rgb(190, 18, 60)` |
| 0건 | 팝업 제목(`.rail-popup__title`) | 정확히 **「이달의 베스트」**(띠 클릭, 빈 문구 Enter, 띠 Space 모두) |
| 0건 | 「게시판에서 보기」 | 지금과 같음: 공부방 `#/community/director`, 과외쌤 `#/community/tutor`, 학생·비회원 `#/community/parent` |
| 0건 | 빈 문구 글자 | font-size **12px**, line-height **18px**, weight 400 — 고민방 칸 빈 문구와 같은 값 |
| 0건 | 초점 | Esc 뒤 띠 버튼으로 돌아옴 |
| 글 있음 | 팝업 제목 | 「<방 이름> · 이달의 베스트」, 제목·「게시판에서 보기」 주소가 main 과 같음 |

우동공과2 측정: **24/24 통과**. main 은 0건 제목 「학생/학부모 고민방 · 이달의 베스트」(비회원), 빈 문구 16px / 24px. 그림 `png/225-B2-after-empty-popup-1280-studyroom.png`.

## 7. 측정 스크립트

`225-measure-B2.py`(측정) + `225-judge-B2.py`(판정). 사용:
```
cd preview/home-ui && npx vite --port 5183 --host 127.0.0.1   # 브랜치
(main worktree) npx vite --port 5184 --host 127.0.0.1
python3 225-measure-B2.py 5183 && python3 225-measure-B2.py 5184
python3 225-judge-B2.py /tmp/b2-5183.json /tmp/b2-5184.json   # 기대: 24/24 PASS []
```

```python
import json,sys
from playwright.sync_api import sync_playwright
C=[('비회원',None,'/guest'),('공부방','study_room_owner','/study-room'),('과외쌤','tutor','/tutor'),('학생','guardian_student','/parent')]
def post(i,bk,r=9): return {'id':str(i),'title':f'베스트글{i}','board_key':bk,'boardKey':bk,'reaction_total':r,'reactionTotal':r,'created_at':'2026-10-01'}
def hot(route,req,mode):
  u=req.url
  if 'view=best' in u:
    b={} if mode=='empty' else None
    if b is None: b= {'concern-director':[post(1,'concern-director')],'concern-tutor':[post(2,'concern-tutor')],'concern-parent':[post(3,'concern-parent')]}
    body={'ok':True,'boards':b}
  else: body={'ok':True,'posts':[]}
  route.fulfill(status=200,content_type='application/json',body=json.dumps(body))
INFO='''()=>{const s=document.querySelector('.live-rail-slot--best');if(!s)return null;const b=s.querySelector('.live-rail-slot__band');const r=b.getBoundingClientRect();
const t=s.querySelector('.live-rail-slot__title');const first=document.querySelector('[data-right-rail-slot] .live-rail-slot');
return {tag:b.tagName,bg:getComputedStyle(b).backgroundColor,fg:getComputedStyle(t).color,band:[Math.round(r.x),Math.round(r.width),Math.round(r.height)],
first:first===s,state:s.dataset.railState,openKeys:[...s.querySelectorAll('[data-concern-best-open]')].map(e=>e.dataset.concernBestOpen),
emptyFont:(()=>{const e=s.querySelector('.live-rail-empty');if(!e)return null;const c=getComputedStyle(e);return [c.fontSize,c.lineHeight,c.fontWeight]})(),
roomEmptyFont:(()=>{const e=document.querySelector('.live-rail-slot--room .live-rail-empty');if(!e)return null;const c=getComputedStyle(e);return [c.fontSize,c.lineHeight,c.fontWeight]})(),
rooms:[...document.querySelectorAll('.live-rail-slot--room .live-rail-slot__band')].map(e=>getComputedStyle(e).backgroundColor),
order:[...document.querySelectorAll('[data-right-rail-slot] .live-rail-slot')].map(e=>e.className.replace(/live-rail-slot /,'')).join('|')}}'''
POP='''()=>{const p=document.querySelector('.rail-popup');if(!p)return null;const h=p.querySelector('.rail-popup__head');
return {kind:p.dataset.railPopupKind,bg:h?getComputedStyle(h).backgroundColor:null,title:(p.querySelector('.rail-popup__title,h2')||{}).textContent,go:(p.querySelector('.rail-popup__go')||{}).getAttribute?.('href'),text:p.innerText.slice(0,160).replace(/\\n/g,' / ')}}'''
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
          if w==1280 and n=='공부방': pg.screenshot(path=f'/tmp/b2-{port}-{mode}.png')
          pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
          if mode=='empty':
            d['focusBack']=pg.evaluate("document.activeElement&&document.activeElement.className")
            e2=pg.locator('.live-rail-slot--best button.live-rail-empty')
            if e2.count(): e2.first.focus(); pg.keyboard.press('Enter'); pg.wait_for_timeout(800); d['enter']=pg.evaluate(POP); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
            b=pg.locator('.live-rail-slot--best .live-rail-slot__band')
            b.first.focus(); pg.keyboard.press(' '); pg.wait_for_timeout(800); d['space']=pg.evaluate(POP)
        res[f'{mode}|{w}|{n}']=d; ctx.close()
  br.close()
json.dump(res,open(f'/tmp/b2-{port}.json','w'),ensure_ascii=False,indent=0)
for k,v in res.items(): print(k,json.dumps(v,ensure_ascii=False)[:420])
```

```python
# 225 판정: python3 225-judge-B2.py /tmp/b2-<브랜치>.json /tmp/b2-<main>.json
import json,sys
a=json.load(open(sys.argv[1]));b=json.load(open(sys.argv[2]))
room={'공부방':'공부방 고민방','과외쌤':'과외쌤 고민방','학생':'학생/학부모 고민방','비회원':'학생/학부모 고민방'}
go={'공부방':'#/community/director','과외쌤':'#/community/tutor','학생':'#/community/parent','비회원':'#/community/parent'}
ok=0;bad=[]
for k,v in a.items():
  m,w,n=k.split('|');r=v['rail'];y=b[k]['rail'];p=v.get('pop') or {}
  c={'bg':r['bg']=='rgb(190, 18, 60)','fg':r['fg']=='rgb(255, 255, 255)','first':r['first'],'band':r['band']==y['band'],'order':r['order']==y['order'],
     'rooms':r['rooms']==y['rooms'],'popbg':p.get('bg')=='rgb(190, 18, 60)','kind':p.get('kind')=='concern-best'}
  if m=='empty':
    c['title']=(p.get('title') or '').strip()=='이달의 베스트'
    c['go']=p.get('go')==go[n]
    c['font']=r['emptyFont']==['12px','18px','400'] and r['emptyFont']==r['roomEmptyFont']
    for x in ('enter','space'): c[x]=((v.get(x) or {}).get('title') or '').strip()=='이달의 베스트'
    c['focus']='live-rail-best__open' in (v.get('focusBack') or '')
  else:
    c['title']=(p.get('title') or '').strip()==f'{room[n]} · 이달의 베스트'
    c['same']=(p.get('title'),p.get('go'))==((b[k].get('pop') or {}).get('title'),(b[k].get('pop') or {}).get('go'))
  if all(c.values()): ok+=1
  else: bad.append((k,[x for x,t in c.items() if not t]))
print(f'{ok}/{len(a)} PASS',bad)
```

## 8. 진행 순서

1. `git fetch origin main` → 1절 확인(다르면 멈추고 보고).
2. `git switch -c cursor/home-b2-best-fix-20261015 origin/main`
3. 2절 diff 적용 → `git add preview/home-ui/src/right-rail.js preview/home-ui/src/concern/rail-concern-popup.js preview/home-ui/src/styles/home-right-rail.css`
4. 커밋: `fix(rail): 이달의 베스트 0건 팝업 제목·빈 문구 글자 (218-7 보완, 종현 t1595 2026-10-15)`
5. 6절 측정(브랜치·main), 그림(0건 팝업 1280·390, 글 있음 팝업 1280, 레일 빈 문구 확대 1280).
6. `git push origin cursor/home-b2-best-fix-20261015` (브랜치만).
7. **작업 기록은 main 에 바로 커밋**(문서만, 파일 이름으로 add):
   - `docs/worklog/2026/10/2026-10-15-home-b2-report.md` — 브랜치, 커밋 해시, 바뀐 파일·줄, 24칸 결과표와 판정 출력, 그림 경로(`docs/worklog/2026/10/img/2026-10-15-home-b2-*.png`), 지시와 다른 점, 확인 못 한 것.
   - `docs/worklog/2026/10/2026-10-10-work-queue.md` 한 줄: `- 2026-10-15 작업 B2(218-7 보완) 브랜치 cursor/home-b2-best-fix-20261015 <해시> push, 검수 대기`
8. 답장: 보고서 경로, 브랜치 커밋 해시, main 기록 커밋 해시.
