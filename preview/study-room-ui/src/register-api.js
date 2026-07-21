/**
 * 5장 — 공부방 등록 API (study114_dev @ :8080 via Vite proxy)
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function postJson(body) {
  const res = await fetch('/api/study-room/register.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const msg = data.message || `서버 오류 (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export async function fetchMasters() {
  const data = await postJson({ action: 'masters' });
  return data.masters;
}

export async function loadRoom() {
  const data = await postJson({ action: 'load' });
  return data.room;
}

/**
 * @param {string} step
 * @param {Record<string, unknown>} payload
 * @param {number|null} studyRoomId
 */
export async function saveStep(step, payload, studyRoomId = null) {
  return postJson({
    action: 'save',
    step,
    study_room_id: studyRoomId,
    payload,
  });
}

export async function devLogin(email = 'room-owner1@dev.local', password = 'password') {
  const res = await fetch('/api/auth/login.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '로그인 실패');
  }
  return data;
}
