import '../styles/admin-member-mail.css';
import { withdrawReasonLabel } from '../withdraw-reason-copy.js';
import { esc, renderPanel } from './a28-screens-shared.js';

/** 관리자 「회원관리 › 탈퇴 사유」 (정본 74 §1-4) */
export const WITHDRAW_REASONS_PATH = '/admin/members/withdraw-reasons';

const ENDPOINT = '/api/admin/withdraw-reasons.php';
const DAYS = [30, 90, 365];

const C = {
  title: '탈퇴 사유',
  lead: '탈퇴할 때나 탈퇴 완료 메일에서 회원이 알려 준 이유를 모아 봐요.',
  members: '탈퇴한 회원 번호와 가린 이름으로 보여요. 이메일·연락처는 탈퇴 때 지워져 여기에도 없어요.',
  loading: '불러오는 중이에요.',
  loadFailed: '불러오지 못했어요. 잠시 뒤 다시 열어 주세요.',
  schemaMissing: '탈퇴 사유 표가 없어요. sql/schema/080_withdraw_reasons.sql 적용이 필요해요.',
  forbidden: '권한이 없어요. 관리자 계정으로 다시 로그인해 주세요.',
  /** @param {number} d */
  period: (d) => (d === 365 ? '최근 1년' : `최근 ${d}일`),
  /** @param {number} total @param {number} fromWithdraw @param {number} fromMail */
  summary: (total, fromWithdraw, fromMail) => `알려 준 이유 ${total}건 · 탈퇴 화면 ${fromWithdraw}건 · 메일 ${fromMail}건`,
  empty: '이 기간에 모인 이유가 없어요.',
  colReason: '이유',
  colStudyRoom: '공부방',
  colTutor: '과외쌤',
  colStudent: '학생·학부모',
  colTotal: '합계',
  unknownNote: '역할을 알 수 없는 회원의 이유는 합계에만 들어가요.',
  listTitle: '알려 준 이유 목록',
  /** @param {number} limit */
  listNote: (limit) => `최근 ${limit}건까지 보여요. 회원 번호는 답한 날로부터 1년이 지나면 지워져요.`,
  colOn: '답한 날',
  colMember: '회원 번호',
  colName: '이름',
  colWithdrawnOn: '탈퇴일',
  colRole: '역할',
  colNote: '한 줄',
  colSource: '받은 곳',
};

const LIST_LIMIT = 100;
const ROLE_NAMES = { study_room: '공부방', tutor: '과외쌤', student: '학생·학부모' };
const SOURCE_NAMES = { withdraw: '탈퇴 화면', mail: '메일' };
const NONE = '—';

/**
 * @typedef {{ code: string, study_room: number, tutor: number, student: number, unknown: number, total: number }} ReasonRow
 * @typedef {{ on: string, user_id: number | null, name: string, withdrawn_on: string, role: string, code: string, note: string, source: string }} ReasonItem
 * @typedef {{ days: number, since: string, total: number, by_source: { withdraw: number, mail: number }, rows: ReasonRow[], list: ReasonItem[] }} ReasonSummary
 */

/** @param {ReasonItem} n */
function listRow(n) {
  return `<tr>
        <td>${esc(n.on)}</td>
        <td class="member-mail__num">${n.user_id ? esc(String(n.user_id)) : NONE}</td>
        <td>${n.user_id && n.name ? esc(n.name) : NONE}</td>
        <td>${n.user_id && n.withdrawn_on ? esc(n.withdrawn_on) : NONE}</td>
        <td>${esc(ROLE_NAMES[n.role] || '역할 모름')}</td>
        <td>${esc(withdrawReasonLabel(n.role, n.code))}</td>
        <td>${n.note ? esc(n.note) : NONE}</td>
        <td>${esc(SOURCE_NAMES[n.source] || n.source)}</td>
      </tr>`;
}

