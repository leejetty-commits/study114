/**
 * 과외쌤 등록점검(P21-04) copy
 * Pick/Prime 차등 안내는 여기만. 입력 화면 배지와 섞지 않는다.
 */

import { TUTOR_BASIC_FIELDS, TUTOR_BASIC_FIELD_KEYS } from '../../../shared/tutor-basic-fields.js';
import { TUTOR_PICK_IDS, TUTOR_PRIME_IDS, tutorTierPromoDefs } from '../../../shared/pickprime-requirements.js';

export const TRC_COPY = {
  title: '등록점검',
  lead: '기본등록 필수와 픽·프라임 노출에 더 필요한 항목을 한 화면에서 확인합니다',
  badges: {
    publishLive: '노출 중',
    basicOk: '기본카드 충족',
    basicNeed: (n) => `기본카드 노출까지 ${n}개 더 입력`,
    pickOk: '픽 노출 충족',
    pickNeed: (n) => `픽 노출까지 ${n}개 더 입력`,
    primeOk: '프라임 노출 충족',
    primeNeed: (n) => `프라임 노출까지 ${n}개 더 입력`,
  },
  next: {
    prefix: '다음',
    live: '검색에 노출 중입니다. 현황만 확인하면 됩니다',
    fill: (label) => `${label} 입력하러 가기`,
  },
  promo: {
    title: '기본카드 노출과 픽·프라임은 단계가 다릅니다',
    lines: [
      '기본카드 검색 노출은 기본등록 필수 8개가 채워지면 따라옵니다.',
      '픽·프라임은 그 위에 카드 정보량·신뢰를 더하는 추가 입력입니다.',
    ],
    pickMissingTitle: '픽 노출까지 추가 입력',
    primeMissingTitle: '프라임 노출까지 추가 입력',
    gotoField: '입력하러 가기',
    pickReadyBody: '픽에 필요한 추가 항목이 채워져 있습니다.',
    primeReadyBody: '프라임에 필요한 추가 항목이 채워져 있습니다.',
  },
  board: {
    title: '전체 프로필 현황',
    lead: '상세정보는 입력 화면과 같이 상세정보1 / 상세정보2로 나뉩니다.',
    sections: {
      basic: '기본정보',
      detail: '상세정보',
      detail1: '수업 · 과목 · 가격',
      detail2: '학력 · 경력 · 특징',
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
    missMore: (n) => `외 ${n}개`,
    filledLine: (filled, total, missing) => `완료 ${filled}/${total} · 부족 ${missing}`,
    introNote: '상세 소개를 입력하면 카드에는 한 줄로, 눌러 보면 전부 보입니다',
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

/** 기본카드 항목 = 기본정보 필수 — shared/tutor-basic-fields.js 한 목록. 다 채우면 카드 노출 (정본 73 0절) */
export const TRC_BASIC_FIELD_IDS = TUTOR_BASIC_FIELD_KEYS;

/** Pick 구매 필수 — preview/shared/pickprime-requirements.js */
export const TRC_PICK_FIELD_IDS = TUTOR_PICK_IDS;

/** Prime 구매 필수 — 픽 항목 포함 */
export const TRC_PRIME_FIELD_IDS = TUTOR_PRIME_IDS;

export const TRC_REQUIRED_FIELD_IDS = [
  ...new Set([...TRC_BASIC_FIELD_IDS, ...TRC_PICK_FIELD_IDS, ...TRC_PRIME_FIELD_IDS]),
];

/**
 * 상세정보 탭 실제 입력 항목 = 등록점검 보드 행.
 * 상세정보1 = 수업 · 가격, 상세정보2 = 학력 · 소개 · 연락.
 */
export const TRC_BOARD_BASIC_FIELDS = TUTOR_BASIC_FIELDS.map((f) => ({ id: f.key, label: f.label, required: true }));

export const TRC_BOARD_DETAIL1_FIELDS = [
  { id: 'student_gender_group', label: '지도 대상 성별', required: false },
  { id: 'student_count_group', label: '수업인원', required: false },
  { id: 'age_band', label: '과외쌤 연령대', required: false },
  { id: 'subjects', label: '추가 과목', required: false },
  { id: 'fee_basis', label: '산정방식', required: false },
  { id: 'schedule', label: '주 회수', required: false },
  { id: 'fee_description', label: '가격 설명', required: false },
  { id: 'lesson_places', label: '강의장소', required: false },
];

export const TRC_BOARD_DETAIL2_FIELDS = [
  { id: 'university_name', label: '대학/대학원', required: false },
  { id: 'major_name', label: '전공', required: false },
  { id: 'university_status', label: '학적상태', required: false },
  { id: 'career_year_band', label: '경력구간', required: false },
  { id: 'main_material_note', label: '주교재', required: false },
  { id: 'feature_1', label: '특징 1', required: false },
  { id: 'feature_2', label: '특징 2', required: false },
  { id: 'feature_3', label: '특징 3', required: false },
  { id: 'proof_document_available', label: '증빙서류 제출 가능', required: false },
  { id: 'teaching_style_badges', label: '강의스타일', required: false },
  { id: 'intro_long', label: '상세 소개', required: false },
  { id: 'contact_time_note', label: '연락 가능 시간', required: false },
  { id: 'promo_channels', label: '홍보 채널', required: false },
  { id: 'profile_image', label: '프로필 사진', required: false },
];

export const TRC_BOARD_REQUIRED_IDS = new Set(
  [...TRC_BOARD_BASIC_FIELDS, ...TRC_BOARD_DETAIL1_FIELDS, ...TRC_BOARD_DETAIL2_FIELDS]
    .filter((f) => f.required)
    .map((f) => f.id),
);

const TRC_BASIC_HINTS = {
  display_name: '검색·카드에 바로 보입니다',
  primary_region: '지역 검색 노출에 필요합니다',
  school_level: '기본카드 대상 학교급입니다',
  main_subject: '과외 매칭의 첫 조건입니다',
  fee: '검색 카드 가격대에 쓰입니다',
  lessons_per_week: '기본카드 주 ○회에 쓰입니다',
  minutes: '1회 수업 분량을 보여 줍니다',
  slogan: '기본카드 한 줄 소개입니다',
};

export const TRC_PROMO_MISSING_DEFS = [
  ...TUTOR_BASIC_FIELDS.map((f) => ({ id: f.key, label: f.label, hint: TRC_BASIC_HINTS[f.key], section: 'basic' })),
  { id: 'lesson_places', label: '강의장소', hint: '방문·공공장소 등 수업 방식을 보여 줍니다', section: 'detail' },
  { id: 'fee_basis', label: '과외비 산정방식', hint: '주 회수 또는 월 총 횟수 기준을 정합니다', section: 'detail' },
  { id: 'schedule', label: '주 회수/월 총 횟수', hint: '산정방식에 맞는 횟수가 필요합니다', section: 'detail' },
  { id: 'university', label: '대학/대학원', hint: '픽 카드 조건이에요. 경력이 있으면 경력으로 대신할 수 있어요.', section: 'detail' },
  { id: 'profile_image', label: '프로필 사진', hint: '검색 카드 신뢰에 필요합니다', section: 'detail' },
  ...tutorTierPromoDefs(),
];
