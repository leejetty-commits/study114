/** 16장 thread · message — 프리뷰 sessionStorage `[임시]` */

const KEY = 'study114-preview-message-threads-v2';
let nextId = 1;

/**
 * @typedef {object} ThreadMessage
 * @property {number} id
 * @property {'me'|'peer'} sender
 * @property {string} body
 * @property {string} createdAt
 */

/**
 * @typedef {object} MessageThread
 * @property {number} id
 * @property {'student'|'study_room'|'tutor'} contextKind
 * @property {number} contextId
 * @property {string} contextLabel
 * @property {string} peerDisplayName
 * @property {string} scopeBadge
 * @property {string} scopeHint
 * @property {boolean} showRequestInPanel
 * @property {string} [requestSummary]
 * @property {string} structuredLine
 * @property {string} lastPreview
 * @property {string} updatedAt
 * @property {boolean} unread
 * @property {boolean} initiatedByMe
 * @property {boolean} initiatedByPeer
 * @property {ThreadMessage[]} messages
 */

function loadAll() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    nextId = Math.max(nextId, ...(data.threads || []).map((t) => t.id + 1), 1);
    return (data.threads || []).map((t) => ({
      ...t,
      initiatedByPeer: t.initiatedByPeer ?? !t.initiatedByMe,
    }));
  } catch {
    return [];
  }
}

function saveAll(threads) {
  sessionStorage.setItem(KEY, JSON.stringify({ threads }));
}

/** @returns {MessageThread[]} */
export function getThreads() {
  return loadAll();
}

/** @param {number} id */
export function getThread(id) {
  return loadAll().find((t) => t.id === id) || null;
}

/** @param {number} id */
export function markThreadRead(id) {
  const threads = loadAll();
  const t = threads.find((x) => x.id === id);
  if (t) t.unread = false;
  saveAll(threads);
}

/**
 * @param {'inbox'|'sent'|'active'} tab
 * @param {number} [activeDays=7]
 */
export function getThreadsForTab(tab, activeDays = 7) {
  const all = loadAll();
  const cutoff = Date.now() - activeDays * 86400000;
  if (tab === 'sent') return all.filter((t) => t.initiatedByMe);
  if (tab === 'active') {
    return all.filter((t) => new Date(t.updatedAt).getTime() >= cutoff);
  }
  return all.filter((t) => !t.initiatedByMe || t.unread);
}

export function getUnreadCount() {
  return loadAll().filter((t) => t.unread).length;
}

export function getActiveCount() {
  const cutoff = Date.now() - 7 * 86400000;
  return loadAll().filter((t) => new Date(t.updatedAt).getTime() >= cutoff).length;
}

/**
 * @param {object} input
 * @param {'student'|'study_room'|'tutor'} input.contextKind
 * @param {number} input.contextId
 * @param {string} input.contextLabel
 * @param {string} input.peerDisplayName
 * @param {string} input.scopeBadge
 * @param {string} input.scopeHint
 * @param {boolean} input.showRequestInPanel
 * @param {string} [input.requestSummary]
 * @param {string} input.structuredLine
 * @param {string} input.body
 */
export function findOrCreateThread(input) {
  const threads = loadAll();
  const existing = threads.find(
    (t) => t.contextKind === input.contextKind && t.contextId === input.contextId,
  );
  if (existing) {
    existing.messages.push({
      id: existing.messages.length + 1,
      sender: 'me',
      body: input.body,
      createdAt: new Date().toISOString(),
    });
    existing.lastPreview = input.body.slice(0, 80);
    existing.updatedAt = new Date().toISOString();
    existing.initiatedByMe = true;
    existing.initiatedByPeer = existing.messages.some((m) => m.sender === 'peer');
    existing.unread = false;
    saveAll(threads);
    return existing;
  }

  const thread = {
    id: nextId++,
    contextKind: input.contextKind,
    contextId: input.contextId,
    contextLabel: input.contextLabel,
    peerDisplayName: input.peerDisplayName,
    scopeBadge: input.scopeBadge,
    scopeHint: input.scopeHint,
    showRequestInPanel: input.showRequestInPanel,
    requestSummary: input.requestSummary,
    structuredLine: input.structuredLine,
    lastPreview: input.body.slice(0, 80),
    updatedAt: new Date().toISOString(),
    unread: false,
    initiatedByMe: true,
    initiatedByPeer: false,
    messages: [{ id: 1, sender: 'me', body: input.body, createdAt: new Date().toISOString() }],
  };
  threads.unshift(thread);
  saveAll(threads);
  return thread;
}

