/**
 * 공급자 — 자기 노출 미리보기 (공부방찾기 / 과외쌤찾기 탭 · 본인만)
 * 공부방 홈(homeSelf)은 여기로 지역 피드를 바꾸지 않는다. 홍보1 지역 목록이 정본.
 */

import { EXPOSURE_TUTORS } from '@home-ui/exposure-data.js';
import { getStudyRooms } from '@home-ui/study-room-reg/store.js';
import { isProviderSelfPreviewMode } from './search-role-access.js';

/** 프리뷰 SSOT — 과외 찾기 자기 카드. 공부방은 로그인 등록 id (시드 1 고정 없음). */
export const PREVIEW_OWN_TUTOR_ID = 1;

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {import('./state.js').ViewerRole} role
 * @param {boolean} [homeSelf]
 */
export function isSelfPreviewActive(tab, role, homeSelf = false) {
  return isProviderSelfPreviewMode(tab, role, homeSelf);
}

function ownStudyRoomRecord() {
  const rooms = getStudyRooms().filter((r) => !r.deleted_at);
  return rooms.find((r) => r.profile_status === 'published') || rooms[0] || null;
}

/** @returns {number|null} */
export function resolveOwnStudyRoomId() {
  const id = Number(ownStudyRoomRecord()?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {import('./state.js').ViewerRole} role
 * @param {{ home?: boolean }} [opts]
 * @returns {{ items: object[], regionLabel: string } | null}
 */
export function getProviderSelfFeed(tab, role, opts = {}) {
  if (role === 'study_room' && tab === 'room') {
    // 시드 id=1·exposure_tier prime 강제 없음. 목록은 로그인 방의 유료 position_sku 검색 결과.
    return null;
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
  if (tab === 'room') {
    const ownId = resolveOwnStudyRoomId();
    if (!ownId) return items;
    return items.filter((x) => Number(x.id) === ownId);
  }
  return items.filter((x) => Number(x.id) === PREVIEW_OWN_TUTOR_ID);
}
