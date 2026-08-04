import {
  GUIDE_HOME_CARDS,
  GUIDE_ROLE_CARDS,
  GUIDE_FLOW_SUMMARY,
  GUIDE_HOME_FAQ_PREVIEW,
  GUIDE_SUPPORT_LINKS,
  GUIDE_HOME_CTA,
  GUIDE_PAGES,
} from './copy.js';
import { getGuidePageId } from './router.js';
import { AUTH_UI_BASE, SEARCH_UI_URL, STUDY_ROOM_REGISTER_URL, TUTOR_REGISTER_URL, searchUiUrl } from '../nav-config.js';
import { getDefaultMessagesPath } from '../messages/router.js';
import { getDefaultMypagePath } from '../mypage/router.js';
import { getNavRole, navigate } from '../state.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function resolveGuideCtaHref(cta) {
  if (cta.path) return { href: `#${cta.path}`, nav: cta.path, external: false };
  switch (cta.external) {
    case 'search-room':
      return { href: searchUiUrl('room', getNavRole()), external: true };
    case 'search-tutor':
      return { href: searchUiUrl('tutor', getNavRole()), external: true };
    case 'register-room':
      return { href: STUDY_ROOM_REGISTER_URL, external: true };
    case 'register-tutor':
      return { href: TUTOR_REGISTER_URL, external: true };
    case 'signup':
      return { href: `${AUTH_UI_BASE}/#/signup/terms`, external: true };
    default:
      return { href: '#/guide', nav: '/guide', external: false };
  }
}

function renderAction(cta, className = 'guide-btn guide-btn--secondary') {
  const target = resolveGuideCtaHref(cta);
  if (target.external) {
    return `<a class="${className}" href="${esc(target.href)}" data-same-tab-href="${esc(target.href)}">${esc(cta.label)}</a>`;
  }
  return `<a class="${className}" href="${esc(target.href)}" data-guide-nav="${esc(target.nav)}">${esc(cta.label)}</a>`;
}

function renderStepList(steps) {
  return `
    <ol class="guide-step-list">
      ${steps
        .map(
          (step) => `
            <li class="guide-step-card">
              <h3 class="guide-step-card__title">${esc(step.title)}</h3>
              <p class="guide-step-card__body">${esc(step.body)}</p>
            </li>`,
        )
        .join('')}
    </ol>`;
}

function renderFlowChips(steps) {
  return `
    <div class="guide-flow">
      ${steps.map((step, index) => `<span class="guide-flow__chip">${esc(step)}${index < steps.length - 1 ? '<span class="guide-flow__arrow">→</span>' : ''}</span>`).join('')}
    </div>`;
}

