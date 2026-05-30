import { previewState } from '../state.js';
import {
  DUMMY_STUDY_ROOMS,
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
} from '../layout.js';

export function renderGuest() {
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

  const regionLabel = previewState.regionKey === 'complex' ? '단지' : '동';

  const content = `
    ${renderRegionBar(true)}
    <div class="cta-banner">
      <div class="cta-banner__title">우리 동네 공부방·과외, 우동공과에서</div>
      <div class="cta-banner__desc">샘플 지역 데모 홈 — ${regionLabel} 기준 공부방 탐색</div>
      <a href="http://localhost:5173/#/signup/terms" class="btn btn--primary" target="_blank" rel="noopener">회원가입</a>
    </div>
    ${renderMapBlock()}
    ${renderTop3Section('상단 고정 3박스', '실제 고정 슬롯', top3)}
    ${renderAdInline()}
    ${renderMid5Section('중단 고정 5박스', '고정형 시작', mid5)}
    ${renderBottomList('전체 공부방 리스트', list)}
    <p style="font-size:var(--text-xs);color:var(--gray-400);margin-top:var(--space-4);">
      과외 기본 검색: GNB 「과외 찾기」 · 1차 핵심 노출은 공부방
    </p>
  `;

  return renderHomeShell('guest', content, { showAuth: true });
}

export function bindGuestEvents(root, rerender) {
  bindLayoutEvents(root, rerender);
}
