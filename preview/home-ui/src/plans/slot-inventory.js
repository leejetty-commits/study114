/**
 * 슬롯 재고 — 공부방 Prime ONLY
 * Pick·과외쌤은 순환형 → 재고/매진/점유 UI에 쓰지 않음 (34-1 · 잠금1)
 */

import { getPlanRuntimeSettings } from './runtime-config.js';

/**
 * @typedef {object} SlotInfo
 * @property {number} capacity
 * @property {number} used
 * @property {number} remaining
 */

/**
 * @param {{ prime?: SlotInfo, pick?: SlotInfo } | null | undefined} apiSlots
 * @returns {{ prime: SlotInfo }}
 */
export function resolveRoomPrimeInventory(apiSlots) {
  const s = getPlanRuntimeSettings();
  const primeCap = Number(s.prime_slots) || 3;

  const prime = apiSlots?.prime
    ? {
        capacity: Number(apiSlots.prime.capacity) || primeCap,
        used: Number(apiSlots.prime.used) || 0,
        remaining: Math.max(
          0,
          Number(apiSlots.prime.remaining ?? primeCap - (apiSlots.prime.used || 0)),
        ),
      }
    : { capacity: primeCap, used: 0, remaining: primeCap };

  // 정책상 공부방 Prime은 항상 3자리
  return {
    prime: {
      capacity: 3,
      used: Math.min(3, Math.max(0, prime.used)),
      remaining: Math.max(0, 3 - Math.min(3, Math.max(0, prime.used))),
    },
  };
}

/**
 * @deprecated Pick 재고는 폐기. 호환용 — pick은 항상 null로 취급할 것.
 * @param {{ prime?: SlotInfo, pick?: SlotInfo } | null | undefined} apiSlots
 */
export function resolveSlotInventory(apiSlots) {
  const { prime } = resolveRoomPrimeInventory(apiSlots);
  return {
    prime,
    pick: { capacity: 0, used: 0, remaining: 0 },
  };
}

/**
 * 공부방 Prime만 슬롯 정보 반환. Pick·기타는 null.
 * @param {string} productCode
 * @param {{ prime: SlotInfo, pick?: SlotInfo }} inv
 * @param {'study_room'|'tutor'|string} role
 */
export function getSlotForProduct(productCode, inv, role = 'study_room') {
  if (role !== 'study_room') return null;
  if (productCode === 'prime') return inv.prime;
  return null;
}

/**
 * 점유판 3칸 모델 (좌측부터 자동배정 · 슬롯 번호 선택 UI 없음)
 * @param {SlotInfo} prime
 * @returns {{ index: number, status: 'occupied'|'available', label: string, endsAt: string|null }[]}
 */
export function buildRoomPrimeBoard(prime) {
  const used = Math.min(3, Math.max(0, Number(prime?.used) || 0));
  /** @type {{ index: number, status: 'occupied'|'available', label: string, endsAt: string|null }[]} */
  const cells = [];
  for (let i = 1; i <= 3; i += 1) {
    if (i <= used) {
      cells.push({
        index: i,
        status: 'occupied',
        label: '이용 중',
        endsAt: null, // 실제 종료일은 API 연동 후 채움 · 없으면 표시 생략
      });
    } else {
      cells.push({
        index: i,
        status: 'available',
        label: '구매 가능',
        endsAt: null,
      });
    }
  }
  return cells;
}

export function isRoomPrimeFull(prime) {
  return (Number(prime?.remaining) || 0) <= 0;
}
