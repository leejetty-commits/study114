# PLANS-CARD-SAMPLE — Stage 5B paid-product exposure examples (FAIL fix)

작성: 2026-09-09 KST (UTC+9)  
범위: `stage5b-design-standard-v01/` **STATIC ONLY** · ops / GitHub / DB / API / Cursor / PR **미수정**  
Stage 5B complete / v1.0 — **미선언**

## Prior submission FAIL reason

Previous `layout/plans.html` kept **Basic 20 cards (2×10) + numeric pagination** on the paid page.  
That violates the product rule: the paid page shows **ONLY two profile sample cards** (Prime 1 + Pick 1).  
**Basic is NOT a paid product** — free text notice only. No Basic profile cards / grids / lists / pagination on plans.

## Cancelled premise

「plans Type B Pick 4-col A/B」 product rule — **CANCELLED**.  
Do **not** continue 4/5-col readability work for plans lists.  
Past Pick 4-col A/B compare pages, shots, and 5-col list-readability measure artifacts are **archived outside** the final review ZIP (see Archive).  
No new 3-col/list alternatives invented for plans.

## Type B Pick 5-col readability

**N/A** — 유료상품 화면은 실목록이 아닌 설명용 샘플 카드만 두므로, 목록 형태(5-col 등) 가독성 검증은 적용하지 않는다.

## Base

| Item | Value |
|---|---|
| Continue-from ZIP SHA-256 | `ddef249fa914d42c5323a25228217079ee967af4e11809d656fa130daa598e34` |
| Source | `/workspace/study114-ds/stage5b-layout-axis-1280-complete.zip` |
| plans-ui-v5 | reference only — **not** overwrite target |
| Viewport | Playwright true **1440** · DPR 1 |

## Goal (done)

`layout/plans.html` paid content shows **representative sample cards only**:

- Profile cards **total 2**
- Prime: **exactly 1** sample (home Prime chrome)
- Pick: **exactly 1** sample (home Pick chrome)
- Basic cards: **0**
- Lists: **0** (no `.basic-grid` / `.prime-grid` / `.pick-grid` on plans)
- Pagination: **0**
- Basic = **free text notice only** (not a paid product; no Basic profile cards)
- Real Prime / Pick / Basic lists live only on **home / find** screens (unchanged)
- Labels outside cards: 「홈·찾기 화면 노출 예시」, helpers, 「디자인 검증용 가상 예시」
- Type B shell @1440: **1280 / nav220 / body648 / rail300**
- Sample left + copy right; card **not** stretched to body width

## Basic free notice (text only)

> Basic 기본 노출은 무료로 제공됩니다. Prime 노출과 Pick 노출은 홈·찾기 화면에서 프로필을 더 잘 발견할 수 있도록 돕는 유료 노출상품입니다.

## Home computed (source of truth @1440 Type A body 892)

| Card | W | H | media W×H | button W×H |
|---|---:|---:|---:|---:|
| `.card--prime` first | **286.66** | **442.88** | 284.66×213.48 | 94×40 |
| `.card--pick` first | **168.8** | **368.63** | 166.8×125.09 | 94×40 |

## Plans sample computed (remeasured @1440)

| Sample | W | H | ΔW vs home | ΔH vs home |
|---|---:|---:|---:|---:|
| Prime sample | 286.66 | 442.86 | 0.00 | 0.02 |
| Pick sample | 168.8 | 368.61 | 0.00 | 0.02 |

Slot CSS (plans-local only):  
`width: calc((892px - 32px) / 3)` Prime · `width: calc((892px - 48px) / 5)` Pick  
Common classes: `card card--prime` / `card card--pick` from `board.css` (no card-internal overrides).

## Auto-count check (DOM) — MUST PASS

Source: `shots/layout-axis/plans-card-sample/plans-card-count.json`

