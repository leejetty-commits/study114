/**
 * 공부방·과외 찾기 — 컴팩트 검색 + 지역 피드 / 검색 결과 (search-ui · home #parent 공용)
 */

import { OPTION_LABELS } from './search-enums.js';
import {
  SEARCH_TABS,
} from './search-schema.js';
import { getRegionFeed, getStudentDemandForRegion } from './search-region-feed.js';
import { filterToProviderSelf } from './search-provider-self.js';
import {
  getStudyRoomHomeLiveItems,
  getStudyRoomStudentLiveItems,
  peekStudyRoomPromo1,
  studyRoomPromo1Dong,
} from '@home-ui/study-room-home-seed.js';
import {
  tutorHomePrimaryLabel,
  tutorHomePrimaryIndex,
  tutorHomeRegionLabel,
  tutorHomeRegionsReady,
  readTutorHomeRegions,
  getTutorStudentLiveItems,
  getTutorStudentFeedStatus,
} from '@home-ui/tutor-home-seed.js';
import { isProviderSelfPreviewMode } from './search-role-access.js';
import { renderSearchMapBlock, bindSearchMapPinLinks } from './search-map.js';
import { renderSearchTierResults } from './search-tier-render.js';
import { collectFiltersFromForm, searchApi, settleStudentStudyroomRegionFilter } from './search-api.js';
import { mapSearchResultsToExposure } from './search-exposure-mapper.js';
import { renderBrowseList, renderGuestPaginatedListBlock } from '@home-ui/exposure-render.js';
import { SECTION_HEADINGS, renderSectionTitleBar } from '@home-ui/section-headings.js';
import { renderStateCard } from '@home-ui/empty-state-copy.js';
import { TUTOR_HOME_STUDENT_COPY } from '@home-ui/student-reg/student-reg-copy.js';
import {
  DEFAULT_STUDENT_HOPE_TYPE,
  renderHopeTypeGate,
  resolveHopeTypeFromQuery,
  writeStoredHopeType,
} from './student-hope-type.js';
import { resolveFindDefaultRegion, writeStoredHopeRegion } from '../../shared/student-hope-regions.js';
import {
  readStudentSavedRegion,
  studentBranch,
  studentPlaceFilters,
  studentPlaceFor,
  syncStoredHopeRegionsFromSaved,
} from './student-saved-region.js';
import {
  REGION_LIST_ERROR,
  activityLabelFromRegionId,
  bindRegionCascades,
  normalizeCities,
  regionIdFromActivityLabel,
  renderRegionCascade,
} from '../../shared/region-cascade.js';
import { parseHashQuery } from '../../shared/preview-links.js';
import { bindListSortControls, readListSortFromHash } from '../../shared/list-sort.js';
import { MAIN_SUBJECT_OPTIONS } from '../../shared/main-subjects.js';
import { gradeOptionHtml } from '../../shared/school-grade.js';
import { setGuestListPage } from '@home-ui/state.js';
import { renderUniversityNameField, bindUniversityNameField } from '../../shared/korean-universities.js';
import {
  axisFromSearchTab,
  logLocationDebug,
  normalizeLocation,
  resolveLocationByPriority,
  reverseGeocodeCoords,
  tryBrowserGps,
  serializeCanonical,
  deserializeCanonical,
  placeCaption,
  STUDENT_PLACE_PROMPT,
  memberPlacePrompt,
  expandKakaoSido,
  loadGuestBaseline,
  readGuestBaseline,
  guestScopeFilters,
} from '../../shared/location-display.js';
import { openKakaoPostcode } from '../../shared/kakao-postcode.js';
import { ensureRegionFromKakao } from '../../shared/region-ensure.js';

const FILTERS_STORAGE_KEY = 'study114-find-filters-v1';
const CANONICAL_STORAGE_KEY = 'study114-find-canonical-v1';
const HOPE_REGION_STORAGE_KEY = 'study114.studentFind.lastRegionByHope';
const STALE_GUEST_LABELS = new Set(['서울시', '부산시', '인천시', '서울 강남구 대치동']);
let guestBaselineBooted = false;

/** 게스트 축. 공부방은 동(대치동), 과외쌤·학생은 구(서울시 강남구). 학생 희망유형과 무관하다. */
function guestAxis(tab) {
  return tab === 'room' ? 'room' : 'tutor';
}

/** 게스트 현재 위치. 공부방 대치동, 과외쌤·학생 서울시 강남구. */
function guestServerPlace(tab) {
  const base = readGuestBaseline();
  return guestAxis(tab) === 'room' ? base.room : base.tutor;
}

/** @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state */
function applyGuestPlace(tab, state) {
  const canonical = normalizeLocation({ raw: guestServerPlace(tab), source: 'fallback' }, guestAxis(tab));
  canonical.source = 'fallback';
  applyCanonicalLocation(state, canonical, tab);
  return canonical.displayLabel;
}

/** @param {() => void} rerender */
function bootGuestPlaceBaseline(rerender) {
  if (guestBaselineBooted) return;
  guestBaselineBooted = true;
  const before = readGuestBaseline();
  loadGuestBaseline().then((base) => {
    if (base.room !== before.room || base.tutor !== before.tutor) rerender();
  });
}

/**
 * 게스트 찾기 지역 목록. 탭마다 한 번만 부른다.
 * region-stats 와 같은 기준 행 id로 search.php 필터를 건다. 다른 지역으로 채우지 않는다.
 * @type {Record<'room'|'tutor'|'student', { status: 'loading'|'ready'|'error', items: object[] } | undefined>}
 */
const guestFeeds = { room: undefined, tutor: undefined, student: undefined };
const GUEST_FEED_PAGE_LIMIT = 50;
const GUEST_FEED_MAX_PAGES = 4;
const GUEST_FEED_LOADING = '목록을 불러오는 중입니다.';
const GUEST_FEED_ERROR = '목록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';

/** @param {import('./state.js').SearchTab} tab */
function guestFeedItems(tab) {
  return guestFeeds[tab]?.items || [];
}

/** 아직 부르지 않았으면 loading. 샘플은 ready 이고 0건일 때만 그린다. */
function guestFeedStatus(tab) {
  return guestFeeds[tab]?.status || 'loading';
}

/** @param {import('./state.js').SearchTab} tab @param {Record<string, string>} filters */
async function fetchGuestScopedItems(tab, filters) {
  /** @type {object[]} */
  const items = [];
  let total = Infinity;
  for (let page = 1; page <= GUEST_FEED_MAX_PAGES && items.length < total; page++) {
    const body = await searchApi(tab, { ...filters }, { page, limit: GUEST_FEED_PAGE_LIMIT, sort: 'latest' });
    total = Number(body.total) || 0;
    const batch = Array.isArray(body.items) ? body.items : [];
    items.push(...batch);
    if (batch.length < GUEST_FEED_PAGE_LIMIT) break;
  }
  return items;
}

/** @param {import('./state.js').SearchTab} tab @param {() => void} rerender */
function bootGuestFeed(tab, rerender) {
  if (tab !== 'room' && tab !== 'tutor' && tab !== 'student') return;
  if (guestFeeds[tab]) return;
  guestFeeds[tab] = { status: 'loading', items: [] };
  loadGuestBaseline()
    .then(() => {
      const filters = guestScopeFilters(tab);
      if (!filters) throw new Error('guest base region missing');
      return fetchGuestScopedItems(tab, filters);
    })
    .then((raw) => {
      guestFeeds[tab] = { status: 'ready', items: mapSearchResultsToExposure(tab, raw) };
      rerender();
    })
    .catch((err) => {
      console.warn('[guest-find-feed]', tab, err);
      guestFeeds[tab] = { status: 'error', items: [] };
      rerender();
    });
}

/**
 * 게스트 찾기 하단 실카드. 0건이면 이 함수를 부르지 않고 기존 샘플 블록을 그린다.
 * @param {import('./state.js').SearchTab} tab
 * @param {object[]} items
 * @param {string} regionLabel
 */
function renderGuestFeedList(tab, items, regionLabel) {
  const kind = tab === 'room' ? 'study_room' : tab === 'tutor' ? 'tutor' : 'student';
  const heading =
    kind === 'study_room'
      ? SECTION_HEADINGS.basicStudyRoom
      : kind === 'tutor'
        ? SECTION_HEADINGS.basicTutor
        : SECTION_HEADINGS.students;
  return `
    <div class="content-section search-flat-results" data-surface="search-flat" data-search-phase="region">
      ${renderGuestPaginatedListBlock(kind, `search_guest_${kind}`, { ...heading, locationLabel: regionLabel }, items, {
        guest: true,
        viewerRole: 'guest',
        sourceRoute: 'search',
        serverSorted: true,
        sortMode: 'search',
      })}
    </div>`;
}

/**
 * 비로그인 찾기 화면 부트. 기준 위치·지역 목록·지역 목록 카드를 각각 페이지당 1회만 부른다.
 * @param {import('./state.js').SearchTab} tab
 * @param {() => void} rerender
 */
export function bootGuestFindSurface(tab, rerender) {
  bootGuestPlaceBaseline(rerender);
  bootFindCities(rerender);
  bootGuestFeed(tab, rerender);
}

/* 학생(parent) 위치: URL ?region= > 직접 고른 주소 > 서버 저장 지역 > GPS. 저장 선택(canonical)은 쓰지 않는다. */

const STUDENT_REGION_FILTER_KEYS = [
  'region_id',
  'region_label',
  'sigungu_region_id',
  'tutor_region_id',
  'tutor_region_label',
  'preferred_region_id',
  'preferred_region',
  'preferred_region_label',
  'preferred_studyroom_region_id',
];
const STUDENT_ROOM_EMPTY = '이 동네 공부방이 아직 도착하지 않았어요';

/** 학생 희망 유형 = 가입 분기 고정. URL ?hope=·직접 고른 유형은 보지 않는다. @param {FindSurfaceState} state */
function ensureParentHope(state) {
  state.studentHopeType = studentBranch();
  state.hopeTypeResolved = true;
  return state.studentHopeType;
}

