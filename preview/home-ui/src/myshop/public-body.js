/**
 * 공개 마이샵 본문 — 읽기 전용 결과물형 소개
 * (운영·설정·점검 UI 금지 · 문의는 상태 문구만)
 */

import { esc } from '../detail-decision/detail-utils.js';

function section(title, inner, extraClass = '') {
  if (!inner) return '';
  return `
    <section class="pm-section${extraClass ? ` ${extraClass}` : ''}">
      <h2 class="pm-section__title">${esc(title)}</h2>
      <div class="pm-section__body">${inner}</div>
    </section>`;
}

function chips(items) {
  if (!items?.length) return '';
  return `<ul class="pm-chips">${items.map((t) => `<li class="pm-chip">${esc(t)}</li>`).join('')}</ul>`;
}

/** @param {object | null} model */
export function renderPublicMyshopBody(model) {
  if (!model) {
    return `
      <div class="pm-empty">
        <p>이 공부방 소개를 찾을 수 없습니다.</p>
      </div>`;
  }

  const lead =
    model.slogan ||
    (model.introShort && model.introShort !== model.slogan ? model.introShort : '') ||
    '';

  const heroMeta = model.metaBits.length
    ? `<p class="pm-hero__meta">${model.metaBits.map(esc).join('<span class="pm-hero__dot" aria-hidden="true">·</span>')}</p>`
    : '';

  const heroLeadExtra =
    model.slogan && model.introShort && model.introShort !== model.slogan
      ? `<p class="pm-hero__lead">${esc(model.introShort)}</p>`
      : '';

  const summary =
    model.summaryItems.length > 0
      ? `<section class="pm-summary" aria-label="핵심 정보">
        <ul class="pm-summary__grid">
          ${model.summaryItems
            .map(
              (it) => `
            <li class="pm-summary__item">
              <span class="pm-summary__label">${esc(it.label)}</span>
              <strong class="pm-summary__value">${esc(it.value)}</strong>
            </li>`,
            )
            .join('')}
        </ul>
      </section>`
      : '';

  const featureBody = (() => {
    const parts = [];
    if (model.features.length) {
      parts.push(`
        <ol class="pm-features">
          ${model.features
            .map(
              (f, i) => `
            <li>
              <span class="pm-features__n" aria-hidden="true">${i + 1}</span>
              <span class="pm-features__text">${esc(f)}</span>
            </li>`,
            )
            .join('')}
        </ol>`);
    }
    if (model.styles.length) {
      parts.push(`
        <div class="pm-style">
          <p class="pm-style__label">지도 스타일</p>
          ${chips(model.styles)}
        </div>`);
    }
    if (model.styleNote) {
      parts.push(`<p class="pm-prose pm-prose--soft">${esc(model.styleNote).replace(/\n/g, '<br />')}</p>`);
    }
    return parts.join('');
  })();

  const galleryBody =
    model.gallery.length > 0
      ? `<div class="pm-gallery pm-gallery--mosaic" data-pm-gallery>
        ${model.gallery
          .map(
            (src, i) => `
          <button type="button" class="pm-gallery__item${i === 0 ? ' pm-gallery__item--wide' : ''}" data-pm-thumb="${esc(src)}" aria-label="사진 크게 보기 ${i + 1}">
            <img src="${esc(src)}" alt="" loading="lazy" />
          </button>`,
          )
          .join('')}
      </div>`
      : '';

  const introOnly = model.introLong
    ? `<p class="pm-prose">${esc(model.introLong).replace(/\n/g, '<br />')}</p>`
    : '';
  const facilityOnly = model.facilityNote
    ? `<p class="pm-prose pm-prose--soft">${esc(model.facilityNote).replace(/\n/g, '<br />')}</p>`
    : '';

  const classCards =
    model.classCards?.length > 0
      ? `<div class="pm-class-cards" aria-label="수업 정보">
        ${model.classCards
          .map(
            (c) => `
          <article class="pm-class-card">
            ${c.title ? `<h3 class="pm-class-card__title">${esc(c.title)}</h3>` : ''}
            <dl class="pm-class-card__meta">
              ${c.subject ? `<div><dt>과목</dt><dd>${esc(c.subject)}</dd></div>` : ''}
              ${c.fee ? `<div><dt>수업료</dt><dd>${esc(c.fee)}</dd></div>` : ''}
            </dl>
          </article>`,
          )
          .join('')}
      </div>`
      : '';

  const introBody = [introOnly, facilityOnly, classCards].filter(Boolean).join('');

  const regionBody = model.region
    ? `<p class="pm-region">${esc(model.region)} <span class="pm-region__hint">생활권 · 홍보지역</span></p>`
    : '';

  const inquiryStatus = model.inquiryStatusLine
    ? `<p class="pm-inquiry-status" role="status" aria-live="polite">
        <span class="pm-inquiry-status__label">문의 안내</span>
        <span class="pm-inquiry-status__text">${esc(model.inquiryStatusLine)}</span>
      </p>`
    : '';

  return `
    <article class="pm" data-pm>
      <header class="pm-hero">
        <div class="pm-hero__media${model.heroIsDefault ? ' pm-hero__media--default' : ''}">
          <img src="${esc(model.heroSrc)}" alt="${esc(model.name)}" />
        </div>
        <div class="pm-hero__copy">
          <h1 class="pm-hero__name">${esc(model.name)}</h1>
          ${lead ? `<p class="pm-hero__slogan">${esc(lead)}</p>` : ''}
          ${heroLeadExtra}
          ${heroMeta}
        </div>
      </header>

      ${summary}
      ${section('이 공부방의 매력', featureBody, 'pm-section--features')}
      ${section('사진으로 보는 공간', galleryBody, 'pm-section--gallery')}
      ${section('소개와 수업', introBody, 'pm-section--intro')}
      ${section('위치 · 생활권', regionBody, 'pm-section--region')}
      ${inquiryStatus}
    </article>

    <div class="pm-lightbox" data-pm-lightbox hidden>
      <button type="button" class="pm-lightbox__close" data-pm-lightbox-close aria-label="닫기">×</button>
      <img src="" alt="" data-pm-lightbox-img />
    </div>`;
}

/** @param {HTMLElement} root */
export function bindPublicMyshopBodyEvents(root) {
  const box = root.querySelector('[data-pm-lightbox]');
  const img = root.querySelector('[data-pm-lightbox-img]');
  if (!box || !img) return;

  const close = () => {
    box.hidden = true;
    img.removeAttribute('src');
  };

  root.querySelectorAll('[data-pm-thumb]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-pm-thumb');
      if (!src) return;
      img.src = src;
      box.hidden = false;
    });
  });

  box.querySelector('[data-pm-lightbox-close]')?.addEventListener('click', close);
  box.addEventListener('click', (e) => {
    if (e.target === box) close();
  });
}
