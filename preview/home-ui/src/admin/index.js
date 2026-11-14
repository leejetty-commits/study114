import { getAdminPath } from '../state.js';
import { initAuthSession, isAdminUser } from '../auth-session.js';
import { activateAdminApi } from './admin-backend.js';
import { activateContentConfigApi } from '../content-config-backend.js';
import { adminFetch, adminHttpStatus } from './admin-fetch.js';
import { normalizeAdminPath } from './router.js';
import { renderAdminShell, renderAdminDeniedFrame, bindAdminShellEvents } from './shell.js';
import { renderA28Screen, bindA28ScreenEvents } from './a28-screens.js';
import {
  canAccessAdminPath,
  renderAdminAccessGate,
  renderNonAdminDenied,
  mustChangeAdminPassword,
  renderMustChangePasswordGate,
  needsConsoleUnlock,
  renderConsoleUnlockGate,
  consolePasswordShapeOk,
} from './admin-guard.js';

export function renderAdminDenied() {
  return renderAdminDeniedFrame(renderNonAdminDenied());
}

export function renderAdmin() {
  if (!isAdminUser()) return renderAdminDenied();
  const path = getAdminPath();
  const normalized = normalizeAdminPath(path) || '/admin';
  if (mustChangeAdminPassword()) {
    return renderAdminShell(path, renderMustChangePasswordGate());
  }
  if (needsConsoleUnlock()) {
    return renderAdminDeniedFrame(renderConsoleUnlockGate());
  }
  const bodyHtml = canAccessAdminPath(normalized)
    ? renderA28Screen(path)
    : renderAdminAccessGate(normalized);
  return renderAdminShell(path, bodyHtml);
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindAdminEvents(root, rerender) {
  const path = getAdminPath();
  bindAdminShellEvents(root, rerender);
  if (!isAdminUser()) return;

  const mustForm = root.querySelector('[data-form="admin-must-change-password"]');
  if (mustForm instanceof HTMLFormElement) {
    mustForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = root.querySelector('[data-pw-error]');
      if (errEl) {
        errEl.hidden = true;
        errEl.textContent = '';
      }
      const fd = new FormData(mustForm);
      try {
        const res = await fetch('/api/auth/password/change.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            current_password: String(fd.get('current_password') || ''),
            password: String(fd.get('password') || ''),
            password_confirm: String(fd.get('password_confirm') || ''),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          throw new Error(data.message || '비밀번호 변경에 실패했습니다.');
        }
        await initAuthSession(false);
        rerender();
      } catch (err) {
        if (errEl) {
          errEl.hidden = false;
          errEl.textContent = err instanceof Error ? err.message : '변경 실패';
        }
      }
    });
    return;
  }

  const unlockForm = root.querySelector('[data-form="admin-console-unlock"]');
  if (unlockForm instanceof HTMLFormElement) {
    bindConsoleUnlock(root, unlockForm, rerender);
    return;
  }

  bindA28ScreenEvents(root, path, rerender);
}

/** @param {HTMLElement} root @param {HTMLFormElement} form @param {() => void} rerender */
function bindConsoleUnlock(root, form, rerender) {
  const messageEl = root.querySelector('[data-console-unlock-message]');
  const errorEl = root.querySelector('[data-console-unlock-error]');
  const button = form.querySelector('button[type="submit"]');
  const input = form.querySelector('input[name="password"]');

  const showMessage = (text) => {
    if (!(messageEl instanceof HTMLElement)) return;
    messageEl.hidden = !text;
    messageEl.textContent = text || '';
  };
  const showError = (text) => {
    if (!(errorEl instanceof HTMLElement)) return;
    errorEl.hidden = !text;
    errorEl.textContent = text || '';
  };

  adminFetch('/api/admin/console-unlock.php')
    .then((res) => res.json().catch(() => ({})).then((data) => ({ res, data })))
    .then(({ res, data }) => {
      const status = adminHttpStatus(res, data);
      if (status === 401 || data.error === 'forbidden') return;
      const message = String(data.message || '');
      showMessage(message);
      if (data.locked || data.configured === false) {
        if (input instanceof HTMLInputElement) input.disabled = true;
        if (button instanceof HTMLButtonElement) button.disabled = true;
      }
    })
    .catch(() => {
      showError('잠금 상태를 확인하지 못했어요.');
    });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    const password = input instanceof HTMLInputElement ? input.value : '';
    if (!consolePasswordShapeOk(password)) {
      showError('비밀번호가 맞지 않아요.');
      if (input instanceof HTMLInputElement) input.value = '';
      return;
    }
    try {
      const res = await adminFetch('/api/admin/console-unlock.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (input instanceof HTMLInputElement) input.value = '';
      if (!data.ok) {
        showError(String(data.message || '잠금 해제에 실패했어요.'));
        if (data.error === 'console_locked' || data.error === 'console_password_unset') {
          showMessage(String(data.message || ''));
          if (input instanceof HTMLInputElement) input.disabled = true;
          if (button instanceof HTMLButtonElement) button.disabled = true;
        }
        return;
      }
      await initAuthSession(false);
      await activateAdminApi().catch((err) => {
        console.warn('[admin] api disabled — static A28 fallback', err);
      });
      await activateContentConfigApi().catch((err) => {
        console.warn('[content-config] api disabled — sessionStorage fallback', err);
      });
      rerender();
    } catch {
      if (input instanceof HTMLInputElement) input.value = '';
      showError('잠금 해제에 실패했어요.');
    }
  });
}

export { getDefaultAdminPath } from './router.js';
