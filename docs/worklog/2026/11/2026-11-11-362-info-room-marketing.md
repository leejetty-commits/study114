# 362 배치3 — 공부방 홍보·광고 전략 (2026-11-11)

## 지시
- 배치2·카테고리 push 승인 후 진행
- 홍보 20건+ · `INDEX.md` 완성 · 셀프검수 · 커밋만

## 선행 push
- `822afb80` category startup · `a2acea23` batch2 → `origin/work/362-info-room-content`

## 산출
- `docs/content/info-room/03-marketing/` 22건 (`topic: marketing`, `category_suggest: recruit`)
- `_sources/03-marketing-sources.md`
- `docs/content/info-room/INDEX.md` (66건)
- 이 worklog

## verify
```
node scripts/verify-info-room-content.mjs docs/content/info-room/03-marketing
→ PASS 22 / 0
min=2603 avg=2673 max=2749 · title sim warnings: none
```

## 셀프검수 (글마다 요약)

| 글 | 글자 | ## | 요약3 | 사례 | 체크5+ | URL0 | 기준일 | 복사 | 중복 | 판정 |
|---|---|---|---|---|---|---|---|---|---|---|
| 01–22 | 2603–2749 | 7 | Y | Y | 6 | Y | Y | 무일치 | Y | PASS |

## 복사 표본 (정확일치 검색 · 무일치)
플레이스 명함 문장, 맘카페 규칙, 옥외광고, 우동공과 카드, 포지션·검수 마무리 등 **22문장+** 검색 → 동일 문장 재현 없음.

## 배치 공통

| # | 항목 | 결과 |
|---|---|---|
| 1 | 20건+ | PASS 22 |
| 2 | verify | PASS |
| 3 | 복사 표본 | PASS |
| 4 | `_sources` | PASS |
| 5 | uncertain_facts | PASS (플랫폼·옥외·표시 세부) |
| 6 | 앱 diff 0 | PASS |
| + | INDEX 66건 | PASS |

## 표본 검수 추천
1. `07-jeondan-hyeonsumak.md` (옥외광고)
2. `13-udonggong-card.md` (우동공과 수위)
3. `14-gwanggo-pilsoo-pyosi.md` (필수 표시)

## 미해결
- `startup` 카테고리 DB/UI 반영 별도
- 배치3 push 승인 대기
