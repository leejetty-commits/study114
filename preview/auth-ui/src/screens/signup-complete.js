import { signupState } from '../state.js';
import { AUTH_WELCOME_COPY } from '../../../shared/auth-welcome-copy.js';
import { renderAuthShell, renderStepIndicator, bindGlobalEvents, navigate } from '../layout.js';
import { fetchMeApi } from '../auth-api.js';
import { resolveAfterAuthUrl } from '../../../shared/auth-redirect.js';
import {
  HOME_UI_BASE,
  STUDY_ROOM_UI_BASE,
  TUTOR_UI_BASE,
  homeUiUrl,
} from '../../../shared/preview-links.js';
import { publishGreeting } from '../../../shared/neighborhood-greeting-store.js';

const PROMPT_DONE_KEY = 'study114-ng-prompt-done';

function promptDone() {
  try {
    return sessionStorage.getItem(PROMPT_DONE_KEY) === '1';
  } catch {
    return false;
  }
}

function markPromptDone() {
  try {
    sessionStorage.setItem(PROMPT_DONE_KEY, '1');
  } catch {
    /* ignore */
  }
}

function providerNeighborhood(role, basic) {
  if (role === 'study_room') {
    const slot = Array.isArray(basic?.saved_regions) ? basic.saved_regions[0] || {} : {};
    return slot.region_label || slot.complex_name || basic?.region_label || '';
  }
  return basic?.region_label || basic?.activity_city || '';
}

function providerDisplayName(role, basic) {
  if (role === 'study_room') return basic?.study_room_name || '공부방';
  return basic?.tutor_display_name || '과외쌤';
}

function renderGreetingModal() {
  return `
    <div class="ng-prompt-modal" data-ng-prompt role="dialog" aria-modal="true" aria-labelledby="ng-prompt-title">
      <div class="ng-prompt-modal__card">
        <h2 id="ng-prompt-title" class="ng-prompt-modal__title">동네에 인사할까요?</h2>
        <p class="ng-prompt-modal__lead">같은 동네 학생에게 한 줄만 보여요. 건너뛰어도 바로 쓸 수 있어요.</p>
        <label class="form-label" for="ng-body">한 줄</label>
        <textarea class="form-input" id="ng-body" maxlength="80" rows="2" data-ng-body></textarea>
        <p class="ng-prompt-modal__status" data-ng-status role="status" hidden></p>
        <p class="form-note form-note--error" data-ng-error hidden></p>
        <div class="ng-prompt-modal__actions">
          <button type="button" class="btn btn--secondary" data-ng-publish>인사 올리기</button>
          <button type="button" class="btn btn--secondary" data-ng-skip>건너뛰기</button>
        </div>
      </div>
    </div>`;
}

function maskEmail(email) {
  const e = String(email || '').trim();
  const at = e.indexOf('@');
  if (at < 1) return '확인됨';
  return `${e.slice(0, Math.min(2, at))}***${e.slice(at)}`;
}

function summarizeBasic(role, data) {
  if (!data) return '—';
  if (role === 'student') {
    const hope =
      data.preferred_lesson_type === 'study_room'
        ? '공부방 찾기'
        : data.preferred_lesson_type === 'tutor'
          ? '과외쌤 찾기'
          : '';
    return [data.public_display_name || data.student_name, hope, data.region_label || data.activity_city]
      .filter(Boolean)
      .join(' · ');
  }
  if (role === 'study_room') {
    const promo1 = Array.isArray(data.saved_regions) ? data.saved_regions[0] || {} : {};
    const promoLabel =
      promo1.region_label ||
      promo1.complex_name ||
      promo1.complex_address ||
      (promo1.region_id ? `region#${promo1.region_id}` : '');
    return [data.study_room_name, data.main_subject_note, promoLabel && `홍보지역1: ${promoLabel}`]
      .filter(Boolean)
      .join(' · ');
  }
  return [data.tutor_display_name, data.main_subject_note, data.region_label || data.activity_city]
    .filter(Boolean)
    .join(' · ');
}

