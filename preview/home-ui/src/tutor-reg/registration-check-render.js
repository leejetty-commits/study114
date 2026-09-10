/**
 * 과외쌤 등록점검 렌더 — 공개 허브 + Pick/Prime 차등 안내
 * 비교 카드만 실노출 tutor 카드 HTML을 쓴다.
 */

import { TRC_COPY } from './registration-check-copy.js';
import { renderBrowseList, renderExposureBox } from '../exposure-render.js';
import { tutorRegistrationCheckTabHref } from './registration-check-model.js';
import { buildTutorSamplePreviewItem } from './registration-check-sample.js';
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
  const badges = (vm.header.badges || [])
    .map(
      (b) => `
      <span class="rc-stat rc-stat--${esc(b.tone)}">
        <span class="rc-stat__value">${esc(b.value)}</span>
      </span>`,
    )
    .join('');
  const next = vm.nextAction;
  const nextHtml = next
    ? next.href
      ? `<a class="rc-next" href="${esc(next.href)}" data-p21-nav="${esc(String(next.href).replace(/^#/, ''))}">${esc(TRC_COPY.next.prefix)} · ${esc(next.label)}</a>`
      : `<p class="rc-next rc-next--static">${esc(TRC_COPY.next.prefix)} · ${esc(next.label)}</p>`
    : '';
  return `
    <header class="rc-head">
      <div class="rc-head__copy">
        <h2 class="rc-head__title">${esc(vm.header.title)}</h2>
        <p class="rc-head__lead">${esc(vm.header.lead)}</p>
        ${nextHtml}
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
    <figure class="rc-sample rc-sample--${esc(tier)}">
      <figcaption class="rc-sample__kicker">${esc(kicker)}</figcaption>
      <div class="rc-sample__card rc-sample__card--${esc(tier)}">${innerHtml}</div>
      <button type="button" class="rc-sample__expand" data-trc-expand data-trc-expand-tier="${esc(tier)}">${esc(TRC_COPY.promo.expandCard)}</button>
    </figure>`;
}

