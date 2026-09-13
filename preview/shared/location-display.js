/**
 * 위치 SSOT — CanonicalLocation 하나가 헤더/지도/리스트/URL의 단일 원천
 *
 * 우선순위: sessionSelected(URL·직접선택) → savedDefault → gps → serviceFallback
 * 모드: room/study_room → dong|apartment · tutor → city
 */

/** @typedef {'room'|'tutor'|'student'|'study_room'} LocationAxis */
/** @typedef {'apartment'|'dong'|'district'|'city'|'unknown'} LocationLevel */
/** @typedef {'url'|'session'|'saved'|'gps'|'fallback'|'api'|'address'} LocationSource */

/**
 * @typedef {object} CanonicalLocation
 * @property {string} province
 * @property {string} city
 * @property {string} district
 * @property {string} dong
 * @property {string} apartmentName
 * @property {string} displayLabel
 * @property {string} searchScopeLabel
 * @property {string} regionKey
 * @property {string|number|null} regionId
 * @property {LocationLevel} level
 * @property {number|null} lat
 * @property {number|null} lng
 * @property {string} raw
 * @property {LocationAxis} [axis]
 * @property {LocationSource} [source]
 */

/** @type {Array<{ test: RegExp, lat: number, lng: number, label: string, city?: string, dong?: string }>} */
const REGION_COORDS = [
  { test: /대치/, lat: 37.4946, lng: 127.0626, label: '서울 강남구 대치동', city: '서울', dong: '대치동' },
  { test: /도곡/, lat: 37.4882, lng: 127.0465, label: '서울 강남구 도곡동', city: '서울', dong: '도곡동' },
  { test: /개포/, lat: 37.4892, lng: 127.0661, label: '서울 강남구 개포동', city: '서울', dong: '개포동' },
  { test: /역삼/, lat: 37.5007, lng: 127.0365, label: '서울 강남구 역삼동', city: '서울', dong: '역삼동' },
  { test: /서초/, lat: 37.4837, lng: 127.0324, label: '서울 서초구', city: '서울', dong: '' },
  { test: /송파|잠실/, lat: 37.5145, lng: 127.1059, label: '서울 송파구', city: '서울', dong: '' },
  { test: /센텀/, lat: 35.1695, lng: 129.131, label: '부산 해운대구 센텀동', city: '부산', dong: '센텀동' },
  { test: /해운대/, lat: 35.1631, lng: 129.1634, label: '부산 해운대구', city: '부산', dong: '' },
  { test: /강남/, lat: 37.4979, lng: 127.0276, label: '서울 강남구', city: '서울', dong: '' },
  { test: /서울/, lat: 37.5665, lng: 126.978, label: '서울시', city: '서울시', dong: '' },
  { test: /부산/, lat: 35.1796, lng: 129.0756, label: '부산시', city: '부산시', dong: '' },
];

const CITY_SUFFIX = /(특별자치시|특별시|광역시|특별자치도|자치도|시|도)$/;

/** @param {unknown} value */
function blank(value) {
  return String(value ?? '').trim();
}

/**
 * @param {string} raw
 */
function parseKoreanAddressParts(raw) {
  const text = blank(raw);
  if (!text) {
    return { province: '', city: '', district: '', dong: '', apartmentName: '' };
  }

  const complexSplit = text.split(/\s*[·|]\s*/);
  if (complexSplit.length >= 2) {
    const left = blank(complexSplit[0]);
    const apt = blank(complexSplit.slice(1).join(' · '));
    const leftParts = left.split(/\s+/).filter(Boolean);
    if (leftParts.length >= 3) {
      return {
        province: '',
        city: leftParts[0],
        district: leftParts[1],
        dong: leftParts.slice(2).join(' '),
        apartmentName: apt,
      };
    }
    if (leftParts.length === 1 && /동$/.test(leftParts[0])) {
      return { province: '', city: '', district: '', dong: leftParts[0], apartmentName: apt };
    }
  }

  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const only = parts[0];
    if (/동$/.test(only)) {
      return { province: '', city: '', district: '', dong: only, apartmentName: '' };
    }
    if (CITY_SUFFIX.test(only) || /시$/.test(only)) {
      return { province: '', city: only, district: '', dong: '', apartmentName: '' };
    }
    return { province: '', city: '', district: '', dong: '', apartmentName: only };
  }
  if (parts.length === 2) {
    return {
      province: '',
      city: parts[0],
      district: parts[1],
      dong: /동$/.test(parts[1]) ? parts[1] : '',
      apartmentName: '',
    };
  }
  return {
    province: '',
    city: parts[0],
    district: parts[1],
    dong: parts.slice(2).join(' '),
    apartmentName: '',
  };
}

