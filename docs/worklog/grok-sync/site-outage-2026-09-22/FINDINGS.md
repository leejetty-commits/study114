# study114.net outage diagnosis — 2026-09-22 (KST)

Probe window: ~17:58–18:00 KST (Asia/Seoul). Probes from box (CF-Ray colo: IAD).

## Verdict

**Current status: UP (intermittent slow / occasional timeout), not hard-down.**

No Cloudflare 521/522/523/524/525/526/530 observed in this window. Apex HTTPS returned HTTP 200 on nearly all tries. One request to `/` timed out after 15s (0 bytes). Latency highly variable: ~0.2–10.8s.

**Primary latent cause (still true, matches 2026-09-21):** origin TLS certificate hostname mismatch for `study114.net` under Cloudflare **Full (strict)** → classic **525** risk. Site is reachable *now*, so CF SSL mode is likely **Full** (encrypt without hostname check) or **Flexible**, not Full (strict). Flipping to Full (strict) without fixing the origin cert would reproduce 525.

**Layer map:** DNS OK → CF edge TLS OK → origin TCP OK → **origin TLS SAN mismatch (study114.net)** → origin HTTP OK (when TLS accepted without name check) → app serves static preview HTML.

---

## Evidence by layer

### 1. DNS — OK, Cloudflare proxy
- A: `104.21.93.139`, `172.67.210.220` (Cloudflare)
- AAAA: `2606:4700:3033::6815:5d8b`, `2606:4700:3034::ac43:d2dc`
- NS: `marek.ns.cloudflare.com`, `rosalie.ns.cloudflare.com`
- No apex CNAME (proxied A/AAAA)
- Log: `01-dns.txt`

### 2. HTTPS via Cloudflare — UP, slow spikes
5× `/` retries (17:58–17:59 KST): all **HTTP/2 200**, `server: cloudflare`, `cf-cache-status: DYNAMIC`
| try | http | time_total (s) | remote_ip | cf-ray |
|-----|------|----------------|-----------|--------|
| 1 | 200 | 6.79 | 172.67.210.220 | a3f01c1c68d8d633-IAD |
| 2 | 200 | 10.85 | 104.21.93.139 | a3f01c46eaffd633-IAD |
| 3 | 200 | 1.53 | 172.67.210.220 | a3f01c8ada15d633-IAD |
| 4 | 200 | 0.48 | 104.21.93.139 | a3f01c9489ffd633-IAD |
| 5 | 200 | 0.47 | 172.67.210.220 | a3f01c979d1fd633-IAD |

Extended 10×: all 200; times 0.43–10.77s. Parallel burst: 4 fast + one 8.57s.
App-path probe: one `/` **timeout 15s** (`http=000`).

Paths:
- `/` → 200, title `우동공과 — 메인 화면 프리뷰` (1073 bytes)
- `/index.php` → **404**, title `페이지를 표시할 수 없습니다.`
- `/xe/`, many other paths → same 1073-byte preview (SPA/static fallback)

Logs: `02-cf-https.txt`, `02b-paths.txt`, `06-stability.txt`, `08-app-paths.txt`, `cf-root-*`

### 3. Edge TLS — OK
- CN=`study114.net`, SAN=`study114.net`, `*.study114.net`
- Issuer: Google Trust Services WE1
- Valid: Aug 17 2026 → Nov 15 2026 GMT
- Verify return code: 0 (ok); TLSv1.3
- Log: `03-edge-tls.txt`, `03-edge-tls-full.txt`

### 4. Origin direct — TCP/HTTP up; TLS name mismatch persists
- Origin: `112.175.184.80` (`study114.dothome.co.kr` resolves to same)
- TCP 443 OPEN, TCP 80 OPEN
- Both SNI `study114.net` and `study114.dothome.co.kr` present **same** cert:
  - CN=`*.dothome.co.kr`
  - SAN=`*.dothome.co.kr`, `dothome.co.kr` only (GlobalSign)
  - Valid May 28 2026 → Dec 13 2026 GMT
