import { MY_STUDY_ROOM } from '../data.js';
import { previewState, setStudyRoomTab, resetStudyRoomFind } from '../state.js';
import { renderHomeShell, renderAdInline, bindLayoutEvents } from '../layout.js';
import { bindCompareEvents } from '../compare-modal.js';
import { bindUserActionEvents } from '../user-actions-ui.js';
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
import { STUDY_ROOM_REGISTER_URL } from '../../../shared/preview-links.js';

function renderMyStudyRoomBox() {
  return `
    <div class="my-box">
      <div class="my-box__label">내 공부방 박스</div>
      <div class="my-box__title">${MY_STUDY_ROOM.name}</div>
      <div class="my-box__stats">
        <span>상태 <strong>${MY_STUDY_ROOM.status}</strong></span>
        <span>조회 <strong>${MY_STUDY_ROOM.views}</strong></span>
        <span>문의 <strong>${MY_STUDY_ROOM.inquiries}</strong></span>
        <span>등록 <strong>${MY_STUDY_ROOM.registered}</strong></span>
      </div>
      <div style="margin-top:var(--space-4);display:flex;gap:var(--space-2);flex-wrap:wrap;">
        <button type="button" class="btn btn--primary btn--sm" data-action="edit-room" data-href="${STUDY_ROOM_REGISTER_URL}">공부방 수정</button>
        <button type="button" class="btn btn--secondary btn--sm" data-action="manage-room">등록 관리</button>
      </div>
    </div>
  `;
}

export function renderStudyRoom() {
  const tab = previewState.studyRoomTab;
  const showMyBox = isProviderHomeSelfTab('study_room', tab);

  const content = `
    ${renderProviderHomeTabs('study_room', tab)}
    ${showMyBox ? renderMyStudyRoomBox() : ''}
    ${renderProviderHomeBody('study_room', tab, previewState.studyRoomFind)}
    ${renderAdInline()}
  `;

  return renderHomeShell('study_room', content, { showAuth: false, showRoleSwitch: false });
}

export function bindStudyRoomEvents(root, rerender) {
  bindLayoutEvents(root, rerender);

  bindProviderHomeTabEvents(root, rerender, {
    role: 'study_room',
    getTab: () => previewState.studyRoomTab,
    setTab: setStudyRoomTab,
    resetFind: resetStudyRoomFind,
  });

  bindFindSurfaceEvents(root, rerender, {
    getTab: () => getProviderHomeMode('study_room', previewState.studyRoomTab).searchTab,
    getState: () => previewState.studyRoomFind,
    role: 'study_room',
  });

  bindGuestListPagination(root, rerender);

  bindCompareEvents(root, true);
  bindUserActionEvents(root, rerender, { sourceRoute: 'study_room' });

  bindDetailDecisionEvents(root, {
    onRerender: rerender,
    viewer: 'study_room',
    sourceRoute: 'study_room',
    getStudentItem: (id) => previewState.studyRoomFind.activeResultItems?.find((x) => x.id === id),
  });
}