/** @param {LocationAxis} axis */
export function defaultLevelForAxis(axis) {
  if (axis === 'tutor') return 'city';
  return 'dong';
}

/** @param {CanonicalLocation} c */
export function buildRegionKey(c) {
  const parts = [c.city, c.district, c.dong, c.apartmentName].map(blank).filter(Boolean);
  return parts.join('|').toLowerCase() || blank(c.displayLabel).toLowerCase();
}

/**
 * @param {Partial<CanonicalLocation> & Record<string, unknown>} input
 * @param {LocationAxis} [axis]
 * @returns {CanonicalLocation}
 */
export function normalizeLocation(input = {}, axis = 'room') {
  const raw = blank(
    input.raw || input.region_label || input.label || input.full || input.displayLabel || '',
  );
  const parsed = parseKoreanAddressParts(raw);
  const apartmentName = blank(input.apartmentName || input.complex_label || parsed.apartmentName);
  const dong = blank(input.dong || parsed.dong);
  const district = blank(input.district || input.gu || parsed.district);
  const city = blank(input.city || parsed.city);
  const province = blank(input.province || parsed.province);

  /** @type {LocationLevel} */
  let level = 'unknown';
  if (apartmentName) level = 'apartment';
  else if (dong) level = 'dong';
  else if (district) level = 'district';
  else if (city) level = 'city';

  if (axis === 'tutor' && city) level = 'city';
  else if ((axis === 'room' || axis === 'study_room') && !apartmentName && dong) level = 'dong';

  let lat = input.lat != null && Number.isFinite(Number(input.lat)) ? Number(input.lat) : null;
  let lng = input.lng != null && Number.isFinite(Number(input.lng)) ? Number(input.lng) : null;

  /** @type {CanonicalLocation} */
  const canonical = {
    province,
    city,
    district,
    dong,
    apartmentName,
    displayLabel: '',
    searchScopeLabel: '',
    regionKey: '',
    regionId: input.regionId ?? input.region_id ?? null,
    level,
    lat,
    lng,
    raw,
    axis,
    source: /** @type {LocationSource|undefined} */ (input.source) || undefined,
  };
  canonical.displayLabel = formatLocationDisplay(canonical, axis);
  canonical.searchScopeLabel = canonical.displayLabel;
  canonical.regionKey = blank(input.regionKey) || buildRegionKey(canonical);

  if (canonical.lat == null || canonical.lng == null) {
    const fromLabel = coordsFromLabel(canonical.displayLabel || raw);
    if (fromLabel) {
      canonical.lat = fromLabel.lat;
      canonical.lng = fromLabel.lng;
    }
  }

  return canonical;
}

/**
 * @param {CanonicalLocation|Partial<CanonicalLocation>|string} loc
 * @param {LocationAxis} [axis]
 */
export function formatLocationDisplay(loc, axis = 'room') {
  if (typeof loc === 'string') {
    return formatLocationDisplay(normalizeLocation({ raw: loc }, axis), axis);
  }
  const apartmentName = blank(loc.apartmentName);
  const dong = blank(loc.dong);
  const district = blank(loc.district);
  const city = blank(loc.city);
  const raw = blank(loc.raw || loc.displayLabel);

  if (axis === 'tutor') {
    if (city) return city;
    if (raw) return raw.split(/\s+/)[0] || raw;
    return '위치 확인 중';
  }

  if (apartmentName) return dong ? `${dong} · ${apartmentName}` : apartmentName;
  if (dong && district && city) return `${city} ${district} ${dong}`;
  if (dong && city) return `${city} ${dong}`;
  if (dong) return dong;
  if (district && city) return `${city} ${district}`;
  if (city) return city;
  return raw || '위치 확인 중';
}

