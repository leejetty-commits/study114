/**
 * P19~21 — 등록 허브 REST client
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CREDENTIALS = { credentials: 'include' };

export const REGISTRATIONS_ENDPOINTS = {
  students: '/api/registrations/students.php',
  studyRooms: '/api/registrations/study-rooms.php',
  tutors: '/api/registrations/tutors.php',
};

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.code = data.error;
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export async function listStudents() {
  const res = await fetch(REGISTRATIONS_ENDPOINTS.students, { ...CREDENTIALS });
  return parseJson(res);
}

export async function patchStudent(id, action, body = {}) {
  const res = await fetch(REGISTRATIONS_ENDPOINTS.students, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ id, action, ...body }),
  });
  return parseJson(res);
}

export async function listStudyRooms() {
  const res = await fetch(REGISTRATIONS_ENDPOINTS.studyRooms, { ...CREDENTIALS });
  return parseJson(res);
}

export async function patchStudyRoom(id, action, body = {}) {
  const res = await fetch(REGISTRATIONS_ENDPOINTS.studyRooms, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ id, action, ...body }),
  });
  return parseJson(res);
}

export async function listTutors() {
  const res = await fetch(REGISTRATIONS_ENDPOINTS.tutors, { ...CREDENTIALS });
  return parseJson(res);
}

export async function patchTutor(id, action, body = {}) {
  const res = await fetch(REGISTRATIONS_ENDPOINTS.tutors, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ id, action, ...body }),
  });
  return parseJson(res);
}
