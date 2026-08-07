/** @typedef {'guest' | 'parent' | 'study_room' | 'tutor'} HomeRole */
/** @typedef {'study_room' | 'tutor' | 'student'} ParentTab */
/** @typedef {'study_room' | 'tutor' | 'student'} ProviderHomeTab */
/** @typedef {'free' | 'paid'} ProviderSubscription */

import { getDefaultMypagePath, normalizeMypagePath, MYPAGE_LEGACY_ALIASES } from './mypage/router.js';
import { getDefaultMessagesPath, normalizeMessagesPath, isMessagesDetailPath } from './messages/router.js';
import {
  getDefaultGuidePath,
  normalizeGuidePath,
  GUIDE_LEGACY_HOME_PATHS,
  GUIDE_LEGACY_SAFETY_PATHS,
} from './guide/router.js';
import {
  getDefaultSupportPath,
  normalizeSupportPath,
  SUPPORT_TERMS_LEGACY_PATH,
  SUPPORT_TERMS_REDIRECT,
} from './support/router.js';
import { getDefaultPolicyPath, normalizePolicyPath } from './policy-router.js';
import { getDefaultLibraryPath, normalizeLibraryPath } from './library/library-router.js';
import { getDefaultAdminPath, normalizeAdminPath, getAdminLegacyRedirect } from './admin/router.js';
import {
  getDefaultPlansPath,
  normalizePlansPath,
  PLANS_REDIRECTS,
} from './plans/router.js';
import { getDefaultCommunityPath, normalizeCommunityPath, normalizeConcernPath } from './concern/router.js';
import { getDefaultPromoPath, normalizePromoPath } from './promo/router.js';
import { createFindState, resetFindState } from './find-state.js';
import { setPendingRoute } from '../../shared/pending-route.js';

const ACTIVE_ROLE_KEY = 'study114-preview-active-role';
const GUIDE_CTX_KEY = 'study114-preview-guide-context';
const SUPPORT_CTX_KEY = 'study114-preview-support-context';

/** @type {{ parentTab: ParentTab, tutorTab: ProviderHomeTab, studyRoomTab: ProviderHomeTab, regionKey: 'complex' | 'dong', guestListPages: Record<string, number>, providerSubscription: ProviderSubscription, parentFind: import('@search-ui/search-find-surface.js').FindSurfaceState & { searchRows: object[], searchItems: object[] }, tutorFind: import('@search-ui/search-find-surface.js').FindSurfaceState & { searchRows: object[], searchItems: object[] }, studyRoomFind: import('@search-ui/search-find-surface.js').FindSurfaceState & { searchRows: object[], searchItems: object[] } }} */
export const previewState = {
  parentTab: 'study_room',
  tutorTab: 'tutor',
  studyRoomTab: 'study_room',
  regionKey: 'dong',
  guestListPages: {
    study_room: 1,
    tutor: 1,
    student: 1,
    pick_study_room: 1,
    pick_tutor: 1,
    /** 과외쌤 Prime — 시 단위 풀 · 3슬롯 페이지 */
    prime_tutor: 1,
    search_prime_tutor: 1,
    search_pick_study_room: 1,
    search_pick_tutor: 1,
    search_basic_study_room: 1,
    search_basic_tutor: 1,
  },
  providerSubscription: 'free',
  parentFind: createFindState(),
  tutorFind: createFindState(),
  studyRoomFind: createFindState(),
};

export const ROUTES = {
  '/guest': 'guest',
  '/parent': 'parent',
  '/study-room': 'studyRoom',
  '/tutor': 'tutor',
};

export const SCREEN_META = {
  guest: { label: '비회원', role: 'guest' },
  parent: { label: '학부모', role: 'parent' },
  studyRoom: { label: '공부방', role: 'study_room' },
  tutor: { label: '과외쌤', role: 'tutor' },
  mypage: { label: '마이페이지', role: 'parent' },
  messages: { label: '쪽지함', role: 'parent' },
  guide: { label: '이용안내', role: 'guest' },
  support: { label: '고객센터', role: 'guest' },
  policy: { label: '정책', role: 'guest' },
  library: { label: '자료실', role: 'guest' },
  admin: { label: 'A28', role: 'guest' },
  plans: { label: '유료상품', role: 'guest' },
};

