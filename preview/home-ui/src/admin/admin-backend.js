import {
  fetchSubmissionQueue,
  patchSubmissionQueueAction,
  fetchOperationLogs,
  fetchAdminReports,
  patchAdminReport,
  fetchExposureTargets,
  patchExposureCorrection,
  fetchCommerceOverview,
  patchCommerceCorrection,
  fetchAdminMembers,
  fetchAdminMemberDetail,
  patchAdminMember,
  fetchAdminSession,
  fetchAdminOperators,
  createAdminOperator,
  patchAdminOperator,
  resetAdminOperatorPassword,
} from './admin-api.js';
import { hydrateBoardCache } from '../board/board-backend.js';

let apiMode = false;
/** @type {any[]} */
let submissionQueueCache = [];
/** @type {any[]} */
let operationLogsCache = [];
/** @type {any[]} */
let reportsCache = [];
/** @type {any[]} */
let exposureCache = [];
/** @type {any[]|null} */
let operatorsCache = null;

export function isAdminApiMode() {
  return apiMode;
}

/** @type {any|null} */
let commerceCache = null;
/** @type {{ members: any[], total: number, counts?: Record<string, number>, filters: Record<string, string> }|null} */
let membersCache = null;
/** @type {Record<number, any>} */
let memberDetailCache = {};

function resetCaches() {
  submissionQueueCache = [];
  operationLogsCache = [];
  reportsCache = [];
  exposureCache = [];
  commerceCache = null;
  membersCache = null;
  memberDetailCache = {};
  operatorsCache = null;
}

export async function activateAdminApi() {
  apiMode = true;
  await hydrateAdminCache();
}

export function deactivateAdminApi() {
  apiMode = false;
  resetCaches();
}

export async function hydrateAdminCache() {
  const [queueRes, logsRes, reportsRes, exposureRes, commerceRes] = await Promise.all([
    fetchSubmissionQueue('submitted').catch(() => ({ queue: [] })),
    fetchOperationLogs(50).catch(() => ({ logs: [] })),
    fetchAdminReports().catch(() => ({ reports: [] })),
    fetchExposureTargets('all', '').catch(() => ({ items: [] })),
    fetchCommerceOverview(50).catch(() => null),
  ]);
  submissionQueueCache = (queueRes.queue ?? []).map((item) => ({ ...item }));
  operationLogsCache = (logsRes.logs ?? []).map((log) => ({ ...log }));
  reportsCache = (reportsRes.reports ?? []).map((r) => ({ ...r }));
  exposureCache = (exposureRes.items ?? []).map((item) => ({ ...item }));
  commerceCache = commerceRes ? { ...commerceRes } : null;
}

export function getSubmissionQueueCache() {
  return submissionQueueCache.map((item) => ({ ...item }));
}

export function getOperationLogsCache() {
  return operationLogsCache.map((log) => ({ ...log }));
}

export function getReportsCache() {
  return reportsCache.map((r) => ({ ...r }));
}

export function getExposureCache() {
  return exposureCache.map((item) => ({ ...item }));
}

/**
 * @param {string} [targetType]
 * @param {string} [status]
 */
export async function hydrateExposureCache(targetType = 'all', status = '') {
  const data = await fetchExposureTargets(targetType, status);
  exposureCache = (data.items ?? []).map((item) => ({ ...item }));
  return exposureCache;
}

function upsertExposureItem(row) {
  const idx = exposureCache.findIndex(
    (item) => item.targetType === row.targetType && item.targetId === row.targetId,
  );
  const copy = { ...row };
  if (idx >= 0) exposureCache[idx] = copy;
  else exposureCache.unshift(copy);
  return copy;
}

function upsertQueueItem(row) {
  const idx = submissionQueueCache.findIndex((item) => item.id === row.id);
  if (row.status !== 'submitted') {
    submissionQueueCache = submissionQueueCache.filter((item) => item.id !== row.id);
    return row;
  }
  const copy = { ...row };
  if (idx >= 0) submissionQueueCache[idx] = copy;
  else submissionQueueCache.unshift(copy);
  return copy;
}

function upsertReport(row) {
  const idx = reportsCache.findIndex((r) => r.id === row.id);
  const copy = { ...row };
  if (idx >= 0) reportsCache[idx] = copy;
  else reportsCache.unshift(copy);
  return copy;
}

function prependLog(row) {
  if (!row?.id) return;
  operationLogsCache = [{ ...row }, ...operationLogsCache.filter((l) => l.id !== row.id)];
}

/**
 * @param {string} id
 * @param {'expose'|'hide'} action
 * @param {{ internalMemo?: string }} [opts]
 */
export async function apiApplySubmissionQueueAction(id, action, opts = {}) {
  const data = await patchSubmissionQueueAction({
    id,
    action,
    internal_memo: opts.internalMemo,
  });
  if (data.item) upsertQueueItem(data.item);
  if (data.log) prependLog(data.log);
  await hydrateBoardCache().catch(() => {});
  return data;
}

/**
 * @param {string} id
 * @param {string} status
 * @param {{ internalMemo?: string }} [opts]
 */
