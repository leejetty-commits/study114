/**
 * 6장 §4·§5 — 찜·비교 선택 (프리뷰 sessionStorage)
 */

import { EXPOSURE_STUDY_ROOMS, EXPOSURE_TUTORS } from './exposure-data.js';
import { COMPARE_MAX } from './exposure-schema.js';

const STORAGE_KEY = 'study114-preview-user-actions';

/** @typedef {'study_room' | 'tutor'} ProviderKind */

function defaultState() {
  return { wishlist: { study_room: [], tutor: [] }, compare: { study_room: [], tutor: [] } };
}

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      wishlist: {
        study_room: [...(parsed.wishlist?.study_room || [])],
        tutor: [...(parsed.wishlist?.tutor || [])],
      },
      compare: {
        study_room: [...(parsed.compare?.study_room || [])],
        tutor: [...(parsed.compare?.tutor || [])],
      },
    };
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** @param {ProviderKind} kind @param {number|string} id */
export function getExposureItem(kind, id) {
  const pool = kind === 'tutor' ? EXPOSURE_TUTORS : EXPOSURE_STUDY_ROOMS;
  return pool.find((item) => item.id === Number(id));
}

/** @param {ProviderKind} kind */
export function getWishlistIds(kind) {
  return [...loadState().wishlist[kind]];
}

/** @param {ProviderKind} kind */
export function getCompareIds(kind) {
  return [...loadState().compare[kind]];
}

/** @param {ProviderKind} kind */
export function getWishlistItems(kind) {
  return getWishlistIds(kind).map((id) => getExposureItem(kind, id)).filter(Boolean);
}

/** @param {ProviderKind} kind */
export function getCompareItems(kind) {
  return getCompareIds(kind).map((id) => getExposureItem(kind, id)).filter(Boolean);
}

/** @param {ProviderKind} kind @param {number|string} id */
export function isWishlisted(kind, id) {
  return loadState().wishlist[kind].includes(Number(id));
}

/** @param {ProviderKind} kind @param {number|string} id */
export function isInCompare(kind, id) {
  return loadState().compare[kind].includes(Number(id));
}

/** @param {ProviderKind} kind @param {number|string} id */
export function toggleWishlist(kind, id) {
  const numId = Number(id);
  const state = loadState();
  const list = state.wishlist[kind];
  const idx = list.indexOf(numId);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(numId);
  saveState(state);
  return list.includes(numId);
}

/**
 * @param {ProviderKind} kind
 * @param {number|string} id
 * @returns {{ inCompare: boolean, full?: boolean, ineligible?: boolean }}
 */
export function toggleCompare(kind, id) {
  const numId = Number(id);
  const state = loadState();
  const list = state.compare[kind];
  const idx = list.indexOf(numId);
  if (idx >= 0) {
    list.splice(idx, 1);
    saveState(state);
    return { inCompare: false };
  }
  if (list.length >= COMPARE_MAX) {
    return { inCompare: false, full: true };
  }
  const item = getExposureItem(kind, numId);
  if (item?.compare_eligible === false) {
    return { inCompare: false, ineligible: true };
  }
  list.push(numId);
  saveState(state);
  return { inCompare: true };
}

/** @param {ProviderKind} kind @param {number|string} id */
export function addCompareFromWishlist(kind, id) {
  if (isInCompare(kind, id)) return { inCompare: true };
  return toggleCompare(kind, id);
}

/** @param {ProviderKind} kind */
export function clearCompare(kind) {
  const state = loadState();
  state.compare[kind] = [];
  saveState(state);
}

/** @param {ProviderKind} kind @param {number|string} id */
export function removeWishlist(kind, id) {
  const state = loadState();
  const list = state.wishlist[kind];
  const idx = list.indexOf(Number(id));
  if (idx >= 0) list.splice(idx, 1);
  saveState(state);
}
