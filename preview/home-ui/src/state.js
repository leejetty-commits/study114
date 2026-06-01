/** @typedef {'guest' | 'parent' | 'study_room' | 'tutor'} HomeRole */
/** @typedef {'study_room' | 'tutor'} ParentTab */

/** @type {{ parentTab: ParentTab, regionKey: 'complex' | 'dong', guestListPages: Record<string, number> }} */
export const previewState = {
  parentTab: 'study_room',
  regionKey: 'dong',
  guestListPages: {
    study_room: 1,
    tutor: 1,
    student: 1,
  },
};

export const ROUTES = {
  '/guest': 'guest',
  '/parent': 'parent',
  '/study-room': 'studyRoom',
  '/tutor': 'tutor',
};

export const SCREEN_META = {
  guest: { label: '비회원', role: 'guest' },
  parent: { label: '학부모', role: 'parent' },
  studyRoom: { label: '공부방', role: 'study_room' },
  tutor: { label: '과외쌤', role: 'tutor' },
};

export function setParentTab(tab) {
  previewState.parentTab = tab;
}

export function setRegionKey(key) {
  previewState.regionKey = key;
}

/** @param {'study_room'|'tutor'|'student'} listId */
export function setGuestListPage(listId, page) {
  previewState.guestListPages[listId] = Math.max(1, page);
}

/** @param {'study_room'|'tutor'|'student'} listId */
export function getGuestListPage(listId) {
  return previewState.guestListPages[listId] || 1;
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentScreen() {
  const hash = window.location.hash.slice(1) || '/guest';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  return ROUTES[path] || 'guest';
}
