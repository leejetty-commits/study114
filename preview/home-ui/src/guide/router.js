import { GUIDE_NAV_ITEMS } from './copy.js';

export const GUIDE_LEGACY_HOME_PATHS = ['/support/guide', '/support/guide/'];
export const GUIDE_LEGACY_SAFETY_PATHS = ['/support/safe', '/support/safe/'];

export function normalizeGuidePath(hashPath) {
  const raw = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  const p = raw.split('?')[0];
  if (p === '/guide' || p === '/guide/') return '/guide';
  if (p === '/support/guide' || p === '/support/guide/') return '/guide';
  if (p === '/support/safe' || p === '/support/safe/') return '/guide/safety';
  const item = GUIDE_NAV_ITEMS.find((nav) => nav.path === p);
  return item ? item.path : null;
}

export function getDefaultGuidePath() {
  return '/guide';
}

export function getGuidePageId(path) {
  if (path === '/guide' || path === '/guide/') return 'home';
  const item = GUIDE_NAV_ITEMS.find((nav) => nav.path === path);
  return item?.id || 'home';
}

