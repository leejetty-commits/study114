import { getNavRole } from '../state.js';

import { canReplyInThread, getReplyBlockedMessage } from './permissions.js';

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
  setThreadImportant,

} from './thread-store.js';

import { isMessagesApiMode } from '../messages-backend.js';

import { parseThreadId, threadPath, MESSAGES_BASE, REVIEWS_BASE } from './router.js';



import { BLOCK_THREAD_COPY } from './messages-copy.js';
import { getMessagesEmptyCopy, renderStateCard } from '../empty-state-copy.js';
import { isReviewsPath, parseReviewsPath, renderReviewInboxPlaceholder, hydrateReviewInbox } from '../provider-reviews/inbox.js';
import {
  MESSAGE_ATTACHMENT,
  formatFileBytes,
  validateMessageFiles,
  attachmentDownloadUrl,
} from './attachment-spec.js';

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



/** @param {import('./thread-store.js').MessageThread} t */
function threadTitle(t) {
  const first = t.messages?.[0];
  const attachName = first?.attachments?.[0]?.originalName || '';
  const raw = first?.body || t.firstPreview || t.lastPreview || attachName || '';
  const one = String(raw).replace(/\s+/g, ' ').trim();
  if (!one) return t.peerDisplayName || '쪽지';
  return one.length > 52 ? `${one.slice(0, 52)}…` : one;
}

/** @param {import('./thread-store.js').MessageThread} t */
function readStateBadge(t) {
  if (t.unread) return '<span class="msg-read-badge msg-read-badge--unread">안읽음</span>';
  if (t.peerUnread) return '<span class="msg-read-badge msg-read-badge--peer">상대 안읽음</span>';
  return '';
}

/** @param {import('./thread-store.js').ThreadMessage} m */
function renderAttachments(m) {
  const atts = m.attachments || [];
  if (!atts.length) return '';
  const items = atts
    .map((a) => {
      const label = `${esc(a.originalName)} (${formatFileBytes(a.sizeBytes)})`;
      if (a.id) {
        return `<li><a class="msg-attach" href="${attachmentDownloadUrl(a.id)}">${label}</a></li>`;
      }
      return `<li><span class="msg-attach">${label}</span></li>`;
    })
    .join('');
  return `<ul class="msg-attach-list">${items}</ul>`;
}

/**
 * @param {import('./thread-store.js').MessageThread} thread
 * @param {import('./thread-store.js').ThreadMessage} m
 */
function isReadByPeer(thread, m) {
  if (m.sender !== 'me') return false;
  if (typeof m.readByPeer === 'boolean') return m.readByPeer;
  return (thread.messages || []).some(
    (x) => x.sender === 'peer' && new Date(x.createdAt).getTime() >= new Date(m.createdAt).getTime(),
  );
}

/** @param {string} path */
export function renderMessagesScreen(path) {
  if (isReviewsPath(path)) {
    const parsed = parseReviewsPath(path);
    return `${renderMessagesHub('reviews')}${renderReviewInboxPlaceholder(parsed)}`;
  }
  return renderList(parseThreadId(path));
}

function renderMessagesHub(active) {
  const msgHref = MESSAGES_BASE;
  const revHref = REVIEWS_BASE;
  return `<div class="msg-hub" role="tablist" aria-label="쪽지와 후기함">
    <a href="#${msgHref}" class="msg-hub__tab${active === 'messages' ? ' is-active' : ''}" data-msg-nav="${msgHref}">쪽지</a>
    <a href="#${revHref}" class="msg-hub__tab${active === 'reviews' ? ' is-active' : ''}" data-msg-nav="${revHref}">후기함</a>
  </div>`;
}

