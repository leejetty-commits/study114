import { AUTH_UI_BASE } from '../../../shared/preview-links.js';
import { getNavRole, navigate } from '../state.js';
import { getDefaultMessagesPath } from '../messages/router.js';
import {
  PRINCIPLES_POSITIVE,
  PRINCIPLES_NEGATIVE,
  HOME_CARDS,
  GUIDE_ARTICLES,
  ROLE_GUIDES,
  FAQ_ITEMS,
  NOTICES,
  TERMS_LINKS,
  OPERATIONAL_CONTACT,
  getGuideBySlug,
  getRelatedGuides,
} from './content.js';
import { getSectionFromPath, parseGuideSlug } from './router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function mdLite(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function renderPrinciplesBox(compact = false) {
  const pos = PRINCIPLES_POSITIVE.map(
    (p) =>
      `<div class="sup-principle${compact ? ' sup-principle--compact' : ''}">
         <span class="sup-principle__title">${esc(p.title)}</span>
         <span class="sup-principle__body">${esc(p.body)}</span>
       </div>`,
  ).join('');
  const neg = PRINCIPLES_NEGATIVE.map(
    (n) => `<li><strong>${esc(n.label)}</strong> — ${esc(n.msg)}</li>`,
  ).join('');
  return `
    <section class="sup-box sup-box--principles">
      <h2 class="sup-box__title">안전과외 3대 원칙</h2>
      <div class="sup-principles">${pos}</div>
      <h3 class="sup-box__subtitle">우동공과가 하지 않는 것</h3>
      <ul class="sup-neg-list">${neg}</ul>
    </section>`;
}

function renderContactCtas(contextLabel) {
  const role = getNavRole();
  const isGuest = role === 'guest';
  const msgBtn = isGuest
    ? `<a href="${AUTH_UI_BASE}/#/login" class="btn btn--secondary btn--sm" data-sup-external="login">로그인 · 회원가입</a>
       <p class="sup-cta-hint">회원 간 공식 접촉(쪽지)은 로그인 후 이용</p>`
    : `<a href="#${getDefaultMessagesPath()}" class="btn btn--primary btn--sm" data-sup-nav="${getDefaultMessagesPath()}">쪽지함 열기</a>
       <p class="sup-cta-hint">회원 ↔ 회원 공식 접촉 · 16장</p>`;
  return `
    <div class="sup-cta-row" data-sup-context="${esc(contextLabel)}">
      <div class="sup-cta-col">
        <span class="sup-cta-label">회원 간 접촉</span>
        ${msgBtn}
      </div>
      <div class="sup-cta-col">
        <span class="sup-cta-label">운영·서비스 문의 (P17-07)</span>
        <a href="#/support/contact" class="btn btn--secondary btn--sm" data-sup-nav="/support/contact">운영 문의하기</a>
        <p class="sup-cta-hint">${esc(OPERATIONAL_CONTACT.email)} · 쪽지함과 별도</p>
      </div>
    </div>`;
}

/** @param {string} path */
export function renderSupportScreen(path) {
  const slug = parseGuideSlug(path);
  if (slug) return renderGuideDetail(slug);
  if (path === '/support/safe') return renderGuideList();
  return renderHome(getSectionFromPath(path));
}

/** @param {string | null} scrollSection */
function renderHome(scrollSection) {
  const role = getNavRole();
  const roleGuide = ROLE_GUIDES[role] || ROLE_GUIDES.guest;
  const cards = HOME_CARDS.map(
    (c) =>
      `<a href="#${c.href}" class="sup-card" data-sup-nav="${c.href}">
         <span class="sup-card__title">${esc(c.title)}</span>
         <span class="sup-card__desc">${esc(c.desc)}</span>
       </a>`,
  ).join('');
  const faq = FAQ_ITEMS.map(
    (f, i) =>
      `<details class="sup-faq" id="faq-${i}">
         <summary>${esc(f.q)}</summary>
         <p>${mdLite(f.a)}</p>
       </details>`,
  ).join('');
  const notices = NOTICES.map(
    (n) =>
      `<div class="sup-notice-row">
         <time>${esc(n.date)}</time>
         <span>${esc(n.title)}</span>
       </div>`,
  ).join('');
  const terms = TERMS_LINKS.map(
    (t) => `<span class="sup-term-chip">${esc(t.label)} · ${esc(t.href)}</span>`,
  ).join('');

  return `
    ${renderPrinciplesBox()}
    <section class="sup-section">
      <h2 class="sup-section__title">빠른 안내</h2>
      <div class="sup-card-grid">${cards}</div>
    </section>
    <section class="sup-section" id="guide" data-sup-section="guide">
      <h2 class="sup-section__title">이용안내 · P17-01 #guide</h2>
      <p class="sup-section__lead">역할별 요약 — ${esc(roleGuide.title)}</p>
      <ul class="sup-list">${roleGuide.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
    </section>
    <section class="sup-section" id="faq" data-sup-section="faq">
      <h2 class="sup-section__title">자주 묻는 질문 · P17-04</h2>
      ${faq}
    </section>
    <section class="sup-section" id="notice" data-sup-section="notice">
      <h2 class="sup-section__title">공지사항 · P17-05</h2>
      <div class="sup-notice-list">${notices}</div>
    </section>
    <section class="sup-section" id="terms" data-sup-section="terms">
      <h2 class="sup-section__title">약관/정책 · P17-06</h2>
      <div class="sup-terms">${terms}</div>
    </section>
    <section class="sup-section" id="contact" data-sup-section="contact">
      <h2 class="sup-section__title">문의하기 · P17-07</h2>
      <p class="sup-section__lead">운영·서비스 문의 — 회원 간 쪽지와 <strong>별도 채널</strong>입니다.</p>
      ${renderContactCtas('home-contact')}
      <form class="sup-contact-form" data-sup-contact-form>
        <label class="sup-field">
          <span>이메일</span>
          <input type="email" name="email" placeholder="답변 받을 주소" required />
        </label>
        <label class="sup-field">
          <span>문의 내용</span>
          <textarea name="body" rows="4" placeholder="버그·정책·계정 문의" required></textarea>
        </label>
        <button type="submit" class="btn btn--primary btn--sm">보내기 (프리뷰)</button>
        <p class="sup-note">${esc(OPERATIONAL_CONTACT.note)}</p>
      </form>
    </section>
    ${scrollSection ? `<span data-sup-scroll="${esc(scrollSection)}" hidden></span>` : ''}`;
}

