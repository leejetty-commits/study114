/**
 * SSOT DB 값 → 화면 표시 (UI label 필드명을 데이터 키로 쓰지 않음)
 */

import {
  CAREER_YEAR_BAND_LABELS,
  TUTOR_PLACE_LABELS,
  UNIVERSITY_STATUS_LABELS,
} from './tutor-enums.js';
import {
  TEACHING_STYLE_LABELS,
  VISIBILITY_LABELS,
  STUDENT_COUNT_LABELS,
  STUDENT_PLACE_LABELS,
  LESSON_FORMAT_LABELS,
  STUDENT_GENDER_GROUP_LABELS,
} from './student-enums.js';
import {
  profileStatusLabel as lifecycleProfileStatusLabel,
  exposureStatusLabel as lifecycleExposureStatusLabel,
  formatVerificationDocCountPublic,
  formatProofDocumentPublic,
} from './lifecycle-copy.js';

export function formatMonthlyWon(price_amount) {
  if (price_amount == null || price_amount === '') return '—';
  const n = Number(price_amount);
  if (Number.isNaN(n)) return String(price_amount);
  if (n >= 10000) return `월 ${Math.round(n / 10000)}만원~`;
  return `월 ${n.toLocaleString('ko-KR')}원~`;
}

export function formatHourlyWon(preferred_fee_amount) {
  if (preferred_fee_amount == null) return '—';
  const n = Number(preferred_fee_amount);
  if (Number.isNaN(n)) return '—';
  if (n >= 10000) return `시간당 ${Math.round(n / 10000)}만원~`;
  return `시간당 ${(n / 10000).toFixed(1)}만원~`;
}

/** 8장 · 13장 — 월 과외비 + 주횟수 + 1회시간 */
export function formatTutorFeeCard(item) {
  if (!item) return '—';
  const parts = [];
  const monthly = formatMonthlyWon(item.preferred_fee_amount);
  if (monthly !== '—') parts.push(monthly);
  if (item.lessons_per_week) parts.push(`주${item.lessons_per_week}회`);
  if (item.minutes_per_lesson) parts.push(`${item.minutes_per_lesson}분`);
  return parts.length ? parts.join(' · ') : '—';
}

export function formatCareerYearBand(career_year_band) {
  if (!career_year_band) return '—';
  return CAREER_YEAR_BAND_LABELS[career_year_band] || career_year_band;
}

const TUTOR_STUDENT_GENDER_GROUP_LABELS = { male: '남학생', female: '여학생', mixed: '혼성' };
/** 8·11·13장 — tutors.student_count_group UI: 수업인원 (DB code 동일) */
const TUTOR_STUDENT_COUNT_GROUP_LABELS = { solo: '단독', two: '2명', three: '3명', four_plus: '4명 이상' };

export function formatTutorStudentTarget(item) {
  const g = TUTOR_STUDENT_GENDER_GROUP_LABELS[item.student_gender_group];
  const c = TUTOR_STUDENT_COUNT_GROUP_LABELS[item.student_count_group];
  return [g, c].filter(Boolean).join(' · ') || '—';
}

export function formatUniversitySummary(item) {
  const parts = [];
  if (item.university_name) parts.push(item.university_name);
  if (item.major_name) parts.push(item.major_name);
  if (item.university_status && UNIVERSITY_STATUS_LABELS[item.university_status]) {
    parts.push(UNIVERSITY_STATUS_LABELS[item.university_status]);
  }
  if (parts.length) return parts.join(' ');
  return item.university_note || '—';
}

export function formatProofDocument(proof_document_available) {
  return formatProofDocumentPublic(proof_document_available);
}

export function formatTutorLessonPlaces(lesson_places) {
  if (!lesson_places?.length) return '—';
  return lesson_places.map((p) => TUTOR_PLACE_LABELS[p] || p).join(' · ');
}

export function formatGender(gender) {
  if (gender === 'male') return '남';
  if (gender === 'female') return '여';
  return '—';
}

export function formatLessonPlace(lesson_place_type) {
  if (lesson_place_type === 'academy') return '교습소';
  if (lesson_place_type === 'study_room') return '공부방';
  if (lesson_place_type === 'home') return '재택';
  if (lesson_place_type === 'office') return '교습소';
  return lesson_place_type || '—';
}

export function formatLessonOperationType(lesson_operation_type) {
  const map = {
    group_by_time_slot: '타임별 그룹',
    time_slot_mixed_grade: '타임별 혼합학년',
    individual_visit: '개별 방문',
  };
  return map[lesson_operation_type] || lesson_operation_type || '—';
}

export function formatTeachingStyleBadges(badges, max = 2) {
  if (!badges?.length) return '—';
  return badges
    .slice(0, max)
    .map((b) => TEACHING_STYLE_LABELS[b] || b)
    .join(' · ');
}

