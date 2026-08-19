/**
 * Home Basic — 실검색 API 서버 정렬 풀
 * 운영 정책: live 실패 시 EXPOSURE mock 정렬 금지 → 빈 목록 + 안내
 */

import { searchPreviewTab } from './search-api.js';
import { studyRoomBadges, tutorBadges } from './exposure-format.js';
import { DEFAULT_LIST_SORT, readListSortFromHash } from '../../shared/list-sort.js';

/** 서버 page당 최대(SearchService limit cap) */
const PAGE_LIMIT = 50;
/** 홈 Basic이 한 번에 끌어올 최대 페이지(전체 정렬 근사) */
const MAX_PAGES = 4;

/** @type {{ study_room: object[]|null, tutor: object[]|null, student: object[]|null, live: boolean, attempted: boolean, error: string|null, sorts: Record<string,string> }} */
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
};

function mapRoom(item) {
  const summaryLines = String(item.summary || '').split('\n').filter(Boolean);
  return {
    id: item.id,
    study_room_name: item.title || '',
    location_label: item.region_label || '',
    price_amount: item.price_amount ?? null,
    recommend_count: item.recommend_count ?? 0,
    review_count: item.review_count ?? 0,
    published_at: item.published_at || item.created_at || null,
    main_subject_note: item.main_subject_note || summaryLines[0] || '',
    intro_short: summaryLines[1] || '',
    profile_status: 'published',
    compare_eligible: true,
    inquiry_status: item.inquiry_status || 'paused',
    badges: studyRoomBadges({ main_subject_note: item.main_subject_note || summaryLines[0] || '' }),
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    exposure_tier: item.exposure_tier || 'basic',
    _realDb: true,
  };
}

function mapTutor(item) {
  const summaryLines = String(item.summary || '').split('\n').filter(Boolean);
  return {
    id: item.id,
    tutor_display_name: item.title || '',
    location_label: item.region_label || '',
    preferred_fee_amount: item.preferred_fee_amount ?? item.price_amount ?? null,
    university_name: item.university_name || '',
    major_name: item.major_name || '',
    recommend_count: item.recommend_count ?? 0,
    review_count: item.review_count ?? 0,
    published_at: item.published_at || item.created_at || null,
    main_subject_note: item.main_subject_note || summaryLines[0] || '',
    intro_short: summaryLines[1] || '',
    profile_status: 'published',
    compare_eligible: true,
    badges: tutorBadges({ main_subject_note: item.main_subject_note || summaryLines[0] || '' }),
    exposure_tier: item.exposure_tier || 'basic',
    _realDb: true,
  };
}

function mapStudent(item) {
  const summaryLines = String(item.summary || '').split('\n').filter(Boolean);
  return {
    id: item.id,
    public_display_name: item.title || '',
    location_label: item.region_label || '',
    subject_label: summaryLines[0] || '',
    grade_level: summaryLines[1]?.split('·')[0]?.trim() || '',
    budget_amount: item.budget_amount ?? item.price_amount ?? null,
    published_at: item.published_at || item.created_at || null,
    exposure_status: 'published',
    _realDb: true,
  };
}

/**
 * @param {'room'|'tutor'|'student'} tab
 * @param {string} sort
 */
async function fetchAllSorted(tab, sort) {
  /** @type {object[]} */
  const items = [];
  let total = Infinity;
  for (let page = 1; page <= MAX_PAGES && items.length < total; page++) {
    const data = await searchPreviewTab(tab, PAGE_LIMIT, sort, page);
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
 */
export async function hydrateHomeBasicFromSearch(sorts = {}) {
  const roomSort = sorts.study_room || readListSortFromHash('study_room', { mode: 'home' });
  const tutorSort = sorts.tutor || readListSortFromHash('tutor', { mode: 'home' });
  const studentSort = sorts.student || readListSortFromHash('student', { mode: 'home' });
  state.attempted = true;
  state.error = null;

  try {
    const [rooms, tutors, students] = await Promise.all([
      fetchAllSorted('room', roomSort),
      fetchAllSorted('tutor', tutorSort),
      fetchAllSorted('student', studentSort),
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
    const items = await fetchAllSorted(tab, sort);
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
}
