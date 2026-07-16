/** 26장 정책 정적 페이지
 * `changelog` 는 정적 slug가 아님 — boardKey `policy-log` 전용 route (phase2, 23·30장).
 * STATIC_POLICY_RESERVED_SLUGS 와 동일 집합을 유지할 것.
 */

const POLICY_SLUGS = ['terms', 'privacy', 'platform', 'trust', 'safety', 'student-privacy', 'reporting'];

/** boardKey `policy-log` — 정적 P26 와 충돌하지 않는 전용 slug (구현 후순위) */
export const POLICY_CHANGELOG_PATH = '/policy/changelog';

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
