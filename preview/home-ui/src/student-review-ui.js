/**
 * 25장 — 학생 검색·리스트 액션 (찜 · 쪽지 · 검토함)
 */

import { getNavRole } from './state.js';
import { WISH_LABELS, STUDENT_REVIEW } from './handoff-copy.js';
import { notifyStudentReviewToggle, notifyWishToggle } from './handoff-utils.js';
import { toggleStudentReview, isInStudentReview } from './student-review-store.js';
import { isStudentWishlisted, toggleStudentWishlist } from './student-wishlist-state.js';
import { startFirstMemoFlow } from './messages/compose-flow.js';
import { checkFirstMemoPermission } from './messages/permissions.js';
import { showPaidGateOverlay } from './messages/overlays.js';
import { PAID_GATE_MESSAGE } from './student-visibility.js';

/**
 * @param {object} item
 * @param {{ guest?: boolean, viewerRole?: string, itemId?: number, sourceRoute?: string }} opts
 */
export function renderStudentProviderActions(item, opts = {}) {
  const { guest = false, viewerRole = 'guest', sourceRoute = 'search' } = opts;
  const itemId = item?.id ?? opts.itemId;
  const inReview = !guest && itemId != null && isInStudentReview(itemId);
  const wished = !guest && itemId != null && isStudentWishlisted(itemId);
  const memoCheck = guest
    ? { ok: false, reason: 'role' }
    : checkFirstMemoPermission({ kind: 'student', role: viewerRole });
  const memoDisabled = !memoCheck.ok;
  const memoTitle =
    memoCheck.reason === 'paid_gate' ? PAID_GATE_MESSAGE : memoCheck.reason === 'role' ? '로그인 필요' : '';

  if (guest) {
    return `
      <div class="item-actions item-actions--student" aria-label="학생 액션">
        <button type="button" class="btn btn--secondary btn--sm" data-action="login-gate" data-gate="wish" data-gate-label="찜">찜</button>
        <button type="button" class="btn btn--secondary btn--sm" data-action="login-gate" data-gate="memo" data-gate-label="쪽지">쪽지 보내기</button>
      </div>`;
  }

  const reviewLabel = inReview ? STUDENT_REVIEW.removeCta : STUDENT_REVIEW.addCta;
  return `
    <div class="item-actions item-actions--student" aria-label="학생 액션">
      <button type="button" class="btn btn--secondary btn--sm${wished ? ' is-active' : ''}"
        data-action="student-wish-toggle" data-student-id="${itemId}" data-source-route="${sourceRoute}">
        ${wished ? WISH_LABELS.remove : WISH_LABELS.add}
      </button>
      <button type="button" class="btn btn--primary btn--sm"
        data-action="student-memo-start" data-student-id="${itemId}"
        ${memoDisabled ? `disabled title="${memoTitle}"` : ''}>
        쪽지 보내기
      </button>
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
 * @param {{ providerRole?: 'tutor'|'study_room'|'parent'|'guest', sourceRoute?: string, getStudentItem?: (id: number) => object|undefined }} [opts]
 */
export function bindStudentReviewEvents(root, rerender, opts = {}) {
  const role = opts.providerRole || getNavRole();
  const providerRole = role === 'tutor' || role === 'study_room' ? role : undefined;
  const sourceRoute = opts.sourceRoute || 'search';
  const resolveItem = opts.getStudentItem || (() => undefined);

  root.querySelectorAll('[data-action="student-wish-toggle"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.studentId;
      const added = toggleStudentWishlist(id);
      notifyWishToggle(added, { sourceRoute });
      rerender?.();
    });
  });

  root.querySelectorAll('[data-action="student-memo-start"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = Number(btn.dataset.studentId);
      const item = resolveItem(id);
      const check = checkFirstMemoPermission({ kind: 'student', role: providerRole || role });
      if (!check.ok) {
        if (check.reason === 'paid_gate') showPaidGateOverlay();
        return;
      }
      if (!item) return;
      startFirstMemoFlow({
        kind: 'student',
        targetId: id,
        targetName: item.public_display_name || '학습 요청',
        student: item,
        structuredLine: `${item.grade_level || '—'} · ${item.subject_label || '—'} · ${item.location_label || '—'}`,
      });
    });
  });

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
