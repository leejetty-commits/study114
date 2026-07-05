import { getSupportPath } from '../state.js';
import { isAdminSupportPath } from './router.js';
import { renderSupportShell, bindSupportShellEvents } from './shell.js';
import { renderSupportScreen, bindSupportScreenEvents } from './screens.js';
import { bindAdminScreenEvents } from './admin-screens.js';

export function renderSupport() {
  const path = getSupportPath();
  const body = renderSupportScreen(path);
  return renderSupportShell(path, body);
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindSupportEvents(root, rerender) {
  const path = getSupportPath();
  bindSupportShellEvents(root, rerender);
  bindSupportScreenEvents(root, path, rerender);
  if (isAdminSupportPath(path)) {
    bindAdminScreenEvents(root, path, rerender);
  }
}

export { getDefaultSupportPath } from './router.js';
