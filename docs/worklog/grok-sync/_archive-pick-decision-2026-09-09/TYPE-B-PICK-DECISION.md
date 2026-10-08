# TYPE-B-PICK-DECISION — plans Type B Pick 열 규칙 결정 보드

작성: 2026-09-09 KST (UTC+9)  
범위: `stage5b-design-standard-v01/` **STATIC ONLY** · ops / GitHub / DB / API / Cursor repo **미수정**  
Stage 5B complete / v1.0 / ops approval — **미선언**

## Baseline (LOCKED)

| Item | Value |
|---|---|
| Pack ZIP SHA-256 (continue-from) | `ddef249fa914d42c5323a25228217079ee967af4e11809d656fa130daa598e34` |
| Source ZIP | `/workspace/study114-ds/stage5b-layout-axis-1280-complete.zip` |
| 1360 archive | **NOT used** |
| Untouched | `layout/plans.html`, `layout/layout.css`, `board.css`, `tokens.css` |
| Type A Pick | **unchanged** — 5col · column-gap **12** · row-gap **16** |
| Font shrink | **none** |
| Price/product policy | **not invented** |
| Fixture label | **디자인 검증용 가상 데이터** |

## Fixed axis @ Playwright true 1440

Shell **1280** border-box · gutter **32** · Type B: nav **220** / gap **24** / body **648** / gap **24** / rail **300**  
Type B Pick column-gap & row-gap = **16px** (baseline / A / B)

## Variants (NEW experimental only)

Path: `layout/pick-decision/` · CSS: `layout/pick-decision/pick-decision.css` (scoped `.pd-*` only — does **not** edit `board.css` `.pick-grid` global)

| ID | File | Rule | Cards |
|---|---|---|---|
| 0 | `baseline-5col.html` | 5×2 FAIL control | 10 · card ≈ **116.8px** |
| A | `option-a-4x2.html` | 4×2 + numeric pagination | **8** exact 4+4 · card **150px** |
| B | `option-b-4x3-partial.html` | 4-col · 4+4+2 left-aligned | **10** · card **150px** · last-2 col1/col2 · no stretch/center |
| — | `compare.html` | side-by-side board | iframes 0/A/B |

Stress fixtures (가상) distributed across cards: short/long name (20–28), short/long region, 6-digit price / empty price (no 「가격 문의」), photo / no photo, badges 0/1/2, intro 1/3 lines.

## Measurements (Playwright computed)

Artifact: `shots/layout-axis/pick-decision/type-b-pick-options.json`

| Metric | Baseline 0 | Option A | Option B |
|---|---|---|---|
| viewport clientWidth | 1440 | 1440 | 1440 |
| shell / nav / body / rail | 1280 / 220 / **648** / 300 | same | same |
| pick grid width | 648 | 648 | 648 |
| column-gap / row-gap | 16 / 16 | 16 / 16 | 16 / 16 |
| cards per row | 5+5 | 4+4 | 4+4+**2** |
| card width | ≈116.8 | **150** | **150** |
| B last-2 start x vs row1 col1 | — | — | **Δ0** (left-aligned) |
| B last-2 width vs row1 | — | — | **Δ0** (same 150) |
| price line example | `월` / `220` / `,00` / `0원` | `월` / `220,000` / `원` | same as A |
| card scrollWidth ≤ clientWidth | yes | yes | yes |

## Readability PASS criteria (strict)

- title no overlap/clip  
- meta values not char-by-char weird splits  
- price present: number+원 not clipped; wrap only at sense units; keep amount together when possible  
- empty price: no invented CTA copy  
- 「상세 보기」 one line, in card  
- all cards scrollWidth ≤ clientWidth  
- row/card height not chaotically unstable for compare  
- no horizontal overflow / element overlap  

## Judgments 1–9

| # | Question | Result |
|---|---|---|
| 1 | baseline 5-col readability: FAIL maintained? | **YES — FAIL maintained** (digit/comma shards; long region 1–2자 wraps; title clamp) |
| 2 | A 4×2=8 | **FAIL** |
| 3 | B 4+4+2=10 | **FAIL** |
| 4 | page rhythm / browse efficiency (opinion) | **A** cleaner (full rows + pagination, shorter Pick block). **B** keeps 10 visible but sparse last row + larger stress height span (~113 vs A ~62). |
| 5 | last-row balance (opinion) | **B** mechanics correct (left col1/col2, same width, no stretch/center). Visually emptier than A’s full second row. |
| 6 | Pick card grammar preserved? | **yes** — Prime/Pick/Basic chrome reused; fonts not shrunk; only `.pd-pick-grid--*` column rules; empty price has no CTA copy |
| 7 | recommendation | **neither** |
| 8 | why | Body 648 → 4-col card **150px** still cannot host existing Pick chrome (`pick-dl` 52px label + fs-14 values + fs-18 name `line-clamp:2`) under strict rules: price renders `[월 ][220,000][원]` (**원 alone**), long names still clip. Column-count alone ≠ readability PASS. Baseline FAIL deliberately preserved. No 3-col / list-card invented. |
| 9 | open policy if adopting later | See below |

### Open policy decisions (if revisiting 4-col)

1. Price field layout inside Pick (remain in `pick-dl` vs full-width price row / sense-unit wrapping rules)  
2. Empty price: omit entire 가격 row vs empty `dd` (still **no** invented CTA)  
3. Pagination policy for 8-card pages (A) vs always surface 10 (B)  
4. Long-name clamp policy (keep 2-line clamp vs allow more lines) **without** font shrink  
5. Whether Type B Pick may diverge from Type A 5-col / gap-12 rule  

## Captures @ true 1440

Directory: `shots/layout-axis/pick-decision/`

Per option 0/A/B:

- `*-plans-full-1440.png`
- `*-pick-zoom-1440.png`
- `*-long-data-stress-1440.png`
- `*-card-edge-guides-1440.png` (+ `*-card-edge-guides-overlay-1440.png`)

Plus:

- `compare-side-by-side-0AB-1440.png`
- `compare-board-1440.png`
- `B-last-two-treatment-zoom-1440.png`
- `type-b-pick-options.json`
- `integrity-scan.json`

## Changed / added files

**Added**

- `layout/pick-decision/pick-decision.css`
- `layout/pick-decision/baseline-5col.html`
- `layout/pick-decision/option-a-4x2.html`
- `layout/pick-decision/option-b-4x3-partial.html`
- `layout/pick-decision/compare.html`
- `layout/pick-decision/_gen_pages.py` (generator helper)
- `layout/pick-decision/capture_pick_decision.py` (measure/capture helper)
- `TYPE-B-PICK-DECISION.md` (this file)
- `shots/layout-axis/pick-decision/*`

**Modified**

- none of the locked files (`plans.html` / `layout.css` / `board.css` / `tokens.css`)

## Integrity

See `shots/layout-axis/pick-decision/integrity-scan.json` — `missing_refs` / `broken_local_links` must be `[]` for pack after adding files.

## Deliverable

- ZIP: `/workspace/study114-ds/stage5b-type-b-pick-decision.zip` (complete pack including decision folder)
- OUTSIDE zip: `/workspace/study114-ds/SHA256SUMS.txt` — format `<64-hex><TWO SPACES>stage5b-type-b-pick-decision.zip` (authoritative hash)