import '../styles/admin-settlement.css';
import { SETTLEMENT_COPY as C } from './a28-settlement-copy.js';
import { fetchSettlementLines, fetchSettlementReport } from './a28-settlement-api.js';
import { canAccessAdminPath } from './admin-guard.js';
import { renderDetailDrawer, renderPanel, esc } from './a28-screens-shared.js';

const LINE_KEYS = [
  ['pay', '①'],
  ['queue', '②'],
  ['reg', '③'],
  ['leave', '④'],
  ['popup', '⑤'],
];

/** @param {string} [ymd] */
export function computeWeekRange(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return '';
  const d = new Date(`${ymd}T00:00:00+09:00`);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  return `${fmt(mon)} ~ ${fmt(sun)}`;
}

/** @param {string} period */
export function defaultLines(period) {
  if (period === 'day') {
    return [
      '① 결제 내역 없음',
      '② 남은 응대 내역 없음',
      '③ 등록 내역 없음',
      '④ 탈퇴·삭제 내역 없음',
      '⑤ 홈 팝업 내역 없음',
    ];
  }
  return [
    '① 결제 내역 없음',
    '② 새 응대 내역 없음',
    '③ 등록 내역 없음',
    '④ 탈퇴·삭제 내역 없음',
    '⑤ 기간 마지막 홈 팝업 내역 없음',
  ];
}

/** @param {string} period @param {string} [date] */
export function formatPrintTitle(period, date = '') {
  if (period === 'week') {
    const range = computeWeekRange(date);
    if (range) return `${C.weeklyPrint || '주간 보고서'} ${range}`;
    return date ? `${C.weeklyPrint || '주간 보고서'} ${date}` : (C.weeklyPrint || '주간 보고서');
  }
  if (period === 'month') {
    const ym = String(date || '').slice(0, 7);
    return ym ? `${C.monthlyPrint || '월간 보고서'} ${ym}` : (C.monthlyPrint || '월간 보고서');
  }
  return date ? `${C.dailyPrint || '일일정산서'} ${date}` : (C.dailyPrint || '일일정산서');
}

/** @param {string} period */
function dateInput(period, value) {
  if (period === 'month') {
    const month = String(value || '').slice(0, 7);
    return `<input class="settlement-date" data-settlement-date type="month" value="${esc(month)}" aria-label="달">`;
  }
  return `<input class="settlement-date" data-settlement-date type="date" value="${esc(value || '')}" aria-label="날짜">`;
}

/**
 * @param {{ period?: string, date?: string, state?: string, message?: string, lines?: string[], printTitle?: string, detailHtml?: string }} model
 * @param {{ isHub?: boolean }} [opts]
 */
export function renderSettlementView(model = {}, { isHub = false } = {}) {
  const period = model.period || 'day';
  const state = model.state || 'loading';
  const lines = Array.isArray(model.lines) ? model.lines : defaultLines(period);
  const printTitle = model.printTitle || formatPrintTitle(period, model.date);
  const message = model.message || (state === 'loading' ? C.loading : '');
  const tabs = [
    ['day', C.tabDay],
    ['week', C.tabWeek],
    ['month', C.tabMonth],
  ].map(([id, label]) => {
    const selected = id === period ? 'true' : 'false';
    return `<button type="button" role="tab" aria-selected="${selected}" data-settlement-tab="${id}">${esc(label)}</button>`;
  }).join('');
  const slots = LINE_KEYS.map(([key, fallback], index) => {
    const text = lines[index] || fallback;
    return `<li data-settlement-line="${key}"><span>${esc(text)}</span><button type="button" class="btn btn--secondary btn--sm" data-settlement-open="${key}">${esc(C.detail)}</button></li>`;
  }).join('');
  const printLines = lines.map((line) => `<p>${esc(line)}</p>`).join('');
  const detailBody = model.detailHtml || '<div data-settlement-detail-body></div>';
  const body = `
    <div data-settlement-root data-period="${esc(period)}">
      <div class="settlement-no-print">
        <div class="settlement-tabs" role="tablist">${tabs}</div>
        ${dateInput(period, model.date || '')}
        <p class="settlement-status" data-settlement-status>${esc(message)}</p>
        <ol class="settlement-lines">${slots}</ol>
        <p><button type="button" class="btn btn--primary" disabled data-settlement-print>${esc(C.print)}</button></p>
      </div>
      <div class="settlement-print-sheet">
        <h1 data-settlement-print-title>${esc(printTitle)}</h1>
        <div data-settlement-print-lines>${printLines}</div>
        <p data-settlement-print-time></p>
      </div>
      <div data-today-drawer-host>
        ${renderDetailDrawer('settlement-detail', C.detail, detailBody)}
      </div>
    </div>`;

  if (isHub) {
    return `
      <section class="a28-hub-settlement" data-settlement-hub-slot>
        <h3 class="a28-today__title">${esc(C.title)}</h3>
        ${body}
      </section>`;
  }
  return renderPanel(C.title, 'A28-162', body, { lead: esc(C.help) });
}

