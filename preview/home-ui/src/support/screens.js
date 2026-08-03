import { AUTH_UI_BASE } from '../../../shared/preview-links.js';
import { loginUrl } from '../../../shared/route-access.js';
import { getNavRole, navigate } from '../state.js';
import { isLoggedIn, getAuthUser } from '../auth-session.js';
import {
  PRINCIPLES_POSITIVE,
  PRINCIPLES_NEGATIVE,
  HOME_CARDS,
  getHomeExposureGuides,
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
  parseGuideSlug,
  getSupportPolicySlug,
  getSupportLibrarySection,
} from './router.js';
import { getActiveNavId } from './nav.js';
import { renderFaqBoard, renderSingleOpenBoard, bindSingleOpenBoard } from '../../../shared/board/index.js';
import { getPlanRuntimeSettings } from '../plans/runtime-config.js';
import { POLICY_PAGES, POLICY_SHORT_NOTICE, getPolicyPage } from '../policy-copy.js';
import { LIBRARY_HEAD, LIBRARY_SECTIONS } from '../library/library-copy.js';
import { canDownloadFromBoard, getLibraryBoardMeta, listLibraryItems } from '../library/library-store.js';
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

  const slug = parseGuideSlug(path);
  if (slug || path === '/support/safe' || path === '/support/safe/') {
    return renderSafeGuideAccordion(slug || null);
  }

  const navId = getActiveNavId(path);
  if (navId === 'guide') return renderGuideSection();
  if (navId === 'faq') return renderFaqSection();
  if (navId === 'notice') return renderNoticeSection();
  if (navId === 'contact') return renderContactSection();
  return renderGuideSection();
}

function renderGuideSection() {
  const cards = HOME_CARDS.map((c) => {
    if (c.mode === 'nav') {
      return `<a href="#${c.href}" class="sup-card" data-sup-nav="${c.href}">
         <span class="sup-card__title">${esc(c.title)}</span>
         <span class="sup-card__desc">${esc(c.desc)}</span>
       </a>`;
    }
    return `<button type="button" class="sup-card sup-card--tab" data-sup-guide-tab="${esc(c.id)}" aria-pressed="false">
         <span class="sup-card__title">${esc(c.title)}</span>
         <span class="sup-card__desc">${esc(c.desc)}</span>
       </button>`;
  }).join('');

  const exposureGuides = getHomeExposureGuides(getPlanRuntimeSettings());
  const exposureGuideHtml = exposureGuides
    .map(
      (guide) => `
      <section class="sup-exposure-guide">
        <h3 class="sup-exposure-guide__title">${esc(guide.title)}</h3>
        <ul class="sup-list sup-list--bullets">
          ${guide.items.map((item) => `<li>${esc(item)}</li>`).join('')}
        </ul>
      </section>`,
    )
    .join('');

  return `
    ${renderPanel(
      '이용안내',
      'guide-quick',
      `<div class="sup-card-grid">${cards}</div>
       <div class="sup-guide-tab-panel" data-sup-guide-panel hidden>
         <h3 class="sup-guide-tab-panel__title" data-sup-guide-panel-title></h3>
         <p class="sup-guide-tab-panel__body">내용 준비 중입니다.</p>
       </div>
       <p class="sup-home-hint">왼쪽 메뉴에서 공지 · 안전과외 가이드 · 자주 묻는 질문 · 약관·정책 · 자료실 · 문의를 확인할 수 있습니다.</p>`,
      { lead: '자주 찾는 주제를 고르면 아래에 안내가 표시됩니다.' },
    )}
    ${renderPanel(
      '홈 노출 안내',
      'guide-exposure',
      `<div class="sup-exposure-guides">${exposureGuideHtml}</div>`,
      { lead: '홈 화면의 대표·추천·기본 노출 구성과 순환 기준입니다.' },
    )}`;
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

  return renderPanel(
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
  );
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
    `<span class="lib-chip">${meta.canDownload ? '다운로드 가능' : '로그인 후 다운로드'}</span>`,
  ];
  return `<div class="lib-policy-chips" aria-label="자료 권한 안내">${chips.join('')}</div>`;
}

function formatAudience(audience) {
  const aud = Array.isArray(audience) ? audience : ['all'];
  if (aud.includes('all')) return '전체';
  return aud.join(' · ');
}

