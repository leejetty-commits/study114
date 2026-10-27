/** 결제내역 — API 우선, 실패 시 session mock */

import { fetchPaidHistory } from '../paid-api.js';
import { getProductConfig } from './runtime-config.js';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  UNKNOWN_STATUS_LABEL,
  UNKNOWN_PAYMENT_METHOD_LABEL,
  UNKNOWN_PRODUCT_LABEL,
} from '../mypage/mypage-copy.js';

const STORAGE_KEY = 'study114-plans-history-mock';

/**
 * @typedef {object} HistoryRow
 * @property {string} orderRef
 * @property {string} productName
 * @property {string} providerLabel
 * @property {number} amountKrw
 * @property {string} paymentMethod
 * @property {string} paidAt
 * @property {'paid'|'failed'|'canceled'|'pending'} status
 * @property {string} [startedAt]
 * @property {string} [endedAt]
 * @property {string} [source]
 */

/** @returns {HistoryRow[]} */
export function getLocalHistoryRows() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

/** @deprecated use getLocalHistoryRows or loadHistoryRows */
export function getHistoryRows() {
  return getLocalHistoryRows();
}

/** @param {HistoryRow} row */
export function appendHistoryRow(row) {
  const rows = getLocalHistoryRows().filter((r) => r.orderRef !== row.orderRef);
  rows.unshift({ ...row, source: row.source || 'local' });
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 50)));
}

/**
 * API + local merge (API 우선, local만 있는 건 뒤에)
 * @returns {Promise<{ rows: HistoryRow[], fromApi: boolean }>}
 */
export async function loadHistoryRows() {
  const local = getLocalHistoryRows();
  try {
    const data = await fetchPaidHistory(50);
    const apiOrders = Array.isArray(data.orders) ? data.orders : [];
    const apiRows = apiOrders.map(mapApiOrder);
    const apiRefs = new Set(apiRows.map((r) => r.orderRef));
    const localOnly = local.filter((r) => !apiRefs.has(r.orderRef) && r.source !== 'seed');
    return { rows: [...apiRows, ...localOnly], fromApi: true };
  } catch {
    return { rows: local, fromApi: false };
  }
}

/** @param {Record<string, mixed>} order */
function mapApiOrder(order) {
  const productId = String(order.product_id || '');
  const variant = String(order.variant_label || '');
  return {
    orderRef: String(order.order_ref || ''),
    /** 가격표가 결제 내역보다 늦게 올 수 있어, 다시 그릴 때마다 이름을 찾는다 */
    get productName() {
      const name = getProductConfig(productId)?.name || UNKNOWN_PRODUCT_LABEL;
      return `${name} · ${variant}`;
    },
    providerLabel: '내 프로필',
    amountKrw: Number(order.amount_won) || 0,
    paymentMethod: String(order.pg_provider || 'card') === 'dev_mock' ? 'card' : String(order.pg_provider || 'card'),
    paidAt: String(order.paid_at || order.created_at || ''),
    status: /** @type {HistoryRow['status']} */ (order.status || 'pending'),
    source: 'api',
  };
}

/** 캐시 무효화 — 환불 신청·철회 후 호출 */
export function invalidateHistoryCache() {
  // screens.js 쪽 historyCache.loaded = false 와 연동
  return { invalidated: true };
}

/** canceled/cancelled 정규화 */
function normalizeStatus(status) {
  if (status === 'canceled') return 'cancelled';
  return status || 'pending';
}

/** @param {string} method */
export function paymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] || UNKNOWN_PAYMENT_METHOD_LABEL;
}

/** @param {string} status */
export function orderStatusLabel(status) {
  return ORDER_STATUS_LABELS[normalizeStatus(status)] || UNKNOWN_STATUS_LABEL;
}
