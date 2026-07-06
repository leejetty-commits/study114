import { POLICY_PAGES, POLICY_SHORT_NOTICE, getPolicyPage } from './policy-copy.js';
import { getPolicySlug } from './policy-router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

const POLICY_NAV_SHORT = {
  terms: '약관',
  privacy: '개인정보',
  platform: '플랫폼',
  trust: '신뢰정보',
  safety: '안전과외',
  'student-privacy': '학생정보',
  reporting: '신고·제재',
};

export function renderPolicyNav(activeSlug) {
  return `
    <nav class="sup-nav sup-nav--policy" aria-label="정책 페이지">
      <ul class="sup-nav__list">
        ${POLICY_PAGES.map(
          (page) => `
            <li>
              <a href="#/policy/${page.slug}" class="sup-nav__link${page.slug === activeSlug ? ' is-active' : ''}" data-policy-nav="/policy/${page.slug}" title="${esc(page.title)}">
                <span class="sup-nav__label">${esc(POLICY_NAV_SHORT[page.slug] || page.title)}</span>
                <span class="sup-nav__id">${esc(page.id)}</span>
              </a>
            </li>`,
        ).join('')}
      </ul>
    </nav>`;
}

function renderSection(section) {
  const body = (section.body || []).map((p) => `<p>${esc(p)}</p>`).join('');
  const bullets = section.bullets?.length
    ? `<ul class="sup-list sup-list--bullets">${section.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`
    : '';
  return `
    <section class="sup-panel-card">
      <header class="sup-panel-card__head">
        <div><h2 class="sup-panel-card__title">${esc(section.title)}</h2></div>
      </header>
      <div class="sup-panel-card__body">${body}${bullets}</div>
    </section>`;
}

export function renderPolicyScreen(path) {
  const slug = getPolicySlug(path);
  const page = getPolicyPage(slug) || POLICY_PAGES[0];
  const links = page.links?.length
    ? `<div class="sup-inline-links">${page.links
        .map((link) => `<a href="#${link.href}" class="sup-inline-link" data-policy-nav="${link.href}">${esc(link.label)}</a>`)
        .join('')}</div>`
    : '';

  const shortNotice =
    page.slug === 'platform'
      ? POLICY_SHORT_NOTICE.footer
      : page.slug === 'trust'
        ? POLICY_SHORT_NOTICE.trust
        : page.slug === 'student-privacy'
          ? POLICY_SHORT_NOTICE.studentPrivacy
          : '';

  return `
      <section class="sup-panel-card">
        <header class="sup-panel-card__head">
          <div>
            <h2 class="sup-panel-card__title">${esc(page.title)}</h2>
            <p class="sup-panel-card__lead">${esc(page.summary)}</p>
          </div>
          <span class="sup-panel-card__id">${esc(page.id)}</span>
        </header>
        <div class="sup-panel-card__body">
          ${shortNotice ? `<div class="sup-flash" role="note">${esc(shortNotice)}</div>` : ''}
          ${links}
        </div>
      </section>
      ${page.sections.map(renderSection).join('')}
  `;
}

export function bindPolicyScreenEvents() {}
