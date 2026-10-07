# Stage 5B · Layout Axis (horizontal measure + unify)

작성: 2026-09-08 KST (Asia/Seoul)  
범위: `/workspace/study114-ds/stage5b-design-standard-v01/` only · ops/GitHub/DB/API 미수정  
뷰포트: Playwright true **1440×1200** (`innerWidth=clientWidth=1440`)

## Screens

| file | Type | Structure |
|---|---|---|
| `layout/home.html` | A | body · gap · rail |
| `layout/search-room.html` | A | body · gap · rail (+ filter, Prime/Pick demos) |
| `layout/search-tutor.html` | A | body · gap · rail |
| `layout/search-student.html` | A | body · gap · rail |
| `layout/plans.html` | B | nav · gap · body · gap · rail |
| `layout/community.html` | B | nav · gap · body · gap · rail |
| `layout/support.html` | B | nav · gap · body · gap · rail |

## Before

### BEFORE @1440 (px)

| page | type | bodyW | left→body | body→rail | railW | navW | topW | midW | botW | mid−bot ΔL | mid−bot ΔR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| home | A | 996 | None | 32 | 284 | None | 720 | 996 | 948 | 32 | 16 |
| search-room | A | 996 | None | 32 | 284 | None | 720 | 996 | 948 | 32 | 16 |
| search-tutor | A | 996 | None | 32 | 284 | None | 720 | 996 | 948 | 32 | 16 |
| search-student | A | 996 | None | 32 | 284 | None | 720 | 996 | 948 | 32 | 16 |
| plans | B | 728 | 32 | 48 | 284 | 220 | 720 | 728 | 680 | 32 | 16 |
| community | B | 744 | 32 | 24 | 300 | 212 | 720 | 744 | 696 | 32 | 16 |
| support | B | 760 | 16 | 16 | 300 | 220 | 720 | 760 | 712 | 32 | 16 |

### Before key gaps (summary)

| page | left→body | body→rail | mid−bot ΔL | mid−bot ΔR | notes |
|---|---:|---:|---:|---:|---|
| home | None | 32 | 32 | 16 | double rail gap, section misalign |
| search-room | None | 32 | 32 | 16 | double rail gap, section misalign |
| search-tutor | None | 32 | 32 | 16 | double rail gap, section misalign |
| search-student | None | 32 | 32 | 16 | double rail gap, section misalign |
| plans | 32 | 48 | 32 | 16 | double rail gap, section misalign |
| community | 32 | 24 | 32 | 16 | section misalign |
| support | 16 | 16 | 32 | 16 | section misalign |

Artifacts: `shots/layout-axis/layout-measure-before.json`, `shots/layout-axis/before/*-1440.png`

## Causes (Phase 2)

| Bug | File / selector | Computed effect @1440 |
|---|---|---|
| Hero max-width 720 centered | `layout.css` `.layout-hero { max-width:720px; margin:0 auto }` | top L≠ body L (e.g. home topL=202 vs bodyL=64); topW=720 vs bodyW≈996 |
| Mid wrap 1120 + extra pad | `.layout-mid { max-width:1120px; padding:0 24px }` | mid content box padded; prime/pick grids shrink (948 vs body 996) |
| Bottom asymmetric margins | `.layout-bottom { margin-left:32px; margin-right:16px }` | botL = bodyL+32; botR = bodyR−16 → mid−bot ΔL=32, ΔR=16 |
| Type A double rail gap | `.layout-shell--a` `column-gap:16` **+** `.layout-rail { margin-left:16 }` | body→rail = 32; rail used width 284 (300−16) |
| Type B page-specific left gap | `.page-plans` column-gap 32; `.page-community .layout-nav { margin-right:8 }`; `.page-support` column-gap 16 | left→body = 32 / 32 / 16; body→rail = 48 / 24 / 16 |
| plans double rail gap | `.page-plans .layout-rail { margin-left:16 }` | body→rail 48 (=32 column-gap + 16 margin) |

Conflicting pack max-widths referenced: `board.css` `.board-page` 1120 / `.board-page--wide` 1360 / hero 720 — layout shells now own alignment; card chrome untouched.

