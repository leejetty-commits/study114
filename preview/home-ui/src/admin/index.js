import { getAdminPath } from '../state.js';
import { initAuthSession } from '../auth-session.js';
import { normalizeAdminPath } from './router.js';
import { renderAdminShell, bindAdminShellEvents } from './shell.js';
import { renderA28Screen, bindA28ScreenEvents } from './a28-screens.js';
import {
  canAccessAdminPath,
  renderAdminAccessGate,
  mustChangeAdminPassword,
  renderMustChangePasswordGate,
} from './admin-guard.js';

export function renderAdmin() {
  const path = getAdminPath();
  const normalized = normalizeAdminPath(path) || '/admin';
  if (mustChangeAdminPassword()) {
    return renderAdminShell(path, renderMustChangePasswordGate());
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

  bindA28ScreenEvents(root, path, rerender);
}

export { getDefaultAdminPath } from './router.js';
