/**
 * 16§7 P16-04 — provider-status.js thin re-export (하위 호환)
 */

export {
  hydrateProviderStatus,
  hydrateProviderEntitlementOnly as hydrateProviderEntitlement,
  resetProviderStatus as resetProviderEntitlement,
  canColdMemoFromEntitlement,
  isColdMemoBypass,
  getMemoTicketsRemaining,
  getMemoNearestExpiry,
  getRequestViewTicketsRemaining as getRequestViewTicketsFromEntitlement,
  getMemoGateState,
  getProviderStatus,
} from './provider-status.js';

import { canColdMemoFromEntitlement } from './provider-status.js';

/** @deprecated use canColdMemoFromEntitlement */
export function isServerColdMemoAllowed() {
  return canColdMemoFromEntitlement();
}
