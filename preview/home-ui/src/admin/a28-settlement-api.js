const CREDENTIALS = { credentials: 'include' };

async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.message || 'admin api error');
    err.code = data.error || '';
    err.status = res.status;
    throw err;
  }
  return data;
}

/** @param {string} period @param {string} [date] */
export async function fetchSettlementReport(period, date = '') {
  const params = new URLSearchParams();
  params.set('period', period);
  if (date) params.set('date', date);
  const res = await fetch(`/api/admin/settlement-report.php?${params}`, CREDENTIALS);
  return readJson(res);
}

/** @param {string} period @param {string} date @param {string} line @param {number} [page] */
export async function fetchSettlementLines(period, date, line, page = 1) {
  const params = new URLSearchParams();
  params.set('period', period);
  params.set('date', date);
  params.set('line', line);
  params.set('page', String(page));
  const res = await fetch(`/api/admin/settlement-lines.php?${params}`, CREDENTIALS);
  return readJson(res);
}
