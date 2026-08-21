/**
 * 쪽지 후기함 — 대상 필터 모드 / 계정 아카이브 모드
 */

import { esc } from '../detail-decision/detail-utils.js';
import { getAuthUser } from '../auth-session.js';
import { getNavRole } from '../state.js';
import { PROVIDER_REVIEW_COPY, REVIEW_ORIGIN_LABELS, ctaLabel, reviewSnippet } from './copy.js';
import {
  fetchReviewList,
  fetchReviewInbox,
  fetchReviewSummary,
  blockReviewAuthor,
  unblockReviewAuthor,
  setReviewWriteStatus,
  hideProviderReview,
  unhideProviderReview,
  deleteProviderReview,
  reviewsArchivePath,
} from './store.js';
import { openReviewSheet } from './sheet.js';

function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function isProviderNav(role) {
  return role === 'study_room' || role === 'tutor';
}

export function parseReviewsPath(path) {
  const target = path.match(/^\/mypage\/messages\/reviews\/target\/(study_room|tutor)\/(\d+)/);
  if (target) {
    return { mode: 'target', providerType: target[1], providerId: Number(target[2]), lane: '', page: 1 };
  }
  if (path.endsWith('/reviews/written')) return { mode: 'account', lane: 'written', page: 1 };
  if (path.endsWith('/reviews/received')) return { mode: 'account', lane: 'received', page: 1 };
  if (path === '/mypage/messages/reviews' || path.startsWith('/mypage/messages/reviews')) {
    return { mode: 'account', lane: '', page: 1 };
  }
  return null;
}

export function isReviewsPath(path) {
  return !!parseReviewsPath(path);
}

function pager(page, total, pageSize, hrefFor) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return '';
  const prev = page > 1 ? `<a href="#${hrefFor(page - 1)}" class="review-inbox__page" data-msg-nav="${hrefFor(page - 1)}">이전</a>` : '';
  const next = page < pages ? `<a href="#${hrefFor(page + 1)}" class="review-inbox__page" data-msg-nav="${hrefFor(page + 1)}">다음</a>` : '';
  return `<div class="review-inbox__pager">${prev}<span>${page} / ${pages}</span>${next}</div>`;
}

function renderItem(r, { expandable = true, owner = false }) {
  const tags = (r.point_tags || []).map((t) => `<span class="p24-review-tag p24-review-tag--sm">${esc(t)}</span>`).join('');
  const origin = REVIEW_ORIGIN_LABELS[r.review_origin_type] || '';
  const ownerBtns = owner
    ? `<div class="review-sheet__item-actions">
        ${
          r.is_review_blocked
            ? `<button type="button" class="btn btn--secondary btn--sm" data-review-unblock="${r.author_user_id}" data-provider-type="${esc(r.provider_type)}" data-provider-id="${r.provider_id}">${esc(PROVIDER_REVIEW_COPY.unblockCta)}</button>`
            : `<button type="button" class="btn btn--secondary btn--sm" data-review-block="${r.author_user_id}" data-provider-type="${esc(r.provider_type)}" data-provider-id="${r.provider_id}">${esc(PROVIDER_REVIEW_COPY.blockCta)}</button>`
        }
      </div>`
    : '';
  const mineBtns = r.is_mine
    ? `<div class="review-sheet__item-actions">
        ${r.can_hide ? `<button type="button" class="btn btn--secondary btn--sm" data-review-hide="${r.id}">${esc(PROVIDER_REVIEW_COPY.hideCta)}</button>` : ''}
        ${r.can_unhide ? `<button type="button" class="btn btn--secondary btn--sm" data-review-unhide="${r.id}">${esc(PROVIDER_REVIEW_COPY.unhideCta)}</button>` : ''}
        <button type="button" class="btn btn--secondary btn--sm" data-review-delete="${r.id}">${esc(PROVIDER_REVIEW_COPY.deleteCta)}</button>
      </div>`
    : '';
  return `
    <li class="review-sheet__item" data-review-id="${r.id}">
      ${
        expandable
          ? `<button type="button" class="review-sheet__item-btn" data-review-expand="${r.id}">
              <p class="review-sheet__headline">${esc(reviewSnippet(r.review_body))}</p>
              <p class="review-sheet__full" hidden>${esc(r.review_body || '')}</p>
              <p class="review-sheet__meta">${esc([origin, formatWhen(r.created_at), r.review_status === 'hidden' ? '비공개' : ''].filter(Boolean).join(' · '))}</p>
              ${tags ? `<div class="p24-review-tags">${tags}</div>` : ''}
            </button>`
          : `<p class="review-sheet__headline">${esc(reviewSnippet(r.review_body))}</p>`
      }
      ${ownerBtns}${mineBtns}
    </li>`;
}

