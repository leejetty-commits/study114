/** 19장 students 프리뷰 — sessionStorage `[임시]` · Dev 학부모 로그인 시 API */

import {
  decodeStudentImport,
  STUDENT_IMPORT_PARAM,
} from '../../../shared/student-auth-bridge.js';
import {
  hydrateDualHopeRegions,
  primaryHopeRegionLabel,
} from '../../../shared/student-hope-regions.js';
import { parseHashQuery } from '../../../shared/preview-links.js';
import {
  isRegistrationsApiMode,
  getStudentsCache,
  apiStudentAction,
} from '../registrations-backend.js';

const KEY = 'study114-preview-students-v3';

/**
 * @typedef {import('../../../shared/student-hope-regions.js').HopeRegionSlot} HopeRegionSlot
 * @typedef {object} StudentRecord
 * @property {number} id
 * @property {string} student_name
 * @property {string} public_display_name
 * @property {string} grade_level
 * @property {string} [school_level]
 * @property {string} [gender]
 * @property {number} [birth_year]
 * @property {'draft'|'published'|'hidden'|'deleted'} exposure_status
 * @property {'tutor'|'study_room'} [preferred_lesson_type]
 * @property {number} [region_id]
 * @property {string} [region_label]
 * @property {string} [preferred_region_note]
 * @property {HopeRegionSlot[]} [preferred_studyroom_regions]
 * @property {HopeRegionSlot[]} [preferred_tutor_regions]
 * @property {string|number} [preferred_studyroom_region_id]
 * @property {string|number} [preferred_tutor_region_id]
 * @property {string|number} [preferred_studyroom_complex_id]
 * @property {'dong'|'complex'|string} [preferred_studyroom_region_basis]
 * @property {string} [subject_label]
 * @property {string[]} [lesson_places]
 * @property {'one_on_one'|'group'} [lesson_format]
 * @property {string} [student_gender_group]
 * @property {string} [preferred_student_count_group]
 * @property {number} [lessons_per_week]
 * @property {number} [minutes_per_lesson]
 * @property {string[]} [teaching_style_badges]
 * @property {number} [preferred_fee_amount]
 * @property {number} [preferred_studyroom_fee_amount]
 * @property {string} [preferred_tutor_gender]
 * @property {string} [request_summary]
 * @property {string} [special_request_note]
 * @property {string} [updated_at]
 * @property {string} [published_at]
 * @property {number} [api_student_id]
 * @property {boolean} [api_registered]
 */

/** @param {Partial<StudentRecord>} raw @returns {StudentRecord} */
function withDefaults(raw, id) {
  const base = {
    lesson_places: ['student_home'],
    lesson_format: 'one_on_one',
    preferred_student_count_group: 'solo',
    teaching_style_badges: ['meticulous'],
    lessons_per_week: 2,
    minutes_per_lesson: 90,
    preferred_fee_amount: 550000,
    preferred_studyroom_fee_amount: 420000,
    school_level: 'middle',
    subject_label: '수학',
    ...raw,
    id,
    updated_at: raw.updated_at || new Date().toISOString(),
  };
  const dual = hydrateDualHopeRegions(base);
  const merged = { ...base, ...dual };
  const primary = primaryHopeRegionLabel(merged);
  if (primary) merged.region_label = primary;
  return /** @type {StudentRecord} */ (merged);
}

function loadAll() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw).students || [];
  } catch {
    return [];
  }
}

function saveAll(students) {
  sessionStorage.setItem(KEY, JSON.stringify({ students }));
}

function nextId(students) {
  return students.reduce((max, s) => Math.max(max, s.id), 0) + 1;
}

export function ensureStudentStore() {
  if (isRegistrationsApiMode()) return;
  if (!sessionStorage.getItem(KEY)) saveAll([]);
}

/** @returns {StudentRecord[]} */
export function getStudents(includeDeleted = false) {
  if (isRegistrationsApiMode()) {
    return getStudentsCache().filter((s) => includeDeleted || s.exposure_status !== 'deleted');
  }
  ensureStudentStore();
  return loadAll().filter((s) => includeDeleted || s.exposure_status !== 'deleted');
}

/** @param {number} id */
export function getStudent(id) {
  const row = getStudents(true).find((s) => s.id === id) || null;
  if (!row) return null;
  const dual = hydrateDualHopeRegions(row);
  const merged = { ...row, ...dual };
  const primary = primaryHopeRegionLabel(merged);
  if (primary) merged.region_label = primary;
  return merged;
}

