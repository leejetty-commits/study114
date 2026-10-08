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

const CITY_SUFFIX = /(특별자치시|특별시|광역시|특별자치도|자치도|시|도)$/;

/**
 * GPS로 받은 넓은 지역 이름을 구 이름으로 쓰지 않기 위한 집합.
 * 회원이 저장한 광역 이름(예: 서울특별시) 표시에는 쓰지 않는다.
 */
const BROAD_REGION_ONLY = new Set([
  '서울',
  '서울특별시',
  '부산',
  '부산광역시',
  '대구',
  '대구광역시',
  '인천',
  '인천광역시',
  '광주',
  '광주광역시',
  '대전',
  '대전광역시',
  '울산',
  '울산광역시',
  '세종',
  '세종특별자치시',
  '경기',
  '경기도',
  '강원',
  '강원도',
  '강원특별자치도',
  '충북',
  '충청북도',
  '충남',
  '충청남도',
  '전북',
  '전라북도',
  '전남',
  '전라남도',
  '경북',
  '경상북도',
  '경남',
  '경상남도',
  '제주',
  '제주도',
  '제주특별자치도',
]);

/** @param {string} token */
function isBroadRegionOnly(token) {
  const text = blank(token).replace(/\s+/g, '');
  if (!text) return false;
  if (BROAD_REGION_ONLY.has(text)) return true;
  return /도$/.test(text) && !/시$/.test(text);
}

/** GPS가 구 없이 광역·광역시 줄임만 준 경우. 저장값 표시에는 쓰지 않는다. */
function isGpsBroadToken(token) {
  const text = blank(token).replace(/\s+/g, '');
  if (!text || isBroadRegionOnly(text)) return Boolean(text);
  return (
    text === '서울시' ||
    text === '부산시' ||
    text === '대구시' ||
    text === '인천시' ||
    text === '광주시' ||
    text === '대전시' ||
    text === '울산시'
  );
}

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
    if (/구$/.test(only)) {
      return { province: '', city: '', district: only, dong: '', apartmentName: '' };
    }
    if (isBroadRegionOnly(only)) {
      return { province: only, city: '', district: '', dong: '', apartmentName: '' };
    }
    if (CITY_SUFFIX.test(only) || /시$/.test(only) || /군$/.test(only)) {
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
  const guTail = [];
  const dongTail = [];
  for (const token of parts.slice(2)) {
    if (/구$/.test(token) && !/동$/.test(token)) guTail.push(token);
    else dongTail.push(token);
  }
  return {
    province: '',
    city: parts[0],
    district: [parts[1], ...guTail].join(' '),
    dong: dongTail.join(' '),
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
  // 동·단지가 없는 공부방 축의 검색 범위 키는 11b0c0d 와 같이 비운다. 화면 표시만 시군구·세종을 채운다.
  canonical.searchScopeLabel =
    (axis === 'room' || axis === 'study_room') && !blank(canonical.dong) && !blank(canonical.apartmentName)
      ? ''
      : canonical.displayLabel;
  canonical.regionKey = blank(input.regionKey) || buildRegionKey(canonical);
  // 세종은 시·군·구 단위가 없다. 표시만 채우고 regionKey 는 parts 가 비면 빈 값으로 둔다.
  if (
    (axis === 'room' || axis === 'study_room') &&
    !blank(input.regionKey) &&
    canonical.displayLabel === '세종특별자치시' &&
    !blank(canonical.city) &&
    !blank(canonical.district) &&
    !blank(canonical.dong) &&
    !blank(canonical.apartmentName)
  ) {
    canonical.regionKey = '';
  }

  if (canonical.lat == null || canonical.lng == null) {
    const fromLabel = coordsFromLabel(canonical.displayLabel || raw);
    if (fromLabel) {
      canonical.lat = fromLabel.lat;
      canonical.lng = fromLabel.lng;
    }
  }

  return canonical;
}

/** 같은 시·구·동 토큰이 이어 붙으며 「서울특별시 서울특별시」처럼 반복되는 표시를 접는다. */
function dedupeAddressTokens(text) {
  const parts = String(text || '').split(/\s+/).filter(Boolean);
  const out = [];
  const seen = new Set();
  for (const part of parts) {
    if (seen.has(part)) continue;
    seen.add(part);
    out.push(part);
  }
  return out.join(' ');
}

/**
 * 과외 축 표시. 시도·시·군·구를 유지하고 동은 뺀다.
 * GPS이고 토큰이 전부 광역이면 빈 값. 저장값은 광역 이름만 있어도 그대로 둔다.
 * @param {Partial<CanonicalLocation>} loc
 */
function tutorAxisLabel(loc) {
  const tokens = [];
  const push = (value) => {
    for (const token of blank(value).split(/\s+/)) {
      if (!token || tokens.includes(token)) continue;
      if (/동$/.test(token) && !/구$/.test(token)) continue;
      tokens.push(token);
    }
  };
  push(loc.province);
  push(loc.city);
  push(loc.district);
  push(loc.dong);
  if (!tokens.length) push(loc.raw || loc.displayLabel);
  if (loc.source === 'gps' && tokens.length > 0 && tokens.every((token) => isGpsBroadToken(token))) {
    return '';
  }
  return tokens.join(' ');
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
    return tutorAxisLabel(loc);
  }

  if (apartmentName && !isBroadRegionOnly(apartmentName)) {
    return dong && !isBroadRegionOnly(dong) ? `${dong} · ${apartmentName}` : apartmentName;
  }
  if (dong && city && String(dong).startsWith(city)) return dedupeAddressTokens(dong);
  if (dong && district && city) return dedupeAddressTokens(`${city} ${district} ${dong}`);
  if (dong && city) return dedupeAddressTokens(`${city} ${dong}`);
  if (dong) return dedupeAddressTokens(dong);
  const cityLabel = blank(city);
  const districtLabel = blank(district);
  if (cityLabel && districtLabel) return dedupeAddressTokens(`${cityLabel} ${districtLabel}`);
  const provinceLabel = blank(loc.province);
  if (provinceLabel === '세종특별자치시' || cityLabel === '세종특별자치시') return '세종특별자치시';
  return '';
}

