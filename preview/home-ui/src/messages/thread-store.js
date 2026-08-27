/** 16장 thread · message — sessionStorage `[임시]` · Dev 로그인 시 API (DDL 014) */



const KEY = 'study114-preview-message-threads-v2';

let nextId = 1;



import {

  isMessagesApiMode,

  getThreadsCache,

  getThreadFromCache,

  apiFindOrCreateThread,

  apiAppendMessage,

  apiMarkThreadRead,

  apiHydrateThreadDetail,

  apiThreadModeration,

} from '../messages-backend.js';



/**

 * @typedef {object} ThreadAttachment
 * @property {number} id
 * @property {string} originalName
 * @property {number} sizeBytes
 * @property {string} [mimeType]
 */

/**

 * @typedef {object} ThreadMessage

 * @property {number} id

 * @property {'me'|'peer'} sender

 * @property {string} body

 * @property {string} createdAt
 * @property {boolean} [readByPeer]
 * @property {ThreadAttachment[]} [attachments]

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
 * @property {boolean} [peerUnread]
 * @property {boolean} isImportant
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
      isImportant: !!t.isImportant,
      peerUnread: t.peerUnread ?? lastMessageIsMine(t),

    }));

  } catch {

    return [];

  }

}



function saveAll(threads) {

  sessionStorage.setItem(KEY, JSON.stringify({ threads }));

}

/** @param {File[]|FileList|undefined} files */
function localAttachmentMeta(files) {
  return Array.from(files || []).map((file) => ({
    id: 0,
    originalName: file.name,
    sizeBytes: file.size,
    mimeType: file.type || 'application/octet-stream',
  }));
}

/** @param {string} body @param {File[]|FileList|undefined} files */
function previewFromBodyOrFiles(body, files) {
  const text = String(body || '').trim();
  if (text) return text.slice(0, 80);
  const name = files?.[0]?.name;
  return name ? `첨부 ${name}` : '첨부 파일';
}

function lastMessageIsMine(thread) {
  const msgs = thread?.messages || [];
  if (!msgs.length) return false;
  return msgs[msgs.length - 1].sender === 'me';
}

/** @returns {MessageThread[]} */

export function getThreads() {

  if (isMessagesApiMode()) return getThreadsCache();

  return loadAll();

}



/** @param {number} id */

export function getThread(id) {

  if (isMessagesApiMode()) return getThreadFromCache(id);

  return loadAll().find((t) => t.id === id) || null;

}



/** @param {number} id @returns {Promise<MessageThread|null>} */

export async function ensureThreadDetail(id) {

  if (!isMessagesApiMode()) return getThread(id);

  const cached = getThreadFromCache(id);

  if (cached?.messages?.length) return cached;

  try {

    return await apiHydrateThreadDetail(id);

  } catch {

    return cached;

  }

}



/** @param {number} id */

export function markThreadRead(id) {

  if (isMessagesApiMode()) {

    apiMarkThreadRead(id);

    return;

  }

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

  const all = isMessagesApiMode() ? getThreadsCache() : loadAll();
  const sorted = [...all].sort((a, b) => {
    const ia = a.isImportant ? 1 : 0;
    const ib = b.isImportant ? 1 : 0;
    if (ib !== ia) return ib - ia;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  if (tab === 'all' || tab === 'list') return sorted;

  const cutoff = Date.now() - activeDays * 86400000;

  if (tab === 'archive') return sorted.filter((t) => t.isArchived);

  const visible = sorted.filter((t) => !t.isArchived);

  if (tab === 'sent') return visible.filter((t) => t.initiatedByMe);

  if (tab === 'active') {
    return visible.filter((t) => new Date(t.updatedAt).getTime() >= cutoff);
  }

  return visible.filter((t) => !t.initiatedByMe || t.unread);

}



export function getUnreadCount() {

  const all = isMessagesApiMode() ? getThreadsCache() : loadAll();

  return all.filter((t) => t.unread).length;

}



export function getActiveCount() {

  const cutoff = Date.now() - 7 * 86400000;

  const all = isMessagesApiMode() ? getThreadsCache() : loadAll();

  return all.filter((t) => new Date(t.updatedAt).getTime() >= cutoff).length;

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

 * @returns {Promise<MessageThread>}

 */

export async function findOrCreateThread(input) {

  if (isMessagesApiMode()) {

    return apiFindOrCreateThread(input);

  }



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

      readByPeer: false,

      attachments: localAttachmentMeta(input.files),

    });

    existing.lastPreview = previewFromBodyOrFiles(input.body, input.files);

    existing.updatedAt = new Date().toISOString();

    existing.initiatedByMe = true;

    existing.initiatedByPeer = existing.messages.some((m) => m.sender === 'peer');

    existing.unread = false;

    existing.peerUnread = true;

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

    lastPreview: previewFromBodyOrFiles(input.body, input.files),

    firstPreview: previewFromBodyOrFiles(input.body, input.files),

    updatedAt: new Date().toISOString(),

    unread: false,

    peerUnread: true,

    isImportant: false,

    initiatedByMe: true,

    initiatedByPeer: false,

    messages: [{
      id: 1,
      sender: 'me',
      body: input.body,
      createdAt: new Date().toISOString(),
      readByPeer: false,
      attachments: localAttachmentMeta(input.files),
    }],

  };

  threads.unshift(thread);

  saveAll(threads);

  return thread;

}



