/** 마이페이지 「내 공지」 카드 — listNoticesForHome() 기준. 클릭 시 팝업(페이지 이동 없음). */

import { listNoticesForHome, noticeTargetLabel } from '../support/notice-store.js';
import { openNoticePopup, bindNoticeGo } from '../support/notice-popup.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const NOTICE_BOARD_FALLBACK = '#/support/notice';

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
      return `<a class="mypage-notice__row" href="${NOTICE_BOARD_FALLBACK}" data-nav="/support/notice" data-mypage-notice-open="${esc(n.id)}">
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
        <a class="mypage-notice__more" href="${NOTICE_BOARD_FALLBACK}" data-nav="/support/notice" data-mypage-notice-more>더 보기</a>
      </div>
      ${rows}
    </section>`;
}

/** @param {HTMLElement} root */
export function bindMypageNoticeStrip(root) {
  const strip = root.querySelector('.mypage-notice');
  if (!strip) return;
  bindNoticeGo();
  strip.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;
    const item = target.closest('[data-mypage-notice-open]');
    if (item) {
      e.preventDefault();
      openNoticePopup({
        selectedId: item.getAttribute('data-mypage-notice-open') || '',
        opener: /** @type {HTMLElement} */ (item),
      });
      return;
    }
    const more = target.closest('[data-mypage-notice-more]');
    if (more) {
      e.preventDefault();
      openNoticePopup({ opener: /** @type {HTMLElement} */ (more) });
    }
  });
}
