import { getNavRole } from '../state.js';

import {
  canProviderColdMemoToStudent,
  canReplyInThread,
  FREE_PROVIDER_INBOX_COPY,
  getReplyBlockedMessage,
  isProviderRole,
} from './permissions.js';

import { showPaidGateOverlay, showReportOverlay } from './overlays.js';
import { showEmailVerifyOverlay } from '../email-verify-overlay.js';

import {

  getThreadsForTab,

  getThread,

  markThreadRead,

  getUnreadCount,

  getActiveCount,

  appendMessageToThread,

  ensureDemoThreads,

  ensureThreadDetail,

  setThreadArchived,

  setThreadBlocked,

  setThreadReported,

} from './thread-store.js';

import { isMessagesApiMode } from '../messages-backend.js';

import { getListTabFromPath, tabLabel, tabPath, parseThreadId, threadPath } from './router.js';



import { BLOCK_THREAD_COPY } from './messages-copy.js';
import { getMessagesEmptyCopy, renderStateCard } from '../empty-state-copy.js';

/** bindMessagesScreenEvents가 매 rerender마다 재호출되어도 threadId당 1회만 자동 하이드레이션하기 위한 가드 (무한 렌더 루프 방지) */
let lastAutoHydratedThreadId = null;

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function formatRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return '방금';
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}



/** @param {string} path */

export function renderMessagesScreen(path) {

  const threadId = parseThreadId(path);

  if (threadId != null) return renderThread(threadId);

  return renderList(getListTabFromPath(path));

}



/** @param {'inbox'|'sent'|'active'} tab */

function renderList(tab) {

  const role = getNavRole();

  const threads = getThreadsForTab(tab);

  const tabs = ['inbox', 'sent', 'active', 'archive']

    .map(

      (t) =>

        `<a href="#${tabPath(t)}" class="msg-tab${t === tab ? ' is-active' : ''}" data-msg-nav="${tabPath(t)}">${tabLabel(t)}</a>`,

    )

    .join('');



  const rows =

    threads.length === 0

      ? renderEmptyList(role)

      : threads

          .map(

            (t) => `

      <a href="#${threadPath(t.id)}" class="msg-row${t.unread ? ' is-unread' : ''}" data-msg-nav="${threadPath(t.id)}">

        <div class="msg-row__head">

          <span class="msg-row__name">${t.unread ? '● ' : ''}${esc(t.peerDisplayName)}</span>

          <span class="msg-row__time">${formatRelative(t.updatedAt)}</span>

        </div>

        <p class="msg-row__preview">${esc(t.lastPreview)}</p>

        <div class="msg-row__chips">

          <span class="msg-chip">${esc(t.contextLabel)}</span>

          <span class="msg-badge msg-badge--sm">${esc(t.scopeBadge)}</span>

        </div>

      </a>`,

          )

          .join('');



  const demoHint =

    isProviderRole(role) && !canProviderColdMemoToStudent(role)

      ? `<p class="msg-note msg-note--warn">${FREE_PROVIDER_INBOX_COPY.hint}</p>`

      : '';



  return `

    <section class="msg-panel">

      <div class="msg-tabs" role="tablist">${tabs}</div>

      ${demoHint}

      <div class="msg-list">${rows}</div>

      <p class="msg-note">16장 §4 · 검색·보관함은 후순위</p>

    </section>`;

}



/** @param {string} role */

function renderEmptyList(role) {
  const copy = getMessagesEmptyCopy(role === 'parent' ? 'parent' : role);
  const studentSearchHref = '#/tutor/student-search';
  let html = renderStateCard({
    title: copy.title,
    body: copy.body,
    cta: copy.cta,
    ctaHref: copy.cta ? studentSearchHref : undefined,
    screenId: copy.screenId,
  });
  if (isProviderRole(role) && !canProviderColdMemoToStudent(role)) {
    html += `<p class="msg-note msg-note--warn">${FREE_PROVIDER_INBOX_COPY.hint}</p>`;
  }
  return html;
}



/** @param {number} threadId */

