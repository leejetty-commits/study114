/**
 * 9장 부록 §17 — 비밀번호 찾기/재설정 스테이지 (로그인보다 조용한 중앙 카드)
 */

import { renderAuthShell } from './layout.js';

export function renderRecoveryStage(cardHtml) {
  return renderAuthShell(
    `
    <div class="recovery-stage">
      <header class="recovery-stage__header">
        <a href="#/login" class="recovery-stage__logo" data-nav="/login" aria-label="로그인으로">
          <img
            class="recovery-stage__logo-img"
            src="/assets/brand/logo-wordmark.png"
            alt="우동공과"
            width="120"
            height="32"
          />
        </a>
      </header>
      <div class="recovery-stage__card panel">${cardHtml}</div>
    </div>`,
    { hideDefaultCard: true },
  );
}

export function renderRecoverySuccessIcon() {
  return `<div class="recovery-stage__icon" aria-hidden="true"><span>✓</span></div>`;
}

export function renderPasswordRuleList() {
  return `
    <ul class="recovery-rules" aria-label="비밀번호 규칙">
      <li>8~14자</li>
      <li>영문, 숫자, 특수문자 포함</li>
      <li>쉬운 비밀번호 사용 불가</li>
    </ul>`;
}

export function renderRecoveryLinks({ login = true, signup = true, findPassword = false, findId = false } = {}) {
  const parts = [];
  if (findId) {
    parts.push('<a href="#/find-id" data-nav="/find-id">아이디 찾기</a>');
  }
  if (findPassword) {
    parts.push('<a href="#/find-password" data-nav="/find-password">비밀번호 찾기</a>');
  }
  if (login) {
    parts.push('<a href="#/login" data-nav="/login">로그인으로 돌아가기</a>');
  }
  if (signup) {
    parts.push('<a href="#/signup/terms" data-nav="/signup/terms">회원가입</a>');
  }
  return `<div class="recovery-links">${parts.join('<span class="recovery-links__sep">·</span>')}</div>`;
}

/** @param {'expired'|'used'|'invalid'} reason */
export function renderTokenErrorCard(reason) {
  const map = {
    expired: {
      title: '링크가 만료되었습니다',
      body: '비밀번호 재설정 링크의 유효 시간이 지났습니다.<br />다시 요청해 주세요.',
      cta: { label: '재설정 메일 다시 받기', nav: '/find-password' },
    },
    used: {
      title: '이미 사용된 링크입니다',
      body: '이 링크는 이미 사용되어 다시 사용할 수 없습니다.',
      cta: { label: '새 재설정 메일 받기', nav: '/find-password' },
    },
    invalid: {
      title: '유효하지 않은 요청입니다',
      body: '링크가 올바르지 않거나 더 이상 사용할 수 없습니다.',
      cta: { label: '비밀번호 찾기로 돌아가기', nav: '/find-password' },
    },
  };
  const item = map[reason] || map.invalid;
  return `
    <h1 class="auth-heading">${item.title}</h1>
    <p class="auth-subheading recovery-stage__desc">${item.body}</p>
    <button type="button" class="btn btn--primary btn--block" data-nav="${item.cta.nav}">${item.cta.label}</button>
    ${renderRecoveryLinks({ signup: false })}`;
}
