import { AUTH_UI_BASE } from '../../../shared/preview-links.js';
import { loginUrl } from '../../../shared/route-access.js';
import { navigate } from '../state.js';
import { isLoggedIn, getAuthUser, isAdminUser } from '../auth-session.js';
import {
  FAQ_TABS,
  OPERATIONAL_CONTACT,
  OPERATIONAL_CTA,
  SUPPORT_HOME_CARDS,
  TICKET_CATEGORIES,
} from './support-copy.js';
import { listNoticesForCenter, noticeTargetLabel } from './notice-store.js';
import { listFaqPostsByTab, listGuidePosts, getRelatedGuidePosts, isOperationalBoardApiActive } from '../operational-board-store.js';
import { createTicket } from './ticket-store.js';
import { renderAdminScreen } from './admin-screens.js';
import {
  isAdminSupportPath,
  getSectionFromPath,
  getSupportFaqSlug,
  getSupportPolicySlug,
} from './router.js';
import { CONTACT_HISTORY_PATH } from '../mypage/router.js';
import { SUPPORT_NAV, getActiveNavId } from './nav.js';
import { bindSingleOpenBoard } from '../../../shared/board/index.js';
import { POLICY_PAGES, POLICY_SHORT_NOTICE, getPolicyPage } from '../policy-copy.js';
import { LIBRARY_ENTRY_COPY } from '../library/library-copy.js';
import { renderLibraryBoardCards, bindInfoBoardEntry } from '../library/info-board-screens.js';

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
  return esc(text)
    .replace(/\[([^\]]+)\]\(#(\/[^)]+)\)/g, (_, label, path) => {
      const safe = path.replace(/[^a-z0-9/_-]/gi, '');
      return `<a href="#${safe}" data-sup-nav="${safe}">${label}</a>`;
    })
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function bodyHtml(body) {
  const lines = (Array.isArray(body) ? body : [body]).flatMap((line) => String(line ?? '').split(/\r?\n/));
  return lines
    .filter((line) => line.trim())
    .map((line) => `<p>${mdLite(line)}</p>`)
    .join('');
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
      <p>운영문의는 운영팀에 보내는 채널입니다. 오류·정책·계정 문제를 남기세요. 수업 상담은 쪽지입니다. 접수한 뒤에는 마이페이지의 내 문의 내역에서 확인합니다.</p>
      <div class="login-wall__steps" aria-label="이용 단계">
        <span class="step-pill"><span class="step-pill__n">1</span>로그인</span>
        <span class="step-pill"><span class="step-pill__n">2</span>문의 작성</span>
        <span class="step-pill"><span class="step-pill__n">3</span>내역 확인</span>
      </div>
      <div class="sup-contact-gate__actions" style="justify-content:center;position:relative;z-index:1;display:flex;gap:10px;flex-wrap:wrap">
        <a href="${esc(href)}" class="btn btn--primary" data-sup-external="login">운영문의 남기기</a>
        <a href="${esc(AUTH_UI_BASE)}/#/signup/terms" class="btn btn--secondary" data-sup-external="login">회원가입</a>
      </div>
    </section>`;
}

function renderAdminDeniedGate() {
  return `
    <section class="login-wall" aria-label="운영자 전용 안내">
      <h1>운영자 전용 화면이에요</h1>
      <p>공지·문의 관리는 운영자만 볼 수 있어요. 문의는 고객센터의 운영문의에서 남길 수 있어요.</p>
      <div class="sup-contact-gate__actions" style="justify-content:center;position:relative;z-index:1;display:flex;gap:10px;flex-wrap:wrap">
        <a href="#/support" class="btn btn--primary" data-sup-nav="/support">고객센터로</a>
      </div>
    </section>`;
}

/** @param {string} path */
export function renderSupportScreen(path) {
  if (isAdminSupportPath(path)) {
    return isAdminUser() ? renderAdminScreen(path) : renderAdminDeniedGate();
  }

  const contactPath = path === '/support/contact' || path === '/support/contact/tickets';
  if (contactPath && !isLoggedIn()) {
    return renderContactLoginGate();
  }

  if (path === '/support/contact/tickets') {
    queueMicrotask(() => {
      if (window.location.hash === '#/support/contact/tickets') {
        window.location.replace(`#${CONTACT_HISTORY_PATH}`);
      }
    });
    return `<p class="section-lead">마이페이지의 내 문의 내역으로 이동합니다.</p>`;
  }

  if (path.startsWith('/support/policies')) {
    return renderPoliciesSection(path);
  }

  if (path.startsWith('/support/library')) {
    return renderSupportLibrarySection();
  }

  if (path === '/support' || path === '/support/') {
    return `${renderSupportHero()}${renderSupportQuickCards()}`;
  }

  const navId = getActiveNavId(path);
  if (navId === 'faq') return renderFaqSection(path);
  if (navId === 'notice') return renderNoticeSection();
  if (navId === 'contact') return renderContactSection();
  return renderNoticeSection();
}

