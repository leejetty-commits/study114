/**
 * 28장 — 관리자 운영 콘솔 RED LINE · 허용/금지 조치 · 용어 매핑
 * SSOT: docs/ssot/28-admin-console-red-line.md (2026-07-06 정책 2차 잠금)
 */

/** §0·§13 최종 원칙 */
export const ADMIN_RED_LINE_PRINCIPLE =
  '운영 조치는 할 수 있지만, 그 조치가 사용자에게 심사·보증·인증처럼 보이게 만들지는 않는다.';

export const PLATFORM_ROLE_SUMMARY =
  '우동공과는 인증기관이 아니라, 신뢰 판단에 도움이 되는 메커니즘을 제공하는 연결 플랫폼이다.';

/** §0-2 플랫폼이 하는 것 */
export const PLATFORM_DOES = [
  '공부방·과외쌤·학생/학부모 정보 등록·공개 지원',
  '신뢰 판단에 도움이 되는 제출자료 항목·공개 메커니즘',
  '신고·안전·허위/도용 의심 시 최소 운영 조치',
];

/** §0-3 플랫폼이 하지 않는 것 */
export const PLATFORM_DOES_NOT = [
  '운영자 심사·승인·반려',
  '제출자료 진위 공식 인증',
  '검증 완료·인증됨·공식 확인 등 보증 상태 부여',
  '소비자 대신 최종 진위 판단',
];

/** §1 운영자 허용 조치 */
export const ALLOWED_OPERATOR_ACTIONS = [
  '프로필/게시 정보 숨김 처리',
  '쪽지/접촉 기능 일시 제한 또는 차단',
  '검색/노출 상태 수동 보정',
  '잘못 부여된 권한 운영 보정',
  '신고 접수 후 임시 보호 조치',
  '공지/가이드 게시 및 수정',
  '운영 기록 열람 및 로그 확인',
];

/** §2 운영자 금지 조치 */
export const FORBIDDEN_OPERATOR_ACTIONS = [
  '승인 / 반려 / 심사 통과 처리',
  '검증 완료 / 인증쌤 / 신뢰도 점수 등 공식 보증·등급 부여',
  '제출자료 근거 공식 인증 상태 지정',
  '사용자-facing에 운영자 판단을 심사 결과처럼 노출',
  '제출자료에 대해 운영자가 진위 최종 확인자처럼 행동하는 구조',
];

/** §3-1 제출자료 내부 확인 허용 목적 */
export const SUBMISSION_DOC_INTERNAL_PURPOSES = [
  '신고 대응',
  '도용/불법/명백한 허위 의심 대응',
  '분쟁성 이슈 확인',
  '서비스 안전상 필요한 최소 사실 확인',
];

/** §3-5 내부 확인 → 사용자 화면 번역 금지 */
export const FORBIDDEN_USER_FACING_FROM_INTERNAL_REVIEW = [
  '검증 완료',
  '인증됨',
  '플랫폼 확인 완료',
  '운영자 확인 완료',
  '공식 인증',
];

/** §4 사용자-facing 가능 표현 (등록·공개 사실) */
export const SUBMISSION_DOC_ALLOWED_USER_LABELS = [
  '사업자등록증 공개',
  '졸업증명서 공개',
  '성적증명서 공개',
  '제출자료 N개 공개',
  '신뢰정보 공개',
  '등록된 항목 N개',
  '공개된 제출자료 N개',
];

/** §4 사용자-facing 금지 표현 */
export const SUBMISSION_DOC_FORBIDDEN_USER_LABELS = [
  '검증 완료',
  '인증됨',
  '공식 인증',
  '운영자 확인 완료',
  '플랫폼 보증',
  '신뢰도 점수',
  '인증쌤',
];

/** §4 제출자료 안내 문구 */
export const SUBMISSION_DOC_USER_NOTICE = {
  lead: '제출자료는 등록자가 공개한 참고 정보입니다.',
  body: '우동공과는 해당 서류를 인증하거나 보증하지 않으며, 중요한 서류는 필요한 경우 발급기관 기준으로 직접 다시 확인해 주세요.',
};

/** §5-1 문의 */
export const INQUIRY_QUEUE = {
  id: 'inquiry',
  label: '문의',
  scope: ['서비스 이용', '정책', '버그', '운영 문의'],
  handling: '답변/안내 중심',
};

/** §5-2 신고 */
export const REPORT_QUEUE = {
  id: 'report',
  label: '신고',
  scope: [
    '허위 정보',
    '도용',
    '부적절한 접촉',
    '안전 이슈',
    '약관 위반 의심',
    '사기/위험 정황',
  ],
  handling: '숨김·접촉 제한·노출 제한·임시 보호 조치 연결',
};

/** §6-3 P17-admin → A28 이관 순서 */
export const A28_MIGRATION_ORDER = [
  { phase: 'current', target: 'P17-admin', note: '공지·문의 프리뷰만 · 임시 운영 화면' },
  { phase: 1, target: 'A28-04', note: '신고 처리 분리 (내부 제재/보호 우선)' },
  { phase: 2, target: 'A28-05', note: '공지·가이드 관리 분리' },
  { phase: 3, target: 'A28-02/03/06/07/08', note: '회원·제출자료·권한·로그 확장' },
];

/** §6 A28 정책 — 내부 전용 */
export const A28_POLICY = {
  internalOnly: true,
  notUserFacing: true,
  doNotMixWithCustomerCenter: true,
  routeAuthSplit: '기술 후속 — 정책 잠금 본질 아님',
};

/**
 * §8 사용자-facing 금지어 → 대체어
 * @type {Record<string, string>}
 */
