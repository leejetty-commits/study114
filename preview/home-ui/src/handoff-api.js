/**
 * 25장 부록 B — Handoff REST client (PHP 엔드포인트)
 * 배선: public/api/handoff/*.php
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CREDENTIALS = { credentials: 'include' };

export const HANDOFF_ENDPOINTS = {
  favorites: '/api/handoff/favorites.php',
  compare: '/api/handoff/compare.php',
  recent: '/api/handoff/recent.php',
  studentReviews: '/api/handoff/student-reviews.php',
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

export async function listFavorites(targetType) {
  const qs = targetType ? `?target_type=${encodeURIComponent(targetType)}` : '';
  const res = await fetch(`${HANDOFF_ENDPOINTS.favorites}${qs}`, { ...CREDENTIALS });
  return parseJson(res);
}

export async function toggleFavorite(targetType, targetId) {
  const res = await fetch(HANDOFF_ENDPOINTS.favorites, {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ target_type: targetType, target_id: targetId }),
  });
  return parseJson(res);
}

export async function removeFavorite(targetType, targetId) {
  const qs = `?target_type=${encodeURIComponent(targetType)}&target_id=${targetId}`;
  const res = await fetch(`${HANDOFF_ENDPOINTS.favorites}${qs}`, { method: 'DELETE', ...CREDENTIALS });
  return parseJson(res);
}

export async function listCompare(targetType) {
  const qs = `?target_type=${encodeURIComponent(targetType)}`;
  const res = await fetch(`${HANDOFF_ENDPOINTS.compare}${qs}`, { ...CREDENTIALS });
  return parseJson(res);
}

export async function toggleCompare(targetType, targetId) {
  const res = await fetch(HANDOFF_ENDPOINTS.compare, {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ target_type: targetType, target_id: targetId }),
  });
  return parseJson(res);
}

export async function clearCompare(targetType) {
  const qs = `?target_type=${encodeURIComponent(targetType)}`;
  const res = await fetch(`${HANDOFF_ENDPOINTS.compare}${qs}`, { method: 'DELETE', ...CREDENTIALS });
  return parseJson(res);
}

export async function listRecent() {
  const res = await fetch(HANDOFF_ENDPOINTS.recent, { ...CREDENTIALS });
  return parseJson(res);
}

export async function recordRecentView(payload) {
  const res = await fetch(HANDOFF_ENDPOINTS.recent, {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ action: 'record', ...payload }),
  });
  return parseJson(res);
}

export async function patchRecentHandoff(payload) {
  const res = await fetch(HANDOFF_ENDPOINTS.recent, {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ action: 'patch', ...payload }),
  });
  return parseJson(res);
}

export async function listStudentReviews() {
  const res = await fetch(HANDOFF_ENDPOINTS.studentReviews, { ...CREDENTIALS });
  return parseJson(res);
}

export async function toggleStudentReview(studentId, providerRole) {
  const res = await fetch(HANDOFF_ENDPOINTS.studentReviews, {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ student_id: studentId, provider_role: providerRole }),
  });
  return parseJson(res);
}

export async function removeStudentReview(studentId) {
  const qs = `?student_id=${studentId}`;
  const res = await fetch(`${HANDOFF_ENDPOINTS.studentReviews}${qs}`, { method: 'DELETE', ...CREDENTIALS });
  return parseJson(res);
}
