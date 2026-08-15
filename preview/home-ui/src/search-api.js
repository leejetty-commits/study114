/**
 * 13장 검색 API — home-ui exposure bridge용
 */

export async function searchPreviewTab(tab, limit = 20, sort = 'latest', page = 1) {
  const res = await fetch('/api/search/search.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tab, filters: {}, page, limit, sort }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

/**
 * 카드 추천(엄지) 토글 — DB recommend_count 실반영
 * @param {'study_room'|'tutor'} targetType
 * @param {number} targetId
 */
export async function toggleRecommendation(targetType, targetId) {
  const res = await fetch('/api/handoff/recommendations.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ target_type: targetType, target_id: targetId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}
