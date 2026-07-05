/**
 * 25장 — handoff 영속 레이어 (API 캐시 · sessionStorage fallback)
 */

import {
  listFavorites,
  listCompare,
  listRecent,
  listStudentReviews,
  toggleFavorite,
  toggleCompare,
  clearCompare,
  removeFavorite,
  recordRecentView as apiRecordRecent,
  patchRecentHandoff as apiPatchRecent,
  toggleStudentReview as apiToggleStudentReview,
  removeStudentReview as apiRemoveStudentReview,
} from './handoff-api.js';

let apiMode = false;

/** @type {{ wishlist: { study_room: number[], tutor: number[] }, compare: { study_room: number[], tutor: number[] } }} */
const userActionsCache = {
  wishlist: { study_room: [], tutor: [] },
  compare: { study_room: [], tutor: [] },
};

/** @type {Array<{ kind: string, id: number, title: string, viewedAt: string, lastRoute?: string|null, lastAction?: string }>} */
let recentCache = [];

/** @type {Array<{ id: number, savedAt: string, providerRole?: string|null }>} */
let studentReviewCache = [];

export function isHandoffApiMode() {
  return apiMode;
}

function resetCaches() {
  userActionsCache.wishlist.study_room = [];
  userActionsCache.wishlist.tutor = [];
  userActionsCache.compare.study_room = [];
  userActionsCache.compare.tutor = [];
  recentCache = [];
  studentReviewCache = [];
}

/** @param {Record<string, unknown>} row */
function mapRecentRow(row) {
  return {
    kind: String(row.target_type),
    id: Number(row.target_id),
    title: String(row.title_snapshot ?? ''),
    viewedAt: String(row.viewed_at ?? new Date().toISOString()),
    lastRoute: row.last_route != null ? String(row.last_route) : null,
    lastAction: row.last_action != null ? String(row.last_action) : 'view_detail',
  };
}

/** @param {Record<string, unknown>} row */
function mapReviewRow(row) {
  return {
    id: Number(row.student_id),
    savedAt: String(row.saved_at ?? new Date().toISOString()),
    providerRole: row.provider_role != null ? String(row.provider_role) : null,
  };
}

export async function activateHandoffApi() {
  apiMode = true;
  await hydrateHandoffCache();
}

export function deactivateHandoffApi() {
  apiMode = false;
  resetCaches();
}

export async function hydrateHandoffCache() {
  const [favorites, compareSr, compareT, recent, reviews] = await Promise.all([
    listFavorites(),
    listCompare('study_room'),
    listCompare('tutor'),
    listRecent(),
    listStudentReviews().catch(() => ({ items: [] })),
  ]);

  userActionsCache.wishlist.study_room = [];
  userActionsCache.wishlist.tutor = [];
  for (const row of favorites.items ?? []) {
    const type = String(row.target_type);
    const id = Number(row.target_id);
    if (type === 'study_room' && !userActionsCache.wishlist.study_room.includes(id)) {
      userActionsCache.wishlist.study_room.push(id);
    }
    if (type === 'tutor' && !userActionsCache.wishlist.tutor.includes(id)) {
      userActionsCache.wishlist.tutor.push(id);
    }
  }

  userActionsCache.compare.study_room = (compareSr.items ?? []).map((r) => Number(r.target_id));
  userActionsCache.compare.tutor = (compareT.items ?? []).map((r) => Number(r.target_id));
  recentCache = (recent.items ?? []).map(mapRecentRow);
  studentReviewCache = (reviews.items ?? []).map(mapReviewRow);
}

export function getUserActionsCache() {
  return {
    wishlist: {
      study_room: [...userActionsCache.wishlist.study_room],
      tutor: [...userActionsCache.wishlist.tutor],
    },
    compare: {
      study_room: [...userActionsCache.compare.study_room],
      tutor: [...userActionsCache.compare.tutor],
    },
  };
}

export function getRecentCache() {
  return recentCache.map((e) => ({ ...e }));
}

export function getStudentReviewCache() {
  return studentReviewCache.map((e) => ({ ...e }));
}

function warnHandoff(err) {
  console.warn('[handoff-api]', err instanceof Error ? err.message : err);
}

/** @param {'study_room'|'tutor'} kind @param {number} id @returns {boolean} */
export function optimisticToggleWishlist(kind, id) {
  const list = userActionsCache.wishlist[kind];
  const idx = list.indexOf(id);
  if (idx >= 0) {
    list.splice(idx, 1);
    queueToggleFavorite(kind, id);
    return false;
  }
  list.push(id);
  queueToggleFavorite(kind, id);
  return true;
}

/**
 * @param {'study_room'|'tutor'} kind
 * @param {number} id
 * @returns {{ inCompare: boolean, full?: boolean }}
 */
export function optimisticToggleCompare(kind, id) {
  const list = userActionsCache.compare[kind];
  const idx = list.indexOf(id);
  if (idx >= 0) {
    list.splice(idx, 1);
    queueToggleCompare(kind, id);
    return { inCompare: false };
  }
  list.push(id);
  queueToggleCompare(kind, id);
  return { inCompare: true };
}

/** @param {'study_room'|'tutor'} kind */
export function optimisticClearCompare(kind) {
  userActionsCache.compare[kind] = [];
  queueClearCompare(kind);
}

/** @param {'study_room'|'tutor'} kind @param {number} id */
export function optimisticRemoveWishlist(kind, id) {
  const list = userActionsCache.wishlist[kind];
  const idx = list.indexOf(id);
  if (idx >= 0) list.splice(idx, 1);
  queueRemoveFavorite(kind, id);
}

