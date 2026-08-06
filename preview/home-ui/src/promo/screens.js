import { STUDY_ROOM_PROMO } from './study-room-content.js';
import { searchUiUrl, STUDY_ROOM_REGISTER_URL } from '../../../shared/preview-links.js';
import { getNavRole } from '../state.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function findRoomHref() {
  return searchUiUrl('room', getNavRole());
}

function registerHref() {
  return STUDY_ROOM_REGISTER_URL;
}

function mockMap() {
  return `
    <div class="promo-ui-mock promo-ui-mock--map" aria-hidden="true">
      <div class="promo-ui-mock__map">
        <span class="promo-ui-mock__pin" style="top:28%;left:42%"></span>
        <span class="promo-ui-mock__pin" style="top:48%;left:58%"></span>
        <span class="promo-ui-mock__pin" style="top:62%;left:36%"></span>
      </div>
      <div class="promo-ui-mock__cards">
        <div class="promo-ui-mock__card"><strong>대치 수학 공부방</strong><span>도보 8분 · 초등·중등</span></div>
        <div class="promo-ui-mock__card"><strong>목동 영어 관리형</strong><span>1.2km · 중등 집중</span></div>
      </div>
    </div>`;
}

function mockCompare() {
  return `
    <div class="promo-ui-mock promo-ui-mock--compare" aria-hidden="true">
      <div class="promo-ui-mock__col"><span>위치</span><strong>생활권</strong><em>가까운 순</em></div>
      <div class="promo-ui-mock__col"><span>과목</span><strong>수학·영어</strong><em>대상 학년</em></div>
      <div class="promo-ui-mock__col"><span>정보</span><strong>소개·방식</strong><em>먼저 확인</em></div>
    </div>`;
}

function mockRegister() {
  return `
    <div class="promo-ui-mock promo-ui-mock--register" aria-hidden="true">
      <div class="promo-ui-mock__field"><span>공부방 이름</span><b>우리동네 공부방</b></div>
      <div class="promo-ui-mock__field"><span>지역</span><b>서울 · 강남</b></div>
      <div class="promo-ui-mock__field"><span>한 줄 소개</span><b>초등 루틴 관리</b></div>
      <div class="promo-ui-mock__bar">기본 정보부터 가볍게 시작</div>
    </div>`;
}

