/**
 * 공개 샵 — 목록/시드 캐시에서 study-room item 조회
 */

import { previewState } from '../state.js';
import { EXPOSURE_STUDY_ROOMS } from '../exposure-data.js';
import { getHomeBasicPool } from '../home-basic-live.js';

/** 확대카드에서 넘긴 아이템 — API 404여도 같은 카드로 샵을 연다 */
const REMEMBER_KEY = 'study114:public-study-room-item';
let rememberedItem = null;

function persistRemembered(item) {
  rememberedItem = item;
  try {
    if (item) sessionStorage.setItem(REMEMBER_KEY, JSON.stringify(item));
    else sessionStorage.removeItem(REMEMBER_KEY);
  } catch {
    /* quota */
  }
}

function readPersisted(id) {
  try {
    const raw = sessionStorage.getItem(REMEMBER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Number(parsed?.id) === id ? parsed : null;
  } catch {
    return null;
  }
}

/** @param {object|null|undefined} item */
export function rememberPublicStudyRoomItem(item) {
  const id = Number(item?.id || 0);
  persistRemembered(Number.isFinite(id) && id > 0 ? item : null);
}

/**
 * @param {number} id
 * @returns {object | null}
 */
export function resolvePublicStudyRoomItem(id) {
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) return null;

  if (rememberedItem && Number(rememberedItem.id) === n) return rememberedItem;
  const persisted = readPersisted(n);
  if (persisted) {
    rememberedItem = persisted;
    return persisted;
  }

  const pools = [
    previewState.parentFind?.activeResultItems,
    previewState.studyRoomFind?.activeResultItems,
    previewState.tutorFind?.activeResultItems,
    previewState.parentFind?.searchExposureItems,
    previewState.studyRoomFind?.searchExposureItems,
    previewState.tutorFind?.searchExposureItems,
    getHomeBasicPool('study_room'),
  ];
  for (const pool of pools) {
    if (!Array.isArray(pool)) continue;
    const hit = pool.find((x) => Number(x?.id) === n);
    if (hit) return hit;
  }

  return EXPOSURE_STUDY_ROOMS.find((x) => Number(x.id) === n) || null;
}

export { toMyshopShowcaseInputs } from './public-model.js';
