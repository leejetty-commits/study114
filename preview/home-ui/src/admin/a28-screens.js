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
  getCommerceCache,
  hydrateCommerceCache,
  apiApplyCommerceCorrection,
  getMembersCache,
  hydrateMembersCache,
  getMemberDetailCache,
  hydrateMemberDetail,
  apiApplyMemberAction,
} from './admin-backend.js';
import { isMasterAdmin } from './admin-guard.js';
import { canAccessAdminMenu, MASTER_EMAILS, SUB_MASTER_EMAILS, SUB_MASTER_BLOCKED_MENUS } from './admin-permissions.js';
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
  A28_MEMBER_STATUS_LABELS,
  A28_MEMBER_ROLE_LABELS,
  A28_MEMBER_TIER_LABELS,
} from './a28-copy.js';
import { getAdminScreenId } from './router.js';

/** @type {{ q: string, status: string, role_type: string }} */
let memberFilters = { q: '', status: 'all', role_type: 'all' };
/** @type {number|null} */
let openMemberId = null;

const A28_MEMBER_SEED = [
  {
    id: 1,
    email: 'parent@example.com',
    name: '김학부모',
    status: 'active',
    primaryRole: 'guardian_student',
    emailVerified: true,
    oauthLinked: false,
    subscriptionTier: 'free',
    activePositions: 0,
    studyRoomCount: 0,
    tutorCount: 0,
    studentCount: 2,
    lastLoginAt: '2026-07-15 10:00:00',
    createdAt: '2026-01-10 09:00:00',
    isMaster: false,
  },
  {
    id: 2,
    email: 'room@example.com',
    name: '이공부방',
    status: 'active',
    primaryRole: 'study_room_owner',
    emailVerified: true,
    oauthLinked: true,
    subscriptionTier: 'paid',
    activePositions: 1,
    studyRoomCount: 1,
    tutorCount: 0,
    studentCount: 0,
    lastLoginAt: '2026-07-16 18:22:00',
    createdAt: '2026-02-01 11:00:00',
    isMaster: false,
  },
];

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function renderRedLineBanner() {
  return `<div class="a28-redline" role="note"><strong>RED LINE</strong> · ${esc(A28_COPY.redLineBanner)}<br><span class="a28-redline__forbidden">사용자-facing 금지: ${esc(A28_FORBIDDEN_UI)}</span></div>`;
}

function renderDetailDrawer(id, title, bodyHtml) {
  return `
    <aside class="admin-drawer" data-admin-drawer="${esc(id)}" hidden>
      <div class="admin-drawer__backdrop" data-admin-drawer-close></div>
      <div class="admin-drawer__panel" role="dialog" aria-label="${esc(title)}">
        <header class="admin-drawer__head">
          <strong>${esc(title)}</strong>
          <button type="button" class="btn btn--secondary btn--sm" data-admin-drawer-close>닫기</button>
        </header>
        <div class="admin-drawer__body">${bodyHtml}</div>
      </div>
    </aside>`;
}

function bindDetailDrawer(root) {
  root.querySelectorAll('[data-admin-drawer-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-admin-drawer-open');
      const drawer = root.querySelector(`[data-admin-drawer="${id}"]`);
      if (drawer) drawer.hidden = false;
    });
  });
  root.querySelectorAll('[data-admin-drawer-close]').forEach((el) => {
    el.addEventListener('click', () => {
      const drawer = el.closest('[data-admin-drawer]');
      if (drawer) drawer.hidden = true;
    });
  });
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
  const cards = A28_NAV.filter((n) => n.id !== 'hub' && canAccessAdminMenu(n.id))
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
    'A28-07a',
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

