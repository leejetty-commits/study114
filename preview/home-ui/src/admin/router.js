/** 28장 — A28 내부 운영 콘솔 라우트 (#/admin/* · P17-admin과 분리) */

const A28_PATHS = [
  '/admin',
  '/admin/reports',
  '/admin/notices',
  '/admin/tickets',
  '/admin/submission-docs',
  '/admin/exposure',
  '/admin/logs',
];

/** @param {string} hashPath */
export function normalizeAdminPath(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (p === '/admin' || p === '/admin/') return '/admin';
  if (A28_PATHS.includes(p)) return p;
  return null;
}

export function getDefaultAdminPath() {
  return '/admin';
}

/** @param {string} path */
export function getAdminScreenId(path) {
  const map = {
    '/admin': 'A28-01',
    '/admin/reports': 'A28-04',
    '/admin/notices': 'A28-05',
    '/admin/tickets': 'A28-04b',
    '/admin/submission-docs': 'A28-06',
    '/admin/exposure': 'A28-07',
    '/admin/logs': 'A28-08',
  };
  return map[normalizeAdminPath(path) || '/admin'] || 'A28-01';
}
