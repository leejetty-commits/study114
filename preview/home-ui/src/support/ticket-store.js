/** 17c — 운영 문의 티켓 (프리뷰 sessionStorage `[임시]`) */

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
 */

/** @returns {SupportTicket[]} */
function loadAll() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data.tickets) ? data.tickets : [];
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
export function createTicket(input) {
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
  };
  const tickets = loadAll();
  tickets.unshift(ticket);
  saveAll(tickets);
  return ticket;
}

/** @returns {SupportTicket[]} */
export function listTickets() {
  return loadAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** @param {string} email */
export function listTicketsByEmail(email) {
  const normalized = email.trim().toLowerCase();
  return listTickets().filter((t) => t.email.toLowerCase() === normalized);
}

/** @param {string} id @param {TicketStatus} status */
export function updateTicketStatus(id, status) {
  const tickets = loadAll();
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  tickets[idx] = { ...tickets[idx], status, updatedAt: new Date().toISOString() };
  saveAll(tickets);
  return tickets[idx];
}

/** @param {string} id */
export function getTicketById(id) {
  return loadAll().find((t) => t.id === id) || null;
}
