/**
 * 찾기 화면 — 지역 라벨·검색 폼 필드.
 * search-find-surface.js 가 같은 함수 이름으로 다시 내보낸다.
 */

/** @typedef {import('./search-find-surface.js').FindSurfaceState} FindSurfaceState */

import { OPTION_LABELS } from './search-enums.js';
import {
  SEARCH_TABS,
} from './search-schema.js';
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
import { complexNameFromKakao } from '../../shared/complex-name-from-kakao.js';
import { renderBrowseList, renderGuestPaginatedListBlock } from '@home-ui/exposure-render.js';
import { SECTION_HEADINGS, renderSectionTitleBar } from '@home-ui/section-headings.js';
import {
  DEFAULT_STUDENT_HOPE_TYPE,
  renderHopeTypeGate,
  resolveHopeTypeFromQuery,
  writeStoredHopeType,
} from './student-hope-type.js';
import { resolveFindDefaultRegion, writeStoredHopeRegion } from '../../shared/student-hope-regions.js';
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
import { MAIN_SUBJECT_OPTIONS } from '../../shared/main-subjects.js';
import { gradeOptionHtml } from '../../shared/school-grade.js';
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
import { ensureRegionFromKakao } from '../../shared/region-ensure.js';
import { DONG_RETRY_HINT, GU_PICK_HINT, STEP3_COMPLEX_HINT, STEP3_PENDING_HINT, TUTOR_UNIT_PICK_HINT, applyGuestPlace, applyStudentPlace, axisFindRegionId, axisRegionLabel, canonicalRegionLabel, ensureParentHope, findCitiesStatus, findCityUnits, findTutorUnits, findTutorUnitsStatus, isTutorMockCityLabel, numericRegionId, resolveStudentActivePlace, resolveStudentSearchHope, resolveTutorRegionIndex, studentPickedCanonical, studentSavedCanonical, studentTarget, tutorSavedSlotLabel } from './search-find-place.js';

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

function readTutorHomeRegionsForTabs() {
  const loaded = readTutorHomeRegions();
  const slots = Array.isArray(loaded) ? loaded.slice(0, 3) : [];
  while (slots.length < 3) slots.push({ label: '', primary: false });
  return slots;
}

/** @param {FindSurfaceState} state */
export function resolveHomeSelf(state) {
  return state.homeSelf === true;
}

/** @param {FindSurfaceState} state */
export function resolveResultSource(state) {
  if (state.searchLoading || state.searchError || state.searchExecuted) {
    return state.activeResultSource || 'search';
  }
  return state.activeResultSource || 'region';
}

