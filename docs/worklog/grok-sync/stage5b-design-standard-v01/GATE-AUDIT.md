# Stage 5B COMMON Design Gate Audit — 우동공과

작성: 2026-09-08 03:12 KST (Asia/Seoul)  
감사 범위: `/workspace/study114-ds/stage5b-design-standard-v01/` (boards 01–08 + tokens/board CSS + docs)  
방법: Playwright Chromium · **true viewport** (`innerWidth == clientWidth == 요청폭`) · DPR=1  
서버: `python3 -m http.server 47503` (팩 루트)  
제약: **READ-ONLY** (감사 리포트·`shots/gate-audit/` 캡처만 작성). CSS/HTML 수정·ops/GitHub/DB/API/routes/PR/Notion/plans-ui-v5 **미터치**. 유료상품 페이지 **재설계·머지 없음**.

SSOT: `ssot/UDX-STD-001-Button.md`, `TOKENS.md`, `tokens.css`, `REPORT.md`, `EXCEPTIONS.md`, stage5a locked `RESPONSIVE.md` / `COMPONENTS.md` (가격·그리드 규칙).  
증거 한도: Notion live fetch 없음 — 버튼 수치는 팩 SSOT 미러 기준.

---

## 최종 분할 판정

| 축 | 판정 |
|----|------|
| **공통 디자인** | **FAIL** |
| **유료상품 통합** | **HOLD** |
| **전체 Stage 5B 및 v1.0** | **미판정** |

Chip44 regression (Part 1): **PASS** (`true`)

FAIL count (공통 체크리스트 항목): **5**  
HOLD count: **게이트 표 HOLD 행 2** (B2 Empty/Loading + P* paid 일괄) · **§5 HOLD 리스트 11** · **§7 paid future-merge 체크리스트 13** (모두 HOLD)

---

## 1. Common gate table

