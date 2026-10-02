/**
 * notice · faq · safe-guide — board_posts 운영 정본 + static seed fallback
 */
import { FAQ_ITEMS, FAQ_TABS, GUIDE_ARTICLES, NOTICES as SEED_NOTICES } from './support/support-copy.js';
import {
  isBoardApiMode,
  getOperationalPostsCache,
  apiSaveOperationalPost,
  apiDeleteOperationalPost,
  getNoticeCenterPosts,
  getNoticeHomePosts,
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

const TARGET_ROLE_LABELS = { all: '전체', study_room: '공부방', tutor: '과외쌤', student: '학생' };

/** @param {any} post */
function mapNoticePost(post) {
  const meta = post.meta && typeof post.meta === 'object' ? post.meta : {};
  const targetRole = post.targetRole || meta.targetRole || 'all';
  return {
    id: post.id,
    date: post.date || post.createdAt,
    title: post.title,
    body: Array.isArray(post.body) ? post.body : [],
    pinned: Boolean(post.pinned),
    targetRole,
    targetLabel: TARGET_ROLE_LABELS[targetRole] || '전체',
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
  const slug = String(post.slug || post.id || '').trim();
  return {
    id: String(post.id || slug),
    slug,
    title: post.title,
    priority: post.priority || 'primary',
    audience: post.audience || '전체',
    body: Array.isArray(post.body) ? post.body : [],
    checklist: Array.isArray(post.checklist) ? post.checklist : [],
    related: Array.isArray(post.related) ? post.related : [],
  };
}

function noticeSeed() {
  return SEED_NOTICES.map((n) => ({ ...n, body: [...n.body] }));
}

const FAQ_TAB_SLUGS = new Set(FAQ_TABS.map((t) => t.slug));

function faqSeed() {
  return FAQ_ITEMS.map((f, i) => ({
    id: `faq-${i + 1}`,
    q: f.q,
    a: f.a,
    category: FAQ_TAB_SLUGS.has(f.category) ? f.category : 'join',
    sortOrder: (i + 1) * 10,
  }));
}

function guideSeed() {
  return GUIDE_ARTICLES.map((g) => ({
    id: g.slug,
    slug: g.slug,
    title: g.title,
    priority: g.priority,
    audience: g.audience,
    body: [...g.body],
    checklist: g.checklist ? g.checklist.map((c) => ({ ...c })) : [],
    related: Array.isArray(g.related) ? [...g.related] : [],
  }));
}

function noticeSource() {
  if (isBoardApiMode()) {
    const apiRows = getOperationalPostsCache('notice').map(mapNoticePost);
    if (apiRows.length) return apiRows;
  }
  return noticeSeed();
}

/**
 * 같은 키의 서버 글이 있으면 시드를 덮는다. 서버에 없는 시드는 남긴다.
 * 서버 목록이 비었거나 API가 꺼져 있으면 시드만 쓴다.
 *
 * @template T
 * @param {T[]} seedRows
 * @param {T[]} apiRows
 * @param {(row: T) => string} keyOf
 */
function overlayByKey(seedRows, apiRows, keyOf) {
  const map = new Map();
  for (const row of seedRows) {
    map.set(keyOf(row), row);
  }
  const extras = [];
  for (const row of apiRows) {
    const key = keyOf(row);
    if (!key) continue;
    if (map.has(key)) map.set(key, row);
    else extras.push(row);
  }
  return [...map.values(), ...extras];
}

function faqSource() {
  const seed = faqSeed();
  if (!isBoardApiMode()) return seed;
  const apiRows = getOperationalPostsCache('faq').map(mapFaqPost);
  if (!apiRows.length) return seed;
  return overlayByKey(seed, apiRows, (row) => row.id);
}

function guideSource() {
  const seed = guideSeed();
  if (!isBoardApiMode()) return seed;
  const apiRows = getOperationalPostsCache('safe-guide').map(mapGuidePost);
  if (!apiRows.length) return seed;
  return overlayByKey(seed, apiRows, (row) => row.slug);
}

export function isSeedFaqId(id) {
  return faqSeed().some((row) => row.id === id);
}

export function isSeedGuideSlug(slug) {
  return guideSeed().some((row) => row.slug === slug);
}

/** @returns {ReturnType<typeof mapNoticePost>[]} */
export function listNoticePosts() {
  return sortNotices(noticeSource());
}

/** @returns {ReturnType<typeof mapFaqPost>[]} */
export function listFaqPosts() {
  return sortFaq(faqSource());
}

/** 분류에 없는 추가 질문은 가입·로그인에 두어 목록에서 빠지지 않게 한다. */
function faqTabOf(category) {
  return FAQ_TAB_SLUGS.has(category) ? category : 'join';
}

/** @param {string} slug */
export function listFaqPostsByTab(slug) {
  const tab = faqTabOf(slug);
  return listFaqPosts().filter((f) => faqTabOf(f.category) === tab);
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
  if (Array.isArray(current.related) && current.related.length) {
    return current.related
      .map((id) => getGuidePost(id))
      .filter(Boolean)
      .slice(0, 3);
  }
  return listGuidePosts().filter((g) => g.slug !== slug && g.priority === current.priority).slice(0, 3);
}

/** @param {Omit<ReturnType<typeof mapNoticePost>, 'id'> & { id?: string, target_role?: string }} input */
export async function upsertNoticePost(input) {
  if (isBoardApiMode()) {
    return mapNoticePost(
      await apiSaveOperationalPost('notice', {
        id: input.id,
        title: input.title,
        date: input.date,
        body: input.body,
        target_role: input.target_role || input.targetRole || 'all',
        status: 'published',
        author_role: 'admin',
      }),
    );
  }
  const id = input.id || `notice-${Date.now()}`;
  const targetRole = input.target_role || input.targetRole || 'all';
  return { id, date: input.date, title: input.title.trim(), body: input.body.filter(Boolean), pinned: false, targetRole, targetLabel: TARGET_ROLE_LABELS[targetRole] || '전체' };
}

/** @param {string} id */
export async function deleteNoticePost(id) {
  if (isBoardApiMode()) {
    await apiDeleteOperationalPost('notice', id, 'admin');
  }
}

/** @param {{ id?: string, q: string, a: string, category?: string, sortOrder?: number }} input */
export async function upsertFaqPost(input) {
  if (!isBoardApiMode()) {
    throw new Error('board_posts API가 활성화되지 않았습니다. (관리자 로그인 필요)');
  }
  const id = String(input.id || '').trim();
  const cached = id
    ? getOperationalPostsCache('faq').find((row) => row.id === id)
    : null;
  const payload = {
    title: input.q,
    answer: input.a,
    category_id: input.category || cached?.categoryId || cached?.category || 'join',
    sortOrder: Number(input.sortOrder || 0),
    status: 'published',
    author_role: 'admin',
  };
  if (cached?.id) {
    payload.id = cached.id;
    payload.post_key = cached.id;
  } else if (id) {
    payload.id = id;
    payload.post_key = id;
  }
  return mapFaqPost(await apiSaveOperationalPost('faq', payload));
}

/** @param {string} id */
export async function deleteFaqPost(id) {
  if (isBoardApiMode()) {
    await apiDeleteOperationalPost('faq', id, 'admin');
  }
}

/** @param {{ id?: string, slug?: string, title: string, priority?: string, audience?: string, body: string[], checklist?: any[] }} input */
export async function upsertGuidePost(input) {
  if (!isBoardApiMode()) {
    throw new Error('board_posts API가 활성화되지 않았습니다. (관리자 로그인 필요)');
  }
  const slug = String(input.slug || '').trim();
  const requestedId = String(input.id || '').trim();
  const cached = getOperationalPostsCache('safe-guide').find(
    (row) =>
      (requestedId && (row.id === requestedId || row.slug === requestedId)) ||
      (slug && (row.slug === slug || row.id === slug)),
  );
  const payload = {
    slug,
    title: input.title,
    priority: input.priority || 'primary',
    audience: input.audience || '전체',
    body: input.body,
    checklist: Array.isArray(input.checklist) ? input.checklist : [],
    status: 'published',
    author_role: 'admin',
  };
  if (cached?.id) {
    payload.id = cached.id;
    payload.post_key = cached.id;
  }
  return mapGuidePost(await apiSaveOperationalPost('safe-guide', payload));
}

/** @param {string} slug */
export async function deleteGuidePost(slug) {
  if (!isBoardApiMode()) return;
  const key = String(slug || '').trim();
  const cached = getOperationalPostsCache('safe-guide').find((row) => row.id === key || row.slug === key);
  await apiDeleteOperationalPost('safe-guide', cached?.id || key, 'admin');
}

/** 고객센터용 (서버 세션 역할 필터 적용 결과) */
export function listNoticeCenterPosts() {
  if (!isBoardApiMode()) return [];
  return sortNotices(getNoticeCenterPosts().map(mapNoticePost));
}

/** 홈 3줄용 (서버 세션 역할 필터 + limit 적용 결과) */
export function listNoticeHomePosts() {
  if (!isBoardApiMode()) return [];
  return getNoticeHomePosts().map(mapNoticePost);
}

/** 서버가 준 공지 글 항목을 화면용으로 바꾼다. 순서는 서버 응답 그대로. @param {any[]} posts */
export function mapNoticeRows(posts) {
  return (Array.isArray(posts) ? posts : []).filter((p) => p && p.id && p.title).map(mapNoticePost);
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
