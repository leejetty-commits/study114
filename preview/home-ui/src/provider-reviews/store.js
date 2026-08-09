/**
 * 공급자 후기 store — preview sessionStorage + API
 * student-review-store(관심 학생)와 완전 분리
 */

import { getAuthUser } from '../auth-session.js';
import { getThreads } from '../messages/thread-store.js';
import { getNavRole } from '../state.js';
import { pointTagsForProvider, PROVIDER_REVIEW_COPY } from './copy.js';

const KEY = 'study114-preview-provider-reviews-v1';
const API = '/api/reviews/index.php';

function apiMode() {
  try {
    return sessionStorage.getItem('study114-api-mode') === '1' || window.STUDY114_API_MODE === true;
  } catch {
    return false;
  }
}

/** @typedef {{ id: number, provider_type: 'study_room'|'tutor', provider_id: number, author_user_id: number, review_origin_type: 'consultation'|'experience', review_status: string, review_body: string, point_tags: string[], created_at: string, reply?: { body: string, created_at?: string }|null }} ProviderReview */

function nowStamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function loadAll() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return seedDefaults();
    return /** @type {ProviderReview[]} */ (JSON.parse(raw));
  } catch {
    return seedDefaults();
  }
}

function saveAll(list) {
  sessionStorage.setItem(KEY, JSON.stringify(list));
}

function seedDefaults() {
  /** @type {ProviderReview[]} */
  const seed = [
    {
      id: 1,
      provider_type: 'study_room',
      provider_id: 1,
      author_user_id: 6,
      review_origin_type: 'consultation',
      review_status: 'visible',
      review_body: '상담이 부담스럽지 않았고 설명이 차분했어요.',
      point_tags: ['상담이 편해요', '설명이 쉬워요'],
      created_at: '2026-08-01 10:00:00',
      reply: { body: '소중한 후기 감사합니다. 편하게 상담 이어가겠습니다.', created_at: '2026-08-01 12:00:00' },
    },
    {
      id: 2,
      provider_type: 'study_room',
      provider_id: 1,
      author_user_id: 7,
      review_origin_type: 'experience',
      review_status: 'visible',
      review_body: '위치가 익숙해서 보내기 좋았고, 아이가 처음보다 편하게 들어갔어요.',
      point_tags: ['동선이 편해요', '아이와 잘 맞아요'],
      created_at: '2026-08-03 11:00:00',
      reply: null,
    },
    {
      id: 3,
      provider_type: 'tutor',
      provider_id: 1,
      author_user_id: 6,
      review_origin_type: 'experience',
      review_status: 'visible',
      review_body: '개념 설명이 차근차근이라 아이도 따라가기 쉬웠어요.',
      point_tags: ['개념 설명이 잘해요', '아이와 잘 맞아요'],
      created_at: '2026-08-02 09:30:00',
      reply: null,
    },
  ];
  saveAll(seed);
  return seed;
}

function nextId(list) {
  return list.reduce((m, r) => Math.max(m, r.id), 0) + 1;
}

/** @param {'study_room'|'tutor'} providerType @param {number} providerId */
export function getReviewCount(providerType, providerId) {
  return loadAll().filter(
    (r) => r.provider_type === providerType && r.provider_id === providerId && r.review_status === 'visible',
  ).length;
}

function previewHasThread(providerType, providerId) {
  try {
    return getThreads().some(
      (t) => t.contextKind === providerType && Number(t.contextId) === Number(providerId),
    );
  } catch {
    return false;
  }
}

/**
 * @param {'study_room'|'tutor'} providerType
 * @param {number} providerId
 * @param {{ role?: string, userId?: number|null, isOwner?: boolean }} [viewer]
 */
export function getReviewSummaryLocal(providerType, providerId, viewer = {}) {
  const role = viewer.role || 'guest';
  const userId = viewer.userId ?? null;
  const isOwner = !!viewer.isOwner;
  const canReadBody = role !== 'guest';
  const all = loadAll().filter(
    (r) => r.provider_type === providerType && r.provider_id === providerId && r.review_status === 'visible',
  );
  all.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  let canWrite = false;
  let writeBlocked = null;
  if (role === 'guest') writeBlocked = 'login';
  else if (isOwner) writeBlocked = 'owner';
  else if (role !== 'parent') writeBlocked = 'role';
  else if (userId != null && all.some((r) => r.author_user_id === userId)) writeBlocked = 'already_written';
  else if (!previewHasThread(providerType, providerId)) writeBlocked = 'no_thread';
  else canWrite = true;

  const reviews = canReadBody
    ? all.slice(0, 3).map((r) => ({
        id: r.id,
        provider_type: r.provider_type,
        provider_id: r.provider_id,
        review_origin_type: r.review_origin_type,
        review_body: r.review_body,
        point_tags: r.point_tags || [],
        created_at: r.created_at,
        reply: r.reply || null,
        can_reply: isOwner && !r.reply,
      }))
    : [];

  return {
    provider_type: providerType,
    provider_id: providerId,
    review_count: all.length,
    // 공개 집계 태그는 후순위 — 읽기 화면에 가짜 신뢰 신호가 되지 않도록 비움
    summary_tags: [],
    origin_hint: {
      consultation: reviews.filter((r) => r.review_origin_type === 'consultation').length,
      experience: reviews.filter((r) => r.review_origin_type === 'experience').length,
    },
    can_read_body: canReadBody,
    can_write: canWrite,
    write_blocked_reason: writeBlocked,
    is_owner: isOwner,
    allowed_tags: pointTagsForProvider(providerType),
    reviews,
    guest_teaser: canReadBody ? null : PROVIDER_REVIEW_COPY.guestTeaser,
  };
}

