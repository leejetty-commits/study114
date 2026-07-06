/**
 * 13장 검색 API — home-ui exposure bridge용
 */

export async function searchPreviewTab(tab, limit = 20) {
  const res = await fetch('/api/search/search.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tab, filters: {}, page: 1, limit }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}
