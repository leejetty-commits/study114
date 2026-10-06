const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CREDENTIALS = { credentials: 'include' };

async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.message || '요청을 처리하지 못했습니다.');
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function fetchNotices() {
  const res = await fetch('/api/support/notices.php', CREDENTIALS);
  return readJson(res);
}

export async function saveNotice(input) {
  const res = await fetch('/api/support/notices.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify(input),
  });
  return readJson(res);
}

export async function removeNotice(id) {
  const res = await fetch(`/api/support/notices.php?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    ...CREDENTIALS,
  });
  return readJson(res);
}

export async function resetNoticeSeed() {
  const res = await fetch('/api/support/notices.php', {
    method: 'PATCH',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ action: 'reset_seed' }),
  });
  return readJson(res);
}

export async function fetchTickets(email = '') {
  const q = email ? `?email=${encodeURIComponent(email)}` : '';
  const res = await fetch(`/api/support/tickets.php${q}`, CREDENTIALS);
  return readJson(res);
}

export async function fetchMyTickets() {
  const res = await fetch('/api/support/tickets.php?mine=1', CREDENTIALS);
  return readJson(res);
}

export async function fetchAdminTickets({ group = 'open', q = '', page = 1 } = {}) {
  const params = new URLSearchParams({
    admin: '1',
    group,
    q,
    page: String(page),
    per_page: '20',
  });
  const res = await fetch(`/api/support/tickets.php?${params}`, CREDENTIALS);
  return readJson(res);
}

export async function fetchAdminTicketsByUser(userId) {
  const res = await fetch(
    `/api/support/tickets.php?admin=1&user_id=${encodeURIComponent(String(userId))}`,
    CREDENTIALS,
  );
  return readJson(res);
}

export async function submitTicket(input) {
  const res = await fetch('/api/support/tickets.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify(input),
  });
  return readJson(res);
}

export async function patchTicketStatus(id, status) {
  const res = await fetch('/api/support/tickets.php', {
    method: 'PATCH',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ id, status }),
  });
  return readJson(res);
}

export async function patchTicketReply(id, adminReplyText) {
  const res = await fetch('/api/support/tickets.php', {
    method: 'PATCH',
    headers: JSON_HEADERS,
    ...CREDENTIALS,
    body: JSON.stringify({ id, adminReplyText }),
  });
  return readJson(res);
}
