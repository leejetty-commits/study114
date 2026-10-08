# NOTES — promo + 쪽지설정 UDX static mocks

작성: 2026-09-22 (Asia/Seoul)  
상태: **정적 디자인 시안 · 운영 아님 · 최종 승인 아님**  
신규 디자인 정책 없음. 기존 UDX / P20-05 / EXTRACT 잠금만 사용.

## Changelog

### v1.7 (2026-09-22)
- **프로모 page H1 weight only** (inquiries untouched): `.page-title` `font-weight` **700 → 600** (Pretendard 600). Size 22, Soft Primary plate `#EAF2FC`, text/mark `#266BC4`, border `#C5D9F2` unchanged from v1.6.
- Title bumped to v1.7 · recaptured promo shots · `promo-inquiries-udx-v1.7.zip` + sha256

### v1.6 (2026-09-22)
- **프로모 page H1 tone-down + size step** (inquiries untouched):
  - **Font:** UDX-EXTRACT FS-6 **28** is the locked page-title size; per user feedback stepped down one ladder rung to FS-5 **`22`** (`var(--fs-22)`), weight 700 kept. (UDX also allows mobile page-title 28→22.)
  - **Plate tone ladder** (page H1 only; other section plates stay warm `#F6F1E8`):
    - Loud (v1.5): fill `#266BC4` / text white / border `#1F5BA8` / white mark
    - Step −1: mid wash (skipped)
    - **Step −2 (applied):** Soft Primary fill `#EAF2FC` (STD-001 Soft) + text `#266BC4` + border `#C5D9F2` + mark `#266BC4` (Primary accent bar restored)
- Title bumped to v1.6
- Recaptured promo Playwright 1440×900 + full-page
- Repacked `promo-inquiries-udx-v1.6.zip` + sha256 sidecar

### v1.5 (2026-09-22)
- **프로모 high-contrast H1 + proximity break + strip column align** (inquiries untouched):
  - **Page H1 plate only** (「공부방 홍보 랜딩」): Primary blue fill `#266BC4`, text `#FFFFFF`, border `#1F5BA8` (Primary Hover). `.page-title__mark` → thin white bar (`#FFFFFF` @ 0.9 opacity). Other section title plates stay warm `#F6F1E8` / `#E6DFD4`.
  - **Proximity body break**: line-break before `과외`; `먼저 보고 필요한 조건부터` stays on one line (no comma between 보고 / 필요한).
  - **Criteria strip**: same grid as `.criteria-grid` (`repeat(3, 1fr)` + `gap: var(--s-2)`); full width. Each `.criteria-strip__item` is `width: calc(100% - 24px); margin-left: auto; margin-right: 0` so **per-column right edges match** the card above; text left-aligned with padding. Removes v1.4 whole-strip left inset.
- Title bumped to v1.5
- Recaptured promo Playwright 1440×900 + full-page
- Repacked `promo-inquiries-udx-v1.5.zip` + sha256 sidecar

### v1.4 (2026-09-22)
- **프로모 copy + layout polish** (inquiries HTML/CSS untouched; packaged unchanged):
  - **Copy (Korean):**
    - Hero lead: line-break before last sentence → `등록도 가볍게 시작해 보세요.`
    - Proximity body: break after `과외 정보를 먼저 보고,` · ending `살펴보세요.`
    - Start-band: `우리동네 학부모님에게` (붙여쓰기 + 님)
    - All remaining `우리 동네` → `우리동네` (audience · trust)
    - Audience badge `학생/학부모` · H3 `동네 안에서 더 빨리 찾아보세요`
  - **Page H1 plate only** (「공부방 홍보 랜딩」): deeper ivory fill `#EDE4D8` + border `#D9CEBF` (warm/paid canvas family, darker than Paid Canvas `#F6F1E8`). Other section title plates stay `#F6F1E8` / `#E6DFD4`. Primary left mark kept.
  - **Proximity bullets** (`.proximity-list`): `padding-left: calc(var(--s-3) + 4px)` so bullet column aligns with H2 text start inside `.promo-section__head--inset` (same inset as head content past the 4px mark).
  - **Criteria strip** (위치/과목/정보 — not the 3 big cards): `width: calc(100% - 48px); margin-left: auto; margin-right: 0` → left inset 48px, right edge flush with `.criteria-grid`. **Text-align: left** with comfortable horizontal padding inside each strip item (center felt floaty; right-align awkward for short Korean labels; left + inset matches UDX card body).
