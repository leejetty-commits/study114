/**
 * 관리자모드 > 서비스 홈 미리보기 화면
 * 실사용자 홈 라우트(#/guest 등)와 분리된 검수 뷰포트
 */

import {
  EXPOSURE_STUDENTS,
  EXPOSURE_STUDY_ROOMS,
  EXPOSURE_TUTORS,
} from '../exposure-data.js';
import {
  getPrimeOccupied,
  renderGuestPaginatedListBlock,
  renderPickPaginatedBlock,
  renderPrimeSlotGrid,
} from '../exposure-render.js';
import { bindGuestListPagination } from '../list-pagination.js';
import {
  bindProviderHomeTabEvents,
  getProviderHomeMode,
  renderProviderHomeBody,
  renderProviderHomeTabs,
} from '../provider-home.js';
import { SECTION_HEADINGS, renderSectionHeading } from '../section-headings.js';
import { bindFindSurfaceEvents } from '@search-ui/search-find-surface.js';
import {
  ADMIN_HOME_PREVIEW_MODE_META,
  ADMIN_HOME_PREVIEW_STUDENT_REGION,
  ADMIN_HOME_PREVIEW_STUDY_ROOM_SLOTS,
  ADMIN_HOME_PREVIEW_TUTOR_SLOTS,
  basisLabel,
} from './admin-home-preview-seed.js';
import {
  getActiveRegionSlot,
  getAdminHomePreviewFindState,
  getAdminHomePreviewState,
  getGuestTutorActiveSlot,
  patchAdminHomePreviewState,
  resetAdminHomePreviewFind,
  setAdminHomePreviewMode,
  setAdminHomePreviewStudyRoomSlot,
  setAdminHomePreviewTutorSlot,
} from './admin-home-preview-store.js';
import { bindAdminHomePreviewGuards } from './admin-home-preview-guard.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function renderModeSwitcher(activeMode) {
  return `
    <div class="ahp-modes" role="tablist" aria-label="미리보기 모드">
      ${Object.entries(ADMIN_HOME_PREVIEW_MODE_META)
        .map(
          ([id, meta]) => `
        <button type="button" class="ahp-modes__btn${id === activeMode ? ' is-active' : ''}"
          data-ahp-mode="${esc(id)}" role="tab" aria-selected="${id === activeMode}">
          ${esc(meta.label)}
        </button>`,
        )
        .join('')}
    </div>`;
}

/**
 * @param {import('./admin-home-preview-seed.js').AdminPreviewRegionSlot[]} slots
 * @param {number} activeIndex
 * @param {string} attr
 */
function renderRegionSlots(slots, activeIndex, attr) {
  return `
    <div class="ahp-slots" role="group" aria-label="기준지역 슬롯">
      ${slots
        .map((slot, idx) => {
          const active = idx === activeIndex;
          return `
        <button type="button" class="ahp-slot${active ? ' is-active' : ''}"
          data-ahp-slot-attr="${esc(attr)}" data-ahp-slot-index="${idx}"
          aria-pressed="${active}">
          <span class="ahp-slot__index">${idx + 1}번</span>
          <strong class="ahp-slot__label">${esc(slot.label)}</strong>
          <span class="ahp-slot__basis">${esc(basisLabel(slot.basis))}</span>
        </button>`;
        })
        .join('')}
    </div>`;
}

function renderStatusBanner(state) {
  const modeMeta = ADMIN_HOME_PREVIEW_MODE_META[state.mode];
  const active = getActiveRegionSlot(state);
  const guestTutor = getGuestTutorActiveSlot(state);
  return `
    <div class="ahp-banner" role="status">
      <p class="ahp-banner__mode"><strong>미리보기 모드</strong> · ${esc(modeMeta.label)}</p>
      <p class="ahp-banner__region">
        <strong>활성 기준지역</strong> · ${esc(active.label)}
        <span class="ahp-banner__type">(${esc(basisLabel(active.basis))})</span>
      </p>
      ${
        state.mode === 'guest'
          ? `<p class="ahp-banner__extra">과외 섹션 활성 시 · ${esc(guestTutor.label)}</p>`
          : ''
      }
      <p class="ahp-banner__warn">검수용 seed · 실사용자 가입/저장지역/실홈 기본값과 분리 · 저장·발송·결제는 차단됩니다</p>
    </div>`;
}

