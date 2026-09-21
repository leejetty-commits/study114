/**
 * 2·14장 — auth API 클라이언트 (study114_dev @ :8080 via Vite proxy)
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** PHP notice가 JSON 앞에 붙어도 본문을 살린다. */
export function parseApiJson(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return {};
      }
    }
    return {};
  }
}

async function postJson(url, body, { credentials = 'include' } = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials,
    body: JSON.stringify(body),
  });
  const rawText = await res.text();
  const data = parseApiJson(rawText);
  if (!res.ok || !data.ok) {
    if (import.meta.env?.DEV) {
      console.warn('[auth-api]', url, {
        status: res.status,
        error: data.error || null,
        message: data.message || null,
        ok: data.ok,
        // 본문·토큰·이메일 등 개인정보는 남기지 않음
      });
    }
    const fallback =
      res.status === 422
        ? '입력값을 확인해 주세요.'
        : res.status >= 500
          ? '저장에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          : `서버 오류 (${res.status})`;
    const err = new Error(data.message || fallback);
    if (data.error) {
      err.code = data.error;
    }
    err.status = res.status;
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
    throw new Error(data.message || `서버 오류 (${res.status})`);
  }
  return data;
}

/**
 * @param {string} roleUi student | study_room | tutor
 */
export async function oauthCompleteRoleApi(roleUi) {
  return postJson('/api/auth/oauth/complete-role.php', { role: roleUi });
}

export async function saveAccountContactApi(payload) {
  return postJson('/api/auth/account-contact.php', payload);
}

export {
  passwordForgotApi,
  passwordValidateTokenApi,
  passwordResetApi,
} from './password-reset-api.js';

export async function signupApi(payload) {
  return postJson('/api/auth/signup.php', payload);
}

/** @returns {Promise<{regions: Array, complexes: Array, cities: Array}>} */
export async function fetchRegions() {
  const data = await postJson('/api/auth/regions.php', { action: 'list' }, { credentials: 'omit' });
  return {
    regions: data.regions ?? [],
    complexes: data.complexes ?? [],
    cities: data.cities ?? [],
  };
}

/**
 * @param {string} roleUi student | study_room | tutor
 * @param {Record<string, unknown>} payload
 */
export async function basicRegisterApi(roleUi, payload) {
  return postJson('/api/auth/basic-register.php', { role: roleUi, payload });
}
