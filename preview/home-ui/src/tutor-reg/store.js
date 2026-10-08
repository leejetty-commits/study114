/** 21장 tutors 프리뷰 — sessionStorage `[임시]` · Dev 과외 로그인 시 API */

import { previewState } from '../state.js';
import {
  isRegistrationsApiMode,
  getTutorsCache,
  apiTutorAction,
  hydrateRegistrationsCache,
} from '../registrations-backend.js';
import { getMemoTicketsRemaining } from '../provider-entitlement.js';
import { isMessagesApiMode } from '../messages-backend.js';
import { isPaidRoiApiMode } from '../paid-backend.js';
import {
  TUTOR_BASIC_FIELD_KEYS,
  tutorBasicOkMap,
  tutorBasicMissing,
  tutorBasicValuesFromRecord,
} from '../../../shared/tutor-basic-fields.js';

const KEY = 'study114-preview-tutors-v1';

/**
 * @typedef {object} TutorRecord
 * @property {number} id
 * @property {string} tutor_display_name
 * @property {'draft'|'published'|'hidden'} profile_status
 * @property {'open'|'paused'|'not_accepting'} [inquiry_status]
 * @property {'basic_only'|'expanded_in_progress'|'expanded_complete'} detail_completion_status
 * @property {string} location_label
 * @property {string} primary_region_label
 * @property {string} [primary_region_id]
 * @property {{region_id: string, scope_type: string, is_primary: boolean}[]} [saved_regions]
 * @property {string} main_subject_note
 * @property {string} [grade_band]
 * @property {string} [school_level] 대표 과목 행 학교급 코드
 * @property {string} [slogan]
 * @property {number} [preferred_fee_amount]
 * @property {string} [fee_basis_type]
 * @property {number} [lessons_per_week]
 * @property {number} [monthly_session_count]
 * @property {number} [minutes_per_lesson]
 * @property {string} [fee_description]
 * @property {string} [intro_short]
 * @property {string} [intro_long]
 * @property {string} [contact_time_note]
 * @property {string} [feature_1]
 * @property {string} [feature_2]
 * @property {string} [feature_3]
 * @property {string} [university_name]
 * @property {string} [major_name]
 * @property {string} [university_status]
 * @property {boolean} proof_document_available
 * @property {boolean} has_primary_region
 * @property {boolean} has_primary_subject
 * @property {boolean} has_lesson_places
 * @property {boolean} has_profile_image
 * @property {{ id?: string|number, name?: string, image_path?: string, basic_720_path?: string, prime_1280_path?: string, sort_order?: number, image_type?: string, crop_x?: number, crop_y?: number }[]} [profile_images]
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
  if (isMessagesApiMode() || isPaidRoiApiMode() || isRegistrationsApiMode()) {
    return getMemoTicketsRemaining();
  }
  return isPaidProvider() ? 3 : 0;
}

function loadAll() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw).tutors || [];
  } catch {
    return [];
  }
}

function saveAll(tutors) {
  sessionStorage.setItem(KEY, JSON.stringify({ tutors }));
}

function nextId(tutors) {
  return tutors.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}

export function ensureTutorStore() {
  if (isRegistrationsApiMode()) return;
  if (!sessionStorage.getItem(KEY)) saveAll([]);
}

/** @returns {TutorRecord[]} */
export function getTutors(includeDeleted = false) {
  if (isRegistrationsApiMode()) {
    return getTutorsCache().filter((r) => includeDeleted || !r.deleted_at);
  }
  ensureTutorStore();
  return loadAll().filter((r) => includeDeleted || !r.deleted_at);
}

/** @param {number} id */
export function getTutor(id) {
  return getTutors(true).find((r) => r.id === id) || null;
}

/** @param {TutorRecord} tutor */
export function getPublishReadiness(tutor) {
  /** 기본정보 항목은 shared/tutor-basic-fields.js 한 목록 (서버 TutorHubService::publishMissing 과 같음) */
  const basicOk = tutorBasicOkMap(tutorBasicValuesFromRecord(tutor));
  /** @type {string[]} */
  const missing = tutorBasicMissing(tutorBasicValuesFromRecord(tutor));
  const need = (ok, label) => {
    if (!ok) missing.push(label);
  };

  const detailDone = tutor.detail_completion_status === 'expanded_complete';
  const introDone = !!(tutor.intro_short?.trim() || tutor.intro_long?.trim());
  need(detailDone, '상세등록 완료');
  need(introDone, '소개문');

  if (Array.isArray(tutor.detail_missing) && tutor.detail_missing.length) {
    for (const label of tutor.detail_missing) {
      if (!missing.includes(label)) missing.push(label);
    }
  }

  const checks = [...TUTOR_BASIC_FIELD_KEYS.map((key) => basicOk[key]), detailDone, introDone];
  const doneCount = checks.filter(Boolean).length;

  /** @type {string[]} */
  const qualityHints = [];
  if (tutor.detail_completion_status !== 'expanded_complete') {
    qualityHints.push('상세등록 완료 시 추천 노출 신청 가능');
  }
  if (!tutor.education_doc_public) qualityHints.push('학력정보 공개 시 신뢰정보 표시');
  if (!tutor.intro_long?.trim()) qualityHints.push('상세 소개 보강 권장');

  return {
    canPublish: missing.length === 0,
    detailRecommended: tutor.detail_completion_status !== 'expanded_complete',
    exposureBoostReady: tutor.detail_completion_status === 'expanded_complete',
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

/** @param {unknown} tutor @returns {'open'|'paused'|'not_accepting'|null} */
function inquiryStatusFromTutor(tutor) {
  if (!tutor || typeof tutor !== 'object' || Array.isArray(tutor)) return null;
  const status = /** @type {{ inquiry_status?: unknown }} */ (tutor).inquiry_status;
  return status === 'open' || status === 'paused' || status === 'not_accepting' ? status : null;
}

/** @param {number} id @param {'open'|'paused'|'not_accepting'} inquiry_status */
export async function setTutorInquiryStatus(id, inquiry_status) {
  if (inquiry_status !== 'open' && inquiry_status !== 'paused' && inquiry_status !== 'not_accepting') {
    throw new Error('inquiry_status: open | paused | not_accepting');
  }
  if (isRegistrationsApiMode()) {
    const data = await apiTutorAction(id, 'inquiry_status', { inquiry_status });
    let saved = inquiryStatusFromTutor(data?.tutor);
    if (saved !== inquiry_status) {
      await hydrateRegistrationsCache();
      saved = inquiryStatusFromTutor(getTutor(id));
    }
    if (saved !== inquiry_status) {
      throw new Error('저장 후 서버 상태를 확인하지 못했습니다. 새로고침 후 다시 확인해 주세요.');
    }
    return getTutor(id);
  }
  return updateTutor(id, { inquiry_status });
}

/** @param {number} id */
export async function publishTutor(id) {
  if (isRegistrationsApiMode()) {
    try {
      await apiTutorAction(id, 'publish');
    } catch (err) {
      const data = err?.payload;
      if (data?.ok === false && data.reason) return { ok: false, reason: data.reason, missing: data.missing };
      throw err;
    }
    return { ok: true };
  }
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