- Title bumped to v1.4
- Recaptured promo Playwright 1440×900 + full-page
- Repacked `promo-inquiries-udx-v1.4.zip` + sha256 sidecar

### v1.3 (2026-09-22)
- **프로모 visual polish only** (no content cuts; inquiries unchanged; accent bars/marks kept):
  - Title plates (page H1 · section heads · hero copy · proximity inset): faint **warm ivory** fill — Paid Canvas `#F6F1E8` + Paid Line `#E6DFD4`; inset uses Paid Soft `#FFF7E6` (replaces Soft blue `#EAF2FC` plate so the screen is not “almost all blue”)
  - Primary accent bars/underlines/marks unchanged (`#266BC4`)
  - Closing CTA: lower intensity — Soft Primary band `#EAF2FC` + ink `#1C1917` / muted `#4B5563` text (not full Primary flood); buttons → Primary + Secondary (readable on soft band)
- Recaptured promo Playwright 1440×900 + full-page
- Repacked `promo-inquiries-udx-v1.3.zip` + sha256 sidecar

### v1.2 (2026-09-22)
- **프로모 title treatment only** (no content cuts; v1.1 IA/maps/copy kept; inquiries unchanged):
  - Section heads: soft **surface plate** (white · r12 · 1px line · pad 16–24) behind H2+lead; proximity inset uses Soft `#EAF2FC` band inside card
  - Left **4px Primary** accent bar on left-aligned title blocks; centered heads use short **top Primary mark** (40×3)
  - Short eyebrows/badges above long H2s: `동네 탐색` · `비교 기준` · `대상` · `이용 이유` (start keeps `등록 안내`)
  - Hero: soft white plate around copy + short Primary underline under H2; ink H2 (not Primary flood)
  - Page H1 plate + left Primary mark; ink titles throughout (accents support hierarchy)
  - One Primary CTA per band unchanged
- Recaptured promo Playwright 1440×900 + full-page
- Repacked `promo-inquiries-udx-v1.2.zip` + sha256 sidecar

### v1.1 (2026-09-22)
- **쪽지설정**: Bottom Basic sample wrapped in stronger `sample-block` surface (solid border · padding · title inside block). Kept `data-locked-set="basic-msg-preview-pair"` as **one** image unit. Updated receiving + paused + `inquiries.css`.
- **프로모 `#/promo/study-room`**: Restored fuller live IA — page H1 `공부방 홍보 랜딩`, hero map+cards, **proximity map-left + bullets-right**, longer criteria H2 `막연히 찾는 것이 아니라, 필요한 기준으로 비교합니다`, quiet `등록 안내` + long beginner headline, form CTA `기본 정보부터 가볍게 시작`, audience **과외쌤** (fixed from 운영 담당), 4 trust reasons closer to live, closing CTA + rail, GNB detail links. No new policy; UDX kept (Pretendard ladder, Primary `#266BC4`, one Primary CTA/band, no card drop-shadow).
- Recaptured Playwright 1440×900 + full-page for all 3 HTML.
- Repacked `promo-inquiries-udx-v1.1.zip` + sha256 sidecar.

### v1.0
- Initial UDX static mocks for promo + 쪽지설정.

## Deliverables

| Path | Role |
|------|------|
| `html/promo-study-room-v1.html` | Type A 홍보 · Quiet Rails · Primary CTA 밴드당 1 · maps restored |
| `html/inquiries-receiving-v1.html` | 쪽지 받는 중 · 우측 사유 슬롯 비움 · sample block |
| `html/inquiries-paused-v1.html` | 쪽지 안받음 · 우측 「안받는 이유」 · sample block |
| `css/tokens.css` | UDX tokens (EXTRACT 우선) |
| `css/promo.css` / `css/inquiries.css` | page CSS |
| `assets/basic-preview-set-locked.png` | **잠금 세트** live 크롭 (원·캡션·카드 2장 일체) |
| `assets/hero-map.png` / `assets/promo-proximity-crop.png` | live-cropped map plates |
| `shots/*.png` | Playwright 1440 + full-page |
| `COPY.md` | 카피 목록 |

## UDX compliance (citations = 기존 문서에 이미 존재)

