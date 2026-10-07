# Stage 5B · Trend Boards 1·2·4 — REPORT

작성: 2026-09-08 KST (Asia/Seoul)  
범위: `/workspace/study114-ds/stage5b-trend-boards-124/` only  
성격: **정적 디자인 시안** · 운영 화면 아님 · 가상 데이터 · **최종 승인/v1.0 아님**

> Do **not** declare: Stage 5B complete · common design complete · ops parity · Cursor ready · v1.0.

---

## Facts (what exists in this pack)

| Artifact | Path |
|---|---|
| Index | `index.html` |
| Board 1 Header | `01-header-oneline.html` |
| Board 2 Community | `02-community-empty-feed.html` |
| Board 4 Support | `03-support-compact.html` |
| Tokens (copied spirit) | `tokens.css` · Primary `#266BC4` |
| Shared board CSS | `board.css` + `board-trend.css` |
| Fonts | `fonts/Pretendard-*.woff2` (local) |
| Shots @1440 | `shots/01-header-1440.png`, `02-community-1440.png`, `03-support-1440.png` |
| Zip | `../stage5b-trend-boards-124.zip` |

Shell axis reused (LAYOUT-AXIS): **1280 border-box · gutter 32 · gap 24 · Type B nav 220 / rail 300**.

Disclaimer (every page, Korean):  
`정적 디자인 시안 · 운영 화면 아님 · 가상 데이터 · Stage 5B 트렌드 보드 1·2·4 · 최종 승인/v1.0 아님`

---

## What changed (design intent → mockup)

### 1) Header — collapse 2-row util into avatar menu

| | BEFORE (static replica) | AFTER |
|---|---|---|
| Structure | Util row + GNB row | Single sticky bar ~56–64px |
| Right chrome | Inline util links + **관리자 콘솔** button | Message icon badge `3` + avatar chip `이종현 ▾` |
| Account IA | Scattered in util row | Dropdown: 이용안내 · 쪽지·후기함 · 최근열람 · 마이페이지 · 로그아웃 |
| Admin | Visible in consumer chrome | **Removed**; footnote: 관리자는 별도 진입 |
| IA | 홈 · 공부방찾기 · 과외쌤찾기 · 학생찾기 · 커뮤니티 · 고객센터 | Same; active pill on 홈 (board 01) |

### 2) Community — Empty / feed skeleton (not intro-only cards)

- Type B + **new header** from (1), 커뮤니티 active.
- Left boards nav: 공부방 / 과외쌤 / 학생·학부모 고민방 · 해결후기.
- Center: **slim 1-line dismissible intro** + primary **Empty** (`아직 고민글이 없어요` + Secondary `첫 고민 남기기`) + muted skeleton rows + optional 가상 example rows (Empty is primary).
- Slim right rail: 공지 1 + 관련 보드 links only.

### 4) Support — shorter hero + FAQ search

- Type B + new header, 고객센터 active.
- Hero **~120–160px** (title + 2 CTAs) — not tall photo banner.
- **FAQ search** prominent under hero (`btn--search` ≥72×40).
- Quick links · compact notice list · slim rail (안전과외 가이드 + 문의 CTA).

---

## Opinions / open (not claimed as locked)

- Avatar menu open-state on board 01 is a **static demo** for review; interaction not implemented.
- Empty vs seeded feed copy may need product tone pass.
- Support hero gradient is a mock stand-in for photography; final art TBD.
- Priority item **3** (not in this pack) remains out of scope.

---

## Explicit non-claims

- Not ops / GitHub / DB / API / routes / real member data.
- Not PR, deploy, or Stage 5B complete.
- Not declaring layout-axis re-verification beyond visual alignment with existing tokens.

---

## Capture notes

- Playwright true viewport **1440** width; screenshots full page into `shots/`.
- Fonts loaded locally (Pretendard woff2).
