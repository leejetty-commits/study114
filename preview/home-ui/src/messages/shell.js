import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents } from '../layout.js';
import { getNavRole, previewState } from '../state.js';
import { getScreenIdForPath, screenTitle } from './router.js';
import { isProviderRole } from './permissions.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** 공급자 구독 데모 토글 — 마이페이지 우측 본문에 삽입 */
export function renderMessagesProviderToolbar() {
  const role = getNavRole();
  if (!isProviderRole(role)) return '';
  return `<div class="msg-toolbar-demo">
    <span>공급자 구독(데모):</span>
    <button type="button" class="preview-toolbar__btn ${previewState.providerSubscription === 'free' ? 'is-active' : ''}" data-provider-subscription="free">무료</button>
    <button type="button" class="preview-toolbar__btn ${previewState.providerSubscription === 'paid' ? 'is-active' : ''}" data-provider-subscription="paid">유료</button>
  </div>`;
}

/**
 * @deprecated 마이페이지 shell 우측 본문 사용. 하위 호환용.
 * @param {string} currentPath
 * @param {string} bodyHtml
 */
export function renderMessagesShell(currentPath, bodyHtml) {
  const role = getNavRole();
  const screenId = getScreenIdForPath(currentPath);
  const title = screenTitle(screenId);
  const sub = role === 'parent' ? '/parent' : role === 'study_room' ? '/study-room' : '/tutor';

  return `
    ${renderPreviewToolbar()}
    <div class="home-app">
      ${renderHeader(role, { showAuth: false, showRoleSwitch: true })}
      <main class="home-main msg-main">
        <div class="msg-layout">
          <header class="msg-content__head">
            <div>
              <h1 class="msg-content__title">${esc(title)}</h1>
              <span class="msg-content__screen-id">${esc(screenId)} · 16장</span>
            </div>
            <a href="#/mypage/messages" class="msg-link-muted" data-nav="/mypage/messages">P15-08 요약</a>
          </header>
          ${renderMessagesProviderToolbar()}
          ${bodyHtml}
          <a href="#${sub}" class="msg-back-home" data-nav="${sub}">← 메인 홈으로</a>
        </div>
      </main>
      ${renderFooter()}
    </div>
  `;
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindMessagesProviderToolbar(root, rerender) {
  root.querySelectorAll('[data-provider-subscription]').forEach((el) => {
    el.addEventListener('click', () => {
      previewState.providerSubscription = el.dataset.providerSubscription;
      rerender();
    });
  });
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindMessagesShellEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bindMessagesProviderToolbar(root, rerender);
  root.querySelectorAll('[data-msg-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-msg-nav') || '/mypage/messages/inbox';
    });
  });
}
