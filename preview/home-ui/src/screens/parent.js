import { previewState } from '../state.js';
import { EXPOSURE_STUDY_ROOMS, EXPOSURE_TUTORS } from '../exposure-data.js';
import { SLOT_PRIME, SLOT_PICK_ROW } from '../data.js';
import { SECTION_HEADINGS, renderSectionHeading } from '../section-headings.js';
import {
  renderHomeShell,
  renderRegionBar,
  renderMapBlock,
  renderAdInline,
  bindLayoutEvents,
  bindParentTabEvents,
} from '../layout.js';
import { renderExposureBox, renderBasicListBlock } from '../exposure-render.js';
import { bindCompareEvents } from '../compare-modal.js';

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
      ${renderSectionHeading(SECTION_HEADINGS.pickStudyRoom)}
      <div class="expo-grid--5">
        ${pool.slice(3, 8).map((item, i) => renderExposureBox('study_room', 'pick', item, SLOT_PICK_ROW[i], opts)).join('')}
      </div>
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
      ${renderSectionHeading(SECTION_HEADINGS.pickTutor)}
      <div class="expo-grid--5">
        ${pool.slice(3, 8).map((item, i) => renderExposureBox('tutor', 'pick', item, SLOT_PICK_ROW[i], opts)).join('')}
      </div>
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
    <p class="content-section__desc" style="margin-bottom:var(--space-3);">로그인 · 지역 반영 · 비교검색(표 모달) 이용 가능</p>
    ${tab === 'study_room' ? renderStudyRoomTab() : renderTutorTab()}
  `;
  return renderHomeShell('parent', content, { showAuth: false, showRoleSwitch: true });
}

export function bindParentEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bindParentTabEvents(root, rerender);
  bindCompareEvents(root, true);
}
