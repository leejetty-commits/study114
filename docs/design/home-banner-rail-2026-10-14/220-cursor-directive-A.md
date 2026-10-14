# 220 · Cursor 작업지시 — 작업 A: 홍보 화면 3칸 유지 + 홈 상단 여백 8px 통일 (2026-10-14)

> 이 문서만 보고 작업할 수 있게 썼다. 대화 기록은 없다고 가정한다.
> 작성: 우동공과2(개발팀장) · 기준 커밋: `origin/main` @ `00ae04e`

## 0. 한 줄 요약
1. 홍보 화면(`#/promo/study-room`, `#/promo/tutor`, `#/promo/parent`)에도 홈 상단 홍보 3칸(공부방 카탈로그 / 과외쌤 카탈로그 / 우리동네 학생)을 그대로 보이게 한다. 대상은 모든 모드다.
2. 홈 상단 세로 여백 두 곳(3칸→공지 박스, 공지 박스→「우리동네 공부방 | 우리동네 학생」 탭)을 모든 모드에서 **8px**로 맞춘다. 비회원 홈의 3칸 아래도 20→8px로 바꾼다.

## 1. 배경과 결정 기록
- 2026-10-14 종현 **t1578**: 처음 요청. 홍보 3칸을 누르면 홍보 화면에서 3칸이 사라지니 유지할 것. 3칸↔공지 간격과 공지↔탭 간격을 줄이고 모드끼리 맞출 것.
- 2026-10-14 종현 **t1581**: 비회원 홈 3칸 아래 20→8px **승인**. 218-1은 이때 조건부(쉬우면 진행, 어려우면 취소)였다.
- 2026-10-14 종현 **t1582**: 218-1 **확정·진행**.
- 근거 문서: `docs/design/home-banner-rail-2026-10-14/218-home-banner-gap-best-red-work-order.md`
  - 이번 작업은 그 문서의 **218-1, 218-2, 218-3만** 한다.
  - 218-4(베스트 빨강), 218-5(매뉴얼), 218-6(홈 HOT 팝업), 218-7(베스트 0건 팝업), 218-8(원장 문구)은 **이번 작업에서 금지**다. 별도 작업으로 나간다.

## 2. 먼저 할 일: 현재 main에서 행 번호 다시 확인
```bash
git fetch origin main
git switch -c cursor/home-a-banner-gap-20261014 origin/main
git log -1 --format=%h   # 00ae04e 또는 그 뒤여야 함
```
아래 항목이 **그대로 있는지** 확인한다. 행이 바뀌었거나 내용이 다르면 **고치지 말고 멈춰서 보고**한다. 짐작해서 고치지 않는다.

| 파일 | 행 | 있어야 하는 내용 |
|---|---|---|
| `preview/home-ui/src/promo/shell.js` | 8 | `import { STUDY_ROOM_PROMO } from './study-room-content.js';` |
| 같은 파일 | 11 | `const role = getNavRole();` |
| 같은 파일 | 16-17 | ``const mainHtml = ` `` 다음 줄 `<div class="promo-layout">` |
| `preview/home-ui/src/styles/home-marketing-banner.css` | 117-122 | `.home-promo-trio { … margin: 0 0 var(--space-5, 1.25rem); }` (margin은 121행) |
| 같은 파일 | 202-207 | `.home-news-row { … margin: 0 0 var(--space-5, 1.25rem); }` — **이번에 손대지 않음** |
| 같은 파일 | 337-340 | `.home-mkt-wrap { position: relative; margin-bottom: var(--space-5, 1.25rem); }` (339행) |
| 같은 파일 | 342-344 | `.home-mkt-wrap .home-promo-trio { margin-bottom: 0; }` (343행) |

참고로 원인이 되는 코드 위치는 아래와 같다(읽기만 하고 수정 금지).
- 3칸을 그리는 곳: `preview/home-ui/src/home-marketing-banner.js:203-249`(`HOME_PROMO_TRIO`, `renderHomePromoTrio`, `renderHomeMarketingBanner`). surface가 `guest|parent|study_room|tutor`이면 3칸을 그린다.
- 3칸을 넣는 화면은 역할 홈 4개뿐이다: `screens/study-room.js:147`, `screens/tutor.js:143`, `screens/parent.js:29`, `screens/guest.js:40`.
- 홍보 화면 `promo/shell.js:10-36`의 `renderPromoShell`에는 3칸 호출이 없다. CSS로 숨긴 게 아니라 **아예 그리지 않는다**.
- 공부방 홈만 `<div class="home-mkt-wrap">`로 감싸져 있다(`screens/study-room.js:146-149`). 그래서 3칸 아래가 0px이고, 과외쌤·학생 홈은 20px이다.

## 3. 바꿀 것 (정확히, 로컬에서 검증한 diff)

### 3-1. 218-1 — `preview/home-ui/src/promo/shell.js`
```diff
@@ -8,1 +8,2 @@
 import { STUDY_ROOM_PROMO } from './study-room-content.js';
