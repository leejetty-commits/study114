/**
 * 공급자 — 자기 노출 미리보기 (공부방찾기 / 과외쌤찾기 탭 · 본인만)
 */

import { EXPOSURE_STUDY_ROOMS, EXPOSURE_TUTORS } from '@home-ui/exposure-data.js';
import { isProviderSelfPreviewMode } from './search-role-access.js';

/** 프리뷰 SSOT — 내 공부방·과외 exposure id */
export const PREVIEW_OWN_STUDY_ROOM_ID = 1;
export const PREVIEW_OWN_TUTOR_ID = 1;

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {import('./state.js').ViewerRole} role
 * @param {boolean} [homeSelf]
 */
export function isSelfPreviewActive(tab, role, homeSelf = false) {
  return isProviderSelfPreviewMode(tab, role, homeSelf);
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {import('./state.js').ViewerRole} role
 * @param {{ home?: boolean }} [opts]
 * @returns {{ items: object[], regionLabel: string } | null}
 */
export function getProviderSelfFeed(tab, role, opts = {}) {
  if (role === 'study_room' && tab === 'room') {
    const own =
      EXPOSURE_STUDY_ROOMS.find((x) => x.id === PREVIEW_OWN_STUDY_ROOM_ID) || EXPOSURE_STUDY_ROOMS[0];
    return {
      items: [{ ...own, exposure_tier: 'prime' }],
      regionLabel: String(own.location_label || ''),
    };
  }
  if (opts.home && role === 'tutor' && tab === 'tutor') {
    const own = EXPOSURE_TUTORS.find((x) => x.id === PREVIEW_OWN_TUTOR_ID) || EXPOSURE_TUTORS[0];
    return {
      items: [{ ...own, exposure_tier: 'prime' }],
      regionLabel: String(own.location_label || ''),
    };
  }
  return null;
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {import('./state.js').ViewerRole} role
 * @param {object[]} items
 */
export function filterToProviderSelf(tab, role, items, homeSelf = false) {
  if (!isProviderSelfPreviewMode(tab, role, homeSelf)) return items;
  const ownId = tab === 'room' ? PREVIEW_OWN_STUDY_ROOM_ID : PREVIEW_OWN_TUTOR_ID;
  return items.filter((x) => Number(x.id) === ownId);
}
