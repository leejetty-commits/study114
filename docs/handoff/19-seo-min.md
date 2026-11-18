# 19 — 오픈 전 검색 노출 최소판 (SEO min) — Cursor 작업 지시서

- 작성: 2026-11-19 02:10 (KST) · 우동공과3
- 코드 기준: `origin/main` **bd8f9fc8** (PR #266 머지). 12b가 먼저 머지되면 main이 바뀌니, 0단계에서 `git fetch` 후 다시 확인한다.
- 목적: 네이버·구글·다음·빙 로봇이 **자바스크립트 없이도 읽을 수 있는 글**을 오픈 전에 준비한다.
- 원칙: **지금 돌아가는 앱 화면(JS·CSS·라우팅)은 손대지 않는다.** 새 정적 HTML을 **새 폴더**에 더하고, `robots.txt`·`sitemap.xml`을 고치고, 홈 엔트리 HTML에는 **줄을 더하기만** 한다.
- 순서: **12b 머지·배포가 끝난 뒤** 시작한다(같은 배포 워크플로를 쓰므로 겹치지 않게).

---

## 0단계 — 먼저 진단만 하고 보고한 뒤 작업

승인 전에는 아무것도 고치지 않는다.

1. `git fetch` 후 `origin/main` 커밋을 적는다. bd8f9fc8이 아니면 아래 「확인된 사실」의 줄 번호를 다시 본다.
2. 아래 「확인된 사실」을 코드에서 직접 보고 한 줄씩 「확인됨 / 다름(파일:줄)」으로 보고한다.
3. `/info` 또는 `/info/…` 주소를 쓰는 곳이 앱 코드(`preview/**/src`), `public/.htaccess`, `scripts/`, `.github/`에 **하나라도** 있으면 멈추고 보고한다. (작성 시점 `git grep`으로는 없음)
4. 「허용 파일」 밖을 고쳐야 할 것 같으면 **즉시 멈추고 보고**한다.
5. 보고 형식: 「확인됨 / 다름(파일:줄) / 멈춤 사유」.

---

## 허용 파일 (Part A·B — 이 8개만)

| # | 파일 | 종류 |
|---|---|---|
| 1 | `public/robots.txt` | 수정 |
| 2 | `public/sitemap.xml` | 수정 |
| 3 | `public/info/index.html` | 새 파일 — 우동공과 소개 |
| 4 | `public/info/study-room/index.html` | 새 파일 — 공부방 원장님 안내 |
| 5 | `public/info/tutor/index.html` | 새 파일 — 과외쌤 안내 |
| 6 | `public/info/parents/index.html` | 새 파일 — 학생·학부모 안내 |
| 7 | `preview/home-ui/index.html` | 수정 — **줄 추가만**(기존 줄 변경·삭제 금지) |
| 8 | `docs/worklog/2026/11/2026-11-19-seo-min.md` | 새 작업 기록 |

**손대지 않는 것:** `public/.htaccess`, `preview/*/src/**`(JS·CSS 전부), `preview/{auth,search,study-room,tutor}-ui/index.html`, `scripts/build-dothome.sh`, `.github/workflows/*`, `src/**`(PHP), 새 CSS·JS 파일, 새 이미지.

Part C(소유 확인 파일)는 종현이 코드를 받아 온 뒤 **별도 승인**으로 한다(아래 참고).

---

## 확인된 사실 (origin/main bd8f9fc8, 2026-11-19 02:00 KST 운영 응답 포함)

### 정본 도메인 = `https://study114.net` (www 없음)
- 운영 `https://www.study114.net/` → **301** `https://study114.net/` (Cloudflare 응답, 직접 확인).
- `https://study114.dothome.co.kr/` → **301** `https://study114.net/` (`public/.htaccess:8-9`).
- 모든 SPA 엔트리 HTML의 canonical·og:url이 `https://study114.net/…`이다(`preview/home-ui/index.html:8`, `:12` 등).
- `.htaccess` 하단 주석·SetEnv도 `https://study114.net`이 정본이다.
- ⚠ `http://study114.net/`, `http://www.study114.net/`는 **HTTP 500**(Server: Pingora, Cloudflare 엣지)이다. 코드 문제가 아니라 Cloudflare 설정 문제다 → 종현 할 일 1번(Always Use HTTPS). 이 지시서 범위 밖.

### robots.txt
- 저장소 `public/robots.txt`: `User-agent: *` / `Allow: /` / `Sitemap: https://study114.net/sitemap.xml` 3줄.
- 운영 응답에는 그 **앞에 Cloudflare 관리 블록**(Content-Signal, AI 학습 봇 차단 목록)이 자동으로 붙는다. Googlebot·Yeti(네이버)·Daum·Bingbot은 막혀 있지 않다. Cloudflare 블록은 그대로 둔다.

### sitemap.xml (지금 7개, lastmod 없음)
- `/`, `/search/room`, `/search/tutor`, `/search/student`, `/auth/`, `/register/room/`, `/register/tutor/`.
- 문제 1: `/auth/`(로그인), `/register/*`(가입 폼)은 검색에 내보낼 글이 아니다.
- 문제 2: 찾기 SPA는 모든 주소의 canonical이 `https://study114.net/search/`다(`preview/search-ui/index.html:8`). 사이트맵의 `/search/room` 등은 canonical과 어긋난다 → 사이트맵에는 `/search/`만 둔다.

### 화면 주소 방식
- 홈 SPA는 `#/…` 해시 주소다. `/about`, `/guide`, `/support`, `/plans`, `/policy`, `/community`, `/promo`, `/concern`, `/mypage`, `/messages`, `/library`, `/admin`, `/myshop` 같은 경로로 들어오면 JS가 해시로 옮긴다(`preview/home-ui/src/main.js:542-566`, `state.js:222-228` 등). **이 이름들은 정적 폴더로 쓰면 안 된다**(실제 폴더가 생기면 Apache가 그 폴더를 먼저 내줘서 앱 딥링크가 깨진다).
- 로봇은 `#` 뒤를 주소로 보지 않는다. 그래서 `#/about` 같은 글은 검색에 따로 잡히지 않는다.
- 홈 엔트리에는 화면에 안 보이게 숨긴 사업자 정보 3줄(`#site-biz-static`, `preview/home-ui/index.html:18`)만 있다. **건드리지 않는다**(포트원 심사용).

### 서버 규칙과 배포 (새 정적 폴더가 안전한 이유)
- `.htaccess:12-14`: **실제 파일·폴더가 있으면 그대로 내준다.** 그 뒤에 SPA 대체 규칙(`:28-36`)이 온다. → `public/info/…/index.html`은 앱 규칙에 걸리지 않고 그대로 나간다. `DirectoryIndex index.html`(`:39`)이라 `/info/`로 열린다.
- `.htaccess:65-68`: `.html`은 `no-cache`다. 새 페이지도 배포 즉시 반영된다.
- `scripts/build-dothome.sh`: 홈 빌드는 `public/`을 **지우지 않고** 덮어쓰기만 한다(`:19-33`, `:74`). `rm -rf`는 `public/auth`, `public/search`, `public/register/room`, `public/register/tutor`에만 한다(`:38`, `:75-78`). → `public/info/`는 빌드에서 지워지지 않는다. `preview/home-ui/public/` 최상위에는 파일이 없어서 robots·sitemap을 덮어쓰지 않는다.
- `.gitignore:18-23`은 `public/info/`를 무시하지 않는다.
- `.github/workflows/deploy.yml:239-249`: `./public/` 전체를 FTP로 올린다. `public/**` 변경은 배포를 일으킨다(`:14`).
- 운영 응답: 모르는 주소(예: `/nonexist-xyz.html`)도 홈 HTML로 **200**이 난다(소프트 404). 이번 범위 밖, 기록만 한다.
- 로고 `https://study114.net/assets/brand/logo-wordmark-2026.png`, OG 이미지 `https://study114.net/assets/brand/og-cover-2026.png`는 운영에서 200이다.

### 소개 문구 출처 (새 페이지 글은 이 사실 안에서만 쓴다)
- `preview/home-ui/src/about.js`: 「우동공과는 공부방·과외쌤과 학생을 쪽지로 연결하는 지역 공부방 포털입니다.」 「이용 대상은 공부방, 과외쌤, 학생/학부모입니다.」 「지역을 고르면 그 동네의 공부방·과외쌤·학생 수요를 지도와 목록으로 보고, 쪽지로 연락합니다. 상세 정보와 쪽지는 로그인 후 이용할 수 있습니다.」
- 사업자 정보: `preview/home-ui/index.html:19-21`과 **글자 그대로** 같게 쓴다.

---

## Part A — robots.txt · sitemap.xml · 정적 안내 4쪽

### A1. `public/robots.txt` (전체를 아래로 바꾼다)
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /adm
Disallow: /bbs/
Disallow: /auth/
Disallow: /uploads/

Sitemap: https://study114.net/sitemap.xml
```
- `/assets/`는 **막지 않는다**(구글이 화면을 그릴 때 JS·CSS가 필요).
- `/uploads/` 차단은 기본안이다(회원이 올린 사진이 이미지 검색에 뜨지 않게). 종현 결정 D3에 따라 뺄 수 있다.
- Cloudflare가 앞에 붙이는 블록은 저장소 파일과 별개다. 그대로 둔다.

### A2. `public/sitemap.xml` (전체를 아래로 바꾼다)
- 주소는 이 6개만. `lastmod`는 **배포하는 날짜**(KST, `YYYY-MM-DD`)로 모두 같게 쓴다. `changefreq`·`priority`는 넣지 않는다(구글은 무시함).
```
https://study114.net/
https://study114.net/info/
https://study114.net/info/study-room/
https://study114.net/info/tutor/
https://study114.net/info/parents/
https://study114.net/search/
```
- `/auth/`, `/register/*`, `/search/room|tutor|student`는 뺀다. 해시 주소(`/#/…`)는 넣지 않는다.

### A3. 정적 안내 4쪽 (새 파일 3~6번)
공통 규칙:
- 순수 HTML 한 파일. **JS 없음.** 스타일은 그 파일 `<head>` 안 `<style>` 한 블록(20줄 안팎, 시스템 글꼴, 최대 폭 720px, 줄간격 1.7). 외부 CSS·폰트·새 이미지를 부르지 않는다. 로고는 `/assets/brand/logo-wordmark-2026.png`(높이 32px)만.
- `<html lang="ko">`, `<meta charset="UTF-8">`, viewport.
- `<title>`, `<meta name="description">`(80~120자), `<link rel="canonical">`(자기 주소, 끝 `/` 포함), `og:type=website`, `og:site_name=우동공과`, `og:locale=ko_KR`, `og:title`, `og:description`, `og:url`(= canonical), `og:image=https://study114.net/assets/brand/og-cover-2026.png`.
- 본문: `<h1>` 1개, `<h2>` 3~5개, 문단·목록. 쪽마다 한국어 **600~1,200자**. 위 「소개 문구 출처」와 아래 쪽별 내용 안에서만 쓴다.
- **쓰지 않는 것:** 가격·할인율·금액(결정 D1), 회원 수·등록 수 같은 숫자, 「최고·최대·1위·유일」 같은 최상급 표현, 실제 회원·업체 이름, 전화번호(070 개통 전), 오픈할인·추첨 이벤트 문구(마케팅 확정 전).
- 맨 위 머리줄: 로고(→ `/`) + 링크 「서비스 소개 `/info/`」「공부방 `/info/study-room/`」「과외쌤 `/info/tutor/`」「학생·학부모 `/info/parents/`」.
- 맨 아래 바닥줄: 사업자 정보(`preview/home-ui/index.html:19-21`과 글자 그대로, **화면에 보이게**) + 「이용약관·개인정보처리방침」 링크 `/#/support/policies`.
- 앱으로 가는 버튼(평범한 `<a>`):
  - 공부방 찾기 `/#/search/room`이 아니라 **`/search/room`** (찾기 SPA 실제 경로), 과외쌤 찾기 `/search/tutor`
  - 공부방 등록 안내 `/#/register-intro/room`, 과외쌤 등록 안내 `/#/register-intro/tutor` (`main.js`의 기존 해시 경로)
  - 회원가입·로그인 `/auth/`
  - 0단계에서 이 5개 경로가 지금도 열리는지 확인하고, 안 열리는 것이 있으면 보고한다.

쪽별 내용:
| 파일 | title | 내용 |
|---|---|---|
| `info/index.html` | `우동공과 — 우리동네 공부방·과외쌤 찾기 서비스 소개` | 무엇인가(about.js 문장), 누가 쓰나(공부방·과외쌤·학생/학부모), 어떻게 쓰나(지역 선택 → 지도·목록 → 쪽지, 상세와 쪽지는 로그인 후), 세 쪽으로 가는 링크 |
| `info/study-room/index.html` | `공부방 원장님 안내 — 우동공과에 공부방 등록하기` | 동네 학부모·학생에게 공부방을 알리는 곳, 등록 흐름(회원가입 → 공부방 등록 → 지역 노출 → 쪽지로 문의 받기), 「유료 노출 상품이 있으며 자세한 내용은 로그인 후 안내」 한 문장(값 없음), 등록 안내 버튼 |
| `info/tutor/index.html` | `과외쌤 안내 — 우동공과에 과외쌤 등록하기` | 위와 같은 구조, 과외 지역(활동 지역) 선택, 증빙서류 제출 가능 표시는 **선택 사항**이라는 점 |
| `info/parents/index.html` | `학생·학부모 안내 — 우리동네 공부방·과외쌤 찾는 법` | 지역으로 찾기, 지도·목록으로 비교, 로그인 후 상세 보기와 쪽지, 학생 등록(희망 수업을 올려 연락 받기), 찾기 버튼 |

- 글 안에 지역 이름을 억지로 반복하지 않는다(키워드 나열은 네이버에서 불이익). 지역별 페이지는 이번에 만들지 않는다(결정 D4).

---

## Part B — 홈 엔트리 `preview/home-ui/index.html` (줄 추가만)

기존 줄은 한 글자도 바꾸지 않는다. 아래만 **더한다.**

1. `<head>`, 기존 `og:url` 줄 다음:
   ```html
   <meta property="og:type" content="website" />
   <meta property="og:site_name" content="우동공과" />
   <meta property="og:locale" content="ko_KR" />
   <script type="application/ld+json">
   {"@context":"https://schema.org","@graph":[
     {"@type":"Organization","name":"우동공과","legalName":"제이에이치커머스","url":"https://study114.net/","logo":"https://study114.net/assets/brand/logo-wordmark-2026.png","email":"help@study114.net"},
     {"@type":"WebSite","name":"우동공과","url":"https://study114.net/","inLanguage":"ko-KR"}
   ]}
   </script>
   ```
   - `SearchAction`은 넣지 않는다(검색어로 여는 공개 주소가 없음).
2. `<body>`, `<div id="app"></div>` 바로 다음:
   ```html
   <noscript>
     <p>우동공과는 공부방·과외쌤과 학생을 쪽지로 연결하는 지역 공부방 포털입니다. 화면을 보려면 자바스크립트를 켜 주세요.</p>
     <p><a href="/info/">서비스 소개</a> · <a href="/info/study-room/">공부방 안내</a> · <a href="/info/tutor/">과외쌤 안내</a> · <a href="/info/parents/">학생·학부모 안내</a> · <a href="/search/">찾기</a></p>
   </noscript>
   ```
- `#site-biz-static`, `<script type="module">` 줄, 기존 meta는 그대로 둔다.
- 빌드 뒤 `public/index.html`에 JSON-LD와 noscript가 **그대로 남는지** 확인한다(Vite가 지우거나 바꾸면 멈추고 보고).

---

## Part C — 소유 확인 (종현이 코드를 받아 온 뒤, 별도 승인)

이번 PR에는 넣지 않는다. 종현이 값을 주면 같은 방식의 작은 PR로 한다.

| 서비스 | 방법(기본안) | 허용 파일 |
|---|---|---|
| 네이버 서치어드바이저 | **HTML 파일 업로드** 방식. 종현이 받은 파일(예: `naverXXXXXXXX.html`)을 이름·내용 그대로 | `public/<그 파일명>` 새 파일 |
| 구글 서치콘솔 | **도메인 속성 + DNS TXT**(종현이 Cloudflare DNS에서 직접, 코드 없음). 안 되면 HTML 파일 방식 | (DNS면 없음) / `public/<googleXXXX>.html` |
| 다음 웹마스터도구 | 받은 PIN 줄(`#DaumWebMasterTool:…`)을 `robots.txt` 맨 끝에 한 줄 추가 | `public/robots.txt` |
| 빙 웹마스터 | 구글 서치콘솔에서 **가져오기**(코드 없음) | 없음 |

- 메타태그 방식(홈 엔트리 HTML 수정)은 쓰지 않는다. 파일 방식이 앱을 건드리지 않는다.
- 확인 파일은 지우지 않는다(지우면 소유 확인이 풀린다). FTP 배포는 저장소에 있는 파일이면 유지된다.

---

## 확인 (머지 전·후)

1. `git diff --name-only origin/main...HEAD`가 허용 8개와 **정확히 같다.**
2. `preview/home-ui/index.html` diff에 `-` 줄이 **0개**다(추가만).
3. 빌드(`bash scripts/build-dothome.sh`) 뒤 `public/info/**/index.html` 4개가 남아 있고, `public/index.html`에 JSON-LD·noscript가 있다.
4. Verify bundle: 실패가 기존 4건(Hide inquiry, Tutor search fields, Tutor basic required, Student hope hidden required)뿐이다. 새 실패 이름이 있으면 멈추고 보고.
5. 배포 뒤 운영에서(로그인 없이, `curl`):
   - `/info/`, `/info/study-room/`, `/info/tutor/`, `/info/parents/` → 200, 응답 본문에 각 쪽 `<h1>` 글이 있다(JS 없이 보임).
   - `/robots.txt`에 `Disallow: /api/`와 `Sitemap:` 줄, `/sitemap.xml`에 주소 6개.
   - `/`, `/#/about`, `/search/room`, `/auth/`, `/register/room/`가 **배포 전과 같이** 열린다.
   - 4쪽의 모든 링크가 열린다(404·빈 화면 없음).
6. 운영 HTML 4쪽을 W3C 검사(또는 `npx html-validate`)로 한 번 돌려 오류 0.

## 작업 기록 (`docs/worklog/2026/11/2026-11-19-seo-min.md`)
- 바뀐 파일 8개, robots·sitemap 전후, 4쪽 제목·주소, 확인 결과 5번 표, 남은 일(Part C, http 500, 소프트 404, 지역별 페이지).

---

## 종현 결정 필요 (기본안으로 진행 가능)

| # | 질문 | 기본안 |
|---|---|---|
| D1 | 정적 안내 쪽에 가격을 넣나? | **안 넣는다.** 비로그인 가격 공개(#226)는 포트원 심사 기간 한정이고 심사 뒤 다시 정하기로 했으니, 검색에 박히는 정적 쪽에는 값을 두지 않는다. |
| D2 | 찾기 화면을 사이트맵에 어떻게 넣나? | `/search/` 하나만(지금 canonical과 맞춤). `/search/room` 등을 따로 넣으려면 찾기 SPA의 canonical을 고쳐야 해서 앱 수정이 된다 → 오픈 뒤. |
| D3 | 회원이 올린 사진(`/uploads/`)을 이미지 검색에서 막나? | **막는다.** 공부방 사진 노출을 원하면 뺀다. |
| D4 | 「의정부 공부방」 같은 지역별 정적 쪽을 만드나? | **오픈 뒤.** 실제 등록이 쌓이기 전에는 내용이 빈 쪽이 되어 오히려 불이익. |
| D5 | 문구에 오픈할인·추첨을 넣나? | **안 넣는다.** 마케팅 확정 뒤 팝업·공지로 알린다. |

## 종현 할 일 (코드 밖)

1. **Cloudflare:** SSL/TLS → Edge Certificates → **Always Use HTTPS 켜기.** 지금 `http://study114.net`이 500이라 로봇이 http로 오면 오류를 본다. 켠 뒤 `http://study114.net/`이 `https://`로 301 되는지 확인.
2. **네이버 서치어드바이저**(searchadvisor.naver.com): 사이트 등록 `https://study114.net` → HTML 파일 받아서 우동공과3에게 전달(Part C) → 소유 확인 → 요청 → 사이트맵 제출 `https://study114.net/sitemap.xml` → robots.txt 검사 → 웹 페이지 수집 요청(`/`, `/info/` 4쪽).
3. **구글 서치콘솔**: 도메인 속성 `study114.net` → TXT 값을 Cloudflare DNS에 추가 → 확인 → 사이트맵 제출 → URL 검사로 `/info/` 4쪽 색인 요청.
4. **빙 웹마스터**: 구글 서치콘솔에서 가져오기 → 사이트맵 확인.
5. **다음 웹마스터도구**(webmaster.daum.net): 사이트 등록 → PIN 줄을 우동공과3에게 전달(Part C) → 확인 → 수집 요청.
6. **네이버 스마트플레이스: 기본안은 하지 않는다.** 방문하는 매장용 지도 등록이라 온라인 서비스에는 맞지 않고, 사업장 주소(자택)가 지도에 공개될 수 있다. 하려면 주소 공개 범위를 먼저 확인.
7. 오픈 뒤 1~2주: 서치어드바이저·서치콘솔에서 수집 오류와 색인 수 확인.
