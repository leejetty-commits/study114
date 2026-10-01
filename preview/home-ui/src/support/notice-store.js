/** 공지 — board_posts(notice) 정본. 대상 역할 필터는 서버 세션으로만 판단한다. */

import { listNoticePosts, upsertNoticePost, deleteNoticePost, listNoticeCenterPosts, listNoticeHomePosts } from '../operational-board-store.js';
import {
  isSupportApiMode,
  getNoticesCache,
  apiSaveNotice,
  apiDeleteNotice,
  apiResetNoticeSeed,
} from './support-backend.js';
import { isOperationalBoardApiActive } from '../operational-board-store.js';
import { isBoardApiMode } from '../board/board-backend.js';

const KEY = 'study114-support-notices-v1';

/** @returns {SupportNotice[]} */
function loadAll() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data.notices) ? data.notices : [];
  } catch {
    return [];
  }
}

/** @param {SupportNotice[]} notices */
function saveAll(notices) {
  sessionStorage.setItem(KEY, JSON.stringify({ notices }));
}

function seedIfEmpty() {
  if (loadAll().length) return;
  saveAll(listNoticePosts());
}

/**
 * @typedef {object} SupportNotice
 * @property {string} id
 * @property {string} date
 * @property {string} title
 * @property {string[]} body
 */

/** 전체 공지 (관리자 목록용, 필터 없음) @returns {SupportNotice[]} */
export function listNotices() {
  if (isOperationalBoardApiActive()) {
    return listNoticePosts();
  }
  if (isSupportApiMode()) {
    return getNoticesCache();
  }
  seedIfEmpty();
  return loadAll().sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

/** 고객센터용 (서버 세션 역할 필터 적용) @returns {SupportNotice[]} */
export function listNoticesForCenter() {
  if (isBoardApiMode()) return listNoticeCenterPosts();
  return [];
}

/** 홈 3줄용 (서버 세션 역할 필터 + limit 적용, 클라이언트 폴백 없음) @returns {SupportNotice[]} */
export function listNoticesForHome() {
  if (isBoardApiMode()) return listNoticeHomePosts();
  return [];
}

/** @param {Omit<SupportNotice, 'id'> & { id?: string }} input */
export async function upsertNotice(input) {
  if (isOperationalBoardApiActive()) {
    return upsertNoticePost(input);
  }
  if (isSupportApiMode()) {
    return apiSaveNotice(input);
  }
  seedIfEmpty();
  const notices = loadAll();
  const id = input.id || `notice-${Date.now()}`;
  const targetRole = input.target_role || input.targetRole || 'all';
  const next = {
    id,
    date: input.date,
    title: input.title.trim(),
    body: input.body.filter(Boolean),
    targetRole,
    targetLabel: TARGET_ROLE_LABELS[targetRole] || '전체',
  };
  const idx = notices.findIndex((n) => n.id === id);
  if (idx >= 0) notices[idx] = next;
  else notices.unshift(next);
  saveAll(notices);
  return next;
}

/** @param {string} id */
export async function deleteNotice(id) {
  if (isOperationalBoardApiActive()) {
    await deleteNoticePost(id);
    return;
  }
  if (isSupportApiMode()) {
    await apiDeleteNotice(id);
    return;
  }
  seedIfEmpty();
  saveAll(loadAll().filter((n) => n.id !== id));
}

const TARGET_ROLE_LABELS = { all: '전체', study_room: '공부방', tutor: '과외쌤', student: '학생' };

export function noticeTargetLabel(notice) {
  return TARGET_ROLE_LABELS[notice?.targetRole] || '전체';
}

export async function resetNoticesToSeed() {
  if (isSupportApiMode()) {
    await apiResetNoticeSeed();
    return;
  }
  saveAll(listNoticePosts());
}
