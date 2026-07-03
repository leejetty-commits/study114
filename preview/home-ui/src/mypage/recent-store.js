/** 15장 §6 최근열람 — 프리뷰 sessionStorage `[임시]` */

const KEY = 'study114-preview-recent-views';
const MAX = 30;

/** @typedef {{ kind: 'study_room'|'tutor'|'student', id: number, title: string, viewedAt: string }} RecentEntry */

function loadAll() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(list) {
  sessionStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

/**
 * @param {'study_room'|'tutor'|'student'} kind
 * @param {number|string} id
 * @param {string} title
 */
export function recordRecentView(kind, id, title) {
  const entry = {
    kind,
    id: Number(id),
    title: String(title),
    viewedAt: new Date().toISOString(),
  };
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

/** Seed demo data once */
export function ensureRecentDemo() {
  if (loadAll().length > 0) return;
  recordRecentView('study_room', 1, '대치 우등생 공부방');
  recordRecentView('tutor', 1, '김수학');
}
