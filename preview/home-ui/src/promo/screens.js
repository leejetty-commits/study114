import { STUDY_ROOM_PROMO } from './study-room-content.js';
import { TUTOR_PROMO } from './tutor-content.js';
import { PARENT_PROMO } from './parent-content.js';
import { searchUiUrl, STUDY_ROOM_REGISTER_URL, TUTOR_REGISTER_URL } from '../../../shared/preview-links.js';
import { signupUrl } from '../../../shared/route-access.js';
import { getNavRole } from '../state.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function isGuestViewer() {
  return getNavRole() === 'guest';
}

/** 게스트 찾기 CTA는 검색을 열지 않고 가입 게이트로 보낸다. */
function findHref(tab) {
  if (isGuestViewer()) return signupUrl();
  const role = getNavRole();
  return searchUiUrl(tab, role === 'guest' ? '' : role);
}

function ctaAnchor(label, href, className) {
  const raw = String(href || '');
  const external = /^https?:/i.test(raw);
  if (!external) {
    const path = raw.replace(/^#/, '');
    const hash = path.startsWith('/') ? path : `/${path}`;
    return `<a class="${className}" href="#${esc(hash)}" data-nav="${esc(hash)}">${esc(label)}</a>`;
  }
  return `<a class="${className}" href="${esc(raw)}" data-promo-ext="${esc(raw)}">${esc(label)}</a>`;
}

function mockMap() {
  return `
    <div class="pcat-map" aria-hidden="true">
      <div class="pcat-map__canvas">
        <span class="pcat-map__pin" style="top:28%;left:42%"></span>
        <span class="pcat-map__pin" style="top:48%;left:58%"></span>
        <span class="pcat-map__pin" style="top:62%;left:36%"></span>
      </div>
      <div class="pcat-map__cards">
        <div class="pcat-map__card"><strong>대치 수학 공부방</strong><span>도보 8분 · 초등·중등</span></div>
        <div class="pcat-map__card"><strong>목동 영어 관리형</strong><span>1.2km · 중등 집중</span></div>
      </div>
    </div>`;
}

/**
 * @param {typeof STUDY_ROOM_PROMO} c
 * @param {{ heroPrimary: string, heroSecondary: string, structure: string, finalPrimary: string, finalSecondary: string }} links
 */
function renderPromoLanding(c, links) {
  return `
    <article class="pcat">
      <section class="pcat-hero" aria-labelledby="pcat-hero-title">
        <div class="pcat-hero__copy">
          <span class="pcat-badge pcat-badge--info">${esc(c.meta.eyebrow)}</span>
          <h2 id="pcat-hero-title" class="pcat-hero__title">${esc(c.hero.titleLine1)}<br/>${esc(c.hero.titleLine2)}</h2>
          <p class="pcat-hero__lead">${esc(c.hero.leadBefore)}<br/>${esc(c.hero.leadAfter)}</p>
          <div class="pcat-actions">
            ${ctaAnchor(c.hero.primaryCta.label, links.heroPrimary, 'pcat-btn pcat-btn--primary')}
            ${ctaAnchor(c.hero.secondaryCta.label, links.heroSecondary, 'pcat-btn pcat-btn--secondary')}
          </div>
        </div>
        <div class="pcat-hero__visual">${mockMap()}</div>
      </section>

      <section class="pcat-section" aria-labelledby="pcat-near-title">
        <article class="pcat-card pcat-near">
          <div class="pcat-near__map">${mockMap()}</div>
          <div class="pcat-near__copy">
            <div class="pcat-head pcat-head--inset">
              <span class="pcat-badge pcat-badge--muted">${esc(c.near.eyebrow)}</span>
              <h2 id="pcat-near-title">${esc(c.near.title)}</h2>
              <p>${esc(c.near.bodyBefore)}<br/>${esc(c.near.bodyAfter)}</p>
            </div>
            <ul class="pcat-bullets">
              ${c.near.bullets.map((b) => `<li><span class="pcat-bullets__dot" aria-hidden="true"></span><span>${esc(b)}</span></li>`).join('')}
            </ul>
          </div>
        </article>
      </section>

      <section class="pcat-section" aria-labelledby="pcat-compare-title">
        <div class="pcat-head pcat-head--center">
          <span class="pcat-badge pcat-badge--info">${esc(c.compare.eyebrow)}</span>
          <h2 id="pcat-compare-title">${esc(c.compare.title)}</h2>
          <p>${esc(c.compare.lead)}</p>
        </div>
        <div class="pcat-criteria">
          ${c.compare.cards
            .map(
              (card, i) => `
            <article class="pcat-card pcat-criteria__card">
              <span class="pcat-criteria__num">${i + 1}</span>
              <h3>${esc(card.title)}</h3>
              <p>${esc(card.body)}</p>
            </article>`,
            )
            .join('')}
        </div>
        <div class="pcat-strip" aria-hidden="true">
          ${c.compare.strip
            .map(
              (item) => `
            <div class="pcat-strip__item"><div class="k">${esc(item.k)}</div><div class="v">${esc(item.v)}</div><div class="c">${esc(item.c)}</div></div>`,
            )
            .join('')}
        </div>
      </section>

      <section class="pcat-section" aria-labelledby="pcat-start-title">
        <article class="pcat-card pcat-start">
          <div class="pcat-start__copy">
            <span class="pcat-badge pcat-badge--muted">${esc(c.structure.badge)}</span>
            <h2 id="pcat-start-title">${esc(c.structure.title)}</h2>
            <p>${esc(c.structure.body)}</p>
            ${ctaAnchor(c.structure.cta.label, links.structure, 'pcat-btn pcat-btn--primary')}
          </div>
          <div class="pcat-card pcat-form" aria-hidden="true">
            ${c.structure.formFields
              .map(
                (field) => `
              <div class="pcat-form__field"><label>${esc(field.label)}</label><div class="pcat-form__fake">${esc(field.value)}</div></div>`,
              )
              .join('')}
            <span class="pcat-btn pcat-btn--secondary pcat-btn--block">${esc(c.structure.formCta)}</span>
          </div>
        </article>
      </section>

      <section class="pcat-section" aria-labelledby="pcat-aud-title">
        <div class="pcat-head pcat-head--center">
          <span class="pcat-badge pcat-badge--muted">${esc(c.personas.eyebrow)}</span>
          <h2 id="pcat-aud-title">${esc(c.personas.title)}</h2>
        </div>
        <div class="pcat-audience">
          ${c.personas.cards
            .map(
              (card) => `
            <article class="pcat-card pcat-audience__card">
              <span class="pcat-badge pcat-badge--info">${esc(card.role)}</span>
              <h3>${esc(card.title)}</h3>
              <p>${esc(card.body)}</p>
            </article>`,
            )
            .join('')}
        </div>
      </section>

      <section class="pcat-section" aria-labelledby="pcat-trust-title">
        <div class="pcat-head pcat-head--center">
          <span class="pcat-badge pcat-badge--info">${esc(c.trust.eyebrow)}</span>
          <h2 id="pcat-trust-title">${esc(c.trust.title)}</h2>
        </div>
        <div class="pcat-card pcat-reasons">
          <div class="pcat-reasons__grid">
            ${c.trust.items
              .map(
                (item) => `
              <div class="pcat-reasons__item">
                <h3>${esc(item.title)}</h3>
                <p>${esc(item.body)}</p>
              </div>`,
              )
              .join('')}
          </div>
        </div>
      </section>

      <section class="pcat-close" aria-labelledby="pcat-close-title">
        <h2 id="pcat-close-title">${esc(c.finalCta.title)}</h2>
        <p>${esc(c.finalCta.lead)}</p>
        <div class="pcat-actions pcat-actions--center">
          ${ctaAnchor(c.finalCta.primaryCta.label, links.finalPrimary, 'pcat-btn pcat-btn--primary')}
          ${ctaAnchor(c.finalCta.secondaryCta.label, links.finalSecondary, 'pcat-btn pcat-btn--secondary')}
        </div>
      </section>
    </article>`;
}

/** 293-4: 공부방 홍보 랜딩 v2 본문 렌더 */
function renderStudyRoomV2(c) {
  const reg = STUDY_ROOM_REGISTER_URL;
  const fp = c.community.footParts;

  const wwbItems = (items, divStyle) =>
    items.map(w =>
      `<div${divStyle ? ` style="${divStyle}"` : ''}><b>${esc(w.k)}</b>${esc(w.v)}</div>`
    ).join('');

  return `
<article class="pv2 pv2--room">
  <section class="pv2-hero">
    <div class="pv2-bg pv2-kb" aria-hidden="true"></div>
    <div class="pv2-in">
      <div class="pv2-eb pv2-rv is-on">${esc(c.hero.eyebrow)}</div>
      <h2 class="pv2-h1 pv2-rv pv2-d1 is-on">${esc(c.hero.titleBefore)}<br><span class="pv2-hand pv2-mark">${esc(c.hero.titleMark)}</span><br>${esc(c.hero.titleAfter)}</h2>
      <p class="pv2-lead pv2-rv pv2-d2 is-on">${esc(c.hero.leadLines[0])}<br>${esc(c.hero.leadLines[1])}</p>
      <div class="pv2-rv pv2-d3 is-on">${ctaAnchor(c.hero.primaryCta, reg, 'pv2-btn')} ${ctaAnchor(c.hero.secondaryCta, '/guide/registration', 'pv2-btn pv2-btn--ghost')}</div>
    </div>
  </section>

  <section class="pv2-sec pv2-light">
    <div class="pv2-mapw">
      <div class="pv2-rv is-on">
        <div class="pv2-eb" style="color:#266BC4">${esc(c.mapPin.eyebrow)}</div>
        <h3 class="pv2-h2">${c.mapPin.titleLines.map(l => esc(l)).join('<br>')}</h3>
        <div class="pv2-wwb">${wwbItems(c.mapPin.wwb)}</div>
        <p class="pv2-li" style="margin-top:16px">${esc(c.mapPin.note)}</p>
      </div>
      <div class="pv2-mapbox pv2-watch" aria-hidden="true">
        <div class="pv2-road" style="left:0;right:0;top:44%;height:18px"></div>
        <div class="pv2-road" style="top:0;bottom:0;left:48%;width:14px"></div>
        <span class="pv2-pin" style="left:22%;top:23%"></span>
        <span class="pv2-pin" style="left:69%;top:29%"></span>
        <span class="pv2-pin" style="left:59%;top:67%"></span>
        <span class="pv2-pin" style="left:87%;top:54%"></span>
        <span class="pv2-pin pv2-me" style="left:39%;top:52%"></span>
        <span class="pv2-tag pv2-float" style="left:44%;top:56%"><span class="pv2-example">예시</span> <b>${esc(c.mapPin.tag.title)}</b><br>${esc(c.mapPin.tag.body)}</span>
      </div>
    </div>
  </section>

  <section class="pv2-sec">
    <div class="pv2-rv is-on">
      <div class="pv2-eb">${esc(c.cardTypes.eyebrow)}</div>
      <h3 class="pv2-h2">${esc(c.cardTypes.title)}</h3>
      <p class="pv2-li" style="color:#B9C3D6">${esc(c.cardTypes.lead)}</p>
    </div>
    <div class="pv2-cards">
      ${c.cardTypes.cards.map((card, i) => `<div class="pv2-c pv2-rv${i > 0 ? ` pv2-d${i}` : ''} is-on">
        <span class="pv2-badge" style="background:${esc(card.badgeBg)};color:${esc(card.badgeFg)}">${esc(card.badge)}</span>
        <h3>${esc(card.title)}</h3>
        <p>${esc(card.body)}</p>
        <div class="pv2-f">${esc(card.foot)}</div>
      </div>`).join('\n      ')}
    </div>
  </section>

  <section class="pv2-photoband">
    <div class="pv2-ph" aria-hidden="true"></div>
    <div class="pv2-tx pv2-rv is-on">
      <div class="pv2-eb" style="color:#7A4B00">${esc(c.community.eyebrow)}</div>
      <h3 class="pv2-h2">${c.community.titleLines.map(l => esc(l)).join('<br>')}</h3>
      ${c.community.rooms.map(r => `<div class="pv2-room"><b>${esc(r.name)}</b><p>${esc(r.body)}</p></div>`).join('\n      ')}
      <p style="margin-top:14px;font-size:14px">${esc(fp[0])}<b>${esc(fp[1])}</b>${esc(fp[2])}<b>${esc(fp[3])}</b>${esc(fp[4])}</p>
    </div>
  </section>

  <section class="pv2-sec">
    <div class="pv2-chan">
      <div class="pv2-ph pv2-rv is-on" aria-hidden="true"></div>
      <div class="pv2-rv pv2-d1 is-on">
        <div class="pv2-eb">${esc(c.channel.eyebrow)}</div>
        <h3 class="pv2-h2">${c.channel.titleLines.map(l => esc(l)).join('<br>')}</h3>
        <div class="pv2-wwb" style="color:#1C1917">${wwbItems(c.channel.wwb, 'background:#F5F1E6')}</div>
        <div class="pv2-ch">${c.channel.chips.map(ch => `<span>${esc(ch)}</span>`).join('')}</div>
        <p class="pv2-li" style="color:#B9C3D6;margin-top:18px">${esc(c.channel.note)}</p>
      </div>
    </div>
  </section>

  <section class="pv2-sec pv2-light">
    <div class="pv2-faqw">
      <div class="pv2-rv is-on">
        <div class="pv2-eb" style="color:#266BC4">${esc(c.faq.eyebrow)}</div>
        <h3 class="pv2-h2">${c.faq.titleLines.map(l => esc(l)).join('<br>')}</h3>
      </div>
      <div class="pv2-faq pv2-rv pv2-d1 is-on">
        ${c.faq.items.map(item => `<details open>
          <summary>${esc(item.q)}</summary>
          <p>${esc(item.a)}</p>
        </details>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="pv2-end pv2-rv is-on">
    <h3 class="pv2-h2">${c.finalCta.titleLines.map(l => esc(l)).join('<br>')}</h3>
    <p class="pv2-lead">${esc(c.finalCta.lead)}</p>
    ${ctaAnchor(c.finalCta.cta, reg, 'pv2-btn')}
    <p class="pv2-crosslink">${esc(c.finalCta.crosslink.lead)} <b>${ctaAnchor(c.finalCta.crosslink.label, c.finalCta.crosslink.path, '')}</b></p>
  </section>
</article>`;
}

function renderStudyRoomPromo() {
  return renderStudyRoomV2(STUDY_ROOM_PROMO.v2);
}

function renderTutorPromo() {
  const reg = TUTOR_REGISTER_URL;
  const guide = '/guide/registration';
  return renderPromoLanding(TUTOR_PROMO, {
    heroPrimary: reg,
    heroSecondary: guide,
    structure: reg,
    finalPrimary: reg,
    finalSecondary: guide,
  });
}

function renderParentPromo() {
  const start = isGuestViewer() ? signupUrl() : findHref('room');
  const safety = '/guide/safety';
  return renderPromoLanding(PARENT_PROMO, {
    heroPrimary: start,
    heroSecondary: safety,
    structure: start,
    finalPrimary: start,
    finalSecondary: safety,
  });
}

function railIntroCard() {
  const role = getNavRole();
  if (role === 'tutor') return TUTOR_PROMO.railCard;
  if (role === 'parent') return PARENT_PROMO.railCard;
  return STUDY_ROOM_PROMO.railCard;
}

export function renderPromoScreen(path) {
  const id = path.replace(/^\/promo\//, '').split('?')[0];
  if (id === 'tutor') return renderTutorPromo();
  if (id === 'parent') return renderParentPromo();
  return renderStudyRoomPromo();
}

/** 우측 레일 · 모바일 인라인 짧은 카드 */
export function renderPromoRailCard() {
  const card = railIntroCard();
  return `
    <a class="promo-rail-card" href="#${esc(card.path)}" data-nav="${esc(card.path)}">
      <span class="promo-rail-card__label">소개</span>
      <strong class="promo-rail-card__title">${esc(card.title)}</strong>
      <span class="promo-rail-card__desc">${esc(card.desc)}</span>
      <em class="promo-rail-card__cta">${esc(card.cta)} →</em>
    </a>`;
}

export function renderPromoInlineCard() {
  const card = railIntroCard();
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
