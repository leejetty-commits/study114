/**
 * exposure-data.js ↔ 검색 API 실 ID 브리지 (Dev 로그인 시)
 * 012_search_dev_seed 기준: 공부방 3 · 과외 2 · 학생 2
 */

import { isLoggedIn } from './auth-session.js';
import { searchPreviewTab } from './search-api.js';
import {
  EXPOSURE_STUDY_ROOMS,
  EXPOSURE_TUTORS,
  EXPOSURE_STUDENTS,
} from './exposure-data.js';
import { studyRoomBadges, tutorBadges } from './exposure-format.js';

export const REAL_DB_CAP = { study_room: 3, tutor: 2, student: 2 };

let bridged = false;

/**
 * @param {object} item
 * @param {object} base
 */
function mapRoomItem(item, base) {
  const summaryLines = String(item.summary || '').split('\n').filter(Boolean);
  const merged = {
    ...base,
    id: item.id,
    study_room_name: item.title || base.study_room_name,
    location_label: item.region_label || base.location_label,
    price_amount: item.price_amount ?? base.price_amount,
    main_subject_note: summaryLines[0] || base.main_subject_note,
    intro_short: summaryLines[1] || base.intro_short,
    profile_status: 'published',
    compare_eligible: true,
    inquiry_status: base.inquiry_status || 'open',
    badges: studyRoomBadges({ ...base, main_subject_note: summaryLines[0] || base.main_subject_note }),
    latitude: item.latitude ?? base.latitude ?? null,
    longitude: item.longitude ?? base.longitude ?? null,
    _realDb: true,
  };
  return merged;
}

function mapTutorItem(item, base) {
  const summaryLines = String(item.summary || '').split('\n').filter(Boolean);
  return {
    ...base,
    id: item.id,
    tutor_display_name: item.title || base.tutor_display_name,
    location_label: item.region_label || base.location_label,
    preferred_fee_amount: item.price_amount ?? base.preferred_fee_amount,
    main_subject_note: summaryLines[0] || base.main_subject_note,
    intro_short: summaryLines[1] || base.intro_short,
    profile_status: 'published',
    compare_eligible: true,
    badges: tutorBadges({ ...base, main_subject_note: summaryLines[0] || base.main_subject_note }),
    _realDb: true,
  };
}

function mapStudentItem(item, base) {
  const summaryLines = String(item.summary || '').split('\n').filter(Boolean);
  return {
    ...base,
    id: item.id,
    public_display_name: item.title || base.public_display_name,
    location_label: item.region_label || base.location_label,
    subject_label: summaryLines[0] || base.subject_label,
    grade_level: summaryLines[1]?.split('·')[0]?.trim() || base.grade_level,
    exposure_status: 'published',
    _realDb: true,
  };
}

/**
 * @param {object[]} pool
 * @param {object[]} items
 * @param {(item: object, base: object) => object} mapper
 * @param {number} cap
 */
function patchPool(pool, items, mapper, cap) {
  for (let i = 0; i < Math.min(cap, items.length); i++) {
    const slotId = i + 1;
    const idx = pool.findIndex((p) => p.id === slotId);
    if (idx < 0) continue;
    pool[idx] = mapper(items[i], pool[idx]);
  }
}

export function isExposureBridged() {
  return bridged;
}

export async function hydrateExposureBridge() {
  if (!isLoggedIn() || bridged) return;
  try {
    const [rooms, tutors, students] = await Promise.all([
      searchPreviewTab('room', REAL_DB_CAP.study_room),
      searchPreviewTab('tutor', REAL_DB_CAP.tutor),
      searchPreviewTab('student', REAL_DB_CAP.student),
    ]);
    patchPool(EXPOSURE_STUDY_ROOMS, rooms.items ?? [], mapRoomItem, REAL_DB_CAP.study_room);
    patchPool(EXPOSURE_TUTORS, tutors.items ?? [], mapTutorItem, REAL_DB_CAP.tutor);
    patchPool(EXPOSURE_STUDENTS, students.items ?? [], mapStudentItem, REAL_DB_CAP.student);
    bridged = true;
  } catch (err) {
    console.warn('[exposure-bridge]', err);
  }
}

export function resetExposureBridge() {
  bridged = false;
}
