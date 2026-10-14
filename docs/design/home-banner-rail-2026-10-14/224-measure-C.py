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
