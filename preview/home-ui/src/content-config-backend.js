import {
  fetchBoardChannels,
  saveBoardChannelApi,
  fetchRightRailSlots,
  saveRightRailSlotApi,
} from './content-config-api.js';

let apiMode = false;
/** @type {any[]} */
let channelCache = [];
/** @type {any[]} */
let railCache = [];

export function isContentConfigApiMode() {
  return apiMode;
}

export function getContentChannelCache() {
  return channelCache.map((row) => ({ ...row }));
}

export function getContentRailCache() {
  return railCache.map((row) => ({ ...row }));
}

export async function activateContentConfigApi() {
  apiMode = true;
  await hydrateContentConfigCache();
}

export function deactivateContentConfigApi() {
  apiMode = false;
  channelCache = [];
  railCache = [];
}

export async function hydrateContentConfigCache() {
  const [channelRes, railRes] = await Promise.all([
    fetchBoardChannels().catch(() => ({ channels: [] })),
    fetchRightRailSlots().catch(() => ({ slots: [] })),
  ]);
  channelCache = (channelRes.channels ?? []).map((row) => ({ ...row }));
  railCache = (railRes.slots ?? []).map((row) => ({ ...row }));
}

/** @param {Record<string, unknown>} input */
export async function apiPersistBoardChannel(input) {
  const data = await saveBoardChannelApi(input);
  if (data.channel) {
    const idx = channelCache.findIndex((row) => row.boardKey === data.channel.boardKey);
    if (idx >= 0) channelCache[idx] = { ...data.channel };
    else channelCache.unshift({ ...data.channel });
  }
  return data.channel;
}

/** @param {Record<string, unknown>} input */
export async function apiPersistRightRailSlot(input) {
  const data = await saveRightRailSlotApi(input);
  if (data.slot) {
    const idx = railCache.findIndex((row) => row.slotKey === data.slot.slotKey);
    if (idx >= 0) railCache[idx] = { ...data.slot };
    else railCache.unshift({ ...data.slot });
  }
  return data.slot;
}