/** @param {FindSurfaceState} state @returns {'tutor'|'study_room'} */
function studentHope(state) {
  return ensureParentHope(state);
}

/** @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state */
function studentTarget(tab, state) {
  void state;
  return studentPlaceFor(readStudentSavedRegion(), tab);
}

/** 서버 저장 지역 → 화면 위치. 라벨은 서버 정식 라벨 그대로 둔다. */
function studentSavedCanonical(target, tab) {
  const label = target.label;
  return {
    province: '',
    city: '',
    district: '',
    dong: '',
    apartmentName: '',
    displayLabel: label,
    searchScopeLabel: label,
    regionKey: label.toLowerCase(),
    regionId: target.id,
    level: target.scope === 'dong' ? 'dong' : 'district',
    lat: null,
    lng: null,
    raw: label,
    axis: tab === 'room' ? 'room' : 'tutor',
    source: 'saved',
  };
}

/** 학생이 직접 고른 위치. 축 변환이 시·군·구를 지우면 고른 라벨을 그대로 쓴다. */
function studentPickedCanonical(input, tab, state) {
  const canonical = normalizeLocation(input, locationAxisForState(tab, state));
  if (!canonical.displayLabel) {
    const raw = String(input.raw || '').trim();
    canonical.displayLabel = raw;
    canonical.searchScopeLabel = raw;
  }
  canonical.source = input.source;
  return canonical;
}

/** 이 탭에서 학생이 직접 고른 위치(URL·주소찾기·지역 선택)가 살아 있는지. */
function studentUserPinned(state, tab) {
  const cur = state.canonicalLocation;
  return (
    Boolean(cur?.displayLabel) &&
    state._placeTab === tab &&
    ['url', 'address', 'session'].includes(String(cur.source || ''))
  );
}

function applyStudentPlace(state, tab, canonical) {
  applyCanonicalLocation(state, canonical, tab);
  state._placeTab = tab;
  return canonical.displayLabel;
}

/** @returns {string} 학생 현재 위치 라벨. 저장 지역도 GPS도 없으면 '' */
function resolveStudentActivePlace(tab, state) {
  state.role = 'parent';
  ensureParentHope(state);
  if (studentUserPinned(state, tab)) return state.canonicalLocation.displayLabel;
  const saved = readStudentSavedRegion();
  syncStoredHopeRegionsFromSaved(saved);
  const target = studentPlaceFor(saved, tab);
  if (target) return applyStudentPlace(state, tab, studentSavedCanonical(target, tab));
  const cur = state.canonicalLocation;
  if (cur?.source === 'gps' && state._placeTab === tab && cur.displayLabel) return cur.displayLabel;
  state.canonicalLocation = null;
  state.activeRegionLabel = '';
  state._placeTab = tab;
  return '';
}

/**
 * @param {FindSurfaceState} state
 * @param {import('./state.js').SearchTab} tab
 * @param {Record<string, string>} q
 */
function hydrateStudentPlace(state, tab, q) {
  state.role = 'parent';
  ensureParentHope(state);
  const urlRegion = String(q.region || '').trim();
  const pick = state.studentPicks?.[tab];
  /** @type {import('../../shared/location-display.js').CanonicalLocation|null} */
  let canonical = null;
  if (pick?.displayLabel && (!urlRegion || pick.displayLabel === urlRegion)) {
    canonical = pick;
  } else if (urlRegion) {
    const target = studentTarget(tab, state);
    canonical =
      target && target.label === urlRegion
        ? studentSavedCanonical(target, tab)
        : studentPickedCanonical(
            {
              raw: urlRegion,
              lat: q.lat != null && q.lat !== '' ? Number(q.lat) : null,
              lng: q.lng != null && q.lng !== '' ? Number(q.lng) : null,
              source: 'url',
            },
            tab,
            state,
          );
  }
  if (canonical) {
    applyStudentPlace(state, tab, canonical);
    return canonical;
  }
  resolveStudentActivePlace(tab, state);
  return state.canonicalLocation || normalizeLocation({ raw: '', source: 'fallback' }, locationAxisForState(tab, state));
}

/**
 * 학생 현재 위치 → search.php 지역 조건. 위치가 없으면 null(목록을 부르지 않는다).
 * @param {import('./state.js').SearchTab} tab
 * @param {FindSurfaceState} state
 * @returns {Record<string, string>|null}
 */
function studentFeedFilters(tab, state) {
  const cur = state.canonicalLocation;
  if (!cur?.displayLabel || state._placeTab !== tab) return null;
  const hope = studentHope(state);
  if (cur.source === 'saved') {
    const scope = studentPlaceFilters(tab, studentTarget(tab, state), hope);
    if (scope && tab === 'student' && hope === 'study_room' && state.studyroomDongRegionId) {
      delete scope.preferred_region_id;
      scope.preferred_studyroom_region_id = numericRegionId(state.studyroomDongRegionId);
    }
    return scope;
  }
  if (tab === 'room') {
    const guId = cur.level === 'district' ? selectableFindRegionId(cur.regionId) : '';
    return guId ? { sigungu_region_id: guId } : { region_label: cur.displayLabel };
  }
  const id = selectableFindRegionId(cur.regionId) || regionIdFromActivityLabel(cur.displayLabel, findCityUnits);
  if (!id) return null;
  if (tab === 'tutor') return { tutor_region_id: id };
  return { preferred_lesson_type: hope, preferred_region_id: id };
}

/** 학생 첫 화면 목록. 탭·지역 조건마다 한 번만 부른다. @type {Map<string, { status: 'loading'|'ready'|'error', items: object[] }>} */
const studentFeeds = new Map();

function studentFeedKey(tab, filters) {
  return `${tab}|${JSON.stringify(filters)}`;
}

/** @returns {{ status: 'idle'|'loading'|'ready'|'error', items: object[] }} */
function studentFeedEntry(tab, state) {
  const filters = studentFeedFilters(tab, state);
  if (!filters) return { status: 'idle', items: [] };
  return studentFeeds.get(studentFeedKey(tab, filters)) || { status: 'loading', items: [] };
}

/**
 * 학생 찾기 첫 화면 목록 부트. 저장 지역(또는 고른 위치) 조건으로 search.php 를 부른다.
 * @param {import('./state.js').SearchTab} tab
 * @param {FindSurfaceState} state
 * @param {() => void} rerender
 */
export function bootStudentFindFeed(tab, state, rerender) {
  if (state.role !== 'parent' || state.searchExecuted) return;
  bootFindCities(rerender);
  const filters = studentFeedFilters(tab, state);
  if (!filters) return;
  const key = studentFeedKey(tab, filters);
  if (studentFeeds.has(key)) return;
  studentFeeds.set(key, { status: 'loading', items: [] });
  fetchGuestScopedItems(tab, filters)
    .then((raw) => {
      studentFeeds.set(key, { status: 'ready', items: mapSearchResultsToExposure(tab, raw) });
    })
    .catch((err) => {
      console.warn('[student-find-feed]', tab, err);
      studentFeeds.set(key, { status: 'error', items: [] });
    })
    .then(() => rerender());
}

/**
 * 카카오 주소 결과 → 화면 위치. 학생은 시·도 약칭(경기)을 정식 이름으로 펴고,
 * 이 탭의 보기 전용 위치로만 둔다(서버 저장 지역·임시값을 덮지 않는다).
 * @param {{ sido?: string, sigungu?: string, bname?: string, hname?: string, apartment?: boolean|string, buildingName?: string }} result
 * @param {import('./state.js').SearchTab} tab
 * @param {FindSurfaceState} state
 */
function canonicalFromKakao(result, tab, state) {
  const apt = result.apartment && result.buildingName ? result.buildingName : '';
  const dong = result.bname || result.hname || '';
  const parent = state.role === 'parent';
  const city = parent ? expandKakaoSido(result.sido || '') : result.sido || '';
  const district = result.sigungu || '';
  const input = {
    city,
    district,
    dong,
    apartmentName: apt,
    raw: [city, district, dong].filter(Boolean).join(' '),
    source: 'address',
  };
  if (!parent) return normalizeLocation(input, locationAxisForState(tab, state));
  const canonical = studentPickedCanonical(input, tab, state);
  state.studentPicks = { ...(state.studentPicks || {}), [tab]: canonical };
  return canonical;
}

/** 학생이 직접 고른 위치를 기억하지 않고 저장 지역으로 돌아간다. */
function clearStudentPick(state, tab) {
  if (state.studentPicks) delete state.studentPicks[tab];
  state.canonicalLocation = null;
  state.activeRegionLabel = '';
  state._placeTab = '';
}

function discardStaleGuestLocation() {
  try {
    const raw = localStorage.getItem(CANONICAL_STORAGE_KEY);
    if (raw) {
      const prev = JSON.parse(raw);
      if (prev && typeof prev === 'object') {
        let changed = false;
        for (const key of Object.keys(prev)) {
          const label = String(prev[key]?.displayLabel || prev[key]?.raw || '').trim();
          if (STALE_GUEST_LABELS.has(label)) {
            delete prev[key];
            changed = true;
          }
        }
        if (changed) localStorage.setItem(CANONICAL_STORAGE_KEY, JSON.stringify(prev));
      }
    }
    const hopeRaw = localStorage.getItem(HOPE_REGION_STORAGE_KEY);
    if (hopeRaw) {
      const hope = JSON.parse(hopeRaw);
      if (hope && typeof hope === 'object') {
        let changed = false;
        for (const key of ['tutor', 'study_room']) {
          if (STALE_GUEST_LABELS.has(String(hope[key] || '').trim())) {
            delete hope[key];
            changed = true;
          }
        }
        if (changed) localStorage.setItem(HOPE_REGION_STORAGE_KEY, JSON.stringify(hope));
      }
    }
  } catch {
    /* ignore */
  }
}

