/**
 * 노출 풀 item lookup — user-actions-state·handoff-backend 공용
 * 순환 import 방지를 위해 풀 참조만 가져오고, 양쪽 호출자에서 같은 함수를 쓴다.
 */

import { EXPOSURE_STUDY_ROOMS, EXPOSURE_TUTORS } from './exposure-data.js';
import { previewState } from './state.js';
import { getHomeBasicPool } from './home-basic-live.js';
import { lookupRegisteredProviderItem } from './detail-decision/provider-item-registry.js';

/** @typedef {'study_room'|'tutor'} ProviderKind */

/**
 * kind+id에 맞는 item 참조를 첫 번째 hit로 반환한다.
 * 풀 순서·nameKey는 getExposureItem 정본과 동일.
 *
 * @param {ProviderKind} kind
 * @param {number|string} id
 * @param {{ favoriteCardFn?: (kind: string, id: number) => { item: object|null }|null }} [opts]
 * @returns {object|undefined}
 */
export function lookupExposureItem(kind, id, opts) {
  const n = Number(id);
  const nameKey = kind === 'tutor' ? 'tutor_display_name' : 'study_room_name';
  const pools = exposurePools(kind);
  for (const pool of pools) {
    if (!Array.isArray(pool)) continue;
    const hit = pool.find((x) => Number(x?.id) === n && x != null && nameKey in x);
    if (hit) return hit;
  }
  if (typeof opts?.favoriteCardFn === 'function') {
    const fav = opts.favoriteCardFn(kind, n)?.item;
    if (fav) return fav;
  }
  const registered = lookupRegisteredProviderItem(kind, n);
  if (registered && nameKey in registered) return registered;
  return undefined;
}

/**
 * kind+id에 맞는 **모든 풀의 item 참조**를 반환한다.
 * 토글 성공/실패 시 모든 복사본을 같이 갱신·롤백하기 위해 사용.
 *
 * @param {ProviderKind} kind
 * @param {number|string} id
 * @returns {object[]}
 */
export function lookupAllExposureItems(kind, id) {
  const n = Number(id);
  const nameKey = kind === 'tutor' ? 'tutor_display_name' : 'study_room_name';
  const pools = exposurePools(kind);
  /** @type {object[]} */
  const hits = [];
  const seen = new Set();
  for (const pool of pools) {
    if (!Array.isArray(pool)) continue;
    for (const x of pool) {
      if (x != null && Number(x.id) === n && nameKey in x && !seen.has(x)) {
        seen.add(x);
        hits.push(x);
      }
    }
  }
  return hits;
}

/** 풀 배열 — getExposureItem 정본 순서 그대로 */
function exposurePools(kind) {
  return [
    kind === 'tutor' ? EXPOSURE_TUTORS : EXPOSURE_STUDY_ROOMS,
    previewState.parentFind?.activeResultItems,
    previewState.studyRoomFind?.activeResultItems,
    previewState.tutorFind?.activeResultItems,
    previewState.parentFind?.searchExposureItems,
    previewState.studyRoomFind?.searchExposureItems,
    previewState.tutorFind?.searchExposureItems,
    getHomeBasicPool(kind),
  ];
}
