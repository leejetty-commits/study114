# PLANS-BADGE-MULTI — Stage 5B promotional badge multi-select prototype

작성: 2026-09-09 KST (UTC+9)  
범위: `stage5b-design-standard-v01/` **STATIC ONLY** · ops / GitHub / DB / API / PG / deploy **미수정**  
Stage 5B complete / v1.0 — **미선언**

## Goal

`layout/plans.html`에 Prime/Pick 노출 샘플(유지) 다음·Basic 무료 안내 이전에  
**홍보 배지 구매/선택 프로토타입**을 추가한다.  
단일 선택(v4) → **다중 선택(최대 2개)** 정책.

## KEEP (unchanged / verified)

| Item | Status |
|---|---|
| Prime sample 1 + Pick sample 1 | kept |
| Basic free-text notice only | kept (no Basic cards/list/pagination) |
| Type B shell 1280 / 220 / 648 / 300 @≥720 (desktop) | kept |
| Badge multi-select policy + desktop badge/order summary structure | kept |
| home / find pages | not modified |
| `board.css` card internals | not modified |
| Type A Pick gap12 | not modified |
| HOME/PLANS compare shots | QA-only under `shots/layout-axis/plans-card-sample/` |

## Mobile FAIL cancel (prior overall PASS)

**Cancelled:** prior overall PASS that treated mobile 360/390 as PASS.

Root cause: Type B kept fixed columns **220 / 648 / 300** on narrow viewports → main body collapsed to **~34px**, sample cards **~2px**, `nameVisible`/`priceVisible` **false**. Verifier previously did not hard-fail on those flags.

## CSS fix (additive)

Breakpoint: **`max-width: 719px`** (desktop Type B columns remain @ viewport **≥720**).

1. Type B/A shell → **single column** restack: nav (horizontal wrap) → body full width → rail below  
2. Shell `padding-inline: 16px` so body usable width ≈ **viewport − 32**  
3. `min-width: 0` on grid/flex children (prevent 34/26/2px collapse)  
4. `.plans-exposure__row` / slots → **1-col**; slot/card `width: 100%` (mobile card ≥280)  
5. Badge options + order summary → **1 column**; word/sentence wrap (`keep-all` + `overflow-wrap`), not 1-char column  
6. GNB: nav `overflow-x: auto` **scroll_disclosure (관찰만)** — PASS 근거 아님. `navScrollW > navClientW`이면 **mobileGnb FAIL**

## Policy (implemented)

1. **공부방(Room)**: Hot · 단과 — max **2** distinct  
2. **과외쌤(Tutor)**: Hot · 쪽집게 · SKY — max **2** distinct  
3. Checkbox / toggle **multi-select** (not radio)  
4. No duplicate same badge  
5. When 2 selected: remaining unchecked **disabled** + 「최대 2개까지 선택할 수 있습니다」  
6. Copy: badges add/change only at Prime/Pick **initial purchase or renewal** — notice only; **no** mid-term add/swap, prorated add-pay, badge-only renewal UI  
7. **No** separate badge period picker — shared Prime/Pick start~end (가상 dates)  
8. Order summary: each badge **separate line** + per-badge price + badge subtotal + final total (with Prime/Pick base)  
9. SKY note: school-info advertising expression, **not** school/academic certification  
10. Does **not** claim/implement ranking/15-min rotation weight by badge count  
11. Repro: URL `?badges=&role=room|tutor&product=prime|pick&term=` + demo buttons 0/1/2/blocked  
12. Virtual prices from plans-ui-v4 tables — labeled **디자인 검증용 가상 요금**

### Virtual fee tables (v4 reuse)

| Role | Term idx | 2주 | 1개월 | 2개월 | 3개월 | 6개월 |
|---|---|---:|---:|---:|---:|---:|
| room badge | | 2500 | 5000 | 9000 | 12750 | 24000 |
| tutor badge | | 5000 | 10000 | 19000 | 27000 | 51000 |
| room prime | | 30000 | 50000 | 90000 | 127500 | 240000 |
| room pick | | 15000 | 30000 | 54000 | 76500 | 144000 |
| tutor prime | | 18000 | 30000 | 57000 | 81000 | 153000 |
| tutor pick | | 10000 | 20000 | 38000 | 54000 | 102000 |