/** @param {number|null} expandedId */
function renderList(expandedId) {
  const role = getNavRole();
  const threads = getThreadsForTab('all');

  if (threads.length === 0) {
    return `
    ${renderMessagesHub('messages')}
    <section class="msg-panel">${renderEmptyList(role)}</section>`;
  }

  const important = threads.filter((t) => t.isImportant);
  const rest = threads.filter((t) => !t.isImportant);
  const sections = [];
  if (important.length) {
    sections.push(`<p class="msg-list__label">중요</p>${important.map((t) => renderRow(t, expandedId, role)).join('')}`);
  }
  if (rest.length) {
    if (important.length) sections.push(`<p class="msg-list__label">최근</p>`);
    sections.push(rest.map((t) => renderRow(t, expandedId, role)).join(''));
  }

  return `
    ${renderMessagesHub('messages')}
    <section class="msg-panel">
      <div class="msg-list">${sections.join('')}</div>
    </section>`;
}

/**
 * @param {import('./thread-store.js').MessageThread} t
 * @param {number|null} expandedId
 * @param {string} role
 */
function renderRow(t, expandedId, role) {
  const open = expandedId != null && Number(expandedId) === Number(t.id);
  const titleHref = open ? MESSAGES_BASE : threadPath(t.id);
  return `
    <article class="msg-row${t.unread ? ' is-unread' : ''}${t.isImportant ? ' is-important' : ''}${open ? ' is-open' : ''}">
      <div class="msg-row__head">
        <span class="msg-row__name">${t.unread ? '<span class="msg-row__dot" aria-label="안 읽음"></span>' : ''}${esc(t.peerDisplayName)}${readStateBadge(t)}</span>
        <span class="msg-row__meta">
          <button type="button" class="msg-star${t.isImportant ? ' is-on' : ''}" data-msg-action="important" data-thread-id="${t.id}" aria-pressed="${t.isImportant ? 'true' : 'false'}" aria-label="${t.isImportant ? '중요 해제' : '중요 표시'}">★</button>
          <span class="msg-row__time">${formatRelative(t.updatedAt)}</span>
        </span>
      </div>
      <a href="#${titleHref}" class="msg-row__title" data-msg-nav="${titleHref}">${esc(threadTitle(t))}</a>
      ${open ? renderExpandedBody(t, role) : ''}
      ${
        open
          ? ''
          : `<div class="msg-row__chips">
        <span class="msg-chip">${esc(t.contextLabel)}</span>
        <span class="msg-badge msg-badge--sm">${esc(t.scopeBadge)}</span>
      </div>`
      }
    </article>`;
}

/** @param {import('./thread-store.js').MessageThread} thread @param {string} role */
function renderExpandedBody(thread, role) {
  let t = thread;
  if (isMessagesApiMode() && t.messages.length === 0 && t.lastPreview) {
    t = {
      ...t,
      messages: [
        {
          id: 0,
          sender: 'me',
          body: t.lastPreview,
          createdAt: t.updatedAt || new Date().toISOString(),
        },
      ],
    };
  } else if (isMessagesApiMode() && t.messages.length === 0) {
    return `<p class="msg-empty">대화를 불러오는 중…</p>`;
  }

  const canReply = canReplyInThread(t, role);
  const msgs = t.messages
    .map((m) => {
      const receipt =
        m.sender === 'me'
          ? `<span class="msg-bubble__read">${isReadByPeer(t, m) ? '읽음' : '안읽음'}</span>`
          : '';
      const body = String(m.body || '').trim();
      return `<div class="msg-bubble msg-bubble--${m.sender}"><span class="msg-bubble__label">${m.sender === 'me' ? '나' : esc(t.peerDisplayName)}</span>${body ? esc(body) : ''}${renderAttachments(m)}${receipt}</div>`;
    })
    .join('');
  const requestBlock =
    t.showRequestInPanel && t.requestSummary
      ? `<p class="msg-summary__request">요청문: "${esc(t.requestSummary)}"</p>`
      : `<p class="msg-summary__muted">요청문 비공개</p>`;
  const replyBlock = canReply
    ? `<form class="msg-reply" data-msg-reply="${t.id}">
        <textarea class="msg-reply__input" rows="2" placeholder="답장 입력"></textarea>
        <div class="msg-reply__attach">
          <label class="msg-reply__file-label">${MESSAGE_ATTACHMENT.label}
            <input class="msg-reply__file" type="file" multiple accept="${MESSAGE_ATTACHMENT.accept}" />
          </label>
          <p class="msg-reply__attach-hint">${MESSAGE_ATTACHMENT.hint}</p>
          <p class="msg-reply__files is-hidden" data-msg-file-list></p>
        </div>
        <button type="submit" class="btn btn--primary btn--sm">전송</button>
      </form>`
    : `<p class="msg-note msg-note--warn">${esc(getReplyBlockedMessage(t, role))}</p>`;

  return `
    <div class="msg-row__expand">
      <div class="msg-scope">
        <span class="msg-scope__label">공개 범위:</span>
        <span class="msg-badge">${esc(t.scopeBadge)}</span>
        <span class="msg-scope__hint">${esc(t.scopeHint)}</span>
      </div>
      <details class="msg-summary">
        <summary>상대 요약</summary>
        <p>${esc(t.structuredLine)}</p>
        ${requestBlock}
      </details>
      <div class="msg-thread__messages">${msgs}</div>
      ${t.isBlocked ? `<p class="msg-note msg-note--warn">${esc(t.blockReason || BLOCK_THREAD_COPY.banner)}</p>` : ''}
      ${replyBlock}
      <div class="msg-row__actions">
        <button type="button" class="btn btn--secondary btn--sm" data-msg-action="report" data-thread-id="${t.id}">신고</button>
        <button type="button" class="btn btn--secondary btn--sm" data-msg-action="archive" data-thread-id="${t.id}">${t.isArchived ? '보관 해제' : '보관'}</button>
        <button type="button" class="btn btn--secondary btn--sm" data-msg-action="block" data-thread-id="${t.id}" ${t.isBlocked ? 'disabled' : ''}>차단</button>
      </div>
    </div>`;
}