| ID | Category | Item | Result | Evidence |
|----|----------|------|--------|----------|
| F1 | Foundation | Primary / Ink / Muted / Bg / Surface / Line | **PASS** | `tokens.css` `.uds-theme`: `--uds-primary #266BC4`, `--uds-ink #1C1917`, `--uds-muted #4B5563`, `--uds-bg #F7F8FA`, `--uds-surface #FFF`, `--uds-line #E5E7EB`. Measured 01@1440 (`gate-measurements.json` → foundation.tokens). |
| F2 | Foundation | Role accents (room/tutor/student) limited use | **PASS** | `--role-room #266BC4` / `--role-tutor #0F766E` / `--role-student #5B4BD6` (+ soft/line). 04: Role Tab soft+border only; Primary CTA 전부 `rgb(38,107,196)` (=#266BC4). Shot: `shots/gate-audit/qa-04-1440.png`. |
| F3 | Foundation | Typo 12/14/16/18/22/28/36 (FS-1~7) | **PASS** | Tokens `--fs-12`…`--fs-36`. 01 DOM sample counts: 12/14/16/18/22/28/36 all present (`fsSamples`). |
| F4 | Foundation | Spacing tokens | **PASS** | `--s-0-5`…`--s-10` (4–80) in `tokens.css`. |
| F5 | Foundation | Radius 4 / 6 / 8 / 12 | **PASS** | Measured 01@1440: badge **4px**, role-tab/chip **6px**, btn **8px**, card **12px**. |
| F6 | Foundation | No default card shadow | **PASS** | `.card` `boxShadow: none` (05@1440). Only `.sticky-sample` uses `--shadow-sticky`. |
| S1 | Shape | Badge r4 | **PASS** | `.badge` → `var(--r-badge-a)` = 4px. 02 board + measure. |
| S2 | Shape | Role tab r6 | **PASS** | `.role-tab` borderRadius 6px · h34. |
| S3 | Shape | Filter chip r6 | **PASS** | `.chip` borderRadius 6px (`--r-chip`). |
| S4 | Shape | Control r8 | **PASS** | `.btn` / `.btn--search` / `.btn--detail` / input → `--r-ctl` 8px. |
| S5 | Shape | Surface r12 | **PASS** | `.card` / shell-filter → `--r-card` 12px. |
| S6 | Shape | No text 999 pill in production boards | **PASS** | Production boards: `production999Count: 0`. Demo on 02 only via `.pill-deprecated` (labeled 폐기). |
| V1 | Vertical rhythm | title→desc / title→cards / image→caption / card info→action / section gaps | **PASS** | 03: Dense/Standard/Spacious card gaps **8 / 12 / 16** (`--s-1` / `--s-1-5` / `--s-2`). Standard recommended. CSS `.vr-*` + `qa-03-1440.png`. (titleDescGap auto-measure noisy due to multi-column layout; CSS tokens used.) |
| R1 | Role modes | Same layout across roles | **PASS** | 04: 3 panels, identical structure; tabs r6/h34. `qa-04-1440.png`. |
| R2 | Role modes | Limited accent; Primary CTA brand blue | **PASS** | Selected tab uses role soft/line; CTA `쪽지 보내기` bg `#266BC4` on all three roles. |
| R3 | Role modes | Status vs role colors not confused | **PASS** | Status badges use success/public tokens; role banners/tabs use role-* ; not interchangeable in 04/06. |
| C1 | Cards | Prime / Pick / Basic hierarchy | **PASS** | 05: prime-grid / pick-grid / basic-grid present; typography 18 vs 16 on Basic. `qa-05-1440.png`. |
| C2 | Cards | Long name / region | **PASS** | Long names present (e.g. Pick 15자); `.card-name` `-webkit-line-clamp: 2`. |
| C3 | Cards | Price present / absent | **PASS** | Prime/Basic `.card-price` or caption「가격 숨김·정책 TBD」; Pick via `.pick-dl` dt/dd. 「가격 문의」 미사용 (EXCEPTIONS). |
| C4 | Cards | Photo yes/no | **PASS** | `사진 없음` empty frames + photo placeholders; 4:3 ratio ≈1.333 measured. |
| C5 | Cards | Badges 0/1/2 | **PASS** | Inventory includes 0/1/2 badge counts across tiers. |
| C6 | Cards | 「상세 보기」 Secondary | **PASS** | Copy exact; bg white · color `#266BC4` · minW 84 · h40 desktop / h44 ≤768. UDX-STD-001. |
| B1 | Banners | Info / Success / Warning / Error / Role | **PASS** | 06: `banner--info|success|warning|error|role-room|role-tutor|role-student` (+ paid). `qa-06-1440.png`. |
| B2 | Banners | Empty / Loading / Error page states | **HOLD** | Dedicated Empty/Loading 풀페이지 상태 보드 없음. 카드「사진 없음」·필드 숨김 패턴만. 증거 한도: 팩 보드 기준. |
| B3 | Banners | No unfounded badges (Hot/SKY/1위/금) | **PASS** | 보드에 금지 뱃지 없음 (EXCEPTIONS·COMPONENTS 금지 유지). |
| RSP1 | Responsive | 768 Basic **2-col** | **FAIL** | Measured 05 & 08 @768: `firstRowCount=1`, template `736px`. Cause: `board.css` `@media (max-width: 768px){ .basic-grid,.shell-results{ grid-template-columns:1fr } }` — collapses at 768 inclusive. 5A RESPONSIVE: 768 must stay **2열**; 1열은 `max-width:719px`. Shots: `qa-05-768.png`, `qa-08-768.png`. |
| RSP2 | Responsive | ≤719 Basic·Pick **1-col** | **FAIL** | Basic@430/390/360 = 1-col **OK**. Pick@430/390/360 = **2-col** (no `max-width:719` rule; ≤768 Pick stays `repeat(2,1fr)`). Shots: `qa-05-390.png`, `qa-05-360.png`. |
| RSP3 | Responsive | Desktop Pick 3-col recommended max 4 | **PASS**† | Actual Pick@1440 = **5-col** (`repeat(5,1fr)`). Matches **stage5a locked RESPONSIVE** (1440 Pick 5열). Gate brief “recommended max 4” noted; product SSOT wins → PASS with note. @960 Pick=3 OK. |
| RSP4 | Responsive | GNB clipping | **FAIL** | 08 shell @430/390/360: `.shell-nav` `overflow-x:auto`, `needsHScroll=true` (e.g. 390: scrollW 436 > clientW 279). Links「유료상품」「커뮤니티」「고객센터」`visible:false` without scroll. Brief: clipping ≠ PASS. Shots: `gnb-390.png`, `gnb-360.png`, `qa-08-390.png`. (768/960/1440: no HScroll.) |
| RSP5 | Responsive | Overflow / overlap / badge clip / image distortion | **PASS** | Document `scrollWidth <= clientWidth` on 08/05 at all audit widths. Chip44: no chip/search/select overlap. Media 4:3 intact. Badges nowrap. |
| RSP6 | Responsive | 960 Prime 3-col (5A) | **FAIL** | Measured Prime@960 `firstRowCount=2` (template 2 cols). CSS drops Prime to 2 at `max-width:1100px` (not 960). 5A: 960 Prime **3열**. |
| A1 | A11y | 44px touch (mobile ≤768) | **PASS** | @390: chip/search/detail/btn minHeight **44**. Chip44 regression PASS. |
| A2 | A11y | focus-visible | **PASS** | `tokens.css` `.uds-theme :focus-visible` outline 2px `#266BC4` offset 2. Tab focus measured outline solid 2px. Shot: `qa-a11y-focus-390.png`. |
| A3 | A11y | Contrast notes | **PASS** | Approx WCAG: primary↔white **5.27:1**; ink↔white **17.5:1**; muted↔white **7.56:1**. Role soft pairs ≥4.8. (Pack-computed; not lab spectrophotometer.) |
| A4 | A11y | Ellipsis / clamp | **PASS** | `.card-name` / `.card-desc` `-webkit-line-clamp` + overflow hidden (`board.css`). |
| A5 | A11y | prefers-reduced-motion | **FAIL** | No `@media (prefers-reduced-motion)` in pack CSS. Buttons still declare `transition: background 0.12s…`. |
| A6 | A11y | Not color-only status | **PASS** | Badges/banners carry text labels (증빙/공개/안내/저장됨 등). |
| P* | Paid context | All paid-merge items | **HOLD** | 07 only cool vs ivory juxtaposition. **Do not redesign.** See §5·§7. Note:「유료상품 페이지 정교화 및 정책 결정 후 공통 UDX와 통합 검증」. |

† See FAIL list if product later adopts gate “max 4” over 5A.

---

## 2. Width QA table

| Width | Basic cols (05/08) | Pick cols (05) | Prime cols (05) | Doc overflow 08/05 | GNB HScroll (08) | Chip H (08) | Search | Notes |
|------:|--------------------|----------------|-----------------|--------------------|--------------|-------------|--------|-------|
| **1440** | 2 / 2 | **5** | 3 | PASS / PASS | no | 32 | 72×40 | Control. Pick=5 per 5A. |
| **960** | 2 / 2 | 3 | **2 FAIL†** | PASS / PASS | no | (n/a shell chip still 32) | — | Prime should be 3 per 5A. |
| **768** | **1 / 1 FAIL** | 2 | 1 | PASS / PASS | no | **44** | 72×44 | Basic must be **2**. Chip44 OK. |
| **430** | 1 / 1 | **2 FAIL** | 1 | PASS / PASS | **yes FAIL** | 44 | 72×44 | Pick should be 1 @≤719. |
| **390** | 1 / 1 | **2 FAIL** | 1 | PASS / PASS | **yes FAIL** | 44 | 72×44 | Same. |
| **360** | 1 / 1 | **2 FAIL** | 1 | PASS / PASS | **yes FAIL** | 44 | 72×44 | Same. |

Raw: `shots/gate-audit/gate-measurements.json` → `responsive.summary`.

---

## 3. A11y table

| Item | Result | Evidence |
|------|--------|----------|
| Touch ≥44 @≤768 | **PASS** | chip/search/detail = 44 @390/360/768 (`computed-sizes-chip44.json`) |
| focus-visible | **PASS** | tokens rule + measured Tab outline 2px primary |
| Contrast (token approx.) | **PASS** | primary/white 5.27; ink/white 17.5; muted/white 7.56 |
| Ellipsis / line-clamp | **PASS** | board.css card-name/desc |
| prefers-reduced-motion | **FAIL** | absent in CSS |
| Status not color-only | **PASS** | text on badges/banners |
| Button label nowrap | **PASS** | `.btn` / `.btn--search` / `.btn--detail` `white-space:nowrap`; no wrap measured. Chips `normal` but short labels `wraps:false`. |

---

## 4. FAIL list (do **not** implement in this audit)

| # | Cause | Affected screens | Recommended fix (advisory only) |
|---|--------|------------------|----------------------------------|
| 1 | Basic grid becomes 1-col at `max-width:768` inclusive | `05-cards.html`, `08-responsive-shell.html`, any `.basic-grid` / `.shell-results` | Change 1-col Basic to `@media (max-width: 719px)`; keep **2-col at 768** (5A RESPONSIVE). |
| 2 | Pick stays 2-col below 719 (no ≤719 breakpoint) | `05-cards.html` @430/390/360 | Add `@media (max-width: 719px){ .pick-grid{ grid-template-columns:1fr } }` (and Basic same). |
| 3 | Mobile GNB clips / requires horizontal scroll; trailing items not visible | `08-responsive-shell.html` @≤430 | **Not PASS while clipped.** Needs product decision (hamburger / bottom tab / priority truncate) — currently EXCEPTIONS “임시 가로 스크롤·미확정”. Until resolved → gate FAIL. |
| 4 | Prime drops to 2-col from 1100px, so @960 ≠ 5A 3-col | `05-cards.html` @960 | Align Prime breakpoint with 5A (3-col through 960; step down only ≤768 → 1). |
| 5 | No `prefers-reduced-motion` | Global `board.css` transitions | Add reduced-motion media query to neutralize non-essential transitions. |
| 6 | *(Width QA composite)* Responsive rule set incomplete vs 5A locked table | 05/08 multi-width | Reconcile `board.css` media queries with stage5a `RESPONSIVE.md` §1·§6 before common PASS. |

---

## 5. HOLD list (paid + deferred)

| Item | Note |
|------|------|
| 07 paid cool vs ivory | Visual juxtapose only — **no merge**. |
| Paid page hierarchy / plan cards | 유료상품 페이지 정교화 및 정책 결정 후 공통 UDX와 통합 검증 |
| Price / period / benefits fields | Same HOLD note |
| States: pre / post / owned / expired / disabled | Same |
| Duplicate-purchase notice | Same |
| Primary CTA on paid flows | CTA already Primary blue in 07 sample; full-flow HOLD |
| Paid canvas / soft / line scope | Ivory tokens present; production scope HOLD |
| Alignment paid ↔ common button/banner/card | HOLD until paid page freeze |
| Paid breakpoints | HOLD |
| Paid empty / loading / error | HOLD |
| Dedicated Empty/Loading boards (common) | Not boarded; photo-없음 / field-hide only |

---

## 6. Exceptions list (from pack + audit)

| Exception | Status |
|-----------|--------|
| `--r-pill` 999 for toggle/icon-only only | Allowed (EXCEPTIONS.md); text pills deprecated — **observed OK** |
| 가격 미입력 공개 정책 | TBD — boards hide price area |
| Notion UDX live | Not fetched this audit — pack SSOT used |
| Mobile GNB / hamburger / bottom tab | **Unresolved** — temporary HScroll; **gate FAIL while clipping** |
| 로그인 게이트·disabled 카피 | Example hints only |
| ops / GitHub / DB / API / routes / stage5a / plans-ui-v5 | Untouched |
| Hot / SKY / 1위 / gold promo badges | Forbidden — not introduced |
| Pick 5-col @1440 vs gate “max 4” wording | **5A locked wins** → scored PASS with note |

---

## 7. Paid future-merge checklist

(모든 항목 현재 **HOLD** — 「유료상품 페이지 정교화 및 정책 결정 후 공통 UDX와 통합 검증」)

- [ ] Hierarchy: plan / option / order summary vs common Prime·Pick·Basic
- [ ] Price / period / benefits field rules (present/absent, ink color, no invented CTA copy)
- [ ] Lifecycle states: pre-purchase / post-purchase / owned / expired / disabled
- [ ] Duplicate-purchase notice pattern (banner vs modal) + copy lock
- [ ] Primary CTA only for purchase decision; Secondary for detail/nav
- [ ] Paid canvas (`--paid-bg`) / soft / line scope vs common cool canvas
- [ ] Badge「이용중 상품」r4 + paid ink — no pill
- [ ] Alignment with common button (UDX-STD-001), banner, card radii/heights
- [ ] Breakpoints: 1440 / 960 / 768 / ≤719 / 430 / 390 / 360 parity with common
- [ ] Empty / Loading / Error for paid lists & checkout
- [ ] GNB「유료상품」entry without mobile clip regression
- [ ] Contrast on ivory surfaces (paid-ink / paid-muted)
- [ ] No merge into common PASS until above signed off

---

## 8. Chip44 regression summary

| Check | 768 | 390 | 360 | 1440 |
|-------|-----|-----|-----|------|
| Viewport exact | PASS | PASS | PASS | PASS |
| `.chip` height | **44** | **44** | **44** | **32** (~desktop) |
| Filter wrap | wrap OK | wrap OK | wrap OK | row |
| Search pos / overlap | no overlap | no overlap | no overlap | no overlap |
| Button nowrap | PASS | PASS | PASS | PASS |
| scrollWidth ≤ clientWidth | PASS | PASS | PASS | PASS |
| Search size | 72×44 | 72×44 | 72×44 | 72×40 |
| Detail Secondary | minW84 · 94×44 | 94×44 | 94×44 | 94×40 |

**Overall Chip44: PASS** (`failures: []`)

Paths:
- Dir: `/workspace/study114-ds/stage5b-design-standard-v01/shots/gate-audit/`
- JSON: `/workspace/study114-ds/stage5b-design-standard-v01/shots/gate-audit/computed-sizes-chip44.json`
- Measurements: `/workspace/study114-ds/stage5b-design-standard-v01/shots/gate-audit/gate-measurements.json`
- Zip: `/workspace/study114-ds/stage5b-gate-audit-chip44-shots.zip`
- Verifier used this run: `verify_gate_audit.py` (fresh; prior `verify_chip44_regression.py` port 8794 historical)

---

## 9. Final split judgment (repeat)

1. **공통 디자인: FAIL** — blocking: Basic@768 1-col, Pick@≤719 still 2-col, mobile GNB clip, Prime@960 2-col vs 5A, missing reduced-motion.  
2. **유료상품 통합: HOLD** — 07 context only; no redesign/merge.  
3. **전체 Stage 5B 및 v1.0: 미판정** — common FAIL + paid HOLD.

Chip44 shape/touch regression alone remains **PASS** and does not elevate the common gate.

---

## Artifact index

| Path | Role |
|------|------|
| `GATE-AUDIT.md` | This report |
| `shots/gate-audit/*` | Fresh captures + JSON |
| `/workspace/study114-ds/stage5b-gate-audit-chip44-shots.zip` | Chip44/shell shot bundle |
| `REPORT.md` §10 | Pointer to this audit |
