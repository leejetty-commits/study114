import { COMPARE_MAX } from './exposure-schema.js';
import { formatMonthlyWon, formatTutorFeeCard } from './exposure-format.js';
import { openCompareModal } from './compare-modal.js';
import {
  compareBarHint,
  COMPARE_BAR_LABELS,
  WISH_LABELS,
  EMPTY_COPY,
} from './handoff-copy.js';
import { notifyCompareToggle } from './handoff-utils.js';
import {
  addCompareFromWishlist,
  clearCompare,
  getCompareIds,
  getCompareItems,
  getWishlistItems,
  removeWishlist,
  toggleCompare,
  toggleWishlist,
} from './user-actions-state.js';

function esc(s) {
  return String(s ?? '').replace(/</g, '&lt;');
}

function itemTitle(kind, item) {
  return kind === 'tutor' ? item.tutor_display_name : item.study_room_name;
}

function itemMeta(kind, item) {
  if (kind === 'tutor') {
    return `${item.main_subject_note} · ${formatTutorFeeCard(item)}`;
  }
  return `${item.main_subject_note} · ${formatMonthlyWon(item.price_amount)}`;
}

export function renderCompareBar() {
  const blocks = [
    { kind: 'study_room', label: '공부방' },
    { kind: 'tutor', label: '과외쌤' },
  ]
    .map(({ kind, label }) => {
      const count = getCompareIds(kind).length;
      if (count === 0) return '';
      return `
        <div class="compare-bar__group">
          <span class="compare-bar__label">${label} <strong>${count}/${COMPARE_MAX}</strong></span>
          <button type="button" class="btn btn--primary btn--sm" data-action="compare-bar-open" data-compare-kind="${kind}">${COMPARE_BAR_LABELS.open}</button>
          <button type="button" class="btn btn--secondary btn--sm" data-action="compare-bar-clear" data-compare-kind="${kind}">${COMPARE_BAR_LABELS.clear}</button>
        </div>`;
    })
    .filter(Boolean);

  if (!blocks.length) return '';
  return `
    <aside class="compare-bar" aria-label="비교 담기">
      <p class="compare-bar__hint">${compareBarHint(COMPARE_MAX)}</p>
      ${blocks.join('')}
    </aside>`;
}

function renderWishlistSection(kind, label) {
  const items = getWishlistItems(kind);
  if (!items.length) {
    return `<p class="wishlist-modal__empty">${EMPTY_COPY.wishlist}</p>`;
  }
  return `
    <ul class="wishlist-modal__list">
      ${items
        .map(
          (item) => `
        <li class="wishlist-modal__row">
          <div class="wishlist-modal__body">
            <strong>${esc(itemTitle(kind, item))}</strong>
            <span>${esc(itemMeta(kind, item))}</span>
          </div>
          <div class="wishlist-modal__actions">
            <button type="button" class="btn btn--secondary btn--sm" data-action="wishlist-add-compare" data-item-kind="${kind}" data-item-id="${item.id}">비교에 담기</button>
            <button type="button" class="btn btn--secondary btn--sm" data-action="wishlist-remove" data-item-kind="${kind}" data-item-id="${item.id}">${WISH_LABELS.remove}</button>
          </div>
        </li>`,
        )
        .join('')}
    </ul>`;
}

function closeWishlistModal() {
  document.getElementById('wishlist-modal-root')?.remove();
  document.body.style.overflow = '';
}

/** @param {() => void} [onUpdate] */
export function openWishlistModal(onUpdate) {
  closeWishlistModal();
  const root = document.createElement('div');
  root.id = 'wishlist-modal-root';
  root.className = 'compare-modal-root';
  root.innerHTML = `
    <div class="compare-modal__backdrop" data-action="wishlist-close"></div>
    <div class="compare-modal wishlist-modal" role="dialog" aria-modal="true" aria-labelledby="wishlist-modal-title">
      <header class="compare-modal__header">
        <div>
          <h2 id="wishlist-modal-title" class="compare-modal__title">마이페이지 · 찜</h2>
          <p class="compare-modal__sub">6장 §5 — 찜한 항목을 비교검색 후보로 담을 수 있습니다</p>
        </div>
        <button type="button" class="compare-modal__close" data-action="wishlist-close" aria-label="닫기">×</button>
      </header>
      <div class="compare-modal__body">
        <h3 class="wishlist-modal__heading">공부방</h3>
        ${renderWishlistSection('study_room', '공부방')}
        <h3 class="wishlist-modal__heading">과외쌤</h3>
        ${renderWishlistSection('tutor', '과외쌤')}
      </div>
      <footer class="compare-modal__footer">
        <button type="button" class="btn btn--secondary btn--sm" data-action="wishlist-close">닫기</button>
      </footer>
    </div>`;

  document.body.appendChild(root);
  document.body.style.overflow = 'hidden';

  const refresh = () => {
    closeWishlistModal();
    openWishlistModal(onUpdate);
    onUpdate?.();
  };

  root.querySelectorAll('[data-action="wishlist-close"]').forEach((el) => {
    el.addEventListener('click', closeWishlistModal);
  });

  root.querySelectorAll('[data-action="wishlist-remove"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeWishlist(btn.dataset.itemKind, btn.dataset.itemId);
      refresh();
    });
  });

  root.querySelectorAll('[data-action="wishlist-add-compare"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.itemKind;
      const result = addCompareFromWishlist(kind, btn.dataset.itemId);
      if (!notifyCompareToggle(result, kind, { sourceRoute: 'wishlist' })) return;
      onUpdate?.();
    });
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeWishlistModal();
  });
}

/** @param {HTMLElement} root @param {() => void} rerender @param {{ sourceRoute?: string }} [opts] */
export function bindUserActionEvents(root, rerender, opts = {}) {
  const sourceRoute = opts.sourceRoute || 'search';

  root.querySelectorAll('[data-action="wish-toggle"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleWishlist(btn.dataset.itemKind, btn.dataset.itemId);
      rerender();
    });
  });

  root.querySelectorAll('[data-action="compare-toggle"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const kind = btn.dataset.itemKind;
      const result = toggleCompare(kind, btn.dataset.itemId);
      if (!notifyCompareToggle(result, kind, { sourceRoute })) return;
      rerender();
    });
  });

  root.querySelectorAll('[data-action="compare-bar-open"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.compareKind || 'study_room';
      openCompareModal(kind, getCompareItems(kind));
    });
  });

  root.querySelectorAll('[data-action="compare-bar-clear"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearCompare(btn.dataset.compareKind || 'study_room');
      rerender();
    });
  });
}
