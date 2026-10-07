# plans-ui-v5 REPORT — FINAL POLISH (delta vs v4)

Review-only standalone static prototype. No real service code, DB, API, PG, auth, or deploy.
v4 was copied to a new folder; **v4 is not overwritten**.

## Files

| Path | Role |
|------|------|
| `positions.html` | 노출상품 — **IA/logic/copy unchanged** vs approved v4; theme wrapper only |
| `tickets.html` | 쪽지권 — information order, copy, active-pack, aux nav |
| `styles.css` | Plans-only provisional theme + Pretendard + token scale |
| `app.js` | Same occupancy/waitlist/pricing; tickets activePack + names |
| `fonts/*.woff2` | Local Pretendard (Regular–Black) for Korean screenshot rendering |
| `shots/01-tickets-buy-default.png` | Desktop purchase (default) |
| `shots/02-tickets-active-pack.png` | Desktop active pack holding |
| `shots/m1-tickets-buy-default.png` | 390px check (optional) |
| `shots/m2-tickets-active-pack.png` | 390px active pack check (optional) |
| `capture.py` / `make_zip.py` | Helpers |

ZIP: `/workspace/plans-ui-v5.zip` (folder `plans-ui-v5/`; `.chrome` excluded)

---

## Positions IA confirmation

`positions.html` structure/copy/section order is **byte-identical to v4** except wrapping the storefront in:

```html
<div class="plans-theme" data-theme="plans"> … </div>
```

Unchanged: Prime 3-slot board, occupancy (partial/held/full), waitlist copy + table, Pick 5×2 preview, badge inherit period, 적용 대상 after products, pricing tables, CTAs (구매하기 / 예약대기 등록 / 결제 계속하기).

`app.js` positions rendering, occupancy mock, waitlist seeds, and URL params are unchanged. Token/font polish only (scoped CSS). One inline color var in apply-profile caption now uses `--plans-muted` so it still resolves under the scoped theme.

---

## URL / state mapping (tickets)

| Param | Values | Effect |
|-------|--------|--------|
| `role` | `room` \| `tutor` | 공부방 / 과외쌤 보기 |
| `ticket` | `1` \| `5` \| `10` | Selection when allowed. If a paid pack is active and `ticket` is 5 or 10, prototype snaps to `1`. Default when allowed: `5`. |
| `activePack` | `0` \| `5` \| `10` | Active paid pack holding. `0` = none. |
| `pack` | `none` \| `5` \| `10` | Alias for `activePack` (`none` → `0`). |

Positions params unchanged from v4: `region`, `prime`, `waitlist`, `wlStatus`, `product`, `term`, `badge`.

### Example URLs

```
tickets.html?role=room&ticket=5&activePack=0
tickets.html?role=room&ticket=1&activePack=5
tickets.html?role=tutor&ticket=1&activePack=10
tickets.html?role=room&ticket=1&pack=5
positions.html?role=room&region=1&prime=partial&product=prime&term=1개월
```

Prototype strip on tickets toggles `role`, `ticket`, and `activePack`.

---

## Changed copy list (tickets vs v4)

### Page order (new)
1. 공부방·과외쌤 쪽지권
2. 학생에게 먼저 보내는 첫 쪽지만 차감됩니다 (+ 후속·답장 무료)
3. Auxiliary: 내 쪽지권 보기 · 쪽지함 보기 + status location guidance
4. 적용 프로필 확인 (지역 없음)
5. 1회 · 5회 · 10회 cards
6. 구매 전 확인
7. 주문 요약
8. 환불·소멸 안내

### Removed from purchase page
- Large **현재 잔액 · 가장 빠른 만료일** panel
- “현재 잔액과 가장 빠른 만료일을 확인하세요.”
- “쪽지권은 만료일이 빠른 것부터 사용됩니다.” (FIFO)
- Card unit “회 쪽지권” as a separate line; large numeral is now `1회` / `5회` / `10회`

### Product names (unified)
- `1회 즉시권` · `5회권` · `10회권`
- Used in card title, `aria-label`, order summary, proto strip

### Core
- Strong: `학생에게 먼저 보내는 첫 쪽지만 차감됩니다`
- Body (same policy as v4): 후속 쪽지 무료 · 학생·학부모 선쪽지와 답장 무료

