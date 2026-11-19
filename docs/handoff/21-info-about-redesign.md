# 21 — 푸터 「서비스 소개」를 /info/로 모으고 디자인하기 — Cursor 작업 지시서

- 작성: 2026-11-19 13:50 (KST) · 우동공과3
- 코드 기준: `origin/main` **497cdd35** (PR #272 머지). 0단계에서 `git fetch` 후 다시 확인한다.
- 종현 승인: 2026-11-19 「푸터 서비스 소개 페이지 디자인 재구성」+ 「초기 홈 로딩속도에 영향을 끼치지 않는 방향으로 진행해」.
- 원칙: **홈 첫 방문이 받는 파일·요청 수를 늘리거나 바꾸지 않는다.** 소개 페이지는 정적 `/info/`만 꾸민다.

---

## 왜 하는가

지금 푸터 「서비스 소개」는 `#/about`(`preview/home-ui/src/about.js`)으로 간다. 문장 세 줄이고, 검색엔진이 해시 주소를 잘 읽지 못한다. 같은 내용이 더 길게 들어 있는 정적 페이지 `public/info/`(소개·공부방·과외쌤·학생 안내 4장)가 이미 있으나, 기본 글꼴과 파란 링크만 있다.

**하는 일:** `/info/` 네 장을 사이트 색으로 다시 짜고, 푸터 링크와 `#/about`을 `/info/`로 보낸다. 포트원 심사 때 쓴 `#/about` 주소는 계속 살아 있게 한다.

**하지 않는 것:** 홈 묶음(bundle)에 폰트·이미지·JS·CSS를 새로 넣기, 홈 진입 파일에 import 추가, 홈에서 `/info/`나 about 청크를 prefetch 하기, 지도 늦게 띄우기, 요금 노출, 회원 수 같은 숫자를 새로 쓰기.

---

## 확인된 사실 (origin/main 497cdd35)

### 푸터 링크는 지금 전부 해시 이동이다

- `preview/shared/site-footer.js:38` `{ path: '/about', label: '서비스 소개' }`.
- `renderSiteFooter`의 `link()`(141–153행)는 두 갈래뿐이다.
  - `linkMode: 'hash'`(홈, `preview/home-ui/src/layout.js:303`): `<a href="#${item.path}" data-nav="${item.path}">`. 클릭은 `layout.js:524–536`이 `preventDefault()` 한 뒤 `navigate(target)`로 해시만 바꾼다.
  - `linkMode: 'absolute'`(가입·찾기·공부방등록·과외쌤등록): `<a href="${homeBase}/#${item.path}" data-util-href="…">`. 클릭은 `preview/shared/site-chrome.js:278–283`가 `preventDefault()` 한 뒤 `goSameTab`으로 그 주소로 간다.
- **정적 경로(`/info/`)를 넣는 칸은 없다.** `path`만 `/info/`로 바꾸면 홈에서는 `#/info/`+`data-nav="/info/"`가 되어 SPA가 가로채고, 다른 앱에서는 `https://…/#/info/`가 된다. 둘 다 틀리다.
- 필요한 최소 수정: 항목에 `href: '/info/'` 같은 **일반 주소 칸**을 두고, `link()` 맨 앞에서 `data-nav`·`data-util-href` 없이 `<a href="/info/">`만 출력한다. hash·absolute 모두 같은 상대 주소 `/info/`를 쓴다(운영은 같은 출처라 가입·찾기·등록 화면에서도 열림).
- PHP 짝: `src/Site/SiteFooterCopy.php:8` 주석이 site-footer.js와 값을 같게 유지하라고 한다. `policyLinks()` 55행이 `['href' => '/#/about', 'label' => '서비스 소개']`. 이 값은 `src/Views/partials/site-footer-legal.php:8,74–77`가 그대로 출력한다. PHP 쪽은 홈 묶음과 무관하다. 같이 고치지 않으면 PHP 인증 화면 푸터는 `#/about`으로 갔다가 about.js가 다시 `/info/`로 보낸다(동작은 됨, 한 번 더 이동).

### `#/about` 라우터

- `preview/home-ui/src/main.js:114` `const loadAboutScreen = () => import('./about.js');` — **동적 import**. 홈 첫 방문 그래프에 넣지 않는다. prefetch도 추가하지 않는다.
- 같은 파일 374–381행: `isAboutRoute()`이면 `loadRouteModule(app, loadAboutScreen)` 후 `renderAbout()`·`bindAboutEvents`. `loadRouteModule`(179–188행)은 앱이 비어 있을 때만 「불러오는 중」을 그린다(`paintRouteLoading`, 135–137행). 홈에서 푸터를 누르면 홈 화면이 유지된 채 청크를 받은 뒤 이동한다. 주소창에 `#/about`으로 바로 들어오면 잠깐 「불러오는 중」이 보일 수 있다.
- `preview/home-ui/src/state.js:216–228` `isAboutRoute()`는 해시가 `/about`일 때 참. `bootstrapAboutRoute()`는 해시 없이 pathname이 `/about` 또는 `/about/`이면 `${origin}/${search}#/about`으로 바꾼다. 호출은 `main.js:527`.
- `preview/shared/route-access.js:239` `/about`은 비로그인 공개. 라우트는 남겨 두고 리다이렉트만 한다.
- `about.js` 본문(15–19행): 소개 문장 3개, 「유료상품」(`#/plans`)·「고객센터」(`#/support`) 링크, 「← 메인 홈으로」.

### `/info/` 페이지 (이미 있는 문장·메타)

- `public/info/index.html`, `public/info/study-room/index.html`, `public/info/tutor/index.html`, `public/info/parents/index.html`.
- 네 장 모두 페이지 안 `<style>`만 쓰고, 글꼴은 `system-ui, "Segoe UI", sans-serif`. 로고는 `/assets/brand/logo-wordmark-2026.png`(이미 있음). 외부 CSS·JS·웹폰트 없음.
- `title`·`description`·`canonical`·`og:*`가 이미 있다. 지우거나 바꾸지 않는다.
- 소개 페이지 h1은 「우리동네 공부방·과외쌤 찾기 서비스 소개」. 승인안의 짧은 제목 「우리동네 공부방·과외쌤 찾기」는 이 문장 안에 들어 있다. **검색용 h1은 지금 문장을 유지**하고, 짧은 제목을 따로 만들지 않는다.
- 공부방·과외쌤 안내에는 「유료 노출 안내」제목과 「유료 노출 상품이 있으며 자세한 내용은 로그인 후 안내합니다.」가 이미 있다. 가격·상품 링크는 없다. **이 문장은 유지**한다. about.js의 「유료상품」링크(`#/plans`)는 `/info/`에 넣지 않는다.
- 지금 닫는 링크는 「회원가입·로그인」한 줄이 `/auth/`로 간다. `preview/auth-ui/src/main.js:57–59`는 해시가 없으면 `#/login`을 넣는다. 가입 화면의 실제 해시는 `#/login`, `#/signup/terms`이다. 운영 여는 주소는 `/auth/#/login`, `/auth/#/signup/terms`(`public/.htaccess:17,24`가 `/auth/login`, `/auth/signup/terms`를 같은 해시로 보낸다. 홈 고객센터는 `preview/home-ui/src/support/screens.js:102`가 `${AUTH_UI_BASE}/#/signup/terms`를 쓴다).
- 고객센터는 정적 페이지에서 `/support` 또는 `/#/support`. pathname `/support`는 `bootstrapSupportRoute`(`state.js:428–434`)가 `#/support`로 정규화한다. `/support`를 쓴다.
- 카카오 채널 정본: `preview/shared/inquiry-contact.js:18` `https://pf.kakao.com/_xkeMNX/chat`. 새 탭, `rel="noopener noreferrer"`. 카카오 JS·위젯은 넣지 않는다.

### 사업자 정보 (지어내지 말 것, site-footer.js가 정본)

`SITE_FOOTER_COMPANY`(18–26행): 상호 제이에이치커머스(서비스명 우동공과), 대표 이종현, 주소 경기도 의정부시 능곡로26번길 40, 101동 1101호, 사업자등록번호 471-29-01819, 통신판매업신고 제2025-의정부송산-0680호, 이메일 help@study114.net, **phone은 빈 문자열**. 전화는 `renderCompanyBlock` 100–102행처럼 값이 있을 때만 그린다. 지금은 그리지 않는다.

- 안내문 `SITE_FOOTER_NOTICE`(9–10행): 우동공과는 통신판매중개자이며 통신판매의 당사자가 아닙니다. 회원 간 거래에 대한 의무와 책임은 각 회원에게 있습니다.
- 저작권 `SITE_FOOTER_COPYRIGHT`(12행): © 2026 우동공과 · study114
- 사업자정보확인 `SITE_FOOTER_BIZ_CHECK_URL`(29–30행): `https://www.ftc.go.kr/bizCommPop.do?wrkr_no=4712901819`

지금 `/info/` 푸터는 안내문·저작권이 없고, 주소 앞에 「사업장 주소」를 붙인다. 사이트 푸터와 맞출 때 라벨은 「주소」이다.

### 색 (tokens.css에서 값만 베끼고, 파일은 불러오지 말 것)

`preview/home-ui/src/styles/tokens.css`를 `/info/`나 홈 묶음에서 import 하면 안 된다(`tokens.css:6`이 Pretendard를 불러 홈 속도와 충돌함). 아래 값을 페이지 안 CSS에 직접 적는다.

- 브랜드 파랑 `#266bc4`(14행 `--brand-blue`), 진한 파랑 `#1f5ba8`(15), 누른 파랑 `#184a88`(16), 연한 파랑 `#eaf2fc`(17)
- 본문 `#1c1917`(45행 `--product-ink`), 보조 `#6b7280`(46), 줄 `#e5e7eb`(44), 카드 배경 `#ffffff`(43), 페이지 배경 `#f7f8fa`(34·42)
- 주 버튼 배경 `#266bc4`, 글자 `#ffffff`(183–185 `--btn-strong-*`)
- 보조 버튼은 흰 배경·파랑 테두리·파랑 글자로 충분하다
- 모서리 카드 12px(`--radius-surface` 0.75rem), 버튼 8px(`--radius-control` 0.5rem)
- 글꼴: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Pretendard·구글 폰트·외부 글꼴 금지

### 홈 속도에 관한 다른 사실

- 로컬 Vite(home-ui 5174/4174)의 root는 `preview/home-ui`라 `public/info/`를 제공하지 않는다. `/info/` 확인은 HTML을 직접 열거나 `public/`을 정적 서버로 열거나, 배포된 운영에서 한다. vite 설정은 고치지 않는다.
- 홍보 레일 버튼 「서비스 소개 보기」는 `/about`이 아니라 `/promo/parent`, `/promo/study-room`이다. **홍보 파일은 건드리지 않는다.**
- `preview/home-ui/index.html:29` noscript 링크는 이미 `/info/`를 가리킨다. 이 파일은 홈 진입이라 고치지 않는다.

---

## 0단계 — 먼저 진단만 하고 보고한 뒤 작업

승인 전에는 아무것도 고치지 않는다.

1. `git fetch` 후 `origin/main` 커밋을 적는다. 497cdd35가 아니면 위 줄 번호를 다시 본다.
2. 「확인된 사실」을 한 줄씩 「확인됨 / 다름(파일:줄)」으로 보고한다. 특히:
   - `link()`가 해시·absolute만 있는지, `href` 칸이 없는지.
   - `data-nav`·`data-util-href`가 일반 `<a href="/info/">`를 가로채는지(속성 없으면 가로채지 않아야 함).
   - `about.js`가 동적 import인지, 비로그인 홈 첫 방문 네트워크에 about 청크·`/info/` 요청이 없는지(이 측정이 전후 비교의 기준이다. 고치기 전에 찍는다).
   - 회원가입·로그인 실제 주소, 카카오 URL, 사업자 상수, `/info/` 네 장의 title·canonical·본문 문장.
3. 푸터와 about.js의 고칠 방법(함수 이름·바뀌는 줄)을 짧게 적어 보고한다. 아래 「고치는 방향」과 다르면 이유를 적는다.
4. 「허용 파일」 밖(특히 `main.js`, `state.js`, `tokens.css`, vite 설정, 홈 진입 HTML)을 고쳐야 할 것 같거나, 하나라도 불확실하면 **즉시 멈추고 보고**한다.
5. 보고 형식: 「확인됨 / 다름(파일:줄) / 멈춤 사유 / 고칠 방법」. 종현 승인 뒤 작업한다.

---

## 고치는 방향 (승인 뒤)

### 1. 푸터 — 일반 주소로 `/info/` 이동 (권장)

`preview/shared/site-footer.js`:

- 38행 항목을 `{ href: '/info/', label: '서비스 소개' }`로 바꾼다. `path: '/about'`는 제거한다. 같은 배열의 「유료상품」항목(36행)은 **그대로 둔다**(이번 범위는 소개 페이지에서 유료 링크를 빼는 것뿐이다).
- `link()`에서 라벨을 만든 뒤, `if (absolute)`(145행) 앞에: `item.href`가 있으면 `<a href="${escAttr(item.href)}">`만 반환. `data-nav`·`data-util-href`·`#` 접두 없음. hash·absolute 공통.
- `src/Site/SiteFooterCopy.php:55`를 `'href' => '/info/'`로 맞춘다. `site-footer-legal.php`는 고치지 않는다(이미 href를 그대로 출력).

### 2. `#/about` — 라우트는 남기고 렌더 직전에 보낸다 (권장)

`main.js`·`state.js`는 홈 묶음이라 고치지 않는다.

선택지와 이유:

| 안 | 내용 | 판정 |
|---|---|---|
| **A (채택)** | `about.js` `renderAbout()` 맨 앞(6–7행)에서 `window.location.replace('/info/'); return '';`. `bindAboutEvents`는 지금처럼 두거나, 리다이렉트 뒤에는 바로 내려가므로 동작에 영향 없다. 라우트·공개 권한·`bootstrapAboutRoute`는 그대로. | 홈 묶음 불변. 포트원 옛 주소 `#/about`과 pathname `/about` → `#/about` → `/info/`(두 번 이동) 모두 살아 있다. |
| B | `state.js` `bootstrapAboutRoute`가 pathname `/about`을 바로 `/info/`로 보낸다. | pathname은 한 번에 끝나지만 `state.js`가 홈 묶음에 들어 있다. **금지.** |
| C | `main.js` `isAboutRoute` 분기에서 about 청크를 받지 않고 바로 `location.replace`. | `main.js` 변경·홈 묶음 변경. **금지.** |
| D | about.js 화면을 남기고 푸터만 바꾼다. | 옛 `#/about`에 유료상품 링크가 남는다. **금지.** |

A안에서 `#/about`으로 바로 들어오면 about 청크를 받은 뒤 이동한다. 홈에서 prefetch 하지 말 것.

### 3. `/info/` 네 장 — 같은 틀, 문장은 그대로

각 HTML 안에 CSS를 넣는다. 공통 외부 CSS·JS 파일을 만들지 않는다.

위에서 아래로(소개 `index.html`):

1. **헤더:** 로고(`/assets/brand/logo-wordmark-2026.png`, 홈 `/`)와 기존 내비(서비스 소개·공부방·과외쌤·학생·학부모).
2. **히어로:** 로고, 기존 h1, 한 줄 설명은 이미 있는 「우동공과는 공부방·과외쌤과 학생을 쪽지로 연결하는 지역 공부방 포털입니다.」, 「시작하기」는 `/`로 가는 주 버튼.
3. **이용 대상 카드 3장:** 공부방 원장님 → `/info/study-room/`, 과외쌤 → `/info/tutor/`, 학생·학부모 → `/info/parents/`. 카드 설명은 각 안내 페이지나 소개 페이지에 이미 있는 문장만 쓴다. 약 640px 아래에서는 카드가 한 줄에 하나가 되게 쌓인다.
4. **이용 순서 3단계:** 짧은 라벨은 승인안대로 「지역 고르기 → 지도·목록으로 보기 → 쪽지로 연락하기」. 바로 옆에 기존 문장 「지역을 고르면 그 동네의 공부방·과외쌤·학생 수요를 지도와 목록으로 보고, 쪽지로 연락합니다.」를 남긴다.
5. **안내:** 「상세 정보와 쪽지는 로그인 후 이용할 수 있습니다.」(이미 있는 문장).
6. **닫는 버튼:** 「회원가입」`/auth/#/signup/terms`, 「로그인」`/auth/#/login`, 「고객센터」`/support`, 「카카오톡 문의」`https://pf.kakao.com/_xkeMNX/chat`. about.js의 유료상품 링크는 넣지 않는다. 소개·역할 페이지에 이미 있는 찾기·등록 안내 링크(`/search/room`, `/search/tutor`, `/#/register-intro/room`, `/#/register-intro/tutor`)는 유지한다.
7. **푸터:** 안내문·회사 두 줄(라벨·구분자·사업자정보확인·이메일 mailto)·저작권을 site-footer.js와 같게. 전화 없음. 기존 「이용약관·개인정보처리방침」`/#/support/policies` 링크는 유지. 유료상품 링크는 추가하지 않는다.

역할별 세 장도 같은 헤더·색·글꼴·푸터·반응형을 쓴다. 각 장의 기존 h1·h2·p·목록 문장은 삭제하지 않는다. 카드·단계로 옮겨 담을 수는 있으나 문장을 줄이거나 바꾸지 않는다.

새 문장·숫자·가격·실적 주장을 만들지 않는다.

---

## 허용 파일 (이 8개만)

| # | 파일 | 종류 |
|---|---|---|
| 1 | `public/info/index.html` | 수정 — 소개 디자인, 문장·메타 유지 |
| 2 | `public/info/study-room/index.html` | 수정 — 같은 틀 |
| 3 | `public/info/tutor/index.html` | 수정 — 같은 틀 |
| 4 | `public/info/parents/index.html` | 수정 — 같은 틀 |
| 5 | `preview/shared/site-footer.js` | 수정 — 소개 항목을 `/info/` 일반 링크로 |
| 6 | `preview/home-ui/src/about.js` | 수정 — `location.replace('/info/')` |
| 7 | `src/Site/SiteFooterCopy.php` | 수정 — 55행 href를 `/info/`로 (JS 푸터와 값 유지) |
| 8 | `docs/worklog/2026/11/2026-11-19-21-info-about-redesign.md` | 새 작업 기록 |

**손대지 않는 것:** `preview/home-ui/src/main.js`, `preview/home-ui/src/state.js`, `preview/home-ui/src/layout.js`, `preview/home-ui/index.html`, `preview/shared/route-access.js`, `preview/home-ui/src/styles/tokens.css`, 다른 CSS·JS, vite 설정, `.htaccess`, 홍보(`promo/`) 파일, 폰트, `public/.htaccess`, `src/Views/partials/site-footer-legal.php`. 홈 묶음에 import·prefetch를 추가하지 않는다.

---

## 수락 기준

1. **홈 첫 방문 속도:** 고치기 전·후 비로그인 홈 네트워크를 비교한다. 폰트·CSS·JS **요청 개수와 URL이 같다**(해시 파일 이름은 site-footer 변경으로 JS만 바뀔 수 있다). CSS 내용 해시는 같다. JS는 site-footer 변경분 외에 내용이 같지 않으면 멈추고 보고한다. 홈에서 about 청크·`/info/`·새 폰트·새 이미지·새 CSS/JS를 미리 받지 않는다.
2. `/info/`, `/info/study-room/`, `/info/tutor/`, `/info/parents/`가 200이다. 외부 CSS·JS·웹폰트 요청이 0이다. 로고만 기존 `/assets/brand/logo-wordmark-2026.png`를 받는다.
3. 네 장을 너비 375·1440에서 찍어 둔다. 375에서 카드가 한 줄에 하나가 되고, 글자가 잘리거나 가로로 넘치지 않는다.
4. `#/about`과 `/about`으로 열면 최종 주소가 `/info/`이다(pathname `/about`은 `#/about`을 한 번 거칠 수 있다).
5. 푸터 「서비스 소개」가 비로그인·공부방·과외쌤·학생 모드에서 `/info/`로 **페이지 이동**한다(해시만 바뀌지 않는다). 가능하면 찾기·가입 화면 푸터도 확인한다.
6. `/info/`에 유료상품·`#/plans` 링크가 없다. 기존 「유료 노출 안내」문장(공부방·과외쌤 안내)은 남아 있다.
7. title·canonical·description·og, 기존 h1·h2·본문이 남아 있다.
8. Verify bundle: 기존 실패 4개(Hide inquiry bundle, Tutor search fields, Tutor basic required, Student hope hidden required)는 원래 있던 것이다. **새 실패 이름이 생기면 머지하지 않고 보고한다.**

---

## 마무리

1. 바뀐 파일이 「허용 파일」과 같은지 `git diff --name-status origin/main...HEAD`로 확인해 보고한다.
2. 커밋 → PR → 머지 → 배포(Cursor). 보고: PR 번호, main 머지 커밋, Deploy to dothome run 번호.
3. **Cloudflare 캐시는 하지 마.** 배포 뒤 캐시 비우기와 홈 속도 재측정은 봇이 한다.

## 작업 기록 (`docs/worklog/2026/11/2026-11-19-21-info-about-redesign.md`)

- 0단계 보고 요약, 푸터 링크·about.js에서 고른 방법과 줄 번호, 홈 첫 방문 전후 요청 수·JS/CSS 해시, `/info/` 4장 375·1440 스크린샷 경로, `#/about` 도착 확인, PR·머지·배포 번호.