/** 공부방 기본등록 완료 기준: 홍보지역 1 (사업장 region_id와 별개) */
function studyRoomHasPromoSlot1(basic) {
  const slot = Array.isArray(basic?.saved_regions) ? basic.saved_regions[0] || {} : {};
  if (String(slot.region_id || '').trim()) return true;
  if (String(slot.complex_id || '').trim()) return true;
  if (String(slot.region_label || '').trim()) return true;
  if (String(slot.address_sido || '').trim() || String(slot.address_bname || '').trim()) return true;
  if (slot.region_basis_type === 'complex') {
    return !!(
      String(slot.complex_name || '').trim() ||
      String(slot.complex_address || '').trim() ||
      String(slot.address_text || '').trim()
    );
  }
  return false;
}

function profileKindLabel(role) {
  if (role === 'study_room') return AUTH_WELCOME_COPY.complete.profileStudyRoom;
  if (role === 'tutor') return AUTH_WELCOME_COPY.complete.profileTutor;
  return '—';
}

export function renderSignupComplete() {
  const role = signupState.role || 'student';
  const saved = signupState.lastSignup;
  const basic = signupState.basicRegister?.[role];
  const profile = signupState.basicRegisterResult;

  const studentSummary = summarizeBasic('student', basic);
  const content = role === 'student' ? `
    ${renderStepIndicator(5, 5)}
    <div class="panel success-message">
      <div class="success-icon">✓</div>
      <h1 class="auth-heading">${AUTH_WELCOME_COPY.complete.title}</h1>
      <p class="auth-subheading">
        ${AUTH_WELCOME_COPY.complete.studentLead}
      </p>

      <dl class="success-info">
        <dt>로그인 계정</dt>
        <dd>${maskEmail(saved?.email)}</dd>
        <dt>입력한 정보</dt>
        <dd>${studentSummary || '—'}</dd>
      </dl>

      <p class="form-note mt-6">
        ${AUTH_WELCOME_COPY.complete.studentDetailNote}
      </p>

      <div class="actions-stack">
        <button type="button" class="btn btn--primary btn--block" data-action="go-detail-register">
          ${AUTH_WELCOME_COPY.complete.studentDetailCta}
        </button>
        <button type="button" class="btn btn--secondary btn--block" data-action="go-home">
          홈으로
        </button>
      </div>
    </div>
  ` : `
    ${renderStepIndicator(5, 5)}
    <div class="panel success-message">
      <div class="success-icon">✓</div>
      <h1 class="auth-heading">${AUTH_WELCOME_COPY.complete.title}</h1>
      <p class="auth-subheading">
        ${AUTH_WELCOME_COPY.complete.providerLead}
      </p>

      <dl class="success-info">
        <dt>로그인 계정</dt>
        <dd>${maskEmail(saved?.email)}</dd>
        <dt>기본등록 프로필</dt>
        <dd>${profile ? profileKindLabel(role) : '—'}</dd>
        <dt>기본등록 요약</dt>
        <dd>${summarizeBasic(role, basic)}</dd>
      </dl>

      <div class="detail-cta panel panel--muted mt-6">
        <p class="auth-section-title">${AUTH_WELCOME_COPY.complete.detailTitle}</p>
        <p class="form-note">
          ${AUTH_WELCOME_COPY.complete.detailNote}
        </p>
      </div>

      <div class="actions-stack">
        <button type="button" class="btn btn--primary btn--block" data-action="go-detail-register">
          상세등록 이어하기
        </button>
        <button type="button" class="btn btn--secondary btn--block" data-action="go-home">
          ${AUTH_WELCOME_COPY.complete.providerLaterCta}
        </button>
      </div>
    </div>
  `;

  return renderAuthShell(content);
}

