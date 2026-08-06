import {
  GUIDE_HOME_CARDS,
  GUIDE_FLOW_SUMMARY,
  GUIDE_SUPPORT_LINKS,
  GUIDE_HOME_CTA,
  GUIDE_PAGES,
} from './copy.js';
import { getGuidePageId } from './router.js';
import { AUTH_UI_BASE, STUDY_ROOM_REGISTER_URL, TUTOR_REGISTER_URL, searchUiUrl } from '../nav-config.js';
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
          (step, index) => `
            <li class="guide-step-card">
              <span class="guide-step-card__index">${index + 1}</span>
              ${
                step.icon
                  ? `<span class="guide-step-card__icon" aria-hidden="true"><img src="${esc(step.icon)}" alt="" width="28" height="28" /></span>`
                  : ''
              }
              <h3 class="guide-step-card__title">${esc(step.title)}</h3>
              <p class="guide-step-card__body">${esc(step.body)}</p>
            </li>`,
        )
        .join('')}
    </ol>`;
}

function renderFeatureCards(items) {
  if (!items?.length) return '';
  return `
    <section class="guide-section">
      <div class="guide-section__head">
        <h2 class="guide-section__title">핵심 기능 먼저 보기</h2>
      </div>
      <div class="guide-feature-grid">
        ${items
          .map(
            (item) => `
              <article class="guide-feature-card">
                ${
                  item.icon
                    ? `<div class="guide-feature-card__icon" aria-hidden="true"><img src="${esc(item.icon)}" alt="" width="28" height="28" /></div>`
                    : ''
                }
                <h3 class="guide-feature-card__title">${esc(item.title)}</h3>
                <p class="guide-feature-card__body">${esc(item.body)}</p>
              </article>`,
          )
          .join('')}
      </div>
    </section>`;
}

function renderActionCards(items) {
  if (!items?.length) return '';
  return `
    <section class="guide-section">
      <div class="guide-section__head">
        <h2 class="guide-section__title">바로 이어가기</h2>
        <p class="guide-section__desc">찾기 → 찜 → 비교 → 상세 확인 → 쪽지 흐름을 실제로 이어갈 때 쓰는 입구입니다.</p>
      </div>
      <div class="guide-next-grid">
        ${items
          .map((item, index) => {
            const target = resolveGuideCtaHref(item);
            const cls = `guide-next-card ${index === 0 ? 'guide-next-card--primary' : ''}`;
            const hint = item.hint ? `<span class="guide-next-card__hint">${esc(item.hint)}</span>` : '';
            const body = `<span class="guide-next-card__label">${esc(item.label)}</span>${hint}`;
            if (target.external) {
              return `<a class="${cls}" href="${esc(target.href)}" data-same-tab-href="${esc(target.href)}">${body}</a>`;
            }
            return `<a class="${cls}" href="${esc(target.href)}" data-guide-nav="${esc(target.nav)}">${body}</a>`;
          })
          .join('')}
      </div>
    </section>`;
}

function renderCompareGuide(guide) {
  if (!guide) return '';
  return `
    <section class="guide-section guide-compare-guide">
      <div class="guide-section__head">
        <h2 class="guide-section__title">${esc(guide.title)}</h2>
        <p class="guide-section__desc">${esc(guide.lead)}</p>
      </div>
      <div class="guide-compare-guide__list">
        ${(guide.blocks || [])
          .map(
            (block) => `
              <article class="guide-compare-guide__block">
                <h3 class="guide-compare-guide__title">${esc(block.title)}</h3>
                <div class="guide-compare-guide__body">${esc(block.body)}</div>
              </article>`,
          )
          .join('')}
      </div>
    </section>`;
}

function normalizeFlowStep(step) {
  if (typeof step === 'string') return { label: step, caption: '', icon: '' };
  return {
    label: step.label || '',
    caption: step.caption || '',
    icon: step.icon || '',
  };
}

function renderFlowChips(steps) {
  return `
    <div class="guide-flow-chart">
      ${steps
        .map((raw, index) => {
          const step = normalizeFlowStep(raw);
          return `
            <div class="guide-flow-chart__step">
              <span class="guide-flow-chart__index">${index + 1}</span>
              ${
                step.icon
                  ? `<span class="guide-flow-chart__icon" aria-hidden="true"><img src="${esc(step.icon)}" alt="" width="24" height="24" /></span>`
                  : ''
              }
              <div class="guide-flow-chart__copy">
                <span class="guide-flow-chart__label">${esc(step.label)}</span>
                ${step.caption ? `<span class="guide-flow-chart__caption">${esc(step.caption)}</span>` : ''}
              </div>
            </div>`;
        })
        .join('')}
    </div>`;
}

function renderGuideHome() {
  return `
    <section class="guide-hero">
      <div class="guide-hero__media" aria-hidden="true"></div>
      <div class="guide-hero__shade"></div>
      <div class="guide-hero__inner">
        <span class="guide-eyebrow">안내 허브</span>
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
        <p class="guide-section__desc">홈에서는 길게 설명하지 않고, 가장 많이 찾는 4개 주제로 바로 이동할 수 있게 구성했습니다.</p>
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
        <h2 class="guide-section__title">빠른 흐름 요약</h2>
        <p class="guide-section__desc">자세한 설명은 하위 페이지에서 보고, 여기서는 내 상황에 맞는 흐름만 한눈에 잡을 수 있게 요약했습니다.</p>
      </div>
      <div class="guide-summary-grid">
        ${GUIDE_FLOW_SUMMARY.map(
          (item) => `
            <article class="guide-summary-card">
              <h3 class="guide-summary-card__title">${esc(item.title)}</h3>
              <div class="guide-summary-card__chips">
                ${item.steps
                  .map((step) => {
                    if (typeof step === 'string') {
                      return `<span class="guide-summary-card__chip">${esc(step)}</span>`;
                    }
                    if (step.path) {
                      return renderAction(step, 'guide-summary-card__chip guide-summary-card__chip--link');
                    }
                    return `<span class="guide-summary-card__chip">${esc(step.label)}</span>`;
                  })
                  .join('')}
              </div>
            </article>`,
        ).join('')}
      </div>
    </section>

    <section class="guide-section">
      <div class="guide-section__head">
        <h2 class="guide-section__title">고객센터 연결</h2>
        <p class="guide-section__desc">이용안내는 가이드 본문, 고객센터는 문제 해결과 지원 중심으로 도움을 줍니다.</p>
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
          ${
            group.image
              ? `<div class="guide-detail-group__media" style="background-image:url('${esc(group.image)}')" role="img" aria-label="${esc(group.title)}"></div>`
              : ''
          }
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

