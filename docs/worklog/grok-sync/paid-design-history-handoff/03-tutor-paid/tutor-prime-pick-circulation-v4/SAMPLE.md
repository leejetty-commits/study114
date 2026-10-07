# SAMPLE.md

| Field | Value |
|---|---|
| **샘플명** | Tutor Prime/Pick circulation copy (plans-ui-v4) |
| **종류** | 노출상품 · 과외쌤 Prime/Pick (순환 카피) |
| **출처** | `plans-ui-v4/app.js (role=tutor) + positions.html + REPORT.md; excerpts/tutor-circulation-snippets.txt` |
| **판정** | **구현 기준** |
| **근거 정책** | D) Tutor Prime=3-per-page circulation NOT 3-slot stock; Tutor Pick=10/page; numeric pagination + 15min rotation |
| **보정 필요** | v4 shots folder is room-centric; verify tutor mode in browser via ?role=tutor. Occupancy/waitlist must stay hidden for tutor (REPORT + app.js). |
| **주의 메모** | No dedicated tutor screenshot in v4 shots/. Copy/logic in app.js is the implementation baseline. See 08 for conflicting early tutor slot/waitlist UI. |

## Contained files

See sibling `shots/`, `excerpts/`, and/or `docs/` in this folder. No `.chrome`, Cache, node_modules, or secrets included.