+import { renderHomeMarketingBanner } from '../home-marketing-banner.js';
@@ -16,2 +17,3 @@
   const mainHtml = `
+    ${renderHomeMarketingBanner(role)}
     <div class="promo-layout">
```
- `role`은 11행 `getNavRole()`이다. 홍보 화면에서는 `guest|study_room|tutor|parent`만 돌려주므로 항상 3칸이 그려진다.
- 카드를 누르면 기존 `bindPromoShellEvents`의 `[data-nav]` 처리로 이동한다. 이벤트 코드는 추가하지 않는다.

### 3-2. 218-2·3 — `preview/home-ui/src/styles/home-marketing-banner.css`
```diff
@@ .home-promo-trio (121행)
-  margin: 0 0 var(--space-5, 1.25rem);
+  margin: 0 0 var(--space-2, 0.5rem);
@@ .home-mkt-wrap (339행)
-  margin-bottom: var(--space-5, 1.25rem);
+  margin-bottom: var(--space-2, 0.5rem);
 }
+
+.home-news-row:has(+ .provider-home-tabs) {
+  margin-bottom: var(--space-2, 0.5rem);
+}
@@ .home-mkt-wrap .home-promo-trio (343행)
-  margin-bottom: 0;
+  margin-bottom: var(--space-2, 0.5rem);
```
- 8px를 고른 규칙: 지금 공지→탭 간격 20px의 1/3은 6.67px이다. 이를 디자인 토큰 계단(`tokens.css` `--space-1` 4 · `--space-2` 8 · `--space-3` 12 …)에서 가장 가까운 값으로 올리면 `--space-2` = 8px이다.
- `.home-news-row` 기본 margin(206행)은 바꾸지 않는다. 탭 바로 앞의 공지 줄에만 `:has(+ .provider-home-tabs)`를 적용한다. 그래서 비회원 홈의 공지 아래 여백(탭 없음)은 20px 그대로다.
- `screens/*.js` 마크업은 바꾸지 않는다(공부방만 `home-mkt-wrap`인 구조를 이번에 정리하지 않는다).

## 4. 허용 파일 (이 2개 말고 다른 파일을 바꾸면 불합격)
- `preview/home-ui/src/promo/shell.js`
- `preview/home-ui/src/styles/home-marketing-banner.css`

예외로 바꿀 수 있는 파일은 아래 7절의 작업 기록 문서 2개뿐이다(main에 직접).

