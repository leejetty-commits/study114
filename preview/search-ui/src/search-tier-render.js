/**
 * 홈 surface = Prime/Pick/Basic 홈 문법
 * 검색 결과 surface = 순수 결과(flat) — 티어 구획 금지
 */

import {
  renderPrimeSlotGrid,
  renderPickPaginatedBlock,
  renderBasicListBlock,
  renderBrowseList,
  getPrimeOccupied,
} from '@home-ui/exposure-render.js';
import { SECTION_HEADINGS, renderSectionHeading } from '@home-ui/section-headings.js';
import { partitionByExposureTier } from './search-exposure-mapper.js';
import { renderSearchZeroState } from '@home-ui/empty-state-copy.js';
import { isProviderSelfPreviewMode } from './search-role-access.js';
import { getExposurePageSizes } from '@home-ui/exposure-rules.js';

/**
 * @param {'study_room'|'tutor'} kind
 * @param {object[]} items
 * @param {{ guest?: boolean, viewerRole?: string, sourceRoute?: string, showCompare?: boolean, showWish?: boolean }} opts
 * @param {string} [sectionTag]
 * @param {'region'|'search'} [mode]
 */
function renderProviderTierResults(kind, items, opts = {}, sectionTag = '지역 피드', mode = 'region') {
  const occupied = getPrimeOccupied(items);
  const { regionScopeType, primeSlots } = getExposurePageSizes();
  const section =
    kind === 'study_room'
      ? {
          prime: SECTION_HEADINGS.primeStudyRoom,
          pick: SECTION_HEADINGS.pickStudyRoom,
          basic: SECTION_HEADINGS.basicStudyRoom,
          color: 'content-section--orange',
          pickListId: `search_pick_${kind}`,
          basicListId: `search_basic_${kind}`,
        }
      : {
          prime: SECTION_HEADINGS.primeTutor,
          pick: SECTION_HEADINGS.pickTutor,
          basic: SECTION_HEADINGS.basicTutor,
          color: 'content-section--blue',
          pickListId: `search_pick_${kind}`,
          basicListId: `search_basic_${kind}`,
        };

  if (!items.length) {
    const tab = kind === 'study_room' ? 'room' : 'tutor';
    return `<div class="search-tier-results search-tier-results--empty">${renderSearchZeroState(tab, mode)}</div>`;
  }

  const primeHtml = `
      ${renderSectionHeading({ ...section.prime, desc: `${sectionTag} · Prime · ${regionScopeType}` })}
      <p class="expo-prime-meta">Prime ${primeSlots}슬롯 · 빈 자리 유지 · 자동대체 없음</p>
      ${renderPrimeSlotGrid(kind, occupied, opts)}`;

  const pickHtml = renderPickPaginatedBlock(
    kind,
    section.pickListId,
    { ...section.pick, desc: `${sectionTag} · Pick` },
    items,
    { ...opts, primeOccupied: occupied },
  );

  const basicHtml = renderBasicListBlock(
    kind,
    { ...section.basic, desc: `${sectionTag} · Basic` },
    items,
    { ...opts, primeOccupied: occupied, paginated: true, listId: section.basicListId },
  );

  return `
    <div class="content-section ${section.color} search-tier-results" data-surface="home-tier">
      ${primeHtml}
      ${pickHtml}
      ${basicHtml}
    </div>`;
}

/**
 * 검색 실행 후 · 찾기 페이지 browse — Prime/Pick/Basic 구획 없음
 * @param {'study_room'|'tutor'} kind
 * @param {object[]} items
 * @param {object} opts
 * @param {string} sectionTag
 * @param {'region'|'search'} mode
 */
function renderProviderFlatResults(kind, items, opts = {}, sectionTag = '검색 결과', mode = 'search') {
  const tab = kind === 'study_room' ? 'room' : 'tutor';
  const title = kind === 'study_room' ? '공부방 결과' : '과외쌤 결과';
  if (!items.length) {
    return `<div class="search-flat-results search-flat-results--empty" data-surface="search-flat">${renderSearchZeroState(tab, mode)}</div>`;
  }
  return `
    <div class="content-section search-flat-results" data-surface="search-flat">
      ${renderSectionHeading({
        icon: SECTION_HEADINGS.basicStudyRoom.icon,
        iconType: 'logo',
        title,
        desc: sectionTag,
      })}
      ${renderBrowseList(kind, items, { ...opts, sourceRoute: 'search' })}
    </div>`;
}

/**
 * @param {object[]} items
 * @param {{ guest?: boolean, viewerRole?: string }} opts
 * @param {string} [sectionTag]
 * @param {'region'|'search'} [mode]
 */
function renderStudentTierResults(items, opts = {}, sectionTag = '검색 결과', mode = 'search') {
  if (!items.length) {
    return `
      <div class="content-section search-tier-results search-tier-results--empty">
        ${renderSearchZeroState('student', mode)}
      </div>`;
  }

  const hint =
    opts.viewerRole === 'parent'
      ? '시장 비교 열람 · 블라인드 유지 · 학생 간 쪽지 불가'
      : '블라인드 리스트 · 지도·비교 없음';

  return `
    <div class="content-section search-tier-results" data-surface="student-blind">
      ${renderSectionHeading({ ...SECTION_HEADINGS.students, desc: `${sectionTag} · 블라인드 리스트` })}
      <p class="search-results__hint">${hint}</p>
      ${renderBrowseList('student', items, { ...opts, sourceRoute: 'search' })}
    </div>`;
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {object[]} exposureItems
 * @param {{ role: import('./state.js').ViewerRole, homeSelf?: boolean }} ctx
 * @param {{ mode?: 'region' | 'search', regionLabel?: string, surfaceType?: 'home' | 'search' }} [options]
 *
 * 분기:
 * - surfaceType=home + mode=region → 홈 티어 문법
 * - mode=search (검색 실행 후) → 항상 flat (홈에서 검색해도 동일)
 * - surfaceType=search + mode=region → 찾기 첫 렌더도 flat (홈 복제 금지)
 */
export function renderSearchTierResults(tab, exposureItems, ctx, options = {}) {
  const mode = options.mode || 'search';
  const surfaceType = options.surfaceType || 'search';
  const regionLabel = options.regionLabel || '';
  const guest = ctx.role === 'guest';
  const viewerRole = ctx.role;
  const selfPreview = isProviderSelfPreviewMode(tab, ctx.role, ctx.homeSelf === true);
  const opts = {
    guest,
    viewerRole,
    sourceRoute: 'search',
    showCompare: !selfPreview,
    showWish: !selfPreview,
  };
  const tag = mode === 'region' ? regionLabel || '지역 피드' : '검색 결과';
  const useHomeTierGrammar = surfaceType === 'home' && mode === 'region';

  if (tab === 'room') {
    return useHomeTierGrammar
      ? renderProviderTierResults('study_room', exposureItems, opts, tag, mode)
      : renderProviderFlatResults('study_room', exposureItems, opts, tag, mode);
  }
  if (tab === 'tutor') {
    return useHomeTierGrammar
      ? renderProviderTierResults('tutor', exposureItems, opts, tag, mode)
      : renderProviderFlatResults('tutor', exposureItems, opts, tag, mode);
  }
  return renderStudentTierResults(exposureItems, opts, tag, mode);
}

export { partitionByExposureTier };
