# REPORT — community-support-visual-refresh

**Date:** 2026-09-17 (KST)  
**Pack:** `/workspace/study114-ds/community-support-visual-refresh/`  
**Type:** 정적 HTML 디자인 시안 only · 운영 화면 아님 · 최종 승인/v1.0 아님

---

## 1. Live inventory summary (사실 · BEFORE)

Source explore: `live-explore-community-support-2026-09-17/` (2026-09-17).

### Community (guest)
| Route | Observation |
|-------|-------------|
| `#/community/director\|tutor\|parent\|solved` | 4 boards |
| Guest | Login wall: “로그인하면 역할에 맞는 글을 볼 수 있어요” |
| Visual | Sparse white/gray, thin borders, **no imagery** |
| Chrome | Right rail: notices / HOT / actions |

### Support
| Route | Observation |
|-------|-------------|
| `#/support` | Dark photo hero + abstract copy; FAQ/문의 CTAs; notice table; quick links; rail |
| `#/support/faq` | 6 accordion FAQs (guest visible) |
| `#/support/notice` | 2 expandable notices |
| `#/support/contact` | Login wall |
| `#/support/policies` | Tabs: 약관·개인정보·플랫폼·신뢰정보·안전과외·학생정보·신고·제재·계정연락처 |
| `#/support/library` | Tabs + 2 PDF cards “준비 중” |

Related (reference tone only, not copied): `#/guide/saved-contact`, `#/guide/safety`.

BEFORE thumbs copied to `shots/before/`.

---

## 2. BEFORE → AFTER intent (제안)

| Area | BEFORE (live) | AFTER (proposal) |
|------|---------------|------------------|
| Density | Flat sparse void | Pattern bands, brackets, blobs, arcs, icon tiles, soft gradients |
| Community hub | Direct board URLs, little landing sell | `c01` hub with 4 illustrated entry cards + verb copy |
| Guest wall | Text-only login message | Illustrated wall + ghost preview rows + steps (still role-gated; **not** claiming public posts) |
| Feed | Sparse list feel | Post cards, avatar shapes, chips, dividers, tip rail |
| Support hero | Dark photo slab dominant | Layered blue geometric hero + shortened “필요한 답을 빠르게” |
| Quick links | Text-ish | Icon tiles 48–64 with soft fills |
| Notices | Table rows | Left accent bars |
| Contact | Bare login wall | Illustration + 로그인→작성→내역 steps |
| Policies | Tabs + legal | Tab pills + ornamented doc cards · **placeholder labels only** |
| Library | Plain PDF cards | Cover-like geometric art · keep “준비 중” |

Design tokens: Primary `#266BC4` from Stage 5A; ink/muted/bg/surface/line from stage5b `tokens.css` (copied). Shell 1280 / gutter 32 / gap 24 / nav 220 / rail 300. GNB locked order retained.

---

## 3. Page list

| File | Role |
|------|------|
| `index.html` | Gallery + BEFORE thumbs |
| `c01-hub.html` | Community hub |
| `c02-board-guest.html` | Guest board login wall |
| `c03-board-feed.html` | Logged-in aspirational feed |
| `c04-post-detail.html` | Post detail + replies |
| `c05-solved.html` | 해결후기 stories |
| `s01-home.html` | Support home |
| `s02-faq.html` | FAQ accordion |
| `s03-notice.html` | Notice list + expanded |
| `s04-contact-guest.html` | Contact login wall |
| `s05-policies.html` | Policy hub |
| `s06-library.html` | Library PDF cards |
| Shared | `tokens.css`, `board.css`, `visual-rich.css`, `fonts/`, `assets/*.svg` |
| Shots | `shots/before/*`, `shots/after/*` (Playwright 1440 full-page) |

---

## 4. Opinions (not locked)

See `OPINION.md`. Rank/priority suggestions are **opinion only** — do not treat as Stage 5B lock or product policy.

---

## 5. Explicit non-claims

- Not production / not ops deployment.
- No GitHub, DB, API, or Notion changes.
- Did **not** invent product policy, login/role rules beyond reflecting live role-gated truth as UI proposal.
- Did **not** invent legal text (policy cards = short placeholders).
- Did **not** invent fake trust metrics.
- Did **not** change “준비 중” library honesty.
- Virtual samples marked `가상`.
- Not final approval / not design manual v1.0.
- Guide pages referenced for tone only; ops not copied.

---

## 6. Capture

Playwright viewport width **1440**, full-page PNG → `shots/after/{page}.png`.


---

## 7. Packaging

- Zip: `/workspace/study114-ds/community-support-visual-refresh.zip` (9.17 MB)
- SHA-256 file: `/workspace/study114-ds/community-support-visual-refresh.zip.sha256`
- **Authoritative SHA-256:** `5f6fe188f71c85bfb786c555089b78fe601ccba6868c9035fdb1a868bbbf3fba` (external `.sha256` is SoT)
- Format: two-space `sha256sum`
- Split: not required
- CopyFromBox target: machine `6aa2b772-d71e-4241-bcd4-3c985bf73991` → `C:\Users\jetty\`
