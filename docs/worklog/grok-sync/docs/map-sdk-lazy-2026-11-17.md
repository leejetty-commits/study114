# 지도 SDK 지연 로딩 지시서 (속도 ③, 2026-11-17)

기준: `origin/main` `3693e6fc`(PR #232 머지본) 이후 최신. 새 `.wt` 워크트리, 새 브랜치 `work/map-sdk-lazy-2026-11-17`.
목표: 네이버 지도 JS SDK(`oapi.map.naver.com/.../maps.js`)를 **지도가 실제로 필요할 때만** 한 번 불러, 첫 화면이 빨라지게 한다. 지도 없는 화면에서는 SDK 요청이 0건이어야 한다.

이 문서는 붙여 넣고 바로 작업할 수 있게 썼다. 시안 없음. PR만 올리고 종현 승인 없이 머지하지 말 것.

## 1. 현재 상태 (코드로 확인, `3693e6fc`)

지도 SDK는 카카오가 아니라 **네이버 Maps JS SDK**다. 카카오 우편번호(`preview/shared/kakao-postcode.js`)는 이미 지연 로딩되어 있으니 **이번 범위 밖**.

- **HTML에 SDK 태그는 없다.** `preview/home-ui/index.html`, `preview/search-ui/index.html`, `preview/auth-ui/index.html`, `preview/study-room-ui/index.html`, `preview/tutor-ui/index.html` 어디에도 `maps.js` / `oapi.map.naver.com` 스크립트가 없다. 홈·찾기·인증은 `/src/main.js` 모듈만 있다.
- **로더는 이미 있다.** `preview/shared/naver-map.js` (소스 22,326B).
  - URL: `https://oapi.map.naver.com/openapi/v3/maps.js` (22행)
  - `loadNaverMapsSdk()` (150–176행): `VITE_NAVER_MAP_CLIENT_ID`로 `?ncpKeyId=...&submodules=geocoder`를 붙이고 `script.async=true`로 `document.head`에 삽입. `sdkPromise`로 한 번만 요청. `window.naver.maps`가 있으면 재삽입하지 않는다.
  - 호출은 두 곳뿐이다. `geocodeBusinessAddress` (219행, 주소 저장 지오코딩), `mountStudyRoomMap` (366행).
  - 마운트 실패 시 기존 문구: `showStatus(... 'error')` — 「… · 리스트는 계속 이용할 수 있습니다.」(542–545행). 키 미설정 시 「아직 등록지역이 검색되지 않습니다」(360–363행). 플레이스홀더 크기는 `.hero-map__surface--naver` / `.naver-map-mount-host` min-height(홈 CSS 1556–1570행, 상세는 1768행 부근 10rem).
- **문제는 로더 부재가 아니라, 모듈이 엔트리에 붙어 있고 게스트 홈 바인드가 첫 페인트와 동시에 SDK를 요청하는 것이다.**
  - 홈 엔트리 정적 의존:
    1. `preview/home-ui/src/main.js` → `screens/guest.js` → `guest-sections.js:14`가 `bindStudyRoomMapSection`, `GUEST_MAP_CENTER`를 `naver-map.js`에서 정적 import. 게스트 셸을 그리는 경로라 엔트리에 남는다.
    2. `main.js:98`이 `closeDetailModal`을 `detail-decision/detail-shell.js`에서 정적 import하고, `detail-shell.js:27`이 다시 `naver-map.js`를 정적 import.
  - 찾기 엔트리: `preview/search-ui/src/search-map.js:11`이 같은 모듈을 정적 import (`search-page.js` · `search-find-surface.js` 경로).
  - 게스트 홈은 셸 HTML을 그린 뒤 `bindGuestSectionEvents`에서 바로 `bindStudyRoomMapSection`을 호출한다(`guest-sections.js:284–289`). 첫 글자 페인트와 SDK 네트워크가 경쟁한다.
- **게스트 홈 캐시(PR #224/#225)와 지도의 관계 — 유지할 것.**
  - 로그인 흔적(`localStorage['study114.last-role']`, `preview/shared/last-role.js`)이 있으면 세션 확인 전에 게스트 지도를 그리지 않는다. `main.js:246–261` `paintNeutralShell()` — 헤더 + `.home-session-wait` 회색 칸만 (`home.css:402–435`). `shouldPaintBeforeSession()` (306–316행): `#/plans`·`#/promo`·마이페이지 등은 세션 전 게스트 홈을 그리지 않는다. 게스트 홈(`#/guest`)만, 흔적이 없을 때 셸을 먼저 그린다.
  - `sessionStorage['study114.snap.v1']` 스냅샷(등록 목록·홈 목록, 비밀번호·토큰 없음)과 3분 TTL 재요청 생략은 그대로. 이 작업에서 스냅샷 키·힌트 로직을 바꾸지 말 것.
- **지도가 있는 화면:** 게스트 홈 히어로, 공부방찾기(`search-ui` 및 역할 홈 찾기 탭, `search-find-surface.js` → `renderSearchMapBlock` / `bindSearchMapPinLinks`), 공부방 홈(알약 전환), 학생 홈의 공부방 지도, 공부방 상세 모달(`detail-shell.js:424`). 주소 저장 지오코딩(`study-room-basic-form.js:389` → `geocodeBusinessAddress`)은 화면 지도는 아니지만 SDK가 필요하다.
- **지도가 없는 화면(SDK 요청 0이어야 함):** `#/plans`, `#/plans/positions`, `#/plans/access`, `#/promo/*`, 마이페이지의 지도 없는 화면, 과외쌤 홈·찾기, 관리자 콘솔. 지금은 bind를 안 하므로 SDK 요청은 없어야 하지만, `naver-map.js` 코드는 홈 엔트리 파싱에 포함된다.
- **CSP.** 운영은 Cloudflare Enforce. 지도·지오코딩 도메인(`oapi.map.naver.com`, `maps.apigw.ntruss.com` 등)은 이미 허용된 상태로 문서화되어 있다. **운영 Cloudflare CSP는 변경하지 말 것.** 로컬 Vite CSP(`preview/home-ui/vite.config.js` 34·59행 `script-src` / `connect-src`)에는 `oapi.map.naver.com`이 없다. 로컬 확인이 막힐 때만 Vite 로컬·preview 헤더에, 실제 요청 도메인만 최소 추가한다. 포트원·카카오 우편(`t1.kakaocdn.net`) 기존 허용은 유지.
- **엔트리 크기.** 이 브랜치에서 `preview/home-ui` `vite build`로 전후를 다시 잰다. 직전 기록(PR #232): 홈 엔트리 JS 664.74 kB, 소개 청크는 별도.
- SDK 스크립트 바이트는 키 없이 여기서 재지 못했다. PR의 네트워크 캡처에 요청 URL·전송량·시작 시점을 남긴다.
- 환경 변수 이름은 `VITE_NAVER_MAP_CLIENT_ID` (`.env.example`). 키 값을 커밋·문서·채팅에 넣지 말 것.

## 2. 변경 계획

로더를 새로 만들지 말고, 있는 `loadNaverMapsSdk()`를 유일한 진입점으로 정리한 뒤 **호출 시점과 정적 import만** 고친다.

1. **로더.** `loadNaverMapsSdk()`를 유지한다. 한 번만 로드하고 promise를 캐시한다. `window.naver.maps`가 있으면 스크립트를 다시 넣지 않는다. 같은 URL의 스크립트 태그가 이미 있으면 재삽입하지 않고 onload를 기다린다. 실패하면 캐시를 비워 다음 호출이 재시도할 수 있게 한다. export가 필요하면 해도 된다.
2. **홈 엔트리에서 `naver-map.js` 정적 import를 제거한다.** 목표가 여기 있다.
   - `guest-sections.js`: 렌더에 쓰는 `GUEST_MAP_CENTER`만 작은 상수 파일(예: `preview/shared/naver-map-center.js`)로 분리하거나, bind 순간에만 `import('../../shared/naver-map.js')`. 상수를 남겨 두면 엔트리에 22 kB가 다시 붙는다. 분리하는 쪽을 권한다.
   - `main.js:98`의 `closeDetailModal` 정적 import를 없앤다. 해시 전환 때 모달을 닫는 코드는 얇은 래퍼나 동적 import로 두고, `naver-map.js`를 끌어오지 말 것.
   - `detail-shell.js`: 공부방 상세 지도를 붙이는 순간에만 `import('.../naver-map.js')` 후 `bindStudyRoomMapSection`. 닫기(`_mapController.destroy`)는 이미 로드된 컨트롤러만 쓰면 된다.
3. **`search-map.js`:** `bindSearchMapPinLinks`에서만 동적 import. 찾기 화면에 지도가 있어도 셸·플레이스홀더를 먼저 그리고, 그다음에 모듈과 SDK를 받는다.
4. **`geocodeBusinessAddress`:** 주소 저장 시에만 로더를 호출(이미 그렇다). `study-room-basic-form.js`가 홈 엔트리에 다시 붙지 않게 정적 의존을 늘리지 말 것.
5. **플레이스홀더 크기 유지.** SDK를 받기 전에 `.naver-map-mount-host` innerHTML을 비우거나 높이를 줄여 레이아웃이 뛰지 않게 한다. `.hero-map` / `.hero-map__surface--naver` / `.naver-map-mount-host`의 기존 min-height를 유지한다. 로그인 흔적 회색 칸(`paintNeutralShell`, `.home-session-wait`)은 그대로 두고, 그 경로에서 SDK를 요청하지 말 것.
6. **오류 문구**는 기존 `showStatus`를 그대로 쓴다. 리스트는 계속 이용할 수 있어야 한다.
7. **지도 동작은 바꾸지 말 것.** 핀 그림·반경 10km·줌 하한·박스·중심 계산을 수정하지 않는다. PR #228 선택 알약 굵게, `roomListByKey` 메모리 캐시(`study-room-home-seed.js:50`), PR #230 `sessionStorage` 키 `study114.studyRoomHomePromoIndex`(우리동네 학생 탭과 동 공유, 로그아웃 시 삭제)를 건드리지 말 것. 로더와 import 경계만 고친다.

## 3. 제약

- 관리자 코드(`preview/home-ui/src/admin`)에 `shared/` 새 import를 넣지 말 것. 관리자 동작·번들에 영향이 없어야 한다.
- 홈 엔트리 `assets/index-*.js`는 **늘지 말 것.** `naver-map.js`를 엔트리 밖으로 빼 줄이는 것이 목표다. 래퍼를 엔트리에 남겨도 수 줄 이내.
- CSS 분할 금지(`cssCodeSplit: false` 유지). 프레임워크·호스팅·배포 방식·라우트 주소·인증·결제 변경 금지.
- 운영 Cloudflare CSP 변경 금지. Vite 로컬 헤더 추가는 위 1절 조건일 때만.
- `verify bundle`의 기존 실패 7건(inquiry `.admin-shell` CSS, 과외 확대카드·베이직 가로카드, `tutor-ui renderBasic` 4건 등, main `3237f574`부터 동일)은 이번에 고치지 말 것. 그 검사를 통과시키려 관련 파일을 만지지 말 것.
- 비밀키·`.env` 값 커밋 금지. force push, `reset --hard`, stash drop, 운영 SQL 금지.
- 머지·배포는 종현 승인 전 금지.

## 4. 수락 기준

1. 시크릿·비로그인으로 `#/plans`, `#/promo/quick-match`(다른 `#/promo/*`도), 마이페이지의 지도 없는 화면을 연다. Network에 `oapi.map.naver.com` / `maps.js` 요청이 **0건**.
2. 지도는 이전과 같이 동작한다. 게스트 홈, 공부방찾기, 공부방 홈 알약 전환, 학생 홈 공부방 지도, 공부방 상세 모달, 폭 390. 핀·박스·알약이 PR #228/#230과 같다.
3. 로그인 흔적이 있는 첫 프레임에는 게스트 지도·SDK 요청이 없다(회색 칸만). 흔적 없는 손님은 게스트 홈 셸이 먼저 보이고, 그 다음 SDK가 온다. 지도 칸 높이가 받아지기 전후로 뛰지 않는다.
4. PR에 전후 표: 홈 엔트리 `index-*.js` 원본·gzip 바이트(엔트리는 같거나 줄어 있어야 함). 네트워크 캡처: (a) `#/plans`처럼 지도 없는 화면, (b) 게스트 홈 첫 로드 — SDK 요청 여부·시작 시점·전송량.
5. 1280·390 스크린샷: 게스트 홈, 공부방찾기, 공부방 홈(알약 전환 전후), `#/plans`(지도 없음 확인용).
6. 작업 기록 `docs/worklog/2026/11/2026-11-17-map-sdk-lazy.md`.

## 5. 보고

새 브랜치 tip, PR 번호(**PR만 열고 머지 금지**), 수락 기준 1–4의 숫자와 캡처, 바뀐 파일 목록, 남은 위험. 로컬 Vite CSP를 건드렸으면 추가한 도메인만 적는다.
