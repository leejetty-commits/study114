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
    classes: Array.isArray(state.classes) ? state.classes : [],
    monthly_fee_manwon: String(state.monthly_fee_manwon || ''),
    card_payment_available: Boolean(state.card_payment_available),
    cash_receipt_available: Boolean(state.cash_receipt_available),
    correction_available: Boolean(state.correction_available),
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
  if (Array.isArray(extra.classes)) {
    target.classes = extra.classes.map(normalizeClass);
  }
  if (extra.monthly_fee_manwon != null) {
    target.monthly_fee_manwon = String(extra.monthly_fee_manwon || '');
  }
  if (extra.card_payment_available != null) {
    target.card_payment_available = Boolean(extra.card_payment_available);
  }
  if (extra.cash_receipt_available != null) {
    target.cash_receipt_available = Boolean(extra.cash_receipt_available);
  }
  if (extra.correction_available != null) {
    target.correction_available = Boolean(extra.correction_available);
  }
}

function normalizeProofNotes(raw) {
  if (Array.isArray(raw)) {
    return raw.map((n) => String(n ?? '').trim()).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((n) => String(n ?? '').trim()).filter(Boolean);
      }
    } catch {
      return [raw.trim()];
    }
  }
  return [];
}

function normalizeClass(row) {
  const days = Array.isArray(row?.attendance_days)
    ? row.attendance_days.map(String)
    : String(row?.attendance_days || '')
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);
  return {
    class_name: String(row?.class_name || ''),
    school_level: String(row?.school_level || ''),
    grade_band: String(row?.grade_band || ''),
    subject_name: String(row?.subject_name || ''),
    subject_custom: String(row?.subject_custom || ''),
    attendance_days: days,
    lessons_per_week: String(row?.lessons_per_week || ''),
    monthly_fee: String(row?.monthly_fee || ''),
    fee_note: String(row?.fee_note || ''),
    lesson_note: String(row?.lesson_note || ''),
  };
}

function classesToSubjects(classes) {
  return (classes || []).map((row) => {
    const custom = String(row.subject_custom || '').trim();
    const selected = String(row.subject_name || '').trim();
    const subjectName = custom || selected;
    const master = getSubjectOptions().find((o) => o.value === subjectName);
    return {
      school_level: String(row.school_level || ''),
      grade_band: String(row.grade_band || ''),
      subject_master_id: master?.id ? String(master.id) : '',
      subject_name: subjectName,
      subject_custom: custom,
      is_main: false,
    };
  });
}

function classesToPriceItems(classes) {
  return (classes || []).map((row) => ({
    item: String(row.class_name || row.subject_name || '').trim(),
    fee: String(row.monthly_fee || '').trim(),
    note: String(row.fee_note || '').trim(),
  }));
}

function unionAttendanceDays(classes) {
  const set = new Set();
  (classes || []).forEach((row) => {
    (row.attendance_days || []).forEach((d) => set.add(String(d)));
  });
  return [...set];
}

