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
        <span class="pv2-tag pv2-float" style="left:44%;top:56%"><span class="pv2-example">예시</span> <b>${esc(c.mapPin.tag.title)}</b><br><span data-pv2-type>${esc(c.mapPin.tag.body)}</span></span>
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
      ${c.cardTypes.cards.map((card, i) => `<div class="pv2-c pv2-rv pv2-unfold${i > 0 ? ` pv2-d${i}` : ''} is-on">
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

/** 293-5: 과외쌤 홍보 랜딩 v2 본문 렌더 */
function renderTutorV2(c) {
  const reg = TUTOR_REGISTER_URL;
  const pv = c.hero.preview;

  const wwbItems = (items) =>
    items.map(w => `<div><b>${esc(w.k)}</b>${esc(w.v)}</div>`).join('');

  return `
<article class="pv2 pv2--tutor">
  <section class="pv2-split">
    <div class="pv2-l">
      <div class="pv2-eb pv2-rv is-on">${esc(c.hero.eyebrow)}</div>
      <h2 class="pv2-h1 pv2-rv pv2-d1 is-on">${esc(c.hero.titleLines[0])}<br>${esc(c.hero.titleLines[1])}<br><span class="pv2-hand pv2-mark">${esc(c.hero.titleMark)}</span>${esc(c.hero.titleAfter)}</h2>
      <p class="pv2-lead pv2-rv pv2-d2 is-on">${esc(c.hero.leadLines[0])}<br>${esc(c.hero.leadLines[1])}</p>
      <div class="pv2-rv pv2-d3 is-on">${ctaAnchor(c.hero.primaryCta, reg, 'pv2-btn')} ${ctaAnchor(c.hero.secondaryCta, '/guide/registration', 'pv2-btn pv2-btn--ghost')}</div>
    </div>
    <div class="pv2-r" aria-hidden="true">
      <div class="pv2-card pv2-float">
        <span class="pv2-badge" style="background:#0F766E;color:#fff">${esc(pv.badge)}</span> <span class="pv2-example">${esc(pv.example)}</span>
        <div class="pv2-n" style="margin-top:12px">${esc(pv.name)}</div>
        <div class="pv2-row">${pv.chips.map(ch => `<span class="pv2-chip">${esc(ch)}</span>`).join('')}</div>
        <p>${esc(pv.body)}</p>
        <div style="margin-top:14px">
          <span class="pv2-btn pv2-btn--sm pv2-btn--deco" aria-hidden="true">${esc(pv.deco[0])}</span>
          <span class="pv2-btn pv2-btn--sm pv2-btn--deco pv2-btn--ghost" aria-hidden="true">${esc(pv.deco[1])}</span>
        </div>
      </div>
    </div>
  </section>

  <section class="pv2-steps pv2-watch">
    <div class="pv2-rv is-on">
      <div class="pv2-k2">${esc(c.steps.eyebrow)}</div>
      <h3 class="pv2-h2" style="margin-top:10px">${esc(c.steps.title)}</h3>
    </div>
    <div class="pv2-sg">
      ${c.steps.items.map(s => `<div class="pv2-step">
        <div class="pv2-k">${esc(s.k)}</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.body)}</p>
      </div>`).join('\n      ')}
    </div>
  </section>

  <section class="pv2-types">
    <div class="pv2-rv is-on">
      <div class="pv2-k2">${esc(c.cardTypes.eyebrow)}</div>
      <h3 class="pv2-h2" style="margin-top:10px">${esc(c.cardTypes.title)}</h3>
      <p style="margin-top:10px;font-size:16px;color:#4B5563">${esc(c.cardTypes.lead)}</p>
    </div>
    <div class="pv2-tg">
      ${c.cardTypes.cards.map((card, i) => `<div class="pv2-t pv2-rv pv2-unfold${i > 0 ? ` pv2-d${i}` : ''} is-on">
        <span class="pv2-badge" style="background:${esc(card.badgeBg)};color:${esc(card.badgeFg)}">${esc(card.badge)}</span>
        <h3>${esc(card.title)}</h3>
        <p>${esc(card.body)}</p>
        <div class="pv2-w">${esc(card.foot)}</div>
      </div>`).join('\n      ')}
    </div>
  </section>

  <section class="pv2-wide">
    <div class="pv2-rv is-on">
      <div class="pv2-k2">${esc(c.channel.eyebrow)}</div>
      <h3 class="pv2-h2" style="margin:12px 0 14px">${c.channel.titleLines.map(l => esc(l)).join('<br>')}</h3>
      <div class="pv2-wwb">${wwbItems(c.channel.wwb)}</div>
      <div class="pv2-ch">${c.channel.chips.map(ch => `<span>${esc(ch)}</span>`).join('')}</div>
    </div>
    <div class="pv2-ph2 pv2-rv pv2-d1 is-on" aria-hidden="true"></div>
  </section>

  <section class="pv2-room">
    <div class="pv2-rv is-on">
      <div class="pv2-eb">${esc(c.community.eyebrow)}</div>
      <h3 class="pv2-h2" style="margin-top:10px">${c.community.titleLines.map(l => esc(l)).join('<br>')}</h3>
      <p style="margin-top:14px;color:#CFE3DC;line-height:1.7">${esc(c.community.body)}</p>
      ${c.community.posts.map(p => `<div class="pv2-qq"><span class="pv2-example">예시</span> ${esc(p)}</div>`).join('\n      ')}
      <p class="pv2-note" style="margin-top:8px">${esc(c.community.note)}</p>
    </div>
    <div class="pv2-faq pv2-rv pv2-d1 is-on" style="color:#F3EFE4">
      <div class="pv2-eb">${esc(c.faq.eyebrow)}</div>
      ${c.faq.items.map(item => `<details open>
        <summary>${esc(item.q)}</summary>
        <p>${esc(item.a)}</p>
      </details>`).join('\n      ')}
    </div>
  </section>

  <section class="pv2-end">
    <div>
      <h3 class="pv2-h2">${esc(c.finalCta.title)}</h3>
      <p style="margin-top:10px;color:#CFE3DC">${esc(c.finalCta.sub)}</p>
    </div>
    ${ctaAnchor(c.finalCta.cta, reg, 'pv2-btn')}
  </section>
</article>`;
}

function renderTutorPromo() {
  return renderTutorV2(TUTOR_PROMO.v2);
}

/** 293-6: 우리동네 학생 홍보 랜딩 v2 본문 렌더 */
function renderParentV2(c) {
  const guest = isGuestViewer();
  const start = guest ? signupUrl() : findHref('room');
  const pick = (l) => (guest ? l.guest : l.member);

  const wwbGood = (good) =>
    `<div class="pv2-wwb"><div><b>좋은 점</b>${esc(good)}</div></div>`;

  return `
<article class="pv2 pv2--student">
  <section class="pv2-hero">
    <div>
      <div class="pv2-eb pv2-rv is-on">${esc(c.hero.eyebrow)}</div>
      <h2 class="pv2-h1 pv2-rv pv2-d1 is-on">${esc(c.hero.titleLine)}<br><span class="pv2-hand pv2-mark">${esc(c.hero.titleMark)}</span></h2>
      <p class="pv2-lead pv2-rv pv2-d2 is-on">${esc(c.hero.leadLines[0])}<br>${esc(c.hero.leadLines[1])}</p>
      <div class="pv2-rv pv2-d3 is-on">${ctaAnchor(pick(c.hero.primaryCta), start, 'pv2-btn')} ${ctaAnchor(c.hero.secondaryCta, '/guide/safety', 'pv2-btn pv2-btn--ghost')}</div>
    </div>
    <div class="pv2-col pv2-rv pv2-d1 is-on" aria-hidden="true">
      <div class="pv2-a"></div>
      <div class="pv2-b"></div>
      <div class="pv2-c"></div>
    </div>
  </section>

  <section class="pv2-flow pv2-watch">
    <div class="pv2-rv is-on">
      <div class="pv2-eb">${esc(c.flow.eyebrow)}</div>
      <h3 class="pv2-h2">${esc(c.flow.title)}</h3>
    </div>
    <div class="pv2-fg">
      ${c.flow.steps.map((s, i) => `<div class="pv2-step pv2-rv${i > 0 ? ` pv2-d${i}` : ''} is-on">
        <div class="pv2-n" style="background:${esc(s.nBg)}">${esc(s.n)}</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.body)}</p>
        ${wwbGood(s.good)}
      </div>`).join('\n      ')}
    </div>
  </section>

  <section class="pv2-big pv2-rv is-on">
    <h3 class="pv2-h2" style="color:#fff">${c.band.titleLines.map(l => esc(l)).join('<br>')}</h3>
    <p style="margin-top:16px;color:rgba(255,248,239,.85);line-height:1.7">${esc(c.band.body)}</p>
  </section>

  <section class="pv2-sec">
    <div class="pv2-card2">
      <div class="pv2-rv is-on">
        <div class="pv2-eb">${esc(c.card.eyebrow)}</div>
        <h3 class="pv2-h2">${c.card.titleLines.map(l => esc(l)).join('<br>')}</h3>
        <p style="margin-top:14px;font-size:16px;line-height:1.8;color:#4B5563">${esc(c.card.body)}</p>
      </div>
      <div class="pv2-mock pv2-float pv2-rv pv2-unfold pv2-d1 is-on" aria-hidden="true">
        <div class="pv2-top"></div>
        <span class="pv2-example">${esc(c.card.example.badge)}</span>
        <div style="font-size:18px;font-weight:700;margin-top:8px">${esc(c.card.example.name)}</div>
        <div style="margin-top:8px">${c.card.example.chips.map(ch => `<span class="pv2-chip">${esc(ch)}</span>`).join('')}</div>
        <p style="margin-top:8px;font-size:14px;color:#4B5563">${esc(c.card.example.body)}</p>
        <div class="pv2-sns">${c.card.example.sns.map(s => `<span>${esc(s)}</span>`).join('')}</div>
        <div style="margin-top:12px">
          <span class="pv2-btn pv2-btn--sm pv2-btn--deco" aria-hidden="true">${esc(c.card.example.deco[0])}</span>
          <span class="pv2-btn pv2-btn--sm pv2-btn--deco pv2-btn--ghost" aria-hidden="true">${esc(c.card.example.deco[1])}</span>
        </div>
        <p class="pv2-note" style="margin-top:10px">${esc(c.card.example.note)}</p>
      </div>
    </div>
  </section>

  <section class="pv2-sec">
    <div class="pv2-two">
      <div class="pv2-box pv2-rv is-on">
        <div class="pv2-eb">${esc(c.community.board.title)}</div>
        <h3 class="pv2-h2" style="margin-top:10px">${esc(c.community.board.sub)}</h3>
        <p style="margin-top:12px;font-size:14px;line-height:1.7">${esc(c.community.board.body)}</p>
      </div>
      <div class="pv2-box pv2-r pv2-rv pv2-d1 is-on">
        <div class="pv2-eb">${esc(c.community.best.title)}</div>
        <h3 class="pv2-h2" style="margin-top:10px">${esc(c.community.best.sub)}</h3>
        ${c.community.best.posts.map(p => `<div class="pv2-best"><span class="pv2-example">${esc(c.community.best.example)}</span> ${esc(p)}</div>`).join('\n        ')}
        <p class="pv2-note" style="margin-top:8px">${esc(c.community.best.note)}</p>
      </div>
    </div>
  </section>

  <section class="pv2-sec">
    <div class="pv2-faqw">
      <div class="pv2-rv is-on">
        <div class="pv2-eb">${esc(c.faq.eyebrow)}</div>
        <h3 class="pv2-h2" style="margin-top:10px">처음이라 궁금한 것</h3>
      </div>
      <div class="pv2-faq pv2-rv pv2-d1 is-on">
        ${c.faq.items.filter(item => !item.guestOnly || guest).map(item => `<details open>
          <summary>${esc(item.q)}</summary>
          <p>${esc(item.a)}</p>
        </details>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="pv2-safe">
    <div>
      <h3 class="pv2-h2">${esc(c.finalCta.title)}</h3>
      ${guest ? `<p style="margin-top:10px;color:rgba(255,248,239,.75)">${esc(c.finalCta.sub)}</p>` : ''}
    </div>
    ${ctaAnchor(pick(c.finalCta.cta), start, 'pv2-btn')}
  </section>
</article>`;
}

function renderParentPromo() {
  return renderParentV2(PARENT_PROMO.v2);
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

/* ── 293-7: 홍보 v2 모션 바인딩 ───────────────────────────── */
let pv2Observer = null;
let pv2Timers = [];
let pv2TeardownBound = false;

function _pv2Typewriter(el) {
  const full = el.dataset.pv2Text !== undefined ? el.dataset.pv2Text : el.textContent;
  el.dataset.pv2Text = full;
  el.textContent = '';
  el.classList.add('is-typing');
  const chars = [...full];
  let i = 0;
  function next() {
    if (i < chars.length) {
      el.textContent = chars.slice(0, i + 1).join('');
      i++;
      pv2Timers.push(setTimeout(next, 60));
    } else {
      el.classList.remove('is-typing');
    }
  }
  next();
}

function teardownPv2Motion() {
  pv2Observer?.disconnect();
  pv2Observer = null;
  pv2Timers.forEach(id => clearTimeout(id));
  pv2Timers = [];
  document.querySelectorAll('[data-pv2-type]').forEach(el => {
    if (el.dataset.pv2Text !== undefined) {
      el.textContent = el.dataset.pv2Text;
      el.classList.remove('is-typing');
      delete el.dataset.pv2Text;
    }
  });
}

function bindPv2Motion(root) {
  teardownPv2Motion();
  const art = root.querySelector('.pv2');
  if (!art) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.IntersectionObserver) return;
  // DOM 레이아웃 계산 후 실행 (SPA innerHTML 교체 직후 rAF 2회 = 2프레임)
  requestAnimationFrame(() => requestAnimationFrame(() => _bindPv2MotionCore(art)));
}

function _bindPv2MotionCore(art) {
  const _savedIsOff = []; // is-on 제거한 요소 목록 (catch 복원용)
  try {
    art.classList.add('pv2-anim');

    // S1: 화면 밖 .pv2-rv (unfold 제외) — is-on 제거 후 observe
    const rvEls = [...art.querySelectorAll('.pv2-rv:not(.pv2-unfold)')];
    rvEls.forEach(el => {
      if (el.getBoundingClientRect().top >= innerHeight) {
        el.classList.remove('is-on');
        _savedIsOff.push(el);
      }
    });

    // S2·S3: .pv2-watch — is-on 제거 후 observe
    const watchEls = [...art.querySelectorAll('.pv2-watch')];
    watchEls.forEach(el => { el.classList.remove('is-on'); _savedIsOff.push(el); });

    // N1: .pv2-unfold (is-on 유지, is-unfold 없이 시작) — observe
    const unfoldEls = [...art.querySelectorAll('.pv2-unfold')];

    // N3: .pv2-mark (히어로) — observe (IO 초기 콜백으로 첫 화면도 트리거)
    const markEls = [...art.querySelectorAll('.pv2-mark')];

    // 안전장치: 3초 뒤에도 미트리거면 전부 표시 후 teardown
    let anyTriggered = false;
    pv2Timers.push(setTimeout(() => {
      if (!anyTriggered) {
        rvEls.forEach(el => el.classList.add('is-on'));
        watchEls.forEach(el => el.classList.add('is-on'));
        unfoldEls.forEach(el => el.classList.add('is-unfold'));
        markEls.forEach(el => el.classList.add('is-draw'));
        teardownPv2Motion();
      }
    }, 3000));

    pv2Observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        anyTriggered = true;
        const el = entry.target;
        pv2Observer.unobserve(el);
        if (el.classList.contains('pv2-unfold')) {
          el.classList.add('is-unfold');                      // N1 카드 펼침
        } else if (el.classList.contains('pv2-watch')) {
          el.classList.add('is-on');                          // S2·S3 트리거
          // N2 타자: watch 안 [data-pv2-type] — 핀 떨어짐(≈1s) 뒤
          el.querySelectorAll('[data-pv2-type]').forEach(te => {
            pv2Timers.push(setTimeout(() => _pv2Typewriter(te), 1000));
          });
        } else if (el.classList.contains('pv2-mark')) {
          el.classList.add('is-draw');                        // N3 밑줄
        } else {
          el.classList.add('is-on');                          // S1 등장
        }
      });
    }, { threshold: 0.2 });

    rvEls.filter(el => !el.classList.contains('is-on')).forEach(el => pv2Observer.observe(el));
    watchEls.forEach(el => pv2Observer.observe(el));
    unfoldEls.forEach(el => pv2Observer.observe(el));
    markEls.forEach(el => pv2Observer.observe(el));

    if (!pv2TeardownBound) {
      window.addEventListener('hashchange', teardownPv2Motion);
      pv2TeardownBound = true;
    }
  } catch (_) {
    art.classList.remove('pv2-anim');
    _savedIsOff.forEach(el => el.classList.add('is-on')); // is-on 복원
    teardownPv2Motion();
  }
}
/* ── /293-7 ─────────────────────────────────────────────── */


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
  bindPv2Motion(root); // 293-7
}
