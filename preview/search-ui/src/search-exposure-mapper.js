/**
 * 13장 검색 API → 11장 노출 아이템 · exposure_tier 매핑
 */

import { resolveDetailItem } from '@home-ui/detail-decision/index.js';
import {
  EXPOSURE_STUDY_ROOMS,
  EXPOSURE_TUTORS,
  EXPOSURE_STUDENTS,
} from '@home-ui/exposure-data.js';
import { studyRoomBadges, tutorBadges } from '@home-ui/exposure-format.js';
import { tabToKind } from './search-handoff.js';

/** @typedef {'prime'|'pick'|'basic'} ExposureTier */

/**
 * @param {object} item
 * @param {number} index
 * @returns {ExposureTier}
 */
export function resolveExposureTier(item, index = 0) {
  const t = item.exposure_tier;
  if (t === 'prime' || t === 'pick' || t === 'basic') return t;
  if (item.prime_eligible) return 'prime';
  if (item.pick_eligible || item.detail_completion_status === 'expanded_complete') {
    return index < 8 ? 'pick' : 'basic';
  }
  if (index < 3) return 'prime';
  if (index < 8) return 'pick';
  return 'basic';
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {Record<string, unknown>} apiItem
 * @param {number} index
 */
export function mapToExposureItem(tab, apiItem, index = 0) {
  const kind = tabToKind(tab);
  const id = Number(apiItem.id);
  const pooled = resolveDetailItem(kind, id);

  if (tab === 'room') {
    const base = pooled || EXPOSURE_STUDY_ROOMS[index % EXPOSURE_STUDY_ROOMS.length] || EXPOSURE_STUDY_ROOMS[0];
    const summaryLines = String(apiItem.summary || '').split('\n').filter(Boolean);
    const merged = {
      ...base,
      id,
      study_room_name: String(apiItem.title || base.study_room_name),
      location_label: String(apiItem.region_label || base.location_label),
      price_amount: apiItem.price_amount ?? base.price_amount,
      main_subject_note: apiItem.main_subject_note || summaryLines[0] || base.main_subject_note,
      grade_band: apiItem.grade_band || base.grade_band,
      intro_short: apiItem.intro_short || summaryLines[1] || base.intro_short,
      feature_1: apiItem.feature_1 || base.feature_1,
      slogan: apiItem.slogan || base.slogan,
      lesson_place_type: apiItem.lesson_place_type || base.lesson_place_type,
      capacity_per_time: apiItem.capacity_per_time || base.capacity_per_time,
      lesson_operation_type: apiItem.lesson_operation_type || base.lesson_operation_type,
      education_office_registered:
        apiItem.education_office_registered ?? base.education_office_registered,
      detail_completion_status: apiItem.detail_completion_status || base.detail_completion_status,
      prime_eligible: apiItem.prime_eligible ?? base.prime_eligible,
      latitude: apiItem.latitude ?? base.latitude ?? null,
      longitude: apiItem.longitude ?? base.longitude ?? null,
      profile_status: 'published',
      compare_eligible: apiItem.compare_eligible !== false,
      inquiry_status: base.inquiry_status || 'open',
      badges: studyRoomBadges({
        ...base,
        main_subject_note: apiItem.main_subject_note || summaryLines[0] || base.main_subject_note,
        education_office_registered:
          apiItem.education_office_registered ?? base.education_office_registered,
      }),
    };
    merged.exposure_tier = resolveExposureTier(merged, index);
    return merged;
  }

  if (tab === 'tutor') {
    const base = pooled || EXPOSURE_TUTORS[index % EXPOSURE_TUTORS.length] || EXPOSURE_TUTORS[0];
    const summaryLines = String(apiItem.summary || '').split('\n').filter(Boolean);
    const merged = {
      ...base,
      id,
      tutor_display_name: String(apiItem.title || base.tutor_display_name),
      location_label: String(apiItem.region_label || base.location_label),
      preferred_fee_amount: apiItem.preferred_fee_amount ?? apiItem.price_amount ?? base.preferred_fee_amount,
      main_subject_note: apiItem.main_subject_note || summaryLines[0] || base.main_subject_note,
      intro_short: apiItem.intro_short || summaryLines[1] || base.intro_short,
      career_year_band: apiItem.career_year_band || base.career_year_band,
      university_name: apiItem.university_name || base.university_name,
      major_name: apiItem.major_name || base.major_name,
      lessons_per_week: apiItem.lessons_per_week ?? base.lessons_per_week,
      minutes_per_lesson: apiItem.minutes_per_lesson ?? base.minutes_per_lesson,
      detail_completion_status: apiItem.detail_completion_status || base.detail_completion_status,
      profile_status: 'published',
      compare_eligible: apiItem.compare_eligible !== false,
      badges: tutorBadges({
        ...base,
        main_subject_note: apiItem.main_subject_note || summaryLines[0] || base.main_subject_note,
      }),
    };
    merged.exposure_tier = resolveExposureTier(merged, index);
    return merged;
  }

  const base = pooled || EXPOSURE_STUDENTS[index % EXPOSURE_STUDENTS.length] || EXPOSURE_STUDENTS[0];
  const summaryParts = String(apiItem.summary || '').split(' · ').filter(Boolean);
  const merged = {
    ...base,
    id,
    public_display_name: String(apiItem.title || base.public_display_name),
    grade_level: String(apiItem.grade_level || base.grade_level),
    gender: apiItem.gender || base.gender,
    subject_label: apiItem.subject_name || summaryParts[0] || base.subject_label,
    location_label: String(apiItem.region_label || base.location_label),
    lesson_format: apiItem.lesson_format || base.lesson_format,
    student_gender_group: apiItem.student_gender_group || base.student_gender_group,
    preferred_student_count_group:
      apiItem.preferred_student_count_group || base.preferred_student_count_group,
    preferred_lesson_type: apiItem.preferred_lesson_type || base.preferred_lesson_type,
    preferred_fee_amount: apiItem.preferred_fee_amount ?? base.preferred_fee_amount,
    preferred_studyroom_fee_amount:
      apiItem.preferred_studyroom_fee_amount ?? base.preferred_studyroom_fee_amount,
    lessons_per_week: apiItem.lessons_per_week ?? base.lessons_per_week,
    minutes_per_lesson: apiItem.minutes_per_lesson ?? base.minutes_per_lesson,
    lesson_places: apiItem.lesson_places || base.lesson_places,
    teaching_style_badges: apiItem.teaching_style_badges || base.teaching_style_badges,
    request_summary_visibility:
      apiItem.request_summary_visibility || base.request_summary_visibility,
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
