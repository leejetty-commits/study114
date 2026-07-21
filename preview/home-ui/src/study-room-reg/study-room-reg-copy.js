/**
 * 20장 — 공부방 운영 copy · 탭 · inquiry · 매트릭스 라벨 (횡단 SSOT)
 * docs/ssot/20-study-room-registration-management.md §3-3 · §4-3 · §6 · §7
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
];

/** §3-1 운영 단계 스테퍼 */
export const PHASE_STEPS = [
  { key: 'basic', label: '기본정보' },
  { key: 'detail', label: '상세정보' },
  { key: 'publish', label: '미리보기·공개' },
  { key: 'exposure', label: '노출·상담' },
];

/** §4-3 inquiry_status 라벨 */
export const INQUIRY_STATUS_LABELS = {
  open: '상담 가능',
  paused: '상담 중지',
  capacity_full: '정원 마감',
  waiting_only: '대기 문의 가능',
};

/** §5 상세등록 상태 */
export const DETAIL_STATUS_LABELS = {
  basic_only: '기본만',
  expanded_in_progress: '상세 진행중',
  expanded_complete: '상세 완료',
};

/** §4-3 · P20-05 inquiry 선택 */
export const INQUIRY_OPTIONS = [
  { value: 'open', label: '상담 가능', desc: '문의·쪽지 CTA 정상' },
  { value: 'paused', label: '상담 중지', desc: '노출 유지 · 신규 문의 제한' },
  { value: 'capacity_full', label: '정원 마감', desc: '자리 없음 안내' },
  { value: 'waiting_only', label: '대기 문의 가능', desc: '대기자 문의만 수용' },
];

/** 추천 노출·대표 노출 신청 상태 안내 */
export const PRODUCT_APPLY = {
  eligible: '신청 가능',
  missing: (n) => `조건 ${n}개 부족`,
};

/** §6 P20-02 상태판 블록 제목 */
export const P20_HUB_BLOCK_TITLES = {
  readiness: '공개 준비',
  publishStatus: '현재 공개 상태',
  exposureMatrix: '노출 가능 매트릭스',
  inquiryBoard: '상담 수용 상태',
};

/** §7-1 P20-05 섹션 제목 */
export const P20_EXPOSURE_SECTION_TITLES = {
  searchCompare: '검색·비교·지역 노출',
  inquiry: '상담 수용 상태 (inquiry_status)',
  capacity: '정원/대기 문의',
  plans: '대표/추천 노출 상품',
  messages: '쪽지함 (보조)',
  danger: '공개 중단·삭제',
};

/** P20-01 목록 헤더 */
export const P20_LIST_HEAD = {
  title: '공부방 운영',
  lead: '공부방별로 공개·상담·노출 상태를 관리합니다. 입력은 study-room-ui에서 합니다.',
  registerCta: '+ 공부방 등록',
  notReadyBadge: '공개 준비 미완료',
  manageCta: '운영하기 →',
};

/** P20-04 미리보기 모드 */
export const P20_PREVIEW_MODES = [
  { key: 'basic', label: '검색 카드' },
  { key: 'compare', label: '비교검색' },
];

/** P20-02 · P20-05 관심 학생 브리지 (25§8 · P25-S10 2차) */
export const P20_HUB_CTA = {
  studentReview: '찜 목록',
  messages: '쪽지함 열기',
};
