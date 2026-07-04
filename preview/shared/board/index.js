/**
 * 게시판 공통 모듈 — 프리뷰용
 * 후순위: admin CRUD + /api/board/{boardKey}/posts 연동
 */

/** @typedef {'notice'|'faq'|'safe-guide'} BoardKey */

/**
 * @typedef {object} BoardPost
 * @property {string} id
 * @property {string} title
 * @property {string} [date]
 * @property {string} [meta]
 * @property {string} [badge]
 * @property {string | string[]} body
 */

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function mdLite(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function renderBody(body) {
  const lines = Array.isArray(body) ? body : [body];
  return lines.map((p) => `<p>${mdLite(p)}</p>`).join('');
}

/**
 * FAQ — 여러 항목 동시 펼침 (details)
 * @param {BoardPost[]} posts
 */
export function renderFaqBoard(posts) {
  const rows = posts.map(
    (post, i) =>
      `<details class="sup-board-row sup-board-row--faq" data-board-item="${esc(post.id)}">
         <summary class="sup-board-row__main">
           <span class="sup-board-row__num">${String(i + 1).padStart(2, '0')}</span>
           <span class="sup-board-row__title">${esc(post.title)}</span>
           <span class="sup-board-row__chev" aria-hidden="true"></span>
         </summary>
         <div class="sup-board-row__body">${renderBody(post.body)}</div>
       </details>`,
  ).join('');
  return `<div class="sup-board sup-board--faq" data-board="faq">${rows}</div>`;
}

/**
 * 공지·가이드 — 단일 펼침 아코디언
 * @param {BoardPost[]} posts
 * @param {{ variant: 'notice'|'guide', openId?: string | null }} opts
 */
export function renderSingleOpenBoard(posts, { variant, openId = null }) {
  const rows = posts.map((post, i) => {
    const isOpen = openId === post.id;
    const num = posts.length - i;
    if (variant === 'notice') {
      return `
      <div class="sup-accordion__item sup-board-accordion__item${isOpen ? ' is-open' : ''}" data-board-item="${esc(post.id)}">
        <button type="button" class="sup-accordion__head sup-board-accordion__head sup-board-accordion__head--notice" aria-expanded="${isOpen ? 'true' : 'false'}">
          <span class="sup-board-row__num">${num}</span>
          <time class="sup-board-row__date">${esc(post.date || '')}</time>
          <span class="sup-accordion__title">${esc(post.title)}</span>
          <span class="sup-accordion__chev" aria-hidden="true"></span>
        </button>
        <div class="sup-accordion__panel"${isOpen ? '' : ' hidden'}>
          <div class="sup-accordion__content">${renderBody(post.body)}</div>
        </div>
      </div>`;
    }
    return `
      <div class="sup-accordion__item sup-board-accordion__item${isOpen ? ' is-open' : ''}" data-board-item="${esc(post.id)}">
        <button type="button" class="sup-accordion__head sup-board-accordion__head" aria-expanded="${isOpen ? 'true' : 'false'}">
          ${post.badge ? `<span class="sup-guide-row__badge">${esc(post.badge)}</span>` : ''}
          <span class="sup-accordion__title">${esc(post.title)}</span>
          ${post.meta ? `<span class="sup-guide-row__meta">${esc(post.meta)}</span>` : ''}
          <span class="sup-accordion__chev" aria-hidden="true"></span>
        </button>
        <div class="sup-accordion__panel"${isOpen ? '' : ' hidden'}>
          <div class="sup-accordion__content">${renderBody(post.body)}</div>
        </div>
      </div>`;
  }).join('');

  const head =
    variant === 'notice'
      ? `<div class="sup-board__head sup-board__head--notice" aria-hidden="true">
           <span>번호</span><span>날짜</span><span>제목</span>
         </div>`
      : '';

  return `
    <div class="sup-board sup-board--${variant}" data-board="${variant}">
      ${head}
      <div class="sup-accordion sup-board-accordion" data-board-accordion="${variant}">${rows}</div>
    </div>`;
}

/**
 * @param {HTMLElement} root
 * @param {{ onOpen?: (id: string | null) => void }} [opts]
 */
export function bindSingleOpenBoard(root, opts = {}) {
  root.querySelectorAll('[data-board-accordion]').forEach((group) => {
    group.querySelectorAll('.sup-board-accordion__head').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('[data-board-item]');
        const id = item?.getAttribute('data-board-item');
        if (!item || !id) return;

        const wasOpen = item.classList.contains('is-open');
        group.querySelectorAll('[data-board-item]').forEach((el) => {
          el.classList.remove('is-open');
          el.querySelector('.sup-board-accordion__head')?.setAttribute('aria-expanded', 'false');
          const panel = el.querySelector('.sup-accordion__panel');
          if (panel) panel.hidden = true;
        });

        if (!wasOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
          const panel = item.querySelector('.sup-accordion__panel');
          if (panel) panel.hidden = false;
          opts.onOpen?.(id);
          requestAnimationFrame(() => item.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
        } else {
          opts.onOpen?.(null);
        }
      });
    });
  });
}

export const BOARD_KEYS = {
  NOTICE: 'notice',
  FAQ: 'faq',
  SAFE_GUIDE: 'safe-guide',
};
