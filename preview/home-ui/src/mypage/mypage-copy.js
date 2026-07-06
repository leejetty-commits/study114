/**
 * 15장 — 마이페이지 copy · 빈 상태 · 역할 강조
 * docs/ssot/15-mypage-structure.md §4-3-1 · §7 · §11
 * 빈 상태 정본(신규): docs/ssot/29-empty-error-permission-ux.md · empty-state-copy.js
 */

/** @typedef {'parent'|'study_room'|'tutor'} MypageRole */

/** §4-3-1 역할별 홈 상단 강조 */
export const HOME_EMPHASIS = {
  parent: '찜 · 최근열람 · 쪽지',
  study_room: '내 등록 · 노출 상태 · 상담 수용',
  tutor: '학생 접근·쪽지 · 메모권 · 매칭 가시성 · 미읽음 쪽지',
};

/** §15 역할 제한 패널 (Empty ✕ · onboarding guard) */
export const ONBOARDING_GUARD_COPY = {
  submissionParent: '공급자(과외쌤·공부방) 전용 · P15-10',
  submissionStudyRoom: '공부방 제출자료 UI는 1차 후순위(△) · 동일 원칙 적용',
};

/** @deprecated ONBOARDING_GUARD_COPY 사용 */
export const EMPTY_ONBOARDING = ONBOARDING_GUARD_COPY;

/** §7 학부모 P15-09 */
export const GUARDIAN_PLANS_COPY = {
  lead: '학부모는 상품 설명 열람만 · 구매·결제 UI 없음 (15장 §7)',
  body: 'Prime/Pick 기간형 · 쪽지권/열람권 횟수권은 공부방·과외쌤 유료 서비스입니다.',
  footnote: '18장 2026-07-07 잠금 · 18b 더미 단가',
};

export const HOME_STATS_NOTE = '15장 §4 · 숫자는 다음 CTA의 입력값입니다.';

export const WISHLIST_NOTE = '15장 §5 · 주 사용: 학부모 탐색 후속 · 공급자는 부기능';

export const RECENT_NOTE = '15장 §6 [임시] · 학부모: 공부방/과외 위주 · 공급자: 학생 의뢰 포함';

export const STUDENT_REVIEW_NOTE = '25장 §8 P25-S10 · 메모·쪽지 전 검토 · 비교·찜과 별개';

export const MESSAGES_SUMMARY_LEAD = 'P15-08 요약 → 16장 쪽지함 본문';

export const REGISTRATIONS_LEAD = '역할에 맞는 등록 유형으로 이동합니다. (19~21장 본문은 register-ui)';

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
