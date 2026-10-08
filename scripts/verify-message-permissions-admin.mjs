/**
 * 쪽지 화면 권한(permissions.js) ↔ 서버(MessagesService) 방향 규칙 일치 — 16§1-2
 * 관리자는 학생에게 쪽지 불가(운영 안내는 공지) · 공부방·과외쌤에게는 가능.
 * 실행: cd preview/home-ui && npx vite-node ../../scripts/verify-message-permissions-admin.mjs
 */
import { previewState } from '../preview/home-ui/src/state.js';
import { isMessagesApiMode } from '../preview/home-ui/src/messages-backend.js';
import {
  canProviderColdMemoToStudent,
  canReplyInThread,
  checkFirstMemoPermission,
  isColdOutreach,
} from '../preview/home-ui/src/messages/permissions.js';

let pass = 0;
let fail = 0;
function ok(name, cond, detail = '') {
  if (cond) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function first(kind, role) {
  return checkFirstMemoPermission({ kind, role });
}

function show(r) {
  return JSON.stringify(r);
}

function thread(contextKind, extra = {}) {
  return { contextKind, messages: [{ sender: 'peer' }], isBlocked: false, ...extra };
}

ok('preview_mode(messages API 아님)', isMessagesApiMode() === false);

for (const sub of ['free', 'paid']) {
  previewState.providerSubscription = sub;
  const r = first('student', 'admin');
  ok(`admin→student_first_denied_role (${sub})`, r.ok === false && r.reason === 'role', show(r));
  ok(`admin_cold_memo_false (${sub})`, canProviderColdMemoToStudent('admin') === false);
  ok(`admin_not_cold_outreach (${sub})`, isColdOutreach('student', 'admin') === false);
  ok(`admin→study_room_first_ok (${sub})`, first('study_room', 'admin').ok === true, show(first('study_room', 'admin')));
  ok(`admin→tutor_first_ok (${sub})`, first('tutor', 'admin').ok === true, show(first('tutor', 'admin')));
}

previewState.providerSubscription = 'paid';
for (const role of ['tutor', 'study_room']) {
  ok(`paid_${role}→student_first_ok`, first('student', role).ok === true, show(first('student', role)));
  ok(`paid_${role}_cold_memo_true`, canProviderColdMemoToStudent(role) === true);
}

previewState.providerSubscription = 'free';
for (const role of ['tutor', 'study_room']) {
  const r = first('student', role);
  ok(`free_${role}→student_paid_gate`, r.ok === false && r.reason === 'paid_gate', show(r));
  ok(`free_${role}_cold_memo_false`, canProviderColdMemoToStudent(role) === false);
}

for (const kind of ['study_room', 'tutor']) {
  ok(`student(parent)→${kind}_first_ok`, first(kind, 'parent').ok === true, show(first(kind, 'parent')));
}
const parentToStudent = first('student', 'parent');
ok('student(parent)→student_first_denied', parentToStudent.ok === false, show(parentToStudent));

for (const sub of ['free', 'paid']) {
  previewState.providerSubscription = sub;
  for (const role of ['tutor', 'study_room']) {
    for (const kind of ['study_room', 'tutor']) {
      ok(`provider_${role}→${kind}_first_ok (${sub})`, first(kind, role).ok === true, show(first(kind, role)));
    }
  }
}

for (const kind of ['student', 'study_room', 'tutor']) {
  const r = first(kind, 'guest');
  ok(`guest→${kind}_first_denied`, r.ok === false, show(r));
}

previewState.providerSubscription = 'paid';
ok('admin_reply_student_thread_denied', canReplyInThread(thread('student'), 'admin') === false);
ok('admin_reply_tutor_thread_ok', canReplyInThread(thread('tutor'), 'admin') === true);
ok('admin_reply_study_room_thread_ok', canReplyInThread(thread('study_room'), 'admin') === true);
ok('admin_reply_blocked_thread_denied', canReplyInThread(thread('tutor', { isBlocked: true }), 'admin') === false);
previewState.providerSubscription = 'free';
ok('free_provider_reply_student_thread_ok', canReplyInThread(thread('student'), 'tutor') === true);
ok('parent_reply_provider_thread_ok', canReplyInThread(thread('tutor'), 'parent') === true);
ok('provider_reply_provider_thread_ok', canReplyInThread(thread('study_room'), 'study_room') === true);
ok('guest_reply_denied', canReplyInThread(thread('tutor'), 'guest') === false);

// ── 6c: 화면 쪽 관리자 판정(상세 CTA · 목록 버튼 · 쪽지 시작 · 답장 불가 문구) ──
const ADMIN_COPY = '관리자 계정은 학생에게 쪽지를 보낼 수 없습니다. 운영 안내는 공지를 이용해 주세요.';
const TARGET_COPY = '이 대상에게는 쪽지를 보낼 수 없습니다.';

const memStore = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
  };
};
globalThis.sessionStorage ??= memStore();
globalThis.localStorage ??= memStore();
globalThis.window ??= {
  location: { hash: '#/guest', origin: 'http://localhost', assign() {}, replace() {} },
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {},
};
const toasts = [];
const alerts = [];
globalThis.alert = (m) => alerts.push(String(m));
/** @type {Record<string, any>} */
const domById = {};
globalThis.document ??= {
  getElementById: (id) => domById[id] || null,
  createElement: () => {
    const el = {
      id: '',
      className: '',
      classList: { add() {}, remove() {} },
      setAttribute() {},
      appendChild() {},
      set textContent(v) {
        toasts.push(String(v));
      },
    };
    return el;
  },
  body: {
    appendChild: (el) => {
      if (el?.id) domById[el.id] = el;
    },
    classList: { add() {}, remove() {} },
    style: {},
  },
  querySelector: () => null,
  querySelectorAll: () => [],
};