- `curl --resolve study114.net:443:112.175.184.80` **with verify**:  
  `SSL: no alternative certificate subject name matches target hostname 'study114.net'` (ssl_verify=1, http_code=000)
- Same with `-k`: **HTTP 200**, Apache, same preview HTML
- Host `study114.dothome.co.kr`: **301** → `https://study114.net/`

Logs: `04-origin.txt`, `04-origin-tls-sni-*.txt`, `04-origin-http-host-*`

### 5. CF error codes vs origin
| CF code | Meaning | Seen now? |
|---------|---------|-----------|
| 521 | origin down | No — origin TCP/HTTP up |
| 522 | connection timeout | No — but high TTFB / one client timeout |
| 523 | origin unreachable | No |
| 524 | origin timeout | Not returned by CF; slow origin could cause this under load |
| **525** | SSL handshake failed | **Not seen now**; **still expected if Full (strict)** given SAN mismatch |
| 526 | invalid SSL cert | Not seen (Full strict would usually be 525 for name mismatch) |
| 530 | various | No |

### 6. Redirect behaviour
- `http://study114.net/` → **200** (no HTTPS redirect)
- `http://www.study114.net/` → **301** → `https://study114.net/`
- `https://www.study114.net/` → **301** → `https://study114.net/`
- Log: `05-redirect.txt`

---

## Relation to prior diagnosis (2026-09-21)

**Still true:** origin cert is only `*.dothome.co.kr` / `dothome.co.kr`. SNI `study114.net` does not match → Full (strict) hostname check fails (curl reproduce). Edge cert still correct for study114.net.

**Changed / this window:** site is serving 200 via CF (IAD). No active 525. Intermittent **slowness/timeouts** more visible than hard TLS errors from this vantage.

---

## Recommended fix steps (operator; no secrets)

1. **Fix origin certificate for Full (strict)** (preferred):
   - Install a cert whose SAN includes `study114.net` and ideally `www.study114.net` on dothome, **or**
   - Use a **Cloudflare Origin CA** certificate for `study114.net` on the origin and set SSL/TLS mode to **Full (strict)**.
2. **Interim (if Full strict is enabled and causing 525):** set Cloudflare SSL/TLS to **Full** (not Flexible) until origin cert is fixed — encrypts CF↔origin but skips hostname match. Prefer fixing the cert rather than staying on Full long-term.
3. **Alternative CF config:** if the panel allows custom origin host/SNI, point origin connection SNI/host to `study114.dothome.co.kr` (cert matches) while public hostname stays `study114.net` — only if dothome vhost serves the right site for that Host (today dothome Host redirects to study114.net).
4. **Investigate origin performance:** TTFB spikes to 5–11s and occasional 15s client timeout; check dothome resource limits, PHP/Apache, and CF origin response times / 524 analytics.
5. **Optional UX:** enable “Always Use HTTPS” so `http://study114.net` redirects to HTTPS (www already redirects).
6. **App note:** `/` serves a static/UI preview (“우동공과 — 메인 화면 프리뷰”); `/index.php` is 404. Confirm this is intended vs missing XE/CMS deploy.

## Artifact paths

All under `/workspace/study114-ds/site-outage-2026-09-22/`:
- `FINDINGS.md` (this file)
- `01-dns.txt`
- `02-cf-https.txt`, `02b-paths.txt`
- `03-edge-tls.txt`, `03-edge-tls-full.txt`
- `04-origin.txt`, `04-origin-tls-sni-study114.txt`, `04-origin-tls-sni-dothome.txt`, `04-origin-http-host-*`
- `05-redirect.txt`, `06-stability.txt`, `07-compare.txt`, `08-app-paths.txt`, `09-parallel.txt`
- `cf-root-body-try*.html`, `cf-root-headers-try*.txt`, `cf-root-current.html`
- `path-*.body`, `probe-*.body`
