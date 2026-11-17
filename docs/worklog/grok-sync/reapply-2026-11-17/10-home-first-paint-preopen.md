# 10 오픈 전 비로그인 홈 첫 화면 가볍게 (폰트 캐시 · Medium 빼기 · CSS 일부 분리 · 로고 이미지 · 최근열람 버튼 · 상세등록 정보글 미룸 · 등록정보 동시 요청)

작성: 우동공과3(검수) · 2026-11-18 · 기준 `origin/main` `a738c84c` (PR #247 배포, run 44118863662)
상태: 지시서. 코드 변경 없음. Cursor가 PR만 연다. 머지 금지.
목표: 금요일(2026-11-20) 오픈 전에, **처음 오는 비로그인 손님**이 보는 홈(`https://study114.net/`)의 내려받는 양을 줄이고, 다시 올 때 폰트를 다시 받지 않게 한다. Pretendard Medium(500)을 빼서 첫 방문 폰트를 약 263 KB 줄인다(종현 동의 2026-11-18). 같이, 공부방상세등록(`/register/room/`) 오른쪽 정보글 3건은 폼이 먼저 그린 뒤에 받고, 같은 화면의 `register.php` `masters`와 `load`는 한꺼번에 보낸다. 로그인·세션·지도 순서는 건드리지 않는다. `main.js` 금지는 유지하되, **H만** `preview/study-room-ui/src/main.js` 185~188행 예외다.

## 명령

```
git fetch 후 origin/docs/reapply-2026-11-17의 docs/worklog/grok-sync/reapply-2026-11-17/10-home-first-paint-preopen.md 그대로 실행(A·C·D·E·F·G·H 커밋 분리, B는 확인만). 허용 파일 밖·세션·지도 SDK 로딩 시점·capture 클릭 수정 금지. main.js는 home-ui·search-ui·tutor-ui 금지. study-room-ui/src/main.js는 H의 185~188행(register.php masters와 load를 Promise.all로 동시 요청)만 예외이고 그 파일의 다른 줄은 금지. 수락 표(전후 전송량·첫 글자·LCP)와 세 모드 일반·시크릿 실클릭, 비로그인 전 페이지 화면 비교, 공부방상세등록 폼 첫 그림 전후와 정보글 표시, G 굵기 화면 비교, H 네트워크 겹침·신규·기존 저장 확인 후 PR만, 머지 금지.
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
| G | `preview/shared/fonts/pretendard.css` | Medium(500) `@font-face` 블록만 삭제 |
| G | `preview/shared/fonts/Pretendard-Medium.subset.woff2` | 파일 삭제(다른 굵기·OFL.txt는 그대로) |
| H | `preview/study-room-ui/src/main.js` | 185~188행만. `masters`와 `load`를 `Promise.all`로 동시에. **main.js 금지의 유일한 예외** |
| 기록 | `docs/worklog/2026/11/2026-11-18-home-first-paint-preopen.md` | 결과 기록 |

`main.js`는 home-ui·search-ui·tutor-ui를 한 줄도 바꾸지 않는다. study-room-ui의 `main.js`는 **H의 185~188행만** 바꿀 수 있고, 그 파일의 다른 줄(`loadMasters`·`loadSavedRoom` 본문, 189행 이후 환영·이동·`render`)은 금지다. `auth-session.js`, 세션·엔트리 순서, `loadNaverMapsSdk` 시점(#235), capture 클릭 처리, 위 표에 없는 CSS·JS는 한 줄도 바꾸지 않는다.

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
- CSS 안 `font-weight` 사용 횟수: 700 358회, 600 285회, 800 92회, 500 48회, 400 20회 등. `preview/**/*.css`에서 `font-weight: 500` 또는 `var(--fw-medium)` 규칙은 69개( `pretendard.css`의 `@font-face`와 홍보 전용 `promo-v2.css`의 Gmarket은 제외). 종현이 2026-11-18에 Medium(500) 빼기를 동의했다. 69개 규칙은 그대로 두고, 브라우저가 400(Regular)으로 그린다. 600은 그대로 둔다.

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
- 배포 뒤: Cloudflare에 이미 저장된 폰트는 그 저장이 끝날 때까지 옛 헤더(4시간)로 나갈 수 있다. Cursor는 CF를 건드리지 않는다. 기록에 "배포 뒤 몇 시간 안에 `curl -sI https://study114.net/assets/Pretendard-Regular.subset-BZqc2FCe.woff2`가 1년으로 바뀌는지 확인, 늦으면 종현이 CF 대시보드에서 남은 Pretendard 3종(Regular·SemiBold·Bold) 주소만 Purge" 라고 적는다. Medium은 G에서 빠지므로 요청되지 않는다.

수락: 운영 배포 뒤 남은 Pretendard 3종 주소가 `public, max-age=31536000, immutable`, 비로그인 홈은 Medium을 내려받지 않음(G), 홍보 폰트 3개는 그대로.

## B. 폰트 표시 (확인만, 이번 PR에서 수정 없음)

- `font-display: swap`은 7개 모두 이미 있다. 추가할 것 없음.
- **preload는 넣지 않는다.** 글자는 swap으로 먼저 보이고, 260 KB짜리 폰트를 미리 받게 하면 느린 모바일에서 JS·CSS(첫 화면을 그리는 파일)와 대역폭을 다툰다.
- 홍보 폰트 3개 선언은 C에서 `promo-v2.css`와 함께 엔트리 CSS에서 빠진다(홈에서 내려받지는 않던 것이라 CSS 글자 수만 준다).
- Pretendard 500(Medium) 빼기는 종현 동의(2026-11-18)로 이 지시서 **G**에서 한다. 600(SemiBold) 빼기와 글자 범위별 분할(unicode-range)은 화면 굵기·파일 구조가 바뀌어 **오픈 후**. 내부문서 1.2.1에 적었다.

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


## G. Pretendard Medium(500) @font-face 빼기

커밋: `10 perf(font): Pretendard Medium(500) @font-face 제거`

허용 파일: `preview/shared/fonts/pretendard.css`, `preview/shared/fonts/Pretendard-Medium.subset.woff2`(삭제). `origin/main` `a738c84c`에서 경로와 내용을 확인했다. 홈·찾기·등록·로그인 앱이 모두 `preview/home-ui/src/styles/tokens.css` 6행 `@import '../../../shared/fonts/pretendard.css'`로 이 파일을 쓴다.

`origin/main`의 `preview/shared/fonts/pretendard.css` 10~16행(이 블록만 지운다):

```css
@font-face {
  font-family: 'Pretendard';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('./Pretendard-Medium.subset.woff2') format('woff2');
}
```

하는 일:

1. 위 500 `@font-face` 블록만 삭제한다. 400·600·700 블록과 주석(1행, OFL)은 그대로 둔다.
2. `preview/shared/fonts/Pretendard-Medium.subset.woff2` 파일을 삭제한다(원본 268,324 B, 약 263 KB). 같은 폴더의 Regular·SemiBold·Bold woff2와 `OFL.txt`는 지우지 않는다.

하지 말 것:

- 69개 `font-weight: 500` / `font-weight: var(--fw-medium)` / `var(--fw-medium, 500)` 규칙은 **한 줄도 바꾸지 않는다.** (`preview/**/*.css`에서 `pretendard.css`의 `@font-face`와 홍보 전용 `promo-v2.css`를 뺀 개수. `--fw-medium: 500` 토큰 정의는 규칙이 아니다.)
- `preview/home-ui/src/styles/tokens.css`의 `--fw-medium: 500`은 그대로 둔다. 규칙이 500을 가리키면 브라우저가 없는 500을 400으로 그린다.
- 홍보 전용 `PV2 Gmarket Sans` 500은 다른 폰트다. `promo-v2.css`와 `/assets/promo/fonts/gmarket-sans-medium.woff2`는 건드리지 않는다.

화면 영향(조사): 비로그인 홈에서 500을 쓰는 글자는 로고 옆 작은 글 「우리동네 공부방과외」, 오른쪽 레일(방 이름·더보기·베스트·공지·정보글 제목), 바닥글 링크 정도다. 메뉴와 버튼은 600·700이라 그대로다. 500이 빠지면 그 글자는 Regular(400)로 조금 얇아 보일 수 있다. 종현이 큰 디자인 문제는 없을 것으로 보고 동의했다.

수락: 비로그인 홈 Network에 `Pretendard-Medium`이 없고, 폰트 합계가 약 263 KB 준다(1,052 → 약 789 KB). 고치기 전후 스크린샷을 나란히 둔다. 대상은 홈 태그라인 「우리동네 공부방과외」, 오른쪽 레일, 바닥글, 로그인·가입 라벨, 마이페이지 탭·왼쪽 메뉴, 찾기 카드, 등록 폼 라벨이다. 공부방·과외쌤·학생 모두. 레이아웃이 밀리거나 넘치지 않는다.

## H. 공부방상세등록 register.php `masters`와 `load`를 동시에

커밋: `10 perf(register): register.php masters와 load를 동시에`

허용 파일: `preview/study-room-ui/src/main.js`만. **이 지시서에서 main.js 금지의 유일한 예외**이며, 바꿀 수 있는 것은 아래 부트 사슬(185~188행)뿐이다. `home-ui`·`search-ui`·`tutor-ui`의 `main.js`는 금지. `register-api.js`는 바꾸지 않는다.

`origin/main` `a738c84c`의 `preview/study-room-ui/src/main.js` 185~188행(현재 코드):

```js
  const mastersReady = loadMasters();
  initChromeSession()
    .then(() => mastersReady)
    .then(() => loadSavedRoom())
```

이미 있는 동작: `loadMasters()`(137~148행)는 `initChromeSession()`과 같이 시작한다(주석: 「masters 는 세션과 병렬. 실패해도 저장값 불러오기는 이어간다」). `fetchMasters()`는 `register.php` `action: 'masters'`(약 48 KB)다. 그다음 `mastersReady`가 끝난 뒤에야 `loadSavedRoom()`(154~179행)이 `register.php` `action: 'load'`(약 4 KB)를 보낸다. 이 줄 서기가 고칠 지점이다.

`loadSavedRoom` 주석(151~152행): `initChromeSession()`이 끝난 뒤에만 호출한다. guest/intro면 저장값을 넣지 않는다. **세션이 끝나기 전에 `loadSavedRoom()`을 시작하지 않는다.**

하는 일: 세션이 끝난 뒤 `masters` 완료를 기다리지 말고, 남은 `masters`와 `load`를 함께 보낸다. 결과는 둘 다 끝난 뒤에 지금과 같은 189행 `then`으로 넘어간다.

```js
  const mastersReady = loadMasters();
  initChromeSession()
    .then(() => Promise.all([mastersReady, loadSavedRoom()]))
    .then(() => {
```

지키는 것:

- `loadMasters`·`loadSavedRoom` 본문은 그대로 둔다. `loadMasters`는 성공 시 `apiMasters`에 넣고, 실패해도 `.catch(() => {})`로 이어간다. `loadSavedRoom`은 try/catch로 `null`을 반환한다. 바깥 `.catch`(221행)도 그대로다. 이 두 함수가 이미 오류를 삼키므로 `Promise.all`이 한쪽 실패로 깨지지 않는다. 잡기를 빼지 않는다.
- 적용 대상이 다르다(`apiMasters`와 `registerState`). 화면을 그리는 189행 이후는 둘 다 끝난 뒤에만 실행되므로, 지금처럼 마스터를 먼저 넣고 `load`를 넣는 순서와 같은 그림이 나온다. 189행 이후(환영 인사, `chromeReady`, 기본정보 완료 시 lesson 이동 205~217행, `render`)는 한 줄도 바꾸지 않는다.
- `loadMasters()`를 세션과 같이 시작하는 185행은 유지한다.

수락: 공부방상세등록을 메뉴로 열었을 때 Network 시간줄에서 `register.php`의 `masters`와 `load`가 겹친다(`load`가 `masters` 끝을 기다리지 않음). 기본정보·상세정보1·상세정보2가 열리고 저장된다. 저장값이 없는 새 이용자와 이미 저장한 이용자 모두, 일반 창과 시크릿 창. 멈춤 없음.

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
9. G 수락: 비로그인 홈에서 Medium을 받지 않음. 홈 태그라인 「우리동네 공부방과외」, 오른쪽 레일, 바닥글, 로그인·가입 라벨, 마이페이지 탭·왼쪽 메뉴, 찾기 카드, 등록 폼 라벨의 전후 스크린샷(공부방·과외쌤·학생). 레이아웃 밀림·넘침 없음.
10. H 수락: Network에서 `register.php` `masters`와 `load`가 겹침. 기본정보·상세정보1·상세정보2 열기·저장이 신규(저장 없음)·기존 이용자, 일반·시크릿 모두 정상. 멈춤 없음.
11. 운영 로그인을 Cursor가 못 하면 "미확인"으로 적고 멈추지 않는다. 종현이 배포 뒤 운영에서 2·3·7·8·9·10을 본다.

## 예상 이득 (약속 아님, 박스 조사 기준)

- 첫 방문: Medium 빼기 약 −263 KB(폰트 1,052 → 약 789 KB). 엔트리 CSS gzip 약 −17 KB(107.6 → 90.2), 로고 약 −9 KB. 첫 글자·LCP는 CSS·로고만으로는 큰 변화가 없을 수 있으나, Medium을 빼면 첫 방문 내려받는 양이 눈에 띄게 준다.
- 재방문(4시간 뒤): 남은 Pretendard 3종(약 789 KB)을 다시 받지 않는다(A, 1년 캐시).
- 공부방상세등록: 정보글 3건(약 700 ms, 지시서 09 조사)이 폼 첫 그림과 같이 나가지 않는다. 폼이 먼저 보이고, 글은 그 뒤에 뜬다. `masters`와 `load`는 겹쳐 나가서, 줄 서서 기다리던 시간만큼 줄어들 수 있다.

## 되돌리기

커밋별 `git revert`. C는 `vite.config.js`·CSS 파일·import 줄이 한 커밋이라 한 번에 되돌아간다. A는 `.htaccess` 블록 하나. F는 `preview/study-room-ui/src/layout.js` 하나. G는 `pretendard.css`와 Medium woff2 복구. H는 `preview/study-room-ui/src/main.js`의 해당 사슬만.
