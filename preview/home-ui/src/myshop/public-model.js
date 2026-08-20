/**
 * 공개 샵 — API/캐시 item → 단일 ShopPage(renderMyshopShowcase) 입력
 */

import { previewState } from '../state.js';
import { EXPOSURE_STUDY_ROOMS } from '../exposure-data.js';

/**
 * @param {number} id
 * @returns {object | null}
 */
export function resolvePublicStudyRoomItem(id) {
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) return null;

  const pools = [
    previewState.parentFind?.activeResultItems,
    previewState.studyRoomFind?.activeResultItems,
    previewState.tutorFind?.activeResultItems,
    previewState.parentFind?.searchExposureItems,
    previewState.studyRoomFind?.searchExposureItems,
    previewState.tutorFind?.searchExposureItems,
  ];
  for (const pool of pools) {
    if (!Array.isArray(pool)) continue;
    const hit = pool.find((x) => Number(x?.id) === n);
    if (hit) return hit;
  }

  return EXPOSURE_STUDY_ROOMS.find((x) => Number(x.id) === n) || null;
}

function blank(v) {
  const s = String(v ?? '').trim();
  if (!s || s === '—' || s === '-') return '';
  return s;
}

function asBool(v) {
  if (v === true || v === 1 || v === '1') return true;
  if (v === false || v === 0 || v === '0') return false;
  return Boolean(v);
}

/** @param {object} item @returns {object[]} */
function normalizeImages(item) {
  /** @type {object[]} */
  const out = [];
  const seen = new Set();

  const pushObj = (img) => {
    if (!img || typeof img !== 'object') return;
    if (img.is_system_default) return;
    const path = blank(
      img.basic_720_path || img.prime_1280_path || img.image_path || img.src || img.name,
    );
    if (!path || seen.has(path)) return;
    seen.add(path);
    out.push({
      image_path: path,
      basic_720_path: blank(img.basic_720_path) || path,
      prime_1280_path: blank(img.prime_1280_path) || path,
      image_type: img.image_type || 'other',
      title: blank(img.title || img.caption),
      is_system_default: false,
    });
  };

  if (Array.isArray(item.images)) {
    for (const img of item.images) {
      if (typeof img === 'string') {
        const path = blank(img);
        if (!path || seen.has(path)) continue;
        seen.add(path);
        out.push({ image_path: path, basic_720_path: path, image_type: 'other' });
      } else {
        pushObj(img);
      }
    }
  }
  if (Array.isArray(item.gallery)) {
    for (const g of item.gallery) {
      if (typeof g === 'string') {
        const path = blank(g);
        if (!path || seen.has(path)) continue;
        seen.add(path);
        out.push({ image_path: path, basic_720_path: path, image_type: 'other' });
      } else {
        pushObj(g);
      }
    }
  }
  for (const key of ['image_path_prime', 'image_path', 'image_path_basic']) {
    const path = blank(item[key]);
    if (!path || seen.has(path)) continue;
    seen.add(path);
    out.push({
      image_path: path,
      basic_720_path: path,
      image_type: key === 'image_path_prime' ? 'cover' : 'other',
    });
  }
  return out;
}

/**
 * @param {object} item
 * @returns {{ state: object, room: object } | null}
 */
export function toMyshopShowcaseInputs(item) {
  if (!item) return null;

  const images = normalizeImages(item);
  const region = blank(item.location_label || item.region_label);
  const promo = Array.isArray(item.promo_regions)
    ? item.promo_regions.map(blank).filter(Boolean)
    : region
      ? [region]
      : [];
  const facilityNames = Array.isArray(item.facility_names)
    ? item.facility_names.map(blank).filter(Boolean)
    : [];

  const state = {
    study_room_name: blank(item.study_room_name),
    slogan: blank(item.slogan),
    intro_short: blank(item.intro_short),
    intro_long: blank(item.intro_long),
    main_subject_note: blank(item.main_subject_note),
    feature_1: blank(item.feature_1),
    feature_2: blank(item.feature_2),
    feature_3: blank(item.feature_3),
    teaching_style: blank(item.teaching_style),
    teaching_style_ids: Array.isArray(item.teaching_style_ids) ? item.teaching_style_ids : [],
    teaching_style_note: blank(item.teaching_style_note),
    lesson_place_type: item.lesson_place_type || '',
    lesson_operation_type: item.lesson_operation_type || '',
    capacity_per_time: item.capacity_per_time || '',
    minutes_per_lesson: item.minutes_per_lesson ?? '',
    lessons_per_week: item.lessons_per_week ?? '',
    monthly_fee_manwon:
      item.monthly_fee_manwon != null && blank(item.monthly_fee_manwon) !== ''
        ? blank(item.monthly_fee_manwon)
        : '',
    weekend_available: asBool(item.weekend_available),
    one_on_one_available: asBool(item.one_on_one_available),
    card_payment_available: asBool(item.card_payment_available),
    cash_receipt_available: asBool(item.cash_receipt_available),
    correction_available: asBool(item.correction_available),
    university_name: blank(item.university_name),
    major_name: blank(item.major_name),
    career_years: blank(item.career_years),
    academy_career_years: blank(item.academy_career_years),
    franchise_flag: item.franchise_flag == null ? null : asBool(item.franchise_flag),
    franchise_name: blank(item.franchise_name),
    education_office_registered: asBool(item.education_office_registered),
    education_office_reg_no: blank(item.education_office_reg_no),
    business_registration_available: asBool(item.business_registration_available),
    other_proof_notes: item.other_proof_notes,
    facility_ids: Array.isArray(item.facility_ids) ? item.facility_ids : [],
    facility_names: facilityNames,
    facility_note: blank(item.facility_note),
    facility_summary: blank(item.facility_summary),
    youtube_url: blank(item.youtube_url),
    facebook_url: blank(item.facebook_url),
    instagram_url: blank(item.instagram_url),
    inquiry_status: blank(item.inquiry_status),
    classes: Array.isArray(item.classes) ? item.classes : [],
    images,
    region_label: region,
    promo_regions: promo,
    saved_regions: promo.map((label, i) => ({
      is_primary: i === 0,
      region_label: label,
      complex_name: '',
    })),
    primary_school_levels: [],
  };

  const room = {
    study_room_name: state.study_room_name,
    slogan: state.slogan,
    intro_short: state.intro_short,
    intro_long: state.intro_long,
    main_subject_note: state.main_subject_note,
    feature_1: state.feature_1,
    grade_band: blank(item.grade_band),
    price_amount: item.price_amount != null ? Number(item.price_amount) : null,
    region_label: region,
    location_label: region,
    facility_summary: state.facility_summary,
    inquiry_status: state.inquiry_status,
    lesson_place_type: state.lesson_place_type,
    capacity_per_time: state.capacity_per_time,
  };

  return { state, room };
}