/** @param {'study_room'|'tutor'} kind @param {number} id */
export function queueToggleFavorite(kind, id) {
  toggleFavorite(kind, id)
    .then((data) => {
      const list = userActionsCache.wishlist[kind];
      const has = list.includes(id);
      if (data.in_favorite !== has) {
        if (data.in_favorite && !has) list.push(id);
        if (!data.in_favorite && has) list.splice(list.indexOf(id), 1);
      }
    })
    .catch(warnHandoff);
}

/** @param {'study_room'|'tutor'} kind @param {number} id */
export function queueToggleCompare(kind, id) {
  toggleCompare(kind, id)
    .then((data) => {
      const list = userActionsCache.compare[kind];
      const has = list.includes(id);
      if (data.in_compare !== has) {
        if (data.in_compare && !has) list.push(id);
        if (!data.in_compare && has) list.splice(list.indexOf(id), 1);
      }
      if (data.full && has) {
        const idx = list.indexOf(id);
        if (idx >= 0) list.splice(idx, 1);
      }
    })
    .catch(warnHandoff);
}

/** @param {'study_room'|'tutor'} kind */
export function queueClearCompare(kind) {
  clearCompare(kind).catch(warnHandoff);
}

/** @param {'study_room'|'tutor'} kind @param {number} id */
export function queueRemoveFavorite(kind, id) {
  removeFavorite(kind, id).catch(warnHandoff);
}

/**
 * @param {'study_room'|'tutor'|'student'} kind
 * @param {number} id
 * @param {string} title
 * @param {{ lastRoute?: string|null, lastAction?: string }} opts
 */
export function queueRecordRecent(kind, id, title, opts) {
  apiRecordRecent({
    target_type: kind,
    target_id: id,
    title_snapshot: title,
    last_route: opts.lastRoute ?? null,
    last_action: opts.lastAction ?? 'view_detail',
  }).catch(warnHandoff);
}

/**
 * @param {'study_room'|'tutor'|'student'} kind
 * @param {number} id
 * @param {{ lastRoute?: string|null, lastAction?: string }} opts
 */
export function queuePatchRecent(kind, id, opts) {
  apiPatchRecent({
    target_type: kind,
    target_id: id,
    last_route: opts.lastRoute ?? null,
    last_action: opts.lastAction,
  }).catch(warnHandoff);
}

/** @param {number} id @param {string|null} providerRole */
export function queueToggleStudentReview(id, providerRole) {
  apiToggleStudentReview(id, providerRole ?? undefined)
    .then((data) => {
      const idx = studentReviewCache.findIndex((e) => e.id === id);
      if (data.in_review && idx < 0) {
        studentReviewCache.unshift({
          id,
          savedAt: new Date().toISOString(),
          providerRole: data.provider_role ?? providerRole,
        });
      }
      if (!data.in_review && idx >= 0) {
        studentReviewCache.splice(idx, 1);
      }
    })
    .catch(warnHandoff);
}

/** @param {number} id */
export function queueRemoveStudentReview(id) {
  apiRemoveStudentReview(id).catch(warnHandoff);
}

/**
 * @param {'study_room'|'tutor'|'student'} kind
 * @param {number} id
 * @param {string} title
 * @param {{ lastRoute?: string|null, lastAction?: string }} opts
 */
export function optimisticRecordRecent(kind, id, title, opts) {
  const entry = {
    kind,
    id,
    title,
    viewedAt: new Date().toISOString(),
    lastRoute: opts.lastRoute ?? null,
    lastAction: opts.lastAction ?? 'view_detail',
  };
  recentCache = recentCache.filter((e) => !(e.kind === kind && e.id === id));
  recentCache.unshift(entry);
  if (recentCache.length > 30) recentCache = recentCache.slice(0, 30);
  queueRecordRecent(kind, id, title, opts);
}

/**
 * @param {'study_room'|'tutor'|'student'} kind
 * @param {number} id
 * @param {{ lastRoute?: string|null, lastAction?: string }} opts
 */
export function optimisticPatchRecent(kind, id, opts) {
  const idx = recentCache.findIndex((e) => e.kind === kind && e.id === id);
  if (idx < 0) return;
  const entry = {
    ...recentCache[idx],
    lastRoute: opts.lastRoute ?? recentCache[idx].lastRoute,
    lastAction: opts.lastAction ?? recentCache[idx].lastAction,
    viewedAt: new Date().toISOString(),
  };
  recentCache.splice(idx, 1);
  recentCache.unshift(entry);
  queuePatchRecent(kind, id, opts);
}

/** @param {number} id @param {string|null|undefined} providerRole @returns {boolean} */
export function optimisticToggleStudentReview(id, providerRole) {
  const idx = studentReviewCache.findIndex((e) => e.id === id);
  if (idx >= 0) {
    studentReviewCache.splice(idx, 1);
    queueToggleStudentReview(id, providerRole ?? null);
    return false;
  }
  studentReviewCache.unshift({
    id,
    savedAt: new Date().toISOString(),
    providerRole: providerRole ?? null,
  });
  if (studentReviewCache.length > 50) studentReviewCache = studentReviewCache.slice(0, 50);
  queueToggleStudentReview(id, providerRole ?? null);
  return true;
}

/** @param {number} id */
export function optimisticRemoveStudentReview(id) {
  studentReviewCache = studentReviewCache.filter((e) => e.id !== id);
  queueRemoveStudentReview(id);
}
