import { navigate } from '../state.js';
import {
  ADMIN_RED_LINE_PRINCIPLE,
  ALLOWED_OPERATOR_ACTIONS,
  FORBIDDEN_OPERATOR_ACTIONS,
  SUBMISSION_DOC_USER_NOTICE,
  OPERATION_LOG_MIN_FIELDS,
} from '../admin-red-line-copy.js';
import { listNotices, upsertNotice, deleteNotice } from '../support/notice-store.js';
import { listTickets, updateTicketStatus } from '../support/ticket-store.js';
import { TICKET_CATEGORIES, TICKET_STATUS_LABELS } from '../support/support-copy.js';
import { SUBMISSION_CATEGORIES } from '../submission-board/submission-copy.js';
import { apiOpenSubmissionAttachment } from '../board/board-backend.js';
import {
  isAdminApiMode,
  getSubmissionQueueCache,
  getOperationLogsCache,
  apiApplySubmissionQueueAction,
  getReportsCache,
  apiUpdateAdminReport,
  getExposureCache,
  hydrateExposureCache,
  apiApplyExposureCorrection,
} from './admin-backend.js';
import {
  A28_COPY,
  A28_NAV,
  A28_REPORT_SEED,
  A28_LOG_SEED,
  A28_ACTION_LABELS,
  A28_LOG_TARGET_TYPE_LABELS,
  A28_FORBIDDEN_UI,
  A28_SUBMISSION_QUEUE_ACTIONS,
  A28_REPORT_STATUS_LABELS,
  A28_EXPOSURE_ACTIONS,
  A28_EXPOSURE_TARGET_LABELS,
  A28_INQUIRY_STATUS_LABELS,
} from './a28-copy.js';
import { getAdminScreenId } from './router.js';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function renderRedLineBanner() {
  return `<div class="a28-redline" role="note"><strong>RED LINE</strong> · ${esc(A28_COPY.redLineBanner)}<br><span class="a28-redline__forbidden">사용자-facing 금지: ${esc(A28_FORBIDDEN_UI)}</span></div>`;
}

function renderPanel(title, screenId, bodyHtml, { lead = '' } = {}) {
  return `
    <section class="sup-panel-card sup-panel-card--admin a28-panel">
      <header class="sup-panel-card__head">
        <div>
          <h2 class="sup-panel-card__title">${esc(title)} <span class="sup-admin-badge a28-badge">${esc(A28_COPY.previewBadge)}</span></h2>
          ${lead ? `<p class="sup-panel-card__lead">${lead}</p>` : ''}
        </div>
        <span class="sup-panel-card__id">${esc(screenId)}</span>
      </header>
      <div class="sup-panel-card__body">${bodyHtml}</div>
    </section>`;
}

function renderNav(activePath) {
  return `
    <nav class="sup-admin-nav a28-nav" aria-label="A28 운영 메뉴">
      ${A28_NAV.map(
        (item) =>
          `<a href="#${item.path}" class="sup-admin-nav__link${item.path === activePath ? ' is-active' : ''}" data-a28-nav="${item.path}">${esc(item.label)}</a>`,
      ).join('')}
      <a href="#/support/admin" class="sup-admin-nav__link sup-admin-nav__link--muted" data-a28-nav="/support/admin">P17-admin</a>
      <a href="#/support" class="sup-admin-nav__link sup-admin-nav__link--muted" data-a28-nav="/support">← 고객센터</a>
    </nav>`;
}

function renderHub() {
  const cards = A28_NAV.filter((n) => n.id !== 'hub')
    .map(
      (n) =>
        `<a href="#${n.path}" class="sup-admin-hub__card a28-hub__card" data-a28-nav="${n.path}">
          <span class="sup-admin-hub__title">${esc(n.label)}</span>
          <span class="sup-admin-hub__desc">${esc(n.screenId)}</span>
        </a>`,
    )
    .join('');
  return renderPanel(
    A28_COPY.hubTitle,
    'A28-01',
    `${renderRedLineBanner()}
     <p>${esc(A28_COPY.hubLead)}</p>
     <div class="a28-lists">
       <div><h3>허용 조치 (28§1)</h3><ul>${ALLOWED_OPERATOR_ACTIONS.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
       <div><h3>금지 조치 (28§2)</h3><ul>${FORBIDDEN_OPERATOR_ACTIONS.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
     </div>
     <div class="sup-admin-hub">${cards}</div>`,
  );
}

