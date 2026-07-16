/**
 * home-ui nav — shared site-nav-config 재노출 + 레거시 export
 */
export {
  UTIL_MENU,
  GNB_MAIN,
  GNB_VISIBILITY,
  GNB_MUTED_TITLE,
  navRoleFromAuthUser,
  roleHomeHashPath,
  AUTH_UI_BASE,
  HOME_UI_BASE,
  STUDY_ROOM_REGISTER_URL,
  TUTOR_REGISTER_URL,
  searchUiUrl,
  supportUiUrl,
  resolveGnbLink,
  isGnbItemVisible,
  getGnbVisibility,
  canAccessPlansHub,
  canAccessRegisterRoom,
  canAccessRegisterTutor,
  visibleSearchTabsForRole,
} from '../../shared/site-nav-config.js';

import { searchUiUrl } from '../../shared/site-nav-config.js';
import { MENU_EXCLUDED_PHASE1 } from './policy.js';

/** 프리뷰: 검색 UI (13장) — 공부방 탭 기본 */
export const SEARCH_UI_URL = searchUiUrl('room');

export function isMenuExcluded(id) {
  return MENU_EXCLUDED_PHASE1.includes(id);
}
