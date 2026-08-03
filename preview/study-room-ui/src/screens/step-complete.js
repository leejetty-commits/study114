import { registerState, getFacilityOptions, LESSON_PLACE_TYPES, CAPACITY_PER_TIME_OPTIONS } from '../state.js';
import { renderRegisterShell, renderGuideNotice, bindGlobalEvents, mypageRegistrationsUrl } from '../layout.js';
import { homeUiUrl } from '../../../shared/preview-links.js';

function formatPrice(amount) {
  if (!amount) return '—';
  return `${Number(amount).toLocaleString('ko-KR')}원/월`;
}

function facilityNames() {
  return registerState.facility_ids
    .map((id) => getFacilityOptions().find((f) => f.id === id)?.facility_name)
    .filter(Boolean)
    .join(', ');
}

export function renderComplete() {
  const s = registerState;
  const content = `
    <div class="register-complete">
      <div class="register-complete__icon" aria-hidden="true">✓</div>
      <h2 class="register-complete__title">공부방 등록이 완료되었습니다</h2>
      <p class="register-complete__thanks">수고하셨습니다!</p>
      <p class="register-complete__lead">작성해 주신 정보는 검색·목록에 반영됩니다. 대표·추천 노출은 유료 상품에서 이어갈 수 있습니다.</p>
    </div>
    ${renderGuideNotice('내용을 다시 손보고 싶으면 마이페이지 · 내 등록에서 수정할 수 있습니다.')}
    <dl class="register-summary">
      <dt>공부방명</dt><dd>${s.study_room_name || '—'}</dd>
      <dt>운영자</dt><dd>${s.operator_display_name || '—'}</dd>
      <dt>교습장</dt><dd>${LESSON_PLACE_TYPES.find((t) => t.value === s.lesson_place_type)?.label || '—'}</dd>
      <dt>타임별 원생수</dt><dd>${CAPACITY_PER_TIME_OPTIONS.find((o) => o.value === s.capacity_per_time)?.label || '—'}</dd>
      <dt>월 대표 가격</dt><dd>${formatPrice(s.price_amount)}</dd>
      <dt>과목</dt><dd>${s.subjects.map((x) => x.subject_name).filter(Boolean).join(', ') || '—'}</dd>
      <dt>시설</dt><dd>${facilityNames() || '—'}</dd>
    </dl>
    <div class="register-nav" style="border-top:none;padding-top:var(--space-2);">
      <a href="${mypageRegistrationsUrl()}" class="btn btn--secondary">마이페이지에서 수정</a>
      <a href="${homeUiUrl('study-room')}" class="btn btn--primary">공부방 메인으로</a>
    </div>
  `;
  return renderRegisterShell(content, {
    stepKey: 'complete',
    title: '등록 완료',
    subtitle: '',
  });
}

export function bindCompleteEvents(root) {
  bindGlobalEvents(root);
}
