/** 17c — 운영 문의 티켓 (프리뷰 sessionStorage `[임시]`) */

import {
  isSupportApiMode,
  getTicketsCache,
  apiCreateTicket,
  apiUpdateTicketStatus,
  apiUpdateTicketReply,
} from './support-backend.js';

const KEY = 'study114-support-tickets-v1';

/**
 * @typedef {'open'|'in_progress'|'closed'} TicketStatus
 */

/**
 * @typedef {object} SupportTicket
 * @property {string} id
 * @property {string} email
 * @property {string} category
 * @property {string} body
 * @property {string} role
 * @property {TicketStatus} status
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} [adminReplyText]
 * @property {string|null} [adminRepliedAt]
 * @property {boolean} [hasAdminReply]
 * @property {string} [lastActivityAt]
 */

/** @param {any} raw @returns {SupportTicket} */
export function normalizeTicket(raw) {
  const adminReplyText = String(raw?.adminReplyText ?? raw?.admin_reply_text ?? '').trim();
  const adminRepliedAt = raw?.adminRepliedAt ?? raw?.admin_replied_at ?? null;
  const createdAt = String(raw?.createdAt || raw?.created_at || '');
  const updatedAt = String(raw?.updatedAt || raw?.updated_at || createdAt);
  const lastActivityAt = String(adminRepliedAt || updatedAt || createdAt);
  return {
    id: String(raw?.id || ''),
    email: String(raw?.email || ''),
    category: String(raw?.category || raw?.type || 'other'),
    body: String(raw?.body || raw?.message || ''),
    role: String(raw?.role || 'guest'),
    status: raw?.status === 'in_progress' || raw?.status === 'closed' ? raw.status : 'open',
    createdAt,
    updatedAt,
    adminReplyText: adminReplyText || null,
    adminRepliedAt: adminRepliedAt || null,
    hasAdminReply: Boolean(adminReplyText),
    lastActivityAt,
  };
}

/** @param {SupportTicket[]} tickets */
export function sortTicketsLatest(tickets) {
  return [...tickets].sort((a, b) => {
    const keys = (t) => [
      String(t.updatedAt || ''),
      String(t.adminRepliedAt || ''),
      String(t.createdAt || ''),
      String(t.id || ''),
    ];
    const aa = keys(a);
    const bb = keys(b);
    return bb[0].localeCompare(aa[0]) || bb[1].localeCompare(aa[1]) || bb[2].localeCompare(aa[2]) || bb[3].localeCompare(aa[3]);
  });
}

/** @returns {SupportTicket[]} */
function loadAll() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data.tickets) ? data.tickets.map(normalizeTicket) : [];
  } catch {
    return [];
  }
}

/** @param {SupportTicket[]} tickets */
function saveAll(tickets) {
  sessionStorage.setItem(KEY, JSON.stringify({ tickets }));
}

function nextTicketId() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = loadAll().filter((t) => t.id.includes(today)).length + 1;
  return `TKT-${today}-${String(count).padStart(3, '0')}`;
}

/**
 * @param {{ email: string, category: string, body: string, role?: string }} input
 * @returns {SupportTicket}
 */
export async function createTicket(input) {
  if (isSupportApiMode()) {
    return apiCreateTicket(input);
  }
  const now = new Date().toISOString();
  const ticket = {
    id: nextTicketId(),
    email: input.email.trim(),
    category: input.category,
    body: input.body.trim(),
    role: input.role || 'guest',
    status: 'open',
    createdAt: now,
    updatedAt: now,
    adminReplyText: null,
    adminRepliedAt: null,
    hasAdminReply: false,
    lastActivityAt: now,
  };
  const tickets = loadAll();
  tickets.unshift(ticket);
  saveAll(tickets);
  return ticket;
}

/** @returns {SupportTicket[]} */
export function listTickets() {
  if (isSupportApiMode()) {
    return sortTicketsLatest(getTicketsCache().map(normalizeTicket));
  }
  return sortTicketsLatest(loadAll());
}

/** @param {string} email */
export function listTicketsByEmail(email) {
  const normalized = email.trim().toLowerCase();
  return sortTicketsLatest(listTickets().filter((t) => t.email.toLowerCase() === normalized));
}

/** @param {string} id @param {TicketStatus} status */
export async function updateTicketStatus(id, status) {
  if (isSupportApiMode()) {
    return apiUpdateTicketStatus(id, status);
  }
  const tickets = loadAll();
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  tickets[idx] = { ...tickets[idx], status, updatedAt: new Date().toISOString() };
  tickets[idx] = normalizeTicket(tickets[idx]);
  saveAll(tickets);
  return tickets[idx];
}

/** @param {string} id @param {string} replyText */
export async function updateTicketReply(id, replyText) {
  const text = String(replyText || '').trim();
  if (!text) return null;
  if (isSupportApiMode()) {
    return apiUpdateTicketReply(id, text);
  }
  const tickets = loadAll();
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  tickets[idx] = normalizeTicket({
    ...tickets[idx],
    adminReplyText: text,
    adminRepliedAt: now,
    updatedAt: now,
  });
  saveAll(tickets);
  return tickets[idx];
}

/** @param {string} id */
export function getTicketById(id) {
  return loadAll().find((t) => t.id === id) || null;
}
