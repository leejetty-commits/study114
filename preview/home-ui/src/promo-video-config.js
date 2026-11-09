/** 우측 레일 홍보영상. id는 11자 유튜브 ID만. 비어 있으면 슬롯을 그리지 않는다. */
export const PROMO_LOCKUP_SRC = '/assets/brand/logo-lockup-pin-wordmark.png';

export const PROMO_VIDEOS = {
  study_room: { id: 'op-Cudsweew', title: "'우동공과' 공부방이 뭐에요?" },
  tutor: { id: '', title: '과외쌤 홍보영상' },
};

/** @param {unknown} id */
export function isValidYoutubeId(id) {
  return /^[A-Za-z0-9_-]{11}$/.test(String(id ?? ''));
}

/**
 * UI용 제목 HTML. `'우동공과' …` 형태면 잠금 이미지 + 뒤 문구(공부방 볼드).
 * iframe title·aria용 원문 title 값은 호출측에서 그대로 둔다.
 * @param {string} title
 * @param {(s: string) => string} escHtml
 */
export function renderPromoTitleHtml(title, escHtml) {
  const raw = String(title ?? '');
  const m = raw.match(/^'우동공과'\s*(.*)$/u);
  if (!m) return escHtml(raw);
  const rest = m[1] || '';
  const restHtml = rest.startsWith('공부방')
    ? `<strong class="live-rail-promo-video__title-em">공부방</strong>${escHtml(rest.slice('공부방'.length))}`
    : escHtml(rest);
  return `'<img class="live-rail-promo-video__title-lockup" src="${PROMO_LOCKUP_SRC}" alt="우동공과" decoding="async">'\u00a0${restHtml}`;
}
