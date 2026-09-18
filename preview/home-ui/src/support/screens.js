import { AUTH_UI_BASE } from '../../../shared/preview-links.js';
import { loginUrl } from '../../../shared/route-access.js';
import { getNavRole, navigate } from '../state.js';
import { isLoggedIn, getAuthUser } from '../auth-session.js';
import {
  OPERATIONAL_CONTACT,
  TICKET_CATEGORIES,
  TICKET_STATUS_LABELS,
} from './support-copy.js';
import { listNotices } from './notice-store.js';
import { listFaqPosts, listGuidePosts, getRelatedGuidePosts, isOperationalBoardApiActive } from '../operational-board-store.js';
import { createTicket, listTickets, listTicketsByEmail } from './ticket-store.js';
import { renderAdminScreen } from './admin-screens.js';
import {
  isAdminSupportPath,
  getSectionFromPath,
  getSupportPolicySlug,
  getSupportLibrarySection,
} from './router.js';
import { getActiveNavId } from './nav.js';
import { bindSingleOpenBoard } from '../../../shared/board/index.js';
import { POLICY_PAGES, POLICY_SHORT_NOTICE, getPolicyPage } from '../policy-copy.js';
import { LIBRARY_HEAD, LIBRARY_SECTIONS } from '../library/library-copy.js';
import { getLibraryBoardMeta, libraryDownloadControlHtml, listLibraryItems } from '../library/library-store.js';
import { BOARD_TYPES, getBoardPolicy } from '../board-engine-copy.js';
import { renderEmptyStateCard } from '../empty-state-copy.js';

const TICKET_FLASH_KEY = 'study114-support-ticket-flash';

