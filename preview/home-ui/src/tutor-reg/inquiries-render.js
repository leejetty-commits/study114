/**
 * 과외쌤 쪽지설정 렌더 — 상태 확인 → 수정 → 저장
 */

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
  const badge = pref.receiving ? P21_INQUIRY_COPY.badgeReceiving : P21_INQUIRY_COPY.badgeClosed;
  const stored = tutorInquiryStoredLine(status);

  const reasonLabels = P21_INQUIRY_OFF_REASONS.map((o) => o.label).join(' / ');

  return `
    <div class="p21-inq" data-p21-inquiries data-p21-tutor-id="${esc(tutor.id)}" data-inquiry-status="${esc(status)}" data-inquiry-receiving="${pref.receiving ? '1' : '0'}">
      <p class="p21-inq__lead">${esc(P21_INQUIRY_COPY.pageLead)}</p>

      <section class="p21-inq-block p21-inq-block--status p20-inq-card" aria-label="${esc(P21_INQUIRY_COPY.currentStatusHeading)}">
        <h3 class="p21-inq-block__title">${esc(P21_INQUIRY_COPY.currentStatusHeading)}</h3>
        <div class="p20-inq-status-row">
          <p class="p21-inq-block__hint" data-p21-inquiry-stored>${esc(stored)}</p>
          <span class="p21-inq-badge p21-inq-badge--${pref.receiving ? 'on' : 'off'}">${esc(badge)}</span>
        </div>
      </section>

      <section class="p21-inq-block p21-inq-block--edit p20-inq-card" aria-label="${esc(P21_INQUIRY_COPY.editHeading)}">
        <h3 class="p21-inq-block__title">${esc(P21_INQUIRY_COPY.editHeading)}</h3>
        <div class="p20-inq-edit-grid">
          <div class="p20-inq-edit-main">
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
            <div class="p21-inq-save">
              <button type="button" class="btn btn--primary" data-p21-inquiry-save>${esc(P21_INQUIRY_COPY.saveCta)}</button>
              <span class="p20-inq-save-hint">저장은 쪽지 상태만 바꿉니다.</span>
            </div>
          </div>
          <aside class="p20-inq-reason-empty" data-p21-inquiry-reason-empty${pref.receiving ? '' : ' hidden'}>
            <strong>${esc(P21_INQUIRY_COPY.offReasonTitle)}</strong>
            <p>「쪽지 안받음」을 고르면 이 오른쪽에 ${esc(reasonLabels)}이 나타납니다.</p>
          </aside>
          <div class="p21-inq-reasons${pref.receiving ? ' is-inactive' : ''}" data-p21-inquiry-reason-wrap${pref.receiving ? ' hidden aria-disabled="true"' : ''}>
            <h4 class="p21-inq-reasons__title">${esc(P21_INQUIRY_COPY.offReasonTitle)}</h4>
            <p class="p21-inq-block__hint">${esc(P21_INQUIRY_COPY.offReasonHint)}</p>
            <div class="p21-inq-reason-list">${renderReasonRadios(pref)}</div>
          </div>
        </div>
      </section>
    </div>`;
}
