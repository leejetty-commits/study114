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
import { renderFaqBoard, renderSingleOpenBoard, bindSingleOpenBoard } from '../../../shared/board/index.js';
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

function renderPanel(title, _screenId, bodyHtml, { lead = '' } = {}) {
  return `
    <section class="sup-panel-card">
      <header class="sup-panel-card__head">
        <div>
          <h2 class="sup-panel-card__title">${esc(title)}</h2>
          ${lead ? `<p class="sup-panel-card__lead">${lead}</p>` : ''}
        </div>
      </header>
      <div class="sup-panel-card__body">${bodyHtml}</div>
    </section>`;
}

function renderContactLoginGate() {
  const href = loginUrl('support', 'contact');
  return renderPanel(
    '문의',
    'contact-login',
    `<div class="sup-contact-gate">
       <p>문의 작성·내역 확인은 <strong>로그인 후</strong> 이용할 수 있습니다.</p>
       <div class="sup-contact-gate__actions">
         <a href="${esc(href)}" class="btn btn--primary btn--sm" data-sup-external="login">로그인하고 문의하기</a>
         <a href="${esc(AUTH_UI_BASE)}/#/signup/terms" class="btn btn--secondary btn--sm" data-sup-external="login">회원가입</a>
       </div>
     </div>`,
    { lead: '운영팀에 직접 남기는 문의입니다. 회원 간 쪽지와 별도 채널입니다.' },
  );
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
    { title: '자주 묻는 질문', desc: '가장 자주 확인하는 운영·이용 질문을 빠르게 찾을 수 있어요.', href: '/support/faq' },
    { title: '문의하기', desc: '계정, 결제, 오류 문의를 남기고 접수 내역을 확인할 수 있어요.', href: '/support/contact' },
    { title: '약관·정책', desc: '신고·제재, 개인정보, 플랫폼 역할 고지를 한곳에서 살펴보세요.', href: '/support/policies' },
  ];
  return `<div class="sup-card-grid">${cards
    .map(
      (card) => `<a href="#${card.href}" class="sup-card" data-sup-nav="${card.href}">
        <span class="sup-card__title">${esc(card.title)}</span>
        <span class="sup-card__desc">${esc(card.desc)}</span>
      </a>`,
    )
    .join('')}</div>
    <p class="sup-home-hint">이용 흐름 안내는 메인메뉴의 이용안내에서, 운영 지원은 고객센터에서 확인할 수 있습니다.</p>`;
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

  return renderPanel('자주 묻는 질문', 'faq', renderFaqBoard(posts), {
    lead: `${sourceNote} 제목을 누르면 답이 펼쳐집니다.`,
  });
}

function renderNoticeSection() {
  const posts = listNotices().map((n) => ({
    id: n.id,
    title: n.title,
    date: n.date,
    body: n.body,
  }));

  return `
    ${renderPanel('바로가기', 'support-quick', renderSupportQuickCards())}
    ${renderPanel(
      '공지사항',
      'notice',
      `<p class="sup-section__lead">제목을 누르면 본문이 펼쳐집니다. 다른 공지를 누르면 이전 내용은 접힙니다.</p>
     ${renderSingleOpenBoard(posts, { variant: 'notice' })}
     ${renderAdminFooterLink()}`,
      {
        lead: isOperationalBoardApiActive()
          ? '최신 공지를 표시합니다.'
          : '서비스 운영 공지입니다.',
      },
    )}`;
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

  return renderPanel(
    '문의',
    'contact',
    `${flashHtml}
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
     ${renderAdminFooterLink()}`,
    { lead: '운영팀에 직접 남기는 문의입니다. 회원 간 쪽지와 별도 채널입니다.' },
  );
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

  return renderPanel(
    '내 문의 내역',
    'contact-tickets',
    `<p class="sup-section__lead">내가 접수한 문의 목록입니다.</p>
     <table class="sup-admin-table sup-user-tickets">
       <thead><tr><th>번호</th><th>유형</th><th>상태</th><th>접수일</th></tr></thead>
       <tbody>${rows || '<tr><td colspan="4" class="sup-empty">접수 내역이 없습니다.</td></tr>'}</tbody>
     </table>
     <p class="sup-contact-extra"><a href="#/support/contact" class="sup-inline-link" data-sup-nav="/support/contact">← 문의 작성</a></p>`,
    { lead: '내가 남긴 운영 문의 확인' },
  );
}

/** @param {string} path */
function renderPoliciesSection(path) {
  const slug = getSupportPolicySlug(path);
  const page = getPolicyPage(slug) || POLICY_PAGES[0];
  const tabs = POLICY_PAGES.map(
    (p) =>
      `<a href="#/support/policies/${p.slug}" class="sup-subtab${p.slug === page.slug ? ' is-active' : ''}" data-sup-nav="/support/policies/${p.slug}">${esc(POLICY_NAV_SHORT[p.slug] || p.title)}</a>`,
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
        <section class="sup-panel-card">
          <header class="sup-panel-card__head">
            <div><h2 class="sup-panel-card__title">${esc(section.title)}</h2></div>
          </header>
          <div class="sup-panel-card__body">${body}${bullets}</div>
        </section>`;
    })
    .join('');

  return `
    <div class="sup-subtabs" role="tablist" aria-label="약관·정책">${tabs}</div>
    <section class="sup-panel-card">
      <header class="sup-panel-card__head">
        <div>
          <h2 class="sup-panel-card__title">${esc(page.title)}</h2>
          <p class="sup-panel-card__lead">${esc(page.summary)}</p>
        </div>
      </header>
      <div class="sup-panel-card__body">
        ${shortNotice ? `<div class="sup-flash" role="note">${esc(shortNotice)}</div>` : ''}
      </div>
    </section>
    ${sections}`;
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
    <article class="lib-card" data-lib-id="${esc(item.id)}">
      <div class="lib-card__head">
        <div class="lib-card__format">${esc(item.format || 'FILE')}</div>
        ${policy ? `<span class="lib-card__type">${esc(boardTypeLabel(policy.boardType))}</span>` : ''}
      </div>
      <h3 class="lib-card__title">${esc(item.title)}</h3>
      <p class="lib-card__summary">${esc(item.summary)}</p>
      <p class="lib-card__meta">${esc(formatAudience(item.audience))}</p>
      <p class="lib-card__meta">표시 이름: ${esc(item.fileLabel || '파일')} · 실제 파일 없음</p>
      ${dlBtn}
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
    return `<a href="#${href}" class="sup-subtab${s.key === section ? ' is-active' : ''}" data-sup-nav="${href}">${esc(s.label)}</a>`;
  }).join('');

  const grid =
    items.length === 0
      ? renderEmptyStateCard('library', { cta: null })
      : `<div class="lib-grid">${items.map((item) => renderLibraryCard(item, navRole)).join('')}</div>`;

  return `
    <div class="sup-subtabs" role="tablist" aria-label="자료실">${tabs}</div>
    <section class="sup-panel-card">
      <header class="sup-panel-card__head">
        <div>
          <h2 class="sup-panel-card__title">${esc(meta.label)}</h2>
          <p class="sup-panel-card__lead">${esc(LIBRARY_HEAD.lead)}</p>
          ${renderBoardPolicyChips(meta.boardKey, navRole)}
        </div>
      </header>
      <div class="sup-panel-card__body">
        ${grid}
        <p class="lib-footnote">${esc(LIBRARY_HEAD.footnote)}</p>
      </div>
    </section>`;
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
