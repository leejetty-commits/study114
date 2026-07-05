/** 21장 tutors 프리뷰 — sessionStorage `[임시]` */

import { previewState } from '../state.js';

const KEY = 'study114-preview-tutors-v1';

/**
 * @typedef {object} TutorRecord
 * @property {number} id
 * @property {string} tutor_display_name
 * @property {'draft'|'published'|'hidden'} profile_status
 * @property {'basic_only'|'expanded_in_progress'|'expanded_complete'} detail_completion_status
 * @property {string} location_label
 * @property {string} primary_region_label
 * @property {string} main_subject_note
 * @property {string} [grade_band]
 * @property {number} [preferred_fee_amount]
 * @property {number} [lessons_per_week]
 * @property {number} [minutes_per_lesson]
 * @property {string} [intro_short]
 * @property {string} [intro_long]
 * @property {string} [feature_1]
 * @property {string} [university_name]
 * @property {string} [major_name]
 * @property {string} [university_status]
 * @property {boolean} proof_document_available
 * @property {boolean} has_primary_region
 * @property {boolean} has_primary_subject
 * @property {boolean} has_lesson_places
 * @property {boolean} has_profile_image
 * @property {boolean} education_doc_submitted
 * @property {boolean} education_doc_public
 * @property {boolean} career_doc_submitted
 * @property {boolean} compare_eligible
 * @property {string} [student_gender_group]
 * @property {string} [student_count_group]
 * @property {string[]} [lesson_places]
 * @property {string[]} [teaching_style_badges]
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

/** @returns {boolean} */
export function isPaidProvider() {
  return previewState.providerSubscription === 'paid';
}

/** @returns {number} */
export function getMemoCreditsRemaining() {
  return isPaidProvider() ? 3 : 0;
}

/** @returns {TutorRecord} */
function withDefaults(raw, id) {
  return {
    detail_completion_status: 'basic_only',
    proof_document_available: false,
    has_primary_region: false,
    has_primary_subject: false,
    has_lesson_places: false,
    has_profile_image: false,
    education_doc_submitted: false,
    education_doc_public: false,
    career_doc_submitted: false,
    compare_eligible: false,
    lesson_places: [],
    teaching_style_badges: [],
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
      tutor_display_name: '김수학',
      profile_status: 'published',
      detail_completion_status: 'expanded_complete',
      location_label: '서울특별시 · 대치·도곡',
      primary_region_label: '서울특별시',
      main_subject_note: '수학',
      grade_band: '중·고',
      preferred_fee_amount: 480000,
      lessons_per_week: 2,
      minutes_per_lesson: 90,
      intro_short: '중·고 수학 전문 · 대치동 거주',
      intro_long: '내신 1등급 다수 배출 · 개념+유형 병행',
      feature_1: '내신 1등급 다수',
      university_name: '서울대학교',
      major_name: '수학과',
      university_status: 'graduated',
      proof_document_available: true,
      has_primary_region: true,
      has_primary_subject: true,
      has_lesson_places: true,
      has_profile_image: true,
      education_doc_submitted: true,
      education_doc_public: true,
      career_doc_submitted: true,
      compare_eligible: true,
      student_gender_group: 'mixed',
      student_count_group: 'solo',
      lesson_places: ['student_home_visit', 'public_place'],
      teaching_style_badges: ['meticulous', 'concept_focus'],
      published_at: new Date().toISOString(),
    },
    1,
  ),
  withDefaults(
    {
      id: 2,
      tutor_display_name: '박국어',
      profile_status: 'draft',
      detail_completion_status: 'basic_only',
      location_label: '서울 강남구',
      primary_region_label: '',
      main_subject_note: '국어',
      preferred_fee_amount: 400000,
      intro_short: '',
      has_primary_subject: true,
      has_lesson_places: false,
      education_doc_submitted: false,
      compare_eligible: false,
    },
    2,
  ),
  withDefaults(
    {
      id: 3,
      tutor_display_name: '이영어',
      profile_status: 'hidden',
      detail_completion_status: 'expanded_complete',
      location_label: '서울특별시 · 대치동',
      primary_region_label: '서울특별시',
      main_subject_note: '영어',
      preferred_fee_amount: 440000,
      intro_short: '회화·문법 병행',
      has_primary_region: true,
      has_primary_subject: true,
      has_lesson_places: true,
      has_profile_image: true,
      education_doc_submitted: true,
      education_doc_public: false,
      compare_eligible: true,
    },
    3,
  ),
];

