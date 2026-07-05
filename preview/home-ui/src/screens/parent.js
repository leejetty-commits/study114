import { previewState } from '../state.js';
import { EXPOSURE_STUDY_ROOMS, EXPOSURE_TUTORS } from '../exposure-data.js';
import { SLOT_PRIME } from '../data.js';
import { SECTION_HEADINGS, renderSectionHeading } from '../section-headings.js';
import {
  renderHomeShell,
  renderRegionBar,
  renderMapBlock,
  renderAdInline,
  bindLayoutEvents,
  bindParentTabEvents,
} from '../layout.js';
import { renderExposureBox, renderBasicListBlock, renderPickPaginatedBlock } from '../exposure-render.js';
import { renderCompareBar, bindUserActionEvents, openWishlistModal } from '../user-actions-ui.js';
import { bindCompareEvents } from '../compare-modal.js';
import { bindGuestListPagination } from '../list-pagination.js';
import { bindDetailDecisionEvents } from '../detail-decision/index.js';

function renderParentTabs() {
  const tab = previewState.parentTab;
  return `
    <div class="parent-tabs" role="tablist">
      <button type="button" class="parent-tabs__btn ${tab === 'study_room' ? 'is-active' : ''}" data-parent-tab="study_room" role="tab">우리동네 공부방</button>
      <button type="button" class="parent-tabs__btn ${tab === 'tutor' ? 'is-active' : ''}" data-parent-tab="tutor" role="tab">우리동네 과외쌤</button>
    </div>
  `;
}

function renderStudyRoomTab() {
  const pool = EXPOSURE_STUDY_ROOMS;
  const opts = { guest: false };
  return `
    ${renderRegionBar(true)}
    <div class="content-section content-section--orange">
      ${renderSectionHeading(SECTION_HEADINGS.primeStudyRoom)}
      <div class="expo-grid--3">
        ${pool.slice(0, 3).map((item, i) => renderExposureBox('study_room', 'prime', item, SLOT_PRIME[i], opts)).join('')}
      </div>
      ${renderPickPaginatedBlock('study_room', 'pick_study_room', SECTION_HEADINGS.pickStudyRoom, pool, opts)}
      ${renderBasicListBlock('study_room', SECTION_HEADINGS.basicStudyRoom, pool.slice(0, 8), opts)}
    </div>
    ${renderMapBlock()}
    ${renderAdInline()}
  `;
}

function renderTutorTab() {
  const pool = EXPOSURE_TUTORS;
  const opts = { guest: false };
  return `
    ${renderRegionBar(true)}
    <div class="content-section content-section--blue">
      ${renderSectionHeading(SECTION_HEADINGS.primeTutor)}
      <div class="expo-grid--3">
        ${pool.slice(0, 3).map((item, i) => renderExposureBox('tutor', 'prime', item, SLOT_PRIME[i], opts)).join('')}
      </div>
      ${renderPickPaginatedBlock('tutor', 'pick_tutor', SECTION_HEADINGS.pickTutor, pool, opts)}
      ${renderBasicListBlock('tutor', SECTION_HEADINGS.basicTutor, pool.slice(0, 8), opts)}
    </div>
    ${renderAdInline()}
    <p class="content-section__foot">지도 미제공 · 과외 8장 설계 더미</p>
  `;
}

export function renderParent() {
  const tab = previewState.parentTab;
  const content = `
    ${renderParentTabs()}
    <p class="content-section__desc" style="margin-bottom:var(--space-3);">로그인 · ⇄로 비교 선택(최대 3) · ♡ 찜 · 마이페이지에서 찜 목록</p>
    ${tab === 'study_room' ? renderStudyRoomTab() : renderTutorTab()}
    ${renderCompareBar()}
  `;
  return renderHomeShell('parent', content, { showAuth: false, showRoleSwitch: true });
}

export function bindParentEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bindParentTabEvents(root, rerender);
  bindGuestListPagination(root, rerender);
  bindCompareEvents(root, true);
  bindUserActionEvents(root, rerender);
  bindDetailDecisionEvents(root, { onRerender: rerender, viewer: 'parent' });
}
