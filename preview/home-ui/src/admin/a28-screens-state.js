/**
 * Shared A28 screen UI state + labels — so render/bind can split safely.
 * Rollback: git revert the a28 split commit(s).
 */

export const STATUS_KO = { active: '사용', hidden: '숨김', archived: '보관' };
export const VIS_KO = { public: '전체 공개', login: '로그인 후', role: '역할 제한' };
export const DL_KO = { none: '불가', public: '전체', login: '로그인 후', role: '역할 제한', admin: '관리자만' };
export const SEL_KO = { curated: '직접 고름', latest: '최신순', mixed: '혼합' };
export const MOBILE_KO = { stack: '아래로 쌓기', collapse: '접기', hide: '숨김' };
export const SOURCE_KO = { board: '게시판', static: '고정문', mixed: '혼합' };
export const ORDER_STATUS_KO = {
  pending: '결제 대기',
  paid: '결제 완료',
  failed: '결제 실패',
  cancelled: '취소',
  refunded: '환불',
};
export const SMS_STATUS_KO = {
  preview: '미리보기',
  queued: '발송 대기',
  sent: '발송 완료',
  failed: '발송 실패',
};

/**
 * Mutable UI filters/selection. Reassign fields via `a28Ui.x = ...` (not free `let` rebinding).
 * @type {{
 *   memberFilters: { q: string, status: string, role_type: string },
 *   channelFilters: { q: string, status: string, sectionOwner: string },
 *   openSectionAccessId: string|null,
 *   openMemberId: number|null,
 * }}
 */
export const a28Ui = {
  memberFilters: { q: '', status: 'all', role_type: 'all' },
  channelFilters: { q: '', status: 'all', sectionOwner: 'all' },
  openSectionAccessId: null,
  openMemberId: null,
};

export const A28_MEMBER_SEED = [
  {
    id: 1,
    email: 'parent@example.com',
    name: '김학부모',
    phone: '010-1111-2222',
    status: 'active',
    primaryRole: 'guardian_student',
    emailVerified: true,
    oauthLinked: false,
    subscriptionTier: 'free',
    activePositions: 0,
    studyRoomCount: 0,
    tutorCount: 0,
    studentCount: 2,
    lastLoginAt: '2026-07-15 10:00:00',
    createdAt: '2026-01-10 09:00:00',
    isMaster: false,
  },
  {
    id: 2,
    email: 'room@example.com',
    name: '이공부방',
    phone: '010-3333-4444',
    status: 'active',
    primaryRole: 'study_room_owner',
    emailVerified: true,
    oauthLinked: true,
    subscriptionTier: 'paid',
    activePositions: 1,
    studyRoomCount: 1,
    tutorCount: 0,
    studentCount: 0,
    lastLoginAt: '2026-07-16 18:22:00',
    createdAt: '2026-02-01 11:00:00',
    isMaster: false,
  },
  {
    id: 3,
    email: 'tutor@example.com',
    name: '박과외',
    phone: '010-5555-6666',
    status: 'pending',
    primaryRole: 'tutor',
    emailVerified: false,
    oauthLinked: false,
    subscriptionTier: 'free',
    activePositions: 0,
    studyRoomCount: 0,
    tutorCount: 1,
    studentCount: 0,
    lastLoginAt: '2026-07-14 09:11:00',
    createdAt: '2026-03-20 14:00:00',
    isMaster: false,
  },
];
