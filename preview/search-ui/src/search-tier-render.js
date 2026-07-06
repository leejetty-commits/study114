/**
 * 검색 결과 — 등급별 레이아웃(Prime/Pick/Basic) 렌더
 */

import { SLOT_PRIME, SLOT_PICK_ROW } from '@home-ui/data.js';
import {
  renderExposureBox,
  renderBasicListBlock,
  renderBrowseList,
} from '@home-ui/exposure-render.js';
import { SECTION_HEADINGS, renderSectionHeading } from '@home-ui/section-headings.js';
import { partitionByExposureTier } from './search-exposure-mapper.js';
import { renderSearchZeroState } from '@home-ui/empty-state-copy.js';
import { isProviderSelfPreviewMode } from './search-role-access.js';

/**
 * @param {'study_room'|'tutor'} kind
 * @param {object[]} items
 * @param {{ guest?: boolean, viewerRole?: string }} opts
 * @param {'region'|'search'} [mode]
 */
function renderProviderTierResults(kind, items, opts = {}, sectionTag = '검색 결과', mode = 'search') {
  const { prime, pick, basic } = partitionByExposureTier(items);
  const section =
    kind === 'study_room'
      ? {
          prime: SECTION_HEADINGS.primeStudyRoom,
          pick: SECTION_HEADINGS.pickStudyRoom,
          basic: SECTION_HEADINGS.basicStudyRoom,
          color: 'content-section--orange',
        }
      : {
          prime: SECTION_HEADINGS.primeTutor,
          pick: SECTION_HEADINGS.pickTutor,
          basic: SECTION_HEADINGS.basicTutor,
          color: 'content-section--blue',
        };

  const primeHtml =
    prime.length > 0
      ? `
      ${renderSectionHeading({ ...section.prime, desc: `${sectionTag} · Prime` })}
      <div class="expo-grid--3">
        ${prime
          .slice(0, 3)
          .map((item, i) => renderExposureBox(kind, 'prime', item, SLOT_PRIME[i], opts))
          .join('')}
      </div>`
      : '';

  const pickHtml =
    pick.length > 0
      ? `
      ${renderSectionHeading({ ...section.pick, desc: `${sectionTag} · Pick` })}
      <div class="expo-grid--5">
        ${pick
          .map((item, i) =>
            renderExposureBox(kind, 'pick', item, SLOT_PICK_ROW[i] || `Pick ${i + 1}`, opts),
          )
          .join('')}
      </div>`
      : '';

  const basicHtml =
    basic.length > 0
      ? renderBasicListBlock(kind, { ...section.basic, desc: `${sectionTag} · Basic` }, basic, opts)
      : '';

  if (!prime.length && !pick.length && !basic.length) {
    const tab = kind === 'study_room' ? 'room' : 'tutor';
    return `<div class="search-tier-results search-tier-results--empty">${renderSearchZeroState(tab, mode)}</div>`;
  }

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
 * @param {{ role: import('./state.js').ViewerRole }} ctx
 * @param {{ mode?: 'region' | 'search', regionLabel?: string }} [options]
 */
export function renderSearchTierResults(tab, exposureItems, ctx, options = {}) {
  const mode = options.mode || 'search';
  const regionLabel = options.regionLabel || '';
  const guest = ctx.role === 'guest';
  const viewerRole = ctx.role;
  const selfPreview = isProviderSelfPreviewMode(tab, ctx.role, ctx.homeSelf === true);
  const opts = { guest, viewerRole, sourceRoute: 'search', showCompare: !selfPreview, showWish: !selfPreview };
  const tag = mode === 'region' ? regionLabel : '검색 결과';

  if (tab === 'room') {
    return renderProviderTierResults('study_room', exposureItems, opts, tag, mode);
  }
  if (tab === 'tutor') {
    return renderProviderTierResults('tutor', exposureItems, opts, tag, mode);
  }
  return renderStudentTierResults(exposureItems, opts, tag, mode);
}
