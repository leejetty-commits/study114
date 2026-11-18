import { adminFetch, adminHttpStatus } from './admin-fetch.js';
import '../styles/admin-member-mail.css';
import { esc, renderPanel } from './a28-screens-shared.js';

export const STATS_PATH = '/admin/stats';

const ENDPOINT = '/api/admin/stats.php';
const DAYS = [7, 14, 30];
const HELP = '테스트 계정·운영자·탈퇴 회원은 빼고 셉니다. 결제는 탈퇴 회원 것도 포함해요. 금액은 천원 단위예요.';
const LEAD = '실제 회원 기준 가입·카드·유료 이용·결제를 한눈에 봅니다.';
const LOADING = '불러오는 중이에요.';
const LOAD_FAILED = '불러오지 못했어요. 잠시 뒤 다시 열어 주세요.';
const FORBIDDEN = '최고관리자만 볼 수 있어요.';
const PAYMENT_NOTE = '대기·실패·취소 결제는 세지 않아요.';

const ROLE = { study_room: '공부방', tutor: '과외쌤', student: '학생' };
const SKU = { prime: '프라임', pick: '픽' };
const PG = { dev_mock: '모의 결제', portone_test: '포트원 테스트' };
const PRODUCT = { position: '노출상품(프라임·픽)', count: '쪽지권', badge_addon: '배지' };
const ACCOUNT = { study_room: '공부방', tutor: '과외쌤' };

/** @param {number} status */
function errorText(status) {
  if (status === 401 || status === 403) return FORBIDDEN;
  return LOAD_FAILED;
}

/** @param {number} won */
function cheonwon(won) {
  const n = Number(won);
  const value = Number.isFinite(n) ? n : 0;
  return `${(value / 1000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}천원`;
}

/** @param {string} role */
function roleLabel(role) {
  return ROLE[role] || role || '—';
}

/** @param {string} pg */
function pgLabel(pg) {
  return PG[pg] || pg || '—';
}

/** @param {string} kind */
function productLabel(kind) {
  return PRODUCT[kind] || kind || '—';
}

/** @param {string | null} type */
function accountLabel(type) {
  if (type == null || type === '') return '—';
  return ACCOUNT[type] || type;
}

/**
 * @param {Array<string | number>} cells
 * @param {string} [rowLabel]
 */
function numRow(cells, rowLabel) {
  const body = cells
    .map((cell, index) => {
      if (index === 0) return `<th scope="row">${esc(String(cell))}</th>`;
      return `<td class="member-mail__num">${esc(String(cell))}</td>`;
    })
    .join('');
  return `<tr${rowLabel ? ` class="${rowLabel}"` : ''}>${body}</tr>`;
}

/** @param {Record<string, number>} row */
function regionCountCells(row) {
  return [row.study_room, row.tutor, row.student, row.prime, row.pick]
    .map((cell) => `<td class="member-mail__num">${esc(String(cell ?? 0))}</td>`)
    .join('');
}

/** @param {string} id @param {string} name */
function regionToggle(id, name) {
  return `<button type="button" class="btn btn--secondary btn--sm" data-stats-region-toggle="${esc(id)}" aria-expanded="false">▸ ${esc(name)}</button>`;
}

/** @param {Record<string, number>} row */
function regionCells(label, row) {
  return numRow([label, row.study_room, row.tutor, row.student, row.prime, row.pick]);
}

/** @param {{ rows?: Array<Record<string, any>>, unclassified: Record<string, number>, total: Record<string, number> }} regions */
function regionTableRows(regions) {
  const lines = [];
  (regions.rows || []).forEach((row, index) => {
    const id = `r${index}`;
    const children = Array.isArray(row.children) ? row.children : [];
    const label = children.length ? regionToggle(id, String(row.sido ?? '')) : esc(String(row.sido ?? ''));
    lines.push(`<tr><th scope="row">${label}</th>${regionCountCells(row)}</tr>`);
    children.forEach((child, childIndex) => {
      const childId = `${id}-${childIndex}`;
      const grands = Array.isArray(child.children) ? child.children : [];
      const childLabel = grands.length ? regionToggle(childId, String(child.name ?? '')) : esc(String(child.name ?? ''));
      lines.push(`<tr data-stats-region-parent="${esc(id)}" hidden><th scope="row">└ ${childLabel}</th>${regionCountCells(child)}</tr>`);
      grands.forEach((grand) => {
        lines.push(`<tr data-stats-region-parent="${esc(childId)}" hidden><th scope="row">　　└ ${esc(String(grand.name ?? ''))}</th>${regionCountCells(grand)}</tr>`);
      });
    });
  });
  lines.push(regionCells('미분류', regions.unclassified));
  lines.push(regionCells('합계', regions.total));
  return lines.join('');
}

