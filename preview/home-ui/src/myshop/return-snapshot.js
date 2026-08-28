/**
 * 공개 마이샵 복귀 스냅샷 계약
 * — 진입 직전 목록 문맥을 sessionStorage에 고정하고, 복귀 시 previewState·스크롤을 복원한다.
 * docs/internal/50-student-myshop-routing.md
 */

import { previewState } from '../state.js';

const KEY = 'study114:myshop-return-snapshot';
const PENDING_KEY = 'study114:myshop-return-pending';

/**
 * @typedef {object} MyshopFindSnapshot
 * @property {boolean} [expanded]
 * @property {boolean} [searchExecuted]
 * @property {string|null} [searchError]
 * @property {number} [searchTotal]
 * @property {'region'|'search'|null} [activeResultSource]
 * @property {string} [activeRegionLabel]
 * @property {number} [tutorRegionIndex]
 * @property {string} [studentLessonFormat]
 * @property {boolean} [homeSelf]
 * @property {'tutor'|'study_room'|null} [studentHopeType]
 * @property {boolean} [hopeTypeResolved]
 * @property {Record<string, string>} [formFilters] — 폼에서 읽은 검색조건(가능 시)
 */

/**
 * @typedef {object} MyshopReturnSnapshot
 * @property {number} v
 * @property {number} createdAt
 * @property {string} listKey — 화면/리스트 문맥 키 (예: parent:study_room)
 * @property {string} returnHash — 복귀 해시 (`/parent` 등, # 없이)
 * @property {'home'|'search'} [returnHost] — 찾기 SPA(`/search`)에서 왔으면 search
 * @property {string} sourceRoute
 * @property {'guest'|'parent'|'study_room'|'tutor'|string} viewerRole
 * @property {string} [activeTab]
 * @property {number} scrollY
 * @property {number} [focusId] — 직전 study-room id
 * @property {Record<string, number>} [listPages]
 * @property {MyshopFindSnapshot} [find]
 * @property {string} [sort] — hash sort 등
 */

/** @param {object} find */
function serializeFind(find) {
  if (!find || typeof find !== 'object') return undefined;
  /** @type {MyshopFindSnapshot} */
  const out = {
    expanded: Boolean(find.expanded),
    searchExecuted: Boolean(find.searchExecuted),
    searchError: find.searchError ?? null,
    searchTotal: Number(find.searchTotal) || 0,
    activeResultSource: find.activeResultSource || null,
    activeRegionLabel: String(find.activeRegionLabel || ''),
    tutorRegionIndex: Number(find.tutorRegionIndex) || 0,
    studentLessonFormat: String(find.studentLessonFormat || ''),
    homeSelf: Boolean(find.homeSelf),
    studentHopeType: find.studentHopeType || null,
    hopeTypeResolved: Boolean(find.hopeTypeResolved),
  };
  return out;
}

/** @returns {Record<string, string>} */
function readFormFiltersFromDom() {
  /** @type {Record<string, string>} */
  const filters = {};
  const form = document.querySelector('form[data-search-form], form.search-find, [data-find-form] form, form');
  if (!form || !(form instanceof HTMLFormElement)) return filters;
  const fd = new FormData(form);
  fd.forEach((value, key) => {
    if (typeof value !== 'string') return;
    const v = value.trim();
    if (!v) return;
    filters[key] = v;
  });
  return filters;
}

/**
 * @param {'parent'|'tutor'|'study_room'} role
 */
function findBucketForRole(role) {
  if (role === 'tutor') return previewState.tutorFind;
  if (role === 'study_room') return previewState.studyRoomFind;
  return previewState.parentFind;
}

/**
 * @param {{ sourceRoute?: string, viewerRole?: string, focusId?: number }} opts
 * @returns {MyshopReturnSnapshot}
 */
export function buildMyshopReturnSnapshot(opts = {}) {
  const viewerRole = String(opts.viewerRole || 'guest');
  const sourceRoute = String(opts.sourceRoute || 'search');
  const hash = window.location.hash.slice(1) || '/guest';
  const returnHash = hash.startsWith('/') ? hash : `/${hash}`;

  let activeTab = '';
  if (viewerRole === 'parent') activeTab = previewState.parentTab;
  else if (viewerRole === 'tutor') activeTab = previewState.tutorTab;
  else if (viewerRole === 'study_room') activeTab = previewState.studyRoomTab;

  const listKey = `${viewerRole || 'guest'}:${activeTab || sourceRoute || 'list'}`;

  /** @type {MyshopFindSnapshot | undefined} */
  let find;
  if (viewerRole === 'parent' || viewerRole === 'tutor' || viewerRole === 'study_room') {
    find = serializeFind(findBucketForRole(viewerRole));
    const formFilters = readFormFiltersFromDom();
    if (find && Object.keys(formFilters).length) find.formFilters = formFilters;
  }

  const sortParams = new URLSearchParams(returnHash.includes('?') ? returnHash.slice(returnHash.indexOf('?') + 1) : '');
  const sort = sortParams.get('sort') || '';
  const pathname = (typeof window !== 'undefined' ? window.location.pathname : '').replace(/\/$/, '') || '/';
  const returnHost =
    pathname === '/search' || pathname.startsWith('/search/') ? 'search' : 'home';

  return {
    v: 1,
    createdAt: Date.now(),
    listKey,
    returnHash,
    returnHost,
    sourceRoute,
    viewerRole,
    activeTab: activeTab || undefined,
    scrollY: window.scrollY || document.documentElement.scrollTop || 0,
    focusId: opts.focusId != null ? Number(opts.focusId) : undefined,
    listPages: { ...previewState.guestListPages },
    find,
    sort: sort || undefined,
  };
}

