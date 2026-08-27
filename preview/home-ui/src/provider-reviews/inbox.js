/**
 * 쪽지 후기함 — 단일 후기 리스트
 */

import { esc } from '../detail-decision/detail-utils.js';
import { getAuthUser } from '../auth-session.js';
import { getNavRole } from '../state.js';
import { getStudyRoom } from '../study-room-reg/store.js';
import { getTutor } from '../tutor-reg/store.js';
import { PROVIDER_REVIEW_COPY, reviewSnippet } from './copy.js';
import {
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

function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export function parseReviewsPath(path) {
  const raw = String(path || '');
  const pathOnly = (raw.startsWith('/') ? raw : `/${raw}`).split('?')[0];
  const query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
  const pageNum = Number(new URLSearchParams(query).get('page') || 1);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1;
  if (pathOnly === '/mypage/messages/reviews' || pathOnly.startsWith('/mypage/messages/reviews/')) {
    return { mode: 'list', lane: 'all', page };
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

function inboxKindLabel(origin) {
  return origin === 'experience' ? PROVIDER_REVIEW_COPY.inboxKindExperience : PROVIDER_REVIEW_COPY.inboxKindConsultation;
}

function renderItem(r, { expandable = true, owner = false }) {
  const name = r.provider_label || providerDisplayName(r.provider_type, r.provider_id);
  const kind = inboxKindLabel(r.review_origin_type);
  const badges = `<div class="review-inbox__badges">
      <span class="review-inbox__tag">[${esc(name)}]</span>
      <span class="review-inbox__tag">[${esc(kind)}]</span>
    </div>`;
  const tags = (r.point_tags || []).map((t) => `<span class="p24-review-tag p24-review-tag--sm">${esc(t)}</span>`).join('');
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
      ${badges}
      ${
        expandable
          ? `<button type="button" class="review-sheet__item-btn" data-review-expand="${r.id}">
              <p class="review-sheet__headline">${esc(reviewSnippet(r.review_body))}</p>
              <p class="review-sheet__full" hidden>${esc(r.review_body || '')}</p>
              <p class="review-sheet__meta">${esc([formatWhen(r.created_at), r.review_status === 'hidden' ? '비공개' : ''].filter(Boolean).join(' · '))}</p>
              ${tags ? `<div class="p24-review-tags">${tags}</div>` : ''}
            </button>`
          : `<p class="review-sheet__headline">${esc(reviewSnippet(r.review_body))}</p>`
      }
      ${ownerBtns}${mineBtns}
    </li>`;
}

function providerKindLabel(type) {
  return type === 'tutor' ? '과외쌤' : '공부방';
}

function providerDisplayName(type, id) {
  try {
    if (type === 'study_room') {
      const room = getStudyRoom(id);
      if (room?.study_room_name) return room.study_room_name;
    }
    if (type === 'tutor') {
      const tutor = getTutor(id);
      if (tutor?.tutor_display_name) return tutor.tutor_display_name;
    }
  } catch {
    /* preview store may not be ready */
  }
  return providerKindLabel(type);
}

export function renderReviewInboxPlaceholder() {
  return `
    <section class="msg-panel review-inbox" data-review-inbox data-mode="list" data-lane="all">
      <div data-review-inbox-body><p class="review-sheet__empty">불러오는 중…</p></div>
    </section>`;
}

function reviewsPageFromLocation() {
  const hash = typeof window === 'undefined' ? '' : window.location.hash.slice(1);
  const raw = hash.startsWith('/') ? hash : `/${hash}`;
  return parseReviewsPath(raw)?.page || 1;
}

export async function hydrateReviewInbox(root, rerender) {
  const host = root.querySelector('[data-review-inbox]');
  if (!host) return;
  const body = host.querySelector('[data-review-inbox-body]');
  if (!body) return;
  const page = reviewsPageFromLocation();

  try {
    const data = await fetchReviewInbox('all', page);
    const items = data.items || [];
    body.innerHTML = items.length
      ? `<ul class="review-sheet__list">${items
          .map((r) =>
            renderItem(r, {
              expandable: true,
              owner: !!r.is_owner && !r.is_mine,
            }),
          )
          .join('')}</ul>
        ${pager(data.page || page, data.total || 0, data.page_size || 10, (p) => `${reviewsArchivePath()}?page=${p}`)}`
      : `<p class="review-sheet__empty">${esc(PROVIDER_REVIEW_COPY.inboxEmptyAll)}</p>
        <p class="review-inbox__lead">${esc(PROVIDER_REVIEW_COPY.inboxEmptyAllLead)}</p>`;
  } catch {
    body.innerHTML = `<p class="review-sheet__empty">후기를 불러오지 못했습니다.</p>`;
  }

  bindInbox(host, rerender);
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
  host.querySelectorAll('[data-msg-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-msg-nav') || reviewsArchivePath();
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
