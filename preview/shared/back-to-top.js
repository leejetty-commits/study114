/**
 * 맨 위 / 맨 아래 / 문의하기 플로팅
 * - 「맨 위로」: 전 폭 (기존 위치·크기 유지)
 * - 「맨 아래로」: 모바일(≤768px)만, 맨 위 버튼 바로 위 8px
 * - 「문의하기」: 맨 위로 자리 위(고정). 스크롤 무관 표시. 모달 시 숨김
 * 상세·비교·후기 등 모달이 열려 있으면 모두 숨김
 */

import {
  INQUIRY_FAQ_HASH,
  INQUIRY_MAILTO,
  KAKAO_CHAT_URL,
} from './inquiry-contact.js';

const TOP_ID = 'study114-back-to-top';
const BOTTOM_ID = 'study114-back-to-bottom';
const INQUIRY_ID = 'study114-inquiry-fab';
const INQUIRY_PANEL_ID = 'study114-inquiry-panel';
const MOBILE_MQ = '(max-width: 768px)';
const EDGE_PX = 96;

function pageOverflows() {
  const doc = document.documentElement;
  return doc.scrollHeight > window.innerHeight + 48;
}

/** 모달·오버레이 열림 — 목록은 보고용으로 유지 */
export const MODAL_OPEN_SELECTORS = [
  '#p24-detail-modal',
  '#compare-modal-root',
  '.review-sheet-root',
  '#ng-login-gate',
  '#ng-card-unavailable',
  '.msg-overlay',
  '.s114-confirm-backdrop',
  '.shop-lightbox:not([hidden])',
  '.modal-overlay.member-delete-modal',
];

function isModalOpen() {
  if (document.body.classList.contains('p24-detail-open')) return true;
  for (const sel of MODAL_OPEN_SELECTORS) {
    if (document.querySelector(sel)) return true;
  }
  return false;
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}

function scrollBehavior() {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

function isMobileViewport() {
  return Boolean(window.matchMedia?.(MOBILE_MQ)?.matches);
}

function distanceFromBottom() {
  const doc = document.documentElement;
  const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
  return maxScroll - window.scrollY;
}

function syncTop(btn) {
  if (!btn) return;
  if (isModalOpen()) {
    btn.hidden = true;
    btn.classList.remove('is-visible');
    return;
  }
  if (!pageOverflows()) {
    btn.hidden = true;
    btn.classList.remove('is-visible');
    return;
  }
  const show = window.scrollY > EDGE_PX;
  btn.hidden = false;
  btn.classList.toggle('is-visible', show);
}

function syncBottom(btn) {
  if (!btn) return;
  // 데스크톱: DOM은 두되 표시하지 않음 (레이아웃 0)
  if (!isMobileViewport() || isModalOpen() || !pageOverflows()) {
    btn.hidden = true;
    btn.classList.remove('is-visible');
    return;
  }
  const show = distanceFromBottom() > EDGE_PX;
  btn.hidden = false;
  btn.classList.toggle('is-visible', show);
}

function closeInquiryPanel() {
  const root = document.getElementById(INQUIRY_ID);
  const panel = document.getElementById(INQUIRY_PANEL_ID);
  const btn = root?.querySelector('.inquiry-fab__toggle');
  if (panel) panel.hidden = true;
  if (btn) btn.setAttribute('aria-expanded', 'false');
  root?.classList.remove('is-open');
}

function syncInquiry(root) {
  if (!root) return;
  if (isModalOpen()) {
    closeInquiryPanel();
    root.hidden = true;
    root.classList.remove('is-visible');
    return;
  }
  root.hidden = false;
  root.classList.add('is-visible');
}

function syncAll() {
  syncTop(document.getElementById(TOP_ID));
  syncBottom(document.getElementById(BOTTOM_ID));
  syncInquiry(document.getElementById(INQUIRY_ID));
}

/** 모달 open/close 직후 가시성 즉시 동기화 */
export function refreshBackToTop() {
  syncAll();
}

function ensureTopButton() {
  let btn = document.getElementById(TOP_ID);
  if (btn) return btn;
  btn = document.createElement('button');
  btn.id = TOP_ID;
  btn.type = 'button';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', '맨 위로');
  btn.setAttribute('title', '맨 위로');
  btn.innerHTML = '<span aria-hidden="true">↑</span><span class="back-to-top__label">맨위</span>';
  btn.hidden = true;
  document.body.appendChild(btn);
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  });
  return btn;
}

