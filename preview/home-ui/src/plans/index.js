import {
  guardPlansAccess,
  guardPlansPath,
  resolveAccessNavRole,
} from '../../../shared/route-access.js';
import { renderGuestLoginGatePanel, bindGuestGateLinks } from '../../../shared/guest-gate-ui.js';
import { renderPreviewToolbar, renderHeader, renderFooter } from '../layout.js';
import { getAuthUser, isLoggedIn } from '../auth-session.js';
import { getPlansPath, navigate, getNavRole } from '../state.js';
import { renderPlansShell, bindPlansShellEvents } from './shell.js';
import { renderPlansScreen, bindPlansScreenEvents } from './screens.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** 헤더 GNB용 — 세션 역할 우선, 비로그인은 항상 guest (메뉴 축소 방지) */
function plansHeaderRole() {
  if (isLoggedIn()) return resolveAccessNavRole(getAuthUser(), 'guest');
  return 'guest';
}

function renderPlansLoginGate(message) {
  const headerRole = plansHeaderRole();
  const panel = renderGuestLoginGatePanel({
    title: '유료상품',
    lead: message,
    bullets: [
      '유료상품·노출·접근권·결제는 로그인 후 이용할 수 있습니다.',
      '공부방·과외쌤 계정으로 로그인하면 상품센터가 열립니다.',
    ],
    from: 'plans',
    action: 'plans',
    primaryLabel: '로그인하고 유료상품 열기',
  });
  return `
    ${renderPreviewToolbar()}
    <div class="home-app">
      ${renderHeader(headerRole)}
      <main class="home-main sup-main">
        <div class="sup-layout plans-layout" style="max-width:36rem;margin:2rem auto;">
          ${panel}
          <p style="margin-top:1rem;">
            <a href="#/guest" class="btn btn--secondary" data-nav="/guest">홈으로</a>
          </p>
        </div>
      </main>
      ${renderFooter()}
    </div>
  `;
}

export function renderPlans() {
  const role = resolveAccessNavRole(getAuthUser(), getNavRole());
  const hubGate = guardPlansAccess(role);
  if (!hubGate.ok) {
    if (hubGate.mode === 'login_gate' || role === 'guest' || !isLoggedIn()) {
      return renderPlansLoginGate(hubGate.message);
    }
    return `
      <section class="mypage-panel" style="max-width:32rem;margin:2rem auto;padding:1.5rem;">
        <h1>유료상품</h1>
        <p>${esc(hubGate.message)}</p>
        <p><a href="#${hubGate.redirect || '/support/faq'}" class="btn btn--primary" data-nav="${hubGate.redirect || '/support/faq'}">FAQ로 이동</a></p>
        <p><a href="#/mypage/account" class="btn btn--secondary" data-nav="/mypage/account">마이페이지 · 계정설정</a></p>
      </section>`;
  }

  const path = getPlansPath();
  const pathGate = guardPlansPath(role, path);
  if (!pathGate.ok) {
    return renderPlansLoginGate(pathGate.message);
  }

  const body = renderPlansScreen(path);
  return renderPlansShell(path, body, { role, isGuest: false });
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindPlansEvents(root, rerender) {
  const role = resolveAccessNavRole(getAuthUser(), getNavRole());
  const hubGate = guardPlansAccess(role);
  if (!hubGate.ok) {
    bindGuestGateLinks(root);
    root.querySelectorAll('[data-nav]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(el.getAttribute('data-nav') || hubGate.redirect || '/guest');
      });
    });
    return;
  }

  const path = getPlansPath();
  const pathGate = guardPlansPath(role, path);
  if (!pathGate.ok) {
    bindGuestGateLinks(root);
    root.querySelectorAll('[data-nav]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(el.getAttribute('data-nav') || pathGate.redirect || '/plans');
      });
    });
    return;
  }

  bindPlansShellEvents(root, rerender);
  bindPlansScreenEvents(root, rerender);
}

export { getDefaultPlansPath } from './router.js';
