/**
 * 1차 잠금 정책 — UI·다음 화면 작업 공통 참조
 * Notion 14장(2026-07-18): 가입 최소 · 기본=임시 저장 · 상세=검색/공개 본체 · 유료=구매
 */

/** @typedef {'basic' | 'detail'} RegisterPhase */

/** 공부방·과외쌤 공통 등록 2단계 */
export const REGISTER_FLOW = {
  basic: {
    label: '기본등록',
    outcome: '공개 전 임시 저장본 생성 · 상세등록 시작',
    studyRoomSteps: ['basic', 'location'],
    tutorSteps: null,
  },
  detail: {
    label: '상세등록',
    outcome: '검색/리스트/공개 본체 완성 · 일반 리스트·검색 등록 가능',
    studyRoomSteps: ['lesson', 'career', 'facility'],
    tutorSteps: null,
    includesYoutube: true,
  },
};

/** 일반 목록/검색 = 상세등록 완료 후 · 대표/추천 노출 = 상세+품질/증빙 */
export const EXPOSURE_TIERS = {
  prime: {
    label: '대표 노출',
    slots: 3,
    requiresDetailComplete: true,
    note: '상세등록 완료 + 소개/이미지/증빙 등 품질 충족 후 구매',
  },
  pick: {
    label: '추천 노출',
    slotsPerRow: 5,
    requiresDetailComplete: true,
    note: '상세등록 완료 + 품질 충족 후 구매',
  },
  /** @deprecated 용어 폐기 — 일반 리스트는 상세등록 완료 후 */
  localList: {
    label: '일반 리스트/검색',
    requiresDetailComplete: true,
    note: '기본등록만으로는 공개·검색 등록 불가 · 상세등록 완료 후',
  },
};

/** 6장 — 과외쌤 비교검색 경량 항목 (8장 필드명) */
export const TUTOR_COMPARE_FIELDS = [
  'tutor_display_name',
  'student_gender_group',
  'main_subject_note',
  'location_label',
  'fee_card_label',
  'career_year_band',
  'feature_1',
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

/** 6장 §3 — 안전과외: GNB 독립 메뉴 아님 · 이용안내/고객센터 하위 설명 페이지 */
export const SAFE_TUTOR_PLACEMENT = ['util-guide', 'util-support', 'gnb-support'];
