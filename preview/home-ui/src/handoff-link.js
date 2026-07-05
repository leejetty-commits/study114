/**
 * 25장 2차 — P21-05 ↔ 검토함 · P20-05 딥링크
 */

import { parseHashQuery } from '../../shared/preview-links.js';
import { tutorSectionPath } from './tutor-reg/router.js';
import { studyRoomSectionPath } from './study-room-reg/router.js';
import { getTutors } from './tutor-reg/store.js';
import { getStudyRooms } from './study-room-reg/store.js';

export const STUDENT_REVIEW_PATH = '/mypage/student-review';

/**
 * @param {{ from?: string }} [query]
 */
export function studentReviewPath(query = {}) {
  const qs = new URLSearchParams();
  if (query.from) qs.set('from', query.from);
  const q = qs.toString();
  return q ? `${STUDENT_REVIEW_PATH}?${q}` : STUDENT_REVIEW_PATH;
}

/**
 * @param {number} tutorId
 * @param {{ from?: string }} [query]
 */
export function tutorAccessPath(tutorId, query = {}) {
  const base = tutorSectionPath(tutorId, 'access');
  const qs = new URLSearchParams();
  if (query.from) qs.set('from', query.from);
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

/**
 * @param {number} roomId
 * @param {{ from?: string }} [query]
 */
export function studyRoomExposurePath(roomId, query = {}) {
  const base = studyRoomSectionPath(roomId, 'exposure');
  const qs = new URLSearchParams();
  if (query.from) qs.set('from', query.from);
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

/** @returns {string | null} `from` query on current hash */
export function getHandoffFromQuery() {
  return parseHashQuery().from || null;
}

/**
 * @param {'tutor'|'study_room'} role
 * @returns {{ href: string, label: string, screenId: string } | null}
 */
export function getProviderRegDeepLink(role) {
  if (role === 'tutor') {
    const tutor = getTutors().find((t) => t.profile_status === 'published') || getTutors()[0];
    if (!tutor) return null;
    return {
      href: tutorAccessPath(tutor.id, { from: 'review' }),
      label: '학생 접근·쪽지',
      screenId: 'P21-05',
    };
  }
  if (role === 'study_room') {
    const room = getStudyRooms().find((r) => r.profile_status === 'published') || getStudyRooms()[0];
    if (!room) return null;
    return {
      href: studyRoomExposurePath(room.id, { from: 'review' }),
      label: '노출·상담',
      screenId: 'P20-05',
    };
  }
  return null;
}
