# 227 측정: python3 227-measure-find-rail.py <home-ui 포트> <search-ui 포트> [default|old|removed]  → /tmp/fr-<home포트>-<경우>.json
# 경우: default = 저장 목록 없음(화면 기본값 = 081 뒤 DB 값과 같은 세 방), old = 저장 목록이 옛 값(학생/학부모 방만),
#       removed = 운영자가 과외쌤 방을 뺀 목록. 저장 목록은 관리 화면 저장값과 같은 길(sessionStorage 덮어쓰기)로 넣는다.
# 찾기 화면·홈 레일 × 4모드 × 3폭. 서버는 흉내(비회원 응답은 access=titles 이지만 작성자·본문 미끼를 일부러 넣음).
import json,sys
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
C=[('비회원',None,'/guest','/search/room'),('공부방','study_room_owner','/study-room','/search/student'),
   ('과외쌤','tutor','/tutor','/search/student'),('학생','guardian_student','/parent','/search/tutor')]
BK=['concern-director','concern-tutor','concern-parent']
NM={'concern-director':'공방','concern-tutor':'쌤방','concern-parent':'학방'}
BAIT_A='미끼작성자';BAIT_B='미끼본문내용'
def post(i,bk,guest):
  p={'id':str(i),'title':f'{NM[bk]} 글{i}','boardKey':bk,'board_key':bk,'reactionTotal':9,'reaction_total':9,'commentCount':1,'createdAt':'2026-10-01',
     'authorDisplayName':BAIT_A,'description':BAIT_B}
  if not guest: p['_numericId']=i
  return p
def api(route,req,guest):
  u=req.url;q=parse_qs(urlparse(u).query);acc='titles' if guest else 'full'
  pk=(q.get('post_key') or [None])[0]
  if pk and 'posts.php' in u:
    bk=(q.get('board_key') or q.get('board') or ['concern-parent'])[0]
    x=post(1,bk,guest);x['id']=pk;body={'ok':True,'access':acc,'posts':[x],'total':1}
  elif 'view=best' in u: body={'ok':True,'access':acc,'boards':{bk:[post(10+n,bk,guest)] for n,bk in enumerate(BK)}}
  else:
    bk=(q.get('board') or q.get('board_key') or q.get('type') or [None])[0]
    keys=[bk] if bk in BK else BK
    body={'ok':True,'access':acc,'posts':[post(20+n,k,guest) for n,k in enumerate(keys)],'total':len(keys)}
  route.fulfill(status=200,content_type='application/json',body=json.dumps(body,ensure_ascii=False))
INFO='''()=>{const r=document.querySelector('[data-right-rail-slot]')||document.querySelector('.right-rail');if(!r)return null;
const vis=e=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0};
return {rooms:[...r.querySelectorAll('[data-rail-room]')].filter(vis).map(e=>e.dataset.railRoom),
best:[...r.querySelectorAll('.live-rail-best__item')].filter(vis).map(e=>e.dataset.concernBestOpen),
order:[...r.querySelectorAll('.live-rail-slot')].map(e=>e.className.replace(/live-rail-slot /,'')).join('|'),
text:r.innerText}}'''
POP='''()=>{const p=document.querySelector('.rail-popup');if(!p)return null;return {text:p.innerText,body:!!p.querySelector('.rail-popup__body'),guest:!!p.querySelector('.rail-popup__guest')}}'''
port,sport=sys.argv[1],sys.argv[2];scen=sys.argv[3] if len(sys.argv)>3 else 'default';res={}
STORED={'old':['faq','concern-parent','safe-guide'],'removed':['faq','concern-director','concern-parent','safe-guide']}
INIT=None
if scen in STORED:
  INIT="sessionStorage.setItem('study114-right-rail-slot-definitions-v1',JSON.stringify([{slotKey:'search_right_rail',sourceBoardKey:'faq',sourceBoardKeys:%s}]))"%json.dumps(STORED[scen])
with sync_playwright() as p:
  br=p.chromium.launch()
  for screen in ('find','home'):
    for w in (1280,1023,390):
      for n,rt,home,find in C:
        ctx=br.new_context(viewport={'width':w,'height':1100});pg=ctx.new_page()
        if INIT: pg.add_init_script(INIT)
        if rt: pg.route('**/api/auth/me.php',lambda route,req,rt=rt: route.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'authenticated':True,'email_verified':True,'role_type':rt,'user_id':1,'email':'t@t','name':'t','phone_verified':True})))
        g=rt is None
        pg.route('**/api/board/concern-hot.php*',lambda route,req,g=g: api(route,req,g))
        pg.route('**/api/board/posts.php*',lambda route,req,g=g: api(route,req,g))
        pg.goto((f'http://127.0.0.1:{sport}/#'+find) if screen=='find' else (f'http://127.0.0.1:{port}/#'+home));pg.wait_for_timeout(2200)
        d={'rail':pg.evaluate(INFO)}
        if screen=='find':
          el=pg.locator('.live-rail-best__item').first
          if el.count():
            el.scroll_into_view_if_needed();el.click(force=True);pg.wait_for_timeout(1000);d['pop']=pg.evaluate(POP)
            if w==1280: pg.screenshot(path=f'/tmp/fr-{port}-{scen}-{n}.png')
        if d['rail']: d['rail']['text']=d['rail']['text'][:600]
        res[f'{screen}|{w}|{n}']=d;ctx.close()
  br.close()
json.dump(res,open(f'/tmp/fr-{port}-{scen}.json','w'),ensure_ascii=False,indent=0)
for k,v in res.items(): print(k,json.dumps({'rooms':(v['rail'] or {}).get('rooms'),'best':(v['rail'] or {}).get('best'),'pop':bool(v.get('pop'))},ensure_ascii=False))
