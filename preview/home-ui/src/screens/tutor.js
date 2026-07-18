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

function renderTutorRegionPills() {
  return MOCK_TUTOR_REGIONS.map(
    (region) => `
    <span class="my-box__region-pill${region.primary ? ' is-primary' : ''}">
      ${region.label}${region.primary ? '<span class="tutor-region-tabs__primary">대표</span>' : ''}
    </span>`,
  ).join('');
}

/** 좌측: 현황 요약 박스 (이름·등록·지역·상태) */
function renderMyTutorStatusBox() {
  return `
    <aside class="my-box my-box--status" aria-label="내 과외쌤 현황">
      <div class="my-box__label">내 과외쌤 박스</div>
      <div class="my-box__title">${MY_TUTOR.name}</div>
      <div class="my-box__actions">
        <a href="#/mypage/home" class="btn btn--primary btn--sm" data-nav="/mypage/home">마이페이지</a>
        <a href="${TUTOR_REGISTER_URL}" class="btn btn--secondary btn--sm" data-util-href="${TUTOR_REGISTER_URL}">과외 등록</a>
      </div>
      <div class="my-box__regions" aria-label="활동 지역">
        <span class="my-box__regions-label">활동 지역</span>
        ${renderTutorRegionPills()}
      </div>
      <div class="my-box__stats my-box__stats--grid">
        <span class="my-box__stat">과목 <strong>${MY_TUTOR.subject}</strong></span>
        <span class="my-box__stat">상태 <strong>${MY_TUTOR.status}</strong></span>
        <span class="my-box__stat">조회 <strong>${MY_TUTOR.views}</strong></span>
        <span class="my-box__stat">메모 <strong>${MY_TUTOR.memoInbox ?? '—'}</strong></span>
        <span class="my-box__stat">보낸 메모 <strong>${MY_TUTOR.memoSent ?? '—'}</strong></span>
        <span class="my-box__stat">등록 <strong>${MY_TUTOR.registered}</strong></span>
      </div>
    </aside>`;
}

/** 우측: 섹션 제목 + 안내 (활동지역 제외) */
function renderTutorHomeGuidePanel() {
  return `
    <div class="tutor-home-guide">
      <h1 class="tutor-home-guide__title">우리동네 과외쌤</h1>
      <p class="tutor-home-guide__text">등록한 활동 지역별로 내 노출 상태를 확인하세요.</p>
      <p class="tutor-home-guide__text">경쟁 과외쌤 비교는 검색 메뉴에서 할 수 있습니다.</p>
      <div class="tutor-home-guide__link">
        ${renderSearchCrossLink('tutor', 'tutor')}
      </div>
    </div>`;
}

function renderTutorSelfHero() {
  return `
    <section class="tutor-home-split" aria-label="과외쌤 홈 현황">
      ${renderMyTutorStatusBox()}
      ${renderTutorHomeGuidePanel()}
    </section>`;
}

export function renderTutor() {
  const tab = previewState.tutorTab;
  const showMyBox = isProviderHomeSelfTab('tutor', tab);

  const content = `
    ${renderProviderHomeTabs('tutor', tab)}
    ${showMyBox ? renderTutorSelfHero() : ''}
    ${renderProviderHomeBody('tutor', tab, previewState.tutorFind, { hideHead: showMyBox, hideRegionBar: showMyBox, hideSearchCrossLink: showMyBox })}
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

  // 학생 탭뿐 아니라 자기 탭 목록 배지(찜·비교·쪽지)도 연결
  bindCompareEvents(root, true);
  bindUserActionEvents(root, rerender, { sourceRoute: 'tutor' });

  bindDetailDecisionEvents(root, {
    onRerender: rerender,
    viewer: 'tutor',
    sourceRoute: 'tutor',
    getStudentItem: (id) => previewState.tutorFind.activeResultItems?.find((x) => x.id === id),
  });
}
