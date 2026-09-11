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

/** P20-05 OFF 사유 (운영자 선택) — 정책값 유지, 화면만 과외쌤과 같은 포맷 */
export const INQUIRY_OFF_REASONS = [
  {
    value: 'paused',
    label: '잠시 쉼',
    hint: '일시 중단입니다. 나중에 다시 받을 수 있습니다.',
  },
  {
    value: 'capacity_full',
    label: '정원 마감',
    hint: '정원이 가득 찬 상태입니다. 잠시 쉼이 아닙니다.',
  },
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
  pageLead: '지금 학부모 쪽지를 받을지 확인하고, 필요하면 바꾼 뒤 저장합니다.',
  currentStatusHeading: '현재상태',
  badgeReceiving: '지금은 쪽지 받는 중',
  badgeClosed: '지금은 쪽지 안받음',
  storedOpen: '저장값: 쪽지 받는 중',
  storedPaused: '저장값: 쪽지 안받음 · 잠시 쉼',
  storedCapacityFull: '저장값: 쪽지 안받음 · 정원 마감',
  cardDisplayTitle: '홈화면 카드표시',
  cardReceiving: '쪽지 받는 중',
  cardClosed: '지금은 쪽지 안 받음',
  editHeading: '현재상태 수정',
  receiving: '쪽지 받는 중',
  closed: '쪽지 안받음',
  switchLabel: '쪽지 받는 중',
  switchLead: '켜면 학부모가 쪽지로 문의할 수 있어요.',
  offReasonTitle: '안받는 이유',
  offReasonHint: '쪽지 안받음이면 이유를 고른 뒤 저장합니다. 이유마다 서버 상태값이 다릅니다.',
  offReasonRequired: '쪽지 안받음으로 저장하려면 이유를 선택해 주세요.',
  contactHeading: '기본 연락처 검증',
  contactBlockTitle: '기본 연락처 검증',
  contactVerified: '인증 완료',
  contactNeeded: '인증이 필요합니다',
  contactVerifiedLead: '인증이 끝났습니다. 전화번호는 외부에 공개되지 않습니다.',
  contactNeededLead: '처음 쪽지 받는 중으로 바꿀 때는 본인 핸드폰 인증이 먼저 필요합니다.',
  contactNotice: '인증은 시스템 신뢰 확인용이며, 전화번호는 외부에 공개되지 않습니다.',
  contactVerifyCta: '핸드폰 인증하기',
  verifyFirstHint: '쪽지 받는 중으로 저장하려면 먼저 기본 연락처 검증을 완료해 주세요.',
  saveFailed: '저장에 실패했습니다. 화면은 마지막 서버값으로 되돌립니다.',
  previewTitle: '쪽지 설정시 카드 샘플',
  sampleTitle: '쪽지 설정시 카드 샘플',
  sampleLead: '홈과 같은 실제 BASIC 카드입니다. 화살표가 쪽지 관련 표시 위치를 가리킵니다.',
  sampleOpenKicker: '쪽지 받는 중',
  sampleClosedKicker: '쪽지 안받음',
  sampleOpenCallout: '여기가 쪽지 관련 표시 위치입니다. 받는 중이면 ✉가 활성입니다.',
  sampleClosedCallout: '여기가 쪽지 관련 표시 위치입니다. 안받음이면 ✉가 비활성입니다.',
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