const GU_PICK_HINT = '구(시·군)까지 선택하면 그 지역만 검색합니다. 선택이 끝나기 전에는 지역 조건 없이 검색합니다.';
const DONG_RETRY_HINT = '동을 다시 선택해 주세요';
const STUDYROOM_ADDRESS_HINT = '주소찾기로 행정동·단지를 선택합니다. 자유입력만으로는 검색하지 않습니다.';

/** @type {import('../../shared/region-cascade.js').CityUnit[]} */
let findCityUnits = [];
/** @type {Promise<import('../../shared/region-cascade.js').CityUnit[]>|null} */
let findCitiesBoot = null;
/** @type {'idle'|'loading'|'ready'|'error'} */
let findCitiesStatus = 'idle';
/** @type {Set<() => void>} */
const findCitiesWaiters = new Set();
/** 실패 재그리기는 페이지당 한 번. 다시 그린 화면이 또 부르고 또 실패해도 반복하지 않는다. */
let findCitiesFailRendered = false;

function settleFindCitiesWaiters() {
  const waiters = [...findCitiesWaiters];
  findCitiesWaiters.clear();
  if (findCitiesStatus !== 'ready') {
    if (findCitiesFailRendered) return;
    findCitiesFailRendered = true;
  }
  waiters.forEach((rerender) => rerender());
}

/** @param {() => void} [rerender] */
function bootFindCities(rerender) {
  if (!findCitiesBoot) {
    findCitiesStatus = 'loading';
    findCitiesBoot = fetch('/api/auth/regions.php?action=cities', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
    })
      .then((res) => res.json())
      .then((body) => {
        findCityUnits = normalizeCities(body?.cities);
        findCitiesStatus = findCityUnits.length ? 'ready' : 'error';
        return findCityUnits;
      })
      .catch(() => {
        findCitiesBoot = null;
        findCitiesStatus = 'error';
        findCityUnits = [];
        return findCityUnits;
      })
      .then((units) => {
        settleFindCitiesWaiters();
        return units;
      });
  }
  if (typeof rerender === 'function' && findCitiesStatus === 'loading') {
    findCitiesWaiters.add(rerender);
  }
  return findCitiesBoot;
}

/** @param {unknown} value */
function numericRegionId(value) {
  const text = String(value ?? '').trim();
  return /^\d+$/.test(text) ? text : '';
}

/** 도시 목록이 있으면 선택 단위 id만 통과한다. */
function selectableFindRegionId(value) {
  const id = numericRegionId(value);
  if (!id) return '';
  if (!findCityUnits.length) return id;
  return activityLabelFromRegionId(id, findCityUnits) ? id : '';
}

/**
 * 과외·학생 URL/저장 필터에서 라벨과 선택 단위가 아닌 지역값을 뺀다.
 * @param {import('./state.js').SearchTab} tab
 * @param {Record<string, string|string[]>} filters
 */
function dropLegacyLessonRegionFilters(tab, filters) {
  const next = { ...filters };
  if (tab === 'tutor') {
    delete next.tutor_region_label;
    const id = selectableFindRegionId(next.tutor_region_id);
    if (id) next.tutor_region_id = id;
    else delete next.tutor_region_id;
  }
  if (tab === 'student') {
    delete next.preferred_region_label;
    const id = selectableFindRegionId(next.preferred_region_id || next.preferred_region);
    delete next.preferred_region;
    if (id) next.preferred_region_id = id;
    else delete next.preferred_region_id;
    preserveStudyroomRegionId(next);
  }
  return next;
}

/** URL·저장값의 공부방 희망 동 id 숫자만 남긴다. */
function preserveStudyroomRegionId(filters) {
  const id = numericRegionId(filters.preferred_studyroom_region_id);
  if (id) filters.preferred_studyroom_region_id = id;
  else delete filters.preferred_studyroom_region_id;
  return filters;
}

/** 폼 숨은 값. 확정 중이거나 실패면 비운다. */
function renderedStudyroomDongId(state) {
  if (state.studyroomDongPending || state.studyroomDongUnconfirmed) return '';
  if (state.studyroomDongRegionId) return numericRegionId(state.studyroomDongRegionId);
  const fromFilter = numericRegionId(state.lastSearchFilters?.preferred_studyroom_region_id);
  if (fromFilter || state.role !== 'parent' || state.searchExecuted) return fromFilter;
  const target = studentTarget('student', state);
  return target?.scope === 'dong' && studentHope(state) === 'study_room' ? target.id : '';
}

function clearStudyroomDongId(state) {
  state.studyroomDongRegionId = '';
  if (state.lastSearchFilters) delete state.lastSearchFilters.preferred_studyroom_region_id;
}

/**
 * 주소찾기 결과로 동 행 id를 확정한다. RegionEnsure(regions.php action=ensure)를 재사용한다.
 * @param {FindSurfaceState} state
 * @param {Parameters<typeof ensureRegionFromKakao>[0]} result
 * @param {() => void} rerender
 */
async function confirmStudyroomDong(state, result, rerender) {
  state.studyroomDongPending = true;
  state.studyroomDongUnconfirmed = false;
  clearStudyroomDongId(state);
  rerender();
  try {
    const region = await ensureRegionFromKakao(result);
    const id = numericRegionId(region?.id);
    if (!id) throw new Error(DONG_RETRY_HINT);
    state.studyroomDongRegionId = id;
    if (!state.lastSearchFilters) state.lastSearchFilters = {};
    state.lastSearchFilters.preferred_studyroom_region_id = id;
    state.studyroomDongUnconfirmed = false;
  } catch {
    clearStudyroomDongId(state);
    state.studyroomDongUnconfirmed = true;
  } finally {
    state.studyroomDongPending = false;
    rerender();
  }
}

/** @param {import('./state.js').SearchTab} tab @param {Record<string, string|string[]>|null|undefined} filters @param {unknown} fallbackId */
function regionRestoreToken(tab, filters, fallbackId) {
  if (tab === 'tutor') return String(filters?.tutor_region_id || fallbackId || '');
  if (tab === 'student') {
    return String(
      filters?.preferred_studyroom_region_id || filters?.preferred_region_id || fallbackId || '',
    );
  }
  return String(fallbackId || '');
}

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
    const entry = prev[tab];
    const label = String(entry?.displayLabel || entry?.raw || '').trim();
    if (entry && entry.source === 'fallback' && STALE_GUEST_LABELS.has(label)) {
      delete prev[tab];
      localStorage.setItem(CANONICAL_STORAGE_KEY, JSON.stringify(prev));
      return null;
    }
    return deserializeCanonical(entry, axis);
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
  // 홍보1 기본값(source=saved)은 게스트 찾기 공부방 기준 저장값을 덮지 않는다.
  const promoSeed =
    canonical.source === 'saved' &&
    state.role === 'study_room' &&
    (tab === 'room' || tab === 'student');
  // 학생 위치는 서버 저장 지역이 기준이라 저장 선택(canonical)에 고정하지 않는다.
  if (tab && state.studyRoomHome !== true && !promoSeed && state.role !== 'guest' && state.role !== 'parent') {
    writeStoredCanonical(tab, canonical);
  }
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
    // 학생은 저장 지역을 URL에 박지 않는다. 다른 기기·새로고침에서도 서버 값을 다시 읽는다.
    const pinned =
      state.role !== 'parent' || ['url', 'address'].includes(String(state.canonicalLocation?.source || ''));
    const region = pinned ? String(state.activeRegionLabel || state.canonicalLocation?.displayLabel || '').trim() : '';
    if (region) params.set('region', region);
    else params.delete('region');

    const lat = pinned ? state.canonicalLocation?.lat : null;
    const lng = pinned ? state.canonicalLocation?.lng : null;
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
  if ((state.role || 'guest') === 'guest') {
    discardStaleGuestLocation();
    applyGuestPlace(tab, state);
    state._needsSearchRestore = false;
    state.searchExecuted = false;
    state.lastSearchFilters = null;
    return { needsSearchRestore: false };
  }
  const q = parseHashQuery();
  if (state.role === 'parent') {
    const canonical = hydrateStudentPlace(state, tab, q);
    return restoreFindSearch(state, tab, q, canonical, locationAxisForState(tab, state));
  }
  const viewerRoleEarly = state.role || 'guest';
  if (viewerRoleEarly === 'study_room' && tab === 'student') {
    const qHope = String(q.hope || q.preferred_lesson_type || '').trim();
    if (qHope === 'tutor') {
      state.studentHopeType = 'tutor';
      state.hopeTypeResolved = true;
    } else if (!state.hopeTypeResolved) {
      state.studentHopeType = 'study_room';
      state.hopeTypeResolved = true;
    }
  }
  if (viewerRoleEarly === 'tutor' && tab === 'student') {
    const qHope = String(q.hope || q.preferred_lesson_type || '').trim();
    if (qHope === 'study_room') {
      state.studentHopeType = 'study_room';
      state.hopeTypeResolved = true;
    } else if (!state.hopeTypeResolved) {
      state.studentHopeType = 'tutor';
      state.hopeTypeResolved = true;
    }
  }
  const hope =
    state.studentHopeType === 'study_room' || state.studentHopeType === 'tutor'
      ? state.studentHopeType
      : DEFAULT_STUDENT_HOPE_TYPE;
  const axis = axisFromSearchTab(tab, hope === 'tutor' || hope === 'study_room' ? hope : null);
  const savedLabel =
    tab === 'student'
      ? resolveFindDefaultRegion(hope, '')
      : tab === 'tutor'
        ? (viewerRoleEarly === 'tutor' ? tutorHomeRegionLabel(resolveTutorRegionIndex(state)) : '')
        : resolveFindDefaultRegion('study_room', '');
  const storedCanon = readStoredCanonical(tab, axis);
  const viewerRole = state.role || 'guest';
  const promo =
    viewerRole === 'study_room' && (tab === 'room' || tab === 'student') ? peekStudyRoomPromo1() : '';
  const tutorSaved =
    viewerRole === 'tutor' && tab === 'student' ? tutorRepresentativeRegionLabel() : '';
  const urlPinned = Boolean(String(q.region || '').trim());
  const ignoreStoredAddress =
    tab === 'student' && (viewerRole === 'study_room' || viewerRole === 'tutor');
  const addressPinned =
    state.canonicalLocation?.source === 'address' ||
    (!ignoreStoredAddress && storedCanon?.source === 'address');
  const savedPin = promo || tutorSaved;
  const promoDefault = Boolean(savedPin) && !urlPinned && !addressPinned;
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
        ? { raw: savedPin, source: 'saved' }
        : storedCanon?.source === 'saved'
          ? storedCanon
          : savedLabel || null,
      gps: null,
      fallback: promoDefault ? savedPin : null,
    },
    axis,
  );
  applyCanonicalLocation(state, canonical, tab);
  return restoreFindSearch(state, tab, q, canonical, axis);
}

