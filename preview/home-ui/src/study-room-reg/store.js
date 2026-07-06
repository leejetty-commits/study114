/** 20장 study_rooms 프리뷰 — sessionStorage `[임시]` · Dev 공부방 로그인 시 API */

import {
  isRegistrationsApiMode,
  getStudyRoomsCache,
  apiStudyRoomAction,
} from '../registrations-backend.js';

const KEY = 'study114-preview-study-rooms-v1';

/**
 * @typedef {object} StudyRoomRecord
 * @property {number} id
 * @property {string} study_room_name
 * @property {'draft'|'published'|'hidden'} profile_status
 * @property {'open'|'paused'|'capacity_full'|'waiting_only'} inquiry_status
 * @property {'basic_only'|'expanded_in_progress'|'expanded_complete'} detail_completion_status
 * @property {string} region_label
 * @property {string} main_subject_note
 * @property {string} [grade_band]
 * @property {number} [price_amount]
 * @property {string} [intro_short]
 * @property {string} [intro_long]
 * @property {string} [slogan]
 * @property {string} [feature_1]
 * @property {number} [career_years]
 * @property {boolean} [education_office_registered]
 * @property {boolean} [weekend_available]
 * @property {boolean} [one_on_one_available]
 * @property {'academy'|'study_room'} [lesson_place_type]
 * @property {string} [capacity_per_time]
 * @property {string} [facility_summary]
 * @property {boolean} has_representative_image
 * @property {boolean} has_subject_targets
 * @property {boolean} has_regions
 * @property {boolean} lesson_place_set
 * @property {boolean} contact_method_set
 * @property {boolean} compare_eligible
 * @property {boolean} [prime_eligible]
 * @property {string} [updated_at]
 * @property {string} [published_at]
 * @property {string|null} [deleted_at]
 */

/**
 * @typedef {object} PublishReadiness
 * @property {boolean} canPublish
 * @property {boolean} detailRecommended
 * @property {boolean} exposureBoostReady
 * @property {number} doneCount
 * @property {number} totalCount
 * @property {string[]} missing
 * @property {string[]} qualityHints
 */

/** @returns {StudyRoomRecord} */
function withDefaults(raw, id) {
  return {
    inquiry_status: 'open',
    detail_completion_status: 'basic_only',
    has_representative_image: false,
    has_subject_targets: false,
    has_regions: false,
    lesson_place_set: false,
    contact_method_set: false,
    compare_eligible: false,
    education_office_registered: false,
    weekend_available: false,
    one_on_one_available: false,
    ...raw,
    id,
    updated_at: raw.updated_at || new Date().toISOString(),
    deleted_at: raw.deleted_at ?? null,
  };
}

const SEED = [
  withDefaults(
    {
      id: 1,
      study_room_name: '우동공과 대치점',
      profile_status: 'published',
      inquiry_status: 'open',
      detail_completion_status: 'expanded_in_progress',
      region_label: '서울 강남구 대치동',
      main_subject_note: '수학·영어',
      grade_band: '중1~2',
      price_amount: 420000,
      intro_short: '소규모 밀착 · 학부모 리포트',
      intro_long: '대치동 거주 원장 직강 · 개별 피드백',
      feature_1: '개별 피드백',
      career_years: 12,
      education_office_registered: true,
      weekend_available: true,
      one_on_one_available: true,
      lesson_place_type: 'academy',
      capacity_per_time: '4~6명',
      facility_summary: '냉난방·CCTV',
      has_representative_image: true,
      has_subject_targets: true,
      has_regions: true,
      lesson_place_set: true,
      contact_method_set: true,
      compare_eligible: true,
      prime_eligible: false,
      published_at: new Date().toISOString(),
    },
    1,
  ),
  withDefaults(
    {
      id: 2,
      study_room_name: '임시 공부방',
      profile_status: 'draft',
      inquiry_status: 'open',
      detail_completion_status: 'basic_only',
      region_label: '서울 강남구 대치동',
      main_subject_note: '종합',
      price_amount: 320000,
      intro_short: '',
      has_representative_image: false,
      has_subject_targets: true,
      has_regions: true,
      lesson_place_set: false,
      contact_method_set: false,
      compare_eligible: false,
    },
    2,
  ),
  withDefaults(
    {
      id: 3,
      study_room_name: '숨김 테스트 공부방',
      profile_status: 'hidden',
      inquiry_status: 'paused',
      detail_completion_status: 'expanded_complete',
      region_label: '서울 강남구 도곡동',
      main_subject_note: '영어',
      grade_band: '초4~6',
      price_amount: 380000,
      intro_short: '창의 융합 중심',
      intro_long: '독서 코칭 · 실험 수업',
      has_representative_image: true,
      has_subject_targets: true,
      has_regions: true,
      lesson_place_set: true,
      contact_method_set: true,
      compare_eligible: true,
      prime_eligible: true,
    },
    3,
  ),
];

function loadAll() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return SEED.map((r) => ({ ...r }));
    return JSON.parse(raw).rooms || [];
  } catch {
    return SEED.map((r) => ({ ...r }));
  }
}

function saveAll(rooms) {
  sessionStorage.setItem(KEY, JSON.stringify({ rooms }));
}

function nextId(rooms) {
  return rooms.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}

export function ensureStudyRoomStore() {
  if (isRegistrationsApiMode()) return;
  if (!sessionStorage.getItem(KEY)) saveAll(SEED.map((r) => ({ ...r })));
}

