/**
 * 25장 2차 — 판단 스티커 · 문의 전 체크리스트
 */

import { DECISION_STICKER, PRE_CONTACT_CHECKLIST } from './handoff-copy.js';
import { isWishlisted, isInCompare } from './user-actions-state.js';
import { isInStudentReview } from './student-review-store.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/**
 * @param {'study_room'|'tutor'|'student'} kind
 * @param {number|string} id
 * @returns {Array<{ key: string, label: string }>}
 */
export function resolveDecisionStickers(kind, id) {
  const numId = Number(id);
  const stickers = [];

  if (kind === 'student') {
    if (isInStudentReview(numId)) stickers.push({ key: 'review', label: DECISION_STICKER.review });
    return stickers;
  }

  if (isWishlisted(kind, numId)) stickers.push({ key: 'wish', label: DECISION_STICKER.wish });
  if (isInCompare(kind, numId)) stickers.push({ key: 'compare', label: DECISION_STICKER.compare });
  return stickers;
}

/**
 * @param {'study_room'|'tutor'|'student'} kind
 * @param {number|string} id
 */
export function renderDecisionStickers(kind, id) {
  const stickers = resolveDecisionStickers(kind, id);
  if (!stickers.length) return '';
  return `<span class="handoff-stickers">${stickers
    .map((s) => `<span class="handoff-sticker handoff-sticker--${s.key}">${esc(s.label)}</span>`)
    .join('')}</span>`;
}

/**
 * @param {'study_room'|'tutor'|'student'} kind
 * @param {string} viewer
 * @param {boolean} contactDisabled
 */
export function renderPreContactChecklist(kind, viewer, contactDisabled) {
  if (contactDisabled || viewer === 'guest') return '';

  let key = null;
  if (kind === 'study_room' && viewer === 'parent') key = 'study_room_parent';
  else if (kind === 'tutor' && viewer === 'parent') key = 'tutor_parent';
  else if (kind === 'student' && viewer === 'tutor') key = 'student_tutor';
  else if (kind === 'student' && viewer === 'study_room') key = 'student_study_room';

  if (!key) return '';

  const items = PRE_CONTACT_CHECKLIST[key];
  if (!items?.length) return '';

  return `
    <section class="p24-section p24-section--pre-contact" aria-label="${esc(PRE_CONTACT_CHECKLIST.title)}">
      <h3 class="p24-section__title">${esc(PRE_CONTACT_CHECKLIST.title)}</h3>
      <ul class="p24-pre-contact">
        ${items.map((item) => `<li class="p24-pre-contact__item">${esc(item)}</li>`).join('')}
      </ul>
    </section>`;
}