/** @param {number} id @param {string} body @param {File[]} [files] @returns {Promise<MessageThread|null>} */
export async function appendMessageToThread(id, body, files = []) {
  if (isMessagesApiMode()) {
    return apiAppendMessage(id, body, files);
  }

  const threads = loadAll();
  const t = threads.find((x) => x.id === id);
  if (!t) return null;
  t.messages.push({
    id: t.messages.length + 1,
    sender: 'me',
    body,
    createdAt: new Date().toISOString(),
    readByPeer: false,
    attachments: localAttachmentMeta(files),
  });
  t.lastPreview = previewFromBodyOrFiles(body, files);
  t.updatedAt = new Date().toISOString();
  t.unread = false;
  t.peerUnread = true;
  t.initiatedByMe = true;
  saveAll(threads);
  return t;
}



/** @param {number} id @param {boolean} archived */
export async function setThreadArchived(id, archived = true) {
  if (isMessagesApiMode()) {
    const data = await apiThreadModeration(id, archived ? 'archive' : 'unarchive');
    return data.thread ?? getThreadFromCache(id);
  }
  const threads = loadAll();
  const t = threads.find((x) => x.id === id);
  if (!t) return null;
  t.isArchived = archived;
  saveAll(threads);
  return t;
}

const IMPORTANT_MAX = 5;

/** @param {number} id @param {boolean} important */
export async function setThreadImportant(id, important = true) {
  if (isMessagesApiMode()) {
    const data = await apiThreadModeration(id, important ? 'important' : 'unimportant');
    return data.thread ?? getThreadFromCache(id);
  }
  const threads = loadAll();
  const t = threads.find((x) => x.id === id);
  if (!t) return null;
  if (important && !t.isImportant) {
    const n = threads.filter((x) => x.isImportant).length;
    if (n >= IMPORTANT_MAX) {
      const err = new Error('중요 표시는 최대 5개까지 할 수 있습니다.');
      err.code = 'validation';
      throw err;
    }
  }
  t.isImportant = important;
  saveAll(threads);
  return t;
}

/** @param {number} id @param {string} [reason] */
export async function setThreadBlocked(id, reason = '차단됨') {
  if (isMessagesApiMode()) {
    const data = await apiThreadModeration(id, 'block', { reason });
    return data.thread ?? getThreadFromCache(id);
  }
  const threads = loadAll();
  const t = threads.find((x) => x.id === id);
  if (!t) return null;
  t.isBlocked = true;
  t.blockReason = reason;
  saveAll(threads);
  return t;
}

/** @param {number} id @param {string} reason */
export async function setThreadReported(id, reason) {
  if (isMessagesApiMode()) {
    const data = await apiThreadModeration(id, 'report', { reason });
    return data.thread ?? getThreadFromCache(id);
  }
  const threads = loadAll();
  const t = threads.find((x) => x.id === id);
  if (!t) return null;
  t.reportedAt = new Date().toISOString();
  saveAll(threads);
  return t;
}



export function ensureDemoThreads() {

  if (isMessagesApiMode()) return;

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

      scopeHint: '학부모가 먼저 보낸 쪽지 · 답장 무료',

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

      scopeHint: '학생(학부모)이 먼저 보낸 쪽지 · 답장 무료',

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

      peerUnread: true,

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

          body: '네, 주 2회 대치동 방문 가능합니다. 사업자등록증을 첨부합니다.',

          createdAt: new Date(now.getTime() - 82800000).toISOString(),

          readByPeer: false,

          attachments: [{ id: 0, originalName: '사업자등록증.pdf', sizeBytes: 420000, mimeType: 'application/pdf' }],

        },

      ],

    },

  ];

  saveAll(threads);

}


