/**
 * 찾기 화면 — 지역·게스트·학생 피드·주소 복원.
 * search-find-surface.js 가 같은 함수 이름으로 다시 내보낸다.
 */

/** @typedef {import('./search-find-surface.js').FindSurfaceState} FindSurfaceState */

import { getRegionFeed, getStudentDemandForRegion } from './search-region-feed.js';
import {
  getStudyRoomHomeFeedStatus,
  getStudyRoomHomeLiveItems,
  getStudyRoomStudentFeedStatus,
  getStudyRoomStudentLiveItems,
  peekStudyRoomPromo1,
  resolveStudyRoomMapQuery,
  retryStudyRoomHome,
  retryStudyRoomStudentDemand,
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
  getTutorHomeTutorLiveItems,
  getTutorHomeTutorFeedStatus,
} from '@home-ui/tutor-home-seed.js';
import { collectFiltersFromForm, searchApi, settleRoomAddressFilters, settleStudentStudyroomRegionFilter } from './search-api.js';
import { complexNameFromKakao } from '../../shared/complex-name-from-kakao.js';
import { mapSearchResultsToExposure } from './search-exposure-mapper.js';
import { renderBrowseList, renderGuestPaginatedListBlock } from '@home-ui/exposure-render.js';
import { seedRecommendedFromItems } from '@home-ui/user-actions-ui.js';
import { SECTION_HEADINGS, renderSectionTitleBar } from '@home-ui/section-headings.js';
import { renderStateCard } from '@home-ui/empty-state-copy.js';
import { TUTOR_HOME_STUDENT_COPY } from '@home-ui/student-reg/student-reg-copy.js';
import {
  DEFAULT_STUDENT_HOPE_TYPE,
  renderHopeTypeGate,
  resolveHopeTypeFromQuery,
  writeStoredHopeType,
} from './student-hope-type.js';
import { parentBranch } from '../../shared/site-nav-config.js';
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
  REGION_NEED_CITY,
  activityLabelFromRegionId,
  bindRegionCascades,
  cascadeIncompleteHint,
  normalizeCities,
  regionIdFromActivityLabel,
  renderRegionCascade,
  resolveCascade,
} from '../../shared/region-cascade.js';
import {
  TUTOR_UNIT_LIST_ERROR,
  bindTutorUnitCascades,
  normalizeTutorUnits,
  renderTutorUnitCascade,
  tutorUnitIdForAddress,
  tutorUnitIdFromLabel,
  tutorUnitLabelFromId,
} from '../../shared/tutor-unit-cascade.js';
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
  studentPlacePromptFor,
  memberPlacePrompt,
  expandKakaoSido,
  loadGuestBaseline,
  readGuestBaseline,
  guestScopeFilters,
} from '../../shared/location-display.js';
import { openKakaoPostcode } from '../../shared/kakao-postcode.js';
import { ensureRegionFromKakao } from '../../shared/region-ensure.js';

/** 공부방 매퍼가 빠뜨리는 찜·비교·쪽지 집계를 검색 원본에서 다시 붙인다. */
export function withPublicCounts(tab, raw, mapped) {
  if (tab !== 'room' && tab !== 'tutor') return mapped;
  const byId = new Map((Array.isArray(raw) ? raw : []).map((row) => [Number(row?.id), row]));
  return mapped.map((item) => {
    const src = byId.get(Number(item?.id));
    if (!src) return item;
    item.wish_count = Number(src.wish_count) || 0;
    item.compare_count = Number(src.compare_count) || 0;
    item.message_count = Number(src.message_count) || 0;
    return item;
  });
}

const FILTERS_STORAGE_KEY = 'study114-find-filters-v1';
const CANONICAL_STORAGE_KEY = 'study114-find-canonical-v1';
const HOPE_REGION_STORAGE_KEY = 'study114.studentFind.lastRegionByHope';
const STALE_GUEST_LABELS = new Set(['서울시', '부산시', '인천시', '서울 강남구 대치동']);
let guestBaselineBooted = false;

