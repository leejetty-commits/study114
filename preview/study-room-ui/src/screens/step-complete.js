import { registerState } from '../state.js';
import { applyRoomToState } from '../form-collect.js';
import { loadRoom } from '../register-api.js';
import { saveCurrentStep, withSaving } from '../save-flow.js';
import { buildRoomInputSummary } from '../summary.js';
import {
  renderRegisterShell,
  renderGuideNotice,
  renderPublishStatusBlock,
  renderMessageInquiryNotice,
  offerGoToMessageInquiry,
  bindGlobalEvents,
} from '../layout.js';

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
  const content = `
    <div class="register-complete">
      <div class="register-complete__icon" aria-hidden="true">✓</div>
      <h2 class="register-complete__title">입력 현황입니다</h2>
      <p class="register-complete__thanks">빈 칸이 있어도 여기서 끝낼 수 있습니다. 빠진 항목은 해당 단계에서 다시 채워 주세요.</p>
      <p class="register-complete__lead">아래는 저장된 전체 항목입니다. 비어 있는 칸은 아직 입력하지 않은 값입니다.</p>
    </div>
    ${renderPublishStatusBlock(s.profile_status, {
      inputId: 'complete_profile_status',
      lead: '등록을 마친 뒤 학부모 검색에 공개할지 정합니다. 저장만 하면 검색·목록에 나오지 않습니다. (20장: 저장 ≠ 공개)',
      extraHtml: `${renderMessageInquiryNotice()}<button type="button" class="btn btn--primary" data-action="save-publish">공개 상태 저장</button>`,
    })}
    ${renderGuideNotice('기본정보·상세1·상세2 화면에서 이어서 수정할 수 있습니다.')}
    <div class="register-overview">
      ${groups
        .map(
          (group) => `
        <h3 class="register-section-title">${esc(group.title)}</h3>
        <dl class="register-overview__dl">${renderSummaryRows(group.rows)}</dl>`,
        )
        .join('')}
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
  const publishBtn = root.querySelector('[data-action="save-publish"]');
  const statusSelect = root.querySelector('#complete_profile_status');

  publishBtn?.addEventListener('click', () => {
    withSaving(publishBtn, async () => {
      const next = String(statusSelect?.value || 'draft');
      registerState.profile_status = next;
      await saveCurrentStep(registerState, 'facility');
      alert(next === 'published' ? '공개 상태로 저장했습니다.' : '저장만(비공개)으로 두었습니다.');
      if (offerGoToMessageInquiry(registerState.study_room_id)) return;
      window.dispatchEvent(new Event('hashchange'));
    });
  });

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
