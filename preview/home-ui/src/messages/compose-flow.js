/**
 * 16장 §6 첫 메모 진입 — student detail · 검색 등
 * @typedef {'student'|'study_room'|'tutor'} MemoTargetKind
 */

import { threadPath } from './router.js';
import { getNavRole, navigate, previewState } from '../state.js';
import { checkFirstMemoPermission, getScopeBadge } from './permissions.js';
import { ADMIN_STUDENT_MEMO_BLOCKED_COPY, MEMO_TARGET_BLOCKED_COPY, resolveMemoRole } from './messages-copy.js';
import { showPaidGateOverlay, showComposeModal } from './overlays.js';
import { getStudentProtectedVisibility } from '../student-visibility.js';

/**
 * 첫 쪽지 불가 안내
 * @param {MemoTargetKind} kind
 * @param {string} role
 */
export function memoBlockedMessage(kind, role) {
  return role === 'admin' && kind === 'student' ? ADMIN_STUDENT_MEMO_BLOCKED_COPY : MEMO_TARGET_BLOCKED_COPY;
}

/**
 * @param {object} opts
 * @param {MemoTargetKind} opts.kind
 * @param {number|string} opts.targetId
 * @param {string} opts.targetName
 * @param {string} [opts.contextLabel]
 * @param {string} [opts.structuredLine]
 * @param {(threadId: number) => void} [opts.onSent] 전송 성공 직후(쪽지함 이동 전)
 */
export function startFirstMemoFlow(opts) {
  const role = resolveMemoRole(getNavRole());
  const check = checkFirstMemoPermission({ kind: opts.kind, role });
  if (!check.ok) {
    if (check.reason === 'paid_gate') {
      showPaidGateOverlay();
      return;
    }
    alert(memoBlockedMessage(opts.kind, role));
    return;
  }

  let showRequest = false;
  let requestSummary;
  let structuredLine = opts.structuredLine || '—';

  if (opts.kind === 'student' && opts.student) {
    const vis = getStudentProtectedVisibility(opts.student);
    showRequest = vis.requestSummary;
    requestSummary = showRequest ? opts.student.request_summary : undefined;
    structuredLine =
      opts.structuredLine ||
      `${opts.student.grade_level || '—'} · ${opts.student.preferred_subject || '수학'} · 대치동`;
  }

  const badge = getScopeBadge({
    role,
    contextKind: opts.kind,
    paidOnlyVisible: showRequest,
  });

  showComposeModal({
    kind: opts.kind,
    targetId: opts.targetId,
    targetName: opts.targetName,
    contextLabel: opts.contextLabel || (opts.kind === 'student' ? '등록' : '상세'),
    scopeBadge: badge.label,
    scopeHint: badge.hint,
    showRequestInPanel: showRequest,
    requestSummary,
    structuredLine,
    onSent: (threadId) => {
      opts.onSent?.(threadId);
      navigate(threadPath(threadId));
    },
  });
}

export { showPaidGateOverlay, showComposeModal };
