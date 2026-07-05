/**
 * 16장 — 쪽지함 copy · 배지 · 빈 상태 (횡단 SSOT)
 * docs/ssot/16-messages-structure-proposal.md §3 · §4 · §7
 */

/** @typedef {'parent'|'study_room'|'tutor'|'guest'} NavRole */
/** @typedef {'student'|'study_room'|'tutor'} MemoTargetKind */

import { previewState } from '../state.js';

function isProviderRole(role) {
  return role === 'study_room' || role === 'tutor';
}

function isProviderPaid() {
  return previewState.providerSubscription === 'paid';
}

/** §3 공개 범위 배지 */
export const SCOPE_BADGE_LABELS = {
  structuredOnly: '구조화 항목만',
  structuredPlusPaid: '구조화 + paid_only',
  publicProfile: '공개 프로필',
};

/** §4 빈 상태 */
export const EMPTY_LIST_COPY = {
  parent: '관심 있는 공부방·과외쌤에게 메모를 보내 보세요.',
  providerPaid: '학생찾기에서 의뢰를 확인하고 메모를 보내 보세요.',
};

export const FREE_PROVIDER_INBOX_COPY = {
  empty:
    '받은 문의에 답장해 보세요. 학생에게 <strong>먼저</strong> 메모를 내려면 유료등록이 필요합니다. (P16-04)',
  hint: '무료 공급자: 받은 쪽지·학부모 문의 답장 OK · 학생에게 <strong>먼저</strong> 메모만 P16-04',
};

/** §7 P16-04 */
export const GATE_COPY = {
  title: '유료등록이 필요합니다',
  body:
    '학생에게 먼저 메모(콜드 아웃리치)를 내려면 유료 등록 또는 포인트가 필요합니다. 구조화된 학생 정보만 열람할 수 있습니다.',
  replyNote: '학부모가 먼저 문의한 대화에는 답장할 수 있습니다.',
  hint: '13장 §7-4 · 18장 상품 안내',
  cta: '유료 서비스 보기 (P15-09)',
};

/**
 * §3 — 역할·대상별 공개 범위 배지
 * @param {{ role: NavRole, contextKind: MemoTargetKind, paidOnlyVisible?: boolean }} ctx
 */
export function getScopeBadge(ctx) {
  const { role, contextKind, paidOnlyVisible = false } = ctx;

  if (contextKind === 'student' && isProviderRole(role)) {
    if (!isProviderPaid()) {
      return {
        label: SCOPE_BADGE_LABELS.structuredOnly,
        hint: '요청문 비공개 · 콜드 메모 차단',
        showRequest: false,
      };
    }
    return {
      label: SCOPE_BADGE_LABELS.structuredPlusPaid,
      hint: paidOnlyVisible ? '요청문 일부 공개' : '요청문 visibility=private',
      showRequest: paidOnlyVisible,
    };
  }

  if (contextKind === 'study_room' || contextKind === 'tutor') {
    const hint = isProviderRole(role)
      ? '선연락 thread · 답장 free'
      : '공급자 상세 공개 범위';
    return {
      label: SCOPE_BADGE_LABELS.publicProfile,
      hint,
      showRequest: false,
    };
  }

  return { label: '—', hint: '', showRequest: false };
}

/**
 * P16-02 답장 불가 사유 (§1-2 · §8)
 * @param {{ contextKind: MemoTargetKind, messages: { sender: 'me'|'peer' }[] } | null} thread
 * @param {NavRole} role
 */
export function getReplyBlockedMessage(thread, role) {
  if (!thread) return '대화를 찾을 수 없습니다.';
  if (role === 'guest') return '로그인 후 답장할 수 있습니다.';

  if (role === 'parent') {
    if (thread.contextKind === 'student') return '학부모는 공급자에게만 쪽지를 보낼 수 있습니다.';
    return '답장할 수 없습니다.';
  }

  if (isProviderRole(role) && thread.contextKind === 'student') {
    const peerSpoke = thread.messages.some((m) => m.sender === 'peer');
    if (!peerSpoke && !isProviderPaid()) {
      return `${GATE_COPY.replyNote} 학생에게 먼저 메모는 유료등록 후 가능합니다. (P16-04)`;
    }
  }

  return '답장할 수 없습니다.';
}
