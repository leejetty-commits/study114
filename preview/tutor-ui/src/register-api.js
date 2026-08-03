const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function postJson(body) {
  const res = await fetch('/api/tutor/register.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    if (res.status === 401 || data.error === 'unauthenticated') {
      throw new Error(
        data.message || '로그인이 필요합니다. 로그인 후 상세등록을 이어가 주세요.',
      );
    }
    if (res.status === 422) {
      throw new Error(data.message || '필수 항목을 확인해 주세요.');
    }
    throw new Error(data.message || `서버 오류 (${res.status})`);
  }
  return data;
}

export async function fetchMasters() {
  return (await postJson({ action: 'masters' })).masters;
}

export async function loadTutor() {
  return (await postJson({ action: 'load' })).tutor;
}

export async function saveStep(step, payload, tutorId = null) {
  return postJson({ action: 'save', step, tutor_id: tutorId, payload });
}

export async function devLogin(email = 'tutor-owner1@dev.local', password = 'password') {
  const res = await fetch('/api/auth/login.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.message || '로그인 실패');
  return data;
}
