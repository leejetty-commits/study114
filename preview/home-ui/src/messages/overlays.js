/**
 * P16-03 · P16-04 오버레이
 * @typedef {'student'|'study_room'|'tutor'} MemoTargetKind
 */

import { GATE_COPY } from './permissions.js';
import { findOrCreateThread } from './thread-store.js';
import { navigate } from '../state.js';
import { threadPath } from './router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** @param {{ onClose?: () => void }} [opts] */
export function showPaidGateOverlay(opts = {}) {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="msg-overlay" data-overlay="gate" role="dialog" aria-modal="true" aria-labelledby="msg-gate-title">
      <div class="msg-overlay__panel msg-gate">
        <p class="msg-overlay__screen-id">P16-04 · 16장 §1-2 · §7</p>
        <h2 id="msg-gate-title" class="msg-gate__title">${esc(GATE_COPY.title)}</h2>
        <p class="msg-gate__body">${esc(GATE_COPY.body)}</p>
        <p class="msg-gate__reply">${esc(GATE_COPY.replyNote)}</p>
        <p class="msg-gate__hint">${esc(GATE_COPY.hint)}</p>
        <p class="msg-gate__note">학부모 화면 아님 · 15장 §7</p>
        <div class="msg-overlay__actions">
          <button type="button" class="btn btn--primary" data-action="gate-plans">${esc(GATE_COPY.cta)}</button>
          <button type="button" class="btn btn--secondary" data-action="close-overlay">닫기</button>
        </div>
      </div>
    </div>`;
  const el = wrap.firstElementChild;
  document.body.appendChild(el);
  el.querySelector('[data-action="close-overlay"]')?.addEventListener('click', () => {
    el.remove();
    opts.onClose?.();
  });
  el.querySelector('[data-action="gate-plans"]')?.addEventListener('click', () => {
    el.remove();
    navigate('/mypage/plans');
    opts.onClose?.();
  });
  el.addEventListener('click', (e) => {
    if (e.target === el) {
      el.remove();
      opts.onClose?.();
    }
  });
  return el;
}

/**
 * @param {object} opts
 * @param {MemoTargetKind} opts.kind
 * @param {number|string} opts.targetId
 * @param {string} opts.targetName
 * @param {string} opts.contextLabel
 * @param {string} opts.scopeBadge
 * @param {string} opts.scopeHint
 * @param {boolean} opts.showRequestInPanel
 * @param {string} [opts.requestSummary]
 * @param {string} opts.structuredLine
 * @param {(threadId: number) => void} [opts.onSent]
 */
export function showComposeModal(opts) {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="msg-overlay" data-overlay="compose" role="dialog" aria-modal="true" aria-labelledby="msg-compose-title">
      <div class="msg-overlay__panel msg-compose">
        <p class="msg-overlay__screen-id">P16-03 · 16장 §6</p>
        <h2 id="msg-compose-title" class="msg-compose__title">첫 메모 보내기</h2>
        <p class="msg-compose__target">대상: <strong>${esc(opts.targetName)}</strong> · ${esc(opts.contextLabel)}</p>
        <p class="msg-compose__badge"><span class="msg-badge">${esc(opts.scopeBadge)}</span> ${esc(opts.scopeHint)}</p>
        <label class="msg-compose__field">
          <span>본문</span>
          <textarea class="msg-compose__textarea" rows="4" placeholder="첫 인사를 입력하세요">${esc('안녕하세요, 상담 가능하신지 문의드립니다.')}</textarea>
        </label>
        <div class="msg-overlay__actions">
          <button type="button" class="btn btn--primary" data-action="compose-send">전송</button>
          <button type="button" class="btn btn--secondary" data-action="close-overlay">취소</button>
        </div>
      </div>
    </div>`;
  const el = wrap.firstElementChild;
  document.body.appendChild(el);
  const close = () => el.remove();
  el.querySelector('[data-action="close-overlay"]')?.addEventListener('click', close);
  el.addEventListener('click', (e) => {
    if (e.target === el) close();
  });
  el.querySelector('[data-action="compose-send"]')?.addEventListener('click', () => {
    const body = el.querySelector('.msg-compose__textarea')?.value?.trim();
    if (!body) return;
    const thread = findOrCreateThread({
      contextKind: opts.kind,
      contextId: Number(opts.targetId),
      contextLabel: opts.contextLabel,
      peerDisplayName: opts.targetName,
      scopeBadge: opts.scopeBadge,
      scopeHint: opts.scopeHint,
      showRequestInPanel: opts.showRequestInPanel,
      requestSummary: opts.requestSummary,
      structuredLine: opts.structuredLine,
      body,
    });
    close();
    if (opts.onSent) opts.onSent(thread.id);
    else navigate(threadPath(thread.id));
  });
  return el;
}