/** @param {string} role */
function renderEmptyList(role) {
  const copy = getMessagesEmptyCopy(role === 'parent' ? 'parent' : role);
  const ctaHref = role === 'parent' ? '#/mypage/wishlist' : '#/mypage/student-review';
  return renderStateCard({
    title: copy.title,
    body: copy.body,
    cta: copy.cta,
    ctaHref: copy.cta ? ctaHref : undefined,
    screenId: copy.screenId,
  });
}

/** @param {HTMLElement} root @param {() => void} rerender */

export function bindMessagesScreenEvents(root, rerender) {

  root.querySelectorAll('[data-msg-nav]').forEach((el) => {

    el.addEventListener('click', (e) => {

      e.preventDefault();

      window.location.hash = el.getAttribute('data-msg-nav') || MESSAGES_BASE;

    });

  });

  void hydrateReviewInbox(root, rerender);



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

        if (action === 'important') {
          const thread = getThread(id);
          await setThreadImportant(id, !thread?.isImportant);
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

        alert(err?.message || '처리에 실패했습니다.');

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
      const fileInput = form.querySelector('.msg-reply__file');
      const body = input?.value?.trim() || '';
      const files = Array.from(fileInput?.files || []);
      const fileErr = validateMessageFiles(files);
      if (fileErr) {
        alert(fileErr);
        return;
      }
      if (!body && files.length === 0) return;

      try {

        await appendMessageToThread(id, body, files);

        rerender();

      } catch (err) {

        console.warn('[messages]', err);

        if (err?.code === 'paid_gate') showPaidGateOverlay();
        else if (err?.code === 'email_verify_required') showEmailVerifyOverlay();

        else alert(err?.message || '답장 전송에 실패했습니다.');

      }

    });

  });



  root.querySelectorAll('.msg-reply__file').forEach((input) => {
    input.addEventListener('change', () => {
      const list = input.closest('.msg-reply')?.querySelector('[data-msg-file-list]');
      const files = Array.from(input.files || []);
      if (!list) return;
      if (!files.length) {
        list.textContent = '';
        list.classList.add('is-hidden');
        return;
      }
      const err = validateMessageFiles(files);
      list.textContent = err || files.map((f) => `${f.name} (${formatFileBytes(f.size)})`).join(', ');
      list.classList.toggle('is-error', Boolean(err));
      list.classList.remove('is-hidden');
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


