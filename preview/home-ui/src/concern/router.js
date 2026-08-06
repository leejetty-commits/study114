/** 커뮤니티 라우터 — path /community/* (동적 보드 slug) */

import { listCommunityBoards, getCommunityBoardBySlug } from './copy.js';

export function getDefaultCommunityPath() {
  return '/community';
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
  if (p === '/community' || p === '/community/') return '/community';
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
  if (p === '/concern' || p === '/concern/') return '/community';
  const legacy = p.match(/^\/concern\/([^/]+)(?:\/(new|[^/]+))?$/);
  if (!legacy) return normalizeCommunityPath(p);
  const mapped = p.replace(/^\/concern/, '/community');
  return normalizeCommunityPath(mapped);
}

export function getCommunityView(path) {
  const normalized = normalizeCommunityPath(path) || '/community';
  if (normalized === '/community') return { kind: 'hub' };
  const parts = normalized.split('/').filter(Boolean);
  const slug = parts[1];
  const board = getCommunityBoardBySlug(slug);
  if (!board) return { kind: 'hub' };
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
