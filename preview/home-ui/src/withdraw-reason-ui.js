import './styles/withdraw-reason.css';
import {
  WITHDRAW_REASON_COPY as C,
  WITHDRAW_REASON_OTHER,
  withdrawReasonCodes,
  withdrawReasonLabel,
} from './withdraw-reason-copy.js';

const NOTE_MAX = 100;

/** @param {string} s */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 탈퇴 사유 선택지 (라디오 + 「기타」 한 줄).
 * @param {string} role study_room | tutor | student | ''
 * @param {{ idPrefix: string, legend: string, lead: string }} opts
 */
export function renderWithdrawReasonChoices(role, { idPrefix, legend, lead }) {
  const items = withdrawReasonCodes(role)
    .map((code) => {
      const id = `${idPrefix}-${code}`;
      return `<label class="withdraw-reason__option" for="${esc(id)}">
          <input type="radio" id="${esc(id)}" name="reason_code" value="${esc(code)}" />
          <span>${esc(withdrawReasonLabel(role, code))}</span>
        </label>`;
    })
    .join('');
  return `
    <fieldset class="withdraw-reason" data-withdraw-reason>
      <legend class="withdraw-reason__legend">${esc(legend)}</legend>
      <p class="withdraw-reason__lead">${esc(lead)}</p>
      <div class="withdraw-reason__options">${items}</div>
      <input class="form-input withdraw-reason__note" type="text" name="reason_note" maxlength="${NOTE_MAX}"
        placeholder="${esc(C.otherPlaceholder)}" aria-label="${esc(C.otherPlaceholder)}" data-withdraw-reason-note hidden />
    </fieldset>`;
}

/** 「기타」를 고를 때만 한 줄 칸을 보인다. @param {ParentNode} root */
export function bindWithdrawReasonChoices(root) {
  const box = root.querySelector('[data-withdraw-reason]');
  const note = box?.querySelector('[data-withdraw-reason-note]');
  if (!box || !(note instanceof HTMLInputElement)) return;
  box.addEventListener('change', () => {
    const picked = box.querySelector('input[name="reason_code"]:checked');
    const other = picked instanceof HTMLInputElement && picked.value === WITHDRAW_REASON_OTHER;
    note.hidden = !other;
    if (other) note.focus();
  });
}

/**
 * @param {ParentNode} root
 * @returns {{ code: string, note: string } | null} 고르지 않았으면 null
 */
export function readWithdrawReason(root) {
  const picked = root.querySelector('[data-withdraw-reason] input[name="reason_code"]:checked');
  if (!(picked instanceof HTMLInputElement)) return null;
  const noteEl = root.querySelector('[data-withdraw-reason-note]');
  const note =
    picked.value === WITHDRAW_REASON_OTHER && noteEl instanceof HTMLInputElement ? noteEl.value.trim().slice(0, NOTE_MAX) : '';
  return { code: picked.value, note };
}
