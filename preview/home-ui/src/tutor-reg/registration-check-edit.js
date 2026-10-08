/**
 * 과외쌤 등록점검 — 접기/펼치기
 */

import { TRC_COPY } from './registration-check-copy.js';

/** @param {HTMLElement} root */
export function bindTutorRegistrationCheckEvents(root) {
  const page = root.querySelector('[data-trc-page]');
  if (!page) return;

  page.querySelectorAll('[data-trc-fold]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = btn.closest('[data-rc-section]');
      if (!section) return;
      const body = section.querySelector('.rc-section__body');
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      btn.textContent = expanded ? TRC_COPY.board.foldOpen : TRC_COPY.board.foldClose;
      if (body) body.hidden = expanded;
      section.classList.toggle('is-collapsed', expanded);
    });
  });
}