function renderCommerce() {
  const data = isAdminApiMode() ? getCommerceCache() : null;
  const master = isMasterAdmin();
  const slots = data?.slots;
  const settings = data?.settings_readonly;
  const positions = data?.positions ?? [];
  const tickets = data?.tickets ?? [];
  const orders = data?.orders ?? [];

  const slotHtml = slots
    ? `<div class="admin-kpi-row">
        <div class="admin-kpi"><span>Prime</span><strong>${slots.prime?.used}/${slots.prime?.capacity}</strong><small>잔여 ${slots.prime?.remaining}</small></div>
        <div class="admin-kpi"><span>Pick</span><strong>${slots.pick?.used}/${slots.pick?.capacity}</strong><small>세트 ${slots.pick?.set_size} · ${slots.pick?.rotation_minutes}분</small></div>
        <div class="admin-kpi"><span>지역</span><strong>${esc(slots.region_scope_type || 'dong')}</strong><small>조회 전용</small></div>
      </div>`
    : '<p class="sup-empty">API 미연결 — 운영자 로그인 후 조회</p>';

  const posRows = positions
    .map((p) => {
      const corr = master
        ? `<div class="admin-inline-corr">
            <input type="datetime-local" class="admin-input--sm" data-commerce-ends="${p.id}" value="${esc(String(p.ends_at || '').replace(' ', 'T').slice(0, 16))}" />
            <button type="button" class="btn btn--secondary btn--sm" data-commerce-position-save="${p.id}">만료 보정</button>
          </div>`
        : '<span class="a28-muted">마스터 전용</span>';
      return `<tr>
        <td><code>${p.id}</code></td>
        <td>${esc(p.user_email)}</td>
        <td><strong>${esc(String(p.sku_code).toUpperCase())}</strong></td>
        <td>${p.days_left}일</td>
        <td>${esc(p.ends_at)}</td>
        <td>${corr}</td>
      </tr>`;
    })
    .join('');

  const ticketRows = tickets
    .map((t) => {
      const corr = master
        ? `<div class="admin-inline-corr">
            <input type="number" min="0" class="admin-input--sm" data-commerce-remain="${t.id}" value="${t.remaining}" />
            <button type="button" class="btn btn--secondary btn--sm" data-commerce-ticket-save="${t.id}">잔여 보정</button>
          </div>`
        : '<span class="a28-muted">마스터 전용</span>';
      return `<tr>
        <td><code>${t.id}</code></td>
        <td>${esc(t.user_email)}</td>
        <td>${esc(t.ticket_type)}</td>
        <td>${t.remaining}/${t.pack_size}</td>
        <td>${esc(t.expires_at)}</td>
        <td>${corr}</td>
      </tr>`;
    })
    .join('');

  const orderRows = orders
    .map(
      (o) => `<tr>
        <td><code>${esc(o.order_ref)}</code></td>
        <td>${esc(o.user_email)}</td>
        <td>${esc(o.product_id)} · ${esc(o.variant_label)}</td>
        <td>${esc(o.status)}</td>
        <td>${Number(o.amount_won || 0).toLocaleString()}원</td>
        <td>${esc(o.paid_at || o.created_at)}</td>
        <td><button type="button" class="btn btn--secondary btn--sm" data-admin-drawer-open="order-${esc(o.order_ref)}">상세</button></td>
      </tr>`,
    )
    .join('');

  const orderDrawers = orders
    .map(
      (o) =>
        renderDetailDrawer(
          `order-${o.order_ref}`,
          `주문 ${o.order_ref}`,
          `<dl class="admin-detail-dl">
            <dt>상품</dt><dd>${esc(o.product_id)} (${esc(o.product_kind)})</dd>
            <dt>옵션</dt><dd>${esc(o.variant_label)}</dd>
            <dt>결제</dt><dd>${esc(o.status)} · ${esc(o.pg_provider)}</dd>
            <dt>금액</dt><dd>${Number(o.amount_won || 0).toLocaleString()}원</dd>
            <dt>생성</dt><dd>${esc(o.created_at)}</dd>
            <dt>결제완료</dt><dd>${esc(o.paid_at || '—')}</dd>
          </dl>`,
        ),
    )
    .join('');

  return renderPanel(
    '상품·노출·결제 조회',
    'A28-07b',
    `${renderRedLineBanner()}
     <p class="a28-hint">가격표·슬롯 수·회전간격 직접 편집 UI는 1차 제외 · 조회 + 마스터 최소 보정만</p>
     ${slotHtml}
     ${settings ? `<p class="a28-hint">${esc(settings.note)} · Prime ${settings.prime_slots} · Pick ${settings.pick_set_size}세트 · Basic ${settings.basic_page_size}/p</p>` : ''}
     <h3 class="admin-section-title">Prime / Pick 활성 구독</h3>
     <table class="sup-admin-table"><thead><tr><th>ID</th><th>계정</th><th>SKU</th><th>남은일</th><th>만료</th><th>보정</th></tr></thead>
     <tbody>${posRows || '<tr><td colspan="6" class="sup-empty">활성 구독 없음</td></tr>'}</tbody></table>
     <h3 class="admin-section-title">접근권(횟수권) 팩</h3>
     <table class="sup-admin-table"><thead><tr><th>ID</th><th>계정</th><th>유형</th><th>잔여</th><th>만료</th><th>보정</th></tr></thead>
     <tbody>${ticketRows || '<tr><td colspan="6" class="sup-empty">활성 팩 없음</td></tr>'}</tbody></table>
     <h3 class="admin-section-title">최근 주문·결제</h3>
     <table class="sup-admin-table"><thead><tr><th>주문</th><th>계정</th><th>상품</th><th>상태</th><th>금액</th><th>시각</th><th></th></tr></thead>
     <tbody>${orderRows || '<tr><td colspan="7" class="sup-empty">주문 없음</td></tr>'}</tbody></table>
     ${orderDrawers}
     <button type="button" class="btn btn--secondary btn--sm" data-commerce-refresh>목록 새로고침</button>`,
  );
}

