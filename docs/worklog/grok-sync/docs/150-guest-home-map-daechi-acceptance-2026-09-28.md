# 150 Guest Home Map Daechi-only — ACCEPTANCE

- **Verdict:** ACCEPT
- **Date:** 2026-09-28 (KST)
- **Planner:** 종현
- **Machine:** ljh_work (`6aa2b772-d71e-4241-bcd4-3c985bf73991`)
- **Repo:** `D:\work\study114` · `git -c safe.directory=D:/work/study114`
- **Inspector:** PC files via Shell + box copy `/workspace/150-review/` (not Cursor report)
- **Ticket:** [150](150-guest-home-map-daechi-only-ticket.md) · cause [149](149-guest-home-map-nationwide-vs-daechi.md)
- **Next:** 151

## Verdict summary

Uncommitted WIP on HEAD `5570243` scopes guest `#/guest` map camera to Daechi (zoom 13–15) and pins to a 2.2 km / label Daechi-axis filter. Shared `naver-map.js` adds opt-in `fitBounds` (default **true**), so search/detail keep prior fitBounds behavior. List pools, region-stats, labels, and GPS stay untouched. No push / no Notion.

## Claim vs actual

| Claim | Actual | Result |
| --- | --- | --- |
| HEAD `5570243` | `git rev-parse HEAD` = `55702430525bed6751b932e039f289be2eb53bb9` | OK |
| no push / no commit WIP | Branch `feat/student-mypage-a-g` tracks `origin/main` @ same SHA; tracked dirty = 2 allowlist files only | OK — WIP unstaged |
| Files: `guest-sections.js`, `naver-map.js` | `git diff --stat HEAD` = those 2 only (+ pre-existing untracked docs/assets unrelated) | OK |
| SHA256 guest-sections | PC = box `/workspace/150-review/guest-sections.js` = `191a59ae7e66bc6e5bc50be9bc6935b334dd54c24a88a88fcf6fe914f330739e` (13108 B) | OK |
| SHA256 naver-map | PC = box = `b67a288448336abd41f436d2d87fb4a3926f676ec66fdc9c22f872d427794a74` (12109 B) | OK |
| git hash-object (LF-norm) | guest `be1191ba…` · naver `896fdf05…` | recorded |

## Must matrix

| # | Must | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Guest `#/guest` camera = Daechi · zoom 13–15 | **PASS** | Hero sets `data-map-lat/lng` from `GUEST_MAP_CENTER` (coordsFromLabel / `37.4946,127.0626`). Bind passes `lat/lng` + `fitBounds: false`. Mount `!fitBounds` path re-centers and `clampNeighborhoodZoom` → [13,15]. Explicit center resolves zoom **14**. |
| 2 | Pins Daechi-axis only (2.2 km **or** label filter) | **PASS** | `filterGuestDaechiMapItems`: haversine ≤ `GUEST_MAP_RADIUS_KM = 2.2`; `/대치/` must also be near; `OTHER_DONG` denylist (부산·센텀·우동·도곡…); else near-only. Used **only** by `guestHeroMapItems()`. Sim: Daechi✓ · Busan✗ (~318 km) · Dogok label✗ (1.59 km, non-axis) · unlabeled near✓ · zero coords✗. |
| 3 | `fitBounds: false` on guest path only | **PASS** | Guest: `data-fit-bounds="false"` + `fitBounds: false`. Mount default `options.fitBounds !== false` → **true**. Search `search-map.js` bind omits `fitBounds` and has no `data-fit-bounds`. Detail bind omits both. |
| 4 | Search / login maps unchanged | **PASS** | Search bind still passes only regionLabel/lat/lng/onPinClick. No auth-ui map callers. Shared change is additive opt-in. |
| 5 | region-stats / labels unchanged | **PASS** | `hydrateGuestRegionStats` still `POST /api/search/region-stats.php` `{}` → `data-guest-axis-count`. Hero still `GUEST_DEMO_REGION` (대치동 / 서울 강남구 대치동). |
| 6 | GPS none | **PASS** | No `geolocation` / `getCurrentPosition` / `watchPosition` in either WIP file. |
| 7 | List policy unchanged | **PASS** | `filterGuestDaechiMapItems` appears twice (def + `guestHeroMapItems` only). Prime/basic/browse lists still pass raw `getHomeBasicPool(...)`. |

