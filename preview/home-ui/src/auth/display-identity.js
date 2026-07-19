/**
 * 사이트 표시 identity — auth email과 분리
 * 내부 oauth_…@users.study114.local 은 사용자-facing 주표시값이 아님
 */

/** @param {string} [email] */
export function isInternalAuthEmail(email) {
  const e = String(email || '')
    .trim()
    .toLowerCase();
  return e.endsWith('@users.study114.local') || /^oauth_/i.test(e.split('@')[0] || '');
}

/**
 * @param {{ name?: string|null, email?: string|null, oauth_provider_labels?: string[] }|null|undefined} user
 * @returns {string}
 */
export function resolveAccountDisplayName(user) {
  const name = String(user?.name || '').trim();
  if (name && !isInternalAuthEmail(name)) return name;
  const labels = Array.isArray(user?.oauth_provider_labels) ? user.oauth_provider_labels.filter(Boolean) : [];
  if (labels.length) return `${labels[0]} 회원`;
  const email = String(user?.email || '').trim();
  if (email && !isInternalAuthEmail(email)) return email;
  return '회원';
}

/**
 * 보조 로그인 계정 문구 — 내부 email은 축약/숨김 가능
 * @param {string} [email]
 * @param {{ revealInternal?: boolean }} [opts]
 */
export function formatLoginAccountLabel(email, opts = {}) {
  const e = String(email || '').trim();
  if (!e) return '';
  if (!isInternalAuthEmail(e)) return e;
  if (opts.revealInternal) return e;
  const local = e.split('@')[0] || '';
  if (local.length <= 14) return `${local}@…`;
  return `${local.slice(0, 12)}…@users.study114.local`;
}
