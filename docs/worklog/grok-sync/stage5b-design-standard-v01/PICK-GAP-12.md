# PICK-GAP-12 — Type A Pick column-gap 12px

작성: 2026-09-08 KST  
범위: `stage5b-design-standard-v01/` static pack ONLY · ops/GitHub/DB/API/Cursor repo **미수정**  
Stage 5B complete / v1.0 / ops — **미선언**

## Change

| Item | Value |
|---|---|
| File | `layout/layout.css` |
| Rule | `.layout-shell--a .pick-grid { column-gap: var(--s-1-5); row-gap: var(--s-2); }` |
| Tokens | `--s-1-5` = 12px · `--s-2` = 16px (`tokens.css`) |
| Untouched | `board.css` `.pick-grid { gap: var(--s-2) }` global (Type B keeps 16) |

Type A pages (`layout-shell--a`): home, search-room, search-tutor, search-student.  
Type B control: plans (`layout-shell--b`).

## Before / After (Playwright true 1440)

| Metric | Before (Type A) | After (Type A) |
|---|---|---|
| body width | 892 | 892 |
| pick grid width | 892 | 892 |
| pick column-gap | **16** | **12** |
| pick row-gap | 16 | 16 |
| 5 card widths (row1) | ≈165.6 equal | ≈**168.8** equal (±1) |
| 1st L / 5th R vs body | ≤1px | ≤1px |
| row2 baselines | match row1 | match row1 |
| Prime gap | 16 | 16 (unchanged) |
| Basic gap | 12 (`--s-1-5`) | 12 (unchanged) |
| shell / rail / body-rail | 1280 / 300 / 24 | unchanged |

| Metric | Type B plans (control) |
|---|---|
| pick column-gap | **16** (NOT 12) |
| body / nav / rail | 648 / 220 / 300 |

## Judgments

| Judgment | Result |
|---|---|
| Type A Pick 가로 간격 12px | **PASS** |
| Type A 가로축·5열 유지 | **PASS** |
| Prime·Basic 회귀 없음 | **PASS** |
| Type B 미변경 | **PASS** |

## Artifacts

- `shots/layout-axis/type-a-pick-gap-12.json`
- `shots/layout-axis/pick-gap-12/` — before-16 / after-12 compare, full + pick-zoom @1440, plans control

## Changed files

- `layout/layout.css` (scoped Type A pick gap only)
- `PICK-GAP-12.md` (this file)
- `CHANGED.md` (pointer)
- `shots/layout-axis/type-a-pick-gap-12.json`
- `shots/layout-axis/pick-gap-12/*`
