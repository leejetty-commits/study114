import { signupState, ROLE_LABELS, DUMMY_USER } from '../state.js';
import { renderAuthShell, renderStepIndicator, renderRoleBadge, bindGlobalEvents, navigate } from '../layout.js';

export function renderSignupForm() {
  const role = signupState.role || 'student';
  const roleLabel = ROLE_LABELS[role];

  const content = `
    ${renderStepIndicator(3)}
    <div class="panel auth-shell__card--wide">
      <h1 class="auth-heading">회원가입</h1>
      <p class="auth-subheading mb-6">공통 회원 정보를 입력해 주세요.</p>
      ${renderRoleBadge(role)}

      <form data-form="signup" class="mt-8">
        <div class="form-group">
          <label class="form-label form-label--required" for="signup-email">이메일(ID)</label>
          <input
            class="form-input"
            type="email"
            id="signup-email"
            name="email"
            placeholder="example@email.com"
            value="${DUMMY_USER.email}"
            autocomplete="username"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label form-label--required" for="signup-password">비밀번호</label>
            <input
              class="form-input"
              type="password"
              id="signup-password"
              name="password"
              placeholder="비밀번호 입력"
              autocomplete="new-password"
            />
          </div>
          <div class="form-group">
            <label class="form-label form-label--required" for="signup-password-confirm">비밀번호 확인</label>
            <input
              class="form-input"
              type="password"
              id="signup-password-confirm"
              name="password_confirm"
              placeholder="비밀번호 재입력"
              autocomplete="new-password"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label form-label--required" for="signup-name">이름</label>
          <input
            class="form-input"
            type="text"
            id="signup-name"
            name="name"
            placeholder="실명 입력"
            value="${DUMMY_USER.name}"
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <span class="form-label form-label--required">성별</span>
          <div class="form-radio-group" role="radiogroup" aria-label="성별">
            <label class="form-radio">
              <input
                class="form-radio__input"
                type="radio"
                name="gender"
                value="male"
                ${DUMMY_USER.gender === 'male' ? 'checked' : ''}
              />
              <span class="form-radio__label">남</span>
            </label>
            <label class="form-radio">
              <input
                class="form-radio__input"
                type="radio"
                name="gender"
                value="female"
                ${DUMMY_USER.gender === 'female' ? 'checked' : ''}
              />
              <span class="form-radio__label">여</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label form-label--required" for="signup-birth-date">생년월일</label>
          <input
            class="form-input"
            type="date"
            id="signup-birth-date"
            name="birth_date"
            value="${DUMMY_USER.birthDate}"
          />
        </div>

        <div class="form-group">
          <label class="form-label form-label--required" for="signup-phone">휴대폰</label>
          <input
            class="form-input"
            type="tel"
            id="signup-phone"
            name="phone"
            placeholder="010-0000-0000"
            value="${DUMMY_USER.phone}"
            autocomplete="tel"
          />
        </div>

        <div class="form-group">
          <label class="form-label form-label--required" for="signup-address">주소</label>
          <input
            class="form-input"
            type="text"
            id="signup-address"
            name="address"
            placeholder="주소 입력"
            value="${DUMMY_USER.address}"
            autocomplete="street-address"
          />
        </div>

        <div class="form-consent-group">
          <p class="auth-section-title">수신 동의</p>
          <label class="form-check">
            <input
              class="form-check__input"
              type="checkbox"
              name="sms_consent"
              id="signup-sms-consent"
              ${DUMMY_USER.smsConsent ? 'checked' : ''}
            />
            <span class="form-check__label">문자 수신 동의</span>
          </label>
          <label class="form-check">
            <input
              class="form-check__input"
              type="checkbox"
              name="email_consent"
              id="signup-email-consent"
              ${DUMMY_USER.emailConsent ? 'checked' : ''}
            />
            <span class="form-check__label">이메일 수신 동의</span>
          </label>
        </div>

        <div class="form-group form-group--extension">
          <label class="form-check">
            <input
              class="form-check__input"
              type="checkbox"
              name="safe_number_use"
              id="signup-safe-number-use"
              ${DUMMY_USER.safeNumberUse ? 'checked' : ''}
            />
            <span class="form-check__label">안전번호 사용 여부</span>
          </label>
          <p class="form-hint">확장 포인트 — 1차 프리뷰용 UI만 제공</p>
        </div>

        <p class="form-note">${roleLabel} 상세 정보는 가입 완료 후 상세등록 단계에서 입력합니다.</p>

        <div class="form-error" data-signup-error hidden role="alert"></div>

        <div class="actions-stack">
          <button type="submit" class="btn btn--primary btn--block">가입하기</button>
          <button type="button" class="btn btn--secondary btn--block" data-nav="/signup/role">이전</button>
        </div>
      </form>
    </div>
  `;

  return renderAuthShell(content, { wide: true, showBack: true, backPath: '/signup/role', backLabel: '회원구분' });
}

export function bindSignupFormEvents(root) {
  bindGlobalEvents(root);

  const form = root.querySelector('[data-form="signup"]');
  const errorEl = root.querySelector('[data-signup-error]');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.role = signupState.role || 'student';
    payload.sms_consent = fd.get('sms_consent') === 'on';
    payload.email_consent = fd.get('email_consent') === 'on';
    payload.safe_number_use = fd.get('safe_number_use') === 'on';

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '가입 처리 중…';
    }

    try {
      const res = await fetch('/api/auth/signup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        const msg = data.message || `가입 실패 (HTTP ${res.status})`;
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = msg;
        } else {
          alert(msg);
        }
        console.error('[signup]', data);
        return;
      }

      signupState.lastSignup = {
        userId: data.user_id,
        email: data.email,
        roleType: data.role_type,
      };
      console.info('[signup] saved', signupState.lastSignup);
      navigate('/signup/complete');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '네트워크 오류';
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = msg;
      } else {
        alert(msg);
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '가입하기';
      }
    }
  });
}
