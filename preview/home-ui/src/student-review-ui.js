/**
 * 25장 — 학생 검색·리스트 액션 (찜 · 쪽지 준비/보내기)
 */

import { getNavRole } from './state.js';
import { WISH_LABELS } from './handoff-copy.js';
import { notifyStudentReviewToggle } from './handoff-utils.js';
import { toggleStudentReview, isInStudentReview } from './student-review-store.js';
import { startFirstMemoFlow } from './messages/compose-flow.js';
import { checkFirstMemoPermission } from './messages/permissions.js';
import { showPaidGateOverlay } from './messages/overlays.js';
import { PAID_GATE_MESSAGE } from './student-visibility.js';
import { getProviderRegDeepLink } from './handoff-link.js';

/**
 * @param {object} item
 * @param {{ guest?: boolean, viewerRole?: string, itemId?: number, sourceRoute?: string }} opts
 */
export function renderStudentProviderActions(item, opts = {}) {
  const { guest = false, viewerRole = 'guest', sourceRoute = 'search' } = opts;
  const itemId = item?.id ?? opts.itemId;
  const wished = !guest && itemId != null && isInStudentReview(itemId);
  const memoCheck = guest
    ? { ok: false, reason: 'role' }
    : checkFirstMemoPermission({ kind: 'student', role: viewerRole });
  const memoReady = memoCheck.ok;
  const memoLabel = memoReady ? '쪽지 보내기' : '쪽지 준비';
  const memoTitle =
    memoCheck.reason === 'paid_gate'
      ? PAID_GATE_MESSAGE
      : memoCheck.reason === 'role'
        ? '로그인 필요'
        : '쪽지를 보내려면 준비가 필요합니다';

  if (guest) {
    return `
      <div class="item-actions item-actions--student" aria-label="학생 액션">
        <button type="button" class="btn btn--secondary btn--sm" data-action="login-gate" data-gate="wish" data-gate-label="찜하기">찜하기</button>
        <button type="button" class="btn btn--secondary btn--sm" data-action="login-gate" data-gate="memo" data-gate-label="쪽지">쪽지 준비</button>
      </div>`;
  }

  return `
    <div class="item-actions item-actions--student" aria-label="학생 액션">
      <button type="button" class="btn btn--secondary btn--sm${wished ? ' is-active' : ''}"
        data-action="student-wish-toggle" data-student-id="${itemId}" data-provider-role="${viewerRole}" data-source-route="${sourceRoute}">
        ${wished ? WISH_LABELS.remove : '찜하기'}
      </button>
      <button type="button" class="btn btn--primary btn--sm"
        data-action="student-memo-start" data-student-id="${itemId}" data-memo-ready="${memoReady ? '1' : '0'}"
        title="${memoTitle}">
        ${memoLabel}
      </button>
    </div>`;
}

/** 학부모·학생 피어 열람 — 상세만 (쪽지·찜 없음 · 29#3) */
export function renderStudentConsumerActions() {
  return `
    <div class="item-actions item-actions--student" aria-label="학생 액션">
      <span class="item-actions__note">비교 열람 · 상세에서 조건 확인</span>
    </div>`;
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
      const pr = btn.dataset.providerRole || providerRole;
      const added = toggleStudentReview(id, { providerRole: pr });
      notifyStudentReviewToggle(added, { sourceRoute });
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
        if (check.reason === 'paid_gate') {
          showPaidGateOverlay();
          return;
        }
        const deep = getProviderRegDeepLink(providerRole || role);
        if (deep?.href) {
          window.location.hash = deep.href;
          return;
        }
        window.location.hash = '/mypage/plans';
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
}
