/**
 * 과외쌤 홈 멤버박스 조회.
 * 공부방과 같이 ROI lifetime_views. study_room_id 는 붙이지 않는다.
 */

import { fetchRoiSummary } from './paid-api.js';

/** @type {number|null} */
let lifetimeViews = null;
let viewsLoaded = false;
/** @type {Promise<void>|null} */
let bootPromise = null;

/** @returns {number|null} 없거나 실패면 null */
export function readTutorLifetimeViews() {
  return lifetimeViews;
}

async function ensureLifetimeViews() {
  if (viewsLoaded && lifetimeViews != null) return;
  try {
    const data = await fetchRoiSummary(7);
    if (data?.lifetime_views == null || data.lifetime_views === '') {
      lifetimeViews = null;
    } else {
      const n = Number(data.lifetime_views);
      lifetimeViews = Number.isFinite(n) ? n : null;
    }
  } catch {
    lifetimeViews = null;
  }
  viewsLoaded = true;
}

/**
 * @param {() => void} [rerender]
 */
export function bootTutorHome(rerender) {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    await ensureLifetimeViews();
    if (typeof rerender === 'function') rerender();
  })();
  return bootPromise;
}
