/**
 * 쪽지설정 카드 샘플 — 홈 BASIC DOM 문맥 + 쪽지 위치 SVG 가이드.
 * 카드 마크업은 exposure-render.renderBrowseList(홈과 동일)만 사용한다.
 */

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function wrapHomeBasicContext(listHtml) {
  return `
    <div class="inq-sample__home-context home-body home-body--with-promo">
      <div class="home-main">
        <section class="guest-browse-lists" aria-hidden="true">
          ${listHtml}
        </section>
      </div>
      <aside class="home-sidebar home-sidebar--guest" aria-hidden="true"></aside>
    </div>`;
}

/**
 * @param {{ receiving: boolean, listHtml: string, kicker: string, callout: string }} opts
 */
export function renderInquirySampleFigure(opts) {
  const receiving = Boolean(opts.receiving);
  return `
    <figure class="inq-sample inq-sample--${receiving ? 'open' : 'closed'}" data-inq-sample>
      <figcaption class="inq-sample__kicker">${esc(opts.kicker)}</figcaption>
      <div class="inq-sample__stage">
        ${wrapHomeBasicContext(opts.listHtml)}
        <svg class="inq-sample__guide" data-inq-guide aria-hidden="true"></svg>
        <p class="inq-sample__callout" data-inq-callout>${esc(opts.callout)}</p>
      </div>
    </figure>`;
}

function layoutOne(figure, idx) {
  const stage = figure.querySelector('.inq-sample__stage');
  const btn = figure.querySelector('.item-actions [title^="쪽지"]');
  const svg = figure.querySelector('[data-inq-guide]');
  const callout = figure.querySelector('[data-inq-callout]');
  const list = figure.querySelector('.inq-sample__home-context .browse-list');
  if (!stage || !svg || !callout || !list) return false;
  if (!btn) return false;

  const sr = stage.getBoundingClientRect();
  const br = btn.getBoundingClientRect();
  const lr = list.getBoundingClientRect();
  if (sr.width < 8 || br.width < 4 || lr.width < 8) return false;

  const cx = br.left - sr.left + br.width / 2;
  const cy = br.top - sr.top + br.height / 2;
  const radius = Math.max(br.width, br.height) / 2 + 6;
  const y1 = cy + radius + 1;
  const gap = 10;
  const y2 = y1 + 28;

  callout.style.left = `${cx}px`;
  callout.style.top = `${y2 + gap}px`;
  callout.style.transform = 'translateX(-50%)';

  const stageW = Math.max(lr.width, lr.right - sr.left, cx + 8);
  const calloutH = callout.offsetHeight || 40;
  const w = Math.max(1, Math.ceil(stageW + 4));
  const h = Math.max(Math.ceil(lr.height + 8), Math.ceil(y2 + gap + calloutH + 6));
  stage.style.width = `${w}px`;
  stage.style.minHeight = `${h}px`;

  const color = figure.classList.contains('inq-sample--closed') ? '#64748b' : '#2563eb';
  const markerId = `inq-ah-${idx}`;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  svg.style.overflow = 'visible';
  svg.innerHTML = `
    <defs>
      <marker id="${markerId}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0 0 L8 4 L0 8 Z" fill="${color}" />
      </marker>
    </defs>
    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${radius.toFixed(1)}" fill="none" stroke="${color}" stroke-width="2" />
    <path d="M ${cx.toFixed(1)} ${y1.toFixed(1)} L ${cx.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" marker-end="url(#${markerId})" />
  `;
  return true;
}

/** @param {ParentNode} root */
export function bindInquirySampleGuides(root) {
  if (!(root instanceof Element)) return;
  if (!root.querySelector('[data-inq-sample]')) return;

  const paint = () => {
    [...root.querySelectorAll('[data-inq-sample]')].forEach((fig, i) => layoutOne(fig, i));
  };

  paint();
  requestAnimationFrame(paint);
  window.setTimeout(paint, 50);
  window.setTimeout(paint, 300);

  root.querySelectorAll('[data-inq-sample] img').forEach((img) => {
    if (img.complete) return;
    img.addEventListener('load', paint, { once: true });
  });

  if (root.dataset.inqGuideBound === '1') return;
  root.dataset.inqGuideBound = '1';
  window.addEventListener('resize', paint);
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(paint);
    ro.observe(document.documentElement);
    root.querySelectorAll('.inq-sample__home-context').forEach((el) => ro.observe(el));
  }
}
