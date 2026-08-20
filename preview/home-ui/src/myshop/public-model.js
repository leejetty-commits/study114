/**
 * 공개 마이샵 — API/캐시 item → 원장 미리보기와 동일 쇼케이스 입력
 * SSOT: 기본정보 + 상세정보1 + 상세정보2. 렌더는 myshop-render.js 단일.
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

/**
 * @param {object} item
 * @returns {object[]}
 */
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
      is_system_default: false,
      title: blank(img.title),
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
    out.push({ image_path: path, basic_720_path: path, image_type: key === 'image_path_prime' ? 'cover' : 'other' });
  }

  return out;
}

/**
 * API/검색 item → renderMyshopShowcase(registerState-like, room) 입력
 * @param {object} item
 * @returns {{ state: object, room: object } | null}
 */
export function toMyshopShowcaseInputs(item) {
  if (!item) return null;

  const images = normalizeImages(item);
  const region = blank(item.location_label || item.region_label);
  const facility = blank(item.facility_summary || item.facility_note);

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
    monthly_fee_manwon:
      item.monthly_fee_manwon != null && blank(item.monthly_fee_manwon) !== ''
        ? blank(item.monthly_fee_manwon)
        : '',
    facility_note: facility,
    inquiry_status: blank(item.inquiry_status),
    classes: Array.isArray(item.classes) ? item.classes : [],
    images,
    region_label: region,
    saved_regions: region
      ? [{ is_primary: true, region_label: region, complex_name: '' }]
      : [],
    primary_school_levels: [],
    weekend_available: Boolean(item.weekend_available),
    one_on_one_available: Boolean(item.one_on_one_available),
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
    facility_summary: facility,
    inquiry_status: state.inquiry_status,
    lesson_place_type: state.lesson_place_type,
    capacity_per_time: state.capacity_per_time,
  };

  return { state, room };
}