2 badges → 2× line items at `badge[termIdx]` each.

## Files changed

| Path | Change |
|---|---|
| `layout/plans.html` | Badge purchase block (kept) |
| `layout/plans-badge.js` | Multi-select state (kept) |
| `layout/layout.css` | Additive Type B restack `@media (max-width: 719px)` + exposure/badge mobile |
| `PLANS-BADGE-MULTI.md` | This doc — prior mobile PASS cancelled |
| `shots/layout-axis/plans-badge-multi/*` | Captures + JSON |
| `_capture_plans_badge_multi.py` | Strict mobile verifier rewrite |

## DOM counts (must hold)

| Selector | Expected | Result |
|---|---:|:---:|
| `.card--prime` | 1 | PASS |
| `.card--pick` | 1 | PASS |
| `.card--basic` | 0 | PASS |
| `article.card` | 2 | PASS |
| pagination | 0 | PASS |
| `.basic-grid` | 0 | PASS |

## Verifier hard FAIL (forbids overall PASS)

- `nameVisible=false` OR `priceVisible=false`
- sample card width **&lt; 280px** (mobile 1-col)
- main body width **&lt; viewport − 32** (360→≥328, 390→≥358)
- badge option width **&lt; 240px**
- `scrollWidth > innerWidth`
- still fixed Type B 220/rail columns on mobile
- badge name/desc/price vertical 1-char stacks
- required 2-selected / 3rd-blocked not visible on mobile captures
- GNB: `scroll_disclosure` ≠ PASS. `navScrollW > navClientW` → **mobileGnb FAIL** (별도 기록)

## Mobile measurements (this run)

| VP | body | cards | options | name/price | GNB |
|---:|---:|---:|---:|:---:|---|
| 360 | **328** | **328 / 328** | **294** | true/true | **FAIL** (scroll_disclosure 관찰 · navScrollW 439 > client 267) |
| 390 | **358** | **358 / 358** | **324** | true/true | **FAIL** (scroll_disclosure 관찰 · navScrollW 439 > client 297) |

Desktop Type B @1440: shell **1280** / nav **220** / body **648** / rail **300** — PASS.

## Judgments

See `shots/layout-axis/plans-badge-multi/plans-badge-multi.json`.

| # | Item | Result |
|---|---|:---:|
| 1 | Room/Tutor badge sets + max 2 multi-select | PASS |
| 2 | Limit message + 3rd blocked | PASS |
| 3 | Order summary separate badge lines | PASS |
| 4 | SKY note / no mid-term / no ranking-weight claim | PASS |
| 5 | URL + demo repro | PASS |
| 6 | Card counts + desktop Type B shell | PASS |
| 7 | Mobile 360/390 body/card/option widths + visibility | PASS |
| 8 | mobileGnb | **FAIL** |

### Separated judgments (doc/JSON only correction — screens/CSS unchanged)

| Key | Result |
|---|---|
| `badgePrototype` | **PASS** |
| `mobileTypeBContent` | **PASS** |
| `mobileGnb` | **FAIL** |
| `stage5bOverall` | **HOLD** |
| `designManualV1` | **NOT_DECLARED** |

**단일 overall PASS 문구 삭제.**  
`scroll_disclosure`는 관찰 상태일 뿐 PASS 근거가 아니다.  
`navScrollW > navClientW`이고 스크롤 없이 전체 메뉴가 보이지 않으므로 모바일 GNB는 **FAIL**.  
Stage 5B 완료 · v1.0 · 디자인 매뉴얼 v1 — **미선언**.

## Captures

Path: `shots/layout-axis/plans-badge-multi/`

- `01-plans-full-page-1440.png` … `09-url-query-tutor-2.png` (desktop)
- `10` / `10b` mobile **360** badge area (2 selected)
- `11` mobile **360** Prime/Pick samples
- `12` / `12b` mobile **390** third badge blocked
- `13` mobile **390** order summary · `13b` samples

## Pack

- ZIP: `/workspace/study114-ds/stage5b-plans-card-sample.zip` (archived pick-decision experiments excluded)
- SUMS: `/workspace/study114-ds/SHA256SUMS.txt` · `<64hex><TWO SPACES>stage5b-plans-card-sample.zip`

STOP.
