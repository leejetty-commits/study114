# study114.net guest-path latency — 2026-09-22 (KST)

Probe window: ~18:25–18:30 Asia/Seoul. Box colo: Cloudflare IAD.  
Origin: `112.175.184.80` (dothome) via `Host: study114.net` + `-k`.  
No Cloudflare dashboard or code changes.

## Exact guest URLs (discovered)

| Nav label | Document URL | Hash / entry | Notes |
|---|---|---|---|
| 유료상품 | `https://study114.net/` (same shell as `/plans`) | `#/plans` | Main SPA shell ~1073 B; title “우동공과 — 메인 화면 프리뷰” |
| 공부방상세정보 | `https://study114.net/register/room/` | `#/register/basic` | **Separate SPA** ~1137 B; title “우동공과 — 공부방 등록 프리뷰” |
| 과외쌤상세등록 | `https://study114.net/register/tutor/` | `#/register/basic` | Separate SPA ~1140 B |

Nav hrefs confirmed from prior live measure (`live-mypage-home.json`) and JS strings (`공부방상세정보`, guest copy: “공부방 등록은 로그인 후 진행합니다…”).

**Critical:** leaving `#/plans` for 공부방상세정보 is a **full document navigation** to another SPA entry (`/register/room/`), not an in-app hash change. Browser must load new HTML + JS + CSS before the guest notice paints.

### Critical assets

| Entry | JS | CSS |
|---|---|---|
| Main / plans | `/assets/index-zG8GDBsI.js` **1,287,716 B** | `/assets/index-DWYsr3Bt.css` **501,184 B** |
| Room register | `/register/room/assets/index-B3Z4U1zu.js` **181,338 B** | `/register/room/assets/index-CT34rhCE.css` **113,714 B** |
| Tutor register | `/register/tutor/assets/index-DzqL3nGD.js` **124,908 B** | `/register/tutor/assets/index-Cdhs033d.css` |

Hashed assets: `cache-control: max-age=14400`, `cf-cache-status` HIT when warm / MISS when cold.  
HTML shells: `cache-control: no-cache, no-store, must-revalidate`, **`cf-cache-status: DYNAMIC`** (always origin).

### Guest APIs (room path)

| Endpoint | Guest result | Role |
|---|---|---|
| `/api/auth/me.php` | **200** `{"ok":true,"authenticated":false}` | Session probe |
| `/api/registrations/study-rooms.php` | **401** | Auth-gated list |
| `/api/study-room/register.php` | **405** on GET | Write endpoint |
| `/api/study-room/public.php` | **400** without params | Public hydrate |
| `/api/auth/regions.php` | **200** ~9 KB JSON | Regions |
| `/api/paid/catalog.php` | **200** ~12.6 KB | Paid catalog (guest OK) |

In this window APIs answered in **~0.21–0.62 s** via CF; **no 30 s API hang** observed.

---

## Timings summary (seconds)

### A) Early spike window (~18:25–18:28) — 7 s / 30 s class **reproduced**

| Target | n | TTFB med | TTFB p95 | TTFB max | Total max | Notes |
|---|---:|---:|---:|---:|---:|---|
| CF `GET /` HTML | 8+1 | **1.19** | **9.01** | **9.44** | 9.44 | 1073 B; DNS/TLS ~20 ms; delay = TTFB |
| CF `GET /` (single earlier) | 1 | 4.67 | — | 4.67 | 4.67 | First probe |
| CF main JS | 1 | **11.54** | — | 11.54 | **45.00 timeout** | Only **103,903 / 1,287,716** bytes received |
| CF main CSS | 1 | 4.68 | — | 4.68 | **30.00 timeout** | Only **95,919 / 501,184** bytes |

→ **~7 s guest wait is reproducible as origin TTFB** on the tiny HTML shell.  
→ **30+ s “still loading” matches stalled transfer of SPA JS/CSS** when origin/CF→origin path is congested (not a stuck XHR in this capture).

### B) Recovered window (~18:28–18:30)

| Target | n | TTFB med | TTFB p95 | TTFB max | Total med |
|---|---:|---:|---:|---:|---:|
| CF `/register/room/` | 6 | 0.22 | 0.50 | 0.58 | 0.22 |
| CF `/` | 6 | 0.23 | 0.51 | 0.60 | 0.23 |
| CF `/register/tutor/` | 6+8 | ~0.22 | ~2.0 (early in block) | 2.19 | ~0.22 |
| CF `/plans` | 5 | 0.22 | 0.23 | 0.23 | 0.22 |
| Origin `/` | 8 | 0.77 | 1.17 | 1.37 | 0.77 |
| Origin `/register/room/` | 5 | 0.78 | 0.81 | 0.81 | 0.78 |
| Origin room JS | 5 | 0.78 | 0.81 | 0.81 | 1.30 |
| Origin main JS | 5+5 | ~0.77 | ~0.80 | 0.81 | ~1.79–1.96 |
| CF room JS cache-bust MISS | 5 | 0.61 | 0.66 | 0.67 | 1.18 |
| CF main JS cache-bust MISS | 3 | 0.63 | 0.64 | 0.64 | 1.79 |
| CF room JS HIT | 2 | 0.03 | — | 0.03 | 0.03 |
| Parallel burst HTML×15 | 15 | 0.63 | 0.67 | 0.70 | 0.63 |
| Parallel burst room JS×15 | 15 | 0.63 | 0.67 | 0.67 | 1.21 (max total 2.45) |
| CF guest APIs | 5 each | ~0.22–0.37 | <0.62 | <0.62 | — |

