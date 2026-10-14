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