export function setParentTab(tab) {
  previewState.parentTab = tab;
}

export function setTutorTab(tab) {
  previewState.tutorTab = tab;
}

export function setStudyRoomTab(tab) {
  previewState.studyRoomTab = tab;
}

/** 학부모 홈 — 탭 전환 시 검색 상태 초기화 */
export function resetParentFind() {
  resetFindState(previewState.parentFind);
}

export function resetTutorFind() {
  resetFindState(previewState.tutorFind);
}

export function resetStudyRoomFind() {
  resetFindState(previewState.studyRoomFind);
}

export function setRegionKey(key) {
  previewState.regionKey = key;
}

/** @param {'study_room'|'tutor'|'student'} listId */
export function setGuestListPage(listId, page) {
  previewState.guestListPages[listId] = Math.max(1, page);
}

/** @param {'study_room'|'tutor'|'student'} listId */
export function getGuestListPage(listId) {
  return previewState.guestListPages[listId] || 1;
}

export function getNavRole() {
  if (isPlansRoute()) {
    // plans 헤더 GNB는 layout.resolveHeaderGnbRole이 세션을 우선한다.
    // 여기서 stale ACTIVE_ROLE(parent 등)을 쓰면 비로그인 GNB가 줄어든다.
    return 'guest';
  }
  if (isMypageRoute() || isMessagesRoute()) {
    return getActiveRole();
  }
  if (isGuideRoute()) {
    return getGuideContextRole();
  }
  if (isSupportRoute()) {
    return getSupportContextRole();
  }
  // 커뮤니티·홍보는 역할 홈이 아님 — SCREEN_META에 없어 guest로 떨어지면
  // 셸/레일 맥락이 깨지고 GNB·동선이 흔들린다. 저장된 활성 역할만 쓰고, 없으면 guest.
  if (isCommunityRoute() || isPromoRoute()) {
    const stored = sessionStorage.getItem(ACTIVE_ROLE_KEY);
    if (stored === 'parent' || stored === 'study_room' || stored === 'tutor') return stored;
    return 'guest';
  }
  const screen = getCurrentScreen();
  const role = SCREEN_META[screen]?.role ?? 'guest';
  if (role !== 'guest') setActiveRole(role);
  return role;
}

export function navigate(path) {
  const normalized = String(path || '/guest');
  const withSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  // 동일 hash 재클릭 시 hashchange가 안 뜨는 브라우저 대비
  if (window.location.hash === `#${withSlash}` || window.location.hash === withSlash) {
    window.dispatchEvent(new Event('hashchange'));
    return;
  }
  window.location.hash = withSlash;
}

export function isMessagesRoute() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  return path === '/messages' || (path.startsWith('/messages/') && !path.startsWith('/mypage/'));
}

export function isSupportRoute() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  return path === '/support' || path.startsWith('/support/');
}

export function isGuideRoute() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  return path === '/guide' || path.startsWith('/guide/');
}

export function isCommunityRoute() {
  const hash = window.location.hash.slice(1) || '';
  const path = (hash.startsWith('/') ? hash : `/${hash}`).split('?')[0];
  return path === '/community' || path.startsWith('/community/') || path === '/concern' || path.startsWith('/concern/');
}

/** @deprecated */
export const isConcernRoute = isCommunityRoute;

export function isPromoRoute() {
  const hash = window.location.hash.slice(1) || '';
  const path = (hash.startsWith('/') ? hash : `/${hash}`).split('?')[0];
  return path === '/promo' || path.startsWith('/promo/');
}

export function isPolicyRoute() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  return path === '/policy' || path.startsWith('/policy/');
}

export function isLibraryRoute() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  return path === '/library' || path.startsWith('/library/');
}

export function isAdminRoute() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  return path === '/admin' || path.startsWith('/admin/');
}

export function isPlansRoute() {
  const hash = window.location.hash.slice(1) || '';
  const path = (hash.startsWith('/') ? hash : `/${hash}`).split('?')[0];
  return path === '/plans' || path.startsWith('/plans/');
}

export function isMypageRoute() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  return path === '/mypage' || path.startsWith('/mypage/');
}