export function renderReviewInboxPlaceholder(parsed) {
  const role = getNavRole();
  const lane = parsed.lane || (isProviderNav(role) ? 'received' : 'written');
  const writtenHref = reviewsArchivePath({ lane: 'written' });
  const receivedHref = reviewsArchivePath({ lane: 'received' });
  const laneTabs = isProviderNav(role)
    ? `<div class="review-inbox__lanes">
        <a href="#${receivedHref}" class="msg-tab${lane === 'received' ? ' is-active' : ''}" data-msg-nav="${receivedHref}">${esc(PROVIDER_REVIEW_COPY.inboxReceived)}</a>
        <a href="#${writtenHref}" class="msg-tab${lane === 'written' ? ' is-active' : ''}" data-msg-nav="${writtenHref}">${esc(PROVIDER_REVIEW_COPY.inboxWritten)}</a>
      </div>`
    : '';

  const title =
    parsed.mode === 'target'
      ? '이 대상의 후기'
      : lane === 'received'
        ? PROVIDER_REVIEW_COPY.inboxReceived
        : PROVIDER_REVIEW_COPY.inboxWritten;

  return `
    <section class="msg-panel review-inbox" data-review-inbox data-mode="${esc(parsed.mode)}" data-lane="${esc(lane)}" data-provider-type="${esc(parsed.providerType || '')}" data-provider-id="${parsed.providerId || ''}">
      ${laneTabs}
      <header class="review-inbox__head">
        <h2>${esc(title)}</h2>
        <p class="mypage-muted">${esc(PROVIDER_REVIEW_COPY.sheetSubtitle)}</p>
      </header>
      <div data-review-inbox-body><p class="review-sheet__empty">불러오는 중…</p></div>
    </section>`;
}

export async function hydrateReviewInbox(root, rerender) {
  const host = root.querySelector('[data-review-inbox]');
  if (!host) return;
  const body = host.querySelector('[data-review-inbox-body]');
  if (!body) return;
  const mode = host.getAttribute('data-mode');
  const lane = host.getAttribute('data-lane') || '';
  const providerType = host.getAttribute('data-provider-type');
  const providerId = Number(host.getAttribute('data-provider-id') || 0);
  const auth = getAuthUser();
  const role = getNavRole();

  try {
    if (mode === 'target' && (providerType === 'study_room' || providerType === 'tutor') && providerId) {
      const data = await fetchReviewList(providerType, providerId, 1, {
        role,
        userId: auth?.user_id,
        isOwner: false,
      });
      const summary = await fetchReviewSummary(providerType, providerId, {
        role,
        userId: auth?.user_id,
      });
      const items = data.items || [];
      const cta =
        summary.cta_kind === 'write' || summary.cta_kind === 'manage'
          ? `<button type="button" class="btn btn--primary btn--sm" data-review-inbox-cta="${esc(summary.cta_kind)}" data-item-kind="${esc(providerType)}" data-item-id="${providerId}">${esc(ctaLabel(summary.cta_kind))}</button>`
          : `<p class="review-sheet__cta-note">${esc(ctaLabel(summary.cta_kind))}</p>`;
      body.innerHTML = `
        <p class="review-inbox__count">후기 ${data.review_count || 0}</p>
        ${
          items.length
            ? `<ul class="review-sheet__list">${items.map((r) => renderItem(r, { expandable: true, owner: !!summary.is_owner })).join('')}</ul>`
            : `<p class="review-sheet__empty">${esc(PROVIDER_REVIEW_COPY.empty)}</p>`
        }
        ${pager(data.page || 1, data.total || 0, data.page_size || 10, (p) => `${reviewsArchivePath({ providerType, providerId })}?page=${p}`)}
        <div class="review-sheet__cta">${cta}</div>`;
    } else {
      const data = await fetchReviewInbox(lane, 1);
      const items = data.items || [];
      const empty =
        data.lane === 'received' ? PROVIDER_REVIEW_COPY.inboxEmptyReceived : PROVIDER_REVIEW_COPY.inboxEmptyWritten;
      const owner = data.lane === 'received';
      let ownerBar = '';
      if (owner && (providerType === 'study_room' || providerType === 'tutor' || true)) {
        ownerBar = `<p class="mypage-muted">후기차단은 쪽지차단과 별개입니다. 기존 후기는 자동으로 지워지지 않습니다.</p>`;
      }
      body.innerHTML = `
        ${ownerBar}
        ${
          items.length
            ? `<ul class="review-sheet__list">${items.map((r) => renderItem(r, { expandable: true, owner })).join('')}</ul>`
            : `<p class="review-sheet__empty">${esc(empty)}</p>`
        }
        ${pager(data.page || 1, data.total || 0, data.page_size || 10, (p) => `${reviewsArchivePath({ lane: data.lane })}?page=${p}`)}
      `;
      if (owner && items[0]) {
        const bar = await renderWriteStatusControl(items[0].provider_type, items[0].provider_id);
        if (bar) body.insertAdjacentHTML('afterbegin', bar);
      }
    }
  } catch {
    body.innerHTML = `<p class="review-sheet__empty">후기를 불러오지 못했습니다.</p>`;
  }

  bindInbox(host, rerender);
  bindWriteStatusControl(host, rerender);
}

