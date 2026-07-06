import {
  ADMIN_COPY,
  TICKET_CATEGORIES,
  TICKET_STATUS_LABELS,
} from './support-copy.js';
import { listNotices, upsertNotice, deleteNotice, resetNoticesToSeed } from './notice-store.js';
import { listTickets, updateTicketStatus } from './ticket-store.js';
import { navigate } from '../state.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function renderAdminPanel(title, screenId, bodyHtml, { lead = '' } = {}) {
  return `
    <section class="sup-panel-card sup-panel-card--admin">
      <header class="sup-panel-card__head">
        <div>
          <h2 class="sup-panel-card__title">${esc(title)} <span class="sup-admin-badge">${esc(ADMIN_COPY.previewBadge)}</span></h2>
          ${lead ? `<p class="sup-panel-card__lead">${lead}</p>` : ''}
        </div>
        <span class="sup-panel-card__id">${esc(screenId)}</span>
      </header>
      <div class="sup-panel-card__body">${bodyHtml}</div>
    </section>`;
}

function renderAdminNav(active) {
  const items = [
    { id: 'hub', label: '운영 홈', path: '/support/admin' },
    { id: 'notices', label: '공지 CMS', path: '/support/admin/notices' },
    { id: 'tickets', label: '티켓 관리', path: '/support/admin/tickets' },
  ];
  return `
    <nav class="sup-admin-nav" aria-label="운영 메뉴">
      ${items
        .map(
          (item) =>
            `<a href="#${item.path}" class="sup-admin-nav__link${active === item.id ? ' is-active' : ''}" data-sup-nav="${item.path}">${esc(item.label)}</a>`,
        )
        .join('')}
      <a href="#/support" class="sup-admin-nav__link sup-admin-nav__link--muted" data-sup-nav="/support">← 고객센터</a>
    </nav>`;
}

/** @param {string} path */
export function renderAdminScreen(path) {
  const nav = renderAdminNav(
    path === '/support/admin/notices' ? 'notices' : path === '/support/admin/tickets' ? 'tickets' : 'hub',
  );

  if (path === '/support/admin/notices') {
    return nav + renderNoticeAdmin();
  }
  if (path === '/support/admin/tickets') {
    return nav + renderTicketAdmin();
  }
  return (
    nav +
    renderAdminPanel(
      ADMIN_COPY.hubTitle,
      'P17-admin',
      `<p class="sup-section__lead">${esc(ADMIN_COPY.hubLead)}</p>
       <div class="sup-admin-hub">
         <a href="#/support/admin/notices" class="sup-admin-hub__card" data-sup-nav="/support/admin/notices">
           <span class="sup-admin-hub__title">공지 CMS</span>
           <span class="sup-admin-hub__desc">P17-05 공지 추가·수정</span>
         </a>
         <a href="#/support/admin/tickets" class="sup-admin-hub__card" data-sup-nav="/support/admin/tickets">
           <span class="sup-admin-hub__title">티켓 관리</span>
           <span class="sup-admin-hub__desc">P17-07 접수 목록·상태</span>
         </a>
         <a href="#/admin" class="sup-admin-hub__card sup-admin-hub__card--a28" data-sup-nav="/admin">
           <span class="sup-admin-hub__title">A28 운영 콘솔</span>
           <span class="sup-admin-hub__desc">28장 · RED LINE · #/admin/*</span>
         </a>
       </div>`,
    )
  );
}

function renderNoticeAdmin() {
  const notices = listNotices();
  const rows = notices
    .map(
      (n) =>
        `<tr data-notice-row="${esc(n.id)}">
           <td><time>${esc(n.date)}</time></td>
           <td>${esc(n.title)}</td>
           <td class="sup-admin-actions">
             <button type="button" class="btn btn--secondary btn--sm" data-notice-edit="${esc(n.id)}">수정</button>
             <button type="button" class="btn btn--secondary btn--sm" data-notice-delete="${esc(n.id)}">삭제</button>
           </td>
         </tr>`,
    )
    .join('');

  return renderAdminPanel(
    '공지 CMS',
    'P17-05 · admin',
    `<table class="sup-admin-table">
       <thead><tr><th>날짜</th><th>제목</th><th></th></tr></thead>
       <tbody>${rows || '<tr><td colspan="3" class="sup-empty">공지 없음</td></tr>'}</tbody>
     </table>
     <form class="sup-admin-form" data-notice-form>
       <h3 class="sup-admin-form__title">공지 작성 · 수정</h3>
       <input type="hidden" name="id" value="" />
       <label class="sup-field"><span>날짜</span><input type="date" name="date" required /></label>
       <label class="sup-field"><span>제목</span><input type="text" name="title" required /></label>
       <label class="sup-field"><span>본문 (줄바꿈 = 문단)</span><textarea name="body" rows="5" required></textarea></label>
       <div class="sup-admin-form__actions">
         <button type="submit" class="btn btn--primary btn--sm">저장</button>
         <button type="button" class="btn btn--secondary btn--sm" data-notice-reset>새 공지</button>
         <button type="button" class="btn btn--secondary btn--sm" data-notice-seed-reset>시드 복원</button>
       </div>
     </form>`,
    { lead: ADMIN_COPY.noticeAdminLead },
  );
}