/** @param {HomeRole} role */
export function setActiveRole(role) {
  if (role && role !== 'guest') {
    sessionStorage.setItem(ACTIVE_ROLE_KEY, role);
  }
}

export function getActiveRole() {
  const stored = sessionStorage.getItem(ACTIVE_ROLE_KEY);
  if (stored === 'parent' || stored === 'study_room' || stored === 'tutor') {
    return stored;
  }
  return 'parent';
}

/** @returns {'guest' | 'parent' | 'study_room' | 'tutor'} */
export function getSupportContextRole() {
  const stored = sessionStorage.getItem(SUPPORT_CTX_KEY);
  if (stored === 'guest' || stored === 'parent' || stored === 'study_room' || stored === 'tutor') {
    return stored;
  }
  return 'guest';
}

export function getGuideContextRole() {
  const stored = sessionStorage.getItem(GUIDE_CTX_KEY);
  if (stored === 'guest' || stored === 'parent' || stored === 'study_room' || stored === 'tutor') {
    return stored;
  }
  return 'guest';
}

export function captureGuideContextRole() {
  let role = 'guest';
  if (isMypageRoute() || isMessagesRoute()) {
    role = getActiveRole();
  } else if (!isGuideRoute()) {
    const screen = getCurrentScreen();
    role = SCREEN_META[screen]?.role ?? 'guest';
    if (role !== 'guest') setActiveRole(role);
  } else {
    role = getGuideContextRole();
  }
  sessionStorage.setItem(GUIDE_CTX_KEY, role);
  return role;
}

/** 진입 직전 역할을 고객센터 CTA·헤더에 반영 */
export function captureSupportContextRole() {
  let role = 'guest';
  if (isMypageRoute() || isMessagesRoute()) {
    role = getActiveRole();
  } else if (!isSupportRoute()) {
    const screen = getCurrentScreen();
    role = SCREEN_META[screen]?.role ?? 'guest';
    if (role !== 'guest') setActiveRole(role);
  } else {
    role = getSupportContextRole();
  }
  sessionStorage.setItem(SUPPORT_CTX_KEY, role);
  return role;
}

export function navigateToSupport(path = getDefaultSupportPath()) {
  captureSupportContextRole();
  navigate(path);
}

export function navigateToGuide(path = getDefaultGuidePath()) {
  captureGuideContextRole();
  navigate(path);
}

export function bootstrapMessagesRoute() {
  const { pathname, hash, origin, search } = window.location;

  if (!hash && pathname.startsWith('/messages')) {
    const bare = pathname === '/messages' || pathname === '/messages/';
    const target = bare ? getDefaultMessagesPath() : mapPathnameToMypageMessages(pathname);
    window.location.replace(`${origin}/${search}#${target}`);
    return true;
  }

  if (!hash) return false;

  const hashPath = hash.slice(1);
  const path = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  const normalized = normalizeMessagesPath(path);
  if (path === '/messages' || path === '/messages/' || path.startsWith('/messages/')) {
    window.location.replace(`#${normalized || getDefaultMessagesPath()}`);
    return true;
  }

  return false;
}

/** @param {string} pathname */
function mapPathnameToMypageMessages(pathname) {
  const normalized = normalizeMessagesPath(pathname);
  return normalized || getDefaultMessagesPath();
}

export function bootstrapSupportRoute() {
  const { pathname, hash, origin, search } = window.location;

  if (!hash && pathname.startsWith('/support')) {
    const bare = pathname === '/support' || pathname === '/support/';
    const target = bare ? getDefaultSupportPath() : pathname;
    window.location.replace(`${origin}/${search}#${target}`);
    return true;
  }

  if (!hash) return false;

  const hashPath = hash.slice(1);
  const path = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  // 홈·이용안내 통합 — 구 `/support/guide` → `/support`
  if (path === '/support/guide' || path === '/support/guide/') {
    window.location.replace(`#${getDefaultSupportPath()}`);
    return true;
  }
  if (path === '/support' || path === '/support/') {
    window.location.replace(`#${getDefaultSupportPath()}`);
    return true;
  }

  // 레거시 약관 경로 → 고객센터 약관·정책
  if (path === SUPPORT_TERMS_LEGACY_PATH || path === `${SUPPORT_TERMS_LEGACY_PATH}/`) {
    window.location.replace(`#${SUPPORT_TERMS_REDIRECT}`);
    return true;
  }

  if (path.startsWith('/support/') && !normalizeSupportPath(path)) {
    window.location.replace(`#${getDefaultSupportPath()}`);
    return true;
  }

  return false;
}

