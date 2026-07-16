import { getPlansPath } from '../state.js';
import { renderPlansShell, bindPlansShellEvents } from './shell.js';
import { renderPlansScreen, bindPlansScreenEvents } from './screens.js';

export function renderPlans() {
  const path = getPlansPath();
  const body = renderPlansScreen(path);
  return renderPlansShell(path, body);
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindPlansEvents(root, rerender) {
  bindPlansShellEvents(root, rerender);
  bindPlansScreenEvents(root, rerender);
}

export { getDefaultPlansPath } from './router.js';
