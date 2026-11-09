# 334 브랜드 로고 교체 — 작업 기록 (2026-11-10)

**지시 정본:** `docs/worklog/grok-sync/docs/334-brand-logo-swap-2026-11-10.md`

## 결과
- 브랜치 `work/334-logo-swap` · `eb15f782` + `b1c55679` · PR **#147** · 머지 `3a400d46`  
- 배포: Actions success

## 변경 요약
- 신규 `udong-symbol-2026.png`(64×93) · `logo-wordmark-2026.png`(866×281) — 구파일 덮어쓰기 없음  
- 헤더·auth·layout·favicon·mail·map pin·section 등 경로 → `*-2026.png`  
- **미수정:** `promo-video-config.js` · `right-rail.js` 홍보·팝업 · `home-right-rail.css` 홍보  
- CSS: `--brand-wordmark-h` on `:root`; `--brand-symbol-h` / gap는 `.brand-lockup` 스코프(`b1c55679`)

## 검수
- 운영: 헤더·섹션·guest-gate·로그인 새 로고 · `*-2026.png` 200  
- 우측레일 배너·팝업: 구경로 유지 · CSP 334 관련 0
