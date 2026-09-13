/**
 * 쪽지설정 샘플 — 쪽지 버튼에 SVG 화살표·안내 정렬.
 * 카드 폭은 CSS(--hcs-basic-w)가 담당. 여기서 width px 주입하지 않는다.
 */

function layoutOne(figure, idx) {
  const stage = figure.querySelector('.inq-sample__stage');
  const btn = figure.querySelector('.item-actions [title^="쪽지"]');
  const svg = figure.querySelector('[data-inq-guide]');
  const callout = figure.querySelector('[data-inq-callout]');
  const card = figure.querySelector('.hcs-sample__card--basic');
  if (!stage || !svg || !callout || !card) return false;
  if (!btn) return false;

  const sr = stage.getBoundingClientRect();
  const br = btn.getBoundingClientRect();
  const cr = card.getBoundingClientRect();
  if (sr.width < 8 || br.width < 4 || cr.width < 8) return false;

  const cx = br.left - sr.left + br.width / 2;
  const cy = br.top - sr.top + br.height / 2;
  const radius = Math.max(br.width, br.height) / 2 + 6;
  const y1 = cy + radius + 1;
  const gap = 10;
  const y2 = y1 + 28;

  callout.style.left = `${cx}px`;
  callout.style.top = `${y2 + gap}px`;
  callout.style.transform = 'translateX(-50%)';

  const calloutH = callout.offsetHeight || 40;
  const w = Math.max(1, Math.ceil(Math.max(cr.width, cx + 8) + 4));
  const h = Math.max(Math.ceil(cr.height + 8), Math.ceil(y2 + gap + calloutH + 6));
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
}