export function formatStudentBudgetCard(item) {
  const amount =
    item.preferred_lesson_type === 'study_room'
      ? item.preferred_studyroom_fee_amount
      : item.preferred_fee_amount;
  const parts = [];
  const monthly = formatMonthlyWon(amount);
  if (monthly !== '—') parts.push(monthly.replace('~', ''));
  if (item.lessons_per_week) parts.push(`주${item.lessons_per_week}회`);
  if (item.minutes_per_lesson) parts.push(`${item.minutes_per_lesson}분`);
  return parts.length ? parts.join(' · ') : '—';
}

export function formatVisibilitySummary(item) {
  const req = VISIBILITY_LABELS[item.request_summary_visibility] || '비공개';
  const spec = VISIBILITY_LABELS[item.special_request_visibility] || '비공개';
  return `요청 ${req}`;
}

export function formatVerificationDocCount(item) {
  return formatVerificationDocCountPublic(item);
}

export function formatTutorTrustBadges(item) {
  const parts = [];
  if (item.university_status && UNIVERSITY_STATUS_LABELS[item.university_status]) {
    parts.push(UNIVERSITY_STATUS_LABELS[item.university_status]);
  }
  if (item.career_year_band) parts.push(formatCareerYearBand(item.career_year_band));
  return parts.join(' · ') || '—';
}

export function formatUniversityStatus(university_status) {
  if (!university_status) return '—';
  return UNIVERSITY_STATUS_LABELS[university_status] || university_status;
}

export function formatGenderAgeLabel(item) {
  const age = item.age_band
    ? ({ early_20s: '20대 전반', late_20s: '20대 후반', early_30s: '30대 전반', late_30s: '30대 후반', early_40s: '40대 전반', late_40s: '40대 후반', over_50: '50대+' }[item.age_band] || item.age_band)
    : null;
  return [item.gender ? formatGender(item.gender) : null, age].filter(Boolean).join(' · ') || '—';
}

export function formatStudentPlaces(lesson_places) {
  if (!lesson_places?.length) return '—';
  return lesson_places.map((p) => STUDENT_PLACE_LABELS[p] || p).join(' · ');
}

export function formatStudentCountGroup(code) {
  if (!code) return '—';
  return STUDENT_COUNT_LABELS[code] || code;
}

export function formatEducationOffice(education_office_registered) {
  return education_office_registered ? '등록' : '미등록';
}

export function formatWeekend(weekend_available) {
  return weekend_available ? '가능' : '불가';
}

export function formatLessonFormat(lesson_format) {
  if (!lesson_format) return '—';
  return LESSON_FORMAT_LABELS[lesson_format] || lesson_format;
}

export function formatStudentGenderGroup(code) {
  if (!code) return '—';
  return STUDENT_GENDER_GROUP_LABELS[code] || code;
}

/** 그룹과외일 때 구성+인원, 단독과외일 때 수업형태만 */
export function formatStudentLessonTarget(item) {
  const fmt = formatLessonFormat(item.lesson_format);
  if (item.lesson_format === 'group') {
    const parts = [
      fmt,
      formatStudentGenderGroup(item.student_gender_group),
      formatStudentCountGroup(item.preferred_student_count_group),
    ].filter((p) => p && p !== '—');
    return parts.join(' · ') || '—';
  }
  if (item.lesson_format === 'one_on_one') return fmt;
  return formatStudentCountGroup(item.preferred_student_count_group);
}

export function formatGenderLesson(gender, lesson_format) {
  return `${formatGender(gender)} · ${formatLessonFormat(lesson_format)}`;
}

export function formatVerification(verification_available) {
  return formatProofDocumentPublic(verification_available);
}

export function formatProfileStatus(profile_status) {
  return lifecycleProfileStatusLabel(profile_status);
}

export function formatExposureStatus(exposure_status) {
  return lifecycleExposureStatusLabel(exposure_status);
}

export function formatCareerYears(career_years) {
  if (career_years == null) return '—';
  return `${career_years}년`;
}

export function studyRoomBadges(r) {
  const b = [];
  if (r.education_office_registered) b.push('교육청등록');
  if (r.career_years >= 10) b.push(`${r.career_years}년 경력`);
  else if (r.career_years) b.push(`경력 ${r.career_years}년`);
  if (r.one_on_one_available) b.push('1:1');
  if (r.weekend_available) b.push('주말');
  return b.slice(0, 2);
}

export function tutorBadges(t) {
  const b = [];
  if (t.proof_document_available) b.push('제출자료');
  if (t.career_year_band === 'y10_plus') b.push('경력 10년+');
  else if (t.career_year_band) b.push(`경력 ${formatCareerYearBand(t.career_year_band)}`);
  return b.slice(0, 2);
}

const CENTER_FALLBACK = '상세 내용은 로그인 후 확인할 수 있습니다.';

/** @returns {{ line1: string, line2: string }} */
export function browseCenterStudyRoom(item) {
  const line1 = item.main_subject_note || '주력 과목 미등록';
  const line2 =
    item.intro_short ||
    [item.feature_1, item.feature_2].filter(Boolean).join(' · ') ||
    item.facility_summary ||
    CENTER_FALLBACK;
  return { line1, line2 };
}

