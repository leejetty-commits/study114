# Stage 5B · Layout Axis — UDX-STD-001 **1280px Shell**

작성: 2026-09-08 KST (Asia/Seoul)  
범위: `/workspace/study114-ds/stage5b-design-standard-v01/` only · ops/GitHub/DB/API 미수정  
뷰포트: Playwright true **1440×1200** (`innerWidth=clientWidth=1440`)  
측정 라벨: **「Stage 5B 정적 기준안의 computed 실측」** — **「현재 구축/운영 실측」이 아님**

> HTML disclaimers: static design board · NOT ops screens.

---

## Shell definition (document exactly)

**Shell max width = 1280px BORDER-BOX**  
(global `* { box-sizing: border-box }` in `tokens.css`).

When viewport ≥1280 and shell at max:

| Quantity | Value |
|---|---:|
| border-box width | **1280** |
| `padding-inline` | 32 + 32 (`--layout-gutter`) |
| content-box width | **1216** |
| Type A content | body + 24 + 300 = 1216 → body = **892** |
| Type B content | 220 + 24 + body + 24 + 300 = 1216 → body = **648** |
| Type A formula | `32+892+24+300+32=1280` |
| Type B formula | `32+220+24+648+24+300+32=1280` |
| Outer viewport margins @1440 | `(1440−1280)/2` = **80** each side |

Tokens (unchanged column widths): `--layout-gap: 24` · `--left-nav-width: 220` · `--right-rail-width: 300`.

---

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

---

## Archive note — 1360 (보완 전 제출본)

`shots/layout-axis/archive-1360/` holds the **pre-complement** submission where shell max was 1360 with 24px horizontal padding (Type A body≈988 / Type B body≈744). Kept for history only — **not** the current UDX-STD-001 target.

Artifacts: `archive-1360/layout-measure-*.json`, `archive-1360/LAYOUT-AXIS-1360.md`.

---

## BEFORE (historical · 1360 pack era @1440)

| page | type | bodyW | left→body | body→rail | railW | navW | mid−bot ΔL | mid−bot ΔR |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| home | A | 996 | — | 32 | 284 | — | 32 | 16 |
| search-room | A | 996 | — | 32 | 284 | — | 32 | 16 |
| search-tutor | A | 996 | — | 32 | 284 | — | 32 | 16 |
| search-student | A | 996 | — | 32 | 284 | — | 32 | 16 |
| plans | B | 728 | 32 | 48 | 284 | 220 | 32 | 16 |
| community | B | 744 | 32 | 24 | 300 | 212 | 32 | 16 |
| support | B | 760 | 16 | 16 | 300 | 220 | 32 | 16 |

Causes (unchanged narrative): hero max 720; mid wrap 1120+pad; bottom asymmetric margins; Type A double rail gap; Type B page-specific gaps. See `layout/layout-before.css`.

---

## AFTER 1280 · Stage 5B 정적 기준안의 computed 실측 @1440

| page | type | shellBB | content | gutter L/R | outer L/R | bodyW | left→body | body→rail | navW | railW | topW | midW | botW | mid−bot ΔL/R |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| home | A | 1280 | 1216 | 32/32 | 80/80 | **892** | — | 24 | — | 300 | 892 | 892 | 892 | 0/0 |
| search-room | A | 1280 | 1216 | 32/32 | 80/80 | **892** | — | 24 | — | 300 | 892 | 892 | 892 | 0/0 |
| search-tutor | A | 1280 | 1216 | 32/32 | 80/80 | **892** | — | 24 | — | 300 | 892 | 892 | 892 | 0/0 |
| search-student | A | 1280 | 1216 | 32/32 | 80/80 | **892** | — | 24 | — | 300 | 892 | 892 | 892 | 0/0 |
| plans | B | 1280 | 1216 | 32/32 | 80/80 | **648** | 24 | 24 | 220 | 300 | 648 | 648 | 648 | 0/0 |
| community | B | 1280 | 1216 | 32/32 | 80/80 | **648** | 24 | 24 | 220 | 300 | 648 | 648 | 648 | 0/0 |
| support | B | 1280 | 1216 | 32/32 | 80/80 | **648** | 24 | 24 | 220 | 300 | 648 | 648 | 648 | 0/0 |

### Formula check (≤1px)

- Type A: `32+892+24+300+32=1280` — **PASS** all 4 pages  
- Type B: `32+220+24+648+24+300+32=1280` — **PASS** all 3 pages  
JSON: `shots/layout-axis/formula-check-1280.json`

### Card regression

| Grid | Rule | Result |
|---|---|---|
| Prime | 3 equal cols · width Δ ≤1px | **PASS** |
| Pick | 5×2 = 10 · row width Δ ≤1px | **PASS** |
| Basic | 2×10 = 20 + numeric pagination | **PASS** |

JSON: `shots/layout-axis/card-regression-1280.json`

### Spot-check (unchanged chrome)

