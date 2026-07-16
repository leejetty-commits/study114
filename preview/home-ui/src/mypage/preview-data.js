/**
 * 15장 프리뷰 더미 — API 연동 전
 * @typedef {'parent'|'study_room'|'tutor'} MypageRole
 */

import { getAuthUser } from '../auth-session.js';
import { getWishlistIds } from '../user-actions-state.js';
import { getStudentReviewIds } from '../student-review-store.js';
import { getRecentViews } from './recent-store.js';
import { getMessagesSummaryCounts } from '../messages/screens.js';
import { getStudents, getStudentSummaryCounts } from '../student-reg/store.js';
import { studentSectionPath } from '../student-reg/router.js';
import { studyRoomSectionPath, studyRoomHubPath } from '../study-room-reg/router.js';
import { tutorSectionPath, tutorHubPath } from '../tutor-reg/router.js';
import { getTutors, getTutorSummaryCounts, getPublishReadiness as getTutorPublishReadiness, getMemoCreditsRemaining } from '../tutor-reg/store.js';
import { getMatchingVisibility } from '../tutor-reg/format.js';
import { getStudyRooms, getStudyRoomSummaryCounts } from '../study-room-reg/store.js';
import { inquiryStatusLabel } from '../study-room-reg/format.js';
import { exposureStatusLabel } from '../lifecycle-copy.js';
import {
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_VISIBILITY_LABELS,
} from './mypage-copy.js';

const PREVIEW_PROFILE = {
  email: 'parent@example.com',
  name: '김우동',
  regionLabel: '서울특별시 강남구 대치동',
};

/** @type {Record<MypageRole, { students: object[], studyRooms: object[], tutors: object[] }>} */
const REGISTRATIONS = {
  parent: {
    get students() {
      return getStudents().map((s) => ({
        id: s.id,
        public_display_name: s.public_display_name,
        grade_level: s.grade_level,
        exposure_status: s.exposure_status,
      }));
    },
    studyRooms: [],
    tutors: [],
  },
  study_room: {
    get students() {
      return [];
    },
    get studyRooms() {
      return getStudyRooms().map((r) => ({
        id: r.id,
        study_room_name: r.study_room_name,
        profile_status: r.profile_status,
        detail_completion_status: r.detail_completion_status,
        prime_eligible: r.prime_eligible,
      }));
    },
    tutors: [],
  },
  tutor: {
    students: [],
    studyRooms: [],
    get tutors() {
      return getTutors().map((t) => ({
        id: t.id,
        tutor_display_name: t.tutor_display_name,
        profile_status: t.profile_status,
        detail_completion_status: t.detail_completion_status,
        prime_eligible: t.detail_completion_status === 'expanded_complete',
      }));
    },
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
  const base = { ...PREVIEW_PROFILE, role };
  const user = getAuthUser();
  if (!user) return base;
  return {
    ...base,
    email: user.email || base.email,
    name: user.name || base.name,
    loginId: user.email || base.email,
    authRole: user.role_type || '',
  };
}

/** @param {MypageRole} role */
export function getRegistrationData(role) {
  return REGISTRATIONS[role] || REGISTRATIONS.parent;
}

/** @param {MypageRole} role */
export function getSummaryCounts(role) {
  const reg = getRegistrationData(role);
  let published;
  let draft;
  let hidden = 0;

  if (role === 'parent') {
    const sc = getStudentSummaryCounts();
    published = sc.published;
    draft = sc.draft;
    hidden = sc.hidden;
  } else if (role === 'study_room') {
    const sc = getStudyRoomSummaryCounts();
    published = sc.published;
    draft = sc.draft;
    hidden = sc.hidden;
  } else if (role === 'tutor') {
    const sc = getTutorSummaryCounts();
    published = sc.published;
    draft = sc.draft;
    hidden = sc.hidden;
  } else {
    published = reg.tutors.filter((t) => t.profile_status === 'published').length;
    draft = reg.tutors.filter((t) => t.profile_status === 'draft').length;
  }

  const wishlistCount = getWishlistIds('study_room').length + getWishlistIds('tutor').length;
  const studentReviewCount = getStudentReviewIds().length;
  const recentCount = getRecentViews(role).length;

  let inquiryLabel = null;
  let matchingLabel = null;
  let memoCredits = null;

  if (role === 'study_room') {
    const pub = getStudyRooms().find((r) => r.profile_status === 'published');
    inquiryLabel = pub ? inquiryStatusLabel(pub.inquiry_status) : '—';
  }
  if (role === 'tutor') {
    const tutor = getTutors().find((t) => t.profile_status === 'published') || getTutors()[0];
    matchingLabel = tutor ? getMatchingVisibility(tutor).status : '—';
    memoCredits = getMemoCreditsRemaining();
  }

  return {
    published,
    draft,
    hidden,
    wishlist: wishlistCount,
    unreadMessages: messageCounts().unread,
    activeThreads: messageCounts().active,
    paidDaysLeft: role === 'parent' ? null : 12,
    recentCount,
    studentReviewCount,
    inquiryLabel,
    matchingLabel,
    memoCredits,
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
        path: studentSectionPath(draft.id, 'publish'),
      };
    }
    return { text: '희망 조건 수정하기', hint: '19장', path: '/mypage/registrations/students' };
  }

  if (role === 'study_room') {
    const rooms = getStudyRooms();
    const room = rooms[0];
    if (!room || room.detail_completion_status !== 'expanded_complete') {
      return {
        text: '상세등록 완료하고 Pick/Prime 노출',
        hint: 'detail_completion_status · P20-03b',
        path: room ? studyRoomSectionPath(room.id, 'detail') : '/mypage/registrations/study-rooms',
      };
    }
    const hub = studyRoomHubPath(room.id);
    return { text: '운영 상태 확인하기', hint: 'P20-02 상태판', path: hub };
  }

  if (role === 'tutor') {
    const tutors = getTutors();
    const draft = tutors.find((t) => t.profile_status === 'draft' || !getTutorPublishReadiness(t).canPublish);
    if (draft) {
      const r = getTutorPublishReadiness(draft);
      if (!r.canPublish) {
        return {
          text: '기본·상세 보강 후 공개하기',
          hint: `공개 준비 ${r.doneCount}/${r.totalCount} · P21-03`,
          path: tutorSectionPath(draft.id, 'basic'),
        };
      }
      return {
        text: '미리보기·공개하기',
        hint: 'profile_status: draft',
        path: tutorSectionPath(draft.id, 'publish'),
      };
    }
    const published = tutors.find((t) => t.profile_status === 'published');
    if (published) {
      return {
        text: '학생 접근·쪽지 확인',
        hint: 'P21-05 · 16§8',
        path: tutorSectionPath(published.id, 'access'),
      };
    }
    return {
      text: '과외 운영 상태 확인',
      hint: 'P21-02 상태판',
      path: tutors[0] ? tutorHubPath(tutors[0].id) : '/mypage/registrations/tutors',
    };
  }

  return { text: '마이페이지 둘러보기', path: '/mypage/home' };
}

