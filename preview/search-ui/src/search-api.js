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

  return filters;
}

/**
 * @param {import('./state.js').SearchTab} tab
 * @param {Record<string, string | string[]>} filters
 * @param {{ page?: number, limit?: number }} [opts]
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
    }),
  });

  const body = await res.json();
  if (!res.ok || !body.ok) {
    throw new Error(body.message || `검색 서버 오류 (${res.status})`);
  }

  return body;
}
