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
  restoreStudyRoomHomePromoIndex,
  studyRoomPromoMapSlots,
  writeStudyRoomHomePromoIndex,
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

/** 쪽지 상태 한 줄. 안 읽은 쪽지(1개 이상)는 받는 중·끔 모두 붙인다. (11-17 종현) */
function inquiryStatusText(box) {
  const n = Number(box.unread) > 0 ? Number(box.unread) : 0;
  const unreadText = n >= 1 ? `안 읽은 쪽지 ${n}개` : '';
  if (box.inquiry === '안받음') return unreadText ? `쪽지 받지 않음 · ${unreadText}` : '쪽지 받지 않음';
  if (box.inquiry === '받음') return unreadText ? `쪽지 받는 중 · ${unreadText}` : '쪽지 받는 중';
  return unreadText || '—';
}

/** 쪽지설정 탭이 있으면 그 문장을 포함하고, 없으면 쪽지 후기함 안내만 쓴다. */
function studyRoomInquiryGuide() {
  const hasInquiryMenu = STUDY_ROOM_TOP_TABS.some((tab) => tab.key === 'inquiries' && tab.label === '쪽지설정');
  return hasInquiryMenu ? BOX.inquiryGuide : BOX.messagesGuide;
}

function isPrimaryPromoSlot(slot) {
  return Boolean(slot && (slot.is_primary === true || slot.is_primary === 1 || slot.is_primary === '1'));
}

function renderStudyRoomRegionPills() {
  const slots = studyRoomPromoMapSlots();
  const stored = previewState.studyRoomFind.studyRoomPromoIndex;
  const active = Number.isInteger(stored) ? stored : 0;
  return slots
    .map((slot, idx) => {
      const label = String(slot.region_label || '').trim();
      if (!label) return '';
      const primary = isPrimaryPromoSlot(slot);
      const cls = ['my-box__region-pill', primary ? 'is-primary' : '', active === idx ? 'is-active' : '']
        .filter(Boolean)
        .join(' ');
      return `<button type="button" class="${cls}" data-study-room-promo="${idx}" role="tab" aria-selected="${active === idx}">${esc(label)}${primary ? '<span class="tutor-region-tabs__primary">대표</span>' : ''}</button>`;
    })
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
        <span class="my-box__stat"><span class="my-box__stat-label">상태</span><strong class="my-box__stat-val" data-study-room-unread>${esc(inquiryStatusText(box))}</strong></span>
        <p class="my-box__guide">${esc(studyRoomInquiryGuide())}</p>
      </div>
      <div class="my-box__row my-box__row--4 my-box__stats-row">
        ${statCell('조회', esc(views))}
        ${statCell('등록', esc(box.registered))}
      </div>
    </aside>`;
}

function renderStudyRoomSelfHero() {
  return `
    <section class="tutor-home-split" aria-label="공부방 홈 현황">
      ${renderMyStudyRoomBox()}
    </section>`;
}

export function renderStudyRoom() {
  restoreStudyRoomHomePromoIndex(previewState.studyRoomFind);
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

let unreadSnapHook = false;

function hookUnreadAfterSnapshot() {
  if (unreadSnapHook) return;
  unreadSnapHook = true;
  window.addEventListener('auth:session-hydrated', (event) => {
    if (event.detail?.changed !== false) return;
    const el = document.querySelector('[data-study-room-unread]');
    if (!el) return;
    const box = readStudyRoomMemberBox();
    el.textContent = inquiryStatusText(box);
  });
}

export function bindStudyRoomEvents(root, rerender) {
  hookUnreadAfterSnapshot();
  bindLayoutEvents(root, rerender);
  bindHomeNewsRow(root, { viewer: 'study_room', onRerender: rerender, sourceRoute: 'study_room' });
  const promoIndex = previewState.studyRoomFind.studyRoomPromoIndex;
  bootStudyRoomHome(rerender, Number.isInteger(promoIndex) ? { slotIndex: promoIndex } : {});
  bootStudyRoomStudentDemand(rerender, { homePick: true, state: previewState.studyRoomFind });

  root.querySelectorAll('[data-study-room-promo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const raw = btn.getAttribute('data-study-room-promo') || '';
      if (!/^\d+$/.test(raw)) return;
      const idx = Number(raw);
      const state = previewState.studyRoomFind;
      if (state.studyRoomPromoIndex === idx) return;
      state.studyRoomPromoIndex = idx;
      writeStudyRoomHomePromoIndex(idx);
      state.searchExecuted = false;
      bootStudyRoomHome(rerender, { slotIndex: idx });
      rerender();
    });
  });

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
