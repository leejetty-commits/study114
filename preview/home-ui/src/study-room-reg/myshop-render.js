/**
 * ShopPage 단일 렌더 — ViewModel만 그림
 * raw state는 buildShopViewModel 에서만 만진다.
 */

import { ROOM_DEFAULT_BASIC, sectionGuard } from './shop-formatters.js';
import {
  buildShopViewModel,
  shopSectionHasContent,
  SHOP_SECTION_ORDER,
} from './shop-view-model.js';
import { shopReviewTeaserMountHtml } from '../provider-reviews/teaser-mount.js';

export {
  buildShopViewModel,
  SHOP_SECTION_KEYS,
  SHOP_SECTION_ORDER,
  SHOP_FALLBACK_MATRIX,
  visibleShopSections,
} from './shop-view-model.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function section(title, inner, key) {
  const body = sectionGuard(inner);
  if (!body) return '';
  return `
    <section class="shop-sec shop-sec--${esc(key)}" data-shop-section="${esc(key)}">
      <h2 class="shop-sec__title"><span class="shop-sec__mark" aria-hidden="true"></span>${esc(title)}</h2>
      <div class="shop-sec__body">${body}</div>
    </section>`;
}

/** @param {import('./shop-view-model.js').ShopViewModel} vm */
export function renderShopViewModel(vm) {
  const h = vm.hero;
  const heroHtml = `
    <header class="shop-hero" data-shop-section="hero">
      <div class="shop-hero__media${h.imageIsDefault ? ' shop-hero__media--default' : ''}">
        <img
          src="${esc(h.imageSrc)}"
          alt="${esc(h.name)}"
          data-shop-fallback="${esc(ROOM_DEFAULT_BASIC)}"
          onerror="if(this.dataset.fb)return;this.dataset.fb='1';this.src=this.getAttribute('data-shop-fallback')||'';"
        />
      </div>
      <div class="shop-hero__card">
        <p class="shop-hero__eyebrow">동네의 작은 공부방</p>
        <h1 class="shop-hero__name">${esc(h.name)}</h1>
        ${h.slogan ? `<p class="shop-hero__slogan">${esc(h.slogan)}</p>` : ''}
        ${h.lead ? `<p class="shop-hero__lead">${esc(h.lead)}</p>` : ''}
        ${h.livingLine ? `<p class="shop-hero__area">${esc(h.livingLine)}</p>` : ''}
        ${
          h.chips.length
            ? `<ul class="shop-hero__chips">${h.chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`
            : ''
        }
      </div>
    </header>`;

  const factsHtml = shopSectionHasContent(vm, 'facts')
    ? `<section class="shop-bento" aria-label="핵심 정보" data-shop-section="facts">
        <ul class="shop-bento__grid">
          ${vm.facts.tiles
            .map(
              (t) => `
            <li class="shop-bento__item">
              <span class="shop-bento__label">${esc(t.label)}</span>
              <strong class="shop-bento__value">${esc(t.value)}</strong>
            </li>`,
            )
            .join('')}
        </ul>
      </section>`
    : '';

  const sigBits = [
    vm.signature.styles.length
      ? `<ul class="shop-chips">${vm.signature.styles.map((t) => `<li class="shop-chip">${esc(t)}</li>`).join('')}</ul>`
      : '',
    vm.signature.styleNote
      ? `<p class="shop-prose shop-prose--accent">${esc(vm.signature.styleNote).replace(/\n/g, '<br />')}</p>`
      : '',
    vm.signature.introLong
      ? `<p class="shop-prose">${esc(vm.signature.introLong).replace(/\n/g, '<br />')}</p>`
      : '',
  ].filter(Boolean);
  const signatureHtml = section('이 공부방의 매력', sigBits.join(''), 'signature');

  let galleryHtml = '';
  if (shopSectionHasContent(vm, 'gallery')) {
    const [main, ...rest] = vm.gallery.items;
    galleryHtml = section(
      '사진으로 보는 공간',
      `<div class="shop-gallery" data-shop-gallery>
        <button type="button" class="shop-gallery__hero" data-shop-thumb="${esc(main.src)}" data-shop-photo-type="${esc(main.type)}" aria-label="사진 크게 보기">
          <img src="${esc(main.src)}" alt="" loading="lazy" />
          ${main.caption ? `<span class="shop-gallery__cap">${esc(main.caption)}</span>` : ''}
        </button>
        ${
          rest.length
            ? `<div class="shop-gallery__thumbs">
            ${rest
              .map(
                (g, i) => `
              <button type="button" class="shop-gallery__thumb" data-shop-thumb="${esc(g.src)}" data-shop-photo-type="${esc(g.type)}" aria-label="사진 ${i + 2}">
                <img src="${esc(g.src)}" alt="" loading="lazy" />
              </button>`,
              )
              .join('')}
          </div>`
            : ''
        }
      </div>`,
      'gallery',
    );
  }

  const classCards = vm.classes.items
    .map(
      (c, idx) => `
        <div class="shop-class" data-shop-class-index="${idx}">
          <header class="shop-class__head">
            <h3 class="shop-class__title">${esc(c.title)}</h3>
            <p class="shop-class__topline">${c.toplineParts.map(esc).join(' · ')}</p>
          </header>
          <dl class="shop-class__meta">
            ${c.grade ? `<div><dt>학년</dt><dd>${esc(c.grade)}</dd></div>` : ''}
            ${c.days ? `<div><dt>출석</dt><dd>${esc(c.days)}</dd></div>` : ''}
            ${c.feeNote ? `<div class="shop-class__span"><dt>수업료</dt><dd>${esc(c.feeNote)}</dd></div>` : ''}
            ${c.note ? `<div class="shop-class__span"><dt>참고</dt><dd>${esc(c.note)}</dd></div>` : ''}
          </dl>
        </div>`,
    )
    .join('');
  const classesHtml = classCards ? section('수업 안내', `<div class="shop-classes">${classCards}</div>`, 'classes') : '';

  const c = vm.career;
  const careerBits = [
    c.university || c.major
      ? `<p class="shop-prose">${[c.university, c.major].filter(Boolean).map(esc).join(' · ')}</p>`
      : '',
    c.careerYears || c.academyYears
      ? `<ul class="shop-statline">
          ${c.careerYears ? `<li><span>교습경력</span><strong>${esc(c.careerYears)}년</strong></li>` : ''}
          ${c.academyYears ? `<li><span>학원경력</span><strong>${esc(c.academyYears)}년</strong></li>` : ''}
        </ul>`
      : '',
    c.features.length
      ? `<ul class="shop-bullets">${c.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`
      : '',
  ].filter(Boolean);
  const careerHtml = section('원장 소개 · 경력', careerBits.join(''), 'career');

  const trustHtml = vm.trust.items.length
    ? section(
        '신뢰 정보',
        `<ul class="shop-trust">
          ${vm.trust.items
            .map(
              (t) => `
            <li>
              <span class="shop-trust__label">${esc(t.label)}</span>
              <strong class="shop-trust__value">${esc(t.value)}</strong>
            </li>`,
            )
            .join('')}
        </ul>`,
        'trust',
      )
    : '';

  const facilityInner = [
    vm.facilities.names.length
      ? `<ul class="shop-chips shop-chips--soft">${vm.facilities.names.map((n) => `<li class="shop-chip">${esc(n)}</li>`).join('')}</ul>`
      : '',
    vm.facilities.note
      ? `<p class="shop-prose shop-prose--soft">${esc(vm.facilities.note).replace(/\n/g, '<br />')}</p>`
      : '',
  ].filter(Boolean);
  const facilitiesHtml = section('시설 · 환경', facilityInner.join(''), 'facilities');

  const livingInner = vm.livingArea.labels.length
    ? `
      <p class="shop-area__main">${esc(vm.livingArea.labels[0])} <span>생활권</span></p>
      ${
        vm.livingArea.labels.length > 1
          ? `<ul class="shop-chips shop-chips--soft">${vm.livingArea.labels
              .slice(1)
              .map((r) => `<li class="shop-chip">${esc(r)}</li>`)
              .join('')}</ul>`
          : ''
      }`
    : '';
  const livingHtml = section('위치 · 생활권', livingInner, 'livingArea');

  const socialHtml = vm.social.links.length
    ? section(
        '소셜',
        `<ul class="shop-social">
          ${vm.social.links
            .map(
              (l) => `
            <li><a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a></li>`,
            )
            .join('')}
        </ul>`,
        'social',
      )
    : '';

  const reviewsHtml = section(
    '후기',
    shopReviewTeaserMountHtml({
      providerType: vm.reviews?.providerType,
      providerId: vm.reviews?.providerId,
    }),
    'reviews',
  );

  const inquiryHtml = vm.inquiry.line
    ? `<footer class="shop-inquiry" role="status" data-shop-section="inquiry">
        <span class="shop-inquiry__label">문의 안내</span>
        <strong class="shop-inquiry__text">${esc(vm.inquiry.line)}</strong>
      </footer>`
    : '';

  const byKey = {
    hero: heroHtml,
    facts: factsHtml,
    signature: signatureHtml,
    gallery: galleryHtml,
    classes: classesHtml,
    career: careerHtml,
    trust: trustHtml,
    facilities: facilitiesHtml,
    livingArea: livingHtml,
    social: socialHtml,
    reviews: reviewsHtml,
    inquiry: inquiryHtml,
  };

  return `
    <article class="shop" data-myshop data-shop data-shop-root data-shop-sections="${esc(SHOP_SECTION_ORDER.join(','))}">
      ${SHOP_SECTION_ORDER.map((k) => byKey[k] || '').join('\n')}
    </article>

    <div class="shop-lightbox" data-myshop-lightbox data-shop-lightbox hidden>
      <button type="button" class="shop-lightbox__close" data-myshop-lightbox-close aria-label="닫기">×</button>
      <img src="" alt="" data-myshop-lightbox-img data-shop-lightbox-img />
    </div>`;
}

/**
 * @param {object} s registerState-like
 * @param {object} room
 */
export function renderMyshopShowcase(s, room) {
  return renderShopViewModel(buildShopViewModel(s, room));
}

/** @param {HTMLElement} root */
export function bindMyshopEvents(root) {
  void import('../provider-reviews/teaser.js').then((m) => m.bindShopReviewTeasers(root));

  const box = root.querySelector('[data-myshop-lightbox], [data-shop-lightbox]');
  const img = root.querySelector('[data-myshop-lightbox-img], [data-shop-lightbox-img]');
  if (!box || !img) return;

  const close = () => {
    box.hidden = true;
    img.removeAttribute('src');
  };

  root.querySelectorAll('[data-shop-thumb], [data-myshop-thumb]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-shop-thumb') || btn.getAttribute('data-myshop-thumb');
      if (!src) return;
      img.src = src;
      box.hidden = false;
    });
  });

  box.querySelector('[data-myshop-lightbox-close], .shop-lightbox__close')?.addEventListener('click', close);
  box.addEventListener('click', (e) => {
    if (e.target === box) close();
  });
}

export { collectShopPhotos, splitHeroAndGallery } from './shop-formatters.js';
