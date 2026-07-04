/** 16장 P16-xx — hash 경로 (마이페이지 우측 본문, 부록 A) */

/** @typedef {'P16-01'|'P16-02'|'P16-03'|'P16-04'} MessagesScreenId */
/** @typedef {'inbox'|'sent'|'active'} MessagesListTab */

export const MESSAGES_BASE = '/mypage/messages';

/** @type {MessagesListTab[]} */
export const MESSAGES_TABS = ['inbox', 'sent', 'active'];

/** @param {string} p */
function mapLegacyPath(p) {
  if (p === '/messages' || p === '/messages/') return `${MESSAGES_BASE}/inbox`;
  if (p === '/messages/inbox') return `${MESSAGES_BASE}/inbox`;
  if (p === '/messages/sent') return `${MESSAGES_BASE}/sent`;
  if (p === '/messages/active') return `${MESSAGES_BASE}/active`;
  const m = p.match(/^\/messages\/thread\/(\d+)$/);
  if (m) return `${MESSAGES_BASE}/thread/${m[1]}`;
  return null;
}

/** @param {string} hashPath */
export function normalizeMessagesPath(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  const legacy = mapLegacyPath(p);
  if (legacy) return legacy;
  if (p === MESSAGES_BASE || p === `${MESSAGES_BASE}/`) return MESSAGES_BASE;
  if (
    p === `${MESSAGES_BASE}/inbox` ||
    p === `${MESSAGES_BASE}/sent` ||
    p === `${MESSAGES_BASE}/active`
  ) {
    return p;
  }
  const threadMatch = p.match(/^\/mypage\/messages\/thread\/(\d+)$/);
  if (threadMatch) return p;
  return null;
}

/** P15-08 요약이 아닌 16장 본문 경로 */
export function isMessagesDetailPath(path) {
  const n = normalizeMessagesPath(path);
  return !!n && n !== MESSAGES_BASE;
}

export function getDefaultMessagesPath() {
  return `${MESSAGES_BASE}/inbox`;
}

/** @param {string} path */
export function getListTabFromPath(path) {
  if (path.endsWith('/sent')) return 'sent';
  if (path.endsWith('/active')) return 'active';
  return 'inbox';
}

/** @param {string} path */
export function getScreenIdForPath(path) {
  if (path.includes('/thread/')) return 'P16-02';
  if (isMessagesDetailPath(path)) return 'P16-01';
  return 'P15-08';
}

/** @param {MessagesScreenId} screenId */
export function screenTitle(screenId) {
  const map = {
    'P16-01': '쪽지함',
    'P16-02': '대화방',
    'P16-03': '첫 메모 보내기',
    'P16-04': '유료등록 게이트',
    'P15-08': '쪽지',
  };
  return map[screenId] || '쪽지함';
}

/** @param {MessagesListTab} tab */
export function tabLabel(tab) {
  const map = { inbox: '받은', sent: '보낸', active: '진행중' };
  return map[tab] || tab;
}

/** @param {MessagesListTab} tab */
export function tabPath(tab) {
  if (tab === 'sent') return `${MESSAGES_BASE}/sent`;
  if (tab === 'active') return `${MESSAGES_BASE}/active`;
  return `${MESSAGES_BASE}/inbox`;
}

/** @param {number} id */
export function threadPath(id) {
  return `${MESSAGES_BASE}/thread/${id}`;
}

/** @param {string} path */
export function parseThreadId(path) {
  const m = path.match(/\/messages\/thread\/(\d+)$/);
  return m ? Number(m[1]) : null;
}
