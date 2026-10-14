/**
 * 탈퇴 완료 메일의 「떠나는 이유 알려 주기」 화면 (정본 74 §1-4). 로그인 없음 — 30일 동안 한 번 쓰는 링크 값 t.
 */
import { WITHDRAW_REASON_COPY as C } from '../withdraw-reason-copy.js';
import { bindWithdrawReasonChoices, readWithdrawReason, renderWithdrawReasonChoices } from '../withdraw-reason-ui.js';

export const LEAVE_REASON_PATH = '/support/leave-reason';

const ENDPOINT = '/api/auth/withdraw-reason.php';

/** @param {string} s */
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 링크 값 — hash(`#/support/leave-reason?t=`) 또는 주소창 경로로 들어왔을 때의 `?t=` */
function readToken() {
  const hash = window.location.hash;
  const q = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  const fromHash = new URLSearchParams(q).get('t');
  const token = fromHash || new URLSearchParams(window.location.search).get('t') || '';
  return /^[a-f0-9]{64}$/.test(token) ? token : '';
}

/** @param {string} message */
function messageHtml(message) {
  return `<p class="leave-reason__message" role="status">${esc(message)}</p>
    <a class="btn btn--secondary btn--sm" href="/">${esc(C.home)}</a>`;
}

export function renderLeaveReasonScreen() {
  return `
    <section class="leave-reason" data-leave-reason>
      <h2 class="leave-reason__title">${esc(C.pageTitle)}</h2>
      <div data-leave-reason-body><p class="leave-reason__message" role="status">${esc(C.loading)}</p></div>
    </section>`;
}

/** @param {string} role */
function formHtml(role) {
  return `
    <form data-leave-reason-form novalidate>
      ${renderWithdrawReasonChoices(role, { idPrefix: 'leave-reason', legend: C.pageTitle, lead: C.pageLead })}
      <p class="leave-reason__error" data-leave-reason-error role="alert" hidden></p>
      <button type="submit" class="btn btn--primary btn--sm">${esc(C.submit)}</button>
    </form>`;
}

/** @param {ParentNode} root */
export async function bindLeaveReason(root) {
  const box = root.querySelector('[data-leave-reason]');
  const body = box?.querySelector('[data-leave-reason-body]');
  if (!(box instanceof HTMLElement) || !(body instanceof HTMLElement) || box.dataset.bound === '1') return;
  box.dataset.bound = '1';

  const token = readToken();
  if (!token) {
    body.innerHTML = messageHtml(C.invalid);
    return;
  }

  let role = '';
  try {
    const res = await fetch(`${ENDPOINT}?t=${encodeURIComponent(token)}`, { credentials: 'omit' });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error('load');
    if (!data.valid) {
      body.innerHTML = messageHtml(C.invalid);
      return;
    }
    role = String(data.role || '');
  } catch {
    body.innerHTML = messageHtml(C.failed);
    return;
  }

  body.innerHTML = formHtml(role);
  const form = body.querySelector('[data-leave-reason-form]');
  const errorEl = body.querySelector('[data-leave-reason-error]');
  if (!(form instanceof HTMLFormElement)) return;
  bindWithdrawReasonChoices(form);

  /** @param {string} text */
  const showError = (text) => {
    if (!(errorEl instanceof HTMLElement)) return;
    errorEl.hidden = text === '';
    errorEl.textContent = text;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const reason = readWithdrawReason(form);
    if (!reason) {
      showError(C.pickOne);
      return;
    }
    showError('');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn instanceof HTMLButtonElement) {
      submitBtn.disabled = true;
      submitBtn.textContent = C.sending;
    }
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: token, code: reason.code, note: reason.note }),
      });
      if (res.status === 422) {
        showError(C.pickOne);
        throw new Error('validation');
      }
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error('save');
      body.innerHTML = messageHtml(data.saved ? C.done : C.invalid);
    } catch (err) {
      if (!(err instanceof Error && err.message === 'validation')) showError(C.failed);
      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = false;
        submitBtn.textContent = C.submit;
      }
    }
  });
}