/** @param {FindSurfaceState} state */
export function resultDebugAttrs(state) {
  return `data-result-source="${esc(resolveResultSource(state))}" data-result-items="activeResultItems"`;
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {Record<string, unknown>} filters
 * @param {FindSurfaceState} state
 */
/** 확정된 3단계(동·단지) 표시. 대기·미확인은 막힌 검색이라 라벨을 바꾸지 않는다. */
function confirmedStep3Label(state, tab) {
  if (!state.searchExecuted) return '';
  const bag = state.step3ByTab?.[tab];
  if (!bag || bag.pending || bag.unconfirmed) return '';
  if (!(numericRegionId(bag.dongId) || numericRegionId(bag.complexId))) return '';
  return String(bag.display || '').trim();
}

export function regionLabelFromFilters(tab, filters, state, role) {
  const viewer = role || state.role || 'guest';
  if (viewer === 'guest') return applyGuestPlace(tab, state);
  const step3Text = confirmedStep3Label(state, tab);
  if (step3Text) {
    if (viewer === 'parent') {
      return applyStudentPlace(
        state,
        tab,
        studentPickedCanonical({ raw: step3Text, source: 'address' }, tab, state),
      );
    }
    return canonicalRegionLabel(step3Text, tab, state);
  }
  if (viewer === 'parent') return studentLabelFromFilters(tab, filters, state);
  if (state.searchExecuted) {
    const guId =
      tab === 'tutor'
        ? filters.tutor_region_id || state.findGuByTab?.tutor
        : tab === 'room'
          ? filters.sigungu_region_id || state.findGuByTab?.room
          : filters.preferred_region_id || state.findGuByTab?.student;
    const guLabel = axisRegionLabel(tab, state, guId);
    if (guLabel) {
      return applyGuDisplayLabel(state, String(guId), guLabel);
    }
  }
  let raw = '';
  if (tab === 'tutor') {
    const guLabel = tutorUnitLabelFromId(String(filters.tutor_region_id ?? ''), findTutorUnits);
    if (guLabel) return applyGuDisplayLabel(state, String(filters.tutor_region_id), guLabel);
    raw = String(filters.tutor_region_id || filters.tutor_region_label || '').trim();
    if (!raw || (viewer === 'tutor' && isTutorMockCityLabel(raw))) {
      raw = viewer === 'tutor' ? tutorSavedSlotLabel(state) : '';
    }
  } else if (tab === 'room') {
    const guLabel = activityLabelFromRegionId(
      filters.sigungu_region_id || state.findGuByTab?.room,
      findCityUnits,
    );
    raw = state.step3ByTab?.room?.display || guLabel || '';
  } else {
    const guId = filters.preferred_region_id || filters.preferred_region;
    const guLabel = axisRegionLabel(tab, state, guId);
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
  const label = id ? axisRegionLabel(tab, state, id) : '';
  if (label) {
    applyGuDisplayLabel(state, id, label);
    state.canonicalLocation.source = 'session';
    state._placeTab = tab;
    return label;
  }
  return resolveStudentActivePlace(tab, state);
}

/** 구 단위 표시는 cascade 라벨을 그대로 둔다. */
export function applyGuDisplayLabel(state, regionId, label) {
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
export function renderStudentDemandBlock(regionLabel, opts = {}) {
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

/**
 * 희망 유형에 따른 지역 입력축 — 공부방=동/단지, 과외쌤=시·군·구
 * @param {FindSurfaceState} state
 * @param {string} [lessonTypeValue]
 */
function resolveStudentRegionInput(state, lessonTypeValue) {
  const raw = String(lessonTypeValue || state.studentHopeType || '').trim();
  if (raw === 'study_room') return 'region';
  return 'city';
}

export function blankStep3() {
  return { basis: 'dong', display: '', dongId: '', complexId: '', unconfirmed: false, pending: false, seq: 0 };
}

/** @param {FindSurfaceState} state @param {import('./state.js').SearchTab} tab */
export function step3Bag(state, tab) {
  if (!state.step3ByTab) state.step3ByTab = {};
  if (!state.step3ByTab[tab]) state.step3ByTab[tab] = blankStep3();
  return state.step3ByTab[tab];
}

/** @param {FindSurfaceState} state @param {import('./state.js').SearchTab} tab */
function rememberedGuId(state, tab) {
  if (!state.findGuByTab) state.findGuByTab = {};
  return axisFindRegionId(tab, state, state.findGuByTab[tab]);
}

/** @param {FindSurfaceState} state @param {import('./state.js').SearchTab} tab @param {string} id */
export function rememberGuId(state, tab, id) {
  if (!state.findGuByTab) state.findGuByTab = {};
  state.findGuByTab[tab] = axisFindRegionId(tab, state, id);
}

/**
 * 필터 칸은 저장 홍보·과외지역으로 채우지 않는다.
 * 이번 화면에서 고른 구, 또는 검색을 실행한 뒤의 구 id 만 보여 준다.
 * @param {FindSurfaceState} state
 * @param {import('./state.js').SearchTab} tab
 * @param {string} filterKey
 */
function cascadePick(state, tab, filterKey) {
  const remembered = rememberedGuId(state, tab);
  if (!state.searchExecuted) {
    return remembered ? { regionId: remembered, stale: false } : { regionId: '', stale: false };
  }
  const fromFilter = axisFindRegionId(tab, state, state.lastSearchFilters?.[filterKey]);
  const id = fromFilter || remembered;
  return id ? { regionId: id, stale: false } : { regionId: '', stale: false };
}

/** @param {FindSurfaceState} state */
function cascadePickForTutor(state) {
  return cascadePick(state, 'tutor', 'tutor_region_id');
}

/** @param {FindSurfaceState} state */
function cascadePickForStudent(state) {
  return cascadePick(state, 'student', 'preferred_region_id');
}

/** @param {FindSurfaceState} state */
function cascadePickForRoom(state) {
  return cascadePick(state, 'room', 'sigungu_region_id');
}

/**
 * @param {FindSurfaceState} state
 * @param {import('./state.js').SearchTab} tab
 * @param {{ compact?: boolean, label: string, dbHint: string, enabled: boolean, basisName: string, dongHiddenName: string, complexHiddenName: string }} opts
 */
function renderStep3Field(state, tab, opts) {
  const bag = step3Bag(state, tab);
  const compact = opts.compact === true;
  if (!opts.enabled) {
    return `
      <label class="search-field${compact ? ' search-field--compact' : ''}" data-find-step3="disabled">
        <span class="search-field__label">${esc(opts.label)} ${opts.dbHint}</span>
        <input type="text" class="search-field__control" value="" placeholder="광역시·시·군까지입니다" disabled />
      </label>`;
  }
  const basis = bag.basis === 'complex' ? 'complex' : 'dong';
  const held = bag.pending || bag.unconfirmed;
  const dongId = held || basis === 'complex' ? '' : numericRegionId(bag.dongId);
  const complexId = held || basis !== 'complex' ? '' : numericRegionId(bag.complexId);
  const hint = bag.pending
    ? STEP3_PENDING_HINT
    : bag.unconfirmed
      ? basis === 'complex'
        ? STEP3_COMPLEX_HINT
        : DONG_RETRY_HINT
      : '행정동 또는 아파트단지를 주소찾기로 선택합니다.';
  return `
    <div class="search-field${compact ? ' search-field--compact' : ''}" data-find-step3="open">
      <span class="search-field__label">${esc(opts.label)} ${opts.dbHint}</span>
      <div class="chip-group">
        <label class="chip">
          <input type="radio" name="${esc(opts.basisName)}" value="dong" class="chip__input" data-find-basis ${basis === 'dong' ? 'checked' : ''} />
          <span class="chip__label">행정동</span>
        </label>
        <label class="chip">
          <input type="radio" name="${esc(opts.basisName)}" value="complex" class="chip__input" data-find-basis ${basis === 'complex' ? 'checked' : ''} />
          <span class="chip__label">아파트단지</span>
        </label>
      </div>
      <div class="search-field__address-row">
        <input type="text" class="search-field__control" value="${esc(bag.display || '')}" placeholder="주소찾기로 선택" readonly data-find-step3-display />
        <button type="button" class="btn btn--secondary btn--sm" data-action="find-step3-address">주소찾기</button>
      </div>
      <input type="hidden" name="${esc(opts.dongHiddenName)}" value="${esc(dongId)}" />
      <input type="hidden" name="${esc(opts.complexHiddenName)}" value="${esc(complexId)}" />
      <span class="search-field__hint">${esc(hint)}</span>
    </div>`;
}

/**
 * @param {FindSurfaceState} state
 * @param {import('./state.js').SearchTab} tab
 * @param {Parameters<typeof ensureRegionFromKakao>[0]} result
 */
export async function applyStep3FromKakao(state, tab, result) {
  const bag = step3Bag(state, tab);
  const seq = (bag.seq = (Number(bag.seq) || 0) + 1);
  const basis = bag.basis === 'complex' ? 'complex' : 'dong';
  bag.unconfirmed = false;
  bag.pending = true;
  bag.dongId = '';
  bag.complexId = '';
  try {
    const region = await ensureRegionFromKakao(result);
    if (bag.seq !== seq) return;
    const dongId = numericRegionId(region?.id);
    const place = complexNameFromKakao(result);
    const dongName = result?.bname || result?.hname || region?.dong_name || '';
    if (basis === 'complex') {
      bag.dongId = '';
      if (!dongId || !place) {
        bag.complexId = '';
        bag.display = '';
        bag.unconfirmed = true;
        bag.pending = false;
        return;
      }
      const params = new URLSearchParams({
        action: 'complex-by-name',
        region_id: dongId,
        name: place,
      });
      const res = await fetch(`/api/auth/regions.php?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
      });
      const body = await res.json().catch(() => ({}));
      if (bag.seq !== seq) return;
      const complexId = numericRegionId(body?.complex?.id);
      bag.complexId = complexId;
      bag.display = complexId && dongName ? `${dongName} · ${place}` : place;
      bag.unconfirmed = !complexId;
      bag.pending = false;
      return;
    }
    bag.complexId = '';
    if (!dongId) {
      bag.dongId = '';
      bag.unconfirmed = true;
      bag.pending = false;
      return;
    }
    bag.dongId = dongId;
    const dongShown = normalizeLocation({ raw: dongName, dong: dongName }, 'room').displayLabel;
    bag.display = dongShown || String(dongName || '').trim();
    bag.unconfirmed = false;
    bag.pending = false;
  } catch {
    if (bag.seq !== seq) return;
    bag.dongId = '';
    bag.complexId = '';
    bag.display = '';
    bag.unconfirmed = true;
    bag.pending = false;
  }
}

/**
 * @param {FindSurfaceState} state
 * @param {{ compact?: boolean, label: string, dbHint: string, hiddenName: string, idPrefix: string, pick: { regionId: string, stale: boolean } }} opts
 */
function renderGuCascadeField(state, opts) {
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
  const note = state?.findScopeHint || GU_PICK_HINT;
  return `
    <div class="search-field${compact ? ' search-field--compact' : ''}" data-find-gu-field="${esc(opts.hiddenName)}">
      <span class="search-field__label">${esc(opts.label)} ${opts.dbHint}</span>
      ${body}
      <span class="search-field__hint">${esc(note)}</span>
    </div>`;
}

/**
 * 과외 단위 선택칸. 시·도 → 광역시·세종이면 끝, 도·전남광주면 시·군. 구 단계 없음.
 * @param {FindSurfaceState} state
 * @param {{ compact?: boolean, label: string, dbHint: string, hiddenName: string, idPrefix: string, pick: { regionId: string, stale: boolean } }} opts
 */
function renderTutorUnitField(state, opts) {
  const compact = opts.compact === true;
  const body = findTutorUnits.length
    ? renderTutorUnitCascade({
        idPrefix: opts.idPrefix,
        units: findTutorUnits,
        regionId: opts.pick.regionId,
        selectClass: 'search-field__control',
        hiddenName: opts.hiddenName,
      })
    : `<p class="search-field__hint">${esc(findTutorUnitsStatus === 'error' ? TUTOR_UNIT_LIST_ERROR : '지역 목록을 불러오는 중…')}</p>
       <input type="hidden" name="${esc(opts.hiddenName)}" value="" />`;
  const note = state?.findScopeHint || TUTOR_UNIT_PICK_HINT;
  return `
    <div class="search-field${compact ? ' search-field--compact' : ''}" data-find-gu-field="${esc(opts.hiddenName)}" data-find-tutor-unit>
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
export function renderField(field, state, opts = {}) {
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
    const hope = ensureParentHope(state);
    const value = hope === 'tutor' || hope === 'study_room' ? hope : '';
    return `<input type="hidden" name="${esc(name)}" value="${esc(value)}" data-parent-branch-fixed />`;
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
    const emptyOpt = field.key === 'preferred_lesson_type' ? '' : '<option value="">선택</option>';
    return `
      <label class="search-field${compact ? ' search-field--compact' : ''}">
        <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
        <select class="search-field__control" name="${esc(name)}" ${field.key === 'lesson_format' ? 'data-lesson-format-select' : ''}${field.key === 'preferred_lesson_type' ? ' data-preferred-lesson-type' : ''}>
          ${emptyOpt}${selectOpts}
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

  const defaultRegion = '';

  if (field.key === 'preferred_region') {
    const hope = resolveStudentSearchHope(state);
    if (hope !== 'study_room' && hope !== 'tutor') {
      return `<p class="search-field__hint">희망 유형이 정해진 뒤에 지역을 고를 수 있어요.</p>`;
    }
    const step3Open = hope === 'study_room';
    const regionField = step3Open
      ? renderGuCascadeField(state, {
          compact,
          label: '시·군·구',
          dbHint,
          hiddenName: 'f_preferred_region_id',
          idPrefix: 'find_student_region',
          pick: cascadePickForStudent(state),
        })
      : renderTutorUnitField(state, {
          compact,
          label: '과외 희망지역',
          dbHint,
          hiddenName: 'f_preferred_region_id',
          idPrefix: 'find_student_region',
          pick: cascadePickForStudent(state),
        });
    return `
      ${regionField}
      ${renderStep3Field(state, 'student', {
        compact,
        label: '동·단지',
        dbHint: '',
        enabled: step3Open,
        basisName: 'find_student_basis',
        dongHiddenName: 'f_preferred_studyroom_region_id',
        complexHiddenName: 'f_preferred_studyroom_complex_id',
      })}`;
  }

  if (field.key === 'tutor_region_id') {
    return `
      ${renderTutorUnitField(state, {
        compact,
        label: field.label,
        dbHint,
        hiddenName: 'f_tutor_region_id',
        idPrefix: 'find_tutor_region',
        pick: cascadePickForTutor(state),
      })}
      ${renderStep3Field(state, 'tutor', {
        compact,
        label: '동·단지',
        dbHint: '',
        enabled: false,
        basisName: 'find_tutor_basis',
        dongHiddenName: 'f_tutor_step3_region_id',
        complexHiddenName: 'f_tutor_step3_complex_id',
      })}`;
  }

  if (field.key === 'region_id') {
    return `
      ${renderGuCascadeField(state, {
        compact,
        label: '시·군·구',
        dbHint,
        hiddenName: 'f_sigungu_region_id',
        idPrefix: 'find_room_region',
        pick: cascadePickForRoom(state),
      })}
      ${renderStep3Field(state, 'room', {
        compact,
        label: '동·단지',
        dbHint: '',
        enabled: true,
        basisName: 'find_room_basis',
        dongHiddenName: 'f_region_id',
        complexHiddenName: 'f_complex_id',
      })}`;
  }

  return `
    <label class="search-field${compact ? ' search-field--compact' : ''}"${field.key === 'preferred_region' ? ' data-student-region-field' : ''}>
      <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
      <input type="text" class="search-field__control" name="${esc(name)}" value="${esc(defaultRegion)}" placeholder="${esc(placeholders[inputKind] || '')}" data-region-axis="${esc(inputKind)}" />
    </label>`;
}

export function renderBasicRows(fields, state, compact = false, role = state.role) {
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
export function renderTutorRegionTabs(state, options = {}) {
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

  const label = variant === 'home' ? '희망 지역' : '과외지역 (3)';
  return `
    <nav class="tutor-region-tabs" aria-label="${esc(label)}" role="tablist">
      ${tabs}
    </nav>`;
}

export function renderTutorRegionHint(role) {
  if (role === 'tutor') {
    return `<p class="tutor-region-hint">등록한 과외지역 탭을 선택한 뒤, 아래 조건으로 경쟁 과외쌤을 검색할 수 있습니다.</p>`;
  }
  return `<p class="tutor-region-hint">희망 지역 탭을 선택하면 해당 광역시·시·군의 과외쌤 목록이 표시됩니다.</p>`;
}