/** @param {number} id @param {string} body */
export function appendMessageToThread(id, body) {
  const threads = loadAll();
  const t = threads.find((x) => x.id === id);
  if (!t) return null;
  t.messages.push({
    id: t.messages.length + 1,
    sender: 'me',
    body,
    createdAt: new Date().toISOString(),
  });
  t.lastPreview = body.slice(0, 80);
  t.updatedAt = new Date().toISOString();
  t.unread = false;
  t.initiatedByMe = true;
  saveAll(threads);
  return t;
}

export function ensureDemoThreads() {
  if (loadAll().length > 0) return;
  const now = new Date();
  const threads = [
    {
      id: nextId++,
      contextKind: 'study_room',
      contextId: 1,
      contextLabel: '공부방 상세',
      peerDisplayName: '대치맘',
      scopeBadge: '공개 프로필',
      scopeHint: '학부모 선연락 · 답장 free',
      showRequestInPanel: false,
      structuredLine: '중2 · 수학 · 대치동 · 주 2회 희망',
      lastPreview: '대치동 중2 수학 공부방 상담 가능할까요?',
      updatedAt: new Date(now.getTime() - 3600000).toISOString(),
      unread: true,
      initiatedByMe: false,
      initiatedByPeer: true,
      messages: [
        {
          id: 1,
          sender: 'peer',
          body: '안녕하세요, 대치동 중2 수학 공부방 상담 가능할까요? 주 2회 희망합니다.',
          createdAt: new Date(now.getTime() - 3600000).toISOString(),
        },
      ],
    },
    {
      id: nextId++,
      contextKind: 'student',
      contextId: 1,
      contextLabel: '학생 의뢰',
      peerDisplayName: '맑은하늘',
      scopeBadge: '구조화 항목만',
      scopeHint: '학생(학부모) 선연락 · 답장 free',
      showRequestInPanel: false,
      structuredLine: '중2 · 수학 · 예산 55만 · 대치동',
      lastPreview: '중2 수학 과외/공부방 문의드립니다.',
      updatedAt: new Date(now.getTime() - 7200000).toISOString(),
      unread: true,
      initiatedByMe: false,
      initiatedByPeer: true,
      messages: [
        {
          id: 1,
          sender: 'peer',
          body: '중2 수학 상담 문의드립니다. 대치동에서 주 2회 가능한지 궁금합니다.',
          createdAt: new Date(now.getTime() - 7200000).toISOString(),
        },
      ],
    },
    {
      id: nextId++,
      contextKind: 'tutor',
      contextId: 1,
      contextLabel: '과외 상세',
      peerDisplayName: '김학부모',
      scopeBadge: '공개 프로필',
      scopeHint: '공급자 상세 공개 범위',
      showRequestInPanel: false,
      structuredLine: '수학 · 중등 · 1:1',
      lastPreview: '상담 가능하신가요?',
      updatedAt: new Date(now.getTime() - 86400000).toISOString(),
      unread: false,
      initiatedByMe: false,
      initiatedByPeer: true,
      messages: [
        {
          id: 1,
          sender: 'peer',
          body: '상담 가능하신가요? 중2 수학입니다.',
          createdAt: new Date(now.getTime() - 86400000).toISOString(),
        },
        {
          id: 2,
          sender: 'me',
          body: '네, 주 2회 대치동 방문 가능합니다.',
          createdAt: new Date(now.getTime() - 82800000).toISOString(),
        },
      ],
    },
  ];
  saveAll(threads);
}
