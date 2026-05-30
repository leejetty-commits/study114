/** @typedef {'guest' | 'parent' | 'study_room' | 'tutor'} HomeRole */
/** @typedef {'study_room' | 'tutor'} ParentTab */

/** @type {{ parentTab: ParentTab, regionKey: 'complex' | 'dong' }} */
export const previewState = {
  parentTab: 'study_room',
  regionKey: 'complex',
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

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentScreen() {
  const hash = window.location.hash.slice(1) || '/guest';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  return ROUTES[path] || 'guest';
}
