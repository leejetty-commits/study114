# plans-ui-v4 REPORT — 우동공과 유료상품 UI 프로토타입

Review-only standalone static prototype. No real service code, DB, API, PG, auth, or deploy.

## Files

| Path | Role |
|------|------|
| `positions.html` | 노출상품 (`/plans/positions` 시뮬) |
| `tickets.html` | 쪽지권 (`/plans/tickets` 시뮬) |
| `styles.css` | Design tokens + layout |
| `app.js` | Pricing, occupancy mock, waitlist, URL state |
| `shots/01`…`06.png` | 6 full-page screenshots |
| `capture.py` | Headless capture helper (optional) |

ZIP: `/workspace/plans-ui-v4.zip` (v4 folder contents; `.chrome` excluded)

---

## URL / state parameter mapping

| Param | Values | Effect |
|-------|--------|--------|
| `role` | `room` \| `tutor` | 공부방 / 과외쌤 가격·카피·배지·점유 UI |
| `region` | `1` \| `2` \| `3` | 대표 홍보지역 (대치1동 / 역삼동 / 잠실동) |
| `prime` | `partial` \| `full` \| `held` | Prime 점유: 부분 / 전체 / 결제 임시확보 |
| `waitlist` | `1` | 내 예약대기 목록 패널 표시 |
| `wlStatus` | `waiting` \| `payable` \| `done` | 대기 시드 행 상태 |
| `product` | `prime` \| `pick` | 선택 상품 (Prime 노출 / Pick 노출) |
| `term` | `2주` \| `1개월` \| `2개월` \| `3개월` \| `6개월` | 기간 카드 선택 |
| `badge` | `Hot` \| `단과` \| `쪽집게` \| `SKY` | 홍보 배지 (역할별) |
| `ticket` | `1` \| `5` \| `10` | 쪽지권 선택 (`tickets.html` only) |

### Occupancy sample data (공부방 Prime only)

| Region | Mix |
|--------|-----|
| 1 대치1동 | 1 occupied + 2 available |
| 2 역삼동 | 2 occupied + 1 available |
| 3 잠실동 | 3/3 occupied (full → 예약대기) |

- `prime=held`: leftmost available → `결제 임시확보` + countdown `14:59`
- Tutor / Pick: occupancy · waitlist UI never shown
- Prototype strip (dark bar) mirrors the same params without editing the URL

### Example URLs

```
positions.html?role=room&region=1&prime=partial&product=prime&term=1개월
positions.html?role=room&region=3&prime=full&product=prime
positions.html?role=room&region=3&prime=full&waitlist=1&wlStatus=payable
positions.html?role=room&product=pick&term=1개월
positions.html?role=tutor&product=prime&term=2개월
tickets.html?role=room&ticket=5
tickets.html?role=tutor&ticket=10
```

---

## Before / after (vs v3)

- **IA**: Single mypage-tab page → independent store pages (`positions.html` / `tickets.html`) with real nav links
- **Chrome**: Removed sidebar · right policy rail · settings-form feel; storefront single column
- **Order**: Products first, **적용 대상 after** products (v3 had region/profile first)
- **Names**: Section/CTA/summary always **Prime 노출** / **Pick 노출** (not bare Prime/Pick titles alone)
- **Prime full CTA**: Only **예약대기 등록** (removed **Pick 살펴보기**)
- **Occupancy**: Real 3-slot board per region tab + held countdown (v3 was tiny placeholder tiles)
- **Waitlist**: Full **내 예약대기 목록** table with waiting / payable / done actions; no 순번
- **Pick preview**: Exact **5×2** equal cards + centered numeric pagination (v3 was compact tiles)
- **Badges**: Title **홍보 배지 장착**; inherit main period; show period price before select; no separate period picker
- **Tutor copy**: Exact circulation copy; removed forbidden “판매 정원 없이 / 총량 제한 없음”
- **Tickets**: Own page; no region UI; equal 3 cards; titled **구매 전 확인** block; balance · earliest expiry section
- **Pricing**: Exact tables from brief (room/tutor/badge/tickets + tutor message bundles)

---

## Exact copy list used

### Shared / nav
- 우동공과 · 노출상품 · 쪽지권 · 보기 · 공부방 · 과외쌤 · 프로토타입

### positions.html
- 노출상품
- Basic 무료 노출 / 마이샵 꾸미기와 Basic 노출은 무료입니다. 별도의 끌어올리기(UP) 상품은 제공하지 않습니다.
- Prime 노출
- Room lead: Prime 노출은 선택한 대표 홍보지역의 대표 영역에 표시됩니다. …
- Tutor Prime (exact): `선택한 시와 주력과목의 Prime 영역에 페이지당 3명씩 노출되며, 15분마다 공정하게 순환합니다.`
- Pick 노출
- Pick public (exact): `한 페이지에 10명씩 노출되며, 15분마다 공정하게 순환합니다.`
- Pick 노출 미리보기 · 한 페이지 10명 (5열 × 2행)
- 홍보 배지 장착
- Badge body (exact): `선택한 Prime 노출 또는 Pick 노출에 배지를 추가할 수 있습니다. 배지는 선택한 노출상품과 같은 기간 동안 적용됩니다.`
- SKY: 학교정보 기반 광고 표현이며 플랫폼 인증이 아님
- 적용 대상 · 주문 요약 · 구매하기 · 예약대기 등록 · 결제 계속하기
- Full waitlist (exact): `현재 선택 지역의 Prime 자리는 모두 이용 중입니다. 예약대기를 등록하면 빈자리가 열릴 때 알려드립니다. 대기 등록만으로 자리나 순번이 보장되지는 않으며 결제가 완료되어야 확정됩니다.`
- Slot: 구매 가능 · 결제 임시확보 · (masked name) · YYYY-MM-DD 종료 예정
- Waitlist columns: 상품 | 지역 | 신청일 | 상태 | 행동
- Status: 대기 등록 / 결제 가능 / 구매 완료 / 취소
- Actions: 취소 · 결제하기 · 내 상품 보기
- 환불·만료 안내 (accordion body as in page)

