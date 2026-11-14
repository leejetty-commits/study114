# 336 헤더 로고 한 단계 + 태그라인 — 2026-11-13

지시: `docs/worklog/grok-sync/docs/336-header-tagline-2026-11-10.md`  
브랜치: `work/336-header-tagline` (origin/main `03fcba3d`에서)  
**커밋·push·머지 안 함** (지시: 검수 후)

## 한 일

- 글자 로고 높이 28px → **32px**. 심벌은 헤더 실측 비율 `22.5/28`로 변수 연동 → **≈25.71px**.
- 로고 링크 안 텍스트 「우리동네 공부방과외」: `#4B5563`, **12px**(메뉴 14px 대비 −2px), weight **500**, 워드마크와 간격 **8px**, 아랫선 맞춤(`align-items: flex-end`).
- **max-width: 390px**에서 태그라인 `display: none`.
- 헤더 높이(데스크톱) **66px** 유지. 메뉴·로그인·라우팅·4색 로고 이미지 미변경.

## 변경 파일

| 파일 | 요약 |
|------|------|
| `preview/shared/site-chrome.js` | 로고 링크에 `span.home-header__tagline` |
| `preview/home-ui/src/layout.js` | 동일 |
| `preview/home-ui/src/styles/home.css` | `.home-header__*` 브랜드 변수·태그라인·390 숨김 |

## 실측 (Playwright `measure.json`)

| 항목 | 1920/1280 | 390 |
|------|-----------|-----|
| `.home-header` 높이 | **66px** | 45px (유틸 접힘·기존 모바일, 미변경) |
| 워드마크 높이 | **32px** | 32px |
| 심벌 높이 | **25.70px** | 25.70px |
| 태그라인 | 보임 · 12px · 500 · `rgb(75,85,99)` · gap 8 · bottom=워드마크 | **숨김** |
| 메뉴 글자 | 14px (`text-sm`) | (GNB 숨김) |
| 메뉴 줄바꿈 | 없음 | — |

## 캡처

`docs/worklog/2026/11/shots-336-header-tagline/`  
`{home,find,study-room,tutor}-{1920,1280,390}.png` + `measure.json`  
스크립트: `scripts/capture-336-header-tagline.mjs`

## 셀프검수

| # | 항목 | 결과 |
|---|---|---|
| 1 | 워드마크 32 · 심벌 비율 연동 · 헤더 66(데스크톱) | PASS |
| 2 | 태그라인 문구·색·크기·굵기·간격·아랫선 | PASS |
| 3 | 390 태그라인 숨김 | PASS |
| 4 | 링크·alt 유지 · 메뉴 줄바꿈 없음 | PASS |
| 5 | 범위 밖 미수정 · 머지 안 함 | PASS |

## 다음

검수 합격 후 커밋·push·PR (지시대로 지금은 안 함).
