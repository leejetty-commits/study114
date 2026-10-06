/**
 * 운영 홈 「오늘 할 일」 칸·서랍 호스트.
 * 화면 HTML과 저장 바인딩은 등록된 기존 함수를 그대로 부른다.
 */
import { canAccessAdminPath } from './admin-guard.js';
import { ADMIN_TODAY_CARDS, ADMIN_TODAY_HEADING, ADMIN_TODAY_NOTE } from './a28-copy.js';
import { a28Ui } from './a28-screens-state.js';
import { esc, renderDetailDrawer } from './a28-screens-shared.js';

/** @type {null | {
 *   members: () => string,
 *   exposure: () => string,
 *   tickets: () => string,
 *   reports: () => string,
 *   popups: () => string,
 * }} */
let todayRenderers = null;

/** @type {null | {
 *   members: Function,
 *   exposure: Function,
 *   tickets: Function,
 *   reports: Function,
 *   popups: Function,
 *   writeHash: (next: string) => void,
 *   bindNav: (root: ParentNode) => void,
 *   bindDrawer: (root: ParentNode) => void,
 * }} */
let todayBinders = null;

/** @param {typeof todayRenderers} map */
export function registerTodayRenderers(map) {
  todayRenderers = map;
}

/** @param {typeof todayBinders} map */
export function registerTodayBinders(map) {
  todayBinders = map;
}

