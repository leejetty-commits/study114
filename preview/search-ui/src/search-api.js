/**
 * 13장 — 검색 API 클라이언트 (study114_dev @ :8080)
 */

import { scaleCheonwonRangeFilters } from '../../shared/fee-cheonwon.js';

/**
 * @param {HTMLFormElement} form
 * @param {import('./state.js').SearchTab} tab
 * @returns {Record<string, string | string[]>}
 */
export function collectFiltersFromForm(form, tab) {
  /** @type {Record<string, string | string[]>} */
  const filters = {};
  const data = new FormData(form);

  for (const [rawKey, rawValue] of data.entries()) {
    if (typeof rawValue !== 'string' || rawValue === '') continue;
    if (!rawKey.startsWith('f_')) continue;

    const key = rawKey.slice(2);

    if (rawKey.endsWith('_min') || rawKey.endsWith('_max')) {
      filters[key] = rawValue;
      continue;
    }

    const existing = filters[key];
    if (existing === undefined) {
      filters[key] = rawValue;
    } else if (Array.isArray(existing)) {
      existing.push(rawValue);
    } else {
      filters[key] = [existing, rawValue];
    }
  }

  if (tab === 'student') {
    const budgetMin = filters['budget_amount_min'];
    const budgetMax = filters['budget_amount_max'];
    if (budgetMin !== undefined) filters['budget_amount_min'] = budgetMin;
    if (budgetMax !== undefined) filters['budget_amount_max'] = budgetMax;

    const priceMin = filters['price_amount_min'];
    const priceMax = filters['price_amount_max'];
    if (priceMin !== undefined && budgetMin === undefined) {
      filters['budget_amount_min'] = priceMin;
    }
    if (priceMax !== undefined && budgetMax === undefined) {
      filters['budget_amount_max'] = priceMax;
    }
  }

  promoteRegionLabelFilters(filters, tab);
  scaleCheonwonRangeFilters(filters);
  return filters;
}

/**
 * 학생 탭에서 preferred_studyroom_region_id 숫자만 남긴다.
 * 공부방 희망이 아니면 이 키를 보내지 않는다.
 * 공부방 희망이고 동 id가 있으면 과외 희망 지역 키는 함께 보내지 않는다.
 * @param {Record<string, string | string[]>} filters
 */
export function settleStudentStudyroomRegionFilter(filters) {
  const asText = (v) => (Array.isArray(v) ? String(v[0] || '') : String(v || '')).trim();
  const isNumericId = (v) => /^\d+$/.test(asText(v));
  const lesson = asText(filters.preferred_lesson_type);
  if (lesson === 'both') delete filters.preferred_lesson_type;
  if (lesson && lesson !== 'study_room') {
    delete filters.preferred_studyroom_region_id;
    delete filters.preferred_studyroom_complex_id;
    return;
  }
  if (isNumericId(filters.preferred_studyroom_complex_id) && lesson === 'study_room') {
    filters.preferred_studyroom_complex_id = asText(filters.preferred_studyroom_complex_id);
    delete filters.preferred_studyroom_region_id;
    delete filters.preferred_region;
    delete filters.preferred_region_id;
    delete filters.preferred_region_label;
    return;
  }
  delete filters.preferred_studyroom_complex_id;
  if (!isNumericId(filters.preferred_studyroom_region_id)) {
    delete filters.preferred_studyroom_region_id;
    return;
  }
  filters.preferred_studyroom_region_id = asText(filters.preferred_studyroom_region_id);
  if (lesson === 'study_room') {
    delete filters.preferred_region;
    delete filters.preferred_region_id;
    delete filters.preferred_region_label;
  }
}

/**
 * 공부방 찾기는 숫자 id 만 남긴다. 3단계 id 가 있으면 구 키를 빼고, 단지 id 가 있으면 동 id 도 뺀다.
 * @param {Record<string, string | string[]>} filters
 */
export function settleRoomAddressFilters(filters) {
  const asText = (v) => (Array.isArray(v) ? String(v[0] || '') : String(v || '')).trim();
  const isNumericId = (v) => /^\d+$/.test(asText(v));
  delete filters.region_label;
  for (const key of ['region_id', 'complex_id', 'sigungu_region_id']) {
    if (filters[key] == null || !isNumericId(filters[key])) delete filters[key];
    else filters[key] = asText(filters[key]);
  }
  if (filters.complex_id) {
    delete filters.region_id;
    delete filters.sigungu_region_id;
    delete filters.region_label;
  } else if (filters.region_id) {
    delete filters.sigungu_region_id;
  }
}

/**
 * 공부방·과외쌤·학생 희망은 숫자 id만 남긴다. 라벨은 보내지 않는다.
 * 학생 공부방 희망은 preferred_studyroom_region_id 숫자를 남긴다.
 * @param {Record<string, string | string[]>} filters
 * @param {import('./state.js').SearchTab} tab
 */
function promoteRegionLabelFilters(filters, tab) {
  const asText = (v) => (Array.isArray(v) ? String(v[0] || '') : String(v || '')).trim();
  const isNumericId = (v) => /^\d+$/.test(asText(v));

  if (tab === 'room') settleRoomAddressFilters(filters);
  if (tab === 'tutor') {
    delete filters.tutor_region_label;
    if (filters.tutor_region_id != null && !isNumericId(filters.tutor_region_id)) {
      delete filters.tutor_region_id;
    }
  }
  if (tab === 'student') {
    delete filters.preferred_region_label;
    const id = isNumericId(filters.preferred_region_id)
      ? asText(filters.preferred_region_id)
      : isNumericId(filters.preferred_region)
        ? asText(filters.preferred_region)
        : '';
    delete filters.preferred_region;
    if (id) filters.preferred_region_id = id;
    else delete filters.preferred_region_id;
    settleStudentStudyroomRegionFilter(filters);
  }
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {Record<string, string | string[]>} filters
 * @param {{ page?: number, limit?: number, sort?: string }} [opts]
 */
export async function searchApi(tab, filters, opts = {}) {
  const res = await fetch('/api/search/search.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tab,
      filters,
      page: opts.page ?? 1,
      limit: opts.limit ?? 20,
      sort: opts.sort ?? 'latest',
    }),
  });

  const body = await res.json();
  if (!res.ok || !body.ok) {
    const err = new Error(body.message || `검색 서버 오류 (${res.status})`);
    err.status = res.status;
    err.error = body.error;
    throw err;
  }

  return body;
}
