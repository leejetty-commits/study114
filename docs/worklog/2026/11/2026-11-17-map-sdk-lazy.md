# 2026-11-17 지도 SDK 지연 로딩

지시: `docs/worklog/grok-sync/docs/map-sdk-lazy-2026-11-17.md` (원격 `docs/map-sdk-lazy-2026-11-17` `dcbe020c`).
기준: `origin/main` `7b72293f`. 브랜치 `work/map-sdk-lazy-2026-11-17`. PR만. 머지하지 않음.

## 수정

- `preview/shared/naver-map-center.js` — 게스트 중심 좌표만 분리.
- `preview/shared/naver-map.js` — 같은 로더. 같은 주소의 스크립트가 있으면 다시 넣지 않고 로드를 기다린다. 실패하면 캐시를 비워 다시 시도한다.
- `preview/home-ui/src/guest-sections.js`, `preview/search-ui/src/search-map.js`, `preview/home-ui/src/detail-decision/detail-shell.js` — 지도를 붙일 때만 `naver-map.js`를 동적 import. 셸을 그린 다음 프레임에 받는다.
- `preview/home-ui/src/detail-decision/close-detail-modal.js` — 해시 전환에서 상세를 닫는 얇은 래퍼. 홈·찾기 엔트리가 상세 모듈을 통해 지도 SDK를 끌어오지 않는다.
- `preview/home-ui/vite.config.js` — 로컬·preview CSP `script-src`에 `https://oapi.map.naver.com`만 추가. 운영 Cloudflare CSP는 그대로.
- 소스 계약 두 줄: `scripts/verify-guest-baseline-map-cards.mjs`, `scripts/verify-student-location-flow.mjs`. 중심 좌표 파일 경로만 맞춘다.

핀·반경·줌·박스·중심 계산, 알약 굵기, `roomListByKey`, `study114.studyRoomHomePromoIndex`는 건드리지 않았다. CSS 분할 없음. 관리자 `shared/` import 없음.

## 엔트리 (키 없이 `preview/home-ui` vite build)

| | 파일 | 원본 | gzip | `oapi.map.naver.com` |
|---|---|---:|---:|---|
| 전 | `index-C7mjFmST.js` | 664,870 | 194,169 | 있음 |
| 후 | `index-BtGF-H6A.js` | 655,868 | 190,903 | 없음 |

지도 모듈은 `naver-map-*.js` 청크(키 없을 때 9,395바이트, gzip 4,014). 키가 있는 빌드에서도 엔트리에는 SDK 주소가 없고, 청크에만 있다.

## 로컬 네트워크 (`127.0.0.1:5184`, `5186`)

- `#/plans`, `#/promo/quick-match`, `#/mypage/registrations/students`: `maps.js` 0건.
- 흔적 없는 게스트 홈: 첫 페인트 1,084ms, `maps.js` 시작 1,089ms. 지도 칸 높이 462px(받아지기 전 254px에서 칸은 유지).
- `study114.last-role=tutor` 첫 프레임: 「불러오는 중」 회색 칸. 그 프레임에는 지도 없음.
- 공부방찾기(`5186`): 셸·필터가 보인 뒤 SDK. 첫 페인트 2,656ms, `maps.js` 시작 1,783ms. 지도 칸 높이 462px.

전송량은 교차 출처라 리소스 타이밍이 0으로 나온다. 스크립트는 실행되어 geocoder 서브모듈까지 붙는다. 포트 5184·5186은 네이버 콘솔 허용 목록(5174)이 아니라 타일은 인증 실패 이미지다. 5174는 다른 서버가 쓰고 있어 비우지 않았다.

## 하지 않은 것

머지·배포 없음. 로그인 공부방 홈·학생 홈·상세 모달·폭 390은 세션과 허용 포트가 없어 타일까지 보지 못했다. verify bundle 기존 7건은 고치지 않았다.