/** @param {'study_room'|'tutor'} providerType @param {number} providerId @param {object} viewer */
export async function fetchReviewSummary(providerType, providerId, viewer = {}) {
  if (!apiMode()) return getReviewSummaryLocal(providerType, providerId, viewer);
  try {
    const qs = new URLSearchParams({
      action: 'summary',
      provider_type: providerType,
      provider_id: String(providerId),
    });
    const res = await fetch(`${API}?${qs}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok || data.ok === false) throw new Error(data.message || 'load failed');
    return data;
  } catch {
    return getReviewSummaryLocal(providerType, providerId, viewer);
  }
}

/**
 * @param {{ provider_type: string, provider_id: number, review_origin_type: string, review_body: string, point_tags: string[] }} payload
 * @param {{ userId?: number }} [opts]
 */
export async function createProviderReview(payload, opts = {}) {
  if (!apiMode()) {
    const list = loadAll();
    const userId = opts.userId || getAuthUser()?.user_id || 0;
    if (list.some((r) => r.provider_type === payload.provider_type && r.provider_id === payload.provider_id && r.author_user_id === userId)) {
      throw new Error('이미 이 대상에 후기를 남겼습니다.');
    }
    const row = {
      id: nextId(list),
      provider_type: /** @type {'study_room'|'tutor'} */ (payload.provider_type),
      provider_id: payload.provider_id,
      author_user_id: userId,
      review_origin_type: /** @type {'consultation'|'experience'} */ (payload.review_origin_type),
      review_status: 'visible',
      review_body: payload.review_body,
      point_tags: payload.point_tags,
      created_at: nowStamp(),
      reply: null,
    };
    list.unshift(row);
    saveAll(list);
    return getReviewSummaryLocal(row.provider_type, row.provider_id, {
      role: 'parent',
      userId,
    });
  }
  const res = await fetch(`${API}?action=create`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.ok === false) throw new Error(data.message || '등록 실패');
  return data;
}

/** @param {number} reviewId @param {string} body @param {{ userId?: number, isOwner?: boolean, role?: string }} [viewer] */
export async function createProviderReviewReply(reviewId, body, viewer = {}) {
  if (!apiMode()) {
    const list = loadAll();
    const row = list.find((r) => r.id === reviewId);
    if (!row) throw new Error('후기를 찾을 수 없습니다.');
    if (row.reply) throw new Error('이미 답글을 남겼습니다.');
    row.reply = { body, created_at: nowStamp() };
    saveAll(list);
    return getReviewSummaryLocal(row.provider_type, row.provider_id, viewer);
  }
  const res = await fetch(`${API}?action=reply`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_id: reviewId, body }),
  });
  const data = await res.json();
  if (!res.ok || data.ok === false) throw new Error(data.message || '답글 실패');
  return data;
}

export async function fetchMypageReviewSnapshot() {
  if (!apiMode()) {
    const auth = getAuthUser();
    const role = auth?.role_type || '';
    const userId = auth?.user_id || 0;
    const all = loadAll().filter((r) => r.review_status === 'visible');
    if (role === 'guardian_student' || (!role && getNavRole() === 'parent')) {
      const items = all.filter((r) => r.author_user_id === userId || (userId === 0 && r.author_user_id === 6));
      return { lane: 'written', label: '내가 남긴 후기', count: items.length, items: items.slice(0, 10) };
    }
    // preview: provider sees reviews for id=1 of their type
    const type = getNavRole() === 'tutor' ? 'tutor' : 'study_room';
    const items = all
      .filter((r) => r.provider_type === type && r.provider_id === 1)
      .map((r) => ({
        ...r,
        can_reply: !r.reply,
        point_tags: r.point_tags || [],
      }));
    return {
      lane: 'received',
      label: '받은 후기',
      count: items.length,
      items: items.slice(0, 10),
      hint: '답글은 상세 화면에서 후기마다 1회만 남길 수 있습니다.',
    };
  }
  const res = await fetch(`${API}?action=mypage`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || data.ok === false) throw new Error(data.message || 'load failed');
  return data;
}

/** exposure 카드용 — 동기 count (프리뷰) / API hydration은 별도 */
export function syncReviewCountForItem(kind, id) {
  if (kind !== 'study_room' && kind !== 'tutor') return 0;
  return getReviewCount(kind, id);
}

/** 마이페이지 요약용 — 프리뷰 작성 후기 수 */
export function countWrittenReviewsPreview(authorUserId = 6) {
  return loadAll().filter((r) => r.review_status === 'visible' && r.author_user_id === authorUserId).length;
}

/** 마이페이지 요약용 — 프리뷰 받은 후기 수 (데모 provider_id=1) */
export function countReceivedReviewsPreview(providerType) {
  return getReviewCount(providerType, 1);
}
