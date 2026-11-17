# 10 오픈 전 비로그인 홈 첫 화면 가볍게

지시: `origin/docs/reapply-2026-11-17` 의 `docs/worklog/grok-sync/reapply-2026-11-17/10-home-first-paint-preopen.md`  
기준: `origin/main` `a738c84c`  
브랜치: `work/10-home-first-paint-preopen`  
작업 트리: `D:\work\study114\.wt\work-10-home-first-paint`  
더러운 체크아웃 `D:\work\study114` (`work/350-email-normalize`) 는 건드리지 않았다.

## 커밋

| | hash | 메시지 |
|---|---|---|
| A | `0700cf9a` | 10 perf(cache): 해시 붙은 woff2 폰트에 1년 immutable 캐시 |
| C | `4caa5fe0` | 10 perf(css): 홍보 v2·유료상품 CSS를 그 화면 조각으로 옮김 (main.js 그대로) |
| D | `747bf57f` | 10 perf(img): 헤더 워드마크를 표시 크기 3배로 줄임 (같은 파일명) |
| E | `f9e1e58c` | 10 fix(mypage): 최근열람 빈 화면 탐색하기는 역할별 찾기로 |
| F | `0dee6d22` | 10 perf(register): 공부방상세등록 정보글은 폼 그린 뒤에 |
| G | `e88fe009` | 10 perf(font): Pretendard Medium(500) @font-face 제거 |
| H | `65fe68b1` | 10 perf(register): register.php masters와 load를 동시에 |

B는 수정 없음. home-ui·search-ui·tutor-ui `main.js` 는 변경 없음. study-room-ui `main.js` 는 H의 부트 사슬만 변경.

## A. 해시 폰트 캐시 정규식

`^[A-Za-z0-9._-]+-[A-Za-z0-9_-]{8}\.woff2$`

| 이름 | 결과 |
|---|---|
| Pretendard-Regular.subset-BZqc2FCe.woff2 | 맞음 |
| Pretendard-Medium.subset-D07TkZcI.woff2 | 맞음 |
| Pretendard-SemiBold.subset-DdMYyxPR.woff2 | 맞음 |
| Pretendard-Bold.subset-NvQkMce4.woff2 | 맞음 |
| gmarket-sans-bold.woff2 | 안 맞음 |
| gmarket-sans-medium.woff2 | 안 맞음 |
| nanum-pen.woff2 | 안 맞음 |

`node scripts/check-cache-headers.mjs` 통과. woff2 FilesMatch 블록 존재 OK.

배포 뒤 몇 시간 안에 `curl -sI https://study114.net/assets/Pretendard-Regular.subset-BZqc2FCe.woff2` 가 `public, max-age=31536000, immutable` 로 바뀌는지 확인. 늦으면 종현이 Cloudflare에서 남은 Pretendard 3종(Regular·SemiBold·Bold) 주소만 Purge. Medium은 G에서 빠져 요청되지 않는다. Cursor는 CF를 건드리지 않았다.

## B. 폰트 표시 (수정 없음)

남은 `@font-face` 는 `font-display: swap` 이다. preload는 넣지 않았다. 홈 `index.html` 에 폰트 preload 링크 없음.

## C. CSS 조각

`npm run build:dothome` 성공.

엔트리 CSS `index-CFLIVbuK.css`: 원본 568,923 B, gzip 90,128 B, brotli 70,080 B.  
박스 조사 목표(원본 약 569 kB, gzip 약 90 kB)와 같다. 전(박스, 같은 커밋)은 원본 676.17 kB, gzip 107.63 kB.

엔트리 CSS 문자열: `pv2-` 0, `PV2 Gmarket` 0, `.refund-policy-list` 3.  
`.plans-theme` 1건은 `udx-std-apply.css` 의 `.plans-theme .btn` 버튼 모서리 규칙이다. 허용 파일 밖이라 옮기지 않았다.

`.vite/manifest.json` 은 이 빌드 설정에 없다. Vite `__vite__mapDeps` 로 조각 CSS가 붙은 JS:

