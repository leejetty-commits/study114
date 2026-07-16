import { getPlansPath, navigate, getNavRole } from '../state.js';
import { getAuthUser } from '../auth-session.js';
import { renderPlansShell, bindPlansShellEvents } from './shell.js';
import { renderPlansScreen, bindPlansScreenEvents } from './screens.js';
import { guardPlansAccess, resolveAccessNavRole } from '../../../shared/route-access.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

export function renderPlans() {
  const role = resolveAccessNavRole(getAuthUser(), getNavRole());
  const gate = guardPlansAccess(role);
  if (!gate.ok) {
    return `
      <section class="mypage-panel" style="max-width:32rem;margin:2rem auto;padding:1.5rem;">
        <h1>유료상품</h1>
        <p>${esc(gate.message)}</p>
        <p><a href="#${gate.redirect}" class="btn btn--primary" data-nav="${gate.redirect}">FAQ로 이동</a></p>
        <p><a href="#/mypage/account" class="btn btn--secondary" data-nav="/mypage/account">마이페이지 · 계정설정</a></p>
      </section>`;
  }
  const path = getPlansPath();
  const body = renderPlansScreen(path);
  return renderPlansShell(path, body);
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindPlansEvents(root, rerender) {
  const role = resolveAccessNavRole(getAuthUser(), getNavRole());
  const gate = guardPlansAccess(role);
  if (!gate.ok) {
    root.querySelectorAll('[data-nav]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(el.getAttribute('data-nav') || gate.redirect);
      });
    });
    return;
  }
  bindPlansShellEvents(root, rerender);
  bindPlansScreenEvents(root, rerender);
}

export { getDefaultPlansPath } from './router.js';
