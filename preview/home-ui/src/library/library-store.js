import { canBoardAction, getBoardPolicy, mapNavRoleToBoardRole } from '../board-engine-copy.js';

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



/** @param {string} boardKey @param {string} navRole */

export function canDownloadFromBoard(boardKey, navRole) {

  const boardRole = mapNavRoleToBoardRole(navRole);

  return canBoardAction(boardKey, 'download', boardRole);

}



/** @param {string} boardKey @param {string} navRole */

export function getLibraryBoardMeta(boardKey, navRole) {

  const policy = getBoardPolicy(boardKey);

  const boardRole = mapNavRoleToBoardRole(navRole);

  if (!policy) return null;

  return {

    policy,

    canRead: canBoardAction(boardKey, 'read', boardRole),

    canDownload: canBoardAction(boardKey, 'download', boardRole),

    boardRole,

  };

}

