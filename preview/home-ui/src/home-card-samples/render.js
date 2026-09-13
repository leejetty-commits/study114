/**
 * 홈 실카드 1칸 샘플 렌더.
 * - BASIC: renderBrowseList · 폭 = 홈 2열 1칸
 * - PICK/PRIME: renderExposureBox · 폭 = 홈 5열/3열 1칸
 * 마이페이지에는 카드 1칸 폭만 둔다.
 */

import { renderBrowseList, renderExposureBox } from '../exposure-render.js';
import { HOME_SAMPLE_BUILDERS, INQUIRY_SAMPLE_BUILDERS } from './presets.js';

export const HOME_CARD_SAMPLE_OPTS = Object.freeze({
  showCompare: true,
  showWish: true,
  guest: false,
});

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/** @param {'study_room'|'tutor'} kind @param {object} item */
export function renderHomeBasicCardHtml(kind, item) {
  return renderBrowseList(kind, [item], HOME_CARD_SAMPLE_OPTS);
}

/** @param {'study_room'|'tutor'} kind @param {object} item */
export function renderHomePickCardHtml(kind, item) {
  return renderExposureBox(kind, 'pick', item, '', HOME_CARD_SAMPLE_OPTS);
}

/** @param {'study_room'|'tutor'} kind @param {object} item */
export function renderHomePrimeCardHtml(kind, item) {
  return renderExposureBox(kind, 'prime', item, '', HOME_CARD_SAMPLE_OPTS);
}

/**
 * @param {{
 *   tier: 'basic'|'pick'|'prime',
 *   kicker: string,
 *   cardHtml: string,
 *   expandTier?: string,
 *   expandAttr?: 'data-rc-expand'|'data-trc-expand',
 *   expandLabel?: string,
 * }} opts
 */
export function renderHomeCardSampleFigure(opts) {
  const expand =
    opts.expandAttr && opts.expandTier
      ? `<button type="button" class="hcs-sample__expand" ${opts.expandAttr} ${opts.expandAttr}-tier="${esc(opts.expandTier)}">${esc(opts.expandLabel || '확대카드 보기')}</button>`
      : '';
  return `
    <figure class="hcs-sample hcs-sample--${esc(opts.tier)}" data-hcs-sample="${esc(opts.tier)}">
      <figcaption class="hcs-sample__kicker">${esc(opts.kicker)}</figcaption>
      <div class="hcs-sample__card hcs-sample__card--${esc(opts.tier)}">${opts.cardHtml}</div>
      ${expand}
    </figure>`;
}

/**
 * 등록점검 샘플: BASIC 1행 · PICK/PRIME 2행 2단
 * @param {'study_room'|'tutor'} kind
 * @param {{ cardsTitle: string, cardsLead: string, basicKicker: string, pickKicker: string, primeKicker: string, expandCard?: string }} copy
 */
export function renderRegistrationCheckCardSamples(kind, copy) {
  const build = HOME_SAMPLE_BUILDERS[kind];
  const expandAttr = kind === 'tutor' ? 'data-trc-expand' : 'data-rc-expand';
  const expandLabel = copy.expandCard || '확대카드 보기';

  const basicFig = renderHomeCardSampleFigure({
    tier: 'basic',
    kicker: copy.basicKicker,
    cardHtml: renderHomeBasicCardHtml(kind, build('basic')),
    expandAttr,
    expandTier: 'basic',
    expandLabel,
  });
  const pickFig = renderHomeCardSampleFigure({
    tier: 'pick',
    kicker: copy.pickKicker,
    cardHtml: renderHomePickCardHtml(kind, build('pick')),
    expandAttr,
    expandTier: 'pick',
    expandLabel,
  });
  const primeFig = renderHomeCardSampleFigure({
    tier: 'prime',
    kicker: copy.primeKicker,
    cardHtml: renderHomePrimeCardHtml(kind, build('prime')),
    expandAttr,
    expandTier: 'prime',
    expandLabel,
  });

  return `
    <section class="rc-block rc-block--compare" aria-label="${esc(copy.cardsTitle)}">
      <h3 class="rc-block__title">${esc(copy.cardsTitle)}</h3>
      <p class="rc-block__hint">${esc(copy.cardsLead)}</p>
      <div class="rc-compare rc-compare--stack hcs-rc-compare">
        <div class="rc-compare__row rc-compare__row--basic">
          ${basicFig}
        </div>
        <div class="rc-compare__row rc-compare__row--upgrade">
          ${pickFig}
          ${primeFig}
        </div>
      </div>
    </section>`;
}

/**
 * 쪽지설정 BASIC 샘플 1장 (받는 중 / 안받음)
 * @param {{ kind: 'study_room'|'tutor', receiving: boolean, kicker: string, callout: string }} opts
 */
export function renderInquirySampleCard(opts) {
  const item = INQUIRY_SAMPLE_BUILDERS[opts.kind](opts.receiving);
  const listHtml = renderHomeBasicCardHtml(opts.kind, item);
  const receiving = Boolean(opts.receiving);
  return `
    <figure class="inq-sample inq-sample--${receiving ? 'open' : 'closed'} hcs-sample hcs-sample--basic" data-inq-sample data-hcs-sample="basic">
      <figcaption class="inq-sample__kicker hcs-sample__kicker">${esc(opts.kicker)}</figcaption>
      <div class="inq-sample__stage">
        <div class="hcs-sample__card hcs-sample__card--basic">${listHtml}</div>
        <svg class="inq-sample__guide" data-inq-guide aria-hidden="true"></svg>
        <p class="inq-sample__callout" data-inq-callout>${esc(opts.callout)}</p>
      </div>
    </figure>`;
}

/**
 * @param {'study_room'|'tutor'} kind
 * @param {{ sampleOpenKicker: string, sampleClosedKicker: string, sampleOpenCallout: string, sampleClosedCallout: string }} copy
 */
export function renderInquirySamplePair(kind, copy) {
  return [
    renderInquirySampleCard({
      kind,
      receiving: true,
      kicker: copy.sampleOpenKicker,
      callout: copy.sampleOpenCallout,
    }),
    renderInquirySampleCard({
      kind,
      receiving: false,
      kicker: copy.sampleClosedKicker,
      callout: copy.sampleClosedCallout,
    }),
  ].join('\n');
}
