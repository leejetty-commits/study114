/**
 * 과외쌤 쪽지설정 — 수신 선택 · 사유 활성 · 저장
 * 저장은 tutors.inquiry_status PATCH. 연락처 OTP는 이 화면에 두지 않는다.
 */

import { bindInquirySampleGuides } from '../home-card-samples/guides.js';
import { P21_INQUIRY_COPY } from './inquiries-copy.js';
import { tutorInquiryStatusFromPref } from './inquiries-pref.js';
import { setTutorInquiryStatus } from './store.js';

function selectedReceiving(page) {
  const el = page.querySelector('input[name="p21_inquiry_receiving"]:checked');
  return el?.value === '1';
}

/** @returns {'paused'|'not_accepting'|null} */
function selectedReason(page) {
  const el = page.querySelector('input[name="p21_inquiry_reason"]:checked');
  if (el?.value === 'paused' || el?.value === 'not_accepting') return el.value;
  return null;
}

function hasClosedReason(page) {
  return Boolean(page.querySelector('input[name="p21_inquiry_reason"]:checked'));
}

function syncReasonState(page) {
  const receiving = selectedReceiving(page);
  const wrap = page.querySelector('[data-p21-inquiry-reason-wrap]');
  wrap?.classList.toggle('is-inactive', receiving);
  if (wrap) {
    if (receiving) wrap.setAttribute('aria-disabled', 'true');
    else wrap.removeAttribute('aria-disabled');
  }
  page.querySelectorAll('input[name="p21_inquiry_reason"]').forEach((input) => {
    input.disabled = receiving;
    input.closest('.p21-inq-reason')?.classList.toggle('is-disabled', receiving);
  });
  page.querySelectorAll('.p21-inq-choice').forEach((label) => {
    const on = label.querySelector('input')?.value === '1';
    label.classList.toggle('is-selected', receiving ? on : !on);
  });
  page.querySelectorAll('.p21-inq-reason').forEach((label) => {
    const input = label.querySelector('input');
    label.classList.toggle('is-selected', !receiving && !!input?.checked);
  });
  page.dataset.inquiryReceiving = receiving ? '1' : '0';
}

/** @param {HTMLElement} root @param {() => void} rerender */
export function bindTutorInquiriesEvents(root, rerender) {
  const page = root.querySelector('[data-p21-inquiries]');
  if (!page) return;
  bindInquirySampleGuides(page);

  page.querySelectorAll('[data-p21-inquiry-receiving]').forEach((input) => {
    input.addEventListener('change', () => syncReasonState(page));
  });
  page.querySelectorAll('input[name="p21_inquiry_reason"]').forEach((input) => {
    input.addEventListener('change', () => syncReasonState(page));
  });

  page.querySelector('[data-p21-inquiry-save]')?.addEventListener('click', async () => {
    const id = Number(page.dataset.p21TutorId);
    const receiving = selectedReceiving(page);
    const reason = selectedReason(page);
    if (!receiving && (!hasClosedReason(page) || !reason)) {
      alert(P21_INQUIRY_COPY.offReasonRequired);
      return;
    }
    const nextStatus = tutorInquiryStatusFromPref(receiving, reason);
    if (!nextStatus) {
      alert(P21_INQUIRY_COPY.offReasonRequired);
      return;
    }

    try {
      await setTutorInquiryStatus(id, nextStatus);
      alert('저장되었습니다.');
      rerender();
    } catch (err) {
      console.warn('[p21-inquiries]', err);
      if (err?.code === 'schema_missing') {
        alert(P21_INQUIRY_COPY.schemaMissing);
        rerender();
        return;
      }
      const msg =
        err instanceof Error && err.message ? err.message : P21_INQUIRY_COPY.saveFailed;
      alert(msg);
      rerender();
    }
  });
}