function renderSupportQuickCards() {
  const cards = SUPPORT_NAV.filter((n) => SUPPORT_HOME_CARDS[n.id]).map((n) => {
    const card = SUPPORT_HOME_CARDS[n.id];
    const accent = card.accent;
    return {
      ...card,
      href: n.path,
      extra: accent ? `card--accent-${accent}` : '',
      halo: accent ? `icon-halo--${accent}` : '',
      tile: accent ? `icon-tile--${accent}` : '',
    };
  });
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
    <p class="sup-home-hint">운영 지원은 고객센터에서 확인합니다. 이용 흐름은 메인메뉴의 이용안내를 보세요.</p>
    <p class="sup-home-hint sup-home-hint--sub">이미 남긴 운영문의의 답변과 진행 상태는 마이페이지 &gt; <a href="#${CONTACT_HISTORY_PATH}" data-sup-nav="${CONTACT_HISTORY_PATH}">내 문의 내역</a>에서 확인할 수 있습니다.</p>`;
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
        <p>자주 묻는 질문에서 먼저 찾아 보세요. 쓰는 방법은 이용안내, 운영팀에 보낼 내용은 운영문의입니다. 쪽지와 운영문의는 다릅니다.</p>
        <div class="support-hero__actions">
          <a class="btn btn--primary" href="#/support/faq" data-sup-nav="/support/faq">자주 묻는 질문</a>
          <a class="btn btn--secondary" href="#/support/contact" data-sup-nav="/support/contact">${OPERATIONAL_CTA.buttonLabel}</a>
        </div>
      </div>
    </section>
    <div class="pattern-band" aria-hidden="true"></div>`;
}

