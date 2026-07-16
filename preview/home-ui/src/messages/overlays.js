/**

 * P16-03 · P16-04 오버레이

 * @typedef {'student'|'study_room'|'tutor'} MemoTargetKind

 */



import { buildMemoComposeChargeCopy, buildMemoGateCopy } from './messages-copy.js';

import { REPORT_REASONS } from './messages-copy.js';

import { showEmailVerifyOverlay } from '../email-verify-overlay.js';

import { findOrCreateThread } from './thread-store.js';

import { navigate } from '../state.js';

import { threadPath } from './router.js';

import { hydrateProviderStatus } from '../provider-status.js';
import { hydrateProviderNotices } from '../provider-notices.js';

import { isMessagesApiMode } from '../messages-backend.js';



function esc(s) {

  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

}



async function refreshMemoEntitlement() {

  if (!isMessagesApiMode()) return;

  await hydrateProviderStatus();
  await hydrateProviderNotices();

}



/** @param {{ onClose?: () => void }} [opts] */

export function showPaidGateOverlay(opts = {}) {

  const copy = buildMemoGateCopy();

  const wrap = document.createElement('div');

  wrap.innerHTML = `

    <div class="msg-overlay" data-overlay="gate" role="dialog" aria-modal="true" aria-labelledby="msg-gate-title">

      <div class="msg-overlay__panel msg-gate">

        <p class="msg-overlay__screen-id">P16-04 · 16장 §1-2 · §7</p>

        <h2 id="msg-gate-title" class="msg-gate__title">${esc(copy.title)}</h2>

        <p class="msg-gate__body">${esc(copy.body)}</p>

        ${copy.remainingLine ? `<p class="msg-gate__remaining">${esc(copy.remainingLine)}</p>` : ''}

        ${copy.expiryLine ? `<p class="msg-gate__expiry mypage-muted">${esc(copy.expiryLine)}</p>` : ''}

        <p class="msg-gate__reply">${esc(copy.replyNote)}</p>

        <p class="msg-gate__hint">${esc(copy.hint)}</p>

        <p class="msg-gate__note">학부모 화면 아님 · 15장 §7</p>

        <div class="msg-overlay__actions">

          ${copy.showPlansCta ? `<button type="button" class="btn btn--primary" data-action="gate-plans">${esc(copy.cta)}</button>` : ''}

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

    navigate('/plans/access');

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

  const chargeNote =

    opts.kind === 'student'

      ? `<p class="msg-compose__charge mypage-muted">${esc(buildMemoComposeChargeCopy())}</p>`

      : '';

  const wrap = document.createElement('div');

  wrap.innerHTML = `

    <div class="msg-overlay" data-overlay="compose" role="dialog" aria-modal="true" aria-labelledby="msg-compose-title">

      <div class="msg-overlay__panel msg-compose">

        <p class="msg-overlay__screen-id">P16-03 · 16장 §6</p>

        <h2 id="msg-compose-title" class="msg-compose__title">첫 메모 보내기</h2>

        <p class="msg-compose__target">대상: <strong>${esc(opts.targetName)}</strong> · ${esc(opts.contextLabel)}</p>

        <p class="msg-compose__badge"><span class="msg-badge">${esc(opts.scopeBadge)}</span> ${esc(opts.scopeHint)}</p>

        ${chargeNote}

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

  el.querySelector('[data-action="compose-send"]')?.addEventListener('click', async () => {

    const body = el.querySelector('.msg-compose__textarea')?.value?.trim();

    if (!body) return;

    const btn = el.querySelector('[data-action="compose-send"]');

    if (btn) btn.disabled = true;

    try {

      const thread = await findOrCreateThread({

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

      if (opts.kind === 'student') {

        await refreshMemoEntitlement();

      }

      close();

      if (opts.onSent) opts.onSent(thread.id);

      else navigate(threadPath(thread.id));

    } catch (err) {

      console.warn('[messages]', err);

      if (err?.code === 'paid_gate') {

        await refreshMemoEntitlement();

        showPaidGateOverlay();

      } else if (err?.code === 'email_verify_required') {

        showEmailVerifyOverlay();

      } else {

        alert('쪽지 전송에 실패했습니다. 로그인·API 연결을 확인해 주세요.');

      }

      if (btn) btn.disabled = false;

    }

  });

  return el;

}



/**

 * @param {{ onSubmit: (reason: string) => void|Promise<void>, onClose?: () => void }} opts

 */

export function showReportOverlay(opts) {

  const options = REPORT_REASONS.map(

    (r) => `<option value="${esc(r.label)}">${esc(r.label)}</option>`,

  ).join('');

  const wrap = document.createElement('div');

  wrap.innerHTML = `

    <div class="msg-overlay" data-overlay="report" role="dialog" aria-modal="true">

      <div class="msg-overlay__panel msg-compose">

        <p class="msg-overlay__screen-id">P16-02 · 신고</p>

        <h2 class="msg-compose__title">신고하기</h2>

        <label class="msg-compose__field">

          <span>사유</span>

          <select class="msg-compose__select">${options}</select>

        </label>

        <div class="msg-overlay__actions">

          <button type="button" class="btn btn--primary" data-action="report-submit">제출</button>

          <button type="button" class="btn btn--secondary" data-action="close-overlay">취소</button>

        </div>

      </div>

    </div>`;

  const el = wrap.firstElementChild;

  document.body.appendChild(el);

  const close = () => {

    el.remove();

    opts.onClose?.();

  };

  el.querySelector('[data-action="close-overlay"]')?.addEventListener('click', close);

  el.addEventListener('click', (e) => {

    if (e.target === el) close();

  });

  el.querySelector('[data-action="report-submit"]')?.addEventListener('click', async () => {

    const reason = el.querySelector('.msg-compose__select')?.value?.trim();

    if (!reason) return;

    await opts.onSubmit(reason);

    close();

  });

  return el;

}


