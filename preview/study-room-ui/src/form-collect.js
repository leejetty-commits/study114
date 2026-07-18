/** DOM → registerState / API payload 수집 */

/**
 * @param {HTMLFormElement|null|undefined} form
 * @param {import('./state.js').RegisterState} state
 */
export function syncBasicFromForm(form, state) {
  if (!form) return;
  const fd = new FormData(form);
  state.gender = String(fd.get('gender') ?? 'male');
  state.study_room_name = String(fd.get('study_room_name') ?? state.study_room_name);
  if (fd.has('main_subject_note')) {
    state.main_subject_note = String(fd.get('main_subject_note') ?? '');
  }
}

/**
 * @param {HTMLElement} root
 * @param {import('./state.js').RegisterState} state
 */
export function syncLocationFromForm(root, state) {
  const regionEl = root.querySelector('#region_id');
  const complexEl = root.querySelector('#complex_id');
  const addressEl = root.querySelector('#address_text');
  if (regionEl) state.region_id = regionEl.value;
  if (complexEl) state.complex_id = complexEl.value;
  if (addressEl) state.address_text = addressEl.value;

  const primaryIdx = Number(root.querySelector('input[name="is_primary"]:checked')?.value ?? 0);
  state.saved_regions = [];
  root.querySelectorAll('[data-region-slot]').forEach((slotEl, idx) => {
    const regionSelect = slotEl.querySelector('[data-field="region_id"]');
    const complexSelect = slotEl.querySelector('[data-field="complex_id"]');
    state.saved_regions.push({
      region_id: regionSelect?.value ?? '',
      complex_id: complexSelect?.value ?? '',
      is_primary: idx === primaryIdx,
    });
  });
}

/**
 * @param {HTMLFormElement|null|undefined} form
 * @param {import('./state.js').RegisterState} state
 */
export function syncLessonFromForm(form, state) {
  if (!form) return;
  const fd = new FormData(form);
  state.lesson_operation_type = String(fd.get('lesson_operation_type') ?? state.lesson_operation_type);
  state.capacity_per_time = String(fd.get('capacity_per_time') ?? state.capacity_per_time);
  state.recruitment_count = String(fd.get('recruitment_count') ?? '');
  state.main_subject_note = String(fd.get('main_subject_note') ?? '');
  state.teaching_style = String(fd.get('teaching_style') ?? '');
  state.weekend_available = fd.has('weekend_available');
  state.one_on_one_available = fd.has('one_on_one_available');
  state.price_amount = String(fd.get('price_amount') ?? '');
  state.price_description = String(fd.get('price_description') ?? '');

  state.subjects = [];
  form.querySelectorAll('[data-subject-idx]').forEach((row) => {
    state.subjects.push({
      school_level: row.querySelector('[data-field="school_level"]')?.value ?? 'middle',
      grade_band: row.querySelector('[data-field="grade_band"]')?.value ?? '',
      subject_master_id: row.querySelector('[data-field="subject_master_id"]')?.value ?? '',
      subject_name: row.querySelector('[data-field="subject_name"]')?.value ?? '',
      is_main: row.querySelector('[data-field="is_main"]')?.checked ?? false,
    });
  });
}

/**
 * @param {HTMLFormElement|null|undefined} form
 * @param {import('./state.js').RegisterState} state
 */
export function syncCareerFromForm(form, state) {
  if (!form) return;
  const fd = new FormData(form);
  state.career_years = String(fd.get('career_years') ?? '');
  state.academy_career_years = String(fd.get('academy_career_years') ?? '');
  state.franchise_flag = fd.has('franchise_flag');
  state.franchise_name = String(fd.get('franchise_name') ?? '');
  state.education_office_registered = fd.has('education_office_registered');
  state.education_office_reg_no = String(fd.get('education_office_reg_no') ?? '');
  state.feature_1 = String(fd.get('feature_1') ?? '');
  state.feature_2 = String(fd.get('feature_2') ?? '');
  state.feature_3 = String(fd.get('feature_3') ?? '');
}

/**
 * @param {HTMLFormElement|null|undefined} form
 * @param {import('./state.js').RegisterState} state
 */
export function syncFacilityFromForm(form, state) {
  if (!form) return;
  const fd = new FormData(form);
  state.facility_ids = fd.getAll('facility_ids').map((v) => Number(v));
  state.facility_note = String(fd.get('facility_note') ?? '');
  state.contact_time_note = String(fd.get('contact_time_note') ?? '');
  state.contact_phone = String(fd.get('contact_phone') ?? '');
  state.youtube_url = String(fd.get('youtube_url') ?? '');
  state.facebook_url = String(fd.get('facebook_url') ?? '');
  state.instagram_url = String(fd.get('instagram_url') ?? '');
  state.profile_status = String(fd.get('profile_status') ?? 'draft');
}

/** @param {import('./state.js').RegisterState} state */
export function payloadForStep(step, state) {
  switch (step) {
    case 'basic':
      return {
        gender: state.gender,
        study_room_name: state.study_room_name,
        slogan: state.slogan,
        operator_display_name: state.operator_display_name,
        intro_short: state.intro_short,
        intro_long: state.intro_long,
        lesson_place_type: state.lesson_place_type,
      };
    case 'location':
      return {
        region_id: state.region_id,
        complex_id: state.complex_id,
        address_text: state.address_text,
        latitude: state.latitude,
        longitude: state.longitude,
        saved_regions: state.saved_regions,
      };
    case 'lesson':
      return {
        lesson_operation_type: state.lesson_operation_type,
        capacity_per_time: state.capacity_per_time,
        recruitment_count: state.recruitment_count,
        main_subject_note: state.main_subject_note,
        teaching_style: state.teaching_style,
        weekend_available: state.weekend_available,
        one_on_one_available: state.one_on_one_available,
        price_amount: state.price_amount,
        price_description: state.price_description,
        subjects: state.subjects,
      };
    case 'career':
      return {
        career_years: state.career_years,
        academy_career_years: state.academy_career_years,
        franchise_flag: state.franchise_flag,
        franchise_name: state.franchise_name,
        education_office_registered: state.education_office_registered,
        education_office_reg_no: state.education_office_reg_no,
        feature_1: state.feature_1,
        feature_2: state.feature_2,
        feature_3: state.feature_3,
      };
    case 'facility':
      return {
        facility_ids: state.facility_ids,
        facility_note: state.facility_note,
        contact_time_note: state.contact_time_note,
        contact_phone: state.contact_phone,
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

/**
 * @param {import('./state.js').RegisterState} target
 * @param {Record<string, unknown>|null|undefined} room
 */
export function applyRoomToState(target, room) {
  if (!room) return;
  Object.assign(target, room);
  if (room.study_room_id) {
    target.study_room_id = room.study_room_id;
  }
}
