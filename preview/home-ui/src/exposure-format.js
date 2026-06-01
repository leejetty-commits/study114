/**
 * SSOT DB 값 → 화면 표시 (UI label 필드명을 데이터 키로 쓰지 않음)
 */

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

export function formatGender(gender) {
  if (gender === 'male') return '남';
  if (gender === 'female') return '여';
  return '—';
}

export function formatLessonPlace(lesson_place_type) {
  if (lesson_place_type === 'home') return '재택';
  if (lesson_place_type === 'office') return '교습소';
  return lesson_place_type || '—';
}

export function formatEducationOffice(education_office_registered) {
  return education_office_registered ? '등록' : '미등록';
}

export function formatWeekend(weekend_available) {
  return weekend_available ? '가능' : '불가';
}

export function formatLessonFormat(lesson_format) {
  if (lesson_format === 'group') return '그룹';
  if (lesson_format === 'one_on_one') return '1:1';
  return lesson_format || '—';
}

export function formatGenderLesson(gender, lesson_format) {
  return `${formatGender(gender)} · ${formatLessonFormat(lesson_format)}`;
}

export function formatVerification(verification_available) {
  return verification_available ? '가능' : '미제공';
}

export function formatProfileStatus(profile_status) {
  const map = {
    draft: '작성중',
    pending: '검토중',
    published: '노출',
    hidden: '숨김',
  };
  return map[profile_status] || profile_status || '—';
}

export function formatExposureStatus(exposure_status) {
  const map = {
    draft: '비공개',
    published: '모집중',
    hidden: '숨김',
    deleted: '삭제',
  };
  return map[exposure_status] || exposure_status || '—';
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
  if (t.verification_available) b.push('증빙가능');
  if (t.career_years >= 10) b.push(`경력 ${t.career_years}년`);
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
      : item.education_background_note || item.feature_2 || CENTER_FALLBACK;
  return { line1, line2 };
}

/** @returns {{ line1: string, line2: string }} */
export function browseCenterStudent(item) {
  const line1 = item.subject_label || '희망 과목 미등록';
  const line2 = item.request_summary || CENTER_FALLBACK;
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
  return item.verification_available ? '노출' : '검토중';
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
      return formatHourlyWon(item.preferred_fee_amount);
    case 'gender':
      return formatGender(item.gender);
    case 'profile_status':
      return formatProfileStatus(item.profile_status);
    case 'exposure_status':
      return formatExposureStatus(item.exposure_status);
    case 'lesson_place_type':
    case 'lesson_place_label':
      return formatLessonPlace(item.lesson_place_type);
    case 'education_office_registered':
    case 'education_office_label':
      return formatEducationOffice(item.education_office_registered);
    case 'weekend_available':
    case 'weekend_label':
      return formatWeekend(item.weekend_available);
    case 'gender_lesson_label':
      return formatGenderLesson(item.gender, item.lesson_format);
    case 'verification_label':
      return formatVerification(item.verification_available);
    case 'career_label':
      return formatCareerYears(item.career_years);
    case 'education_summary':
      return item.education_background_note || '—';
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