function renderMembers() {
  const cache = isAdminApiMode() ? getMembersCache() : null;
  const members = cache?.members ?? A28_MEMBER_SEED;
  const filters = cache?.filters ?? memberFilters;
  const master = isMasterAdmin();

  const rows = members
    .map((m) => {
      const role = A28_MEMBER_ROLE_LABELS[m.primaryRole] || m.primaryRole || '—';
      const status = A28_MEMBER_STATUS_LABELS[m.status] || m.status;
      const tier = A28_MEMBER_TIER_LABELS[m.subscriptionTier] || m.subscriptionTier || 'free';
      return `<tr>
        <td><code>${m.id}</code></td>
        <td>${esc(m.name || '—')}<br><small>${esc(m.email)}</small></td>
        <td>${esc(role)}${m.isMaster ? ' · 마스터' : ''}</td>
        <td>${esc(status)}</td>
        <td>${esc(tier)}${m.activePositions ? ` · 포지션 ${m.activePositions}` : ''}</td>
        <td>${m.oauthLinked ? '연동' : '—'}${m.oauthPending ? ' · 역할대기' : ''}</td>
        <td>${esc(m.lastLoginAt || '—')}</td>
        <td><button type="button" class="btn btn--secondary btn--sm" data-member-open="${m.id}">상세</button></td>
      </tr>`;
    })
    .join('');

  let detailHtml = '';
  if (openMemberId) {
    let detail = isAdminApiMode() ? getMemberDetailCache(openMemberId) : null;
    if (!detail && !isAdminApiMode()) {
      const seed = A28_MEMBER_SEED.find((m) => m.id === openMemberId);
      if (seed) {
        detail = {
          ...seed,
          phone: '010-0000-0000',
          address: '서울시 예시동',
          roles: [{ roleType: seed.primaryRole, isPrimary: true, status: 'active' }],
          oauth: seed.oauthLinked ? [{ provider: 'naver', providerEmail: seed.email, linkedAt: seed.createdAt }] : [],
          paid: { subscriptionTier: seed.subscriptionTier, positions: [], tickets: [], orders: [] },
          profileCounts: {
            studyRooms: seed.studyRoomCount,
            tutors: seed.tutorCount,
            students: seed.studentCount,
          },
        };
      }
    }
    if (detail) {
      const roles = (detail.roles || [])
        .map(
          (r) =>
            `<li>${esc(A28_MEMBER_ROLE_LABELS[r.roleType] || r.roleType)}${r.isPrimary ? ' (대표)' : ''} · ${esc(r.status)}</li>`,
        )
        .join('');
      const oauth = (detail.oauth || [])
        .map((o) => `<li>${esc(o.provider)} · ${esc(o.providerEmail || '—')} · ${esc(o.linkedAt)}</li>`)
        .join('');
      const positions = (detail.paid?.positions || [])
        .map((p) => `<li>${esc(p.sku_code)} · ${esc(p.ends_at)} (D${p.days_left})</li>`)
        .join('');
      const tickets = (detail.paid?.tickets || [])
        .map((t) => `<li>${esc(t.ticket_type)} · 잔여 ${t.remaining}/${t.pack_size}</li>`)
        .join('');
      const orders = (detail.paid?.orders || [])
        .map(
          (o) =>
            `<li><code>${esc(o.order_ref)}</code> · ${esc(o.product_id)} · ${esc(o.status)} · ${Number(o.amount_won || 0).toLocaleString()}원</li>`,
        )
        .join('');

      const canBlock = detail.status !== 'blocked' && detail.status !== 'withdrawn' && !detail.isMaster;
      const canRestore = detail.status === 'blocked' && !detail.isMaster;
      const canWithdraw = master && detail.status !== 'withdrawn' && !detail.isMaster;

      detailHtml = renderDetailDrawer(
        `member-${detail.id}`,
        `회원 #${detail.id}`,
        `<dl class="admin-detail-dl">
          <dt>계정</dt><dd>${esc(detail.name || '—')} · ${esc(detail.email)}</dd>
          <dt>상태</dt><dd>${esc(A28_MEMBER_STATUS_LABELS[detail.status] || detail.status)}</dd>
          <dt>전화</dt><dd>${esc(detail.phone || '—')}</dd>
          <dt>주소</dt><dd>${esc(detail.address || '—')}</dd>
          <dt>가입</dt><dd>${esc(detail.createdAt)}</dd>
          <dt>최근 로그인</dt><dd>${esc(detail.lastLoginAt || '—')}</dd>
          <dt>프로필 수</dt><dd>공부방 ${detail.profileCounts?.studyRooms || 0} · 과외 ${detail.profileCounts?.tutors || 0} · 자녀 ${detail.profileCounts?.students || 0}</dd>
          <dt>유료 티어</dt><dd>${esc(A28_MEMBER_TIER_LABELS[detail.paid?.subscriptionTier] || detail.paid?.subscriptionTier || 'free')}</dd>
        </dl>
        <h4 class="admin-section-title">역할</h4>
        <ul class="a28-lists">${roles || '<li>없음</li>'}</ul>
        <h4 class="admin-section-title">소셜 연동</h4>
        <ul class="a28-lists">${oauth || '<li>없음</li>'}</ul>
        <h4 class="admin-section-title">유료·결제 (조회)</h4>
        <p class="a28-hint">포지션</p><ul class="a28-lists">${positions || '<li>없음</li>'}</ul>
        <p class="a28-hint">횟수권</p><ul class="a28-lists">${tickets || '<li>없음</li>'}</ul>
        <p class="a28-hint">최근 주문</p><ul class="a28-lists">${orders || '<li>없음</li>'}</ul>
        <label class="a28-hint">내부 메모
          <input type="text" class="admin-input" data-member-memo="${detail.id}" placeholder="조치 사유 (로그 기록)" />
        </label>
        <div class="admin-actions">
          ${canBlock ? `<button type="button" class="btn btn--secondary btn--sm" data-member-action="block" data-member-id="${detail.id}">이용 제한</button>` : ''}
          ${canRestore ? `<button type="button" class="btn btn--primary btn--sm" data-member-action="restore" data-member-id="${detail.id}">복구</button>` : ''}
          ${canWithdraw ? `<button type="button" class="btn btn--secondary btn--sm" data-member-action="withdraw" data-member-id="${detail.id}">탈퇴 처리</button>` : ''}
          ${detail.isMaster ? '<p class="a28-hint">마스터 계정은 제한/탈퇴 불가</p>' : ''}
        </div>`,
      );
    } else {
      detailHtml = `<p class="a28-hint">회원 #${openMemberId} 상세 로딩 중…</p>`;
    }
  }

  return renderPanel(
    '회원/역할 검색',
    'A28-02',
    `${renderRedLineBanner()}
     <p class="a28-hint">조회 · 이용 제한/복구 · 유료·역할 조회 · 역할 부여/가장(impersonation) UI 없음 · 승인·반려 용어 금지</p>
     <form class="admin-filter-bar" data-member-filter>
       <input type="search" name="q" class="admin-input" placeholder="이메일·이름·ID" value="${esc(filters.q || '')}" />
       <select name="status" class="admin-input--sm">
         <option value="all"${filters.status === 'all' ? ' selected' : ''}>상태 전체</option>
         <option value="active"${filters.status === 'active' ? ' selected' : ''}>정상</option>
         <option value="pending"${filters.status === 'pending' ? ' selected' : ''}>대기</option>
         <option value="blocked"${filters.status === 'blocked' ? ' selected' : ''}>이용 제한</option>
         <option value="withdrawn"${filters.status === 'withdrawn' ? ' selected' : ''}>탈퇴</option>
       </select>
       <select name="role_type" class="admin-input--sm">
         <option value="all"${filters.role_type === 'all' ? ' selected' : ''}>역할 전체</option>
         <option value="guardian_student"${filters.role_type === 'guardian_student' ? ' selected' : ''}>학부모</option>
         <option value="study_room_owner"${filters.role_type === 'study_room_owner' ? ' selected' : ''}>공부방</option>
         <option value="tutor"${filters.role_type === 'tutor' ? ' selected' : ''}>과외쌤</option>
         <option value="admin"${filters.role_type === 'admin' ? ' selected' : ''}>운영자</option>
       </select>
       <button type="submit" class="btn btn--primary btn--sm">검색</button>
       <button type="button" class="btn btn--secondary btn--sm" data-member-refresh>새로고침</button>
     </form>
     <p class="a28-hint">${isAdminApiMode() ? `API · ${members.length}명` : '[프리뷰] 정적 시드'}</p>
     <table class="sup-admin-table">
       <thead><tr><th>ID</th><th>회원</th><th>대표 역할</th><th>상태</th><th>유료</th><th>소셜</th><th>최근 로그인</th><th></th></tr></thead>
       <tbody>${rows || '<tr><td colspan="8" class="sup-empty">회원 없음</td></tr>'}</tbody>
     </table>
     ${detailHtml}`,
  );
}

