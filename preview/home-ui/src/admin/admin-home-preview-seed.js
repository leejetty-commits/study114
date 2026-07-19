/**
 * 관리자모드 > 서비스 홈 미리보기 — 검수용 기준지역 seed
 *
 * ⚠️ 실사용자 기본주소 · 역할별 저장지역 · 실홈 기본값과 절대 합치지 말 것.
 * 이 모듈의 값은 ADMIN_HOME_PREVIEW_* 전용이다.
 */

/** @typedef {'dong'|'complex'|'city'} AdminPreviewRegionBasis */
/** @typedef {'guest'|'parent'|'study_room'|'tutor'} AdminHomePreviewMode */

/**
 * @typedef {object} AdminPreviewRegionSlot
 * @property {string} id
 * @property {string} label
 * @property {AdminPreviewRegionBasis} basis
 * @property {string} [note]
 */

/** 공부방 미리보기 저장 슬롯 3 — 타입 혼합 가능, 활성 화면은 단일 타입만 */
export const ADMIN_HOME_PREVIEW_STUDY_ROOM_SLOTS = /** @type {AdminPreviewRegionSlot[]} */ ([
  { id: 'room-1', label: '대치1동', basis: 'dong', note: '행정동' },
  { id: 'room-2', label: '래미안대치팰리스1단지', basis: 'complex', note: '아파트단지' },
  { id: 'room-3', label: '대치2동', basis: 'dong', note: '행정동' },
]);

/** 과외쌤 미리보기 시 3 */
export const ADMIN_HOME_PREVIEW_TUTOR_SLOTS = /** @type {AdminPreviewRegionSlot[]} */ ([
  { id: 'tutor-1', label: '서울시', basis: 'city', note: '시' },
  { id: 'tutor-2', label: '남양주시', basis: 'city', note: '시' },
  { id: 'tutor-3', label: '광명시', basis: 'city', note: '시' },
]);

/** 학생/학부모 미리보기 기준지역 1 */
export const ADMIN_HOME_PREVIEW_STUDENT_REGION = /** @type {AdminPreviewRegionSlot} */ ({
  id: 'student-1',
  label: '서울시',
  basis: 'city',
  note: '시',
});

/** @type {Record<AdminHomePreviewMode, { label: string, lead: string }>} */
export const ADMIN_HOME_PREVIEW_MODE_META = {
  guest: {
    label: '비로그인 홈',
    lead: '게스트 홈 검수 · 공부방/과외 섹션 seed 전환',
  },
  parent: {
    label: '학생/학부모 홈',
    lead: '목적형 홈 · 기준지역 서울시 · 공부방/과외쌤 찾기 전환',
  },
  study_room: {
    label: '공부방 홈',
    lead: '노출지역 슬롯 3 · 활성 슬롯 타입만 적용',
  },
  tutor: {
    label: '과외쌤 홈',
    lead: '활동 시 3 · 지도 없음 · 시 기준만',
  },
};

export const ADMIN_HOME_PREVIEW_STORAGE_KEY = 'study114.adminHomePreview.v1';

/** 확정 액션 — 미리보기에서 실반영 금지 */
export const ADMIN_HOME_PREVIEW_BLOCKED_ACTIONS = [
  'save',
  'publish',
  'hide',
  'delete',
  'checkout',
  'pay',
  'purchase',
  'send-memo',
  'send-sms',
  'send-email',
  'grant-role',
  'revoke-role',
];

export function basisLabel(basis) {
  if (basis === 'complex') return '아파트단지';
  if (basis === 'city') return '시';
  return '행정동';
}
