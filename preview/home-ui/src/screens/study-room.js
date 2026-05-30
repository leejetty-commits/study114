import { DUMMY_STUDY_ROOMS, MY_STUDY_ROOM, SLOT_TOP, SLOT_MID } from '../data.js';
import {
  renderHomeShell,
  renderRegionBar,
  renderTop3Section,
  renderMid5Section,
  renderBottomList,
  renderMapBlock,
  renderAdInline,
  bindLayoutEvents,
} from '../layout.js';

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
        <button type="button" class="btn btn--primary btn--sm" data-action="edit-room" data-href="http://localhost:5175/#/register/basic">공부방 수정</button>
        <button type="button" class="btn btn--secondary btn--sm" data-action="manage-room">등록 관리</button>
      </div>
    </div>
  `;
}

export function renderStudyRoom() {
  const top3 = DUMMY_STUDY_ROOMS.slice(0, 3).map((r, i) => ({
    slot: SLOT_TOP[i],
    name: r.name,
    meta: r.subject,
    price: r.price,
  }));
  const mid5 = DUMMY_STUDY_ROOMS.slice(0, 5).map((r, i) => ({
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

  const content = `
    ${renderRegionBar(false)}
    ${renderMyStudyRoomBox()}
    ${renderMapBlock()}
    ${renderTop3Section('상단 고정 3박스', '공부방 노출 슬롯', top3)}
    ${renderAdInline()}
    ${renderMid5Section('중단 고정 5박스', '고정형 시작', mid5)}
    ${renderBottomList('공부방 리스트', list)}
  `;

  return renderHomeShell('study_room', content, { showAuth: false, showRoleSwitch: true });
}

export function bindStudyRoomEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
}
