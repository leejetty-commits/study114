import './quick-match.css';
import { QUICK_MATCH_INTRO } from './quick-match-content.js';
import { getProviderStatus } from '../provider-status.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function stepIcon(kind) {
  if (kind === 'bell') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3a5 5 0 0 0-5 5v2.2c0 .7-.2 1.3-.6 1.9L5 14.2V16h14v-1.8l-1.4-2.1c-.4-.6-.6-1.2-.6-1.9V8a5 5 0 0 0-5-5zm0 18a2.4 2.4 0 0 0 2.3-1.7h-4.6A2.4 2.4 0 0 0 12 21z"/></svg>';
  }
  if (kind === 'note') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 4h10l4 4v12H5V4zm9 1.5V9h3.5L14 5.5zM8 12h8v1.5H8V12zm0 3h6v1.5H8V15z"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5h8v2H8V5zm-2 4h12v2H6V9zm2 4h8v2H8v-2zm-1 4h10v2H7v-2z"/></svg>';
}

function titleHtml(copy) {
  return `<h2 class="pv2-h1 qm-title"><span class="pv2-hand pv2-mark">${esc(copy.titleMark)}</span>${esc(copy.titleRest)}</h2>`;
}

function badgesHtml(copy) {
  return `<p class="qm-badges"><span class="qm-badge qm-badge--new">${esc(copy.badgeNew)}</span><span class="qm-badge qm-badge--prime">${esc(copy.badgePrime)}</span></p>`;
}

function photoHtml(copy) {
  return `<div class="qm-photo">
    <img src="${esc(copy.photo)}" alt="${esc(copy.photoAlt)}" width="640" height="480" loading="lazy" decoding="async">
    <p class="qm-bubble">${esc(copy.bubble)}</p>
  </div>`;
}

function stepsHtml(copy) {
  const items = (copy.steps || []).map((step) => `<li class="qm-step"><span class="qm-step__icon">${stepIcon(step.icon)}</span><span class="qm-step__title">${esc(step.title)}</span></li>`).join('');
  return `<div class="qm-steps-wrap">
    <p class="qm-kicker">${esc(copy.stepsLead)}</p>
    <ol class="qm-steps">${items}</ol>
  </div>`;
}

/** 카탈로그 프라임 혜택 맨 앞 큰 칸. 카드 4장 그리드 앞에 둔다. */
export function renderQuickMatchCatalog(copy) {
  const block = copy || QUICK_MATCH_INTRO;
  const tone = block.toneNote ? `<p class="qm-tone">${esc(block.toneNote)}</p>` : '';
  return `<div class="pv2 qm-block qm-block--catalog">
    ${titleHtml(block)}
    ${badgesHtml(block)}
    <p class="qm-with">${esc(block.withPrime)}</p>
    <div class="qm-hero">
      <div>
        <p class="qm-sub">${esc(block.subtitle)}</p>
        <p class="qm-body">${esc(block.body)}</p>
        ${tone}
      </div>
      ${photoHtml(block)}
    </div>
    ${stepsHtml(block)}
  </div>`;
}

/** #/promo/quick-match 와 마이페이지 본문이 같은 소개를 그린다. */
export function renderQuickMatchIntro({ prime = false } = {}) {
  const copy = QUICK_MATCH_INTRO;
  const ctaLabel = prime ? copy.ctaSettings : copy.ctaStart;
  const ctaPath = prime ? copy.ctaSettingsPath : copy.ctaStartPath;
  const examples = copy.examples.map((item) => `<li>${esc(item)}</li>`).join('');
  return `<article class="pv2 qm-block qm-block--intro">
    ${titleHtml(copy)}
    <p class="qm-sub">${esc(copy.subtitle)}</p>
    <p class="qm-body">${esc(copy.body)}</p>
    ${badgesHtml(copy)}
    <p class="qm-with">${esc(copy.withPrime)}</p>
    ${photoHtml(copy)}
    ${stepsHtml(copy)}
    <section class="qm-examples-wrap">
      <h3 class="qm-h">${esc(copy.examplesTitle)}</h3>
      <ul class="qm-examples">${examples}</ul>
    </section>
    <p class="qm-free">${esc(copy.noExtraCost)}</p>
    <p class="qm-cta-row"><a class="pv2-btn qm-cta" href="#${esc(ctaPath)}" data-nav="${esc(ctaPath)}">${esc(ctaLabel)}</a></p>
    <p class="qm-pick">${esc(copy.pickNote)}</p>
  </article>`;
}

export function renderQuickMatchPage() {
  return renderQuickMatchIntro({ prime: getProviderStatus()?.prime_active === true });
}

/** 본문에 나중에 붙인 소개 링크. 레이아웃 바인딩 이후에 호출한다. */
export function bindQuickMatchIntroLinks(root) {
  root.querySelectorAll('[data-nav]').forEach((el) => {
    if (el.dataset.qmNavBound === '1') return;
    el.dataset.qmNavBound = '1';
    el.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.hash = el.getAttribute('data-nav') || '/plans/positions';
    });
  });
}
