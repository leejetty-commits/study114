import {
  fetchNotices,
  saveNotice,
  removeNotice,
  resetNoticeSeed,
  fetchTickets,
  submitTicket,
  patchTicketStatus,
} from './support-api.js';

let apiMode = false;
/** @type {any[]} */
let noticesCache = [];
/** @type {any[]} */
let ticketsCache = [];

export function isSupportApiMode() {
  return apiMode;
}

function resetCaches() {
  noticesCache = [];
  ticketsCache = [];
}

export async function activateSupportApi() {
  apiMode = true;
  await hydrateSupportCache();
}

export function deactivateSupportApi() {
  apiMode = false;
  resetCaches();
}

export async function hydrateSupportCache(ticketEmail = '') {
  const [noticeRes, ticketRes] = await Promise.all([
    fetchNotices().catch(() => ({ notices: [] })),
    fetchTickets(ticketEmail).catch(() => ({ tickets: [] })),
  ]);
  noticesCache = (noticeRes.notices ?? []).map((n) => ({ ...n, body: [...(n.body ?? [])] }));
  ticketsCache = (ticketRes.tickets ?? []).map((t) => ({ ...t }));
}

export function getNoticesCache() {
  return noticesCache.map((n) => ({ ...n, body: [...(n.body ?? [])] }));
}

export function getTicketsCache() {
  return ticketsCache.map((t) => ({ ...t }));
}

export function getTicketsCacheByEmail(email) {
  const norm = email.trim().toLowerCase();
  return getTicketsCache().filter((t) => String(t.email || '').toLowerCase() === norm);
}

function upsertNoticeCache(row) {
  const idx = noticesCache.findIndex((n) => n.id === row.id);
  const copy = { ...row, body: [...(row.body ?? [])] };
  if (idx >= 0) noticesCache[idx] = copy;
  else noticesCache.unshift(copy);
  noticesCache.sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));
  return copy;
}

function removeNoticeCache(id) {
  noticesCache = noticesCache.filter((n) => n.id !== id);
}

function upsertTicketCache(row) {
  const idx = ticketsCache.findIndex((t) => t.id === row.id);
  const copy = { ...row };
  if (idx >= 0) ticketsCache[idx] = copy;
  else ticketsCache.unshift(copy);
  ticketsCache.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || String(b.id).localeCompare(String(a.id)));
  return copy;
}

export async function apiSaveNotice(input) {
  const data = await saveNotice(input);
  if (data.notice) upsertNoticeCache(data.notice);
  return data.notice;
}

export async function apiDeleteNotice(id) {
  await removeNotice(id);
  removeNoticeCache(id);
}

export async function apiResetNoticeSeed() {
  const data = await resetNoticeSeed();
  noticesCache = (data.notices ?? []).map((n) => ({ ...n, body: [...(n.body ?? [])] }));
  return getNoticesCache();
}

export async function apiCreateTicket(input) {
  const data = await submitTicket(input);
  if (data.ticket) upsertTicketCache(data.ticket);
  return data.ticket;
}

export async function apiUpdateTicketStatus(id, status) {
  const data = await patchTicketStatus(id, status);
  if (data.ticket) upsertTicketCache(data.ticket);
  return data.ticket;
}
