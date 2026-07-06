/**
 * 18a/18b — P18-02 ROI · 운영 상태 → provider-status.js 위임
 */

import { ROI_FREE_METRICS } from './mypage/plans-catalog.js';
import {
  hydrateProviderStatus,
  resetProviderStatus,
  getRoiMetricsFromStatus,
  getPaidOperationalStatusFromCache,
  isProviderStatusApiMode,
} from './provider-status.js';

export function isPaidRoiApiMode() {
  return isProviderStatusApiMode();
}

export async function activatePaidRoiApi() {
  await hydrateProviderStatus();
}

export function deactivatePaidRoiApi() {
  resetProviderStatus();
}

export async function hydratePaidCaches(days = 7) {
  await hydrateProviderStatus(days);
}

/** @deprecated use hydratePaidCaches */
export async function hydrateRoiCache(days = 7) {
  await hydratePaidCaches(days);
}

/** @returns {typeof ROI_FREE_METRICS} */
export function getRoiMetrics() {
  return getRoiMetricsFromStatus() ?? ROI_FREE_METRICS;
}

/** @returns {object|null} */
export function getPaidOperationalStatus() {
  return getPaidOperationalStatusFromCache();
}
