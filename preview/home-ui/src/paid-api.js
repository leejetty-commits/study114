/**
 * 18a — P18-02 ROI REST client
 * 배선: public/api/paid/roi.php
 */

const CREDENTIALS = { credentials: 'include' };

export const PAID_ENDPOINTS = {
  roi: '/api/paid/roi.php',
  status: '/api/paid/status.php',
  requestAccess: '/api/paid/request-access.php',
  checkout: '/api/paid/checkout.php',
  notices: '/api/paid/notices.php',
  history: '/api/paid/history.php',
};

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.code = data.error;
    err.status = res.status;
    throw err;
  }
  return data;
}

/** @param {number} [days] */
export async function fetchRoiSummary(days = 7) {
  const qs = days > 0 ? `?days=${days}` : '';
  const res = await fetch(`${PAID_ENDPOINTS.roi}${qs}`, { ...CREDENTIALS });
  return parseJson(res);
}

/** @param {number} [days] */
export async function fetchPaidStatus(days = 7) {
  const qs = days > 0 ? `?days=${days}` : '';
  const res = await fetch(`${PAID_ENDPOINTS.status}${qs}`, { ...CREDENTIALS });
  return parseJson(res);
}

export async function fetchRequestAccessList() {
  const res = await fetch(PAID_ENDPOINTS.requestAccess, { ...CREDENTIALS });
  return parseJson(res);
}

/** @param {number} studentId */
export async function fetchRequestAccessStatus(studentId) {
  const res = await fetch(`${PAID_ENDPOINTS.requestAccess}?student_id=${studentId}`, {
    ...CREDENTIALS,
  });
  return parseJson(res);
}

/** @param {number} studentId */
export async function unlockStudentRequest(studentId) {
  const res = await fetch(PAID_ENDPOINTS.requestAccess, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...CREDENTIALS,
    body: JSON.stringify({ student_id: studentId }),
  });
  return parseJson(res);
}

export async function fetchProviderNotices() {
  const res = await fetch(PAID_ENDPOINTS.notices, { ...CREDENTIALS });
  return parseJson(res);
}

/** @param {number} noticeId */
export async function markProviderNoticeRead(noticeId) {
  const res = await fetch(PAID_ENDPOINTS.notices, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...CREDENTIALS,
    body: JSON.stringify({ action: 'mark_read', notice_id: noticeId }),
  });
  return parseJson(res);
}

/** @param {string} productId @param {string} variant */
export async function createPaidCheckout(productId, variant) {
  const res = await fetch(PAID_ENDPOINTS.checkout, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...CREDENTIALS,
    body: JSON.stringify({ action: 'create', product_id: productId, variant }),
  });
  return parseJson(res);
}

/** @param {string} orderRef */
export async function completePaidCheckout(orderRef) {
  const res = await fetch(PAID_ENDPOINTS.checkout, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...CREDENTIALS,
    body: JSON.stringify({ action: 'complete', order_ref: orderRef }),
  });
  return parseJson(res);
}

/** @param {number} [limit] */
export async function fetchPaidHistory(limit = 50) {
  const qs = limit > 0 ? `?limit=${limit}` : '';
  const res = await fetch(`${PAID_ENDPOINTS.history}${qs}`, { ...CREDENTIALS });
  return parseJson(res);
}
