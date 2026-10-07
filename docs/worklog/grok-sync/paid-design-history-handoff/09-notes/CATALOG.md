# CATALOG — full classification table

| ID | Folder | 샘플명 | 판정 | Primary source | Policy anchors |
|---|---|---|---|---|---|
| R1 | `02-study-room-paid/room-prime-3slot-waitlist-v4` | Room Prime 3-slot + waitlist | **구현 기준** | plans-ui-v4 shots 01–04 | C |
| R2 | `02-study-room-paid/room-pick-5x2-v4` | Room Pick 5×2 preview | **구현 기준** | plans-ui-v4 shot 05 | C |
| T1 | `03-tutor-paid/tutor-prime-pick-circulation-v4` | Tutor Prime/Pick circulation | **구현 기준** | plans-ui-v4 app.js role=tutor | D |
| E1 | `04-exposure-products/stage5b-plans-card-sample` | 1 Prime + 1 Pick + Basic notice | **구현 기준** | stage5b plans-card-sample | B, H, I |
| E2 | `04-exposure-products/v4-positions-independent-store` | Independent positions store | **구현 기준** | plans-ui-v4 positions | A, H |
| E3 | `04-exposure-products/v5-positions-theme-wrapper` | Positions theme wrapper | **참고용** | plans-ui-v5 positions | H |
| M1 | `05-message-tickets/v5-tickets-baseline` | Tickets v5 purchase | **구현 기준** | plans-ui-v5 tickets + shots | F, G, H |
| M2 | `05-message-tickets/v4-tickets-balance-panel` | Tickets v4 balance panel | **참고용** | plans-ui-v4 tickets shot 06 | G (superseded UI) |
| B1 | `06-badges-options/stage5b-badge-multi-max2` | Badge multi max2 | **구현 기준** | stage5b plans-badge-multi | E |
| B2 | `06-badges-options/v4-single-badge-select` | Badge single select | **참고용** | plans-ui-v4 badge= | E (outdated select) |
| H1 | `07-history-reference/plans-ui-early` | Early plans-ui | **참고용** | plans-ui/ | chronology |
| H2 | `07-history-reference/plans-ui-v3-mypage-era` | v3 mypage-era shots | **참고용** | plans-ui-v3 | H (transitional) |
| H3 | `07-history-reference/stage4-paid-shots` | stage4 paid PNGs | **참고용** | stage4/ | chronology |
| W1 | `08-discard-or-warning/tutor-roomlike-slot-waitlist-early` | Tutor×room-like slots | **폐기·주의 필요** | plans-ui tutor exposure | D CONFLICT |
| W2 | `08-discard-or-warning/v3-mypage-tabs-settings-feel` | v3 tabs settings feel | **폐기·주의 필요** | plans-ui-v3 tabs | H |
| W3 | `08-discard-or-warning/type-b-pick-decision-archive` | Type B Pick list premise | **폐기·주의 필요** | _archive-pick-decision | cancelled plans-list |

## Prefer when overlapping

| Topic | Prefer | Over |
|---|---|---|
| Room Prime slots/waitlist | v4 (R1) | v3 placeholders |
| Room Pick 5×2 preview | v4 (R2) | Type B list experiments (W3) |
| Tutor model | v4 circulation (T1) | Early tutor slot/waitlist (W1) |
| Paid page samples | stage5b 1+1 (E1) | Basic grids / Type B lists |
| Storefront IA | v4 positions/tickets pages (E2, M1) | v3 mypage tabs (W2) |
| Tickets purchase | v5 (M1) | v4 balance panel (M2) |
| Badges | stage5b multi max2 (B1) | v4 single (B2) |
| Theme | v5 wrapper OK as 참고 (E3) | inventing new type system |

## Exclusions

- `.chrome` / browser profiles
- Cache / node_modules / secrets
- v5 Pretendard font binaries (remain in source `plans-ui-v5/fonts/`)
- Full v3 shot dump (selected only in H2; full set in source)
