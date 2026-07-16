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

function renderPlansLoginGate(message) {
  const role = getNavRole();
  const panel = renderGuestLoginGatePanel({
    title: '유료상품 — 로그인 필요',
    lead: message,
    bullets: [
      '상품 소개·노출상품·접근권 안내는 비회원도 볼 수 있습니다.',
      '내 상품·결제내역·구매(checkout)는 로그인 후 이용합니다.',
    ],
    from: 'plans',
    action: 'checkout',
    primaryLabel: '로그인하고 구매 이어하기',
  });
  return `
    ${renderPreviewToolbar()}
    <div class="home-app">
      ${renderHeader(role)}
      <main class="home-main sup-main">
        <div class="sup-layout plans-layout" style="max-width:36rem;margin:2rem auto;">
          ${panel}
          <p style="margin-top:1rem;">
            <a href="#/plans" class="btn btn--secondary" data-nav="/plans">상품 카탈로그로</a>
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
    return `
      <section class="mypage-panel" style="max-width:32rem;margin:2rem auto;padding:1.5rem;">
        <h1>유료상품</h1>
        <p>${esc(hubGate.message)}</p>
        <p><a href="#${hubGate.redirect}" class="btn btn--primary" data-nav="${hubGate.redirect}">FAQ로 이동</a></p>
        <p><a href="#/mypage/account" class="btn btn--secondary" data-nav="/mypage/account">마이페이지 · 계정설정</a></p>
      </section>`;
  }

  const path = getPlansPath();
  const pathGate = guardPlansPath(role, path);
  if (!pathGate.ok) {
    return renderPlansLoginGate(pathGate.message);
  }

  const body = renderPlansScreen(path);
  return renderPlansShell(path, body, { role, isGuest: !isLoggedIn() || role === 'guest' });
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindPlansEvents(root, rerender) {
  const role = resolveAccessNavRole(getAuthUser(), getNavRole());
  const hubGate = guardPlansAccess(role);
  if (!hubGate.ok) {
    root.querySelectorAll('[data-nav]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(el.getAttribute('data-nav') || hubGate.redirect);
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
        navigate(el.getAttribute('data-nav') || pathGate.redirect);
      });
    });
    return;
  }

  bindPlansShellEvents(root, rerender);
  bindPlansScreenEvents(root, rerender);
}

export { getDefaultPlansPath } from './router.js';
