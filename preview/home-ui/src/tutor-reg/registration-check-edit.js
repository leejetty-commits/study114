/**
 * 과외쌤 등록점검 — 확대카드 · 접기/펼치기
 */

import { openDetailDecision } from '../detail-decision/index.js';
import { TRC_COPY } from './registration-check-copy.js';
import { buildTutorSamplePreviewItem } from './registration-check-sample.js';

/** @param {HTMLElement} root */
export function bindTutorRegistrationCheckEvents(root) {
  const page = root.querySelector('[data-trc-page]');
  if (!page) return;

  page.querySelectorAll('[data-trc-expand]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const tier = el.getAttribute('data-trc-expand-tier') || 'prime';
      const item = buildTutorSamplePreviewItem(tier);
      openDetailDecision({
        kind: 'tutor',
        id: 0,
        item,
        sourceRoute: 'registration-check',
      });
    });
  });

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