Parallel burst did **not** re-trigger 30 s hangs in the recovered window.

---

## Is delay TTFB vs transfer vs client SPA?

1. **HTML shell:** Almost pure **origin TTFB**. Body is ~1.1 KB; `time_total ≈ time_starttransfer`. Headers always `DYNAMIC` + `no-store` → Cloudflare cannot hide origin spikes.
2. **SPA boot:** Guest notice is **client-rendered** after JS+CSS. When origin is bad, **asset transfer stalls** dominate (observed: 45 s timeout mid-download of 1.2 MB main JS). When CF cache is HIT, assets are ~30–50 ms.
3. **APIs:** Guest path APIs are **not** the current 30 s hang. `/api/auth/me.php` returns immediately for guests; registrations endpoints 401 quickly. Hang is “page never paints,” not “paint then wait forever on one XHR.”
4. **1073 B apex:** That **is** the real guest SPA entry (Vite shell), not a wrong host. Full UI lives in JS. Separate real entry for 공부방상세정보: `/register/room/`.

## Is ~7 s reproducible now?

**Yes, intermittently.** In the first multi-sample of `/`, median TTFB ~1.2 s but **p95 ~9.0 s / max 9.4 s** — matches user ~7 s reports. Later samples calmed to ~0.2–0.6 s. Same intermittency as earlier outage notes (0.4–11 s).

## Is 30 s hang reproducible now?

**Partially / intermittently.** Exactly at user report time we captured **main JS TTFB 11.5 s then 45 s timeout with incomplete body** — that is a 30+ s “never opens” class failure. After ~18:28, cold MISSes completed in ~1–2 s and APIs were fine. So: **hang is real but intermittent origin delivery**, not a permanent stuck API.

---

## Hosting migration verdict

**Recommendation: treat origin (dothome shared hosting) as the bottleneck; plan migration or capacity upgrade, but do the cheap CF/static fixes in parallel first — do not expect “optimize PHP alone” to fix HTML DYNAMIC TTFB spikes.**

Evidence: (1) DNS/TLS to CF edge are fine (~20 ms); delay is after edge waits on origin. (2) Same tiny HTML is slow only when origin TTFB spikes. (3) Large assets time out mid-stream from origin path, then are instant on CF HIT. (4) Guest APIs are already fast when origin is healthy — app logic is not the 30 s symptom.  

**Near-term (before/while migrating):** keep hashed `/assets/*` and `/register/*/assets/*` warm on CF (already `max-age=14400`); avoid `no-store` on immutable hashed files (already OK); consider allowing short edge cache or `stale-while-revalidate` on SPA HTML shells if product-acceptable; check dothome process/CPU limits during spikes.  

**Migration:** Warranted **if** spikes like 8–11 s HTML TTFB and multi-tens-of-seconds asset stalls continue daily — shared origin explains intermittency better than Cloudflare or SSL. Not “migrate in the next hour as sole action,” but **yes, hosting change is justified by evidence** once ops confirms dothome cannot guarantee stable TTFB.

### One-paragraph facts (Korean-friendly)

유료상품은 `study114.net/#/plans`(메인 SPA), 공부방상세정보는 **다른 진입점** `study114.net/register/room/#/register/basic`입니다. HTML은 ~1KB뿐인데도 Cloudflare가 항상 origin을 치는 DYNAMIC이라, 오늘 18:27경 TTFB가 **최대 9.4초**(중간값 ~1.2초)까지 튀었고, 메인 JS(1.2MB)는 **TTFB 11.5초 후 45초 타임아웃(일부만 수신)**이 관측되었습니다. 게스트 API(`/api/auth/me.php` 등)는 보통 0.2–0.6초로 30초 행의 원인이 아닙니다. **지연은 앱 로직보다 dothome origin 응답/전송 불안정**이며, CF 캐시가 따뜻하면 자산은 즉시 열립니다. **호스팅 이전(또는 상위 플랜)을 추진할 근거는 충분**하고, 동시에 정적 자산 CF HIT 유지·HTML no-store 완화가 체감에 바로 도움이 됩니다.

## Artifacts

`/workspace/study114-ds/site-slow-2026-09-22/`  
`01-document-timings.txt` `02-asset-timings.txt` `03-doc-api-origin-timings.txt` `04-cachebust-timings.txt` `05-guest-api-timings.txt` `06-parallel-burst.txt`  
shells: `homepage.body` `register-tutor.body` `quick-_register_room_.body`  
bundles: `main-index-full.js` `room-index.js`  
`FINDINGS.md` (this file)
