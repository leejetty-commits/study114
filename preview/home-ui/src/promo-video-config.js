/** 우측 레일 홍보영상. id는 11자 유튜브 ID만. 비어 있으면 슬롯을 그리지 않는다. */
export const PROMO_SYMBOL_SRC = '/assets/brand/src/udong-pin.png';
export const PROMO_WORDMARK_SRC = '/assets/brand/logo-wordmark.png';

export const PROMO_VIDEOS = {
  study_room: { id: 'op-Cudsweew', title: '우동공과 공부방이 뭐에요?' },
  tutor: { id: '', title: '과외쌤 홍보영상' },
};

/** @param {unknown} id */
export function isValidYoutubeId(id) {
  return /^[A-Za-z0-9_-]{11}$/.test(String(id ?? ''));
}

/**
 * UI용 제목 HTML. `우동공과 …` 형태면 심벌+워드마크 + 뒤 문구(공부방 볼드).
 * iframe title·aria용 원문 title 값은 호출측에서 그대로 둔다.
 * @param {string} title
 * @param {(s: string) => string} escHtml
 */
export function renderPromoTitleHtml(title, escHtml) {
  const raw = String(title ?? '');
  const brand = '우동공과';
  if (!raw.startsWith(brand)) return escHtml(raw);
  const rest = raw.slice(brand.length).replace(/^\s+/, '');
  const restHtml = rest.startsWith('공부방')
    ? `<strong class="live-rail-promo-video__title-em">공부방</strong>${escHtml(rest.slice('공부방'.length))}`
    : escHtml(rest);
  return `<span class="live-rail-promo-video__title-brand"><img class="live-rail-promo-video__title-symbol" src="${PROMO_SYMBOL_SRC}" alt="" decoding="async"><img class="live-rail-promo-video__title-wordmark" src="${PROMO_WORDMARK_SRC}" alt="우동공과" decoding="async"></span>\u00a0${restHtml}`;
}
