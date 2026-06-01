/**
 * 1차 잠금 정책 — UI·다음 화면 작업 공통 참조
 * SSOT: 5장 · 6장 · 8장 · 9장 · 사용자 잠금 기준 (2026-06-01)
 */

/** @typedef {'basic' | 'detail'} RegisterPhase */

/** 공부방·과외쌤 공통 등록 2단계 */
export const REGISTER_FLOW = {
  basic: {
    label: '기본등록',
    outcome: '일반 리스트(Local List) 노출 가능',
    studyRoomSteps: ['basic', 'location'],
    tutorSteps: null,
  },
  detail: {
    label: '상세등록',
    outcome: '누구나 이어서 작성 가능',
    studyRoomSteps: ['lesson', 'career', 'facility'],
    tutorSteps: null,
    includesYoutube: true,
  },
};

/** Prime / Pick — 상세등록 완료 + 별도 광고/노출권(9장·5장 §10) */
export const EXPOSURE_TIERS = {
  prime: {
    label: 'Prime',
    slots: 3,
    requiresDetailComplete: true,
    note: '상세등록 미완료 시 박스형 상위 노출 불가',
  },
  pick: {
    label: 'Pick',
    slotsPerRow: 5,
    requiresDetailComplete: true,
    note: '상세등록 완료가 광고 상품 자격 전제',
  },
  localList: {
    label: 'Local List',
    requiresDetailComplete: false,
    note: '기본등록만으로 일반 리스트 노출 가능',
  },
};

/** 6장 — 과외쌤 비교검색 경량 항목 */
export const TUTOR_COMPARE_FIELDS = [
  'display_name',
  'gender',
  'main_subjects',
  'service_regions',
  'representative_fee',
  'career_summary',
  'feature_note',
];

/** 8장 — 학생 열람권 후보 (구현 보류) */
export const TUTOR_VIEW_PASS_CANDIDATE = {
  scope: 'tutor_only',
  model: 'count_and_validity',
  examples: [
    { views: 10, days: 30 },
    { views: 20, days: 60 },
  ],
  phase1: 'design_only',
};

/** 1차 UI에 노출하지 않는 메뉴 ID */
export const MENU_EXCLUDED_PHASE1 = ['quick_match', 'app_download', 'library_portal'];