/**
 * URL f·searched 로 검색 상태 복원
 * @param {FindSurfaceState} state
 * @param {import('./state.js').SearchTab} tab
 * @param {Record<string, string>} q
 * @param {import('../../shared/location-display.js').CanonicalLocation} canonical
 * @param {import('../../shared/location-display.js').LocationAxis} axis
 * @returns {{ needsSearchRestore: boolean }}
 */
function restoreFindSearch(state, tab, q, canonical, axis) {
  let needsSearchRestore = false;
  const urlFilters = q.f ? decodeFiltersFromUrl(q.f) : null;
  const storedFilters = readStoredFilters(tab);
  const wantsSearch = q.searched === '1' || q.searched === 'true';
  /** @type {Record<string, string|string[]>|null} */
  let filters = null;
  if (urlFilters && Object.keys(urlFilters).length) {
    // URL f payload 최우선. 과외·학생의 옛 라벨은 지역 조건을 뺀다.
    filters = dropLegacyLessonRegionFilters(tab, urlFilters);
  } else if (wantsSearch) {
    // searched=1 이고 f 없음: 공부방은 표시 라벨, 과외·학생은 선택 단위 id만.
    filters = storedFilters && Object.keys(storedFilters).length ? { ...storedFilters } : {};
    const region = canonical.displayLabel;
    const studentScope = state.role === 'parent' ? studentFeedFilters(tab, state) : null;
    if (studentScope) {
      for (const key of STUDENT_REGION_FILTER_KEYS) delete filters[key];
      Object.assign(filters, studentScope);
    } else if (tab === 'room') {
      delete filters.region_id;
      filters.region_label = region;
    } else if (tab === 'tutor') {
      delete filters.tutor_region_label;
      const id = selectableFindRegionId(canonical.regionId);
      if (id) filters.tutor_region_id = id;
      else delete filters.tutor_region_id;
    } else {
      delete filters.preferred_region_label;
      delete filters.preferred_region;
      const id = selectableFindRegionId(canonical.regionId);
      if (id) filters.preferred_region_id = id;
      else delete filters.preferred_region_id;
      preserveStudyroomRegionId(filters);
    }
  } else if (storedFilters && Object.keys(storedFilters).length) {
    filters = dropLegacyLessonRegionFilters(tab, storedFilters);
  }
  if (wantsSearch && filters && Object.keys(filters).length) {
    state.searchExecuted = true;
    state.lastSearchFilters = filters;
    const restoreKey = `${tab}::${encodeFiltersForUrl(filters)}::${regionRestoreToken(tab, filters, canonical.regionId)}`;
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
  if ((state.role || 'guest') === 'guest') {
    state._gpsBootedTab = tab;
    logLocationDebug('gps-skip', { reason: 'guest-fixed' });
    return;
  }
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
  if (!geo?.displayLabel) {
    logLocationDebug('gps-skip', { reason: 'broad-region-only' });
    return;
  }
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
  if (state.role === 'parent') {
    // 학생 임시값은 서버 저장 지역만 비춘다. GPS 위치는 이 화면에서만 쓴다.
    state._placeTab = tab;
  } else if (tab === 'room' || (tab === 'student' && hope === 'study_room')) {
    writeStoredHopeRegion(tab === 'room' ? 'study_room' : 'study_room', geo.displayLabel);
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
 * @property {number} [tutorStudentRegionIndex] — 과외쌤 홈 학생 탭이 고른 활동지역 0~2 (없으면 대표)
 * @property {string} [studentLessonFormat]
 * @property {object[]} [searchRows]
 * @property {object[]} [searchItems]
 * @property {boolean} [homeSelf] — 홈 자기 노출 탭 (과외쌤 우리동네 과외쌤 등)
 * @property {'tutor'|'study_room'|null} [studentHopeType] — 학생찾기 희망 유형
 * @property {boolean} [hopeTypeResolved] — 희망 유형 선택/복원 완료
 * @property {import('../../shared/location-display.js').CanonicalLocation|null} [canonicalLocation]
 * @property {Record<string, string|string[]>|null} [lastSearchFilters]
 * @property {boolean} [hasRequestSummary] — 학생찾기 기본필터 한 줄 요청문 있음
 * @property {string} [studyroomDongRegionId] — 주소찾기로 확정한 공부방 희망 동 id
 * @property {boolean} [studyroomDongPending] — 동 행 확정 요청 중
 * @property {boolean} [studyroomDongUnconfirmed] — 주소는 골랐으나 동 id 확정 실패
 * @property {boolean} [_needsSearchRestore]
 * @property {string|null} [_gpsBootedTab]
 * @property {Record<string, import('../../shared/location-display.js').CanonicalLocation>} [studentPicks] — 학생이 이 화면에서 주소찾기로 고른 위치(저장하지 않음)
 * @property {string} [_placeTab] — 학생 현재 위치가 잡힌 탭
 * @property {'idle'|'loading'|'ready'|'error'} [studentFeedStatus]
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
  const count = tutorHomeRegionsReady() ? 3 : 0;
  return idx >= 0 && idx < count ? idx : 0;
}

/**
 * 과외쌤 홈 「우리동네 학생」 탭이 보는 활동지역 슬롯. 탭을 누르기 전에는 대표 지역.
 * 과외쌤 탭(tutorRegionIndex)과 따로 둔다.
 * @param {FindSurfaceState} state
 */
export function resolveTutorStudentRegionIndex(state) {
  const picked = Number(state?.tutorStudentRegionIndex);
  if (Number.isInteger(picked) && picked >= 0 && picked <= 2) return picked;
  return tutorHomePrimaryIndex();
}

/** 과외쌤 홈 학생 탭 지역 라벨(선택 탭 → 없으면 대표). @param {FindSurfaceState} state */
export function tutorStudentRegionLabel(state) {
  return tutorHomeRegionLabel(resolveTutorStudentRegionIndex(state)) || tutorHomePrimaryLabel();
}

function isTutorMockCityLabel(label) {
  const text = String(label || '').trim();
  return text === '서울시' || text === '부산시' || text === '인천시';
}

/** 과외쌤 홈 칩·지역 라벨. saved_regions[idx].label. MOCK 시 이름은 쓰지 않는다. */
function tutorSavedSlotLabel(state) {
  return tutorHomeRegionLabel(resolveTutorRegionIndex(state));
}

function readTutorHomeRegionsForTabs() {
  const loaded = readTutorHomeRegions();
  const slots = Array.isArray(loaded) ? loaded.slice(0, 3) : [];
  while (slots.length < 3) slots.push({ label: '', primary: false });
  return slots;
}

/** 과외쌤 로그인 지역대표(활동지역1). 현재위치 문구만 이 값을 쓴다. */
export function tutorRepresentativeRegionLabel() {
  return tutorHomePrimaryLabel();
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
  if (tab === 'student' && role === 'study_room' && !state.searchExecuted) {
    ctx.promoStudent = true;
    ctx.liveStudentItems = getStudyRoomStudentLiveItems();
    ctx.hopeType = 'study_room';
  }
  if (tab === 'student' && role === 'tutor' && state.tutorStudentSnap === true && !state.searchExecuted) {
    ctx.promoStudent = true;
    ctx.hopeType = 'tutor';
    ctx.liveStudentItems = getTutorStudentLiveItems();
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
  if (!canonical.displayLabel) {
    const alt = memberRepresentativeRaw(tab, state);
    if (alt && alt !== String(label || '').trim()) {
      return canonicalRegionLabel(alt, tab, state);
    }
  }
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
  if (viewer === 'guest') return applyGuestPlace(tab, state);
  if (viewer === 'parent') return resolveStudentActivePlace(tab, state);
  if (viewer === 'study_room' && tab === 'student' && !state.hopeTypeResolved) {
    state.role = 'study_room';
    state.studentHopeType = 'study_room';
    state.hopeTypeResolved = true;
  }
  const promoFind =
    viewer === 'study_room' &&
    (tab === 'room' || tab === 'student') &&
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
  if (viewer === 'tutor' && tab === 'tutor') {
    const kept = isTutorMockCityLabel(state.activeRegionLabel) ? '' : String(state.activeRegionLabel || '').trim();
    return canonicalRegionLabel(kept || tutorSavedSlotLabel(state), tab, state);
  }
  if (state.activeRegionLabel && !(viewer === 'tutor' && isTutorMockCityLabel(state.activeRegionLabel))) {
    return canonicalRegionLabel(state.activeRegionLabel, tab, state);
  }
  if (tab === 'tutor') {
    const label = viewer === 'tutor' ? tutorSavedSlotLabel(state) : '';
    return label ? canonicalRegionLabel(label, tab, state) : '';
  }
  if (tab === 'room') return '';
  const hope =
    state.studentHopeType === 'study_room' || state.studentHopeType === 'tutor'
      ? state.studentHopeType
      : DEFAULT_STUDENT_HOPE_TYPE;
  const guestFallback = '';
  return canonicalRegionLabel(resolveFindDefaultRegion(hope, guestFallback), tab, state);
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {Record<string, unknown>} filters
 * @param {FindSurfaceState} state
 */
function regionLabelFromFilters(tab, filters, state, role) {
  const viewer = role || state.role || 'guest';
  if (viewer === 'guest') return applyGuestPlace(tab, state);
  if (viewer === 'parent') return studentLabelFromFilters(tab, filters, state);
  let raw = '';
  if (tab === 'tutor') {
    const guLabel = activityLabelFromRegionId(filters.tutor_region_id, findCityUnits);
    if (guLabel) return applyGuDisplayLabel(state, String(filters.tutor_region_id), guLabel);
    raw = String(filters.tutor_region_id || filters.tutor_region_label || '').trim();
    if (!raw || (viewer === 'tutor' && isTutorMockCityLabel(raw))) {
      raw = viewer === 'tutor' ? tutorSavedSlotLabel(state) : '';
    }
  } else if (tab === 'room') {
    raw =
      String(filters.region_label || filters.region_id || '').trim() ||
      (state.role === 'study_room' ? peekStudyRoomPromo1() : '');
  } else {
    const guId = filters.preferred_region_id || filters.preferred_region;
    const guLabel = activityLabelFromRegionId(guId, findCityUnits);
    if (guLabel && resolveStudentSearchHope(state) !== 'study_room') {
      return applyGuDisplayLabel(state, String(guId), guLabel);
    }
    raw = String(
      filters.preferred_region_label || filters.preferred_region || filters.region_label || '',
    ).trim();
    if (viewer === 'tutor' && isTutorMockCityLabel(raw)) raw = tutorHomePrimaryLabel();
    if (!raw) {
      const promo = state.role === 'study_room' ? peekStudyRoomPromo1() : '';
      if (promo) {
        raw = promo;
      } else {
        const hope =
          state.studentHopeType === 'study_room' || state.studentHopeType === 'tutor'
            ? state.studentHopeType
            : DEFAULT_STUDENT_HOPE_TYPE;
        const guestFallback = '';
        raw = resolveFindDefaultRegion(hope, guestFallback);
      }
    }
  }
  return canonicalRegionLabel(raw, tab, state);
}

/**
 * 학생 검색 결과 위치 라벨. 저장 지역 id면 서버 라벨, 직접 고른 지역이면 그 라벨.
 * @param {import('./state.js').SearchTab} tab
 * @param {Record<string, unknown>} filters
 * @param {FindSurfaceState} state
 */
function studentLabelFromFilters(tab, filters, state) {
  const target = studentTarget(tab, state);
  const ids =
    tab === 'room'
      ? [filters.sigungu_region_id, filters.region_id]
      : tab === 'tutor'
        ? [filters.tutor_region_id]
        : [filters.preferred_studyroom_region_id, filters.preferred_region_id, filters.preferred_region];
  const id = ids.map(numericRegionId).find(Boolean) || '';
  if (id && target && id === target.id) return applyStudentPlace(state, tab, studentSavedCanonical(target, tab));
  const roomLabel = tab === 'room' ? String(filters.region_label || '').trim() : '';
  if (roomLabel) {
    if (state.canonicalLocation?.displayLabel === roomLabel && state._placeTab === tab) return roomLabel;
    return applyStudentPlace(state, tab, studentPickedCanonical({ raw: roomLabel, source: 'session' }, tab, state));
  }
  const label = id ? activityLabelFromRegionId(id, findCityUnits) : '';
  if (label) {
    applyGuDisplayLabel(state, id, label);
    state.canonicalLocation.source = 'session';
    state._placeTab = tab;
    return label;
  }
  return resolveStudentActivePlace(tab, state);
}

/** 구 단위 표시는 cascade 라벨을 그대로 둔다. */
function applyGuDisplayLabel(state, regionId, label) {
  const text = String(label || '').trim();
  state.activeRegionLabel = text;
  const prev = state.canonicalLocation;
  state.canonicalLocation = {
    province: '',
    city: '',
    district: '',
    dong: '',
    apartmentName: '',
    displayLabel: text,
    searchScopeLabel: text,
    regionKey: text.toLowerCase(),
    regionId,
    level: 'district',
    lat: prev?.lat ?? null,
    lng: prev?.lng ?? null,
    raw: text,
    axis: 'tutor',
    source: prev?.source || 'session',
  };
  return text;
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
  if (state.role === 'parent') return ensureParentHope(state);
  if (state.role === 'study_room') {
    const qHope = String(parseHashQuery().hope || parseHashQuery().preferred_lesson_type || '').trim();
    if (qHope === 'tutor') {
      state.studentHopeType = 'tutor';
      state.hopeTypeResolved = true;
    } else if (!state.hopeTypeResolved) {
      state.studentHopeType = 'study_room';
      state.hopeTypeResolved = true;
    }
    return state.studentHopeType === 'tutor' ? 'tutor' : 'study_room';
  }
  if (state.role === 'tutor') {
    const qHope = String(parseHashQuery().hope || parseHashQuery().preferred_lesson_type || '').trim();
    if (qHope === 'study_room') {
      state.studentHopeType = 'study_room';
      state.hopeTypeResolved = true;
    } else if (!state.hopeTypeResolved) {
      state.studentHopeType = 'tutor';
      state.hopeTypeResolved = true;
    }
    return state.studentHopeType === 'study_room' ? 'study_room' : 'tutor';
  }
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
  if (!state.searchExecuted && (role || state.role || 'guest') === 'guest') {
    const regionLabel = applyGuestPlace(tab, state);
    const items = guestFeedItems(tab);
    state.studentDemandPending = false;
    state.activeResultItems = items;
    state.activeResultSource = 'region';
    logLocationDebug('list-fetch', { tab, mode: 'guest-region', region: regionLabel, count: items.length });
    return items;
  }
  if (!state.searchExecuted && (role || state.role) === 'parent') {
    const regionLabel = resolveStudentActivePlace(tab, state);
    const feed = studentFeedEntry(tab, state);
    state.studentDemandPending = false;
    state.studentFeedStatus = feed.status;
    state.activeResultItems = feed.items;
    state.activeResultSource = 'region';
    logLocationDebug('list-fetch', { tab, mode: 'student-region', region: regionLabel, count: feed.items.length });
    return feed.items;
  }
  if (!state.searchExecuted) {
    const regionLabel = resolveActiveRegionLabel(tab, state, role);
    const feed = getRegionFeed(tab, {
      ...regionFeedContext(tab, state, role),
      regionLabel,
    });
    const { items, regionLabel: feedLabel } = feed;
    state.studentDemandPending = feed.pending === true;
    state.activeResultItems = items;
    state.activeResultSource = 'region';
    let nextLabel = feedLabel || regionLabel;
    if (role === 'tutor' && isTutorMockCityLabel(nextLabel)) {
      nextLabel = tutorSavedSlotLabel(state);
    }
    state.activeRegionLabel = canonicalRegionLabel(nextLabel, tab, state);
    logLocationDebug('list-fetch', {
      tab,
      mode: 'region',
      region: state.activeRegionLabel,
      count: items.length,
    });
    return items;
  }

  state.studentDemandPending = false;
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
  state.studyroomDongRegionId = '';
  state.studyroomDongPending = false;
  state.studyroomDongUnconfirmed = false;
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
/** 광역만 남았을 때 회원이 돌아가 쓸 대표 지역. */
function memberRepresentativeRaw(tab, state) {
  const role = state.role || 'guest';
  if (role === 'study_room') {
    const promo = peekStudyRoomPromo1();
    if (promo) return promo;
  }
  if (role === 'tutor') {
    const saved = tutorRepresentativeRegionLabel();
    if (saved) return saved;
  }
  return '';
}

/** 공부방 로그인 현재위치. 시 이름만 두지 않고 동을 쓴다. */
export function studentCurrentPlace(label) {
  const text = String(label || '').trim();
  const promo = peekStudyRoomPromo1();
  const promoDong = studyRoomPromo1Dong();
  if (promoDong && (!text || text === promo || text.includes(promoDong))) return promoDong;
  const parsed = normalizeLocation({ raw: text }, 'room').dong;
  if (parsed) return String(parsed).trim();
  if (promoDong) return promoDong;
  return '';
}

function resolveStudentSearchHope(state) {
  if (state.studentHopeType === 'study_room' || state.studentHopeType === 'tutor') {
    return state.studentHopeType;
  }
  if (state.role === 'study_room') return 'study_room';
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

/** @param {FindSurfaceState} state */
function cascadePickForTutor(state) {
  const fromFilter = String(state.lastSearchFilters?.tutor_region_id || '').trim();
  if (fromFilter) {
    const id = selectableFindRegionId(fromFilter);
    return id ? { regionId: id, stale: false } : { regionId: fromFilter, stale: findCityUnits.length > 0 };
  }
  if (state.role === 'parent') return { regionId: studentCascadeRegionId('tutor', state), stale: false };
  const slot = readTutorHomeRegions()?.[resolveTutorRegionIndex(state)];
  const slotId = selectableFindRegionId(slot?.regionId);
  if (slotId) return { regionId: slotId, stale: false };
  const stored = resolveFindDefaultRegion('tutor', '');
  const storedId = selectableFindRegionId(stored);
  if (storedId) return { regionId: storedId, stale: false };
  if (stored || (slot?.regionId && !slotId) || (slot?.label && !slotId)) {
    return { regionId: stored || String(slot?.regionId || 'stale'), stale: findCityUnits.length > 0 };
  }
  return { regionId: '', stale: false };
}

/** @param {FindSurfaceState} state */
function cascadePickForStudent(state) {
  const fromFilter = String(
    state.lastSearchFilters?.preferred_region_id || state.lastSearchFilters?.preferred_region || '',
  ).trim();
  if (/^\d+$/.test(fromFilter)) {
    const id = selectableFindRegionId(fromFilter);
    return id ? { regionId: id, stale: false } : { regionId: fromFilter, stale: findCityUnits.length > 0 };
  }
  if (state.role === 'parent') return { regionId: studentCascadeRegionId('student', state), stale: false };
  const stored = resolveFindDefaultRegion('tutor', '');
  const storedId = selectableFindRegionId(stored);
  if (storedId) return { regionId: storedId, stale: false };
  if (stored || fromFilter) return { regionId: stored || fromFilter, stale: findCityUnits.length > 0 };
  return { regionId: '', stale: false };
}

/** 학생 시·군·구 선택 기본값: 지금 위치(저장 지역·직접 고른 구)의 선택 단위 id. */
function studentCascadeRegionId(tab, state) {
  const cur = state.canonicalLocation;
  if (cur?.level !== 'district' || state._placeTab !== tab) return '';
  return selectableFindRegionId(cur.regionId) || regionIdFromActivityLabel(cur.displayLabel, findCityUnits);
}

/**
 * @param {FindSurfaceState} state
 * @param {{ compact?: boolean, label: string, dbHint: string, hiddenName: string, idPrefix: string, pick: { regionId: string, stale: boolean } }} opts
 */
function renderGuCascadeField(state, opts) {
  void state;
  const compact = opts.compact === true;
  const body = findCityUnits.length
    ? renderRegionCascade({
        idPrefix: opts.idPrefix,
        units: findCityUnits,
        regionId: opts.pick.regionId,
        stale: opts.pick.stale,
        selectClass: 'search-field__control',
        hiddenName: opts.hiddenName,
      })
    : `<p class="search-field__hint">${esc(findCitiesStatus === 'error' ? REGION_LIST_ERROR : '지역 목록을 불러오는 중…')}</p>
       <input type="hidden" name="${esc(opts.hiddenName)}" value="" />`;
  const note = GU_PICK_HINT;
  return `
    <div class="search-field${compact ? ' search-field--compact' : ''}" data-find-gu-field="${esc(opts.hiddenName)}">
      <span class="search-field__label">${esc(opts.label)} ${opts.dbHint}</span>
      ${body}
      <span class="search-field__hint">${esc(note)}</span>
    </div>`;
}

/**
 * @param {import('./search-schema.js').SEARCH_TABS.room.fields[0]} field
 * @param {FindSurfaceState} state
 * @param {{ compact?: boolean }} [opts]
 */
function renderField(field, state, opts = {}) {
  const compact = opts.compact === true;
  // 학생 홈 상태에는 role 이 없어 게스트로 판정되던 경로를 막는다. 다른 역할은 기존 판정 그대로.
  const role = opts.role === 'parent' ? 'parent' : state.role || 'guest';
  if (field.groupOnly && state.studentLessonFormat !== 'group') {
    return '';
  }

  const dbHint = compact
    ? ''
    : `<span class="search-field__db" title="DB">${esc(field.db)}</span>`;
  const name = `f_${field.key}`;

  if (field.key === 'preferred_lesson_type' && role === 'parent') {
    return `<input type="hidden" name="${esc(name)}" value="${esc(ensureParentHope(state))}" data-parent-branch-fixed />`;
  }

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
          <input type="number" class="search-field__control" name="${esc(name)}_min" placeholder="최소(천원)" min="0" step="1" />
          <span class="search-range__sep">~</span>
          <input type="number" class="search-field__control" name="${esc(name)}_max" placeholder="최대(천원)" min="0" step="1" />
        </div>
      </div>`;
  }

  if (field.input === 'grade') {
    const grade = gradeOptionHtml('', '');
    return `
      <label class="search-field${compact ? ' search-field--compact' : ''}">
        <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
        <select class="search-field__control" name="${esc(name)}" data-grade-depends="${esc(field.dependsOn || 'school_level')}"${grade.disabled ? ' disabled' : ''}>
          ${grade.html}
        </select>
      </label>`;
  }

  if (field.input === 'subject') {
    return `
      <label class="search-field${compact ? ' search-field--compact' : ''}">
        <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
        <select class="search-field__control" name="${esc(name)}">
          <option value="">과목 선택</option>
          ${MAIN_SUBJECT_OPTIONS.map((s) => `<option value="${esc(s.value)}">${esc(s.label)}</option>`).join('')}
        </select>
      </label>`;
  }

  if (field.input === 'university') {
    return renderUniversityNameField({
      variant: 'search',
      name,
      id: `search_${field.key}`,
      listId: `search_${field.key}_list`,
      label: '대학/대학원',
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
    city: '시',
    text: '입력',
  };

  const defaultRegion =
    field.key === 'preferred_region'
      ? String(
          state.lastSearchFilters?.preferred_region_label ||
            (role === 'parent' ? '' : state.lastSearchFilters?.preferred_region) ||
            resolveActiveRegionLabel('student', state, role) ||
            '',
        )
      : field.key === 'region_id'
        ? String(
            state.lastSearchFilters?.region_label ||
              (role === 'parent' ? '' : state.lastSearchFilters?.region_id) ||
              resolveActiveRegionLabel('room', state, role) ||
              '',
          )
        : field.key === 'tutor_region_id'
          ? String(
              state.lastSearchFilters?.tutor_region_label ||
                state.lastSearchFilters?.tutor_region_id ||
                resolveActiveRegionLabel('tutor', state, role) ||
                '',
            )
          : '';

  if (field.key === 'preferred_region' && inputKind === 'city') {
    return renderGuCascadeField(state, {
      compact,
      label: field.label,
      dbHint,
      hiddenName: 'f_preferred_region_id',
      idPrefix: 'find_student_region',
      pick: cascadePickForStudent(state),
    });
  }

  if (field.key === 'preferred_region' && inputKind === 'region') {
    const studyroomDongId = renderedStudyroomDongId(state);
    const regionHint = state.studyroomDongUnconfirmed ? DONG_RETRY_HINT : STUDYROOM_ADDRESS_HINT;
    return `
    <label class="search-field${compact ? ' search-field--compact' : ''}" data-student-region-field>
      <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
      <div class="search-field__address-row">
        <input type="text" class="search-field__control" name="${esc(name)}" value="${esc(defaultRegion)}" placeholder="${esc(placeholders.region)}" data-region-axis="region" readonly />
        <button type="button" class="btn btn--secondary btn--sm" data-action="find-region-address" data-region-field="preferred_region">주소찾기</button>
      </div>
      <input type="hidden" name="f_preferred_studyroom_region_id" value="${esc(studyroomDongId)}" />
      <span class="search-field__hint">${esc(regionHint)}</span>
    </label>`;
  }

  if (field.key === 'tutor_region_id') {
    return renderGuCascadeField(state, {
      compact,
      label: field.label,
      dbHint,
      hiddenName: 'f_tutor_region_id',
      idPrefix: 'find_tutor_region',
      pick: cascadePickForTutor(state),
    });
  }

  if (field.key === 'region_id') {
    return `
    <label class="search-field${compact ? ' search-field--compact' : ''}" data-find-region-field="${esc(field.key)}">
      <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
      <div class="search-field__address-row">
        <input type="text" class="search-field__control" name="${esc(name)}" value="${esc(defaultRegion)}" placeholder="${esc(placeholders.region)}" data-region-axis="region" readonly />
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

function renderBasicRows(fields, state, compact = false, role = state.role) {
  const row1 = fields.filter((f) => f.basicRow === 1);
  const row2 = fields.filter((f) => f.basicRow === 2);
  if (compact) {
    const all = [...row1, ...row2];
    return `<div class="search-grid search-grid--compact search-grid--detail">${all.map((f) => renderField(f, state, { compact: true, role })).join('')}</div>`;
  }
  return `
    <p class="search-row-label">1줄 · 핵심</p>
    <div class="search-grid">${row1.map((f) => renderField(f, state, { role })).join('')}</div>
    ${
      row2.length
        ? `<p class="search-row-label">2줄 · 보조</p><div class="search-grid">${row2.map((f) => renderField(f, state, { role })).join('')}</div>`
        : ''
    }`;
}

/**
 * @param {FindSurfaceState} state
 * @param {{ variant?: 'search' | 'home', role?: import('./state.js').ViewerRole, activeIndex?: number }} [options]
 */
function renderTutorRegionTabs(state, options = {}) {
  const variant = options.variant || 'search';
  const role = options.role || state.role || 'guest';
  const activeIdx = options.activeIndex ?? resolveTutorRegionIndex(state);
  const saved = role === 'tutor' ? readTutorHomeRegionsForTabs() : null;
  if (!saved || !saved.some((region) => region.label)) return '';
  const regions = saved;
  const tabs = regions.map((region, idx) => {
    const cls = ['tutor-region-tabs__btn', idx === activeIdx ? 'is-active' : ''].filter(Boolean).join(' ');
    const primaryMark = region.primary ? '<span class="tutor-region-tabs__primary">대표</span>' : '';
    const text = region.label || '미선택';
    return `<button type="button" class="${cls}" data-tutor-region="${idx}" role="tab" aria-selected="${idx === activeIdx}">${esc(text)}${primaryMark}</button>`;
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
  const role = options.role || 'guest';

  if (tab === 'tutor') {
    const guestSingle = role === 'guest';
    if (guestSingle) {
      const label = resolveActiveRegionLabel(tab, state, 'guest');
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
    if (role === 'parent') {
      const label = resolveActiveRegionLabel(tab, state, role) || STUDENT_PLACE_PROMPT;
      if (variant === 'home') {
        return `
          <div class="parent-home-region parent-home-region--tutor" aria-label="희망 지역">
            <span class="parent-home-region__badge">희망 지역</span>
            <strong class="parent-home-region__label">${esc(label)}</strong>
          </div>`;
      }
      return `
        <div class="search-region-auto search-region-auto--compact search-region-auto--tutor">
          <span class="search-region-auto__badge">희망 지역</span>
          <strong>${esc(label)}</strong>
        </div>`;
    }
    if (variant === 'home') {
      const tabs = renderTutorRegionTabs(state, { variant, role });
      if (role === 'tutor' && !tabs) return '';
      const badge = role === 'tutor' ? '활동 지역' : '희망 지역';
      return `
        <div class="parent-home-region parent-home-region--tutor" aria-label="${esc(badge)}">
          <span class="parent-home-region__badge">${esc(badge)}</span>
          ${tabs}
        </div>`;
    }
    return `
      <div class="search-region-auto search-region-auto--compact search-region-auto--tutor">
        ${renderTutorRegionTabs(state, { variant, role })}
        ${renderTutorRegionHint(role)}
      </div>`;
  }

  // 과외쌤 홈 학생 탭 — 과외쌤 탭과 같은 활동지역 3탭으로 조회 지역을 고른다.
  if (tab === 'student' && role === 'tutor' && variant === 'home') {
    const tabs = renderTutorRegionTabs(state, {
      variant,
      role,
      activeIndex: resolveTutorStudentRegionIndex(state),
    });
    if (!tabs) return '';
    return `
      <div class="parent-home-region parent-home-region--tutor" aria-label="활동 지역">
        <span class="parent-home-region__badge">활동 지역</span>
        ${tabs}
      </div>`;
  }

  const regionLabel =
    resolveActiveRegionLabel(tab, state, role) || (role === 'guest' ? guestServerPlace(tab) : memberPlacePrompt(role));
  if (variant === 'home') {
    const badge = tab === 'room' ? '우리동네' : '탐색 지역';
    return `
      <div class="parent-home-region" aria-label="내 지역">
        <span class="parent-home-region__badge">${esc(badge)}</span>
        <strong class="parent-home-region__label">${esc(regionLabel)}</strong>
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
    role = 'guest',
    homeSelf = false,
    hideSearchForm = false,
    hideRegionBar = false,
    hideSelfNote = false,
  } = options;
  if (homeSelf) state.homeSelf = true;
  if (role === 'parent') state.role = 'parent';
  const meta = SEARCH_TABS[tab];
  const basicFields = meta.fields.filter((f) => f.tier === 'basic');
  const expandedFields = meta.fields.filter((f) => f.tier === 'expanded');
  const activeItems = refreshActiveResultItems(tab, state, role);
  const homeSelfFlag = resolveHomeSelf(state);
  const ssotRegion = state.activeRegionLabel || resolveActiveRegionLabel(tab, state, role);
  if (showMap && ssotRegion) {
    const mapRegion = state.activeRegionLabel || '';
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
          ${renderBasicRows(basicFields, state, true, role)}
        </section>
        ${
          state.expanded
            ? `
        <section class="search-section search-section--expanded">
          <div class="search-grid search-grid--compact search-grid--detail">${expandedFields.map((f) => renderField(f, state, { compact: true, role })).join('')}</div>
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
    : state.activeRegionLabel || '';

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
          lat: state.canonicalLocation?.lat ?? null,
          lng: state.canonicalLocation?.lng ?? null,
          viewerRole: role,
          regionLevel: state.canonicalLocation?.level || '',
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
  if (role === 'parent') state.role = 'parent';
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

  state.tutorStudentSnap = role === 'tutor' && tab === 'student' && surfaceType === 'home';
  const activeItems = refreshActiveResultItems(tab, state, role);
  let regionLabel = state.activeRegionLabel || resolveActiveRegionLabel(tab, state, role);
  if (tab === 'student' && role === 'study_room') {
    regionLabel = studentCurrentPlace(regionLabel);
  }
  if (role === 'tutor' && tab === 'student' && surfaceType === 'search') {
    const saved = tutorRepresentativeRegionLabel();
    if (saved) regionLabel = saved;
  }
  if (role === 'guest') {
    regionLabel = guestServerPlace(tab);
    const status = guestFeedStatus(tab);
    if (!state.searchExecuted && status !== 'ready') {
      return `
      <section class="search-results search-results--pre" aria-label="내 지역 목록" ${debugAttrs} data-surface-type="${esc(surfaceType)}">
        <p class="search-results__hint"${status === 'error' ? ' role="alert"' : ''}>${status === 'error' ? GUEST_FEED_ERROR : GUEST_FEED_LOADING}</p>
      </section>`;
    }
    if (!state.searchExecuted && activeItems.length) {
      return `
      <section class="search-results search-results--pre" aria-label="내 지역 목록" ${debugAttrs} data-surface-type="${esc(surfaceType)}">
        ${renderGuestFeedList(tab, activeItems, regionLabel)}
      </section>`;
    }
  }
  if (role === 'tutor' && surfaceType === 'home' && !state.searchExecuted) {
    const idx = tab === 'student' ? resolveTutorStudentRegionIndex(state) : resolveTutorRegionIndex(state);
    const slot = tutorHomeRegionLabel(idx);
    regionLabel = slot || (tutorHomeRegionsReady() ? tutorRepresentativeRegionLabel() : '');
  }
  if (role !== 'guest' && role !== 'parent' && regionLabel) {
    const axis = locationAxisForState(tab, state);
    const caption = placeCaption(regionLabel, axis);
    if (caption) regionLabel = caption;
  }
  if (role === 'parent' && !state.searchExecuted) {
    const status = state.studentFeedStatus || 'idle';
    if (status === 'loading' || status === 'error') {
      return `
      <section class="search-results search-results--pre" aria-label="내 지역 목록" ${debugAttrs} data-surface-type="${esc(surfaceType)}">
        <p class="search-results__hint"${status === 'error' ? ' role="alert"' : ''}>${status === 'error' ? GUEST_FEED_ERROR : GUEST_FEED_LOADING}</p>
      </section>`;
    }
    if (!regionLabel) {
      return `
      <section class="search-results search-results--pre" aria-label="내 지역 목록" ${debugAttrs} data-surface-type="${esc(surfaceType)}">
        <p class="search-results__hint">${esc(STUDENT_PLACE_PROMPT)}</p>
      </section>`;
    }
    // 학생 홈 0건은 티어 렌더가 샘플+빈칸(공부방·과외쌤) / 「없다」 카피(학생)를 그린다.
    const homeEmpty = surfaceType === 'home' && status === 'ready' && !activeItems.length;
    const body =
      tab === 'room' && status === 'ready' && !activeItems.length && !homeEmpty
        ? `<p class="search-results__hint search-results__hint--empty-room">${esc(STUDENT_ROOM_EMPTY)}</p>`
        : renderSearchTierResults(tab, activeItems, { ...tierCtx, studentHomeReady: status === 'ready' }, {
            mode: 'region',
            regionLabel,
            surfaceType,
          });
    return `
      <section class="search-results search-results--pre" aria-label="내 지역 목록" ${debugAttrs} data-surface-type="${esc(surfaceType)}">
        ${body}
      </section>`;
  }

  if (tab === 'student' && role === 'study_room' && !state.searchExecuted && state.studentDemandPending) {
    return `
      <section class="search-results search-results--pre" aria-label="내 지역 목록" ${debugAttrs} data-surface-type="${esc(surfaceType)}">
        <p class="search-results__hint">학생 목록을 불러오는 중입니다.</p>
      </section>`;
  }

  /* 과외쌤 홈 학생 탭 — 활동지역 없음 / 조회 중 / 조회 실패 / 조회 끝 0건을 서로 다르게 그린다. */
  if (tab === 'student' && role === 'tutor' && surfaceType === 'home' && !state.searchExecuted) {
    const status = getTutorStudentFeedStatus();
    const wrap = (inner) => `
      <section class="search-results search-results--pre" aria-label="내 지역 목록" ${debugAttrs} data-surface-type="${esc(surfaceType)}" data-tutor-student-feed="${esc(status)}">
        ${inner}
      </section>`;
    if (status === 'no-region') {
      return wrap(`<p class="search-results__hint">${esc(TUTOR_HOME_STUDENT_COPY.noRegion)}</p>`);
    }
    if (status === 'error') {
      return wrap(`<p class="search-results__hint" role="alert">${esc(TUTOR_HOME_STUDENT_COPY.error)}</p>`);
    }
    if (status !== 'ready' || state.studentDemandPending) {
      return wrap(`<p class="search-results__hint">${esc(TUTOR_HOME_STUDENT_COPY.loading)}</p>`);
    }
    if (!activeItems.length) {
      return wrap(
        renderStateCard({
          title: TUTOR_HOME_STUDENT_COPY.emptyTitle(regionLabel),
          body: TUTOR_HOME_STUDENT_COPY.emptyBody,
          variant: 'empty',
          screenId: 'P13-zero',
        }),
      );
    }
  }

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

/** 시·도만, 시만처럼 구(시·군) 선택이 끝나지 않았으면 true. 아무것도 고르지 않았으면 false. */
function guPickIncomplete(form, tab, state) {
  if (tab === 'room') return false;
  if (tab === 'student' && state.studentHopeType === 'study_room') return false;
  const hiddenName = tab === 'tutor' ? 'f_tutor_region_id' : 'f_preferred_region_id';
  const hidden = form.querySelector(`[name="${hiddenName}"]`);
  if (hidden instanceof HTMLInputElement && /^\d+$/.test(hidden.value.trim())) return false;
  const prefix = tab === 'tutor' ? 'find_tutor_region' : 'find_student_region';
  return ['sido', 'city', 'gu'].some((step) => {
    const sel = form.querySelector(`#${prefix}_${step}`);
    if (!(sel instanceof HTMLSelectElement) || !sel.value) return false;
    const wrap = sel.closest('[data-city-wrap], [data-gu-wrap]');
    return !(wrap instanceof HTMLElement && wrap.hidden);
  });
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {HTMLFormElement} form
 * @param {FindSurfaceState} state
 * @param {import('./state.js').ViewerRole} role
 * @param {() => void} rerender
 */
export async function runFindSearch(tab, form, state, role, rerender) {
  if (guPickIncomplete(form, tab, state)) {
    const hint = form.querySelector('[data-find-gu-field] .search-field__hint');
    if (hint) hint.textContent = GU_PICK_HINT;
    return;
  }
  if (tab === 'student' && resolveStudentSearchHope(state) === 'study_room' && (state.studyroomDongPending || state.studyroomDongUnconfirmed)) {
    const hint = form.querySelector('[data-student-region-field] .search-field__hint');
    if (hint) hint.textContent = DONG_RETRY_HINT;
    state.searchExecuted = true;
    state.searchLoading = false;
    state.searchError = DONG_RETRY_HINT;
    state.searchExposureItems = [];
    state.searchTotal = 0;
    if (state.searchRows) state.searchRows = [];
    if (state.searchItems) state.searchItems = [];
    refreshActiveResultItems(tab, state, role);
    rerender();
    return;
  }
  const filters = collectFiltersFromForm(form, tab);
  if (tab === 'room' && role === 'parent' && state.canonicalLocation?.source === 'saved') {
    // 저장 지역 그대로 검색: 라벨 매칭 대신 저장 id(시·군·구 전체 또는 동)로 건다.
    const scope = studentFeedFilters('room', state);
    if (scope) {
      delete filters.region_label;
      delete filters.region_id;
      Object.assign(filters, scope);
    }
  }
  if (tab === 'student' && state.studentHopeType) {
    filters.preferred_lesson_type = state.studentHopeType;
  }
  if (tab === 'student') settleStudentStudyroomRegionFilter(filters);
  if (tab === 'student' && role === 'study_room' && !filters.preferred_lesson_type) {
    filters.preferred_lesson_type = 'study_room';
    settleStudentStudyroomRegionFilter(filters);
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
  if (tab === 'student' && role === 'parent') filters.preferred_lesson_type = ensureParentHope(state);
  if (tab === 'student' && role === 'study_room') {
    delete filters.preferred_region_label;
    if (!filters.preferred_lesson_type) filters.preferred_lesson_type = 'study_room';
  }
  if (tab === 'student' && !filters.preferred_lesson_type && state.studentHopeType) {
    filters.preferred_lesson_type = state.studentHopeType;
  }
  if (tab === 'student') settleStudentStudyroomRegionFilter(filters);
  state.searchExecuted = true;
  state.searchLoading = true;
  state.searchError = null;
  state.lastSearchFilters = { ...filters };
  if (tab === 'student') {
    state.hasRequestSummary = isRequestSummaryFilterOn(filters.has_request_summary);
  }
  writeStoredFilters(tab, state.lastSearchFilters);

  const regionText = regionLabelFromFilters(tab, filters, state, role);
  // 학생은 regionLabelFromFilters 가 저장·선택 위치를 이미 확정한다. 축 변환으로 시·군·구를 지우지 않는다.
  if (role !== 'parent') {
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
  }
  // hydrate 재진입 시 동일 검색을 다시 돌리지 않도록 복원 키 선기록
  state._restoredSearchKey = `${tab}::${encodeFiltersForUrl(state.lastSearchFilters)}::${regionRestoreToken(tab, state.lastSearchFilters, state.canonicalLocation?.regionId)}`;
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
  if ((ctx.role || ctx.getState()?.role || 'guest') === 'guest') bootGuestPlaceBaseline(rerender);
  bootFindCities(rerender);
  bindUniversityNameField(root);
  bindRegionCascades(root, findCityUnits);
  root.querySelectorAll('[data-region-cascade]').forEach((el) => {
    el.addEventListener('change', () => {
      const hidden = el.querySelector('[data-field="region_id"]');
      const id = hidden instanceof HTMLInputElement ? selectableFindRegionId(hidden.value) : '';
      const tab = ctx.getTab();
      const label = id ? activityLabelFromRegionId(id, findCityUnits) : '';
      if (!state().lastSearchFilters) state().lastSearchFilters = {};
      if (tab === 'tutor') {
        delete state().lastSearchFilters.tutor_region_label;
        if (id) state().lastSearchFilters.tutor_region_id = id;
        else delete state().lastSearchFilters.tutor_region_id;
      }
      if (tab === 'student' && state().studentHopeType !== 'study_room') {
        delete state().lastSearchFilters.preferred_region_label;
        delete state().lastSearchFilters.preferred_region;
        if (id) state().lastSearchFilters.preferred_region_id = id;
        else delete state().lastSearchFilters.preferred_region_id;
        if (label && state().role !== 'parent') writeStoredHopeRegion('tutor', label);
      }
      if (id && label) {
        applyGuDisplayLabel(state(), id, label);
        if (state().role === 'parent') {
          state().canonicalLocation.source = 'session';
          state()._placeTab = tab;
        }
      }
    });
  });
  const formSelector = ctx.formSelector || '[data-search-form]';
  const state = () => ctx.getState();
  const getForm = () => root.querySelector(formSelector);
  if (ctx.role === 'parent') bootStudentFindFeed(ctx.getTab(), state(), rerender);

  const applyReset = () => {
    const form = getForm();
    const tab = ctx.getTab();
    resetFindSurface(state(), form instanceof HTMLFormElement ? form : undefined);
    if (ctx.role === 'study_room' && (tab === 'room' || tab === 'student')) {
      state().canonicalLocation = null;
      state().activeRegionLabel = '';
      if (tab === 'student') {
        state().studentHopeType = 'study_room';
        state().hopeTypeResolved = true;
      }
      seedStudyRoomPromoLabel(state(), tab);
    }
    if (ctx.role === 'parent') clearStudentPick(state(), tab);
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
      if (Number.isNaN(idx)) return;
      // 과외쌤 홈 학생 탭 — 슬롯만 바꾸고, 그 지역 학생 재조회는 홈 boot(bootTutorStudentDemand)가 한다.
      if (ctx.role === 'tutor' && ctx.getTab() === 'student') {
        if (resolveTutorStudentRegionIndex(state()) === idx) return;
        state().tutorStudentRegionIndex = idx;
        state().activeRegionLabel = canonicalRegionLabel(tutorHomeRegionLabel(idx), 'student', state());
        rerender();
        return;
      }
      if (resolveTutorRegionIndex(state()) === idx) return;
      const slotLabel = ctx.role === 'tutor' ? tutorHomeRegionLabel(idx) : '';
      state().tutorRegionIndex = idx;
      state().activeRegionLabel = canonicalRegionLabel(slotLabel, 'tutor', state());
      const form = getForm();
      resetFindSurface(state(), form instanceof HTMLFormElement ? form : undefined, { keepTutorRegion: true });
      state().activeRegionLabel = canonicalRegionLabel(slotLabel, 'tutor', state());
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
      await openKakaoPostcode(async (result) => {
        const canonical = canonicalFromKakao(result, tab, state());
        applyCanonicalLocation(state(), canonical, tab);
        if (state().role === 'parent') state()._placeTab = tab;
        const hope =
          tab === 'room'
            ? 'study_room'
            : state().studentHopeType === 'tutor' || state().studentHopeType === 'study_room'
              ? state().studentHopeType
              : 'study_room';
        const tutorGu = tab === 'tutor' || (tab === 'student' && hope === 'tutor');
        if (!tutorGu && (tab === 'student' || tab === 'room') && state().role !== 'parent') {
          writeStoredHopeRegion(tab === 'room' ? 'study_room' : hope, canonical.displayLabel);
        }
        const form = getForm();
        if (!tutorGu && form instanceof HTMLFormElement) {
          const name = tab === 'room' ? 'f_region_id' : 'f_preferred_region';
          const input = form.querySelector(`input[name="${name}"]`);
          if (input instanceof HTMLInputElement) input.value = canonical.displayLabel;
        }
        if (tab === 'student' && hope === 'study_room') {
          await confirmStudyroomDong(state(), result, rerender);
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
        await openKakaoPostcode(async (result) => {
          const canonical = canonicalFromKakao(result, tab, state());
          applyCanonicalLocation(state(), canonical, tab);
          if (state().role === 'parent') state()._placeTab = tab;
          const hope =
            tab === 'room'
              ? 'study_room'
              : state().studentHopeType === 'tutor' || state().studentHopeType === 'study_room'
                ? state().studentHopeType
                : 'study_room';
          const tutorGu = tab === 'tutor' || (tab === 'student' && hope === 'tutor');
          if (!tutorGu && input instanceof HTMLInputElement) input.value = canonical.displayLabel;
          if (!tutorGu && (tab === 'student' || tab === 'room') && state().role !== 'parent') {
            writeStoredHopeRegion(tab === 'room' ? 'study_room' : hope, canonical.displayLabel);
          }
          if (tab === 'student' && hope === 'study_room') {
            await confirmStudyroomDong(state(), result, rerender);
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
      if (state().role === 'parent') return;
      writeStoredHopeType(hope);
      state().studentHopeType = hope;
      state().hopeTypeResolved = true;
      if ((state().role || 'guest') === 'guest') {
        applyGuestPlace('student', state());
      } else {
        const nextRaw = resolveFindDefaultRegion(hope, '');
        state().activeRegionLabel = nextRaw ? canonicalRegionLabel(nextRaw, 'student', state()) : '';
      }
      const raw = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
      const qIdx = raw.indexOf('?');
      const params = new URLSearchParams(qIdx === -1 ? '' : raw.slice(qIdx + 1));
      params.set('hope', hope);
      if (!params.get('role')) {
        const role = state().role;
        if (role && role !== 'guest') params.set('role', role);
      }
      window.location.hash = `#/search/student?${params.toString()}`;
      rerender();
    });
  });

  root.querySelectorAll('[data-grade-depends]').forEach((grade) => {
    if (!(grade instanceof HTMLSelectElement)) return;
    const key = grade.getAttribute('data-grade-depends') || 'school_level';
    const form = grade.closest('form') || root;
    const level = form.querySelector(`[name="f_${key}"]`);
    if (!(level instanceof HTMLSelectElement)) return;
    const sync = () => {
      const next = gradeOptionHtml(level.value, '');
      grade.disabled = next.disabled;
      grade.innerHTML = next.html;
    };
    level.addEventListener('change', sync);
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
      if (state().role === 'parent') return;
      if (v === 'tutor' || v === 'study_room') {
        state().studentHopeType = v;
        state().hopeTypeResolved = true;
        writeStoredHopeType(v);
        if ((state().role || 'guest') === 'guest') {
          applyGuestPlace('student', state());
        } else {
          const nextRaw = resolveFindDefaultRegion(v, '');
          state().activeRegionLabel = nextRaw ? canonicalRegionLabel(nextRaw, 'student', state()) : '';
        }
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