function manwonToPriceAmount(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  const n = Number(raw.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return '';
  return String(Math.round(n * 10000));
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
  state.teaching_style_ids = fd.getAll('teaching_style_ids').map(String);
  state.teaching_style_note = String(fd.get('teaching_style_note') ?? '');
  state.teaching_style = [teachingStyleLabel(state.teaching_style_ids), state.teaching_style_note]
    .filter((s) => String(s || '').trim())
    .join(' / ');
  state.weekend_available = fd.has('weekend_available');
  state.one_on_one_available = fd.has('one_on_one_available');
  state.correction_available = fd.has('correction_available');
  state.card_payment_available = fd.has('card_payment_available');
  state.cash_receipt_available = fd.has('cash_receipt_available');
  state.lessons_per_week = String(fd.get('lessons_per_week') ?? '');
  state.minutes_per_lesson = String(fd.get('minutes_per_lesson') ?? '');
  state.monthly_fee_manwon = String(fd.get('monthly_fee_manwon') ?? '');
  state.price_amount = manwonToPriceAmount(state.monthly_fee_manwon);
  state.intro_short = String(fd.get('intro_short') ?? '');
  state.intro_long = String(fd.get('intro_long') ?? '');

  state.classes = [];
  form.querySelectorAll('[data-class-idx]').forEach((row) => {
    const selected = String(row.querySelector('[data-field="subject_select"]')?.value ?? '').trim();
    const custom = String(row.querySelector('[data-field="subject_custom"]')?.value ?? '').trim();
    const days = [...row.querySelectorAll('[data-field="attendance_days"]:checked')].map((el) =>
      String(el.value),
    );
    state.classes.push({
      class_name: String(row.querySelector('[data-field="class_name"]')?.value ?? ''),
      school_level: String(row.querySelector('[data-field="school_level"]')?.value ?? ''),
      grade_band: String(row.querySelector('[data-field="grade_band"]')?.value ?? ''),
      subject_name: custom || selected,
      subject_custom: custom,
      attendance_days: days,
      lessons_per_week: String(row.querySelector('[data-field="lessons_per_week"]')?.value ?? ''),
      monthly_fee: String(row.querySelector('[data-field="monthly_fee"]')?.value ?? ''),
      fee_note: String(row.querySelector('[data-field="fee_note"]')?.value ?? ''),
      lesson_note: String(row.querySelector('[data-field="lesson_note"]')?.value ?? ''),
    });
  });
  state.subjects = classesToSubjects(state.classes);
  state.price_items = classesToPriceItems(state.classes);
  state.attendance_days = unionAttendanceDays(state.classes);
  state.price_description = composePriceDescription({}, state.price_items);
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
  state.university_name = String(fd.get('university_name') ?? '').trim();
  state.major_name = String(fd.get('major_name') ?? '').trim();
  state.franchise_flag = fd.has('franchise_flag');
  state.franchise_name = String(fd.get('franchise_name') ?? '');
  state.education_office_registered = fd.has('education_office_registered');
  state.education_office_reg_no = String(fd.get('education_office_reg_no') ?? '');
  state.business_registration_available = fd.has('business_registration_available');
  state.other_proof_notes = fd.getAll('other_proof_notes').map((v) => String(v ?? ''));
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
        primary_school_levels: state.primary_school_levels || [],
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
        lesson_place_type: state.lesson_place_type,
        primary_school_levels: state.primary_school_levels || [],
        region_id: state.region_id,
        complex_id: state.complex_id,
        region_basis_type: state.region_basis_type || (state.complex_id ? 'complex' : 'dong'),
        complex_name: state.complex_name,
        complex_address: state.complex_address,
        address_text: state.address_text,
        address_zip: state.address_zip,
        address_line2: state.address_line2,
        address_sido: state.address_sido,
        address_sigungu: state.address_sigungu,
        address_bname: state.address_bname,
        home_address: state.home_address,
        home_address_zip: state.home_address_zip,
        home_address_line2: state.home_address_line2,
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
        address_line2: state.address_line2,
        address_sido: state.address_sido,
        address_sigungu: state.address_sigungu,
        address_bname: state.address_bname,
        home_address: state.home_address,
        home_address_zip: state.home_address_zip,
        home_address_line2: state.home_address_line2,
        latitude: state.latitude,
        longitude: state.longitude,
        saved_regions: state.saved_regions,
      };
    case 'lesson':
      return {
        lesson_operation_type: state.lesson_operation_type,
        capacity_per_time: state.capacity_per_time,
        teaching_style: state.teaching_style,
        teaching_style_ids: state.teaching_style_ids,
        teaching_style_note: state.teaching_style_note,
        weekend_available: state.weekend_available,
        one_on_one_available: state.one_on_one_available,
        correction_available: state.correction_available,
        card_payment_available: state.card_payment_available,
        cash_receipt_available: state.cash_receipt_available,
        attendance_days: state.attendance_days,
        lessons_per_week: state.lessons_per_week,
        minutes_per_lesson: state.minutes_per_lesson,
        monthly_fee_manwon: state.monthly_fee_manwon,
        price_amount: state.price_amount,
        price_description: state.price_description,
        price_items: state.price_items,
        intro_short: state.intro_short,
        intro_long: state.intro_long,
        classes: state.classes || [],
        lesson_extra: packLessonExtra(state),
        subjects: (state.subjects || []).filter((s) => String(s.subject_name || '').trim()),
        images: (state.images || []).map((img, i) => ({
          id: img.id || null,
          image_type: img.image_type,
          caption: img.caption || '',
          image_path: img.image_path || img.name,
          prime_1280_path: img.prime_1280_path || '',
          prime_1600_path: img.prime_1600_path || '',
          basic_360_path: img.basic_360_path || '',
          basic_720_path: img.basic_720_path || '',
          sort_order: img.sort_order || i + 1,
        })),
      };
    case 'career':
      return {
        career_years: state.career_years,
        academy_career_years: state.academy_career_years,
        university_name: state.university_name,
        major_name: state.major_name,
        franchise_flag: state.franchise_flag,
        franchise_name: state.franchise_name,
        education_office_registered: state.education_office_registered,
        education_office_reg_no: state.education_office_reg_no,
        business_registration_available: state.business_registration_available,
        other_proof_notes: Array.isArray(state.other_proof_notes) ? state.other_proof_notes : [],
        feature_1: state.feature_1,
        feature_2: state.feature_2,
        feature_3: state.feature_3,
      };
    case 'facility':
      return {
        facility_ids: state.facility_ids,
        facility_note: state.facility_note,
        youtube_url: state.youtube_url,
        facebook_url: state.facebook_url,
        instagram_url: state.instagram_url,
        profile_status: state.profile_status,
        images: (state.images || []).map((img, i) => ({
          id: img.id || null,
          image_type: img.image_type,
          caption: img.caption || '',
          image_path: img.image_path || img.name,
          prime_1280_path: img.prime_1280_path || '',
          prime_1600_path: img.prime_1600_path || '',
          basic_360_path: img.basic_360_path || '',
          basic_720_path: img.basic_720_path || '',
          sort_order: img.sort_order || i + 1,
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
  if (Array.isArray(room.classes) && room.classes.length) {
    target.classes = room.classes.map(normalizeClass);
  } else if ((!target.classes || !target.classes.length) && Array.isArray(room.subjects) && room.subjects.length) {
    target.classes = room.subjects.map((sub, i) => {
      const price = Array.isArray(target.price_items) ? target.price_items[i] || {} : {};
      return normalizeClass({
        class_name: price.item || '',
        school_level: sub.school_level,
        grade_band: sub.grade_band,
        subject_name: sub.subject_name,
        subject_custom: sub.subject_custom,
        attendance_days: i === 0 ? target.attendance_days : [],
        lessons_per_week: i === 0 ? target.lessons_per_week : '',
        monthly_fee: price.fee || '',
        fee_note: price.note || '',
        lesson_note: i === 0 ? target.lesson_note : '',
      });
    });
  }
  if (!target.monthly_fee_manwon && target.price_amount) {
    const won = Number(target.price_amount);
    if (Number.isFinite(won) && won > 0) {
      target.monthly_fee_manwon = String(Math.round(won / 10000));
    }
  }
  if (room.card_payment_available != null) {
    target.card_payment_available = Boolean(room.card_payment_available);
  }
  if (room.cash_receipt_available != null) {
    target.cash_receipt_available = Boolean(room.cash_receipt_available);
  }
  if (room.correction_available != null) {
    target.correction_available = Boolean(room.correction_available);
  }
  if (room.business_registration_available != null) {
    target.business_registration_available = Boolean(room.business_registration_available);
  }
  target.other_proof_notes = normalizeProofNotes(room.other_proof_notes ?? target.other_proof_notes);
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
