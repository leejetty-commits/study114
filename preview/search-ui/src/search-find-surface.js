/**
 * 공부방·과외 찾기 — 컴팩트 검색 + 지역 피드 / 검색 결과 (search-ui · home #parent 공용)
 *
 * 구현은 search-find-place.js · search-find-region.js 로 나뉘어 있고,
 * 이 파일이 기존 함수 이름을 그대로 내보낸다.
 */

import {
  SEARCH_TABS,
} from './search-schema.js';
import { s114Alert } from '../../shared/confirm-dialog.js';
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
import { renderSearchMapBlock, bindSearchMapPinLinks } from './search-map.js';
import { renderSearchTierResults } from './search-tier-render.js';
import { collectFiltersFromForm, searchApi, settleRoomAddressFilters, settleStudentStudyroomRegionFilter } from './search-api.js';
import { renderListPagination } from '@home-ui/list-pagination.js';
import { mapSearchResultsToExposure } from './search-exposure-mapper.js';
import { seedRecommendedFromItems } from '@home-ui/user-actions-ui.js';
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
import { bindListSortControls, readListSortFromHash } from '../../shared/list-sort.js';
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
import { DONG_RETRY_HINT, GUEST_FEED_ERROR, GUEST_FEED_LOADING, STEP3_COMPLEX_HINT, STEP3_PENDING_HINT, STUDENT_ROOM_EMPTY, applyCanonicalLocation, applyGuestPlace, axisFindRegionId, axisRegionLabel, bootFindCities, bootFindTutorUnits, bootGuestPlaceBaseline, bootStudentFindFeed, canonicalFromKakao, canonicalRegionLabel, clearStudentPick, confirmStudyroomDong, encodeFiltersForUrl, ensureParentHope, findCitiesBoot, findCitiesStatus, findCityUnits, findPickHint, findTutorUnits, findTutorUnitsBoot, findTutorUnitsStatus, guestFeedStatus, guestServerPlace, isRequestSummaryFilterOn, isTutorUnitAxis, locationAxisForState, numericRegionId, parentFindBranch, refreshActiveResultItems, regionRestoreToken, renderGuestFeedList, resolveActiveRegionLabel, resolveStudentSearchHope, resolveTutorRegionIndex, retryStudentFindFeed, syncFindHashState, tutorRepresentativeRegionLabel, withPublicCounts, writeStoredFilters } from './search-find-place.js';
import { applyGuDisplayLabel, applyStep3FromKakao, blankStep3, ensureStudentHopeType, esc, regionLabelFromFilters, rememberGuId, renderBasicRows, renderField, renderStudentDemandBlock, renderTutorRegionHint, renderTutorRegionTabs, resetFindSurface, resolveHomeSelf, resolveResultSource, resolveTutorStudentRegionIndex, resultDebugAttrs, step3Bag, studentCurrentPlace } from './search-find-region.js';
export { bootGuestFindSurface, bootStudentFindFeed, retryStudentFindFeed, whenFindCitiesReady, applyCanonicalLocation, hydrateFindStateFromHash, bootFindGpsIfNeeded, tutorRepresentativeRegionLabel, resolveActiveRegionLabel, refreshActiveResultItems } from './search-find-place.js';
export { resolveTutorStudentRegionIndex, tutorStudentRegionLabel, ensureStudentHopeType, esc, resetFindSurface, studentCurrentPlace } from './search-find-region.js';

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
          <div class="parent-home-region parent-home-region--tutor" aria-label="과외지역">
            <span class="parent-home-region__badge">과외지역</span>
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
      const label = resolveActiveRegionLabel(tab, state, role) || studentPlacePromptFor(tab, parentFindBranch(state));
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
      const badge = role === 'tutor' ? '과외지역' : '희망 지역';
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
      <div class="parent-home-region parent-home-region--tutor" aria-label="과외지역">
        <span class="parent-home-region__badge">과외지역</span>
        ${tabs}
      </div>`;
  }

  const regionFallback =
    role === 'guest'
      ? guestServerPlace(tab)
      : role === 'parent'
        ? studentPlacePromptFor(tab, parentFindBranch(state))
        : memberPlacePrompt(role);
  const regionLabel = resolveActiveRegionLabel(tab, state, role) || regionFallback;
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
  } = options;
  if (homeSelf) state.homeSelf = true;
  if (role === 'parent') state.role = 'parent';
  const meta = SEARCH_TABS[tab];
  const basicFields = meta.fields.filter((f) => f.tier === 'basic');
  const expandedFields = meta.fields.filter((f) => f.tier === 'expanded');
  const activeItems = refreshActiveResultItems(tab, state, role);
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
    <form class="search-form search-form--compact search-form--detail3" data-filter-expanded="${state.expanded}" ${formAttr}>
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
  const studyRoomMap = studyRoomPromoMap ? resolveStudyRoomMapQuery(state, variant) : null;
  const mapRegion = studyRoomMap
    ? studyRoomMap.picked
      ? studyRoomMap.query
      : studyRoomMap.promo_label
    : state.activeRegionLabel || '';

  return `
    ${regionBar}
    ${showMap
      ? renderSearchMapBlock(activeItems, {
          searched: state.searchExecuted,
          regionLabel: mapRegion,
          resultSource: resolveResultSource(state),
          bannerStyle: mapBannerStyle,
          providerHome: studyRoomPromoMap,
          hideMapBanner: variant === 'home' && studyRoomPromoMap,
          lat: studyRoomPromoMap ? null : state.canonicalLocation?.lat ?? null,
          lng: studyRoomPromoMap ? null : state.canonicalLocation?.lng ?? null,
          viewerRole: role,
          regionLevel: state.canonicalLocation?.level || '',
          geocodeQuery: studyRoomMap ? studyRoomMap.query : undefined,
          memberMap: studyRoomPromoMap,
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
  const activeItems = refreshActiveResultItems(tab, state, role, surfaceType);
  let regionLabel = state.activeRegionLabel || resolveActiveRegionLabel(tab, state, role);
  if (!state.searchExecuted && tab === 'student' && role === 'study_room') {
    regionLabel = studentCurrentPlace(regionLabel);
  }
  if (!state.searchExecuted && role === 'tutor' && tab === 'student' && surfaceType === 'search') {
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
  if (role === 'tutor' && tab === 'tutor' && surfaceType === 'search' && !state.searchExecuted) {
    const primary = tutorRepresentativeRegionLabel();
    if (primary) regionLabel = primary;
  }
  if (role !== 'guest' && role !== 'parent' && regionLabel) {
    const axis = locationAxisForState(tab, state);
    const caption = placeCaption(regionLabel, axis);
    if (caption) regionLabel = caption;
  }
  if (role === 'parent' && !state.searchExecuted) {
    const status = state.studentFeedStatus || 'idle';
    if (status === 'loading' || status === 'error') {
      const errorBody =
        status === 'error'
          ? `${GUEST_FEED_ERROR}
          <button type="button" class="btn btn--secondary btn--sm" data-parent-feed-retry>다시 시도</button>`
          : GUEST_FEED_LOADING;
      return `
      <section class="search-results search-results--pre" aria-label="내 지역 목록" ${debugAttrs} data-surface-type="${esc(surfaceType)}">
        <p class="search-results__hint"${status === 'error' ? ' role="alert"' : ''}>${errorBody}</p>
      </section>`;
    }
    if (!regionLabel) {
      return `
      <section class="search-results search-results--pre" aria-label="내 지역 목록" ${debugAttrs} data-surface-type="${esc(surfaceType)}">
        <p class="search-results__hint">${esc(studentPlacePromptFor(tab, parentFindBranch(state)))}</p>
      </section>`;
    }
    // 학생 홈 0건은 티어 렌더가 빈칸(공부방·과외쌤) / 「없다」 카피(학생)를 그린다.
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

  if (tab === 'student' && role === 'study_room' && !state.searchExecuted) {
    const status = getStudyRoomStudentFeedStatus();
    const wrap = (inner) => `
      <section class="search-results search-results--pre" aria-label="내 지역 목록" ${debugAttrs} data-surface-type="${esc(surfaceType)}" data-room-student-feed="${esc(status)}">
        ${inner}
      </section>`;
    if (status === 'error') {
      return wrap(
        `<p class="search-results__hint" role="alert">${GUEST_FEED_ERROR}
          <button type="button" class="btn btn--secondary btn--sm" data-room-student-retry>다시 시도</button>
        </p>`,
      );
    }
    if (status === 'loading' || status === 'idle' || state.studentDemandPending) {
      return wrap(`<p class="search-results__hint">학생 목록을 불러오는 중입니다.</p>`);
    }
    if (status === 'no-region') {
      return wrap(`<p class="search-results__hint">홍보지역을 등록하면 우리동네 학생 목록을 볼 수 있어요.</p>`);
    }
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

  /* 과외쌤 홈 「우리동네 과외쌤」 — 조회 중 / 조회 실패 / 조회 끝(0장이면 기존 빈 카드 칸). */
  if (tab === 'tutor' && role === 'tutor' && surfaceType === 'home' && state.homeSelf === true && !state.searchExecuted) {
    const status = getTutorHomeTutorFeedStatus();
    const wrap = (inner) => `
      <section class="search-results search-results--pre" aria-label="내 지역 목록" ${debugAttrs} data-surface-type="${esc(surfaceType)}" data-tutor-home-feed="${esc(status)}">
        ${inner}
      </section>`;
    if (status === 'error') {
      return wrap(`<p class="search-results__hint" role="alert">${GUEST_FEED_ERROR}</p>`);
    }
    if (status === 'idle' || status === 'loading') {
      return wrap(`<p class="search-results__hint">${GUEST_FEED_LOADING}</p>`);
    }
    return wrap(
      renderSearchTierResults(tab, activeItems, { ...tierCtx, tutorHomeReady: true }, {
        mode: 'region',
        regionLabel,
        surfaceType,
      }),
    );
  }

  if (tab === 'tutor' && role === 'tutor' && surfaceType === 'search' && !state.searchExecuted) {
    const status = getTutorHomeTutorFeedStatus();
    const wrap = (inner) => `
      <section class="search-results search-results--pre" aria-label="내 지역 목록" ${debugAttrs} data-surface-type="${esc(surfaceType)}" data-tutor-find-feed="${esc(status)}">
        ${inner}
      </section>`;
    if (status === 'error') {
      return wrap(`<p class="search-results__hint" role="alert">${GUEST_FEED_ERROR}</p>`);
    }
    if (status === 'no-region') {
      return wrap(`<p class="search-results__hint">${esc('과외지역을 등록하면 과외쌤이 보여요.')}</p>`);
    }
    if (status === 'idle' || status === 'loading' || !Array.isArray(getTutorHomeTutorLiveItems())) {
      return wrap(`<p class="search-results__hint">${GUEST_FEED_LOADING}</p>`);
    }
  }

  if (
    tab === 'room' &&
    role === 'study_room' &&
    state.studyRoomHome === true &&
    !state.searchExecuted
  ) {
    const status = getStudyRoomHomeFeedStatus();
    const wrap = (inner) => `
      <section class="search-results search-results--pre" aria-label="내 지역 목록" ${debugAttrs} data-surface-type="${esc(surfaceType)}" data-room-home-feed="${esc(status)}">
        ${inner}
      </section>`;
    if (status === 'error') {
      return wrap(
        `<p class="search-results__hint" role="alert">${GUEST_FEED_ERROR}
          <button type="button" class="btn btn--secondary btn--sm" data-room-home-retry>다시 시도</button>
        </p>`,
      );
    }
    if (status === 'loading' || status === 'idle' || !Array.isArray(getStudyRoomHomeLiveItems())) {
      return wrap(`<p class="search-results__hint">${GUEST_FEED_LOADING}</p>`);
    }
  }

  if (!state.searchExecuted) {
    const studyRoomHomeReady =
      role === 'study_room' && tab === 'room' && state.studyRoomHome === true && Array.isArray(getStudyRoomHomeLiveItems()) && getStudyRoomHomeFeedStatus() === 'ready';
    const tierHtml = renderSearchTierResults(tab, activeItems, { ...tierCtx, studyRoomHomeReady }, {
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

  const step3Prime =
    tab === 'room' &&
    Boolean(
      numericRegionId(state.lastSearchFilters?.region_id) ||
        numericRegionId(state.lastSearchFilters?.complex_id),
    );
  const flatHtml = renderSearchTierResults(tab, activeItems, tierCtx, {
    mode: 'search',
    regionLabel,
    surfaceType,
    step3Prime,
  });
  const pageHtml = `<div data-find-server-page>${renderListPagination(
    'find-server',
    Number(state.searchTotal) || 0,
    Number(state.searchPage) || 1,
    20,
  )}</div>`;

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
      ${pageHtml}
      ${demandHtml}
    </section>`;
}

function step3OpenForSearch(tab, state) {
  if (tab === 'room') return true;
  if (tab === 'student' && resolveStudentSearchHope(state) === 'study_room') return true;
  return false;
}

function step3SearchBlocked(state, tab) {
  if (!step3OpenForSearch(tab, state)) return false;
  const bag = state.step3ByTab?.[tab];
  if (!bag) return false;
  return bag.pending === true || bag.unconfirmed === true;
}

function step3BlockMessage(state, tab) {
  const bag = state.step3ByTab?.[tab];
  if (bag?.pending) return STEP3_PENDING_HINT;
  if (bag?.basis === 'complex') return STEP3_COMPLEX_HINT;
  return DONG_RETRY_HINT;
}

/** 숨은 시군구 id가 숫자가 아니면 검색을 막는다. 빈 선택·시·도만 포함. 세종은 숨은 id가 숫자면 통과. */
function guPickIncomplete(form, tab, state) {
  void state;
  const hiddenName = tab === 'room' ? 'f_sigungu_region_id' : tab === 'tutor' ? 'f_tutor_region_id' : 'f_preferred_region_id';
  const hidden = form.querySelector(`[name="${hiddenName}"]`);
  if (hidden instanceof HTMLInputElement && /^\d+$/.test(hidden.value.trim())) return false;
  return true;
}

function numericFilterId(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  return numericRegionId(raw);
}

/** @param {import('./state.js').SearchTab} tab @param {Record<string, string|string[]>} filters */
function findScopeMissing(tab, filters) {
  if (tab === 'room') {
    return !(
      numericFilterId(filters.sigungu_region_id) ||
      numericFilterId(filters.region_id) ||
      numericFilterId(filters.complex_id)
    );
  }
  if (tab === 'tutor') return !numericFilterId(filters.tutor_region_id);
  return !(
    numericFilterId(filters.preferred_region_id) ||
    numericFilterId(filters.preferred_studyroom_region_id) ||
    numericFilterId(filters.preferred_studyroom_complex_id)
  );
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {HTMLFormElement} form
 * @param {FindSurfaceState} state
 * @param {import('./state.js').ViewerRole} role
 * @param {() => void} rerender
 */
export async function runFindSearch(tab, form, state, role, rerender) {
  if (step3SearchBlocked(state, tab)) {
    const hint = form.querySelector('[data-find-step3="open"] .search-field__hint');
    if (hint) hint.textContent = step3BlockMessage(state, tab);
    return;
  }
  state.searchPage = 1;
  if (guPickIncomplete(form, tab, state)) {
    const hintText = findPickHint(tab, state, form);
    state.findScopeHint = hintText;
    const hint = form.querySelector('[data-find-gu-field] .search-field__hint');
    if (hint) hint.textContent = hintText;
    const cascadeHint = form.querySelector('[data-region-cascade-hint]');
    if (cascadeHint instanceof HTMLElement) {
      cascadeHint.hidden = false;
      cascadeHint.textContent = hintText;
    }
    state.searchTotal = 0;
    return;
  }
  const filters = collectFiltersFromForm(form, tab);
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
let findSearchSeq = 0;

function applySearchedRegionLabel(tab, filters, state, role) {
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
  return regionText;
}

/** 단위 목록이 검색보다 늦으면, 끝난 뒤 시군구 라벨을 다시 계산한다. */
function refreshSearchedLabelWhenCitiesReady(tab, state, role, rerender, seq) {
  const tutorAxis = isTutorUnitAxis(tab, state);
  const listReady = () => (tutorAxis ? findTutorUnitsStatus : findCitiesStatus) === 'ready';
  if (listReady()) return;
  const boot = tutorAxis ? findTutorUnitsBoot || bootFindTutorUnits() : findCitiesBoot || bootFindCities();
  boot.then(() => {
    if (seq !== findSearchSeq) return;
    if (!listReady()) return;
    if (!state.searchExecuted || !state.lastSearchFilters) return;
    applySearchedRegionLabel(tab, state.lastSearchFilters, state, role);
    syncFindHashState(state, tab);
    rerender();
  });
}

export async function runFindSearchWithFilters(tab, filters, state, role, rerender) {
  const seq = ++findSearchSeq;
  const stale = () => seq !== findSearchSeq;
  if (tab === 'student' && role === 'parent') {
    const hope = ensureParentHope(state);
    if (hope === 'tutor' || hope === 'study_room') filters.preferred_lesson_type = hope;
    else delete filters.preferred_lesson_type;
  }
  if (tab === 'student' && role === 'study_room') {
    delete filters.preferred_region_label;
    if (!filters.preferred_lesson_type) filters.preferred_lesson_type = 'study_room';
  }
  if (tab === 'student' && !filters.preferred_lesson_type && state.studentHopeType) {
    filters.preferred_lesson_type = state.studentHopeType;
  }
  if (tab === 'student') settleStudentStudyroomRegionFilter(filters);
  if (tab === 'room') settleRoomAddressFilters(filters);
  if (filters.preferred_lesson_type === 'both') delete filters.preferred_lesson_type;
  if (stale()) return;
  if (step3SearchBlocked(state, tab)) return;
  if (findScopeMissing(tab, filters)) {
    state.findScopeHint = REGION_NEED_CITY;
    state._needsSearchRestore = false;
    if (typeof document !== 'undefined') {
      const hint = document.querySelector('[data-find-gu-field] .search-field__hint');
      if (hint) hint.textContent = state.findScopeHint;
      const cascadeHint = document.querySelector('[data-region-cascade-hint]');
      if (cascadeHint instanceof HTMLElement) {
        cascadeHint.hidden = false;
        cascadeHint.textContent = state.findScopeHint;
      }
    }
    rerender();
    return;
  }
  state.findScopeHint = '';
  state.searchExecuted = true;
  state.searchLoading = true;
  state.searchError = null;
  state.lastSearchFilters = { ...filters };
  if (tab === 'student') {
    state.hasRequestSummary = isRequestSummaryFilterOn(filters.has_request_summary);
  }
  writeStoredFilters(tab, state.lastSearchFilters);

  applySearchedRegionLabel(tab, filters, state, role);
  refreshSearchedLabelWhenCitiesReady(tab, state, role, rerender, seq);
  // hydrate 재진입 시 동일 검색을 다시 돌리지 않도록 복원 키 선기록
  state._restoredSearchKey = `${tab}::${encodeFiltersForUrl(state.lastSearchFilters)}::${regionRestoreToken(tab, state.lastSearchFilters, state.canonicalLocation?.regionId)}`;
  syncFindHashState(state, tab);
  rerender();

  try {
    const kind = tab === 'room' ? 'study_room' : tab === 'tutor' ? 'tutor' : 'student';
    const sort = readListSortFromHash(kind, { mode: 'search' });
    logLocationDebug('list-fetch', { tab, mode: 'search-api', filters, region: state.activeRegionLabel });
    const result = await searchApi(tab, filters, {
      sort,
      page: Number(state.searchPage) || 1,
      limit: 20,
    });
    if (stale()) return;
    if (state.searchRows) state.searchRows = result.rows || [];
    if (state.searchItems) state.searchItems = result.items || [];
    state.searchExposureItems = withPublicCounts(tab, result.items || [], mapSearchResultsToExposure(tab, result.items || []));
    state.searchTotal = Number(result.total) || 0;
    if (tab === 'room' || tab === 'tutor') {
      seedRecommendedFromItems(tab === 'room' ? 'study_room' : 'tutor', state.searchExposureItems);
    }
    refreshActiveResultItems(tab, state, role);
  } catch (err) {
    if (stale()) return;
    if (state.searchRows) state.searchRows = [];
    if (state.searchItems) state.searchItems = [];
    state.searchExposureItems = [];
    state.searchTotal = 0;
    state.searchError = err instanceof Error ? err.message : '검색에 실패했습니다.';
    refreshActiveResultItems(tab, state, role);
  } finally {
    if (!stale()) {
      state.searchLoading = false;
      state._needsSearchRestore = false;
      refreshActiveResultItems(tab, state, role);
      syncFindHashState(state, tab);
      rerender();
    }
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
  bootFindTutorUnits(rerender);
  bindUniversityNameField(root);
  bindRegionCascades(
    {
      querySelectorAll: (sel) =>
        [...root.querySelectorAll(sel)].filter((el) => el.getAttribute('data-region-cascade') !== 'tutor_unit'),
    },
    findCityUnits,
  );
  bindTutorUnitCascades(root, findTutorUnits);
  root.querySelectorAll('[data-region-cascade]').forEach((el) => {
    el.addEventListener('change', () => {
      const hidden = el.querySelector('[data-field="region_id"]');
      const tab = ctx.getTab();
      const id = hidden instanceof HTMLInputElement ? axisFindRegionId(tab, state(), hidden.value) : '';
      rememberGuId(state(), tab, id);
      const label = id ? axisRegionLabel(tab, state(), id) : '';
      if (!state().lastSearchFilters) state().lastSearchFilters = {};
      if (tab === 'tutor') {
        delete state().lastSearchFilters.tutor_region_label;
        if (id) state().lastSearchFilters.tutor_region_id = id;
        else delete state().lastSearchFilters.tutor_region_id;
      }
      if (tab === 'student' && state().studentHopeType === 'tutor') {
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
    if (state().step3ByTab) state().step3ByTab[tab] = blankStep3();
    if (state().findGuByTab) state().findGuByTab[tab] = '';
    state().searchPage = 1;
    if (ctx.role === 'study_room' && (tab === 'room' || tab === 'student')) {
      state().canonicalLocation = null;
      state().activeRegionLabel = '';
      if (tab === 'student') {
        state().studentHopeType = 'study_room';
        state().hopeTypeResolved = true;
      }
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
        const step3Open = tab === 'room' || (tab === 'student' && hope === 'study_room');
        if (step3Open) {
          if (tab === 'student' && hope === 'study_room' && step3Bag(state(), tab).basis !== 'complex') {
            const bag = step3Bag(state(), tab);
            bag.pending = true;
            const latest = await confirmStudyroomDong(state(), result, rerender);
            if (latest) {
              bag.pending = false;
              bag.dongId = numericRegionId(state().studyroomDongRegionId);
              bag.complexId = '';
              bag.display = canonical.displayLabel || bag.display;
              bag.unconfirmed = Boolean(state().studyroomDongUnconfirmed);
            }
          } else {
            await applyStep3FromKakao(state(), tab, result);
          }
        }
        syncFindHashState(state(), tab);
        refreshActiveResultItems(tab, state(), ctx.role);
        logLocationDebug('change-region-address', { tab, canonical });
        rerender();
      });
    } catch (err) {
      void s114Alert(err instanceof Error ? err.message : '주소찾기를 열 수 없습니다.');
    }
  });

  root.querySelectorAll('[data-find-basis]').forEach((el) => {
    el.addEventListener('change', () => {
      if (!(el instanceof HTMLInputElement)) return;
      const tab = ctx.getTab();
      const bag = step3Bag(state(), tab);
      bag.basis = el.value === 'complex' ? 'complex' : 'dong';
      bag.dongId = '';
      bag.complexId = '';
      bag.display = '';
      bag.unconfirmed = false;
      bag.pending = false;
      rerender();
    });
  });

  root.querySelectorAll('[data-action="find-step3-address"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tab = ctx.getTab();
      try {
        await openKakaoPostcode(async (result) => {
          const bag = step3Bag(state(), tab);
          const hope = tab === 'student' ? resolveStudentSearchHope(state()) : 'study_room';
          if (tab === 'student' && hope === 'study_room' && bag.basis !== 'complex') {
            bag.pending = true;
            const latest = await confirmStudyroomDong(state(), result, rerender);
            if (latest) {
              const next = step3Bag(state(), tab);
              next.pending = false;
              next.basis = 'dong';
              next.dongId = numericRegionId(state().studyroomDongRegionId);
              next.complexId = '';
              next.display = canonicalFromKakao(result, tab, state()).displayLabel || '';
              next.unconfirmed = Boolean(state().studyroomDongUnconfirmed);
            }
          } else {
            await applyStep3FromKakao(state(), tab, result);
          }
          syncFindHashState(state(), tab);
          rerender();
        });
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '주소찾기를 열 수 없습니다.');
      }
    });
  });

  root.addEventListener(
    'click',
    (e) => {
      const target = e.target instanceof Element ? e.target : null;
      const btn = target?.closest(
        '[data-find-server-page] [data-guest-list-page], [data-find-server-page] [data-guest-list-more]',
      );
      if (!(btn instanceof HTMLElement)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const page = Number(btn.getAttribute('data-page'));
      if (!page || !state().lastSearchFilters) return;
      state().searchPage = page;
      runFindSearchWithFilters(ctx.getTab(), { ...state().lastSearchFilters }, state(), ctx.role, rerender);
    },
    true,
  );

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
        if (state().step3ByTab) state().step3ByTab.student = blankStep3();
      }
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

  root.querySelector('[data-room-student-retry]')?.addEventListener('click', () => {
    retryStudyRoomStudentDemand(rerender);
  });
  root.querySelector('[data-room-home-retry]')?.addEventListener('click', () => {
    retryStudyRoomHome(rerender);
  });
  root.querySelector('[data-parent-feed-retry]')?.addEventListener('click', () => {
    retryStudentFindFeed(ctx.getTab(), state(), rerender);
  });

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
