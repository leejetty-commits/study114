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

/**
 * @param {'study_room'|'tutor'} kind
 * @param {object[]} items
 * @param {{ guest?: boolean, viewerRole?: string, sourceRoute?: string, showCompare?: boolean, showWish?: boolean }} opts
 * @param {string} [sectionTag]
 * @param {'region'|'search'} [mode]
 */
function renderProviderTierResults(kind, items, opts = {}, sectionTag = '지역 피드', mode = 'region') {
  const occupied = getPrimeOccupied(items);
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

  // 섹션 주석(Prime 슬롯·순환 등)은 이용안내로 이전 — 홈에는 제목·지역만
  const locDesc = sectionTag || '';
  const primeHtml = `
      ${renderSectionHeading({ ...section.prime, desc: locDesc })}
      ${renderPrimeSlotGrid(kind, occupied, opts)}`;

  const pickHtml = renderPickPaginatedBlock(
    kind,
    section.pickListId,
    { ...section.pick, desc: locDesc },
    items,
    { ...opts, primeOccupied: occupied },
  );

  const basicHtml = renderBasicListBlock(
    kind,
    { ...section.basic, desc: locDesc },
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
/**
 * @param {'study_room'|'tutor'} kind
 * @param {object[]} items
 * @param {object} opts
 * @param {string} regionLabel — 활성 지역 (헤더 현재위치와 동일 변수)
 * @param {'region'|'search'} mode
 */
function renderProviderFlatResults(kind, items, opts = {}, regionLabel = '', mode = 'search') {
  const tab = kind === 'study_room' ? 'room' : 'tutor';
  const findLabel = kind === 'study_room' ? '공부방찾기 결과' : '과외쌤찾기 결과';
  const loc = String(regionLabel || '').trim();
  const title = loc ? `${findLabel} 현재위치 ${loc}` : findLabel;
  if (!items.length) {
    return `<div class="search-flat-results search-flat-results--empty" data-surface="search-flat">${renderSearchZeroState(tab, mode)}</div>`;
  }
  return `
    <div class="content-section search-flat-results" data-surface="search-flat">
      ${renderSectionHeading({
        icon: kind === 'study_room' ? SECTION_HEADINGS.basicStudyRoom.icon : SECTION_HEADINGS.basicTutor.icon,
        iconType: 'logo',
        title,
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

  return `
    <div class="content-section search-tier-results" data-surface="student-blind">
      ${renderSectionHeading({ ...SECTION_HEADINGS.students, desc: sectionTag || '' })}
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
  const homeTierTag = regionLabel || (mode === 'region' ? '지역 피드' : '검색 결과');
  const useHomeTierGrammar = surfaceType === 'home' && mode === 'region';

  if (tab === 'room') {
    return useHomeTierGrammar
      ? renderProviderTierResults('study_room', exposureItems, opts, homeTierTag, mode)
      : renderProviderFlatResults('study_room', exposureItems, opts, regionLabel, mode);
  }
  if (tab === 'tutor') {
    return useHomeTierGrammar
      ? renderProviderTierResults('tutor', exposureItems, opts, homeTierTag, mode)
      : renderProviderFlatResults('tutor', exposureItems, opts, regionLabel, mode);
  }
  return renderStudentTierResults(exposureItems, opts, homeTierTag, mode);
}

export { partitionByExposureTier };