export function bootstrapGuideRoute() {
  const { pathname, hash, origin, search } = window.location;

  if (!hash && pathname.startsWith('/guide')) {
    const bare = pathname === '/guide' || pathname === '/guide/';
    const target = bare ? getDefaultGuidePath() : pathname;
    window.location.replace(`${origin}/${search}#${target}`);
    return true;
  }

  if (!hash) return false;

  const hashPath = hash.slice(1);
  const path = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (GUIDE_LEGACY_HOME_PATHS.includes(path)) {
    window.location.replace(`#${getDefaultGuidePath()}`);
    return true;
  }
  if (GUIDE_LEGACY_SAFETY_PATHS.includes(path)) {
    window.location.replace('#/guide/safety');
    return true;
  }
  if (path === '/guide' || path === '/guide/') {
    window.location.replace(`#${getDefaultGuidePath()}`);
    return true;
  }
  if (path.startsWith('/guide/') && !normalizeGuidePath(path)) {
    window.location.replace(`#${getDefaultGuidePath()}`);
    return true;
  }
  return false;
}

export function bootstrapCommunityRoute() {
  const { pathname, hash, origin, search } = window.location;

  if (!hash && pathname.startsWith('/community')) {
    const bare = pathname === '/community' || pathname === '/community/';
    const target = bare ? getDefaultCommunityPath() : pathname;
    setPendingRoute(target);
    window.location.replace(`${origin}/${search}#${target}`);
    return true;
  }
  if (!hash && pathname.startsWith('/concern')) {
    const target = pathname.replace(/^\/concern/, '/community');
    setPendingRoute(target);
    window.location.replace(`${origin}/${search}#${target}`);
    return true;
  }

  if (!hash) return false;

  const hashPath = hash.slice(1);
  const pathWithQuery = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  const path = pathWithQuery.split('?')[0];

  if (path === '/concern' || path.startsWith('/concern/')) {
    const mapped = path.replace(/^\/concern/, '/community');
    window.location.replace(`#${mapped}${pathWithQuery.includes('?') ? pathWithQuery.slice(pathWithQuery.indexOf('?')) : ''}`);
    return true;
  }
  if (path === '/community' || path === '/community/') {
    return false;
  }
  if (path.startsWith('/community/') && !normalizeCommunityPath(path)) {
    window.location.replace(`#${getDefaultCommunityPath()}`);
    return true;
  }
  return false;
}

/** @deprecated */
export const bootstrapConcernRoute = bootstrapCommunityRoute;

export function bootstrapPromoRoute() {
  const { pathname, hash, origin, search } = window.location;

  if (!hash && pathname.startsWith('/promo')) {
    const bare = pathname === '/promo' || pathname === '/promo/';
    const target = bare ? getDefaultPromoPath() : pathname;
    window.location.replace(`${origin}/${search}#${target}`);
    return true;
  }

  if (!hash) return false;

  const hashPath = hash.slice(1);
  const pathWithQuery = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  const path = pathWithQuery.split('?')[0];
  if (path === '/promo' || path === '/promo/') {
    window.location.replace(`#${getDefaultPromoPath()}`);
    return true;
  }
  if (path.startsWith('/promo/') && !normalizePromoPath(path)) {
    window.location.replace(`#${getDefaultPromoPath()}`);
    return true;
  }
  return false;
}

export function bootstrapPolicyRoute() {
  const { pathname, hash, origin, search } = window.location;

  if (!hash && pathname.startsWith('/policy')) {
    const bare = pathname === '/policy' || pathname === '/policy/';
    const target = bare ? '/support/policies' : pathname.replace(/^\/policy/, '/support/policies');
    window.location.replace(`${origin}/${search}#${target === '/support/policies' ? '/support/policies' : target}`);
    return true;
  }

  if (!hash) return false;

  const hashPath = hash.slice(1);
  const path = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (path === '/policy' || path === '/policy/') {
    window.location.replace('#/support/policies');
    return true;
  }

  if (path.startsWith('/policy/')) {
    const slug = path.slice('/policy/'.length);
    window.location.replace(`#/support/policies/${slug || 'terms'}`);
    return true;
  }

  return false;
}