/**
 * 현재위치 한 줄. 공부방은 동·아파트, 과외쌤·학생은 시·군.
 * 광역만 있으면 빈 문자열.
 * @param {CanonicalLocation|Partial<CanonicalLocation>|string} loc
 * @param {LocationAxis|'student'} [axis]
 */
export function placeCaption(loc, axis = 'room') {
  const useTutor = axis === 'tutor' || axis === 'student';
  const canonical =
    typeof loc === 'string' || loc == null
      ? normalizeLocation({ raw: loc || '' }, useTutor ? 'tutor' : 'room')
      : loc;
  if (useTutor) return formatLocationDisplay(canonical, 'tutor');
  const apt = blank(canonical.apartmentName);
  const dong = blank(canonical.dong);
  if (apt && !isBroadRegionOnly(apt)) return dong && !isBroadRegionOnly(dong) ? `${dong} · ${apt}` : apt;
  if (dong && !isBroadRegionOnly(dong)) return dong;
  const districtCaption = formatLocationDisplay(canonical, 'room');
  if (districtCaption && !blank(canonical.dong) && !blank(canonical.apartmentName)) return districtCaption;
  return '';
}

/** 지역 이름만으로 좌표를 만들지 않는다. regions 에 좌표가 없다. */
export function coordsFromLabel() {
  return null;
}

/**
 * 역지오코딩이 실패하면 좌표만 남기고 지역 이름은 비운다.
 * @param {number} lat
 * @param {number} lng
 * @param {LocationAxis} [axis]
 * @returns {CanonicalLocation}
 */
