# UDX-STD-001 · 버튼 Button (정본 발췌 · Stage 5B)

상태: **정본 수치** — 하단 작업 로그와 불일치 시 FAIL  
작성: 2026-09-08 KST · 5B 검색 버튼 재보정

## 검색 Primary

- 카피: 「검색」
- 역할: Primary (파란 채움)
- 두 글자 카피라도 정사각형에 가까워지지 않도록 적용:
  - **데스크톱: min-width(또는 width) ≥ 72px · height 40px**
  - **모바일: min-width(또는 width) ≥ 72px · height 44px**
- 좌우 padding 16px · padding-block 0
- font-size 16px · line-height 24px · font-weight 600
- radius 8px
- display: inline-flex · align-items: center · justify-content: center · white-space: nowrap
- **금지:** `width: 40px` · `width: 44px` · `aspect-ratio: 1` (또는 1/1)
- 모바일 실제 터치영역 최소 **44×44px** 유지 (height 44 + min-width ≥72로 충족)
- **64px는 PASS로 인정하지 않음**

## 카드 「상세 보기」 Secondary

- 카피: 전역 「상세 보기」만 (「상세」 단독 금지)
- Secondary: 흰 배경 · 파란 글자 · 파란 1px 테두리 · hover만 subtle
- 데스크톱 h40 · 모바일 h44 · min-width 84 · padding-inline 16 · radius 8
- 카드 전체폭 버튼 금지 · 페이지 대표 CTA만 Primary 채움

## 구현 토큰 (5B 보드)

- `--btn-search-min-w: 72px`
- `--btn-search-h: 40px` / `--btn-search-h-m: 44px`
- `--btn-detail-h: 40px` / `--btn-detail-h-m: 44px`