/** students.exposure_status · 22§3 (profile_status.pending과 별개) */
export function statusLabel(status) {
  return exposureStatusLabel(status);
}

/** 21장 · P15-10 제출자료 항목 (프리뷰 더미) */
export const SUBMISSION_DOC_ITEMS = [
  { key: 'identity', label: '본인 확인 자료', status: 'submitted', visibility: 'self_only' },
  { key: 'education', label: '학력 자료', status: 'submitted', visibility: 'public' },
  { key: 'career', label: '경력 자료', status: 'optional', visibility: 'public' },
  { key: 'certificate', label: '자격증', status: 'not_submitted', visibility: 'private' },
];

const SUBMISSION_STATUS_LABELS_LOCAL = SUBMISSION_STATUS_LABELS;
const SUBMISSION_VISIBILITY_LABELS_LOCAL = SUBMISSION_VISIBILITY_LABELS;

/** @param {string} status */
export function submissionDocStatusLabel(status) {
  return SUBMISSION_STATUS_LABELS_LOCAL[status] || status;
}

/** @param {string} visibility */
export function submissionDocVisibilityLabel(visibility) {
  return SUBMISSION_VISIBILITY_LABELS_LOCAL[visibility] || visibility;
}

/** @param {typeof SUBMISSION_DOC_ITEMS} docs */
export function formatSubmissionDocSummary(docs) {
  const total = docs.length;
  const submitted = docs.filter((d) => d.status === 'submitted' || d.status === 'optional').length;
  const missing = docs.filter((d) => d.status === 'not_submitted').length;
  if (missing) return `제출 ${submitted}/${total} · 미제출 ${missing}`;
  return `제출 ${submitted}/${total}`;
}

/** @param {MypageRole} role */
export function getSubmissionDocs(role) {
  if (role !== 'tutor') return [];
  return SUBMISSION_DOC_ITEMS;
}
