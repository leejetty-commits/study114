/**
 * 공부방·과외 찾기 — 컴팩트 검색 + 지역 피드 / 검색 결과 (search-ui · home #parent 공용)
 */

import { OPTION_LABELS } from './search-enums.js';
import {
  GUEST_DEFAULT_REGIONS,
  MOCK_REGIONS,
  MOCK_SUBJECTS,
  SEARCH_TABS,
  getTutorRegionLabel,
  MOCK_TUTOR_REGIONS,
} from './search-schema.js';
export { getTutorRegionLabel, MOCK_TUTOR_REGIONS } from './search-schema.js';
import { getRegionFeed, getStudentDemandForRegion } from './search-region-feed.js';
import { filterToProviderSelf } from './search-provider-self.js';
import {
  getStudyRoomHomeLiveItems,
  peekStudyRoomPromo1,
} from '@home-ui/study-room-home-seed.js';
import { isProviderSelfPreviewMode } from './search-role-access.js';
import { renderSearchMapBlock, bindSearchMapPinLinks } from './search-map.js';
import { renderSearchTierResults } from './search-tier-render.js';
import { collectFiltersFromForm, searchApi } from './search-api.js';
import { mapSearchResultsToExposure } from './search-exposure-mapper.js';
import { renderBrowseList } from '@home-ui/exposure-render.js';
import { SECTION_HEADINGS, renderSectionTitleBar } from '@home-ui/section-headings.js';
import {
  DEFAULT_STUDENT_HOPE_TYPE,
  renderHopeTypeGate,
  resolveHopeTypeFromQuery,
  writeStoredHopeType,
} from './student-hope-type.js';
import { resolveFindDefaultRegion, writeStoredHopeRegion } from '../../shared/student-hope-regions.js';
import { parseHashQuery } from '../../shared/preview-links.js';
import { bindListSortControls, readListSortFromHash } from '../../shared/list-sort.js';
import { setGuestListPage } from '@home-ui/state.js';
import { renderUniversityNameField } from '../../shared/korean-universities.js';
import {
  axisFromSearchTab,
  logLocationDebug,
  normalizeLocation,
  resolveLocationByPriority,
  reverseGeocodeCoords,
  tryBrowserGps,
  serializeCanonical,
  deserializeCanonical,
} from '../../shared/location-display.js';
import { openKakaoPostcode } from '../../shared/kakao-postcode.js';

const FILTERS_STORAGE_KEY = 'study114-find-filters-v1';
const CANONICAL_STORAGE_KEY = 'study114-find-canonical-v1';

/** 학생찾기 기본필터 `has_request_summary` — 체크박스 on/1/true */
function isRequestSummaryFilterOn(value) {
  if (Array.isArray(value)) return isRequestSummaryFilterOn(value[0]);
  return value === true || value === 1 || value === '1' || value === 'on' || value === 'true';
}

/** @param {Record<string, unknown>} filters */
function encodeFiltersForUrl(filters) {
  try {
    const compact = {};
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v == null || v === '') return;
      if (Array.isArray(v) && !v.length) return;
      compact[k] = v;
    });
    if (!Object.keys(compact).length) return '';
    return btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
  } catch {
    return '';
  }
}

/** @param {string} raw */
function decodeFiltersFromUrl(raw) {
  try {
    if (!raw) return null;
    const json = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** @param {import('./state.js').SearchTab} tab @param {Record<string, unknown>|null} filters */
function writeStoredFilters(tab, filters) {
  try {
    const prev = JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) || '{}');
    if (filters && Object.keys(filters).length) prev[tab] = filters;
    else delete prev[tab];
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(prev));
  } catch {
    /* ignore */
  }
}

/** @param {import('./state.js').SearchTab} tab */
function readStoredFilters(tab) {
  try {
    const prev = JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) || '{}');
    return prev[tab] && typeof prev[tab] === 'object' ? prev[tab] : null;
  } catch {
    return null;
  }
}

/** @param {import('./state.js').SearchTab} tab @param {import('../../shared/location-display.js').CanonicalLocation|null} c */
function writeStoredCanonical(tab, c) {
  try {
    const prev = JSON.parse(localStorage.getItem(CANONICAL_STORAGE_KEY) || '{}');
    if (c) prev[tab] = serializeCanonical(c);
    else delete prev[tab];
    localStorage.setItem(CANONICAL_STORAGE_KEY, JSON.stringify(prev));
  } catch {
    /* ignore */
  }
}

/** @param {import('./state.js').SearchTab} tab @param {import('../../shared/location-display.js').LocationAxis} axis */
function readStoredCanonical(tab, axis) {
  try {
    const prev = JSON.parse(localStorage.getItem(CANONICAL_STORAGE_KEY) || '{}');
    return deserializeCanonical(prev[tab], axis);
  } catch {
    return null;
  }
}

/**
 * CanonicalLocation → find state SSOT 주입
 * @param {FindSurfaceState} state
 * @param {import('../../shared/location-display.js').CanonicalLocation} canonical
 * @param {import('./state.js').SearchTab} [tab]
 */
export function applyCanonicalLocation(state, canonical, tab) {
  state.canonicalLocation = canonical;
  state.activeRegionLabel = canonical.displayLabel;
  // 홍보1 기본값(source=saved)은 게스트 찾기 대치동 저장값을 덮지 않는다.
  const promoSeed = canonical.source === 'saved' && state.role === 'study_room' && tab === 'room';
  if (tab && state.studyRoomHome !== true && !promoSeed) writeStoredCanonical(tab, canonical);
  logLocationDebug('apply-canonical', {
    source: canonical.source,
    displayLabel: canonical.displayLabel,
    lat: canonical.lat,
    lng: canonical.lng,
    regionKey: canonical.regionKey,
  });
}

/**
 * 찾기 URL에 검색상태·지역·필터·좌표를 반영
 * @param {FindSurfaceState} state
 * @param {import('./state.js').SearchTab} tab
 */