### Status location (new, near aux nav)
- `보유 중인 쪽지권의 남은 횟수와 사용기한은 마이페이지의 내 상품에서 확인할 수 있습니다.` + CTA **내 쪽지권 보기** (outline, weaker than 구매하기)
- `보낸 쪽지와 이어진 대화는 쪽지함에서 확인할 수 있습니다.` + CTA **쪽지함 보기** (outline)

### 구매 전 확인 (exact)
- Title: `구매 전 확인`
- Body: `5회권과 10회권은 구매일부터 120일 동안 사용할 수 있습니다. 사용 중인 유료 묶음권은 중복 구매할 수 없으니 예상 사용량을 확인하고 필요한 만큼만 구매하세요.`
- Aux: `사용기한이 지나면 남은 횟수는 소멸하며 환불·연장되지 않습니다.`

### Active pack (exact)
- `사용 중인 쪽지권이 있습니다. 남은 횟수를 모두 사용하거나 사용기한이 지난 뒤 새 묶음권을 구매할 수 있습니다.`
- Extra (not color-only): 5회권/10회권 cards show `구매할 수 없습니다. 사용 중인 묶음권의 남은 횟수를 모두 쓰거나 사용기한이 지난 뒤 구매하세요.`
- 1회 즉시권 remains enabled
- CTA **내 쪽지권 보기** on the hold banner

### Terminology
- “현재 잔액” not used on the purchase page (no holdings panel)
- 1회 note: `결제 후 바로 발송 · 남은 횟수로 보관되지 않습니다` (avoid “잔액”)

---

## Typography / token notes

- Font: **Pretendard only**. CDN `@import` (jsDelivr v1.3.9) + local `@font-face` from `fonts/*.woff2` so headless Korean screenshots do not depend on the CDN.
- Scale only: 12 / 14 / 16 / 18 / 22 / 28 / 36 (`--fs-caption` … `--fs-hero`).
- Page title 28 · section 22 · body/buttons/inputs 16 · card name/price 18 · meta/compare 14 · caption/badge 12.
- Ticket large numeral uses `--fs-hero` 36px and **includes 회** (`1회` `5회` `10회`). Card uses 36 / 18 / 14 (three sizes).
- Mobile (≤640): page 28→22, section 22→18, hero numeral 36→28. Card body/meta/caption stay desktop sizes.
- Theme scoped to `.plans-theme` / `[data-theme="plans"]`. Comment in CSS: plans-only provisional theme; do not treat as site-wide brand.
- Global `body` is a generic reset (`#f5f5f5`), not ivory brand. Canvas/ink/primary live only under `.plans-theme`.
- Prices are Ink. Blue (`--plans-primary`) only for selection border/fill, focus outline, and primary purchase CTA (and equivalent selected tabs).
- Header/nav inside the wrapper is plans storefront shell, not a site-wide brand system (brand lockup is body 16px, not a 20px global identity).

---

## Active pack policy (prototype)

- Per profile: only one active paid pack (5회권 or 10회권 with remaining paid count).
- If paid remaining → cannot buy another 5/10.
- Can buy a new pack after all used **or** 120-day expiry (stated in copy; no live timer).
- 1회 즉시권: never stored as remaining count; always purchasable.
- Free messages from exposure products are not blocked in this UI.

---

## Gaps / unconfirmed

- Same unconfirmed ops list as v4 (hold TTL, waitlist SLA, refund day-count, tutor multi-region, etc.).
- “내 쪽지권 보기 / 쪽지함 보기” are prototype alerts, not mypage routes.
- Active pack remaining count / expiry date are **not** shown on the purchase page (by design); live values would live in 마이페이지 내 상품.
- No mixed free-from-exposure + paid remaining counter on this page (policy: they may coexist; no UI block).
- Positions screenshots were not re-shot in v5 (tickets-only deliverable). Visual token polish on positions is in CSS; verify in browser if needed.

---

## Done criteria

- [x] Large numerals have 회 suffix
- [x] No “현재 잔액” big block
- [x] No large holdings panel on purchase page
- [x] 내 쪽지권 / 쪽지함 guidance present
- [x] Active pack blocks 5/10 additional purchase
- [x] 1회 즉시권 still usable
- [x] No earliest-expiry / FIFO copy on purchase page
- [x] Positions page approved structure/logic unchanged
- [x] ZIP ready at `/workspace/plans-ui-v5.zip`
