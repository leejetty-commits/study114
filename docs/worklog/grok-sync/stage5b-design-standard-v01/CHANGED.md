# CHANGED — Stage 5B layout-axis 1280 pack complement

작성: 2026-09-08 07:59 KST  
범위: `stage5b-design-standard-v01/` only · ops/GitHub/DB/API/Cursor repo/paid ops **미수정**

## Judgment table

| # | Item | Before | After |
|---|---|---|---|
| 1 | 1440px 정적 레이아웃 가로축 수치 | PASS | **PASS** (unchanged formulas) |
| 2 | ZIP 무결성 (full HTML/CSS local refs) | Prior ZIP missing `before-shape` assets for `09-shape-compare.html` | **PASS** after restore + rescan |
| 3 | Type B Pick 가독성 @ plans 648/5-col | Not separately gated | **FAIL** (5-col kept; alts 미승인) |
| 4 | 공통 디자인 / 5B 완료 / v1.0 / 운영 검증 | Not declared | **Still not declared** |

## Changed / added files

| Path | Action |
|---|---|
| `shots/before-shape/*.png` | Ensured present in deliverable ZIP (were on disk; omitted from prior ZIP) |
| `shots/layout-axis-1280/integrity.json` | Rewritten · full-pack integrity |
| `shots/layout-axis/integrity.json` | Synced copy |
| `shots/layout-axis-1280/full-ref-scan.log` | New scan log |
| `shots/layout-axis/type-b-pick-readability-1280.json` | New |
| `shots/layout-axis-1280/type-b-pick-readability-1280.json` | Synced copy |
| `shots/layout-axis/card-regression-1280.json` | Updated with readability note (column counts still PASS) |
| `shots/layout-axis-1280/card-regression-1280.json` | Synced |
| `shots/layout-axis/after/plans-1440.png` | Refresh |
| `shots/layout-axis/after/plans-pick-zoom-1440.png` | New zoom |
| `shots/layout-axis/pick-alts/*` | Alt A/B + FAIL/stress captures |
| `layout/plans-pick-alt-a.html` | New · 대안·미승인 |
| `layout/plans-pick-alt-b.html` | New · 대안·미승인 (4-col mock) |
| `LAYOUT-AXIS.md` | Complement judgments |
| `REPORT.md` | §12 complement |
| `CHANGED.md` | This file |
| `/workspace/study114-ds/stage5b-layout-axis-1280-complete.zip` | Rebuilt self-contained |

## Explicitly NOT changed

- Shell max 1280 / gutter 32 / gap 24 / Type A body 892+rail 300 / Type B nav 220+body 648+rail 300 / outer 80/80
- `layout/plans.html` Pick **5-col** default (FAIL readability baseline)
- ops / GitHub / DB / API / Cursor repo / paid ops
- 960 / 768 / mobile gates

---

## Pick-gap-12 (Type A only) — 2026-09-08

See `PICK-GAP-12.md` for full before/after table.

| Judgment | Result |
|---|---|
| Type A Pick 가로 간격 12px | **PASS** |
| Type A 가로축·5열 유지 | **PASS** |
| Prime·Basic 회귀 없음 | **PASS** |
| Type B 미변경 | **PASS** |

Changed: `layout/layout.css` (+`.layout-shell--a .pick-grid` column-gap 12 / row-gap 16).  
`board.css` `.pick-grid { gap: var(--s-2) }` untouched. Shell 1280 / gutter 32 / gap 24 / Type A 892·300 / Type B 220·648·300 / Pick 5×2 / card internals / Prime·Basic gaps / plans Type B — unchanged.
