/**
 * 등록점검 화면 렌더 — 현황판 + 업셀링 블럭
 * 마이샵/쇼케이스 컴포넌트를 재사용하지 않는다. 비교 카드만 실노출 카드 HTML을 쓴다.
 */

import { RC_COPY } from './registration-check-copy.js';
import { renderBrowseList, renderExposureBox } from '../exposure-render.js';
import { registrationCheckTabHref } from './registration-check-model.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function editIconSvg() {
  return `<svg class="rc-section__edit-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
}

function renderHeader(vm) {
  const badges = vm.header.badges
    .map((b) => {
      if (b.layout === 'sentence') {
        return `
      <span class="rc-stat rc-stat--${esc(b.tone)} rc-stat--sentence">
        <span class="rc-stat__value">${esc(b.value)}</span>
      </span>`;
      }
      return `
      <span class="rc-stat rc-stat--${esc(b.tone)}">
        <span class="rc-stat__label">${esc(b.label)}</span>
        <span class="rc-stat__value">${esc(b.value)}</span>
      </span>`;
    })
    .join('');
  return `
    <header class="rc-head">
      <div class="rc-head__copy">
        <h2 class="rc-head__title">${esc(vm.header.title)}</h2>
        <p class="rc-head__lead">${esc(vm.header.lead)}</p>
      </div>
      <div class="rc-head__stats" aria-label="입력 상태 요약">${badges}</div>
    </header>`;
}

function renderPromoCopy(vm) {
  const c = vm.promo;
  const col = (title, items) => `
    <div class="rc-guide__col">
      <h4 class="rc-guide__sub">${esc(title)}</h4>
      <ul class="rc-guide__list">
        ${items.map((item) => `<li>${esc(item)}</li>`).join('')}
      </ul>
    </div>`;
  return `
    <div class="rc-guide">
      <h3 class="rc-guide__title">${esc(c.title)}</h3>
      ${c.lines.map((line) => `<p class="rc-guide__line">${esc(line)}</p>`).join('')}
      <div class="rc-guide__cols">
        ${col(c.detail1Title, c.detail1Items)}
        ${col(c.detail2Title, c.detail2Items)}
      </div>
    </div>`;
}

function renderMissingList(title, items) {
  if (!items?.length) return '';
  const rows = items
    .map((item) => {
      const path = String(item.href || '').replace(/^#/, '');
      return `
      <li class="rc-missing__item">
        <div class="rc-missing__copy">
          <strong>${esc(item.label)}</strong>
          <p>${esc(item.hint)}</p>
        </div>
        <a class="rc-link" href="#${esc(path)}" data-p20-nav="${esc(path)}">${esc(RC_COPY.promo.gotoField)}</a>
      </li>`;
    })
    .join('');
  return `
    <div class="rc-missing">
      <h4 class="rc-block__sub">${esc(title)}</h4>
      <ul class="rc-missing__list">${rows}</ul>
    </div>`;
}

function renderMissing(vm) {
  const pick = vm.promo.pickMissing || [];
  const prime = vm.promo.primeMissing || [];
  if (!pick.length && !prime.length) {
    return `<p class="rc-missing__ok">${esc(vm.promo.allReady)}</p>`;
  }
  return `
    ${renderMissingList(vm.promo.pickMissingTitle, pick)}
    ${renderMissingList(vm.promo.primeMissingTitle, prime)}`;
}

function renderPreviewTier(tier, kicker, innerHtml) {
  return `
    <div class="rc-tier rc-tier--${esc(tier)} rc-tier--preview" role="button" tabindex="0" data-rc-expand data-rc-expand-tier="${esc(tier)}" aria-label="${esc(kicker)} 확대카드 보기">
      <p class="rc-tier__kicker">${esc(kicker)}</p>
      <div class="rc-tier__live" aria-hidden="true">${innerHtml}</div>
    </div>`;
}

function renderCards(vm) {
  const item = vm.previewItem;
  const opts = { showCompare: false, showWish: false };
  const basic = renderBrowseList('study_room', [item], opts);
  const pick = renderExposureBox('study_room', 'pick', item, '', opts);
  const prime = renderExposureBox('study_room', 'prime', item, '', opts);
  return `
    <div class="rc-compare">
      <div class="rc-compare__head">
        <h4 class="rc-block__sub">${esc(vm.promo.cardsTitle)}</h4>
        <p class="rc-block__hint">${esc(vm.promo.cardsLead)}</p>
      </div>
      <div class="rc-compare__grid">
        ${renderPreviewTier('basic', vm.promo.basicKicker, basic)}
        ${renderPreviewTier('pick', vm.promo.pickKicker, pick)}
        ${renderPreviewTier('prime', vm.promo.primeKicker, prime)}
      </div>
    </div>`;
}

function statusCell(row) {
  if (row.status === 'empty') {
    return `<span class="rc-status rc-status--empty">${esc(RC_COPY.status.empty)}</span>`;
  }
  return `<span class="rc-status rc-status--ok">${esc(RC_COPY.status.filled)}</span>`;
}

function noteCell(row) {
  if (!row.required) return '';
  const miss = row.status !== 'filled';
  return `<span class="rc-note rc-note--${miss ? 'miss' : 'ok'}">${esc(RC_COPY.board.required)}</span>`;
}

function renderBoard(vm) {
  const sections = vm.board
    .map((sec) => {
      const isPlain = sec.variant === 'plain';
      const editHref = sec.editSection ? registrationCheckTabHref(vm.roomId, sec.editSection) : '';
      const editPath = editHref.replace(/^#/, '');
      const editBtn =
        !isPlain && editPath
          ? `<a class="rc-section__edit" href="#${esc(editPath)}" data-p20-nav="${esc(editPath)}" aria-label="${esc(RC_COPY.board.editAria(sec.title))}" title="수정">${editIconSvg()}</a>`
          : '';
      const head = `
          <div class="rc-section__head">
            <h3 class="rc-section__title">${esc(sec.title)}</h3>
            ${editBtn}
          </div>`;
      const rows = sec.rows
        .map((r) => {
          const empty = r.status === 'empty';
          if (isPlain) {
            return `
          <tr class="rc-row${empty ? ' is-empty' : ''}">
            <th scope="row">${esc(r.label)}</th>
            <td class="rc-row__value">${empty ? '—' : esc(r.value)}</td>
          </tr>`;
          }
          return `
          <tr class="rc-row${empty ? ' is-empty' : ''}">
            <th scope="row">${esc(r.label)}</th>
            <td class="rc-row__value">${empty ? '—' : esc(r.value)}</td>
            <td class="rc-row__status">${statusCell(r)}</td>
            <td class="rc-row__note">${noteCell(r)}</td>
          </tr>`;
        })
        .join('');
      const thead = isPlain
        ? `<tr><th>${esc(RC_COPY.board.cols.item)}</th><th>${esc(RC_COPY.board.cols.value)}</th></tr>`
        : `<tr>
                  <th>${esc(RC_COPY.board.cols.item)}</th>
                  <th>${esc(RC_COPY.board.cols.value)}</th>
                  <th>${esc(RC_COPY.board.cols.status)}</th>
                  <th>${esc(RC_COPY.board.cols.note)}</th>
                </tr>`;
      return `
        <section class="rc-section" data-rc-section="${esc(sec.id)}">
          ${head}
          <div class="rc-table-wrap">
            <table class="rc-table${isPlain ? ' rc-table--plain' : ''}">
              <thead>${thead}</thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </section>`;
    })
    .join('');
  return `
    <div class="rc-board">
      <h3 class="rc-board__title">${esc(RC_COPY.board.title)}</h3>
      <p class="rc-board__lead">${esc(RC_COPY.board.lead)}</p>
      ${sections}
    </div>`;
}

/** @param {ReturnType<typeof import('./registration-check-model.js').buildRegistrationCheckModel>} vm */
export function renderRegistrationCheck(vm) {
  return `
    <div class="rc-page" data-rc-page data-p20-room-id="${esc(vm.roomId)}" data-rc-room-id="${esc(vm.roomId)}">
      ${renderHeader(vm)}
      <section class="rc-promo" aria-label="Pick Prime 준비">
        ${renderPromoCopy(vm)}
        ${renderMissing(vm)}
        ${renderCards(vm)}
      </section>
      ${renderBoard(vm)}
    </div>`;
}