function formatFaqAnswer(text) {
  return `<div class="guide-faq-item__a-body">${esc(text)}</div>`;
}

function renderFaqList(items) {
  if (!items?.length) return '';
  const hasAnswers = items.some((item) => typeof item === 'object' && item?.a);
  return `
    <section class="guide-section">
      <div class="guide-section__head">
        <h2 class="guide-section__title">함께 많이 묻는 질문</h2>
      </div>
      <div class="guide-faq-list${hasAnswers ? ' guide-faq-list--accordion' : ''}">
        ${items
          .map((item, index) => {
            if (typeof item === 'string') {
              return `<div class="guide-faq-list__item">${esc(item)}</div>`;
            }
            return `
              <details class="guide-faq-item"${index === 0 ? '' : ''}>
                <summary class="guide-faq-item__q">${esc(item.q)}</summary>
                <div class="guide-faq-item__a">${formatFaqAnswer(item.a)}</div>
              </details>`;
          })
          .join('')}
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

function renderSupportCards(items) {
  if (!items?.length) return '';
  return `
    <section class="guide-section">
      <div class="guide-section__head">
        <h2 class="guide-section__title">도움이 필요할 때</h2>
      </div>
      <div class="guide-support-card-grid">
        ${items
          .map(
            (item, index) => `
              <article class="guide-support-card">
                <h3 class="guide-support-card__title">${esc(item.title)}</h3>
                <p class="guide-support-card__body">${esc(item.body)}</p>
                ${renderAction(item.action, `guide-btn ${index !== 1 ? 'guide-btn--primary' : 'guide-btn--secondary'}`)}
              </article>`,
          )
          .join('')}
      </div>
    </section>`;
}

function renderTipBlock(tip) {
  if (!tip) return '';
  return `
    <section class="guide-tip-card">
      <div>
        <h2 class="guide-tip-card__title">${esc(tip.title)}</h2>
        <p class="guide-tip-card__body">${esc(tip.body)}</p>
      </div>
      <div class="guide-tip-card__action">
        ${renderAction(tip.action, 'guide-btn guide-btn--secondary')}
      </div>
    </section>`;
}

function renderGuideDetail(page) {
  return `
    <section class="guide-detail-hero">
      <div class="guide-detail-hero__copy">
        <span class="guide-eyebrow guide-eyebrow--solid">${esc(page.heroLabel || '이용안내')}</span>
        <h2 class="guide-detail-hero__title">${esc(page.title)}</h2>
        <p class="guide-detail-hero__body">${esc(page.summary)}</p>
        ${page.lead ? `<div class="guide-highlight">${esc(page.lead)}</div>` : ''}
        ${renderPrinciples(page.principles)}
      </div>
      ${page.image ? `<div class="guide-detail-hero__media" style="background-image:url('${page.image}')"></div>` : ''}
    </section>
    ${renderFeatureCards(page.featureCards)}
    ${page.conceptTable ? `<section class="guide-section">${renderConceptTable(page.conceptTable)}</section>` : ''}
    ${page.flow?.length ? `<section class="guide-section"><div class="guide-section__head"><h2 class="guide-section__title">흐름 차트</h2><p class="guide-section__desc">${esc(page.flowLead || '먼저 전체 흐름을 차트로 보고, 아래 단계별 설명에서 세부를 확인할 수 있게 정리했습니다.')}</p></div>${renderFlowChips(page.flow)}</section>` : ''}
    <section class="guide-section">
      <div class="guide-section__head">
        <h2 class="guide-section__title">단계별 안내</h2>
      </div>
      ${renderStepList(page.steps || [])}
    </section>
    ${renderDetailGroups(page.detailGroups)}
    ${page.note ? `<section class="guide-note">${esc(page.note)}</section>` : ''}
    ${renderWarnings(page.warnings)}
    ${renderSupportCards(page.supportCards)}
    ${renderCompareGuide(page.compareGuide)}
    ${renderActionCards(page.actionCards)}
    ${renderFaqList(page.faq)}
    ${renderTipBlock(page.tip)}
    ${
      page.footerNote?.length
        ? `<section class="guide-footer-note"><ul class="guide-bullet-list">${page.footerNote.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></section>`
        : ''
    }
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

