import { previewState } from '../state.js';
import {
  DUMMY_STUDY_ROOMS,
  DUMMY_TUTORS,
  DUMMY_STUDENTS,
  SLOT_TOP,
  SLOT_MID,
} from '../data.js';
import {
  renderHomeShell,
  renderRegionBar,
  renderTop3Section,
  renderMid5Section,
  renderBottomList,
  renderMapBlock,
  renderAdInline,
  bindLayoutEvents,
  bindParentTabEvents,
} from '../layout.js';

function renderParentTabs() {
  const tab = previewState.parentTab;
  return `
    <div class="parent-tabs" role="tablist">
      <button
        type="button"
        class="parent-tabs__btn ${tab === 'study_room' ? 'is-active' : ''}"
        data-parent-tab="study_room"
        role="tab"
      >우리동네 공부방</button>
      <button
        type="button"
        class="parent-tabs__btn ${tab === 'tutor' ? 'is-active' : ''}"
        data-parent-tab="tutor"
        role="tab"
      >우리동네 과외쌤</button>
    </div>
  `;
}

function renderChildSummary() {
  return `
    <div class="home-section">
      <div class="home-section__head">
        <h2 class="home-section__title">자녀 학습 요약</h2>
      </div>
      <div class="child-summary">
        ${DUMMY_STUDENTS.map(
          (s) => `
          <div class="child-chip">
            <div class="child-chip__name">${s.name}</div>
            <div class="child-chip__grade">${s.grade} · ${s.school}</div>
          </div>
        `,
        ).join('')}
      </div>
    </div>
  `;
}

function renderStudyRoomView() {
  const top3 = DUMMY_STUDY_ROOMS.slice(0, 3).map((r, i) => ({
    slot: SLOT_TOP[i],
    name: r.name,
    meta: r.subject,
    price: r.price,
  }));
  const mid5 = DUMMY_STUDY_ROOMS.slice(3, 8).map((r, i) => ({
    slot: SLOT_MID[i],
    name: r.name,
    meta: r.subject,
    price: r.price,
  }));
  const list = DUMMY_STUDY_ROOMS.map((r) => ({
    title: r.name,
    meta: `${r.subject} · ${r.price}`,
    date: r.registered,
  }));

  return `
    ${renderRegionBar(true)}
    ${renderChildSummary()}
    ${renderMapBlock()}
    ${renderTop3Section('상단 고정 3박스', '우리동네 공부방 · 고정 슬롯', top3)}
    ${renderAdInline()}
    ${renderMid5Section('중단 고정 5박스', '고정형 시작', mid5)}
    ${renderBottomList('우리동네 공부방 전체 리스트', list)}
  `;
}

function renderTutorView() {
  const top3 = DUMMY_TUTORS.slice(0, 3).map((t, i) => ({
    slot: SLOT_TOP[i],
    name: t.name,
    meta: `${t.subject} · ${t.area}`,
  }));
  const mid5 = DUMMY_TUTORS.map((t, i) => ({
    slot: SLOT_MID[i],
    name: t.name,
    meta: `${t.subject} · ${t.area}`,
  }));
  const list = DUMMY_TUTORS.map((t) => ({
    title: t.name,
    meta: `${t.subject} · ${t.area}`,
    date: t.registered,
  }));

  return `
    ${renderRegionBar(true)}
    ${renderChildSummary()}
    ${renderTop3Section('상단 고정 3박스', '우리동네 과외쌤 · 고정 슬롯', top3)}
    ${renderAdInline()}
    ${renderMid5Section('중단 고정 5박스', '고정형 시작', mid5)}
    ${renderBottomList('우리동네 과외쌤 전체 리스트', list)}
    <p style="font-size:var(--text-xs);color:var(--gray-400);margin-top:var(--space-4);">
      지도 미제공 (공부방 전용) · 1차 과외쌤 핵심 배너 제외
    </p>
  `;
}

export function renderParent() {
  const tab = previewState.parentTab;
  const content = `
    ${renderParentTabs()}
    ${tab === 'study_room' ? renderStudyRoomView() : renderTutorView()}
  `;

  return renderHomeShell('parent', content, { showAuth: false, showRoleSwitch: true });
}

export function bindParentEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
  bindParentTabEvents(root, rerender);
}
