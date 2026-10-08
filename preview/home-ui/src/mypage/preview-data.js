/**
 * 15장 프리뷰 더미 — API 연동 전
 * @typedef {'parent'|'study_room'|'tutor'} MypageRole
 */

import { getAuthUser } from '../auth-session.js';
import { resolveAccountDisplayName } from '../auth/display-identity.js';
import { getWishlistIds } from '../user-actions-state.js';
import { getStudentReviewIds } from '../student-review-store.js';
import { getRecentViews } from './recent-store.js';
import { getMessagesSummaryCounts } from '../messages/screens.js';
import { getStudents, getStudentSummaryCounts } from '../student-reg/store.js';
import { studyRoomSectionPath } from '../study-room-reg/router.js';
import { tutorSectionPath, tutorHubPath } from '../tutor-reg/router.js';
import { getTutors, getTutorSummaryCounts, getPublishReadiness as getTutorPublishReadiness, getMemoCreditsRemaining } from '../tutor-reg/store.js';
import { getMatchingVisibility } from '../tutor-reg/format.js';
import { getStudyRooms, getStudyRoomSummaryCounts, getPublishReadiness } from '../study-room-reg/store.js';
import { inquiryStatusLabel } from '../study-room-reg/format.js';
import { exposureStatusLabel } from '../lifecycle-copy.js';
import {
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_VISIBILITY_LABELS,
} from './mypage-copy.js';
import { countWrittenReviewsPreview, countReceivedReviewsPreview } from '../provider-reviews/store.js';

const PREVIEW_PROFILE = {
  email: 'parent@example.com',
  name: '',
  regionLabel: '',
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
  const displayName = resolveAccountDisplayName(user);
  return {
    ...base,
    email: user.email || base.email,
    name: user.name || base.name,
    displayName,
    loginId: user.email || base.email,
    authRole: user.role_type || '',
    oauthProviderLabels: Array.isArray(user.oauth_provider_labels) ? user.oauth_provider_labels : [],
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
  const providerReviewCount =
    role === 'parent'
      ? countWrittenReviewsPreview(getAuthUser()?.user_id || 6)
      : countReceivedReviewsPreview(role === 'tutor' ? 'tutor' : 'study_room');

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
    providerReviewCount,
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
    return {
      text: '희망 조건 살펴보기',
      hint: '달라진 조건이 있다면 언제든 편하게 고칠 수 있어요.',
      path: '/mypage/registrations/students',
    };
  }

  if (role === 'study_room') {
    const rooms = getStudyRooms();
    const room = rooms[0];
    if (!room) {
      return {
        text: '첫 공부방 등록하기',
        hint: '기본등록을 마치면 카드가 바로 노출됩니다.',
        externalRegister: true,
        kind: 'study_room',
      };
    }
    const readiness = getPublishReadiness(room);
    const firstMiss = (readiness.items || []).find((i) => !i.ok);
    if (firstMiss) {
      return {
        text: `프로필 ${readiness.doneCount}/${readiness.totalCount} 채워짐`,
        hint: `다음: ${firstMiss.label}`,
        path: studyRoomSectionPath(room.id, firstMiss.section === 'publish' ? 'basic' : firstMiss.section),
      };
    }
    return {
      text: '공부방 카드 살펴보기',
      hint: '등록점검에서 카드 모습을 확인할 수 있습니다.',
      path: studyRoomSectionPath(room.id, 'publish'),
    };
  }

  if (role === 'tutor') {
    const tutors = getTutors();
    const draft = tutors.find((t) => t.profile_status === 'draft' || !getTutorPublishReadiness(t).canPublish);
    if (draft) {
      const r = getTutorPublishReadiness(draft);
      if (!r.canPublish) {
        return {
          text: '과외 프로필을 조금 더 채워보세요',
          hint: `기본등록 ${r.doneCount}/${r.totalCount}개 완료 · 다 채우면 카드가 노출됩니다.`,
          path: tutorSectionPath(draft.id, 'basic'),
        };
      }
      return {
        text: '내 과외 카드 살펴보기',
        hint: '등록점검에서 학생에게 보이는 모습을 확인할 수 있어요.',
        path: tutorSectionPath(draft.id, 'publish'),
      };
    }
    const published = tutors.find((t) => t.profile_status === 'published');
    if (published) {
      return {
        text: '학생 검토함과 쪽지 확인',
        hint: '저장해 둔 학생과 새로 도착한 소식을 살펴보세요.',
        path: tutorSectionPath(published.id, 'access'),
      };
    }
    return {
      text: '과외 운영 상태 확인',
      hint: '내 프로필과 노출 상태를 한눈에 살펴보세요.',
      path: tutors[0] ? tutorHubPath(tutors[0].id) : '/mypage/registrations/tutors',
    };
  }

  return { text: '마이페이지 둘러보기', path: '/mypage/home' };
}

/** students.exposure_status · 22§3 (profile_status.pending과 별개) */
export function statusLabel(status) {
  return exposureStatusLabel(status);
}

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

/** @param {Array<{ status: string }>} docs */
export function formatSubmissionDocSummary(docs) {
  const total = docs.length;
  const submitted = docs.filter((d) => d.status === 'submitted' || d.status === 'optional').length;
  const missing = docs.filter((d) => d.status === 'not_submitted').length;
  if (missing) return `제출 ${submitted}/${total} · 미제출 ${missing}`;
  return `제출 ${submitted}/${total}`;
}

/** @param {MypageRole} _role @returns {Array<{ key: string, label: string, status: string, visibility: string }>} */
export function getSubmissionDocs(_role) {
  return [];
}
