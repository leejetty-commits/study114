/**
 * 아이디 찾기 API 클라이언트
 */

/**
 * @param {{ name: string, phone: string }} payload
 * @returns {Promise<{
 *   ok: true,
 *   accounts: Array<{
 *     masked_email: string,
 *     providers: string[],
 *     provider_labels: string[],
 *     login_methods: string[]
 *   }>
 * }>}
 */
export async function findIdApi(payload) {
  const res = await fetch('/api/auth/find-id.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || `서버 오류 (${res.status})`);
  }
  return data;
}