export function renderSettlement() {
  return renderSettlementView({ period: 'day', state: 'loading', printTitle: C.dailyPrint, lines: defaultLines('day') });
}

export function renderSettlementHub() {
  return renderSettlementView(
    { period: 'day', state: 'loading', printTitle: C.dailyPrint, lines: defaultLines('day') },
    { isHub: true },
  );
}

const LINK_LABEL = {
  pay: C.linkPay,
  inquiry: C.linkInquiry,
  report: C.linkReport,
  reg: C.linkMembers,
  withdraw: C.linkMembers,
  delete: C.linkMembers,
  popup: C.linkPopup,
};

/** @param {string} line @param {Array<Record<string, string>>} items @param {number} page @param {number} total @param {string} link @param {boolean} [backfill] */
export function renderSettlementDetail(line, items, page, total, link, backfill = false) {
  const tabs = detailTabs(line);
  if (backfill && (line === 'inquiry' || line === 'report' || line === 'popup')) {
    return `${tabs}<p>${esc(C.backfill)}</p>${renderLink(line, link)}`;
  }
  if (!items.length) {
    return `${tabs}<p>${esc(C.emptyDetail)}</p>${renderLink(line, link)}`;
  }
  const heads = columns(line);
  const headHtml = heads.map((col) => `<th>${esc(col.label)}</th>`).join('');
  const rows = items.map((item) => {
    const cells = heads.map((col) => `<td>${esc(item[col.key] || '')}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  const prev = page > 1 ? '' : ' disabled';
  const next = page * 50 < total ? '' : ' disabled';
  return `${tabs}
    <table class="sup-admin-table"><thead><tr>${headHtml}</tr></thead><tbody>${rows}</tbody></table>
    <div class="settlement-pager">
      <button type="button" data-settlement-page="${page - 1}"${prev}>${esc(C.prev)}</button>
      <button type="button" data-settlement-page="${page + 1}"${next}>${esc(C.next)}</button>
    </div>
    ${renderLink(line, link)}`;
}

function detailTabs(line) {
  if (line === 'inquiry' || line === 'report') {
    return `<div class="settlement-detail-tabs" role="tablist">
      <button type="button" role="tab" aria-selected="${line === 'inquiry' ? 'true' : 'false'}" data-settlement-detail-tab="inquiry">${esc(C.tabInquiry)}</button>
      <button type="button" role="tab" aria-selected="${line === 'report' ? 'true' : 'false'}" data-settlement-detail-tab="report">${esc(C.tabReport)}</button>
    </div>`;
  }
  if (line === 'withdraw' || line === 'delete') {
    return `<div class="settlement-detail-tabs" role="tablist">
      <button type="button" role="tab" aria-selected="${line === 'withdraw' ? 'true' : 'false'}" data-settlement-detail-tab="withdraw">${esc(C.tabWithdraw)}</button>
      <button type="button" role="tab" aria-selected="${line === 'delete' ? 'true' : 'false'}" data-settlement-detail-tab="delete">${esc(C.tabDelete)}</button>
    </div>`;
  }
  return '';
}

function columns(line) {
  if (line === 'pay') {
    return [
      { key: 'time', label: C.colTime },
      { key: 'member', label: C.colMember },
      { key: 'role', label: C.colRole },
      { key: 'product', label: C.colProduct },
      { key: 'amount', label: C.colAmount },
    ];
  }
  if (line === 'inquiry') {
    return [
      { key: 'ticket_no', label: C.colTicket },
      { key: 'time', label: C.colTime },
      { key: 'category', label: C.colCategory },
      { key: 'status', label: C.colStatus },
      { key: 'role', label: C.colRole },
    ];
  }
  if (line === 'report') {
    return [
      { key: 'report_key', label: C.colTicket },
      { key: 'time', label: C.colTime },
      { key: 'kind', label: C.colKind },
      { key: 'target', label: C.colTarget },
      { key: 'status', label: C.colStatus },
    ];
  }
  if (line === 'reg') {
    return [
      { key: 'role', label: C.colRole },
      { key: 'name', label: C.colName },
      { key: 'time', label: C.colTime },
    ];
  }
  if (line === 'withdraw') {
    return [
      { key: 'time', label: C.colTime },
      { key: 'roles', label: C.colRoles },
      { key: 'name', label: C.colAlias },
    ];
  }
  if (line === 'delete') {
    return [
      { key: 'time', label: C.colTime },
      { key: 'target', label: C.colTargetId },
      { key: 'roles', label: C.colRoles },
    ];
  }
  return [
    { key: 'id', label: C.colPopupId },
    { key: 'type', label: C.colPopupType },
    { key: 'start_at', label: C.colStart },
    { key: 'end_at', label: C.colEnd },
  ];
}

function renderLink(line, link) {
  if (!link || !canAccessAdminPath(link)) return '';
  const label = LINK_LABEL[line] || C.linkMembers;
  return `<a class="settlement-link" href="#${esc(link)}">${esc(label)}</a>`;
}

function openKey(key) {
  if (key === 'queue') return 'inquiry';
  if (key === 'leave') return 'withdraw';
  return key;
}

/** @param {HTMLElement} root @param {() => void} _rerender */
export function bindSettlement(root, _rerender) {
  document.documentElement.classList.remove('is-settlement-printing');
  window.addEventListener('hashchange', () => {
    document.documentElement.classList.remove('is-settlement-printing');
  }, { once: true });
  const box = root.querySelector('[data-settlement-root]');
  if (!(box instanceof HTMLElement)) return;
  let period = box.getAttribute('data-period') || 'day';
  let date = '';
  const hashQuery = new URLSearchParams((window.location.hash.split('?')[1] || ''));
  if (hashQuery.get('period')) period = hashQuery.get('period') || period;
  if (hashQuery.get('date')) date = hashQuery.get('date') || '';
  let activeLine = 'pay';
  let page = 1;
  let currentDate = date;
  let isBackfill = false;

  box.querySelectorAll('[data-settlement-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      period = btn.getAttribute('data-settlement-tab') || 'day';
      date = '';
      load();
    });
  });
  box.querySelector('[data-settlement-date]')?.addEventListener('change', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      date = target.value;
      load();
    }
  });
  box.querySelector('[data-settlement-print]')?.addEventListener('click', (event) => {
    if (!(event.currentTarget instanceof HTMLButtonElement) || event.currentTarget.disabled) return;
    const time = box.querySelector('[data-settlement-print-time]');
    if (time) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      time.textContent = `${C.printTime} ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
    document.documentElement.classList.add('is-settlement-printing');
    const cleanUp = () => {
      document.documentElement.classList.remove('is-settlement-printing');
    };
    window.addEventListener('afterprint', cleanUp, { once: true });
    window.setTimeout(cleanUp, 3000);
    window.print();
  });
  box.querySelectorAll('[data-settlement-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeLine = openKey(btn.getAttribute('data-settlement-open') || 'pay');
      page = 1;
      paintDetail();
    });
  });

  load();

  async function load() {
    const status = box.querySelector('[data-settlement-status]');
    const printBtn = box.querySelector('[data-settlement-print]');
    if (printBtn instanceof HTMLButtonElement) printBtn.disabled = true;
    const title = box.querySelector('[data-settlement-print-title]');
    const printLines = box.querySelector('[data-settlement-print-lines]');
    isBackfill = false;
    try {
      const data = await fetchSettlementReport(period, date);
      period = data.period || period;
      currentDate = data.date || date;
      box.setAttribute('data-period', period);
      syncTabs();
      syncDate();
      const fallback = defaultLines(period);
      const pTitle = formatPrintTitle(period, currentDate);

      if (data.state === 'in_progress') {
        if (status) status.textContent = C.inProgress;
        fillLines(fallback);
        if (title) title.textContent = pTitle;
        if (printLines) printLines.innerHTML = fallback.map((line) => `<p>${esc(line)}</p>`).join('');
        if (printBtn instanceof HTMLButtonElement) printBtn.disabled = false;
        return;
      }
      if (data.state === 'missing' || !data.report) {
        if (status) status.textContent = C.missing;
        fillLines(fallback);
        if (title) title.textContent = pTitle;
        if (printLines) printLines.innerHTML = fallback.map((line) => `<p>${esc(line)}</p>`).join('');
        if (printBtn instanceof HTMLButtonElement) printBtn.disabled = false;
        return;
      }
      if (data.state === 'ready') {
        if (status) status.textContent = '';
        const reportLines = Array.isArray(data.report?.body_lines) && data.report.body_lines.length === 5
          ? data.report.body_lines
          : fallback;
        isBackfill = Number(data.report?.is_backfill) === 1;
        fillLines(reportLines);
        if (title) title.textContent = data.report?.print_title || pTitle;
        if (printLines) printLines.innerHTML = reportLines.map((line) => `<p>${esc(line)}</p>`).join('');
        if (printBtn instanceof HTMLButtonElement) printBtn.disabled = false;
      }
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
      if (status) status.textContent = code === 'schema_missing' ? C.schemaMissing : C.missing;
      const fallback = defaultLines(period);
      fillLines(fallback);
      if (title) title.textContent = formatPrintTitle(period, currentDate || date);
      if (printLines) printLines.innerHTML = fallback.map((line) => `<p>${esc(line)}</p>`).join('');
      if (printBtn instanceof HTMLButtonElement) printBtn.disabled = false;
    }
  }

  function syncTabs() {
    box.querySelectorAll('[data-settlement-tab]').forEach((btn) => {
      btn.setAttribute('aria-selected', btn.getAttribute('data-settlement-tab') === period ? 'true' : 'false');
    });
  }

  function syncDate() {
    const input = box.querySelector('[data-settlement-date]');
    if (!(input instanceof HTMLInputElement)) return;
    if (period === 'month') {
      input.type = 'month';
      input.value = String(currentDate || '').slice(0, 7);
    } else {
      input.type = 'date';
      input.value = String(currentDate || '').slice(0, 10);
    }
  }

  function fillLines(lines) {
    const slots = box.querySelectorAll('[data-settlement-line]');
    slots.forEach((slot, index) => {
      const span = slot.querySelector('span');
      if (span) span.textContent = lines[index] || '';
    });
  }

  async function paintDetail() {
    const body = root.querySelector('[data-settlement-detail-body]') || root.querySelector('.admin-drawer__body');
    const drawer = root.querySelector('[data-admin-drawer="settlement-detail"]');
    if (!currentDate) {
      if (drawer) drawer.hidden = false;
      return;
    }
    try {
      const data = await fetchSettlementLines(period, currentDate, activeLine, page);
      const html = renderSettlementDetail(activeLine, data.items || [], data.page || page, data.total || 0, data.link || '', isBackfill);
      if (body) body.innerHTML = html;
      body?.querySelectorAll('[data-settlement-detail-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeLine = btn.getAttribute('data-settlement-detail-tab') || activeLine;
          page = 1;
          paintDetail();
        });
      });
      body?.querySelectorAll('[data-settlement-page]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (btn.hasAttribute('disabled')) return;
          page = Number(btn.getAttribute('data-settlement-page') || '1');
          paintDetail();
        });
      });
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
      if (body) body.innerHTML = `<p>${esc(code === 'schema_missing' ? C.schemaMissing : C.missing)}</p>`;
    }
    if (drawer) drawer.hidden = false;
  }
}