| CSS | 원본 | gzip | 붙는 JS |
|---|---:|---:|---|
| index-CFLIVbuK.css | 568.92 kB | 90.13 kB | index-DEJ29LpN.js (엔트리, index.html) |
| screens-D0Oz9yQ_.css | 75.81 kB | 12.28 kB | screens-cfD-tzeY.js (plans/screens). plans `index-CmGZNMRX.js`, 마이페이지 `index-oUxPijh7.js` 가 같이 받음 |
| quick-match-view-CzM0PG2f.css | 24.81 kB | 5.29 kB | quick-match-view-CVkn1moF.js. 홍보 `index-CHapxc_7.js` 도 같이 받음 |
| index-54cr-kkx.css | 4.21 kB | 0.87 kB | index-D9MFGCHU.js (admin) |
| index-BJoXAcsf.css | 1.72 kB | 0.66 kB | index-oUxPijh7.js (mypage) |
| withdraw-reason-ui-BcOuTdMc.css | 0.77 kB | 0.35 kB | withdraw-reason-ui-eW98bt9g.js |

`npm run verify:paid-renewal` PASS 38 / FAIL 0.

다른 앱 CSS: C만으로는 소스가 같다. G가 공유 `pretendard.css` 의 Medium `@font-face` 를 빼서 해시가 바뀐다. Medium 블록만 지우고 비교하면 auth·search·study-room·tutor CSS가 서로 같다. search는 Medium 블록이 2개(같은 선언이 두 번 들어가 있던 기존 빌드)이고, 그 둘만 빠진다. JS 바이트는 전과 같다.

## D. 로고

866×281 (18,791 B) → 297×96 (7,559 B). 세 경로 해시 동일. 모서리 알파 0. 로그인 화면에서 naturalWidth 297, naturalHeight 96. 글자가 풀려 보이지 않음.

## 수락 표 (전송량·첫 글자·LCP)

전(운영, 지시서 박스 조사, 미국 서부, 빈 캐시, 지도 타일 포함):

| | 데스크톱 1440 | 모바일 390 (느린 망·CPU 4배) |
|---|---:|---:|
| JS | 291 KB | 289 KB |
| CSS | 121 KB | 119 KB |
| 폰트 | 1,052 KB | 1,055 KB |
| 이미지 | 605 KB | 554 KB |
| FCP | 1,736 ms | 2,824 ms |
| LCP | 2,000 ms (catalog-study.webp) | 3,324 ms (같은 카드) |

후(로컬 `http://127.0.0.1:4174`, gzip 정적 서버, 캐시 끔, 1회. PHP·지도 SDK 없음. 3회 중간값이 아님):

| | 데스크톱 1440 | 모바일 390 (지연 150ms, 다운 1.6Mbps, 업 750kbps, CPU 4배) |
|---|---:|---:|
| JS | 196,225 B | 196,225 B |
| CSS | 90,428 B | 90,428 B |
| 폰트 | 807,532 B (3종, Medium 없음) | 807,532 B (3종, Medium 없음) |
| 이미지 | 91,444 B | 85,679 B |
| FCP | 208 ms | 680 ms |
| LCP | 308 ms (catalog-study.webp) | 1,164 ms (catalog-study.webp) |

로컬 시간은 왕복이 거의 없고 지도 타일이 없어 운영 시간과 비교하지 않는다. 폰트는 woff2라 전송량이 파일 크기와 같다. 1,052 KB → 807 KB.

이 머신에서 운영 `https://study114.net` 을 한 번 열었을 때 CSS 디코드는 `style-rrJNRl_0.css` 676,169 B(지시서와 같은 해시)이고, Pretendard-Medium 요청이 있었다. 그 로드는 캐시가 남아 transferSize가 300 B(재검증)라 빈 캐시 전송량으로 쓰지 않는다. FCP 832 ms, LCP 2,012 ms 는 네이버 지도 타일이었다.

재방문 폰트 KB: 로컬 정적 서버는 Apache 캐시 헤더를 안 보낸다. A의 1년 캐시는 배포 뒤 위 curl로 확인.

## 비로그인 화면 (로컬, 메뉴·해시 이동)

데스크톱 폭에서 제목이 그려지고 Vite 오류 오버레이는 없었다.