## 5. 금지
- 재디자인 금지: 카드 모양·글자·색·높이를 바꾸지 않는다. 이 지시서에 적힌 값만 바꾼다.
- 관련 없는 정리 금지: 리팩터, 주석·포맷 정리, 이름 변경.
- 기능 추가 금지: 지금 보는 홍보 카드 강조(active 표시), 애니메이션, 새 문구 모두 넣지 않는다.
- 우측 레일, 그리고 218-4~218-8 등 다른 티켓 내용은 바꾸지 않는다.
- 화면에 개발 용어를 노출하지 않는다. 화면 문구는 바꾸지 않는다.
- `git add -A` / `git add .` 금지. 허용 파일만 경로를 지정해서 add 한다.
- force-push 금지. main 직접 수정 금지(작업 기록 문서는 예외, 7절).
- 비밀값(키·토큰·비밀번호·.env)을 커밋하지 않는다. 커밋 전에 `git diff --cached`로 확인한다.
- 하위 에이전트를 쓸 경우 **빠른(fast) 모델은 절대 쓰지 않는다.**

## 6. 합격 기준

### 6-1. 측정 방법
- 로컬: `cd preview/home-ui && npm ci && npx vite --port 5179`
- 역할 화면은 playwright에서 `/api/auth/me.php` 응답을 흉내 내서 연다. role_type은 아래 값을 쓴다.
  - 공부방: `study_room_owner`, 경로 `#/study-room`
  - 과외쌤: `tutor`, 경로 `#/tutor`
  - 학생: `guardian_student`, 경로 `#/parent`
  - 비회원: 흉내 없이 `#/guest`
```python
import json
from playwright.sync_api import sync_playwright
JS = '''()=>{const r=s=>{const e=document.querySelector(s);return e?e.getBoundingClientRect():null};
const t=r('.home-promo-trio'),n=r('.home-news-row'),b=r('.provider-home-tabs');
return {trioCount:document.querySelectorAll('.home-promo-trio').length,
 cards:document.querySelectorAll('.home-promo-trio__card').length,
 gap1:t&&n?Math.round(n.top-t.bottom):null, gap2:n&&b?Math.round(b.top-n.bottom):null,
 rail:[...document.querySelectorAll('[data-right-rail-slot] .live-rail-slot')].map(s=>s.className).join('|')}}'''
CASES=[('guest',None,'/guest'),('공부방','study_room_owner','/study-room'),('과외쌤','tutor','/tutor'),('학생','guardian_student','/parent')]
PROMO=['/promo/study-room','/promo/tutor','/promo/parent']
with sync_playwright() as p:
  br=p.chromium.launch()
  for w in (1280,1023,390):
    for name,rt,home in CASES:
      for path in [home]+PROMO:
        ctx=br.new_context(viewport={'width':w,'height':1000}); pg=ctx.new_page()
        if rt: pg.route('**/api/auth/me.php',lambda route,req,rt=rt: route.fulfill(status=200,content_type='application/json',
          body=json.dumps({'ok':True,'authenticated':True,'email_verified':True,'role_type':rt,'user_id':1,'email':'t@t','name':'t','phone_verified':True})))
        pg.goto('http://127.0.0.1:5179/#'+path); pg.wait_for_timeout(1500)
        print(w,name,path,pg.evaluate(JS)); ctx.close()
  br.close()
```
- gap1 = 3칸 → 공지(`news.top − trio.bottom`), gap2 = 공지 → 탭(`tabs.top − news.bottom`). 허용 오차 ±1px.
- 레일이 그대로인지는 같은 스크립트를 **변경 전**(origin/main)과 **변경 후**에 돌려 `rail` 문자열을 비교한다.

### 6-2. 기준표 (변경 전 → 변경 후, 우동공과2가 로컬에서 실측한 값)
| 모드 | 폭 | gap1 전 → 후 | gap2 전 → 후 | 홍보 화면 ×3 |
|---|---|---|---|---|
| 공부방 | 1280 | 0 → **8** | 20 → **8** | 3칸 1줄(카드 3장) |
| 공부방 | 1023 | 0 → **8** | 20 → **8** | 같음 |
| 공부방 | 390 | 0 → **8** | 20 → **8** | 같음(1열로 쌓임) |
| 과외쌤 | 1280 | 20 → **8** | 20 → **8** | 같음 |
| 과외쌤 | 1023 | 20 → **8** | 20 → **8** | 같음 |
| 과외쌤 | 390 | 20 → **8** | 20 → **8** | 같음 |
| 학생 | 1280 | 20 → **8** | 20 → **8** | 같음 |
| 학생 | 1023 | 20 → **8** | 20 → **8** | 같음 |
| 학생 | 390 | 20 → **8** | 20 → **8** | 같음 |
| 비회원 | 1280 / 1023 / 390 | 20 → **8** | 탭 없음 (공지 아래 20 유지) | 같음 |

