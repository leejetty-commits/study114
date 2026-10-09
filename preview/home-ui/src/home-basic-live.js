/**
 * Home Basic — 실검색 API 서버 정렬 풀
 * 운영 정책: live 실패 시 EXPOSURE mock 정렬 금지 → 빈 목록 + 안내
 */

import { searchPreviewTab } from './search-api.js';
import { studyRoomBadges, tutorBadges } from './exposure-format.js';
import { DEFAULT_LIST_SORT, readListSortFromHash } from '../../shared/list-sort.js';

/** 서버 page당 최대(SearchService limit cap) */
const PAGE_LIMIT = 50;

/** 목록 티어는 검색 응답 position_sku 만. exposure_tier 만으로 올리지 않는다. */
function paidPositionSku(item) {
  const sku = item?.position_sku;
  return sku === 'prime' || sku === 'pick' ? sku : '';
}
/** 홈 Basic이 한 번에 끌어올 최대 페이지(전체 정렬 근사) */
const MAX_PAGES = 4;

/**
 * scope: null이면 지역 조건 없이 부른다.
 * 객체면 kind별 search.php 필터. kind 값이 null이면 그 kind는 부르지 않고 빈 목록으로 둔다.
 * @typedef {{ study_room: Record<string,string>|null, tutor: Record<string,string>|null, student: Record<string,string>|null }} HomeBasicScope
 */

/** @type {{ study_room: object[]|null, tutor: object[]|null, student: object[]|null, live: boolean, attempted: boolean, error: string|null, sorts: Record<string,string>, scope: HomeBasicScope|null }} */
const state = {
  study_room: null,
  tutor: null,
  student: null,
  live: false,
  attempted: false,
  error: null,
  sorts: {
    study_room: DEFAULT_LIST_SORT,
    tutor: DEFAULT_LIST_SORT,
    student: DEFAULT_LIST_SORT,
  },
  scope: null,
};

/** @param {'study_room'|'tutor'|'student'} kind @returns {Record<string,string>|null} */
function scopeFilters(kind) {
  if (!state.scope) return {};
  return state.scope[kind] || null;
}

/**
 * 공부방 카드 칸 = 검색 응답 값 그대로. 응답에 없으면 비운다.
 * summary 줄로 과목·소개를 대신 채우지 않는다.
 */
export function studyRoomSearchCardFields(item) {
  return {
    main_subject_note: item.main_subject_note || '',
    intro_short: item.intro_short || '',
    grade_band: item.grade_band || '',
    lesson_place_type: item.lesson_place_type || null,
    capacity_per_time: item.capacity_per_time || null,
    lesson_operation_type: item.lesson_operation_type || null,
    feature_1: item.feature_1 || '',
    feature_2: item.feature_2 || '',
    feature_3: item.feature_3 || '',
    slogan: item.slogan || '',
    detail_completion_status: item.detail_completion_status || '',
    image_path: item.image_path || item.image_path_basic || '',
    image_path_basic: item.image_path_basic || '',
    image_path_prime: item.image_path_prime || '',
  };
}

function mapRoom(item) {
  const room = {
    id: item.id,
    study_room_name: item.title || '',
    location_label: item.region_label || '',
    price_amount: item.price_amount ?? null,
    recommend_count: Number(item.recommend_count) || 0,
    review_count: Number(item.review_count) || 0,
    published_at: item.published_at || null,
    created_at: item.created_at || null,
    ...studyRoomSearchCardFields(item),
    education_office_registered: Boolean(item.education_office_registered),
    career_years: item.career_years ?? null,
    business_registration_available: Boolean(item.business_registration_available),
    paid_badges: Array.isArray(item.paid_badges)
      ? item.paid_badges
      : Array.isArray(item.badge_codes)
        ? item.badge_codes
        : [],
    profile_status: 'published',
    compare_eligible: true,
    inquiry_status: item.inquiry_status || 'paused',
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    exposure_tier: paidPositionSku(item) || 'basic',
    position_sku: paidPositionSku(item),
    _realDb: true,
  };
  room.badges = studyRoomBadges(room);
  return room;
}

