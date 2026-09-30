import { getPolicyPath } from './state.js';
import { renderPolicyShell, bindPolicyShellEvents } from './policy-shell.js';
import { renderPolicyScreen, bindPolicyScreenEvents } from './policy-screens.js';
import { getPolicyPage } from './policy-copy.js';
import { getPolicySlug } from './policy-router.js';
import { peekPublicSettings } from './admin/site-settings-store.js';

export function renderPolicy() {
  const path = getPolicyPath();
  const slug = getPolicySlug(path);
  const page = getPolicyPage(slug);
  const pub = peekPublicSettings();
  const saved = slug === 'terms' ? pub?.terms : slug === 'privacy' ? pub?.privacy : null;
  const title = (saved?.body && saved.title) || page?.title || '이용약관';
  return renderPolicyShell(title, path, renderPolicyScreen(path));
}

export function bindPolicyEvents(root, rerender) {
  bindPolicyShellEvents(root, rerender);
  bindPolicyScreenEvents(root, rerender);
}

export { getDefaultPolicyPath } from './policy-router.js';