function ensureBottomButton() {
  let btn = document.getElementById(BOTTOM_ID);
  if (btn) return btn;
  btn = document.createElement('button');
  btn.id = BOTTOM_ID;
  btn.type = 'button';
  btn.className = 'back-to-top back-to-bottom';
  btn.setAttribute('aria-label', '맨 아래로');
  btn.setAttribute('title', '맨 아래로');
  btn.innerHTML = '<span aria-hidden="true">↓</span><span class="back-to-top__label">맨아래</span>';
  btn.hidden = true;
  document.body.appendChild(btn);
  btn.addEventListener('click', () => {
    const top = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top, behavior: scrollBehavior() });
  });
  return btn;
}

function ensureInquiryFab() {
  let root = document.getElementById(INQUIRY_ID);
  if (root) return root;

  root = document.createElement('div');
  root.id = INQUIRY_ID;
  root.className = 'inquiry-fab';
  root.hidden = true;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'inquiry-fab__toggle';
  toggle.setAttribute('aria-label', '문의하기');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', INQUIRY_PANEL_ID);
  toggle.setAttribute('title', '문의하기');
  toggle.innerHTML =
    '<span class="inquiry-fab__toggle-label">문의하기</span>';

  const panel = document.createElement('div');
  panel.id = INQUIRY_PANEL_ID;
  panel.className = 'inquiry-fab__panel';
  panel.setAttribute('role', 'menu');
  panel.setAttribute('aria-label', '문의하기');
  panel.hidden = true;
  panel.innerHTML = [
    `<a class="inquiry-fab__item" role="menuitem" href="${INQUIRY_FAQ_HASH}">자주 묻는 질문</a>`,
    `<a class="inquiry-fab__item" role="menuitem" href="${INQUIRY_MAILTO}">이메일 문의</a>`,
    `<a class="inquiry-fab__item" role="menuitem" href="${KAKAO_CHAT_URL}" target="_blank" rel="noopener noreferrer">카카오톡 문의</a>`,
  ].join('');

  root.appendChild(panel);
  root.appendChild(toggle);
  document.body.appendChild(root);

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = panel.hidden;
    if (open) {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      root.classList.add('is-open');
    } else {
      closeInquiryPanel();
    }
  });

  panel.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  if (!window.__study114InquiryFabBound) {
    window.__study114InquiryFabBound = true;
    document.addEventListener(
      'click',
      (e) => {
        const el = document.getElementById(INQUIRY_ID);
        if (!el || el.hidden || !el.classList.contains('is-open')) return;
        if (el.contains(/** @type {Node} */ (e.target))) return;
        closeInquiryPanel();
      },
      true,
    );
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeInquiryPanel();
    });
  }

  return root;
}

/**
 * @param {ParentNode} [_root] 렌더 루트(미사용, 호출 호환용)
 */
export function ensureBackToTop(_root) {
  ensureTopButton();
  ensureBottomButton();
  ensureInquiryFab();

  if (!window.__study114BackToTopBound) {
    window.__study114BackToTopBound = true;
    const onScroll = () => syncAll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(onScroll);
      ro.observe(document.documentElement);
      window.__study114BackToTopRo = ro;
    }
  }

  requestAnimationFrame(() => syncAll());
  return document.getElementById(TOP_ID);
}
