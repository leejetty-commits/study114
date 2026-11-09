# 334 사이트 심벌·로고를 확정본으로 교체 (2026-11-10 종현 동의)

선행: 333 머지 후. 정본: `docs/design/brand-logo/` 01~04 + README.md(심벌 높이 = 글자 한 줄 높이의 1.05배, 가로형 간격 = 글자 높이의 0.17배).

## 현황 (2026-11-10 main 649292c4 실측)
모든 화면이 파일 두 개만 씀. 크기는 화면별 CSS 높이.
- 심벌 `/assets/brand/src/udong-pin.png` (64×93)
- 글자 `/assets/brand/logo-wordmark.png` (866×281)
- 홍보 팝업 `/assets/brand/logo-lockup-pencil-wordmark.png` (490×184)
- 쓰는 곳: site-chrome.js·home layout.js 헤더, auth-ui(login·layout·recovery-stage), study-room-ui·tutor-ui layout, shared/guest-gate-ui.js, home section-headings.js, promo-video-config.js, home-popup/content.js, shared/naver-map.js(지도 핀), src/Views/layouts/auth.php, src/Mail/MemberMailTemplate.php, 각 index.html 파비콘
- 헤더 실측(1920): 심벌 15.5×22.5, 글자 86.3×28

## 1단계: 새 파일 추가 + 경로 교체 (기존 파일은 그대로)
기존 3파일은 **덮어쓰지 않는다**(우측 레일 홍보영상이 같은 파일을 쓰기 때문).
1. 확정 SVG에서 새 파일을 투명 PNG로 생성, 기존과 **같은 픽셀 크기·같은 여백 비율**:
   - 심벌 `/assets/brand/udong-symbol-2026.png` (64×93, 333의 `udong-symbol.svg`와 같은 벡터)
   - 글자 `/assets/brand/logo-wordmark-2026.png` (866×281)
   - 위치: `public/assets/brand/`, `preview/home-ui/public/assets/brand/`, `preview/auth-ui/public/assets/brand/`
2. 위 「쓰는 곳」의 경로만 새 파일로 바꿈(다른 수정 금지). **단, 아래 예외는 손대지 않음.**

## 손대지 말 것 (2026-11-10 종현: 앞서 시켜 봤다가 원복함)
- 우측 레일 유튜브 홍보 배너의 로고와, 유튜브 팝업 제목줄 로고
- 즉 `preview/home-ui/src/promo-video-config.js`(PROMO_SYMBOL_SRC·PROMO_WORDMARK_SRC), `preview/home-ui/src/right-rail.js`의 홍보영상·팝업 부분, `preview/home-ui/src/styles/home-right-rail.css`의 홍보 규칙은 **수정 금지**. 기존 파일 경로 그대로 유지.
- 기존 `src/udong-pin.png`·`logo-wordmark.png`·`logo-lockup-pencil-wordmark.png` 파일 내용 변경·삭제 금지.

## 2단계: 크기 비율 통일
0. 홍보 배너·팝업 CSS는 변수화 대상에서 제외.
1. 화면별 심벌·글자 높이를 CSS 변수 한 세트(`--brand-wordmark-h`, `--brand-symbol-h: calc(var(--brand-wordmark-h) * 1.05 * 비율)`, 간격 0.17배)로 모음. 화면별로는 `--brand-wordmark-h` 값만 둠.
2. 헤더는 336에서 크기 조정하므로 여기서는 현재 크기 유지.

## 금지
원본 .ai·docs/design/brand-logo/ 수정 금지. 레이아웃·로직·라우팅 변경 금지. 지도 핀 크기·위치 변경 금지(그림만 바뀜).

## 확인
헤더·로그인·공부방·과외쌤·게스트 게이트·섹션 제목·지도 핀·메일 로고 전후 비교 + 우측 레일 홍보 배너·유튜브 팝업 제목줄이 **수정 전과 픽셀 동일**한지, 전후 스크린샷 1920·390. 깨진 이미지 0, CSP 위반 0.

## 보고
교체 파일 목록(크기 비교)·변수 적용 위치·전후 스크린샷 경로. 커밋·push는 검수 후.
