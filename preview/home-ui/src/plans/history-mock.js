/** 결제내역 — API 우선, 실패 시 session mock */

import { fetchPaidHistory } from '../paid-api.js';
import { getProductConfig } from './runtime-config.js';

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
  return getSeedHistory();
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
  const cfg = getProductConfig(productId);
  const name = cfg?.name || productId;
  return {
    orderRef: String(order.order_ref || ''),
    productName: `${name} · ${variant}`,
    providerLabel: '내 프로필',
    amountKrw: Number(order.amount_won) || 0,
    paymentMethod: String(order.pg_provider || 'card') === 'dev_mock' ? 'card' : String(order.pg_provider || 'card'),
    paidAt: String(order.paid_at || order.created_at || ''),
    status: /** @type {HistoryRow['status']} */ (order.status || 'pending'),
    source: 'api',
  };
}

function getSeedHistory() {
  /** @type {HistoryRow[]} */
  const seed = [
    {
      orderRef: 'demo-prime-001',
      productName: '대표 노출 · 30일',
      providerLabel: '샘플 공부방',
      amountKrw: 10,
      paymentMethod: 'card',
      paidAt: '2026-07-01T10:00:00+09:00',
      status: 'paid',
      startedAt: '2026-07-01',
      endedAt: '2026-07-31',
      source: 'seed',
    },
    {
      orderRef: 'demo-pick-002',
      productName: '추천 노출 · 14일',
      providerLabel: '샘플 과외쌤',
      amountKrw: 10,
      paymentMethod: 'transfer',
      paidAt: '2026-06-20T15:30:00+09:00',
      status: 'paid',
      startedAt: '2026-06-20',
      endedAt: '2026-07-04',
      source: 'seed',
    },
  ];
  return seed;
}

/** @param {string} method */
export function paymentMethodLabel(method) {
  const map = { card: '카드', transfer: '계좌이체', vbank: '무통장', dev_mock: '카드(mock)' };
  return map[method] || method;
}

/** @param {string} status */
export function orderStatusLabel(status) {
  const map = {
    paid: '결제완료',
    failed: '실패',
    canceled: '취소',
    pending: '대기',
  };
  return map[status] || status;
}
