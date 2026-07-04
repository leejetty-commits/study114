/**

 * 16장 §1-2 · §8 · 13장 §8 권한

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

export function canProviderColdMemoToStudent(role) {

  return isProviderRole(role) && isProviderPaid();

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

 * P16-03 첫 메모 — 콜드만 paid_gate (선연락은 study_room/tutor 또는 답장은 thread)

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

 * P16-02 thread 답장 — 선연락·학부모 thread는 free

 * @param {{ contextKind: MemoTargetKind, messages: { sender: 'me'|'peer' }[], initiatedByMe?: boolean } | null} thread

 * @param {NavRole} role

 */

export function canReplyInThread(thread, role) {

  if (!thread) return false;

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



/**

 * @param {{ role: NavRole, contextKind: MemoTargetKind, paidOnlyVisible?: boolean }} ctx

 */

export function getScopeBadge(ctx) {

  const { role, contextKind, paidOnlyVisible = false } = ctx;

  if (contextKind === 'student' && isProviderRole(role)) {

    if (!isProviderPaid()) {

      return { label: '구조화 항목만', hint: '요청문 비공개 · 콜드 메모 차단', showRequest: false };

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

  body:

    '학생에게 먼저 메모(콜드 아웃리치)를 내려면 유료 등록 또는 포인트가 필요합니다. 구조화된 학생 정보만 열람할 수 있습니다.',

  replyNote: '학부모가 먼저 문의한 대화에는 답장할 수 있습니다.',

  hint: '13장 §7-4 · 18장 상품 안내',

  cta: '유료 서비스 보기 (P15-09)',

};



export const FREE_PROVIDER_INBOX_COPY = {

  empty:

    '받은 문의에 답장해 보세요. 학생에게 <strong>먼저</strong> 메모를 내려면 유료등록이 필요합니다. (P16-04)',

  hint: '무료 공급자: 받은 쪽지·학부모 문의 답장 OK · 학생에게 <strong>먼저</strong> 메모만 P16-04',

};


