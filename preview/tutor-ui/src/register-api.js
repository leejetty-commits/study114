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

/** 기본정보와 과외지역 1을 한 요청으로 저장한다. tutor_id 가 없으면 지역 1 없이 행을 만들지 않는다. */
export async function saveBasicWithRegions(payload, tutorId = null) {
  return saveStep('basic', payload, tutorId);
}
