/**
 * 25장 — compare toggle feedback · handoff notify · Source Route return CTA
 */

import { COMPARE_MAX } from './exposure-schema.js';
import {
  compareToastAdded,
  compareOpenCta,
  COMPARE_ERROR_INELIGIBLE,
  RETURN_CTA,
  STUDENT_REVIEW,
  WISH_TOAST,
} from './handoff-copy.js';
import { getCompareMaxCopy } from './empty-state-copy.js';
import { getCompareIds } from './user-actions-state.js';
import { showP24Toast } from './detail-decision/detail-utils.js';

/**
 * @param {string} sourceRoute
 * @param {'study_room'|'tutor'} kind
 * @param {number} count
 * @param {number} max
 * @returns {{ label: string, href?: string, action?: 'compare-open', kind?: 'study_room'|'tutor' } | null}
 */
export function resolveCompareReturnCta(sourceRoute, kind, count, max) {
  if (sourceRoute === 'detail' || sourceRoute === 'mypage') {
    return { label: compareOpenCta(count, max), action: 'compare-open', kind };
  }
  if (sourceRoute === 'wishlist') {
    return { label: RETURN_CTA.wishlist, href: '#/mypage/wishlist' };
  }
  return null;
}

/**
 * @param {string} sourceRoute
 * @param {boolean} added
 * @returns {{ label: string, href: string } | null}
 */
export function resolveStudentReviewReturnCta(sourceRoute, added) {
  if (!added) return null;
  if (sourceRoute === 'mypage' || sourceRoute === 'student-review') return null;
  return { label: RETURN_CTA.studentReview, href: '#/mypage/student-review' };
}

/**
 * @param {string} sourceRoute
 * @param {boolean} added
 * @returns {{ label: string, href: string } | null}
 */
export function resolveWishReturnCta(sourceRoute, added) {
  if (!added) return null;
  if (sourceRoute === 'wishlist' || sourceRoute === 'mypage') return null;
  return { label: RETURN_CTA.wishlist, href: '#/mypage/wishlist' };
}

/**
 * @param {{ inCompare?: boolean, full?: boolean, ineligible?: boolean }} result
 * @param {'study_room'|'tutor'} kind
 * @param {{ sourceRoute?: string }} [opts]
 * @returns {boolean} handled (caller may skip rerender on false alert)
 */
export function notifyCompareToggle(result, kind, opts = {}) {
  const sourceRoute = opts.sourceRoute || 'search';
  if (result.full) {
    const copy = getCompareMaxCopy(COMPARE_MAX);
    const cta = resolveCompareReturnCta(sourceRoute, kind, COMPARE_MAX, COMPARE_MAX);
    showP24Toast(`${copy.title} ${copy.body}`, cta ? { cta } : undefined);
    return false;
  }
  if (result.ineligible) {
    alert(COMPARE_ERROR_INELIGIBLE);
    return false;
  }
  if (result.inCompare) {
    const count = getCompareIds(kind).length;
    const cta = resolveCompareReturnCta(sourceRoute, kind, count, COMPARE_MAX);
    showP24Toast(compareToastAdded(count, COMPARE_MAX), cta ? { cta } : undefined);
    return true;
  }
  return true;
}

/**
 * @param {boolean} added
 * @param {{ sourceRoute?: string }} [opts]
 */
export function notifyStudentReviewToggle(added, opts = {}) {
  const sourceRoute = opts.sourceRoute || 'search';
  const message = added ? STUDENT_REVIEW.toastAdded : STUDENT_REVIEW.toastRemoved;
  const cta = resolveStudentReviewReturnCta(sourceRoute, added);
  showP24Toast(message, cta ? { cta } : undefined);
}

/**
 * @param {boolean} added
 * @param {{ sourceRoute?: string }} [opts]
 */
export function notifyWishToggle(added, opts = {}) {
  const sourceRoute = opts.sourceRoute || 'search';
  const message = added ? WISH_TOAST.added : WISH_TOAST.removed;
  const cta = resolveWishReturnCta(sourceRoute, added);
  showP24Toast(message, cta ? { cta } : undefined);
}