function renderGuestViewport(state) {
  const room = ADMIN_HOME_PREVIEW_STUDY_ROOM_SLOTS[state.guestRoomSlotIndex];
  const tutor = getGuestTutorActiveSlot(state);
  const student = ADMIN_HOME_PREVIEW_STUDENT_REGION;
  const roomPool = EXPOSURE_STUDY_ROOMS;
  const tutorPool = EXPOSURE_TUTORS;
  const studentPool = EXPOSURE_STUDENTS;
  const roomOccupied = getPrimeOccupied(roomPool);
  const tutorOccupied = getPrimeOccupied(tutorPool);
  const guestOpts = { guest: true };

  return `
    <div class="ahp-viewport" data-ahp-viewport="guest">
      <section class="ahp-guest-hero">
        <h2 class="ahp-guest-hero__title">${esc(room.label)}</h2>
        <p class="ahp-guest-hero__sub">비로그인 홈 미리보기 · 활성 타입 ${esc(basisLabel(room.basis))} · 학생 기준 ${esc(student.label)}</p>
      </section>

      <div class="ahp-region-block">
        <h3 class="ahp-region-block__title">공부방 섹션 기준지역</h3>
        ${renderRegionSlots(ADMIN_HOME_PREVIEW_STUDY_ROOM_SLOTS, state.guestRoomSlotIndex, 'guest-room')}
        <p class="ahp-hint">활성 슬롯 타입만 반영 · 행정동/단지를 한 화면에 동시 필터로 섞지 않음</p>
      </div>

      <div class="content-section content-section--orange">
        ${renderSectionHeading({ ...SECTION_HEADINGS.primeStudyRoom, id: 'ahp-prime-room', locationLabel: room.label })}
        ${renderPrimeSlotGrid('study_room', roomOccupied, guestOpts)}
        ${renderPickPaginatedBlock('study_room', 'pick_study_room', { ...SECTION_HEADINGS.pickStudyRoom, locationLabel: room.label }, roomPool, {
          ...guestOpts,
          primeOccupied: roomOccupied,
        })}
      </div>
      ${renderGuestPaginatedListBlock('study_room', 'basic_study_room', { ...SECTION_HEADINGS.basicStudyRoom, locationLabel: room.label }, roomPool, guestOpts)}

      <div class="ahp-region-block">
        <h3 class="ahp-region-block__title">과외쌤 섹션 기준지역 (시)</h3>
        ${renderRegionSlots(ADMIN_HOME_PREVIEW_TUTOR_SLOTS, state.guestTutorSlotIndex, 'guest-tutor')}
      </div>

      <div class="content-section content-section--blue">
        ${renderSectionHeading({ ...SECTION_HEADINGS.primeTutor, id: 'ahp-prime-tutor', locationLabel: tutor.label })}
        ${renderPrimeSlotGrid('tutor', tutorOccupied, guestOpts)}
        ${renderPickPaginatedBlock('tutor', 'pick_tutor', { ...SECTION_HEADINGS.pickTutor, locationLabel: tutor.label }, tutorPool, {
          ...guestOpts,
          primeOccupied: tutorOccupied,
        })}
      </div>
      ${renderGuestPaginatedListBlock('tutor', 'basic_tutor', { ...SECTION_HEADINGS.basicTutor, locationLabel: tutor.label }, tutorPool, guestOpts)}

      <div class="content-section">
        ${renderSectionHeading({ ...SECTION_HEADINGS.students, id: 'ahp-student', locationLabel: student.label })}
        ${renderGuestPaginatedListBlock('student', 'basic_student', { ...SECTION_HEADINGS.students, locationLabel: student.label }, studentPool, guestOpts)}
      </div>
    </div>`;
}

function renderParentViewport(state) {
  const find = getAdminHomePreviewFindState();
  find.activeRegionLabel = ADMIN_HOME_PREVIEW_STUDENT_REGION.label;
  return `
    <div class="ahp-viewport" data-ahp-viewport="parent">
      <div class="ahp-region-block">
        <h3 class="ahp-region-block__title">학생 미리보기 기준지역</h3>
        <p class="ahp-fixed-region"><strong>${esc(ADMIN_HOME_PREVIEW_STUDENT_REGION.label)}</strong> · ${esc(basisLabel(ADMIN_HOME_PREVIEW_STUDENT_REGION.basis))} · 이번 라운드 1개 seed</p>
      </div>
      ${renderProviderHomeTabs('parent', state.parentTab, 'data-ahp-parent-tab')}
      ${renderProviderHomeBody('parent', state.parentTab, find, { hideSearchCrossLink: true })}
    </div>`;
}

function renderStudyRoomViewport(state) {
  const find = getAdminHomePreviewFindState();
  const slot = getActiveRegionSlot(state);
  find.activeRegionLabel = slot.label;
  return `
    <div class="ahp-viewport" data-ahp-viewport="study_room">
      <div class="ahp-region-block">
        <h3 class="ahp-region-block__title">공부방 노출지역 슬롯 (저장 3 · 활성 1)</h3>
        ${renderRegionSlots(ADMIN_HOME_PREVIEW_STUDY_ROOM_SLOTS, state.studyRoomSlotIndex, 'study-room')}
        <p class="ahp-hint">현재 활성: <strong>${esc(slot.label)}</strong> · 타입 <strong>${esc(basisLabel(slot.basis))}</strong> 만 홈 문법에 적용</p>
      </div>
      ${renderProviderHomeTabs('study_room', state.studyRoomTab, 'data-ahp-room-tab')}
      ${renderProviderHomeBody('study_room', state.studyRoomTab, find, { hideSearchCrossLink: true })}
    </div>`;
}

