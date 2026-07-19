/**
 * 관리자 서비스 홈 미리보기 — 전용 상태 (실사용자 state와 분리)
 */

import { createFindState, resetFindState } from '../find-state.js';
import {
  ADMIN_HOME_PREVIEW_MODE_META,
  ADMIN_HOME_PREVIEW_STORAGE_KEY,
  ADMIN_HOME_PREVIEW_STUDENT_REGION,
  ADMIN_HOME_PREVIEW_STUDY_ROOM_SLOTS,
  ADMIN_HOME_PREVIEW_TUTOR_SLOTS,
} from './admin-home-preview-seed.js';

/** @typedef {import('./admin-home-preview-seed.js').AdminHomePreviewMode} AdminHomePreviewMode */

/**
 * @typedef {object} AdminHomePreviewState
 * @property {AdminHomePreviewMode} mode
 * @property {number} studyRoomSlotIndex
 * @property {number} tutorSlotIndex
 * @property {number} guestRoomSlotIndex
 * @property {number} guestTutorSlotIndex
 * @property {'study_room'|'tutor'|'student'} parentTab
 * @property {'study_room'|'student'} studyRoomTab
 * @property {'tutor'|'student'} tutorTab
 * @property {ReturnType<typeof createFindState>} find
 */

/** @type {AdminHomePreviewState|null} */
let memory = null;

/** @returns {AdminHomePreviewState} */
function defaultState() {
  const find = createFindState();
  find.activeRegionLabel = ADMIN_HOME_PREVIEW_STUDY_ROOM_SLOTS[0].label;
  return {
    mode: 'guest',
    studyRoomSlotIndex: 0,
    tutorSlotIndex: 0,
    guestRoomSlotIndex: 0,
    guestTutorSlotIndex: 0,
    parentTab: 'study_room',
    studyRoomTab: 'study_room',
    tutorTab: 'tutor',
    find,
  };
}

function load() {
  if (memory) return memory;
  try {
    const raw = sessionStorage.getItem(ADMIN_HOME_PREVIEW_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      memory = {
        ...defaultState(),
        mode: ADMIN_HOME_PREVIEW_MODE_META[parsed.mode] ? parsed.mode : 'guest',
        studyRoomSlotIndex: clampIndex(parsed.studyRoomSlotIndex, ADMIN_HOME_PREVIEW_STUDY_ROOM_SLOTS.length),
        tutorSlotIndex: clampIndex(parsed.tutorSlotIndex, ADMIN_HOME_PREVIEW_TUTOR_SLOTS.length),
        guestRoomSlotIndex: clampIndex(parsed.guestRoomSlotIndex, ADMIN_HOME_PREVIEW_STUDY_ROOM_SLOTS.length),
        guestTutorSlotIndex: clampIndex(parsed.guestTutorSlotIndex, ADMIN_HOME_PREVIEW_TUTOR_SLOTS.length),
        parentTab: ['study_room', 'tutor', 'student'].includes(parsed.parentTab)
          ? parsed.parentTab
          : 'study_room',
        studyRoomTab: parsed.studyRoomTab === 'student' ? 'student' : 'study_room',
        tutorTab: parsed.tutorTab === 'student' ? 'student' : 'tutor',
        find: createFindState(),
      };
      syncFindRegionLabel(memory);
      return memory;
    }
  } catch {
    /* ignore */
  }
  memory = defaultState();
  return memory;
}

function persist() {
  const s = load();
  try {
    sessionStorage.setItem(
      ADMIN_HOME_PREVIEW_STORAGE_KEY,
      JSON.stringify({
        mode: s.mode,
        studyRoomSlotIndex: s.studyRoomSlotIndex,
        tutorSlotIndex: s.tutorSlotIndex,
        guestRoomSlotIndex: s.guestRoomSlotIndex,
        guestTutorSlotIndex: s.guestTutorSlotIndex,
        parentTab: s.parentTab,
        studyRoomTab: s.studyRoomTab,
        tutorTab: s.tutorTab,
      }),
    );
  } catch {
    /* ignore */
  }
}

function clampIndex(n, len) {
  const i = Number(n);
  if (!Number.isFinite(i) || i < 0) return 0;
  return Math.min(Math.floor(i), len - 1);
}

