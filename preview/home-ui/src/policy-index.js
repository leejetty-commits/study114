import { getPolicyPath } from './state.js';
import { renderPolicyShell, bindPolicyShellEvents } from './policy-shell.js';
import { renderPolicyScreen, bindPolicyScreenEvents } from './policy-screens.js';
import { getPolicyPage } from './policy-copy.js';
import { getPolicySlug } from './policy-router.js';

export function renderPolicy() {
  const path = getPolicyPath();
  const slug = getPolicySlug(path);
  const page = getPolicyPage(slug);
  return renderPolicyShell(page?.title || '이용약관', path, renderPolicyScreen(path));
}

export function bindPolicyEvents(root, rerender) {
  bindPolicyShellEvents(root, rerender);
  bindPolicyScreenEvents(root, rerender);
}

export { getDefaultPolicyPath } from './policy-router.js';