/**
 * @param {Array<Record<string, number | string | null>>} rows
 */
function paymentSum(rows) {
  return rows.reduce(
    (sum, row) => {
      sum.paid_count += Number(row.paid_count) || 0;
      sum.paid_won += Number(row.paid_won) || 0;
      sum.refund_requested_count += Number(row.refund_requested_count) || 0;
      sum.refund_requested_won += Number(row.refund_requested_won) || 0;
      sum.refunded_count += Number(row.refunded_count) || 0;
      sum.refunded_won += Number(row.refunded_won) || 0;
      sum.refund_won += Number(row.refund_won) || 0;
      return sum;
    },
    {
      paid_count: 0,
      paid_won: 0,
      refund_requested_count: 0,
      refund_requested_won: 0,
      refunded_count: 0,
      refunded_won: 0,
      refund_won: 0,
    },
  );
}

/** @param {ReturnType<typeof paymentSum>} sum @param {string} label */
function paymentTotalRow(label, sum) {
  return `<tr>
    <th scope="row">${esc(label)}</th>
    <td>—</td>
    <td>—</td>
    <td class="member-mail__num">${sum.paid_count}</td>
    <td class="member-mail__num">${esc(cheonwon(sum.paid_won))}</td>
    <td class="member-mail__num">${sum.refund_requested_count}</td>
    <td class="member-mail__num">${esc(cheonwon(sum.refund_requested_won))}</td>
    <td class="member-mail__num">${sum.refunded_count}</td>
    <td class="member-mail__num">${esc(cheonwon(sum.refunded_won))}</td>
    <td class="member-mail__num">${esc(cheonwon(sum.refund_won))}</td>
  </tr>`;
}

