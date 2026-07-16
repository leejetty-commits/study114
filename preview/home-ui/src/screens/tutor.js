import { MY_TUTOR } from '../data.js';
import { previewState, setTutorTab, resetTutorFind } from '../state.js';
import { renderHomeShell, renderAdInline, bindLayoutEvents } from '../layout.js';
import { renderCompareBar, bindUserActionEvents } from '../user-actions-ui.js';
import { bindCompareEvents } from '../compare-modal.js';
import { bindDetailDecisionEvents } from '../detail-decision/index.js';
import {
  renderProviderHomeTabs,
  renderProviderHomeBody,
  bindProviderHomeTabEvents,
  getProviderHomeMode,
  isProviderHomeSelfTab,
} from '../provider-home.js';
import { bindFindSurfaceEvents } from '@search-ui/search-find-surface.js';
import { bindGuestListPagination } from '../list-pagination.js';

function renderMyTutorBox() {
  return `
    <div class="my-box">
      <div class="my-box__label">내 과외쌤 박스</div>
      <div class="my-box__title">${MY_TUTOR.name}</div>
      <div class="my-box__stats">
        <span>과목 <strong>${MY_TUTOR.subject}</strong></span>
        <span>상태 <strong>${MY_TUTOR.status}</strong></span>
        <span>조회 <strong>${MY_TUTOR.views}</strong></span>
        <span>등록 <strong>${MY_TUTOR.registered}</strong></span>
      </div>
      <div style="margin-top:var(--space-4);display:flex;gap:var(--space-2);flex-wrap:wrap;">
        <button type="button" class="btn btn--primary btn--sm" data-action="edit-tutor">프로필 수정</button>
        <button type="button" class="btn btn--secondary btn--sm" data-action="register-tutor">과외 등록</button>
      </div>
    </div>
  `;
}

export function renderTutor() {
  const tab = previewState.tutorTab;
  const showMyBox = isProviderHomeSelfTab('tutor', tab);

  const content = `
    ${renderProviderHomeTabs('tutor', tab)}
    ${showMyBox ? renderMyTutorBox() : ''}
    ${renderProviderHomeBody('tutor', tab, previewState.tutorFind)}
    ${renderAdInline()}
    ${isProviderHomeSelfTab('tutor', tab) ? '' : renderCompareBar()}
  `;

  return renderHomeShell('tutor', content, { showAuth: false, showRoleSwitch: false });
}

export function bindTutorEvents(root, rerender) {
  bindLayoutEvents(root, rerender);

  bindProviderHomeTabEvents(root, rerender, {
    role: 'tutor',
    getTab: () => previewState.tutorTab,
    setTab: setTutorTab,
    resetFind: resetTutorFind,
  });

  bindFindSurfaceEvents(root, rerender, {
    getTab: () => getProviderHomeMode('tutor', previewState.tutorTab).searchTab,
    getState: () => previewState.tutorFind,
    role: 'tutor',
  });

  bindGuestListPagination(root, rerender);

  if (!isProviderHomeSelfTab('tutor', previewState.tutorTab)) {
    bindCompareEvents(root, true);
    bindUserActionEvents(root, rerender, { sourceRoute: 'tutor' });
  }

  bindDetailDecisionEvents(root, {
    onRerender: rerender,
    viewer: 'tutor',
    sourceRoute: 'tutor',
    getStudentItem: (id) => previewState.tutorFind.activeResultItems?.find((x) => x.id === id),
  });
}
