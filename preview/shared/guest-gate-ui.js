/**
 * guest 소개/로그인 유도 UI — 등록·마이페이지·유료상품 계정 경로 공용
 */

import { loginUrl, signupUrl } from './route-access.js';
import { HOME_UI_BASE } from './preview-links.js';
import { isSafeReturnTo } from './auth-redirect.js';
import {
  savePendingDeepIntent,
  clearPendingDeepIntent,
  normalizeDeepIntentSource,
} from './pending-deep-intent.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {{
 *   title: string,
 *   lead: string,
 *   bullets?: string[],
 *   from?: string,
 *   action?: string,
 *   primaryLabel?: string,
 * }} opts
 */
export function renderGuestLoginGatePanel(opts) {
  const {
    title,
    lead,
    bullets = [],
    from = 'site',
    action = '',
    primaryLabel = '로그인하고 이어서',
  } = opts;
  const loginHref = loginUrl(from, action);
  const signupHref = signupUrl();
  const list =
    bullets.length > 0
      ? `<ul class="guest-gate__list">${bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`
      : '';

  return `
    <section class="guest-gate" aria-label="${esc(title)}">
      <p class="guest-gate__welcome">
        <img
          class="guest-gate__welcome-logo"
          src="/assets/brand/logo-wordmark.png"
          alt="우동공과"
          width="120"
          height="32"
        />
        <span class="guest-gate__welcome-text">에 오신 것을 환영합니다</span>
      </p>
      <p class="guest-gate__eyebrow">비회원 안내</p>
      <h1 class="guest-gate__title">${esc(title)}</h1>
      <p class="guest-gate__lead">${esc(lead)}</p>
      ${list}
      <div class="guest-gate__actions">
        <a href="${esc(loginHref)}" class="btn btn--primary" data-util-href="${esc(loginHref)}">${esc(primaryLabel)}</a>
        <a href="${esc(signupHref)}" class="btn btn--secondary" data-util-href="${esc(signupHref)}">회원가입</a>
      </div>
    </section>
  `;
}

/**
 * 등록 SPA용 — 로그인 전 폼 대신 절차 소개.
 * @param {'room'|'tutor'} kind
 */
export function renderRegisterIntroGate(kind) {
  const isRoom = kind === 'room';
  const title = isRoom ? '공부방 상세정보' : '과외쌤 상세등록';
  const lead = isRoom
    ? '공부방 등록은 로그인 후 진행합니다. 비회원은 절차 안내만 확인할 수 있습니다.'
    : '과외쌤 등록은 로그인 후 진행합니다. 비회원은 절차 안내만 확인할 수 있습니다.';
  const bullets = isRoom
    ? [
        '기본정보가 있으면 바로 상세정보(수업·경력 → 시설·연락)으로 이어집니다.',
        '저장·제출은 로그인된 공부방 계정에서만 가능합니다.',
        '등록이 끝나면 대표·추천 노출 상품과 연결할 수 있습니다.',
      ]
    : [
        '기본정보가 있으면 바로 상세등록(수업·학력 → 연락·공개)으로 이어집니다.',
        '저장·제출은 로그인된 과외쌤 계정에서만 가능합니다.',
        '등록이 끝나면 노출상품과 학생 찾기를 이용할 수 있습니다.',
      ];

  return renderGuestLoginGatePanel({
    title,
    lead,
    bullets,
    from: 'register',
    action: isRoom ? 'register_room' : 'register_tutor',
    primaryLabel: '로그인 후 등록 이어하기',
  });
}

const DEEP_GATE_ID = 'guest-deep-access-gate';

const DEEP_ACCESS_COPY = {
  title: '로그인하고 자세히 보기',
  lead: '로그인 후 후기, 위치, 비교, 찜, 문의 정보를 볼 수 있어요.',
  bullets: ['후기 보기', '정확한 위치 확인', '비교·찜·문의 가능'],
  primaryLabel: '로그인하기',
  laterLabel: '나중에 할게요',
};

/** @type {((e: KeyboardEvent) => void) | null} */
let deepGateKeyHandler = null;

export function closeDeepAccessLoginGate() {
  if (deepGateKeyHandler) {
    document.removeEventListener('keydown', deepGateKeyHandler);
    deepGateKeyHandler = null;
  }
  document.getElementById(DEEP_GATE_ID)?.remove();
}

