import { bindLayoutEvents } from './layout.js';

/** 비로그인 공개. 옛 #/about 은 정적 /info/ 로 보낸다. */
export function renderAbout() {
  window.location.replace('/info/');
  return '';
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindAboutEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
}