function renderTutorViewport(state) {
  const find = getAdminHomePreviewFindState();
  const slot = getActiveRegionSlot(state);
  find.activeRegionLabel = slot.label;
  find.tutorRegionIndex = state.tutorSlotIndex;
  return `
    <div class="ahp-viewport" data-ahp-viewport="tutor">
      <div class="ahp-region-block">
        <h3 class="ahp-region-block__title">과외쌤 활동 시 (지도 없음)</h3>
        ${renderRegionSlots(ADMIN_HOME_PREVIEW_TUTOR_SLOTS, state.tutorSlotIndex, 'tutor')}
        <p class="ahp-hint">시 기준만 · 행정동/단지 UI 없음 · 현재 <strong>${esc(slot.label)}</strong></p>
      </div>
      ${renderProviderHomeTabs('tutor', state.tutorTab, 'data-ahp-tutor-tab')}
      ${renderProviderHomeBody('tutor', state.tutorTab, find, {
        hideSearchCrossLink: true,
        hideRegionBar: false,
      })}
    </div>`;
}

function renderViewport(state) {
  if (state.mode === 'parent') return renderParentViewport(state);
  if (state.mode === 'study_room') return renderStudyRoomViewport(state);
  if (state.mode === 'tutor') return renderTutorViewport(state);
  return renderGuestViewport(state);
}

export function renderAdminHomePreview() {
  const state = getAdminHomePreviewState();
  const meta = ADMIN_HOME_PREVIEW_MODE_META[state.mode];
  return `
    <section class="mypage-panel a28-panel ahp-panel">
      <header class="a28-panel__head">
        <h2 class="sup-panel-card__title">서비스 홈 미리보기 <span class="sup-admin-badge a28-badge">검수</span></h2>
        <p class="a28-help">${esc(meta.lead)}</p>
      </header>
      ${renderStatusBanner(state)}
      ${renderModeSwitcher(state.mode)}
      ${renderViewport(state)}
      <p class="ahp-footnote">
        seed 전용 키 <code>study114.adminHomePreview.v1</code> ·
        실사용자 <code>preferred_*</code> / <code>GUEST_DEFAULT_REGIONS</code> / 가입 주소와 공유하지 않음
      </p>
    </section>`;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindAdminHomePreviewEvents(root, rerender) {
  bindAdminHomePreviewGuards(root);

  root.querySelectorAll('[data-ahp-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-ahp-mode');
      if (!mode) return;
      setAdminHomePreviewMode(/** @type {any} */ (mode));
      rerender();
    });
  });

  root.querySelectorAll('[data-ahp-slot-attr]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const attr = btn.getAttribute('data-ahp-slot-attr');
      const idx = Number(btn.getAttribute('data-ahp-slot-index'));
      if (attr === 'guest-room' || attr === 'study-room') {
        setAdminHomePreviewStudyRoomSlot(idx);
        resetAdminHomePreviewFind();
      } else if (attr === 'guest-tutor' || attr === 'tutor') {
        setAdminHomePreviewTutorSlot(idx);
        resetAdminHomePreviewFind();
      }
      rerender();
    });
  });

  const state = getAdminHomePreviewState();

  if (state.mode === 'guest') {
    bindGuestListPagination(root, rerender);
  }

  if (state.mode === 'parent') {
    bindProviderHomeTabEvents(root, rerender, {
      role: 'parent',
      getTab: () => getAdminHomePreviewState().parentTab,
      setTab: (tab) => patchAdminHomePreviewState({ parentTab: tab }),
      resetFind: () => resetAdminHomePreviewFind(),
      tabAttr: 'data-ahp-parent-tab',
    });
    bindFindSurfaceEvents(root, rerender, {
      getTab: () => getProviderHomeMode('parent', getAdminHomePreviewState().parentTab).searchTab,
      getState: () => getAdminHomePreviewFindState(),
      role: 'parent',
    });
  }

  if (state.mode === 'study_room') {
    bindProviderHomeTabEvents(root, rerender, {
      role: 'study_room',
      getTab: () => getAdminHomePreviewState().studyRoomTab,
      setTab: (tab) => patchAdminHomePreviewState({ studyRoomTab: tab }),
      resetFind: () => resetAdminHomePreviewFind(),
      tabAttr: 'data-ahp-room-tab',
    });
    bindFindSurfaceEvents(root, rerender, {
      getTab: () => getProviderHomeMode('study_room', getAdminHomePreviewState().studyRoomTab).searchTab,
      getState: () => getAdminHomePreviewFindState(),
      role: 'study_room',
    });
  }

  if (state.mode === 'tutor') {
    bindProviderHomeTabEvents(root, rerender, {
      role: 'tutor',
      getTab: () => getAdminHomePreviewState().tutorTab,
      setTab: (tab) => patchAdminHomePreviewState({ tutorTab: tab }),
      resetFind: () => resetAdminHomePreviewFind(),
      tabAttr: 'data-ahp-tutor-tab',
    });
    bindFindSurfaceEvents(root, rerender, {
      getTab: () => getProviderHomeMode('tutor', getAdminHomePreviewState().tutorTab).searchTab,
      getState: () => getAdminHomePreviewFindState(),
      role: 'tutor',
    });
  }
}