export function nearestRegionByCoords(lat, lng, axis = 'room') {
  return normalizeLocation({ raw: '', lat, lng, source: 'gps' }, axis);
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
  empty.displayLabel = '';
  empty.lat = null;
  empty.lng = null;
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

/** 게스트 과외 기준 구. 프런트에 두는 지역 코드는 이 문자열 한 곳이다. */
export const GUEST_BASE_GU_OFFICIAL_CODE = '1168000000';

export const GUEST_PLACE_PROMPT = '위치를 선택해 주세요';

/** 로그인 회원에게 저장 지역이 정말 없을 때만. 게스트 안내문은 쓰지 않는다. */
export const STUDENT_PLACE_PROMPT = '마이페이지에서 희망지역을 등록해 주세요';
export const MEMBER_PLACE_PROMPT = '마이페이지에서 지역을 등록해 주세요';

/** @param {string} [role] */
export function memberPlacePrompt(role) {
  return role === 'parent' ? STUDENT_PLACE_PROMPT : MEMBER_PLACE_PROMPT;
}

/** 카카오 우편번호 result.sido 약칭 → 시·도 정식 이름. */
const KAKAO_SIDO_FULL = {
  서울: '서울특별시',
  부산: '부산광역시',
  대구: '대구광역시',
  인천: '인천광역시',
  광주: '광주광역시',
  대전: '대전광역시',
  울산: '울산광역시',
  세종: '세종특별자치시',
  경기: '경기도',
  강원: '강원특별자치도',
  충북: '충청북도',
  충남: '충청남도',
  전북: '전북특별자치도',
  전남: '전라남도',
  경북: '경상북도',
  경남: '경상남도',
  제주: '제주특별자치도',
};

/** @param {unknown} sido */
export function expandKakaoSido(sido) {
  const text = blank(sido);
  return KAKAO_SIDO_FULL[text] || text;
}

/** 게스트 확정 표기. 서버 기준 행 이름을 못 받았거나 다르게 받아도 이 문구만 쓴다. */
export const GUEST_BASE_ROOM_LABEL = '대치동';
export const GUEST_BASE_TUTOR_LABEL = '서울시 강남구';

/** 게스트 표기 전용. 회원 저장 라벨·검색 요청값에는 쓰지 않는다. */
function guestSidoShort(sidoName) {
  const text = blank(sidoName);
  return text === '서울특별시' ? '서울시' : text;
}

/**
 * 시도+구를 「서울시 강남구」로 조합한다. 시도가 없거나 조합 결과가 확정 표기와 다르면 확정 표기.
 * @param {unknown} sidoName @param {unknown} guName
 */
function guestTutorLabel(sidoName, guName) {
  const sido = guestSidoShort(sidoName);
  const gu = blank(guName);
  const label = sido && gu ? `${sido} ${gu}` : '';
  return label === GUEST_BASE_TUTOR_LABEL ? label : GUEST_BASE_TUTOR_LABEL;
}

/** @type {{ room: string, tutor: string, student: string }} */
let guestBaseline = {
  room: GUEST_BASE_ROOM_LABEL,
  tutor: GUEST_BASE_TUTOR_LABEL,
  student: GUEST_BASE_TUTOR_LABEL,
};
/** @type {{ room: number|null, tutor: number|null, student: number|null }} */
let guestBaseIds = { room: null, tutor: null, student: null };
/** @type {{ studyRooms: number, tutors: number, studentRequests: number } | null} */
let guestAxisCounts = null;
/** @type {Promise<{ room: string, tutor: string, student: string }> | null} */
let guestBaselinePromise = null;

export function readGuestBaseline() {
  return guestBaseline;
}

/** region-stats 실수. 받지 못했으면 null (화면은 대시 유지). */
export function readGuestAxisCounts() {
  return guestAxisCounts;
}

/**
 * 게스트 목록 search.php 필터. guestAxisCounts 와 같은 기준 행 id.
 * id를 못 받았으면 null — 그 축은 지역 조건 없이 부르지 않는다.
 * @param {'room'|'study_room'|'tutor'|'student'} tab
 * @returns {Record<string, string>|null}
 */
export function guestScopeFilters(tab) {
  if (tab === 'room' || tab === 'study_room') {
    return guestBaseIds.room ? { region_id: String(guestBaseIds.room) } : null;
  }
  if (tab === 'tutor') {
    return guestBaseIds.tutor ? { tutor_region_id: String(guestBaseIds.tutor) } : null;
  }
  if (tab === 'student') {
    return guestBaseIds.student ? { preferred_region_id: String(guestBaseIds.student) } : null;
  }
  return null;
}

/** @param {unknown} value */
function positiveId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * 표기는 확정 문구만 낸다. 공부방은 「대치동」, 과외 문구는 cities 기준 구 행의 시도+구 → 「서울시 강남구」.
 * axes.tutor 는 표기에 쓰지 않는다. 기준 행 id는 region-stats regionIds. 학생 구 id만 cities 행으로 보충한다.
 */
export function loadGuestBaseline() {
  if (guestBaselinePromise) return guestBaselinePromise;
  guestBaselinePromise = Promise.all([
    fetchGuestJson('/api/search/region-stats.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: '{}',
    }),
    fetchGuestJson('/api/auth/regions.php?action=cities'),
  ])
    .then(([stats, citiesBody]) => {
      const statsOk = Boolean(stats && stats.ok === true);
      const ids = statsOk && stats.regionIds && typeof stats.regionIds === 'object' ? stats.regionIds : {};
      const cities = citiesBody && Array.isArray(citiesBody.cities) ? citiesBody.cities : [];
      const gu = cities.find((row) => String(row?.official_code || '') === GUEST_BASE_GU_OFFICIAL_CODE);
      const tutor = guestTutorLabel(gu?.sido_name, gu?.gu_name || gu?.city_name);
      // 과외쌤 기준은 과외 단위(서울특별시) id 라 구 행으로 보충하지 않는다.
      guestBaseIds = {
        room: positiveId(ids.room),
        tutor: positiveId(ids.tutor),
        student: positiveId(ids.student) ?? positiveId(gu?.id),
      };
      if (statsOk) {
        const counts = [stats.studyRooms, stats.tutors, stats.studentRequests].map(Number);
        guestAxisCounts = counts.every((n) => Number.isFinite(n))
          ? { studyRooms: counts[0], tutors: counts[1], studentRequests: counts[2] }
          : null;
      }
      guestBaseline = { room: GUEST_BASE_ROOM_LABEL, tutor, student: tutor };
      return guestBaseline;
    })
    .catch(() => guestBaseline);
  return guestBaselinePromise;
}

/** @param {string} url @param {RequestInit} [init] */
async function fetchGuestJson(url, init) {
  try {
    const res = await fetch(url, init || { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