export function bootstrapLibraryRoute() {
  const { pathname, hash, origin, search } = window.location;

  if (!hash && pathname.startsWith('/library')) {
    const bare = pathname === '/library' || pathname === '/library/';
    const target = bare ? '/support/library' : pathname.replace(/^\/library/, '/support/library');
    window.location.replace(`${origin}/${search}#${target}`);
    return true;
  }

  if (!hash) return false;

  const hashPath = hash.slice(1);
  const path = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (path === '/library' || path === '/library/') {
    window.location.replace('#/support/library');
    return true;
  }

  if (path.startsWith('/library/')) {
    const rest = path.slice('/library/'.length);
    window.location.replace(`#/support/library/${rest}`);
    return true;
  }

  return false;
}

export function bootstrapAdminRoute() {
  const { pathname, hash, origin, search } = window.location;

  if (!hash && pathname.startsWith('/admin') && !pathname.startsWith('/administrator')) {
    const bare = pathname === '/admin' || pathname === '/admin/';
    const target = bare ? getDefaultAdminPath() : pathname;
    window.location.replace(`${origin}/${search}#${target}`);
    return true;
  }

  if (!hash) return false;

  const hashPath = hash.slice(1);
  const path = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (path === '/admin' || path === '/admin/') {
    window.location.replace(`#${getDefaultAdminPath()}`);
    return true;
  }

  const legacy = getAdminLegacyRedirect(path);
  if (legacy) {
    window.location.replace(`#${legacy}`);
    return true;
  }

  if (path.startsWith('/admin/') && !normalizeAdminPath(path)) {
    window.location.replace(`#${getDefaultAdminPath()}`);
    return true;
  }

  return false;
}

/**
 * `#/plans/*` 정규화 + 레거시/운영 경로 리다이렉트
 * @returns {boolean}
 */
export function bootstrapPlansRoute() {
  const { pathname, hash, origin, search } = window.location;

  if (!hash && pathname.startsWith('/plans')) {
    const bare = pathname === '/plans' || pathname === '/plans/';
    const target = bare ? getDefaultPlansPath() : pathname;
    // pathname → hash 정규화. origin 루트로 옮기며 fragment를 명시한다.
    window.location.replace(`${origin}/${search}#${target}`);
    return true;
  }

  if (!hash) return false;

  const hashPath = hash.slice(1);
  const pathWithQuery = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  const pathOnly = pathWithQuery.split('?')[0];
  const query = pathWithQuery.includes('?') ? pathWithQuery.slice(pathWithQuery.indexOf('?')) : '';

  if (PLANS_REDIRECTS[pathOnly]) {
    window.location.replace(`#${PLANS_REDIRECTS[pathOnly]}${query}`);
    return true;
  }

  if (pathOnly === '/plans' || pathOnly === '/plans/') {
    if (pathOnly === '/plans/') {
      window.location.replace(`#${getDefaultPlansPath()}${query}`);
      return true;
    }
    return false;
  }

  if (pathOnly.startsWith('/plans/') && !normalizePlansPath(pathOnly)) {
    window.location.replace(`#${getDefaultPlansPath()}`);
    return true;
  }

  return false;
}

/**
 * Path URL(`/mypage/...`) 또는 bare `#/mypage`를 hash 라우트로 정규화.
 * SSOT 부록 A의 PHP 경로로 접속해도 프리뷰가 열리도록 한다.
 * @returns {boolean} location.replace를 호출했으면 true
 */
