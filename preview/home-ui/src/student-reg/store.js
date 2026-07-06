/** 19장 students 프리뷰 — sessionStorage `[임시]` · Dev 학부모 로그인 시 API */

import {
  decodeStudentImport,
  STUDENT_IMPORT_PARAM,
} from '../../../shared/student-auth-bridge.js';
import { parseHashQuery } from '../../../shared/preview-links.js';
import {
  isRegistrationsApiMode,
  getStudentsCache,
  apiStudentAction,
} from '../registrations-backend.js';

const KEY = 'study114-preview-students-v2';

/**
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
 * @property {'private'|'paid_only'} [request_summary_visibility]
 * @property {string} [special_request_note]
 * @property {'private'|'paid_only'} [special_request_visibility]
 * @property {string} [updated_at]
 * @property {string} [published_at]
 * @property {number} [api_student_id]
 * @property {boolean} [api_registered]
 */

/** @returns {StudentRecord} */
function withDefaults(raw, id) {
  return {
    lesson_places: ['student_home'],
    lesson_format: 'one_on_one',
    preferred_student_count_group: 'solo',
    teaching_style_badges: ['meticulous'],
    lessons_per_week: 2,
    minutes_per_lesson: 90,
    preferred_fee_amount: 550000,
    preferred_studyroom_fee_amount: 420000,
    request_summary_visibility: 'private',
    special_request_visibility: 'private',
    region_label: '서울특별시 강남구 대치동',
    school_level: 'middle',
    subject_label: '수학',
    ...raw,
    id,
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

const SEED = [
  withDefaults(
    {
      id: 1,
      student_name: '김하늘',
      public_display_name: '맑은하늘',
      grade_level: '중2',
      gender: 'female',
      birth_year: 2012,
      exposure_status: 'published',
      preferred_lesson_type: 'tutor',
      preferred_tutor_gender: 'female',
      request_summary: '주 2회 수학 집중',
      request_summary_visibility: 'paid_only',
      published_at: new Date().toISOString(),
    },
    1,
  ),
  withDefaults(
    {
      id: 2,
      student_name: '김왕자',
      public_display_name: '초등왕',
      grade_level: '초5',
      gender: 'male',
      birth_year: 2015,
      exposure_status: 'draft',
      preferred_lesson_type: 'study_room',
      preferred_tutor_gender: '',
      lesson_format: 'one_on_one',
      subject_label: '영어',
      preferred_studyroom_fee_amount: 380000,
    },
    2,
  ),
  withDefaults(
    {
      id: 3,
      student_name: '김별',
      public_display_name: '숨김테스트',
      grade_level: '중1',
      gender: 'male',
      birth_year: 2013,
      exposure_status: 'hidden',
      preferred_lesson_type: 'tutor',
      preferred_tutor_gender: 'any',
    },
    3,
  ),
];

function loadAll() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return SEED.map((s) => ({ ...s }));
    return JSON.parse(raw).students || [];
  } catch {
    return SEED.map((s) => ({ ...s }));
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
  if (!sessionStorage.getItem(KEY)) saveAll(SEED.map((s) => ({ ...s })));
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
  return getStudents(true).find((s) => s.id === id) || null;
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

/** @param {StudentRecord} student */
export function getPublishReadiness(student) {
  const missing = [];
  const need = (ok, label) => {
    if (!ok) missing.push(label);
  };

  need(!!student.public_display_name, '공개 표시명 (기본등록)');
  need(!!student.grade_level, '학년 (기본등록)');
  need(!!student.gender, '학생 성별 (기본등록)');
  need(!!student.birth_year, '출생연도 (기본등록)');
  need(!!student.preferred_lesson_type, '희망 유형 (기본등록)');
  need(!!student.region_label, '희망 지역 (기본등록)');
  need(!!student.subject_label, '희망 과목 (기본등록)');
  need(Array.isArray(student.lesson_places) && student.lesson_places.length > 0, '희망 수업장소 (기본등록)');
  need(!!student.lesson_format, '수업형태 (기본등록)');
  if (student.lesson_format === 'group') {
    need(!!student.student_gender_group, '그룹 구성 (기본등록)');
    need(!!student.preferred_student_count_group && student.preferred_student_count_group !== 'solo', '희망 수업인원 (기본등록)');
  } else {
    need(!!student.preferred_student_count_group, '희망 수업인원 (기본등록)');
  }
  need(!!student.lessons_per_week, '주 횟수 (기본등록)');
  need(!!student.minutes_per_lesson, '1회 시간 (기본등록)');
  need(Array.isArray(student.teaching_style_badges) && student.teaching_style_badges.length > 0, '희망 강의스타일 (기본등록)');
  if (student.preferred_lesson_type === 'study_room') {
    need(!!student.preferred_studyroom_fee_amount, '수업예산 공부방 (기본등록)');
  } else {
    need(!!student.preferred_fee_amount, '수업예산 과외 (기본등록)');
  }
  need(!!student.preferred_tutor_gender, '희망 과외쌤 성별 (상세등록)');

  const basicMissing = missing.filter((m) => m.includes('기본등록'));
  const detailMissing = missing.filter((m) => m.includes('상세등록'));

  return {
    basicOk: basicMissing.length === 0,
    detailOk: detailMissing.length === 0,
    canPublish: missing.length === 0,
    missing,
  };
}

/** @param {number} id */
export async function publishStudent(id) {
  if (isRegistrationsApiMode()) {
    const data = await apiStudentAction(id, 'publish');
    if (data.ok === false) return { ok: false, reason: data.reason, missing: data.missing };
    return { ok: true };
  }
  const s = getStudent(id);
  if (!s) return { ok: false, reason: 'not_found' };
  const r = getPublishReadiness(s);
  if (!r.canPublish) return { ok: false, reason: 'incomplete', missing: r.missing };
  updateStudent(id, { exposure_status: 'published', published_at: new Date().toISOString() });
  return { ok: true };
}

/** @param {number} id */
export async function hideStudent(id) {
  if (isRegistrationsApiMode()) {
    await apiStudentAction(id, 'hide');
    return getStudent(id);
  }
  return updateStudent(id, { exposure_status: 'hidden' });
}

/** @param {number} id */
export async function deleteStudent(id) {
  if (isRegistrationsApiMode()) {
    await apiStudentAction(id, 'delete');
    return null;
  }
  return updateStudent(id, { exposure_status: 'deleted' });
}

export function getStudentSummaryCounts() {
  const list = getStudents();
  return {
    published: list.filter((s) => s.exposure_status === 'published').length,
    draft: list.filter((s) => s.exposure_status === 'draft').length,
    hidden: list.filter((s) => s.exposure_status === 'hidden').length,
  };
}

/** hash `?student_import=` 소비 → 신규 draft 자녀 추가 */
export function consumeStudentImportFromHash() {
  const q = parseHashQuery();
  const raw = q[STUDENT_IMPORT_PARAM];
  if (!raw) return null;
  const payload = decodeStudentImport(decodeURIComponent(raw));
  if (!payload) return null;

  const student = addStudent(payload);
  const hash = window.location.hash.slice(1);
  const pathOnly = hash.split('?')[0] || '/mypage/registrations/students';
  window.location.replace(`${window.location.pathname}#${pathOnly}`);
  return student;
}