function loadAll() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return SEED.map((r) => ({ ...r }));
    return JSON.parse(raw).tutors || [];
  } catch {
    return SEED.map((r) => ({ ...r }));
  }
}

function saveAll(tutors) {
  sessionStorage.setItem(KEY, JSON.stringify({ tutors }));
}

function nextId(tutors) {
  return tutors.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}

export function ensureTutorStore() {
  if (!sessionStorage.getItem(KEY)) saveAll(SEED.map((r) => ({ ...r })));
}

/** @returns {TutorRecord[]} */
export function getTutors(includeDeleted = false) {
  ensureTutorStore();
  return loadAll().filter((r) => includeDeleted || !r.deleted_at);
}

/** @param {number} id */
export function getTutor(id) {
  return getTutors(true).find((r) => r.id === id) || null;
}

/** @param {TutorRecord} tutor */
export function getPublishReadiness(tutor) {
  /** @type {string[]} */
  const missing = [];
  const need = (ok, label) => {
    if (!ok) missing.push(label);
  };

  need(!!tutor.tutor_display_name?.trim(), '표시명');
  need(tutor.has_primary_region && !!tutor.primary_region_label, '대표 활동 시');
  need(tutor.has_primary_subject && !!tutor.main_subject_note, '주력과목');
  need(tutor.has_lesson_places, '강의장소');
  need(!!tutor.preferred_fee_amount, '과외비');
  need(tutor.detail_completion_status === 'expanded_complete', '상세등록 완료');
  need(tutor.has_profile_image, '프로필 이미지');
  need(!!(tutor.intro_short?.trim() || tutor.intro_long?.trim()), '소개문');

  const checks = [
    !!tutor.tutor_display_name?.trim(),
    tutor.has_primary_region,
    tutor.has_primary_subject,
    tutor.has_lesson_places,
    !!tutor.preferred_fee_amount,
    tutor.detail_completion_status === 'expanded_complete',
    tutor.has_profile_image,
    !!(tutor.intro_short?.trim() || tutor.intro_long?.trim()),
  ];
  const doneCount = checks.filter(Boolean).length;

  /** @type {string[]} */
  const qualityHints = [];
  if (tutor.detail_completion_status !== 'expanded_complete') {
    qualityHints.push('상세등록 완료 시 Pick 신청 가능');
  }
  if (!tutor.education_doc_public) qualityHints.push('학력정보 공개 시 신뢰정보 표시');
  if (!tutor.intro_long?.trim()) qualityHints.push('상세 소개 보강 권장');

  return {
    canPublish: missing.length === 0,
    detailRecommended: tutor.detail_completion_status !== 'expanded_complete',
    exposureBoostReady:
      tutor.profile_status === 'published' && tutor.detail_completion_status === 'expanded_complete',
    doneCount,
    totalCount: checks.length,
    missing,
    qualityHints,
  };
}

/** @param {'all'|'draft'|'published'|'hidden'|'not_ready'} tab */
export function getTutorsByTab(tab) {
  const all = getTutors();
  if (tab === 'all') return all;
  if (tab === 'not_ready') {
    return all.filter((t) => !getPublishReadiness(t).canPublish && t.profile_status !== 'hidden');
  }
  return all.filter((r) => r.profile_status === tab);
}

/** @param {number} id @param {Partial<TutorRecord>} patch */
export function updateTutor(id, patch) {
  const tutors = loadAll();
  const idx = tutors.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  tutors[idx] = { ...tutors[idx], ...patch, updated_at: new Date().toISOString() };
  saveAll(tutors);
  return tutors[idx];
}

/** @param {number} id */
export function publishTutor(id) {
  const tutor = getTutor(id);
  if (!tutor) return { ok: false, reason: 'not_found' };
  const r = getPublishReadiness(tutor);
  if (!r.canPublish) return { ok: false, reason: 'incomplete', missing: r.missing };
  updateTutor(id, {
    profile_status: 'published',
    published_at: new Date().toISOString(),
    compare_eligible: true,
  });
  return { ok: true };
}

/** @param {number} id */
export function hideTutor(id) {
  return updateTutor(id, { profile_status: 'hidden' });
}

/** @param {number} id */
export function deleteTutor(id) {
  return updateTutor(id, { deleted_at: new Date().toISOString(), profile_status: 'hidden' });
}

export function getTutorSummaryCounts() {
  const list = getTutors();
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