## Tokens chosen (Phase 3)

From BEFORE modal/common measured column widths (not invented):

| Token | Value | Source |
|---|---|---|
| `--right-rail-width` | `300px` (`var(--rail)`) | Rail grid column width on A + support/community (modal 300; 284 was bug shrinkage) |
| `--left-nav-width` | `220px` | Nav column on plans/support (modal 220; 212 was community margin bug) · aliases `--mp-nav` |
| `--layout-gap` | `24px` (`var(--s-3)`) | Type B CSS baseline before page-specific overrides; matches existing spacing token |

CSS targets:

```css
/* Type A */ grid-template-columns: minmax(0,1fr) var(--right-rail-width); column-gap: var(--layout-gap);
/* Type B */ grid-template-columns: var(--left-nav-width) minmax(0,1fr) var(--right-rail-width); column-gap: var(--layout-gap);
```

All top/mid/bottom: `width:100%` of content column; **no** per-section max-width. Prime 3 equal cols; Pick 5×2; Basic 2-col × 20 + pagination.

## After

### AFTER @1440 (px)

| page | type | bodyW | left→body | body→rail | railW | navW | topW | midW | botW | mid−bot ΔL | mid−bot ΔR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| home | A | 988 | None | 24 | 300 | None | 988 | 988 | 988 | 0 | 0 |
| search-room | A | 988 | None | 24 | 300 | None | 988 | 988 | 988 | 0 | 0 |
| search-tutor | A | 988 | None | 24 | 300 | None | 988 | 988 | 988 | 0 | 0 |
| search-student | A | 988 | None | 24 | 300 | None | 988 | 988 | 988 | 0 | 0 |
| plans | B | 744 | 24 | 24 | 300 | 220 | 744 | 744 | 744 | 0 | 0 |
| community | B | 744 | 24 | 24 | 300 | 220 | 744 | 744 | 744 | 0 | 0 |
| support | B | 744 | 24 | 24 | 300 | 220 | 744 | 744 | 744 | 0 | 0 |

### After alignment / spot-check

- **PASS/FAIL:** **PASS** — pass=103 fail=0 (≤1px body↔top/mid/bottom L/R; gap consistency; no overflow; search ≥72×40; chip h=32 where present)
- body→rail gap unified **24** on all 7 pages
- left→body gap unified **24** on all Type B pages
- mid−bot ΔL/ΔR = **0** on all pages

Artifacts: `shots/layout-axis/layout-measure-after.json`, `shots/layout-axis/after/*-1440.png`, `shots/layout-axis/overlay/*`

## Changed files / selectors

| Path | Change |
|---|---|
| `layout/*.html` (7) | Created IA shells Type A/B |
| `layout/layout.css` | BEFORE bugs → AFTER unified grid + section edges |
| `layout/layout-before.css` | Archive of BEFORE bug rules |
| `layout/compare-overlay.html` | Overlay compare board |
| `tokens.css` | Added `--mp-nav: 220px` (5A continuity) |
| `index.html` / `REPORT.md` / `LAYOUT-AXIS.md` | Hub + report |
| `shots/layout-axis/**` | before/after JSON, PNGs, overlays |

**Not changed:** Prime/Pick/Basic card chrome, `btn--search` 72×40/44, chip 44/height 32, detail Secondary specs (`board.css` control tokens).

## Delta (before → after)

| Metric | BEFORE | AFTER |
|---|---|---|
| Type A body→rail | 32 (double) | 24 |
| Type B body→rail | 48 / 24 / 16 | 24 |
| Type B left→body | 32 / 32 / 16 | 24 |
| mid−bot ΔL / ΔR | 32 / 16 | 0 / 0 |
| hero vs body width | 720 vs ~996–760 | equal (100% column) |
| rail used width | 284 or 300 | 300 |

## PASS criteria

- ≤1px diffs on shared content-column edges (top/mid/bottom vs body L/R)
- No horizontal overflow @1440
- No regression: search button ≥72×40 @1440; chip height 32 where present
- Result: **PASS**
