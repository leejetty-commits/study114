/** 17장 P17-xx — hash 경로 (부록 A, 미확정) */

/** @typedef {'P17-01'|'P17-02'|'P17-03'} SupportScreenId */

/** P17-01 내부 섹션 (P17-04~07) */
export const SUPPORT_SECTIONS = ['guide', 'faq', 'notice', 'contact', 'terms'];

/** 17c admin · 사용자 티켓 목록 */
export const SUPPORT_ADMIN_PATHS = ['/support/admin', '/support/admin/notices', '/support/admin/tickets'];
export const SUPPORT_CONTACT_PATHS = ['/support/contact/tickets'];

/** @param {string} hashPath */
export function normalizeSupportPath(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (p === '/support' || p === '/support/') return '/support';
  if (SUPPORT_SECTIONS.some((s) => p === `/support/${s}`)) return p;
  if (p === '/support/contact/tickets') return p;
  if (p === '/support/admin' || p === '/support/admin/') return '/support/admin';
  if (p === '/support/admin/notices' || p === '/support/admin/tickets') return p;
  if (p === '/support/safe' || p === '/support/safe/') return '/support/safe';
  if (/^\/support\/safe\/[a-z0-9-]+$/.test(p)) return p;
  return null;
}

/** @param {string} path */
export function isAdminSupportPath(path) {
  return path === '/support/admin' || path.startsWith('/support/admin/');
}

export function getDefaultSupportPath() {
  return '/support';
}

/** @param {string} path */
export function getScreenIdForPath(path) {
  if (path.startsWith('/support/safe/') && path !== '/support/safe/') return 'P17-03';
  if (path === '/support/safe') return 'P17-02';
  return 'P17-01';
}

/** @param {string} path @returns {string | null} */
export function getSectionFromPath(path) {
  const m = path.match(/^\/support\/(guide|faq|notice|contact|terms)$/);
  return m ? m[1] : null;
}

/** @param {string} path */
export function parseGuideSlug(path) {
  const m = path.match(/^\/support\/safe\/([a-z0-9-]+)$/);
  return m ? m[1] : null;
}

/** @param {SupportScreenId} screenId */
export function screenTitle(screenId) {
  const map = {
    'P17-01': '고객센터',
    'P17-02': '안전과외 가이드',
    'P17-03': '가이드',
  };
  return map[screenId] || '고객센터';
}
