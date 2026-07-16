const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CREDENTIALS = { credentials: 'include' };

async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || 'admin api error');
  }
  return data;
}

/** @param {string} [status] */
export async function fetchSubmissionQueue(status = 'submitted') {
  const params = new URLSearchParams({ status });
  const res = await fetch(`/api/admin/submission-queue.php?${params}`, CREDENTIALS);
  return readJson(res);
}

/** @param {Record<string, unknown>} input */
export async function patchSubmissionQueueAction(input) {
  const res = await fetch('/api/admin/submission-queue.php', {
    method: 'PATCH',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify(input),
  });
  return readJson(res);
}

/** @param {number} [limit] */
export async function fetchOperationLogs(limit = 50) {
  const res = await fetch(`/api/admin/operation-logs.php?limit=${limit}`, CREDENTIALS);
  return readJson(res);
}

/** @param {string} [status] */
export async function fetchAdminReports(status = '') {
  const params = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`/api/admin/reports.php${params}`, CREDENTIALS);
  return readJson(res);
}

/** @param {Record<string, unknown>} input */
export async function patchAdminReport(input) {
  const res = await fetch('/api/admin/reports.php', {
    method: 'PATCH',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify(input),
  });
  return readJson(res);
}

/** @param {string} [targetType] @param {string} [status] */
export async function fetchExposureTargets(targetType = 'all', status = '') {
  const params = new URLSearchParams();
  if (targetType) params.set('target_type', targetType);
  if (status) params.set('status', status);
  const qs = params.toString();
  const res = await fetch(`/api/admin/exposure.php${qs ? `?${qs}` : ''}`, CREDENTIALS);
  return readJson(res);
}

/** @param {number} [limit] */
export async function fetchCommerceOverview(limit = 50) {
  const res = await fetch(`/api/admin/commerce.php?limit=${limit}`, CREDENTIALS);
  return readJson(res);
}

/** @param {Record<string, unknown>} input */
export async function patchCommerceCorrection(input) {
  const res = await fetch('/api/admin/commerce.php', {
    method: 'PATCH',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify(input),
  });
  return readJson(res);
}

/** @param {Record<string, unknown>} input */
export async function patchExposureCorrection(input) {
  const res = await fetch('/api/admin/exposure.php', {
    method: 'PATCH',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify(input),
  });
  return readJson(res);
}

export async function fetchAdminSession() {
  const res = await fetch('/api/admin/session.php', CREDENTIALS);
  return readJson(res);
}
