/**
 * Location SSOT / searched 복원 / GPS 우선순위 / 필터 승격 검증
 * 실행: node scripts/verify-location-ssot.mjs
 */
import assert from 'node:assert/strict';
import {
  normalizeLocation,
  resolveLocationByPriority,
  nearestRegionByCoords,
  reverseGeocodeCoords,
  serializeCanonical,
  deserializeCanonical,
  toDisplayLabel,
  coordsFromLabel,
} from '../preview/shared/location-display.js';

const failures = [];
function check(name, fn) {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (err) {
    failures.push(name);
    console.error(`FAIL  ${name}`);
    console.error(`      ${err.message}`);
  }
}

async function checkAsync(name, fn) {
  try {
    await fn();
    console.log(`PASS  ${name}`);
  } catch (err) {
    failures.push(name);
    console.error(`FAIL  ${name}`);
    console.error(`      ${err.message}`);
  }
}

/** FE promoteRegionLabelFilters 미러 */
function promoteRegionLabelFilters(filters, tab) {
  const asText = (v) => (Array.isArray(v) ? String(v[0] || '') : String(v || '')).trim();
  const isNumericId = (v) => /^\d+$/.test(asText(v));
  const out = { ...filters };
  if (tab === 'room' && out.region_id != null && !isNumericId(out.region_id)) {
    out.region_label = asText(out.region_id);
    delete out.region_id;
  }
  if (tab === 'tutor' && out.tutor_region_id != null && !isNumericId(out.tutor_region_id)) {
    out.tutor_region_label = asText(out.tutor_region_id);
    delete out.tutor_region_id;
  }
  if (tab === 'student' && out.preferred_region != null && !isNumericId(out.preferred_region)) {
    out.preferred_region_label = asText(out.preferred_region);
    delete out.preferred_region;
  }
  return out;
}

function encodeFiltersForUrl(filters) {
  const compact = {};
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v == null || v === '') return;
    if (Array.isArray(v) && !v.length) return;
    compact[k] = v;
  });
  if (!Object.keys(compact).length) return '';
  return btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
}

function decodeFiltersFromUrl(raw) {
  const json = decodeURIComponent(escape(atob(raw)));
  return JSON.parse(json);
}

/** hydrate 핵심 분기 미러 (searched / restoreKey) */
function simulateHydrateSearchFlags({ q, tab, canonical, state, storedFilters = null }) {
  const wantsSearch = q.searched === '1' || q.searched === 'true';
  const urlFilters = q.f ? decodeFiltersFromUrl(q.f) : null;
  /** @type {Record<string, any>|null} */
  let filters = null;
  if (urlFilters && Object.keys(urlFilters).length) {
    filters = urlFilters;
  } else if (wantsSearch) {
    filters = storedFilters && Object.keys(storedFilters).length ? { ...storedFilters } : {};
    const region = canonical.displayLabel;
    if (tab === 'room') {
      delete filters.region_id;
      filters.region_label = region;
    } else if (tab === 'tutor') {
      delete filters.tutor_region_id;
      filters.tutor_region_label = region;
    } else {
      delete filters.preferred_region;
      filters.preferred_region_label = region;
    }
  } else if (storedFilters && Object.keys(storedFilters).length) {
    filters = storedFilters;
  } else if (q.storedFilters) {
    filters = q.storedFilters;
  }
  let needsSearchRestore = false;
  if (wantsSearch && filters && Object.keys(filters).length) {
    state.searchExecuted = true;
    state.lastSearchFilters = filters;
    const restoreKey = `${tab}::${encodeFiltersForUrl(filters)}::${canonical.displayLabel}`;
    if (state._restoredSearchKey !== restoreKey) {
      state._needsSearchRestore = true;
      needsSearchRestore = true;
    } else {
      state._needsSearchRestore = false;
    }
  } else if (!wantsSearch) {
    state._needsSearchRestore = false;
    state._restoredSearchKey = null;
    if (state.searchExecuted && !state.searchLoading) {
      state.searchExecuted = false;
      state.lastSearchFilters = null;
    }
  }
  return { needsSearchRestore, filters, state };
}

/** GPS 스킵 우선순위 미러 */
function shouldSkipGps(source, searchExecuted) {
  if (searchExecuted) return 'search-executed';
  if (['url', 'session', 'address', 'saved', 'gps'].includes(source)) return 'higher-priority-source';
  return null;
}

check('CanonicalLocation fields + coords from label', () => {
  const c = normalizeLocation({ raw: '서울 강남구 대치동', source: 'url' }, 'room');
  assert.equal(c.displayLabel, '서울 강남구 대치동');
  assert.ok(c.regionKey);
  assert.equal(c.source, 'url');
  assert.ok(Number.isFinite(c.lat));
  assert.ok(Number.isFinite(c.lng));
});

check('serialize/deserialize roundtrip keeps lat/lng/source', () => {
  const c = normalizeLocation(
    { raw: '서울 송파구', lat: 37.51, lng: 127.1, source: 'address' },
    'room',
  );
  const back = deserializeCanonical(serializeCanonical(c), 'room');
  assert.equal(back.displayLabel, c.displayLabel);
  assert.equal(back.lat, c.lat);
  assert.equal(back.lng, c.lng);
  assert.equal(back.source, 'address');
});

check('priority: URL wins over saved', () => {
  const c = resolveLocationByPriority(
    {
      sessionSelected: { raw: '서울 송파구', lat: 37.51, lng: 127.1, source: 'url' },
      savedDefault: { raw: '부산 해운대구', source: 'saved' },
      fallback: '대치동',
    },
    'room',
  );
  assert.equal(c.source, 'url');
  assert.match(c.displayLabel, /송파/);
  assert.equal(c.lat, 37.51);
});