/** @param {AdminHomePreviewState} s */
function syncFindRegionLabel(s) {
  const active = getActiveRegionSlot(s);
  s.find.activeRegionLabel = active.label;
  s.find.adminPreviewActiveRegion = active.label;
  // 과외 미리보기 시 슬롯만 주입 — MOCK_TUTOR_REGIONS(부산/인천) 오염 방지
  if (s.mode === 'tutor' || s.mode === 'guest') {
    s.find.adminPreviewTutorRegions = ADMIN_HOME_PREVIEW_TUTOR_SLOTS.map((x) => ({
      id: x.id,
      label: x.label,
      primary: x.id === 'tutor-1',
    }));
  } else {
    s.find.adminPreviewTutorRegions = undefined;
  }
  if (s.mode === 'tutor') s.find.tutorRegionIndex = s.tutorSlotIndex;
  if (s.mode === 'parent') {
    s.find.adminPreviewActiveRegion = ADMIN_HOME_PREVIEW_STUDENT_REGION.label;
    s.find.activeRegionLabel = ADMIN_HOME_PREVIEW_STUDENT_REGION.label;
  }
  if (s.mode === 'guest') {
    // guest 뷰포트는 exposure 라벨을 직접 쓰지만, parent식 find가 열리면 학생 seed 우선
    s.find.adminPreviewActiveRegion = active.label;
  }
}

/** @returns {AdminHomePreviewState} */
export function getAdminHomePreviewState() {
  return load();
}

/** 실사용자 previewState / localStorage hope 와 무관한지 검사용 */
export function isAdminHomePreviewStoreIsolated() {
  return ADMIN_HOME_PREVIEW_STORAGE_KEY.startsWith('study114.adminHomePreview');
}

/**
 * @param {Partial<AdminHomePreviewState>} patch
 */
export function patchAdminHomePreviewState(patch) {
  const s = load();
  Object.assign(s, patch);
  if (patch.mode) {
    resetFindState(s.find);
  }
  syncFindRegionLabel(s);
  persist();
  return s;
}

/** @param {AdminHomePreviewMode} mode */
export function setAdminHomePreviewMode(mode) {
  if (!ADMIN_HOME_PREVIEW_MODE_META[mode]) return getAdminHomePreviewState();
  return patchAdminHomePreviewState({ mode });
}

/** @param {number} index */
export function setAdminHomePreviewStudyRoomSlot(index) {
  const s = load();
  const i = clampIndex(index, ADMIN_HOME_PREVIEW_STUDY_ROOM_SLOTS.length);
  if (s.mode === 'guest') return patchAdminHomePreviewState({ guestRoomSlotIndex: i });
  return patchAdminHomePreviewState({ studyRoomSlotIndex: i });
}

/** @param {number} index */
export function setAdminHomePreviewTutorSlot(index) {
  const s = load();
  const i = clampIndex(index, ADMIN_HOME_PREVIEW_TUTOR_SLOTS.length);
  if (s.mode === 'guest') return patchAdminHomePreviewState({ guestTutorSlotIndex: i });
  return patchAdminHomePreviewState({ tutorSlotIndex: i });
}

/** @param {AdminHomePreviewState} [s] */
export function getActiveRegionSlot(s = load()) {
  if (s.mode === 'parent') return ADMIN_HOME_PREVIEW_STUDENT_REGION;
  if (s.mode === 'tutor') {
    return ADMIN_HOME_PREVIEW_TUTOR_SLOTS[s.tutorSlotIndex] || ADMIN_HOME_PREVIEW_TUTOR_SLOTS[0];
  }
  if (s.mode === 'study_room') {
    return ADMIN_HOME_PREVIEW_STUDY_ROOM_SLOTS[s.studyRoomSlotIndex] || ADMIN_HOME_PREVIEW_STUDY_ROOM_SLOTS[0];
  }
  // guest: 공부방 섹션 활성 슬롯이 기본 표시 (과외는 별도 표시)
  return ADMIN_HOME_PREVIEW_STUDY_ROOM_SLOTS[s.guestRoomSlotIndex] || ADMIN_HOME_PREVIEW_STUDY_ROOM_SLOTS[0];
}

/** @param {AdminHomePreviewState} [s] */
export function getGuestTutorActiveSlot(s = load()) {
  return ADMIN_HOME_PREVIEW_TUTOR_SLOTS[s.guestTutorSlotIndex] || ADMIN_HOME_PREVIEW_TUTOR_SLOTS[0];
}

export function getAdminHomePreviewFindState() {
  const s = load();
  syncFindRegionLabel(s);
  return s.find;
}

export function resetAdminHomePreviewFind() {
  const s = load();
  resetFindState(s.find);
  syncFindRegionLabel(s);
  return s.find;
}
