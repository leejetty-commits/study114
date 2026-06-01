import { registerState, FACILITY_OPTIONS, SCHOOL_LEVELS } from '../state.js';
import {
  renderRegisterShell,
  renderTempNotice,
  bindGlobalEvents,
} from '../layout.js';

function formatPrice(amount) {
  if (!amount) return '—';
  return `${Number(amount).toLocaleString('ko-KR')}원/월`;
}

function facilityNames() {
  return registerState.facility_ids
    .map((id) => FACILITY_OPTIONS.find((f) => f.id === id)?.facility_name)
    .filter(Boolean)
    .join(', ');
}

export function renderComplete() {
  const s = registerState;
  const content = `
    <div class="panel text-center mb-6">
      <div style="font-size:3rem;line-height:1;margin-bottom:var(--space-4);">✓</div>
      <h2 class="auth-heading" style="font-size:var(--text-2xl);">공부방 등록 프리뷰 완료</h2>
      <p class="auth-subheading">profile_status: <strong>${s.profile_status}</strong></p>
      <p class="auth-subheading" style="margin-top:var(--space-2);">
        상세등록: <strong>${s.detail_registration_complete ? '완료' : '미완료'}</strong>
        · Prime/Pick 자격: <strong>${s.detail_registration_complete ? '충족(노출권 별도)' : '미충족 — 일반 리스트만'}</strong>
      </p>
    </div>

    ${renderTempNotice('기본등록만 완료 시 일반 리스트 · 상세등록 완료 후 Prime/Pick 자격 (5·8·9장)')}

    <dl class="register-summary">
      <dt>공부방명</dt><dd>${s.study_room_name}</dd>
      <dt>운영자</dt><dd>${s.operator_display_name}</dd>
      <dt>교습장</dt><dd>${s.lesson_place_type === 'home' ? '재택' : '교습소'}</dd>
      <dt>기본 위치</dt><dd>${s.address_text}</dd>
      <dt>월 대표 가격</dt><dd>${formatPrice(s.price_amount)}</dd>
      <dt>과목</dt><dd>${s.subjects.map((x) => x.subject_name).join(', ')}</dd>
      <dt>시설 체크</dt><dd>${facilityNames() || '—'}</dd>
      <dt>교육청 등록</dt><dd>${s.education_office_registered ? s.education_office_reg_no : '미등록'}</dd>
    </dl>

    <div class="register-nav" style="border-top:none;padding-top:var(--space-4);">
      <a href="#/register/basic" class="btn btn--secondary" data-nav="/register/basic">처음부터 수정</a>
      <a href="http://localhost:5174/#/study-room" class="btn btn--primary" target="_blank" rel="noopener">공부방 메인으로 ↗</a>
    </div>
  `;
  return renderRegisterShell(content, {
    step: 6,
    title: '등록 완료',
    subtitle: '가입 완료 후 상세등록 CTA와 동일 흐름 (2장 · 9장)',
  });
}

export function bindCompleteEvents(root) {
  bindGlobalEvents(root);
}
