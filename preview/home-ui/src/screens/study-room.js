import { previewState, setStudyRoomTab, resetStudyRoomFind } from '../state.js';
import { renderHomeShell, bindLayoutEvents } from '../layout.js';
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
import { renderHomeMarketingBanner } from '../home-marketing-banner.js';
import { restoreMyshopScrollAndFocusIfPending } from '../myshop/return-snapshot.js';
import {
  applyStudyRoomHomePromo,
  bootStudyRoomHome,
  bootStudyRoomStudentDemand,
  readStudyRoomMemberBox,
} from '../study-room-home-seed.js';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function renderMyStudyRoomBox() {
  const box = readStudyRoomMemberBox();
  const views = box.views == null ? '—' : String(box.views);
  const unread = `${box.unread}개 미확인`;
  return `
    <aside class="my-box my-box--banner-panel" aria-label="내 공부방 박스">
      <div class="my-box__label">내 공부방 박스</div>
      <div class="my-box__title">${esc(box.name)}</div>
      <div class="my-box__stats">
        <span>수업지역 <strong>${esc(box.region)}</strong></span>
        <span>쪽지 <strong>${esc(box.inquiry)}</strong> · ${esc(unread)}</span>
        <span>조회 <strong>${esc(views)}</strong></span>
        <span>등록 <strong>${esc(box.registered)}</strong></span>
      </div>
      <div class="my-box__banner-actions">
        <a href="#/mypage/messages/reviews" class="my-box__link my-box__link--quiet" data-nav="/mypage/messages/reviews">쪽지 후기함 바로가기</a>
        <a href="#/mypage" class="btn btn--primary btn--sm" data-nav="/mypage">마이페이지</a>
      </div>
    </aside>
  `;
}

export function renderStudyRoom() {
  applyStudyRoomHomePromo(previewState.studyRoomFind);
  const tab = previewState.studyRoomTab;
  const showMyBox = isProviderHomeSelfTab('study_room', tab);

  const content = `
    <div class="home-mkt-wrap${showMyBox ? ' home-mkt-wrap--with-panel' : ''}">
      ${renderHomeMarketingBanner('study_room')}
      ${showMyBox ? `<div class="home-mkt-wrap__panel">${renderMyStudyRoomBox()}</div>` : ''}
    </div>
    ${renderProviderHomeTabs('study_room', tab)}
    ${renderProviderHomeBody('study_room', tab, previewState.studyRoomFind, {
      hideHead: showMyBox,
      hideSearchCrossLink: showMyBox,
    })}
  `;

  return renderHomeShell('study_room', content, { showAuth: false, showRoleSwitch: false });
}

export function bindStudyRoomEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bootStudyRoomHome(rerender);
  bootStudyRoomStudentDemand(rerender);

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

  restoreMyshopScrollAndFocusIfPending();
}
