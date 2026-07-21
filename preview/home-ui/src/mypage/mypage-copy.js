/**
 * 15장 — 마이페이지 copy · 빈 상태 · 역할 강조
 * docs/ssot/15-mypage-structure.md §4-3-1 · §7 · §11
 * 빈 상태 정본(신규): docs/ssot/29-empty-error-permission-ux.md · empty-state-copy.js
 */

/** @typedef {'parent'|'study_room'|'tutor'} MypageRole */

/** §4-3-1 역할별 홈 상단 강조 */
export const HOME_EMPHASIS = {
  parent: '찜한 곳과 새 소식을 가볍게 확인해 보세요.',
  study_room: '공개 상태와 학생 소식을 한눈에 모았어요.',
  tutor: '프로필, 관심 학생, 새 쪽지를 한곳에서 확인하세요.',
};

/** §15 역할 제한 패널 (Empty ✕ · onboarding guard) */
export const ONBOARDING_GUARD_COPY = {
  submissionParent: '제출자료 관리는 과외쌤과 공부방 계정에서 이용할 수 있어요.',
  submissionStudyRoom: '공부방 제출자료 UI는 1차 후순위(△) · 동일 원칙 적용',
};

/** @deprecated ONBOARDING_GUARD_COPY 사용 */
export const EMPTY_ONBOARDING = ONBOARDING_GUARD_COPY;

/** §7 학부모 P15-09 */
export const GUARDIAN_PLANS_COPY = {
  lead: '학부모 계정은 상품 안내를 볼 수 있으며 구매 기능은 제공하지 않아요.',
  body: '대표 노출·추천 노출과 쪽지권·열람권은 공부방과 과외쌤을 위한 유료 서비스입니다.',
  footnote: '상품 구성과 가격은 상품 안내에서 확인할 수 있어요.',
};

export const HOME_STATS_NOTE = '내 상태는 활동에 따라 달라져요.';

export const WISHLIST_NOTE = '15장 §5 · 주 사용: 학부모 탐색 후속 · 공급자는 부기능';

export const RECENT_NOTE = '15장 §6 [임시] · 학부모: 공부방/과외/학생(비교열람) · 공급자: 학생 의뢰 포함';

export const STUDENT_REVIEW_NOTE = '관심 있는 학생을 저장해 두고, 준비가 되었을 때 연락을 이어가세요.';

export const MESSAGES_SUMMARY_LEAD = '새 쪽지와 진행 중인 대화를 한곳에서 확인하세요.';

export const REGISTRATIONS_LEAD = '현재 등록 상태를 확인하고 필요한 정보만 이어서 수정하세요.';

/** §2-1 P15-10 제출 상태 라벨 (22§7 · 심사 UX ✕) */
export const SUBMISSION_STATUS_LABELS = {
  not_submitted: '미제출',
  submitted: '제출함',
  optional: '선택 제출',
};

export const SUBMISSION_VISIBILITY_LABELS = {
  private: '비공개',
  public: '공개함',
  self_only: '본인 확인용',
  partial: '일부 공개',
};

/** @param {MypageRole} role @returns {string[]} stat keys to emphasize on P15-01 */
export function homeEmphasisStatKeys(role) {
  if (role === 'parent') return ['wishlist', 'unreadMessages', 'recentCount'];
  if (role === 'study_room') return ['published', 'inquiryLabel', 'paidDaysLeft', 'studentReviewCount'];
  if (role === 'tutor') return ['unreadMessages', 'memoCredits', 'matchingLabel', 'studentReviewCount', 'paidDaysLeft'];
  return [];
}