function renderCards(vm) {
  const opts = { showCompare: true, showWish: true, guest: true };
  const basicItem = buildTutorSamplePreviewItem('basic');
  const pickItem = buildTutorSamplePreviewItem('pick');
  const primeItem = buildTutorSamplePreviewItem('prime');
  const basic = renderBrowseList('tutor', [basicItem], opts);
  const pick = renderExposureBox('tutor', 'pick', pickItem, '', opts);
  const prime = renderExposureBox('tutor', 'prime', primeItem, '', opts);
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

function renderTable(rows, { plain = false } = {}) {
  const body = (rows || [])
    .map((r) => {
      const empty = r.status === 'empty';
      if (plain) {
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
  const thead = plain
    ? `<tr><th>${esc(TRC_COPY.board.cols.item)}</th><th>${esc(TRC_COPY.board.cols.value)}</th></tr>`
    : `<tr>
                  <th>${esc(TRC_COPY.board.cols.item)}</th>
                  <th>${esc(TRC_COPY.board.cols.value)}</th>
                  <th>${esc(TRC_COPY.board.cols.status)}</th>
                  <th>${esc(TRC_COPY.board.cols.note)}</th>
                </tr>`;
  return `
          <div class="rc-table-wrap">
            <table class="rc-table${plain ? ' rc-table--plain' : ''}">
              <thead>${thead}</thead>
              <tbody>${body}</tbody>
            </table>
          </div>`;
}

function renderFoldButton(sec) {
  const collapsed = !!sec.collapsedDefault;
  const label = collapsed ? TRC_COPY.board.foldOpen : TRC_COPY.board.foldClose;
  return `<button type="button" class="rc-fold-btn" data-trc-fold aria-expanded="${collapsed ? 'false' : 'true'}" aria-controls="trc-body-${esc(sec.id)}">${esc(label)}</button>`;
}

function renderSectionHead(sec, editBtn) {
  return `
          <div class="rc-section__head">
            <h3 class="rc-section__title">${esc(sec.title)}</h3>
            <div class="rc-section__tools">
              ${renderFoldButton(sec)}
              ${editBtn}
            </div>
          </div>`;
}

function renderSummaryLine(summary) {
  if (!summary) return '';
  const missPreview = summary.sub
    ? `<span class="rc-section__miss-preview${summary.missing === 0 ? ' rc-section__miss-preview--ok' : ''}">${esc(summary.sub)}</span>`
    : '';
  return `<p class="rc-section__summary-line">${esc(summary.line)}${missPreview ? ` · ${missPreview}` : ''}</p>`;
}

function renderBoard(vm) {
  const sections = (vm.board || [])
    .map((sec) => {
      const collapsed = !!sec.collapsedDefault;
      const editHref = sec.editSection ? tutorRegistrationCheckTabHref(vm.tutorId, sec.editSection) : '';
      const editPath = editHref.replace(/^#/, '');
      const editBtn = editPath
        ? `<a class="rc-section__edit" href="#${esc(editPath)}" data-p21-nav="${esc(editPath)}" aria-label="${esc(TRC_COPY.board.editAria(sec.title))}" title="수정">${editIconSvg()}</a>`
        : '';
      const children = Array.isArray(sec.children) ? sec.children : [];
      const bodyInner = children.length
        ? children
            .map(
              (child) => `
            <div class="rc-subsection" data-rc-subsection="${esc(child.id)}">
              <h4 class="rc-subsection__title">${esc(child.title)}</h4>
              ${child.summary ? `<p class="rc-subsection__summary">${esc(child.summary.line)}</p>` : ''}
              ${renderTable(child.rows)}
            </div>`,
            )
            .join('')
        : renderTable(sec.rows, { plain: sec.id === 'basic' });

      return `
        <section class="rc-section${collapsed ? ' is-collapsed' : ''}" data-rc-section="${esc(sec.id)}">
          ${renderSectionHead(sec, editBtn)}
          ${renderSummaryLine(sec.summary)}
          <div id="trc-body-${esc(sec.id)}" class="rc-section__body"${collapsed ? ' hidden' : ''}>
            ${bodyInner}
          </div>
        </section>`;
    })
    .join('');
  return `
    <div class="rc-board">
      <h3 class="rc-board__title">${esc(vm.copy.board.title)}</h3>
      <p class="rc-board__lead">${esc(vm.copy.board.lead)}</p>
      ${sections}
    </div>`;
}

function publishSummaryText(vm) {
  const status = vm.readiness?.profileStatus;
  const canPublish = !!vm.readiness?.canPublish;
  const basicLeft = Number(vm.counts?.basicLeft || 0);
  if (status === 'published') return TRC_COPY.publish.summaryLive;
  if (status === 'hidden' && canPublish) return TRC_COPY.publish.summaryHidden;
  if (canPublish) return TRC_COPY.publish.summaryReady;
  return TRC_COPY.publish.summaryNeed(basicLeft || (vm.readiness?.missing || []).length || 1);
}

function renderPublishActions(vm) {
  const canPublish = !!vm.readiness?.canPublish;
  const hidden = vm.readiness?.profileStatus === 'hidden';
  return `
    <section class="rc-publish" data-p21-tutor-id="${esc(vm.tutorId)}">
      <p class="rc-publish__summary">${esc(publishSummaryText(vm))}</p>
      <div class="p20-confirm-card">
        <h3 class="p20-confirm-card__title">${esc(TRC_COPY.publish.confirmTitle)}</h3>
        <p class="rc-publish__lead">${esc(TRC_COPY.publish.confirmLead)}</p>
        <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="region" /> ${esc(TRC_COPY.publish.confirmRegion)}</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="fee" /> ${esc(TRC_COPY.publish.confirmFee)}</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="trust" /> ${esc(TRC_COPY.publish.confirmTrust)}</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p21-confirm="direct" /> 외부 연락처 직접 노출 없음 · ${LIFECYCLE_PUBLISH_CONFIRM_DIRECT}</label>
      </div>
      <div class="p19-form-actions p19-form-actions--publish">
        <button type="button" class="btn btn--primary btn--lg" data-p21-publish ${canPublish ? '' : 'disabled'}>${esc(TRC_COPY.publish.publishCta)}</button>
        ${hidden ? `<button type="button" class="btn btn--secondary" data-p21-publish>${esc(TRC_COPY.publish.republishCta)}</button>` : ''}
      </div>
      <p class="p19-publish-footnote">${LIFECYCLE_PUBLISH_CONFIRM_NOTE}</p>
    </section>`;
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
