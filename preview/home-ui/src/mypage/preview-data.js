/**
 * 15장 프리뷰 더미 — API 연동 전
 * @typedef {'parent'|'study_room'|'tutor'} MypageRole
 */

import { getWishlistIds } from '../user-actions-state.js';
import { getRecentViews } from './recent-store.js';
import { getMessagesSummaryCounts } from '../messages/screens.js';

const PREVIEW_PROFILE = {
  email: 'parent@example.com',
  name: '김우동',
  regionLabel: '서울특별시 강남구 대치동',
};

/** @type {Record<MypageRole, { students: object[], studyRooms: object[], tutors: object[] }>} */
const REGISTRATIONS = {
  parent: {
    students: [
      { id: 1, public_display_name: '맑은하늘', grade_level: '중2', exposure_status: 'published' },
      { id: 2, public_display_name: '초등왕', grade_level: '초5', exposure_status: 'draft' },
    ],
    studyRooms: [],
    tutors: [],
  },
  study_room: {
    students: [],
    studyRooms: [
      {
        id: 1,
        study_room_name: '우동공과 대치점',
        profile_status: 'published',
        detail_completion_status: 'expanded_in_progress',
        prime_eligible: false,
      },
      { id: 2, study_room_name: '임시 공부방', profile_status: 'draft', detail_completion_status: 'basic_only', prime_eligible: false },
    ],
    tutors: [],
  },
  tutor: {
    students: [],
    studyRooms: [],
    tutors: [
      {
        id: 1,
        tutor_display_name: '김수학',
        profile_status: 'published',
        detail_completion_status: 'expanded_complete',
        verification_status: 'pending',
        prime_eligible: true,
      },
    ],
  },
};

const MESSAGE_PREVIEW = { unread: 2, active: 1 };

function messageCounts() {
  try {
    return getMessagesSummaryCounts();
  } catch {
    return MESSAGE_PREVIEW;
  }
}

/** @param {MypageRole} role */
export function getPreviewProfile(role) {
  return { ...PREVIEW_PROFILE, role };
}

/** @param {MypageRole} role */
export function getRegistrationData(role) {
  return REGISTRATIONS[role] || REGISTRATIONS.parent;
}

/** @param {MypageRole} role */
export function getSummaryCounts(role) {
  const reg = getRegistrationData(role);
  const published =
    role === 'parent'
      ? reg.students.filter((s) => s.exposure_status === 'published').length
      : role === 'study_room'
        ? reg.studyRooms.filter((r) => r.profile_status === 'published').length
        : reg.tutors.filter((t) => t.profile_status === 'published').length;
  const draft =
    role === 'parent'
      ? reg.students.filter((s) => s.exposure_status === 'draft').length
      : role === 'study_room'
        ? reg.studyRooms.filter((r) => r.profile_status === 'draft').length
        : reg.tutors.filter((t) => t.profile_status === 'draft').length;

  const wishlistCount = getWishlistIds('study_room').length + getWishlistIds('tutor').length;

  return {
    published,
    draft,
    wishlist: wishlistCount,
    unreadMessages: messageCounts().unread,
    activeThreads: messageCounts().active,
    paidDaysLeft: role === 'parent' ? null : 12,
    recentCount: getRecentViews(role).length,
  };
}

/** @param {MypageRole} role */
export function getPrimaryCta(role) {
  const reg = getRegistrationData(role);
  const counts = getSummaryCounts(role);

  if (role === 'parent') {
    if (reg.students.length === 0) {
      return {
        text: '자녀 기본등록 이어하기',
        hint: 'students 0건 · 15장 §11',
        path: '/mypage/registrations/students',
      };
    }
    const draft = reg.students.find((s) => s.exposure_status === 'draft');
    if (draft) {
      return {
        text: `「${draft.public_display_name}」 의뢰 공개하기`,
        hint: 'exposure_status: draft',
        path: '/mypage/registrations/students',
      };
    }
    return { text: '희망 조건 수정하기', hint: '19장', path: '/mypage/registrations/students' };
  }

  if (role === 'study_room') {
    const room = reg.studyRooms[0];
    if (!room || room.detail_completion_status !== 'expanded_complete') {
      return {
        text: '상세등록 완료하고 Pick/Prime 노출',
        hint: 'detail_completion_status',
        path: null,
        externalRegister: true,
        kind: 'study_room',
      };
    }
    return { text: '노출 상태 확인하기', path: '/mypage/registrations/study-rooms' };
  }

  if (role === 'tutor') {
    return {
      text: '증빙·유료등록 → 학생 메모 권한',
      hint: '18·21장',
      path: '/mypage/plans',
    };
  }

  return { text: '마이페이지 둘러보기', path: '/mypage/home' };
}

export function statusLabel(status) {
  const map = {
    draft: '임시저장',
    published: '공개중',
    hidden: '숨김',
    pending: '검토중',
  };
  return map[status] || status;
}
