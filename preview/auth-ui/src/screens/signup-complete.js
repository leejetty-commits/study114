import { signupState, ROLE_LABELS, resetSignupState } from '../state.js';
import { renderAuthShell, renderStepIndicator, bindGlobalEvents } from '../layout.js';

function summarizeBasic(role, data) {
  if (!data) return '—';
  if (role === 'student') {
    return [
      data.preferred_lesson_type && `희망: ${data.preferred_lesson_type}`,
      data.grade_level && `학년: ${data.grade_level}`,
      data.preferred_fee_amount && `수업예산(과외): ${Number(data.preferred_fee_amount).toLocaleString('ko-KR')}원`,
    ]
      .filter(Boolean)
      .join(' · ');
  }
  if (role === 'study_room') {
    return [data.study_room_name, data.main_subject_note, data.price_amount && `월 ${data.price_amount}원`]
      .filter(Boolean)
      .join(' · ');
  }
  return [
    data.tutor_display_name,
    data.main_subject_note,
    data.preferred_fee_amount && `월 ${data.preferred_fee_amount}원`,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function renderSignupComplete() {
  const role = signupState.role || 'student';
  const roleLabel = ROLE_LABELS[role];
  const saved = signupState.lastSignup;
  const basic = signupState.basicRegister?.[role];
  const profile = signupState.basicRegisterResult;

  const content = `
    ${renderStepIndicator(5)}
    <div class="panel success-message">
      <div class="success-icon">✓</div>
      <h1 class="auth-heading">가입 · 기본등록 완료</h1>
      <p class="auth-subheading">
        우동공과 가입과 기본등록이 완료되었습니다.<br />
        <strong>Local List</strong> 노출이 가능한 상태입니다.
      </p>

      <dl class="success-info">
        <dt>회원 ID (DB)</dt>
        <dd>${saved?.userId ?? '—'}</dd>
        <dt>이메일(ID)</dt>
        <dd>${saved?.email ?? '—'}</dd>
        <dt>역할 (DB role_type)</dt>
        <dd>${saved?.roleType ?? '—'}</dd>
        <dt>기본등록 프로필 (DB)</dt>
        <dd>${profile ? `${profile.kind} #${profile.id}` : '—'}</dd>
        <dt>기본등록 요약 (14장)</dt>
        <dd>${summarizeBasic(role, basic)}</dd>
      </dl>

      <div class="detail-cta panel panel--muted mt-6">
        <p class="auth-section-title">6단계 · 상세등록 유도</p>
        <p class="form-note">
          Prime / Pick 노출과 정확한 비교검색을 위해 상세등록을 이어서 작성하세요.
          (${roleLabel} 상세등록 UI는 study-room-ui / 추후 tutor-ui에서 연결)
        </p>
      </div>

      <div class="actions-stack">
        <button type="button" class="btn btn--primary btn--block" data-action="go-detail-register">
          상세등록 이어하기 (프리뷰)
        </button>
        <button type="button" class="btn btn--secondary btn--block" data-action="go-home">
          메인 홈으로 (프리뷰)
        </button>
        <button type="button" class="btn btn--ghost btn--block" data-nav="/login">로그인하기</button>
      </div>
    </div>
  `;

  return renderAuthShell(content);
}

export function bindSignupCompleteEvents(root) {
  bindGlobalEvents(root);

  root.querySelector('[data-action="go-detail-register"]')?.addEventListener('click', () => {
    const role = signupState.role || 'student';
    const target =
      role === 'study_room'
        ? 'http://localhost:5175'
        : role === 'tutor'
          ? 'http://localhost:5177'
          : 'http://localhost:5174 (학부모 메인)';
    if (role === 'study_room' || role === 'tutor') {
      window.open(target, '_blank');
      return;
    }
    alert(`[프리뷰] 상세등록: ${target}`);
  });

  root.querySelector('[data-action="go-home"]')?.addEventListener('click', () => {
    window.open('http://localhost:5174', '_blank');
  });

  root.querySelector('[data-nav="/login"]')?.addEventListener('click', () => {
    resetSignupState();
  });
}
