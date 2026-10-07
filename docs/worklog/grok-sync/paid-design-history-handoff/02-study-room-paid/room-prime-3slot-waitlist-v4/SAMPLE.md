# SAMPLE.md

| Field | Value |
|---|---|
| **샘플명** | Room Prime 3-slot inventory + waitlist (plans-ui-v4) |
| **종류** | 노출상품 · 공부방 Prime (슬롯 보드/예약대기) |
| **출처** | `plans-ui-v4/positions.html + app.js + shots/01–04` |
| **판정** | **구현 기준** |
| **근거 정책** | C) Room Prime ONLY = 3-slot inventory/board/waitlist |
| **보정 필요** | Tutor role must never show this slot/waitlist UI (policy D). Badge UI in same page is single-select → prefer stage5b multi for badges. |
| **주의 메모** | Canonical room Prime occupancy: partial/held/full + 내 예약대기 목록. Prefer over v3 tiny placeholder tiles. |

## Contained files

See sibling `shots/`, `excerpts/`, and/or `docs/` in this folder. No `.chrome`, Cache, node_modules, or secrets included.
