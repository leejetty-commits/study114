import { renderPreviewToolbar, renderHeader, renderFooter, bindLayoutEvents } from '../layout.js';
import { getNavRole } from '../state.js';
import { getScreenIdForPath, screenTitle } from './router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** 공급자 구독 데모 토글 — 화면에서 제거. 하위 호환용 no-op */
export function renderMessagesProviderToolbar() {
  return '';
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
      ${renderHeader(role, { showAuth: false, showRoleSwitch: false })}
      <main class="home-main msg-main">
        <div class="msg-layout">
          <header class="msg-content__head">
            <div>
              <h1 class="msg-content__title">${esc(title)}</h1>
            </div>
            <a href="#/mypage/messages" class="msg-link-muted" data-nav="/mypage/messages">쪽지 요약</a>
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

/** @param {HTMLElement} root @param {() => void} [_rerender] */
export function bindMessagesProviderToolbar(_root, _rerender) {
  /* 데모 구독 토글 제거 */
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindMessagesShellEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bindMessagesProviderToolbar(root, rerender);
  root.querySelectorAll('[data-msg-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-msg-nav') || '/mypage/messages';
    });
  });
}