function renderStudyRoomPromo() {
  const c = STUDY_ROOM_PROMO;
  const findHref = findRoomHref();
  const regHref = registerHref();

  return `
    <article class="promo-page">
      <section class="promo-hero">
        <div class="promo-hero__copy">
          <p class="promo-eyebrow">${esc(c.meta.eyebrow)}</p>
          <h1 class="promo-hero__title">${esc(c.hero.title)}</h1>
          <p class="promo-hero__lead">${esc(c.hero.lead)}</p>
          <div class="promo-cta-row">
            <a class="promo-btn promo-btn--primary" href="${esc(findHref)}" data-promo-ext="${esc(findHref)}">${esc(c.hero.primaryCta.label)}</a>
            <a class="promo-btn promo-btn--ghost" href="${esc(regHref)}" data-promo-ext="${esc(regHref)}">${esc(c.hero.secondaryCta.label)}</a>
          </div>
        </div>
        <div class="promo-hero__visual">${mockMap()}</div>
      </section>

      <section class="promo-split">
        <div class="promo-split__visual">${mockMap()}</div>
        <div class="promo-split__copy">
          <h2 class="promo-h2">${esc(c.near.title)}</h2>
          <p class="promo-body">${esc(c.near.body)}</p>
          <ul class="promo-bullets">
            ${c.near.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}
          </ul>
        </div>
      </section>

      <section class="promo-band">
        <h2 class="promo-h2 promo-h2--center">${esc(c.compare.title)}</h2>
        <p class="promo-lead promo-lead--center">${esc(c.compare.lead)}</p>
        <div class="promo-compare-grid">
          ${c.compare.cards
            .map(
              (card, i) => `
            <article class="promo-feature-card">
              <span class="promo-feature-card__num">${i + 1}</span>
              <h3>${esc(card.title)}</h3>
              <p>${esc(card.body)}</p>
            </article>`,
            )
            .join('')}
        </div>
        <div class="promo-band__visual">${mockCompare()}</div>
      </section>

      <section class="promo-split promo-split--structure">
        <div class="promo-split__copy">
          <p class="promo-badge">${esc(c.structure.badge)}</p>
          <h2 class="promo-h2">${esc(c.structure.title)}</h2>
          <p class="promo-body">${esc(c.structure.body)}</p>
          <a class="promo-btn promo-btn--primary" href="${esc(regHref)}" data-promo-ext="${esc(regHref)}">${esc(c.structure.cta.label)}</a>
        </div>
        <div class="promo-split__visual">${mockRegister()}</div>
      </section>

      <section class="promo-band">
        <h2 class="promo-h2 promo-h2--center">${esc(c.personas.title)}</h2>
        <div class="promo-persona-grid">
          ${c.personas.cards
            .map(
              (card) => `
            <article class="promo-persona-card">
              <span class="promo-persona-card__role">${esc(card.role)}</span>
              <h3>${esc(card.title)}</h3>
              <p>${esc(card.body)}</p>
            </article>`,
            )
            .join('')}
        </div>
      </section>

      <section class="promo-trust">
        <h2 class="promo-h2 promo-h2--center">${esc(c.trust.title)}</h2>
        <div class="promo-trust-grid">
          ${c.trust.items
            .map(
              (item) => `
            <article class="promo-trust-item">
              <h3>${esc(item.title)}</h3>
              <p>${esc(item.body)}</p>
            </article>`,
            )
            .join('')}
        </div>
      </section>

      <section class="promo-final">
        <h2 class="promo-final__title">${esc(c.finalCta.title)}</h2>
        <p class="promo-final__lead">${esc(c.finalCta.lead)}</p>
        <div class="promo-cta-row promo-cta-row--center">
          <a class="promo-btn promo-btn--on-dark" href="${esc(findHref)}" data-promo-ext="${esc(findHref)}">${esc(c.finalCta.primaryCta.label)}</a>
          <a class="promo-btn promo-btn--on-dark-ghost" href="${esc(regHref)}" data-promo-ext="${esc(regHref)}">${esc(c.finalCta.secondaryCta.label)}</a>
        </div>
      </section>
    </article>`;
}

export function renderPromoScreen(path) {
  const id = path.replace(/^\/promo\//, '').split('?')[0];
  if (id === 'study-room') return renderStudyRoomPromo();
  return `
    <section class="promo-planned">
      <h1>준비 중인 홍보 페이지입니다</h1>
      <p>곧 연결됩니다. 지금은 공부방 소개를 먼저 확인해 주세요.</p>
      <a class="promo-btn promo-btn--primary" href="#/promo/study-room" data-nav="/promo/study-room">공부방 소개 보기</a>
    </section>`;
}

/** 우측 레일 · 모바일 인라인 짧은 카드 */
export function renderPromoRailCard() {
  const card = STUDY_ROOM_PROMO.railCard;
  return `
    <a class="promo-rail-card" href="#${esc(card.path)}" data-nav="${esc(card.path)}">
      <span class="promo-rail-card__label">소개</span>
      <strong class="promo-rail-card__title">${esc(card.title)}</strong>
      <span class="promo-rail-card__desc">${esc(card.desc)}</span>
      <em class="promo-rail-card__cta">${esc(card.cta)} →</em>
    </a>`;
}

export function renderPromoInlineCard() {
  const card = STUDY_ROOM_PROMO.railCard;
  return `
    <aside class="promo-inline-card" aria-label="서비스 소개">
      <div>
        <strong>${esc(card.title)}</strong>
        <p>${esc(card.desc)}</p>
      </div>
      <a class="promo-btn promo-btn--primary promo-btn--sm" href="#${esc(card.path)}" data-nav="${esc(card.path)}">${esc(card.cta)}</a>
    </aside>`;
}

export function bindPromoScreenEvents(root) {
  root.querySelectorAll('[data-promo-ext]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const href = el.getAttribute('data-promo-ext');
      if (!href) return;
      if (href.startsWith('http') || href.includes('/search') || href.includes('register')) {
        e.preventDefault();
        window.location.assign(href);
      }
    });
  });
  root.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = el.getAttribute('data-nav') || '/guest';
    });
  });
}
