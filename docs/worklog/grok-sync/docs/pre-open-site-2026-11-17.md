# 오픈 전 사이트 작업 지시서 (2026-11-17)

기준: origin/main `3fab37196e26a7b51e87030b7dc94edd68fd8bfd` (PR #226 머지·배포 뒤).
브랜치: origin/main에서 새로 딴다. 권장 이름 `work/pre-open-site-2026-11-17`.
한 PR, 항목별 커밋. **PR만 올린다. 머지·배포 금지.**

목적: 종현이 할 일(전화번호 확정, Cloudflare CSP 반영, PG 재신청)을 빼고, 사이트에서 할 오픈 전 작업만 한다.

## 하지 말 것
- 결제·가격·API·운영 SQL 변경. 전화번호를 만들어 넣지 말 것.
- 머지, 배포, force push, reset --hard, stash drop.
- 새 디자인·새 컴포넌트. 기존 클래스·셸을 그대로 쓴다.
- 시크릿·키를 커밋하거나 대화에 붙이지 말 것.
- `STUDY114_PAID_MOCK_COMPLETE` 를 운영에 넣지 말 것.

## 1. 카카오 우편번호 도메인 교체 (11/30 마감)

스크립트 URL을 아래로 바꾼다.

`https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js`

| 위치 | 줄 (3fab3719) |
|------|----------------|
| `preview/shared/kakao-postcode.js` 주석·`SCRIPT_SRC` | 4, 9 |
| `src/Views/auth/signup-form.php` | 67 |
| `src/Views/auth/partials/basic-study-room.php` | 56 |

`daum.Postcode` 폴백(`kakao-postcode.js:16`)은 유지한다.

### 운영 CSP — 레포에 없음. 코드로 고치지 말고 PR 본문에 위치와 문구를 적는다.

확인(2026-11-17, `curl -sI https://study114.net/` · `/auth/` · `/search/` 동일, `server: cloudflare`).

- `public/.htaccess`에 CSP 없음. PHP `header()`에도 없음. 배포 워크플로에도 없음.
- 위치: Cloudflare Response Header Transform. zone `study114.net`. ruleset `132970d7c91c492d848cef06caa75d26` (`http_response_headers_transform`). rule `857266f312294446b4c30520efd0ef68`. 기록: `docs/worklog/2026/11/2026-11-11-345-csp-kakao-postcode.md:40-44`.
- 지금 헤더에 `t1.daumcdn.net`은 `script-src`·`connect-src`·`frame-src`에 있다. `postcode.map.daum.net`·`postcode.map.kakao.com`은 `connect-src`·`frame-src`에만 있다. **`t1.kakaocdn.net`은 세 지시어 모두에 없다.**
- **추가:** `https://t1.kakaocdn.net` 를 `script-src`, `connect-src`, `frame-src`에 넣는다. 기존 `t1.daumcdn.net`·`*.daumcdn.net`·`postcode.map.daum.net`·`postcode.map.kakao.com`은 유지. `unsafe-inline`/`unsafe-eval` 추가 금지. 다른 지시어·도메인 변경 금지.
- 이 변경은 종현이 Cloudflare에서 한다. 레포 `.htaccess`에 CSP를 새로 넣지 않는다.
- 로컬 `preview/home-ui/vite.config.js:32-36, 57-61` CSP에는 원래 daumcdn도 없다. 로컬에서 주소검색을 확인할 때만 kakaocdn을 같은 세 지시어에 넣는다. 운영 헤더와 섞지 않는다.

## 2. 푸터 라벨 「요금 안내」→「유료상품」

화면 제목과 맞춘다. href는 그대로 `/plans/positions`(JS), `/#/plans/positions`(PHP).

| 위치 | 줄 |
|------|----|
| `preview/shared/site-footer.js` `SITE_FOOTER_LINKS` | 32 |
| `src/Site/SiteFooterCopy.php` `policyLinks()` | 50 |

다른 「요금 안내」 문구는 이 두 곳이 전부다(코드 기준).

## 3. PG 심사용 정적 사업자정보

JS 푸터에는 이미 상호·대표·주소·사업자번호·통신판매업신고가 있다. 전화는 비어 있으면 숨긴다.

```
SITE_FOOTER_COMPANY / SiteFooterCopy::company()
상호 제이에이치커머스(서비스명 우동공과)
대표 이종현
주소 경기도 의정부시 능곡로26번길 40, 101동 1101호
사업자등록번호 471-29-01819
통신판매업신고 제2025-의정부송산-0680호
이메일 help@study114.net
phone: ''   ← 단일 상수. 번호를 만들지 말 것. 나중에 종현이 채운다.
```

정본 파일: `preview/shared/site-footer.js:18-26`, `src/Site/SiteFooterCopy.php:30-38`.

### 정적 HTML
Vite 앱 엔트리 5개 모두의 `index.html` raw HTML에, 로그인 없이·JS 없이 보이는 사업자정보 블록을 넣는다.

- `preview/home-ui/index.html`
- `preview/search-ui/index.html`
- `preview/auth-ui/index.html`
- `preview/study-room-ui/index.html` (등록 부트 폴백 유지)
- `preview/tutor-ui/index.html` (등록 부트 폴백 유지)

`dist/`는 빌드 산출물이므로 직접 고치지 않는다.

넣을 내용(문구는 위 상수와 동일): 상호, 대표, 사업자등록번호, 통신판매업신고, 사업장 주소, 전화번호 칸(상수 `phone`, 지금은 비움), 한 줄 소개 `우동공과는 공부방·과외쌤과 학생을 쪽지로 연결하는 지역 공부방 포털입니다.`, 「사업자정보확인」 링크 `https://www.ftc.go.kr/bizCommPop.do?wrkr_no=4712901819` (`rel="noopener noreferrer"`, 새 탭).

배치: `#app` **바깥** 형제(뒤에 둠). 첫 페인트에서 `#app`을 통째로 갈아끼우기 때문이다(`preview/home-ui/src/main.js:134, 246, 469` 등). `renderSiteFooter`(`preview/shared/site-footer.js:127`)가 그려지면 이 정적 블록을 숨기거나 제거한다. 푸터가 두 개 보이면 안 된다. 새 JS/CSS 파일을 만들지 않는다. HTML 조금만 늘린다.

### JS·PHP 푸터에도 「사업자정보확인」
`renderCompanyBlock`(`site-footer.js:81-85`)과 `src/Views/partials/site-footer-legal.php:49-53`의 사업자등록번호 옆에 같은 링크를 붙인다. 전화번호는 지금처럼 값이 있을 때만 보여 준다.

## 4. 서비스 소개 페이지 `#/about`

비로그인 공개. 새 디자인 없이 고객센터·약관 셸을 그대로 쓴다(`preview/home-ui/src/support/shell.js`의 `sup-layout` / `renderSupportShell` 또는 같은 클래스). 고객센터 왼쪽 메뉴에 억지로 넣지 않는다.

본문은 이 문구만 쓴다.

- 우동공과는 공부방·과외쌤과 학생을 쪽지로 연결하는 지역 공부방 포털입니다.
- 이용 대상은 공부방, 과외쌤, 학생/학부모입니다.
- 지역을 고르면 그 동네의 공부방·과외쌤·학생 수요를 지도와 목록으로 보고, 쪽지로 연락합니다. 상세 정보와 쪽지는 로그인 후 이용할 수 있습니다.
- 유료상품 링크 `#/plans`(또는 `/plans`). 고객센터 링크 `#/support`.

라우팅 (역할 홈 `ROUTES`에는 넣지 않는다):

- `preview/shared/route-access.js` `isGuestPublicPath`에 `p === '/about'` (지금 공개 경로 목록은 225-251줄).
- `getCurrentScreen`(`preview/home-ui/src/state.js:939`)·`main.js` 로더·pathname 딥링크 목록(`main.js:529` 근처 `/plans` 등과 같이)에 `#/about`을 넣는다. 비로그인 게이트에 걸리면 안 된다.
- 푸터 링크 「서비스 소개」→ `#/about`: `SITE_FOOTER_LINKS`(`site-footer.js:28-35`), `SiteFooterCopy::policyLinks()`(`SiteFooterCopy.php:46-53`).

## 5. 공부방 로그인 홈 지도 박스

「우리동네 공부방」탭(`provider-home.js:31, 41`, `homeSelf: true`. `study-room.js:139, 151`의 `showMyBox`).

**왼쪽 내 공부방 박스(`renderMyStudyRoomBox`)는 그대로 둔다.** 오른쪽 지역 요약 카드만 뺀다.

| 할 일 | 위치 (3fab3719) |
|-------|-----------------|
| 오른쪽 카드 제거 | `renderStudyRoomAreaCard` `preview/home-ui/src/screens/study-room.js:103-126`. `renderStudyRoomSelfHero`(128-134)에서 이 호출만 뺀다. |
| 지도 위 기존 오버레이를 다시 보이게 | 지금은 홈에서 숨긴다. `preview/search-ui/src/search-find-surface.js:314` `hideMapBanner: variant === 'home' && studyRoomPromoMap`. `search-map.js:156-164`는 이 값이 참이면 `aside.hero-map__banner`를 안 그린다. 홈에서도 게스트 홈·공부방찾기와 같은 `hero-map__banner`가 나오게 한다. |
| 박스 내용 | 지역명, 공부방 수, **학생 수**, 안내문. **과외쌤 수는 넣지 않는다. 찾기 버튼은 넣지 않는다.** 홈·찾기 공통 분기: `search-map.js:109-117` (`bannerStyle === 'provider_room' && ctx.providerHome`). 지금은 공부방 수만 있다. |
| 공부방찾기 오버레이에도 학생 수 | 찾기 방 탭도 `providerHome: true`(`search-find-surface.js:297, 313`)라 같은 분기를 탄다. 여기에 학생 수를 넣으면 홈과 찾기가 같아진다. 찾기 박스의 **폭은 지금 그대로** 둔다. |
| 홍보지역 알약 클릭 → 지도·박스가 같이 바뀜 | 알약은 지금 `<span>`이라 클릭이 없다(`study-room.js:52-69` `renderStudyRoomRegionPills`). 버튼으로 바꾸고, 과외쌤 지역 탭 패턴을 따른다(`search-find-region.js:868` `renderTutorRegionTabs`, 바인드 `search-find-surface.js:927` `data-tutor-region`). |
| 홈 지도 질의 | `resolveStudyRoomMapQuery`(`study-room-home-seed.js:135-168`)는 「홈 지도는 항상 대표 슬롯」이다. 고른 홍보 슬롯(2·3 포함)을 쓰게 한다. 지도 중심·핀·박스 지역명·공부방 수·학생 수가 그 슬롯으로 바뀌어야 한다. |

학생 수 출처: 기존 GET `/api/search/region-stats.php`의 `studentRequests`. 클라 진입은 `preview/shared/location-display.js:701, 739` 근처. **API를 바꾸지 않는다.** `bootStudyRoomStudentDemand` 목록 길이(`study-room-home-seed.js:222-276`, `limit: 20`, 홍보1만)를 학생 수로 쓰지 않는다. 실패하면 게스트처럼 대시(`—`)를 유지하고 더미 숫자를 넣지 않는다.

폭: 공부방 **홈만**. 기존 클래스에 modifier 하나만 추가한다. 지금 PC 오버레이는 `width: min(15.5rem, calc(100% - 2rem))`(`preview/search-ui/src/styles/search-visily.css:41-46`). 홈에서는 지도(바디) 가로폭 전체로 늘린다. 예: `left: 1rem; right: 1rem; width: auto`. 모바일(719px 이하)은 이미 `width: 100%`(125-135). 게스트 홈·공부방찾기 박스 폭은 바꾸지 않는다. 새 시각 디자인 금지.

## 수락 기준
1. 빌드 성공. 홈 entry 크기가 의미 있게 늘지 않는다(지금 약 660KB대. 보고에 전후 숫자를 적는다).
2. 로그아웃·로그인 화면은 위에 적은 항목 외에는 그대로다.
3. 주소검색 스크립트가 `t1.kakaocdn.net`을 로드한다. PR 본문에 운영 CSP 위치·추가 문구가 있다.
4. 푸터 라벨이 「유료상품」이다. 「서비스 소개」·「사업자정보확인」이 있다. JS 꺼도(또는 view-source) 각 앱 `index.html`에 사업자정보가 보인다. JS가 뜨면 푸터가 하나다.
5. 비로그인 `#/about`이 열리고, 위 본문·유료상품·고객센터 링크가 보인다.
6. 공부방 로그인 「우리동네 공부방」: 오른쪽 지역 카드가 없고, 지도 위 박스에 지역명·공부방 수·학생 수·안내문이 있다. PC에서 박스가 지도 가로폭 전체다. 홍보지역 알약을 누르면 지도와 박스가 바뀐다. 과외쌤 수·찾기 버튼 없음.
7. 공부방찾기 오버레이에도 학생 수가 있고, 박스 폭은 기존과 같다.
8. 스크린샷: 푸터(JS 켜짐·view-source 또는 noscript), `#/about`, 공부방 홈 PC·모바일, 공부방찾기 오버레이, 알약 클릭 전후.

## 보고
tip, PR 번호(PR만, 머지 금지), 커밋 목록, 바뀐 파일, entry 크기 전후, 운영 CSP 위치와 추가할 문구, 수락 기준 결과와 스크린샷.