function renderReports() {
  const reports = isAdminApiMode() ? getReportsCache() : A28_REPORT_SEED;
  const rows = reports
    .map((r) => {
      const status = r.status || 'open';
      const options = Object.entries(A28_REPORT_STATUS_LABELS)
        .map(([value, label]) => `<option value="${value}"${status === value ? ' selected' : ''}>${esc(label)}</option>`)
        .join('');
      const memo = r.internalMemo ?? '';
      return `<tr data-a28-report-row="${esc(r.id)}">
        <td><code>${esc(r.id)}</code></td>
        <td>${esc(r.kind)}</td>
        <td>${esc(r.target)}</td>
        <td>${esc(r.reason)}</td>
        <td><select class="sup-admin-select" data-a28-report-status="${esc(r.id)}">${options}</select></td>
        <td>${esc(r.createdAt)}</td>
        <td><textarea class="a28-memo" rows="2" data-a28-report-memo="${esc(r.id)}" placeholder="내부 메모">${esc(memo)}</textarea></td>
      </tr>`;
    })
    .join('');
  return renderPanel(
    '신고 처리 큐',
    'A28-04',
    `${renderRedLineBanner()}
     <p class="a28-hint">문의 티켓(P17-07)과 큐 분리 · 조치는 숨김·접촉 제한·임시 보호 중심 (28§5)</p>
     <table class="sup-admin-table"><thead><tr><th>ID</th><th>유형</th><th>대상</th><th>사유</th><th>상태</th><th>접수</th><th>내부 메모</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="sup-empty">신고 없음</td></tr>'}</tbody></table>
     <p class="a28-hint">${isAdminApiMode() ? 'API 연동 · 상태 변경 시 운영 로그 자동 기록' : '[프리뷰] API 미연결 — 정적 시드'}</p>`,
  );
}

function renderNoticesAdmin() {
  const notices = listNotices();
  const rows = notices
    .map(
      (n) =>
        `<tr data-notice-row="${esc(n.id)}"><td>${esc(n.date)}</td><td>${esc(n.title)}</td>
         <td class="sup-admin-actions">
           <button type="button" class="btn btn--secondary btn--sm" data-a28-notice-edit="${esc(n.id)}">수정</button>
           <button type="button" class="btn btn--secondary btn--sm" data-a28-notice-delete="${esc(n.id)}">삭제</button>
         </td></tr>`,
    )
    .join('');
  return renderPanel(
    '공지·가이드 CMS',
    'A28-05',
    `${renderRedLineBanner()}
     <p class="a28-hint">P17-admin 공지 기능 이관 대상 · 사용자-facing에는 공지 결과만 노출</p>
     <table class="sup-admin-table"><thead><tr><th>날짜</th><th>제목</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="sup-empty">공지 없음</td></tr>'}</tbody></table>
     <form class="sup-admin-form" data-a28-notice-form>
       <h3 class="sup-admin-form__title">공지 작성 · 수정</h3>
       <input type="hidden" name="id" value="" />
       <label class="sup-field"><span>날짜</span><input type="date" name="date" required /></label>
       <label class="sup-field"><span>제목</span><input type="text" name="title" required /></label>
       <label class="sup-field"><span>본문</span><textarea name="body" rows="4" required></textarea></label>
       <div class="sup-admin-form__actions">
         <button type="submit" class="btn btn--primary btn--sm">저장</button>
         <button type="button" class="btn btn--secondary btn--sm" data-a28-notice-reset>새 공지</button>
       </div>
     </form>`,
  );
}

