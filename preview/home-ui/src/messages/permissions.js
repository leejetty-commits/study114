/**
 * 16장 §1-2 · §8 · 13장 §8 권한
 * @typedef {'parent'|'study_room'|'tutor'|'guest'} NavRole
 * @typedef {'student'|'study_room'|'tutor'} MemoTargetKind
 */

import { previewState } from '../state.js';
import { isMessagesApiMode } from '../messages-backend.js';
import { canColdMemoFromEntitlement, getMemoTicketsRemaining } from '../provider-entitlement.js';
export {
  GATE_COPY,
  FREE_PROVIDER_INBOX_COPY,
  getScopeBadge,
  getReplyBlockedMessage,
} from './messages-copy.js';

export function isProviderRole(role) {
  return role === 'study_room' || role === 'tutor' || role === 'admin';
}

export function isProviderPaid() {
  if (isMessagesApiMode()) {
    const can = canColdMemoFromEntitlement();
    if (can !== null) return can;
    return getMemoTicketsRemaining() > 0;
  }
  return previewState.providerSubscription === 'paid';
}
/** @param {NavRole | 'admin'} role */
export function canProviderColdMemoToStudent(role) {
  if (role === 'admin') return true;
  return (role === 'study_room' || role === 'tutor') && isProviderPaid();
}

/** @deprecated alias */
export function canProviderMemoToStudent(role) {
  return canProviderColdMemoToStudent(role);
}

/** @param {NavRole} role */
export function canGuardianMemoToProvider(role) {
  return role === 'parent';
}

/**
 * 공급자→학생 **콜드** 첫 메모 여부 (16§1-2)
 * @param {MemoTargetKind} kind
 * @param {NavRole} role
 */
export function isColdOutreach(kind, role) {
  return kind === 'student' && isProviderRole(role);
}

/**
 * P16-03 첫 메모 — 콜드만 paid_gate
 * @param {{ kind: MemoTargetKind, role: NavRole }} ctx
 * @returns {{ ok: true } | { ok: false, reason: 'paid_gate'|'role'|'unknown' }}
 */
export function checkFirstMemoPermission(ctx) {
  const { kind, role } = ctx;
  if (isColdOutreach(kind, role)) {
    if (!isProviderPaid()) return { ok: false, reason: 'paid_gate' };
    return { ok: true };
  }
  if (kind === 'study_room' || kind === 'tutor') {
    if (!canGuardianMemoToProvider(role)) return { ok: false, reason: 'role' };
    return { ok: true };
  }
  return { ok: false, reason: 'unknown' };
}

/**
 * P16-02 thread 답장 — 학부모가 먼저 보낸 쪽지 thread는 free
 * @param {{ contextKind: MemoTargetKind, messages: { sender: 'me'|'peer' }[], initiatedByMe?: boolean } | null} thread
 * @param {NavRole} role
 */
export function canReplyInThread(thread, role) {
  if (!thread) return false;
  if (thread.isBlocked) return false;
  if (role === 'parent') {
    return thread.contextKind === 'study_room' || thread.contextKind === 'tutor';
  }
  if (!isProviderRole(role)) return false;
  if (thread.contextKind === 'study_room' || thread.contextKind === 'tutor') {
    return true;
  }
  if (thread.contextKind === 'student') {
    const peerSpoke = thread.messages.some((m) => m.sender === 'peer');
    if (peerSpoke) return true;
    return isProviderPaid();
  }
  return false;
}
