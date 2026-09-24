const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CREDENTIALS = { credentials: 'include' };

const ERROR_TEXT = {
  audience_required: '대상을 하나 이상 고르세요',
  bad_audience: '허용되지 않은 대상입니다.',
  bad_href: '링크는 #/ , / , https:// 만 사용할 수 있습니다.',
  bad_type: '유형을 다시 선택해 주세요.',
  bad_family: '모양을 다시 선택해 주세요.',
  bad_date: '날짜는 YYYY-MM-DD 이거나 비워야 합니다.',
  bad_range: '시작일이 종료일보다 늦을 수 없습니다.',
  bad_published: '공개는 켜짐 또는 꺼짐만 선택할 수 있습니다.',
  bad_sort: '순서는 숫자여야 합니다.',
  not_found: '팝업을 찾을 수 없습니다.',
};

/** @type {Array<Record<string, unknown>> | null} */
let rows = null;
/** @type {string} */
let loadError = '';
/** @type {Promise<Array<Record<string, unknown>>> | null} */
let inflight = null;

async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const code = String(data.error || '');
    throw new Error(ERROR_TEXT[code] || data.message || '팝업을 저장하지 못했습니다.');
  }
  return data;
}

export function peekHomePopups() {
  return { rows, loadError };
}

export async function listHomePopups() {
  const res = await fetch('/api/admin/home-popups.php', CREDENTIALS);
  const data = await readJson(res);
  rows = Array.isArray(data.popups) ? data.popups : [];
  loadError = '';
  return rows;
}

export function ensureHomePopups() {
  if (rows) return Promise.resolve(rows);
  if (!inflight) {
    inflight = listHomePopups()
      .catch((err) => {
        rows = [];
        loadError = err instanceof Error ? err.message : '목록을 불러오지 못했습니다.';
        return rows;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** @param {string} id */
export async function getHomePopup(id) {
  const res = await fetch(`/api/admin/home-popups.php?id=${encodeURIComponent(id)}`, CREDENTIALS);
  const data = await readJson(res);
  return data.popup;
}

/** @param {Record<string, unknown>} row */
export async function saveHomePopup(row) {
  const res = await fetch('/api/admin/home-popups.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify(row),
  });
  const data = await readJson(res);
  await listHomePopups();
  return data.popup;
}

/** @param {string} id */
export async function deleteHomePopup(id) {
  const res = await fetch(`/api/admin/home-popups.php?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    ...CREDENTIALS,
  });
  await readJson(res);
  await listHomePopups();
}
