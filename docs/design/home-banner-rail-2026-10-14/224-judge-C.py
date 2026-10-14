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
