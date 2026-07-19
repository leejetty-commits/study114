/**
 * auth-ui → home-ui 자녀 기본등록 연동 (19§8-2 · 프리뷰)
 */

import { HOME_UI_BASE, AUTH_UI_BASE, parseHashQuery } from './preview-links.js';

export const STUDENT_IMPORT_PARAM = 'student_import';

/** @param {object} record */
export function encodeStudentImport(record) {
  const json = JSON.stringify(record);
  return btoa(encodeURIComponent(json));
}

/** @param {string} token */
export function decodeStudentImport(token) {
  try {
    return JSON.parse(decodeURIComponent(atob(token)));
  } catch {
    return null;
  }
}

/**
 * auth-ui basic-student FormData → home-ui StudentRecord patch
 * @param {Record<string, unknown>} data
 * @param {{ studentId?: number, regionLabel?: string, apiOk?: boolean }} [meta]
 */
export function mapAuthFormToStudentRecord(data, meta = {}) {
  const lessonPlaces = Array.isArray(data.lesson_places)
    ? data.lesson_places
    : data.lesson_places
      ? [data.lesson_places]
      : [];
  const teachingBadges = Array.isArray(data.teaching_style_badges)
    ? data.teaching_style_badges
    : data.teaching_style_badges
      ? [data.teaching_style_badges]
      : [];

  const lessonFormat = data.lesson_format ? String(data.lesson_format) : '';
  const preferredLessonType =
    data.preferred_lesson_type === 'study_room' ? 'study_room' : 'tutor';

  const studySlots = Array.isArray(data.preferred_studyroom_regions)
    ? data.preferred_studyroom_regions
    : null;
  const tutorSlots = Array.isArray(data.preferred_tutor_regions)
    ? data.preferred_tutor_regions
    : null;

  return {
    student_name: String(data.public_display_name || data.student_name || '새 등록'),
    public_display_name: String(data.public_display_name || ''),
    grade_level: String(data.grade_level || ''),
    school_level: String(data.school_level || ''),
    gender: String(data.gender || ''),
    birth_year: Number(data.birth_year) || undefined,
    preferred_lesson_type: preferredLessonType,
    region_id: data.region_id ? Number(data.region_id) : undefined,
    region_label: meta.regionLabel || String(data.region_label || ''),
    preferred_studyroom_region_basis:
      preferredLessonType === 'study_room' ? String(data.region_basis || data.preferred_studyroom_region_basis || 'dong') : undefined,
    preferred_studyroom_complex_id: data.complex_id ? Number(data.complex_id) : undefined,
    preferred_studyroom_region_id:
      preferredLessonType === 'study_room' && data.region_id
        ? Number(data.region_id)
        : data.preferred_studyroom_region_id
          ? Number(data.preferred_studyroom_region_id)
          : undefined,
    preferred_tutor_region_id:
      preferredLessonType === 'tutor' && data.region_id
        ? Number(data.region_id)
        : data.preferred_tutor_region_id
          ? Number(data.preferred_tutor_region_id)
          : undefined,
    preferred_studyroom_regions: studySlots,
    preferred_tutor_regions: tutorSlots,
    preferred_region_note: String(data.preferred_region_note || ''),
    subject_label: String(data.subject_names || data.subject_label || '').replace(/,/g, ' · '),
    lesson_places: lessonPlaces,
    lesson_format: lessonFormat,
    student_gender_group:
      lessonFormat === 'group' ? String(data.student_gender_group || 'mixed') : '',
    preferred_student_count_group: data.preferred_student_count_group
      ? String(data.preferred_student_count_group)
      : '',
    lessons_per_week: Number(data.lessons_per_week) || undefined,
    minutes_per_lesson: Number(data.minutes_per_lesson) || undefined,
    teaching_style_badges: teachingBadges,
    preferred_fee_amount: Number(data.preferred_fee_amount) || undefined,
    preferred_studyroom_fee_amount: Number(data.preferred_studyroom_fee_amount) || undefined,
    preferred_tutor_gender: '',
    request_summary: String(data.request_summary || ''),
    request_summary_visibility:
      data.request_summary_visibility === 'paid_only' ? 'paid_only' : 'private',
    special_request_note: String(data.special_request_note || ''),
    special_request_visibility:
      data.special_request_visibility === 'paid_only' ? 'paid_only' : 'private',
    exposure_status: 'draft',
    api_student_id: meta.studentId,
    api_registered: !!meta.apiOk,
  };
}

/** @param {object} record */
export function buildHomeStudentImportUrl(record) {
  const token = encodeStudentImport(record);
  return `${HOME_UI_BASE}/#/mypage/registrations/students?${STUDENT_IMPORT_PARAM}=${encodeURIComponent(token)}`;
}

/** auth-ui 「자녀 추가」 진입 URL */
export function authStudentAddUrl() {
  return `${AUTH_UI_BASE}/#/signup/basic?return_import=1&role=student`;
}

export function isReturnImportMode() {
  const q = parseHashQuery();
  return q.return_import === '1';
}

export function getReturnImportRole() {
  const q = parseHashQuery();
  return q.role === 'student' ? 'student' : null;
}

/** @returns {object | null} */
export function parseStudentImportFromHash() {
  const q = parseHashQuery();
  const raw = q[STUDENT_IMPORT_PARAM];
  if (!raw) return null;
  return decodeStudentImport(decodeURIComponent(raw));
}

/** hash에서 import 쿼리 제거 */
export function stripStudentImportFromHash() {
  const hash = window.location.hash.slice(1);
  const qIdx = hash.indexOf('?');
  if (qIdx === -1) return;
  const path = hash.slice(0, qIdx);
  window.location.replace(`${window.location.pathname}#${path}`);
}
