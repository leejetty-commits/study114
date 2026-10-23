const CREDENTIALS = { credentials: 'include' };

async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || '등록 목록을 불러오지 못했습니다.');
  }
  return data;
}

/**
 * @param {{ role?: string, from?: string, to?: string, region?: string, page?: number, perPage?: number }} [query]
 */
export async function fetchRegistrationList(query = {}) {
  const params = new URLSearchParams();
  params.set('role', query.role || 'study_room');
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.region) params.set('region', query.region);
  params.set('page', String(query.page || 1));
  params.set('perPage', String(query.perPage || 50));
  const res = await fetch(`/api/admin/registrations.php?${params}`, {
    method: 'GET',
    ...CREDENTIALS,
  });
  return readJson(res);
}
