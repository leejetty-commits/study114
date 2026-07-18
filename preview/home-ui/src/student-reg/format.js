/** P19 — 학생 레코드 라벨 · 13§7-4 exposure 행 매핑 */

import { primaryHopeRegionLabel } from '../../../shared/student-hope-regions.js';
import {
  LESSON_FORMAT_LABELS,
  SCHOOL_LEVEL_LABELS,
  STUDENT_COUNT_LABELS,
  STUDENT_GENDER_GROUP_LABELS,
  STUDENT_PLACE_LABELS,
  TEACHING_STYLE_LABELS,
} from '../student-enums.js';
import { VISIBILITY_OPTIONS } from './student-reg-copy.js';

export { VISIBILITY_OPTIONS };

const LESSON_TYPE_LABELS = {
  tutor: '과외',
  study_room: '공부방',
};

/** @param {import('./store.js').StudentRecord} s */
export function studentToExposureRow(s) {
  const places = Array.isArray(s.lesson_places) ? s.lesson_places : [];
  return {
    id: s.id,
    public_display_name: s.public_display_name,
    gender: s.gender,
    grade_level: s.grade_level,
    subject_label: s.subject_label || '—',
    location_label: primaryHopeRegionLabel(s) || s.region_label || '—',
    lesson_places: places,
    lesson_format: s.lesson_format,
    student_gender_group: s.student_gender_group,
    preferred_student_count_group: s.preferred_student_count_group,
    lessons_per_week: s.lessons_per_week,
    minutes_per_lesson: s.minutes_per_lesson,
    teaching_style_badges: s.teaching_style_badges || [],
    preferred_lesson_type: s.preferred_lesson_type,
    preferred_fee_amount: s.preferred_fee_amount,
    preferred_studyroom_fee_amount: s.preferred_studyroom_fee_amount,
    request_summary: s.request_summary,
    request_summary_visibility: s.request_summary_visibility,
  };
}

/** @param {import('./store.js').StudentRecord} s */
export function formatStudentSummaryLine(s) {
  const type = LESSON_TYPE_LABELS[s.preferred_lesson_type] || s.preferred_lesson_type || '—';
  const fmt = LESSON_FORMAT_LABELS[s.lesson_format] || '';
  return [s.grade_level, s.subject_label, type, fmt].filter(Boolean).join(' · ');
}

export function labelPlaces(codes) {
  const list = Array.isArray(codes) ? codes : [];
  return list.map((c) => STUDENT_PLACE_LABELS[c] || c).join(', ') || '—';
}

export function labelTeachingStyles(codes) {
  const list = Array.isArray(codes) ? codes : [];
  return list.map((c) => TEACHING_STYLE_LABELS[c] || c).join(', ') || '—';
}

export function labelLessonTarget(s) {
  if (s.lesson_format === 'group') {
    const g = STUDENT_GENDER_GROUP_LABELS[s.student_gender_group] || '';
    const c = STUDENT_COUNT_LABELS[s.preferred_student_count_group] || '';
    return [g, c].filter(Boolean).join(' · ') || '—';
  }
  return STUDENT_COUNT_LABELS[s.preferred_student_count_group] || '단독';
}

export function labelBudget(s) {
  if (s.preferred_lesson_type === 'study_room') {
    return s.preferred_studyroom_fee_amount
      ? `월 ${Number(s.preferred_studyroom_fee_amount).toLocaleString('ko-KR')}원`
      : '—';
  }
  return s.preferred_fee_amount
    ? `월 ${Number(s.preferred_fee_amount).toLocaleString('ko-KR')}원`
    : '—';
}

export function labelSchoolLevel(code) {
  return SCHOOL_LEVEL_LABELS[code] || code || '—';
}

export const FORM_OPTIONS = {
  lessonPlaces: Object.entries(STUDENT_PLACE_LABELS).map(([value, label]) => ({ value, label })),
  lessonFormat: Object.entries(LESSON_FORMAT_LABELS).map(([value, label]) => ({ value, label })),
  genderGroup: Object.entries(STUDENT_GENDER_GROUP_LABELS).map(([value, label]) => ({ value, label })),
  studentCount: Object.entries(STUDENT_COUNT_LABELS).map(([value, label]) => ({ value, label })),
  teachingStyle: Object.entries(TEACHING_STYLE_LABELS).map(([value, label]) => ({ value, label })),
  schoolLevel: Object.entries(SCHOOL_LEVEL_LABELS).map(([value, label]) => ({ value, label })),
  lessonType: [
    { value: 'tutor', label: '과외' },
    { value: 'study_room', label: '공부방' },
  ],
  visibility: VISIBILITY_OPTIONS.map((o) => ({
    value: o.value,
    label: o.value === 'private' ? '비공개 (리스트 미노출)' : '유료 공급자만 (13§8 · 18장)',
  })),
};
