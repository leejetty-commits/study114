/**
 * 공개 쇼케이스용 후기 티저.
 * 정책/카운트/쿼터는 store·엔진을 그대로 쓰고, 여기선 visible 최신 2~3개만 보여 준다.
 * 공부방 마이샵 1차. 과외쌤 공개 페이지가 생기면 같은 mount를 재사용한다.
 */

import { esc } from '../detail-decision/detail-utils.js';
import { fetchReviewSummary, reviewsArchivePath } from './store.js';
import {
  PROVIDER_REVIEW_COPY,
  REVIEW_ORIGIN_LABELS,
  REVIEW_POLICY,
  reviewSnippet,
} from './copy.js';
import { shopReviewTeaserMountHtml } from './teaser-mount.js';

export { shopReviewTeaserMountHtml } from './teaser-mount.js';

/** 마이샵 티저 노출 개수. 정렬은 최신순(summary와 동일). 향후 대표+최신 혼합 여지. */
export const SHOP_REVIEW_TEASER_LIMIT = REVIEW_POLICY.shopTeaserLimit;

function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function renderTeaserBody(summary, providerType, providerId) {
  const count = Number(summary.review_count) || 0;
  const items = (summary.reviews || []).slice(0, SHOP_REVIEW_TEASER_LIMIT);
  if (!items.length || count <= 0) {
    return `<p class="shop-review-teaser__empty">${esc(PROVIDER_REVIEW_COPY.shopEmpty)}</p>`;
  }

  const list = items
    .map((r) => {
      const tags = (r.point_tags || [])
        .slice(0, 3)
        .map((t) => `<span class="p24-review-tag p24-review-tag--sm">${esc(t)}</span>`)
        .join('');
      const origin = REVIEW_ORIGIN_LABELS[r.review_origin_type] || '';
      return `<li class="shop-review-teaser__item">
        <button type="button" class="review-sheet__item-btn" data-review-expand="${r.id}">
          <p class="shop-review-teaser__snippet">${esc(reviewSnippet(r.review_body))}</p>
          <p class="shop-review-teaser__full" hidden>${esc(r.review_body || '')}</p>
          <p class="shop-review-teaser__meta">${esc([origin, formatWhen(r.created_at)].filter(Boolean).join(' · '))}</p>
          ${tags ? `<div class="p24-review-tags">${tags}</div>` : ''}
        </button>
      </li>`;
    })
    .join('');

  const moreHref = `#${reviewsArchivePath({ providerType, providerId })}`;
  return `
    <ul class="shop-review-teaser__list">${list}</ul>
    <a class="shop-review-teaser__more" href="${esc(moreHref)}" aria-label="후기함에서 이 대상의 후기 더 보기">${esc(PROVIDER_REVIEW_COPY.moreCta)}</a>`;
}

/** @param {HTMLElement} host */
export async function mountShopReviewTeaser(host) {
  if (!host) return;
  const providerType = host.getAttribute('data-provider-type') === 'tutor' ? 'tutor' : 'study_room';
  const providerId = Number(host.getAttribute('data-provider-id') || 0);
  if (!providerId) {
    host.innerHTML = `<p class="shop-review-teaser__empty">${esc(PROVIDER_REVIEW_COPY.shopEmpty)}</p>`;
    return;
  }

  const summary = await fetchReviewSummary(providerType, providerId, { role: 'guest', userId: null });
  host.innerHTML = renderTeaserBody(summary, providerType, providerId);
  host.querySelectorAll('[data-review-expand]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const full = btn.querySelector('.shop-review-teaser__full');
      const snip = btn.querySelector('.shop-review-teaser__snippet');
      if (!full || !snip) return;
      const open = !full.hidden;
      full.hidden = open;
      snip.hidden = !open;
    });
  });
}

/** @param {ParentNode} root */
export function bindShopReviewTeasers(root) {
  root.querySelectorAll('[data-shop-review-teaser]').forEach((el) => {
    void mountShopReviewTeaser(el);
  });
}