/** @param {'all'|'draft'|'published'|'hidden'} tab */
export function getStudentsByTab(tab) {
  const all = getStudents();
  if (tab === 'all') return all;
  return all.filter((s) => s.exposure_status === tab);
}

/** @param {number} id @param {Partial<StudentRecord>} patch */
export async function updateStudent(id, patch) {
  if (isRegistrationsApiMode()) {
    await apiStudentAction(id, 'update', { patch });
    return getStudent(id);
  }
  const students = loadAll();
  const idx = students.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  students[idx] = { ...students[idx], ...patch, updated_at: new Date().toISOString() };
  saveAll(students);
  return students[idx];
}

/** @param {Partial<StudentRecord>} record */
export function addStudent(record) {
  const students = loadAll();
  const id = nextId(students);
  const row = withDefaults({ ...record, exposure_status: record.exposure_status || 'draft' }, id);
  students.push(row);
  saveAll(students);
  return row;
}

/**
 * 노출 조건 = 기본정보 여덟 칸(한 줄 요청문 제외). 정본은 서버 StudentBasicCompleteness 이고,
 * API 모드에서는 서버가 내려준 basic_missing 을 그대로 쓴다. 상세 항목은 조건이 아니다.
 * @param {StudentRecord} student
 */
export function getPublishReadiness(student) {
  if (Array.isArray(student.basic_missing)) {
    const missing = student.basic_missing.map(String);
    return { basicOk: missing.length === 0, detailOk: true, canPublish: missing.length === 0, missing };
  }
  const missing = [];
  const need = (ok, label) => {
    if (!ok) missing.push(label);
  };
  const isId = (v) => /^[1-9]\d*$/.test(String(v ?? ''));
  const isAmount = (v) => v !== null && v !== undefined && /^\d+$/.test(String(v)) && Number(v) >= 1;
  const study = student.preferred_lesson_type === 'study_room';
  const tutor = student.preferred_lesson_type === 'tutor';

  need(String(student.public_display_name || '').trim() !== '', '표시명');
  need(String(student.grade_level || '').trim() !== '' || student.school_level === 'preschool', '학교급·학년');
  need(study || tutor, '희망 유형');
  need(
    study
      ? isId(student.preferred_studyroom_region_id)
          || (student.preferred_studyroom_region_basis === 'complex' && isId(student.preferred_studyroom_complex_id))
      : tutor && isId(student.preferred_tutor_region_id),
    '희망지역',
  );
  need(String(student.subject_label || '').trim() !== '', '희망과목');
  need(student.lesson_format === 'one_on_one' || student.lesson_format === 'group', '수업형태');
  need(student.lesson_format === 'one_on_one' || !!student.preferred_student_count_group, '수업인원');
  need(
    study ? isAmount(student.preferred_studyroom_fee_amount) : tutor && isAmount(student.preferred_fee_amount),
    '예산',
  );

  return { basicOk: missing.length === 0, detailOk: true, canPublish: missing.length === 0, missing };
}

export function getStudentSummaryCounts() {
  const list = getStudents();
  return {
    published: list.filter((s) => s.exposure_status === 'published').length,
    draft: list.filter((s) => s.exposure_status === 'draft').length,
    hidden: list.filter((s) => s.exposure_status === 'hidden').length,
  };
}

/** hash `?student_import=` 소비. 활성 학생이 이미 있으면 추가하지 않는다. */
export function consumeStudentImportFromHash() {
  const q = parseHashQuery();
  const raw = q[STUDENT_IMPORT_PARAM];
  if (!raw) return null;
  const payload = decodeStudentImport(decodeURIComponent(raw));
  if (!payload) return null;
  const active = getStudents().filter((s) => s && s.exposure_status !== 'deleted');
  if (active.length >= 1) {
    const hash = window.location.hash.slice(1);
    const pathOnly = hash.split('?')[0] || '/mypage/registrations/students';
    window.location.replace(`${window.location.pathname}#${pathOnly}`);
    return null;
  }

  const student = addStudent(payload);
  const hash = window.location.hash.slice(1);
  const pathOnly = hash.split('?')[0] || '/mypage/registrations/students';
  window.location.replace(`${window.location.pathname}#${pathOnly}`);
  return student;
}
