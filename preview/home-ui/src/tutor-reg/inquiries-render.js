/**
 * 과외쌤 쪽지설정 렌더 — 상태 확인 → 수정 → 검증 → 저장 → 카드 샘플
 */

import { renderInquirySamplePair } from '../inquiry-settings/sample-cards.js';
import { isPhoneVerifiedLocal } from '../study-room-reg/phone-verify-gate.js';
import { P21_INQUIRY_COPY, P21_INQUIRY_OFF_REASONS } from './inquiries-copy.js';
import { tutorInquiryPrefFromStatus, tutorInquiryStoredLine, normalizeTutorInquiryStatus } from './inquiries-pref.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function renderReasonRadios(pref) {
  return P21_INQUIRY_OFF_REASONS.map((o) => {
    const selected = !pref.receiving && pref.reason === o.value;
    return `
      <label class="p21-inq-reason${selected ? ' is-selected' : ''}${pref.receiving ? ' is-disabled' : ''}">
        <input type="radio" name="p21_inquiry_reason" value="${esc(o.value)}" ${selected ? 'checked' : ''} ${pref.receiving ? 'disabled' : ''} />
        <span>${esc(o.label)}</span>
        <small class="p21-inq-block__hint">${esc(o.hint)}</small>
      </label>`;
  }).join('');
}

/**
 * @param {import('./store.js').TutorRecord} tutor
 */
export function renderTutorInquiries(tutor) {
  const status = normalizeTutorInquiryStatus(tutor.inquiry_status);
  const pref = tutorInquiryPrefFromStatus(status);
  const phoneOk = isPhoneVerifiedLocal(tutor);
  const badge = pref.receiving ? P21_INQUIRY_COPY.badgeReceiving : P21_INQUIRY_COPY.badgeClosed;
  const stored = tutorInquiryStoredLine(status);

  return `
    <div class="p21-inq" data-p21-inquiries data-p21-tutor-id="${esc(tutor.id)}" data-inquiry-status="${esc(status)}" data-inquiry-receiving="${pref.receiving ? '1' : '0'}">
      <p class="p21-inq__lead">${esc(P21_INQUIRY_COPY.pageLead)}</p>

      <section class="p21-inq-block p21-inq-block--status" aria-label="${esc(P21_INQUIRY_COPY.currentStatusHeading)}">
        <div class="p21-inq-status__head">
          <h3 class="p21-inq-block__title">${esc(P21_INQUIRY_COPY.currentStatusHeading)}</h3>
          <span class="p21-inq-badge p21-inq-badge--${pref.receiving ? 'on' : 'off'}">${esc(badge)}</span>
        </div>
        <p class="p21-inq-block__hint" data-p21-inquiry-stored>${esc(stored)}</p>
      </section>

      <section class="p21-inq-block p21-inq-block--edit" aria-label="${esc(P21_INQUIRY_COPY.editHeading)}">
        <h3 class="p21-inq-block__title">${esc(P21_INQUIRY_COPY.editHeading)}</h3>
        <div class="p21-inq-choices" role="radiogroup" aria-label="${esc(P21_INQUIRY_COPY.editHeading)}">
          <label class="p21-inq-choice${pref.receiving ? ' is-selected' : ''}">
            <input type="radio" name="p21_inquiry_receiving" value="1" data-p21-inquiry-receiving ${pref.receiving ? 'checked' : ''} />
            <span>${esc(P21_INQUIRY_COPY.receiving)}</span>
          </label>
          <label class="p21-inq-choice${!pref.receiving ? ' is-selected' : ''}">
            <input type="radio" name="p21_inquiry_receiving" value="0" data-p21-inquiry-receiving ${pref.receiving ? '' : 'checked'} />
            <span>${esc(P21_INQUIRY_COPY.closed)}</span>
          </label>
        </div>
        <div class="p21-inq-reasons${pref.receiving ? ' is-inactive' : ''}" data-p21-inquiry-reason-wrap${pref.receiving ? ' aria-disabled="true"' : ''}>
          <h4 class="p21-inq-reasons__title">${esc(P21_INQUIRY_COPY.offReasonTitle)}</h4>
          <p class="p21-inq-block__hint">${esc(P21_INQUIRY_COPY.offReasonHint)}</p>
          <div class="p21-inq-reason-list">${renderReasonRadios(pref)}</div>
        </div>
      </section>

      <section class="p21-inq-block p21-inq-block--contact${phoneOk ? ' is-done' : ' is-need'}" aria-label="${esc(P21_INQUIRY_COPY.contactHeading)}">
        <h3 class="p21-inq-block__title">${esc(P21_INQUIRY_COPY.contactHeading)}</h3>
        <p class="p21-inq-contact__state">${esc(phoneOk ? P21_INQUIRY_COPY.contactVerified : P21_INQUIRY_COPY.contactNeeded)}</p>
        <p class="p21-inq-contact__lead">${esc(phoneOk ? P21_INQUIRY_COPY.contactVerifiedLead : P21_INQUIRY_COPY.contactNeededLead)}</p>
        ${phoneOk ? '' : `<p class="p21-inq-contact__notice">${esc(P21_INQUIRY_COPY.contactNotice)}</p>`}
        ${
          phoneOk
            ? ''
            : `<button type="button" class="btn btn--primary" data-p21-phone-verify-start>${esc(P21_INQUIRY_COPY.contactVerifyCta)}</button>`
        }
      </section>

      <div class="p21-inq-save">
        <button type="button" class="btn btn--primary" data-p21-inquiry-save>${esc(P21_INQUIRY_COPY.saveCta)}</button>
      </div>

      <section class="p21-inq-block p21-inq-block--samples" aria-label="${esc(P21_INQUIRY_COPY.sampleTitle)}">
        <h3 class="p21-inq-block__title">${esc(P21_INQUIRY_COPY.sampleTitle)}</h3>
        <p class="p21-inq-block__hint">${esc(P21_INQUIRY_COPY.sampleLead)}</p>
        <div class="inq-samples">
          ${renderInquirySamplePair('tutor', P21_INQUIRY_COPY)}
        </div>
      </section>
    </div>`;
}
