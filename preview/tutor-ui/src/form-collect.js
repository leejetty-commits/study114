import { normalizeUniversityNameInput } from '../../shared/korean-universities.js';

export function syncBasicFromForm(form, state) {
  if (!form) return;
  const fd = new FormData(form);
  state.gender = String(fd.get('gender') ?? 'male');
  state.tutor_display_name = String(fd.get('tutor_display_name') ?? '');
  if (fd.has('main_subject_note')) {
    state.main_subject_note = String(fd.get('main_subject_note') ?? '');
  }
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

export function syncLessonFromForm(form, state) {
  if (!form) return;
  const fd = new FormData(form);
  // 상세등록에서는 주력과목 필드를 두지 않음 — 있으면만 갱신, 없으면 기본등록 값 유지
  if (fd.has('main_subject_note')) {
    state.main_subject_note = String(fd.get('main_subject_note') ?? '');
  }
  if (fd.has('student_gender_group')) {
    state.student_gender_group = String(fd.get('student_gender_group') ?? 'mixed');
  }
  if (fd.has('student_count_group')) {
    state.student_count_group = String(fd.get('student_count_group') ?? 'solo');
  }
  if (fd.has('age_band')) {
    state.age_band = String(fd.get('age_band') ?? '');
  }
  state.preferred_fee_amount = String(fd.get('preferred_fee_amount') ?? '');
  state.fee_basis_type = String(fd.get('fee_basis_type') ?? 'monthly_by_weekly_schedule');
  state.lessons_per_week = String(fd.get('lessons_per_week') ?? '');
  state.monthly_session_count = String(fd.get('monthly_session_count') ?? '');
  state.minutes_per_lesson = String(fd.get('minutes_per_lesson') ?? '');
  state.fee_description = String(fd.get('fee_description') ?? '');
  state.lesson_places = fd.getAll('lesson_places');
  state.subjects = [];
  form.querySelectorAll('[data-subject-idx]').forEach((row) => {
    state.subjects.push({
      school_level: row.querySelector('[data-field="school_level"]')?.value ?? 'middle',
      grade_band: row.querySelector('[data-field="grade_band"]')?.value ?? '',
      subject_master_id: row.querySelector('[data-field="subject_master_id"]')?.value ?? '',
      subject_name: row.querySelector('[data-field="subject_name"]')?.value ?? '',
      is_primary: row.querySelector('[data-field="is_primary"]')?.checked ?? false,
    });
  });
}

/** @returns {string|null} 안내 문구. 통과면 null */
export function validateLessonState(state) {
  if (!String(state.main_subject_note || '').trim()) {
    return '주력과목이 없습니다. 기본등록에서 주력과목을 먼저 저장해 주세요.';
  }
  const fee = Number(state.preferred_fee_amount);
  if (!Number.isFinite(fee) || fee <= 0) {
    return '월 대표 과외비를 입력해 주세요.';
  }
  if (!String(state.fee_basis_type || '').trim()) {
    return '산정방식을 선택해 주세요.';
  }
  const basis = String(state.fee_basis_type || '');
  if (basis === 'monthly_by_weekly_schedule') {
    const n = Number(state.lessons_per_week);
    if (!Number.isFinite(n) || n <= 0) {
      return '주 횟수를 입력해 주세요.';
    }
  }
  if (basis === 'monthly_by_total_sessions') {
    const n = Number(state.monthly_session_count);
    if (!Number.isFinite(n) || n <= 0) {
      return '월 총 횟수를 입력해 주세요.';
    }
  }
  const minutes = Number(state.minutes_per_lesson);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return '1회 수업 시간을 입력해 주세요.';
  }
  if (!Array.isArray(state.lesson_places) || state.lesson_places.length === 0) {
    return '강의장소를 1개 이상 선택해 주세요.';
  }
  for (const sub of state.subjects || []) {
    const name = String(sub.subject_name || '').trim();
    const grade = String(sub.grade_band || '').trim();
    if (grade && !name) {
      return '학년대를 선택했다면 과목명도 입력해 주세요. (예: 미적분2, 확률과 통계)';
    }
  }
  return null;
}

export function validateCareerState(state) {
  if (!String(state.university_name || '').trim()) {
    return '학교명을 입력해 주세요.';
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
  state.profile_status = String(fd.get('profile_status') ?? 'draft');
}

export function payloadForStep(step, state) {
  switch (step) {
    case 'basic':
      return {
        gender: state.gender,
        tutor_display_name: state.tutor_display_name,
        main_subject_note: state.main_subject_note,
        slogan: state.slogan,
        intro_short: state.intro_short,
        intro_long: state.intro_long,
        student_gender_group: state.student_gender_group,
        student_count_group: state.student_count_group,
        age_band: state.age_band,
      };
    case 'regions':
      return { saved_regions: state.saved_regions };
    case 'lesson': {
      const subjects = (state.subjects || []).filter((s) => String(s.subject_name || '').trim());
      return {
        main_subject_note: state.main_subject_note,
        student_gender_group: state.student_gender_group,
        student_count_group: state.student_count_group,
        age_band: state.age_band,
        preferred_fee_amount: state.preferred_fee_amount,
        fee_basis_type: state.fee_basis_type,
        lessons_per_week: state.lessons_per_week,
        monthly_session_count: state.monthly_session_count,
        minutes_per_lesson: state.minutes_per_lesson,
        fee_description: state.fee_description,
        lesson_places: state.lesson_places,
        // 빈 과목 행은 제외 → 서버가 주력과목으로 폴백
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
        profile_status: state.profile_status,
        images: state.images.map((img) => ({
          image_type: img.image_type,
          image_path: img.image_path || img.name,
          sort_order: img.sort_order,
        })),
      };
    default:
      return {};
  }
}

export function applyTutorToState(target, tutor) {
  if (!tutor) return;
  Object.assign(target, tutor);
  if (tutor.tutor_id) target.tutor_id = tutor.tutor_id;
}
