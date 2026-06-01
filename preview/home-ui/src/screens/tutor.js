import { DUMMY_TUTORS, DUMMY_STUDENTS, MY_TUTOR, SLOT_TOP, SLOT_MID } from '../data.js';
import {
  renderHomeShell,
  renderRegionBar,
  renderTop3Section,
  renderMid5Section,
  renderBottomList,
  renderAdInline,
  bindLayoutEvents,
} from '../layout.js';

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

function renderStudentList() {
  return `
    <section class="home-section">
      <div class="list-block">
        <div class="list-block__head">학생 리스트</div>
        ${DUMMY_STUDENTS.map(
          (s, i) => `
          <div class="list-item">
            <span class="list-item__rank">${i + 1}</span>
            <div class="list-item__body">
              <div class="list-item__title">${s.name}</div>
              <div class="list-item__meta">${s.grade} · ${s.school} · 학부모 ${s.parent}</div>
            </div>
            <span class="list-item__date">연결됨</span>
          </div>
        `,
        ).join('')}
      </div>
    </section>
  `;
}

export function renderTutor() {
  const top3 = DUMMY_TUTORS.slice(0, 3).map((t, i) => ({
    slot: SLOT_TOP[i],
    name: t.display_name,
    meta: `${t.main_subject_note} · ${t.location_label}`,
  }));
  const mid5 = DUMMY_TUTORS.map((t, i) => ({
    slot: SLOT_MID[i],
    name: t.display_name,
    meta: `${t.main_subject_note} · ${t.location_label}`,
  }));
  const list = DUMMY_TUTORS.map((t) => ({
    title: t.display_name,
    meta: `${t.main_subject_note} · ${t.location_label}`,
    date: t.registered_at,
  }));

  const content = `
    ${renderRegionBar(false)}
    ${renderMyTutorBox()}
    ${renderTop3Section('상단 고정 3박스', '과외쌤 노출 슬롯', top3)}
    ${renderAdInline()}
    ${renderMid5Section('중단 고정 5박스', '고정형 시작', mid5)}
    ${renderBottomList('과외쌤 리스트', list)}
    ${renderStudentList()}
    <p style="font-size:var(--text-xs);color:var(--gray-400);margin-top:var(--space-4);">
      지도 미제공 · 1차 핵심 배너 제외 (등록·검색 링크만)
    </p>
  `;

  return renderHomeShell('tutor', content, { showAuth: false, showRoleSwitch: true });
}

export function bindTutorEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
}
