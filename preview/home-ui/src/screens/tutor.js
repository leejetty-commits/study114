import { previewState, setTutorTab, resetTutorFind } from '../state.js';
import { renderHomeShell, bindLayoutEvents } from '../layout.js';
import { renderCompareBar, bindUserActionEvents } from '../user-actions-ui.js';
import { bindCompareEvents } from '../compare-modal.js';
import { bindDetailDecisionEvents } from '../detail-decision/index.js';
import {
  renderProviderHomeTabs,
  renderProviderHomeBody,
  bindProviderHomeTabEvents,
  getProviderHomeMode,
  isProviderHomeSelfTab,
  renderSearchCrossLink,
} from '../provider-home.js';
import { bindFindSurfaceEvents } from '@search-ui/search-find-surface.js';
import { bindGuestListPagination } from '../list-pagination.js';
import { renderTutorActivityBars, bootTutorActivityCounts } from '../tutor-activity-chart.js';
import { renderHomeMarketingBanner } from '../home-marketing-banner.js';
import { bindHomeNewsRow, renderHomeNewsRow } from '../home-news-row.js';
import { restoreMyshopScrollAndFocusIfPending } from '../myshop/return-snapshot.js';
import { bootTutorHome, readTutorMemberBox, readTutorHomeRegions } from '../tutor-home-seed.js';
import { getDefaultMypagePath } from '../mypage/router.js';

/**
 * 시트(임시.cell) 행=가로줄:
 * 1행 표시명 | 과외쌤 박스 | 쪽지 후기함 | 마이페이지
 * 2행 활동지역 | 저장된 지역 1~3 (지역 1이 대표)
 * 3행 과목 | 쪽지 받음/안받음 · N개 미확인
 * 4행 조회 | 등록
 */

function escTutor(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function renderTutorRegionPills() {
  const loaded = readTutorHomeRegions();
  const regions = Array.isArray(loaded) ? loaded.slice(0, 3) : [];
  while (regions.length < 3) regions.push({ label: '', primary: false });
  return regions
    .map((region) => {
      const label = region.label || (loaded ? '미선택' : '…');
      const primary = !!region.primary && !!region.label;
      return `
    <span class="my-box__region-pill${primary ? ' is-primary' : ''}">
      ${escTutor(label)}${primary ? '<span class="tutor-region-tabs__primary">대표</span>' : ''}
    </span>`;
    })
    .join('');
}

function renderStatusBoxShell({ label, title, actionsHtml, regionsHtml, statsRow1, statsRow2 }) {
  return `
    <aside class="my-box my-box--status" aria-label="${label}">
      <div class="my-box__row my-box__row--1">
        <strong class="my-box__name">${title}</strong>
        <span class="my-box__badge">${label}</span>
        <div class="my-box__actions my-box__actions--row">${actionsHtml}</div>
      </div>
      <div class="my-box__row my-box__row--2" aria-label="활동 지역">
        <span class="my-box__regions-label">활동지역</span>
        <div class="my-box__regions-pills">${regionsHtml}</div>
      </div>
      <div class="my-box__row my-box__row--3 my-box__stats-row">
        ${statsRow1}
      </div>
      <div class="my-box__row my-box__row--4 my-box__stats-row">
        ${statsRow2}
      </div>
    </aside>`;
}

function statCell(label, value) {
  return `<span class="my-box__stat"><span class="my-box__stat-label">${label}</span><strong class="my-box__stat-val">${value}</strong></span>`;
}

/** 좌측: 내 현황 (시트 4행 가로) */
function renderMyTutorStatusBox() {
  const mypagePath = getDefaultMypagePath('tutor');
  const box = readTutorMemberBox();
  return renderStatusBoxShell({
    label: '과외쌤 박스',
    title: escTutor(box.name),
    actionsHtml: `
      <a href="#/mypage/messages" class="btn btn--secondary btn--sm" data-nav="/mypage/messages">쪽지 후기함</a>
      <a href="#${mypagePath}" class="btn btn--primary btn--sm" data-nav="${mypagePath}">마이페이지</a>`,
    regionsHtml: `${renderTutorRegionPills()}
      <p class="my-box__guide">활동지역을 수정하려면 '마이페이지-내 등록-기본등록'에서 해 주세요.</p>`,
    statsRow1: [
      statCell('과목', escTutor(box.subject)),
      statCell('상태', escTutor(`${box.inquiry} · ${box.unread}개 미확인`)),
      `<p class="my-box__guide">쪽지설정을 수정하려면 마이페이지-내 등록-쪽지설정에서 해 주세요. 쪽지는 '쪽지 후기함'에서 확인하세요.</p>`,
    ].join(''),
    statsRow2: [
      statCell('조회', escTutor(box.views)),
      statCell('등록', escTutor(box.registered)),
    ].join(''),
  });
}

/**
 * 우측: 활동형 시각 박스 (지도 대체)
 * — 활동지역 1~3 공급/수요 막대 · 클릭해도 화면은 바뀌지 않음
 */
function renderTutorActivityPanel() {
  return `
    <aside class="my-box my-box--status my-box--activity" aria-label="활동지역 분포">
      <div class="my-box__row my-box__row--1">
        <strong class="my-box__name">활동지역 분포</strong>
        <div class="my-box__actions my-box__actions--row">
          ${renderSearchCrossLink('tutor', 'tutor', { inline: true })}
        </div>
      </div>
      <p class="act-panel__lead">현재 활동지역별 과외쌤 등록과 학생 수요를 한눈에 확인하세요.</p>
      ${renderTutorActivityBars({ interactive: false })}
    </aside>`;
}

function renderTutorSelfHero() {
  return `
    <section class="tutor-home-split" aria-label="과외쌤 홈 현황">
      ${renderMyTutorStatusBox()}
      ${renderTutorActivityPanel()}
    </section>`;
}

export function renderTutor() {
  const tab = previewState.tutorTab;
  const showMyBox = isProviderHomeSelfTab('tutor', tab);

  const content = `
    ${renderHomeMarketingBanner('tutor')}
    ${renderHomeNewsRow('tutor')}
    ${renderProviderHomeTabs('tutor', tab)}
    ${showMyBox ? renderTutorSelfHero() : ''}
    ${renderProviderHomeBody('tutor', tab, previewState.tutorFind, {
      hideHead: showMyBox,
      hideRegionBar: showMyBox,
      hideSearchCrossLink: showMyBox,
      hideSelfNote: true,
    })}
    ${isProviderHomeSelfTab('tutor', tab) ? '' : renderCompareBar()}
  `;

  return renderHomeShell('tutor', content, { showAuth: false, showRoleSwitch: false });
}

export function bindTutorEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bindHomeNewsRow(root, { viewer: 'tutor', onRerender: rerender, sourceRoute: 'tutor' });
  bootTutorHome(rerender);
  bootTutorActivityCounts(rerender);

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

  bindCompareEvents(root, true);
  bindUserActionEvents(root, rerender, { sourceRoute: 'tutor' });

  bindDetailDecisionEvents(root, {
    onRerender: rerender,
    viewer: 'tutor',
    sourceRoute: 'tutor',
    getStudentItem: (id) => previewState.tutorFind.activeResultItems?.find((x) => x.id === id),
  });

  restoreMyshopScrollAndFocusIfPending();
}
