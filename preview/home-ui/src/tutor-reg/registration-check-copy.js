/**
 * 과외쌤 등록점검(P21-04) copy
 * Pick/Prime 차등 안내는 여기만. 입력 화면 배지와 섞지 않는다.
 */

import { TUTOR_BASIC_FIELDS, TUTOR_BASIC_FIELD_KEYS } from '../../../shared/tutor-basic-fields.js';

export const TRC_COPY = {
  title: '등록점검',
  lead: '필수 입력과 픽·프라임에 더 필요한 항목을 한 화면에서 확인합니다',
  badges: {
    publishLive: '노출 중',
    basicOk: '베이직카드 충족',
    basicNeed: (n) => `베이직카드 ${n}개 부족`,
    pickOk: '픽 추가 충족',
    pickNeed: (n) => `픽 추가 ${n}개`,
    primeOk: '프라임 추가 충족',
    primeNeed: (n) => `프라임 추가 ${n}개`,
  },
  next: {
    prefix: '다음',
    live: '검색에 노출 중입니다. 현황만 확인하면 됩니다',
    fill: (label) => `${label} 입력하러 가기`,
  },
  promo: {
    title: '베이직 노출과 픽·프라임은 단계가 다릅니다',
    lines: [
      '베이직 검색 노출은 필수 항목이 채워지면 따라옵니다.',
      '픽·프라임은 그 위에 카드 정보량·신뢰를 더하는 추가 입력입니다.',
    ],
    pickMissingTitle: '[픽] 추가 입력',
    primeMissingTitle: '[프라임] 추가 입력',
    gotoField: '입력하러 가기',
    pickReadyBody: '픽에 필요한 추가 항목이 채워져 있습니다.',
    primeReadyBody: '프라임에 필요한 추가 항목이 채워져 있습니다.',
  },
  board: {
    title: '전체 프로필 현황',
    lead: '기본정보와 상세정보는 같은 수준의 구역입니다. 상세정보 안은 입력 화면과 같이 수업 · 가격 / 학력 · 소개 · 연락으로 나뉩니다.',
    sections: {
      basic: '기본정보',
      detail: '상세정보',
      detail1: '수업 · 가격',
      detail2: '학력 · 소개 · 연락',
    },
    cols: {
      item: '항목',
      value: '현재값',
      status: '상태',
      note: '비고',
    },
    required: '필수',
    allRequiredOk: '모든 필수 항목 입력 완료',
    missPrefix: '부족',
    filledLine: (filled, total, missing) => `완료 ${filled}/${total} · 부족 ${missing}`,
    foldOpen: '펼치기',
    foldClose: '접기',
    editAria: (title) => `${title} 수정`,
  },
  status: {
    filled: 'O',
    empty: '미입력됨',
  },
  returnBanner: {
    label: '← 등록점검으로 돌아가기',
    hint: '수정이 끝나면 등록점검에서 다시 확인할 수 있습니다.',
  },
};

/** 베이직카드 항목 = 기본정보 필수 — shared/tutor-basic-fields.js 한 목록. 다 채우면 카드 노출 (정본 73 0절) */
export const TRC_BASIC_FIELD_IDS = TUTOR_BASIC_FIELD_KEYS;

/** Pick 추가 — 베이직카드 외에 픽 카드에 더 필요한 입력 */
export const TRC_PICK_FIELD_IDS = ['feature_1', 'student_target'];

/** Prime 추가 — Pick/Basic 외에 프라임 카드에 더 필요한 입력 */
export const TRC_PRIME_FIELD_IDS = ['intro_long', 'feature_2', 'feature_3'];

export const TRC_REQUIRED_FIELD_IDS = [
  ...new Set([...TRC_BASIC_FIELD_IDS, ...TRC_PICK_FIELD_IDS, ...TRC_PRIME_FIELD_IDS]),
];

/**
 * 상세정보 탭 실제 입력 항목 = 등록점검 보드 행.
 * 상세정보1 = 수업 · 가격, 상세정보2 = 학력 · 소개 · 연락.
 */
