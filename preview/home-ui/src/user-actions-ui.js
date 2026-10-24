import { COMPARE_MAX } from './exposure-schema.js';
import { formatMonthlyWon, formatTutorFeeCard } from './exposure-format.js';
import { openCompareModal } from './compare-modal.js';
import { renderEmptyStateCard } from './empty-state-copy.js';
import {
  compareBarHint,
  COMPARE_BAR_LABELS,
  WISH_LABELS,
} from './handoff-copy.js';
import { notifyCompareToggle } from './handoff-utils.js';
import {
  addCompareFromWishlist,
  clearCompare,
  getCompareIds,
  getCompareItems,
  getExposureItem,
  getWishlistItems,
  isWishlisted,
  isInCompare,
  removeWishlist,
  toggleCompare,
  toggleWishlist,
} from './user-actions-state.js';
import { openDetailDecision, resolveDetailItem } from './detail-decision/index.js';
import { startFirstMemoFlow } from './messages/compose-flow.js';
import { toggleRecommendation } from './search-api.js';

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
    return renderEmptyStateCard('wishlist');
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

// 추천 토글 세션 기억 — 서버 응답 recommended 로 갱신, 새로고침 후 is-active 유지
const RECOMMEND_STORAGE_KEY = 'study114-recommend-active';
const RECOMMEND_MAX = 200;

function loadRecommendedSet() {
  try {
    const raw = sessionStorage.getItem(RECOMMEND_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveRecommendedSet(set) {
  try {
    const arr = [...set];
    sessionStorage.setItem(RECOMMEND_STORAGE_KEY, JSON.stringify(arr.slice(-RECOMMEND_MAX)));
  } catch { /* 무시 */ }
}

/** @param {'study_room'|'tutor'} kind @param {number} id */
export function isRecommendedLocal(kind, id) {
  return loadRecommendedSet().has(`${kind}:${id}`);
}

export function setRecommendedLocal(kind, id, active) {
  const set = loadRecommendedSet();
  const key = `${kind}:${id}`;
  if (active) set.add(key); else set.delete(key);
  saveRecommendedSet(set);
}

/** 서버 목록 응답의 recommended 를 sessionStorage 에 시드한다. */
export function seedRecommendedFromItems(kind, items) {
  if (!Array.isArray(items) || items.length === 0) return;
  const set = loadRecommendedSet();
  let changed = false;
  for (const item of items) {
    if (!item || !item.id) continue;
    const key = `${kind}:${item.id}`;
    if (item.recommended === true && !set.has(key)) { set.add(key); changed = true; }
    else if (item.recommended === false && set.has(key)) { set.delete(key); changed = true; }
  }
  if (changed) saveRecommendedSet(set);
}

let compareDetailBound = false;

/** 비교표 이름이 상세를 연다. 비교 모달은 body에 붙으므로 문서에서 한 번만 듣는다. */
function bindCompareNameDetail() {
  if (compareDetailBound || typeof document === 'undefined') return;
  compareDetailBound = true;
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const cell = target.closest('#compare-modal-root .compare-policy__name, #compare-modal-root thead th');
    if (!cell || cell.classList.contains('compare-policy__row-label')) return;
    const name = (cell.textContent || '').replace(/\s+/g, ' ').trim();
    if (!name || name === '대상' || name === '항목') return;
    for (const kind of ['study_room', 'tutor']) {
      const item = getCompareItems(kind).find((row) => {
        const label = kind === 'tutor' ? row.tutor_display_name : row.study_room_name;
        return label && (label === name || name.includes(String(label).slice(0, 8)));
      });
      if (!item) continue;
      event.preventDefault();
      openDetailDecision({ kind, id: Number(item.id), item, sourceRoute: 'compare' });
      return;
    }
  });
}

/** @param {HTMLElement} root @param {() => void} rerender @param {{ sourceRoute?: string }} [opts] */
export function bindUserActionEvents(root, rerender, opts = {}) {
  const sourceRoute = opts.sourceRoute || 'search';
  bindCompareNameDetail();

  root.querySelectorAll('[data-action="recommend-toggle"]').forEach((btn) => {
    const kind = btn.dataset.itemKind;
    const id = Number(btn.dataset.itemId);
    if (isRecommendedLocal(kind, id)) btn.classList.add('is-active');
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if ((kind !== 'study_room' && kind !== 'tutor') || !id) return;
      try {
        const data = await toggleRecommendation(kind, id);
        const countEl = btn.querySelector('.item-actions__count');
        if (countEl) countEl.textContent = String(data.recommend_count ?? 0);
        btn.classList.toggle('is-active', Boolean(data.recommended));
        btn.title = `추천 ${data.recommend_count ?? 0}`;
        setRecommendedLocal(kind, id, Boolean(data.recommended));
      } catch (err) {
        console.warn('[recommend]', err);
        window.alert(err instanceof Error ? err.message : '추천 처리에 실패했습니다.');
      }
    });
  });

  root.querySelectorAll('[data-action="wish-toggle"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const kind = btn.dataset.itemKind;
      const numId = Number(btn.dataset.itemId);
      const wasWished = isWishlisted(kind, numId);
      toggleWishlist(kind, numId);
      const item = getExposureItem(kind, numId);
      if (item) item.wish_count = Math.max(0, (Number(item.wish_count) || 0) + (wasWished ? -1 : 1));
      rerender();
    });
  });

  root.querySelectorAll('[data-action="compare-toggle"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const kind = btn.dataset.itemKind;
      const numId = Number(btn.dataset.itemId);
      const wasCompared = isInCompare(kind, numId);
      const result = toggleCompare(kind, numId);
      if (!notifyCompareToggle(result, kind, { sourceRoute })) return;
      const item = getExposureItem(kind, numId);
      if (item && result.inCompare !== undefined) {
        item.compare_count = Math.max(0, (Number(item.compare_count) || 0) + (wasCompared ? -1 : 1));
      }
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

  // 로그인 쪽지 배지 → 상세 판단 후 메모 플로우
  root.querySelectorAll('[data-action="open-detail-memo"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const kind = btn.dataset.itemKind;
      const id = Number(btn.dataset.itemId);
      if (kind !== 'study_room' && kind !== 'tutor' && kind !== 'student') return;
      const item = resolveDetailItem(kind, id);
      if (!item) {
        openDetailDecision({ kind, id, onRerender: rerender, sourceRoute });
        return;
      }
      const name =
        kind === 'tutor'
          ? item.tutor_display_name
          : kind === 'student'
            ? item.public_display_name
            : item.study_room_name;
      startFirstMemoFlow({
        kind,
        targetId: id,
        targetName: name || '대상',
        student: kind === 'student' ? item : undefined,
        structuredLine:
          kind === 'student'
            ? `${item.grade_level || '—'} · ${item.subject_label || '—'} · ${item.location_label || '—'}`
            : `${item.main_subject_note || '—'} · ${item.location_label || '—'}`,
      });
    });
  });
}