function hashPath() {
  const raw = String(globalThis.location?.hash || '').replace(/^#/, '');
  return raw.split('?')[0];
}

/** 허브에서만 노출 칸 상태. 기존 주소면 null. */
export function peekHubExposureRoute() {
  if (hashPath() !== '/admin') return null;
  if (a28Ui.todaySlot !== 'exposure') return null;
  const tab = a28Ui.todayExposure?.tab;
  const userRaw = String(a28Ui.todayExposure?.userId || '');
  return {
    tab: tab === 'tutor' || tab === 'student' || tab === 'study_room' ? tab : 'study_room',
    userId: /^[1-9][0-9]*$/.test(userRaw) ? userRaw : '',
    hasTab: a28Ui.todayExposure?.hasTab !== false,
  };
}

/** @param {{ id: string, path?: string, paths?: string[] }} card */
function canSeeTodayCard(card) {
  const paths = card.paths || (card.path ? [card.path] : []);
  return paths.every((path) => canAccessAdminPath(path));
}

function visibleTodayCards() {
  return ADMIN_TODAY_CARDS.filter((card) => canSeeTodayCard(card));
}

/** @param {ParentNode} host */
function revealDrawer(host) {
  const aside = host?.querySelector?.('[data-admin-drawer]');
  if (aside instanceof HTMLElement) aside.hidden = false;
}

/** @param {HTMLElement} box */
function syncCardExpanded(box) {
  box.querySelectorAll('[data-today-card]').forEach((btn) => {
    const on = a28Ui.todaySlot === btn.getAttribute('data-today-card');
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
  });
}

/** @param {HTMLElement} box */
function clearSlotDom(box) {
  box.querySelectorAll('[data-today-expand]').forEach((el) => {
    el.innerHTML = '';
  });
  const host = box.querySelector('[data-today-drawer-host]');
  if (host) host.innerHTML = '';
}

/** @param {HTMLElement} box */
function rerenderMembers(box) {
  if (a28Ui.todaySlot !== 'members') return;
  const expand = box.querySelector('[data-today-expand="members"]');
  if (!expand || !todayRenderers || !todayBinders) return;
  expand.innerHTML = todayRenderers.members();
  todayBinders.members(expand, () => rerenderMembers(box), todayBinders.writeHash);
  todayBinders.bindDrawer(expand);
  todayBinders.bindNav(expand);
}

/** @param {HTMLElement} box */
function rerenderExposure(box) {
  if (a28Ui.todaySlot !== 'exposure') return;
  const expand = box.querySelector('[data-today-expand="exposure"]');
  if (!expand || !todayRenderers || !todayBinders) return;
  expand.innerHTML = todayRenderers.exposure();
  todayBinders.exposure(
    expand,
    () => rerenderExposure(box),
    (next) => applyExposureTarget(box, next),
  );
  todayBinders.bindDrawer(expand);
  todayBinders.bindNav(expand);
}

/** @param {HTMLElement} box @param {string} next */
function applyExposureTarget(box, next) {
  const raw = String(next || '');
  const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
  const params = new URLSearchParams(q);
  const tab = params.get('tab');
  const userRaw = params.get('user') || '';
  a28Ui.todayExposure = {
    tab: tab === 'tutor' || tab === 'student' || tab === 'study_room' ? tab : 'study_room',
    userId: /^[1-9][0-9]*$/.test(userRaw) ? userRaw : '',
    hasTab: params.has('tab'),
  };
  rerenderExposure(box);
}

/** @param {HTMLElement} box @param {'tickets'|'reports'} paneName */
function rerenderInquiryPane(box, paneName) {
  if (a28Ui.todaySlot !== 'inquiry') return;
  const pane = box.querySelector(`[data-today-pane="${paneName}"]`);
  if (!pane || !todayRenderers || !todayBinders) return;
  pane.innerHTML = paneName === 'tickets' ? todayRenderers.tickets() : todayRenderers.reports();
  const bind = paneName === 'tickets' ? todayBinders.tickets : todayBinders.reports;
  bind(pane, () => rerenderInquiryPane(box, paneName), todayBinders.writeHash);
  todayBinders.bindNav(pane);
  const host = box.querySelector('[data-today-drawer-host]');
  if (host) revealDrawer(host);
}

/** @param {HTMLElement} box */
function rerenderPopups(box) {
  if (a28Ui.todaySlot !== 'popups') return;
  const pane = box.querySelector('[data-today-pane="popups"]');
  if (!pane || !todayRenderers || !todayBinders) return;
  pane.innerHTML = todayRenderers.popups();
  todayBinders.popups(pane, () => rerenderPopups(box), todayBinders.writeHash);
  const host = box.querySelector('[data-today-drawer-host]');
  if (host) revealDrawer(host);
}

function inquiryDrawerHtml() {
  const tab = a28Ui.todayInquiryTab === 'reports' ? 'reports' : 'tickets';
  const body = `
    <div class="a28-today__tabs" role="tablist">
      <button type="button" class="btn btn--sm ${tab === 'tickets' ? 'btn--primary' : 'btn--secondary'}" data-today-inquiry-tab="tickets" aria-selected="${tab === 'tickets' ? 'true' : 'false'}">문의</button>
      <button type="button" class="btn btn--sm ${tab === 'reports' ? 'btn--primary' : 'btn--secondary'}" data-today-inquiry-tab="reports" aria-selected="${tab === 'reports' ? 'true' : 'false'}">신고</button>
    </div>
    <div data-today-pane="tickets"${tab === 'tickets' ? '' : ' hidden'}>${todayRenderers.tickets()}</div>
    <div data-today-pane="reports"${tab === 'reports' ? '' : ' hidden'}>${todayRenderers.reports()}</div>`;
  return renderDetailDrawer('today-inquiry', '문의·신고', body);
}

function popupDrawerHtml() {
  return renderDetailDrawer(
    'today-popups',
    '홈 팝업',
    `<div data-today-pane="popups">${todayRenderers.popups()}</div>`,
  );
}

/** @param {HTMLElement} box @param {ParentNode} host */
function bindDrawerChrome(box, host, withDrawerBind = true) {
  if (withDrawerBind) todayBinders.bindDrawer(host);
  host.querySelectorAll('[data-admin-drawer-close]').forEach((el) => {
    el.addEventListener('click', () => {
      a28Ui.todaySlot = null;
      syncCardExpanded(box);
    });
  });
  revealDrawer(host);
}

/** @param {HTMLElement} box */
function bindInquiryTabs(box) {
  const host = box.querySelector('[data-today-drawer-host]');
  if (!host) return;
  host.querySelectorAll('[data-today-inquiry-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-today-inquiry-tab') === 'reports' ? 'reports' : 'tickets';
      a28Ui.todayInquiryTab = tab;
      const tickets = host.querySelector('[data-today-pane="tickets"]');
      const reports = host.querySelector('[data-today-pane="reports"]');
      if (tickets instanceof HTMLElement) tickets.hidden = tab !== 'tickets';
      if (reports instanceof HTMLElement) reports.hidden = tab !== 'reports';
      host.querySelectorAll('[data-today-inquiry-tab]').forEach((el) => {
        const on = el.getAttribute('data-today-inquiry-tab') === tab;
        el.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    });
  });
}

/** @param {HTMLElement} box */
function paintInquiry(box) {
  const host = box.querySelector('[data-today-drawer-host]');
  if (!host || !todayRenderers || !todayBinders) return;
  host.innerHTML = inquiryDrawerHtml();
  const tickets = host.querySelector('[data-today-pane="tickets"]');
  const reports = host.querySelector('[data-today-pane="reports"]');
  if (tickets) todayBinders.tickets(tickets, () => rerenderInquiryPane(box, 'tickets'), todayBinders.writeHash);
  if (reports) todayBinders.reports(reports, () => rerenderInquiryPane(box, 'reports'), todayBinders.writeHash);
  if (tickets) todayBinders.bindNav(tickets);
  if (reports) todayBinders.bindNav(reports);
  bindInquiryTabs(box);
  bindDrawerChrome(box, host);
}

