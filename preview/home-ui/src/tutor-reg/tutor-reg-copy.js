/**
 * 21장 — 과외쌤 운영 copy · 탭 · 매트릭스 라벨 (횡단 SSOT)
 * docs/ssot/21-tutor-registration-management.md §3-3 · §4-2 · §6 · §7
 */

/** §3-3 P21-01 목록 탭 */
export const P21_LIST_TABS = [
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
  'Pick 후보',
  '인증쌤',
  '승인',
  'pending',
];

/** §4-2 3게이지 제목 */
export const P21_GAUGE_TITLES = {
  completion: '프로필 완성도',
  trustInfo: '신뢰정보 풍부도',
  exposureAccess: '노출·접근 준비도',
};

/** §3-3 · §8 Pick/Prime 라벨 */
export const PRODUCT_APPLY = {
  eligible: '신청 가능',
  missing: (n) => `조건 ${n}개 부족`,
  pickPrimeEligiblePaid: 'Pick · Prime 신청 가능',
  pickEligibleUnpaid: 'Pick 신청 가능 · Prime은 유료 필요',
  pickPrimeMissing: (n) => `Pick · Prime 조건 ${n}개 부족`,
};

/** §6 상태판 블록 제목 */
export const P21_HUB_BLOCK_TITLES = {
  diagnosis: '한 줄 진단',
  readiness: '공개 준비',
  gauges: '운영 게이지',
  accessMatrix: '접근·쪽지',
  matching: '매칭 가시성',
  exposure: '노출·부oost',
  ctas: '다음 행동',
};

/** §7-5 · P21-05 CTA */
export const P21_ACCESS_CTA = {
  studentSearch: '학생찾기 보기',
  studentReview: '학생 검토함',
  plans: '메모권·유료 (P16-04)',
  messages: '쪽지함 열기',
  submissionDocs: '제출자료 상태 (P15-10)',
};
