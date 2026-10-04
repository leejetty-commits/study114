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
import { bindFindSurfaceEvents, refreshActiveResultItems } from '@search-ui/search-find-surface.js';
import { readStudyRoomProviderHomeBanner } from '@search-ui/search-map.js';
import { bindGuestListPagination } from '../list-pagination.js';
import { renderHomeMarketingBanner } from '../home-marketing-banner.js';
import { bindHomeNewsRow, renderHomeNewsRow } from '../home-news-row.js';
import { restoreMyshopScrollAndFocusIfPending } from '../myshop/return-snapshot.js';
import { getDefaultMypagePath } from '../mypage/router.js';
import { STUDY_ROOM_TOP_TABS } from '../study-room-reg/router.js';
import { STUDY_ROOM_HOME_BOX_COPY } from '../study-room-reg/study-room-reg-copy.js';
import {
  applyStudyRoomHomePromo,
  bootStudyRoomHome,
  bootStudyRoomStudentDemand,
  readStudyRoomMemberBox,
  primarySavedRegion,
  resolveStudyRoomMapQuery,
  pickOwnStudyRoom,
  studyRoomSecondaryPromoRegions,
} from '../study-room-home-seed.js';

const BOX = STUDY_ROOM_HOME_BOX_COPY;

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function statCell(label, value) {
  return `<span class="my-box__stat"><span class="my-box__stat-label">${label}</span><strong class="my-box__stat-val">${value}</strong></span>`;
}

/** 쪽지설정 탭이 있으면 그 문장을 포함하고, 없으면 쪽지 후기함 안내만 쓴다. */
function studyRoomInquiryGuide() {
  const hasInquiryMenu = STUDY_ROOM_TOP_TABS.some((tab) => tab.key === 'inquiries' && tab.label === '쪽지설정');
  return hasInquiryMenu ? BOX.inquiryGuide : BOX.messagesGuide;
}

function renderStudyRoomRegionPills() {
  const room = pickOwnStudyRoom();
  const primary = primarySavedRegion(room);
  const primaryLabel = String(primary?.region_label || '').trim();
  const pills = [];
  if (primaryLabel) pills.push({ label: primaryLabel, primary: true });
  for (const slot of studyRoomSecondaryPromoRegions(room)) {
    const label = String(slot.region_label || '').trim();
    if (label) pills.push({ label, primary: false });
  }
  return pills
    .map(
      (region) => `
    <span class="my-box__region-pill${region.primary ? ' is-primary' : ''}">
      ${esc(region.label)}${region.primary ? '<span class="tutor-region-tabs__primary">대표</span>' : ''}
    </span>`,
    )
    .join('');
}

function renderMyStudyRoomBox() {
  const mypagePath = getDefaultMypagePath('study_room');
  const box = readStudyRoomMemberBox();
  const views = box.views == null ? '—' : String(box.views);
  return `
    <aside class="my-box my-box--status" aria-label="${esc(BOX.badge)}">
      <div class="my-box__row my-box__row--1">
        <strong class="my-box__name">${esc(box.name)}</strong>
        <span class="my-box__badge">${esc(BOX.badge)}</span>
        <div class="my-box__actions my-box__actions--row">
          <a href="#/mypage/messages" class="btn btn--secondary btn--sm" data-nav="/mypage/messages">쪽지 후기함</a>
          <a href="#${mypagePath}" class="btn btn--primary btn--sm" data-nav="${mypagePath}">마이페이지</a>
        </div>
      </div>
      <div class="my-box__row my-box__row--2" aria-label="${esc(BOX.regionLabel)}">
        <span class="my-box__regions-label">${esc(BOX.regionLabel)}</span>
        <div class="my-box__regions-pills">${renderStudyRoomRegionPills()}
          <p class="my-box__guide">${esc(BOX.regionGuide)}</p>
        </div>
      </div>
      <div class="my-box__row my-box__row--3 my-box__stats-row">
        ${statCell('상태', esc(`쪽지 ${box.inquiry} · ${box.unread}개 미확인`))}
        <p class="my-box__guide">${esc(studyRoomInquiryGuide())}</p>
      </div>
      <div class="my-box__row my-box__row--4 my-box__stats-row">
        ${statCell('조회', esc(views))}
        ${statCell('등록', esc(box.registered))}
      </div>
    </aside>`;
}

function renderStudyRoomAreaCard() {
  const state = previewState.studyRoomFind;
  const mapQuery = resolveStudyRoomMapQuery(state, 'home');
  const regionLabel = mapQuery.picked ? mapQuery.query : mapQuery.promo_label;
  const items = Array.isArray(state.activeResultItems) ? state.activeResultItems : [];
  const status = readStudyRoomProviderHomeBanner({
    items,
    regionLabel,
    lat: null,
    lng: null,
    viewerRole: 'study_room',
  });
  return `
    <aside class="my-box my-box--status" aria-label="지역 요약" data-study-room-area-status>
      <div class="my-box__row my-box__row--1">
        <strong class="my-box__name">${esc(status.heading)}</strong>
      </div>
      <p class="my-box__guide">${esc(status.sub)}</p>
      <div class="my-box__row my-box__stats-row">
        <span class="my-box__stat"><span class="my-box__stat-label">공부방</span><strong class="my-box__stat-val">${esc(status.roomCount)}</strong></span>
      </div>
      <p class="my-box__guide">${esc(status.hint)}</p>
    </aside>`;
}

function renderStudyRoomSelfHero() {
  return `
    <section class="tutor-home-split" aria-label="공부방 홈 현황">
      ${renderMyStudyRoomBox()}
      ${renderStudyRoomAreaCard()}
    </section>`;
}

export function renderStudyRoom() {
  applyStudyRoomHomePromo(previewState.studyRoomFind);
  const tab = previewState.studyRoomTab;
  const showMyBox = isProviderHomeSelfTab('study_room', tab);
  if (showMyBox) {
    previewState.studyRoomFind.homeSelf = true;
    refreshActiveResultItems('room', previewState.studyRoomFind, 'study_room');
  }

  const content = `
    <div class="home-mkt-wrap">
      ${renderHomeMarketingBanner('study_room')}
      ${renderHomeNewsRow('study_room')}
    </div>
    ${renderProviderHomeTabs('study_room', tab)}
    ${showMyBox ? renderStudyRoomSelfHero() : ''}
    ${renderProviderHomeBody('study_room', tab, previewState.studyRoomFind, {
      hideHead: showMyBox,
      hideSearchCrossLink: showMyBox,
    })}
  `;

  return renderHomeShell('study_room', content, { showAuth: false, showRoleSwitch: false });
}

export function bindStudyRoomEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bindHomeNewsRow(root, { viewer: 'study_room', onRerender: rerender, sourceRoute: 'study_room' });
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
