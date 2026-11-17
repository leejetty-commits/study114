/**
 * 검색 API 실데이터 → exposure-data.js 노출 풀 (로그인 시)
 * 풀은 빈 배열로 시작하고 API 결과만 담는다.
 */

import { isLoggedIn } from './auth-session.js';
import { searchPreviewTab } from './search-api.js';
import {
  EXPOSURE_STUDY_ROOMS,
  EXPOSURE_TUTORS,
  EXPOSURE_STUDENTS,
} from './exposure-data.js';
import { studyRoomBadges, tutorBadges } from './exposure-format.js';
import { studentSearchCardFields, studyRoomSearchCardFields, tutorSearchCardFields } from './home-basic-live.js';

export const REAL_DB_CAP = { study_room: 3, tutor: 2, student: 2 };

let bridged = false;
let fillState = 'idle';

function isFindSpa() {
  const loc = typeof window !== 'undefined' ? window.location : undefined;
  if (!loc) return false;
  const path = String(loc.pathname || '');
  if (path.startsWith('/search')) return true;
  const hashPath = String(loc.hash || '').replace(/^#/, '').split('?')[0];
  return hashPath === '/search' || hashPath.startsWith('/search/');
}

/** @param {object} item */
function mapRoomItem(item) {
  const card = studyRoomSearchCardFields(item);
  return {
    id: item.id,
    study_room_name: item.title || '',
    location_label: item.region_label || '',
    price_amount: item.price_amount ?? null,
    recommend_count: item.recommend_count ?? 0,
    review_count: item.review_count ?? 0,
    wish_count: Number(item.wish_count) || 0,
    compare_count: Number(item.compare_count) || 0,
    message_count: Number(item.message_count) || 0,
    published_at: item.published_at || item.created_at || null,
    ...card,
    profile_status: 'published',
    compare_eligible: true,
    inquiry_status: item.inquiry_status || 'open',
    badges: studyRoomBadges({ ...item, ...card }),
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    _realDb: true,
  };
}

/** @param {object} item */
function mapTutorItem(item) {
  const card = tutorSearchCardFields(item);
  return {
    id: item.id,
    tutor_display_name: item.title || '',
    location_label: item.region_label || '',
    preferred_fee_amount: item.preferred_fee_amount ?? item.price_amount ?? null,
    university_name: item.university_name ?? '',
    recommend_count: item.recommend_count ?? 0,
    review_count: item.review_count ?? 0,
    wish_count: Number(item.wish_count) || 0,
    compare_count: Number(item.compare_count) || 0,
    message_count: Number(item.message_count) || 0,
    published_at: item.published_at || item.created_at || null,
    ...card,
    profile_status: 'published',
    compare_eligible: true,
    badges: tutorBadges({ ...item, ...card }),
    _realDb: true,
  };
}

/** @param {object} item */
function mapStudentItem(item) {
  return {
    id: item.id,
    public_display_name: item.title || '',
    location_label: item.region_label || '',
    ...studentSearchCardFields(item),
    exposure_status: 'published',
    _realDb: true,
  };
}

/**
 * @param {object[]} pool
 * @param {object[]} items
 * @param {(item: object) => object} mapper
 * @param {number} cap
 */
function patchPool(pool, items, mapper, cap) {
  pool.length = 0;
  for (let i = 0; i < Math.min(cap, items.length); i++) {
    pool.push(mapper(items[i]));
  }
}

export { mapRoomItem as mapBridgeRoomItem, mapTutorItem as mapBridgeTutorItem, mapStudentItem as mapBridgeStudentItem };

export function isExposureBridged() {
  return bridged;
}

/**
 * 로그인 노출 풀. 홈은 세 탭을 동시에 받는다.
 * 찾기 SPA에서 sequential 없이 부르면 바로 돌아오고, 쉬는 뒤에 한 탭씩 보낸다.
 * sequential 은 그 자리에서 한 탭씩 받고 끝날 때까지 기다린다.
 * @param {{ sequential?: boolean }} [opts]
 */
export async function hydrateExposureBridge(opts = {}) {
  if (!isLoggedIn() || bridged) return;
  if (opts.sequential !== true && isFindSpa()) {
    if (fillState !== 'idle') return;
    fillState = 'scheduled';
    const run = () => {
      if (fillState !== 'scheduled') return;
      hydrateExposureBridge({ sequential: true }).catch((err) => {
        console.warn('[exposure-bridge]', err);
      });
    };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 200 });
    else setTimeout(run, 0);
    return;
  }
  if (fillState === 'running') return;
  if (fillState === 'scheduled' && opts.sequential !== true) return;
  fillState = 'running';
  try {
    const loads = [
      () => searchPreviewTab('room', REAL_DB_CAP.study_room),
      () => searchPreviewTab('tutor', REAL_DB_CAP.tutor),
      () => searchPreviewTab('student', REAL_DB_CAP.student),
    ];
    const results =
      opts.sequential === true
        ? await loads.reduce(async (chain, load) => {
            const acc = await chain;
            acc.push(await load());
            return acc;
          }, Promise.resolve([]))
        : await Promise.all(loads.map((load) => load()));
    const [rooms, tutors, students] = results;
    patchPool(EXPOSURE_STUDY_ROOMS, rooms.items ?? [], mapRoomItem, REAL_DB_CAP.study_room);
    patchPool(EXPOSURE_TUTORS, tutors.items ?? [], mapTutorItem, REAL_DB_CAP.tutor);
    patchPool(EXPOSURE_STUDENTS, students.items ?? [], mapStudentItem, REAL_DB_CAP.student);
    bridged = true;
  } catch (err) {
    console.warn('[exposure-bridge]', err);
  } finally {
    fillState = 'idle';
  }
}

export function resetExposureBridge() {
  bridged = false;
  fillState = 'idle';
  EXPOSURE_STUDY_ROOMS.length = 0;
  EXPOSURE_TUTORS.length = 0;
  EXPOSURE_STUDENTS.length = 0;
}
