# MEASUREMENTS — paid-storefront-shell-fit

정적 Shell 보정 시안 · 운영 아님 · 정책/가격 변경 없음 · 승인 시안 적응 · v1.0 아님

> Stage 5B Type B (220 / 648 / 300 / gap24) = **정적 보드 1차 후보** · ops 최종 아님.

---

## 1) Live mypage FACT (logged-in, computerUse 2026-09-17)

Source: `/workspace/study114-ds/live-paid-shell-measure-2026-09-17/mypage-shell-1440x900-full.png`  
Context: `?cb=1#/mypage/home` (plans routes login-walled)

| 항목 | Live reported (px) | Notes |
|------|-------------------:|-------|
| Outer `.home-body` | **1280** | FACT |
| Inner shell row | **1216** | FACT (=1280−32−32) |
| Left mypage menu | **160** | FACT |
| Menu → center gap | **24** | FACT |
| Center body (reported) | **736** | see §2 reconciliation |
| Center → rail gap | **8** | FACT |
| Right rail | **224** | FACT |
| `.home-main` (reported) | **984** | stated as 736+8+224 (arith =968) |

Login wall: `#/plans`, `#/plans/positions`, `#/plans/access`.

---

## 2) Stage5B vs Live vs Adopted

| 항목 | Stage5B candidate | Live measured | **Adopted** |
|------|------------------:|--------------:|------------:|
| shell / `.home-body` | 1280 | **1280** | **1280** |
| gutter | 32 | **32** (row 1216) | **32** |
| left nav | 220 | **160** | **160** |
| nav → body gap | 24 | **24** | **24** |
| body column | 648 | reported **736** · row-implied **800** | **800** (`1fr`) |
| body → rail gap | 24 | **8** | **8** |
| right rail | 300 | **224** | **224** |
| body+gap+rail | — | reported 984 | **1032** (=800+8+224) |
| 공식 | `32+220+24+648+24+300+32=1280` | row `160+24+?+8+224=1216` | `32+160+24+800+8+224+32=1280` |

### Reconciliation (deliberate, documented)
- Live row FACTS that must hold together: **1216 = 160 + 24 + body + 8 + 224** → **body = 800**.
- Reported center **736** and `.home-main` **984** (=736+8+224 claimed, but 736+8+224=**968**) are **internally inconsistent** with row 1216.
- **Adopted body = `1fr` = 800** so that nav/gaps/rail match Live exactly and the 1216 row identity holds.
- Delta vs reported 736: **+64px** on the center **grid track** (likely reported 736 = inner panel/content, not the column track).

---

## 3) 본 팩 Playwright 실측 @1440 (Adopted)

| 항목 | positions | access | 기대 |
|------|----------:|-------:|-----:|
| shell width | 1280 | 1280 | 1280 |
| pad L/R | 32/32 | 32/32 | 32/32 |
| left nav | 160 | 160 | 160 |
| left gap | 24 | 24 | 24 |
| body track | 800 | 800 | 800 |
| right gap | 8 | 8 | 8 |
| right rail | 224 | 224 | 224 |
| inner row | 1216 | 1216 | 1216 |
| body+gap+rail | 1032 | 1032 | 1032 |

검증: `160+24+800+8+224=1216` ✓ · `32+1216+32=1280` ✓

캡처: `after/AFTER-*-1440.png`, `after/AFTER-*-mobile-390.png`  
Live shots: `live-measure/mypage-shell-1440x900-full.png`, login-gate shots.

---

## 4) 모바일 @390

Restack: nav → body → rail (gap spacers hidden).  
`after/AFTER-positions-mobile-390.png`, `after/AFTER-access-mobile-390.png`

## 5) 블록·박스 computed 실측 @1440

Viewport: **1440×900**, `deviceScaleFactor=1` (measure). Source: Playwright `getBoundingClientRect` + `getComputedStyle` on `file://` `positions.html` / `access.html`.

All numeric values below are **FACT** (no estimates). Heights = element border-box height (tall sections OK as full element height).

### 5.1 Shell (reconfirm) — positions | access

