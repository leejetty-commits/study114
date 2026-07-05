/**
 * 25장 P25-S10 — 학생 검토함 UI · 이벤트
 */

import { getNavRole } from './state.js';
import { STUDENT_REVIEW } from './handoff-copy.js';
import { notifyStudentReviewToggle } from './handoff-utils.js';
import { toggleStudentReview, isInStudentReview } from './student-review-store.js';

/**
 * @param {object} item
 * @param {{ guest?: boolean, viewerRole?: string, itemId?: number }} opts
 */
export function renderStudentProviderActions(item, opts = {}) {
  const { guest = false, viewerRole = 'guest' } = opts;
  const itemId = item?.id ?? opts.itemId;
  const inReview = !guest && itemId != null && isInStudentReview(itemId);

  if (guest) {
    return `
      <div class="item-actions" aria-label="학생 액션">
        <button type="button" class="btn btn--secondary btn--sm" data-action="login-gate" data-gate="review" data-gate-label="검토함">검토함</button>
      </div>`;
  }

  const reviewLabel = inReview ? STUDENT_REVIEW.removeCta : STUDENT_REVIEW.addCta;
  return `
    <div class="item-actions" aria-label="학생 액션">
      <button type="button" class="btn btn--secondary btn--sm${inReview ? ' is-active' : ''}"
        data-action="student-review-toggle" data-student-id="${itemId}" data-provider-role="${viewerRole}">
        ${reviewLabel}
      </button>
    </div>`;
}

/** 학부모·비회원 — 찜·비교 미렌더 (25§4-2) */
export function renderStudentConsumerActions() {
  return `<div class="item-actions item-actions--student" aria-label="학생 액션"></div>`;
}

/**
 * @param {HTMLElement} root
 * @param {() => void} [rerender]
 * @param {{ providerRole?: 'tutor'|'study_room'|'parent'|'guest', sourceRoute?: string }} [opts]
 */
export function bindStudentReviewEvents(root, rerender, opts = {}) {
  const role = opts.providerRole || getNavRole();
  const providerRole = role === 'tutor' || role === 'study_room' ? role : undefined;
  const sourceRoute = opts.sourceRoute || 'search';

  root.querySelectorAll('[data-action="student-review-toggle"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.studentId;
      const pr = btn.dataset.providerRole || providerRole;
      const added = toggleStudentReview(id, { providerRole: pr });
      notifyStudentReviewToggle(added, { sourceRoute });
      rerender?.();
    });
  });
}
