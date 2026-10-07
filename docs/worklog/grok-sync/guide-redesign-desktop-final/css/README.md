# CSS map · guide-redesign-desktop-final

Boards load three files (from `html/`):

| File | Role |
|------|------|
| `tokens.css` | **Tokens** — Pretendard (`fonts/`), color, type scale, spacing, radii, shadows |
| `board.css` | **Layout shell** — disclaimer, GNB, Type B left-nav shell, footer, buttons |
| `guide.css` | **Guide components** — hero, situation cards, steps, chips, tabs, Do/Don't, help |

## tokens.css
- `@font-face` → `fonts/*.woff2`
- `--uds-*` color / ink / primary `#266BC4`
- font-size / line-height / tracking / space / radius tokens

## board.css (layout)
- `.board-disclaimer` — status banner
- `.hdr` — GNB sticky
- `.layout-shell--b2` — body + left nav (no right rail)
- `.layout-nav` — 5-menu guide nav
- `.btn` / `.btn--primary|secondary|ghost`
- `.layout-footer`

## guide.css (components + page)
- **Hero:** `.guide-hero`, `.guide-eyebrow`, banner paragraphs, art slot
- **Cards:** accent surfaces, hub **situation cards** (3-entry)
- **Aux links:** hub 2 text links (안전이용 / 고객센터)
- **CTA row:** slim bottom actions
- **Steps:** numbered + small SVG beside title
- **Chips:** 비교 / 찜 / 쪽지
- **Role tabs + checklist:** 등록·공개
- **Do/Don't + help block:** 안전이용 (운영문의 강조)
- Mobile select rules kept for completeness; this package ships **desktop shots only**

Keep files whole — do not split for production until ops handoff.
