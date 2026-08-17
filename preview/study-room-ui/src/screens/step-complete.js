import { registerState } from '../state.js';
import { applyRoomToState } from '../form-collect.js';
import { loadRoom } from '../register-api.js';
import { buildRoomInputSummary } from '../summary.js';
import { renderRegisterShell, renderGuideNotice, bindGlobalEvents, mypageRegistrationsUrl } from '../layout.js';
import { homeUiUrl } from '../../../shared/preview-links.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function renderSummaryRows(rows) {
  return rows
    .map((row) => {
      const empty = !String(row.value ?? '').trim();
      const valueHtml = empty ? '' : esc(row.value).replace(/\n/g, '<br />');
      return `
        <div class="register-overview__row${empty ? ' is-empty' : ''}">
          <dt>${esc(row.label)}</dt>
          <dd><span>${valueHtml}</span></dd>
        </div>`;
    })
    .join('');
}

let hydratingComplete = false;

export function renderComplete() {
  const s = registerState;
  const groups = buildRoomInputSummary(s);
  const skipped = s.detail_completion_status !== 'expanded_complete';
  const content = `
    <div class="register-complete">
      <div class="register-complete__icon" aria-hidden="true">✓</div>
      <h2 class="register-complete__title">${skipped ? '지금까지 입력한 내용입니다' : '공부방 등록이 완료되었습니다'}</h2>
      <p class="register-complete__thanks">${skipped ? '상세등록은 마이페이지에서 이어서 채울 수 있습니다.' : '수고하셨습니다!'}</p>
      <p class="register-complete__lead">아래는 저장된 전체 항목입니다. 비어 있는 칸은 아직 입력하지 않은 값입니다.</p>
    </div>
    ${renderGuideNotice('내용을 다시 손보고 싶으면 마이페이지 · 내 등록에서 수정할 수 있습니다.')}
    <div class="register-overview">
      ${groups
        .map(
          (group) => `
        <h3 class="register-section-title">${esc(group.title)}</h3>
        <dl class="register-overview__dl">${renderSummaryRows(group.rows)}</dl>`,
        )
        .join('')}
    </div>
    <div class="register-nav" style="border-top:none;padding-top:var(--space-2);">
      <a href="${mypageRegistrationsUrl()}" class="btn btn--secondary">마이페이지에서 수정</a>
      <a href="${homeUiUrl('study-room')}" class="btn btn--primary">공부방 메인으로</a>
    </div>
  `;
  return renderRegisterShell(content, {
    stepKey: 'complete',
    title: '입력 내용 확인',
    subtitle: '입력된 값과 비어 있는 값을 함께 보여 줍니다.',
  });
}

export function bindCompleteEvents(root) {
  bindGlobalEvents(root);
  if (!registerState.completeNeedsHydrate || hydratingComplete) return;
  hydratingComplete = true;
  loadRoom()
    .then((room) => {
      if (room) applyRoomToState(registerState, room);
      registerState.completeNeedsHydrate = false;
      window.dispatchEvent(new Event('hashchange'));
    })
    .catch(() => {
      registerState.completeNeedsHydrate = false;
    })
    .finally(() => {
      hydratingComplete = false;
    });
}
