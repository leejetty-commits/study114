/** 커뮤니티 라우터 — path /community/* (동적 보드 slug) */

import { listCommunityBoards, getCommunityBoardBySlug } from './copy.js';

export function getDefaultCommunityPath() {
  const boards = listCommunityBoards();
  const first = boards.find((b) => b.slug !== 'solved') || boards[0];
  return first?.path || '/community/director';
}

/** @deprecated */
export const getDefaultConcernPath = getDefaultCommunityPath;

function boardSlugPattern() {
  const slugs = listCommunityBoards().map((b) => b.slug).filter(Boolean);
  if (!slugs.length) return 'director|tutor|parent|solved';
  return slugs.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
}

export function normalizeCommunityPath(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (p === '/community' || p === '/community/') return getDefaultCommunityPath();
  const m = p.match(new RegExp(`^/community/(${boardSlugPattern()})(?:\\/(new|[^/]+))?$`));
  if (!m) return null;
  const board = getCommunityBoardBySlug(m[1]);
  if (!board) return null;
  if (!m[2]) return board.path;
  if (m[2] === 'new') return `${board.path}/new`;
  return `${board.path}/${m[2]}`;
}

/** legacy /concern → /community */
export function normalizeConcernPath(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (p === '/concern' || p === '/concern/') return getDefaultCommunityPath();
  const legacy = p.match(/^\/concern\/([^/]+)(?:\/(new|[^/]+))?$/);
  if (!legacy) return normalizeCommunityPath(p);
  const mapped = p.replace(/^\/concern/, '/community');
  return normalizeCommunityPath(mapped);
}

export function getCommunityView(path) {
  const normalized = normalizeCommunityPath(path) || getDefaultCommunityPath();
  const parts = normalized.split('/').filter(Boolean);
  const slug = parts[1];
  const board = getCommunityBoardBySlug(slug);
  if (!board) {
    const fallback = getCommunityBoardBySlug(getDefaultCommunityPath().split('/')[2]);
    return fallback ? { kind: 'list', board: fallback } : { kind: 'list', board: listCommunityBoards()[0] };
  }
  if (parts[2] === 'new') return { kind: 'compose', board };
  if (parts[2]) return { kind: 'detail', board, postId: parts[2] };
  return { kind: 'list', board };
}

export const getConcernView = getCommunityView;

export function communityBoardNav(currentPath) {
  const pathOnly = currentPath.split('?')[0];
  return listCommunityBoards().map((b) => ({
    ...b,
    active: pathOnly === b.path || pathOnly.startsWith(`${b.path}/`),
  }));
}

export const concernBoardNav = communityBoardNav;
