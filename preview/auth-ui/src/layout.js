import { ROLE_LABELS } from './state.js';

const ROUTES = {
  '/login': 'login',
  '/signup/terms': 'signupTerms',
  '/signup/role': 'signupRole',
  '/signup/form': 'signupForm',
  '/signup/basic': 'signupBasic',
  '/signup/complete': 'signupComplete',
  '/find-id': 'findId',
  '/find-password': 'findPassword',
};

const SCREEN_LABELS = {
  login: '로그인',
  signupTerms: '약관동의',
  signupRole: '회원구분',
  signupForm: '가입폼',
  signupBasic: '기본등록',
  signupComplete: '가입완료',
  findId: '아이디찾기',
  findPassword: '비밀번호찾기',
};

/** @param {string} path */
export function navigate(path) {
  window.location.hash = path;
}

/** @returns {string} */
export function getCurrentPath() {
  const hash = window.location.hash.slice(1) || '/login';
  return hash.startsWith('/') ? hash : `/${hash}`;
}

/** @returns {string} */
export function getCurrentScreen() {
  const path = getCurrentPath();
  return ROUTES[path] || 'login';
}

export function renderPreviewToolbar(activeScreen) {
  const screens = Object.entries(ROUTES);
  const theme = document.body.dataset.theme || 'v1';

  return `
    <div class="preview-toolbar">
      <span class="preview-toolbar__label">우동공과 · 인증 UI 프리뷰</span>
      <div class="preview-toolbar__group">
        <button type="button" class="preview-toolbar__btn ${theme === 'v1' ? 'is-active' : ''}" data-theme-switch="v1">
          1안 · 안정형
        </button>
        <button type="button" class="preview-toolbar__btn ${theme === 'v2' ? 'is-active' : ''}" data-theme-switch="v2">
          2안 · 세련형
        </button>
        <span class="preview-toolbar__divider"></span>
        ${screens
          .map(([path, key]) => {
            const label = SCREEN_LABELS[key];
            const isActive = key === activeScreen;
            return `<button type="button" class="preview-toolbar__btn ${isActive ? 'is-active' : ''}" data-nav="${path}">${label}</button>`;
          })
          .join('')}
      </div>
    </div>
  `;
}

export function renderAuthShell(content, options = {}) {
  const { wide = false, showBack = false, backPath = '/login', backLabel = '뒤로' } = options;

  return `
    ${renderPreviewToolbar(getCurrentScreen())}
    <div class="auth-shell">
      <header class="auth-shell__header">
        <a href="#/login" class="auth-shell__logo" data-nav="/login" aria-label="우동공과 홈">
          <img
            class="auth-shell__logo-img"
            src="/assets/brand/logo-wordmark.png"
            alt="우동공과"
            width="120"
            height="32"
          />
        </a>
      </header>
      <main class="auth-shell__main">
        <div class="auth-shell__card ${wide ? 'auth-shell__card--wide' : ''}">
          ${showBack ? `<a href="#${backPath}" class="back-link" data-nav="${backPath}">← ${backLabel}</a>` : ''}
          ${content}
        </div>
      </main>
      <footer class="auth-shell__footer">
        © 2026 우동공과 · study114 · UI Preview
      </footer>
    </div>
  `;
}

export function renderStepIndicator(currentStep, totalSteps = 6) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  return `
    <div class="step-indicator" aria-label="가입 단계 ${currentStep}/${totalSteps}">
      ${steps
        .map((step) => {
          let cls = 'step-indicator__dot';
          if (step === currentStep) cls += ' is-active';
          else if (step < currentStep) cls += ' is-done';
          return `<span class="${cls}"></span>`;
        })
        .join('')}
    </div>
  `;
}

export function renderSocialLogin() {
  return `
    <div class="social-login">
      <button type="button" class="social-btn social-btn--naver" data-action="social-naver">
        <svg class="social-btn__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16.273 12.845L7.376 0H0v24h7.727V11.156L16.624 24H24V0h-7.727v12.845z"/>
        </svg>
        네이버로 시작하기
      </button>
      <button type="button" class="social-btn social-btn--google" data-action="social-google">
        <svg class="social-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google로 시작하기
      </button>
    </div>
  `;
}

export function renderTempNotice(message) {
  return `
    <div class="temp-notice" role="note">
      <span class="temp-notice__badge">임시</span>
      <span class="temp-notice__text">${message}</span>
    </div>
  `;
}

export function renderBrandHero() {
  return `
    <div class="brand-hero">
      <img
        class="brand-hero__logo"
        src="/assets/brand/logo-full.png"
        alt="우리동네 공부방과외 우동공과"
        width="280"
        height="80"
      />
    </div>
  `;
}

export function renderRoleBadge(role) {
  if (!role) return '';
  return `<span class="role-card__badge">${ROLE_LABELS[role]} 회원가입</span>`;
}

export function bindGlobalEvents(root) {
  root.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.nav);
    });
  });

  root.querySelectorAll('[data-theme-switch]').forEach((el) => {
    el.addEventListener('click', () => {
      document.body.dataset.theme = el.dataset.themeSwitch;
      window.dispatchEvent(new Event('themechange'));
    });
  });

  root.querySelectorAll('[data-action="social-naver"], [data-action="social-google"]').forEach((el) => {
    el.addEventListener('click', () => {
      const provider = el.dataset.action === 'social-naver' ? '네이버' : 'Google';
      alert(`[프리뷰] ${provider} 소셜 로그인은 추후 연동 예정입니다.`);
    });
  });
}