function renderGuideHome() {
  return `
    <section class="guide-hero">
      <div class="guide-hero__media" aria-hidden="true"></div>
      <div class="guide-hero__shade"></div>
      <div class="guide-hero__inner">
        <span class="guide-eyebrow">메인메뉴 안내 허브</span>
        <h2 class="guide-hero__title">우동공과 이용안내</h2>
        <p class="guide-hero__body">
          처음 이용하는 분도, 등록을 시작하는 분도 필요한 주제를 골라
          <strong> 빠르게 이해하고 바로 다음 단계로 이동</strong>할 수 있도록 안내해드릴게요.
        </p>
        <div class="guide-hero__actions">
          ${renderAction({ label: '전체 흐름 보기', path: '/guide/getting-started' }, 'guide-btn guide-btn--primary')}
          ${renderAction({ label: '고객센터 보기', path: '/support' })}
        </div>
      </div>
    </section>

    <section class="guide-section">
      <div class="guide-section__head">
        <h2 class="guide-section__title">자주 찾는 안내</h2>
        <p class="guide-section__desc">비질리 시안의 카드 위계를 살려, 가장 많이 찾는 4개 주제를 바로 고를 수 있게 구성했습니다.</p>
      </div>
      <div class="guide-card-grid">
        ${GUIDE_HOME_CARDS.map(
          (card) => `
            <article class="guide-topic-card">
              <div class="guide-topic-card__media" style="background-image:url('${card.image}')"></div>
              <div class="guide-topic-card__body">
                <h3 class="guide-topic-card__title">${esc(card.title)}</h3>
                <p class="guide-topic-card__desc">${esc(card.desc)}</p>
                ${renderAction({ label: card.cta, path: `/guide/${card.id}`.replace('/guide/home', '/guide') }, 'guide-link-btn')}
              </div>
            </article>`,
        ).join('')}
      </div>
    </section>

    <section class="guide-section guide-section--soft">
      <div class="guide-section__head">
        <h2 class="guide-section__title">역할별 빠른 시작</h2>
        <p class="guide-section__desc">찾는 사람과 등록하는 사람의 시작점이 다르기 때문에, 감성 소개 대신 실제 이동 목적이 보이도록 CTA를 분리했습니다.</p>
      </div>
      <div class="guide-role-grid">
        ${GUIDE_ROLE_CARDS.map(
          (card) => `
            <article class="guide-role-card">
              <span class="guide-role-card__eyebrow">${esc(card.eyebrow)}</span>
              <h3 class="guide-role-card__title">${esc(card.title)}</h3>
              <p class="guide-role-card__body">${esc(card.body)}</p>
              <div class="guide-role-card__actions">
                ${card.ctas.map((cta, index) => renderAction(cta, `guide-btn ${index === 0 ? 'guide-btn--primary' : 'guide-btn--secondary'}`)).join('')}
              </div>
            </article>`,
        ).join('')}
      </div>
    </section>

    <section class="guide-section">
      <div class="guide-section__head">
        <h2 class="guide-section__title">핵심 흐름 요약</h2>
        <p class="guide-section__desc">긴 설명 대신 어디서 출발해 어디로 이어지는지 한 번에 보이도록 3개 흐름 블록으로 압축했습니다.</p>
      </div>
      <div class="guide-summary-grid">
        ${GUIDE_FLOW_SUMMARY.map(
          (item) => `
            <article class="guide-summary-card">
              <h3 class="guide-summary-card__title">${esc(item.title)}</h3>
              <div class="guide-summary-card__chips">
                ${item.steps.map((step) => `<span class="guide-summary-card__chip">${esc(step)}</span>`).join('')}
              </div>
            </article>`,
        ).join('')}
      </div>
    </section>

    <section class="guide-section guide-section--faq">
      <div class="guide-faq-preview">
        <div class="guide-faq-preview__intro">
          <span class="guide-eyebrow">FAQ 미리보기</span>
          <h2 class="guide-section__title">자주 묻는 질문</h2>
          <p class="guide-section__desc">홈에서는 미리보기만 제공하고, 전체 FAQ는 고객센터로 분리해 안내 허브와 지원 허브의 성격을 나눴습니다.</p>
          ${renderAction({ label: '전체 FAQ 보기', path: '/support/faq' }, 'guide-btn guide-btn--secondary')}
        </div>
        <div class="guide-faq-preview__list">
          ${GUIDE_HOME_FAQ_PREVIEW.map((item) => `<div class="guide-faq-preview__item">${esc(item)}</div>`).join('')}
        </div>
      </div>
    </section>

    <section class="guide-section">
      <div class="guide-section__head">
        <h2 class="guide-section__title">고객센터 연결</h2>
        <p class="guide-section__desc">이용안내는 가이드 본문, 고객센터는 문제 해결과 지원 중심으로 역할을 분리했습니다.</p>
      </div>
      <div class="guide-support-links">
        ${GUIDE_SUPPORT_LINKS.map((item) => renderAction(item, 'guide-support-link')).join('')}
      </div>
    </section>

    <section class="guide-home-cta">
      <div class="guide-home-cta__inner">
        <h2 class="guide-home-cta__title">다음 단계로 바로 이동해보세요</h2>
        <p class="guide-home-cta__body">허브형 페이지의 종결점은 적절한 가이드 선택 또는 실제 찾기·등록 흐름으로의 이동입니다.</p>
        <div class="guide-home-cta__actions">
          ${GUIDE_HOME_CTA.map((cta, index) => renderAction(cta, `guide-btn ${index === 0 ? 'guide-btn--primary' : 'guide-btn--secondary'}`)).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderPrinciples(principles) {
  if (!principles?.length) return '';
  return `<div class="guide-principles">${principles.map((item) => `<div class="guide-principle">${esc(item)}</div>`).join('')}</div>`;
}

function renderDetailGroups(groups) {
  if (!groups?.length) return '';
  return groups
    .map(
      (group) => `
        <section class="guide-detail-group">
          <div class="guide-section__head">
            <h2 class="guide-section__title">${esc(group.title)}</h2>
            <p class="guide-section__desc">${esc(group.lead)}</p>
          </div>
          <div class="guide-detail-columns">
            ${group.columns
              .map(
                (column) => `
                  <article class="guide-detail-column">
                    <h3 class="guide-detail-column__title">${esc(column.title)}</h3>
                    <ul class="guide-bullet-list">
                      ${column.items.map((item) => `<li>${esc(item)}</li>`).join('')}
                    </ul>
                  </article>`,
              )
              .join('')}
          </div>
        </section>`,
    )
    .join('');
}

function renderConceptTable(rows) {
  if (!rows?.length) return '';
  return `
    <div class="guide-table">
      <div class="guide-table__row guide-table__row--head">
        <span>기능</span><span>의미</span><span>언제 쓰는가</span>
      </div>
      ${rows
        .map(
          (row) => `
            <div class="guide-table__row">
              <span>${esc(row[0])}</span><span>${esc(row[1])}</span><span>${esc(row[2])}</span>
            </div>`,
        )
        .join('')}
    </div>`;
}

function renderFaqList(items) {
  if (!items?.length) return '';
  return `
    <section class="guide-section">
      <div class="guide-section__head">
        <h2 class="guide-section__title">함께 많이 묻는 질문</h2>
      </div>
      <div class="guide-faq-list">
        ${items.map((item) => `<div class="guide-faq-list__item">${esc(item)}</div>`).join('')}
      </div>
    </section>`;
}

function renderWarnings(items) {
  if (!items?.length) return '';
  return `
    <section class="guide-warning-box">
      <h2 class="guide-warning-box__title">꼭 기억해 주세요</h2>
      <ul class="guide-bullet-list">
        ${items.map((item) => `<li>${esc(item)}</li>`).join('')}
      </ul>
    </section>`;
}

function renderGuideDetail(page) {
  return `
    <section class="guide-detail-hero">
      <span class="guide-eyebrow">${esc(page.heroLabel || '이용안내')}</span>
      <h2 class="guide-detail-hero__title">${esc(page.title)}</h2>
      <p class="guide-detail-hero__body">${esc(page.summary)}</p>
      ${page.lead ? `<div class="guide-highlight">${esc(page.lead)}</div>` : ''}
      ${renderPrinciples(page.principles)}
    </section>
    ${page.conceptTable ? `<section class="guide-section">${renderConceptTable(page.conceptTable)}</section>` : ''}
    <section class="guide-section">
      <div class="guide-section__head">
        <h2 class="guide-section__title">단계별 안내</h2>
      </div>
      ${renderStepList(page.steps || [])}
    </section>
    ${page.flow?.length ? `<section class="guide-section"><div class="guide-section__head"><h2 class="guide-section__title">흐름 한눈에 보기</h2></div>${renderFlowChips(page.flow)}</section>` : ''}
    ${renderDetailGroups(page.detailGroups)}
    ${page.note ? `<section class="guide-note">${esc(page.note)}</section>` : ''}
    ${renderWarnings(page.warnings)}
    ${renderFaqList(page.faq)}
    <section class="guide-detail-cta">
      <div class="guide-detail-cta__actions">
        ${(page.ctas || []).map((cta, index) => renderAction(cta, `guide-btn ${index === 0 ? 'guide-btn--primary' : 'guide-btn--secondary'}`)).join('')}
      </div>
    </section>
  `;
}

export function renderGuideScreen(path) {
  const id = getGuidePageId(path);
  if (id === 'home') return renderGuideHome();
  const page = GUIDE_PAGES[id];
  return renderGuideDetail(page || GUIDE_PAGES['getting-started']);
}

export function bindGuideScreenEvents(root) {
  root.querySelectorAll('[data-guide-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.getAttribute('data-guide-nav') || '/guide');
    });
  });
}