function bindInbox(host, rerender) {
  host.querySelectorAll('[data-review-expand]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const full = btn.querySelector('.review-sheet__full');
      const snip = btn.querySelector('.review-sheet__headline');
      if (!full || !snip) return;
      const open = !full.hidden;
      full.hidden = open;
      snip.hidden = !open;
    });
  });

  host.querySelector('[data-review-inbox-cta]')?.addEventListener('click', () => {
    const btn = host.querySelector('[data-review-inbox-cta]');
    const kind = btn.getAttribute('data-item-kind');
    const id = Number(btn.getAttribute('data-item-id'));
    const view = btn.getAttribute('data-review-inbox-cta') === 'manage' ? 'manage' : 'write';
    void openReviewSheet({ providerType: kind, providerId: id, view });
  });

  host.querySelectorAll('[data-review-block]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('이 작성자의 추가 후기를 막을까요? 이미 올라온 후기는 그대로 둡니다.')) return;
      await blockReviewAuthor({
        provider_type: btn.getAttribute('data-provider-type'),
        provider_id: Number(btn.getAttribute('data-provider-id')),
        blocked_author_user_id: Number(btn.getAttribute('data-review-block')),
      });
      rerender?.();
    });
  });
  host.querySelectorAll('[data-review-unblock]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await unblockReviewAuthor({
        provider_type: btn.getAttribute('data-provider-type'),
        provider_id: Number(btn.getAttribute('data-provider-id')),
        blocked_author_user_id: Number(btn.getAttribute('data-review-unblock')),
      });
      rerender?.();
    });
  });
  host.querySelectorAll('[data-review-hide]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await hideProviderReview(Number(btn.getAttribute('data-review-hide')), { userId: getAuthUser()?.user_id });
      rerender?.();
    });
  });
  host.querySelectorAll('[data-review-unhide]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await unhideProviderReview(Number(btn.getAttribute('data-review-unhide')), { userId: getAuthUser()?.user_id });
      rerender?.();
    });
  });
  host.querySelectorAll('[data-review-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('이 후기를 삭제할까요? 삭제해도 작성 횟수는 줄어들지 않습니다.')) return;
      await deleteProviderReview(Number(btn.getAttribute('data-review-delete')), { userId: getAuthUser()?.user_id });
      rerender?.();
    });
  });
}

/** 소유자: 대상의 작성 열림/닫힘. 후기함 received 상단에 붙일 때 사용 */
export async function renderWriteStatusControl(providerType, providerId) {
  const summary = await fetchReviewSummary(providerType, providerId, {
    role: getNavRole(),
    userId: getAuthUser()?.user_id,
    isOwner: true,
  });
  if (!summary.is_owner) return '';
  const closed = summary.review_write_status === 'closed';
  return `<div class="review-inbox__write-status">
    <span>${closed ? esc(PROVIDER_REVIEW_COPY.closedCta) : '새 후기를 받고 있어요'}</span>
    <button type="button" class="btn btn--secondary btn--sm" data-review-write-status="${closed ? 'open' : 'closed'}" data-item-kind="${esc(providerType)}" data-item-id="${providerId}">
      ${esc(closed ? PROVIDER_REVIEW_COPY.writeOpenCta : PROVIDER_REVIEW_COPY.writeCloseCta)}
    </button>
  </div>`;
}

export function bindWriteStatusControl(root, rerender) {
  root.querySelectorAll('[data-review-write-status]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await setReviewWriteStatus({
        provider_type: btn.getAttribute('data-item-kind'),
        provider_id: Number(btn.getAttribute('data-item-id')),
        review_write_status: btn.getAttribute('data-review-write-status'),
      });
      rerender?.();
    });
  });
}
