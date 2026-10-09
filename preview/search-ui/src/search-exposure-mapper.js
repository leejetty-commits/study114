import { toDisplayLabel, axisFromSearchTab, logLocationDebug } from '../../shared/location-display.js';
import { studyRoomBadges, tutorBadges } from '@home-ui/exposure-format.js';

/** @typedef {'prime'|'pick'|'basic'} ExposureTier */

/**
 * @param {object} item
 * @param {number} index
 * @returns {ExposureTier}
 */
function paidPositionSku(item) {
  const sku = item?.position_sku || item?.sku;
  return sku === 'prime' || sku === 'pick' ? sku : '';
}

export function resolveExposureTier(item, _index = 0) {
  // sku 없으면 basic. 서버 exposure_tier 만으로 프라임을 올리지 않는다.
  const sku = paidPositionSku(item);
  if (sku === 'prime' || sku === 'pick') return sku;
  return 'basic';
}

/** @param {import('./state.js').SearchTab} tab @param {unknown} raw @param {Record<string, unknown>} [apiItem] */
function normalizeApiRegionLabel(tab, raw, apiItem) {
  const hope =
    apiItem?.preferred_lesson_type === 'study_room'
      ? 'study_room'
      : apiItem?.preferred_lesson_type === 'tutor'
        ? 'tutor'
        : null;
  const axis = tab === 'student' ? axisFromSearchTab(tab, hope || 'tutor') : axisFromSearchTab(tab);
  const label = toDisplayLabel(String(raw || ''), axis);
  logLocationDebug('api-normalize', { tab, axis, hope, raw, display: label });
  return label;
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {Record<string, unknown>} apiItem
 * @param {number} index
 */
export function mapToExposureItem(tab, apiItem, index = 0) {
  const id = Number(apiItem.id);

  if (tab === 'room') {
    // 카드 칸은 응답 값 그대로. summary 줄로 과목·소개를 대신 채우지 않는다.
    const pickContent = (key, fallback = '') =>
      Object.prototype.hasOwnProperty.call(apiItem, key) ? apiItem[key] ?? fallback : fallback;

    const merged = {
      ...apiItem,
      id,
      study_room_name: String(apiItem.title || ''),
      location_label: normalizeApiRegionLabel(tab, apiItem.region_label || '', apiItem),
      price_amount: apiItem.price_amount ?? null,
      main_subject_note: String(apiItem.main_subject_note || ''),
      grade_band: apiItem.grade_band || '',
      intro_short: String(pickContent('intro_short', '')),
      intro_long: String(pickContent('intro_long', '')),
      feature_1: String(pickContent('feature_1', '')),
      feature_2: String(pickContent('feature_2', '')),
      feature_3: String(pickContent('feature_3', '')),
      slogan: String(pickContent('slogan', '')),
      teaching_style: String(pickContent('teaching_style', '')),
      lesson_place_type: apiItem.lesson_place_type || null,
      capacity_per_time: apiItem.capacity_per_time || null,
      lesson_operation_type: apiItem.lesson_operation_type || null,
      facility_summary: String(pickContent('facility_summary', '')),
      inquiry_status: String(pickContent('inquiry_status', '')),
      education_office_registered: apiItem.education_office_registered ?? false,
      detail_completion_status: apiItem.detail_completion_status || '',
      prime_eligible: apiItem.prime_eligible ?? false,
      position_sku: paidPositionSku(apiItem) || null,
      latitude: apiItem.latitude ?? null,
      longitude: apiItem.longitude ?? null,
      profile_status: 'published',
      compare_eligible: apiItem.compare_eligible !== false,
      published_at: apiItem.published_at ?? null,
      created_at: apiItem.created_at ?? null,
      recommend_count: apiItem.recommend_count ?? 0,
      review_count: apiItem.review_count ?? 0,
      image_path: String(apiItem.image_path || ''),
      image_path_prime: String(apiItem.image_path_prime || apiItem.image_path || ''),
      image_path_basic: String(apiItem.image_path_basic || apiItem.image_path || ''),
      images: Array.isArray(apiItem.images) ? apiItem.images : [],
    };
    merged.badges = studyRoomBadges(merged);
    merged.exposure_tier = resolveExposureTier(merged, index);
    return merged;
  }

  if (tab === 'tutor') {
    // 카드 칸은 응답 값 그대로(…apiItem). summary 줄로 과목·소개를 대신 채우지 않는다.
    const merged = {
      ...apiItem,
      id,
      tutor_display_name: String(apiItem.title || ''),
      location_label: normalizeApiRegionLabel(tab, apiItem.region_label || '', apiItem),
      preferred_fee_amount: apiItem.preferred_fee_amount ?? apiItem.price_amount ?? null,
      main_subject_note: String(apiItem.main_subject_note || ''),
      intro_short: String(apiItem.intro_short || ''),
      lesson_places: Array.isArray(apiItem.lesson_places) ? apiItem.lesson_places : [],
      teaching_style_badges: Array.isArray(apiItem.teaching_style_badges) ? apiItem.teaching_style_badges : [],
      image_path: String(apiItem.image_path || apiItem.image_path_basic || ''),
      career_year_band: apiItem.career_year_band || null,
      university_name: apiItem.university_name || '',
      major_name: apiItem.major_name || '',
      lessons_per_week: apiItem.lessons_per_week ?? null,
      minutes_per_lesson: apiItem.minutes_per_lesson ?? null,
      detail_completion_status: apiItem.detail_completion_status || '',
      position_sku: paidPositionSku(apiItem) || null,
      profile_status: 'published',
      compare_eligible: apiItem.compare_eligible !== false,
      published_at: apiItem.published_at ?? null,
      created_at: apiItem.created_at ?? null,
      recommend_count: apiItem.recommend_count ?? 0,
      review_count: apiItem.review_count ?? 0,
    };
    merged.badges = tutorBadges(merged);
    merged.exposure_tier = resolveExposureTier(merged, index);
    return merged;
  }

  // 과목이 비면 비워 둔다. summary 첫 조각은 지역일 수 있다.
  const merged = {
    ...apiItem,
    id,
    public_display_name: String(apiItem.title || ''),
    grade_level: String(apiItem.grade_level || ''),
    gender: apiItem.gender || null,
    subject_label: String(apiItem.subject_name || ''),
    location_label: normalizeApiRegionLabel(tab, apiItem.region_label || '', apiItem),
    lesson_format: apiItem.lesson_format || null,
    student_gender_group: apiItem.student_gender_group || null,
    preferred_student_count_group: apiItem.preferred_student_count_group || null,
    preferred_lesson_type: apiItem.preferred_lesson_type || null,
    preferred_fee_amount: apiItem.preferred_fee_amount ?? null,
    preferred_studyroom_fee_amount: apiItem.preferred_studyroom_fee_amount ?? null,
    lessons_per_week: apiItem.lessons_per_week ?? null,
    minutes_per_lesson: apiItem.minutes_per_lesson ?? null,
    lesson_places: Array.isArray(apiItem.lesson_places) ? apiItem.lesson_places : [],
    teaching_style_badges: Array.isArray(apiItem.teaching_style_badges) ? apiItem.teaching_style_badges : [],
    request_summary: Object.prototype.hasOwnProperty.call(apiItem, 'request_summary')
      ? String(apiItem.request_summary || '')
      : '',
    special_request_note: Object.prototype.hasOwnProperty.call(apiItem, 'special_request_note')
      ? String(apiItem.special_request_note || '')
      : '',
    published_at: apiItem.published_at ?? null,
    created_at: apiItem.created_at ?? null,
    exposure_status: 'published',
    exposure_tier: 'basic',
  };
  return merged;
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {Array<Record<string, unknown>>} apiItems
 */
export function mapSearchResultsToExposure(tab, apiItems) {
  return apiItems.map((item, i) => mapToExposureItem(tab, item, i));
}

/**
 * @param {Array<object>} items
 * @returns {{ prime: object[], pick: object[], basic: object[] }}
 */
export function partitionByExposureTier(items) {
  /** @type {{ prime: object[], pick: object[], basic: object[] }} */
  const out = { prime: [], pick: [], basic: [] };
  for (const item of items) {
    const tier = item.exposure_tier || 'basic';
    if (tier === 'prime') out.prime.push(item);
    else if (tier === 'pick') out.pick.push(item);
    else out.basic.push(item);
  }
  return out;
}