/** @returns {{ line1: string, line2: string }} */
export function browseCenterTutor(item) {
  const line1 = item.intro_short || item.feature_1 || '소개 미등록';
  const line2 =
    item.feature_1 && item.intro_short
      ? item.feature_1
      : formatUniversitySummary(item) !== '—'
        ? formatUniversitySummary(item)
        : item.feature_2 || CENTER_FALLBACK;
  return { line1, line2 };
}

/** @returns {{ line1: string, line2: string }} */
export function browseCenterStudent(item) {
  const line1 = [item.subject_label, formatTeachingStyleBadges(item.teaching_style_badges, 2)]
    .filter((p) => p && p !== '—')
    .join(' · ') || '희망 과목 미등록';
  const line2 = [
    formatStudentPlaces(item.lesson_places),
    formatStudentLessonTarget(item),
  ]
    .filter((p) => p && p !== '—')
    .join(' · ') || '희망 장소 · 수업형태';
  return { line1, line2 };
}

export function browseIdentityStudyRoom(item) {
  return `${item.grade_band || '—'} · ${item.location_label || '—'}`;
}

export function browseIdentityTutor(item) {
  return `${item.main_subject_note || '—'} · ${item.location_label || '—'}`;
}

export function browseIdentityStudent(item) {
  return `${item.grade_level || '—'} · ${formatGender(item.gender)} · ${item.location_label || '—'}`;
}

export function browseStatusTutor(item) {
  if (item.profile_status) return formatProfileStatus(item.profile_status);
  return item.proof_document_available ? '제출함' : '미제출';
}

/**
 * 비교표·렌더 공통 표시값
 * @param {object} item
 * @param {string} key — SSOT/DB 필드명 또는 비교표 파생 키
 */
export function resolveDisplayValue(item, key) {
  if (!item) return '—';
  switch (key) {
    case 'price_amount':
    case 'price_label':
      return formatMonthlyWon(item.price_amount);
    case 'preferred_fee_amount':
    case 'fee_label':
      return formatTutorFeeCard(item);
    case 'fee_card_label':
      return formatTutorFeeCard(item);
    case 'gender':
      return formatGender(item.gender);
    case 'profile_status':
      return formatProfileStatus(item.profile_status);
    case 'exposure_status':
      return formatExposureStatus(item.exposure_status);
    case 'lesson_place_type':
    case 'lesson_place_label':
      return formatLessonPlace(item.lesson_place_type);
    case 'lesson_operation_label':
      return formatLessonOperationType(item.lesson_operation_type);
    case 'teaching_style_label':
      return formatTeachingStyleBadges(item.teaching_style_badges);
    case 'budget_card_label':
      return formatStudentBudgetCard(item);
    case 'visibility_summary_label':
      return formatVisibilitySummary(item);
    case 'verification_count_label':
      return formatVerificationDocCount(item);
    case 'trust_badges':
      return formatTutorTrustBadges(item);
    case 'gender_age_label':
      return formatGenderAgeLabel(item);
    case 'university_status_label':
      return formatUniversityStatus(item.university_status);
    case 'lesson_places_label': {
      const p = item.lesson_places?.[0];
      if (p && STUDENT_PLACE_LABELS[p]) return formatStudentPlaces(item.lesson_places);
      return formatTutorLessonPlaces(item.lesson_places);
    }
    case 'preferred_student_count_group':
      return formatStudentCountGroup(item.preferred_student_count_group);
    case 'lesson_format':
      return formatLessonFormat(item.lesson_format);
    case 'student_gender_group':
      return formatStudentGenderGroup(item.student_gender_group);
    case 'student_lesson_target_label':
      return formatStudentLessonTarget(item);
    case 'slogan':
      return item.slogan || '—';
    case 'main_material_note':
      return item.main_material_note || '—';
    case 'education_office_registered':
    case 'education_office_label':
      return formatEducationOffice(item.education_office_registered);
    case 'weekend_available':
    case 'weekend_label':
      return formatWeekend(item.weekend_available);
    case 'gender_lesson_label':
      return formatGenderLesson(item.gender, item.lesson_format);
    case 'verification_label':
      return formatProofDocument(item.proof_document_available);
    case 'career_label':
      return formatCareerYearBand(item.career_year_band);
    case 'education_summary':
      return formatUniversitySummary(item);
    case 'student_target_label':
      return formatTutorStudentTarget(item);
    case 'tutor_display_name':
      return item.tutor_display_name || '—';
    case 'features_joined':
      return [item.feature_1, item.feature_2, item.feature_3].filter(Boolean).join(' · ') || '—';
    case 'badges':
      return (item.badges || []).join(', ') || '—';
  }
  const raw = item[key];
  if (raw == null || raw === '') return '—';
  if (Array.isArray(raw)) return raw.join(', ');
  return String(raw);
}