export const TRC_BOARD_BASIC_FIELDS = TUTOR_BASIC_FIELDS.map((f) => ({ id: f.key, label: f.label, required: true }));

export const TRC_BOARD_DETAIL1_FIELDS = [
  { id: 'fee_basis', label: '산정방식', required: true },
  { id: 'monthly_session_count', label: '월 총 횟수', required: false },
  { id: 'student_gender_group', label: '지도 대상 성별', required: false },
  { id: 'student_count_group', label: '수업인원', required: false },
  { id: 'lesson_places', label: '강의장소', required: false },
  { id: 'fee_description', label: '가격 설명', required: false },
];

export const TRC_BOARD_DETAIL2_FIELDS = [
  { id: 'university_name', label: '대학/대학원', required: true },
  { id: 'major_name', label: '전공', required: false },
  { id: 'university_status', label: '학적상태', required: false },
  { id: 'feature_1', label: '특징 1', required: false },
  { id: 'feature_2', label: '특징 2', required: false },
  { id: 'feature_3', label: '특징 3', required: false },
  { id: 'intro_short', label: '짧은 소개', required: true },
  { id: 'profile_image', label: '프로필 사진', required: false },
  { id: 'intro_long', label: '상세 소개', required: true },
  { id: 'contact_time_note', label: '연락 가능 시간', required: false },
];

export const TRC_BOARD_REQUIRED_IDS = new Set(
  [...TRC_BOARD_BASIC_FIELDS, ...TRC_BOARD_DETAIL1_FIELDS, ...TRC_BOARD_DETAIL2_FIELDS]
    .filter((f) => f.required)
    .map((f) => f.id),
);

const TRC_BASIC_HINTS = {
  display_name: '검색·카드에 바로 보입니다',
  primary_region: '지역 검색 노출에 필요합니다',
  school_level: '베이직카드 대상 학교급입니다',
  main_subject: '과외 매칭의 첫 조건입니다',
  fee: '검색 카드 가격대에 쓰입니다',
  lessons_per_week: '베이직카드 주 ○회에 쓰입니다',
  minutes: '1회 수업 분량을 보여 줍니다',
  slogan: '베이직카드 한 줄 소개입니다',
};

export const TRC_PROMO_MISSING_DEFS = [
  ...TUTOR_BASIC_FIELDS.map((f) => ({ id: f.key, label: f.label, hint: TRC_BASIC_HINTS[f.key], section: 'basic' })),
  { id: 'lesson_places', label: '강의장소', hint: '방문·공공장소 등 수업 방식을 보여 줍니다', section: 'detail' },
  { id: 'fee_basis', label: '과외비 산정방식', hint: '주 회수 또는 월 총 횟수 기준을 정합니다', section: 'detail' },
  { id: 'schedule', label: '주 회수/월 총 횟수', hint: '산정방식에 맞는 횟수가 필요합니다', section: 'detail' },
  { id: 'intro', label: '소개문', hint: '짧은 소개 또는 상세 소개 중 하나가 필요합니다', section: 'detail' },
  { id: 'university', label: '대학/대학원', hint: '상세등록 완료·검색 노출 조건입니다', section: 'detail' },
  { id: 'profile_image', label: '프로필 사진', hint: '검색 카드 신뢰에 필요합니다', section: 'detail' },
  { id: 'feature_1', label: '경력특징 1', hint: '픽 카드 강조 한 줄입니다', section: 'detail' },
  { id: 'student_target', label: '학생구성', hint: '지도 대상 성별·인원을 보여 줍니다', section: 'detail' },
  { id: 'intro_long', label: '상세 소개', hint: '프라임 상세에서 과외를 설명합니다', section: 'detail' },
  { id: 'feature_2', label: '경력특징 2', hint: '프라임 카드에 특징을 더 보여 줍니다', section: 'detail' },
  { id: 'feature_3', label: '경력특징 3', hint: '프라임 카드에 특징을 더 보여 줍니다', section: 'detail' },
];