const { noteAuthRoleType } = await import('../preview/home-ui/src/auth-role.js');
const copyMod = await import('../preview/home-ui/src/messages/messages-copy.js');
const shellMod = await import('../preview/home-ui/src/detail-decision/detail-shell.js');
const reviewUi = await import('../preview/home-ui/src/student-review-ui.js');
const composeMod = await import('../preview/home-ui/src/messages/compose-flow.js');
const { resolveStudyRoomCardCta } = await import('../preview/home-ui/src/study-room-reg/inquiry-display.js');
const { PAID_GATE_MESSAGE } = await import('../preview/home-ui/src/student-visibility.js');

const { getReplyBlockedMessage } = copyMod;
const resolvePrimaryCta = shellMod.resolvePrimaryCta;
ok('resolvePrimaryCta_callable', typeof resolvePrimaryCta === 'function');
const cta = (kind, item, viewer) =>
  typeof resolvePrimaryCta === 'function' ? resolvePrimaryCta(kind, item, viewer) : null;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const STUDENT_PUB = { id: 1, exposure_status: 'published' };
const STUDENT_DRAFT = { id: 2, exposure_status: 'draft' };
const TUTOR = { id: 11 };
const ROOM = { id: 21, inquiry_status: 'open' };
const CLOSE = { label: '닫기', action: 'close', disabled: false };

noteAuthRoleType('');
for (const sub of ['free', 'paid']) {
  previewState.providerSubscription = sub;
  for (const item of [STUDENT_PUB, STUDENT_DRAFT]) {
    const r = cta('student', item, 'admin');
    ok(
      `detail_cta_admin→student_disabled (${sub}, ${item.exposure_status})`,
      r?.disabled === true && r?.title === ADMIN_COPY && r?.action !== 'memo',
      show(r),
    );
  }
  ok(`detail_cta_admin→tutor_unchanged (${sub})`, same(cta('tutor', TUTOR, 'admin'), CLOSE), show(cta('tutor', TUTOR, 'admin')));
  ok(`detail_cta_admin→study_room_unchanged (${sub})`, same(cta('study_room', ROOM, 'admin'), CLOSE), show(cta('study_room', ROOM, 'admin')));
}

previewState.providerSubscription = 'paid';
for (const role of ['tutor', 'study_room']) {
  ok(`detail_cta_paid_${role}→student_memo`, same(cta('student', STUDENT_PUB, role), { label: '쪽지 보내기', action: 'memo', disabled: false }), show(cta('student', STUDENT_PUB, role)));
  ok(`detail_cta_${role}→student_draft_prep`, same(cta('student', STUDENT_DRAFT, role), { label: '쪽지 준비', action: 'memo-prep', disabled: true }), show(cta('student', STUDENT_DRAFT, role)));
}
previewState.providerSubscription = 'free';
for (const role of ['tutor', 'study_room']) {
  ok(`detail_cta_free_${role}→student_plans`, same(cta('student', STUDENT_PUB, role), { label: '쪽지 준비', action: 'plans', disabled: false }), show(cta('student', STUDENT_PUB, role)));
}
for (const kind of ['student', 'tutor', 'study_room']) {
  ok(`detail_cta_guest_${kind}_login`, same(cta(kind, kind === 'student' ? STUDENT_PUB : TUTOR, 'guest'), { label: '로그인하고 문의하기', action: 'login', disabled: false }));
}
ok('detail_cta_parent→tutor_memo', same(cta('tutor', TUTOR, 'parent'), { label: '쪽지 보내기', action: 'memo', disabled: false }), show(cta('tutor', TUTOR, 'parent')));
const roomCta = resolveStudyRoomCardCta(ROOM.inquiry_status);
ok('detail_cta_parent→study_room_memo', same(cta('study_room', ROOM, 'parent'), { label: roomCta.label, action: 'memo', disabled: roomCta.disabled }), show(cta('study_room', ROOM, 'parent')));
ok('detail_cta_parent→student_close', same(cta('student', STUDENT_PUB, 'parent'), CLOSE));
ok('detail_cta_tutor→tutor_close', same(cta('tutor', TUTOR, 'tutor'), CLOSE));

