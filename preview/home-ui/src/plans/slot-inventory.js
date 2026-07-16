/** 슬롯 재고 — API slots 우선, 없으면 runtime seed */

import { getPlanRuntimeSettings } from './runtime-config.js';

/**
 * @typedef {object} SlotInfo
 * @property {number} capacity
 * @property {number} used
 * @property {number} remaining
 */

/**
 * @param {{ prime?: SlotInfo, pick?: SlotInfo } | null | undefined} apiSlots
 * @returns {{ prime: SlotInfo, pick: SlotInfo }}
 */
export function resolveSlotInventory(apiSlots) {
  const s = getPlanRuntimeSettings();
  const primeCap = Number(s.prime_slots) || 3;
  const pickCap = Number(s.pick_slots) || 10;

  const prime = apiSlots?.prime
    ? {
        capacity: Number(apiSlots.prime.capacity) || primeCap,
        used: Number(apiSlots.prime.used) || 0,
        remaining: Math.max(0, Number(apiSlots.prime.remaining ?? primeCap - (apiSlots.prime.used || 0))),
      }
    : { capacity: primeCap, used: 0, remaining: primeCap };

  const pick = apiSlots?.pick
    ? {
        capacity: Number(apiSlots.pick.capacity) || pickCap,
        used: Number(apiSlots.pick.used) || 0,
        remaining: Math.max(0, Number(apiSlots.pick.remaining ?? pickCap - (apiSlots.pick.used || 0))),
      }
    : { capacity: pickCap, used: 0, remaining: pickCap };

  return { prime, pick };
}

/** @param {string} productCode @param {{ prime: SlotInfo, pick: SlotInfo }} inv */
export function getSlotForProduct(productCode, inv) {
  if (productCode === 'prime') return inv.prime;
  if (productCode === 'pick') return inv.pick;
  return null;
}
