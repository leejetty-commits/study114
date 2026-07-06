import { SUBMISSION_CATEGORIES } from './submission-copy.js';
import {
  isBoardApiMode,
  getSubmissionPostsCache,
  apiSaveSubmissionPost,
  apiDeleteSubmissionPost,
  apiUploadSubmissionAttachment,
  apiOpenSubmissionAttachment,
} from '../board/board-backend.js';

const STORAGE_KEY = 'study114_submission_board_v2';

/** @typedef {'draft'|'submitted'|'published'|'hidden'} SubmissionPostStatus */

/**
 * @typedef {Object} SubmissionPost
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} categoryId
 * @property {string} fileLabel
 * @property {boolean} [hasAttachment]
 * @property {{ originalName?: string, sizeBytes?: number, mimeType?: string }|null} [attachment]
 * @property {string} memo
 * @property {SubmissionPostStatus} status
 * @property {string} authorRole
 * @property {string} createdAt
 * @property {string} updatedAt
 */

function loadAll() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const legacy = sessionStorage.getItem('study114_submission_board_v1');
    if (!legacy) return null;
    const old = JSON.parse(legacy);
    const migrated = old.map((p) => ({
      ...p,
      description: p.description || '',
      memo: p.note || p.memo || '',
      status: p.status === 'pending_review' ? 'submitted' : p.status,
    }));
    saveAll(migrated);
    return migrated;
  } catch {
    return null;
  }
}

function saveAll(posts) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

/** @param {string} navRole */
export function ensureSubmissionBoardSeed(navRole) {
  if (isBoardApiMode()) {
    return getSubmissionPostsCache(navRole);
  }

  const existing = loadAll();
  if (existing?.length) return existing.filter((p) => p.authorRole === navRole);

  const now = new Date().toISOString().slice(0, 10);
  /** @type {SubmissionPost[]} */
  const seed = [];
  if (navRole === 'tutor' || navRole === 'guest') {
    seed.push({
      id: 'sub-seed-1',
      title: '학력 증명서 사본',
      description: '과외 프로필 등록 시 참고용으로 제출한 학력 증빙입니다.',
      categoryId: 'education',
      fileLabel: 'education-cert.pdf',
      memo: 'tutor-ui 등록과 동일 항목',
      status: 'published',
      authorRole: 'tutor',
      createdAt: '2026-06-20',
      updatedAt: now,
    });
    seed.push({
      id: 'sub-seed-2',
      title: '경력 확인 서류',
      description: '경력 항목 보완용 첨부.',
      categoryId: 'education',
      fileLabel: 'career-proof.jpg',
      memo: '',
      status: 'submitted',
      authorRole: 'tutor',
      createdAt: now,
      updatedAt: now,
    });
  }
  if (navRole === 'study_room') {
    seed.push({
      id: 'sub-seed-room-1',
      title: '시설 안전 점검 체크리스트',
      description: '공부방 시설 안전 점검 기록.',
      categoryId: 'facility',
      fileLabel: 'safety-checklist.pdf',
      memo: '',
      status: 'published',
      authorRole: 'study_room',
      createdAt: '2026-06-15',
      updatedAt: now,
    });
  }
  saveAll(seed);
  return seed;
}

/** @param {string} navRole */
export function listSubmissionPosts(navRole) {
  if (isBoardApiMode()) {
    return getSubmissionPostsCache(navRole);
  }
  ensureSubmissionBoardSeed(navRole);
  const posts = loadAll() || [];
  return posts.filter((p) => p.authorRole === navRole);
}

/** @param {string} id @param {string} navRole */
export function getSubmissionPost(id, navRole) {
  return listSubmissionPosts(navRole).find((p) => p.id === id) || null;
}

/**
 * @param {object} input
 * @param {string} input.title
 * @param {string} [input.description]
 * @param {string} input.categoryId
 * @param {string} input.fileLabel
 * @param {string} [input.memo]
 * @param {'draft'|'submitted'} input.status
 * @param {string} navRole
 * @param {File|null} [file]
 */
export async function createSubmissionPost(input, navRole, file = null) {
  if (isBoardApiMode()) {
    const post = await apiSaveSubmissionPost({
      author_role: navRole,
      title: input.title,
      description: input.description,
      category_id: input.categoryId,
      file_label: input.fileLabel,
      memo: input.memo,
      status: input.status,
    });
    if (file) {
      await apiUploadSubmissionAttachment(post.id, navRole, file);
      return getSubmissionPost(post.id, navRole) || post;
    }
    return post;
  }

  const posts = loadAll() || [];
  const id = `sub-${Date.now()}`;
  const now = new Date().toISOString().slice(0, 10);
  const post = {
    id,
    title: input.title.trim(),
    description: input.description?.trim() || '',
    categoryId: input.categoryId,
    fileLabel: input.fileLabel || 'attachment.bin',
    memo: input.memo?.trim() || '',
    status: input.status,
    authorRole: navRole,
    createdAt: now,
    updatedAt: now,
  };
  posts.unshift(post);
  saveAll(posts);
  return post;
}

/**
 * @param {string} id
 * @param {object} input
 * @param {string} navRole
 * @param {File|null} [file]
 */
export async function updateSubmissionPost(id, input, navRole, file = null) {
  if (isBoardApiMode()) {
    const existing = getSubmissionPost(id, navRole);
    if (!existing) return null;
    const post = await apiSaveSubmissionPost({
      id,
      author_role: navRole,
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      category_id: input.categoryId ?? existing.categoryId,
      file_label: input.fileLabel ?? existing.fileLabel,
      memo: input.memo ?? existing.memo,
      status: input.status ?? existing.status,
    });
    if (file) {
      await apiUploadSubmissionAttachment(id, navRole, file);
      return getSubmissionPost(id, navRole) || post;
    }
    return post;
  }

  const posts = loadAll() || [];
  const idx = posts.findIndex((p) => p.id === id && p.authorRole === navRole);
  if (idx < 0) return null;
  const now = new Date().toISOString().slice(0, 10);
  const prev = posts[idx];
  if (prev.status !== 'draft' && prev.status !== 'submitted') return null;
  posts[idx] = {
    ...prev,
    title: input.title?.trim() || prev.title,
    description: input.description?.trim() ?? prev.description,
    categoryId: input.categoryId || prev.categoryId,
    fileLabel: input.fileLabel || prev.fileLabel,
    memo: input.memo?.trim() ?? prev.memo,
    status: input.status || prev.status,
    updatedAt: now,
  };
  saveAll(posts);
  return posts[idx];
}

/** @param {string} id @param {string} navRole */
export async function deleteSubmissionPost(id, navRole) {
  if (isBoardApiMode()) {
    const target = getSubmissionPost(id, navRole);
    if (!target || (target.status !== 'draft' && target.status !== 'submitted')) return false;
    await apiDeleteSubmissionPost(id, navRole);
    return true;
  }

  const posts = loadAll() || [];
  const target = posts.find((p) => p.id === id && p.authorRole === navRole);
  if (!target || (target.status !== 'draft' && target.status !== 'submitted')) return false;
  saveAll(posts.filter((p) => p.id !== id));
  return true;
}

export function getCategoryLabel(categoryId) {
  return SUBMISSION_CATEGORIES.find((c) => c.id === categoryId)?.label || categoryId;
}

export { apiOpenSubmissionAttachment };
