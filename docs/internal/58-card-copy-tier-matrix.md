# 슬로건 · 한 줄 소개 · 긴 소개 — 등급별 분기 (2026-08-22 확인)

**문서 기준:** `docs/ssot/11-main-exposure-and-compare.md` §4-0·§4-1·§5-0·§5-1  
**코드 기준:** `preview/home-ui/src/exposure-render.js`  
**원칙:** 이번 라운드에서 **새 설명 블록을 추가하지 않음**. 기존 분기만 유지·정렬.

범례: ✅ 노출 · ✕ 숨김 · — 카드에 미사용(등록/샵만)

| 대상 | 등급 | slogan | intro_short | intro_long | 코드 근거 |
|------|------|--------|-------------|------------|-----------|
| 공부방 | Basic (hcard) | ✅ (빈값이면 미출력) | ✕ | — | `renderBasicStudyRoomRow` slogan만 |
| 공부방 | Pick | ✅ | ✕ | — | `showIntro: false` |
| 공부방 | Prime | ✅ | ✅ | — | `showIntro: true` |
| 과외쌤 | Basic (hcard) | ✅ (`slogan` \|\| `feature_1`) | ✕ | — | Basic 슬로건 행 |
| 과외쌤 | Pick | ✅ | ✕ | — | `showIntro: false` |
| 과외쌤 | Prime | ✅ | ✅ | — | `showIntro: true` |
| 확대카드 | — | ✕ 본문 블록 추가 안 함 | ✕ 별도 소개 섹션 제거 | — | 핵심 조건 DL만 · 배지/통계는 card-visual |

`intro_long`: 등록·마이샵 상세용. **메인/비교/확대 카드 미노출** (문서·코드 일치).
