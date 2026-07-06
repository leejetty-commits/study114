import { getAdminPath } from '../state.js';
import { normalizeAdminPath } from './router.js';
import { renderAdminShell, bindAdminShellEvents } from './shell.js';
import { renderA28Screen, bindA28ScreenEvents } from './a28-screens.js';
import { canAccessAdminPath, renderAdminAccessGate } from './admin-guard.js';

export function renderAdmin() {
  const path = getAdminPath();
  const normalized = normalizeAdminPath(path) || '/admin';
  const bodyHtml = canAccessAdminPath(normalized) ? renderA28Screen(path) : renderAdminAccessGate(normalized);
  return renderAdminShell(path, bodyHtml);
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindAdminEvents(root, rerender) {
  const path = getAdminPath();
  bindAdminShellEvents(root, rerender);
  bindA28ScreenEvents(root, path, rerender);
}

export { getDefaultAdminPath } from './router.js';
