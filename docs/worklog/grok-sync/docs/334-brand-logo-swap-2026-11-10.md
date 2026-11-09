# 334 사이트 심벌·로고를 확정본으로 교체 (2026-11-10 종현 동의)

선행: 333 머지 후. 정본: `docs/design/brand-logo/` 01~04 + README.md(심벌 높이 = 글자 한 줄 높이의 1.05배, 가로형 간격 = 글자 높이의 0.17배).

## 현황 (2026-11-10 main 649292c4 실측)
모든 화면이 파일 두 개만 씀. 크기는 화면별 CSS 높이.
- 심벌 `/assets/brand/src/udong-pin.png` (64×93)
- 글자 `/assets/brand/logo-wordmark.png` (866×281)
- 홍보 팝업 `/assets/brand/logo-lockup-pencil-wordmark.png` (490×184)
- 쓰는 곳: site-chrome.js·home layout.js 헤더, auth-ui(login·layout·recovery-stage), study-room-ui·tutor-ui layout, shared/guest-gate-ui.js, home section-headings.js, promo-video-config.js, home-popup/content.js, shared/naver-map.js(지도 핀), src/Views/layouts/auth.php, src/Mail/MemberMailTemplate.php, 각 index.html 파비콘
- 헤더 실측(1920): 심벌 15.5×22.5, 글자 86.3×28

## 1단계: 파일만 교체 (화면 코드 수정 없음)
1. 기존 3파일을 같은 폴더에 `-legacy` 이름으로 복사해 보관.
2. 확정 SVG에서 심벌·글자를 뽑아 **같은 이름·같은 픽셀 크기·같은 여백 비율**로 PNG 재생성(투명). 심벌은 333의 `udong-symbol.svg`와 같은 벡터.
3. 복사본 위치 전부 교체: `public/assets/brand/`, `preview/home-ui/public/assets/brand/`, `preview/auth-ui/public/assets/brand/` (src/ 하위 포함).
4. 캐시: 쓰는 곳 경로에 `?v=20261110` 붙이기만 허용(다른 수정 금지).

## 2단계: 크기 비율 통일
1. 화면별 심벌·글자 높이를 CSS 변수 한 세트(`--brand-wordmark-h`, `--brand-symbol-h: calc(var(--brand-wordmark-h) * 1.05 * 비율)`, 간격 0.17배)로 모음. 화면별로는 `--brand-wordmark-h` 값만 둠.
2. 헤더는 336에서 크기 조정하므로 여기서는 현재 크기 유지.

## 금지
원본 .ai·docs/design/brand-logo/ 수정 금지. 레이아웃·로직·라우팅 변경 금지. 지도 핀 크기·위치 변경 금지(그림만 바뀜).

## 확인
헤더·로그인·공부방·과외쌤·게스트 게이트·섹션 제목·홍보 팝업·지도 핀·메일 로고, 전후 스크린샷 1920·390. 깨진 이미지 0, CSP 위반 0.

## 보고
교체 파일 목록(크기 비교)·변수 적용 위치·전후 스크린샷 경로. 커밋·push는 검수 후.
