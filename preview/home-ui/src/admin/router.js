/**
 * 관리자 해시 라우트 (#/admin/*)
 *
 * 참고(코드용): A28 경로 · 구 `#/admin/notices`·`#/admin/settings`는 서브로 리다이렉트
 */

import { flattenAdminNav } from './a28-copy.js';
import { normalizeAdminPath } from './route-match.js';

export {
  getAdminLegacyRedirect,
  normalizeAdminPath,
  getDefaultAdminPath,
  getSettingsSection,
  getNoticesSection,
  getMarketSection,
  getNotifySection,
  getAddonsSection,
} from './route-match.js';

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
  if (n === '/admin/settlement') {
    return {
      id: 'settlement',
      menuId: 'settlement',
      label: '보고서',
      path: '/admin/settlement',
      help: '하루·한 주·한 달 운영 보고서를 보고 인쇄합니다.',
      screenId: 'A28-162',
    };
  }
  return flattenAdminNav().find((item) => item.path === n) || flattenAdminNav().find((item) => item.path === '/admin');
}