/** @param {string} label */
export function coordsFromLabel(label) {
  const text = blank(label);
  if (!text) return null;
  for (const row of REGION_COORDS) {
    if (row.test.test(text)) {
      return { lat: row.lat, lng: row.lng, matchedLabel: row.label };
    }
  }
  return null;
}

/**
 * @param {number} lat
 * @param {number} lng
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * GPS 좌표 → 가장 가까운 시드 지역 (역지오코딩 실패 시 fallback)
 * @param {number} lat
 * @param {number} lng
 * @param {LocationAxis} [axis]
 * @returns {CanonicalLocation}
 */
export function nearestRegionByCoords(lat, lng, axis = 'room') {
  let best = REGION_COORDS[0];
  let bestDist = Infinity;
  for (const row of REGION_COORDS) {
    const d = haversineKm(lat, lng, row.lat, row.lng);
    if (d < bestDist) {
      bestDist = d;
      best = row;
    }
  }
  return normalizeLocation(
    {
      raw: best.label,
      city: best.city,
      dong: best.dong,
      lat,
      lng,
      source: 'gps',
    },
    axis,
  );
}

/**
 * 네이버 Geocoder 또는 근접 매칭으로 역지오코딩
 * @param {number} lat
 * @param {number} lng
 * @param {LocationAxis} [axis]
 * @returns {Promise<CanonicalLocation>}
 */
export async function reverseGeocodeCoords(lat, lng, axis = 'room') {
  const naverResult = await tryNaverReverseGeocode(lat, lng);
  if (naverResult) {
    const canonical = normalizeLocation(
      {
        ...naverResult,
        lat,
        lng,
        source: 'gps',
      },
      axis,
    );
    logLocationDebug('reverse-geocode', { provider: 'naver', canonical });
    return canonical;
  }
  const nearest = nearestRegionByCoords(lat, lng, axis);
  logLocationDebug('reverse-geocode', { provider: 'nearest-fallback', canonical: nearest });
  return nearest;
}

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ raw: string, city?: string, district?: string, dong?: string }|null>}
 */