/** 게스트 축. 공부방은 동(대치동), 과외쌤은 과외 단위(서울특별시), 학생은 구(서울시 강남구). 학생 희망유형과 무관하다. */
function guestAxis(tab) {
  return tab === 'room' ? 'room' : 'tutor';
}

/** 게스트 현재 위치. 공부방 대치동, 과외쌤 서울특별시, 학생 서울시 강남구. */
export function guestServerPlace(tab) {
  const base = readGuestBaseline();
  if (guestAxis(tab) === 'room') return base.room;
  return tab === 'student' ? base.student : base.tutor;
}

/** @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state */
export function applyGuestPlace(tab, state) {
  const canonical = normalizeLocation({ raw: guestServerPlace(tab), source: 'fallback' }, guestAxis(tab));
  canonical.source = 'fallback';
  applyCanonicalLocation(state, canonical, tab);
  return canonical.displayLabel;
}

/** @param {() => void} rerender */
export function bootGuestPlaceBaseline(rerender) {
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
export const GUEST_FEED_LOADING = '목록을 불러오는 중입니다.';
export const GUEST_FEED_ERROR = '목록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';

/** @param {import('./state.js').SearchTab} tab */
function guestFeedItems(tab) {
  return guestFeeds[tab]?.items || [];
}

/** 아직 부르지 않았으면 loading. 빈 칸은 ready 이고 0건일 때만 그린다. */
export function guestFeedStatus(tab) {
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
      guestFeeds[tab] = { status: 'ready', items: withPublicCounts(tab, raw, mapSearchResultsToExposure(tab, raw)) };
      rerender();
    })
    .catch((err) => {
      console.warn('[guest-find-feed]', tab, err);
      guestFeeds[tab] = { status: 'error', items: [] };
      rerender();
    });
}

/**
 * 게스트 찾기 하단 실카드. 0건이면 이 함수를 부르지 않고 빈 칸 블록을 그린다.
 * @param {import('./state.js').SearchTab} tab
 * @param {object[]} items
 * @param {string} regionLabel
 */
