import { getGuidePath } from '../state.js';
import { renderGuideShell, bindGuideShellEvents } from './shell.js';
import { renderGuideScreen, bindGuideScreenEvents } from './screens.js';

export function renderGuide() {
  const path = getGuidePath();
  const body = renderGuideScreen(path);
  return renderGuideShell(path, body);
}

export function bindGuideEvents(root, rerender) {
  bindGuideShellEvents(root, rerender);
  bindGuideScreenEvents(root);
}

export { getDefaultGuidePath } from './router.js';

