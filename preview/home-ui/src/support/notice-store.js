/** 공지 — board_posts(notice) 정본 우선 · legacy support API · sessionStorage dev fallback */

import { listNoticePosts, upsertNoticePost, deleteNoticePost } from '../operational-board-store.js';
import {
  isSupportApiMode,
  getNoticesCache,
  apiSaveNotice,
  apiDeleteNotice,
  apiResetNoticeSeed,
} from './support-backend.js';
import { isOperationalBoardApiActive } from '../operational-board-store.js';

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

/** @returns {SupportNotice[]} */
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
  const next = {
    id,
    date: input.date,
    title: input.title.trim(),
    body: input.body.filter(Boolean),
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

export async function resetNoticesToSeed() {
  if (isSupportApiMode()) {
    await apiResetNoticeSeed();
    return;
  }
  saveAll(listNoticePosts());
}
