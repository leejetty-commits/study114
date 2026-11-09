# 335 게스트 인사말 띠 티커 — 작업 기록 (2026-11-10)

**지시 정본:** `docs/worklog/grok-sync/docs/335-guest-greeting-ticker-2026-11-10.md`

## 결과
- 브랜치 `work/335-guest-ticker` · `40ea3cb8` + `b616038c` · PR **#148** · 머지 `a16c1722`  
- 배포: Actions success · run https://github.com/leejetty-commits/study114/actions/runs/42697673800

## 변경 요약
- `site-ops-chrome.js`: 게스트 띠를 점검 배너와 분리 → `.home-header` 바로 아래  
- `home.css` `.ops-chrome__guest-banner*`: CSS transform 티커(~60px/s), hover/focus pause, reduced-motion 고정  
- `b616038c`: 반폭 < viewport면 item 복제 후 `duration=(scrollWidth/2)/60` · viewport `tabindex="0"`

## 검수
- 홈·찾기 1920/390: gap 0 · px/s ≈60 · focus paused · reduced-motion 복제1  
- 운영 `#/guest`: 띠 노출·running · marquee 없음 · 관리자/API 미변경
