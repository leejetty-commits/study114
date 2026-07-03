/**
 * 16장 §8 · 13장 §8 권한
 * @typedef {'parent'|'study_room'|'tutor'|'guest'} NavRole
 * @typedef {'student'|'study_room'|'tutor'} MemoTargetKind
 */

import { previewState } from '../state.js';

export function isProviderRole(role) {
  return role === 'study_room' || role === 'tutor';
}

export function isProviderPaid() {
  return previewState.providerSubscription === 'paid';
}

/** @param {NavRole} role */
export function canProviderMemoToStudent(role) {
  return isProviderRole(role) && isProviderPaid();
}

/** @param {NavRole} role */
export function canGuardianMemoToProvider(role) {
  return role === 'parent';
}

/**
 * @param {{ kind: MemoTargetKind, role: NavRole }} ctx
 * @returns {{ ok: true } | { ok: false, reason: 'paid_gate'|'role'|'unknown' }}
 */
export function checkFirstMemoPermission(ctx) {
  const { kind, role } = ctx;
  if (kind === 'student') {
    if (!isProviderRole(role)) return { ok: false, reason: 'role' };
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
 * @param {{ role: NavRole, contextKind: MemoTargetKind, paidOnlyVisible?: boolean }} ctx
 */
export function getScopeBadge(ctx) {
  const { role, contextKind, paidOnlyVisible = false } = ctx;
  if (contextKind === 'student' && isProviderRole(role)) {
    if (!isProviderPaid()) {
      return { label: '구조화 항목만', hint: '요청문 비공개 · 메모 차단', showRequest: false };
    }
    return {
      label: paidOnlyVisible ? '구조화 + paid_only' : '구조화 + paid_only',
      hint: paidOnlyVisible ? '요청문 일부 공개' : '요청문 visibility=private',
      showRequest: paidOnlyVisible,
    };
  }
  if (contextKind === 'study_room' || contextKind === 'tutor') {
    return { label: '공개 프로필', hint: '공급자 상세 공개 범위', showRequest: false };
  }
  return { label: '—', hint: '', showRequest: false };
}

export const GATE_COPY = {
  title: '유료등록이 필요합니다',
  body: '무료 공급자는 학생에게 메모를 보낼 수 없습니다. 구조화된 학생 정보만 열람할 수 있습니다.',
  hint: '13장 §7-4 · 18장 상품 안내',
  cta: '유료 서비스 안내 (18장)',
};
