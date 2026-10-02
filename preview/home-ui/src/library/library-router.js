/** 자료실 hash 라우트 + 정보 게시판(info-room · info-tutor · info-student). 예전 하위 주소(templates · guides)도 자료실 입구로 받는다. */

const LIBRARY_SECTIONS = ['', 'templates', 'guides'];

/** 정보 게시판 주소 → boardKey. #/library/<slug>[/new | /<postKey> | /<postKey>/edit] */
export const INFO_BOARD_SLUGS = Object.freeze({
  'room-info': 'info-room',
  'tutor-tips': 'info-tutor',
  'student-tips': 'info-student',
});

const POST_KEY_RE = /^[a-z0-9][a-z0-9-]*$/;

/** @typedef {{ slug: string, boardKey: string, basePath: string, view: 'list'|'detail'|'new'|'edit', postKey: string }} InfoBoardRoute */

/** @param {string} hashPath @returns {InfoBoardRoute|null} */
export function parseInfoBoardPath(hashPath) {
  const p = String(hashPath || '').startsWith('/') ? String(hashPath) : `/${hashPath || ''}`;
  const parts = p.split('/').filter(Boolean);
  if (parts[0] !== 'library' || parts.length < 2 || parts.length > 4) return null;
  const slug = parts[1];
  const boardKey = INFO_BOARD_SLUGS[slug];
  if (!boardKey) return null;
  const basePath = `/library/${slug}`;
  if (parts.length === 2) return { slug, boardKey, basePath, view: 'list', postKey: '' };
  const second = parts[2];
  if (parts.length === 3 && second === 'new') return { slug, boardKey, basePath, view: 'new', postKey: '' };
  if (second === 'new' || !POST_KEY_RE.test(second)) return null;
  if (parts.length === 3) return { slug, boardKey, basePath, view: 'detail', postKey: second };
  if (parts[3] === 'edit') return { slug, boardKey, basePath, view: 'edit', postKey: second };
  return null;
}

/** @param {string} hashPath */
export function isInfoBoardPath(hashPath) {
  return parseInfoBoardPath(hashPath) !== null;
}

/** @param {string} hashPath */
export function normalizeLibraryPath(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (p === '/library' || p === '/library/') return '/library';
  const parts = p.split('/').filter(Boolean);
  if (parts[0] !== 'library') return null;
  if (parts.length === 1) return '/library';
  if (parts.length === 2 && LIBRARY_SECTIONS.includes(parts[1])) return `/library/${parts[1]}`;
  if (isInfoBoardPath(p)) return `/${parts.join('/')}`;
  return null;
}

export function getDefaultLibraryPath() {
  return '/library';
}