| 경로 | 제목 | 스타일시트 |
|---|---|---|
| /promo/study-room | 공부방 카탈로그 | 엔트리 + quick-match-view CSS. `.pv2` 있음 |
| /promo/tutor | 과외쌤 카탈로그 | 같음 |
| /promo/parent | 우리동네 학생 | 같음 |
| /promo/quick-match | 실시간 퀵매칭 | 같음 |
| /guide | 이용안내 | 같음 |
| /plans | 무료로 시작하고, 필요할 때만 올린다 | 위 + screens CSS. `.plans-theme` 있음 |
| /about | 서비스 소개 | 조각 CSS는 남아 있고 `.plans-theme` 는 없음 |
| /register-intro/room | 공부방 상세정보 | 같음 |
| /register-intro/tutor | 과외쌤 상세등록 | 같음 |
| /guest (홍보·유료상품 다녀온 뒤) | 우리동네 대치동 | `.plans-theme` 없음. 홈 제목 유지 |
| /auth/#/login | 우동공과에 오신 걸 환영해요 | auth CSS `index-B73208Fk.css` 만. 로그인·비밀번호·소셜 버튼 있음 |

로컬에는 PHP가 없어 공지·목록은 「길이 막혔어요」다. 스타일이 빠진 화면은 없었다. 지도는 「아직 등록지역이 검색되지 않습니다」(키·지역 API 없음).

## G. 굵기

비로그인 홈 Network에 `Pretendard-Medium` 없음. 태그라인 「우리동네 공부방과외」 computed font-weight 400, font-family Pretendard. 바닥글 링크 규칙은 500이 그대로이고, 500 파일이 없어 Regular로 그려진다. 로그인 화면 「로그인」 라벨 computed 400. 홍보에 들어갔을 때 받는 글꼴은 `gmarket-sans-medium.woff2`(다른 폰트)와 `nanum-pen.woff2` 이다. 레이아웃이 밀리거나 넘친 화면은 위 목록에서 보이지 않았다.

공부방·과외쌤·학생 로그인 화면의 마이페이지 탭·찾기 카드·등록 폼 라벨 나란히 비교는 미확인.

## 미확인 (로그인·PHP 필요)

지시서 11항. 로컬 정적 서버는 PHP가 없고, 시험 계정 로그인은 이 세션에서 하지 않았다. 멈추지 않고 미확인으로 적는다. 배포 뒤 종현 확인:

- 세 역할 일반·시크릿, GNB 실클릭, 공부방 홈↔찾기 두 번
- E 최근열람 빈 화면 「탐색하기」 4갈래, 「내 등록」은 마이페이지
- F 공부방상세등록 기본정보·상세정보1·상세정보2, 폼 그린 뒤 정보글 요청, 글이 보임
- G 로그인 상태 굵기 나란히 비교
- H `register.php` masters와 load 시간 겹침, 신규·기존 저장

## PHP 세션 잠금 (코드만, 수정 없음)

| 파일 | close |
|---|---|
| `src/Auth/AuthSession.php` | `start()` 31행 `session_start`. `close()` 46–51행 `session_write_close`. `userIfActive()` 156–186행은 status SELECT 동안 세션을 연 채로 두고, 비활성·없음일 때만 안에서 close |
| `public/api/auth/me.php` | 77행 `userIfActive()`, 82행 `close()`. 그 다음 관리자 플래그 질의는 잠금 밖 |
| `public/api/search/search.php` | 53행 `user()`, 54행 `close()`. 검색 질의 전 |
| `public/api/study-room/register.php` | `masters` 는 80–85행에서 세션을 열지 않고 끝. `load` 등은 90–91행에서 user 직후 close |
| `public/api/tutor/register.php` | 같은 구조, close 92행 |
| `public/api/study-room/public.php` | 43행, user 직후 |
| `public/api/neighborhood-greeting-card.php` | 42행, user 직후 |
| `public/api/auth/login.php` | 68행, 로그인 처리 뒤 |
| `public/api/auth/withdraw.php` | 42행, user 확인 뒤 |
| `public/api/auth/phone/send-otp.php` | 35행 |
| `public/api/auth/phone/verify-otp.php` | 35행 |
| `src/Registration/RegistrationApi.php` | 42행 `requireAuth` |

같은 세션으로 `me.php` 와 `search.php` 를 동시에 보낸 시작·끝 시각 3회는 미확인(로그인 세션 없음). 코드만 보면 me.php 잠금은 status SELECT 1회, search.php는 user() 직후 푼다. 실측 ms는 오픈 후.

## 배포 전 사용자 할 일

- A는 `public/.htaccess` 캐시 블록이다. 배포 워크플로가 이 파일을 올린 뒤, 위 curl이 1년이 아니면 Cloudflare에서 Pretendard Regular·SemiBold·Bold 만 Purge.
- SQL·비밀값 변경 없음.
