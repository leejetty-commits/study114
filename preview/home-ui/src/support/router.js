/** 고객센터 hash 경로 */

/** @typedef {'P17-01'} SupportScreenId */

/** 레거시: 약관이 고객센터 하위에 있던 시절 → 약관·정책 메뉴로 이관 */
export const SUPPORT_TERMS_LEGACY_PATH = '/support/terms';
export const SUPPORT_TERMS_REDIRECT = '/support/policies/terms';

/** 17c admin · 사용자 티켓 목록 */
export const SUPPORT_ADMIN_PATHS = ['/support/admin', '/support/admin/notices', '/support/admin/tickets'];
export const SUPPORT_CONTACT_PATHS = ['/support/contact/tickets'];

const POLICY_SLUGS = ['terms', 'privacy', 'platform', 'trust', 'safety', 'student-privacy', 'reporting', 'account-contact'];
const LIBRARY_SECTIONS = ['templates', 'guides'];

/** @param {string} hashPath */
export function normalizeSupportPath(hashPath) {
  const raw = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  const p = raw.split('?')[0];
  if (p === '/support' || p === '/support/') return '/support/notice';
  if (p === SUPPORT_TERMS_LEGACY_PATH || p === `${SUPPORT_TERMS_LEGACY_PATH}/`) return null;
  if (['faq', 'notice', 'contact'].some((s) => p === `/support/${s}`)) return p;
  if (p === '/support/contact/tickets') return p;
  if (p === '/support/admin' || p === '/support/admin/') return '/support/admin';
  if (p === '/support/admin/notices' || p === '/support/admin/tickets') return p;
  if (p === '/support/policies' || p === '/support/policies/') return '/support/policies';
  const policyMatch = p.match(/^\/support\/policies\/([a-z0-9-]+)$/);
  if (policyMatch && POLICY_SLUGS.includes(policyMatch[1])) return p;
  if (p === '/support/library' || p === '/support/library/') return '/support/library';
  const libMatch = p.match(/^\/support\/library\/([a-z0-9-]+)$/);
  if (libMatch && LIBRARY_SECTIONS.includes(libMatch[1])) return p;
  return null;
}

/** @param {string} path */
export function isAdminSupportPath(path) {
  return path === '/support/admin' || path.startsWith('/support/admin/');
}

export function getDefaultSupportPath() {
  return '/support/notice';
}

/** @param {string} path */
export function getScreenIdForPath(path) {
  return 'P17-01';
}

/** @param {string} path @returns {string | null} */
export function getSectionFromPath(path) {
  const m = path.match(/^\/support\/(faq|notice|contact)$/);
  return m ? m[1] : null;
}

/** @param {string} path */
export function getSupportPolicySlug(path) {
  if (path === '/support/policies' || path === '/support/policies/') return 'terms';
  const m = path.match(/^\/support\/policies\/([a-z0-9-]+)$/);
  return m ? m[1] : 'terms';
}

/** @param {string} path */
export function getSupportLibrarySection(path) {
  if (path === '/support/library' || path === '/support/library/') return 'library';
  const m = path.match(/^\/support\/library\/([a-z0-9-]+)$/);
  return m?.[1] || 'library';
}

/** @param {SupportScreenId} screenId */
export function screenTitle(screenId) {
  const map = {
    'P17-01': '고객센터',
  };
  return map[screenId] || '고객센터';
}