- search `btn--search` ≥ **72×40** @1440 where present  
- chip height **32** desktop where present  
- detail Secondary / card chrome: **not modified**

### Overflow

`scrollWidth ≤ clientWidth + 1` on all 7 **pages** (documentElement / shell) — **PASS**  
Type B Pick **card-level** overflow @ plans 5-col: see readability gate below (**FAIL**).

### Overlay guides

Red guides on **body** left/right edges + legend (not card edges). Blue: shell border-box.  
`shots/layout-axis/overlay/*-1280-body-guides.png` · `*-after-guides.png`

---

## Changed files / selectors (1280 complement)

| Path | Change |
|---|---|
| `tokens.css` | `--layout-shell-max:1280` · `--layout-gutter:32` (already set) |
| `layout/layout.css` | Shell A/B `max-width:1280` border-box · `padding-inline:var(--layout-gutter)` · gap 24 · nav 220 · rail 300 |
| `LAYOUT-AXIS.md` | Rewritten for 1280 + archive-1360 note |
| `REPORT.md` | § Layout Axis 1280 complement |
| `verify_layout_axis_1280.py` | Full metric measure + formula + card regression + body overlays |
| `shots/layout-axis/layout-measure-after.json` | 1280 AFTER computed |
| `shots/layout-axis/after/*-1440.png` | Recaptured @1440 |
| `shots/layout-axis/overlay/*` | Body-edge guides + legend |
| `shots/layout-axis/formula-check-1280.json` | A/B arithmetic |
| `shots/layout-axis/card-regression-1280.json` | Prime/Pick/Basic |
| `shots/layout-axis/layout-pass-summary.json` | PASS summary |
| `shots/layout-axis/archive-1360/**` | 보완 전 제출본 (kept) |
| `shots/layout-axis-1280/integrity.json` | Offline zip integrity |

**Not changed:** Prime/Pick/Basic card chrome, search 72×40, chip h32 desktop, detail Secondary (`board.css`).

---

## Complement — full-pack integrity + Type B Pick readability (2026-09-08 07:59 KST)

### Separate judgments (do not merge)

| # | Gate | Result |
|---|---|---|
| 1 | 1440px 정적 레이아웃 가로축 수치 (1280/32/24 · A 892 · B 220/648/300 · outer 80/80) | **PASS** 유지 |
| 2 | 완전 재현 ZIP 무결성 (HTML/CSS local ref full scan) | **PASS** |
| 3 | Type B Pick 가독성 (`layout/plans.html` @1440, body 648, 5-col) | **FAIL** |
| 4 | 공통 디자인 / Stage 5B 완료 / v1.0 / 운영 검증 | **선언하지 않음** |

### Type B Pick readability (FAIL baseline)

- Viewport: Playwright true **1440** · body **648** · Pick grid still **5-col** (column rule **not** locked as fix).
- Failures: price `월 …` / `원` abnormal split (원 alone on next line); card `scrollWidth > clientWidth`; price meta char-wrap; title/price clip.
- 「상세 보기」 button: single-line **PASS**.
- Stress (가상 long name / long region / 6-digit price): **FAIL** (not ops data).
- CSS typography+ellipsis trial: evaluated, **not applied** (price remains truncated; would not honestly fix 원 readability).
- Alts (제안·미승인 only):
  - Alt A: `layout/plans-pick-alt-a.html` + `shots/layout-axis/pick-alts/alt-a-typeb-list-mock-1440.png`
  - Alt B: `layout/plans-pick-alt-b.html` (4-col mock) + `shots/layout-axis/pick-alts/alt-b-*.png` — measured mock readability PASS; **not** default.

JSON: `shots/layout-axis/type-b-pick-readability-1280.json`  
Captures: `shots/layout-axis/after/plans-1440.png`, `plans-pick-zoom-1440.png`

### Full-pack integrity

- Scanned HTML+CSS: **31** · local refs: **177** · missing/broken: **[]**
- Prior ZIP omitted `shots/before-shape/*` needed by `09-shape-compare.html` — **real files restored into pack/ZIP**.
- Log: `shots/layout-axis-1280/full-ref-scan.log`
- Integrity: `shots/layout-axis-1280/integrity.json` ≡ `shots/layout-axis/integrity.json`
- ZIP: `/workspace/study114-ds/stage5b-layout-axis-1280-complete.zip`


## PASS gate (가로축 only)

**Stage 5B 1440px 정적 레이아웃 가로축: PASS** (formulas unchanged)

ZIP full-pack integrity: see complement table.  
Type B Pick readability: **FAIL** (5-col kept; alts 미승인).

Do **not** declare: common design complete · Stage 5B complete · v1.0 · ops verified · Cursor ready · paid merge.

### Follow-ups (후속 게이트)

960 / 768 / mobile GNB / Pick@≤719 / `prefers-reduced-motion` — remaining from GATE-AUDIT; out of this layout-axis complement.