/** @param {HTMLElement} box */
function paintPopups(box) {
  const host = box.querySelector('[data-today-drawer-host]');
  if (!host || !todayRenderers || !todayBinders) return;
  host.innerHTML = popupDrawerHtml();
  const pane = host.querySelector('[data-today-pane="popups"]');
  if (pane) todayBinders.popups(pane, () => rerenderPopups(box), todayBinders.writeHash);
  bindDrawerChrome(box, host);
}

/** @param {HTMLElement} box @param {string} id */
function openSlot(box, id) {
  clearSlotDom(box);
  if (id === 'members') rerenderMembers(box);
  else if (id === 'exposure') {
    a28Ui.todayExposure = { tab: 'study_room', userId: '', hasTab: true };
    rerenderExposure(box);
  } else if (id === 'inquiry') {
    a28Ui.todayInquiryTab = 'tickets';
    paintInquiry(box);
  } else if (id === 'popups') paintPopups(box);
  syncCardExpanded(box);
}

/** 전체 그리기 때 이미 칸 HTML이 있으면 바인딩만 붙인다. */
function mountRenderedSlot(box) {
  const id = a28Ui.todaySlot;
  if (!id || !todayBinders) return;
  if (id === 'members' || id === 'exposure') {
    const expand = box.querySelector(`[data-today-expand="${id}"]`);
    if (!(expand instanceof HTMLElement) || !expand.childElementCount) {
      openSlot(box, id);
      return;
    }
    if (id === 'members') {
      todayBinders.members(expand, () => rerenderMembers(box), todayBinders.writeHash);
    } else {
      todayBinders.exposure(
        expand,
        () => rerenderExposure(box),
        (next) => applyExposureTarget(box, next),
      );
    }
    return;
  }
  const host = box.querySelector('[data-today-drawer-host]');
  if (!(host instanceof HTMLElement) || !host.childElementCount) {
    openSlot(box, id);
    return;
  }
  if (id === 'inquiry') {
    const tickets = host.querySelector('[data-today-pane="tickets"]');
    const reports = host.querySelector('[data-today-pane="reports"]');
    if (tickets) todayBinders.tickets(tickets, () => rerenderInquiryPane(box, 'tickets'), todayBinders.writeHash);
    if (reports) todayBinders.reports(reports, () => rerenderInquiryPane(box, 'reports'), todayBinders.writeHash);
    bindInquiryTabs(box);
    bindDrawerChrome(box, host, false);
  } else if (id === 'popups') {
    const pane = host.querySelector('[data-today-pane="popups"]');
    if (pane) todayBinders.popups(pane, () => rerenderPopups(box), todayBinders.writeHash);
    bindDrawerChrome(box, host, false);
  }
}

/** @param {ParentNode} root */
export function bindTodayHub(root) {
  const box = root.querySelector('[data-today-root]');
  if (!(box instanceof HTMLElement) || box.dataset.todayBound === '1') return;
  box.dataset.todayBound = '1';
  box.querySelectorAll('[data-today-card]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-today-card') || '';
      if (!id) return;
      if (a28Ui.todaySlot === id) {
        a28Ui.todaySlot = null;
        clearSlotDom(box);
        syncCardExpanded(box);
        return;
      }
      a28Ui.todaySlot = id;
      openSlot(box, id);
    });
  });
  mountRenderedSlot(box);
}

export function renderTodayMarkup() {
  const cards = visibleTodayCards()
    .map((card) => {
      const open = a28Ui.todaySlot === card.id;
      const expandable = card.id === 'members' || card.id === 'exposure';
      let inner = '';
      if (expandable && open && todayRenderers) {
        inner = card.id === 'members' ? todayRenderers.members() : todayRenderers.exposure();
      }
      const expand = expandable
        ? `<div class="a28-today__expand" data-today-expand="${card.id}">${inner}</div>`
        : '';
      return `<div class="a28-today__item">
        <button type="button" class="a28-today__card" data-today-card="${card.id}" aria-expanded="${open ? 'true' : 'false'}">
          <span class="a28-today__card-title">${esc(card.title)}</span>
          <span class="a28-today__card-desc">${esc(card.desc)}</span>
        </button>
        ${expand}
      </div>`;
    })
    .join('');
  let drawer = '';
  if (todayRenderers && a28Ui.todaySlot === 'inquiry') drawer = inquiryDrawerHtml();
  else if (todayRenderers && a28Ui.todaySlot === 'popups') drawer = popupDrawerHtml();
  return `<div class="a28-today" data-today-root>
    <h3 class="a28-today__title">${esc(ADMIN_TODAY_HEADING)}</h3>
    <div class="a28-today__list">${cards}</div>
    <p class="a28-today__note">${esc(ADMIN_TODAY_NOTE)}</p>
    <div data-today-drawer-host>${drawer}</div>
  </div>`;
}
