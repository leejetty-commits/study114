/**
 * 공개 공부방 상세 — `#/myshop/study-room/:id` cold open용
 */

/**
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function fetchPublicStudyRoom(id) {
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) return null;
  try {
    const res = await fetch(`/api/study-room/public.php?id=${encodeURIComponent(String(n))}`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false || !data.item) return null;
    return data.item;
  } catch {
    return null;
  }
}