function renderPermissions() {
  const masterRows = MASTER_EMAILS.map((e) => `<tr><td>마스터</td><td><code>${esc(e)}</code></td><td>전체 메뉴 · 강한 보정 · 권한 설정</td></tr>`).join('');
  const subRows = SUB_MASTER_EMAILS.map((e) => `<tr><td>부마스터</td><td><code>${esc(e)}</code></td><td>운영 조회 · 숨김/복구 · 로그 열람</td></tr>`).join('');
  const blocked = SUB_MASTER_BLOCKED_MENUS.map((m) => `<li><code>${esc(m)}</code></li>`).join('');

  return renderPanel(
    '권한·계정 (마스터 전용)',
    'A28-08b',
    `${renderRedLineBanner()}
     <p class="a28-hint">1차: 계정 목록·메뉴 차단 정책 조회만 · 권한 부여/회수 UI는 후속</p>
     <table class="sup-admin-table"><thead><tr><th>등급</th><th>이메일</th><th>범위</th></tr></thead><tbody>${masterRows}${subRows}</tbody></table>
     <h3 class="admin-section-title">부마스터 접근 금지</h3>
     <ul class="a28-lists">${blocked}</ul>
     <p class="a28-hint">운영값(가격·슬롯·회전) 편집 · 결제 강제변경 · 로그 삭제/수정 · 관리자 권한 변경 금지</p>`,
  );
}

