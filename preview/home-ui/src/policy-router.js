/** 26장 정책 정적 페이지 */

const POLICY_SLUGS = ['terms', 'privacy', 'platform', 'trust', 'safety', 'student-privacy', 'reporting'];

export function normalizePolicyPath(hashPath) {
  const p = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  if (p === '/policy' || p === '/policy/') return '/policy/terms';
  if (/^\/policy\/[a-z-]+$/.test(p) && POLICY_SLUGS.includes(p.split('/')[2])) return p;
  return null;
}

export function getDefaultPolicyPath() {
  return '/policy/terms';
}

export function getPolicySlug(path) {
  const normalized = normalizePolicyPath(path);
  return normalized ? normalized.split('/')[2] : 'terms';
}
