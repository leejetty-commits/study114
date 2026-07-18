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
import { isProviderSelfPreviewMode } from './search-role-access.js';
import { renderSearchMapBlock, bindSearchMapPinLinks } from './search-map.js';
import { renderSearchTierResults } from './search-tier-render.js';
import { collectFiltersFromForm, searchApi } from './search-api.js';
import { mapSearchResultsToExposure } from './search-exposure-mapper.js';
import { renderBrowseList } from '@home-ui/exposure-render.js';
import { SECTION_HEADINGS, renderSectionHeading } from '@home-ui/section-headings.js';
import {
  DEFAULT_STUDENT_HOPE_TYPE,
  renderHopeTypeGate,
  resolveHopeTypeFromQuery,
  writeStoredHopeType,
} from './student-hope-type.js';
import { resolveFindDefaultRegion } from '../../shared/student-hope-regions.js';
import { parseHashQuery } from '../../shared/preview-links.js';

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
  const ctx = { role, homeSelf: state.homeSelf === true };
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

/** @param {import('./state.js').SearchTab} tab @param {FindSurfaceState} state @param {import('./state.js').ViewerRole} [_role] */
function resolveActiveRegionLabel(tab, state, _role) {
  if (state.searchExecuted && state.activeRegionLabel) return state.activeRegionLabel;
  if (tab === 'tutor') return getTutorRegionLabel(resolveTutorRegionIndex(state));
  if (tab === 'room') return MOCK_REGIONS.room;
  // 학생찾기: A→B→C 마지막 희망유형 축의 1번 슬롯 (없으면 게스트 기본)
  const hope =
    state.studentHopeType === 'study_room' || state.studentHopeType === 'tutor'
      ? state.studentHopeType
      : DEFAULT_STUDENT_HOPE_TYPE;
  const guestFallback =
    hope === 'study_room' ? GUEST_DEFAULT_REGIONS.room : GUEST_DEFAULT_REGIONS.student;
  return resolveFindDefaultRegion(hope, guestFallback);
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {Record<string, unknown>} filters
 * @param {FindSurfaceState} state
 */
function regionLabelFromFilters(tab, filters, state) {
  if (tab === 'tutor') {
    const fromFilter = String(filters.tutor_region_id || filters.tutor_region_label || '').trim();
    return fromFilter || getTutorRegionLabel(resolveTutorRegionIndex(state));
  }
  if (tab === 'room') {
    const fromFilter = String(filters.region_label || filters.region_id || '').trim();
    return fromFilter || MOCK_REGIONS.room;
  }
  const fromFilter = String(filters.preferred_region || filters.region_label || '').trim();
  if (fromFilter) return fromFilter;
  const hope =
    state.studentHopeType === 'study_room' || state.studentHopeType === 'tutor'
      ? state.studentHopeType
      : DEFAULT_STUDENT_HOPE_TYPE;
  const guestFallback =
    hope === 'study_room' ? GUEST_DEFAULT_REGIONS.room : GUEST_DEFAULT_REGIONS.student;
  return resolveFindDefaultRegion(hope, guestFallback);
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
        ${renderSectionHeading({ ...SECTION_HEADINGS.students, desc: `${esc(regionLabel)} · 학생 수요` })}
        <p class="search-results__hint">이 지역에 표시할 학생 수요가 없습니다.</p>
      </section>`;
  }
  return `
    <section class="search-student-demand" aria-label="해당 지역 학생 수요">
      ${renderSectionHeading({ ...SECTION_HEADINGS.students, desc: `${esc(regionLabel)} · 학생 수요` })}
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
    const { items, regionLabel } = getRegionFeed(tab, regionFeedContext(tab, state, role));
    state.activeResultItems = items;
    state.activeResultSource = 'region';
    state.activeRegionLabel = regionLabel;
    return items;
  }

  if (state.searchLoading) {
    return state.activeResultItems || [];
  }

  if (state.searchError) {
    state.activeResultItems = [];
    state.activeResultSource = 'search';
    state.activeRegionLabel = '';
    return [];
  }

  const homeSelf = resolveHomeSelf(state);
  state.activeResultItems = filterToProviderSelf(tab, role, state.searchExposureItems || [], homeSelf);
  state.activeResultSource = 'search';
  state.activeRegionLabel = isProviderSelfPreviewMode(tab, role, homeSelf)
    ? state.activeResultItems[0]?.location_label || ''
    : resolveActiveRegionLabel(tab, state, role);
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
  state.expanded = false;
  state.searchExecuted = false;
  state.searchLoading = false;
  state.searchError = null;
  state.searchTotal = 0;
  state.searchExposureItems = [];
  state.activeResultItems = [];
  state.activeResultSource = null;
  state.activeRegionLabel = '';
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
        <select class="search-field__control" name="${esc(name)}" ${field.key === 'lesson_format' ? 'data-lesson-format-select' : ''}>
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
    return `
      <label class="search-field search-field--toggle">
        <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
        <input type="checkbox" class="search-field__toggle" name="${esc(name)}" />
      </label>`;
  }

  if (field.input === 'range') {
    return `
      <div class="search-field search-field--range">
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

  const placeholders = {
    region: '동/행정동 · 단지',
    complex: '단지명',
    city: '시/구',
    text: '입력',
  };

  return `
    <label class="search-field${compact ? ' search-field--compact' : ''}">
      <span class="search-field__label">${esc(field.label)} ${dbHint}</span>
      <input type="text" class="search-field__control" name="${esc(name)}" placeholder="${esc(placeholders[field.input] || '')}" />
    </label>`;
}

function renderBasicRows(fields, state, compact = false) {
  const row1 = fields.filter((f) => f.basicRow === 1);
  const row2 = fields.filter((f) => f.basicRow === 2);
  if (compact) {
    return `<div class="search-grid search-grid--compact">${row1.map((f) => renderField(f, state, { compact: true })).join('')}</div>`;
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
      const label = MOCK_REGIONS.tutor;
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
  const regionLabel = MOCK_REGIONS[regionKey];
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

function renderProviderSelfNote(tab, role, homeSelf = false) {
  if (!isProviderSelfPreviewMode(tab, role, homeSelf)) return '';
  const copy =
    role === 'tutor'
      ? '내 과외쌤이 검색·노출 화면에서 어떻게 보이는지 미리보기입니다. 비교·찜은 사용할 수 없습니다.'
      : '내 공부방이 검색·노출 화면에서 어떻게 보이는지 미리보기입니다. 비교·찜은 사용할 수 없습니다.';
  return `<p class="search-note search-note--self">${esc(copy)}</p>`;
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
  } = options;
  if (homeSelf) state.homeSelf = true;
  const meta = SEARCH_TABS[tab];
  const basicFields = meta.fields.filter((f) => f.tier === 'basic');
  const expandedFields = meta.fields.filter((f) => f.tier === 'expanded');
  const activeItems = refreshActiveResultItems(tab, state, role);
  const isHome = variant === 'home';
  const formClass = isHome ? 'search-form search-form--compact search-form--home-aux' : 'search-form search-form--compact';
  const homeSelfFlag = resolveHomeSelf(state);

  const leadHtml = hideSearchForm
    ? `<p class="parent-home-find__lead">경쟁 목록·조건 검색은 상단 검색 메뉴를 이용하세요.</p>`
    : isHome
      ? `<p class="parent-home-find__lead">조건을 더 좁히려면 아래에서 검색하세요.</p>`
      : '';

  const formHtml = hideSearchForm
    ? ''
    : `
    <form class="${formClass}" ${formAttr}>
      ${isHome ? '<legend class="parent-home-find__legend">조건 검색</legend>' : ''}
      <section class="search-section search-section--compact">
        ${renderBasicRows(basicFields, state, true)}
      </section>
      ${
        state.expanded
          ? `
      <section class="search-section search-section--expanded">
        <div class="search-grid search-grid--compact">${expandedFields.map((f) => renderField(f, state, { compact: true })).join('')}</div>
        <div class="search-actions search-actions--inline">
          <button type="button" class="btn btn--secondary btn--sm" data-action="apply-expanded">적용</button>
        </div>
      </section>`
          : ''
      }
      <div class="search-actions search-actions--compact">
        <button type="button" class="search-expand__toggle search-expand__toggle--inline" data-action="toggle-expanded" aria-expanded="${state.expanded}">
          ${state.expanded ? '필터 접기' : '상세 필터'}
        </button>
        <button type="reset" class="btn btn--secondary btn--sm">초기화</button>
        <button type="submit" class="btn btn--primary btn--sm">검색</button>
      </div>
    </form>`;

  return `
    ${renderProviderSelfNote(tab, role, homeSelfFlag)}
    ${renderCompactRegionBar(tab, state, { variant, role })}
    ${showMap
      ? renderSearchMapBlock(activeItems, {
          searched: state.searchExecuted,
          regionLabel: state.activeRegionLabel || MOCK_REGIONS.room,
          resultSource: resolveResultSource(state),
        })
      : ''}
    ${leadHtml}
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

  const mapNote =
    tab === 'room'
      ? '<p class="search-results__hint">공부방: 지도 핀과 아래 목록은 동일한 결과 집합입니다. Prime/Pick/Basic 구획 없음.</p>'
      : tab === 'student'
        ? role === 'parent'
          ? '<p class="search-results__hint">학생찾기: 시장 비교 열람 · 블라인드 유지 · 학생 간 쪽지 불가</p>'
          : '<p class="search-results__hint">학생찾기: 블라인드 리스트 · 비교 없음 · 찜·쪽지 중심</p>'
        : '<p class="search-results__hint">과외쌤: 필터링된 결과 + 해당 지역 학생 수요 · 티어 구획 없음</p>';

  return `
    <section class="search-results search-results--executed" ${debugAttrs} data-result-mode="${esc(resultMode)}" data-surface-type="${esc(surfaceType)}">
      <h2 class="search-section__title">검색 결과 <span class="search-results__count">${state.searchTotal}건</span></h2>
      ${mapNote}
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
  state.searchExecuted = true;
  state.searchLoading = true;
  state.searchError = null;
  rerender();

  try {
    const filters = collectFiltersFromForm(form, tab);
    if (tab === 'student' && state.studentHopeType) {
      filters.preferred_lesson_type = state.studentHopeType;
    }
    state.activeRegionLabel = regionLabelFromFilters(tab, filters, state);
    const result = await searchApi(tab, filters);
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
    refreshActiveResultItems(tab, state, role);
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
    resetFindSurface(state(), form instanceof HTMLFormElement ? form : undefined);
    refreshActiveResultItems(ctx.getTab(), state(), ctx.role);
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
      const form = getForm();
      resetFindSurface(state(), form instanceof HTMLFormElement ? form : undefined, { keepTutorRegion: true });
      refreshActiveResultItems(ctx.getTab(), state(), ctx.role);
      rerender();
    });
  });

  root.querySelector('[data-action="apply-expanded"]')?.addEventListener('click', () => {
    const form = getForm();
    if (form instanceof HTMLFormElement) {
      runFindSearch(ctx.getTab(), form, state(), ctx.role, rerender);
    }
  });

  root.querySelector('[data-action="change-region"]')?.addEventListener('click', () => {
    window.alert('§8-3 광역 검색 — 인근 동 → 구군 → 시/도 단계 확장 (추후 UI)');
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
      state().activeRegionLabel = resolveFindDefaultRegion(hope, guestFallback);
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
}

/** @param {'study_room' | 'tutor'} parentTab */
export function parentTabToSearchTab(parentTab) {
  return parentTab === 'study_room' ? 'room' : 'tutor';
}
