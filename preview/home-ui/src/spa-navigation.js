/**
 * home-ui ↔ 검색/등록 SPA 이동.
 * 공부방찾기는 /search SPA라 해시만 바꾸면 마이샵·후기함·가이드가 안 열린다.
 */

import { navigate } from './state.js';
import { HOME_UI_BASE } from '../../shared/preview-links.js';
import { setPendingRoute } from '../../shared/pending-route.js';

/**
 * 현재 창이 home-ui 셸인지.
 * 같은 origin의 `/search` `/auth` `/register` 는 다른 Vite 앱이다.
 * (HOME_UI_BASE pathname이 `/` 이면 startsWith('/') 만으로 검색 SPA를 홈으로 오인한다.)
 */
export function isHomeSpaHost() {
  try {
    const home = new URL(HOME_UI_BASE, window.location.href);
    if (window.location.origin !== home.origin) return false;
    const here = window.location.pathname.replace(/\/$/, '') || '/';
    if (
      here === '/search' ||
      here.startsWith('/search/') ||
      here === '/auth' ||
      here.startsWith('/auth/') ||
      here.startsWith('/register/')
    ) {
      return false;
    }
    const homePath = home.pathname.replace(/\/$/, '') || '/';
    if (homePath === '/') return true;
    return here === homePath || here.startsWith(`${homePath}/`);
  } catch {
    return false;
  }
}

/**
 * home-ui 해시 경로로 이동. 검색 SPA에서는 홈 앱으로 떠난다.
 * @param {string} hashPath e.g. `/myshop/study-room/1?from=search`
 */
export function goHomeHashPath(hashPath) {
  const path = String(hashPath || '').replace(/^#/, '');
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  if (!withSlash || withSlash === '/') return;
  setPendingRoute(withSlash);
  if (isHomeSpaHost()) {
    navigate(withSlash);
    return;
  }
  const base = String(HOME_UI_BASE || '').replace(/\/$/, '');
  window.location.assign(`${base}/#${withSlash}`);
}
