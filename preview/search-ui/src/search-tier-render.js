/**
 * 검색 결과 — 등급별 레이아웃(Prime/Pick/Basic) 렌더
 * 규칙: Prime 빈 슬롯 유지 · Pick 5세트+페이지+순환 · Basic 페이지(부스트 없음)
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
 * @param {{ guest?: boolean, viewerRole?: string }} opts
 * @param {string} [sectionTag]
 * @param {'region'|'search'} [mode]
 */
function renderProviderTierResults(kind, items, opts = {}, sectionTag = '검색 결과', mode = 'search') {
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
    <div class="content-section ${section.color} search-tier-results">
      ${primeHtml}
      ${pickHtml}
      ${basicHtml}
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

  return `
    <div class="content-section search-tier-results">
      ${renderSectionHeading({ ...SECTION_HEADINGS.students, desc: `${sectionTag} · 블라인드 리스트` })}
      <p class="search-results__hint">지도·비교 없음 · 찜 · 쪽지 중심</p>
      ${renderBrowseList('student', items, { ...opts, sourceRoute: 'search' })}
    </div>`;
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {object[]} exposureItems
 * @param {{ role: import('./state.js').ViewerRole, homeSelf?: boolean }} ctx
 * @param {{ mode?: 'region' | 'search', regionLabel?: string }} [options]
 */
export function renderSearchTierResults(tab, exposureItems, ctx, options = {}) {
  const mode = options.mode || 'search';
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

  if (tab === 'room') {
    return renderProviderTierResults('study_room', exposureItems, opts, tag, mode);
  }
  if (tab === 'tutor') {
    return renderProviderTierResults('tutor', exposureItems, opts, tag, mode);
  }
  return renderStudentTierResults(exposureItems, opts, tag, mode);
}

export { partitionByExposureTier };