export function renderGuestFeedList(tab, items, regionLabel) {
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
  bootFindTutorUnits(rerender);
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
export const STUDENT_ROOM_EMPTY = '이 동네 공부방이 아직 도착하지 않았어요';

/**
 * 찾기 화면은 세션이 확정한 분기만 쓴다. 모르면 null.
 * 홈 탭은 studentBranch() 를 그대로 쓴다.
 * @param {FindSurfaceState} state
 * @returns {'tutor'|'study_room'|null}
 */
export function parentFindBranch(state) {
  if (state?.findSurface === 'search') {
    const branch = parentBranch();
    return branch === 'tutor' || branch === 'study_room' ? branch : null;
  }
  return studentBranch();
}

/** 학생 희망 유형. 찾기 화면은 세션 분기, 홈은 기존 분기. URL ?hope= 는 보지 않는다. @param {FindSurfaceState} state */
export function ensureParentHope(state) {
  const branch = parentFindBranch(state);
  if (branch === 'tutor' || branch === 'study_room') {
    state.studentHopeType = branch;
    state.hopeTypeResolved = true;
    return branch;
  }
  state.studentHopeType = null;
  state.hopeTypeResolved = false;
  return null;
}

/** @param {FindSurfaceState} state @returns {'tutor'|'study_room'|null} */
function studentHope(state) {
  return ensureParentHope(state);
}

/** @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state */
export function studentTarget(tab, state) {
  const saved = readStudentSavedRegion();
  if (state?.findSurface === 'search') return studentPlaceFor(saved, tab, parentFindBranch(state));
  return studentPlaceFor(saved, tab);
}

/** 서버 저장 지역 → 화면 위치. 라벨은 서버 정식 라벨 그대로 둔다. */
export function studentSavedCanonical(target, tab) {
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
export function studentPickedCanonical(input, tab, state) {
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

export function applyStudentPlace(state, tab, canonical) {
  applyCanonicalLocation(state, canonical, tab);
  state._placeTab = tab;
  return canonical.displayLabel;
}

/** @returns {string} 학생 현재 위치 라벨. 저장 지역도 GPS도 없으면 '' */
export function resolveStudentActivePlace(tab, state) {
  state.role = 'parent';
  ensureParentHope(state);
  if (studentUserPinned(state, tab)) return state.canonicalLocation.displayLabel;
  const saved = readStudentSavedRegion();
  if (state?.findSurface === 'search') syncStoredHopeRegionsFromSaved(saved, parentFindBranch(state));
  else syncStoredHopeRegionsFromSaved(saved);
  const target = state?.findSurface === 'search'
    ? studentPlaceFor(saved, tab, parentFindBranch(state))
    : studentPlaceFor(saved, tab);
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
 * 현재 위치(동·단지 또는 시·군·구)에서 상위 시·군·구 region id 를 구한다.
 * 도시 단위 목록(findCityUnits)이 없거나 시·군·구를 특정할 수 없으면 '' 반환.
 * @param {import('../../shared/location-display.js').CanonicalLocation|null|undefined} cur
 * @returns {string}
 */
function resolveCanonicalGuRegionId(cur) {
  if (!cur || !findCityUnits.length) return '';
  const directId = numericRegionId(cur.regionId);
  if (directId && activityLabelFromRegionId(directId, findCityUnits)) {
    return directId;
  }

  if (cur.level === 'district' && cur.displayLabel) {
    const labelId = regionIdFromActivityLabel(cur.displayLabel, findCityUnits);
    if (labelId) return labelId;
  }

  const sido = expandKakaoSido(cur.city || cur.province || '') || String(cur.city || cur.province || '').trim();
  const district = String(cur.district || cur.sigungu || '').trim();
  if (sido && district) {
    const id = regionIdFromActivityLabel(`${sido} ${district}`, findCityUnits);
    if (id) return id;
  }

  if (sido === '세종특별자치시' || sido === '세종') {
    const id = regionIdFromActivityLabel('세종특별자치시', findCityUnits);
    if (id) return id;
  }

  const rawText = String(cur.raw || cur.displayLabel || '').trim();
  if (rawText) {
    const parsed = normalizeLocation({ raw: rawText }, 'room');
    const parsedSido = expandKakaoSido(parsed.city || parsed.province || '') || String(parsed.city || parsed.province || '').trim();
    const parsedDistrict = String(parsed.district || '').trim();
    if (parsedSido && parsedDistrict) {
      const id = regionIdFromActivityLabel(`${parsedSido} ${parsedDistrict}`, findCityUnits);
      if (id) return id;
    }
    if (parsedSido === '세종특별자치시' || parsedSido === '세종') {
      const id = regionIdFromActivityLabel('세종특별자치시', findCityUnits);
      if (id) return id;
    }
  }

  return '';
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
    if (hope !== 'tutor' && hope !== 'study_room') return null;
    const scope = studentPlaceFilters(tab, studentTarget(tab, state), hope);
    if (scope && tab === 'student' && hope === 'study_room' && state.studyroomDongRegionId) {
      delete scope.preferred_region_id;
      scope.preferred_studyroom_region_id = numericRegionId(state.studyroomDongRegionId);
    }
    return scope;
  }
  if (tab === 'room') {
    const guId = resolveCanonicalGuRegionId(cur);
    return guId ? { sigungu_region_id: guId } : null;
  }
  const id = isTutorUnitAxis(tab, state)
    ? tutorUnitIdForPlace(cur)
    : selectableFindRegionId(cur.regionId) || regionIdFromActivityLabel(cur.displayLabel, findCityUnits);
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
  bootFindTutorUnits(rerender);
  const filters = studentFeedFilters(tab, state);
  if (!filters) return;
  const key = studentFeedKey(tab, filters);
  if (studentFeeds.has(key)) return;
  studentFeeds.set(key, { status: 'loading', items: [] });
  fetchGuestScopedItems(tab, filters)
    .then((raw) => {
      studentFeeds.set(key, { status: 'ready', items: withPublicCounts(tab, raw, mapSearchResultsToExposure(tab, raw)) });
    })
    .catch((err) => {
      console.warn('[student-find-feed]', tab, err);
      studentFeeds.set(key, { status: 'error', items: [] });
    })
    .then(() => rerender());
}

/** 학생 홈·찾기 목록 실패 재시도. */
export function retryStudentFindFeed(tab, state, rerender) {
  if (state.role !== 'parent') return;
  const filters = studentFeedFilters(tab, state);
  if (!filters) return;
  studentFeeds.delete(studentFeedKey(tab, filters));
  bootStudentFindFeed(tab, state, rerender);
}

/**
 * 카카오 주소 결과 → 화면 위치. 학생은 시·도 약칭(경기)을 정식 이름으로 펴고,
 * 이 탭의 보기 전용 위치로만 둔다(서버 저장 지역·임시값을 덮지 않는다).
 * @param {{ sido?: string, sigungu?: string, bname?: string, hname?: string, apartment?: boolean|string, buildingName?: string }} result
 * @param {import('./state.js').SearchTab} tab
 * @param {FindSurfaceState} state
 */
export function canonicalFromKakao(result, tab, state) {
  const apt = complexNameFromKakao(result);
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
  if (!parent) return liftTutorPlace(normalizeLocation(input, locationAxisForState(tab, state)), tab, state);
  const canonical = liftTutorPlace(studentPickedCanonical(input, tab, state), tab, state);
  state.studentPicks = { ...(state.studentPicks || {}), [tab]: canonical };
  return canonical;
}

/** 학생이 직접 고른 위치를 기억하지 않고 저장 지역으로 돌아간다. */
export function clearStudentPick(state, tab) {
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

/** @deprecated 표시 정본은 REGION_NEED_CITY / cascadeIncompleteHint */
export const GU_PICK_HINT = REGION_NEED_CITY;
export const DONG_RETRY_HINT = '동을 다시 선택해 주세요';
export const STEP3_PENDING_HINT = '주소 확인 중입니다. 잠시 후 다시 검색해 주세요.';
export const STEP3_COMPLEX_HINT = '등록된 아파트단지가 없습니다. 주소찾기로 다시 선택해 주세요.';

/** @type {import('../../shared/region-cascade.js').CityUnit[]} */
export let findCityUnits = [];
/** @type {Promise<import('../../shared/region-cascade.js').CityUnit[]>|null} */
export let findCitiesBoot = null;
/** @type {'idle'|'loading'|'ready'|'error'} */
export let findCitiesStatus = 'idle';
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
export function bootFindCities(rerender) {
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

export const TUTOR_UNIT_PICK_HINT = '광역시는 시·도, 도는 시·군까지 선택해 주세요';

/** 과외 단위(regions.php action=tutor_units). 과외쌤 탭·과외 희망 학생 탭만 쓴다. @type {import('../../shared/tutor-unit-cascade.js').TutorUnit[]} */
export let findTutorUnits = [];
/** @type {Promise<import('../../shared/tutor-unit-cascade.js').TutorUnit[]>|null} */
export let findTutorUnitsBoot = null;
/** @type {'idle'|'loading'|'ready'|'error'} */
export let findTutorUnitsStatus = 'idle';
/** @type {Set<() => void>} */
const findTutorUnitsWaiters = new Set();
let findTutorUnitsFailRendered = false;

/** @param {() => void} [rerender] */
export function bootFindTutorUnits(rerender) {
  if (!findTutorUnitsBoot) {
    findTutorUnitsStatus = 'loading';
    findTutorUnitsBoot = fetch('/api/auth/regions.php?action=tutor_units', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
    })
      .then((res) => res.json())
      .then((body) => {
        findTutorUnits = normalizeTutorUnits(body?.tutor_units);
        findTutorUnitsStatus = findTutorUnits.length ? 'ready' : 'error';
        return findTutorUnits;
      })
      .catch(() => {
        findTutorUnitsBoot = null;
        findTutorUnitsStatus = 'error';
        findTutorUnits = [];
        return findTutorUnits;
      })
      .then((units) => {
        const waiters = [...findTutorUnitsWaiters];
        findTutorUnitsWaiters.clear();
        if (findTutorUnitsStatus === 'ready' || !findTutorUnitsFailRendered) {
          if (findTutorUnitsStatus !== 'ready') findTutorUnitsFailRendered = true;
          waiters.forEach((fn) => fn());
        }
        return units;
      });
  }
  if (typeof rerender === 'function' && findTutorUnitsStatus === 'loading') {
    findTutorUnitsWaiters.add(rerender);
  }
  return findTutorUnitsBoot;
}

/**
 * 복원 검색은 지역 목록이 끝난 뒤에 라벨을 계산한다. 공부방 탭은 시·군·구 목록만 기다린다.
 * @param {import('./state.js').SearchTab} [tab]
 */
export function whenFindCitiesReady(tab) {
  if (tab === 'room') return bootFindCities();
  return Promise.all([bootFindCities(), bootFindTutorUnits()]);
}

/** @param {unknown} value */
export function numericRegionId(value) {
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
 * 과외 단위 축 = 과외쌤 탭, 과외 희망 학생 탭. 공부방 탭·공부방 희망 학생 탭은 시·군·구 목록 그대로.
 * @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state
 */
export function isTutorUnitAxis(tab, state) {
  if (tab === 'tutor') return true;
  return tab === 'student' && resolveStudentSearchHope(state) === 'tutor';
}

/** 단위 목록이 있으면 과외 단위 id만 통과한다. */
function tutorUnitFindId(value) {
  const id = numericRegionId(value);
  if (!id) return '';
  if (!findTutorUnits.length) return id;
  return tutorUnitLabelFromId(id, findTutorUnits) ? id : '';
}

/** @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state @param {unknown} value */
export function axisFindRegionId(tab, state, value) {
  return isTutorUnitAxis(tab, state) ? tutorUnitFindId(value) : selectableFindRegionId(value);
}

/** @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state @param {unknown} id */
export function axisRegionLabel(tab, state, id) {
  return isTutorUnitAxis(tab, state)
    ? tutorUnitLabelFromId(String(id ?? ''), findTutorUnits)
    : activityLabelFromRegionId(String(id ?? ''), findCityUnits);
}

/**
 * 시·도만 고른 경우 cascadeIncompleteHint(REGION_NEED_CITY)를 쓴다.
 * @param {import('./state.js').SearchTab} tab
 * @param {FindSurfaceState} state
 * @param {HTMLFormElement} [form]
 */
export function findPickHint(tab, state, form) {
  if (isTutorUnitAxis(tab, state)) return TUTOR_UNIT_PICK_HINT;
  const cascade = form?.querySelector?.('[data-region-cascade]');
  if (cascade && findCityUnits.length) {
    const sidoSel = cascade.querySelector('[data-field="region_sido"]');
    const citySel = cascade.querySelector('[data-field="region_city"]');
    const guSel = cascade.querySelector('[data-field="region_gu"]');
    const resolved = resolveCascade(findCityUnits, {
      sidoName: sidoSel instanceof HTMLSelectElement ? sidoSel.value : '',
      cityName: citySel instanceof HTMLSelectElement ? citySel.value : '',
      guName: guSel instanceof HTMLSelectElement ? guSel.value : '',
    });
    const incomplete = cascadeIncompleteHint(resolved);
    if (incomplete) return incomplete;
  }
  return REGION_NEED_CITY;
}

/**
 * 위치(저장 지역·URL 라벨·주소찾기·GPS) → 과외 단위 id. 구·동·일반구는 그 단위로 올린다.
 * 도만 있으면 ''. 단위 목록 전에는 숫자 id만 그대로 둔다(서버가 판정).
 * @param {import('../../shared/location-display.js').CanonicalLocation|null|undefined} cur
 */
function tutorUnitIdForPlace(cur) {
  if (!cur) return '';
  if (!findTutorUnits.length) return numericRegionId(cur.regionId);
  const direct = tutorUnitFindId(cur.regionId);
  if (direct) return direct;
  const byLabel = tutorUnitIdFromLabel(cur.displayLabel, findTutorUnits);
  if (byLabel) return byLabel;
  const sido = String(cur.province || cur.city || '').trim();
  const sigungu = String((cur.province ? cur.city : cur.district) || '').trim();
  const byAddress = tutorUnitIdForAddress(sido, sigungu, findTutorUnits);
  if (byAddress) return byAddress;
  const parsed = normalizeLocation({ raw: String(cur.raw || cur.displayLabel || '') }, 'room');
  return tutorUnitIdForAddress(
    parsed.province || parsed.city,
    parsed.province ? parsed.city : parsed.district,
    findTutorUnits,
  );
}

/** 위치를 과외 단위 표기·id로 바꾼다. 단위를 못 찾으면 null. */
function tutorUnitCanonical(cur) {
  if (!cur || !findTutorUnits.length) return null;
  const id = tutorUnitIdForPlace(cur);
  const label = id ? tutorUnitLabelFromId(id, findTutorUnits) : '';
  if (!label) return null;
  return {
    ...cur,
    province: '',
    city: '',
    district: '',
    dong: '',
    apartmentName: '',
    displayLabel: label,
    searchScopeLabel: label,
    regionKey: label.toLowerCase(),
    regionId: id,
    level: 'city',
    raw: label,
    axis: 'tutor',
  };
}

/** 과외 단위 축이면 위치를 그 단위로 올린다. 못 올리면 그대로. */
function liftTutorPlace(canonical, tab, state) {
  if (!canonical || !isTutorUnitAxis(tab, state)) return canonical;
  return tutorUnitCanonical(canonical) || canonical;
}

/**
 * 과외·학생 URL/저장 필터에서 라벨과 선택 단위가 아닌 지역값을 뺀다.
 * @param {import('./state.js').SearchTab} tab
 * @param {Record<string, string|string[]>} filters
 */
function dropLegacyLessonRegionFilters(tab, filters) {
  const next = { ...filters };
  if (tab === 'room') {
    delete next.region_label;
    settleRoomAddressFilters(next);
  }
  if (tab === 'tutor') {
    delete next.tutor_region_label;
    const id = tutorUnitFindId(next.tutor_region_id);
    if (id) next.tutor_region_id = id;
    else delete next.tutor_region_id;
  }
  if (tab === 'student') {
    if (next.preferred_lesson_type === 'both') delete next.preferred_lesson_type;
    delete next.preferred_region_label;
    const raw = next.preferred_region_id || next.preferred_region;
    const id =
      next.preferred_lesson_type === 'tutor'
        ? tutorUnitFindId(raw)
        : next.preferred_lesson_type === 'study_room'
          ? selectableFindRegionId(raw)
          : selectableFindRegionId(raw) || tutorUnitFindId(raw);
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
let studyroomDongSeq = 0;

export async function confirmStudyroomDong(state, result, rerender) {
  const seq = ++studyroomDongSeq;
  state.studyroomDongPending = true;
  state.studyroomDongUnconfirmed = false;
  clearStudyroomDongId(state);
  rerender();
  let latest = false;
  try {
    const region = await ensureRegionFromKakao(result);
    if (seq !== studyroomDongSeq) return false;
    const id = numericRegionId(region?.id);
    if (!id) throw new Error(DONG_RETRY_HINT);
    state.studyroomDongRegionId = id;
    if (!state.lastSearchFilters) state.lastSearchFilters = {};
    state.lastSearchFilters.preferred_studyroom_region_id = id;
    state.studyroomDongUnconfirmed = false;
    latest = true;
  } catch {
    if (seq !== studyroomDongSeq) return false;
    clearStudyroomDongId(state);
    state.studyroomDongUnconfirmed = true;
    latest = true;
  } finally {
    if (seq === studyroomDongSeq) {
      state.studyroomDongPending = false;
      rerender();
    }
  }
  return latest;
}

/** @param {import('./state.js').SearchTab} tab @param {Record<string, string|string[]>|null|undefined} filters @param {unknown} fallbackId */
export function regionRestoreToken(tab, filters, fallbackId) {
  if (tab === 'tutor') return String(filters?.tutor_region_id || fallbackId || '');
  if (tab === 'student') {
    return String(
      filters?.preferred_studyroom_region_id || filters?.preferred_region_id || fallbackId || '',
    );
  }
  return String(fallbackId || '');
}

/** 학생찾기 기본필터 `has_request_summary` — 체크박스 on/1/true */
export function isRequestSummaryFilterOn(value) {
  if (Array.isArray(value)) return isRequestSummaryFilterOn(value[0]);
  return value === true || value === 1 || value === '1' || value === 'on' || value === 'true';
}

/** @param {Record<string, unknown>} filters */
export function encodeFiltersForUrl(filters) {
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
    if (parsed && typeof parsed === 'object' && parsed.preferred_lesson_type === 'both') {
      delete parsed.preferred_lesson_type;
    }
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** @param {import('./state.js').SearchTab} tab @param {Record<string, unknown>|null} filters */
export function writeStoredFilters(tab, filters) {
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
  if (tab && (state.role || 'guest') !== 'guest') canonical = liftTutorPlace(canonical, tab, state);
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
export function syncFindHashState(state, tab) {
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
    const studentScope = state.role === 'parent' ? studentFeedFilters(tab, state) : null;
    if (studentScope) {
      for (const key of STUDENT_REGION_FILTER_KEYS) delete filters[key];
      Object.assign(filters, studentScope);
    } else if (tab === 'room') {
      delete filters.region_label;
      delete filters.region_id;
      settleRoomAddressFilters(filters);
    } else if (tab === 'tutor') {
      delete filters.tutor_region_label;
      const id = tutorUnitIdForPlace(canonical);
      if (id) filters.tutor_region_id = id;
      else delete filters.tutor_region_id;
    } else {
      delete filters.preferred_region_label;
      delete filters.preferred_region;
      const id = isTutorUnitAxis(tab, state)
        ? tutorUnitIdForPlace(canonical)
        : selectableFindRegionId(canonical.regionId);
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
  if (state.findSurface === 'search' && state.role === 'parent') {
    const branch = parentFindBranch(state);
    const otherFind = (tab === 'room' && branch !== 'study_room') || (tab === 'tutor' && branch !== 'tutor');
    if (otherFind) {
      logLocationDebug('gps-skip', { reason: 'parent-other-find' });
      return;
    }
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
  let geo = await reverseGeocodeCoords(coords.lat, coords.lng, axis);
  if (isTutorUnitAxis(tab, state)) {
    await bootFindTutorUnits();
    const unit = tutorUnitCanonical(geo);
    if (!unit) {
      logLocationDebug('gps-skip', { reason: 'no-tutor-unit' });
      return;
    }
    geo = unit;
  }
  const roomGps = axis === 'room' || axis === 'study_room';
  const noDongPlace =
    roomGps && !String(geo?.dong || '').trim() && !String(geo?.apartmentName || '').trim();
  if (!geo?.displayLabel || noDongPlace) {
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
 * @property {'search'|null} [findSurface] — 찾기 화면이면 search. 홈은 비운다.
 */

/**
 * 검색 전 region feed / 검색 후 search result → 단일 SSOT
 * @param {import('./state.js').SearchTab} tab
 * @param {FindSurfaceState} state
 */
/** @param {FindSurfaceState} state */
export function resolveTutorRegionIndex(state) {
  const idx = state.tutorRegionIndex ?? 0;
  const count = tutorHomeRegionsReady() ? 3 : 0;
  return idx >= 0 && idx < count ? idx : 0;
}

export function isTutorMockCityLabel(label) {
  const text = String(label || '').trim();
  return text === '서울시' || text === '부산시' || text === '인천시';
}

/** 과외쌤 홈 칩·지역 라벨. saved_regions[idx].label. MOCK 시 이름은 쓰지 않는다. */
export function tutorSavedSlotLabel(state) {
  return tutorHomeRegionLabel(resolveTutorRegionIndex(state));
}

/** 과외쌤 로그인 지역대표(활동지역1). 현재위치 문구만 이 값을 쓴다. */
export function tutorRepresentativeRegionLabel() {
  return tutorHomePrimaryLabel();
}

/** @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state @param {import('./state.js').ViewerRole} role @param {'home'|'search'|''} [surfaceType] */
function regionFeedContext(tab, state, role, surfaceType = '') {
  const ctx = { role, homeSelf: state.homeSelf === true, studyRoomHome: state.studyRoomHome === true };
  const promoFind = role === 'study_room' && tab === 'room' && state.studyRoomHome !== true;
  if ((ctx.studyRoomHome || promoFind) && tab === 'room') {
    const live = getStudyRoomHomeLiveItems();
    ctx.liveItems = Array.isArray(live) ? live : live;
    ctx.promoFind = promoFind;
    ctx.feedStatus = getStudyRoomHomeFeedStatus();
  }
  if (tab === 'student' && role === 'study_room' && !state.searchExecuted) {
    ctx.promoStudent = true;
    ctx.liveStudentItems = getStudyRoomStudentLiveItems();
    ctx.hopeType = 'study_room';
    ctx.feedStatus = getStudyRoomStudentFeedStatus();
  }
  if (tab === 'student' && role === 'tutor' && state.tutorStudentSnap === true && !state.searchExecuted) {
    ctx.promoStudent = true;
    ctx.hopeType = 'tutor';
    ctx.liveStudentItems = getTutorStudentLiveItems();
    ctx.feedStatus = getTutorStudentFeedStatus();
  }
  if (tab === 'tutor') {
    ctx.tutorRegionIndex = resolveTutorRegionIndex(state);
  }
  if (tab === 'tutor' && role === 'tutor' && state.homeSelf === true && !state.searchExecuted) {
    ctx.tutorHome = true;
    ctx.liveTutorItems = getTutorHomeTutorLiveItems();
    ctx.feedStatus = getTutorHomeTutorFeedStatus();
  }
  if (
    tab === 'tutor' &&
    role === 'tutor' &&
    surfaceType === 'search' &&
    state.homeSelf !== true &&
    !state.searchExecuted
  ) {
    ctx.tutorFindInitial = true;
    ctx.liveTutorItems = getTutorHomeTutorLiveItems();
    ctx.feedStatus = getTutorHomeTutorFeedStatus();
  }
  if (tab === 'student' && (state.studentHopeType === 'tutor' || state.studentHopeType === 'study_room')) {
    ctx.hopeType = state.studentHopeType;
  }
  return ctx;
}

/** @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state */
export function locationAxisForState(tab, state) {
  const hope =
    state.studentHopeType === 'study_room' || state.studentHopeType === 'tutor'
      ? state.studentHopeType
      : null;
  return axisFromSearchTab(tab, hope);
}

/** @param {string} label @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state */
export function canonicalRegionLabel(label, tab, state) {
  const axis = locationAxisForState(tab, state);
  const prev = state.canonicalLocation;
  const canonical = liftTutorPlace(
    normalizeLocation(
      {
        raw: label,
        lat: prev?.displayLabel === String(label || '').trim() ? prev.lat : null,
        lng: prev?.displayLabel === String(label || '').trim() ? prev.lng : null,
        source: prev?.source || 'session',
      },
      axis,
    ),
    tab,
    state,
  );
  // 검색 실행 뒤에는 홍보1·과외지역1로 되돌리지 않는다.
  if (!canonical.displayLabel && !state.searchExecuted) {
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

/** @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state @param {import('./state.js').ViewerRole} role @param {'home'|'search'|''} [surfaceType] */
export function refreshActiveResultItems(tab, state, role, surfaceType = '') {
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
      ...regionFeedContext(tab, state, role, surfaceType),
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

  state.activeResultItems = state.searchExposureItems || [];
  state.activeResultSource = 'search';
  state.activeRegionLabel = resolveActiveRegionLabel(tab, state, role);
  logLocationDebug('list-fetch', {
    tab,
    mode: 'search',
    region: state.activeRegionLabel,
    count: state.activeResultItems.length,
  });
  return state.activeResultItems;
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

/** @param {FindSurfaceState} state @returns {'tutor'|'study_room'|null} */
export function resolveStudentSearchHope(state) {
  if (state.studentHopeType === 'study_room' || state.studentHopeType === 'tutor') {
    return state.studentHopeType;
  }
  if (state.role === 'study_room') return 'study_room';
  // 찾기 화면의 학생은 세션 분기가 없으면 과외로 채우지 않는다. 홈·다른 역할은 기존처럼 tutor.
  if (state.role === 'parent' && state.findSurface === 'search') return null;
  return 'tutor';
}
