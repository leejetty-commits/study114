/**
 * 과외쌤 등록점검 렌더 — 공부방 RC 공통 프레임 이식
 * 비교 카드만 실노출 tutor 카드 HTML을 쓴다.
 */

import { TRC_COPY } from './registration-check-copy.js';
import { renderBrowseList, renderExposureBox } from '../exposure-render.js';
import { tutorRegistrationCheckTabHref } from './registration-check-model.js';
import { LIFECYCLE_PUBLISH_CONFIRM_DIRECT, LIFECYCLE_PUBLISH_CONFIRM_NOTE } from '../lifecycle-copy.js';

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
  return `
    <section class="rc-block" aria-label="${esc(c.title)}">
      <h3 class="rc-block__title">${esc(c.title)}</h3>
      ${c.lines.map((line) => `<p class="rc-block__line">${esc(line)}</p>`).join('')}
    </section>`;
}

function renderMissingList(items) {
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
        <a class="rc-link" href="#${esc(path)}" data-p21-nav="${esc(path)}">${esc(TRC_COPY.promo.gotoField)}</a>
      </li>`;
    })
    .join('');
  return `<ul class="rc-missing__list">${rows}</ul>`;
}

function renderMissingBlock(title, items, emptyText) {
  const body = items?.length
    ? renderMissingList(items)
    : `<p class="rc-missing__ok">${esc(emptyText)}</p>`;
  return `
    <section class="rc-block rc-block--action">
      <h3 class="rc-block__title">${esc(title)}</h3>
      ${body}
    </section>`;
}

function renderPreviewTier(tier, kicker, innerHtml) {
  return `
    <div class="rc-tier rc-tier--${esc(tier)} rc-tier--preview" role="button" tabindex="0" data-trc-expand data-trc-expand-tier="${esc(tier)}" aria-label="${esc(kicker)} 확대카드 보기">
      <p class="rc-tier__kicker">${esc(kicker)}</p>
      <div class="rc-tier__live" aria-hidden="true">${innerHtml}</div>
    </div>`;
}

function renderCards(vm) {
  const item = vm.previewItem;
  const opts = { showCompare: false, showWish: false };
  const basic = renderBrowseList('tutor', [item], opts);
  const pick = renderExposureBox('tutor', 'pick', item, '', opts);
  const prime = renderExposureBox('tutor', 'prime', item, '', opts);
  return `
    <section class="rc-block rc-block--compare" aria-label="${esc(vm.promo.cardsTitle)}">
      <h3 class="rc-block__title">${esc(vm.promo.cardsTitle)}</h3>
      <p class="rc-block__hint">${esc(vm.promo.cardsLead)}</p>
      <div class="rc-compare rc-compare--stack">
        <div class="rc-compare__row rc-compare__row--basic">
          ${renderPreviewTier('basic', vm.promo.basicKicker, basic)}
        </div>
        <div class="rc-compare__row rc-compare__row--upgrade">
          ${renderPreviewTier('pick', vm.promo.pickKicker, pick)}
          ${renderPreviewTier('prime', vm.promo.primeKicker, prime)}
        </div>
      </div>
    </section>`;
}

function statusCell(row) {
  if (row.status === 'empty') {
    return `<span class="rc-status rc-status--empty">${esc(TRC_COPY.status.empty)}</span>`;
  }
  return `<span class="rc-status rc-status--ok">${esc(TRC_COPY.status.filled)}</span>`;
}

function noteCell(row) {
  if (!row.required) return '';
  const miss = row.status !== 'filled';
  return `<span class="rc-note rc-note--${miss ? 'miss' : 'ok'}">${esc(TRC_COPY.board.required)}</span>`;
}

function sectionSummary(sec) {
  const total = sec.rows.length;
  const filled = sec.rows.filter((r) => r.status === 'filled').length;
  const missing = total - filled;
  const missLabels = sec.rows
    .filter((r) => r.status === 'empty')
    .slice(0, 2)
    .map((r) => r.label);
  return {
    filled,
    total,
    missing,
    missLabels,
    line: `${sec.title} · 완료 ${filled}/${total} · 부족 ${missing}`,
  };
}

function renderBoard(vm) {
  const sections = vm.board
    .map((sec) => {
      const isPlain = sec.variant === 'plain';
      const accordion = sec.id === 'detail' || sec.id === 'detail2';
      const editHref = sec.editSection ? tutorRegistrationCheckTabHref(vm.tutorId, sec.editSection) : '';
      const editPath = editHref.replace(/^#/, '');
      const editBtn = editPath
        ? `<a class="rc-section__edit" href="#${esc(editPath)}" data-p21-nav="${esc(editPath)}" aria-label="${esc(TRC_COPY.board.editAria(sec.title))}" title="수정">${editIconSvg()}</a>`
        : '';
      const summary = sectionSummary(sec);
      const missPreview = summary.missLabels.length
        ? `<span class="rc-section__miss-preview">${esc(summary.missLabels.join(' · '))}</span>`
        : summary.missing === 0
          ? `<span class="rc-section__miss-preview rc-section__miss-preview--ok">핵심 항목 충족</span>`
          : '';

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
        ? `<tr><th>${esc(TRC_COPY.board.cols.item)}</th><th>${esc(TRC_COPY.board.cols.value)}</th></tr>`
        : `<tr>
                  <th>${esc(TRC_COPY.board.cols.item)}</th>
                  <th>${esc(TRC_COPY.board.cols.value)}</th>
                  <th>${esc(TRC_COPY.board.cols.status)}</th>
                  <th>${esc(TRC_COPY.board.cols.note)}</th>
                </tr>`;
      const table = `
          <div class="rc-table-wrap">
            <table class="rc-table${isPlain ? ' rc-table--plain' : ''}">
              <thead>${thead}</thead>
              <tbody>${rows}</tbody>
            </table>
          </div>`;

      if (accordion) {
        return `
        <details class="rc-section rc-section--accordion" data-rc-section="${esc(sec.id)}">
          <summary class="rc-section__summary">
            <span class="rc-section__summary-main">
              <span class="rc-section__title">${esc(summary.line)}</span>
              ${missPreview}
            </span>
            ${editBtn}
          </summary>
          ${table}
        </details>`;
      }

      return `
        <section class="rc-section" data-rc-section="${esc(sec.id)}">
          <div class="rc-section__head">
            <h3 class="rc-section__title">${esc(sec.title)}</h3>
            ${editBtn}
          </div>
          ${table}
        </section>`;
    })
    .join('');
  return `
    <div class="rc-board">
      <h3 class="rc-board__title">${esc(TRC_COPY.board.title)}</h3>
      <p class="rc-board__lead">${esc(TRC_COPY.board.lead)}</p>
      ${sections}
    </div>`;
}

function renderPublishActions(vm) {
  const canPublish = !!vm.readiness?.canPublish;
  const hidden = vm.readiness?.profileStatus === 'hidden';
  return `
    <div class="p20-confirm-card" data-p21-tutor-id="${esc(vm.tutorId)}">
      <h3 class="p20-confirm-card__title">${esc(TRC_COPY.publish.confirmTitle)}</h3>
      <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="region" /> ${esc(TRC_COPY.publish.confirmRegion)}</label>
      <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="fee" /> ${esc(TRC_COPY.publish.confirmFee)}</label>
      <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="trust" /> ${esc(TRC_COPY.publish.confirmTrust)}</label>
      <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="direct" /> 외부 연락처 직접 노출 없음 · ${LIFECYCLE_PUBLISH_CONFIRM_DIRECT}</label>
    </div>
    <div class="p19-form-actions p19-form-actions--publish">
      <button type="button" class="btn btn--primary btn--lg" data-p21-publish ${canPublish ? '' : 'disabled'}>${esc(TRC_COPY.publish.publishCta)}</button>
      ${hidden ? `<button type="button" class="btn btn--secondary" data-p21-publish>${esc(TRC_COPY.publish.republishCta)}</button>` : ''}
    </div>
    <p class="p19-publish-footnote">${LIFECYCLE_PUBLISH_CONFIRM_NOTE}</p>`;
}

/** @param {ReturnType<typeof import('./registration-check-model.js').buildTutorRegistrationCheckModel>} vm */
export function renderTutorRegistrationCheck(vm) {
  return `
    <div class="rc-page" data-trc-page data-p21-tutor-id="${esc(vm.tutorId)}" data-trc-tutor-id="${esc(vm.tutorId)}">
      ${renderHeader(vm)}
      ${renderPromoCopy(vm)}
      ${renderMissingBlock(vm.promo.pickMissingTitle, vm.promo.pickMissing, vm.promo.pickReadyBody)}
      ${renderMissingBlock(vm.promo.primeMissingTitle, vm.promo.primeMissing, vm.promo.primeReadyBody)}
      ${renderCards(vm)}
      ${renderBoard(vm)}
      ${renderPublishActions(vm)}
    </div>`;
}