### tickets.html
- 공부방·과외쌤 쪽지권
- 첫 선제 쪽지만 차감됩니다 (+ follow-up / reply free copy)
- 적용 프로필 확인 · 쪽지권은 선택한 프로필에 적용됩니다. 지역 선택은 없습니다.
- 쪽지권 선택 · 1/5/10 회 쪽지권
- 결제 후 바로 발송 · 구매일부터 120일 · 10%/20% 절약
- **구매 전 확인** (title required) + 120일 body (exact from brief)
- 현재 잔액·가장 빠른 만료일
- 주문 요약 · 쪽지권 n회 · 환불·소멸 안내

### Pricing (exact)
- Room Prime: 30000 / 50000 / 90000 / 127500 / 240000
- Room Pick: 15000 / 30000 / 54000 / 76500 / 144000
- Room Badge: 2500 / 5000 / 9000 / 12750 / 24000
- Tutor Prime: 18000+2 / 30000+5 / 57000+10 / 81000+15 / 153000+30
- Tutor Pick: 10000+1 / 20000+2 / 38000+4 / 54000+6 / 102000+12
- Tutor Badge: 5000 / 10000 / 19000 / 27000 / 51000
- Tutor disc: 0 / 0 / 5% / 10% / 15%
- Tickets: 1000 / 4500 / 8000

---

## Unconfirmed policy list

- Exact hold TTL for 결제 임시확보 (prototype shows 14:59)
- Waitlist notification channel / SLA when a slot opens
- Whether waitlist is per-region only or also per-term/product
- Partial refund formula day-count timezone and “익일” boundary
- Ticket pack partial-refund unit price when mixed packs exist
- Whether tutor activity region 1·2·3 UI is multi-select in production (prototype single select)
- Badge mutual exclusivity with concurrent Prime+Pick (prototype: one badge on selected product)
- Display of “held” slot to other buyers in production
- Start date: immediate vs next rotation boundary (labeled 프로토타입 예시)

---

## Accessibility checklist

| Check | Result |
|-------|--------|
| Semantic `h1`–`h2` page structure | Pass |
| Nav `aria-current="page"` on active product page | Pass |
| Role toggle `aria-pressed` | Pass |
| Period / badge / ticket buttons: `aria-label` includes product name + price | Pass |
| Region tabs `role="tablist"` / `aria-selected` | Pass |
| Slot status announced in text (not color alone): 구매 가능 / 이용 중 / 임시확보 | Pass |
| Focus visible: blue `outline` on interactive controls | Pass |
| Contrast: Ink `#292823` on Canvas/Surface ivory/white | Pass (approx AAA for body) |
| Primary CTA labels distinguish 구매하기 / 예약대기 등록 | Pass |
| Waitlist table: `th scope="col"` | Pass |
| No color-only selection (border + fill + aria-pressed) | Pass |
| Proto strip labeled 프로토타입 (not mistaken for product UI) | Pass |

Residual: live region for hold countdown tick not implemented (static 14:59 mock).

---

## Screenshot verification

| File | Verified content |
|------|------------------|
| `01-room-positions-prime-cards.png` | 노출상품 + Prime 5 period cards + partial slots |
| `02-room-prime-slots-partial.png` | Region 역삼동 · 2 occupied + 1 available |
| `03-room-prime-full-waitlist.png` | 잠실동 3/3 + waitlist copy + 예약대기 등록 |
| `04-my-waitlist.png` | 내 예약대기 table · 대기 등록 + 결제 가능 |
| `05-pick-grid-5x2.png` | Pick selected · 5×2 grid · pagination |
| `06-tickets-equal-cards.png` | 3 equal cards + **구매 전 확인** title |

Capture: Chrome headless 1440×4000, `--disable-dev-shm-usage`, user-data-dir under v4; bottom whitespace cropped with Pillow.

---

## O/P completion checklist

- [x] Independent store pages (not mypage settings)
- [x] Prime 노출 / Pick 노출 names
- [x] Room Prime 3-slot board per region
- [x] Buy → leftmost available held
- [x] Full → waitlist register → my waitlist
- [x] Waitlist no 순번 / competitors
- [x] Pick preview exactly 5×2
- [x] Prices center-aligned on cards
- [x] Badges inherit period
- [x] No Pick 살펴보기
- [x] No internal sales-policy wording on tutor
- [x] Tickets titled, no region
- [x] 1·5·10 equal cards + 구매 전 확인
- [x] Separate HTML with links
- [x] ZIP at `/workspace/plans-ui-v4.zip`
- [x] v3 not overwritten
