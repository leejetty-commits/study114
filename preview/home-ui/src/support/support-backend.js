import {
  fetchNotices,
  saveNotice,
  removeNotice,
  resetNoticeSeed,
  fetchTickets,
  fetchMyTickets,
  submitTicket,
  patchTicketStatus,
  patchTicketReply,
} from './support-api.js';

let apiMode = false;
/** @type {any[]} */
let noticesCache = [];
/** @type {any[]} */
let ticketsCache = [];
/** 내 문의 내역 전용. 운영 전체 목록(ticketsCache)과 섞지 않는다. */
/** @type {any[]} */
let myTicketsCache = [];
/** 전체 목록·본인 목록을 401·403으로 못 읽었을 때의 안내 */
let ticketLoadError = '';

export function getTicketLoadError() {
  return ticketLoadError;
}

export function isSupportApiMode() {
  return apiMode;
}

function resetCaches() {
  noticesCache = [];
  ticketsCache = [];
  myTicketsCache = [];
}

/** 부트는 세션 확인 전이라 공지만 받는다. 운영 전체 문의 목록은 관리자 문의 관리 화면이 들어갈 때 받는다. */
export async function activateSupportApi() {
  apiMode = true;
  const noticeRes = await fetchNotices().catch(() => ({ notices: [] }));
  noticesCache = (noticeRes.notices ?? []).map((n) => ({ ...n, body: [...(n.body ?? [])] }));
}

export function deactivateSupportApi() {
  apiMode = false;
  resetCaches();
}

export async function hydrateMyTickets() {
  ticketLoadError = '';
  try {
    const ticketRes = await fetchMyTickets();
    myTicketsCache = (ticketRes.tickets ?? []).map((t) => ({ ...t }));
  } catch (err) {
    const status = Number(err?.status || 0);
    if (status === 401 || status === 403) {
      ticketLoadError =
        err instanceof Error && err.message
          ? err.message
          : '문의 목록을 불러오지 못했습니다. 로그인 상태를 확인해 주세요.';
    }
    myTicketsCache = [];
  }
}

export async function hydrateSupportCache(ticketEmail = '') {
  ticketLoadError = '';
  const [noticeRes, ticketRes] = await Promise.all([
    fetchNotices().catch(() => ({ notices: [] })),
    fetchTickets(ticketEmail).catch((err) => {
      const status = Number(err?.status || 0);
      if (status === 401 || status === 403) {
        ticketLoadError =
          err instanceof Error && err.message
            ? err.message
            : '문의 목록을 불러오지 못했습니다. 로그인 상태를 확인해 주세요.';
      }
      return { tickets: [] };
    }),
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

export function getMyTicketsCache() {
  return myTicketsCache.map((t) => ({ ...t }));
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

function ticketSortStamp(row) {
  return [
    String(row?.updatedAt || row?.updated_at || ''),
    String(row?.adminRepliedAt || row?.admin_replied_at || ''),
    String(row?.createdAt || row?.created_at || ''),
    String(row?.id || ''),
  ];
}

function sortTicketRows(rows) {
  rows.sort((a, b) => {
    const aa = ticketSortStamp(a);
    const bb = ticketSortStamp(b);
    return bb[0].localeCompare(aa[0]) || bb[1].localeCompare(aa[1]) || bb[2].localeCompare(aa[2]) || bb[3].localeCompare(aa[3]);
  });
}

function upsertTicketCache(row) {
  const idx = ticketsCache.findIndex((t) => t.id === row.id);
  const copy = { ...row };
  if (idx >= 0) ticketsCache[idx] = copy;
  else ticketsCache.unshift(copy);
  sortTicketRows(ticketsCache);
  return copy;
}

/** @param {boolean} insert 없으면 같은 id가 이미 있을 때만 바꾼다. */
function upsertMyTicketCache(row, insert) {
  const idx = myTicketsCache.findIndex((t) => t.id === row.id);
  if (idx < 0 && !insert) return;
  const copy = { ...row };
  if (idx >= 0) myTicketsCache[idx] = copy;
  else myTicketsCache.unshift(copy);
  sortTicketRows(myTicketsCache);
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
  if (data.ticket) {
    upsertTicketCache(data.ticket);
    upsertMyTicketCache(data.ticket, true);
  }
  return data.ticket;
}

export async function apiUpdateTicketStatus(id, status) {
  const data = await patchTicketStatus(id, status);
  if (data.ticket) {
    upsertTicketCache(data.ticket);
    upsertMyTicketCache(data.ticket, false);
  }
  return data.ticket;
}

export async function apiUpdateTicketReply(id, adminReplyText) {
  const data = await patchTicketReply(id, adminReplyText);
  if (data.ticket) {
    upsertTicketCache(data.ticket);
    upsertMyTicketCache(data.ticket, false);
  }
  return data.ticket;
}