export const RED_LINE_TERM_MAP = {
  승인: '공개중 / 처리됨 / 반영됨',
  반려: '수정 필요 / 입력 필요 / 공개 준비 미완료',
  '검증 완료': '제출자료 공개',
  인증쌤: '신뢰정보 공개',
  'pending 심사': '저장중 / 공개 전 확인 필요',
  '검수 대기': '저장중 / 공개 전 확인 필요',
  '플랫폼 심사 통과': '공개 조건 충족',
  '운영자 확인 완료': '표시하지 않음',
  '공식 인증': '표시하지 않음',
  '신뢰도 점수': '표시하지 않음 / 신뢰정보 N개 공개',
};

export const FORBIDDEN_USER_FACING_TERMS = Object.keys(RED_LINE_TERM_MAP);

/** §9 운영 로그 최소 필드 */
export const OPERATION_LOG_MIN_FIELDS = [
  'acted_at',
  'operator_id',
  'target_type',
  'target_id',
  'action_kind',
  'reason_category',
  'detail_memo',
  'reversible',
  'revert_history',
  'user_notified',
];

export const OPERATION_LOG_PURPOSE =
  '내부 사실 기록이지, 사용자에게 심사 결과를 보여주기 위한 구조가 아니다.';

/** §10 사용자 알림 — 조치별 기본 정책 */
export const USER_NOTIFICATION_BY_ACTION = {
  hide_profile: { defaultNotify: true, example: '숨김 처리되었습니다' },
  restrict_messages: { defaultNotify: true, example: '현재 일부 기능 이용이 제한됩니다' },
  direct_usage_impact: { defaultNotify: true, example: null },
  exposure_correction: { defaultNotify: false, example: null },
  submission_hide: { defaultNotify: true, example: '숨김 처리되었습니다' },
  submission_expose: { defaultNotify: false, example: null },
  internal_reconciliation: { defaultNotify: false, example: null },
  internal_record_cleanup: { defaultNotify: false, example: null },
};

/**
 * §3-b A28-07 — API action · 로그 · 알림 잠금 (SSOT: 28장 §3-b)
 * UI 라벨은 a28-copy.js `A28_EXPOSURE_*` · 구현: AdminExposureService
 */
export const A28_07_TARGET_TYPES = ['study_room', 'tutor', 'submission'];

export const A28_07_API_ACTIONS = ['hide', 'publish', 'inquiry_status'];

export const A28_07_INQUIRY_STATUSES = ['open', 'paused', 'capacity_full', 'waiting_only'];

/** @type {Record<string, string>} DB status → 운영 UI 라벨 */
export const A28_07_STATUS_LABELS = {
  published: '공개중',
  hidden: '숨김',
  draft: '비공개',
  submitted: '제출됨',
};

/** @type {Record<string, { actionKind: string, userNotified: boolean, logTargetType: string }>} */
export const A28_07_ACTION_LOG_MAP = {
  'hide:study_room': { actionKind: 'hide_profile', userNotified: true, logTargetType: 'study_room' },
  'hide:tutor': { actionKind: 'hide_profile', userNotified: true, logTargetType: 'tutor' },
  'hide:submission': { actionKind: 'submission_hide', userNotified: true, logTargetType: 'board_post' },
  'publish:study_room': { actionKind: 'exposure_correction', userNotified: false, logTargetType: 'study_room' },
  'publish:tutor': { actionKind: 'exposure_correction', userNotified: false, logTargetType: 'tutor' },
  'publish:submission': { actionKind: 'submission_expose', userNotified: false, logTargetType: 'board_post' },
  'inquiry_status:study_room': { actionKind: 'exposure_correction', userNotified: false, logTargetType: 'study_room' },
};

/** A28-06 큐 API와 분리 — submitted→published는 A28-06만, A28-07은 published/hidden 보정 */
export const A28_07_A28_06_BOUNDARY =
  'A28-06=submitted 큐 확인·노출 반영 · A28-07=published/hidden 수동 보정 · submitted publish API 거부';

/** §10 알림 문구 금지 */
export const FORBIDDEN_USER_NOTIFICATION_TERMS = [
  '승인되었습니다',
  '반려되었습니다',
  '검토 완료',
  '인증되었습니다',
  '심사 통과',
  '인증 완료',
];

/** §10 알림 문구 가능 예 */
export const ALLOWED_USER_NOTIFICATION_EXAMPLES = [
  '숨김 처리되었습니다',
  '현재 일부 기능 이용이 제한됩니다',
  '공개 전 확인이 필요한 항목이 있습니다',
];

/** §11 혼용 금지 쌍 */
export const DO_NOT_CONFLATE = [
  { a: '신고 대응', b: '심사', note: '심사 구조 없음' },
  { a: '제출자료 공개', b: '인증', note: '플랫폼이 인증하지 않음' },
  { a: '내부 확인', b: '사용자 보증', note: '보증하지 않음' },
  { a: '플랫폼 연결 역할', b: '기관 인증 역할', note: '발급기관 책임' },
];

/**
 * @param {string} text
 * @returns {string|null}
 */
export function findForbiddenUserFacingTerm(text) {
  const s = String(text ?? '');
  const lists = [
    FORBIDDEN_USER_FACING_TERMS,
    FORBIDDEN_USER_FACING_FROM_INTERNAL_REVIEW,
    SUBMISSION_DOC_FORBIDDEN_USER_LABELS,
    FORBIDDEN_USER_NOTIFICATION_TERMS,
  ];
  for (const list of lists) {
    for (const term of list) {
      if (s.includes(term)) return term;
    }
  }
  return null;
}
