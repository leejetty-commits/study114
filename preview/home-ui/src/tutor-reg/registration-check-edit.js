/**
 * 과외쌤 등록점검 — 확대카드 · accordion 수정 링크
 */

import { openDetailDecision } from '../detail-decision/index.js';
import { getTutor } from './store.js';
import { tutorToExposureRow } from './format.js';

/** @param {HTMLElement} root */
export function bindTutorRegistrationCheckEvents(root) {
  const page = root.querySelector('[data-trc-page]');
  if (!page) return;
  const tutorId = Number(page.getAttribute('data-trc-tutor-id'));

  const openExpand = () => {
    const tutor = getTutor(tutorId);
    if (!tutor) return;
    openDetailDecision({
      kind: 'tutor',
      id: tutorId,
      item: tutorToExposureRow(tutor),
      sourceRoute: 'registration-check',
    });
  };

  page.querySelectorAll('[data-trc-expand]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openExpand();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openExpand();
      }
    });
  });

  page.querySelectorAll('.rc-section--accordion .rc-section__edit').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
}