function renderTicketsAdmin() {
  const tickets = listTickets();
  const categoryLabel = (value) => TICKET_CATEGORIES.find((c) => c.value === value)?.label || value;
  const rows = tickets
    .map((t) => {
      const options = Object.entries(TICKET_STATUS_LABELS)
        .map(([value, label]) => `<option value="${value}"${t.status === value ? ' selected' : ''}>${esc(label)}</option>`)
        .join('');
      return `<tr><td><code>${esc(t.id)}</code></td><td>${esc(categoryLabel(t.category))}</td><td>${esc(t.email)}</td>
        <td><select class="sup-admin-select" data-a28-ticket-status="${esc(t.id)}">${options}</select></td></tr>`;
    })
    .join('');
  return renderPanel(
    '운영 문의 큐',
    'A28-04b',
    `${renderRedLineBanner()}
     <p class="a28-hint">회원 문의 triage · 신고 큐와 분리 (28§5)</p>
     <table class="sup-admin-table"><thead><tr><th>번호</th><th>유형</th><th>이메일</th><th>상태</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="sup-empty">티켓 없음</td></tr>'}</tbody></table>`,
  );
}

function renderSubmissionDocs() {
  const queue = isAdminApiMode() ? getSubmissionQueueCache() : [];
  const categoryLabel = (id) => SUBMISSION_CATEGORIES.find((c) => c.id === id)?.label || id;
  const rows = queue.length
    ? queue
        .map(
          (item) => `
      <tr data-a28-sub-row="${esc(item.id)}">
        <td><code>${esc(item.id)}</code></td>
        <td>${esc(item.authorRole)}</td>
        <td>${esc(item.title)}</td>
        <td>${esc(categoryLabel(item.categoryId))}</td>
        <td>${item.hasAttachment ? esc(item.attachment?.originalName || item.fileLabel) : `<span class="a28-muted">${esc(item.fileLabel || '—')}</span>`}</td>
        <td>${esc(item.updatedAt)}</td>
        <td>
          <textarea class="a28-memo" rows="2" data-a28-sub-memo="${esc(item.id)}" placeholder="내부 메모 (사용자 미노출)">${esc(item.internalMemo)}</textarea>
        </td>
        <td class="sup-admin-actions">
          ${item.hasAttachment ? `<button type="button" class="btn btn--secondary btn--sm" data-a28-sub-view="${esc(item.id)}">첨부 열람</button> ` : ''}
          <button type="button" class="btn btn--primary btn--sm" data-a28-sub-action="expose" data-a28-sub-id="${esc(item.id)}" title="${esc(A28_SUBMISSION_QUEUE_ACTIONS.expose.hint)}">${esc(A28_SUBMISSION_QUEUE_ACTIONS.expose.label)}</button>
          <button type="button" class="btn btn--secondary btn--sm" data-a28-sub-action="hide" data-a28-sub-id="${esc(item.id)}" title="${esc(A28_SUBMISSION_QUEUE_ACTIONS.hide.hint)}">${esc(A28_SUBMISSION_QUEUE_ACTIONS.hide.label)}</button>
        </td>
      </tr>`,
        )
        .join('')
    : `<tr><td colspan="8" class="sup-empty">제출됨 상태 항목이 없습니다</td></tr>`;

  return renderPanel(
    '제출자료 내부 확인',
    'A28-06',
    `${renderRedLineBanner()}
     <p class="a28-hint">심사·인증 구조 ✕ · 내부 참고 확인만 (28§3) · 큐: <code>submitted</code> 상태</p>
     <blockquote class="a28-quote">${esc(SUBMISSION_DOC_USER_NOTICE.lead)} ${esc(SUBMISSION_DOC_USER_NOTICE.body)}</blockquote>
     <table class="sup-admin-table">
       <thead><tr><th>ID</th><th>역할</th><th>제목</th><th>항목</th><th>첨부</th><th>제출일</th><th>내부 메모</th><th>조치</th></tr></thead>
       <tbody>${rows}</tbody>
     </table>
     <p class="a28-hint">${isAdminApiMode() ? 'API 연동 · 조치 시 운영 로그 자동 기록' : '[프리뷰] API 미연결 — 정적 안내만 표시'}</p>`,
  );
}
function renderExposure() {
  const items = isAdminApiMode() ? getExposureCache() : [];
  const rows = items
    .map((item) => {
      const typeLabel = A28_EXPOSURE_TARGET_LABELS[item.targetType] || item.targetType;
      const secondary =
        item.targetType === 'study_room' && item.secondaryLabel
          ? `<br><span class="a28-hint">상담: ${esc(item.secondaryLabel)}</span>`
          : item.targetType === 'submission'
            ? `<br><span class="a28-hint">역할: ${esc(item.secondaryLabel)}</span>`
            : '';
      const inquirySelect =
        item.targetType === 'study_room'
          ? `<select class="a28-inquiry-select" data-a28-exp-inquiry="${esc(item.targetType)}:${esc(item.targetId)}">
              ${Object.entries(A28_INQUIRY_STATUS_LABELS)
                .map(
                  ([val, label]) =>
                    `<option value="${esc(val)}"${item.secondaryStatus === val ? ' selected' : ''}>${esc(label)}</option>`,
                )
                .join('')}
            </select>`
          : '—';

      return `<tr data-a28-exp-row="${esc(item.targetType)}:${esc(item.targetId)}">
        <td>${esc(typeLabel)}</td>
        <td><code>${esc(item.targetId)}</code></td>
        <td>${esc(item.label)}${secondary}</td>
        <td><span class="sub-board-status sub-board-status--${esc(item.status)}">${esc(item.statusLabel)}</span>
          ${item.searchVisible ? '' : ' <span class="a28-hint">(검색 제외)</span>'}</td>
        <td>${inquirySelect}</td>
        <td>${esc(item.updatedAt)}</td>
        <td><textarea class="a28-memo" rows="2" data-a28-exp-memo="${esc(item.targetType)}:${esc(item.targetId)}" placeholder="내부 메모">${esc(item.internalMemo || '')}</textarea></td>
        <td class="sub-board-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-a28-exp-action="hide" data-a28-exp-id="${esc(item.targetType)}:${esc(item.targetId)}" title="${esc(A28_EXPOSURE_ACTIONS.hide.hint)}">${esc(A28_EXPOSURE_ACTIONS.hide.label)}</button>
          ${
            item.targetType === 'submission' && item.status === 'submitted'
              ? `<a href="#/admin/submission-docs" class="a28-hint a28-queue-link" title="제출됨 상태는 제출자료 확인(A28-06)에서만 노출 반영 가능">→ A28-06 노출 반영</a>`
              : `<button type="button" class="btn btn--primary btn--sm" data-a28-exp-action="publish" data-a28-exp-id="${esc(item.targetType)}:${esc(item.targetId)}" title="${esc(A28_EXPOSURE_ACTIONS.publish.hint)}">${esc(A28_EXPOSURE_ACTIONS.publish.label)}</button>`
          }
          ${
            item.targetType === 'study_room'
              ? `<button type="button" class="btn btn--secondary btn--sm" data-a28-exp-action="inquiry_status" data-a28-exp-id="${esc(item.targetType)}:${esc(item.targetId)}" title="${esc(A28_EXPOSURE_ACTIONS.inquiry_status.hint)}">상담 보정</button>`
              : ''
          }
        </td>
      </tr>`;
    })
    .join('');

  return renderPanel(
    '노출·권한 수동 보정',
    'A28-07',
    `${renderRedLineBanner()}
     <p class="a28-hint">검색/노출 상태 보정 · 승인/반려 용어 사용 금지 · 조치 시 운영 로그 기록</p>
     <form class="a28-filter-form" data-a28-exp-filter>
       <label>대상 유형
         <select name="target_type">
           <option value="all">전체</option>
           <option value="study_room">공부방</option>
           <option value="tutor">과외쌤</option>
           <option value="submission">제출</option>
         </select>
       </label>
       <label>상태 필터
         <select name="status">
           <option value="">전체</option>
           <option value="published">공개중/게시중</option>
           <option value="hidden">숨김/비공개</option>
           <option value="draft">비공개(저장)</option>
           <option value="submitted">제출됨</option>
         </select>
       </label>
       <button type="submit" class="btn btn--secondary btn--sm">목록 갱신</button>
     </form>
     <table class="sup-admin-table">
       <thead><tr><th>유형</th><th>ID</th><th>이름</th><th>노출</th><th>상담</th><th>갱신</th><th>내부 메모</th><th>조치</th></tr></thead>
       <tbody>${rows || '<tr><td colspan="8" class="mypage-muted">표시할 항목이 없습니다.</td></tr>'}</tbody>
     </table>
     <p class="a28-hint">${isAdminApiMode() ? 'API 연동 · hide/publish/inquiry_status 조치 시 admin_operation_logs 기록' : '[프리뷰] API 미연결 — 운영자 로그인 필요'}</p>`,
  );
}

