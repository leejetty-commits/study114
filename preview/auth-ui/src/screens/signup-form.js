import { signupState, DUMMY_USER } from '../state.js';
import { PASSWORD_RULE_HINT, validatePassword } from '../../../shared/password-policy.js';
import { openKakaoPostcode } from '../../../shared/kakao-postcode.js';
import { renderAuthShell, renderStepIndicator, bindGlobalEvents, navigate } from '../layout.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

const isDev = import.meta.env.DEV;

export function renderSignupForm() {
  const draft = signupState.accountDraft;
  const prefEmail = draft?.email || (isDev ? DUMMY_USER.email : '');
  const prefName = draft?.name || (isDev ? DUMMY_USER.name : '');
  const prefPhone = draft?.phone || (isDev ? DUMMY_USER.phone : '');

  const content = `
    ${renderStepIndicator(2, 5)}
    <div class="panel auth-shell__card--wide">
      <h1 class="auth-heading">회원가입</h1>
      <p class="auth-subheading mb-6">공통 계정 정보만 입력합니다. 역할·검색용 항목은 다음 단계에서 받습니다.</p>

      <form data-form="signup" class="mt-8" novalidate>
        <div class="form-group">
          <label class="form-label form-label--required" for="signup-email">이메일(ID)</label>
          <input
            class="form-input"
            type="email"
            id="signup-email"
            name="email"
            placeholder="example@email.com"
            value="${esc(prefEmail)}"
            autocomplete="username"
            required
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
              required
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
              required
            />
          </div>
        </div>
        <p class="form-hint">${PASSWORD_RULE_HINT}</p>

        <div class="form-group">
          <label class="form-label form-label--required" for="signup-name">이름</label>
          <input
            class="form-input"
            type="text"
            id="signup-name"
            name="name"
            placeholder="실명 입력"
            value="${esc(prefName)}"
            autocomplete="name"
            required
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
            value="${esc(prefPhone)}"
            autocomplete="tel"
            required
          />
        </div>

        <div class="form-group form-address" data-address-block>
          <span class="form-label form-label--required">주소</span>
          <p class="form-hint">동·건물명·지번을 일부만 입력해도 목록이 나타납니다. 지번을 골라도 <strong>도로명 주소로 자동 변환</strong>됩니다.</p>
          <div class="form-address__zip-row">
            <input
              class="form-input"
              type="text"
              id="signup-address-zip"
              name="address_zip"
              placeholder="우편번호"
              readonly
              required
              aria-label="우편번호"
            />
            <button type="button" class="btn btn--secondary" data-action="search-address">주소 검색</button>
          </div>
          <input
            class="form-input"
            type="text"
            id="signup-address"
            name="address"
            placeholder="도로명 주소 (검색으로 입력)"
            readonly
            required
            autocomplete="street-address"
          />
          <input
            class="form-input"
            type="text"
            id="signup-address-line2"
            name="address_line2"
            placeholder="상세주소 (동·호수 등)"
            autocomplete="address-line2"
          />
          <p class="form-hint" data-jibun-hint hidden></p>
          <p class="form-error" data-address-error hidden role="alert"></p>
        </div>

        <div class="form-consent-group">
          <p class="auth-section-title">수신 동의</p>
          <label class="form-check">
            <input
              class="form-check__input"
              type="checkbox"
              name="email_consent"
              id="signup-email-consent"
              required
            />
            <span class="form-check__label">이메일 수신 동의 <span class="form-check__required-mark">(필수)</span></span>
          </label>
          <label class="form-check">
            <input
              class="form-check__input"
              type="checkbox"
              name="sms_consent"
              id="signup-sms-consent"
            />
            <span class="form-check__label">문자 수신 동의 <span class="form-check__optional">(선택)</span></span>
          </label>
          <p class="form-consent-note" role="note">
            아이디 찾기·비밀번호 재설정 안내 메일을 보내드리려면 <strong>이메일 수신 동의가 필요합니다.</strong>
            동의하지 않으면 가입할 수 없습니다.
          </p>
        </div>

        <p class="form-note">역할 선택과 기본등록(임시 저장)은 다음 단계에서 이어집니다.</p>

        <div class="form-error" data-signup-error hidden role="alert"></div>

        <div class="actions-stack">
          <button type="submit" class="btn btn--primary btn--block">다음: 역할 선택</button>
          <button type="button" class="btn btn--secondary btn--block" data-nav="/signup/terms">이전</button>
        </div>
      </form>
    </div>
  `;

  return renderAuthShell(content, { wide: true, showBack: true, backPath: '/signup/terms', backLabel: '약관동의' });
}

