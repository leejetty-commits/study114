/**
 * 20장 — 공부방 운영 copy · 탭 · 쪽지설정 (횡단 SSOT)
 * docs/ssot/20-study-room-registration-management.md · P20-05 리뉴얼
 */

/** §3-3 P20-01 목록 탭 */
export const P20_LIST_TABS = [
  { key: 'all', label: '전체' },
  { key: 'draft', label: '저장' },
  { key: 'published', label: '공개중' },
  { key: 'hidden', label: '숨김' },
  { key: 'not_ready', label: '공개 준비 미완료' },
];

/** §3-3 금지 UI 문구 — 22장 · pending deprecated */
export const FORBIDDEN_UI_PHRASES = [
  '검토중',
  '반려',
  '보완 요청',
  '심사 대기',
  '검증 통과',
  '검증 실패',
  '추천 노출 후보',
  '인증쌤',
  '승인',
  'pending',
  '상담 가능',
  '상담 중지',
  '대기 문의 가능',
  '노출·상담',
];

/** §3-1 운영 단계 스테퍼 */
export const PHASE_STEPS = [
  { key: 'basic', label: '기본정보' },
  { key: 'detail', label: '상세정보' },
  { key: 'publish', label: '등록점검' },
  { key: 'inquiries', label: '쪽지설정' },
];

/** P20-05 OFF 사유 (운영자 선택) */
export const INQUIRY_OFF_REASONS = [
  { value: 'capacity_full', label: '정원 마감' },
  { value: 'paused', label: '잠시 쉼' },
];

/** §5 상세정보 상태 */
export const DETAIL_STATUS_LABELS = {
  basic_only: '기본만',
  expanded_in_progress: '상세 진행중',
  expanded_complete: '상세 완료',
};

/** §6 P20-02 상태판 블록 제목 */
export const P20_HUB_BLOCK_TITLES = {
  readiness: '공개 준비',
  publishStatus: '현재 공개 상태',
  exposureMatrix: '노출 가능 매트릭스',
  inquiryBoard: '쪽지설정',
  pickPrimeNudge: '픽·프라임 노출 준비',
};

/** 등록점검 상단 카피 정본: registration-check-copy.js */

/** P20-05 쪽지설정 — copy */
export const P20_INQUIRY_COPY = {
  pageTitle: '쪽지설정',
  pageLead: '지금 학부모의 쪽지 문의를 받을지 관리합니다. 공개 여부와는 별개입니다.',
  currentStatusHeading: '현재상태',
  cardDisplayTitle: '홈화면 카드표시',
  /** 카드 요약 2상태 */
  cardReceiving: '쪽지 받는 중',
  cardClosed: '지금은 쪽지 안 받음',
  switchLabel: '쪽지 받는 중',
  switchLead: '켜면 학부모가 쪽지로 문의할 수 있어요.',
  offReasonTitle: '안 받는 이유',
  contactBlockTitle: '기본 연락처 검증',
  contactVerified: '본인 핸드폰 인증 완료됨',
  contactNeeded: '본인 핸드폰 인증 필요함',
  contactNotice:
    '핸드폰번호는 외부에 공개되지 않으며, 우동공과 시스템 신뢰도를 강화하기 위한 인증입니다.',
  contactVerifyCta: '인증하기',
  verifyFirstHint: '쪽지를 받으려면 먼저 「기본 연락처 검증」에서 인증하기를 완료해 주세요.',
  previewTitle: '카드 미리보기',
  saveCta: '저장하기',
  phoneGateTitle: '기본 연락처 검증이 필요합니다',
  phoneGateBody:
    '학부모의 문의를 받기 시작하려면 휴대폰 검증이 필요합니다. 인증은 내부 신뢰도 점검을 위해서만 사용되며, 전화번호는 외부에 공개되지 않습니다.',
  phoneOtpLabel: '인증번호 6자리',
  phoneResendCta: '인증번호 다시 받기',
  footnotes: [
    '사용자 간의 연락은 쪽지로만 가능합니다.',
    '전화번호는 외부에 공개되지 않습니다.',
    '문의 수신 여부는 ‘쪽지설정’ 메뉴에서 관리합니다.',
  ],
};

/** P20-01 목록 헤더 */
export const P20_LIST_HEAD = {
  title: '공부방 운영',
  lead: '공부방별로 공개·쪽지 상태를 관리합니다.',
  registerCta: '+ 공부방 등록',
  notReadyBadge: '공개 준비 미완료',
  manageCta: '운영하기 →',
};

/** P20-02 · hub matrix 상품 안내 */
export const PRODUCT_APPLY = {
  eligible: '신청 가능',
  missing: (n) => `조건 ${n}개 부족`,
};

/** P20-02 관련 CTA */
export const P20_HUB_CTA = {
  studentReview: '찜한학생',
  messages: '쪽지함 열기',
};