function renderTicketAdmin() {
  const tickets = listTickets();
  const categoryLabel = (value) => TICKET_CATEGORIES.find((c) => c.value === value)?.label || value;

  const rows = tickets
    .map((t) => {
      const options = Object.entries(TICKET_STATUS_LABELS)
        .map(
          ([value, label]) =>
            `<option value="${value}"${t.status === value ? ' selected' : ''}>${esc(label)}</option>`,
        )
        .join('');
      return `<tr>
        <td><code>${esc(t.id)}</code></td>
        <td>${esc(categoryLabel(t.category))}</td>
        <td>${esc(t.email)}</td>
        <td class="sup-admin-ticket-body">${esc(t.body.slice(0, 80))}${t.body.length > 80 ? '…' : ''}</td>
        <td>
          <select class="sup-admin-select" data-ticket-status="${esc(t.id)}" aria-label="상태">${options}</select>
        </td>
        <td><time>${esc(t.createdAt.slice(0, 10))}</time></td>
      </tr>`;
    })
    .join('');

  return renderAdminPanel(
    '티켓 관리',
    'P17-07 · admin',
    `<table class="sup-admin-table sup-admin-table--tickets">
       <thead><tr><th>번호</th><th>유형</th><th>이메일</th><th>내용</th><th>상태</th><th>접수일</th></tr></thead>
       <tbody>${rows || '<tr><td colspan="6" class="sup-empty">접수된 티켓이 없습니다.</td></tr>'}</tbody>
     </table>`,
    { lead: ADMIN_COPY.ticketAdminLead },
  );
}

/** @param {HTMLElement} root @param {string} path @param {() => void} rerender */
export function bindAdminScreenEvents(root, path, rerender) {
  root.querySelectorAll('[data-sup-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.getAttribute('data-sup-nav') || '/support/admin');
    });
  });

  if (path === '/support/admin/notices') {
    const form = root.querySelector('[data-notice-form]');
    form?.querySelector('[name="date"]')?.setAttribute('value', new Date().toISOString().slice(0, 10));

    root.querySelectorAll('[data-notice-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-notice-edit');
        const notice = listNotices().find((n) => n.id === id);
        if (!notice || !form) return;
        form.querySelector('[name="id"]').value = notice.id;
        form.querySelector('[name="date"]').value = notice.date;
        form.querySelector('[name="title"]').value = notice.title;
        form.querySelector('[name="body"]').value = notice.body.join('\n');
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    root.querySelectorAll('[data-notice-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-notice-delete');
        if (!id || !window.confirm('이 공지를 삭제할까요?')) return;
        await deleteNotice(id);
        rerender();
      });
    });

    form?.querySelector('[data-notice-reset]')?.addEventListener('click', () => {
      form.reset();
      form.querySelector('[name="id"]').value = '';
      form.querySelector('[name="date"]').value = new Date().toISOString().slice(0, 10);
    });

    form?.querySelector('[data-notice-seed-reset]')?.addEventListener('click', async () => {
      if (!window.confirm('공지를 초기 시드 데이터로 되돌릴까요?')) return;
      await resetNoticesToSeed();
      rerender();
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      await upsertNotice({
        id: String(fd.get('id') || '').trim() || undefined,
        date: String(fd.get('date')),
        title: String(fd.get('title')),
        body: String(fd.get('body')).split('\n').map((l) => l.trim()).filter(Boolean),
      });
      form.reset();
      form.querySelector('[name="id"]').value = '';
      form.querySelector('[name="date"]').value = new Date().toISOString().slice(0, 10);
      rerender();
    });
  }

  if (path === '/support/admin/tickets') {
    root.querySelectorAll('[data-ticket-status]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const id = sel.getAttribute('data-ticket-status');
        if (!id) return;
        await updateTicketStatus(id, sel.value);
      });
    });
  }
}
