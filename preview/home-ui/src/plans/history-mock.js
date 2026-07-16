/** 결제내역 — UI 골격 + mock (API 연결 가능 시 교체) */

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
 */

/** @returns {HistoryRow[]} */
export function getHistoryRows() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return getSeedHistory();
}

/** @param {HistoryRow} row */
export function appendHistoryRow(row) {
  const rows = getHistoryRows();
  rows.unshift(row);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 50)));
}

function getSeedHistory() {
  /** @type {HistoryRow[]} */
  const seed = [
    {
      orderRef: 'demo-prime-001',
      productName: 'Prime · 30일',
      providerLabel: '샘플 공부방',
      amountKrw: 10,
      paymentMethod: 'card',
      paidAt: '2026-07-01T10:00:00+09:00',
      status: 'paid',
      startedAt: '2026-07-01',
      endedAt: '2026-07-31',
    },
    {
      orderRef: 'demo-pick-002',
      productName: 'Pick · 14일',
      providerLabel: '샘플 과외쌤',
      amountKrw: 10,
      paymentMethod: 'transfer',
      paidAt: '2026-06-20T15:30:00+09:00',
      status: 'paid',
      startedAt: '2026-06-20',
      endedAt: '2026-07-04',
    },
  ];
  return seed;
}

/** @param {string} method */
export function paymentMethodLabel(method) {
  const map = { card: '카드', transfer: '계좌이체', vbank: '무통장' };
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
