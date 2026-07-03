/** 16장 P16-xx — hash 경로 (부록 A, 미확정) */

/** @typedef {'P16-01'|'P16-02'|'P16-03'|'P16-04'} MessagesScreenId */
/** @typedef {'inbox'|'sent'|'active'} MessagesListTab */

/** @type {MessagesListTab[]} */
export const MESSAGES_TABS = ['inbox', 'sent', 'active'];

/** @type {Record<string, MessagesScreenId>} */
export const MESSAGES_PATH_TO_SCREEN = {
  '/messages': 'P16-01',
  '/messages/inbox': 'P16-01',
  '/messages/sent': 'P16-01',
  '/messages/active': 'P16-01',
};

/** @param {string} hashPath */
export function normalizeMessagesPath(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (p === '/messages' || p === '/messages/') return '/messages/inbox';
  if (MESSAGES_PATH_TO_SCREEN[p]) return p;
  const threadMatch = p.match(/^\/messages\/thread\/(\d+)$/);
  if (threadMatch) return p;
  return null;
}

export function getDefaultMessagesPath() {
  return '/messages/inbox';
}

/** @param {string} path */
export function getListTabFromPath(path) {
  if (path === '/messages/sent') return 'sent';
  if (path === '/messages/active') return 'active';
  return 'inbox';
}

/** @param {string} path */
export function getScreenIdForPath(path) {
  if (path.startsWith('/messages/thread/')) return 'P16-02';
  return MESSAGES_PATH_TO_SCREEN[path] || 'P16-01';
}

/** @param {MessagesScreenId} screenId */
export function screenTitle(screenId) {
  const map = {
    'P16-01': '쪽지함',
    'P16-02': '대화방',
    'P16-03': '첫 메모 보내기',
    'P16-04': '유료등록 게이트',
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
  if (tab === 'sent') return '/messages/sent';
  if (tab === 'active') return '/messages/active';
  return '/messages/inbox';
}

/** @param {string} path */
export function parseThreadId(path) {
  const m = path.match(/^\/messages\/thread\/(\d+)$/);
  return m ? Number(m[1]) : null;
}