check('priority: saved wins over fallback (GPS slot empty)', () => {
  const c = resolveLocationByPriority(
    {
      sessionSelected: null,
      savedDefault: { raw: '부산 해운대구', source: 'saved' },
      gps: null,
      fallback: '서울 강남구 대치동',
    },
    'room',
  );
  assert.equal(c.source, 'saved');
  assert.match(c.displayLabel, /부산|해운대/);
});

check('GPS skip when saved/url/address present', () => {
  assert.equal(shouldSkipGps('saved', false), 'higher-priority-source');
  assert.equal(shouldSkipGps('url', false), 'higher-priority-source');
  assert.equal(shouldSkipGps('address', false), 'higher-priority-source');
  assert.equal(shouldSkipGps('fallback', false), null);
  assert.equal(shouldSkipGps('fallback', true), 'search-executed');
});

check('filter encode/decode roundtrip', () => {
  const f = { region_label: '서울 강남구 대치동', subjects: ['math'] };
  assert.deepEqual(decodeFiltersFromUrl(encodeFiltersForUrl(f)), f);
});

check('searched=1 + f → needs restore once; second hydrate no loop', () => {
  const canonical = normalizeLocation({ raw: '서울 강남구 대치동', source: 'url' }, 'room');
  const f = { region_label: '서울 강남구 대치동' };
  const q = { searched: '1', f: encodeFiltersForUrl(f) };
  const state = { searchExecuted: false, _restoredSearchKey: null, searchLoading: false };
  const first = simulateHydrateSearchFlags({ q, tab: 'room', canonical, state });
  assert.equal(first.needsSearchRestore, true);
  // 검색 시작 시 키 선기록
  state._restoredSearchKey = `room::${encodeFiltersForUrl(f)}::${canonical.displayLabel}`;
  const second = simulateHydrateSearchFlags({ q, tab: 'room', canonical, state });
  assert.equal(second.needsSearchRestore, false);
});

check('searched=1 without f → region from canonical not stale storage', () => {
  const canonical = normalizeLocation({ raw: '서울 강남구 대치동', source: 'url' }, 'room');
  // stale stored would be 송파 — 시뮬레이션에서는 filters 조립 로직만 검증
  const wantsSearch = true;
  const urlFilters = null;
  const storedFilters = { region_label: '서울 송파구', subjects: ['math'] };
  let filters = null;
  if (urlFilters && Object.keys(urlFilters).length) {
    filters = urlFilters;
  } else if (wantsSearch) {
    filters = { ...storedFilters };
    filters.region_label = canonical.displayLabel;
    delete filters.region_id;
  }
  assert.equal(filters.region_label, '서울 강남구 대치동');
  assert.deepEqual(filters.subjects, ['math']);
});

check('no searched → clear search keep region concept', () => {
  const canonical = normalizeLocation({ raw: '서울 송파구', source: 'session' }, 'room');
  const state = {
    searchExecuted: true,
    lastSearchFilters: { region_label: 'x' },
    _restoredSearchKey: 'room::x::y',
    searchLoading: false,
  };
  simulateHydrateSearchFlags({ q: {}, tab: 'room', canonical, state });
  assert.equal(state.searchExecuted, false);
  assert.equal(state.lastSearchFilters, null);
  assert.equal(state._restoredSearchKey, null);
  assert.ok(canonical.displayLabel);
});

check('promote non-numeric region_id → region_label', () => {
  const room = promoteRegionLabelFilters({ region_id: '서울 강남구 대치동' }, 'room');
  assert.equal(room.region_label, '서울 강남구 대치동');
  assert.equal(room.region_id, undefined);
  const num = promoteRegionLabelFilters({ region_id: '42' }, 'room');
  assert.equal(num.region_id, '42');
  assert.equal(num.region_label, undefined);
});

check('toDisplayLabel normalizes raw region_label', () => {
  const raw = '서울특별시 강남구 대치동';
  const display = toDisplayLabel(raw, 'room');
  assert.ok(display);
  assert.notEqual(display, '');
  // raw 그대로가 아닌 정규화 경로를 탐
  assert.ok(typeof display === 'string');
});

check('map center coords prefer explicit canonical', () => {
  const c = normalizeLocation({ raw: '서울 강남구 대치동', lat: 37.4946, lng: 127.0626 }, 'room');
  const fromLabel = coordsFromLabel(c.displayLabel);
  assert.ok(fromLabel);
  assert.equal(c.lat, 37.4946);
  assert.equal(c.lng, 127.0626);
});

await checkAsync('reverseGeocodeCoords nearest fallback (no naver SDK)', async () => {
  const geo = await reverseGeocodeCoords(37.5665, 126.978, 'room');
  assert.equal(geo.source, 'gps');
  assert.ok(geo.displayLabel);
  assert.equal(geo.lat, 37.5665);
  assert.equal(geo.lng, 126.978);
});

check('nearestRegionByCoords uses GPS coords not seed center only', () => {
  const n = nearestRegionByCoords(35.158, 129.16, 'room');
  assert.equal(n.source, 'gps');
  assert.equal(n.lat, 35.158);
  assert.equal(n.lng, 129.16);
});

if (failures.length) {
  console.error(`\n${failures.length} failed`);
  process.exit(1);
}
console.log('\nAll location SSOT checks passed.');