const POLICY_NAV_SHORT = {
  terms: '약관',
  privacy: '개인정보',
  platform: '플랫폼',
  trust: '신뢰정보',
  safety: '안전과외',
  'student-privacy': '학생정보',
  reporting: '신고·제재',
  'account-contact': '계정연락처',
};

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function mdLite(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function bodyHtml(body) {
  const lines = Array.isArray(body) ? body : [body];
  return lines.map((p) => `<p>${mdLite(p)}</p>`).join('');
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
  return '';
}

function renderContactLoginGate() {
  const href = loginUrl('support', 'contact');
  return `
    <section class="login-wall" aria-label="운영문의 로그인 안내">
      <span class="blob blob--a" style="left:-28px;top:-18px" aria-hidden="true"></span>
      <div class="login-wall__art"><img src="/assets/info-refresh/motif-contact.svg" alt="" /></div>
      <h1>로그인 후 운영문의를 남길 수 있어요</h1>
      <p>운영문의는 사이트 운영자에게 보내는 채널입니다. 공부방·과외쌤과의 첫 연락인 쪽지와는 다릅니다.</p>
      <div class="login-wall__steps" aria-label="이용 단계">
        <span class="step-pill"><span class="step-pill__n">1</span>로그인</span>
        <span class="step-pill"><span class="step-pill__n">2</span>문의 작성</span>
        <span class="step-pill"><span class="step-pill__n">3</span>내역 확인</span>
      </div>
      <div class="sup-contact-gate__actions" style="justify-content:center;position:relative;z-index:1;display:flex;gap:10px;flex-wrap:wrap">
        <a href="${esc(href)}" class="btn btn--primary" data-sup-external="login">로그인하고 문의하기</a>
        <a href="${esc(AUTH_UI_BASE)}/#/signup/terms" class="btn btn--secondary" data-sup-external="login">회원가입</a>
      </div>
    </section>`;
}

/** @param {string} path */
export function renderSupportScreen(path) {
  if (isAdminSupportPath(path)) {
    return renderAdminScreen(path);
  }

  const contactPath = path === '/support/contact' || path === '/support/contact/tickets';
  if (contactPath && !isLoggedIn()) {
    return renderContactLoginGate();
  }

  if (path === '/support/contact/tickets') {
    return renderContactTicketsSection();
  }

  if (path.startsWith('/support/policies')) {
    return renderPoliciesSection(path);
  }

  if (path.startsWith('/support/library')) {
    return renderSupportLibrarySection(path);
  }

  const navId = getActiveNavId(path);
  if (navId === 'faq') return renderFaqSection();
  if (navId === 'notice') return renderNoticeSection();
  if (navId === 'contact') return renderContactSection();
  return renderNoticeSection();
}

function renderSupportQuickCards() {
  const cards = [
    { title: '자주 묻는 질문', desc: '계정·쪽지·노출 관련 FAQ', href: '/support/faq', icon: '/assets/info-refresh/motif-faq.svg', extra: '' },
    { title: '문의', desc: '로그인 후 운영팀에 문의', href: '/support/contact', icon: '/assets/info-refresh/motif-contact.svg', extra: '' },
    { title: '약관·정책', desc: '이용약관 · 개인정보 등', href: '/support/policies', icon: '/assets/info-refresh/motif-policy.svg', extra: 'card--accent-violet', halo: 'icon-halo--violet', tile: 'icon-tile--violet' },
    { title: '공지사항', desc: '서비스 변경·운영 안내', href: '/support/notice', icon: '/assets/info-refresh/motif-notice.svg', extra: 'card--accent-warn', halo: 'icon-halo--warn', tile: 'icon-tile--warn' },
    { title: '자료실', desc: '안내 자료와 양식', href: '/support/library', icon: '/assets/info-refresh/motif-library.svg', extra: 'card--accent-teal', halo: 'icon-halo--teal', tile: 'icon-tile--teal' },
    { title: '커뮤니티', desc: '현장형 고민방·해결후기', href: '/community', icon: '/assets/info-refresh/motif-room.svg', extra: '', halo: 'icon-halo--ivory', tile: 'icon-tile--ivory' },
  ];
  return `
    <div class="section-head">
      <div>
        <span class="section-chip">Quick links</span>
        <h2>바로가기</h2>
        <div class="section-underline"></div>
      </div>
    </div>
    <div class="quick-grid">
      ${cards
        .map(
          (card) => `<a href="#${card.href}" class="quick-tile card card--accent ${card.extra || ''}" data-sup-nav="${card.href}">
        <span class="icon-halo ${card.halo || ''}"><span class="icon-tile ${card.tile || ''}"><img src="${esc(card.icon)}" alt="" /></span></span>
        <h3>${esc(card.title)}</h3>
        <p>${esc(card.desc)}</p>
      </a>`,
        )
        .join('')}
    </div>
    <p class="sup-home-hint">이용 흐름 안내는 메인메뉴의 이용안내에서, 운영 지원은 고객센터에서 확인할 수 있습니다.</p>`;
}

function renderSupportHero() {
  return `
    <section class="support-hero" aria-label="고객센터 히어로">
      <div class="support-hero__shapes" aria-hidden="true">
        <span class="geo-circle geo-circle--1"></span>
        <span class="geo-circle geo-circle--2"></span>
        <span class="geo-slash"></span>
      </div>
      <div class="support-hero__inner">
        <h1>필요한 답을 빠르게</h1>
        <p>FAQ에서 먼저 찾고, 없으면 문의해 주세요. 공지·정책·자료도 한곳에서 이어집니다.</p>
        <div class="support-hero__actions">
          <a class="btn btn--primary" href="#/support/faq" data-sup-nav="/support/faq">자주 묻는 질문</a>
          <a class="btn--ghost-light" href="#/support/contact" data-sup-nav="/support/contact">문의</a>
        </div>
      </div>
    </section>
    <div class="pattern-band" aria-hidden="true"></div>`;
}

function renderFaqSection() {
  const posts = listFaqPosts().map((f) => ({
    id: f.id,
    title: f.q,
    body: f.a,
  }));
  const sourceNote = isOperationalBoardApiActive()
    ? '최신 질문을 표시합니다.'
    : '자주 찾는 질문을 모았습니다.';
  const items = posts
    .map(
      (post, i) => `
        <div class="faq-item${i === 0 ? ' is-open' : ''}" data-faq-id="${esc(post.id)}">
          <button type="button" class="faq-item__q" aria-expanded="${i === 0 ? 'true' : 'false'}">
            <span class="faq-item__marker">Q</span>
            <span>${esc(post.title)}</span>
            <span class="faq-item__chev" aria-hidden="true">${i === 0 ? '−' : '+'}</span>
          </button>
          <div class="faq-item__a">${bodyHtml(post.body)}</div>
        </div>`,
    )
    .join('');

  return `
    <div class="section-head">
      <div>
        <span class="section-chip">FAQ</span>
        <h2>자주 묻는 질문</h2>
        <div class="section-underline"></div>
      </div>
    </div>
    <p class="section-lead">${esc(sourceNote)} 제목을 누르면 답이 펼쳐집니다. 운영문의와 쪽지는 다른 채널입니다.</p>
    <div class="faq-list" data-support-faq>${items || '<p class="section-lead">등록된 질문이 없습니다.</p>'}</div>
    <aside class="tip-card">
      <h3>답이 없나요?</h3>
      <p>FAQ에 없는 내용은 문의에서 남겨 주세요. 운영문의는 쪽지와 다른 채널입니다.</p>
      <p class="support-tip-cta"><a class="btn btn--primary btn--sm" href="#/support/contact" data-sup-nav="/support/contact">문의</a></p>
    </aside>`;
}

function renderNoticeSection() {
  const posts = listNotices().map((n) => ({
    id: n.id,
    title: n.title,
    date: n.date,
    body: n.body,
  }));

  return `
    ${renderSupportHero()}
    ${renderSupportQuickCards()}
    <div class="section-head">
      <div>
        <span class="section-chip">Notices</span>
        <h2>공지사항</h2>
        <div class="section-underline"></div>
      </div>
    </div>
    <p class="section-lead">${
      isOperationalBoardApiActive() ? '최신 공지를 표시합니다.' : '서비스 운영 공지입니다.'
    } 제목을 누르면 본문이 펼쳐집니다.</p>
    <div class="notice-list" data-board-accordion="notice">
      ${
        posts.length
          ? posts
              .map(
                (n) => `
        <div class="notice-accordion__item" data-board-item="${esc(n.id)}">
          <button type="button" class="notice-row sup-board-accordion__head sup-board-accordion__head--notice" aria-expanded="false">
            <span class="notice-row__bar" aria-hidden="true"></span>
            <span class="notice-row__title">${esc(n.title)}</span>
            <span class="notice-row__date">${esc(n.date || '')}</span>
          </button>
          <div class="sup-accordion__panel" hidden>
            <div class="sup-accordion__content">${bodyHtml(n.body)}</div>
          </div>
        </div>`,
              )
              .join('')
          : '<p class="section-lead" style="padding:16px">등록된 공지가 없습니다.</p>'
      }
    </div>
    ${renderAdminFooterLink()}`;
}

function renderContactSection() {
  const flashId = sessionStorage.getItem(TICKET_FLASH_KEY);
  const flashHtml = flashId
    ? `<div class="sup-flash sup-flash--success" role="status">
         <strong>${esc(OPERATIONAL_CONTACT.ticketSuccessTitle)}</strong>
         <p>문의 번호: <code>${esc(flashId)}</code> · <a href="#/support/contact/tickets" data-sup-nav="/support/contact/tickets">내 문의 내역</a></p>
       </div>`
    : '';

  const categoryOptions = TICKET_CATEGORIES.map(
    (c) => `<option value="${esc(c.value)}">${esc(c.label)}</option>`,
  ).join('');
  const userEmail = getAuthUser()?.email || '';

  return `
    <div class="section-head">
      <div>
        <span class="section-chip">Contact</span>
        <h2>문의</h2>
        <div class="section-underline"></div>
      </div>
    </div>
    <p class="section-lead">운영팀에 직접 남기는 문의입니다. 회원 간 쪽지와 별도 채널입니다.</p>
    ${flashHtml}
    <section class="card card--accent support-contact-card">
      <form class="sup-contact-form" data-sup-contact-form>
        <label class="sup-field">
          <span>문의 유형</span>
          <select name="category" required>${categoryOptions}</select>
        </label>
        <label class="sup-field">
          <span>이메일</span>
          <input type="email" name="email" placeholder="답변 받을 주소" value="${esc(userEmail)}" required />
        </label>
        <label class="sup-field">
          <span>문의 내용</span>
          <textarea name="body" rows="4" placeholder="오류·정책·계정 문의" required></textarea>
        </label>
        <button type="submit" class="btn btn--primary btn--sm">문의 접수</button>
        <p class="sup-note">${esc(OPERATIONAL_CONTACT.note)}</p>
      </form>
      <p class="sup-contact-extra">
        <a href="#/support/contact/tickets" class="sup-inline-link" data-sup-nav="/support/contact/tickets">내 문의 내역 보기</a>
      </p>
      ${renderAdminFooterLink()}
    </section>`;
}

function renderContactTicketsSection() {
  const email = getAuthUser()?.email || '';
  const tickets = email ? listTicketsByEmail(email) : listTickets();
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

  return `
    <div class="section-head">
      <div>
        <span class="section-chip">Contact</span>
        <h2>내 문의 내역</h2>
        <div class="section-underline"></div>
      </div>
    </div>
    <p class="section-lead">내가 남긴 운영 문의 확인</p>
    <section class="card card--accent support-contact-card">
      <p class="sup-section__lead">내가 접수한 문의 목록입니다.</p>
      <table class="sup-admin-table sup-user-tickets">
        <thead><tr><th>번호</th><th>유형</th><th>상태</th><th>접수일</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" class="sup-empty">접수 내역이 없습니다.</td></tr>'}</tbody>
      </table>
      <p class="sup-contact-extra"><a href="#/support/contact" class="sup-inline-link" data-sup-nav="/support/contact">← 문의 작성</a></p>
    </section>`;
}

/** @param {string} path */
function renderPoliciesSection(path) {
  const slug = getSupportPolicySlug(path);
  const page = getPolicyPage(slug) || POLICY_PAGES[0];
  const tabs = POLICY_PAGES.map(
    (p) =>
      `<a href="#/support/policies/${p.slug}" class="tab-pill${p.slug === page.slug ? ' is-active' : ''}" ${p.slug === page.slug ? 'aria-current="page"' : ''} data-sup-nav="/support/policies/${p.slug}">${esc(POLICY_NAV_SHORT[p.slug] || p.title)}</a>`,
  ).join('');

  const shortNotice =
    page.slug === 'platform'
      ? POLICY_SHORT_NOTICE.footer
      : page.slug === 'trust'
        ? POLICY_SHORT_NOTICE.trust
        : page.slug === 'student-privacy'
          ? POLICY_SHORT_NOTICE.studentPrivacy
          : '';

  const sections = (page.sections || [])
    .map((section) => {
      const body = (section.body || []).map((p) => `<p>${esc(p)}</p>`).join('');
      const bullets = section.bullets?.length
        ? `<ul class="sup-list sup-list--bullets">${section.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`
        : '';
      return `
        <section class="doc-section">
          <h3>${esc(section.title)}</h3>
          ${body}${bullets}
        </section>`;
    })
    .join('');

  return `
    <div class="section-head">
      <div>
        <span class="section-chip">Document hub</span>
        <h2>약관·정책</h2>
        <div class="section-underline"></div>
      </div>
    </div>
    <p class="section-lead">약관과 운영 정책을 확인합니다. 자료실은 별도 메뉴입니다.</p>
    <div class="tab-pills" role="tablist" aria-label="약관·정책">${tabs}</div>
    <article class="card card--accent doc-article">
      <p class="doc-card__eyebrow">Doc</p>
      <h2>${esc(page.title)}</h2>
      <p>${esc(page.summary)}</p>
      ${shortNotice ? `<div class="sup-flash" role="note" style="margin-top:12px">${esc(shortNotice)}</div>` : ''}
      ${sections}
    </article>`;
}

function boardTypeLabel(boardType) {
  return BOARD_TYPES[boardType]?.label || boardType || '자료';
}

function renderBoardPolicyChips(boardKey, navRole) {
  const meta = getLibraryBoardMeta(boardKey, navRole);
  if (!meta) return '';
  const chips = [
    `<span class="lib-chip lib-chip--type">${esc(boardTypeLabel(meta.policy.boardType))}</span>`,
    `<span class="lib-chip">열람 ${meta.canRead ? '가능' : '제한'}</span>`,
    `<span class="lib-chip">${meta.canDownload ? '다운로드 가능' : '파일 다운로드 미구현'}</span>`,
  ];
  return `<div class="lib-policy-chips" aria-label="자료 권한 안내">${chips.join('')}</div>`;
}

function formatAudience(audience) {
  const aud = Array.isArray(audience) ? audience : ['all'];
  if (aud.includes('all')) return '전체';
  return aud.join(' · ');
}

function renderLibraryCard(item, navRole) {
  const policy = getBoardPolicy(item.boardKey);
  const dlBtn = libraryDownloadControlHtml();

  return `
    <article class="pdf-card card card--accent" data-lib-id="${esc(item.id)}">
      <div class="pdf-card__cover"><img src="/assets/info-refresh/motif-pdf-cover.svg" alt="" /></div>
      <div>
        ${policy ? `<p class="doc-card__eyebrow">${esc(boardTypeLabel(policy.boardType))} · ${esc(item.format || 'FILE')}</p>` : ''}
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.summary)}</p>
        <p class="lib-card__meta">${esc(formatAudience(item.audience))} · 표시 이름 ${esc(item.fileLabel || '파일')} · 실제 파일 없음</p>
        <span class="chip chip--warn">준비 중</span>
        ${dlBtn}
      </div>
    </article>`;
}

/** @param {string} path */
function renderSupportLibrarySection(path) {
  const section = getSupportLibrarySection(path);
  const navRole = getNavRole();
  const items = listLibraryItems(section, navRole);
  const meta = LIBRARY_SECTIONS.find((s) => s.key === section) || LIBRARY_SECTIONS[0];
  const tabs = LIBRARY_SECTIONS.map((s) => {
    const href = s.key === 'library' ? '/support/library' : `/support/library/${s.key}`;
    return `<a href="#${href}" class="tab-pill${s.key === section ? ' is-active' : ''}" ${s.key === section ? 'aria-current="page"' : ''} data-sup-nav="${href}">${esc(s.label)}</a>`;
  }).join('');

  const grid =
    items.length === 0
      ? renderEmptyStateCard('library', { cta: null })
      : `<div class="pdf-grid">${items.map((item) => renderLibraryCard(item, navRole)).join('')}</div>`;

  return `
    <div class="section-head">
      <div>
        <span class="section-chip">Library</span>
        <h2>자료실</h2>
        <div class="section-underline"></div>
      </div>
    </div>
    <p class="section-lead">${esc(LIBRARY_HEAD.lead)}</p>
    <div class="tab-pills" role="tablist" aria-label="자료실">${tabs}</div>
    ${renderBoardPolicyChips(meta.boardKey, navRole)}
    ${grid}
    <aside class="tip-card" style="margin-top:4px">
      <h3>안내</h3>
      <p>${esc(LIBRARY_HEAD.footnote)}</p>
    </aside>`;
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
      const href = el.getAttribute('href');
      if (href) window.location.assign(href);
    });
  });

  bindSingleOpenBoard(root);

  root.querySelectorAll('[data-support-faq]').forEach((list) => {
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('.faq-item__q');
      if (!btn || !list.contains(btn)) return;
      const item = btn.closest('.faq-item');
      if (!item) return;
      const open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      const chev = btn.querySelector('.faq-item__chev');
      if (chev) chev.textContent = open ? '−' : '+';
    });
  });

  const form = root.querySelector('[data-sup-contact-form]');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!isLoggedIn()) {
        window.location.assign(loginUrl('support', 'contact'));
        return;
      }
      const fd = new FormData(form);
      try {
        const ticket = await createTicket({
          email: String(fd.get('email')),
          category: String(fd.get('category')),
          body: String(fd.get('body')),
          role: getNavRole(),
        });
        sessionStorage.setItem(TICKET_FLASH_KEY, ticket.id);
        rerender?.();
      } catch (err) {
        console.warn('[support]', err);
        alert('문의 접수에 실패했습니다.');
      }
    });
  }

  if (path === '/support/contact' && sessionStorage.getItem(TICKET_FLASH_KEY)) {
    sessionStorage.removeItem(TICKET_FLASH_KEY);
  }

  if (getSectionFromPath(path)) {
    /* legacy section hash */
  }
}
