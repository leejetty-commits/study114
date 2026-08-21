/**
 * 등록점검 화면 렌더 — 현황판 + 업셀링 블럭
 * 마이샵/쇼케이스 컴포넌트를 재사용하지 않는다.
 */

import { RC_COPY } from './registration-check-copy.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function statusBadge(status) {
  const label = RC_COPY.status[status] || RC_COPY.status.empty;
  return `<span class="rc-badge rc-badge--${esc(status)}">${esc(label)}</span>`;
}

function actionButton(action) {
  if (!action) return '';
  if (action.kind === 'light') {
    return `<button type="button" class="rc-action" data-rc-light="${esc(action.field)}">${esc(action.label)}</button>`;
  }
  if (action.kind === 'cover') {
    return `<button type="button" class="rc-action rc-action--primary" data-rc-cover>${esc(action.label)}</button>`;
  }
  return `<button type="button" class="rc-action" data-rc-heavy="${esc(action.section)}">${esc(action.label)}</button>`;
}

function renderHeader(vm) {
  const badges = vm.header.badges
    .map(
      (b) => `
      <span class="rc-stat rc-stat--${esc(b.tone)}">
        <span class="rc-stat__label">${esc(b.label)}</span>
        <span class="rc-stat__value">${esc(b.value)}</span>
      </span>`,
    )
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

function renderMissing(vm) {
  const items = vm.promo.missing || [];
  if (!items.length) {
    return `<p class="rc-missing__ok">${esc(vm.promo.allReady)}</p>`;
  }
  const rows = items
    .map(
      (item) => `
      <li class="rc-missing__item">
        <div class="rc-missing__copy">
          <strong>${esc(item.label)}</strong>
          <p>${esc(item.hint)}</p>
        </div>
        <div class="rc-missing__meta">
          ${statusBadge(item.status)}
          ${actionButton(item.action)}
        </div>
      </li>`,
    )
    .join('');
  return `
    <div class="rc-missing">
      <h4 class="rc-block__sub">${esc(vm.promo.missingTitle)}</h4>
      <p class="rc-block__hint">${esc(vm.promo.missingLead)}</p>
      <ul class="rc-missing__list">${rows}</ul>
    </div>`;
}

function renderTierCard(card, tier) {
  const badge = card.badge
    ? `<span class="rc-tier__badge rc-tier__badge--${esc(tier)}">${esc(card.badge)}</span>`
    : '';
  const meta = (card.meta || []).map((m) => `<li>${esc(m)}</li>`).join('');
  return `
    <article class="rc-tier rc-tier--${esc(tier)}">
      <p class="rc-tier__kicker">${esc(card.kicker)}</p>
      <div class="rc-tier__media rc-tier__media--${esc(tier)}">
        <img src="${esc(card.imageSrc)}" alt="" />
        ${badge}
      </div>
      <h5 class="rc-tier__name">${esc(card.name)}</h5>
      ${card.intro ? `<p class="rc-tier__intro">${esc(card.intro)}</p>` : '<p class="rc-tier__intro is-empty">한 줄 소개 미입력</p>'}
      ${meta ? `<ul class="rc-tier__meta">${meta}</ul>` : ''}
      ${card.extra ? `<p class="rc-tier__extra">${esc(card.extra)}</p>` : ''}
      ${card.imageNote ? `<p class="rc-tier__note">${esc(card.imageNote)}</p>` : ''}
    </article>`;
}

function renderCards(vm) {
  const c = vm.promo.cards;
  return `
    <div class="rc-compare">
      <div class="rc-compare__head">
        <h4 class="rc-block__sub">${esc(vm.promo.cardsTitle)}</h4>
        <p class="rc-block__hint">${esc(vm.promo.cardsLead)}</p>
      </div>
      <div class="rc-compare__grid">
        ${renderTierCard(c.basic, 'basic')}
        ${renderTierCard(c.pick, 'pick')}
        ${renderTierCard(c.prime, 'prime')}
      </div>
      <p class="rc-compare__cta">
        <a href="${esc(vm.promo.plansHref)}" class="rc-link" data-rc-plans>${esc(vm.promo.plansCta)}</a>
      </p>
    </div>`;
}

function renderBoard(vm) {
  const sections = vm.board
    .map((sec) => {
      const rows = sec.rows
        .map((r) => {
          const empty = r.status === 'empty';
          return `
          <tr class="rc-row${empty ? ' is-empty' : ''}">
            <th scope="row">${esc(r.label)}</th>
            <td class="rc-row__value">${empty ? '—' : esc(r.value)}</td>
            <td class="rc-row__status">${statusBadge(r.status)}</td>
            <td class="rc-row__action">${actionButton(r.action)}</td>
          </tr>`;
        })
        .join('');
      return `
        <section class="rc-section" data-rc-section="${esc(sec.id)}">
          <h3 class="rc-section__title">${esc(sec.title)}</h3>
          <div class="rc-table-wrap">
            <table class="rc-table">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>현재값</th>
                  <th>상태</th>
                  <th>액션</th>
                </tr>
              </thead>
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
