/**
 * 관리자 해시 라우트 (#/admin/*)
 *
 * 참고(코드용): A28 경로 · 구 `#/admin/notices`·`#/admin/settings`는 서브로 리다이렉트
 */

import { flattenAdminNav } from './a28-copy.js';

/** @type {Record<string, string>} */
const LEGACY_REDIRECTS = {
  '/admin/notices': '/admin/notices/channels',
  '/admin/settings': '/admin/settings/basic',
};

function allAdminPaths() {
  const fromNav = flattenAdminNav()
    .map((item) => item.path)
    .filter(Boolean);
  return ['/admin', ...fromNav];
}

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
  if (allAdminPaths().includes(p)) return p;
  return null;
}

export function getDefaultAdminPath() {
  return '/admin';
}

/** 개발 참고용 이정표 ID — UI에 표시하지 말 것 */
export function getAdminScreenId(path) {
  const leaf = findAdminNavLeaf(path);
  return leaf?.screenId || 'A28-01';
}

/** 권한 검사용 menuId */
export function getAdminMenuId(path) {
  const leaf = findAdminNavLeaf(path);
  return leaf?.menuId || leaf?.id || 'hub';
}

/** @param {string} path */
export function findAdminNavLeaf(path) {
  const n = normalizeAdminPath(path) || '/admin';
  return flattenAdminNav().find((item) => item.path === n) || flattenAdminNav().find((item) => item.path === '/admin');
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
