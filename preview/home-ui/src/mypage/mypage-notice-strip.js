/** 마이페이지 「내 공지」 카드 — listNoticesForHome() 기준 최대 3건 */

import { listNoticesForHome, noticeTargetLabel } from '../support/notice-store.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function isNewPost(dateStr) {
  if (!dateStr) return false;
  const posted = new Date(dateStr).getTime();
  if (Number.isNaN(posted)) return false;
  return Date.now() - posted < THREE_DAYS_MS;
}

/** @returns {string} 공지가 0건이면 빈 문자열 */
export function renderMypageNoticeStrip() {
  const notices = listNoticesForHome();
  if (!notices.length) return '';
  const rows = notices
    .map((n) => {
      const newTag = isNewPost(n.date)
        ? ' <span class="mypage-notice__new">새 글</span>'
        : '';
      return `<a class="mypage-notice__row" href="#/support/notice" data-nav="/support/notice">
        <span class="mypage-notice__badge">${esc(noticeTargetLabel(n))}</span>
        <span class="mypage-notice__title">${esc(n.title)}</span>${newTag}
        <time class="mypage-notice__date">${esc(n.date || '')}</time>
      </a>`;
    })
    .join('');
  return `
    <section class="mypage-notice" aria-label="내 공지">
      <div class="mypage-notice__head">
        <strong class="mypage-notice__label">내 공지</strong>
        <a class="mypage-notice__more" href="#/support/notice" data-nav="/support/notice">더 보기</a>
      </div>
      ${rows}
    </section>`;
}
