/**
 * PR-A — 서버 PaidCatalog 클라이언트 캐시
 * 구가격 seed로 silent fallback 하지 않는다.
 */

import { PAID_ENDPOINTS } from '../paid-api.js';

/** @typedef {'study_room'|'tutor'} ProviderRole */

/**
 * @typedef {object} CatalogOption
 * @property {string} option_id
 * @property {string} [period]
 * @property {string} [duration_type]
 * @property {number} [duration_value]
 * @property {number} list_price_krw
 * @property {number} discount_rate
 * @property {number} discount_krw
 * @property {number} sale_price_krw
 * @property {number} [memo_bundle]
 * @property {string} api_variant
 * @property {string} label
 * @property {string} [ticket_kind]
 * @property {number} [credit_count]
 * @property {number|null} [expire_days]
 * @property {boolean} [balance_stored]
 */

/**
 * @typedef {object} CatalogProduct
 * @property {string} product_code
 * @property {'position'|'access'|'badge_addon'} family
 * @property {string} provider_type
 * @property {string} name
 * @property {boolean} [period_inherited]
 * @property {number} [pack_expire_days]
 * @property {CatalogOption[]} options
 */

/**
 * @typedef {object} CatalogState
 * @property {string} catalog_version
 * @property {string[]} periods
 * @property {CatalogProduct[]} products
 * @property {Record<string, Record<string, number>>} [discount_rates]
 * @property {number} [memo_pack_expire_days]
 * @property {number} loadedAt
 */

/** @type {CatalogState | null} */
let catalogState = null;

/** @type {string | null} */
let catalogError = null;

/** @type {Promise<CatalogState> | null} */
let inflight = null;

export function getCatalogState() {
  return catalogState;
}

export function getCatalogError() {
  return catalogError;
}

export function isCatalogReady() {
  return catalogState != null && Array.isArray(catalogState.products);
}

export function clearCatalogCache() {
  catalogState = null;
  catalogError = null;
  inflight = null;
}

/**
 * @param {ProviderRole | string} [providerType]
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<CatalogState>}
 */
export async function hydratePaidCatalog(providerType, opts = {}) {
  if (!opts.force && catalogState && isCatalogReady()) {
    return catalogState;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    catalogError = null;
    const qs =
      providerType === 'study_room' || providerType === 'tutor'
        ? `?provider_type=${encodeURIComponent(providerType)}`
        : '';
    const res = await fetch(`${PAID_ENDPOINTS.catalog}${qs}`, { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      const msg = data.message || `카탈로그를 불러오지 못했습니다 (HTTP ${res.status})`;
      catalogError = msg;
      catalogState = null;
      throw new Error(msg);
    }
    if (!Array.isArray(data.products) || !data.catalog_version) {
      catalogError = '카탈로그 응답 형식이 올바르지 않습니다.';
      catalogState = null;
      throw new Error(catalogError);
    }
    catalogState = {
      catalog_version: String(data.catalog_version),
      periods: Array.isArray(data.periods) ? data.periods.map(String) : [],
      products: data.products,
      discount_rates: data.discount_rates || {},
      memo_pack_expire_days: Number(data.memo_pack_expire_days) || 120,
      loadedAt: Date.now(),
    };
    return catalogState;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/**
 * @param {string} productCode
 * @param {ProviderRole | string} [providerType]
 * @returns {CatalogProduct | null}
 */
export function findCatalogProduct(productCode, providerType) {
  if (!catalogState) return null;
  const code = productCode === 'picked' ? 'jjokjipge' : productCode;
  const matches = catalogState.products.filter((p) => p.product_code === code);
  if (!matches.length) return null;
  if (providerType === 'study_room' || providerType === 'tutor') {
    const roleHit = matches.find(
      (p) => p.provider_type === providerType || p.provider_type === 'both',
    );
    return roleHit || null;
  }
  return matches[0];
}

/**
 * @param {string} productCode
 * @param {string} optionIdOrVariant
 * @param {ProviderRole | string} [providerType]
 */
export function findCatalogOption(productCode, optionIdOrVariant, providerType) {
  const product = findCatalogProduct(productCode, providerType);
  if (!product) return null;
  return (
    product.options.find(
      (o) =>
        o.option_id === optionIdOrVariant ||
        o.api_variant === optionIdOrVariant ||
        o.label === optionIdOrVariant ||
        o.period === optionIdOrVariant,
    ) || null
  );
}
