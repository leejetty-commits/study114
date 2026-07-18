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
  renderSearchCrossLink,
} from '../provider-home.js';
import { bindFindSurfaceEvents } from '@search-ui/search-find-surface.js';
import { bindGuestListPagination } from '../list-pagination.js';
import { MOCK_TUTOR_REGIONS } from '@search-ui/search-schema.js';
import { TUTOR_REGISTER_URL } from '../../../shared/preview-links.js';
import { renderTutorActivityBars } from '../tutor-activity-chart.js';

/**
 * 시트(임시.cell) 행=가로줄:
 * 1행 김우동 | 과외쌤 박스 | 마이페이지 | 과외등록
 * 2행 활동지역 | 서울시 대표 | 부산시 | 인천시
 * 3행 과목 | 상태 | 조회
 * 4행 메모 | 보낸메모 | 등록
 */

function renderTutorRegionPills(activeIndex = 0) {
  return MOCK_TUTOR_REGIONS.map(
    (region, idx) => `
    <button type="button" class="my-box__region-pill${region.primary ? ' is-primary' : ''}${idx === activeIndex ? ' is-active' : ''}"
      data-tutor-region="${idx}" aria-pressed="${idx === activeIndex}">
      ${region.label}${region.primary ? '<span class="tutor-region-tabs__primary">대표</span>' : ''}
    </button>`,
  ).join('');
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

function resolveActiveTutorRegionIndex() {
  const idx = Number(previewState.tutorFind?.tutorRegionIndex);
  return Number.isFinite(idx) && idx >= 0 && idx < MOCK_TUTOR_REGIONS.length ? idx : 0;
}

/** 좌측: 내 현황 (시트 4행 가로) */
function renderMyTutorStatusBox() {
  const activeIdx = resolveActiveTutorRegionIndex();
  return renderStatusBoxShell({
    label: '과외쌤 박스',
    title: MY_TUTOR.name,
    actionsHtml: `
      <a href="#/mypage/home" class="btn btn--primary btn--sm" data-nav="/mypage/home">마이페이지</a>
      <a href="${TUTOR_REGISTER_URL}" class="btn btn--secondary btn--sm" data-util-href="${TUTOR_REGISTER_URL}">과외등록</a>`,
    regionsHtml: renderTutorRegionPills(activeIdx),
    statsRow1: [
      statCell('과목', MY_TUTOR.subject),
      statCell('상태', MY_TUTOR.status),
      statCell('조회', MY_TUTOR.views),
    ].join(''),
    statsRow2: [
      statCell('메모', MY_TUTOR.memoInbox ?? '—'),
      statCell('보낸메모', MY_TUTOR.memoSent ?? '—'),
      statCell('등록', MY_TUTOR.registered),
    ].join(''),
  });
}

/**
 * 우측: 활동형 시각 박스 (지도 대체)
 * — 활동지역 1~3 공급/수요 막대 · 행 클릭 시 지역 전환
 */
function renderTutorActivityPanel() {
  const activeIdx = resolveActiveTutorRegionIndex();
  return `
    <aside class="my-box my-box--status my-box--activity" aria-label="활동지역 분포">
      <div class="my-box__row my-box__row--1">
        <strong class="my-box__name">활동지역 분포</strong>
        <span class="my-box__badge">활동형</span>
        <div class="my-box__actions my-box__actions--row">
          ${renderSearchCrossLink('tutor', 'tutor', { inline: true })}
        </div>
      </div>
      <p class="act-panel__lead">현재 활동지역별 과외쌤 등록과 학생 수요를 한눈에 확인하세요.</p>
      ${renderTutorActivityBars({ activeIndex: activeIdx, interactive: true })}
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
    ${renderProviderHomeTabs('tutor', tab)}
    ${showMyBox ? renderTutorSelfHero() : ''}
    ${renderProviderHomeBody('tutor', tab, previewState.tutorFind, {
      hideHead: showMyBox,
      hideRegionBar: showMyBox,
      hideSearchCrossLink: showMyBox,
      hideSelfNote: true,
      hideFindLead: showMyBox,
    })}
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

  // data-tutor-region: 좌측 필·우측 막대 행 → tutorRegionIndex 전환
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
}