function renderLibraryCard(item, navRole) {
  const canDl = canDownloadFromBoard(item.boardKey, navRole);
  const policy = getBoardPolicy(item.boardKey);
  const dlBtn = canDl
    ? `<button type="button" class="btn btn--secondary btn--sm lib-card__dl" data-lib-download="${esc(item.id)}">다운로드 · ${esc(item.fileLabel || '파일')}</button>`
    : `<button type="button" class="btn btn--secondary btn--sm lib-card__dl" disabled title="로그인 후 다운로드">다운로드 · 로그인 필요</button>`;

  return `
    <article class="lib-card" data-lib-id="${esc(item.id)}">
      <div class="lib-card__head">
        <div class="lib-card__format">${esc(item.format || 'FILE')}</div>
        ${policy ? `<span class="lib-card__type">${esc(boardTypeLabel(policy.boardType))}</span>` : ''}
      </div>
      <h3 class="lib-card__title">${esc(item.title)}</h3>
      <p class="lib-card__summary">${esc(item.summary)}</p>
      <p class="lib-card__meta">${esc(formatAudience(item.audience))}</p>
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
        <p class="lib-footnote">학습·운영 참고 자료를 내려받을 수 있습니다.</p>
      </div>
    </section>`;
}

/** @param {string | null} openSlug */
function renderSafeGuideAccordion(openSlug) {
  const renderGroup = (title, items, groupKey) => {
    const accordion = items
      .map((g) => {
        const isOpen = openSlug === g.slug;
        const body = renderGuideContent(g);
        const related = getRelatedGuidePosts(g.slug);
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
              <span class="sup-guide-row__badge">${g.priority === 'primary' ? '핵심' : '추가'}</span>
              <span class="sup-accordion__title">${esc(g.title)}</span>
              <span class="sup-guide-row__meta">${esc(g.audience)}</span>
              <span class="sup-accordion__chev" aria-hidden="true"></span>
            </button>
            <div class="sup-accordion__panel"${isOpen ? '' : ' hidden'}>
              <div class="sup-accordion__content">${body}${relatedHtml}</div>
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

  const primary = listGuidePosts().filter((g) => g.priority === 'primary');
  const secondary = listGuidePosts().filter((g) => g.priority === 'secondary');

  return `
    ${renderPrinciplesBox(true)}
    ${renderPanel(
      '안전과외 가이드',
      'safe',
      `<p class="sup-section__lead">제목을 누르면 아래에 내용이 펼쳐집니다. 다른 항목을 누르면 이전 내용은 접힙니다.</p>
       ${renderGroup('꼭 읽어 주세요', primary, 'primary')}
       ${renderGroup('더 알아보기', secondary, 'secondary')}`,
      { lead: isOperationalBoardApiActive() ? '최신 안전 가이드를 표시합니다.' : '한 화면에서 이어서 읽을 수 있습니다.' },
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
      const href = el.getAttribute('href');
      if (href) window.location.assign(href);
    });
  });

  const guidePanel = root.querySelector('[data-sup-guide-panel]');
  const guidePanelTitle = root.querySelector('[data-sup-guide-panel-title]');
  root.querySelectorAll('[data-sup-guide-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-sup-guide-tab');
      const card = HOME_CARDS.find((c) => c.id === id);
      root.querySelectorAll('[data-sup-guide-tab]').forEach((el) => {
        el.classList.toggle('is-active', el === btn);
        el.setAttribute('aria-pressed', el === btn ? 'true' : 'false');
      });
      if (guidePanel && guidePanelTitle && card) {
        guidePanel.hidden = false;
        guidePanelTitle.textContent = card.title;
      }
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

  root.querySelectorAll('[data-lib-download]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-lib-download');
      window.alert(`자료 다운로드 미리보기 — ${id}`);
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

  const scrollArticle = root.querySelector('[data-sup-scroll-article]');
  if (scrollArticle) {
    const scrollSlug = scrollArticle.getAttribute('data-sup-scroll-article');
    requestAnimationFrame(() => {
      const item = root.querySelector(`[data-sup-article="${scrollSlug}"]`);
      item?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  } else if (getSectionFromPath(path)) {
    /* legacy section hash */
  }
}
