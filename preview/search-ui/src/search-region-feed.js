/**
 * 검색 전 지역 피드.
 * 서버에서 받은 목록만 돌린다. 지역 목업 풀은 쓰지 않는다.
 */

import { mapSearchResultsToExposure } from './search-exposure-mapper.js';

/**
 * 공부방/과외 검색 결과 하단 — 해당 지역 학생 수요.
 * 목업 학생 카드는 붙이지 않는다.
 * @param {string} [_regionHint]
 * @param {{ hopeType?: 'tutor'|'study_room'|null, limit?: number }} [_opts]
 */
export function getStudentDemandForRegion(_regionHint, _opts = {}) {
  return [];
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {{ tutorRegionIndex?: number, role?: import('./state.js').ViewerRole, homeSelf?: boolean, hopeType?: 'tutor'|'study_room', regionLabel?: string, studyRoomHome?: boolean, promoFind?: boolean, promoStudent?: boolean, tutorHome?: boolean, liveItems?: object[], liveStudentItems?: object[], liveTutorItems?: object[]|null }} [ctx]
 * @returns {{ items: object[], regionLabel: string, pending?: boolean }}
 */
export function getRegionFeed(tab, ctx = {}) {
  if (tab === 'room' && (ctx.studyRoomHome || ctx.promoFind)) {
    const items = Array.isArray(ctx.liveItems) ? ctx.liveItems : [];
    return { items, regionLabel: String(ctx.regionLabel || '').trim() };
  }

  if (tab === 'student' && ctx.promoStudent) {
    const regionLabel = String(ctx.regionLabel || '').trim();
    if (!Array.isArray(ctx.liveStudentItems)) {
      return { items: [], regionLabel, pending: true };
    }
    return {
      items: mapSearchResultsToExposure('student', ctx.liveStudentItems),
      regionLabel,
    };
  }

  // 과외쌤 홈 「우리동네 과외쌤」 = 대표 과외지역에 노출된 베이직카드 전부(내 카드 포함).
  if (tab === 'tutor' && ctx.tutorHome) {
    const regionLabel = String(ctx.regionLabel || '').trim();
    if (!Array.isArray(ctx.liveTutorItems)) {
      return { items: [], regionLabel, pending: true };
    }
    return {
      items: mapSearchResultsToExposure('tutor', ctx.liveTutorItems),
      regionLabel,
    };
  }

  return { items: [], regionLabel: String(ctx.regionLabel || '').trim() };
}
