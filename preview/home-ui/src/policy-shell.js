import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents } from './layout.js';
import { getNavRole } from './state.js';
import { renderPolicyNav } from './policy-screens.js';
import { getPolicySlug } from './policy-router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function getRoleHomePath(role) {
  if (role === 'guest') return '/guest';
  if (role === 'parent') return '/parent';
  if (role === 'study_room') return '/study-room';
  return '/tutor';
}

export function renderPolicyShell(title, path, bodyHtml) {
  const role = getNavRole();
  const slug = getPolicySlug(path);
  const homePath = getRoleHomePath(role);
  return `
    ${renderPreviewToolbar()}
    <div class="home-app">
      ${renderHeader(role, { showAuth: role === 'guest', showRoleSwitch: role !== 'guest' })}
      <main class="home-main sup-main">
        <div class="sup-layout">
          <header class="sup-content__head">
            <div>
              <h1 class="sup-content__title"><span class="sup-content__title-prefix">정책-</span><span class="sup-content__title-suffix">${esc(title)}</span></h1>
              <span class="sup-content__screen-id">P26 · 26장</span>
            </div>
          </header>
          <div class="sup-frame sup-frame--policy">
            ${renderPolicyNav(slug)}
            <div class="sup-frame__body">
              ${bodyHtml}
              <footer class="sup-frame__foot">
                <a href="#${homePath}" class="sup-back-home" data-nav="${homePath}">← 메인 홈으로</a>
              </footer>
            </div>
          </div>
        </div>
      </main>
      ${renderFooter()}
    </div>
  `;
}

export function bindPolicyShellEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  root.querySelectorAll('[data-policy-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-policy-nav') || '/policy/terms';
    });
  });
}