/**
 * 과외쌤 카드 칸(정본 73 0-2) = 검색 응답 값 그대로. 응답에 없으면 비운다.
 * summary 줄(「경력 y4_6」 등)로 소개·과목을 대신 채우지 않는다.
 */
export function tutorSearchCardFields(item) {
  return {
    main_subject_note: item.main_subject_note || '',
    intro_short: item.intro_short || '',
    gender: item.gender || null,
    grade_band: item.grade_band || '',
    major_name: item.major_name || '',
    university_status: item.university_status || null,
    career_year_band: item.career_year_band || null,
    proof_document_available: Boolean(item.proof_document_available),
    lessons_per_week: item.lessons_per_week ?? null,
    minutes_per_lesson: item.minutes_per_lesson ?? null,
    lesson_places: Array.isArray(item.lesson_places) ? item.lesson_places : [],
    student_gender_group: item.student_gender_group || null,
    student_count_group: item.student_count_group || null,
    feature_1: item.feature_1 || '',
    feature_2: item.feature_2 || '',
    feature_3: item.feature_3 || '',
    slogan: item.slogan || '',
    main_material_note: item.main_material_note || '',
    teaching_style_badges: Array.isArray(item.teaching_style_badges) ? item.teaching_style_badges : [],
    image_path: item.image_path || item.image_path_basic || '',
    image_path_basic: item.image_path_basic || '',
    image_path_prime: item.image_path_prime || '',
  };
}

function mapTutor(item) {
  const tutor = {
    id: item.id,
    tutor_display_name: item.title || '',
    location_label: item.region_label || '',
    preferred_fee_amount: item.preferred_fee_amount ?? item.price_amount ?? null,
    university_name: item.university_name || '',
    recommend_count: Number(item.recommend_count) || 0,
    review_count: Number(item.review_count) || 0,
    published_at: item.published_at || null,
    created_at: item.created_at || null,
    ...tutorSearchCardFields(item),
    paid_badges: Array.isArray(item.paid_badges)
      ? item.paid_badges
      : Array.isArray(item.badge_codes)
        ? item.badge_codes
        : [],
    profile_status: 'published',
    compare_eligible: true,
    exposure_tier: paidPositionSku(item) || 'basic',
    position_sku: paidPositionSku(item),
    _realDb: true,
  };
  tutor.badges = tutorBadges(tutor);
  return tutor;
}

/** 학생 카드 칸 값 — 검색 응답 그대로. summary 줄로 대신 채우지 않는다. */
export function studentSearchCardFields(item) {
  return {
    grade_level: item.grade_level || '',
    gender: item.gender || null,
    subject_label: item.subject_name || '',
    lesson_format: item.lesson_format || null,
    student_gender_group: item.student_gender_group || null,
    preferred_student_count_group: item.preferred_student_count_group || null,
    preferred_lesson_type: item.preferred_lesson_type || null,
    preferred_fee_amount: item.preferred_fee_amount ?? null,
    preferred_studyroom_fee_amount: item.preferred_studyroom_fee_amount ?? null,
    budget_amount: item.budget_amount ?? null,
    lessons_per_week: item.lessons_per_week ?? null,
    minutes_per_lesson: item.minutes_per_lesson ?? null,
    lesson_places: Array.isArray(item.lesson_places) ? item.lesson_places : [],
    teaching_style_badges: Array.isArray(item.teaching_style_badges) ? item.teaching_style_badges : [],
    request_summary: String(item.request_summary || ''),
    special_request_note: String(item.special_request_note || ''),
  };
}

function mapStudent(item) {
  return {
    id: item.id,
    public_display_name: item.title || '',
    location_label: item.region_label || '',
    ...studentSearchCardFields(item),
    published_at: item.published_at || item.created_at || null,
    exposure_status: 'published',
    _realDb: true,
  };
}

/** 검색 API 카드 → 홈 카드 필드. 찜 목록 카드(handoff favorites card)도 같은 매퍼를 쓴다. */
export { mapRoom as mapSearchRoomItem, mapTutor as mapSearchTutorItem, mapStudent as mapSearchStudentItem };

