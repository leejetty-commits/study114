/**
 * 등록점검 화면 렌더 — 상태 요약 → 부족 이유 → 다음 행동 → 공개 결정
 * 비교 카드 샘플(rc-tier)은 기존 렌더를 유지한다.
 */

import { RC_COPY } from './registration-check-copy.js';
import { renderBrowseList, renderExposureBox } from '../exposure-render.js';
import { registrationCheckTabHref } from './registration-check-model.js';
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
      ? `<a class="rc-next" href="${esc(next.href)}" data-p20-nav="${esc(String(next.href).replace(/^#/, ''))}">${esc(RC_COPY.next.prefix)} · ${esc(next.label)}</a>`
      : `<p class="rc-next rc-next--static">${esc(RC_COPY.next.prefix)} · ${esc(next.label)}</p>`
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
        <a class="rc-link" href="#${esc(path)}" data-p20-nav="${esc(path)}">${esc(RC_COPY.promo.gotoField)}</a>
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
    <section class="rc-block rc-block--compare" aria-label="${esc(vm.promo.cardsTitle)}">
      <h3 class="rc-block__title">${esc(vm.promo.cardsTitle)}</h3>
      <p class="rc-block__hint">${esc(vm.promo.cardsLead)}</p>
      <div class="rc-compare">
        <div class="rc-compare__grid">
          ${renderPreviewTier('basic', vm.promo.basicKicker, basic)}
          ${renderPreviewTier('pick', vm.promo.pickKicker, pick)}
          ${renderPreviewTier('prime', vm.promo.primeKicker, prime)}
        </div>
      </div>
    </section>`;
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
    ? `<tr><th>${esc(RC_COPY.board.cols.item)}</th><th>${esc(RC_COPY.board.cols.value)}</th></tr>`
    : `<tr>
                  <th>${esc(RC_COPY.board.cols.item)}</th>
                  <th>${esc(RC_COPY.board.cols.value)}</th>
                  <th>${esc(RC_COPY.board.cols.status)}</th>
                  <th>${esc(RC_COPY.board.cols.note)}</th>
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
  const label = collapsed ? RC_COPY.board.foldOpen : RC_COPY.board.foldClose;
  return `<button type="button" class="rc-fold-btn" data-rc-fold aria-expanded="${collapsed ? 'false' : 'true'}" aria-controls="rc-body-${esc(sec.id)}">${esc(label)}</button>`;
}

function renderEditBtn(vm, sectionKey, title) {
  if (!sectionKey) return '';
  const editHref = registrationCheckTabHref(vm.roomId, sectionKey);
  const editPath = editHref.replace(/^#/, '');
  return `<a class="rc-section__edit" href="#${esc(editPath)}" data-p20-nav="${esc(editPath)}" aria-label="${esc(RC_COPY.board.editAria(title))}" title="수정">${editIconSvg()}</a>`;
}

function renderSectionHead(sec, toolsHtml) {
  return `
          <div class="rc-section__head">
            <h3 class="rc-section__title">${esc(sec.title)}</h3>
            <div class="rc-section__tools">
              ${renderFoldButton(sec)}
              ${toolsHtml}
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
      const editBtn = renderEditBtn(vm, sec.editSection, sec.title);
      const children = Array.isArray(sec.children) ? sec.children : [];
      const bodyInner = children.length
        ? children
            .map(
              (child) => `
            <div class="rc-subsection" data-rc-subsection="${esc(child.id)}">
              <div class="rc-subsection__head">
                <h4 class="rc-subsection__title">${esc(child.title)}</h4>
                ${renderEditBtn(vm, child.editSection, child.title)}
              </div>
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
          <div id="rc-body-${esc(sec.id)}" class="rc-section__body"${collapsed ? ' hidden' : ''}>
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
  if (status === 'published') return RC_COPY.publish.summaryLive;
  if (status === 'hidden' && canPublish) return RC_COPY.publish.summaryHidden;
  if (canPublish) return RC_COPY.publish.summaryReady;
  return RC_COPY.publish.summaryNeed(basicLeft || (vm.readiness?.missing || []).length || 1);
}

function renderPublishActions(vm) {
  const canPublish = !!vm.readiness?.canPublish;
  const hidden = vm.readiness?.profileStatus === 'hidden';
  return `
    <section class="rc-publish" data-p20-room-id="${esc(vm.roomId)}">
      <p class="rc-publish__summary">${esc(publishSummaryText(vm))}</p>
      <div class="p20-confirm-card">
        <h3 class="p20-confirm-card__title">${esc(RC_COPY.publish.confirmTitle)}</h3>
        <p class="rc-publish__lead">${esc(RC_COPY.publish.confirmLead)}</p>
        <label class="p20-confirm-check"><input type="checkbox" data-p20-confirm="region" /> ${esc(RC_COPY.publish.confirmRegion)}</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p20-confirm="fee" /> ${esc(RC_COPY.publish.confirmFee)}</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p20-confirm="trust" /> ${esc(RC_COPY.publish.confirmTrust)}</label>
        <label class="p20-confirm-check"><input type="checkbox" data-p20-confirm="direct" /> 외부 연락처 직접 노출 없음 · ${LIFECYCLE_PUBLISH_CONFIRM_DIRECT}</label>
      </div>
      <div class="p19-form-actions p19-form-actions--publish">
        <button type="button" class="btn btn--primary btn--lg" data-p20-publish ${canPublish ? '' : 'disabled'}>${esc(RC_COPY.publish.publishCta)}</button>
        ${hidden ? `<button type="button" class="btn btn--secondary" data-p20-publish>${esc(RC_COPY.publish.republishCta)}</button>` : ''}
      </div>
      <p class="p19-publish-footnote">${LIFECYCLE_PUBLISH_CONFIRM_NOTE}</p>
    </section>`;
}

/** @param {ReturnType<typeof import('./registration-check-model.js').buildRegistrationCheckModel>} vm */
export function renderRegistrationCheck(vm) {
  return `
    <div class="rc-page" data-rc-page data-p20-room-id="${esc(vm.roomId)}" data-rc-room-id="${esc(vm.roomId)}">
      ${renderHeader(vm)}
      ${renderPromoCopy(vm)}
      ${renderMissingBlock(vm.promo.pickMissingTitle, vm.promo.pickMissing, vm.promo.pickReadyBody)}
      ${renderMissingBlock(vm.promo.primeMissingTitle, vm.promo.primeMissing, vm.promo.primeReadyBody)}
      ${renderCards(vm)}
      ${renderBoard(vm)}
      ${renderPublishActions(vm)}
    </div>`;
}
