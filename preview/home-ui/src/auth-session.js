/**
 * 2장 — 세션 연동 (PHP @ :8080 via Vite proxy)
 * handoff store API 모드 진입점
 */

import { activateHandoffApi, deactivateHandoffApi } from './handoff-backend.js';
import { deactivatePaidRoiApi } from './paid-backend.js';
import { activateMessagesApi, deactivateMessagesApi } from './messages-backend.js';
import { hydrateProviderStatus, resetProviderStatus } from './provider-status.js';
import { hydrateProviderNotices, resetProviderNotices } from './provider-notices.js';
import { hydrateExposureBridge, resetExposureBridge } from './exposure-bridge.js';
import { activateRegistrationsApi, deactivateRegistrationsApi } from './registrations-backend.js';
import { deactivateBoardApi } from './board/board-backend.js';
import { resetConcernData } from './concern/store.js';
import { navigate, setActiveRole } from './state.js';
import { noteAuthRoleType } from './auth-role.js';
import {
  basicRegisterPathForMe,
  oauthRoleSelectionUrl,
  redirectToEmailVerifyWait,
  isGuidePublicPath,
} from '../../shared/auth-redirect.js';
import { AUTH_UI_BASE } from '../../shared/preview-links.js';
import {
  clearStoredStudentBranch,
  failStudentBranchSession,
  noteSessionStudentBranch,
} from '../../shared/student-branch-store.js';

const CREDENTIALS = { credentials: 'include' };

/** @typedef {{ user_id: number, email: string, role_type: string, name: string, email_verified?: boolean, oauth_role_pending?: boolean, phone_verified?: boolean, admin_level?: string|null, must_change_password?: boolean, oauth_providers?: string[], oauth_provider_labels?: string[] }} AuthUser */

/** @type {AuthUser|null} */
let currentUser = null;

/**
 * me.php 확인 결과.
 * unconfirmed(확인 실패)여도 currentUser 는 지우지 않는다.
 * 비밀번호·토큰은 저장하지 않고, 브라우저 저장소에도 새로 쓰지 않는다.
 * @typedef {'unknown'|'authenticated'|'anonymous'|'unconfirmed'} SessionConfirmStatus
 */

/** @type {SessionConfirmStatus} */
let sessionConfirmStatus = 'unknown';

/** 네트워크 오류·5xx 만 다시 시도한다. 401·403 은 포함하지 않는다. */
const SESSION_RETRY_DELAYS_MS = [800, 2000];

export const ROLE_HOME = {
  guardian_student: '/parent',
  study_room_owner: '/study-room',
  tutor: '/tutor',
  // admin: 사이트 기본 랜딩이 아님 — #/admin은 명시 진입만
};

const ROLE_ACTIVE = {
  guardian_student: 'parent',
  study_room_owner: 'study_room',
  tutor: 'tutor',
};

const PROVIDER_ROLES = new Set(['study_room_owner', 'tutor']);

async function activateProviderApis(roleType) {
  await activateHandoffApi();
  if (PROVIDER_ROLES.has(roleType)) {
    await hydrateProviderStatus();
    await hydrateProviderNotices();
  } else {
    deactivatePaidRoiApi();
  }
}

function deactivateProviderApis() {
  deactivateHandoffApi();
  deactivatePaidRoiApi();
}

/** @returns {AuthUser|null} */
export function getAuthUser() {
  return currentUser;
}

/** @returns {SessionConfirmStatus} */
export function getSessionConfirmStatus() {
  return sessionConfirmStatus;
}

export function isLoggedIn() {
  return currentUser !== null;
}

export function isAdminUser() {
  return Boolean(currentUser?.admin_level) || currentUser?.role_type === 'admin';
}

function waitForSessionRetry(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** @param {number} status */
function isRetryableMeStatus(status) {
  return status === 0 || (status >= 500 && status <= 599);
}

class SessionUnconfirmedError extends Error {
  /** @param {unknown} cause */
  constructor(cause) {
    super('me.php 확인 실패', { cause });
    this.name = 'SessionUnconfirmedError';
  }
}

/**
 * me.php 한 번.
 * 네트워크 오류·5xx 는 다시 시도하고, 401·403 을 포함한 그 외 응답은 그대로 끝낸다.
 * @returns {Promise<{ kind: 'retry', error: unknown } | { kind: 'done', res: Response, data: Record<string, unknown> }>}
 */
async function requestMeOnce() {
  try {
    const res = await fetch('/api/auth/me.php', CREDENTIALS);
    const data = await res.json().catch(() => ({}));
    if (isRetryableMeStatus(res.status)) {
      return { kind: 'retry', error: new Error(`HTTP ${res.status}`) };
    }
    return { kind: 'done', res, data };
  } catch (err) {
    return { kind: 'retry', error: err };
  }
}

function giveUpSessionCheck(error) {
  throw new SessionUnconfirmedError(error);
}

/** @returns {Promise<AuthUser|null>} */
export async function fetchSession() {
  /** @type {unknown} */
  let lastError = null;
  const attempts = SESSION_RETRY_DELAYS_MS.length + 1;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = await requestMeOnce();
    if (result.kind === 'retry') {
      lastError = result.error;
      if (attempt < SESSION_RETRY_DELAYS_MS.length) {
        await waitForSessionRetry(SESSION_RETRY_DELAYS_MS[attempt]);
        continue;
      }
      giveUpSessionCheck(lastError);
    }
    const { res, data } = result;
    if (!res.ok) {
      failStudentBranchSession();
      return null;
    }
    noteSessionStudentBranch(data);
    if (!data.ok || !data.authenticated) {
      return null;
    }
    if (data.needs_account_contact) {
      window.location.replace(`${String(AUTH_UI_BASE).replace(/\/$/, '')}/#/signup/account-contact`);
      return null;
    }
    // admin_level은 콘솔 RBAC 전용. 가입완료(email_verified) 예외가 아니다.
    if (!data.email_verified) {
      if (isGuidePublicPath()) {
        return {
          user_id: data.user_id,
          email: data.email,
          role_type: data.role_type,
          name: data.name,
          email_verified: false,
          oauth_role_pending: data.oauth_role_pending === true,
          admin_level: data.admin_level ?? null,
          must_change_password: Boolean(data.must_change_password),
          oauth_providers: Array.isArray(data.oauth_providers) ? data.oauth_providers : [],
          oauth_provider_labels: Array.isArray(data.oauth_provider_labels) ? data.oauth_provider_labels : [],
          phone_verified: Boolean(data.phone_verified),
        };
      }
      redirectToEmailVerifyWait();
      return null;
    }
    if (data.oauth_role_pending) {
      window.location.href = oauthRoleSelectionUrl();
      return null;
    }
    // 기본정보를 다 채우기 전(서버 판정)에는 역할과 관계없이 사이트를 쓸 수 없다. 기본정보 화면부터 다시 채운다.
    if (data.needs_basic_register && !isGuidePublicPath()) {
      window.location.replace(`${String(AUTH_UI_BASE).replace(/\/$/, '')}/#${basicRegisterPathForMe(data)}`);
      return null;
    }
    return {
      user_id: data.user_id,
      email: data.email,
      role_type: data.role_type,
      name: data.name,
      email_verified: Boolean(data.email_verified),
      admin_level: data.admin_level ?? null,
      must_change_password: Boolean(data.must_change_password),
      oauth_providers: Array.isArray(data.oauth_providers) ? data.oauth_providers : [],
      oauth_provider_labels: Array.isArray(data.oauth_provider_labels) ? data.oauth_provider_labels : [],
      phone_verified: Boolean(data.phone_verified),
    };
  }
}