function renderThread(threadId) {

  const role = getNavRole();

  let thread = getThread(threadId);

  if (!thread) {

    return `<section class="msg-panel msg-empty">대화를 찾을 수 없습니다. <a href="#${tabPath('inbox')}" data-msg-nav="${tabPath('inbox')}">목록으로</a></section>`;

  }

  if (isMessagesApiMode() && thread.messages.length === 0 && thread.lastPreview) {
    thread = {
      ...thread,
      messages: [
        {
          id: 0,
          sender: 'me',
          body: thread.lastPreview,
          createdAt: thread.updatedAt || new Date().toISOString(),
        },
      ],
    };
  } else if (isMessagesApiMode() && thread.messages.length === 0) {

    return `<section class="msg-panel msg-thread msg-thread--loading"><p class="msg-empty">대화를 불러오는 중…</p></section>`;

  }



  const canReply = canReplyInThread(thread, role);



  const msgs = thread.messages

    .map(

      (m) =>

        `<div class="msg-bubble msg-bubble--${m.sender}"><span class="msg-bubble__label">${m.sender === 'me' ? '나' : esc(thread.peerDisplayName)}</span>${esc(m.body)}</div>`,

    )

    .join('');



  const requestBlock =
    thread.showRequestInPanel && thread.requestSummary
      ? `<p class="msg-summary__request">요청문: "${esc(thread.requestSummary)}"</p>`
      : `<p class="msg-summary__muted">요청문 비공개</p>`;

  const replyBlock = canReply
    ? `<form class="msg-reply" data-msg-reply="${threadId}">
        <textarea class="msg-reply__input" rows="2" placeholder="답장 입력"></textarea>
        <button type="submit" class="btn btn--primary btn--sm">전송</button>
      </form>`
    : `<p class="msg-note msg-note--warn">${esc(getReplyBlockedMessage(thread, role))}</p>`;



  return `

    <section class="msg-panel msg-thread">

      <div class="msg-thread__bar">

        <a href="#${tabPath('inbox')}" class="msg-back" data-msg-nav="${tabPath('inbox')}">← 목록</a>

        <span class="msg-thread__peer">${esc(thread.peerDisplayName)}</span>

        <button type="button" class="btn btn--secondary btn--sm" data-msg-action="report" data-thread-id="${threadId}">신고</button>

        <button type="button" class="btn btn--secondary btn--sm" data-msg-action="archive" data-thread-id="${threadId}">${thread.isArchived ? '보관 해제' : '보관'}</button>

        <button type="button" class="btn btn--secondary btn--sm" data-msg-action="block" data-thread-id="${threadId}" ${thread.isBlocked ? 'disabled' : ''}>차단</button>

      </div>

      ${thread.isBlocked ? `<p class="msg-note msg-note--warn">${esc(thread.blockReason || BLOCK_THREAD_COPY.banner)}</p>` : ''}

      <div class="msg-scope">

        <span class="msg-scope__label">공개 범위:</span>

        <span class="msg-badge">${esc(thread.scopeBadge)}</span>

        <span class="msg-scope__hint">${esc(thread.scopeHint)}</span>

      </div>

      <details class="msg-summary" open>

        <summary>상대 요약 패널</summary>

        <p>${esc(thread.structuredLine)}</p>

        ${requestBlock}

      </details>

      <div class="msg-thread__messages">${msgs}</div>

      ${replyBlock}

    </section>`;

}



/** @param {HTMLElement} root @param {() => void} rerender */

export function bindMessagesScreenEvents(root, rerender) {

  root.querySelectorAll('[data-msg-nav]').forEach((el) => {

    el.addEventListener('click', (e) => {

      e.preventDefault();

      window.location.hash = el.getAttribute('data-msg-nav') || tabPath('inbox');

    });

  });



  const role = getNavRole();



  root.querySelectorAll('[data-msg-action]').forEach((btn) => {

    btn.addEventListener('click', async () => {

      const id = Number(btn.dataset.threadId);

      const action = btn.dataset.msgAction;

      try {

        if (action === 'report') {

          showReportOverlay({

            onSubmit: async (reason) => {

              await setThreadReported(id, reason);

              rerender();

            },

          });

          return;

        }

        if (action === 'archive') {

          const thread = getThread(id);

          await setThreadArchived(id, !thread?.isArchived);

          rerender();

          return;

        }

        if (action === 'block') {

          if (!confirm(BLOCK_THREAD_COPY.confirm)) return;

          await setThreadBlocked(id);

          rerender();

        }

      } catch (err) {

        console.warn('[messages]', err);

        alert('처리에 실패했습니다.');

      }

    });

  });



  root.querySelectorAll('[data-msg-reply]').forEach((form) => {

    form.addEventListener('submit', async (e) => {

      e.preventDefault();

      const id = Number(form.dataset.msgReply);

      const thread = getThread(id);

      if (!canReplyInThread(thread, role)) {

        showPaidGateOverlay();

        return;

      }

      const input = form.querySelector('.msg-reply__input');

      const body = input?.value?.trim();

      if (!body) return;

      try {

        await appendMessageToThread(id, body);

        rerender();

      } catch (err) {

        console.warn('[messages]', err);

        if (err?.code === 'paid_gate') showPaidGateOverlay();
        else if (err?.code === 'email_verify_required') showEmailVerifyOverlay();

        else alert('답장 전송에 실패했습니다.');

      }

    });

  });



  const path = window.location.hash.slice(1) || '';

  const threadId = parseThreadId(path.startsWith('/') ? path : `/${path}`);

  if (threadId != null) {

    if (isMessagesApiMode()) {

      if (lastAutoHydratedThreadId !== threadId) {
        lastAutoHydratedThreadId = threadId;
        ensureThreadDetail(threadId)
          .then(() => {
            markThreadRead(threadId);
            rerender();
          })
          .catch((err) => console.warn('[messages]', err));
      }

    } else {

      markThreadRead(threadId);

    }

  } else {
    lastAutoHydratedThreadId = null;
  }

}



export function getMessagesSummaryCounts() {

  ensureDemoThreads();

  return { unread: getUnreadCount(), active: getActiveCount() };

}