공통 기준:
- 모든 화면에서 `trioCount` = 1이다. 같은 줄이 두 번 나오면 안 된다. `cards` = 3이고, 순서는 공부방 카탈로그 → 과외쌤 카탈로그 → 우리동네 학생이다.
- 홍보 화면에서 다른 카드를 누르면 해당 `#/promo/*`로 이동하고, 3칸이 계속 보여야 한다.
- 우측 레일 `rail` 문자열은 변경 전과 같아야 한다(홈 4모드, 홍보 3화면).
- 3칸·공지 박스·탭 자체의 높이·글자·색은 바뀌지 않아야 한다. 3칸 카드 사이 가로 간격 12px도 그대로다.
- 콘솔 오류가 새로 생기지 않아야 한다.
- 스크린샷: 공부방·과외쌤·학생·비회원 홈 1280과 390, 홍보 화면 3개 1280. 저장 위치는 `docs/worklog/2026/10/img/2026-10-14-home-a/`이다.

## 7. 진행 순서와 기록 (필수)
1. 브랜치 `cursor/home-a-banner-gap-20261014`(origin/main 기준)에서 위 2개 파일만 수정한다.
2. `git add preview/home-ui/src/promo/shell.js preview/home-ui/src/styles/home-marketing-banner.css`로 add 하고 `git diff --cached`로 확인한 뒤 commit 한다.
   - 메시지: `fix(home): 홍보 화면 3칸 유지 + 홈 상단 여백 8px 통일 (218-1·2·3, 종현 t1582)`
3. `git push origin cursor/home-a-banner-gap-20261014`. **main에는 merge 하지 않는다.** 우동공과2가 검수하고 종현이 승인한 뒤에 merge 한다.
4. **작업 기록은 main에 직접 commit·push 한다**(문서는 main으로 바로).
   - 새 파일 `docs/worklog/2026/10/2026-10-14-home-a-report.md`에 넣을 것: 브랜치 이름, 커밋 해시, 바꾼 파일과 행, 6-2 표를 **직접 잰 값**으로 채운 전/후 px 표, 레일 비교 결과, 스크린샷 경로, 지시와 다르게 한 점, 확인하지 못한 항목.
   - 스크린샷 파일은 브랜치 쪽 커밋에 넣거나 리포트와 함께 main에 넣는다(경로는 리포트에 적는다).
   - `docs/worklog/2026/10/2026-10-10-work-queue.md` 맨 끝에 한 줄 추가: `- 2026-10-14 작업 A(218-1·2·3) — 브랜치 cursor/home-a-banner-gap-20261014 @ <해시> · 리포트 docs/worklog/2026/10/2026-10-14-home-a-report.md · 상태: 검수 대기`
   - main에 add 할 때도 경로를 지정한다. `git add -A`는 쓰지 않는다.
5. 답장에 쓸 것: 리포트 경로, 브랜치 커밋 해시, main 기록 커밋 해시, 측정 표 요약.

## 8. 멈추고 보고해야 하는 경우
- 2절의 행·내용이 다를 때.
- 허용 파일 2개만으로는 기준을 맞출 수 없을 때. 다른 파일은 고치지 말고 이유를 보고한다.
- `:has()` 규칙이 적용되지 않는 등 측정값이 기준과 다를 때. 값과 원인을 보고한다.
