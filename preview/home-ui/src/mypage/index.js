import { getMypagePath } from '../state.js';
import { renderMypageShell, bindMypageShellEvents } from './shell.js';
import { renderMypageScreen, bindMypageScreenEvents } from './screens.js';
import { ensureRecentDemo } from './recent-store.js';

/** @param {() => void} rerender */
export function renderMypage() {
  ensureRecentDemo();
  const path = getMypagePath();
  const body = renderMypageScreen(path);
  return renderMypageShell(path, body);
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindMypageEvents(root, rerender) {
  bindMypageShellEvents(root, rerender);
  bindMypageScreenEvents(root, rerender);
}