export async function apiUpdateAdminReport(id, status, opts = {}) {
  const data = await patchAdminReport({
    id,
    status,
    internal_memo: opts.internalMemo,
  });
  if (data.report) upsertReport(data.report);
  if (data.log) prependLog(data.log);
  return data;
}

export function getCommerceCache() {
  return commerceCache ? { ...commerceCache } : null;
}

export async function hydrateCommerceCache() {
  const data = await fetchCommerceOverview(50);
  commerceCache = { ...data };
  return commerceCache;
}

/**
 * @param {{ q?: string, status?: string, role_type?: string, limit?: number }} [filters]
 */
export async function hydrateMembersCache(filters = {}) {
  const data = await fetchAdminMembers({
    q: filters.q || '',
    status: filters.status || 'all',
    role_type: filters.role_type || 'all',
    limit: filters.limit || 50,
  });
  membersCache = {
    members: (data.members ?? []).map((m) => ({ ...m })),
    total: Number(data.total || 0),
    counts: {
      all: Number(data.counts?.all ?? data.total ?? 0),
      active: Number(data.counts?.active ?? 0),
      pending: Number(data.counts?.pending ?? 0),
      blocked: Number(data.counts?.blocked ?? 0),
      withdrawn: Number(data.counts?.withdrawn ?? 0),
    },
    filters: {
      q: String(filters.q || ''),
      status: String(filters.status || 'all'),
      role_type: String(filters.role_type || 'all'),
    },
  };
  return membersCache;
}

export function getMembersCache() {
  return membersCache
    ? {
        members: membersCache.members.map((m) => ({ ...m })),
        total: membersCache.total,
        counts: { ...membersCache.counts },
        filters: { ...membersCache.filters },
      }
    : null;
}

/** @param {number} id */
export async function hydrateMemberDetail(id) {
  const data = await fetchAdminMemberDetail(id);
  if (data.member) {
    memberDetailCache[id] = { ...data.member };
  }
  return memberDetailCache[id] || null;
}

/** @param {number} id */
export function getMemberDetailCache(id) {
  return memberDetailCache[id] ? { ...memberDetailCache[id] } : null;
}

/**
 * @param {number} userId
 * @param {'block'|'restore'|'withdraw'} action
 * @param {{ internalMemo?: string }} [opts]
 */
export async function apiApplyMemberAction(userId, action, opts = {}) {
  const data = await patchAdminMember({
    user_id: userId,
    action,
    internal_memo: opts.internalMemo,
  });
  if (data.member) {
    memberDetailCache[userId] = { ...data.member };
    if (membersCache) {
      const idx = membersCache.members.findIndex((m) => m.id === userId);
      if (idx >= 0) {
        membersCache.members[idx] = {
          ...membersCache.members[idx],
          status: data.member.status,
          name: data.member.name,
        };
      }
    }
  }
  if (data.log) prependLog(data.log);
  return data;
}

/**
 * @param {number[]} userIds
 * @param {'block'|'restore'} action
 * @param {{ internalMemo?: string }} [opts]
 */
export async function apiApplyMemberBulkAction(userIds, action, opts = {}) {
  return patchAdminMember({
    user_ids: userIds,
    action,
    internal_memo: opts.internalMemo,
  });
}

/**
 * @param {Record<string, unknown>} input
 */
export async function apiApplyCommerceCorrection(input) {
  const data = await patchCommerceCorrection(input);
  if (data.log) prependLog(data.log);
  await hydrateCommerceCache().catch(() => {});
  return data;
}

/**
 * @param {string} targetType
 * @param {string} targetId
 * @param {'hide'|'publish'|'inquiry_status'} action
 * @param {{ internalMemo?: string, reasonCategory?: string, inquiryStatus?: string }} [opts]
 */
export async function apiApplyExposureCorrection(targetType, targetId, action, opts = {}) {
  const data = await patchExposureCorrection({
    target_type: targetType,
    target_id: targetId,
    action,
    internal_memo: opts.internalMemo,
    reason_category: opts.reasonCategory,
    inquiry_status: opts.inquiryStatus,
  });
  if (data.item) upsertExposureItem(data.item);
  if (data.log) prependLog(data.log);
  await hydrateBoardCache().catch(() => {});
  return data;
}

export function getOperatorsCache() {
  return operatorsCache ? operatorsCache.map((o) => ({ ...o })) : null;
}

export async function hydrateOperatorsCache() {
  const data = await fetchAdminOperators();
  operatorsCache = (data.operators ?? []).map((o) => ({ ...o }));
  return operatorsCache;
}

/** @param {Record<string, unknown>} input */
export async function apiCreateOperator(input) {
  const data = await createAdminOperator(input);
  await hydrateOperatorsCache();
  return data;
}

/** @param {Record<string, unknown>} input */
export async function apiPatchOperator(input) {
  const data = await patchAdminOperator(input);
  await hydrateOperatorsCache();
  return data;
}

/** @param {Record<string, unknown>} input */
export async function apiResetOperatorPassword(input) {
  const data = await resetAdminOperatorPassword(input);
  await hydrateOperatorsCache();
  return data;
}