/**
 * @param {'room'|'tutor'|'student'} tab
 * @param {string} sort
 * @param {Record<string,string>|null} filters null이면 부르지 않는다.
 */
async function fetchAllSorted(tab, sort, filters) {
  /** @type {object[]} */
  const items = [];
  if (filters === null) return items;
  let total = Infinity;
  for (let page = 1; page <= MAX_PAGES && items.length < total; page++) {
    const data = await searchPreviewTab(tab, PAGE_LIMIT, sort, page, filters);
    total = Number(data.total) || 0;
    const batch = data.items || [];
    items.push(...batch);
    if (batch.length < PAGE_LIMIT) break;
  }
  return items;
}

/**
 * @param {'study_room'|'tutor'|'student'} kind
 * @returns {object[]}
 */
export function getHomeBasicPool(kind) {
  // 운영: mock EXPOSURE_* 폴백 금지 — live 전/실패 모두 빈 배열
  if (state.live && Array.isArray(state[kind])) {
    return state[kind];
  }
  return [];
}

export function isHomeBasicLive() {
  return state.live;
}

export function isHomeBasicAttempted() {
  return state.attempted;
}

/** @returns {string|null} */
export function getHomeBasicLiveError() {
  return state.error;
}

/**
 * @param {Partial<Record<'study_room'|'tutor'|'student', string>>} [sorts]
 * @param {{ scope?: HomeBasicScope|null }} [opts] scope를 주면 이후 정렬 재조회도 같은 필터를 쓴다.
 */
export async function hydrateHomeBasicFromSearch(sorts = {}, opts = {}) {
  const roomSort = sorts.study_room || readListSortFromHash('study_room', { mode: 'home' });
  const tutorSort = sorts.tutor || readListSortFromHash('tutor', { mode: 'home' });
  const studentSort = sorts.student || readListSortFromHash('student', { mode: 'home' });
  if ('scope' in opts) state.scope = opts.scope ?? null;
  state.attempted = true;
  state.error = null;

  try {
    if (state.scope && !state.scope.study_room && !state.scope.tutor && !state.scope.student) {
      throw new Error('기준 지역을 불러오지 못했습니다.');
    }
    const [rooms, tutors, students] = await Promise.all([
      fetchAllSorted('room', roomSort, scopeFilters('study_room')),
      fetchAllSorted('tutor', tutorSort, scopeFilters('tutor')),
      fetchAllSorted('student', studentSort, scopeFilters('student')),
    ]);
    state.study_room = rooms.map(mapRoom);
    state.tutor = tutors.map(mapTutor);
    state.student = students.map(mapStudent);
    state.sorts = {
      study_room: roomSort,
      tutor: tutorSort,
      student: studentSort,
    };
    state.live = true;
    return true;
  } catch (err) {
    console.warn('[home-basic-live]', err);
    state.live = false;
    state.study_room = [];
    state.tutor = [];
    state.student = [];
    state.error = err instanceof Error ? err.message : '목록을 불러오지 못했습니다.';
    return false;
  }
}

/**
 * 정렬 변경 시 해당 kind만 서버 재조회
 * @param {'study_room'|'tutor'|'student'} kind
 * @param {string} sort
 */
export async function refetchHomeBasicKind(kind, sort) {
  const tab = kind === 'study_room' ? 'room' : kind;
  try {
    const items = await fetchAllSorted(tab, sort, scopeFilters(kind));
    if (kind === 'study_room') state.study_room = items.map(mapRoom);
    else if (kind === 'tutor') state.tutor = items.map(mapTutor);
    else state.student = items.map(mapStudent);
    state.sorts[kind] = sort;
    state.live = true;
    state.error = null;
    return true;
  } catch (err) {
    console.warn('[home-basic-live] refetch', err);
    state.error = err instanceof Error ? err.message : '정렬 목록을 불러오지 못했습니다.';
    return false;
  }
}

export function resetHomeBasicLive() {
  state.study_room = null;
  state.tutor = null;
  state.student = null;
  state.live = false;
  state.attempted = false;
  state.error = null;
  state.scope = null;
}