## Code quotes — radius filter

```js
const GUEST_MAP_RADIUS_KM = 2.2;
const OTHER_DONG = /부산|센텀|해운대|우동|도곡|개포|역삼|서초|송파|잠실|논현|가능/;

export function filterGuestDaechiMapItems(items) {
  const list = Array.isArray(items) ? items : [];
  return list.filter((item) => {
    const lat = Number(item?.latitude);
    const lng = Number(item?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return false;
    const label = String(item.location_label || item.region_label || '');
    const near =
      haversineKm(lat, lng, GUEST_MAP_CENTER.lat, GUEST_MAP_CENTER.lng) <= GUEST_MAP_RADIUS_KM;
    if (/대치/.test(label)) return near;
    if (OTHER_DONG.test(label)) return false;
    return near;
  });
}

function guestHeroMapItems() {
  return filterGuestDaechiMapItems(getHomeBasicPool('study_room')).slice(0, 12);
}
```

## Code quotes — fitBounds:false guest path

Guest hero + bind:

```js
<section ... data-map-lat="${GUEST_MAP_CENTER.lat}" data-map-lng="${GUEST_MAP_CENTER.lng}" data-fit-bounds="false" ...>

bindStudyRoomMapSection(root, guestHeroMapItems(), {
  regionLabel: GUEST_DEMO_REGION.full,
  lat: GUEST_MAP_CENTER.lat,
  lng: GUEST_MAP_CENTER.lng,
  fitBounds: false,
});
```

Shared mount (default true; guest-only clamp):

```js
const fitBounds = options.fitBounds !== false; // default ON → find maps keep fitBounds

if (fitBounds && pins.length > 1) fitToPins();
else if (fitBounds && pins.length === 1) {
  map.setCenter(new naver.maps.LatLng(pins[0].lat, pins[0].lng));
  map.setZoom(16);
} else if (!fitBounds) {
  map.setCenter(new naver.maps.LatLng(center.lat, center.lng));
  map.setZoom(clampNeighborhoodZoom(center.zoom)); // 13–15
}
```

Bind resolve (attr / option; missing attr ⇒ true):

```js
const fitBounds =
  options.fitBounds === false
    ? false
    : options.fitBounds === true
      ? true
      : section?.getAttribute('data-fit-bounds') !== 'false';
```

## Band-aid / find-map regression check

| Risk | Assessment |
| --- | --- |
| Shared `fitBounds` breaks find maps | **No** — default true; search/detail never set false |
| Pin filter leaks into search | **No** — filter lives in `guest-sections.js` only |
| `OTHER_DONG` denylist | Guest-map-only; ticket allows label filter for Daechi-axis; does not touch find maps |
| List/nationwide sample policy changed | **No** — lists still unfiltered pools |

## Scope / forbidden

| Item | Result |
| --- | --- |
| Allowlist dirty | `preview/home-ui/src/guest-sections.js` · `preview/shared/naver-map.js` only |
| No push / `build:dothome` | HEAD == origin/main; review did not push |
| No Notion | OK |
| No 146–148 copy mix | Those files not in this WIP |
| GPS / region-stats / PHP | Untouched |
| Commit | **Not yet** — ticket asked 1 local commit; this review accepts **WIP blobs**. Commit when parent stages. |

## Smoke note

This acceptance is **code-path verified** (diff + call-site audit + filter simulation). Live browser `#/guest` smoke (ticket §5) was not re-run in this turn; prior bug shots remain under `/workspace/guest-map-audit/`.

## Artifacts

- `/workspace/150-review/guest-sections.js`
- `/workspace/150-review/naver-map.js`
- `/workspace/150-review/150.diff`
- This file: `docs/150-guest-home-map-daechi-acceptance-2026-09-28.md`

## Next

**151**
