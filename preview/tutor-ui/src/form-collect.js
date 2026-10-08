import { normalizeUniversityNameInput } from '../../shared/korean-universities.js';
import { cheonwonInputToWon } from '../../shared/fee-cheonwon.js';

export function syncBasicFromForm(form, state) {
  if (!form) return;
  const fd = new FormData(form);
  state.tutor_display_name = String(fd.get('tutor_display_name') ?? '');
  if (fd.has('main_subject_note')) {
    state.main_subject_note = String(fd.get('main_subject_note') ?? '');
  }
  state.school_level = String(fd.get('school_level') ?? '');
  state.preferred_fee_amount = cheonwonInputToWon(fd.get('preferred_fee_amount'));
  state.lessons_per_week = String(fd.get('lessons_per_week') ?? '');
  state.minutes_per_lesson = String(fd.get('minutes_per_lesson') ?? '');
  state.slogan = String(fd.get('slogan') ?? '').trim();
}

export function syncRegionsFromForm(root, state) {
  const primaryIdx = Number(root.querySelector('input[name="is_primary"]:checked')?.value ?? 0);
  state.saved_regions = [];
  root.querySelectorAll('[data-region-slot]').forEach((slotEl, idx) => {
    state.saved_regions.push({
      region_id: slotEl.querySelector('[data-field="region_id"]')?.value ?? '',
      /** 정책: 과외 활동지역은 시 단위만 */
      scope_type: 'city',
      is_primary: idx === primaryIdx,
    });
  });
  while (state.saved_regions.length < 3) {
    state.saved_regions.push({
      region_id: '',
      scope_type: 'city',
      is_primary: false,
    });
  }
  state.saved_regions = state.saved_regions.slice(0, 3);
}

/** 상세 1(수업 상세). 기본등록 항목(과외비·주 회수·1회 수업시간·대표 과목)은 syncBasicFromForm. */
export function syncLessonFromForm(form, state) {
  if (!form) return;
  const fd = new FormData(form);
  state.student_gender_group = String(fd.get('student_gender_group') ?? '');
  state.student_count_group = String(fd.get('student_count_group') ?? '');
  state.lesson_places = fd.getAll('lesson_places').map(String);
  if (fd.has('age_band')) {
    state.age_band = String(fd.get('age_band') ?? '');
  }
  state.fee_basis_type = String(fd.get('fee_basis_type') ?? '');
  state.monthly_session_count = String(fd.get('monthly_session_count') ?? '');
  state.fee_description = String(fd.get('fee_description') ?? '');
  state.subjects = [];
  form.querySelectorAll('[data-subject-idx]').forEach((row) => {
    state.subjects.push({
      school_level: row.querySelector('[data-field="school_level"]')?.value ?? '',
      grade_band: row.querySelector('[data-field="grade_band"]')?.value ?? '',
      subject_master_id: row.querySelector('[data-field="subject_master_id"]')?.value ?? '',
      subject_name: row.querySelector('[data-field="subject_name"]')?.value ?? '',
      is_primary: false,
    });
  });
}

/** tutors.* SMALLINT UNSIGNED 기술 상한 (사업 최대값 아님) */
const SMALLINT_UNSIGNED_MAX = 65535;

/**
 * 공란 허용 · 값이 있으면 양의 정수만 (1 ~ SMALLINT UNSIGNED).
 * trim은 주력과목 등 기존 validate와 동일; syncLessonFromForm은 FormData 문자열을 그대로 둔다.
 */
function optionalPositiveIntMessage(value, label) {
  const raw = String(value ?? '').trim();
  if (raw === '') return null;
  if (!/^\d+$/.test(raw)) {
    return `${label}: 1 이상의 정수로 입력해 주세요.`;
  }
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n < 1) {
    return `${label}: 1 이상의 정수로 입력해 주세요.`;
  }
  if (n > SMALLINT_UNSIGNED_MAX) {
    return `${label}: 1~65535 사이의 정수로 입력해 주세요.`;
  }
  return null;
}