ok('reply_msg_admin_student', getReplyBlockedMessage(thread('student'), 'admin') === ADMIN_COPY, getReplyBlockedMessage(thread('student'), 'admin'));
ok('reply_msg_admin_tutor_generic', getReplyBlockedMessage(thread('tutor', { isBlocked: true }), 'admin') === '답장할 수 없습니다.');
ok('reply_msg_parent_student', getReplyBlockedMessage(thread('student'), 'parent') === '학생은 공급자에게만 쪽지를 보낼 수 있습니다.', getReplyBlockedMessage(thread('student'), 'parent'));
ok('reply_msg_parent_provider', getReplyBlockedMessage(thread('tutor'), 'parent') === '답장할 수 없습니다.');
ok('reply_msg_guest', getReplyBlockedMessage(thread('student'), 'guest') === '로그인 후 답장할 수 있습니다.');
ok('reply_msg_provider_student', getReplyBlockedMessage(thread('student'), 'tutor') === '답장할 수 없습니다.');
ok('reply_msg_null', getReplyBlockedMessage(null, 'admin') === '대화를 찾을 수 없습니다.');

// 쪽지함(#/messages)은 getNavRole()→getActiveRole() 이라 관리자가 'guest'·저장된 역할로 들어온다 — 세션으로 보정
noteAuthRoleType('admin');
ok('reply_msg_admin_session_via_guest_role', getReplyBlockedMessage(thread('student'), 'guest') === ADMIN_COPY, getReplyBlockedMessage(thread('student'), 'guest'));
ok('reply_msg_admin_session_via_stale_tutor', getReplyBlockedMessage(thread('student'), 'tutor') === ADMIN_COPY);
noteAuthRoleType('tutor');
ok('reply_msg_tutor_session_unchanged', getReplyBlockedMessage(thread('student'), 'tutor') === '답장할 수 없습니다.');
noteAuthRoleType('');

// 학생 목록 카드 버튼 — title
previewState.providerSubscription = 'paid';
const titleOf = (html) => (/title="([^"]*)"/.exec(html) || [])[1] || '';
const adminRow = reviewUi.renderStudentProviderActions({ id: 1 }, { viewerRole: 'admin' });
ok('list_btn_admin_title', titleOf(adminRow) === ADMIN_COPY, titleOf(adminRow));
ok('list_btn_admin_not_ready', adminRow.includes('data-memo-ready="0"'));
ok('list_btn_guest_login_gate', reviewUi.renderStudentProviderActions({ id: 1 }, { guest: true }).includes('data-action="login-gate"'));
const paidTutorRow = reviewUi.renderStudentProviderActions({ id: 1 }, { viewerRole: 'tutor' });
ok('list_btn_paid_tutor_ready', paidTutorRow.includes('data-memo-ready="1"') && titleOf(paidTutorRow) === '쪽지를 보내려면 준비가 필요합니다');
previewState.providerSubscription = 'free';
ok('list_btn_free_tutor_paid_gate', titleOf(reviewUi.renderStudentProviderActions({ id: 1 }, { viewerRole: 'tutor' })) === PAID_GATE_MESSAGE);