function renderLogs() {
  const logs = isAdminApiMode() ? getOperationLogsCache() : A28_LOG_SEED;
  const rows = logs
    .map(
      (l) =>
        `<tr>
          <td><code>${esc(l.id)}</code></td>
          <td>${esc(A28_LOG_TARGET_TYPE_LABELS[l.targetType] || l.targetType || '—')}</td>
          <td>${esc(A28_ACTION_LABELS[l.action] || l.action)}</td>
          <td><code>${esc(l.target)}</code></td>
          <td>${esc(l.operator)}</td>
          <td>${esc(l.at)}</td>
          <td>${esc(l.reasonCategory || '—')}</td>
          <td><button type="button" class="btn btn--secondary btn--sm" data-admin-drawer-open="log-${esc(l.id)}">상세</button></td>
        </tr>`,
    )
    .join('');
  const drawers = logs
    .map((l) =>
      renderDetailDrawer(
        `log-${l.id}`,
        `로그 ${l.id}`,
        `<dl class="admin-detail-dl">
          <dt>조치</dt><dd>${esc(A28_ACTION_LABELS[l.action] || l.action)}</dd>
          <dt>대상</dt><dd>${esc(l.targetType)} #${esc(l.target)}</dd>
          <dt>운영자</dt><dd>${esc(l.operator)}</dd>
          <dt>사유</dt><dd>${esc(l.reasonCategory || '—')}</dd>
          <dt>메모</dt><dd>${esc(l.detailMemo || '—')}</dd>
          <dt>되돌리기</dt><dd>${l.reversible ? '가능(후속)' : '—'}</dd>
          <dt>사용자 알림</dt><dd>${l.userNotified ? 'Y' : 'N'}</dd>
        </dl>`,
      ),
    )
    .join('');
  const fields = OPERATION_LOG_MIN_FIELDS.join(' · ');
  return renderPanel(
    '운영 로그',
    'A28-08a',
    `${renderRedLineBanner()}
     <p class="a28-hint">필수 필드: ${esc(fields)} · 조회 전용(부마스터 포함) · 삭제/수정 금지</p>
     <table class="sup-admin-table"><thead><tr><th>ID</th><th>대상 유형</th><th>조치</th><th>대상 ID</th><th>운영자</th><th>시각</th><th>사유</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="sup-empty">로그 없음</td></tr>'}</tbody></table>
     ${drawers}
     <p class="a28-hint">${isAdminApiMode() ? 'API 연동' : '[프리뷰] 정적 시드'}</p>`,
  );
}

