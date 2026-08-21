/**
 * 공급자 후기 store — preview sessionStorage + API
 * 지시문 1 잠금: 누적 3회 · 삭제 비차감 · 후기차단 분리 · open/closed · review_count=visible
 */

import { getAuthUser } from '../auth-session.js';
import { getThreads } from '../messages/thread-store.js';
import { getNavRole } from '../state.js';
import { getStudyRooms } from '../study-room-reg/store.js';
import { getTutors } from '../tutor-reg/store.js';
import {
  pointTagsForProvider,
  PROVIDER_REVIEW_COPY,
  REVIEW_POLICY,
  reviewSnippet,
} from './copy.js';

const KEY = 'study114-preview-provider-reviews-v2';
const BLOCK_KEY = 'study114-preview-review-blocks-v1';
const WRITE_KEY = 'study114-preview-review-write-status-v1';
const QUOTA_KEY = 'study114-preview-review-quotas-v1';
const API = '/api/reviews/index.php';

function apiMode() {
  try {
    return sessionStorage.getItem('study114-api-mode') === '1' || window.STUDY114_API_MODE === true;
  } catch {
    return false;
  }
}

function nowStamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function loadJson(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return fallback();
    return JSON.parse(raw);
  } catch {
    return fallback();
  }
}

function saveJson(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function seedDefaults() {
  const seed = [
    {
      id: 1,
      provider_type: 'study_room',
      provider_id: 1,
      author_user_id: 6,
      review_origin_type: 'consultation',
      review_status: 'visible',
      review_body: '상담이 부담스럽지 않았고 설명이 차분했어요. 공간이 실제 사진과 비슷했습니다.',
      point_tags: ['상담이 친절해요', '정보가 실제와 비슷해요'],
      created_at: '2026-08-01 10:00:00',
    },
    {
      id: 2,
      provider_type: 'study_room',
      provider_id: 1,
      author_user_id: 7,
      review_origin_type: 'experience',
      review_status: 'visible',
      review_body: '위치가 익숙해서 보내기 좋았고, 분위기가 편안해서 아이가 금방 적응했어요.',
      point_tags: ['동네 접근이 편해요', '분위기가 편안해요'],
      created_at: '2026-08-03 11:00:00',
    },
    {
      id: 3,
      provider_type: 'tutor',
      provider_id: 1,
      author_user_id: 6,
      review_origin_type: 'experience',
      review_status: 'visible',
      review_body: '개념 설명이 차근차근이라 아이도 따라가기 쉬웠어요.',
      point_tags: ['설명이 쉬워요', '학생을 잘 봐줘요'],
      created_at: '2026-08-02 09:30:00',
    },
  ];
  saveJson(KEY, seed);
  const quotas = {};
  seed.forEach((r) => {
    const k = quotaKey(r.provider_type, r.provider_id, r.author_user_id);
    quotas[k] = (quotas[k] || 0) + 1;
  });
  saveJson(QUOTA_KEY, quotas);
  return seed;
}

function loadAll() {
  return loadJson(KEY, seedDefaults);
}

function saveAll(list) {
  saveJson(KEY, list);
}

function loadBlocks() {
  return loadJson(BLOCK_KEY, () => []);
}

function saveBlocks(list) {
  saveJson(BLOCK_KEY, list);
}

function loadWriteStatus() {
  return loadJson(WRITE_KEY, () => ({}));
}

function loadQuotas() {
  return loadJson(QUOTA_KEY, () => ({}));
}

function quotaKey(type, id, userId) {
  return `${type}:${id}:${userId}`;
}

function writeStatusKey(type, id) {
  return `${type}:${id}`;
}

function nextId(list) {
  return list.reduce((m, r) => Math.max(m, r.id), 0) + 1;
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

function getCreatedCount(type, id, userId) {
  const quotas = loadQuotas();
  const n = Number(quotas[quotaKey(type, id, userId)] || 0);
  if (n > 0) return n;
  return loadAll().filter(
    (r) => r.provider_type === type && r.provider_id === id && r.author_user_id === userId,
  ).length;
}

function bumpQuota(type, id, userId) {
  const quotas = loadQuotas();
  const k = quotaKey(type, id, userId);
  quotas[k] = (Number(quotas[k]) || 0) + 1;
  saveJson(QUOTA_KEY, quotas);
}

function isBlocked(type, id, authorId) {
  return loadBlocks().some(
    (b) => b.provider_type === type && Number(b.provider_id) === Number(id) && Number(b.blocked_author_user_id) === Number(authorId),
  );
}

function getWriteStatus(type, id) {
  const map = loadWriteStatus();
  return map[writeStatusKey(type, id)] === 'closed' ? 'closed' : 'open';
}

function visibleOnTarget(type, id) {
  return loadAll()
    .filter((r) => r.provider_type === type && r.provider_id === id && r.review_status === 'visible')
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

function mapItem(r, extra = {}) {
  return {
    id: r.id,
    provider_type: r.provider_type,
    provider_id: r.provider_id,
    author_user_id: r.author_user_id,
    review_origin_type: r.review_origin_type,
    review_status: r.review_status,
    review_body: r.review_body,
    snippet: reviewSnippet(r.review_body),
    point_tags: r.point_tags || [],
    created_at: r.created_at,
    ...extra,
  };
}

function resolveCta({ isOwner, canWrite, hasWritten, reason }) {
  if (isOwner) return 'none';
  if (reason === 'role') return 'ineligible';
  if (hasWritten) return 'manage';
  if (canWrite) return 'write';
  if (reason === 'closed') return 'closed';
  if (reason === 'blocked') return 'blocked';
  return 'ineligible';
}

function isConsumerReviewRole(role) {
  return role === 'parent' || role === 'guardian_student' || role === 'student';
}

function localProviderLabel(providerType, providerId) {
  try {
    if (providerType === 'study_room') {
      const room = getStudyRooms().find((r) => Number(r.id) === Number(providerId));
      if (room?.study_room_name) return room.study_room_name;
    }
    if (providerType === 'tutor') {
      const tutor = getTutors().find((t) => Number(t.id) === Number(providerId));
      if (tutor?.tutor_display_name) return tutor.tutor_display_name;
    }
  } catch {
    /* ignore */
  }
  return providerType === 'tutor' ? '과외쌤' : '공부방';
}

function assertConsumerReviewAuthor() {
  const auth = getAuthUser();
  const roleType = String(auth?.role_type || '');
  const nav = getNavRole();
  if (
    roleType === 'study_room_owner' ||
    roleType === 'tutor' ||
    nav === 'study_room' ||
    nav === 'tutor'
  ) {
    const err = new Error(PROVIDER_REVIEW_COPY.providerRoleCta);
    err.code = 'review_role';
    throw err;
  }
}

function resolveLocalViewer(providerType, providerId, viewer = {}) {
  const role = viewer.role || 'guest';
  const userId = viewer.userId ?? null;
  const isOwner = !!viewer.isOwner;
  const createdCount = userId != null ? getCreatedCount(providerType, providerId, userId) : 0;
  const remaining = Math.max(0, REVIEW_POLICY.maxCreates - createdCount);
  const hasWritten = createdCount > 0;
  const blocked = userId != null && isBlocked(providerType, providerId, userId);
  const writeStatus = getWriteStatus(providerType, providerId);

  let reason = null;
  let canWrite = false;
  if (role === 'guest' || userId == null) reason = 'login';
  else if (isOwner) reason = 'owner';
  else if (!isConsumerReviewRole(role)) reason = 'role';
  else if (blocked) reason = 'blocked';
  else if (writeStatus === 'closed') reason = 'closed';
  else if (remaining <= 0) reason = 'quota';
  else if (!previewHasThread(providerType, providerId)) reason = 'no_thread';
  else canWrite = true;

  return {
    user_id: userId,
    can_write: canWrite,
    write_blocked_reason: reason,
    is_owner: isOwner,
    has_written: hasWritten,
    created_count: createdCount,
    remaining_creates: remaining,
    is_review_blocked: blocked,
    review_write_status: writeStatus,
    cta_kind: resolveCta({ isOwner, canWrite, hasWritten, reason }),
  };
}

/** @param {'study_room'|'tutor'} providerType @param {number} providerId */
export function getReviewCount(providerType, providerId) {
  return visibleOnTarget(providerType, providerId).length;
}

export function getReviewSummaryLocal(providerType, providerId, viewer = {}) {
  const v = resolveLocalViewer(providerType, providerId, viewer);
  const all = visibleOnTarget(providerType, providerId);
  const mine =
    v.user_id != null
      ? loadAll()
          .filter(
            (r) =>
              r.provider_type === providerType &&
              r.provider_id === providerId &&
              r.author_user_id === v.user_id &&
              (r.review_status === 'visible' || r.review_status === 'hidden'),
          )
          .map((r) =>
            mapItem(r, {
              is_mine: true,
              can_edit: isConsumerReviewRole(viewer.role || 'guest') && !v.is_review_blocked,
              can_delete: true,
              can_hide: r.review_status === 'visible',
              can_unhide:
                r.review_status === 'hidden' &&
                !v.is_review_blocked &&
                isConsumerReviewRole(viewer.role || 'guest'),
            }),
          )
      : [];
  const tagFreq = {};
  all.forEach((r) => {
    (r.point_tags || []).forEach((t) => {
      tagFreq[t] = (tagFreq[t] || 0) + 1;
    });
  });
  const summaryTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([t]) => t);

  return {
    provider_type: providerType,
    provider_id: providerId,
    review_count: all.length,
    review_write_status: v.review_write_status,
    summary_tags: summaryTags,
    can_read_body: true,
    can_write: v.can_write,
    can_manage: v.has_written,
    has_written: v.has_written,
    created_count: v.created_count,
    remaining_creates: v.remaining_creates,
    is_review_blocked: v.is_review_blocked,
    write_blocked_reason: v.write_blocked_reason,
    cta_kind: v.cta_kind,
    is_owner: v.is_owner,
    allowed_tags: pointTagsForProvider(providerType),
    reviews: all.slice(0, REVIEW_POLICY.sheetLimit).map((r) => mapItem(r, { is_mine: r.author_user_id === v.user_id })),
    my_reviews: mine,
    guest_teaser: null,
  };
}

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

export async function fetchReviewList(providerType, providerId, page = 1, viewer = {}) {
  if (!apiMode()) {
    const all = visibleOnTarget(providerType, providerId);
    const v = resolveLocalViewer(providerType, providerId, viewer);
    const pageSize = REVIEW_POLICY.pageSize;
    const start = (Math.max(1, page) - 1) * pageSize;
    return {
      mode: 'target',
      provider_type: providerType,
      provider_id: providerId,
      provider_label: localProviderLabel(providerType, providerId),
      review_count: all.length,
      page,
      page_size: pageSize,
      total: all.length,
      cta_kind: v.cta_kind,
      can_write: v.can_write,
      has_written: v.has_written,
      is_owner: v.is_owner,
      items: all.slice(start, start + pageSize).map((r) =>
        mapItem(r, {
          author_user_id: r.author_user_id,
          is_review_blocked: isBlocked(r.provider_type, r.provider_id, r.author_user_id),
        }),
      ),
    };
  }
  const qs = new URLSearchParams({
    action: 'list',
    provider_type: providerType,
    provider_id: String(providerId),
    page: String(page),
    limit: String(REVIEW_POLICY.pageSize),
  });
  const res = await fetch(`${API}?${qs}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || data.ok === false) throw new Error(data.message || 'load failed');
  return data;
}

async function postAction(action, payload) {
  const res = await fetch(`${API}?action=${action}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.ok === false) {
    const err = new Error(data.message || '요청 실패');
    err.code = data.error;
    throw err;
  }
  return data;
}

export async function createProviderReview(payload, opts = {}) {
  if (!apiMode()) {
    assertConsumerReviewAuthor();
    const userId = opts.userId || getAuthUser()?.user_id || 0;
    const type = payload.provider_type;
    const id = payload.provider_id;
    if (!payload.public_consent) throw new Error('공개 동의 후 후기를 남길 수 있습니다.');
    const viewer = resolveLocalViewer(type, id, { role: 'parent', userId });
    if (viewer.is_review_blocked) throw new Error(PROVIDER_REVIEW_COPY.blockedCta);
    if (viewer.review_write_status === 'closed') throw new Error(PROVIDER_REVIEW_COPY.closedCta);
    if (viewer.remaining_creates <= 0) throw new Error('이 대상에는 후기를 더 남길 수 없습니다. (최대 3회)');
    if (!previewHasThread(type, id)) throw new Error(PROVIDER_REVIEW_COPY.ineligibleCta);
    const list = loadAll();
    const row = {
      id: nextId(list),
      provider_type: type,
      provider_id: id,
      author_user_id: userId,
      review_origin_type: payload.review_origin_type || 'consultation',
      review_status: 'visible',
      review_body: payload.review_body,
      point_tags: payload.point_tags || [],
      created_at: nowStamp(),
    };
    list.unshift(row);
    saveAll(list);
    bumpQuota(type, id, userId);
    return getReviewSummaryLocal(type, id, { role: 'parent', userId });
  }
  return postAction('create', payload);
}

export async function updateProviderReview(payload, opts = {}) {
  if (!apiMode()) {
    assertConsumerReviewAuthor();
    const userId = opts.userId || getAuthUser()?.user_id || 0;
    const list = loadAll();
    const row = list.find((r) => r.id === payload.review_id);
    if (!row || row.review_status === 'deleted') throw new Error('후기를 찾을 수 없습니다.');
    if (row.author_user_id !== userId) throw new Error('본인이 쓴 후기만 처리할 수 있습니다.');
    if (isBlocked(row.provider_type, row.provider_id, userId)) {
      throw new Error('후기차단 이후에는 수정할 수 없고 비공개 또는 삭제만 할 수 있어요.');
    }
    row.review_body = payload.review_body;
    row.point_tags = payload.point_tags || row.point_tags;
    saveAll(list);
    return getReviewSummaryLocal(row.provider_type, row.provider_id, { role: 'parent', userId });
  }
  return postAction('update', payload);
}

export async function hideProviderReview(reviewId, opts = {}) {
  return setLocalStatus(reviewId, 'hidden', opts, 'hide');
}

export async function unhideProviderReview(reviewId, opts = {}) {
  return setLocalStatus(reviewId, 'visible', opts, 'unhide');
}

export async function deleteProviderReview(reviewId, opts = {}) {
  return setLocalStatus(reviewId, 'deleted', opts, 'delete');
}

async function setLocalStatus(reviewId, status, opts, action) {
  if (!apiMode()) {
    const userId = opts.userId || getAuthUser()?.user_id || 0;
    const list = loadAll();
    const row = list.find((r) => r.id === reviewId);
    if (!row || row.review_status === 'deleted') throw new Error('후기를 찾을 수 없습니다.');
    if (row.author_user_id !== userId) throw new Error('본인이 쓴 후기만 처리할 수 있습니다.');
    if (action === 'unhide' && isBlocked(row.provider_type, row.provider_id, userId)) {
      throw new Error('후기차단 이후에는 수정할 수 없고 비공개 또는 삭제만 할 수 있어요.');
    }
    row.review_status = status;
    if (status === 'deleted') row.deleted_at = nowStamp();
    saveAll(list);
    return getReviewSummaryLocal(row.provider_type, row.provider_id, { role: 'parent', userId });
  }
  return postAction(action, { review_id: reviewId });
}

export async function blockReviewAuthor(payload) {
  if (!apiMode()) {
    const blocks = loadBlocks();
    const exists = blocks.some(
      (b) =>
        b.provider_type === payload.provider_type &&
        Number(b.provider_id) === Number(payload.provider_id) &&
        Number(b.blocked_author_user_id) === Number(payload.blocked_author_user_id),
    );
    if (!exists) {
      blocks.push({
        provider_type: payload.provider_type,
        provider_id: payload.provider_id,
        blocked_author_user_id: payload.blocked_author_user_id,
        blocked_by_user_id: getAuthUser()?.user_id || 0,
      });
      saveBlocks(blocks);
    }
    return getReviewSummaryLocal(payload.provider_type, payload.provider_id, {
      role: getNavRole() === 'tutor' ? 'tutor' : 'study_room',
      userId: getAuthUser()?.user_id,
      isOwner: true,
    });
  }
  return postAction('block', payload);
}

export async function unblockReviewAuthor(payload) {
  if (!apiMode()) {
    saveBlocks(
      loadBlocks().filter(
        (b) =>
          !(
            b.provider_type === payload.provider_type &&
            Number(b.provider_id) === Number(payload.provider_id) &&
            Number(b.blocked_author_user_id) === Number(payload.blocked_author_user_id)
          ),
      ),
    );
    return getReviewSummaryLocal(payload.provider_type, payload.provider_id, {
      role: getNavRole() === 'tutor' ? 'tutor' : 'study_room',
      userId: getAuthUser()?.user_id,
      isOwner: true,
    });
  }
  return postAction('unblock', payload);
}

export async function setReviewWriteStatus(payload) {
  if (!apiMode()) {
    const map = loadWriteStatus();
    map[writeStatusKey(payload.provider_type, payload.provider_id)] = payload.review_write_status;
    saveJson(WRITE_KEY, map);
    return getReviewSummaryLocal(payload.provider_type, payload.provider_id, {
      role: getNavRole() === 'tutor' ? 'tutor' : 'study_room',
      userId: getAuthUser()?.user_id,
      isOwner: true,
    });
  }
  return postAction('set_write_status', payload);
}

/** @deprecated 답글 MVP 제외 */
export async function createProviderReviewReply() {
  throw new Error('후기 댓글·답글은 지원하지 않습니다.');
}

function localTargetsInbox(userId, nav) {
  const map = new Map();
  const put = (type, id, label, owned, count) => {
    if ((type !== 'study_room' && type !== 'tutor') || !id) return;
    const key = `${type}:${id}`;
    const prev = map.get(key) || {
      provider_type: type,
      provider_id: id,
      label: label || '',
      owned: false,
      review_count: 0,
    };
    if (label) prev.label = label;
    prev.owned = prev.owned || !!owned;
    if (count > prev.review_count) prev.review_count = count;
    map.set(key, prev);
  };

  try {
    if (nav === 'study_room') {
      getStudyRooms().forEach((room) => {
        const id = Number(room?.id || 0);
        if (!id) return;
        put('study_room', id, room.study_room_name || room.public_display_name || '', true, getReviewCount('study_room', id));
      });
    }
    if (nav === 'tutor') {
      getTutors().forEach((tutor) => {
        const id = Number(tutor?.id || 0);
        if (!id) return;
        put('tutor', id, tutor.tutor_display_name || tutor.public_display_name || '', true, getReviewCount('tutor', id));
      });
    }
  } catch {
    /* ignore */
  }

  const authorId = userId || 6;
  const writtenCounts = {};
  loadAll().forEach((r) => {
    if (r.review_status !== 'visible' && r.review_status !== 'hidden') return;
    const mine = r.author_user_id === authorId || (userId === 0 && r.author_user_id === 6);
    if (!mine) return;
    const key = `${r.provider_type}:${r.provider_id}`;
    writtenCounts[key] = (writtenCounts[key] || 0) + 1;
  });
  Object.entries(writtenCounts).forEach(([key, count]) => {
    const [type, id] = key.split(':');
    put(type, Number(id), '', false, count);
  });

  const items = [...map.values()];
  return {
    mode: 'targets',
    lane: 'targets',
    label: PROVIDER_REVIEW_COPY.inboxByTarget,
    page: 1,
    page_size: Math.max(1, items.length),
    total: items.length,
    count: items.length,
    items,
  };
}

export async function fetchReviewInbox(lane = '', page = 1) {
  if (!apiMode()) {
    const auth = getAuthUser();
    const role = auth?.role_type || '';
    const userId = auth?.user_id || 0;
    const nav = getNavRole();
    const isProvider = nav === 'tutor' || nav === 'study_room' || role === 'tutor' || role === 'study_room_owner';
    if (lane === 'targets') {
      return localTargetsInbox(userId, nav);
    }
    const useReceived = lane === 'received' || (!lane && isProvider);
    const all = loadAll().filter((r) => r.review_status === 'visible' || (!useReceived && r.review_status === 'hidden'));
    const pageSize = REVIEW_POLICY.pageSize;
    const start = (Math.max(1, page) - 1) * pageSize;
    if (lane === 'received' && !isProvider) {
      return {
        mode: 'account',
        lane: 'received',
        label: PROVIDER_REVIEW_COPY.inboxReceived,
        page,
        page_size: pageSize,
        total: 0,
        count: 0,
        items: [],
      };
    }
    if (useReceived) {
      const type = nav === 'tutor' ? 'tutor' : 'study_room';
      const items = all.filter((r) => r.provider_type === type && r.provider_id === 1);
      return {
        mode: 'account',
        lane: 'received',
        label: PROVIDER_REVIEW_COPY.inboxReceived,
        page,
        page_size: pageSize,
        total: items.length,
        count: items.length,
        items: items.slice(start, start + pageSize).map((r) =>
          mapItem(r, {
            is_review_blocked: isBlocked(r.provider_type, r.provider_id, r.author_user_id),
            author_user_id: r.author_user_id,
          }),
        ),
      };
    }
    const items = all.filter((r) => r.author_user_id === userId || (userId === 0 && r.author_user_id === 6));
    return {
      mode: 'account',
      lane: 'written',
      label: PROVIDER_REVIEW_COPY.inboxWritten,
      page,
      page_size: pageSize,
      total: items.length,
      count: items.length,
      items: items.slice(start, start + pageSize).map((r) =>
        mapItem(r, {
          is_mine: true,
          can_edit: !isBlocked(r.provider_type, r.provider_id, r.author_user_id),
          can_delete: true,
          can_hide: r.review_status === 'visible',
          can_unhide: r.review_status === 'hidden',
          review_status: r.review_status,
        }),
      ),
    };
  }
  const qs = new URLSearchParams({ action: 'inbox', lane, page: String(page), limit: String(REVIEW_POLICY.pageSize) });
  const res = await fetch(`${API}?${qs}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || data.ok === false) throw new Error(data.message || 'load failed');
  return data;
}

export async function fetchMypageReviewSnapshot() {
  return fetchReviewInbox('');
}

export function syncReviewCountForItem(kind, id) {
  if (kind !== 'study_room' && kind !== 'tutor') return 0;
  return getReviewCount(kind, id);
}

export function countWrittenReviewsPreview(authorUserId = 6) {
  return loadAll().filter((r) => r.review_status === 'visible' && r.author_user_id === authorUserId).length;
}

export function countReceivedReviewsPreview(providerType) {
  return getReviewCount(providerType, 1);
}

export function reviewsArchivePath(opts = {}) {
  if (opts.providerType && opts.providerId) {
    return `/mypage/messages/reviews/target/${opts.providerType}/${opts.providerId}`;
  }
  if (opts.lane === 'received') return '/mypage/messages/reviews/received';
  if (opts.lane === 'written') return '/mypage/messages/reviews/written';
  return '/mypage/messages/reviews';
}
