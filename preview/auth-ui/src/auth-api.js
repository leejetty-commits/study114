/**
 * 2·14장 — auth API 클라이언트 (study114_dev @ :8080 via Vite proxy)
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function postJson(url, body, { credentials = 'include' } = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.message || `API 오류 (${res.status})`);
    if (data.error) {
      err.code = data.error;
    }
    throw err;
  }
  return data;
}

export async function loginApi(payload) {
  return postJson('/api/auth/login.php', payload);
}

export async function fetchMeApi() {
  const res = await fetch('/api/auth/me.php', { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || `API 오류 (${res.status})`);
  }
  return data;
}

/**
 * @param {string} roleUi student | study_room | tutor
 */
export async function oauthCompleteRoleApi(roleUi) {
  return postJson('/api/auth/oauth/complete-role.php', { role: roleUi });
}

export {
  passwordForgotApi,
  passwordValidateTokenApi,
  passwordResetApi,
} from './password-reset-api.js';

export async function signupApi(payload) {
  return postJson('/api/auth/signup.php', payload);
}

/** @returns {Promise<Array<{id: number, label: string}>>} */
export async function fetchRegions() {
  const data = await postJson('/api/auth/regions.php', { action: 'list' }, { credentials: 'omit' });
  return data.regions ?? [];
}

/**
 * @param {string} roleUi student | study_room | tutor
 * @param {Record<string, unknown>} payload
 */
export async function basicRegisterApi(roleUi, payload) {
  return postJson('/api/auth/basic-register.php', { role: roleUi, payload });
}
