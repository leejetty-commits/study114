/**
 * guest 소개/로그인 유도 UI — 등록·마이페이지·유료상품 계정 경로 공용
 */

import { loginUrl, signupUrl } from './route-access.js';

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
    <section class="guest-gate mypage-panel" aria-label="${esc(title)}">
      <p class="guest-gate__eyebrow">비회원 안내</p>
      <h1 class="guest-gate__title auth-heading">${esc(title)}</h1>
      <p class="guest-gate__lead auth-subheading">${esc(lead)}</p>
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
  const title = isRoom ? '공부방 상세등록' : '과외쌤 상세등록';
  const lead = isRoom
    ? '공부방 등록은 로그인 후 진행합니다. 비회원은 절차 안내만 확인할 수 있습니다.'
    : '과외쌤 등록은 로그인 후 진행합니다. 비회원은 절차 안내만 확인할 수 있습니다.';
  const bullets = isRoom
    ? [
        '기본 정보 → 위치 → 수업 → 경력 → 시설 순으로 작성합니다.',
        '임시저장·제출은 로그인된 공부방 계정에서만 가능합니다.',
        '등록이 끝나면 노출상품(Prime/Pick)과 연결할 수 있습니다.',
      ]
    : [
        '기본 정보 → 지역 → 수업 → 경력 → 연락 순으로 작성합니다.',
        '임시저장·제출은 로그인된 과외쌤 계정에서만 가능합니다.',
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
      const gate = el.dataset.gate || 'default';
      window.location.assign(loginUrl('guest', gate));
    });
  });

  root.querySelectorAll('[data-action="compare-guest-blocked"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.assign(loginUrl('guest', 'compare'));
    });
  });
}
