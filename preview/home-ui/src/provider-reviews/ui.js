/**
 * 공급자 후기 UI — 쇼케이스 섹션 (검수/댓글/제목 없음)
 */

import { esc } from '../detail-decision/detail-utils.js';
import { getAuthUser } from '../auth-session.js';
import { fetchReviewSummary } from './store.js';
import { PROVIDER_REVIEW_COPY, REVIEW_ORIGIN_LABELS, ctaLabel, reviewSnippet } from './copy.js';
import { openReviewSheet } from './sheet.js';
import { reviewsArchivePath } from './store.js';

function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

/**
 * @param {'study_room'|'tutor'} providerType
 * @param {number} providerId
 */
export async function mountProviderReviewSection(host, providerType, providerId, item, viewer) {
  if (!host) return;
  const auth = getAuthUser();
  const isOwner =
    (viewer === 'study_room' && providerType === 'study_room') ||
    (viewer === 'tutor' && providerType === 'tutor')
      ? Number(item?.user_id || item?.owner_user_id || 0) === Number(auth?.user_id || -1) ||
        (Number(providerId) > 0 && !item?.user_id && !item?.owner_user_id && !!auth)
      : false;

  const summary = await fetchReviewSummary(providerType, providerId, {
    role: viewer,
    userId: auth?.user_id ?? null,
    isOwner,
  });

  host.innerHTML = renderReviewSectionMarkup(summary);
  bindReviewSection(host, providerType, providerId, isOwner);
}

function renderReviewSectionMarkup(summary) {
  const count = Number(summary.review_count) || 0;
  const tags = (summary.summary_tags || [])
    .map((t) => `<span class="p24-review-tag">${esc(t)}</span>`)
    .join('');
  const reviews = summary.reviews || [];
  let bodyHtml = '';
  if (!reviews.length) {
    bodyHtml = `<p class="p24-review-empty">${esc(
      summary.cta_kind === 'write' ? PROVIDER_REVIEW_COPY.emptyEligible : PROVIDER_REVIEW_COPY.empty,
    )}</p>`;
  } else {
    bodyHtml = `<ul class="p24-review-list">${reviews
      .map((r) => {
        const itemTags = (r.point_tags || [])
          .map((t) => `<span class="p24-review-tag p24-review-tag--sm">${esc(t)}</span>`)
          .join('');
        const origin = REVIEW_ORIGIN_LABELS[r.review_origin_type] || '';
        return `<li class="p24-review-item">
          <button type="button" class="review-sheet__item-btn" data-review-expand="${r.id}">
            <p class="p24-review-item__body">${esc(reviewSnippet(r.review_body))}</p>
            <p class="p24-review-item__full" hidden>${esc(r.review_body || '')}</p>
            <p class="p24-review-item__meta">${esc([origin, formatWhen(r.created_at)].filter(Boolean).join(' · '))}</p>
            ${itemTags ? `<div class="p24-review-tags">${itemTags}</div>` : ''}
          </button>
        </li>`;
      })
      .join('')}</ul>`;
  }

  const ctaKind = summary.cta_kind || 'ineligible';
  let cta = '';
  if (ctaKind === 'write' || ctaKind === 'manage') {
    cta = `<button type="button" class="btn btn--secondary btn--sm" data-provider-review-cta="${esc(ctaKind)}">${esc(ctaLabel(ctaKind))}</button>`;
  } else if (ctaKind !== 'none') {
    cta = `<p class="p24-review-hint">${esc(ctaLabel(ctaKind))}</p>`;
  }

  return `
    <section class="p24-section p24-section--reviews" data-provider-review-root>
      <div class="p24-review-head">
        <h3 class="p24-section__title">${esc(PROVIDER_REVIEW_COPY.sectionTitle)}${count ? ` ${count}` : ''}</h3>
        ${cta}
      </div>
      <p class="p24-review-summary-line">${esc(PROVIDER_REVIEW_COPY.sheetSubtitle)}</p>
      ${tags ? `<div class="p24-review-tags">${tags}</div>` : ''}
      ${bodyHtml}
      ${
        count
          ? `<a class="review-sheet__more" href="#${reviewsArchivePath({
              providerType: summary.provider_type,
              providerId: summary.provider_id,
            })}">${esc(PROVIDER_REVIEW_COPY.moreCta)}</a>`
          : ''
      }
    </section>`;
}

function bindReviewSection(host, providerType, providerId, isOwner) {
  host.querySelector('[data-provider-review-cta]')?.addEventListener('click', () => {
    const kind = host.querySelector('[data-provider-review-cta]')?.getAttribute('data-provider-review-cta');
    void openReviewSheet({
      providerType,
      providerId,
      isOwner,
      view: kind === 'manage' ? 'manage' : 'write',
    });
  });
  host.querySelectorAll('[data-review-expand]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const full = btn.querySelector('.p24-review-item__full');
      const snip = btn.querySelector('.p24-review-item__body');
      if (!full || !snip) return;
      const open = !full.hidden;
      full.hidden = open;
      snip.hidden = !open;
    });
  });
}

export function reviewSectionPlaceholder() {
  return `<div class="p24-review-mount" data-provider-review-mount></div>`;
}

export function bindProviderReviewMount(wrap, kind, item, viewer) {
  if (kind !== 'study_room' && kind !== 'tutor') return;
  const mount = wrap.querySelector('[data-provider-review-mount]');
  if (!mount) return;
  const id = Number(item?.id || 0);
  if (!id) return;
  void mountProviderReviewSection(mount, kind, id, item, viewer);
}
