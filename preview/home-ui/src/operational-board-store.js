/**
 * notice · faq · safe-guide — board_posts 운영 정본 + static seed fallback
 */
import { FAQ_ITEMS, GUIDE_ARTICLES, NOTICES as SEED_NOTICES } from './support/support-copy.js';
import {
  isBoardApiMode,
  getOperationalPostsCache,
  apiSaveOperationalPost,
  apiDeleteOperationalPost,
} from './board/board-backend.js';

function sortNotices(rows) {
  return [...rows].sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));
}

function sortFaq(rows) {
  return [...rows].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || String(a.id).localeCompare(String(b.id)));
}

function guideSort(a, b) {
  const pri = { primary: 0, secondary: 1 };
  const pa = pri[a.priority] ?? 9;
  const pb = pri[b.priority] ?? 9;
  return pa - pb || String(a.slug).localeCompare(String(b.slug));
}

/** @param {any} post */
function mapNoticePost(post) {
  return {
    id: post.id,
    date: post.date || post.createdAt,
    title: post.title,
    body: Array.isArray(post.body) ? post.body : [],
    pinned: Boolean(post.pinned),
  };
}

/** @param {any} post */
function mapFaqPost(post) {
  return {
    id: post.id,
    q: post.q || post.title,
    a: post.a || post.answer || post.description || '',
    category: post.categoryId || post.category || 'general',
    sortOrder: Number(post.sortOrder || 0),
  };
}

/** @param {any} post */
function mapGuidePost(post) {
  return {
    slug: post.slug || post.id,
    title: post.title,
    priority: post.priority || 'primary',
    audience: post.audience || '전체',
    body: Array.isArray(post.body) ? post.body : [],
    checklist: Array.isArray(post.checklist) ? post.checklist : [],
  };
}

function noticeSeed() {
  return SEED_NOTICES.map((n) => ({ ...n, body: [...n.body] }));
}

function faqSeed() {
  return FAQ_ITEMS.map((f, i) => ({
    id: `faq-${i + 1}`,
    q: f.q,
    a: f.a,
    category: 'general',
    sortOrder: (i + 1) * 10,
  }));
}

function guideSeed() {
  return GUIDE_ARTICLES.map((g) => ({
    slug: g.slug,
    title: g.title,
    priority: g.priority,
    audience: g.audience,
    body: [...g.body],
    checklist: g.checklist ? g.checklist.map((c) => ({ ...c })) : [],
  }));
}

function noticeSource() {
  if (isBoardApiMode()) {
    const apiRows = getOperationalPostsCache('notice').map(mapNoticePost);
    if (apiRows.length) return apiRows;
  }
  return noticeSeed();
}

function faqSource() {
  if (isBoardApiMode()) {
    const apiRows = getOperationalPostsCache('faq').map(mapFaqPost);
    if (apiRows.length) return apiRows;
  }
  return faqSeed();
}

function guideSource() {
  if (isBoardApiMode()) {
    const apiRows = getOperationalPostsCache('safe-guide').map(mapGuidePost);
    if (apiRows.length) return apiRows;
  }
  return guideSeed();
}

/** @returns {ReturnType<typeof mapNoticePost>[]} */
export function listNoticePosts() {
  return sortNotices(noticeSource());
}

/** @returns {ReturnType<typeof mapFaqPost>[]} */
export function listFaqPosts() {
  return sortFaq(faqSource());
}

/** @returns {ReturnType<typeof mapGuidePost>[]} */
export function listGuidePosts() {
  return guideSource().sort(guideSort);
}

/** @param {string} slug */
export function getGuidePost(slug) {
  return listGuidePosts().find((g) => g.slug === slug) || null;
}

/** @param {string} slug */
export function getRelatedGuidePosts(slug) {
  const current = getGuidePost(slug);
  if (!current) return [];
  return listGuidePosts().filter((g) => g.slug !== slug && g.priority === current.priority).slice(0, 3);
}

/** @param {Omit<ReturnType<typeof mapNoticePost>, 'id'> & { id?: string }} input */
export async function upsertNoticePost(input) {
  if (isBoardApiMode()) {
    return mapNoticePost(
      await apiSaveOperationalPost('notice', {
        id: input.id,
        title: input.title,
        date: input.date,
        body: input.body,
        status: 'published',
        author_role: 'admin',
      }),
    );
  }
  const id = input.id || `notice-${Date.now()}`;
  return { id, date: input.date, title: input.title.trim(), body: input.body.filter(Boolean), pinned: false };
}

/** @param {string} id */
export async function deleteNoticePost(id) {
  if (isBoardApiMode()) {
    await apiDeleteOperationalPost('notice', id, 'admin');
  }
}

export function isOperationalBoardApiActive() {
  return (
    isBoardApiMode() &&
    getOperationalPostsCache('notice').length +
      getOperationalPostsCache('faq').length +
      getOperationalPostsCache('safe-guide').length >
      0
  );
}