/** @param {string} path */
export function renderA28Screen(path) {
  let body = renderHub();
  if (path === '/admin/members') body = renderMembers();
  else if (path === '/admin/commerce') body = renderCommerce();
  else if (path === '/admin/reports') body = renderReports();
  else if (path === '/admin/notices') body = renderNoticesAdmin();
  else if (path === '/admin/tickets') body = renderTicketsAdmin();
  else if (path === '/admin/submission-docs') body = renderSubmissionDocs();
  else if (path === '/admin/exposure') body = renderExposure();
  else if (path === '/admin/logs') body = renderLogs();
  else if (path === '/admin/permissions') body = renderPermissions();
  return body;
}

/** @param {HTMLElement} root @param {string} path @param {() => void} rerender */
export function bindA28ScreenEvents(root, path, rerender) {
  bindDetailDrawer(root);

  if (path === '/admin/members') {
    // 최초 진입 시 목록 로드
    if (isAdminApiMode() && !getMembersCache()) {
      hydrateMembersCache(memberFilters)
        .then(() => rerender())
        .catch(() => {});
    }
    const form = root.querySelector('[data-member-filter]');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!(form instanceof HTMLFormElement)) return;
      const fd = new FormData(form);
      memberFilters = {
        q: String(fd.get('q') || '').trim(),
        status: String(fd.get('status') || 'all'),
        role_type: String(fd.get('role_type') || 'all'),
      };
      try {
        if (isAdminApiMode()) await hydrateMembersCache(memberFilters);
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '검색 실패');
      }
    });
    root.querySelector('[data-member-refresh]')?.addEventListener('click', async () => {
      try {
        if (isAdminApiMode()) await hydrateMembersCache(memberFilters);
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '새로고침 실패');
      }
    });
    root.querySelectorAll('[data-member-open]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-member-open'));
        if (!id) return;
        openMemberId = id;
        try {
          if (isAdminApiMode()) await hydrateMemberDetail(id);
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '상세 조회 실패');
        }
      });
    });
    if (openMemberId) {
      const drawer = root.querySelector(`[data-admin-drawer="member-${openMemberId}"]`);
      if (drawer) drawer.hidden = false;
    }
    root.querySelectorAll('[data-member-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const action = btn.getAttribute('data-member-action');
        const id = Number(btn.getAttribute('data-member-id'));
        if (!id || !action) return;
        const labels = { block: '이용 제한', restore: '복구', withdraw: '탈퇴 처리' };
        if (!window.confirm(`${labels[action] || action} 할까요?`)) return;
        const memoInput = root.querySelector(`[data-member-memo="${id}"]`);
        const memo = memoInput instanceof HTMLInputElement ? memoInput.value.trim() : '';
        try {
          await apiApplyMemberAction(id, /** @type {'block'|'restore'|'withdraw'} */ (action), {
            internalMemo: memo,
          });
          await hydrateMembersCache(memberFilters);
          await hydrateMemberDetail(id);
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '조치 실패');
        }
      });
    });
  }

  if (path === '/admin/commerce') {
    root.querySelector('[data-commerce-refresh]')?.addEventListener('click', async () => {
      try {
        await hydrateCommerceCache();
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '새로고침 실패');
      }
    });
    root.querySelectorAll('[data-commerce-position-save]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-commerce-position-save');
        const input = root.querySelector(`[data-commerce-ends="${id}"]`);
        if (!id || !(input instanceof HTMLInputElement) || !input.value) return;
        const endsAt = input.value.replace('T', ' ') + ':00';
        if (!window.confirm('포지션 만료일을 보정할까요?')) return;
        try {
          await apiApplyCommerceCorrection({ action: 'position_ends_at', position_id: Number(id), ends_at: endsAt });
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '보정 실패');
        }
      });
    });
    root.querySelectorAll('[data-commerce-ticket-save]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-commerce-ticket-save');
        const input = root.querySelector(`[data-commerce-remain="${id}"]`);
        if (!id || !(input instanceof HTMLInputElement)) return;
        if (!window.confirm('횟수권 잔여를 보정할까요?')) return;
        try {
          await apiApplyCommerceCorrection({
            action: 'ticket_remaining',
            ticket_pack_id: Number(id),
            remaining: Number(input.value),
          });
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '보정 실패');
        }
      });
    });
  }

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