/** @param {ReasonSummary} s */
export function renderWithdrawReasonsBody(s) {
  if (s.total === 0) {
    return `<p class="a28-help">${esc(C.empty)}</p>`;
  }
  const rows = s.rows
    .filter((r) => r.total > 0)
    .map(
      (r) => `<tr>
        <th scope="row">${esc(withdrawReasonLabel('', r.code))}</th>
        <td class="member-mail__num">${r.study_room}</td>
        <td class="member-mail__num">${r.tutor}</td>
        <td class="member-mail__num">${r.student}</td>
        <td class="member-mail__num"><strong>${r.total}</strong></td>
      </tr>`,
    )
    .join('');
  const hasUnknown = s.rows.some((r) => r.unknown > 0);
  return `
    <p class="a28-help"><strong>${esc(C.summary(s.total, s.by_source.withdraw, s.by_source.mail))}</strong></p>
    <div class="member-mail__table-wrap">
      <table class="sup-admin-table member-mail__table">
        <thead><tr>
          <th scope="col">${esc(C.colReason)}</th><th scope="col">${esc(C.colStudyRoom)}</th><th scope="col">${esc(C.colTutor)}</th>
          <th scope="col">${esc(C.colStudent)}</th><th scope="col">${esc(C.colTotal)}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${hasUnknown ? `<p class="a28-help">${esc(C.unknownNote)}</p>` : ''}
    <h3 class="admin-section-title">${esc(C.listTitle)}</h3>
    <p class="a28-help">${esc(C.listNote(LIST_LIMIT))}</p>
    <div class="member-mail__table-wrap">
      <table class="sup-admin-table member-mail__table">
        <thead><tr>
          <th scope="col">${esc(C.colOn)}</th><th scope="col">${esc(C.colMember)}</th><th scope="col">${esc(C.colName)}</th>
          <th scope="col">${esc(C.colWithdrawnOn)}</th><th scope="col">${esc(C.colRole)}</th><th scope="col">${esc(C.colReason)}</th>
          <th scope="col">${esc(C.colNote)}</th><th scope="col">${esc(C.colSource)}</th>
        </tr></thead>
        <tbody>${s.list.map(listRow).join('')}</tbody>
      </table>
    </div>`;
}

export function renderWithdrawReasons() {
  const tabs = DAYS.map(
    (d, i) =>
      `<button type="button" class="btn btn--secondary btn--sm" data-withdraw-reasons-days="${d}" aria-pressed="${i === 0 ? 'true' : 'false'}">${esc(C.period(d))}</button>`,
  ).join('');
  return renderPanel(
    C.title,
    'A28-02w',
    `<div data-withdraw-reasons-root>
       <p class="a28-help">${esc(C.members)}</p>
       <div class="member-mail__actions" role="group" aria-label="기간">${tabs}</div>
       <div data-withdraw-reasons-body><p class="a28-help" role="status">${esc(C.loading)}</p></div>
     </div>`,
    { lead: esc(C.lead) },
  );
}

/** 닷홈은 4xx 본문을 자기 오류 페이지로 바꾸므로 상태 코드로 고른다. @param {number} status */
function errorText(status) {
  if (status === 503) return C.schemaMissing;
  if (status === 401 || status === 403) return C.forbidden;
  return C.loadFailed;
}

/** @param {ParentNode} root */
export function bindWithdrawReasons(root) {
  const box = root.querySelector('[data-withdraw-reasons-root]');
  if (!(box instanceof HTMLElement) || box.dataset.bound === '1') return;
  box.dataset.bound = '1';
  const body = box.querySelector('[data-withdraw-reasons-body]');
  let seq = 0;

  /** @param {number} days */
  async function load(days) {
    const mine = ++seq;
    box.querySelectorAll('[data-withdraw-reasons-days]').forEach((b) => {
      b.setAttribute('aria-pressed', b.getAttribute('data-withdraw-reasons-days') === String(days) ? 'true' : 'false');
    });
    if (body) body.innerHTML = `<p class="a28-help" role="status">${esc(C.loading)}</p>`;
    let html;
    try {
      const res = await fetch(`${ENDPOINT}?days=${days}`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      html = res.ok && data.ok ? renderWithdrawReasonsBody(data) : `<p class="a28-help" role="alert">${esc(errorText(res.status))}</p>`;
    } catch {
      html = `<p class="a28-help" role="alert">${esc(C.loadFailed)}</p>`;
    }
    if (mine === seq && body) body.innerHTML = html;
  }

  box.addEventListener('click', (event) => {
    const btn = event.target instanceof Element ? event.target.closest('[data-withdraw-reasons-days]') : null;
    if (btn) load(Number(btn.getAttribute('data-withdraw-reasons-days')) || DAYS[0]);
  });
  load(DAYS[0]);
}
