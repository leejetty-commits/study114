import { GUIDE_NAV_ITEMS } from './copy.js';

export const GUIDE_LEGACY_HOME_PATHS = ['/support/guide', '/support/guide/'];
export const GUIDE_LEGACY_SAFETY_PATHS = ['/support/safe', '/support/safe/'];

/** 과거 주소 → 공식 주소. 새 별칭은 늘리지 않는다. */
export const GUIDE_PATH_ALIASES = {
  '/guide/getting-started': '/guide/start',
  '/guide/getting-started/': '/guide/start',
  '/guide/registration': '/guide/register',
  '/guide/registration/': '/guide/register',
  '/guide/saved-contact': '/guide/compare',
  '/guide/saved-contact/': '/guide/compare',
  '/guide/safety': '/guide/safe',
  '/guide/safety/': '/guide/safe',
  '/support/guide': '/guide',
  '/support/guide/': '/guide',
  '/support/safe': '/guide/safe',
  '/support/safe/': '/guide/safe',
};

export function normalizeGuidePath(hashPath) {
  const raw = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  const p = raw.split('?')[0];
  if (GUIDE_PATH_ALIASES[p]) return GUIDE_PATH_ALIASES[p];
  if (p === '/guide' || p === '/guide/') return '/guide';
  if (p === '/support/guide' || p === '/support/guide/') return '/guide';
  if (p === '/support/safe' || p === '/support/safe/') return '/guide/safe';
  const item = GUIDE_NAV_ITEMS.find((nav) => nav.path === p);
  return item ? item.path : null;
}

export function getDefaultGuidePath() {
  return '/guide';
}

export function getGuidePageId(path) {
  const normalized = normalizeGuidePath(path) || path;
  if (normalized === '/guide' || normalized === '/guide/') return 'home';
  const item = GUIDE_NAV_ITEMS.find((nav) => nav.path === normalized);
  return item?.id || 'home';
}
