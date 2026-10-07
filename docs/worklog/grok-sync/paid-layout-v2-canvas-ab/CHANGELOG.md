# CHANGELOG — paid-layout-v2-canvas-ab

정적 디자인 시안 · 운영 아님 · 정책/가격 변경 없음 · 최종 승인/v1.0 아님

## 2026-09-18 — canvas A/B + B chosen direction

- 신규 팩: `paid-layout-v2` baseline은 유지. 본 팩은 sibling.
- A/B 비교판: `compare-a-home|positions`, `compare-b-home|positions` (+ `compare-b-access`).
- **B 채택 페이지:** `home.html` = 웜 캔버스(nav+body) + Shell full-bleed 시네마 + 허브 lean.
- `positions.html` / `access.html` = 웜 캔버스 + 컴팩트 인트로 · 시네마 없음 · app.js 구매 데모 유지.
- 사이트 전역 화이트 유지 · 레일·푸터 화이트/기존 유지 · Shell 칼럼 수치 불변.
- 문서: `CANVAS-AB.md` · 본 CHANGELOG · REPORT 보강.

## 2026-09-18 — IMPLEMENTATION-GUIDE 치수 정렬

- `IMPLEMENTATION-GUIDE.md` (부모 SSOT) 잠금 수치에 B 샘플 CSS 정렬:
  - Shell `32+160+24+800+8+224+32=1280` · warm canvas **984** (nav+gap+body)
  - 홈 시네마 height **280** · pad **40×32** · 칼럼까지 gap **32** · warm은 hero **아래**부터
  - 상세 시네마 없음 · intro 112–136 · 첫 구매 섹션 gap **24**
  - period **138×200** · ticket **229×241** · radius **12** · border **1** · section pad **22**
- 샷·COMPARE 재촬영 후 zip 재생성. 가이드 본문 미수정.
