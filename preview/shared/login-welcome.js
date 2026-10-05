/**
 * 로그인 성공 직후 목적지 안내. 전용 페이지는 두지 않는다.
 * welcome=1 은 한 번 읽고 주소에서 지운다. 같은 탭 세션에서는 다시 띄우지 않는다.
 */

import { loginWelcomeText } from './auth-welcome-copy.js';

const SHOWN_KEY = 'study114.login-welcome-shown';

let consumed = false;
let armed = false;
let painted = false;

/** 로그인 직후 목적지 주소에 1회 표시 신호를 붙인다. */
export function withLoginWelcome(url) {
  const raw = String(url || '');
  if (!raw || raw.includes('welcome=1')) return raw;
  try {
    const u = new URL(raw, window.location.href);
    const hash = u.hash || '';
    if (hash) {
      u.hash = hash.includes('?') ? `${hash}&welcome=1` : `${hash}?welcome=1`;
      return u.toString();
    }
    u.searchParams.set('welcome', '1');
    return u.toString();
  } catch {
    return raw;
  }
}

function consumeWelcomeParam() {
  let found = false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('welcome') === '1') {
      url.searchParams.delete('welcome');
      found = true;
    }
    const hash = url.hash || '';
    const q = hash.indexOf('?');
    if (q >= 0) {
      const path = hash.slice(0, q);
      const params = new URLSearchParams(hash.slice(q + 1));
      if (params.get('welcome') === '1') {
        params.delete('welcome');
        const rest = params.toString();
        url.hash = rest ? `${path}?${rest}` : path;
        found = true;
      }
    }
    if (found) window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* ignore */
  }
  return found;
}

function armFromLocation() {
  if (consumed) return;
  consumed = true;
  armed = consumeWelcomeParam();
}

/**
 * 로그인된 목적지에서만 짧은 안내를 한 번 보여 준다.
 * @param {string} [displayName]
 * @param {boolean} loggedIn
 */
export function presentLoginWelcome(displayName, loggedIn) {
  armFromLocation();
  if (!armed || painted || !loggedIn) return;
  let already = false;
  try {
    already = sessionStorage.getItem(SHOWN_KEY) === '1';
  } catch {
    already = false;
  }
  if (already) {
    armed = false;
    return;
  }
  try {
    sessionStorage.setItem(SHOWN_KEY, '1');
  } catch {
    /* 저장이 막혀도 이번 로드에서는 한 번 보여 준다. 주소의 신호는 이미 지웠다. */
  }
  armed = false;
  painted = true;
  const el = document.createElement('p');
  el.className = 'login-welcome';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = loginWelcomeText(displayName);
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 4200);
}