function homeReturnTo(intent) {
  const compact = {
    source: intent.source,
    providerType: intent.providerType,
    providerId: intent.providerId,
    t: intent.t,
  };
  if (intent.extra && Object.keys(intent.extra).length) compact.extra = intent.extra;
  const q = new URLSearchParams({ resume_intent: JSON.stringify(compact) });
  try {
    const hashRaw = (window.location.hash || '').replace(/^#/, '') || '/guest';
    const hashPath = hashRaw.split('?')[0] || '/guest';
    const nextHash = `${hashPath.startsWith('/') ? hashPath : `/${hashPath}`}?${q}`;
    const target = `${window.location.origin}${window.location.pathname}${window.location.search}#${nextHash}`;
    if (isSafeReturnTo(target)) return target;
  } catch {
    /* fallback */
  }
  return `${String(HOME_UI_BASE).replace(/\/$/, '')}/#/guest?${q}`;
}

function intentFromGateEl(el) {
  const gate = el.dataset.gate || (el.getAttribute('data-action') === 'compare-guest-blocked' ? 'compare' : 'detail');
  const host =
    el.closest('[data-item-kind][data-item-id]') ||
    el.closest('[data-provider-kind][data-provider-id]') ||
    el;
  const providerTypeRaw =
    el.dataset.itemKind ||
    el.dataset.compareKind ||
    host?.getAttribute('data-item-kind') ||
    host?.getAttribute('data-provider-kind') ||
    '';
  const providerId = Number(
    el.dataset.itemId ||
      host?.getAttribute('data-item-id') ||
      host?.getAttribute('data-provider-id') ||
      0,
  );
  return {
    source: normalizeDeepIntentSource(gate),
    providerType: providerTypeRaw === 'tutor' ? 'tutor' : providerTypeRaw === 'study_room' ? 'study_room' : '',
    providerId,
  };
}

/**
 * 게스트 깊은 진입용 오버레이. 확대카드/후기/비교/찜/문의 공통.
 * @param {string | { source?: string, providerType?: string, providerId?: number, extra?: object }} [sourceOrOpts]
 */
export function openDeepAccessLoginGate(sourceOrOpts = 'detail') {
  const opts = typeof sourceOrOpts === 'string' ? { source: sourceOrOpts } : sourceOrOpts || {};
  closeDeepAccessLoginGate();
  const intent = savePendingDeepIntent(opts);
  const loginHref = loginUrl('detail', intent?.source || 'detail', intent ? homeReturnTo(intent) : '');
  const overlay = document.createElement('div');
  overlay.id = DEEP_GATE_ID;
  overlay.className = 'guest-deep-gate-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'guest-deep-gate-title');
  overlay.innerHTML = `
    <div class="guest-deep-gate-overlay__backdrop" data-deep-gate-dismiss></div>
    <div class="guest-gate guest-gate--deep">
      <h2 id="guest-deep-gate-title" class="guest-gate__title">${esc(DEEP_ACCESS_COPY.title)}</h2>
      <p class="guest-gate__lead">${esc(DEEP_ACCESS_COPY.lead)}</p>
      <ul class="guest-gate__list">${DEEP_ACCESS_COPY.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      <div class="guest-gate__actions">
        <a href="${esc(loginHref)}" class="btn btn--primary" data-util-href="${esc(loginHref)}">${esc(DEEP_ACCESS_COPY.primaryLabel)}</a>
        <button type="button" class="btn btn--secondary" data-deep-gate-dismiss>${esc(DEEP_ACCESS_COPY.laterLabel)}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const dismiss = () => {
    clearPendingDeepIntent();
    closeDeepAccessLoginGate();
  };
  overlay.querySelectorAll('[data-deep-gate-dismiss]').forEach((el) => {
    el.addEventListener('click', dismiss);
  });
  overlay.querySelector('[data-util-href]')?.addEventListener('click', (e) => {
    const href = e.currentTarget.getAttribute('data-util-href');
    if (!href) return;
    e.preventDefault();
    window.location.assign(href);
  });
  deepGateKeyHandler = (e) => {
    if (e.key !== 'Escape') return;
    dismiss();
  };
  document.addEventListener('keydown', deepGateKeyHandler);
}

/** @param {ParentNode} root */
export function bindGuestGateLinks(root) {
  root.querySelectorAll('[data-util-href]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const href = el.getAttribute('data-util-href');
      if (!href) return;
      e.preventDefault();
      window.location.assign(href);
    });
  });
}

/**
 * 홈/검색 공통 — login-gate · compare-guest-blocked 클릭 처리
 * @param {ParentNode} root
 */
export function bindProtectedGuestActions(root) {
  root.querySelectorAll('[data-action="login-gate"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openDeepAccessLoginGate(intentFromGateEl(el));
    });
  });

  root.querySelectorAll('[data-action="compare-guest-blocked"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openDeepAccessLoginGate({ ...intentFromGateEl(btn), source: 'compare' });
    });
  });
}
