/**
 * 13장 — 검색 API 클라이언트 (study114_dev @ :8080)
 */

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
  return filters;
}

/**
 * 지역 입력값이 숫자가 아니면 id 필터 대신 label 필터로 승격
 * @param {Record<string, string | string[]>} filters
 * @param {import('./state.js').SearchTab} tab
 */
function promoteRegionLabelFilters(filters, tab) {
  const asText = (v) => (Array.isArray(v) ? String(v[0] || '') : String(v || '')).trim();
  const isNumericId = (v) => /^\d+$/.test(asText(v));

  if (tab === 'room' && filters.region_id != null && !isNumericId(filters.region_id)) {
    filters.region_label = asText(filters.region_id);
    delete filters.region_id;
  }
  if (tab === 'tutor' && filters.tutor_region_id != null && !isNumericId(filters.tutor_region_id)) {
    filters.tutor_region_label = asText(filters.tutor_region_id);
    delete filters.tutor_region_id;
  }
  if (tab === 'student' && filters.preferred_region != null && !isNumericId(filters.preferred_region)) {
    filters.preferred_region_label = asText(filters.preferred_region);
    delete filters.preferred_region;
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
    throw new Error(body.message || `검색 서버 오류 (${res.status})`);
  }

  return body;
}
