import { signupState, ROLE_LABELS, resetSignupState } from '../state.js';
import { renderAuthShell, renderStepIndicator, bindGlobalEvents } from '../layout.js';
import {
  HOME_UI_BASE,
  STUDY_ROOM_UI_BASE,
  TUTOR_UI_BASE,
  homeUiUrl,
} from '../../../shared/preview-links.js';

function summarizeBasic(role, data) {
  if (!data) return '—';
  if (role === 'student') {
    return [
      data.preferred_lesson_type && `희망유형: ${data.preferred_lesson_type}`,
      data.region_label && `희망지역 seed: ${data.region_label}`,
    ]
      .filter(Boolean)
      .join(' · ');
  }
  if (role === 'study_room') {
    return [data.study_room_name, data.main_subject_note, data.region_label]
      .filter(Boolean)
      .join(' · ');
  }
  return [data.tutor_display_name, data.main_subject_note, data.region_label || data.activity_city]
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
    ${renderStepIndicator(5, 5)}
    <div class="panel success-message">
      <div class="success-icon">✓</div>
      <h1 class="auth-heading">가입 · 기본등록 완료</h1>
      <p class="auth-subheading">
        계정과 <strong>공개 전 draft</strong>가 만들어졌습니다.<br />
        아직 검색·리스트에 <strong>공개되지 않습니다</strong>.<br />
        검색/공개에 쓰이는 항목은 <strong>상세등록</strong>에서 완성합니다.
      </p>

      <dl class="success-info">
        <dt>회원 ID (DB)</dt>
        <dd>${saved?.userId ?? '—'}</dd>
        <dt>이메일(ID)</dt>
        <dd>${saved?.email ?? '—'}</dd>
        <dt>역할 (DB role_type)</dt>
        <dd>${saved?.roleType ?? '—'}</dd>
        <dt>draft 프로필</dt>
        <dd>${profile ? `${profile.kind} #${profile.id}` : '—'}</dd>
        <dt>기본등록 seed</dt>
        <dd>${summarizeBasic(role, basic)}</dd>
      </dl>

      <div class="detail-cta panel panel--muted mt-6">
        <p class="auth-section-title">다음 · 상세등록</p>
        <p class="form-note">
          상세등록을 마친 뒤 일반 리스트/검색에 등록할 수 있습니다.
          Prime / Pick / 접근권은 그다음 <strong>구매 단계</strong>입니다. (${roleLabel})
        </p>
      </div>

      <div class="actions-stack">
        <button type="button" class="btn btn--primary btn--block" data-action="go-detail-register">
          상세등록 이어하기
        </button>
        <button type="button" class="btn btn--secondary btn--block" data-action="go-home">
          메인 홈으로
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
    if (role === 'study_room') {
      window.open(STUDY_ROOM_UI_BASE, '_blank');
      return;
    }
    if (role === 'tutor') {
      window.open(TUTOR_UI_BASE, '_blank');
      return;
    }
    window.open(`${HOME_UI_BASE}/#/mypage/registrations/students`, '_blank');
  });

  root.querySelector('[data-action="go-home"]')?.addEventListener('click', () => {
    const role = signupState.role || 'student';
    const home =
      role === 'study_room' ? homeUiUrl('study-room') : role === 'tutor' ? homeUiUrl('tutor') : homeUiUrl('parent');
    window.open(home, '_blank');
  });

  root.querySelector('[data-nav="/login"]')?.addEventListener('click', () => {
    resetSignupState();
  });
}
