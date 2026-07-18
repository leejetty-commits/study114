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

/**
 * @param {{ q?: string, status?: string, role_type?: string, limit?: number }} [filters]
 */
export async function fetchAdminMembers(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  if (filters.role_type) params.set('role_type', filters.role_type);
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  const res = await fetch(`/api/admin/members.php${qs ? `?${qs}` : ''}`, CREDENTIALS);
  return readJson(res);
}

/** @param {number} id */
export async function fetchAdminMemberDetail(id) {
  const res = await fetch(`/api/admin/members.php?id=${id}`, CREDENTIALS);
  return readJson(res);
}

/** @param {Record<string, unknown>} input */
export async function patchAdminMember(input) {
  const res = await fetch('/api/admin/members.php', {
    method: 'PATCH',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify(input),
  });
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

export async function fetchAdminOperators() {
  const res = await fetch('/api/admin/operators.php', CREDENTIALS);
  return readJson(res);
}

/** @param {Record<string, unknown>} input */
export async function createAdminOperator(input) {
  const res = await fetch('/api/admin/operators.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify(input),
  });
  return readJson(res);
}

/** @param {Record<string, unknown>} input */
export async function patchAdminOperator(input) {
  const res = await fetch('/api/admin/operators.php', {
    method: 'PATCH',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify(input),
  });
  return readJson(res);
}

/** @param {Record<string, unknown>} input */
export async function resetAdminOperatorPassword(input) {
  const res = await fetch('/api/admin/operators.php?action=reset_password', {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify(input),
  });
  return readJson(res);
}