/** @returns {StudyRoomRecord[]} */
export function getStudyRooms(includeDeleted = false) {
  if (isRegistrationsApiMode()) {
    return getStudyRoomsCache().filter((r) => includeDeleted || !r.deleted_at);
  }
  ensureStudyRoomStore();
  return loadAll().filter((r) => includeDeleted || !r.deleted_at);
}

/** @param {number} id */
export function getStudyRoom(id) {
  return getStudyRooms(true).find((r) => r.id === id) || null;
}

/** @param {StudyRoomRecord} room */
export function getPublishReadiness(room) {
  /** @type {string[]} */
  const missing = [];
  const need = (ok, label) => {
    if (!ok) missing.push(label);
  };

  need(!!room.study_room_name?.trim(), '공부방명');
  need(room.has_regions && !!room.region_label, '활동 지역');
  need(room.has_subject_targets && !!room.main_subject_note, '대상·과목');
  need(room.lesson_place_set && !!room.lesson_place_type, '수업 방식');
  need(room.detail_completion_status === 'expanded_complete', '상세등록 완료');
  need(room.has_representative_image, '대표 이미지 1장 이상');
  need(!!(room.intro_short?.trim() || room.intro_long?.trim()), '소개문');
  need(room.contact_method_set, '문의·연락 방식');

  const checks = [
    !!room.study_room_name?.trim(),
    room.has_regions,
    room.has_subject_targets,
    room.lesson_place_set,
    room.detail_completion_status === 'expanded_complete',
    room.has_representative_image,
    !!(room.intro_short?.trim() || room.intro_long?.trim()),
    room.contact_method_set,
  ];
  const doneCount = checks.filter(Boolean).length;

  /** @type {string[]} */
  const qualityHints = [];
  if (room.detail_completion_status !== 'expanded_complete') {
    qualityHints.push('상세등록 완료 시 Prime/Pick 후보');
  }
  if (!room.intro_long?.trim()) qualityHints.push('상세 소개 보강 권장');
  if (!room.slogan?.trim()) qualityHints.push('슬로건 추가 권장');

  return {
    canPublish: missing.length === 0,
    detailRecommended: room.detail_completion_status !== 'expanded_complete',
    exposureBoostReady:
      room.profile_status === 'published' && room.detail_completion_status === 'expanded_complete',
    doneCount,
    totalCount: checks.length,
    missing,
    qualityHints,
  };
}

/** @param {'all'|'draft'|'published'|'hidden'|'not_ready'} tab */
export function getStudyRoomsByTab(tab) {
  const all = getStudyRooms();
  if (tab === 'all') return all;
  if (tab === 'not_ready') {
    return all.filter((r) => !getPublishReadiness(r).canPublish && r.profile_status !== 'hidden');
  }
  return all.filter((r) => r.profile_status === tab);
}

/** @param {number} id @param {Partial<StudyRoomRecord>} patch */
export function updateStudyRoom(id, patch) {
  const rooms = loadAll();
  const idx = rooms.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  rooms[idx] = { ...rooms[idx], ...patch, updated_at: new Date().toISOString() };
  saveAll(rooms);
  return rooms[idx];
}

/** @param {number} id */
export async function publishStudyRoom(id) {
  if (isRegistrationsApiMode()) {
    const data = await apiStudyRoomAction(id, 'publish');
    if (data.ok === false) return { ok: false, reason: data.reason, missing: data.missing };
    return { ok: true };
  }
  const room = getStudyRoom(id);
  if (!room) return { ok: false, reason: 'not_found' };
  const r = getPublishReadiness(room);
  if (!r.canPublish) return { ok: false, reason: 'incomplete', missing: r.missing };
  updateStudyRoom(id, {
    profile_status: 'published',
    published_at: new Date().toISOString(),
    compare_eligible: true,
  });
  return { ok: true };
}

/** @param {number} id */
export async function hideStudyRoom(id) {
  if (isRegistrationsApiMode()) {
    await apiStudyRoomAction(id, 'hide');
    return getStudyRoom(id);
  }
  return updateStudyRoom(id, { profile_status: 'hidden' });
}

/** @param {number} id */
export async function deleteStudyRoom(id) {
  if (isRegistrationsApiMode()) {
    await apiStudyRoomAction(id, 'delete');
    return null;
  }
  return updateStudyRoom(id, { deleted_at: new Date().toISOString(), profile_status: 'hidden' });
}

/** @param {number} id @param {StudyRoomRecord['inquiry_status']} inquiry_status */
export async function setInquiryStatus(id, inquiry_status) {
  if (isRegistrationsApiMode()) {
    await apiStudyRoomAction(id, 'inquiry_status', { inquiry_status });
    return getStudyRoom(id);
  }
  return updateStudyRoom(id, { inquiry_status });
}

export function getStudyRoomSummaryCounts() {
  const list = getStudyRooms();
  const notReady = list.filter(
    (r) => !getPublishReadiness(r).canPublish && r.profile_status !== 'hidden',
  ).length;
  return {
    published: list.filter((r) => r.profile_status === 'published').length,
    draft: list.filter((r) => r.profile_status === 'draft').length,
    hidden: list.filter((r) => r.profile_status === 'hidden').length,
    notReady,
  };
}

/** @param {Partial<StudyRoomRecord>} record */
export function addStudyRoom(record) {
  const rooms = loadAll();
  const id = nextId(rooms);
  const row = withDefaults({ ...record, profile_status: record.profile_status || 'draft' }, id);
  rooms.push(row);
  saveAll(rooms);
  return row;
}