| 항목 | positions W×H | access W×H | pad L/R | 기대 | label |
|------|--------------:|-----------:|--------:|-----:|:-----:|
| shell | 1280.0×3310.8 | 1280.0×1967.3 | 32.0/32.0 | 1280 | **FACT** |
| left nav | 160.0×353.0 | 160.0×353.0 | 8.0/8.0 | 160 | **FACT** |
| nav→body gap | 24.0×0.0 | 24.0×0.0 | 0.0/0.0 | 24 | **FACT** |
| body track | 800.0×3238.8 | 800.0×1895.3 | 0.0/0.0 | 800 | **FACT** |
| body→rail gap | 8.0×0.0 | 8.0×0.0 | 0.0/0.0 | 8 | **FACT** |
| rail | 224.0×617.2 | 224.0×644.9 | 0.0/0.0 | 224 | **FACT** |

Shell pad L/R: **32/32** · Body track pad L/R: **0/0** (track=800) · body x: **296→1096**.

Inner `.page` (FACT): width **798**, pad L/R **18/18** → content/panel width **762** (panels left **315** = body 296 + ~1 border + 18).

Stage5B | Live | Adopted shell table: see **§2** (unchanged). Adopted still: `32+160+24+800+8+224+32=1280`.

### 5.2 positions body blocks

| block | width | height | pad L/R | left→right x | vs body track | label |
|-------|------:|-------:|--------:|-------------:|---------------|:-----:|
| page hero / intro | 762.0 | 172.8 | 0.0/0.0 | 315.0→1077.0 | L+19.0, R-19.0 | **FACT** |
| Basic notice panel | 762.0 | 87.6 | 18.0/18.0 | 315.0→1077.0 | L+19.0, R-19.0 | **FACT** |
| Prime section panel | 762.0 | 614.1 | 22.0/22.0 | 315.0→1077.0 | L+19.0, R-19.0 | **FACT** |
| Prime period-grid | 720.0 | 200.0 | 0.0/0.0 | 336.0→1056.0 | L+40.0, R-40.0 | **FACT** |
| Pick section panel | 762.0 | 749.4 | 22.0/22.0 | 315.0→1077.0 | L+19.0, R-19.0 | **FACT** |
| Pick period-grid | 720.0 | 200.0 | 0.0/0.0 | 336.0→1056.0 | L+40.0, R-40.0 | **FACT** |
| Pick preview grid | 682.0 | 264.0 | 0.0/0.0 | 355.0→1037.0 | L+59.0, R-59.0 | **FACT** |
| Badge section panel | 762.0 | 332.7 | 22.0/22.0 | 315.0→1077.0 | L+19.0, R-19.0 | **FACT** |
| Badge chips/cards grid | 716.0 | 118.4 | 0.0/0.0 | 338.0→1054.0 | L+42.0, R-42.0 | **FACT** |
| Badge chip/card (first) | 169.0 | 118.4 | 16.0/16.0 | 338.0→507.0 | L+42.0, R-589.0 | **FACT** |
| Apply-target panel | 762.0 | 310.9 | 22.0/22.0 | 315.0→1077.0 | L+19.0, R-19.0 | **FACT** |
| Order summary box | 762.0 | 620.8 | 22.0/22.0 | 315.0→1077.0 | L+19.0, R-19.0 | **FACT** |
| Primary CTA | 716.0 | 54.8 | 14.0/14.0 | 338.0→1054.0 | L+42.0, R-42.0 | **FACT** |
| CTA row | 716.0 | 54.8 | 0.0/0.0 | 338.0→1054.0 | L+42.0, R-42.0 | **FACT** |

Period cards: Prime **5** · Pick **5** · Badge chips **2**