/** @param {MyshopReturnSnapshot} snapshot */
export function saveMyshopReturnSnapshot(snapshot) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* private mode */
  }
}

/** @returns {MyshopReturnSnapshot | null} */
export function peekMyshopReturnSnapshot() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 1 || typeof parsed.returnHash !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** @returns {MyshopReturnSnapshot | null} */
export function consumeMyshopReturnSnapshot() {
  const snap = peekMyshopReturnSnapshot();
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return snap;
}

export function clearMyshopReturnSnapshot() {
  try {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/** 다음 목록 렌더 후 스크롤·포커스 적용 예약 */
export function markMyshopReturnPending() {
  try {
    sessionStorage.setItem(PENDING_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function isMyshopReturnPending() {
  try {
    return sessionStorage.getItem(PENDING_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearMyshopReturnPending() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * previewState에 탭·find·페이지 복원 (navigate 직전 호출)
 * @param {MyshopReturnSnapshot} snapshot
 */
export function applyMyshopReturnSnapshotToState(snapshot) {
  if (!snapshot) return;

  const role = snapshot.viewerRole;
  if (snapshot.activeTab) {
    if (role === 'parent') previewState.parentTab = /** @type {*} */ (snapshot.activeTab);
    else if (role === 'tutor') previewState.tutorTab = /** @type {*} */ (snapshot.activeTab);
    else if (role === 'study_room') previewState.studyRoomTab = /** @type {*} */ (snapshot.activeTab);
  }

  if (snapshot.listPages && typeof snapshot.listPages === 'object') {
    Object.assign(previewState.guestListPages, snapshot.listPages);
  }

  if (snapshot.find && (role === 'parent' || role === 'tutor' || role === 'study_room')) {
    const bucket = findBucketForRole(role);
    const f = snapshot.find;
    if (typeof f.expanded === 'boolean') bucket.expanded = f.expanded;
    if (typeof f.searchExecuted === 'boolean') bucket.searchExecuted = f.searchExecuted;
    if ('searchError' in f) bucket.searchError = f.searchError;
    if (typeof f.searchTotal === 'number') bucket.searchTotal = f.searchTotal;
    if ('activeResultSource' in f) bucket.activeResultSource = f.activeResultSource;
    if (typeof f.activeRegionLabel === 'string') bucket.activeRegionLabel = f.activeRegionLabel;
    if (typeof f.tutorRegionIndex === 'number') bucket.tutorRegionIndex = f.tutorRegionIndex;
    if (typeof f.studentLessonFormat === 'string') bucket.studentLessonFormat = f.studentLessonFormat;
    if (typeof f.homeSelf === 'boolean') bucket.homeSelf = f.homeSelf;
    if ('studentHopeType' in f) bucket.studentHopeType = f.studentHopeType;
    if (typeof f.hopeTypeResolved === 'boolean') bucket.hopeTypeResolved = f.hopeTypeResolved;
  }
}

/**
 * 목록 화면 렌더 후 스크롤·카드 포커스. pending일 때만 동작하고 스냅샷을 소비한다.
 */
export function restoreMyshopScrollAndFocusIfPending() {
  if (!isMyshopReturnPending()) return;
  const snap = peekMyshopReturnSnapshot();
  if (!snap) {
    clearMyshopReturnPending();
    return;
  }

  const run = () => {
    const focusId = snap.focusId;
    if (focusId) {
      const el = document.querySelector(
        `[data-provider-id="${focusId}"][data-provider-kind="study_room"], [data-provider-id="${focusId}"]`,
      );
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ block: 'center', behavior: 'auto' });
        clearMyshopReturnSnapshot();
        return;
      }
    }
    const y = Number(snap.scrollY) || 0;
    window.scrollTo(0, y);
    clearMyshopReturnSnapshot();
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}

/**
 * 복귀 버튼 라벨 (역할·문맥별)
 * @param {MyshopReturnSnapshot | null} snapshot
 */
export function myshopReturnLabel(snapshot) {
  if (!snapshot) return '이전 목록으로 돌아가기';
  const from = snapshot.sourceRoute || '';
  if (from === 'search' || snapshot.find?.searchExecuted) return '검색결과로 돌아가기';
  if (from === 'parent' || snapshot.viewerRole === 'parent') return '학부모 홈으로 돌아가기';
  if (from === 'study_room' || snapshot.viewerRole === 'study_room') return '공부방 홈으로 돌아가기';
  if (from === 'tutor' || snapshot.viewerRole === 'tutor') return '과외쌤 홈으로 돌아가기';
  if (from === 'guest' || snapshot.viewerRole === 'guest') return '목록으로 돌아가기';
  return '이전 목록으로 돌아가기';
}
