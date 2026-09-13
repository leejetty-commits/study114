/**
 * 쪽지설정 카드 샘플 — 홈 BASIC renderBrowseList 경로를 그대로 재사용.
 * kind별 차이는 sample-presets 데이터만 교체한다.
 */

import { renderBrowseList } from '../exposure-render.js';
import { INQUIRY_SAMPLE_BUILDERS } from './sample-presets.js';
import { renderInquirySampleFigure } from './sample-ui.js';

/** 홈 guest BASIC 리스트와 동일 옵션 */
export const HOME_BASIC_INQUIRY_OPTS = Object.freeze({
  showCompare: true,
  showWish: true,
  guest: false,
});

/**
 * @param {'study_room'|'tutor'} kind
 * @param {object} item
 */
export function renderHomeBasicInquiryList(kind, item) {
  return renderBrowseList(kind, [item], HOME_BASIC_INQUIRY_OPTS);
}

/**
 * @param {{ kind: 'study_room'|'tutor', receiving: boolean, kicker: string, callout: string }} opts
 */
export function renderInquirySampleCard(opts) {
  const build = INQUIRY_SAMPLE_BUILDERS[opts.kind];
  const item = build(opts.receiving);
  const listHtml = renderHomeBasicInquiryList(opts.kind, item);
  return renderInquirySampleFigure({
    receiving: opts.receiving,
    listHtml,
    kicker: opts.kicker,
    callout: opts.callout,
  });
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
