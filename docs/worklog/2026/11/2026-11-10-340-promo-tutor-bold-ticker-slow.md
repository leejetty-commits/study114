# 340 과외쌤 굵게 · 게스트 티커 절반 속도 (2026-11-10)

기준: `origin/main` `24555c4c` · 브랜치 `work/340-promo-tutor-bold-ticker-slow` · worktree `.wt/work-340-promo-tutor-bold-ticker-slow`

## 지시

1. 홍보 제목 「과외쌤」을 기존 「공부방」과 같은 방식으로 굵게.
   - `renderPromoTitleHtml` (배너)
   - `fillPromoTitleHeading` (팝업 제목줄)
   - 클래스 `live-rail-promo-video__title-em` / `live-rail-media-dialog__heading-em` 재사용
2. 게스트 흐르는 카피: 초당 60px → 30px, 주석도 30px. `.ops-chrome__guest-banner-item` padding-inline 3rem → 6rem.

금지 유지: id·제목 문구·로고 경로, `home-right-rail.css`, 다른 홍보 코드, 로고 파일.

## 검수 (로컬 5174, 게스트 `#/guest`)

- 배너 2개: 「공부방」「과외쌤」만 `strong` · font-weight 700, 부모 500. 로고 `udong-pin.png` · `logo-wordmark.png` 유지.
- 과외쌤 배너 클릭 팝업 제목: `heading-em` 「과외쌤」 700, 제목 500, 로고 경로 동일.
- 티커: 1920에서 duration 78.48s · 반폭 2354.5px = 30px/s. 390에서 duration 19.62s · 반폭 588.5px = 30px/s. padding-inline 96px(6rem). hover 강제 시 `animation-play-state: paused`, 해제 후 running.
- 스크린샷: `tmp/340-promo-1920.png` (배너 2개). 390 브라우저 패널은 미리보기 툴바만 잡혀 띠 화면은 수치로 확인.

PR·머지는 검수 후.
