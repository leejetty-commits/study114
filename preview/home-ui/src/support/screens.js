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
  TERMS_LINKS,
  OPERATIONAL_CONTACT,
  MEMBER_CONTACT_CTA,
  OPERATIONAL_CTA,
  TICKET_CATEGORIES,
  TICKET_STATUS_LABELS,
  getRelatedGuides,
} from './support-copy.js';
import { listNotices } from './notice-store.js';
import { createTicket, listTickets } from './ticket-store.js';
import { renderAdminScreen } from './admin-screens.js';
import { isAdminSupportPath, getSectionFromPath, parseGuideSlug } from './router.js';
import { getActiveNavId } from './nav.js';
import { renderFaqBoard, renderSingleOpenBoard, bindSingleOpenBoard } from '../../../shared/board/index.js';

const TICKET_FLASH_KEY = 'study114-support-ticket-flash';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function mdLite(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/** @param {{ body: string[], checklist?: { label: string, hint?: string }[] }} article */
function renderGuideContent(article) {
  const paras = article.body.map((p) => `<p>${mdLite(p)}</p>`).join('');
  const checklist = article.checklist?.length
    ? `<ul class="sup-checklist">${article.checklist
        .map(
          (item) =>
            `<li class="sup-checklist__item">
               <span class="sup-checklist__label">${esc(item.label)}</span>
               ${item.hint ? `<span class="sup-checklist__hint">${esc(item.hint)}</span>` : ''}
             </li>`,
        )
        .join('')}</ul>`
    : '';
  return paras + checklist;
}

function renderAdminFooterLink() {
  return `<p class="sup-admin-foot"><a href="#/support/admin" class="sup-inline-link" data-sup-nav="/support/admin">운영 콘솔 (17c 프리뷰)</a></p>`;
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
    ? `<a href="${AUTH_UI_BASE}/#/login" class="btn btn--secondary btn--sm" data-sup-external="login">${MEMBER_CONTACT_CTA.guestLoginLabel}</a>
       <p class="sup-cta-hint">${MEMBER_CONTACT_CTA.guestHint}</p>`
    : `<a href="#${getDefaultMessagesPath()}" class="btn btn--primary btn--sm" data-sup-nav="${getDefaultMessagesPath()}">${MEMBER_CONTACT_CTA.memberLabel}</a>
       <p class="sup-cta-hint">${MEMBER_CONTACT_CTA.memberHint}</p>`;
  return `
    <div class="sup-cta-row" data-sup-context="${esc(contextLabel)}">
      <div class="sup-cta-col">
        <span class="sup-cta-label">${MEMBER_CONTACT_CTA.columnLabel}</span>
        ${msgBtn}
      </div>
      <div class="sup-cta-col">
        <span class="sup-cta-label">${OPERATIONAL_CTA.columnLabel}</span>
        <a href="#/support/contact" class="btn btn--secondary btn--sm" data-sup-nav="/support/contact">${OPERATIONAL_CTA.buttonLabel}</a>
        <p class="sup-cta-hint">${esc(OPERATIONAL_CONTACT.email)} ${OPERATIONAL_CTA.hintSuffix}</p>
      </div>
    </div>`;
}

function renderPanel(title, screenId, bodyHtml, { lead = '' } = {}) {
  return `
    <section class="sup-panel-card">
      <header class="sup-panel-card__head">
        <div>
          <h2 class="sup-panel-card__title">${esc(title)}</h2>
          ${lead ? `<p class="sup-panel-card__lead">${lead}</p>` : ''}
        </div>
        <span class="sup-panel-card__id">${esc(screenId)}</span>
      </header>
      <div class="sup-panel-card__body">${bodyHtml}</div>
    </section>`;
}

/** @param {string} path */
export function renderSupportScreen(path) {
  if (isAdminSupportPath(path)) {
    return renderAdminScreen(path);
  }

  if (path === '/support/contact/tickets') {
    return renderContactTicketsSection();
  }

  const slug = parseGuideSlug(path);
  if (slug || path === '/support/safe' || path === '/support/safe/') {
    return renderSafeGuideAccordion(slug || null);
  }

  const navId = getActiveNavId(path);
  if (navId === 'guide') return renderGuideSection();
  if (navId === 'faq') return renderFaqSection();
  if (navId === 'notice') return renderNoticeSection();
  if (navId === 'contact') return renderContactSection();
  return renderHome();
}

function renderHome() {
  const cards = HOME_CARDS.map(
    (c) =>
      `<a href="#${c.href}" class="sup-card" data-sup-nav="${c.href}">
         <span class="sup-card__title">${esc(c.title)}</span>
         <span class="sup-card__desc">${esc(c.desc)}</span>
       </a>`,
  ).join('');
  const terms = TERMS_LINKS.map(
    (t) => `<span class="sup-term-chip">${esc(t.label)} · ${esc(t.href)}</span>`,
  ).join('');

  return `
    ${renderPrinciplesBox()}
    ${renderPanel(
      '빠른 안내',
      'P17-01',
      `<div class="sup-card-grid">${cards}</div>
       <p class="sup-home-hint">왼쪽 메뉴에서 FAQ · 공지 · 운영문의 · 안전과외 가이드를 각각 확인할 수 있습니다.</p>`,
      { lead: '자주 찾는 주제로 바로 이동합니다.' },
    )}
    ${renderPanel('약관/정책', 'P17-06', `<div class="sup-terms">${terms}</div>`, {
      lead: '푸터와 동일 링크 · 1차는 placeholder',
    })}
    ${renderContactCtas('home-footer')}`;
}

function renderGuideSection() {
  const role = getNavRole();
  const roleGuide = ROLE_GUIDES[role] || ROLE_GUIDES.guest;
  return `
    ${renderPanel(
      '이용안내',
      'P17-01 #guide',
      `<ul class="sup-list sup-list--bullets">${roleGuide.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
       <div class="sup-inline-links">
         <a href="#/support/faq" class="sup-inline-link" data-sup-nav="/support/faq">FAQ 보기</a>
         <a href="#/support/safe" class="sup-inline-link" data-sup-nav="/support/safe">안전과외 가이드</a>
       </div>`,
      { lead: `역할별 요약 — ${roleGuide.title}` },
    )}`;
}

function renderFaqSection() {
  const posts = FAQ_ITEMS.map((f, i) => ({
    id: `faq-${i + 1}`,
    title: f.q,
    body: f.a,
  }));

  return renderPanel(
    'FAQ 자주 묻는 질문',
    'P17-04',
    renderFaqBoard(posts),
    { lead: '1차는 정적 Q&A · 후순위 CMS/게시판 연동 가능' },
  );
}

function renderNoticeSection() {
  const posts = listNotices().map((n) => ({
    id: n.id,
    title: n.title,
    date: n.date,
    body: n.body,
  }));

  return renderPanel(
    '공지사항',
    'P17-05',
    `<p class="sup-section__lead">제목을 누르면 본문이 펼쳐집니다. 다른 공지를 누르면 이전 내용은 접힙니다.</p>
     ${renderSingleOpenBoard(posts, { variant: 'notice' })}
     ${renderAdminFooterLink()}`,
    { lead: '운영 공지 · 17c CMS에서 추가·수정 가능(프리뷰)' },
  );
}

function renderContactSection() {
  const flashId = sessionStorage.getItem(TICKET_FLASH_KEY);
  const flashHtml = flashId
    ? `<div class="sup-flash sup-flash--success" role="status">
         <strong>${esc(OPERATIONAL_CONTACT.ticketSuccessTitle)}</strong>
         <p>티켓 번호: <code>${esc(flashId)}</code> · <a href="#/support/contact/tickets" data-sup-nav="/support/contact/tickets">내 문의 내역</a></p>
       </div>`
    : '';

  const categoryOptions = TICKET_CATEGORIES.map(
    (c) => `<option value="${esc(c.value)}">${esc(c.label)}</option>`,
  ).join('');

  return renderPanel(
    '운영문의',
    'P17-07',
    `<p class="sup-section__lead">운영·서비스 문의 — 회원 간 쪽지와 <strong>별도 채널</strong>입니다.</p>
     ${flashHtml}
     ${renderContactCtas('contact-page')}
     <form class="sup-contact-form" data-sup-contact-form>
       <label class="sup-field">
         <span>문의 유형</span>
         <select name="category" required>${categoryOptions}</select>
       </label>
       <label class="sup-field">
         <span>이메일</span>
         <input type="email" name="email" placeholder="답변 받을 주소" required />
       </label>
       <label class="sup-field">
         <span>문의 내용</span>
         <textarea name="body" rows="4" placeholder="버그·정책·계정 문의" required></textarea>
       </label>
       <button type="submit" class="btn btn--primary btn--sm">티켓 접수</button>
       <p class="sup-note">${esc(OPERATIONAL_CONTACT.note)}</p>
     </form>
     <p class="sup-contact-extra">
       <a href="#/support/contact/tickets" class="sup-inline-link" data-sup-nav="/support/contact/tickets">내 문의 내역 보기</a>
       · 수신 이메일 ${esc(OPERATIONAL_CONTACT.email)}
     </p>
     ${renderAdminFooterLink()}`,
    { lead: '17c 티켓 접수 · SLA·실제 메일 발송은 후속' },
  );
}

function renderContactTicketsSection() {
  const tickets = listTickets();
  const categoryLabel = (value) => TICKET_CATEGORIES.find((c) => c.value === value)?.label || value;
  const rows = tickets
    .map(
      (t) =>
        `<tr>
           <td><code>${esc(t.id)}</code></td>
           <td>${esc(categoryLabel(t.category))}</td>
           <td><span class="sup-ticket-status sup-ticket-status--${esc(t.status)}">${esc(TICKET_STATUS_LABELS[t.status] || t.status)}</span></td>
           <td><time>${esc(t.createdAt.slice(0, 10))}</time></td>
         </tr>
         <tr class="sup-ticket-detail-row"><td colspan="4">${esc(t.body)}</td></tr>`,
    )
    .join('');

  return renderPanel(
    '내 문의 내역',
    'P17-07 · tickets',
    `<p class="sup-section__lead">프리뷰: 동일 브라우저(sessionStorage)에 접수된 티켓입니다.</p>
     <table class="sup-admin-table sup-user-tickets">
       <thead><tr><th>번호</th><th>유형</th><th>상태</th><th>접수일</th></tr></thead>
       <tbody>${rows || '<tr><td colspan="4" class="sup-empty">접수 내역이 없습니다.</td></tr>'}</tbody>
     </table>
     <p class="sup-contact-extra"><a href="#/support/contact" class="sup-inline-link" data-sup-nav="/support/contact">← 운영문의 작성</a></p>`,
    { lead: '운영 문의 티켓 조회(프리뷰)' },
  );
}

/** @param {string | null} openSlug */
function renderSafeGuideAccordion(openSlug) {
  const renderGroup = (title, items, groupKey) => {
    const accordion = items
      .map((g) => {
        const isOpen = openSlug === g.slug;
        const body = renderGuideContent(g);
        const related = getRelatedGuides(g.slug);
        const relatedHtml = related.length
          ? `<div class="sup-related">
               <span class="sup-related__label">관련 가이드</span>
               ${related
                 .map(
                   (r) =>
                     `<a href="#/support/safe/${r.slug}" class="sup-related__link" data-sup-nav="/support/safe/${r.slug}">${esc(r.title)}</a>`,
                 )
                 .join('')}
             </div>`
          : '';
        return `
          <div class="sup-accordion__item${isOpen ? ' is-open' : ''}" data-sup-article="${esc(g.slug)}" data-sup-group="${groupKey}">
            <button type="button" class="sup-accordion__head" aria-expanded="${isOpen ? 'true' : 'false'}">
              <span class="sup-guide-row__badge">${g.priority === 'primary' ? '1차' : '보조'}</span>
              <span class="sup-accordion__title">${esc(g.title)}</span>
              <span class="sup-guide-row__meta">${esc(g.audience)}</span>
              <span class="sup-accordion__chev" aria-hidden="true"></span>
            </button>
            <div class="sup-accordion__panel"${isOpen ? '' : ' hidden'}>
              <div class="sup-accordion__content">${body}${relatedHtml}</div>
              ${renderContactCtas(`guide-${g.slug}`)}
            </div>
          </div>`;
      })
      .join('');

    return `
      <section class="sup-accordion-group">
        <h3 class="sup-accordion-group__title">${esc(title)}</h3>
        <div class="sup-accordion" data-sup-accordion="${groupKey}">${accordion}</div>
      </section>`;
  };

  const primary = GUIDE_ARTICLES.filter((g) => g.priority === 'primary');
  const secondary = GUIDE_ARTICLES.filter((g) => g.priority === 'secondary');

  return `
    ${renderPrinciplesBox(true)}
    ${renderPanel(
      '안전과외 가이드',
      'P17-02 · P17-03',
      `<p class="sup-section__lead">제목을 누르면 아래에 내용이 펼쳐집니다. 다른 항목을 누르면 이전 내용은 접힙니다.</p>
       ${renderGroup('1차 가이드 (G1~G4)', primary, 'primary')}
       ${renderGroup('보조 가이드 (G5~G7)', secondary, 'secondary')}`,
      { lead: '페이지 이동 없이 한 화면에서 읽기' },
    )}
    ${openSlug ? `<span data-sup-scroll-article="${esc(openSlug)}" hidden></span>` : ''}`;
}

/** @param {HTMLElement} root @param {string} path @param {() => void} [rerender] */
export function bindSupportScreenEvents(root, path, rerender) {
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

  bindSingleOpenBoard(root);

  root.querySelectorAll('[data-sup-accordion]').forEach((group) => {
    group.querySelectorAll('.sup-accordion__head').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.sup-accordion__item');
        const slug = item?.getAttribute('data-sup-article');
        if (!item || !slug) return;

        const wasOpen = item.classList.contains('is-open');
        group.querySelectorAll('.sup-accordion__item').forEach((el) => {
          el.classList.remove('is-open');
          el.querySelector('.sup-accordion__head')?.setAttribute('aria-expanded', 'false');
          const panel = el.querySelector('.sup-accordion__panel');
          if (panel) panel.hidden = true;
        });

        if (!wasOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
          const panel = item.querySelector('.sup-accordion__panel');
          if (panel) panel.hidden = false;
          window.location.hash = `#/support/safe/${slug}`;
          requestAnimationFrame(() => {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
        } else {
          window.location.hash = '#/support/safe';
        }
      });
    });
  });

  const form = root.querySelector('[data-sup-contact-form]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const ticket = createTicket({
        email: String(fd.get('email')),
        category: String(fd.get('category')),
        body: String(fd.get('body')),
        role: getNavRole(),
      });
      sessionStorage.setItem(TICKET_FLASH_KEY, ticket.id);
      rerender?.();
    });
  }

  if (path === '/support/contact' && sessionStorage.getItem(TICKET_FLASH_KEY)) {
    sessionStorage.removeItem(TICKET_FLASH_KEY);
  }

  const scrollArticle = root.querySelector('[data-sup-scroll-article]');
  if (scrollArticle) {
    const slug = scrollArticle.getAttribute('data-sup-scroll-article');
    requestAnimationFrame(() => {
      const item = root.querySelector(`[data-sup-article="${slug}"]`);
      item?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  } else if (getSectionFromPath(path)) {
    /* legacy section hash — no longer stacked on home */
  }
}
