/**
 * 16장 §6 첫 메모 진입 — student detail · 검색 등
 * @typedef {'student'|'study_room'|'tutor'} MemoTargetKind
 */

import { threadPath } from './router.js';
import { getNavRole, navigate, previewState } from '../state.js';
import { checkFirstMemoPermission, getScopeBadge } from './permissions.js';
import { showPaidGateOverlay, showComposeModal } from './overlays.js';
import { getStudentProtectedVisibility } from '../student-visibility.js';

/**
 * @param {object} opts
 * @param {MemoTargetKind} opts.kind
 * @param {number|string} opts.targetId
 * @param {string} opts.targetName
 * @param {string} [opts.contextLabel]
 * @param {string} [opts.structuredLine]
 * @param {object} [opts.student] student row for visibility
 */
export function startFirstMemoFlow(opts) {
  const role = getNavRole();
  const check = checkFirstMemoPermission({ kind: opts.kind, role });
  if (!check.ok) {
    if (check.reason === 'paid_gate') {
      showPaidGateOverlay();
      return;
    }
    alert('[16장] 이 역할·대상 조합에서는 메모를 보낼 수 없습니다.');
    return;
  }

  let showRequest = false;
  let requestSummary;
  let structuredLine = opts.structuredLine || '—';

  if (opts.kind === 'student' && opts.student) {
    const vis = getStudentProtectedVisibility(opts.student, previewState.providerSubscription);
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
    contextLabel: opts.contextLabel || (opts.kind === 'student' ? '학생 의뢰' : '상세'),
    scopeBadge: badge.label,
    scopeHint: badge.hint,
    showRequestInPanel: showRequest,
    requestSummary,
    structuredLine,
    onSent: (threadId) => navigate(threadPath(threadId)),
  });
}

export { showPaidGateOverlay, showComposeModal };
