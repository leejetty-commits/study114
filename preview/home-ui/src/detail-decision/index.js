import { EXPOSURE_STUDY_ROOMS, EXPOSURE_TUTORS, EXPOSURE_STUDENTS } from '../exposure-data.js';
import { getNavRole, previewState } from '../state.js';
import { bindStudentReviewEvents } from '../student-review-ui.js';
import { openDetailModal, closeDetailModal } from './detail-shell.js';

export { closeDetailModal, openDetailModal } from './detail-shell.js';
export { showP24Toast } from './detail-utils.js';

/** @param {'study_room'|'tutor'|'student'} kind @param {number} id */
export function resolveDetailItem(kind, id) {
  const pool =
    kind === 'student'
      ? EXPOSURE_STUDENTS
      : kind === 'tutor'
        ? EXPOSURE_TUTORS
        : EXPOSURE_STUDY_ROOMS;
  return pool.find((x) => x.id === id) || null;
}

/**
 * @param {{ kind: 'study_room'|'tutor'|'student', id: number, viewer?: string, onRerender?: () => void, sourceRoute?: string, item?: object }} opts
 */
export function openDetailDecision({ kind, id, viewer, onRerender, sourceRoute = 'search', item: itemOverride }) {
  const item = itemOverride || resolveDetailItem(kind, id);
  if (!item) return;
  openDetailModal({
    kind,
    item,
    viewer: viewer || getNavRole(),
    onRerender,
    sourceRoute,
  });
}

/** @param {HTMLElement} root @param {{ onRerender?: () => void, viewer?: string, getStudentItem?: (id: number) => object|undefined, sourceRoute?: string }} [opts] */
export function bindDetailDecisionEvents(root, { onRerender, viewer, getStudentItem, sourceRoute = 'search' } = {}) {
  const role = viewer || getNavRole();
  bindStudentReviewEvents(root, onRerender, {
    providerRole: role,
    sourceRoute,
    getStudentItem,
  });

  root.querySelectorAll('[data-action="open-student-detail"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (
        e.target.closest(
          'button, a, [data-action="compare-toggle"], [data-action="wish-toggle"], [data-action="student-review-toggle"], [data-action="student-wish-toggle"], [data-action="student-memo-start"]',
        )
      ) {
        return;
      }
      const id = Number(el.dataset.studentId);
      const item = getStudentItem?.(id) || resolveDetailItem('student', id);
      openDetailDecision({ kind: 'student', id, viewer: role, onRerender, sourceRoute, item: item || undefined });
    });
  });

  root.querySelectorAll('[data-provider-id][data-provider-kind]').forEach((article) => {
    article.classList.add('p24-card--clickable');
    article.addEventListener('click', (e) => {
      if (e.target.closest('button, a, [data-action]')) return;
      const kind = article.dataset.providerKind;
      const id = Number(article.dataset.providerId);
      if (kind !== 'study_room' && kind !== 'tutor') return;
      openDetailDecision({ kind, id, viewer: role, onRerender, sourceRoute });
    });
  });

  root.querySelectorAll('[data-provider-subscription]').forEach((el) => {
    el.addEventListener('click', () => {
      previewState.providerSubscription = el.dataset.providerSubscription;
      onRerender?.();
    });
  });
}

/** @deprecated student-detail-modal.js 호환 */
export function bindStudentDetailEvents(root, opts = {}) {
  return bindDetailDecisionEvents(root, opts);
}
