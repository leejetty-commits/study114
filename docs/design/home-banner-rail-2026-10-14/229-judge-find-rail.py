# 229 판정(227 판정 + libold·six): python3 227-judge-find-rail.py /tmp/fr-<브랜치>-<경우>.json /tmp/fr-<main>-default.json [default|old|removed|libold|six]   기대: 경우마다 24/24 PASS []
import json,sys
a=json.load(open(sys.argv[1]));b=json.load(open(sys.argv[2]))
D,T,P='concern-director','concern-tutor','concern-parent'
scen=sys.argv[3] if len(sys.argv)>3 else 'default'
FIND={'default':{'공부방':[D,T,P],'과외쌤':[T,D,P],'학생':[P],'비회원':[P,D,T]},
      'old':{'공부방':[P],'과외쌤':[P],'학생':[P],'비회원':[P]},
      'removed':{'공부방':[D,P],'과외쌤':[D,P],'학생':[P],'비회원':[P,D]},
      'libold':{'공부방':[],'과외쌤':[],'학생':[],'비회원':[]},
      'six':{'공부방':[D,T,P],'과외쌤':[T,D,P],'학생':[P],'비회원':[P,D,T]}}[scen]
BAIT=('미끼작성자','미끼본문내용')
DEV=('concern-','undefined','null','NaN','search_right_rail','intro_only','board_key','sourceBoardKeys')
ok=0;bad=[]
for k,v in a.items():
  s,w,n=k.split('|');r=v['rail'] or {};y=(b[k]['rail'] or {});c={}
  if s=='find':
    c['rooms']=r.get('rooms')==FIND[n]
    c['best']=r.get('best')==FIND[n]
    own={'공부방':D,'과외쌤':T}.get(n,P)
    c['own_first']=(not FIND[n]) or (bool(r.get('rooms')) and (r['rooms'][0]==own or own not in FIND[n]))
    nr=lambda o:[x for x in (o or '').split('|') if x!='live-rail-slot--room']
    want=nr(y.get('order')) if FIND[n] else [x for x in nr(y.get('order')) if x not in ('live-rail-slot--best','live-rail-slot--field')]  # 고민방이 하나도 없으면 베스트·현장 층도 없음
    c['order']=nr(r.get('order'))==want   # 고민방 칸 말고 나머지 칸 순서는 main 과 같음
    c['room_slots']=(r.get('order') or '').split('|').count('live-rail-slot--room')==len(FIND[n])
    p=v.get('pop') or {}
    c['pop']=bool(p) or not FIND[n]
    if n=='비회원':
      txt=(r.get('text') or '')+(p.get('text') or '')
      c['no_author']=BAIT[0] not in txt
      c['no_body']=BAIT[1] not in txt and not p.get('body')
  else:   # 홈: main 과 완전히 같아야 함
    c['home_same']=(r.get('rooms'),r.get('best'),r.get('order'))==(y.get('rooms'),y.get('best'),y.get('order'))
    c['home_text']=r.get('text')==y.get('text')
  txt=(r.get('text') or '')
  c['no_dev']=not any(t in txt+((v.get('pop') or {}).get('text') or '') for t in DEV)
  if all(c.values()): ok+=1
  else: bad.append((k,[x for x,t in c.items() if not t]))
print(f'{ok}/{len(a)} PASS',bad)
