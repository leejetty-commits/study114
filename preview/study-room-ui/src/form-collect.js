/** DOM → registerState / API payload 수집 */

import { emptyRoomState, TEACHING_STYLE_OPTIONS, getSubjectOptions } from './state.js';

const LESSON_EXTRA_MARK = 'lesson_extra';

/**
 * @param {string} text
 * @returns {number}
 */
export function parseFeeAmount(text) {
  const raw = String(text || '').trim();
  if (!raw) return 0;
  const man = raw.match(/(\d+(?:\.\d+)?)\s*만/);
  if (man) return Math.round(Number(man[1]) * 10000);
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

/**
 * @param {Record<string, unknown>} extra
 * @param {unknown[]} priceItems
 */
function composePriceDescription(extra, priceItems) {
  const lines = (Array.isArray(priceItems) ? priceItems : [])
    .map((row) => {
      const item = String(row?.item || '').trim();
      const fee = String(row?.fee || '').trim();
      const note = String(row?.note || '').trim();
      if (!item && !fee && !note) return '';
      return [item, fee, note].filter(Boolean).join(' · ');
    })
    .filter(Boolean);
  return lines.join('\n');
}

export { composePriceDescription };

/**
 * @param {Record<string, unknown>} state
 * @returns {Record<string, unknown>}
 */
export function packLessonExtra(state) {
  return {
    _s114: LESSON_EXTRA_MARK,
    attendance_days: Array.isArray(state.attendance_days) ? state.attendance_days : [],
    lessons_per_week: String(state.lessons_per_week || ''),
    minutes_per_lesson: String(state.minutes_per_lesson || ''),
    lesson_note: String(state.lesson_note || ''),
    teaching_style_ids: Array.isArray(state.teaching_style_ids) ? state.teaching_style_ids : [],
    teaching_style_note: String(state.teaching_style_note || ''),
    price_items: Array.isArray(state.price_items) ? state.price_items : [],
  };
}

/**
 * @param {unknown} raw
 * @returns {Record<string, unknown>|null}
 */
export function parseLessonExtra(raw) {
  if (!raw) return null;
  if (typeof raw === 'object' && raw !== null && raw._s114 === LESSON_EXTRA_MARK) {
    return /** @type {Record<string, unknown>} */ (raw);
  }
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && parsed._s114 === LESSON_EXTRA_MARK) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * @param {Record<string, unknown>} target
 * @param {Record<string, unknown>|null|undefined} extra
 */
export function applyLessonExtra(target, extra) {
  if (!extra) return;
  target.attendance_days = Array.isArray(extra.attendance_days)
    ? extra.attendance_days.map(String)
    : [];
  target.lessons_per_week = String(extra.lessons_per_week || '');
  target.minutes_per_lesson = String(extra.minutes_per_lesson || '');
  target.lesson_note = String(extra.lesson_note || '');
  target.teaching_style_ids = Array.isArray(extra.teaching_style_ids)
    ? extra.teaching_style_ids.map(String)
    : [];
  target.teaching_style_note = String(extra.teaching_style_note || '');
  target.price_items = Array.isArray(extra.price_items)
    ? extra.price_items.map((row) => ({
        item: String(row?.item || ''),
        fee: String(row?.fee || ''),
        note: String(row?.note || ''),
      }))
    : [];
}

function teachingStyleLabel(ids) {
  const set = new Set((ids || []).map(String));
  return TEACHING_STYLE_OPTIONS.filter((o) => set.has(o.id))
    .map((o) => o.label)
    .join(', ');
}

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
  const basis =
    root.querySelector('input[name="region_basis_type"]:checked')?.value ||
    state.region_basis_type ||
    'dong';
  state.region_basis_type = basis;

  const regionEl = root.querySelector('#region_id');
  const complexEl = root.querySelector('#complex_id');
  const addressEl = root.querySelector('#address_text');
  if (regionEl && !regionEl.closest('[hidden]')) state.region_id = regionEl.value;
  if (complexEl && !complexEl.closest('[hidden]')) {
    state.complex_id = complexEl.value;
    const opt = complexEl.selectedOptions?.[0];
    if (opt?.dataset?.regionId) state.region_id = opt.dataset.regionId;
  }
  if (basis === 'dong') state.complex_id = '';
  if (addressEl) state.address_text = addressEl.value;

  const primaryIdx = Number(root.querySelector('input[name="is_primary"]:checked')?.value ?? 0);
  state.saved_regions = [];
  root.querySelectorAll('[data-region-slot]').forEach((slotEl, idx) => {
    const regionSelect = slotEl.querySelector('[data-field="region_id"]');
    const complexSelect = slotEl.querySelector('[data-field="complex_id"]');
    let regionId = regionSelect?.value ?? '';
    let complexId = complexSelect?.value ?? '';
    if (basis === 'dong') complexId = '';
    if (basis === 'complex') {
      const opt = complexSelect?.selectedOptions?.[0];
      if (opt?.dataset?.regionId) regionId = opt.dataset.regionId;
    }
    state.saved_regions.push({
      region_id: regionId,
      complex_id: complexId,
      region_basis_type: basis,
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
  state.teaching_style_ids = fd.getAll('teaching_style_ids').map(String);
  state.teaching_style_note = String(fd.get('teaching_style_note') ?? '');
  state.teaching_style = [teachingStyleLabel(state.teaching_style_ids), state.teaching_style_note]
    .filter((s) => String(s || '').trim())
    .join(' / ');
  state.one_on_one_available = fd.has('one_on_one_available');
  state.attendance_days = fd.getAll('attendance_days').map(String);
  state.weekend_available =
    fd.has('weekend_available') ||
    state.attendance_days.includes('sat') ||
    state.attendance_days.includes('sun');
  state.lessons_per_week = String(fd.get('lessons_per_week') ?? '');
  state.minutes_per_lesson = String(fd.get('minutes_per_lesson') ?? '');
  state.lesson_note = String(fd.get('lesson_note') ?? '');

  state.price_items = [];
  form.querySelectorAll('[data-price-idx]').forEach((row) => {
    state.price_items.push({
      item: row.querySelector('[data-field="price_item"]')?.value ?? '',
      fee: row.querySelector('[data-field="price_fee"]')?.value ?? '',
      note: row.querySelector('[data-field="price_note"]')?.value ?? '',
    });
  });
  const firstFee = (state.price_items || []).map((p) => parseFeeAmount(p.fee)).find((n) => n > 0) || 0;
  state.price_amount = firstFee ? String(firstFee) : '';
  state.price_description = composePriceDescription({}, state.price_items);

  state.subjects = [];
  form.querySelectorAll('[data-subject-idx]').forEach((row) => {
    const selected = String(row.querySelector('[data-field="subject_select"]')?.value ?? '').trim();
    const custom = String(row.querySelector('[data-field="subject_custom"]')?.value ?? '').trim();
    const subjectName = custom || selected;
    const master = getSubjectOptions().find((o) => o.value === subjectName);
    state.subjects.push({
      school_level: row.querySelector('[data-field="school_level"]')?.value ?? '',
      grade_band: row.querySelector('[data-field="grade_band"]')?.value ?? '',
      subject_master_id: master?.id ? String(master.id) : '',
      subject_name: subjectName,
      subject_custom: custom,
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
        main_subject_note: state.main_subject_note,
        slogan: state.slogan,
        operator_display_name: state.operator_display_name,
        intro_short: state.intro_short,
        intro_long: state.intro_long,
        lesson_place_type: state.lesson_place_type,
      };
    case 'basic_all':
      return {
        gender: state.gender,
        study_room_name: state.study_room_name,
        main_subject_note: state.main_subject_note,
        slogan: state.slogan,
        operator_display_name: state.operator_display_name,
        intro_short: state.intro_short,
        intro_long: state.intro_long,
        lesson_place_type: state.lesson_place_type || 'study_room',
        region_id: state.region_id,
        complex_id: state.complex_id,
        region_basis_type: state.region_basis_type || (state.complex_id ? 'complex' : 'dong'),
        complex_name: state.complex_name,
        complex_address: state.complex_address,
        address_text: state.address_text,
        address_zip: state.address_zip,
        address_sido: state.address_sido,
        address_sigungu: state.address_sigungu,
        address_bname: state.address_bname,
        home_address: state.home_address,
        home_address_zip: state.home_address_zip,
        latitude: state.latitude,
        longitude: state.longitude,
        saved_regions: state.saved_regions,
      };
    case 'location':
      return {
        region_id: state.region_id,
        complex_id: state.complex_id,
        region_basis_type: state.region_basis_type || (state.complex_id ? 'complex' : 'dong'),
        complex_name: state.complex_name,
        complex_address: state.complex_address,
        address_text: state.address_text,
        address_zip: state.address_zip,
        address_sido: state.address_sido,
        address_sigungu: state.address_sigungu,
        address_bname: state.address_bname,
        home_address: state.home_address,
        home_address_zip: state.home_address_zip,
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
        teaching_style_ids: state.teaching_style_ids,
        teaching_style_note: state.teaching_style_note,
        weekend_available: state.weekend_available,
        one_on_one_available: state.one_on_one_available,
        attendance_days: state.attendance_days,
        lessons_per_week: state.lessons_per_week,
        minutes_per_lesson: state.minutes_per_lesson,
        lesson_note: state.lesson_note,
        price_amount: state.price_amount,
        price_description: state.price_description,
        price_items: state.price_items,
        lesson_extra: packLessonExtra(state),
        subjects: (state.subjects || []).filter((s) => String(s.subject_name || '').trim()),
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
  const ui = {
    basicComplete: target.basicComplete,
    detailLessonSaved: target.detailLessonSaved,
    detailFacilitySaved: target.detailFacilitySaved,
    completeNeedsHydrate: target.completeNeedsHydrate,
  };
  Object.assign(target, emptyRoomState(), room, ui);
  if (room.study_room_id) {
    target.study_room_id = room.study_room_id;
  }
  const extra =
    parseLessonExtra(room.lesson_extra) ||
    parseLessonExtra(room.price_description) ||
    (room.lesson_extra && typeof room.lesson_extra === 'object' ? room.lesson_extra : null);
  applyLessonExtra(target, extra);
  if (Array.isArray(room.price_items) && room.price_items.length) {
    target.price_items = room.price_items.map((row) => ({
      item: String(row?.item || ''),
      fee: String(row?.fee || ''),
      note: String(row?.note || ''),
    }));
  }
  if (extra || (Array.isArray(target.price_items) && target.price_items.length)) {
    const composed = composePriceDescription(extra || {}, target.price_items);
    if (composed) target.price_description = composed;
  }
  if (Array.isArray(room.attendance_days)) {
    target.attendance_days = room.attendance_days.map(String);
  }
  if (Array.isArray(room.teaching_style_ids)) {
    const alias = { solution_focus: 'problem_solving', passion: 'passion', from_basics: 'from_basics' };
    target.teaching_style_ids = room.teaching_style_ids
      .map((id) => String(alias[id] || id))
      .filter((id) => TEACHING_STYLE_OPTIONS.some((o) => o.id === id));
  }
  if (room.teaching_style_note != null) {
    target.teaching_style_note = String(room.teaching_style_note || '');
  }
  if (!target.teaching_style_ids.length && String(target.teaching_style || '').trim()) {
    const bits = String(target.teaching_style)
      .split(/[,/]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const ids = [];
    const leftover = [];
    const labelAlias = { 풀이중심: 'problem_solving', 열정: '', 기초부터: '' };
    bits.forEach((bit) => {
      const mapped = labelAlias[bit];
      const hit =
        TEACHING_STYLE_OPTIONS.find((o) => o.label === bit || o.id === bit) ||
        (mapped ? TEACHING_STYLE_OPTIONS.find((o) => o.id === mapped) : null);
      if (hit) ids.push(hit.id);
      else leftover.push(bit);
    });
    target.teaching_style_ids = ids;
    if (!target.teaching_style_note && leftover.length) {
      target.teaching_style_note = leftover.join(', ');
    }
  }
}
