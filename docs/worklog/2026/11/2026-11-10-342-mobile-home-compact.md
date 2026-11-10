# 342 — 모바일 홈 컴팩트

**과제ID:** 342  
**브랜치:** `work/342-mobile-home-compact`  
**기준:** `origin/main` `b105cfa9`  
**날짜:** 2026-11-10  
**worktree:** `.wt/work-342-mobile-home-compact`

## 지시 요점

모바일만. 데스크톱이 하나라도 바뀌면 불합격.

| | 조건 | 내용 |
|---|---|---|
| A | ≤720 | `.home-promo-trio` 좌우 스냅 캐러셀(폭≈86%, 높이≈100–120px, 점). ≥721 3열 |
| B | ≤720 | 공지 한 줄 롤링(배지+제목). 탭→목록 팝업. reduced-motion→첫 제목 고정 |
| C | ≤720 | 「우리 동네에 새로 왔어요」 본문 가로 스냅 칩 1줄 |
| D | ≤1023 | 「오늘의 안내」 펼침 안 탭 4개(현장·안내·정보·영상). ≥1024 탭 없이 상시 펼침 |
| E | ≤899 | ☰ 소개영상. `openRailPromoVideo` export 1개(종현 승인). layout/site-chrome 동적 import |

## 구현

- `home-marketing-banner.js` + CSS: 트리오 셸·점·≤720 스냅
- `home-news-row.js` + CSS: 공지 티커(목록 병행, CSS로 분기)
- `neighborhood-greeting.css`: ≤720 칩 가로 스냅
- `right-rail.js` + CSS(신규 규칙만): `rail-m-tabs` · `rail-room-snap` · `rail-video-snap` · `export openRailPromoVideo`
- `layout.js` · `site-chrome.js` · `home.css`: 드로어 영상 항목(≥900 `display:none`)

## 검수 (로컬 5184)

| 항목 | 결과 |
|------|------|
| 390 패널 높이 | **457px** (목표 &lt;800, 권장 430–520) · 아코디언 전체 515px. 이전 보고값 2,067px |
| 390 트리오 | scroll-snap `x mandatory`, 카드 폭 86%, 높이 110px, 점 3 |
| 390 공지 | 티커 `display:flex`, 「공지」+한 줄 |
| 390 칩 | greeting list `flex-direction:row` |
| 390 탭 | 현장·안내·정보·영상, 기본 현장 |
| 390 ☰ 게스트 | 영상 2개 |
| 1280 | 3열 트리오 · 2열 뉴스 · GNB flex · 탭 nav/토글 `none` · pane 전부 표시 · 드로어 영상 `none` |
| 빌드 | `npm run build:dothome` 성공 |
| verify:shop-page | 샌드박스 rolldown native binding 차단으로 로컬 실패(환경). 코드 경로와 무관 |

## 스크린샷

- `tmp/342-evidence/390-promo-carousel.png`
- `tmp/342-evidence/390-rail-tabs.png` (캡처 시점 스크롤에 따라 레일 일부만 보일 수 있음)
- `tmp/342-evidence/1280-desktop.png`

## 변경 파일 (소스)

9 files, +668 / −10 (대략)

## 금지 준수

- `promo-video-config.js` 미수정
- `.live-rail-promo-video*` / `.live-rail-media-dialog*` 기존 규칙 미수정(신규 wrapper·탭 규칙만 추가)
- 게스트 티커·관리자·API·CSP 미변경
- main 직접/force push 없음

## 추가 확인

- 고객센터(`#/support`) ☰ → 공부방 소개영상: `#live-rail-media-dialog` 열림 · `is-rail-media-open`

## 승인

- 커밋 hash: `cbf880a8662793644b940a06508dfbeee94180f5`
- push / PR·머지: 검수 후