// 학생 목록 카드 버튼 — 클릭
function fakeRoot(providerRole) {
  /** @type {Record<string, Function>} */
  const handlers = {};
  const btn = {
    dataset: { studentId: '1', providerRole },
    addEventListener: (type, fn) => {
      handlers[type] = fn;
    },
  };
  return {
    root: {
      querySelectorAll: (sel) => (sel.includes('student-memo-start') ? [btn] : []),
    },
    click: () => handlers.click?.({ preventDefault() {}, stopPropagation() {} }),
  };
}
function clickMemo(providerRole) {
  window.location.hash = '#/guest';
  toasts.length = 0;
  const f = fakeRoot(providerRole);
  reviewUi.bindStudentReviewEvents(f.root, undefined, { providerRole, getStudentItem: () => undefined });
  f.click();
  return { hash: window.location.hash, toasts: [...toasts] };
}
const adminClick = clickMemo('admin');
ok('list_click_admin_toast', adminClick.toasts.includes(ADMIN_COPY), show(adminClick));
ok('list_click_admin_no_redirect', adminClick.hash === '#/guest', show(adminClick));
const parentClick = clickMemo('parent');
ok('list_click_parent_redirect_unchanged', parentClick.hash !== '#/guest' && parentClick.toasts.length === 0, show(parentClick));

// 쪽지 시작 흐름 — alert 문구
function startMemo(kind) {
  alerts.length = 0;
  window.location.hash = '#/guest';
  composeMod.startFirstMemoFlow({ kind, targetId: 1, targetName: 'x' });
  return alerts[0] ?? null;
}
noteAuthRoleType('admin');
ok('compose_admin_session→student_copy', startMemo('student') === ADMIN_COPY, String(alerts[0]));
noteAuthRoleType('');
const guestComposeTutor = startMemo('tutor');
ok('compose_guest→tutor_generic', guestComposeTutor === TARGET_COPY, String(guestComposeTutor));
const guestComposeStudent = startMemo('student');
ok('compose_guest→student_generic', guestComposeStudent === TARGET_COPY, String(guestComposeStudent));
ok('compose_no_dev_copy', ![guestComposeTutor, guestComposeStudent].some((m) => /\[16장\]|메모/.test(String(m))));

noteAuthRoleType('admin');
const { checkFirstMemoPermission: firstAgain } = await import('../preview/home-ui/src/messages/permissions.js');
const resolveMemoRole = copyMod.resolveMemoRole ?? ((r) => r);
ok('compose_admin_session→tutor_allowed', firstAgain({ kind: 'tutor', role: resolveMemoRole('guest') }).ok === true);
ok('compose_admin_session→study_room_allowed', firstAgain({ kind: 'study_room', role: resolveMemoRole('guest') }).ok === true);
noteAuthRoleType('');
ok('memo_role_non_admin_session_unchanged', ['guest', 'parent', 'tutor', 'study_room'].every((r) => resolveMemoRole(r) === r));

// ── 6d: 쪽지함(#/mypage/messages) 답장 폼 · 답장 전송 — getNavRole()→getActiveRole() 은 관리자를 'guest'·저장된 역할로 준다 ──
const screensMod = await import('../preview/home-ui/src/messages/screens.js');
const threadStore = await import('../preview/home-ui/src/messages/thread-store.js');
const { getNavRole } = await import('../preview/home-ui/src/state.js');
const { threadPath, MESSAGES_BASE } = await import('../preview/home-ui/src/messages/router.js');
const ACTIVE_ROLE_KEY = 'study114-preview-active-role';
const THREADS_KEY = 'study114-preview-message-threads-v2';
const LOGIN_REPLY_COPY = '로그인 후 답장할 수 있습니다.';

sessionStorage.removeItem(THREADS_KEY);
ok('demo_threads_seed_removed', !('ensureDemoThreads' in threadStore));
ok('demo_threads_zero_on_empty_store', threadStore.getThreads().length === 0);