function renderLogs() {
  const logs = isAdminApiMode() ? getOperationLogsCache() : A28_LOG_SEED;
  const rows = logs
    .map(
      (l) =>
        `<tr><td><code>${esc(l.id)}</code></td><td>${esc(A28_LOG_TARGET_TYPE_LABELS[l.targetType] || l.targetType || '—')}</td><td>${esc(A28_ACTION_LABELS[l.action] || l.action)}</td><td><code>${esc(l.target)}</code></td><td>${esc(l.operator)}</td><td>${esc(l.at)}</td><td>${l.reversible ? '가능' : '—'}</td></tr>`,
    )
    .join('');
  const fields = OPERATION_LOG_MIN_FIELDS.join(' · ');
  return renderPanel(
    '운영 로그',
    'A28-08',
    `${renderRedLineBanner()}
     <p class="a28-hint">필수 필드: ${esc(fields)}</p>
     <p class="a28-hint">조치 구분: <strong>프로필 숨김</strong>(공부방·과외) · <strong>노출 보정</strong>(공개·상담) · <strong>제출 노출 반영/숨김</strong>(제출)</p>
     <p class="a28-hint">${isAdminApiMode() ? 'API 연동 · 제출자료 조치 로그 포함' : '[프리뷰] 정적 시드'}</p>
     <table class="sup-admin-table"><thead><tr><th>ID</th><th>대상 유형</th><th>조치</th><th>대상 ID</th><th>운영자</th><th>시각</th><th>되돌리기</th></tr></thead><tbody>${rows}</tbody></table>`,
  );
}

