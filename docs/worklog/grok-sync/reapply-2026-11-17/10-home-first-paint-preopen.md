# 10 오픈 전 비로그인 홈 첫 화면 가볍게 (폰트 캐시 · CSS 일부 분리 · 로고 이미지 · 최근열람 버튼 · 상세등록 정보글 미룸)

작성: 우동공과3(검수) · 2026-11-18 · 기준 `origin/main` `a738c84c` (PR #247 배포, run 44118863662)
상태: 지시서. 코드 변경 없음. Cursor가 PR만 연다. 머지 금지.
목표: 금요일(2026-11-20) 오픈 전에, **처음 오는 비로그인 손님**이 보는 홈(`https://study114.net/`)의 내려받는 양을 줄이고, 다시 올 때 폰트를 다시 받지 않게 한다. 같이, 공부방상세등록(`/register/room/`) 오른쪽 정보글 3건은 폼이 먼저 그린 뒤에 받는다. 로그인·세션·지도 순서는 건드리지 않는다.

## 명령

```
git fetch 후 origin/docs/reapply-2026-11-17의 docs/worklog/grok-sync/reapply-2026-11-17/10-home-first-paint-preopen.md 그대로 실행(A·C·D·E·F 커밋 분리, B는 확인만). 허용 파일 밖·모든 main.js·세션·지도 SDK 로딩 시점·capture 클릭 수정 금지. 수락 표(전후 전송량·첫 글자·LCP)와 세 모드 일반·시크릿 실클릭, 비로그인 전 페이지 화면 비교, 공부방상세등록 폼 첫 그림 전후와 정보글 표시 확인 후 PR만, 머지 금지.
```

## 허용 파일 (이것만)

| 커밋 | 파일 | 하는 일 |
|---|---|---|
| A | `public/.htaccess` | 해시 붙은 폰트 1년 캐시 블록 추가 |
| A | `scripts/check-cache-headers.mjs` | 위 블록 확인 한 줄 추가 |
| C | `preview/home-ui/vite.config.js` | `cssCodeSplit: false` → `true` (주석 갱신) |
| C | `preview/home-ui/src/styles/promo-v2.css` | 본문을 옮기고 한 줄 주석만 남김 |
| C | `preview/home-ui/src/styles/plans-theme.css` | 본문을 옮기고 한 줄 주석만 남김 |
| C | `preview/home-ui/src/styles/plans-store.css` | 본문을 옮기고 `.refund-policy-*` 규칙 4개만 남김 |
| C | `preview/home-ui/src/styles/screen/promo-v2.css` (새 파일) | 원래 본문 그대로 |
| C | `preview/home-ui/src/styles/screen/plans-theme.css` (새 파일) | 원래 본문 그대로 |
| C | `preview/home-ui/src/styles/screen/plans-store.css` (새 파일) | 원래 본문 그대로(환불표 4규칙 포함해도 됨) |
| C | `preview/home-ui/src/promo/index.js` | 맨 위 `import '../styles/screen/promo-v2.css';` 한 줄 |
| C | `preview/home-ui/src/promo/quick-match-view.js` | 맨 위 같은 한 줄 (마이페이지 퀵매칭도 이 모듈을 씀) |
| C | `preview/home-ui/src/plans/screens.js` | 맨 위 `import '../styles/screen/plans-theme.css';` `import '../styles/screen/plans-store.css';` 두 줄 |
| C | `scripts/verify-paid-renewal.mjs` | `plans-store.css`를 읽는 줄을 원래 파일 + `screen/plans-store.css` 합친 값으로 |
| D | `preview/home-ui/public/assets/brand/logo-wordmark-2026.png`, `public/assets/brand/logo-wordmark-2026.png`, `preview/auth-ui/public/assets/brand/logo-wordmark-2026.png` | 같은 이름으로 크기만 줄임 (세 벌 같은 파일) |
| E | `preview/home-ui/src/mypage/screens.js` | `renderRecentEmpty` 안 「탐색하기」 주소만 |
| F | `preview/study-room-ui/src/layout.js` | 공부방상세등록 오른쪽 정보글 요청을 폼이 그린 뒤로 |
| 기록 | `docs/worklog/2026/11/2026-11-18-home-first-paint-preopen.md` | 결과 기록 |

`main.js`(home-ui·search-ui·study-room-ui·tutor-ui 전부), `auth-session.js`, 세션·엔트리 순서, `loadNaverMapsSdk` 시점(#235), capture 클릭 처리, 위 표에 없는 CSS·JS는 한 줄도 바꾸지 않는다.

---

## 조사에서 확인한 것 (2026-11-18 01시 KST, 박스에서 운영 측정)

### 운영 비로그인 홈 전송량 (시크릿과 같은 빈 캐시, 지도 타일 포함)

| 항목 | 데스크톱 1440폭 | 모바일 390폭(느린 망·CPU 4배) |
|---|---:|---:|
| HTML | 3 KB | 3 KB |
| JS (`index-WO9_maP0.js` 189 KB + 네이버 지도 98 KB 등) | 291 KB | 289 KB |
| CSS (`style-rrJNRl_0.css`, 원본 676,169 B) | 121 KB | 119 KB |
| 폰트 (Pretendard 4종) | **1,052 KB** | **1,055 KB** |
| 이미지 (우리 것 약 84 KB, 나머지는 네이버 지도 타일) | 605 KB | 554 KB |
| API(fetch) | 27 KB | 25 KB |
| 첫 글자(FCP) | 1,736 ms | 2,824 ms |
| LCP | 2,000 ms (`catalog-study.webp` 카드) | 3,324 ms (같은 카드) |

측정 위치는 미국 서부 박스라 국내 체감 시간과 다르다. **전후 비교용 기준값**으로만 쓴다. Cursor는 같은 방법으로 자기 환경에서 전후를 다시 잰다.

### 1. 폰트

- CSS 안 `@font-face`는 7개. **7개 모두 이미 `font-display: swap`이 있다.** 그래서 폰트를 받는 동안에도 글자는 먼저 보인다. 고칠 것 없음.
  - Pretendard 400·500·600·700 (`preview/shared/fonts/pretendard.css`, 해시 파일명 `Pretendard-*.subset-<8자>.woff2`, 각 267~271 KB)
  - 홍보 전용 `PV2 Gmarket Sans` 500·700, `PV2 Nanum Pen` (`promo-v2.css` 안, `/assets/promo/fonts/*.woff2`, 해시 없음)
- 비로그인 홈은 Pretendard **4종을 모두** 받는다(합계 약 1,052 KB, JS+CSS를 합친 것보다 크다). 홍보 폰트는 홈에서 받지 않는다(폰트는 쓰는 글자가 있을 때만 받는다).
- 캐시: Pretendard 4종과 홍보 폰트 모두 `cache-control: max-age=14400`(4시간). JS·CSS는 `public, max-age=31536000, immutable`.
  - 원인: `public/.htaccess`의 장기 캐시 블록이 `^[A-Za-z0-9_-]+-[A-Za-z0-9_-]+\.(js|css)$`만 잡는다. 폰트는 서버가 Cache-Control을 안 보내서 Cloudflare 기본값 4시간이 붙는다.
  - 결과: 4시간이 지난 재방문(다음 날 다시 오는 손님)마다 폰트 약 1 MB를 다시 받는다.
- CSS 안 `font-weight` 사용 횟수: 700 358회, 600 285회, 800 92회, 500 48회, 400 20회 등. 500·600 파일을 빼면 화면 굵기가 바뀐다.

### 2. CSS

- `preview/home-ui/vite.config.js`: `build.cssCodeSplit: false` (341, 2026-11-10 `ea1cb95c`. 그때는 JS만 나누고 CSS는 파일 하나로 두기로 했다).
- 그래서 **어느 화면에서 import하든 모든 CSS가 엔트리 CSS 하나(676 KB)에 들어간다.** 게다가 홈 CSS 41개 import가 전부 `preview/home-ui/src/main.js` 1~42행에 있다.
- 즉 "늦게 받는 화면 모듈 안에서 CSS를 import"하려면 ① `cssCodeSplit`을 켜고 ② `main.js`의 import 줄을 빼야 한다. ②는 금지라서, **원래 CSS 파일 내용을 비우고(한 줄 주석) 같은 내용을 새 파일로 옮겨 화면 모듈에서 import**하는 방식만 쓴다. `main.js`의 import 줄은 그대로 남지만 빈 파일을 가리키게 된다.
- 이미 늦게 받는 화면(`main.js` 103~117행 `import()`): admin, parent/study-room/tutor 홈, mypage, plans, myshop, guide, concern, promo, support, about, policy, library, register-intro.

엔트리 CSS 큰 파일과 판정 (원본 바이트, `main.js` import 기준):

| 파일 | 크기 | 쓰는 곳(클래스 문자열이 나오는 JS) | 오픈 전 |
|---|---:|---|---|
| `plans-store.css` | 47,270 | `plans/`만. 예외: `.refund-policy-*` 4규칙은 `refund-policy-copy.js`(정책 화면)도 씀 | **옮김** (4규칙은 남김) |
| `plans-theme.css` | 45,046 | `.plans-theme`/`[data-theme="plans"]` 아래로만 묶여 있음(묶이지 않은 셀렉터 0) | **옮김** |
| `promo-v2.css` | 25,862 | `pv2-` 접두어. `promo/screens.js`, `promo/quick-match-view.js`만. 홍보 폰트 3개 선언 포함 | **옮김** |
| `registration-check.css` | 15,392 | `rc-`. 마이페이지 청크만. 그러나 검사 스크립트 4개와 워크플로 1개가 이 경로를 직접 읽음 | 오픈 후 |
| `home-admin.css` | 23,455 | admin 외에 `email-verify-overlay`(엔트리), `sup-admin-hub`(support), `plans-*`가 섞임 | 오픈 후(파일 쪼개기 필요) |
| `home-support-guide.css`, `zip-guide.css`, `zip-visual-v2.css`, `zip-bridge.css`, `info-pages.css`, `home-community.css` | 51,577 / 22,798 / 28,811 / 7,943 / 20,141 / 15,801 | `concern-`·`guide-`·`sup-` 클래스를 엔트리의 `right-rail.js`, 정책·자료실 화면도 씀 | 오픈 후 |
| `mypage-ops.css`, `student-mypage-stage5b.css`, `myshop.css`, `inquiry-settings-catalog.css` | 17,558 / 17,222 / 13,604 / 5,374 | 마이페이지·마이샵 위주이나 여러 모듈에 걸침. 클래스 전수 확인 안 됨 | 오픈 후 |
| `promo-catalog.css` | 1,146 | `guide-back-home`을 guide·concern도 씀. 작음 | 그대로 |

박스 시험 빌드(같은 커밋, 파일은 되돌림):

| | 엔트리 CSS 원본 | gzip |
|---|---:|---:|
| 지금 (`style-rrJNRl_0.css`, 운영과 같은 해시) | 676.17 kB | 107.63 kB |
| `cssCodeSplit: true` + 위 3파일 이동 | **569.08 kB** | **90.15 kB** (약 −16%) |

이때 함께 생기는 조각 CSS: `screens-*.css`(plans 75.8 kB), `quick-match-view-*.css`(promo-v2+퀵매칭 24.8 kB), admin `index-*.css`(관리자 메일·정산 4.2 kB), mypage `index-*.css`(과외쌤 프로필 사진·읽기 1.7 kB), `withdraw-reason-ui-*.css`(0.8 kB). 뒤의 셋은 원래 모듈 안에서 import하던 CSS라 `cssCodeSplit`만 켜도 저절로 나뉜다.

엔트리 CSS 파일 이름이 `style-*.css`에서 `index-*.css`로 바뀐다. `scripts/check-cache-headers.mjs`는 `index|style` 둘 다 본다. `.htaccess` 장기 캐시 패턴도 둘 다 잡는다.

### 3. 이미지

- 첫 화면 이미지: 헤더 `udong-symbol-2026.png`(64×93, 6 KB), `logo-wordmark-2026.png`(**866×281, 18.8 KB, 화면에는 99×32**), 홍보 3칸 배경 `banners/catalog-study|tutor|student.webp`(각 800×222, 12.7/25.5/17.2 KB, 화면 318×106·모바일 306×108).
- LCP는 `catalog-study.webp` 카드다. 이미 WebP이고 모바일 3배 화면(약 918px)에는 800px가 오히려 모자라다. **줄이지 않는다.**
- `logo-wordmark.png`(8.4 KB)는 오른쪽 레일 홍보영상 제목(`promo-video-config.js`)에서 받는다. 이번에는 그대로.
- 비로그인 홈의 `<img>`는 로고 2개와 네이버 지도 타일뿐이다. **늦게 받기(lazy)를 붙일 우리 이미지가 없다.** 히어로·홍보 카드에는 lazy를 붙이지 않는다.

### 4. 최근열람 「탐색하기」

- `preview/home-ui/src/mypage/screens.js` 557~572행 `renderRecentEmpty(role)`: 버튼과 옆 「내 등록」 링크가 둘 다 `getDefaultMypagePath(role)`(마이페이지 첫 화면)로 간다. 과외쌤은 마이프로필로 간다(11-18 종현 확인).
- GNB가 쓰는 주소 함수: `preview/shared/preview-links.js` 103행 `resolveGnbLink(gnbId, role)` → `find_room`/`find_tutor`/`student_parent`가 각각 `searchUiUrl('room'|'tutor'|'student', role)` (찾기 앱, 다른 문서로 이동). 학생 분기는 `preview/shared/site-nav-config.js` 167행 `parentBranch()` (`'tutor'|'study_room'|null`).

---

## A. 해시 폰트 1년 캐시

커밋: `10 perf(cache): 해시 붙은 woff2 폰트에 1년 immutable 캐시`

`public/.htaccess`의 `<IfModule mod_headers.c>` 안, A 블록 바로 아래에 추가:

```apache
  # A2. 해시 폰트 — Vite가 붙인 8자 해시 `<name>-<hash>.woff2` (예: Pretendard-Regular.subset-BZqc2FCe.woff2)
  #     해시 없는 /assets/promo/fonts/*.woff2 는 대상 아님 (같은 이름으로 덮어쓰면 옛 파일이 남기 때문)
  <FilesMatch "^[A-Za-z0-9._-]+-[A-Za-z0-9_-]{8}\.woff2$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
```

- 패턴 확인: `Pretendard-{Regular,Medium,SemiBold,Bold}.subset-<8자>.woff2`는 맞고, `gmarket-sans-bold.woff2`·`gmarket-sans-medium.woff2`·`nanum-pen.woff2`는 안 맞아야 한다. `node -e`로 정규식을 7개 이름에 돌려 결과를 기록에 붙인다.
- `scripts/check-cache-headers.mjs`: `assertHtaccess`에 "woff2 FilesMatch 블록 존재" OK/FAIL 한 줄. 기존 검사는 그대로.
- HTML·이미지·API 캐시는 바꾸지 않는다.
- 배포 뒤: Cloudflare에 이미 저장된 폰트는 그 저장이 끝날 때까지 옛 헤더(4시간)로 나갈 수 있다. Cursor는 CF를 건드리지 않는다. 기록에 "배포 뒤 몇 시간 안에 `curl -sI https://study114.net/assets/Pretendard-Regular.subset-BZqc2FCe.woff2`가 1년으로 바뀌는지 확인, 늦으면 종현이 CF 대시보드에서 폰트 4개 주소만 Purge" 라고 적는다.

수락: 운영 배포 뒤 4개 Pretendard 주소가 `public, max-age=31536000, immutable`, 홍보 폰트 3개는 그대로.

## B. 폰트 표시 (확인만, 이번 PR에서 수정 없음)

- `font-display: swap`은 7개 모두 이미 있다. 추가할 것 없음.
- **preload는 넣지 않는다.** 글자는 swap으로 먼저 보이고, 260 KB짜리 폰트를 미리 받게 하면 느린 모바일에서 JS·CSS(첫 화면을 그리는 파일)와 대역폭을 다툰다.
- 홍보 폰트 3개 선언은 C에서 `promo-v2.css`와 함께 엔트리 CSS에서 빠진다(홈에서 내려받지는 않던 것이라 CSS 글자 수만 준다).
- Pretendard 500(Medium)·600(SemiBold) 빼기, 글자 범위별 분할(unicode-range)은 화면 굵기·파일 구조가 바뀌어 **종현 결정·오픈 후**. 내부문서 1.2에 적었다.

## C. 홍보·유료상품 전용 CSS를 엔트리에서 빼기

커밋: `10 perf(css): 홍보 v2·유료상품 CSS를 그 화면 조각으로 옮김 (main.js 그대로)`

1. `preview/home-ui/vite.config.js`: `cssCodeSplit: false` → `true`. 주석을 "10: 홍보·유료상품 전용 CSS는 그 화면 조각으로. main.js import 줄은 빈 파일을 가리킴" 으로.
2. `git mv`가 아니라 **복사 후 비우기**로 한다(원래 경로를 읽는 검사·다른 앱이 깨지지 않게).
   - `src/styles/screen/promo-v2.css` ← `src/styles/promo-v2.css` 전체. 원래 파일은 `/* 10: 본문은 styles/screen/promo-v2.css (홍보·퀵매칭 조각에서 불러옴) */` 한 줄.
   - `src/styles/screen/plans-theme.css` ← `plans-theme.css` 전체. 원래 파일은 한 줄 주석.
   - `src/styles/screen/plans-store.css` ← `plans-store.css` 전체. 원래 파일에는 주석 한 줄 + 아래 4규칙만 남긴다(정책 화면 `refund-policy-copy.js`가 씀):
     `.refund-policy-detail p` · `.refund-policy-list` · `.refund-policy-list li` · `.refund-policy-detail .refund-policy-list:last-child`
   - 옮긴 파일 안의 `url(/assets/...)`는 절대 경로라 고칠 것 없음. `@import`는 세 파일에 없다.
3. import 추가(각 파일 맨 위 한 줄씩, 다른 줄 수정 없음):
   - `src/promo/index.js`, `src/promo/quick-match-view.js`: `import '../styles/screen/promo-v2.css';`
     (`quick-match-view.js`는 홍보 화면과 마이페이지 퀵매칭 `mypage/quick-match-screen.js` 42행 `import()` 둘 다에서 쓴다.)
   - `src/plans/screens.js`: `import '../styles/screen/plans-theme.css';` `import '../styles/screen/plans-store.css';`
     (`plans/index.js`가 아니라 `plans/screens.js`다. 마이페이지 구매내역 `renderPlansHistory`, 공부방·과외쌤 등록의 `readTierCheck`도 이 모듈을 쓴다.)
4. `scripts/verify-paid-renewal.mjs` 34행: `const css = read('preview/home-ui/src/styles/plans-store.css') + '\n' + read('preview/home-ui/src/styles/screen/plans-store.css');`
5. 다른 앱 확인: `promo-v2.css`·`plans-theme.css`·`plans-store.css`는 search-ui·study-room-ui·tutor-ui `main.js`에서 import하지 않는다(확인함). 다른 앱 빌드 결과 CSS가 바이트 단위로 같아야 한다.
6. 빌드 후 확인해서 기록에 붙인다:
   - home-ui 엔트리 CSS 원본·gzip·br 크기 전후(목표: 원본 약 569 kB, gzip 약 90 kB).
   - 엔트리 CSS에 `pv2-`, `.plans-theme`, `PV2 Gmarket` 문자열 0건, `.refund-policy-list` 1건 이상.
   - `.vite/manifest.json`에서 각 조각 CSS가 어느 JS에 붙었는지 표.

위험과 막는 법:
- **덮어쓰기 순서가 바뀐다.** 옮긴 CSS가 엔트리 CSS 뒤에 붙는다. 예전에는 `plans-*`가 `mypage-ops.css`·`udx-std-apply.css` 등보다 앞이었다. 유료상품 화면과 마이페이지 구매내역·등록 등급 확인 화면을 **전후 스크린샷으로 나란히** 비교한다. 다르면 그 규칙만 고치지 말고 멈추고 보고.
- 조각 CSS를 못 받으면 Vite가 `vite:preloadError`를 내고, #224의 "같은 주소에서 한 번만 새로고침"이 처리한다(`main.js` 174행, 수정 안 함).
- 한 번 받은 조각 CSS는 다른 화면으로 가도 남는다. 세 파일 모두 접두어(`pv2-`, `.plans-theme` 아래, `plans-`)로 묶여 있어 홈에는 닿지 않는다. 그래도 유료상품 → 홈, 홍보 → 홈 이동 뒤 홈 화면을 비교한다.
- `registration-check.css` 등 위 표의 "오픈 후" 파일은 이번에 손대지 않는다.

## D. 헤더 로고 이미지 줄이기

커밋: `10 perf(img): 헤더 워드마크를 표시 크기 3배로 줄임 (같은 파일명)`

- `logo-wordmark-2026.png` 866×281(18.8 KB) → **297×96 PNG**(화면 99×32의 3배, 모바일 고해상도 대응). 투명 배경 유지. 박스 시험으로 264×86일 때 약 10 KB였다.
- 같은 파일명 그대로 세 벌(`preview/home-ui/public/…`, `public/…`, `preview/auth-ui/public/…`)을 같은 파일로 바꾼다. 코드 참조는 바꾸지 않는다.
- 이 파일은 `index.html`의 파비콘(`<link rel="icon">`)과 팝업·가입 화면 로고에도 쓰인다. 줄인 뒤 파비콘·홈 팝업·로그인 화면 로고가 흐리지 않은지 본다. 흐리면 D 커밋만 빼고 보고.
- 이 파일은 해시가 없어서 브라우저가 최대 4시간 옛 그림을 보여 줄 수 있다. 괜찮다(같은 그림).
- 홍보 카드 WebP 3개, 지도, 레일 홍보영상 로고는 그대로. lazy 추가 없음(붙일 아래쪽 이미지가 없음).

## E. 최근열람 빈 화면 「탐색하기」를 찾기로

커밋: `10 fix(mypage): 최근열람 빈 화면 탐색하기는 역할별 찾기로`

`preview/home-ui/src/mypage/screens.js` `renderRecentEmpty(role)`만 바꾼다. 옆 「내 등록」 링크는 그대로 `getDefaultMypagePath(role)`.

```js
// 개념 (실제 import 경로는 이 파일의 기존 shared import 방식에 맞춤)
import { resolveGnbLink } from '../../../shared/preview-links.js';
import { parentBranch } from '../../../shared/site-nav-config.js';

function recentExploreHref(role) {
  if (role === 'study_room' || role === 'tutor') return resolveGnbLink('student_parent', role)?.url || null; // 학생찾기
  if (role === 'parent') {
    const b = parentBranch();
    if (b === 'tutor') return resolveGnbLink('find_tutor', role)?.url || null;      // 과외쌤찾기
    if (b === 'study_room') return resolveGnbLink('find_room', role)?.url || null;  // 공부방찾기
  }
  return null; // 분기 모름·기타 역할 → 지금처럼 마이페이지 첫 화면
}
```

- 찾기 주소가 있으면 버튼은 `<a href="${esc(url)}" class="btn btn--secondary btn--sm">`(찾기 앱으로 문서 이동). **`data-mypage-nav`는 붙이지 않는다.** 없으면 지금 코드 그대로.
- 함수 안에서만 바꾼다. 마이페이지 클릭 처리·라우터는 손대지 않는다.
- 이 파일의 역할 값은 `parent`·`study_room`·`tutor`다(같은 파일 다른 분기에서 확인). shared import도 이미 `../../../shared/…` 방식을 쓴다.

수락: 과외쌤·공부방 계정 최근열람(빈 상태) 「탐색하기」 → 학생찾기. 학생(과외 분기) → 과외쌤찾기, 학생(공부방 분기) → 공부방찾기. 「내 등록」은 예전과 같은 곳.

## F. 공부방상세등록 오른쪽 정보글은 폼이 그린 뒤에

커밋: `10 perf(register): 공부방상세등록 정보글은 폼 그린 뒤에`

허용 파일: `preview/study-room-ui/src/layout.js`만. `origin/main`에서 경로를 확인했다. **홈 정보글 레일은 바꾸지 않는다.** `home-ui`의 `right-rail.js`·`library/info-rail.js`·홈 `layout.js`, `tutor-ui`(과외쌤상세등록의 같은 호출), 모든 `main.js`는 한 줄도 건드리지 않는다.

이미 있는 장치: `renderRegisterRightRail`이 `deferRailFetch`를 받는다(`preview/home-ui/src/right-rail.js` 1227~1233행). 이게 `renderInfoRailBanners`의 `deferFetch`로 넘어가서, 배너 제목과 「받는 중」만 그리고 `posts.php`는 보내지 않는다(`info-rail.js` 25~26, 149~150행). 등록 레일은 `tone: 'entry'`라 안내 칸(요청 없음)과 정보글 배너만 있다. 찾기 레일의 고민글(concern-hot)은 이 화면에 없다. 찾기 앱은 같은 장치를 `search-ui/src/layout.js`의 `replaceSearchRightRail`로 이미 쓰고 있다. 그 파일을 고치지 말고, 같은 방식만 따른다.

하는 일:

1. `renderRegisterShell` 181행. 로그인되어 레일을 그릴 때만 `deferRailFetch: true`를 넣는다.

```js
${showPromo ? renderRegisterRightRail({ navRole: getChromeNavRole(), homeBase: HOME_UI_BASE, deferRailFetch: true }) : ''}
```

2. 같은 파일에 찾기 앱 `replaceSearchRightRail`과 같은 함수를 둔다. **export하지 않는다**(`main.js`가 부르지 않는다). `[data-right-rail-slot="register_right_rail"]`을, `deferRailFetch` 없이 다시 그린 마크업으로 갈아끼우고 `bindRightRailEvents(next)`를 부른다. 칸이 없거나(비로그인·마이페이지 임베드) 노드를 못 바꾸면 `false`만 반환하고 끝낸다. import는 이미 있는 `renderRegisterRightRail`·`bindRightRailEvents`만 쓴다.

3. `bindGlobalEvents`에서, 기존 `bindRightRailEvents(root)`와 `requestAnimationFrame(() => syncSiteHeaderOffset(root))`는 그대로 둔다. 그 뒤에 **두 번째 애니메이션 프레임**(첫 그림이 나간 뒤)에서만 2번 함수를 부른다. 그 시점에 `root.isConnected`가 아니면(이미 다른 화면으로 옮김) 호출하지 않는다. 첫 번째 rAF나 `bindGlobalEvents` 본문에서 요청을 시작하면 안 된다.

위험과 막는 법:
- `deferRailFetch: true`만 넣고 2·3을 빼면 정보글이 「받는 중」에 머문다. 예전 점검 E3와 같은 증상이다. 수락에서 글이 결국 보이는지 반드시 본다.
- 과외쌤상세등록(`tutor-ui/src/layout.js`의 같은 호출)은 이번 범위가 아니다. 같이 고치지 않는다.
- 마이페이지 임베드(`renderRegisterCardFrame`)에는 레일이 없다. 레일을 넣지 않는다. 상세정보1·2의 `embed` 분기는 `bindGlobalEvents`를 부르지 않는데, 그쪽에도 레일이 없으니 그대로 둔다.

수락: 공부방 로그인, 기본정보·상세정보1·상세정보2를 일반 창과 시크릿 창에서 **메뉴를 눌러** 연다. 멈춤 없음. 폼이 화면에 나타난 뒤에 정보글 요청이 시작되는지 Network로 전후 시각을 잰다. 정보글은 결국 보인다(데스크톱·좁은 폭).

---

## 확인만 (수정 금지): PHP 세션 잠금

코드 읽기 결과(박스, `a738c84c`):
- `src/Auth/AuthSession.php` 31행 `session_start`, 46~51행 `close()` = `session_write_close()`.
- `public/api/auth/me.php` 77행 `AuthSession::userIfActive()` → 82행 `AuthSession::close()`. `userIfActive()`(156~186행)는 세션을 연 채로 `SELECT status FROM users WHERE id = ?` 한 번을 한다. 즉 **me.php는 DB 연결·질의 1회 동안만 잠금을 잡는다.**
- `public/api/search/search.php` 49~54행: 세션 쿠키가 있으면 `AuthSession::user()` 직후 바로 `close()`. 질의 전에 잠금을 푼다.
- 저장소 전체 `AuthSession::close()` 사용 11곳.

Cursor가 할 일(코드 수정 없이 보고만):
1. 로그인 상태로 홈·공부방찾기 첫 진입 때 나가는 PHP API 목록을 Network에서 뽑고, 각 파일이 `AuthSession::start/user/userIfActive` 뒤 `close()`를 언제 부르는지 표로(파일·행).
2. 같은 세션으로 `me.php`와 `search.php`를 동시에 보냈을 때, search.php 응답이 me.php 끝을 기다리는지 시작·끝 시각으로 3회 비교(브라우저 콘솔 `Promise.all` + `performance.now()` 정도, 운영 데이터 변경 없는 GET/조회만).
3. 결론 한 줄: "잠금 대기 있음/없음, 있다면 몇 ms, 원인 파일". 고치는 건 오픈 후 별도 지시서.

---

## 수락 점검

1. **전후 표**(기록에 붙임): 비로그인 홈, 시크릿(빈 캐시), 데스크톱 1440폭과 모바일 390폭(네트워크 제한 + CPU 4배). 항목: JS·CSS·폰트·이미지 KB, 첫 글자(FCP), LCP. 각 3회 중간값. 추가로 **재방문**(캐시 있음) 폰트 KB: A 배포 전후. 로컬 프리뷰로 재면 "로컬" 표시, 운영 전 값은 위 조사 표를 써도 된다.
2. **로그인 왕복**: 공부방 · 과외쌤 · 학생(과외 분기) · 학생(공부방 분기) 계정으로 일반 창과 시크릿 창 각각, 그 계정 GNB에 보이는 메뉴 전부를 눌러서 이동(주소창 입력 금지). 매 화면 3초 안에 바뀌고 멈춤 없음. 공부방은 홈 → 공부방찾기 → 홈 → 공부방찾기 두 번.
3. **화면 비교(전후 스크린샷 나란히)**: 비로그인 홈, 홍보(공부방·과외쌤·학생 홍보 랜딩), 퀵매칭 소개, 이용안내, 유료상품(`#/plans`) 소개·목록, 서비스 소개(about), 공부방/과외쌤 등록 소개(register-intro), 로그인 화면. 로그인 상태: 유료상품 화면들, 마이페이지 구매내역, 마이페이지 퀵매칭, 공부방·과외쌤 등록의 등급 확인, 과외쌤 프로필 사진, 탈퇴 사유 화면. 깨진 스타일 0.
4. 홍보 → 홈, 유료상품 → 홈 이동 뒤 홈 화면이 처음과 같다.
5. `npm run build:dothome` 성공. 「Verify bundle」은 main에서 이미 실패 중인 두 항목(관리자 CSS·과외쌤 카드) 외 새 실패 0. `npm run verify:paid-renewal` 통과. `node scripts/check-cache-headers.mjs` 통과.
6. search-ui·study-room-ui·tutor-ui·auth-ui 빌드 CSS가 전과 같다(해시 비교).
7. 최근열람 「탐색하기」 E 수락 4가지.
8. 공부방상세등록 F 수락: 공부방 로그인, 기본정보·상세정보1·상세정보2를 일반 창과 시크릿 창에서 **메뉴를 눌러** 연다. 멈춤 없음. 폼이 화면에 나타난 뒤에 정보글 요청이 시작되는지 Network로 전후 시각을 잰다. 정보글은 결국 보인다(데스크톱·좁은 폭).
9. 운영 로그인을 Cursor가 못 하면 "미확인"으로 적고 멈추지 않는다. 종현이 배포 뒤 운영에서 2·3·7·8을 본다.

## 예상 이득 (약속 아님, 박스 조사 기준)

- 첫 방문: 엔트리 CSS gzip 약 −17 KB(107.6 → 90.2), 로고 약 −9 KB. 첫 글자·LCP는 큰 변화가 없을 수 있다. 첫 방문의 큰 덩어리는 폰트 약 1 MB와 지도이고, 둘 다 오픈 후 항목이다.
- 재방문(4시간 뒤): 폰트 약 1 MB를 다시 받지 않는다. 오픈 전에 할 수 있는 것 중 가장 큰 효과다.
- 공부방상세등록: 정보글 3건(약 700 ms, 지시서 09 조사)이 폼 첫 그림과 같이 나가지 않는다. 폼이 먼저 보이고, 글은 그 뒤에 뜬다.

## 되돌리기

커밋별 `git revert`. C는 `vite.config.js`·CSS 파일·import 줄이 한 커밋이라 한 번에 되돌아간다. A는 `.htaccess` 블록 하나. F는 `preview/study-room-ui/src/layout.js` 하나.