export function bootstrapMypageRoute() {
  const { pathname, hash, origin, search } = window.location;

  if (!hash && pathname.startsWith('/mypage')) {
    const bare = pathname === '/mypage' || pathname === '/mypage/';
    const target = bare ? getDefaultMypagePath(getActiveRole()) : pathname;
    window.location.replace(`${origin}/${search}#${target}`);
    return true;
  }

  if (!hash) return false;

  const hashPath = hash.slice(1);
  const pathWithQuery = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  const path = pathWithQuery.split('?')[0];
  const query = pathWithQuery.includes('?') ? pathWithQuery.slice(pathWithQuery.indexOf('?')) : '';

  if (PLANS_REDIRECTS[path]) {
    window.location.replace(`#${PLANS_REDIRECTS[path]}${query}`);
    return true;
  }

  if (path === '/mypage' || path === '/mypage/') {
    window.location.replace(`#${getDefaultMypagePath(getNavRole())}`);
    return true;
  }

  if (MYPAGE_LEGACY_ALIASES[path]) {
    window.location.replace(`#${MYPAGE_LEGACY_ALIASES[path]}`);
    return true;
  }

  if (path.startsWith('/mypage/') && !normalizeMypagePath(path)) {
    window.location.replace(`#${getDefaultMypagePath(getNavRole())}`);
    return true;
  }

  return false;
}

export function getMessagesPath() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  const normalized = normalizeMessagesPath(path);
  if (normalized && isMessagesDetailPath(path)) return normalized;
  return getDefaultMessagesPath();
}

export function getSupportPath() {
  const hash = window.location.hash.slice(1) || '';
  const path = (hash.startsWith('/') ? hash : `/${hash}`).split('?')[0];
  const normalized = normalizeSupportPath(path);
  if (normalized) return normalized;
  return getDefaultSupportPath();
}

export function getGuidePath() {
  const hash = window.location.hash.slice(1) || '';
  const path = (hash.startsWith('/') ? hash : `/${hash}`).split('?')[0];
  const normalized = normalizeGuidePath(path);
  if (normalized) return normalized;
  return getDefaultGuidePath();
}

export function getCommunityPath() {
  const hash = window.location.hash.slice(1) || '';
  const pathWithQuery = hash.startsWith('/') ? hash : `/${hash}`;
  const path = pathWithQuery.split('?')[0];
  const query = pathWithQuery.includes('?') ? pathWithQuery.slice(pathWithQuery.indexOf('?')) : '';
  const normalized = normalizeCommunityPath(path) || normalizeConcernPath(path);
  if (normalized) return `${normalized}${query}`;
  return getDefaultCommunityPath();
}

/** @deprecated */
export const getConcernPath = getCommunityPath;

export function getPromoPath() {
  const hash = window.location.hash.slice(1) || '';
  const pathWithQuery = hash.startsWith('/') ? hash : `/${hash}`;
  const path = pathWithQuery.split('?')[0];
  const query = pathWithQuery.includes('?') ? pathWithQuery.slice(pathWithQuery.indexOf('?')) : '';
  const normalized = normalizePromoPath(path);
  if (normalized) return `${normalized}${query}`;
  return getDefaultPromoPath();
}

export function getPolicyPath() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  const normalized = normalizePolicyPath(path);
  if (normalized) return normalized;
  return getDefaultPolicyPath();
}

export function getLibraryPath() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  const normalized = normalizeLibraryPath(path);
  if (normalized) return normalized;
  return getDefaultLibraryPath();
}

export function getAdminPath() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  const normalized = normalizeAdminPath(path);
  if (normalized) return normalized;
  return getDefaultAdminPath();
}

export function getPlansPath() {
  const hash = window.location.hash.slice(1) || '';
  const path = (hash.startsWith('/') ? hash : `/${hash}`).split('?')[0];
  const normalized = normalizePlansPath(path);
  if (normalized) return normalized;
  return getDefaultPlansPath();
}

export function getMypagePath() {
  const hash = window.location.hash.slice(1) || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  const normalized = normalizeMypagePath(path);
  if (normalized) return normalized;
  return getDefaultMypagePath(getNavRole());
}

export function getCurrentScreen() {
  if (isPlansRoute()) return 'plans';
  if (isMypageRoute()) return 'mypage';
  if (isMessagesRoute()) return 'messages';
  if (isAdminRoute()) return 'admin';
  if (isLibraryRoute()) return 'library';
  if (isGuideRoute()) return 'guide';
  if (isCommunityRoute()) return 'community';
  if (isPromoRoute()) return 'promo';
  if (isSupportRoute()) return 'support';
  if (isPolicyRoute()) return 'policy';
  const hash = window.location.hash.slice(1) || '/guest';
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  return ROUTES[path] || 'guest';
}