| Rule | Source | Applied |
|------|--------|---------|
| Pretendard only · sizes 12/14/16/18/22/28/36 | `TOKENS.md` §2 · `UDX-EXTRACT.md` §1 | tokens + all type |
| Primary `#266BC4` | `TOKENS.md` §1 · EXTRACT §2 | `--uds-primary` |
| Hover `#1F5BA8` Soft `#EAF2FC` | EXTRACT / Notion STD-001 | tokens |
| Card r12 · ctl r8 · badge r4 · no card drop shadow | TOKENS §4 · EXTRACT §3–4 | `.card` / `.btn` / `.badge` |
| Button h40 · Secondary white+blue border | `UDX-STD-001-Button.md` | `.btn` |
| One Primary CTA per decision area | TOKENS §3 · EXTRACT §4/§7 | promo bands · save row |
| Type A body 892 + rail 300 within 1280 | EXTRACT §5 | promo shell |
| Type B mypage tabs | EXTRACT §5 · live ref | `reg-tabs` |
| 쪽지 open / paused / capacity_full only | P20-05 · EXTRACT §5.B | radios + 잠시 쉼 / 정원 마감 |
| Annotation = 12px caption | EXTRACT §6 | locked-set captions (in crop) |
| Quiet Rails / no ad-board | EXTRACT §7 (UDX-M01/50) | promo rail · inq rail |

## Promo vs live (v1.1)

| Live | Mock (v1.1) |
|------|-------------|
| Page title `공부방 홍보 랜딩` + hero | Restored |
| Hero map + floating cards | Cropped live plate in hero visual |
| Proximity map-left + bullets-right | **Restored** (was text-only in v1) |
| Long criteria H2 | Restored live-like wording |
| PRO-TIP shout | Quiet `badge--muted` `등록 안내` |
| Long beginner registration headline + form | Restored; form CTA `기본 정보부터 가볍게 시작` |
| Audience 학부모/학생 · 원장 · 과외쌤 | Restored (fixed 운영 담당 → 과외쌤) |
| 4 trust reasons | Live-like wording (비교 중심 · 등록 부담↓ · 생활형 지역 플랫폼) |
| Competing Primary CTAs | Still **one** Primary per band (UDX) |
| Card drop shadows | Still none (UDX) |

## Inquiries vs live

| Live | Mock |
|------|------|
| 안받는 이유 **below** radios | **Right column** when 안받음; empty dashed slot when 받는 중 |
| BASIC samples + circles + captions | **Single locked image** inside stronger `sample-block` surface — **do not split** |

### Cursor implementation notes (안받음 right panel)

1. Toggle `쪽지 받는 중` | `쪽지 안받음` (static boards today; wire as radios).
2. When **안받음**: show `.reason-panel` in the **right** grid column (`.edit-grid--with-reasons`).
3. When **받는 중**: hide reason panel; show `.reason-slot-empty` (or collapse column).
4. Reasons locked: **잠시 쉼** (`paused`) · **정원 마감** (`capacity_full`) only — no new policy.
5. Save updates 쪽지 state (+ reason if off) only — not 공개/유료.
6. **`[data-locked-set="basic-msg-preview-pair"]`**: move as one DOM unit; never crop apart circles/arrows/captions from the two cards.

## Screenshots

Playwright desktop **1440×900** and **full page** → `shots/`.

## Package

- ZIP: `/workspace/study114-ds/promo-inquiries-2026-09-22/promo-inquiries-udx-v1.7.zip`
- SHA256: `promo-inquiries-udx-v1.7.zip.sha256` sidecar
- Locked Basic set: `assets/basic-preview-set-locked.png`

## 「기존 문서에 이미 존재」 citations

1. Type ladder 12/14/16/18/22/28/36 + Pretendard — `stage5a-blue-system-final-candidate/TOKENS.md` §2; `UDX-EXTRACT.md` §1
2. Primary `#266BC4`, Ink `#1C1917`, Muted `#4B5563`, BG `#F7F8FA`, Line `#E5E7EB` — TOKENS.md §1; UDX-EXTRACT.md §2
3. Card r12, control r8, no card drop shadow, one Primary CTA per decision area — TOKENS.md §3–4; UDX-EXTRACT.md §3–4
4. Button h40 / Secondary white+blue border — `stage5b-design-standard-v01/ssot/UDX-STD-001-Button.md`
5. Type A 892+300 / Type B mypage — UDX-EXTRACT.md §5
6. 쪽지 open / paused / capacity_full + CTA mapping — UDX-EXTRACT.md §5.B; Notion P20-05
7. Badge r4 h20–22 max 2; Quiet Rails — UDX-EXTRACT.md §4 / §7
8. Annotation 12px — UDX-EXTRACT.md §6