| period card | width | height | pad L/R | left→right x | label |
|-------------|------:|-------:|--------:|-------------:|:-----:|
| Prime period card [1/5] | 137.6 | 200.0 | 12.0/12.0 | 336.0→473.6 | **FACT** |
| Prime period card [2/5] | 137.6 | 200.0 | 11.0/11.0 | 481.6→619.2 | **FACT** |
| Prime period card [3/5] | 137.6 | 200.0 | 12.0/12.0 | 627.2→764.8 | **FACT** |
| Prime period card [4/5] | 137.6 | 200.0 | 12.0/12.0 | 772.8→910.4 | **FACT** |
| Prime period card [5/5] | 137.6 | 200.0 | 12.0/12.0 | 918.4→1056.0 | **FACT** |
| Pick period card [1/5] | 137.6 | 200.0 | 12.0/12.0 | 336.0→473.6 | **FACT** |
| Pick period card [2/5] | 137.6 | 200.0 | 12.0/12.0 | 481.6→619.2 | **FACT** |
| Pick period card [3/5] | 137.6 | 200.0 | 12.0/12.0 | 627.2→764.8 | **FACT** |
| Pick period card [4/5] | 137.6 | 200.0 | 12.0/12.0 | 772.8→910.4 | **FACT** |
| Pick period card [5/5] | 137.6 | 200.0 | 12.0/12.0 | 918.4→1056.0 | **FACT** |

### 5.3 access body blocks

| block | width | height | pad L/R | left→right x | vs body track | label |
|-------|------:|-------:|--------:|-------------:|---------------|:-----:|
| hero/title | 762.0 | 98.4 | 0.0/0.0 | 315.0→1077.0 | L+19.0, R-19.0 | **FACT** |
| aux links row | 762.0 | 146.4 | 18.0/18.0 | 315.0→1077.0 | L+19.0, R-19.0 | **FACT** |
| apply profile panel | 762.0 | 215.3 | 22.0/22.0 | 315.0→1077.0 | L+19.0, R-19.0 | **FACT** |
| apply profile content | 716.0 | 74.4 | 0.0/0.0 | 338.0→1054.0 | L+42.0, R-42.0 | **FACT** |
| ticket cards section | 762.0 | 487.6 | 22.0/22.0 | 315.0→1077.0 | L+19.0, R-19.0 | **FACT** |
| ticket cards grid | 716.0 | 241.4 | 0.0/0.0 | 338.0→1054.0 | L+42.0, R-42.0 | **FACT** |
| pre-purchase confirm | 716.0 | 144.1 | 18.0/18.0 | 338.0→1054.0 | L+42.0, R-42.0 | **FACT** |
| order summary | 762.0 | 537.2 | 22.0/22.0 | 315.0→1077.0 | L+19.0, R-19.0 | **FACT** |
| Primary CTA | 716.0 | 54.8 | 14.0/14.0 | 338.0→1054.0 | L+42.0, R-42.0 | **FACT** |
| refund section | 762.0 | 78.1 | 18.0/18.0 | 315.0→1077.0 | L+19.0, R-19.0 | **FACT** |

Ticket cards count: **3** (1회 / 5회 / 10회)

| ticket card | width | height | pad L/R | left→right x | label |
|-------------|------:|-------:|--------:|-------------:|:-----:|
| ticket card [1/3] 1회 즉시권 | 229.3 | 241.4 | 16.0/16.0 | 338.0→567.3 | **FACT** |
| ticket card [2/3] 5회권 | 229.3 | 241.4 | 15.0/15.0 | 581.3→810.7 | **FACT** |
| ticket card [3/3] 10회권 | 229.3 | 241.4 | 16.0/16.0 | 824.7→1054.0 | **FACT** |

### 5.4 Key width summary

| key | px | label |
|-----|---:|:-----:|
| shell · shell | 1280.0 | **FACT** |
| shell · left nav | 160.0 | **FACT** |
| shell · nav→body gap | 24.0 | **FACT** |
| shell · body track | 800.0 | **FACT** |
| shell · body→rail gap | 8.0 | **FACT** |
| shell · rail | 224.0 | **FACT** |
| .page content / panel (typical) | 762 | **FACT** |
| Prime/Pick period card | 137.6 | **FACT** |
| ticket card (1/5/10) | 229.3 | **FACT** |
| Primary CTA | 716 | **FACT** |

Sharp shots: `after-sharp/*@2x.png` · COMPARE full-width: `after-sharp/COMPARE-*-before-after-1440@2x.png` (≥2000px wide).
