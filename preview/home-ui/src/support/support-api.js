const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || 'support api error');
  }
  return data;
}

export async function fetchNotices() {
  const res = await fetch('/api/support/notices.php');
  return readJson(res);
}

export async function saveNotice(input) {
  const res = await fetch('/api/support/notices.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  return readJson(res);
}

export async function removeNotice(id) {
  const res = await fetch(`/api/support/notices.php?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return readJson(res);
}

export async function resetNoticeSeed() {
  const res = await fetch('/api/support/notices.php', {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify({ action: 'reset_seed' }),
  });
  return readJson(res);
}

export async function fetchTickets(email = '') {
  const q = email ? `?email=${encodeURIComponent(email)}` : '';
  const res = await fetch(`/api/support/tickets.php${q}`);
  return readJson(res);
}

export async function submitTicket(input) {
  const res = await fetch('/api/support/tickets.php', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  return readJson(res);
}

export async function patchTicketStatus(id, status) {
  const res = await fetch('/api/support/tickets.php', {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify({ id, status }),
  });
  return readJson(res);
}
