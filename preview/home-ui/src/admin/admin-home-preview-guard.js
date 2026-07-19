/**
 * 관리자 홈 미리보기 — 확정 액션 차단 (검수 모드)
 */

import { ADMIN_HOME_PREVIEW_BLOCKED_ACTIONS } from './admin-home-preview-seed.js';

const BLOCK_MSG =
  '서비스 홈 미리보기(검수 모드)에서는 저장·발송·결제·공개변경이 실데이터에 반영되지 않습니다.';

/** @param {EventTarget|null} t */
function closestAction(t) {
  if (!(t instanceof Element)) return null;
  return t.closest(
    [
      '[data-action]',
      '[data-checkout]',
      '[data-pay]',
      '[data-publish]',
      '[data-send-memo]',
      'button[type="submit"]',
      'a[href*="checkout"]',
      'a[href*="/plans"]',
    ].join(','),
  );
}

/** @param {Element} el */
function resolveActionKey(el) {
  const action = el.getAttribute('data-action') || '';
  if (ADMIN_HOME_PREVIEW_BLOCKED_ACTIONS.some((k) => action.includes(k))) return action;
  if (el.hasAttribute('data-checkout') || el.hasAttribute('data-pay') || el.hasAttribute('data-publish')) {
    return 'checkout';
  }
  if (el.hasAttribute('data-send-memo')) return 'send-memo';
  if (el.matches('button[type="submit"]')) {
    const form = el.closest('form');
    const name = form?.getAttribute('data-form') || form?.getAttribute('data-p19-form') || '';
    if (/pay|checkout|publish|send|save/i.test(name)) return name || 'submit';
  }
  if (el instanceof HTMLAnchorElement) {
    const href = el.getAttribute('href') || '';
    if (/checkout|\/plans|paid/i.test(href)) return 'checkout';
  }
  return null;
}

/**
 * @param {HTMLElement} root
 */
export function bindAdminHomePreviewGuards(root) {
  const viewport = root.querySelector('.ahp-panel') || root;

  viewport.addEventListener(
    'click',
    (e) => {
      const el = closestAction(e.target);
      if (!el || !viewport.contains(el)) return;
      const key = resolveActionKey(el);
      if (!key) return;
      // 탐색·탭·지역 전환·필터는 허용
      if (
        el.hasAttribute('data-ahp-mode') ||
        el.hasAttribute('data-ahp-slot-attr') ||
        el.hasAttribute('data-ahp-parent-tab') ||
        el.hasAttribute('data-ahp-room-tab') ||
        el.hasAttribute('data-ahp-tutor-tab') ||
        el.hasAttribute('data-provider-tab') ||
        el.closest('.find-filter, .parent-tabs, .ahp-slots, .ahp-modes')
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      window.alert(`${BLOCK_MSG}\n(차단된 액션: ${key})`);
    },
    true,
  );

  viewport.addEventListener(
    'submit',
    (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement) || !viewport.contains(form)) return;
      const name = form.getAttribute('data-form') || form.getAttribute('data-p19-form') || '';
      if (/pay|checkout|publish|send|register|save/i.test(name) || form.querySelector('[data-checkout]')) {
        e.preventDefault();
        e.stopPropagation();
        window.alert(BLOCK_MSG);
      }
    },
    true,
  );
}
