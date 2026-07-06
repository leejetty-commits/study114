/**
 * 외부 홍보 링크 — youtube / facebook / instagram (상세등록)
 * 1차: URL 저장·단순 노출만 (임베드·통계 없음)
 */

/** @param {string} raw */
export function normalizePromoUrl(raw) {
  return String(raw ?? '').trim();
}

/** @param {string} url */
export function isValidPromoUrl(url) {
  const s = normalizePromoUrl(url);
  if (!s) return true;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * @param {{ youtube_url?: string, facebook_url?: string, instagram_url?: string }} urls
 * @returns {string|null} error message
 */
export function validatePromoUrls(urls) {
  const checks = [
    ['유튜브', urls.youtube_url],
    ['페이스북', urls.facebook_url],
    ['인스타그램', urls.instagram_url],
  ];
  for (const [label, val] of checks) {
    if (!isValidPromoUrl(val)) {
      return `${label} 링크 URL 형식이 올바르지 않습니다. (http/https)`;
    }
  }
  return null;
}

/** @param {string} url */
export function extractYoutubeVideoId(url) {
  const s = normalizePromoUrl(url);
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id || null;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/').filter(Boolean);
      const embedIdx = parts.indexOf('embed');
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
      const shortsIdx = parts.indexOf('shorts');
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * @param {{ youtube_url?: string, facebook_url?: string, instagram_url?: string }} item
 * @param {(s: string) => string} esc
 */
export function renderPromoLinksSection(item, esc) {
  const youtube = normalizePromoUrl(item.youtube_url);
  const facebook = normalizePromoUrl(item.facebook_url);
  const instagram = normalizePromoUrl(item.instagram_url);
  if (!youtube && !facebook && !instagram) return '';

  const ytId = extractYoutubeVideoId(youtube);
  const ytBlock = youtube
    ? `<div class="p24-promo__item">
        ${ytId ? `<a class="p24-promo__thumb" href="${esc(youtube)}" target="_blank" rel="noopener noreferrer"><img src="https://img.youtube.com/vi/${esc(ytId)}/mqdefault.jpg" alt="YouTube" width="160" height="90" loading="lazy" /></a>` : ''}
        <a class="btn btn--secondary btn--sm" href="${esc(youtube)}" target="_blank" rel="noopener noreferrer">유튜브 보기</a>
      </div>`
    : '';

  const fbBlock = facebook
    ? `<div class="p24-promo__item"><a class="btn btn--secondary btn--sm" href="${esc(facebook)}" target="_blank" rel="noopener noreferrer">페이스북</a></div>`
    : '';

  const igBlock = instagram
    ? `<div class="p24-promo__item"><a class="btn btn--secondary btn--sm" href="${esc(instagram)}" target="_blank" rel="noopener noreferrer">인스타그램</a></div>`
    : '';

  return `
    <section class="p24-section p24-promo">
      <h3 class="p24-section__title">외부 홍보 링크</h3>
      <div class="p24-promo__grid">${ytBlock}${fbBlock}${igBlock}</div>
    </section>`;
}