export function bindSignupCompleteEvents(root) {
  bindGlobalEvents(root);
  const roleNow = signupState.role || 'student';
  const basicNow = signupState.basicRegister?.[roleNow];
  document.querySelectorAll('[data-ng-prompt]').forEach((el) => el.remove());
  if ((roleNow === 'study_room' || roleNow === 'tutor') && !promptDone()) {
    document.body.insertAdjacentHTML('beforeend', renderGreetingModal());
  }
  // 팝업만 닫는다. 가입 완료 화면의 「상세등록 이어하기 / 나중에」는 회원이 고른다.
  const closePrompt = () => {
    markPromptDone();
    document.querySelectorAll('[data-ng-prompt]').forEach((el) => el.remove());
  };
  const prompt = document.querySelector('[data-ng-prompt]');
  const errorEl = prompt?.querySelector('[data-ng-error]');
  const statusEl = prompt?.querySelector('[data-ng-status]');
  const hideStatus = () => {
    if (!statusEl) return;
    statusEl.hidden = true;
    statusEl.textContent = '';
  };
  const showError = (message) => {
    hideStatus();
    if (!errorEl) return;
    errorEl.hidden = !message;
    errorEl.textContent = message || '';
  };
  prompt?.querySelector('[data-ng-body]')?.addEventListener('input', () => {
    hideStatus();
  });
  document.querySelector('[data-ng-skip]')?.addEventListener('click', () => {
    closePrompt();
  });
  document.querySelector('[data-ng-publish]')?.addEventListener('click', async () => {
    const saved = await publishGreeting({
      providerType: roleNow === 'tutor' ? 'tutor' : 'study_room',
      registrationId: Number(signupState.basicRegisterResult?.id || 0),
      body: document.querySelector('[data-ng-body]')?.value || '',
      neighborhood: providerNeighborhood(roleNow, basicNow),
      displayName: providerDisplayName(roleNow, basicNow),
    });
    if (!saved.ok) {
      showError(saved.error);
      return;
    }
    closePrompt();
  });

  fetchMeApi()
    .then((me) => {
      if (!me.authenticated) {
        navigate('/login');
        return;
      }
      if (!me.email_verified || me.needs_account_contact) {
        window.location.href = resolveAfterAuthUrl(me);
      }
    })
    .catch(() => navigate('/login'));

  root.querySelector('[data-action="go-detail-register"]')?.addEventListener('click', () => {
    const role = signupState.role || 'student';
    // 가입 이어가기: 새 탭 금지. 과외쌤과 같이 같은 창에서 연다.
    if (role === 'study_room') {
      window.location.assign(STUDY_ROOM_UI_BASE);
      return;
    }
    if (role === 'tutor') {
      window.location.assign(TUTOR_UI_BASE);
      return;
    }
    window.location.assign(`${HOME_UI_BASE}/#/mypage/registrations/students`);
  });

  root.querySelector('[data-action="go-home"]')?.addEventListener('click', () => {
    const role = signupState.role || 'student';
    const basic = signupState.basicRegister?.[role];
    const savedOk =
      !!signupState.basicRegisterResult?.id &&
      (role === 'study_room'
        ? signupState.basicRegisterResult?.kind === 'study_room'
        : role === 'tutor'
          ? signupState.basicRegisterResult?.kind === 'tutor'
          : signupState.basicRegisterResult?.kind === 'student');
    const hasSeed =
      !!basic &&
      (role === 'student'
        ? !!(basic.region_id || basic.complex_id || basic.activity_city || basic.region_label)
        : role === 'study_room'
          ? studyRoomHasPromoSlot1(basic) || savedOk
          : !!(basic.region_id || basic.activity_city));

    if (role === 'study_room' && hasSeed) {
      // 잘못된 「지역 없음」 경고 대신 완료 안내만
      window.alert(AUTH_WELCOME_COPY.complete.alertDone);
    } else if (!hasSeed) {
      const proceed = window.confirm(
        role === 'student'
          ? AUTH_WELCOME_COPY.complete.confirmStudent
          : AUTH_WELCOME_COPY.complete.confirmProvider,
      );
      if (!proceed) return;
    }

    // 학생 찾기 기본값 seed (공부방 홍보지역과 무관)
    try {
      if (basic?.region_label || basic?.activity_city) {
        const hope =
          role === 'student' && basic.preferred_lesson_type === 'study_room'
            ? 'study_room'
            : role === 'student'
              ? 'tutor'
              : null;
        if (hope) {
          const key = 'study114.studentFind.lastRegionByHope';
          const prev = JSON.parse(sessionStorage.getItem(key) || localStorage.getItem(key) || '{}');
          prev[hope] = basic.region_label || basic.activity_city;
          localStorage.setItem(key, JSON.stringify(prev));
        }
      }
    } catch {
      /* ignore */
    }

    const home =
      role === 'study_room' ? homeUiUrl('study-room') : role === 'tutor' ? homeUiUrl('tutor') : homeUiUrl('parent');
    window.location.assign(home);
  });
}
