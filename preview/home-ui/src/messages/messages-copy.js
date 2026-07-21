/**
 * 16장 — 쪽지함 copy · 배지 · 빈 상태 (횡단 SSOT)
 * docs/ssot/16-messages-structure-proposal.md §3 · §4 · §7
 * 빈 상태 정본(신규): docs/ssot/29-empty-error-permission-ux.md · empty-state-copy.js
 */

/** @typedef {'parent'|'study_room'|'tutor'|'guest'} NavRole */
/** @typedef {'student'|'study_room'|'tutor'} MemoTargetKind */

import { previewState } from '../state.js';
import { isMessagesApiMode } from '../messages-backend.js';
import { getMemoGateState } from '../provider-entitlement.js';

function isProviderRole(role) {
  return role === 'study_room' || role === 'tutor';
}

function isProviderPaid() {
  if (isMessagesApiMode()) {
    return getMemoGateState().canColdMemo;
  }
  return previewState.providerSubscription === 'paid';
}

function formatMemoExpiry(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** §3 공개 범위 배지 */
export const SCOPE_BADGE_LABELS = {
  structuredOnly: '구조화 항목만',
  structuredPlusPaid: '구조화 항목 + 유료 전용 요청문',
  publicProfile: '공개 프로필',
};

/** §4 빈 상태 — 정본: empty-state-copy.js `getMessagesEmptyCopy` */
export const FREE_PROVIDER_INBOX_COPY = {
  empty:
    '받은 문의에 답장해 보세요. 학생에게 <strong>먼저</strong> 쪽지를 보내려면 쪽지권이 필요합니다.',
  hint: '무료 이용자도 받은 쪽지와 학부모 문의에 답장할 수 있어요. 학생에게 먼저 보내는 쪽지만 쪽지권이 필요합니다.',
};

/** §7 P16-04 — 18§9-12 행동 직전 업셀 */
export const GATE_COPY = {
  title: '쪽지권이 필요합니다',
  body:
    '이 학생에게 먼저 쪽지를 보내려면 쪽지권이 필요합니다. 기본 학생 정보는 열람할 수 있습니다.',
  replyNote: '학부모가 먼저 문의한 대화에는 답장할 수 있습니다.',
  hint: '쪽지를 보내기 직전에 이용권 보유 여부를 확인합니다.',
  cta: '유료 서비스 안내',
};

/**
 * P16-04 — 잔여·소진·만료 분기
 * @param {{ ticketsRemaining?: number, nearestExpiry?: string|null, bypass?: boolean, canColdMemo?: boolean }} [state]
 */
export function buildMemoGateCopy(state = getMemoGateState()) {
  const remaining = state.ticketsRemaining ?? 0;
  const expiryLabel = formatMemoExpiry(state.nearestExpiry);
  const depleted = !state.bypass && remaining <= 0;

  if (depleted) {
    return {
      title: '쪽지권이 없습니다',
      body: '학생에게 먼저 쪽지를 보내려면 쪽지권이 필요합니다. 기본 학생 정보는 열람할 수 있습니다.',
      replyNote: GATE_COPY.replyNote,
      hint: '쪽지권은 구매 후 6개월 내 사용 · 먼저 산 이용권부터 차감',
      cta: GATE_COPY.cta,
      remainingLine: '잔여 쪽지권: 0회',
      expiryLine: expiryLabel ? `가장 가까운 만료: ${expiryLabel} (이미 소진)` : null,
      showPlansCta: true,
    };
  }

  if (remaining > 0) {
    return {
      title: '쪽지권 안내',
      body: `선제 쪽지 전송 시 쪽지권 1회가 차감됩니다. 현재 잔여 ${remaining}회입니다.`,
      replyNote: GATE_COPY.replyNote,
      hint: GATE_COPY.hint,
      cta: '쪽지권 더 구매하기',
      remainingLine: `잔여 쪽지권: ${remaining}회`,
      expiryLine: expiryLabel ? `가장 가까운 만료: ${expiryLabel}` : '유효기간: 구매 후 6개월',
      showPlansCta: true,
    };
  }

  return {
    ...GATE_COPY,
    remainingLine: null,
    expiryLine: null,
    showPlansCta: true,
  };
}

/** 선제 쪽지 compose 안내 */
export function buildMemoComposeChargeCopy(state = getMemoGateState()) {
  if (state.bypass) {
    return '운영자 확인용 — 쪽지권 차감 없음';
  }
  const remaining = state.ticketsRemaining ?? 0;
  const expiryLabel = formatMemoExpiry(state.nearestExpiry);
  const expiry = expiryLabel ? ` · 만료 ${expiryLabel}` : '';
  return `선제 쪽지 전송 시 쪽지권 1회 차감 · 잔여 ${remaining}회${expiry}`;
}

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
      hint: paidOnlyVisible ? '요청문 일부 공개' : '요청문 비공개',
      showRequest: paidOnlyVisible,
    };
  }

  if (contextKind === 'study_room' || contextKind === 'tutor') {
    const hint = isProviderRole(role)
      ? '먼저 온 연락의 답장은 무료'
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
      return `${GATE_COPY.replyNote} 학생에게 먼저 보내는 쪽지는 쪽지권 구매 후 가능합니다.`;
    }
  }

  return '답장할 수 없습니다.';
}

/** §5 신고 사유 `[임시]` */
export const REPORT_REASONS = [
  { id: 'spam', label: '스팸·광고' },
  { id: 'abuse', label: '욕설·혐오' },
  { id: 'fraud', label: '사기·허위' },
  { id: 'privacy', label: '개인정보 노출' },
  { id: 'other', label: '기타' },
];

export const BLOCK_THREAD_COPY = {
  confirm: '이 대화를 차단하면 답장을 보낼 수 없습니다. 계속할까요?',
  banner: '차단된 대화입니다. 답장이 제한됩니다.',
};