function syncFindHashState(state, tab) {
  try {
    const hash = window.location.hash.slice(1) || `/search/${tab}`;
    const qIdx = hash.indexOf('?');
    const path = (qIdx === -1 ? hash : hash.slice(0, qIdx)).replace(/^\//, '');
    const params = new URLSearchParams(qIdx === -1 ? '' : hash.slice(qIdx + 1));
    if (state.searchExecuted) params.set('searched', '1');
    else {
      params.delete('searched');
      params.delete('f');
    }
    const region = String(state.activeRegionLabel || state.canonicalLocation?.displayLabel || '').trim();
    if (region) params.set('region', region);
    else params.delete('region');

    const lat = state.canonicalLocation?.lat;
    const lng = state.canonicalLocation?.lng;
    if (lat != null && Number.isFinite(lat)) params.set('lat', String(lat));
    else params.delete('lat');
    if (lng != null && Number.isFinite(lng)) params.set('lng', String(lng));
    else params.delete('lng');

    if (state.searchExecuted && state.lastSearchFilters) {
      const encoded = encodeFiltersForUrl(state.lastSearchFilters);
      if (encoded) params.set('f', encoded);
      writeStoredFilters(tab, state.lastSearchFilters);
    }

    const qs = params.toString();
    const next = qs ? `#/${path}?${qs}` : `#/${path}`;
    if (window.location.hash !== next) {
      window.history.replaceState(null, '', next);
    }
    logLocationDebug('route-state', {
      tab,
      searched: state.searchExecuted,
      region,
      lat,
      lng,
      mapOverlay: region,
      listFetch: region,
      hasFilters: Boolean(state.lastSearchFilters && Object.keys(state.lastSearchFilters).length),
    });
  } catch {
    /* ignore */
  }
}

/**
 * URL/저장값으로 지역·검색상태 hydrate
 * @returns {{ needsSearchRestore: boolean }}
 */
export function hydrateFindStateFromHash(state, tab) {
  const q = parseHashQuery();
  const hope =
    state.studentHopeType === 'study_room' || state.studentHopeType === 'tutor'
      ? state.studentHopeType
      : DEFAULT_STUDENT_HOPE_TYPE;
  const axis = axisFromSearchTab(tab, hope === 'tutor' || hope === 'study_room' ? hope : null);
  const savedLabel =
    tab === 'student'
      ? resolveFindDefaultRegion(
          hope,
          hope === 'study_room' ? GUEST_DEFAULT_REGIONS.room : GUEST_DEFAULT_REGIONS.student,
        )
      : tab === 'tutor'
        ? getTutorRegionLabel(resolveTutorRegionIndex(state))
        : resolveFindDefaultRegion('study_room', GUEST_DEFAULT_REGIONS.room);
  const fallback =
    tab === 'room' ? MOCK_REGIONS.room : tab === 'tutor' ? MOCK_REGIONS.tutor : MOCK_REGIONS.student;

  const storedCanon = readStoredCanonical(tab, axis);
  const viewerRole = state.role || 'guest';
  const promo = viewerRole === 'study_room' && tab === 'room' ? peekStudyRoomPromo1() : '';
  const urlPinned = Boolean(String(q.region || '').trim());
  const addressPinned =
    state.canonicalLocation?.source === 'address' || storedCanon?.source === 'address';
  const promoDefault = Boolean(promo) && !urlPinned && !addressPinned;
  /** @type {Partial<import('../../shared/location-display.js').CanonicalLocation>|string|null} */
  let sessionSelected = null;
  if (q.region) {
    sessionSelected = {
      raw: q.region,
      lat: q.lat != null && q.lat !== '' ? Number(q.lat) : null,
      lng: q.lng != null && q.lng !== '' ? Number(q.lng) : null,
      source: 'url',
    };
  } else if (addressPinned) {
    sessionSelected =
      state.canonicalLocation?.source === 'address' ? state.canonicalLocation : storedCanon;
  } else if (!promoDefault && state.canonicalLocation?.displayLabel) {
    sessionSelected = { ...state.canonicalLocation, source: state.canonicalLocation.source || 'session' };
  } else if (
    !promoDefault &&
    (storedCanon?.source === 'session' || storedCanon?.source === 'gps')
  ) {
    sessionSelected = storedCanon;
  }

  const canonical = resolveLocationByPriority(
    {
      sessionSelected,
      savedDefault: promoDefault
        ? { raw: promo, source: 'saved' }
        : storedCanon?.source === 'saved'
          ? storedCanon
          : savedLabel || null,
      gps: null,
      fallback: promoDefault ? promo : fallback,
    },
    axis,
  );
  applyCanonicalLocation(state, canonical, tab);

  let needsSearchRestore = false;
  const urlFilters = q.f ? decodeFiltersFromUrl(q.f) : null;
  const storedFilters = readStoredFilters(tab);
  const wantsSearch = q.searched === '1' || q.searched === 'true';
  /** @type {Record<string, string|string[]>|null} */
  let filters = null;
  if (urlFilters && Object.keys(urlFilters).length) {
    // URL f payload 최우선
    filters = urlFilters;
  } else if (wantsSearch) {
    // searched=1 이고 f 없음: localStorage 보조 조건 + 지역은 항상 CanonicalLocation
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
  }
  if (wantsSearch && filters && Object.keys(filters).length) {
    state.searchExecuted = true;
    state.lastSearchFilters = filters;
    const restoreKey = `${tab}::${encodeFiltersForUrl(filters)}::${canonical.displayLabel}`;
    // 동일 URL·필터는 1회만 재검색 (매 렌더 루프 방지)
    if (state._restoredSearchKey !== restoreKey) {
      state._needsSearchRestore = true;
      needsSearchRestore = true;
      if (tab === 'student') {
        state.hasRequestSummary = isRequestSummaryFilterOn(filters.has_request_summary);
      }
    } else {
      state._needsSearchRestore = false;
    }
  } else if (!wantsSearch) {
    state._needsSearchRestore = false;
    state._restoredSearchKey = null;
    // URL에 searched 없으면 검색 상태 해제 (탭 전환·히스토리 정합). 지역 SSOT는 유지.
    if (state.searchExecuted && !state.searchLoading) {
      state.searchExecuted = false;
      state.lastSearchFilters = null;
      state.hasRequestSummary = false;
      state.searchExposureItems = [];
      state.searchTotal = 0;
      state.searchError = null;
      state.searchRows = [];
      state.searchItems = [];
      state.activeResultSource = null;
    }
  }

  logLocationDebug('hydrate', {
    tab,
    axis,
    query: q,
    canonical,
    needsSearchRestore,
    filterKeys: filters ? Object.keys(filters) : [],
  });
  return { needsSearchRestore };
}

/**
 * GPS 허용 시 좌표→역지오코딩→CanonicalLocation→UI 동기화
 * URL/직접선택(session/address)보다 우선하지 않음
 */
export async function bootFindGpsIfNeeded(state, tab, rerender) {
  if (state._gpsBootedTab === tab) return;
  state._gpsBootedTab = tab;
  const source = state.canonicalLocation?.source;
  // 우선순위: URL / session·address / saved > GPS > fallback
  if (
    source === 'url' ||
    source === 'session' ||
    source === 'address' ||
    source === 'saved' ||
    source === 'gps'
  ) {
    logLocationDebug('gps-skip', { reason: 'higher-priority-source', source });
    return;
  }
  if (state.searchExecuted) {
    logLocationDebug('gps-skip', { reason: 'search-executed' });
    return;
  }

  const coords = await tryBrowserGps();
  if (!coords) return;

  const hope =
    state.studentHopeType === 'study_room' || state.studentHopeType === 'tutor'
      ? state.studentHopeType
      : null;
  const axis = axisFromSearchTab(tab, hope);
  const geo = await reverseGeocodeCoords(coords.lat, coords.lng, axis);
  const curSource = state.canonicalLocation?.source;
  if (
    curSource === 'url' ||
    curSource === 'session' ||
    curSource === 'address' ||
    curSource === 'saved' ||
    state.searchExecuted
  ) {
    logLocationDebug('gps-skip', { reason: 'state-changed-during-gps', curSource });
    return;
  }
  applyCanonicalLocation(state, geo, tab);
  if (tab === 'student' || tab === 'room') {
    writeStoredHopeRegion(tab === 'room' ? 'study_room' : hope || 'study_room', geo.displayLabel);
  }
  syncFindHashState(state, tab);
  const role = /** @type {import('./state.js').ViewerRole} */ (
    /** @type {any} */ (state).role || 'guest'
  );
  refreshActiveResultItems(tab, state, role);
  rerender();
}

/**
 * @typedef {object} FindSurfaceState
 * @property {boolean} expanded
 * @property {boolean} searchExecuted
 * @property {boolean} searchLoading
 * @property {string|null} searchError
 * @property {number} searchTotal
 * @property {object[]} searchExposureItems
 * @property {object[]} [activeResultItems]
 * @property {'region'|'search'|null} [activeResultSource]
 * @property {string} [activeRegionLabel]
 * @property {number} [tutorRegionIndex] — 희망 과외 지역 0~2
 * @property {string} [studentLessonFormat]
 * @property {object[]} [searchRows]
 * @property {object[]} [searchItems]
 * @property {boolean} [homeSelf] — 홈 자기 노출 탭 (과외쌤 우리동네 과외쌤 등)
 * @property {'tutor'|'study_room'|null} [studentHopeType] — 학생찾기 희망 유형
 * @property {boolean} [hopeTypeResolved] — 희망 유형 선택/복원 완료
 * @property {import('../../shared/location-display.js').CanonicalLocation|null} [canonicalLocation]
 * @property {Record<string, string|string[]>|null} [lastSearchFilters]
 * @property {boolean} [hasRequestSummary] — 학생찾기 기본필터 한 줄 요청문 있음
 * @property {boolean} [_needsSearchRestore]
 * @property {string|null} [_gpsBootedTab]
 * @property {import('./state.js').ViewerRole} [role]
 */

/**
 * 검색 전 region feed / 검색 후 search result → 단일 SSOT
 * @param {import('./state.js').SearchTab} tab
 * @param {FindSurfaceState} state
 */
/** @param {FindSurfaceState} state */
function resolveTutorRegionIndex(state) {
  const idx = state.tutorRegionIndex ?? 0;
  return idx >= 0 && idx < MOCK_TUTOR_REGIONS.length ? idx : 0;
}

/** @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state @param {import('./state.js').ViewerRole} role */
function regionFeedContext(tab, state, role) {
  const ctx = { role, homeSelf: state.homeSelf === true, studyRoomHome: state.studyRoomHome === true };
  const promoFind = role === 'study_room' && tab === 'room' && state.studyRoomHome !== true;
  if ((ctx.studyRoomHome || promoFind) && tab === 'room') {
    const live = getStudyRoomHomeLiveItems();
    ctx.liveItems = Array.isArray(live) ? live : [];
    ctx.promoFind = promoFind;
  }
  if (tab === 'tutor') {
    ctx.tutorRegionIndex = resolveTutorRegionIndex(state);
  }
  if (tab === 'student' && (state.studentHopeType === 'tutor' || state.studentHopeType === 'study_room')) {
    ctx.hopeType = state.studentHopeType;
  }
  return ctx;
}

/** @param {FindSurfaceState} state */
function resolveHomeSelf(state) {
  return state.homeSelf === true;
}

/** @param {FindSurfaceState} state */
function resolveResultSource(state) {
  if (state.searchLoading || state.searchError || state.searchExecuted) {
    return state.activeResultSource || 'search';
  }
  return state.activeResultSource || 'region';
}

/** @param {FindSurfaceState} state */
function resultDebugAttrs(state) {
  return `data-result-source="${esc(resolveResultSource(state))}" data-result-items="activeResultItems"`;
}

/** @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state */
function locationAxisForState(tab, state) {
  const hope =
    state.studentHopeType === 'study_room' || state.studentHopeType === 'tutor'
      ? state.studentHopeType
      : null;
  return axisFromSearchTab(tab, hope);
}

/** @param {string} label @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state */
function canonicalRegionLabel(label, tab, state) {
  const axis = locationAxisForState(tab, state);
  const prev = state.canonicalLocation;
  const canonical = normalizeLocation(
    {
      raw: label,
      lat: prev?.displayLabel === String(label || '').trim() ? prev.lat : null,
      lng: prev?.displayLabel === String(label || '').trim() ? prev.lng : null,
      source: prev?.source || 'session',
    },
    axis,
  );
  // 같은 라벨이면 기존 좌표·source 유지
  if (prev && prev.displayLabel === canonical.displayLabel) {
    canonical.lat = prev.lat ?? canonical.lat;
    canonical.lng = prev.lng ?? canonical.lng;
    canonical.source = prev.source || canonical.source;
    canonical.regionKey = prev.regionKey || canonical.regionKey;
  }
  applyCanonicalLocation(state, canonical, tab);
  logLocationDebug('ui-label', { tab, axis, raw: label, display: canonical.displayLabel, lat: canonical.lat });
  return canonical.displayLabel;
}

/** 로그인 공부방 찾기 기본 지역. 개설 region_label·대치 목업은 쓰지 않는다. */
function seedStudyRoomPromoLabel(state, tab) {
  const promo = peekStudyRoomPromo1();
  if (!promo) return '';
  const canonical = normalizeLocation({ raw: promo, source: 'saved' }, 'room');
  canonical.source = 'saved';
  applyCanonicalLocation(state, canonical, tab);
  return canonical.displayLabel;
}

/** @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state @param {import('./state.js').ViewerRole} [role] */
export function resolveActiveRegionLabel(tab, state, role) {
  const viewer = role || state.role || 'guest';
  const promoFind =
    viewer === 'study_room' &&
    tab === 'room' &&
    state.studyRoomHome !== true &&
    !state.searchExecuted;
  if (promoFind) {
    const pinned =
      state.canonicalLocation?.source === 'address' || state.canonicalLocation?.source === 'url';
    if (!pinned) {
      const seeded = seedStudyRoomPromoLabel(state, tab);
      if (seeded) return seeded;
    }
  }
  const promoHome =
    state.studyRoomHome === true &&
    !state.searchExecuted &&
    (tab === 'room' || tab === 'student');
  if (promoHome) {
    const pinned =
      state.canonicalLocation?.source === 'address' || state.canonicalLocation?.source === 'url';
    const promo = peekStudyRoomPromo1();
    if (!pinned && promo) {
      return canonicalRegionLabel(promo, tab, state);
    }
    if (!pinned && tab === 'room') {
      const kept =
        state.activeRegionLabel && !/대치/.test(state.activeRegionLabel) ? state.activeRegionLabel : '';
      return canonicalRegionLabel(kept, tab, state);
    }
  }
  // 세션/URL에서 이미 잡힌 값이 있으면 최우선 (MOCK으로 덮지 않음)
  if (state.activeRegionLabel) {
    return canonicalRegionLabel(state.activeRegionLabel, tab, state);
  }
  if (tab === 'tutor') {
    return canonicalRegionLabel(getTutorRegionLabel(resolveTutorRegionIndex(state)), tab, state);
  }
  if (tab === 'room') return canonicalRegionLabel(MOCK_REGIONS.room, tab, state);
  const hope =
    state.studentHopeType === 'study_room' || state.studentHopeType === 'tutor'
      ? state.studentHopeType
      : DEFAULT_STUDENT_HOPE_TYPE;
  const guestFallback =
    hope === 'study_room' ? GUEST_DEFAULT_REGIONS.room : GUEST_DEFAULT_REGIONS.student;
  return canonicalRegionLabel(resolveFindDefaultRegion(hope, guestFallback), tab, state);
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {Record<string, unknown>} filters
 * @param {FindSurfaceState} state
 */
function regionLabelFromFilters(tab, filters, state) {
  let raw = '';
  if (tab === 'tutor') {
    raw = String(filters.tutor_region_id || filters.tutor_region_label || '').trim();
    if (!raw) raw = getTutorRegionLabel(resolveTutorRegionIndex(state));
  } else if (tab === 'room') {
    raw =
      String(filters.region_label || filters.region_id || '').trim() ||
      (state.role === 'study_room' ? peekStudyRoomPromo1() : '') ||
      MOCK_REGIONS.room;
  } else {
    raw = String(
      filters.preferred_region_label || filters.preferred_region || filters.region_label || '',
    ).trim();
    if (!raw) {
      const hope =
        state.studentHopeType === 'study_room' || state.studentHopeType === 'tutor'
          ? state.studentHopeType
          : DEFAULT_STUDENT_HOPE_TYPE;
      const guestFallback =
        hope === 'study_room' ? GUEST_DEFAULT_REGIONS.room : GUEST_DEFAULT_REGIONS.student;
      raw = resolveFindDefaultRegion(hope, guestFallback);
    }
  }
  return canonicalRegionLabel(raw, tab, state);
}

/**
 * @param {string} regionLabel
 * @param {{ guest?: boolean, viewerRole?: string, hopeType?: 'tutor'|'study_room'|null }} opts
 */
function renderStudentDemandBlock(regionLabel, opts = {}) {
  const hopeType = opts.hopeType ?? DEFAULT_STUDENT_HOPE_TYPE;
  const items = getStudentDemandForRegion(regionLabel, { hopeType, limit: 6 });
  if (!items.length) {
    return `
      <section class="search-student-demand" aria-label="해당 지역 학생 수요">
        ${renderSectionTitleBar({ ...SECTION_HEADINGS.students, locationLabel: regionLabel })}
        <p class="search-results__hint">이 지역에 표시할 학생 수요가 없습니다.</p>
      </section>`;
  }
  return `
    <section class="search-student-demand" aria-label="해당 지역 학생 수요">
      ${renderSectionTitleBar({ ...SECTION_HEADINGS.students, locationLabel: regionLabel })}
      <p class="search-results__hint">블라인드 · 시장 수요 참고 · 학생 간 쪽지 불가</p>
      ${renderBrowseList('student', items, {
        guest: opts.guest,
        viewerRole: opts.viewerRole,
        sourceRoute: 'search',
      })}
    </section>`;
}

/** @param {FindSurfaceState} state */
export function ensureStudentHopeType(state) {
  if (state.hopeTypeResolved && (state.studentHopeType === 'tutor' || state.studentHopeType === 'study_room')) {
    return state.studentHopeType;
  }
  const fromQuery = resolveHopeTypeFromQuery(parseHashQuery());
  if (fromQuery) {
    state.studentHopeType = fromQuery;
    state.hopeTypeResolved = true;
    return fromQuery;
  }
  state.studentHopeType = null;
  state.hopeTypeResolved = false;
  return null;
}

/** @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state @param {import('./state.js').ViewerRole} role */
export function refreshActiveResultItems(tab, state, role) {
  if (!state.searchExecuted) {
    const regionLabel = resolveActiveRegionLabel(tab, state, role);
    const { items, regionLabel: feedLabel } = getRegionFeed(tab, {
      ...regionFeedContext(tab, state, role),
      regionLabel,
    });
    state.activeResultItems = items;
    state.activeResultSource = 'region';
    // feed가 돌려준 라벨과 동일 축으로 정규화 — MOCK 덮어쓰기 금지
    state.activeRegionLabel = canonicalRegionLabel(feedLabel || regionLabel, tab, state);
    logLocationDebug('list-fetch', {
      tab,
      mode: 'region',
      region: state.activeRegionLabel,
      count: items.length,
    });
    return items;
  }

  if (state.searchLoading) {
    return state.activeResultItems || [];
  }

  if (state.searchError) {
    state.activeResultItems = [];
    state.activeResultSource = 'search';
    return [];
  }

  const homeSelf = resolveHomeSelf(state);
  state.activeResultItems = filterToProviderSelf(tab, role, state.searchExposureItems || [], homeSelf);
  state.activeResultSource = 'search';
  state.activeRegionLabel = isProviderSelfPreviewMode(tab, role, homeSelf)
    ? canonicalRegionLabel(state.activeResultItems[0]?.location_label || '', tab, state)
    : resolveActiveRegionLabel(tab, state, role);
  logLocationDebug('list-fetch', {
    tab,
    mode: 'search',
    region: state.activeRegionLabel,
    count: state.activeResultItems.length,
  });
  return state.activeResultItems;
}

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/** @param {FindSurfaceState} state @param {HTMLFormElement} [form] @param {{ keepTutorRegion?: boolean }} [options] */
export function resetFindSurface(state, form, options = {}) {
  const tutorRegionIndex = state.tutorRegionIndex ?? 0;
  const keptCanonical = state.canonicalLocation;
  state.expanded = false;
  state.searchExecuted = false;
  state.searchLoading = false;
  state.searchError = null;
  state.searchTotal = 0;
  state.searchExposureItems = [];
  state.activeResultItems = [];
  state.activeResultSource = null;
  state.lastSearchFilters = null;
  state.hasRequestSummary = false;
  state._needsSearchRestore = false;
  state._restoredSearchKey = null;
  // 지역 SSOT는 유지 — 검색만 초기화
  if (keptCanonical) {
    state.canonicalLocation = keptCanonical;
    state.activeRegionLabel = keptCanonical.displayLabel;
  } else {
    state.activeRegionLabel = '';
    state.canonicalLocation = null;
  }
  if (state.searchRows) state.searchRows = [];
  if (state.searchItems) state.searchItems = [];
  if (state.studentLessonFormat !== undefined) state.studentLessonFormat = 'one_on_one';
  if (form instanceof HTMLFormElement) {
    form.reset();
  }
  if (options.keepTutorRegion !== false && state.tutorRegionIndex !== undefined) {
    state.tutorRegionIndex = tutorRegionIndex;
  }
}


function renderChips(optionsKey, name) {
  const labels = OPTION_LABELS[optionsKey] || {};
  return Object.entries(labels)
    .map(
      ([value, label]) => `
        <label class="search-chip">
          <input type="checkbox" name="${esc(name)}" value="${esc(value)}" />
          <span>${esc(label)}</span>
        </label>`,
    )
    .join('');
}

/**
 * @param {FindSurfaceState} state
 * @returns {'tutor'|'study_room'}
 */
function resolveStudentSearchHope(state) {
  if (state.studentHopeType === 'study_room' || state.studentHopeType === 'tutor') {
    return state.studentHopeType;
  }
  // 7.18: 학생찾기 기본은 과외쌤 맥락(시)
  return 'tutor';
}

/**
 * 희망 유형에 따른 지역 입력축 — 공부방=동/단지, 과외쌤(·both)=시
 * @param {FindSurfaceState} state
 * @param {string} [lessonTypeValue]
 */
function resolveStudentRegionInput(state, lessonTypeValue) {
  const raw = String(lessonTypeValue || state.studentHopeType || '').trim();
  if (raw === 'study_room') return 'region';
  return 'city';
}

/**
 * @param {import('./search-schema.js').SEARCH_TABS.room.fields[0]} field
 * @param {FindSurfaceState} state
 * @param {{ compact?: boolean }} [opts]
 */
function renderField(field, state, opts = {}) {
  const compact = opts.compact === true;
  if (field.groupOnly && state.studentLessonFormat !== 'group') {
    return '';
  }

  const dbHint = compact
    ? ''
    : `<span class="search-field__db" title="DB">${esc(field.db)}</span>`;
  const name = `f_${field.key}`;

  if (field.input === 'select') {
    const selected =
      field.key === 'lesson_format' && field.optionsKey === 'lesson_format'
        ? state.studentLessonFormat
        : field.key === 'preferred_lesson_type'
          ? resolveStudentSearchHope(state)
          : '';
    const selectOpts = Object.entries(OPTION_LABELS[field.optionsKey] || {})
      .map(
        ([value, label]) =>
          `<option value="${esc(value)}" ${selected === value ? 'selected' : ''}>${esc(label)}</option>`,
      )
      .join('');
    return `
      <label class="search-field${compact ? ' search-field--compact' : ''}">
        <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
        <select class="search-field__control" name="${esc(name)}" ${field.key === 'lesson_format' ? 'data-lesson-format-select' : ''}${field.key === 'preferred_lesson_type' ? ' data-preferred-lesson-type' : ''}>
          <option value="">선택</option>${selectOpts}
        </select>
      </label>`;
  }

  if (field.input === 'chips') {
    return `
      <fieldset class="search-field search-field--chips">
        <legend class="search-field__label">${esc(field.label)} ${dbHint}</legend>
        <div class="search-chip-group">${renderChips(field.optionsKey, name)}</div>
      </fieldset>`;
  }

  if (field.input === 'toggle') {
    const checked = field.key === 'has_request_summary' && state.hasRequestSummary ? ' checked' : '';
    const valueAttr = field.key === 'has_request_summary' ? ' value="1"' : '';
    return `
      <label class="search-field search-field--toggle${compact ? ' search-field--compact' : ''}">
        <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
        <input type="checkbox" class="search-field__toggle" name="${esc(name)}"${valueAttr}${checked} />
      </label>`;
  }

  if (field.input === 'range') {
    return `
      <div class="search-field search-field--range${compact ? ' search-field--compact' : ''}">
        <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
        <div class="search-range">
          <input type="number" class="search-field__control" name="${esc(name)}_min" placeholder="최소(원)" min="0" step="10000" />
          <span class="search-range__sep">~</span>
          <input type="number" class="search-field__control" name="${esc(name)}_max" placeholder="최대(원)" min="0" step="10000" />
        </div>
      </div>`;
  }

  if (field.input === 'subject') {
    return `
      <label class="search-field${compact ? ' search-field--compact' : ''}">
        <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
        <select class="search-field__control" name="${esc(name)}">
          <option value="">과목 선택</option>
          ${MOCK_SUBJECTS.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
        </select>
      </label>`;
  }

  if (field.input === 'university') {
    return renderUniversityNameField({
      variant: 'search',
      name,
      id: `search_${field.key}`,
      listId: `search_${field.key}_list`,
      labelHtml: `${esc(field.label)} ${dbHint}`,
      className: compact ? 'search-field--compact' : '',
    });
  }

  const inputKind =
    field.key === 'preferred_region'
      ? resolveStudentRegionInput(state)
      : field.input;
  const placeholders = {
    region: '동/행정동 · 단지',
    complex: '단지명',
    city: '시 (예: 서울시)',
    text: '입력',
  };

  const defaultRegion =
    field.key === 'preferred_region'
      ? String(
          state.lastSearchFilters?.preferred_region_label ||
            state.lastSearchFilters?.preferred_region ||
            resolveActiveRegionLabel('student', state) ||
            '',
        )
      : field.key === 'region_id'
        ? String(
            state.lastSearchFilters?.region_label ||
              state.lastSearchFilters?.region_id ||
              resolveActiveRegionLabel('room', state) ||
              '',
          )
        : field.key === 'tutor_region_id'
          ? String(
              state.lastSearchFilters?.tutor_region_label ||
                state.lastSearchFilters?.tutor_region_id ||
                resolveActiveRegionLabel('tutor', state) ||
                '',
            )
          : '';

  if (field.key === 'preferred_region' && inputKind === 'region') {
    return `
    <label class="search-field${compact ? ' search-field--compact' : ''}" data-student-region-field>
      <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
      <div class="search-field__address-row">
        <input type="text" class="search-field__control" name="${esc(name)}" value="${esc(defaultRegion)}" placeholder="${esc(placeholders.region)}" data-region-axis="region" readonly />
        <button type="button" class="btn btn--secondary btn--sm" data-action="find-region-address" data-region-field="preferred_region">주소찾기</button>
      </div>
      <span class="search-field__hint">주소찾기로 행정동·단지를 선택합니다. 자유입력만으로는 검색하지 않습니다.</span>
    </label>`;
  }

  if (field.key === 'region_id' || field.key === 'tutor_region_id') {
    const axis = field.key === 'tutor_region_id' ? 'city' : 'region';
    const ph = field.key === 'tutor_region_id' ? placeholders.city : placeholders.region;
    return `
    <label class="search-field${compact ? ' search-field--compact' : ''}" data-find-region-field="${esc(field.key)}">
      <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
      <div class="search-field__address-row">
        <input type="text" class="search-field__control" name="${esc(name)}" value="${esc(defaultRegion)}" placeholder="${esc(ph)}" data-region-axis="${esc(axis)}" readonly />
        <button type="button" class="btn btn--secondary btn--sm" data-action="find-region-address" data-region-field="${esc(field.key)}">주소찾기</button>
      </div>
      <span class="search-field__hint">주소찾기로 지역을 선택합니다.</span>
    </label>`;
  }

  return `
    <label class="search-field${compact ? ' search-field--compact' : ''}"${field.key === 'preferred_region' ? ' data-student-region-field' : ''}>
      <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
      <input type="text" class="search-field__control" name="${esc(name)}" value="${esc(defaultRegion)}" placeholder="${esc(placeholders[inputKind] || '')}" data-region-axis="${esc(inputKind)}" />
    </label>`;
}

function renderBasicRows(fields, state, compact = false) {
  const row1 = fields.filter((f) => f.basicRow === 1);
  const row2 = fields.filter((f) => f.basicRow === 2);
  if (compact) {
    const all = [...row1, ...row2];
    return `<div class="search-grid search-grid--compact search-grid--detail">${all.map((f) => renderField(f, state, { compact: true })).join('')}</div>`;
  }
  return `
    <p class="search-row-label">1줄 · 핵심</p>
    <div class="search-grid">${row1.map((f) => renderField(f, state)).join('')}</div>
    ${
      row2.length
        ? `<p class="search-row-label">2줄 · 보조</p><div class="search-grid">${row2.map((f) => renderField(f, state)).join('')}</div>`
        : ''
    }`;
}

/**
 * @param {FindSurfaceState} state
 * @param {{ variant?: 'search' | 'home' }} [options]
 */
function renderTutorRegionTabs(state, options = {}) {
  const variant = options.variant || 'search';
  const activeIdx = resolveTutorRegionIndex(state);
  const tabs = MOCK_TUTOR_REGIONS.map((region, idx) => {
    const cls = ['tutor-region-tabs__btn', idx === activeIdx ? 'is-active' : ''].filter(Boolean).join(' ');
    const primaryMark = region.primary ? '<span class="tutor-region-tabs__primary">대표</span>' : '';
    return `<button type="button" class="${cls}" data-tutor-region="${idx}" role="tab" aria-selected="${idx === activeIdx}">${esc(region.label)}${primaryMark}</button>`;
  }).join('');

  const label = variant === 'home' ? '희망 지역' : '활동 지역 (3)';
  return `
    <nav class="tutor-region-tabs" aria-label="${esc(label)}" role="tablist">
      ${tabs}
    </nav>`;
}

function renderTutorRegionHint(role) {
  if (role === 'tutor') {
    return `<p class="tutor-region-hint">등록한 활동 지역 탭을 선택한 뒤, 아래 조건으로 경쟁 과외쌤을 검색할 수 있습니다.</p>`;
  }
  return `<p class="tutor-region-hint">희망 지역 탭을 선택하면 해당 시·구의 과외쌤 목록이 표시됩니다.</p>`;
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {FindSurfaceState} state
 * @param {{ variant?: 'search' | 'home', role?: import('./state.js').ViewerRole }} [options]
 */
export function renderCompactRegionBar(tab, state, options = {}) {
  const variant = options.variant || 'search';
  const role = options.role || 'parent';

  if (tab === 'tutor') {
    const guestSingle = role === 'guest';
    if (guestSingle) {
      const label = resolveActiveRegionLabel(tab, state) || MOCK_REGIONS.tutor;
      if (variant === 'home') {
        return `
          <div class="parent-home-region parent-home-region--tutor" aria-label="활동 지역">
            <span class="parent-home-region__badge">활동 지역</span>
            <strong class="parent-home-region__label">${esc(label)}</strong>
          </div>`;
      }
      return `
        <div class="search-region-auto search-region-auto--compact search-region-auto--tutor">
          <span class="search-region-auto__badge">기본 지역</span>
          <strong>${esc(label)}</strong>
        </div>`;
    }
    if (variant === 'home') {
      const badge = role === 'tutor' ? '활동 지역' : '희망 지역';
      return `
        <div class="parent-home-region parent-home-region--tutor" aria-label="${esc(badge)}">
          <span class="parent-home-region__badge">${esc(badge)}</span>
          ${renderTutorRegionTabs(state, { variant })}
        </div>`;
    }
    return `
      <div class="search-region-auto search-region-auto--compact search-region-auto--tutor">
        ${renderTutorRegionTabs(state, { variant })}
        ${renderTutorRegionHint(role)}
      </div>`;
  }

  const regionKey = tab === 'room' ? 'room' : 'student';
  const regionLabel = resolveActiveRegionLabel(tab, state) || MOCK_REGIONS[regionKey];
  if (variant === 'home') {
    const badge = tab === 'room' ? '우리동네' : '탐색 지역';
    const changeBtn =
      role === 'parent'
        ? `<button type="button" class="btn btn--secondary btn--sm" data-action="change-region">지역 변경</button>`
        : '';
    return `
      <div class="parent-home-region" aria-label="내 지역">
        <span class="parent-home-region__badge">${esc(badge)}</span>
        <strong class="parent-home-region__label">${esc(regionLabel)}</strong>
        ${changeBtn}
      </div>`;
  }
  return `
    <div class="search-region-auto search-region-auto--compact">
      <span class="search-region-auto__badge">기본 지역</span>
      <strong>${esc(regionLabel)}</strong>
      <button type="button" class="btn btn--secondary btn--sm" data-action="change-region">변경</button>
    </div>`;
}

function renderProviderSelfNote(tab, role, homeSelf = false, hidden = false) {
  if (hidden) return '';
  if (!isProviderSelfPreviewMode(tab, role, homeSelf)) return '';
  // 홈 본문 주석 제거 — 이용안내(HOME_EXPOSURE_GUIDES)로 이전
  return '';
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {FindSurfaceState} state
 * @param {{ showMap?: boolean, formAttr?: string, variant?: 'search' | 'home', role?: import('./state.js').ViewerRole, homeSelf?: boolean, hideSearchForm?: boolean }} [options]
 */
export function renderCompactFindForm(tab, state, options = {}) {
  const {
    showMap = tab === 'room',
    formAttr = 'data-search-form',
    variant = 'search',
    role = 'parent',
    homeSelf = false,
    hideSearchForm = false,
    hideRegionBar = false,
    hideSelfNote = false,
  } = options;
  if (homeSelf) state.homeSelf = true;
  const meta = SEARCH_TABS[tab];
  const basicFields = meta.fields.filter((f) => f.tier === 'basic');
  const expandedFields = meta.fields.filter((f) => f.tier === 'expanded');
  const activeItems = refreshActiveResultItems(tab, state, role);
  const homeSelfFlag = resolveHomeSelf(state);
  const ssotRegion = state.activeRegionLabel || resolveActiveRegionLabel(tab, state, role);
  if (showMap && ssotRegion) {
    const mapRegion = state.activeRegionLabel || MOCK_REGIONS.room;
    if (mapRegion && ssotRegion && mapRegion !== ssotRegion) {
      logLocationDebug('map-list-mismatch', { mapRegion, listRegion: ssotRegion, tab });
    }
  }

  const formHtml = hideSearchForm
    ? ''
    : `
    <form class="search-form search-form--compact search-form--detail3" ${formAttr}>
      <aside class="search-form__title-col" aria-label="상세검색">
        <span class="search-form__title-ico" aria-hidden="true">⌕</span>
        <strong class="search-form__title">상세검색</strong>
      </aside>
      <div class="search-form__body-col">
        <section class="search-section search-section--compact">
          ${renderBasicRows(basicFields, state, true)}
        </section>
        ${
          state.expanded
            ? `
        <section class="search-section search-section--expanded">
          <div class="search-grid search-grid--compact search-grid--detail">${expandedFields.map((f) => renderField(f, state, { compact: true })).join('')}</div>
        </section>`
            : ''
        }
        <div class="search-form__actions-row">
          <button type="button" class="search-expand__toggle search-expand__toggle--inline" data-action="toggle-expanded" aria-expanded="${state.expanded}">
            ${state.expanded ? '필터 접기' : '상세 필터'}
          </button>
          <button type="reset" class="btn btn--secondary">초기화</button>
          <button type="submit" class="btn btn--primary btn--search search-form__submit">검색</button>
          ${
            state.expanded
              ? `<button type="button" class="btn btn--secondary btn--sm" data-action="apply-expanded">적용</button>`
              : ''
          }
        </div>
      </div>
    </form>`;

  const regionBar =
    hideRegionBar || variant === 'search'
      ? ''
      : renderCompactRegionBar(tab, state, { variant, role });

  const mapBannerStyle =
    role === 'study_room' ? 'provider_room' : role === 'guest' ? 'guest' : 'search';
  const studyRoomPromoMap = role === 'study_room' && tab === 'room';
  const mapRegion = studyRoomPromoMap
    ? variant === 'search' && state.searchExecuted
      ? state.activeRegionLabel || peekStudyRoomPromo1()
      : peekStudyRoomPromo1()
    : state.activeRegionLabel || MOCK_REGIONS.room;

  return `
    ${renderProviderSelfNote(tab, role, homeSelfFlag, hideSelfNote)}
    ${regionBar}
    ${showMap
      ? renderSearchMapBlock(activeItems, {
          searched: state.searchExecuted,
          regionLabel: mapRegion,
          resultSource: resolveResultSource(state),
          bannerStyle: mapBannerStyle,
          providerHome: studyRoomPromoMap,
          lat: studyRoomPromoMap ? null : state.canonicalLocation?.lat ?? null,
          lng: studyRoomPromoMap ? null : state.canonicalLocation?.lng ?? null,
        })
      : ''}
    ${formHtml}`;
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {FindSurfaceState} state
 */
export function renderFindFilterBar(tab, state) {
  if (!state.searchExecuted) return '';
  const meta = SEARCH_TABS[tab];
  const regionLabel = state.activeRegionLabel || resolveActiveRegionLabel(tab, state);
  const countLabel = state.searchLoading ? '검색 중…' : `${state.searchTotal}건`;
  return `
    <div class="search-filter-bar" aria-live="polite">
      <span class="search-filter-bar__chip">${esc(meta.label)}</span>
      <span class="search-filter-bar__chip">${esc(regionLabel)}</span>
      <span class="search-filter-bar__count">${esc(countLabel)}</span>
      <button type="button" class="search-filter-bar__reset btn btn--secondary btn--sm" data-action="reset-filters">기본값으로 초기화</button>
    </div>`;
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {FindSurfaceState} state
 * @param {import('./state.js').ViewerRole} role
 * @param {{ surfaceType?: 'home' | 'search' }} [options]
 */
export function renderFindResultSection(tab, state, role, options = {}) {
  const surfaceType = options.surfaceType || 'search';
  const tierCtx = { role, homeSelf: resolveHomeSelf(state) };
  const debugAttrs = resultDebugAttrs(state);
  const resultMode = state.searchExecuted ? 'search' : 'region';

  if (tab === 'student' && surfaceType === 'search') {
    const hope = ensureStudentHopeType(state);
    if (!hope) {
      return `
        <section class="search-results search-results--hope-gate" aria-label="희망 유형 선택" ${debugAttrs}>
          ${renderHopeTypeGate()}
        </section>`;
    }
  }

  const activeItems = refreshActiveResultItems(tab, state, role);
  const regionLabel = state.activeRegionLabel || resolveActiveRegionLabel(tab, state, role);

  if (!state.searchExecuted) {
    const tierHtml = renderSearchTierResults(tab, activeItems, tierCtx, {
      mode: 'region',
      regionLabel,
      surfaceType,
    });
    return `
      <section class="search-results search-results--pre" aria-label="내 지역 목록" ${debugAttrs} data-surface-type="${esc(surfaceType)}">
        ${tierHtml}
      </section>`;
  }

  if (state.searchLoading) {
    return `
      <section class="search-results search-results--executed" ${debugAttrs}>
        <p class="search-results__hint">검색 중…</p>
      </section>`;
  }

  if (state.searchError) {
    return `
      <section class="search-results search-results--executed" ${debugAttrs}>
        <h2 class="search-section__title">검색 결과</h2>
        <p class="search-results__hint search-results__hint--error">${esc(state.searchError)}</p>
      </section>`;
  }

  const flatHtml = renderSearchTierResults(tab, activeItems, tierCtx, {
    mode: 'search',
    regionLabel,
    surfaceType,
  });

  /* 검색 실행 후(결과 국면)에만 학생 수요 — 홈 browse 티어와 분리 */
  const demandHtml =
    tab === 'room' || tab === 'tutor'
      ? renderStudentDemandBlock(regionLabel, {
          guest: role === 'guest',
          viewerRole: role,
          hopeType: tab === 'tutor' ? 'tutor' : 'study_room',
        })
      : '';

  return `
    <section class="search-results search-results--executed" ${debugAttrs} data-result-mode="${esc(resultMode)}" data-surface-type="${esc(surfaceType)}">
      <h2 class="search-section__title">검색 결과 <span class="search-results__count">${state.searchTotal}건</span></h2>
      ${flatHtml}
      ${demandHtml}
    </section>`;
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {HTMLFormElement} form
 * @param {FindSurfaceState} state
 * @param {import('./state.js').ViewerRole} role
 * @param {() => void} rerender
 */
export async function runFindSearch(tab, form, state, role, rerender) {
  const filters = collectFiltersFromForm(form, tab);
  if (tab === 'student' && state.studentHopeType) {
    filters.preferred_lesson_type = state.studentHopeType;
  }
  return runFindSearchWithFilters(tab, filters, state, role, rerender);
}

/**
 * 필터 객체로 검색 실행 (URL 복원·폼 없이 재검색)
 * @param {import('./state.js').SearchTab} tab
 * @param {Record<string, string|string[]>} filters
 * @param {FindSurfaceState} state
 * @param {import('./state.js').ViewerRole} role
 * @param {() => void} rerender
 */
export async function runFindSearchWithFilters(tab, filters, state, role, rerender) {
  state.searchExecuted = true;
  state.searchLoading = true;
  state.searchError = null;
  state.lastSearchFilters = { ...filters };
  if (tab === 'student') {
    state.hasRequestSummary = isRequestSummaryFilterOn(filters.has_request_summary);
  }
  writeStoredFilters(tab, state.lastSearchFilters);

  const regionText = regionLabelFromFilters(tab, filters, state);
  const axis = locationAxisForState(tab, state);
  applyCanonicalLocation(
    state,
    normalizeLocation(
      {
        raw: regionText,
        lat: state.canonicalLocation?.lat,
        lng: state.canonicalLocation?.lng,
        source: state.canonicalLocation?.source || 'session',
      },
      axis,
    ),
    tab,
  );
  // hydrate 재진입 시 동일 검색을 다시 돌리지 않도록 복원 키 선기록
  state._restoredSearchKey = `${tab}::${encodeFiltersForUrl(state.lastSearchFilters)}::${state.activeRegionLabel || ''}`;
  syncFindHashState(state, tab);
  rerender();

  try {
    const kind = tab === 'room' ? 'study_room' : tab === 'tutor' ? 'tutor' : 'student';
    const sort = readListSortFromHash(kind, { mode: 'search' });
    logLocationDebug('list-fetch', { tab, mode: 'search-api', filters, region: state.activeRegionLabel });
    const result = await searchApi(tab, filters, { sort });
    if (state.searchRows) state.searchRows = result.rows || [];
    if (state.searchItems) state.searchItems = result.items || [];
    state.searchExposureItems = filterToProviderSelf(
      tab,
      role,
      mapSearchResultsToExposure(tab, result.items || []),
      resolveHomeSelf(state),
    );
    state.searchTotal = state.searchExposureItems.length;
    refreshActiveResultItems(tab, state, role);
  } catch (err) {
    if (state.searchRows) state.searchRows = [];
    if (state.searchItems) state.searchItems = [];
    state.searchExposureItems = [];
    state.searchTotal = 0;
    state.searchError = err instanceof Error ? err.message : '검색에 실패했습니다.';
    refreshActiveResultItems(tab, state, role);
  } finally {
    state.searchLoading = false;
    state._needsSearchRestore = false;
    refreshActiveResultItems(tab, state, role);
    syncFindHashState(state, tab);
    rerender();
  }
}

/**
 * @param {HTMLElement} root
 * @param {() => void} rerender
 * @param {{ getTab: () => import('./state.js').SearchTab, getState: () => FindSurfaceState, role: import('./state.js').ViewerRole, formSelector?: string }} ctx
 */
export function bindFindSurfaceEvents(root, rerender, ctx) {
  const formSelector = ctx.formSelector || '[data-search-form]';
  const state = () => ctx.getState();
  const getForm = () => root.querySelector(formSelector);

  const applyReset = () => {
    const form = getForm();
    const tab = ctx.getTab();
    resetFindSurface(state(), form instanceof HTMLFormElement ? form : undefined);
    if (ctx.role === 'study_room' && tab === 'room') {
      state().canonicalLocation = null;
      state().activeRegionLabel = '';
      seedStudyRoomPromoLabel(state(), tab);
    }
    refreshActiveResultItems(tab, state(), ctx.role);
    syncFindHashState(state(), tab);
    rerender();
  };

  root.querySelector('[data-action="toggle-expanded"]')?.addEventListener('click', () => {
    state().expanded = !state().expanded;
    rerender();
  });

  root.querySelector('[data-action="reset-filters"]')?.addEventListener('click', applyReset);

  root.querySelectorAll('[data-tutor-region]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.tutorRegion);
      if (Number.isNaN(idx) || resolveTutorRegionIndex(state()) === idx) return;
      state().tutorRegionIndex = idx;
      state().activeRegionLabel = canonicalRegionLabel(getTutorRegionLabel(idx), 'tutor', state());
      const form = getForm();
      resetFindSurface(state(), form instanceof HTMLFormElement ? form : undefined, { keepTutorRegion: true });
      // reset clears activeRegionLabel — restore tutor tab label
      state().activeRegionLabel = canonicalRegionLabel(getTutorRegionLabel(idx), 'tutor', state());
      refreshActiveResultItems(ctx.getTab(), state(), ctx.role);
      syncFindHashState(state(), ctx.getTab());
      rerender();
    });
  });

  root.querySelector('[data-action="apply-expanded"]')?.addEventListener('click', () => {
    const form = getForm();
    if (form instanceof HTMLFormElement) {
      runFindSearch(ctx.getTab(), form, state(), ctx.role, rerender);
    }
  });

  root.querySelector('[data-action="change-region"]')?.addEventListener('click', async () => {
    const tab = ctx.getTab();
    try {
      await openKakaoPostcode((result) => {
        const apt = result.apartment && result.buildingName ? result.buildingName : '';
        const dong = result.bname || result.hname || '';
        const city = result.sido || '';
        const district = result.sigungu || '';
        const axis = locationAxisForState(tab, state());
        const canonical = normalizeLocation(
          {
            city,
            district,
            dong,
            apartmentName: apt,
            raw: [city, district, dong].filter(Boolean).join(' '),
            source: 'address',
          },
          axis,
        );
        applyCanonicalLocation(state(), canonical, tab);
        if (tab === 'student' || tab === 'room') {
          const hope =
            tab === 'room'
              ? 'study_room'
              : state().studentHopeType === 'tutor' || state().studentHopeType === 'study_room'
                ? state().studentHopeType
                : 'study_room';
          writeStoredHopeRegion(hope, canonical.displayLabel);
        }
        // 폼 지역 입력도 동기화
        const form = getForm();
        if (form instanceof HTMLFormElement) {
          const name =
            tab === 'room'
              ? 'f_region_id'
              : tab === 'tutor'
                ? 'f_tutor_region_id'
                : 'f_preferred_region';
          const input = form.querySelector(`input[name="${name}"]`);
          if (input instanceof HTMLInputElement) input.value = canonical.displayLabel;
        }
        syncFindHashState(state(), tab);
        refreshActiveResultItems(tab, state(), ctx.role);
        logLocationDebug('change-region-address', { tab, canonical });
        rerender();
      });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '주소찾기를 열 수 없습니다.');
    }
  });

  root.querySelectorAll('[data-action="find-region-address"], [data-action="find-hope-address"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tab = ctx.getTab();
      const fieldKey =
        btn.getAttribute('data-region-field') ||
        (tab === 'room' ? 'region_id' : tab === 'tutor' ? 'tutor_region_id' : 'preferred_region');
      const inputName =
        fieldKey === 'region_id'
          ? 'f_region_id'
          : fieldKey === 'tutor_region_id'
            ? 'f_tutor_region_id'
            : 'f_preferred_region';
      const input =
        root.querySelector(`input[name="${inputName}"]`) ||
        root.querySelector('[data-student-region-field] input');
      try {
        await openKakaoPostcode((result) => {
          const apt = result.apartment && result.buildingName ? result.buildingName : '';
          const dong = result.bname || result.hname || '';
          const city = result.sido || '';
          const district = result.sigungu || '';
          const axis = locationAxisForState(tab, state());
          const canonical = normalizeLocation(
            {
              city,
              district,
              dong,
              apartmentName: apt,
              raw: [city, district, dong].filter(Boolean).join(' '),
              source: 'address',
            },
            axis,
          );
          applyCanonicalLocation(state(), canonical, tab);
          if (input instanceof HTMLInputElement) input.value = canonical.displayLabel;
          if (tab === 'student' || tab === 'room') {
            const hope =
              tab === 'room'
                ? 'study_room'
                : state().studentHopeType === 'tutor' || state().studentHopeType === 'study_room'
                  ? state().studentHopeType
                  : 'study_room';
            writeStoredHopeRegion(hope, canonical.displayLabel);
          }
          syncFindHashState(state(), tab);
          refreshActiveResultItems(tab, state(), ctx.role);
          logLocationDebug('find-region-address', { tab, fieldKey, canonical });
          rerender();
        });
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '주소찾기를 열 수 없습니다.');
      }
    });
  });

  root.querySelectorAll('[data-action="pick-hope-type"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const hope = btn.getAttribute('data-hope');
      if (hope !== 'tutor' && hope !== 'study_room') return;
      writeStoredHopeType(hope);
      state().studentHopeType = hope;
      state().hopeTypeResolved = true;
      const guestFallback =
        hope === 'study_room' ? GUEST_DEFAULT_REGIONS.room : GUEST_DEFAULT_REGIONS.student;
      state().activeRegionLabel = canonicalRegionLabel(
        resolveFindDefaultRegion(hope, guestFallback),
        'student',
        state(),
      );
      const base = '#/search/student';
      window.location.hash = `${base}?hope=${encodeURIComponent(hope)}`;
      rerender();
    });
  });

  const lessonFormatSelect = root.querySelector('[data-lesson-format-select]');
  if (lessonFormatSelect) {
    lessonFormatSelect.addEventListener('change', () => {
      if (state().studentLessonFormat !== undefined) {
        state().studentLessonFormat = lessonFormatSelect.value || 'one_on_one';
      }
      rerender();
    });
  }

  root.querySelectorAll('input[name="f_has_request_summary"]').forEach((input) => {
    input.addEventListener('change', () => {
      state().hasRequestSummary = input instanceof HTMLInputElement && input.checked;
    });
  });

  const hopeTypeSelect = root.querySelector('[data-preferred-lesson-type]');
  if (hopeTypeSelect) {
    hopeTypeSelect.addEventListener('change', () => {
      const v = String(hopeTypeSelect.value || '').trim();
      if (v === 'tutor' || v === 'study_room') {
        state().studentHopeType = v;
        state().hopeTypeResolved = true;
        writeStoredHopeType(v);
        const guestFallback =
          v === 'study_room' ? GUEST_DEFAULT_REGIONS.room : GUEST_DEFAULT_REGIONS.student;
        state().activeRegionLabel = canonicalRegionLabel(
          resolveFindDefaultRegion(v, guestFallback),
          'student',
          state(),
        );
      }
      // both/빈값: 지역 UI는 시(과외) 축 유지 · 희망유형 상태만 재렌더
      rerender();
    });
  }

  const form = getForm();
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      runFindSearch(ctx.getTab(), form, state(), ctx.role, rerender);
    });
    form.addEventListener('reset', () => {
      setTimeout(applyReset, 0);
    });
  }

  if (ctx.getTab() === 'room') {
    bindSearchMapPinLinks(root, refreshActiveResultItems(ctx.getTab(), state(), ctx.role));
  }

  bindListSortControls(root, rerender, {
    onSortChange: (kind, _sort, listId) => {
      if (listId) setGuestListPage(listId, 1);
      const form = getForm();
      if (state().searchExecuted && form instanceof HTMLFormElement) {
        runFindSearch(ctx.getTab(), form, state(), ctx.role, rerender);
        return false;
      }
      return undefined;
    },
  });
}

/** @param {'study_room' | 'tutor'} parentTab */
export function parentTabToSearchTab(parentTab) {
  return parentTab === 'study_room' ? 'room' : 'tutor';
}