/** @param {Record<string, any>} data */
function renderStatsBody(data) {
  const top = data.top;
  const paid = top.paid_in_use;
  const paidLines = [`${paid.cards}`, `프라임 ${paid.prime} · 픽 ${paid.pick}`];
  if (paid.unlinked_rows > 0) paidLines.push(`카드 미지정 ${paid.unlinked_rows}건`);
  const cards = top.cards;
  const hub = `<div class="sup-admin-hub">
    <div class="sup-admin-hub__card"><span class="sup-admin-hub__title">전체 회원</span><span class="sup-admin-hub__desc">${top.members_total}</span></div>
    <div class="sup-admin-hub__card"><span class="sup-admin-hub__title">오늘 가입</span><span class="sup-admin-hub__desc">${top.signups_today}</span></div>
    <div class="sup-admin-hub__card"><span class="sup-admin-hub__title">등록 카드</span><span class="sup-admin-hub__desc">공부방 ${cards.study_room} · 과외쌤 ${cards.tutor} · 학생 ${cards.student}</span></div>
    <div class="sup-admin-hub__card"><span class="sup-admin-hub__title">유료 이용 중</span><span class="sup-admin-hub__desc">${paidLines.join('<br>')}</span></div>
    <div class="sup-admin-hub__card"><span class="sup-admin-hub__title">유료 전환 후보</span><span class="sup-admin-hub__desc">${top.candidates.free_cards + top.candidates.expiring_cards}<br>카드 없는 역할 회원 ${top.candidates.no_card_members}명</span></div>
    <div class="sup-admin-hub__card"><span class="sup-admin-hub__title">누적 결제</span><span class="sup-admin-hub__desc">${top.payments.count}건 · ${esc(cheonwon(top.payments.amount_won))}</span></div>
  </div>`;

  const signupRows = data.signups
    .map((row) => numRow([row.date, row.study_room, row.tutor, row.student, row.none, row.total]))
    .join('');
  const signupSum = data.signups.reduce(
    (sum, row) => {
      sum.study_room += row.study_room;
      sum.tutor += row.tutor;
      sum.student += row.student;
      sum.none += row.none;
      sum.total += row.total;
      return sum;
    },
    { study_room: 0, tutor: 0, student: 0, none: 0, total: 0 },
  );
  const signups = `<h3 class="admin-section-title">역할별 가입</h3>
    <div class="member-mail__table-wrap">
      <table class="sup-admin-table member-mail__table">
        <thead><tr>
          <th scope="col">날짜</th><th scope="col">공부방</th><th scope="col">과외쌤</th><th scope="col">학생</th><th scope="col">역할 미선택</th><th scope="col">합계</th>
        </tr></thead>
        <tbody>${signupRows}${numRow(['합계', signupSum.study_room, signupSum.tutor, signupSum.student, signupSum.none, signupSum.total])}</tbody>
      </table>
    </div>`;

  const regions = data.regions;
  const regionTable = `<h3 class="admin-section-title">지역</h3>
    <div class="member-mail__table-wrap">
      <table class="sup-admin-table member-mail__table">
        <thead><tr>
          <th scope="col">지역</th><th scope="col">공부방</th><th scope="col">과외쌤</th><th scope="col">학생</th><th scope="col">프라임</th><th scope="col">픽</th>
        </tr></thead>
        <tbody>${regionTableRows(regions)}</tbody>
      </table>
    </div>`;

  /** @type {Map<string, Array<Record<string, number | string | null>>>} */
  const groups = new Map();
  for (const row of data.payments) {
    const key = String(row.pg_provider ?? '');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const paymentBody = [];
  for (const [key, rows] of groups) {
    for (const row of rows) {
      paymentBody.push(`<tr>
        <th scope="row">${esc(pgLabel(String(row.pg_provider ?? '')))}</th>
        <td>${esc(productLabel(String(row.product_kind ?? '')))}</td>
        <td>${esc(accountLabel(row.provider_type == null ? null : String(row.provider_type)))}</td>
        <td class="member-mail__num">${row.paid_count}</td>
        <td class="member-mail__num">${esc(cheonwon(Number(row.paid_won) || 0))}</td>
        <td class="member-mail__num">${row.refund_requested_count}</td>
        <td class="member-mail__num">${esc(cheonwon(Number(row.refund_requested_won) || 0))}</td>
        <td class="member-mail__num">${row.refunded_count}</td>
        <td class="member-mail__num">${esc(cheonwon(Number(row.refunded_won) || 0))}</td>
        <td class="member-mail__num">${esc(cheonwon(Number(row.refund_won) || 0))}</td>
      </tr>`);
    }
    paymentBody.push(paymentTotalRow(`${pgLabel(key)} 소계`, paymentSum(rows)));
  }
  paymentBody.push(paymentTotalRow('합계', paymentSum(data.payments)));
  const paymentTable = `<h3 class="admin-section-title">결제</h3>
    <div class="member-mail__table-wrap">
      <table class="sup-admin-table member-mail__table">
        <thead><tr>
          <th scope="col">경로</th><th scope="col">상품</th><th scope="col">구매 계정</th>
          <th scope="col">결제 완료</th><th scope="col">결제 금액</th>
          <th scope="col">환불 요청</th><th scope="col">요청 금액</th>
          <th scope="col">환불 완료</th><th scope="col">완료 금액</th>
          <th scope="col">환불 확정액</th>
        </tr></thead>
        <tbody>${paymentBody.join('')}</tbody>
      </table>
    </div>
    <p class="a28-help">${esc(PAYMENT_NOTE)}</p>`;

  const free = data.candidates.free_cards;
  const expiring = data.candidates.expiring;
  const noCard = data.candidates.no_card;
  const freeRows = free.items.length
    ? free.items.map((item) => `<tr><td>${esc(roleLabel(item.role))}</td><td>${esc(item.name)}</td><td>${esc(item.region)}</td><td>${esc(item.signed_up_on)}</td></tr>`).join('')
    : '<tr><td colspan="4">없어요.</td></tr>';
  const expiringRows = expiring.items.length
    ? expiring.items
        .map(
          (item) => `<tr><td>${esc(roleLabel(item.role))}</td><td>${esc(item.name)}</td><td>${esc(item.region)}</td><td>${esc(SKU[item.sku] || item.sku)}</td><td class="member-mail__num">${item.days_left}</td><td>${esc(item.signed_up_on)}</td></tr>`,
        )
        .join('')
    : '<tr><td colspan="6">없어요.</td></tr>';
  const freeNote = free.total > free.items.length ? '<p class="a28-help">목록은 50건까지예요.</p>' : '';
  const expiringNote = expiring.total > expiring.items.length ? '<p class="a28-help">목록은 50건까지예요.</p>' : '';
  const candidates = `<h3 class="admin-section-title">유료 전환 후보</h3>
    <h3 class="admin-section-title">무료 카드 ${free.total}</h3>
    ${freeNote}
    <div class="member-mail__table-wrap">
      <table class="sup-admin-table member-mail__table">
        <thead><tr><th scope="col">역할</th><th scope="col">카드 이름</th><th scope="col">지역</th><th scope="col">가입일</th></tr></thead>
        <tbody>${freeRows}</tbody>
      </table>
    </div>
    <h3 class="admin-section-title">곧 끝나는 유료 ${expiring.total}</h3>
    ${expiringNote}
    <div class="member-mail__table-wrap">
      <table class="sup-admin-table member-mail__table">
        <thead><tr><th scope="col">역할</th><th scope="col">카드 이름</th><th scope="col">지역</th><th scope="col">상품</th><th scope="col">남은 일수</th><th scope="col">가입일</th></tr></thead>
        <tbody>${expiringRows}</tbody>
      </table>
    </div>
    <h3 class="admin-section-title">카드 없는 역할 회원</h3>
    <p class="a28-help">공부방 ${noCard.study_room_owner}명 · 과외쌤 ${noCard.tutor}명 · 학생 ${noCard.guardian_student}명</p>`;

  return `${hub}${signups}${regionTable}${paymentTable}${candidates}`;
}

export function renderStats() {
  const tabs = DAYS.map(
    (d) => `<button type="button" class="btn btn--secondary btn--sm" data-stats-days="${d}" aria-pressed="${d === 14 ? 'true' : 'false'}">${d}일</button>`,
  ).join('');
  return renderPanel(
    '통계',
    'A28-STATS',
    `<div data-stats-root>
       <p class="a28-help">${esc(HELP)}</p>
       <div class="member-mail__actions" role="group" aria-label="가입 기간">${tabs}</div>
       <div data-stats-body><p class="a28-help" role="status">${esc(LOADING)}</p></div>
     </div>`,
    { lead: esc(LEAD) },
  );
}

/** @param {ParentNode} root */
export function bindStats(root) {
  const box = root.querySelector('[data-stats-root]');
  if (!(box instanceof HTMLElement) || box.dataset.bound === '1') return;
  box.dataset.bound = '1';
  const body = box.querySelector('[data-stats-body]');
  let seq = 0;

  /** @param {number} days */
  async function load(days) {
    const picked = DAYS.includes(days) ? days : 14;
    const mine = ++seq;
    box.querySelectorAll('[data-stats-days]').forEach((button) => {
      button.setAttribute('aria-pressed', button.getAttribute('data-stats-days') === String(picked) ? 'true' : 'false');
    });
    if (body) body.innerHTML = `<p class="a28-help" role="status">${esc(LOADING)}</p>`;
    let html;
    try {
      const res = await adminFetch(`${ENDPOINT}?days=${picked}`);
      const data = await res.json().catch(() => ({}));
      html = res.ok && data.ok
        ? renderStatsBody(data)
        : `<p class="a28-help" role="alert">${esc(errorText(adminHttpStatus(res, data)))}</p>`;
    } catch {
      html = `<p class="a28-help" role="alert">${esc(LOAD_FAILED)}</p>`;
    }
    if (mine === seq && body) body.innerHTML = html;
  }

  /** @param {Element} button @param {boolean} open */
  function setRegionToggle(button, open) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    const name = (button.textContent || '').replace(/^[▸▾]\s*/, '');
    button.textContent = `${open ? '▾' : '▸'} ${name}`;
  }

  /** @param {string} id */
  function hideRegionBranch(id) {
    box.querySelectorAll('[data-stats-region-parent]').forEach((row) => {
      const parent = row.getAttribute('data-stats-region-parent') || '';
      if (parent !== id && !parent.startsWith(`${id}-`)) return;
      if (row instanceof HTMLElement) row.hidden = true;
      row.querySelectorAll('[data-stats-region-toggle]').forEach((child) => setRegionToggle(child, false));
    });
  }

  box.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const daysButton = target ? target.closest('[data-stats-days]') : null;
    if (daysButton) {
      load(Number(daysButton.getAttribute('data-stats-days')) || 14);
      return;
    }
    const regionButton = target ? target.closest('[data-stats-region-toggle]') : null;
    if (!regionButton) return;
    const id = regionButton.getAttribute('data-stats-region-toggle') || '';
    const open = regionButton.getAttribute('aria-expanded') !== 'true';
    setRegionToggle(regionButton, open);
    if (open) {
      box.querySelectorAll(`[data-stats-region-parent="${CSS.escape(id)}"]`).forEach((row) => {
        if (row instanceof HTMLElement) row.hidden = false;
      });
      return;
    }
    hideRegionBranch(id);
  });
  load(14);
}
