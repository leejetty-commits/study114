import { canBoardAction, getBoardPolicy, mapNavRoleToBoardRole } from '../board-engine-copy.js';
import { canDownloadBoard } from '../board-channel-acl.js';
import { isBoardApiMode, getLibraryPostsCache } from '../board/board-backend.js';
import { LIBRARY_SEED } from './library-copy.js';

/** @param {any} post */
function mapApiPostToLibraryItem(post) {
  return {
    id: post.id,
    boardKey: post.boardKey,
    title: post.title,
    summary: post.description || '',
    format: post.format || 'FILE',
    audience: Array.isArray(post.audience) && post.audience.length ? post.audience : ['all'],
    section: post.section || 'library',
    fileLabel: post.fileLabel || '',
  };
}

function getLibrarySource() {
  if (isBoardApiMode()) {
    const apiItems = getLibraryPostsCache().map(mapApiPostToLibraryItem);
    if (apiItems.length) return apiItems;
  }
  return LIBRARY_SEED;
}

/** @param {'library'|'templates'|'guides'} section @param {string} navRole guest|parent|study_room|tutor */
export function listLibraryItems(section, navRole = 'guest') {
  const boardRole = mapNavRoleToBoardRole(navRole);
  const audienceRole = navRole === 'guest' ? 'all' : navRole;
  const source = getLibrarySource();

  return source.filter((item) => {
    if (section !== 'library' && item.section !== section) return false;
    if (!canBoardAction(item.boardKey, 'read', boardRole)) return false;
    if (audienceRole === 'all') return true;
    return item.audience.includes('all') || item.audience.includes(audienceRole);
  });
}

/** @param {string} id */
export function getLibraryItem(id) {
  return getLibrarySource().find((item) => item.id === id) || null;
}

/** 실파일 미연결 — 항상 false */
export function canDownloadFromBoard(boardKey, navRole) {
  return canDownloadBoard(boardKey, navRole);
}

export function libraryDownloadControlHtml() {
  return `<button type="button" class="btn btn--secondary btn--sm lib-card__dl" disabled title="파일 다운로드는 준비 중입니다">다운로드 · 준비 중</button>`;
}

/** @param {string} boardKey @param {string} navRole */
export function getLibraryBoardMeta(boardKey, navRole) {
  const policy = getBoardPolicy(boardKey);
  const boardRole = mapNavRoleToBoardRole(navRole);
  if (!policy) return null;
  return {
    policy,
    canRead: canBoardAction(boardKey, 'read', boardRole),
    canDownload: canDownloadBoard(boardKey, navRole),
    boardRole,
  };
}