/** @returns {string|null} 안내 문구. 통과면 null */
export function validateLessonState(state) {
  if (!String(state.fee_basis_type || '').trim()) {
    return '산정방식을 선택해 주세요.';
  }
  // UI 선택값: 공란이면 단계 이동 허용. 값이 있으면 양의 정수만.
  const monthlyMsg = optionalPositiveIntMessage(state.monthly_session_count, '월 총 횟수');
  if (monthlyMsg) return monthlyMsg;
  for (const sub of state.subjects || []) {
    const name = String(sub.subject_name || '').trim();
    const grade = String(sub.grade_band || '').trim();
    if (grade && !name) {
      return '학년을 선택했다면 과목명도 입력해 주세요. (예: 미적분2, 확률과 통계)';
    }
  }
  return null;
}

export function validateCareerState(state) {
  if (!String(state.university_name || '').trim()) {
    return '대학/대학원을 입력해 주세요.';
  }
  return null;
}

export function validateIntroState(state) {
  if (!String(state.intro_short || '').trim() && !String(state.intro_long || '').trim()) {
    return '소개문(짧은 소개 또는 상세 소개)을 입력해 주세요.';
  }
  return null;
}

export function syncCareerFromForm(form, state) {
  if (!form) return;
  const fd = new FormData(form);
  state.university_name = normalizeUniversityNameInput(fd.get('university_name'));
  state.major_name = String(fd.get('major_name') ?? '').trim();
  state.university_status = String(fd.get('university_status') ?? '');
  state.career_year_band = String(fd.get('career_year_band') ?? '');
  state.main_material_note = String(fd.get('main_material_note') ?? '');
  state.feature_1 = String(fd.get('feature_1') ?? '');
  state.feature_2 = String(fd.get('feature_2') ?? '');
  state.feature_3 = String(fd.get('feature_3') ?? '');
  state.proof_document_available = fd.has('proof_document_available');
  state.teaching_style_badges = fd.getAll('teaching_style_badges');
}

export function syncContactFromForm(form, state) {
  if (!form) return;
  const fd = new FormData(form);
  state.contact_time_note = String(fd.get('contact_time_note') ?? '');
  state.youtube_url = String(fd.get('youtube_url') ?? '');
  state.facebook_url = String(fd.get('facebook_url') ?? '');
  state.instagram_url = String(fd.get('instagram_url') ?? '');
}

export function payloadForStep(step, state) {
  switch (step) {
    case 'basic':
      return {
        tutor_display_name: state.tutor_display_name,
        school_level: state.school_level,
        main_subject_note: state.main_subject_note,
        preferred_fee_amount: state.preferred_fee_amount,
        lessons_per_week: state.lessons_per_week,
        minutes_per_lesson: state.minutes_per_lesson,
        slogan: state.slogan,
        saved_regions: state.saved_regions,
      };
    case 'regions':
      return { saved_regions: state.saved_regions };
    case 'lesson': {
      // 추가 과목 행만. 빈 과목 행은 제외. 대표 과목은 basic 단계.
      const subjects = (state.subjects || []).filter((s) => !s.is_primary && String(s.subject_name || '').trim());
      return {
        student_gender_group: state.student_gender_group,
        student_count_group: state.student_count_group,
        lesson_places: state.lesson_places,
        age_band: state.age_band,
        fee_basis_type: state.fee_basis_type,
        monthly_session_count: state.monthly_session_count,
        fee_description: state.fee_description,
        subjects,
      };
    }
    case 'career':
      return {
        university_name: state.university_name,
        major_name: state.major_name,
        university_status: state.university_status,
        career_year_band: state.career_year_band,
        main_material_note: state.main_material_note,
        feature_1: state.feature_1,
        feature_2: state.feature_2,
        feature_3: state.feature_3,
        proof_document_available: state.proof_document_available,
        teaching_style_badges: state.teaching_style_badges,
      };
    case 'contact':
      return {
        contact_time_note: state.contact_time_note,
        youtube_url: state.youtube_url,
        facebook_url: state.facebook_url,
        instagram_url: state.instagram_url,
      };
    default:
      return {};
  }
}

export function applyTutorToState(target, tutor) {
  if (!tutor) return;
  Object.assign(target, tutor);
  if (tutor.tutor_id) target.tutor_id = tutor.tutor_id;
  if (Array.isArray(tutor.subjects)) {
    target.subjects = tutor.subjects.filter((s) => !s?.is_primary);
  }
}