/** 쪽지 데모 시드는 없다 — 검증용 스레드(공부방·과외·학생 각 1)를 저장소에 직접 넣는다 */
function seedThreads() {
  const at = new Date().toISOString();
  const threads = ['study_room', 'tutor', 'student'].map((contextKind, i) => ({
    id: i + 1,
    contextKind,
    contextId: 1,
    contextLabel: '검증',
    peerDisplayName: `검증상대-${contextKind}`,
    scopeBadge: '',
    scopeHint: '',
    showRequestInPanel: false,
    structuredLine: '',
    lastPreview: '검증 쪽지',
    updatedAt: at,
    unread: true,
    initiatedByMe: false,
    initiatedByPeer: true,
    messages: [{ id: 1, sender: 'peer', body: '검증 쪽지', createdAt: at }],
  }));
  sessionStorage.setItem(THREADS_KEY, JSON.stringify({ threads }));
  /** @type {Record<string, number>} */
  const ids = {};
  for (const t of threadStore.getThreads()) ids[t.contextKind] = t.id;
  return ids;
}
/** @param {string} authRole auth role_type ('' = 비로그인) @param {string|null} activeRole 저장된 활성 역할 */
function setSession(authRole, activeRole) {
  noteAuthRoleType(authRole);
  if (activeRole) sessionStorage.setItem(ACTIVE_ROLE_KEY, activeRole);
  else sessionStorage.removeItem(ACTIVE_ROLE_KEY);
  window.location.hash = `#${MESSAGES_BASE}`;
}
function renderThread(id) {
  const path = threadPath(id);
  window.location.hash = `#${path}`;
  const html = screensMod.renderMessagesScreen(path);
  return { form: html.includes(`data-msg-reply="${id}"`), html };
}
async function submitReply(id) {
  window.location.hash = `#${MESSAGES_BASE}`;
  const before = threadStore.getThread(id)?.messages.length ?? 0;
  let rerendered = 0;
  /** @type {Record<string, Function>} */
  const handlers = {};
  const input = { value: '6d 답장 검사' };
  const fileInput = { files: [] };
  const form = {
    dataset: { msgReply: String(id) },
    addEventListener: (type, fn) => {
      handlers[type] = fn;
    },
    querySelector: (sel) => (sel.includes('__input') ? input : sel.includes('__file') ? fileInput : null),
  };
  const root = {
    querySelector: () => null,
    querySelectorAll: (sel) => (sel === '[data-msg-reply]' ? [form] : []),
  };
  screensMod.bindMessagesScreenEvents(root, () => {
    rerendered += 1;
  });
  try {
    await handlers.submit?.({ preventDefault() {} });
  } catch {
    /* 거절 시 유료 안내 오버레이 — 가짜 DOM 에서는 그리다 멈춤 */
  }
  const after = threadStore.getThread(id)?.messages.length ?? 0;
  return after === before + 1 && rerendered > 0;
}

previewState.providerSubscription = 'free';
for (const stale of [null, 'tutor', 'parent', 'study_room']) {
  const label = `admin_session_active=${stale ?? 'none'}`;
  const ids = seedThreads();
  setSession('admin', stale);
  for (const kind of ['study_room', 'tutor']) {
    ok(`inbox_${label}_${kind}_reply_form_open`, renderThread(ids[kind]).form === true);
  }
  const st = renderThread(ids.student);
  ok(`inbox_${label}_student_reply_form_closed`, st.form === false);
  ok(`inbox_${label}_student_admin_copy`, st.html.includes(ADMIN_COPY));
  ok(`inbox_${label}_tutor_reply_submit_ok`, (await submitReply(ids.tutor)) === true);
  ok(`inbox_${label}_student_reply_submit_denied`, (await submitReply(ids.student)) === false);
}

const nonAdmin = [
  { name: 'tutor', auth: 'tutor', active: 'tutor', expectForm: { study_room: true, tutor: true, student: true } },
  { name: 'study_room', auth: 'study_room_owner', active: 'study_room', expectForm: { study_room: true, tutor: true, student: true } },
  { name: 'student', auth: 'guardian_student', active: 'parent', expectForm: { study_room: true, tutor: true, student: true } },
  { name: 'guest', auth: '', active: null, expectForm: { study_room: false, tutor: false, student: false } },
];
for (const s of nonAdmin) {
  const ids = seedThreads();
  setSession(s.auth, s.active);
  const navRole = getNavRole();
  for (const kind of ['study_room', 'tutor', 'student']) {
    const r = renderThread(ids[kind]);
    const thread = threadStore.getThread(ids[kind]);
    ok(
      `inbox_${s.name}_${kind}_reply_form_unchanged`,
      r.form === s.expectForm[kind] && r.form === canReplyInThread(thread, navRole),
      `form=${r.form} navRole=${navRole}`,
    );
    if (!r.form) {
      ok(`inbox_${s.name}_${kind}_blocked_copy_unchanged`, r.html.includes(getReplyBlockedMessage(thread, navRole)));
    }
  }
  if (s.name === 'guest') {
    ok('inbox_guest_login_copy', renderThread(ids.tutor).html.includes(LOGIN_REPLY_COPY));
    ok('inbox_guest_reply_submit_denied', (await submitReply(ids.tutor)) === false);
  } else {
    ok(`inbox_${s.name}_student_reply_submit_ok`, (await submitReply(ids.student)) === true);
  }
}
noteAuthRoleType('');
sessionStorage.removeItem(ACTIVE_ROLE_KEY);
sessionStorage.removeItem(THREADS_KEY);

console.log(`\n${pass} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