/** @param {string} path */
export function renderA28Screen(path) {
  const nav = renderNav(path);
  let body = renderHub();
  if (path === '/admin/reports') body = renderReports();
  else if (path === '/admin/notices') body = renderNoticesAdmin();
  else if (path === '/admin/tickets') body = renderTicketsAdmin();
  else if (path === '/admin/submission-docs') body = renderSubmissionDocs();
  else if (path === '/admin/exposure') body = renderExposure();
  else if (path === '/admin/logs') body = renderLogs();
  return nav + body;
}

/** @param {HTMLElement} root @param {string} path @param {() => void} rerender */
export function bindA28ScreenEvents(root, path, rerender) {
  root.querySelectorAll('[data-a28-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.getAttribute('data-a28-nav') || '/admin');
    });
  });

  if (path === '/admin/notices') {
    const form = root.querySelector('[data-a28-notice-form]');
    form?.querySelector('[name="date"]')?.setAttribute('value', new Date().toISOString().slice(0, 10));
    root.querySelectorAll('[data-a28-notice-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const notice = listNotices().find((n) => n.id === btn.getAttribute('data-a28-notice-edit'));
        if (!notice || !form) return;
        form.querySelector('[name="id"]').value = notice.id;
        form.querySelector('[name="date"]').value = notice.date;
        form.querySelector('[name="title"]').value = notice.title;
        form.querySelector('[name="body"]').value = notice.body.join('\n');
      });
    });
    root.querySelectorAll('[data-a28-notice-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-a28-notice-delete');
        if (!id || !window.confirm('삭제할까요?')) return;
        await deleteNotice(id);
        rerender();
      });
    });
    form?.querySelector('[data-a28-notice-reset]')?.addEventListener('click', () => {
      form.reset();
      form.querySelector('[name="id"]').value = '';
      form.querySelector('[name="date"]').value = new Date().toISOString().slice(0, 10);
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
      rerender();
    });
  }

  if (path === '/admin/reports') {
    root.querySelectorAll('[data-a28-report-status]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const id = sel.getAttribute('data-a28-report-status');
        if (!id) return;
        const memoEl = root.querySelector(`[data-a28-report-memo="${id}"]`);
        const internalMemo = memoEl instanceof HTMLTextAreaElement ? memoEl.value.trim() : '';
        try {
          await apiUpdateAdminReport(id, sel.value, { internalMemo });
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '상태 변경에 실패했습니다.');
          rerender();
        }
      });
    });
  }

  if (path === '/admin/tickets') {
    root.querySelectorAll('[data-a28-ticket-status]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const id = sel.getAttribute('data-a28-ticket-status');
        if (id) await updateTicketStatus(id, sel.value);
      });
    });
  }

  if (path === '/admin/submission-docs') {
    root.querySelectorAll('[data-a28-sub-view]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-a28-sub-view');
        if (!id) return;
        try {
          await apiOpenSubmissionAttachment(id, { audience: 'admin' });
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '첨부를 열 수 없습니다.');
        }
      });
    });

    root.querySelectorAll('[data-a28-sub-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-a28-sub-id');
        const action = btn.getAttribute('data-a28-sub-action');
        if (!id || (action !== 'expose' && action !== 'hide')) return;
        const memoEl = root.querySelector(`[data-a28-sub-memo="${id}"]`);
        const internalMemo = memoEl instanceof HTMLTextAreaElement ? memoEl.value.trim() : '';
        const confirmMsg =
          action === 'expose'
            ? '이 제출을 노출 반영(게시중)할까요?'
            : '이 제출을 숨김(비공개) 처리할까요?';
        if (!window.confirm(confirmMsg)) return;
        try {
          await apiApplySubmissionQueueAction(id, action, { internalMemo });
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '조치에 실패했습니다.');
        }
      });
    });
  }

  if (path === '/admin/exposure') {
    const filterForm = root.querySelector('[data-a28-exp-filter]');
    filterForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(filterForm);
      try {
        await hydrateExposureCache(String(fd.get('target_type') || 'all'), String(fd.get('status') || ''));
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
      }
    });

    root.querySelectorAll('[data-a28-exp-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const compound = btn.getAttribute('data-a28-exp-id');
        const action = btn.getAttribute('data-a28-exp-action');
        if (!compound || !action) return;
        const [targetType, targetId] = compound.split(':');
        if (!targetType || !targetId) return;

        const memoEl = root.querySelector(`[data-a28-exp-memo="${compound}"]`);
        const internalMemo = memoEl instanceof HTMLTextAreaElement ? memoEl.value.trim() : '';

        let inquiryStatus;
        if (action === 'inquiry_status') {
          const sel = root.querySelector(`[data-a28-exp-inquiry="${compound}"]`);
          inquiryStatus = sel instanceof HTMLSelectElement ? sel.value : '';
        }

        const confirmMsg =
          action === 'hide'
            ? '이 항목을 숨김 처리할까요?'
            : action === 'publish'
              ? '이 항목을 공개중(검색 노출) 상태로 보정할까요?'
              : '상담 상태를 보정할까요?';
        if (!window.confirm(confirmMsg)) return;

        try {
          await apiApplyExposureCorrection(
            targetType,
            targetId,
            /** @type {'hide'|'publish'|'inquiry_status'} */ (action),
            { internalMemo, inquiryStatus, reasonCategory: 'internal_review' },
          );
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '보정에 실패했습니다.');
        }
      });
    });
  }
}
export { getAdminScreenId };
