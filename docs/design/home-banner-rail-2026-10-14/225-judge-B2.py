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