/** @param {string} path */
function renderFaqSection(path) {
  const slug = getSupportFaqSlug(path);
  const posts = listFaqPostsByTab(slug).map((f) => ({
    id: f.id,
    title: f.q,
    body: f.a,
  }));
  const sourceNote = isOperationalBoardApiActive()
    ? '최신 질문을 표시합니다.'
    : '자주 찾는 질문을 모았습니다.';
  const tabs = FAQ_TABS.map((t) => {
    const href = `/support/faq/${t.slug}`;
    const active = t.slug === slug;
    return `<a href="#${href}" class="tab-pill${active ? ' is-active' : ''}" ${active ? 'aria-current="page"' : ''} data-sup-nav="${href}">${esc(t.label)}</a>`;
  }).join('');
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
    <div class="tab-pills" role="tablist" aria-label="자주 묻는 질문">${tabs}</div>
    <div class="faq-list" data-support-faq>${items || '<p class="section-lead">등록된 질문이 없습니다.</p>'}</div>
    <aside class="tip-card">
      <h3>답이 없나요?</h3>
      <p>FAQ에 없는 내용은 운영문의에서 남겨 주세요. 운영문의는 쪽지와 다른 채널입니다.</p>
      <p class="support-tip-cta"><a class="btn btn--primary btn--sm" href="#/support/contact" data-sup-nav="/support/contact">운영문의 남기기</a></p>
    </aside>`;
}

function renderNoticeSection() {
  const posts = listNoticesForCenter().map((n) => ({
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
            <span class="notice-row__badge">${esc(noticeTargetLabel(n))}</span>
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

function contactCategoryFromHash() {
  const raw = window.location.hash.replace(/^#/, '');
  const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
  const value = new URLSearchParams(q).get('category') || '';
  return TICKET_CATEGORIES.some((c) => c.value === value) ? value : '';
}

function renderContactSection() {
  const flashId = sessionStorage.getItem(TICKET_FLASH_KEY);
  const flashHtml = flashId
    ? `<div class="sup-flash sup-flash--success" role="status">
         <strong>${esc(OPERATIONAL_CONTACT.ticketSuccessTitle)}</strong>
         <p>답변과 진행 상태는 마이페이지 &gt; 내 문의 내역에서 확인할 수 있습니다.</p>
         <p>문의 번호: <code>${esc(flashId)}</code> · <a href="#${CONTACT_HISTORY_PATH}" data-sup-nav="${CONTACT_HISTORY_PATH}">내 문의 내역 보기</a></p>
       </div>`
    : '';

  const presetCategory = contactCategoryFromHash();
  const categoryOptions = TICKET_CATEGORIES.map(
    (c) =>
      `<option value="${esc(c.value)}"${c.value === presetCategory ? ' selected' : ''}>${esc(c.label)}</option>`,
  ).join('');
  const userEmail = getAuthUser()?.email || '';

  return `
    <div class="section-head">
      <div>
        <span class="section-chip">Contact</span>
        <h2>운영문의</h2>
        <div class="section-underline"></div>
      </div>
    </div>
    <p class="section-lead">운영문의는 운영팀에 보내는 채널입니다. 오류·정책·계정 문제를 남기세요. 수업 상담은 쪽지입니다. 접수한 뒤에는 마이페이지의 내 문의 내역에서 확인합니다.</p>
    ${flashHtml}
    <section class="card card--accent support-contact-card">
      <form class="sup-contact-form" data-sup-contact-form>
        <label class="sup-field">
          <span>문의 유형</span>
          <select name="category" required>${categoryOptions}</select>
        </label>
        <label class="sup-field">
          <span>이메일</span>
          <input type="email" name="email" value="${esc(userEmail)}" readonly />
          <small class="sup-note">로그인 계정 이메일로 답변 확인</small>
        </label>
        <label class="sup-field">
          <span>문의 내용</span>
          <textarea name="body" rows="4" placeholder="오류·정책·계정 문의" required></textarea>
        </label>
        <button type="submit" class="btn btn--primary btn--sm">운영문의 남기기</button>
        <p class="sup-note">${esc(OPERATIONAL_CONTACT.note)}</p>
      </form>
      <p class="sup-contact-extra">
        이미 문의를 남기셨나요? <a href="#${CONTACT_HISTORY_PATH}" class="sup-inline-link" data-sup-nav="${CONTACT_HISTORY_PATH}">내 문의 내역 보기</a>
      </p>
      ${renderAdminFooterLink()}
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

function renderSupportLibrarySection() {
  return `
    <div class="section-head">
      <div>
        <span class="section-chip">Library</span>
        <h2>자료실</h2>
        <div class="section-underline"></div>
      </div>
    </div>
    <p class="section-lead">${esc(LIBRARY_ENTRY_COPY.lead)}</p>
    ${renderLibraryBoardCards()}`;
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
  if (path.startsWith('/support/library')) bindInfoBoardEntry(root, rerender);

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
          email: String(fd.get('email') || ''),
          category: String(fd.get('category')),
          body: String(fd.get('body')),
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
