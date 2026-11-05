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
 * @param {{ tutorRegionIndex?: number, role?: import('./state.js').ViewerRole, homeSelf?: boolean, hopeType?: 'tutor'|'study_room', regionLabel?: string, studyRoomHome?: boolean, promoFind?: boolean, promoStudent?: boolean, tutorHome?: boolean, tutorFindInitial?: boolean, liveItems?: object[], liveStudentItems?: object[], liveTutorItems?: object[]|null, feedStatus?: 'idle'|'loading'|'ready'|'error'|'no-region' }} [ctx]
 * @returns {{ items: object[], regionLabel: string, pending?: boolean, status?: string }}
 */
export function getRegionFeed(tab, ctx = {}) {
  const settled =
    ctx.feedStatus === 'ready' || ctx.feedStatus === 'error' || ctx.feedStatus === 'no-region';

  if (tab === 'room' && (ctx.studyRoomHome || ctx.promoFind)) {
    const regionLabel = String(ctx.regionLabel || '').trim();
    if (!Array.isArray(ctx.liveItems)) {
      return { items: [], regionLabel, pending: !settled, status: ctx.feedStatus };
    }
    return {
      items: ctx.liveItems,
      regionLabel,
      status: ctx.feedStatus || 'ready',
      pending: false,
    };
  }

  if (tab === 'student' && ctx.promoStudent) {
    const regionLabel = String(ctx.regionLabel || '').trim();
    if (!Array.isArray(ctx.liveStudentItems)) {
      return { items: [], regionLabel, pending: !settled, status: ctx.feedStatus };
    }
    return {
      items: mapSearchResultsToExposure('student', ctx.liveStudentItems),
      regionLabel,
      status: ctx.feedStatus || 'ready',
    };
  }

  // 과외쌤 홈 「우리동네 과외쌤」과 찾기 첫 목록 = 대표 과외지역에 노출된 베이직카드 전부(내 카드 포함).
  if (tab === 'tutor' && (ctx.tutorHome || ctx.tutorFindInitial)) {
    const regionLabel = String(ctx.regionLabel || '').trim();
    if (!Array.isArray(ctx.liveTutorItems)) {
      return { items: [], regionLabel, pending: !settled, status: ctx.feedStatus };
    }
    return {
      items: mapSearchResultsToExposure('tutor', ctx.liveTutorItems),
      regionLabel,
      status: ctx.feedStatus || 'ready',
    };
  }

  return { items: [], regionLabel: String(ctx.regionLabel || '').trim() };
}