async function tryNaverReverseGeocode(lat, lng) {
  try {
    const w = /** @type {any} */ (window);
    const naver = w.naver;
    if (!naver?.maps?.Service?.reverseGeocode || !naver.maps.LatLng) return null;

    return await new Promise((resolve) => {
      try {
        naver.maps.Service.reverseGeocode(
          {
            coords: new naver.maps.LatLng(lat, lng),
            orders: [naver.maps.Service.OrderType.ADDR, naver.maps.Service.OrderType.ROAD_ADDR].join(','),
          },
          (status, response) => {
            if (status !== naver.maps.Service.Status.OK) {
              resolve(null);
              return;
            }
            const result = response?.v2?.results?.[0];
            const region = result?.region;
            const city = blank(region?.area1?.name);
            const district = blank(region?.area2?.name);
            const dong = blank(region?.area3?.name);
            const raw = [city, district, dong].filter(Boolean).join(' ');
            if (!raw) {
              resolve(null);
              return;
            }
            resolve({ raw, city, district, dong });
          },
        );
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

/**
 * @param {{
 *   sessionSelected?: string|Partial<CanonicalLocation>|null,
 *   savedDefault?: string|Partial<CanonicalLocation>|null,
 *   gps?: string|Partial<CanonicalLocation>|null,
 *   fallback?: string|Partial<CanonicalLocation>|null,
 * }} sources
 * @param {LocationAxis} [axis]
 * @returns {CanonicalLocation}
 */
export function resolveLocationByPriority(sources, axis = 'room') {
  /** @type {Array<[LocationSource, unknown]>} */
  const order = [
    ['url', sources?.sessionSelected],
    ['saved', sources?.savedDefault],
    ['gps', sources?.gps],
    ['fallback', sources?.fallback],
  ];
  for (const [source, value] of order) {
    if (value == null || value === '') continue;
    const canonical =
      typeof value === 'string'
        ? normalizeLocation({ raw: value, source }, axis)
        : normalizeLocation({ ...value, source: value.source || source }, axis);
    if (canonical.displayLabel && canonical.displayLabel !== '위치 확인 중') {
      // sessionSelected 가 URL이면 source=url, 그 외 직접선택은 session 으로 올 수 있음
      if (source === 'url' && canonical.source === 'url') {
        /* keep */
      } else if (!canonical.source || canonical.source === 'url') {
        canonical.source = source === 'url' ? 'session' : source;
      }
      logLocationDebug('resolve', { axis, source: canonical.source, canonical });
      return canonical;
    }
  }
  const empty = normalizeLocation({ raw: '', source: 'fallback' }, axis);
  empty.displayLabel = axis === 'tutor' ? '서울시' : '위치 확인 중';
  const fbCoords = coordsFromLabel(empty.displayLabel);
  if (fbCoords) {
    empty.lat = fbCoords.lat;
    empty.lng = fbCoords.lng;
  }
  logLocationDebug('resolve-fallback', { axis, canonical: empty });
  return empty;
}

/** @returns {Promise<{ lat: number, lng: number }|null>} */
export function tryBrowserGps() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      logLocationDebug('gps-fail', { reason: 'unsupported' });
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        logLocationDebug('gps-ok', coords);
        resolve(coords);
      },
      (err) => {
        logLocationDebug('gps-fail', { reason: err?.message || 'denied' });
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
    );
  });
}

/**
 * @param {'room'|'tutor'|'student'} tab
 * @param {'tutor'|'study_room'|null} [studentHope]
 */
export function axisFromSearchTab(tab, studentHope = null) {
  if (tab === 'tutor') return 'tutor';
  if (tab === 'room') return 'room';
  if (studentHope === 'tutor') return 'tutor';
  return 'study_room';
}

/** @param {string} label @param {LocationAxis} [axis] */
export function toDisplayLabel(label, axis = 'room') {
  return formatLocationDisplay(label, axis);
}

/** @param {CanonicalLocation|null|undefined} a @param {CanonicalLocation|null|undefined} b */
export function sameCanonical(a, b) {
  if (!a || !b) return false;
  if (a.regionKey && b.regionKey && a.regionKey === b.regionKey) return true;
  return blank(a.displayLabel) === blank(b.displayLabel);
}

/** URL/세션용 직렬화 */
export function serializeCanonical(c) {
  if (!c) return null;
  return {
    displayLabel: c.displayLabel,
    regionKey: c.regionKey,
    regionId: c.regionId,
    lat: c.lat,
    lng: c.lng,
    city: c.city,
    district: c.district,
    dong: c.dong,
    apartmentName: c.apartmentName,
    source: c.source,
    axis: c.axis,
    level: c.level,
  };
}

/** @param {unknown} raw @param {LocationAxis} [axis] */
export function deserializeCanonical(raw, axis = 'room') {
  if (!raw || typeof raw !== 'object') return null;
  return normalizeLocation(/** @type {any} */ (raw), axis);
}

/**
 * @param {string} event
 * @param {Record<string, unknown>} payload
 */
export function logLocationDebug(event, payload) {
  try {
    const enabled =
      (typeof localStorage !== 'undefined' && localStorage.getItem('study114-loc-debug') === '1') ||
      (typeof window !== 'undefined' && /** @type {any} */ (window).__STUDY114_LOC_DEBUG__);
    if (!enabled) return;
    // eslint-disable-next-line no-console
    console.debug(`[location:${event}]`, payload);
  } catch {
    /* ignore */
  }
}