/**
 * @param {HTMLElement} root
 * @param {string} msg
 */
function showSignupError(root, msg) {
  const errorEl = root.querySelector('[data-signup-error]');
  if (errorEl) {
    errorEl.hidden = false;
    errorEl.textContent = msg;
  } else {
    alert(msg);
  }
}

export function bindSignupFormEvents(root) {
  bindGlobalEvents(root);

  const form = root.querySelector('[data-form="signup"]');
  const errorEl = root.querySelector('[data-signup-error]');
  const addressError = root.querySelector('[data-address-error]');
  const jibunHint = root.querySelector('[data-jibun-hint]');
  const zipEl = root.querySelector('#signup-address-zip');
  const addressEl = root.querySelector('#signup-address');
  const detailEl = root.querySelector('#signup-address-line2');

  root.querySelector('[data-action="search-address"]')?.addEventListener('click', async () => {
    if (addressError) {
      addressError.hidden = true;
      addressError.textContent = '';
    }
    try {
      await openKakaoPostcode((result) => {
        if (zipEl) zipEl.value = result.zonecode;
        if (addressEl) {
          addressEl.value = result.roadAddress + (result.buildingExtra || '');
        }
        if (jibunHint) {
          if (result.jibunAddress) {
            const prefix = result.convertedFromJibun
              ? '지번 → 도로명 변환됨'
              : '지번 참고';
            jibunHint.hidden = false;
            jibunHint.textContent = `${prefix}: ${result.jibunAddress}`;
          } else {
            jibunHint.hidden = true;
            jibunHint.textContent = '';
          }
        }
        detailEl?.focus();
      });
    } catch (err) {
      if (addressError) {
        addressError.hidden = false;
        addressError.textContent =
          err instanceof Error ? err.message : '주소 검색을 열 수 없습니다.';
      }
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.sms_consent = fd.get('sms_consent') === 'on';
    payload.email_consent = fd.get('email_consent') === 'on';
    payload.address = String(payload.address ?? '').trim();
    payload.address_zip = String(payload.address_zip ?? '').trim();
    payload.address_line2 = String(payload.address_line2 ?? '').trim();

    if (!payload.email_consent) {
      showSignupError(
        root,
        '아이디·비밀번호 찾기 안내를 위해 이메일 수신에 동의해 주세요.',
      );
      form.querySelector('#signup-email-consent')?.focus();
      return;
    }

    if (!payload.address_zip || !payload.address) {
      showSignupError(root, '주소 검색으로 도로명 주소를 선택해 주세요.');
      return;
    }

    const pwError = validatePassword(String(payload.password ?? ''), String(payload.password_confirm ?? ''), {
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      phone: String(payload.phone ?? ''),
    });
    if (pwError) {
      showSignupError(root, pwError);
      return;
    }

    signupState.accountDraft = {
      email: String(payload.email ?? ''),
      password: String(payload.password ?? ''),
      password_confirm: String(payload.password_confirm ?? ''),
      name: String(payload.name ?? ''),
      phone: String(payload.phone ?? ''),
      address: payload.address,
      address_zip: payload.address_zip,
      address_line2: payload.address_line2,
      email_consent: true,
      sms_consent: Boolean(payload.sms_consent),
    };
    const detail = payload.address_line2 ? ` ${payload.address_line2}` : '';
    signupState.accountAddress = `${payload.address}${detail}`.trim();
    navigate('/signup/role');
  });
}
