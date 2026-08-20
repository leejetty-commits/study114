/**
 * 공개 샵 — 목록/시드 캐시에서 study-room item 조회
 */

import { previewState } from '../state.js';
import { EXPOSURE_STUDY_ROOMS } from '../exposure-data.js';

/**
 * @param {number} id
 * @returns {object | null}
 */
export function resolvePublicStudyRoomItem(id) {
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) return null;

  const pools = [
    previewState.parentFind?.activeResultItems,
    previewState.studyRoomFind?.activeResultItems,
    previewState.tutorFind?.activeResultItems,
    previewState.parentFind?.searchExposureItems,
    previewState.studyRoomFind?.searchExposureItems,
    previewState.tutorFind?.searchExposureItems,
  ];
  for (const pool of pools) {
    if (!Array.isArray(pool)) continue;
    const hit = pool.find((x) => Number(x?.id) === n);
    if (hit) return hit;
  }

  return EXPOSURE_STUDY_ROOMS.find((x) => Number(x.id) === n) || null;
}

export { toMyshopShowcaseInputs } from './public-model.js';
