/**
 * 관리자 주소 판별만. 메뉴 문구(a28-copy)는 콘솔 조각에서 받는다.
 * 허용 경로는 A28_MENU leaf + /admin/settlement 와 같다.
 */

/** @type {Record<string, string>} */
const LEGACY_REDIRECTS = {
  '/admin/notices': '/admin/notices/channels',
  '/admin/settings': '/admin/settings/basic',
  '/admin/market/reviews': '/admin/market/overview',
};

const ADMIN_ROUTE_PATHS = [
  '/admin',
  '/admin/stats',
  '/admin/settlement',
  '/admin/settings/basic',
  '/admin/settings/join',
  '/admin/settings/notify',
  '/admin/settings/popups',
  '/admin/settings/legal',
  '/admin/permissions',
  '/admin/members',
  '/admin/registrations',
  '/admin/members/withdraw-reasons',
  '/admin/notices/channels',
  '/admin/notices/rails',
  '/admin/notices/posts',
  '/admin/notices/faq',
  '/admin/notices/guide',
  '/admin/promo',
  '/admin/market/overview',
  '/admin/market/listings',
  '/admin/commerce',
  '/admin/exposure',
  '/admin/market/stats',
  '/admin/market/incomplete',
  '/admin/reports',
  '/admin/tickets',
  '/admin/addons',
  '/admin/addons/pg',
  '/admin/addons/sms',
  '/admin/addons/identity',
  '/admin/notify/member-mail',
  '/admin/notify/settings',
  '/admin/notify/sync',
  '/admin/notify/templates',
  '/admin/notify/phones',
  '/admin/notify/send',
  '/admin/notify/logs',
  '/admin/notify/logs-phone',
  '/admin/logs',
];

/** @param {string} hashPath */
export function getAdminLegacyRedirect(hashPath) {
  const raw = hashPath.split('?')[0];
  const p = raw.startsWith('/') ? raw : `/${raw}`;
  return LEGACY_REDIRECTS[p] || null;
}

/** @param {string} hashPath */
export function normalizeAdminPath(hashPath) {
  const raw = hashPath.split('?')[0];
  const p = raw.startsWith('/') ? raw : `/${raw}`;
  if (p === '/admin' || p === '/admin/') return '/admin';
  const redirected = LEGACY_REDIRECTS[p];
  if (redirected) return redirected;
  if (ADMIN_ROUTE_PATHS.includes(p)) return p;
  return null;
}

export function getDefaultAdminPath() {
  return '/admin';
}

/** settings 섹션 키: basic|join|notify|popups|legal */
export function getSettingsSection(path) {
  const n = normalizeAdminPath(path) || '';
  const m = n.match(/^\/admin\/settings\/(.+)$/);
  return m?.[1] || 'basic';
}

/** notices 섹션: channels|rails|posts|faq|guide */
export function getNoticesSection(path) {
  const n = normalizeAdminPath(path) || '';
  const m = n.match(/^\/admin\/notices\/(.+)$/);
  return m?.[1] || 'channels';
}

/** market 섹션 */
export function getMarketSection(path) {
  const n = normalizeAdminPath(path) || '';
  const m = n.match(/^\/admin\/market\/(.+)$/);
  return m?.[1] || 'overview';
}

/** notify 섹션 */
export function getNotifySection(path) {
  const n = normalizeAdminPath(path) || '';
  const m = n.match(/^\/admin\/notify\/(.+)$/);
  return m?.[1] || 'settings';
}

/** addons 섹션: home|pg|sms|identity */
export function getAddonsSection(path) {
  const n = normalizeAdminPath(path) || '';
  if (n === '/admin/addons') return 'home';
  const m = n.match(/^\/admin\/addons\/(.+)$/);
  return m?.[1] || 'home';
}