export function isEmailVerified() {
  return Boolean(currentUser?.email_verified);
}

/** 사이트 표시명 세션 동기화 (auth email 불변) */
export function setAuthDisplayName(name) {
  if (!currentUser) return;
  currentUser = { ...currentUser, name: String(name || '').trim() };
  window.dispatchEvent(new CustomEvent('auth:profile', { detail: currentUser }));
}

function applyRoleContext(roleType) {
  noteAuthRoleType(roleType);
  const active = ROLE_ACTIVE[roleType];
  if (active) setActiveRole(active);
}

function clearAuthRole() {
  noteAuthRoleType('');
}

/**
 * 쪽지·등록 등 부가 API 실패가 로그인 세션을 지우지 않게 격리.
 * deferExposurePool: 공부방찾기 첫 진입. 노출 풀 3건은 여기서 보내지 않는다.
 * @param {{ deferExposurePool?: boolean }} [opts]
 */
async function hydrateSessionDependencies(opts = {}) {
  await activateProviderApis(currentUser.role_type).catch((err) => {
    console.warn('[auth] provider hydrate skipped', err);
  });
  await activateMessagesApi().catch((err) => {
    console.warn('[auth] messages hydrate skipped', err);
  });
  await activateRegistrationsApi().catch((err) => {
    console.warn('[auth] registrations hydrate skipped', err);
  });
  if (opts.deferExposurePool === true) return;
  await hydrateExposureBridge().catch((err) => {
    console.warn('[auth] exposure hydrate skipped', err);
  });
}

/**
 * @param {boolean} [navigateHome]
 * @param {{ deferExposurePool?: boolean }} [opts]
 */
export async function initAuthSession(navigateHome = false, opts = {}) {
  try {
    const user = await fetchSession();
    if (!user) {
      sessionConfirmStatus = 'anonymous';
      currentUser = null;
      clearAuthRole();
      deactivateProviderApis();
      deactivateMessagesApi();
      deactivateRegistrationsApi();
      resetProviderStatus();
      resetProviderNotices();
      resetExposureBridge();
      return null;
    }
    currentUser = user;
    sessionConfirmStatus = 'authenticated';
    const contextRoleType = user.oauth_role_pending === true ? '' : user.role_type;
    applyRoleContext(contextRoleType);
    if (navigateHome && ROLE_HOME[contextRoleType]) {
      await hydrateSessionDependencies(opts);
      navigate(ROLE_HOME[contextRoleType]);
      return user;
    }
    // 부가 로딩이 끝나기 전에 역할 화면을 그리게, 호출자가 바로 받게 한다.
    void hydrateSessionDependencies(opts);
    return user;
  } catch (err) {
    if (err instanceof SessionUnconfirmedError) {
      sessionConfirmStatus = 'unconfirmed';
      console.warn('[auth] me.php 확인 실패 — 마지막 로그인 상태를 유지합니다', err.cause ?? err);
      return currentUser;
    }
    sessionConfirmStatus = 'authenticated';
    console.warn('[auth] 로그인 뒤 부가 정보 확인 실패 — 로그인 상태는 유지합니다', err);
    return currentUser;
  }
}

export async function logout() {
  try {
    await fetch('/api/auth/logout.php', { method: 'POST', ...CREDENTIALS });
  } catch (err) {
    console.warn('[auth] logout', err);
  }
  currentUser = null;
  sessionConfirmStatus = 'anonymous';
  clearAuthRole();
  clearStoredStudentBranch();
  deactivateProviderApis();
  deactivateMessagesApi();
  deactivateRegistrationsApi();
  resetProviderStatus();
  resetProviderNotices();
  resetExposureBridge();
  deactivateBoardApi();
  resetConcernData();
  window.dispatchEvent(new CustomEvent('auth:logout'));
}
