/** 15장 §6 최근열람 — API 모드 또는 sessionStorage `[임시]` */

import {
  isHandoffApiMode,
  getRecentCache,
  optimisticRecordRecent,
  optimisticPatchRecent,
} from '../handoff-backend.js';

const KEY = 'study114-preview-recent-views';
const MAX = 30;

/** @typedef {{ kind: 'study_room'|'tutor'|'student', id: number, title: string, viewedAt: string, lastRoute?: string|null, lastAction?: string }} RecentEntry */

function loadAll() {
  if (isHandoffApiMode()) return getRecentCache();
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(list) {
  if (isHandoffApiMode()) return;
  sessionStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

/**
 * @param {'study_room'|'tutor'|'student'} kind
 * @param {number|string} id
 * @param {{ lastRoute?: string, lastAction?: string }} opts
 */
export function patchRecentHandoff(kind, id, opts) {
  const numId = Number(id);
  if (isHandoffApiMode()) {
    optimisticPatchRecent(kind, numId, opts);
    return;
  }
  const list = loadAll();
  const idx = list.findIndex((e) => e.kind === kind && e.id === numId);
  if (idx < 0) return;
  const entry = {
    ...list[idx],
    lastRoute: opts.lastRoute ?? list[idx].lastRoute,
    lastAction: opts.lastAction ?? list[idx].lastAction,
    viewedAt: new Date().toISOString(),
  };
  list.splice(idx, 1);
  list.unshift(entry);
  saveAll(list);
}

/**
 * @param {'study_room'|'tutor'|'student'} kind
 * @param {number|string} id
 * @param {string} title
 * @param {{ lastRoute?: string, sourceRoute?: string, lastAction?: string }} [opts]
 */
export function recordRecentView(kind, id, title, opts = {}) {
  const entry = {
    kind,
    id: Number(id),
    title: String(title),
    viewedAt: new Date().toISOString(),
    lastRoute: opts.lastRoute || opts.sourceRoute || null,
    lastAction: opts.lastAction || 'view_detail',
  };
  if (isHandoffApiMode()) {
    optimisticRecordRecent(kind, entry.id, entry.title, {
      lastRoute: entry.lastRoute,
      lastAction: entry.lastAction,
    });
    return;
  }
  const list = loadAll().filter((e) => !(e.kind === kind && e.id === entry.id));
  list.unshift(entry);
  saveAll(list);
}

/** @param {'parent'|'study_room'|'tutor'} role */
export function getRecentViews(role) {
  const all = /** @type {RecentEntry[]} */ (loadAll());
  if (role === 'parent') {
    return all.filter((e) => e.kind === 'study_room' || e.kind === 'tutor');
  }
  return all;
}

/** Seed demo data once — API 모드 시 스킵 */
export function ensureRecentDemo() {
  if (isHandoffApiMode()) return;
  if (loadAll().length > 0) return;
  recordRecentView('study_room', 1, '대치 우등생 공부방', { sourceRoute: 'search', lastAction: 'view_detail' });
  recordRecentView('study_room', 4, '드림스터디 대치', { sourceRoute: 'search', lastAction: 'compare_add' });
  recordRecentView('study_room', 10, '아이빌 공부방', { sourceRoute: 'mypage', lastAction: 'view_detail' });
  recordRecentView('tutor', 1, '김수학', { sourceRoute: 'search', lastAction: 'wish_add' });
  recordRecentView('tutor', 3, '박국어', { sourceRoute: 'wishlist', lastAction: 'view_detail' });
  recordRecentView('tutor', 7, '오영어', { sourceRoute: 'mypage', lastAction: 'view_detail' });
}
