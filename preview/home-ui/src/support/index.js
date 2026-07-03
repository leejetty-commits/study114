import { getSupportPath } from '../state.js';
import { renderSupportShell, bindSupportShellEvents } from './shell.js';
import { renderSupportScreen, bindSupportScreenEvents } from './screens.js';

export function renderSupport() {
  const path = getSupportPath();
  const body = renderSupportScreen(path);
  return renderSupportShell(path, body);
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindSupportEvents(root, rerender) {
  const path = getSupportPath();
  bindSupportShellEvents(root, rerender);
  bindSupportScreenEvents(root, path);
}

export { getDefaultSupportPath } from './router.js';
