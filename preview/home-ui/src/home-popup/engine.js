/** 홈 팝업 표시 규칙. DOM·저장소에 접근하지 않는다. */

const TYPE_RANK = { notice: 0, event: 1, ad: 2 };

/** @returns {string} YYYY-MM-DD in Asia/Seoul */
export function seoulToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now);
}

/**
 * @param {string | null | undefined} startAt
 * @param {string | null | undefined} endAt
 * @param {string} today
 */
function inWindow(startAt, endAt, today) {
  if (startAt && today < startAt) return false;
  if (endAt && today > endAt) return false;
  return true;
}

/**
 * @param {string[] | undefined} audience
 * @param {string} surface guest | studyRoom | tutor | student
 */
function matchesAudience(audience, surface) {
  if (!Array.isArray(audience) || audience.length === 0) return false;
  if (audience.includes('all')) return true;
  return audience.includes(surface);
}

/**
 * @param {Array<Record<string, unknown>>} list
 * @param {{ surface: string, today: string, isHidden?: (id: string) => boolean }} ctx
 * @returns {Record<string, unknown> | null}
 */
export function pickHomePopup(list, ctx) {
  const surface = ctx?.surface || '';
  const today = ctx?.today || '';
  const isHidden = typeof ctx?.isHidden === 'function' ? ctx.isHidden : () => false;
  const rows = (Array.isArray(list) ? list : []).filter((row) => {
    if (!row || row.published !== true) return false;
    if (!inWindow(row.startAt, row.endAt, today)) return false;
    if (!matchesAudience(row.audience, surface)) return false;
    if (isHidden(String(row.id))) return false;
    return TYPE_RANK[row.type] !== undefined;
  });
  rows.sort((a, b) => {
    const byType = TYPE_RANK[a.type] - TYPE_RANK[b.type];
    if (byType !== 0) return byType;
    const byOrder = Number(a.sortOrder) - Number(b.sortOrder);
    if (byOrder !== 0) return byOrder;
    return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
  });
  return rows[0] || null;
}