function renderGuideList() {
  const primary = GUIDE_ARTICLES.filter((g) => g.priority === 'primary');
  const secondary = GUIDE_ARTICLES.filter((g) => g.priority === 'secondary');
  const card = (g) =>
    `<a href="#/support/safe/${g.slug}" class="sup-guide-row" data-sup-nav="/support/safe/${g.slug}">
       <span class="sup-guide-row__badge">${g.priority === 'primary' ? '1차' : '후순위'}</span>
       <span class="sup-guide-row__title">${esc(g.title)}</span>
       <span class="sup-guide-row__meta">${esc(g.audience)}</span>
     </a>`;
  return `
    ${renderPrinciplesBox(true)}
    <section class="sup-section">
      <h2 class="sup-section__title">1차 가이드 (G1~G4)</h2>
      <div class="sup-guide-list">${primary.map(card).join('')}</div>
    </section>
    <section class="sup-section">
      <h2 class="sup-section__title">후순위 (G5~G7)</h2>
      <div class="sup-guide-list">${secondary.map(card).join('')}</div>
    </section>
    <a href="#/support" class="sup-back" data-sup-nav="/support">← 고객센터 홈</a>`;
}

/** @param {string} slug */
function renderGuideDetail(slug) {
  const guide = getGuideBySlug(slug);
  if (!guide) {
    return `<section class="sup-panel sup-empty">글을 찾을 수 없습니다. <a href="#/support/safe" data-sup-nav="/support/safe">목록으로</a></section>`;
  }
  const body = guide.body.map((p) => `<p>${mdLite(p)}</p>`).join('');
  const related = getRelatedGuides(slug)
    .map(
      (g) =>
        `<a href="#/support/safe/${g.slug}" class="sup-related" data-sup-nav="/support/safe/${g.slug}">${esc(g.title)}</a>`,
    )
    .join('');
  return `
    ${renderPrinciplesBox(true)}
    <article class="sup-article">
      <header class="sup-article__head">
        <span class="sup-article__meta">${esc(guide.audience)} · ${guide.priority === 'primary' ? 'G1~G4' : 'G5~G7'}</span>
        <h1 class="sup-article__title">${esc(guide.title)}</h1>
      </header>
      <div class="sup-article__body">${body}</div>
      ${related ? `<div class="sup-related-wrap"><span>관련 가이드</span>${related}</div>` : ''}
      ${renderContactCtas('guide-detail')}
    </article>
    <a href="#/support/safe" class="sup-back" data-sup-nav="/support/safe">← 가이드 목록</a>`;
}

/** @param {HTMLElement} root @param {string} path */
export function bindSupportScreenEvents(root, path) {
  root.querySelectorAll('[data-sup-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.getAttribute('data-sup-nav') || '/support');
    });
  });
  root.querySelectorAll('[data-sup-external="login"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(el.getAttribute('href'), '_blank', 'noopener');
    });
  });
  const form = root.querySelector('[data-sup-contact-form]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      alert(
        `[17장 프리뷰] 운영 문의\n\n` +
          `수신: ${OPERATIONAL_CONTACT.email}\n` +
          `실제 전송·티켓·SLA는 1차 범위 밖입니다.`,
      );
    });
  }
  const scrollEl = root.querySelector('[data-sup-scroll]');
  const section = scrollEl?.getAttribute('data-sup-scroll') || getSectionFromPath(path);
  if (section) {
    requestAnimationFrame(() => {
      const target = root.querySelector(`[data-sup-section="${section}"]`) || document.getElementById(section);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}
