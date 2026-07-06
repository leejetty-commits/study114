import {
  fetchSubmissionQueue,
  patchSubmissionQueueAction,
  fetchOperationLogs,
  fetchAdminReports,
  patchAdminReport,
  fetchExposureTargets,
  patchExposureCorrection,
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

export function isAdminApiMode() {
  return apiMode;
}

function resetCaches() {
  submissionQueueCache = [];
  operationLogsCache = [];
  reportsCache = [];
  exposureCache = [];
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
  const [queueRes, logsRes, reportsRes, exposureRes] = await Promise.all([
    fetchSubmissionQueue('submitted').catch(() => ({ queue: [] })),
    fetchOperationLogs(50).catch(() => ({ logs: [] })),
    fetchAdminReports().catch(() => ({ reports: [] })),
    fetchExposureTargets('all', '').catch(() => ({ items: [] })),
  ]);
  submissionQueueCache = (queueRes.queue ?? []).map((item) => ({ ...item }));
  operationLogsCache = (logsRes.logs ?? []).map((log) => ({ ...log }));
  reportsCache = (reportsRes.reports ?? []).map((r) => ({ ...r }));
  exposureCache = (exposureRes.items ?? []).map((item) => ({ ...item }));
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