| Selector / rule | Expected | Actual | Result |
|---|---:|---:|:---:|
| `.card--prime` | 1 | 1 | **PASS** |
| `.card--pick` | 1 | 1 | **PASS** |
| `.card--basic` | 0 | 0 | **PASS** |
| `article.card` | 2 | 2 | **PASS** |
| main profile cards | 2 | 2 | **PASS** |
| `.pagination` / `.layout-pagination` / pager UI | 0 | 0 | **PASS** |
| `.basic-grid` (+ synonyms) | 0 | 0 | **PASS** |
| If main profile cards > 2 | FAIL overall | n/a | **PASS** |

## Judgments (all must pass — else do not declare overall PASS)

| # | Judgment | Result |
|---|---|:---:|
| 1 | Prime sample 1 | **PASS** |
| 2 | Pick sample 1 | **PASS** |
| 3 | Basic cards 0 | **PASS** |
| 4 | Total profile cards 2 | **PASS** |
| 5 | No profile list | **PASS** |
| 6 | No pagination | **PASS** |
| 7 | Home card size parity (remeasure; ≤1px) | **PASS** |
| 8 | Local refs missing 0 | **PASS** |
| 9 | Past 4/5-col experiments excluded from final ZIP | **PASS** |
| — | Type B Pick 5-col readability | **N/A** |

**Overall: PASS** (judgments 1–9)

## Unchanged (confirmed)

| Asset | Status |
|---|---|
| `board.css` / `tokens.css` | Not modified this fix |
| Home / find Basic20 / Prime / Pick structures | **NOT changed** |
| Type A Pick gap12 rule | `.layout-shell--a .pick-grid` column-gap 12 / row-gap 16 **unchanged** |
| Shell tokens | Type B 1280 / 32 / 220 / 24 / 648 / 24 / 300 **unchanged** |
| plans CSS | Additive `.page-plans .plans-exposure*` + `.plans-basic-notice` only — no card-internal overrides |

## Changed files (this FAIL fix)

| Path | Change |
|---|---|
| `layout/plans.html` | Removed Basic20 + pagination; Basic = free text notice only; keep Prime1 + Pick1 samples |
| `layout/layout.css` | Additive `.page-plans .plans-basic-notice` |
| `PLANS-CARD-SAMPLE.md` | Rewritten (remove “Basic bottom kept” / false list-misread / Basic20-as-regression claims) |
| `shots/layout-axis/plans-card-sample/*` | New @1440 captures + `plans-card-count.json` + integrity |

## Archive (OUT of final review ZIP)

Moved to `/workspace/study114-ds/_archive-pick-decision-2026-09-09/` (working tree may retain references in older docs; **ZIP must not include**):

- `layout/pick-decision/`
- `layout/plans-pick-alt-a.html`, `layout/plans-pick-alt-b.html`
- `TYPE-B-PICK-DECISION.md`
- `shots/layout-axis/pick-decision/`
- `shots/layout-axis/pick-alts/` (Type B Pick 4-col A/B compare shots)
- `shots/layout-axis/type-b-pick-readability-1280.json` (+ layout-axis-1280 copy)

## Captures @1440 (refreshed)

Path: `shots/layout-axis/plans-card-sample/`

1. `01-plans-full-page.png` — plans full page to bottom (no Basic cards)
2. `02-plans-prime-section-zoom.png` — Prime section zoom
3. `03-plans-pick-section-zoom.png` — Pick section zoom
4. `04-plans-bottom-no-basic-zoom.png` — bottom zoom proving no Basic20 / pagination
5. `05-home-vs-plans-prime.png` — home Prime vs plans Prime
6. `06-home-vs-plans-pick.png` — home Pick vs plans Pick

JSON: `plans-card-count.json` · `plans-card-sample-computed.json`  
Integrity: `integrity.json` — missing **[]** · broken **[]**

## Shell @1440 (plans Type B)

| Measure | W |
|---|---:|
| shell | 1280 |
| nav | 220 |
| body | 648 |
| rail | 300 |

## Pack

- ZIP: `/workspace/study114-ds/stage5b-plans-card-sample.zip` (clean rebuild; archived experiments excluded)
- SUMS: `/workspace/study114-ds/SHA256SUMS.txt` · `<64hex><TWO SPACES>stage5b-plans-card-sample.zip`

STOP.
