/**
 * 확대카드가 열릴 때 홍보 채널만 가져온다.
 * 검색 목록 응답에는 이 주소를 넣지 않는다.
 */

const CARD_PROMO_FIELDS = [
  'youtube_url',
  'youtube_url_2',
  'youtube_url_3',
  'youtube_url_4',
  'blog_url_1',
  'blog_title_1',
  'blog_url_2',
  'blog_title_2',
  'instagram_url',
  'tiktok_url',
  'naver_clip_url',
];

/**
 * @param {'study_room'|'tutor'} kind
 * @param {number|string} id
 * @returns {Promise<Record<string, string>|null>}
 */
export async function loadPromoChannelForCard(kind, id) {
  const n = Number(id);
  if ((kind !== 'study_room' && kind !== 'tutor') || !Number.isFinite(n) || n <= 0) return null;
  try {
    const res = await fetch(
      `/api/promo-channel.php?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(String(n))}`,
      { method: 'GET', credentials: 'same-origin', headers: { Accept: 'application/json' } },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false || !data.item) return null;
    /** @type {Record<string, string>} */
    const out = {};
    for (const key of CARD_PROMO_FIELDS) out[key] = String(data.item[key] || '');
    return out;
  } catch {
    return null;
  }
}
