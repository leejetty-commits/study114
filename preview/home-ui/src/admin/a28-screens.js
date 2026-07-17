import {
  ADMIN_RED_LINE_PRINCIPLE,
  ALLOWED_OPERATOR_ACTIONS,
  FORBIDDEN_OPERATOR_ACTIONS,
  SUBMISSION_DOC_USER_NOTICE,
  OPERATION_LOG_MIN_FIELDS,
} from '../admin-red-line-copy.js';
import { listNotices, upsertNotice, deleteNotice } from '../support/notice-store.js';
import {
  isOperationalBoardApiActive,
  listFaqPosts,
  upsertFaqPost,
  deleteFaqPost,
  listGuidePosts,
  upsertGuidePost,
  deleteGuidePost,
} from '../operational-board-store.js';
import { listTickets, updateTicketStatus } from '../support/ticket-store.js';
import { TICKET_CATEGORIES, TICKET_STATUS_LABELS } from '../support/support-copy.js';
import { SUBMISSION_CATEGORIES } from '../submission-board/submission-copy.js';
import { apiOpenSubmissionAttachment } from '../board/board-backend.js';
import {
  archiveBoardChannel,
  getBoardChannel,
  getBoardKeyCandidates,
  getPresetOptions,
  getSectionOwnerOptions,
  listBoardChannels,
  listSectionGroupSummary,
  addCustomSectionGroup,
  removeCustomSectionGroup,
  getSectionAccessMembers,
  addSectionAccessMember,
  removeSectionAccessMember,
  copyBoardChannel,
  CHANNEL_ROLE_OPTIONS,
  resetBoardChannels,
  saveBoardChannel,
} from '../board-channel-store.js';
import {
  RIGHT_RAIL_MOBILE_BEHAVIORS,
  RIGHT_RAIL_PAGE_LABELS,
  RIGHT_RAIL_SELECTION_MODES,
  listAllBoardAndRailLogs,
  listRightRailSlots,
  resetRightRailSlots,
  saveRightRailSlot,
  updateRightRailSlotStatus,
} from '../right-rail-store.js';
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
  apiApplyMemberBulkAction,
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
/** @type {{ q: string, status: string, sectionOwner: string }} */
let channelFilters = { q: '', status: 'all', sectionOwner: 'all' };
/** @type {string|null} 접근회원 편집 중인 소속 그룹 */
let openSectionAccessId = null;
/** @type {number|null} */
let openMemberId = null;

const A28_MEMBER_SEED = [
  {
    id: 1,
    email: 'parent@example.com',
    name: '김학부모',
    phone: '010-1111-2222',
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
    phone: '010-3333-4444',
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

function yesNo(v) {
  return v ? 'Y' : '—';
}

function genderLabel(gender) {
  if (gender === 'male') return '남';
  if (gender === 'female') return '여';
  return gender ? String(gender) : '—';
}

function selected(actual, value) {
  return String(actual) === String(value) ? ' selected' : '';
}

function checked(value) {
  return value ? ' checked' : '';
}

function optionList(values, active) {
  return values.map((value) => `<option value="${esc(value)}"${selected(active, value)}>${esc(value)}</option>`).join('');
}

function renderSectionGroupPanel() {
  const groups = listSectionGroupSummary();
  const rows = groups
    .map((g) => {
      const sourceLabel = g.source === 'custom' ? '추가' : g.source === 'orphan' ? '사용중' : '프리셋';
      const canRemove = g.source === 'custom' && g.channelCount === 0;
      return `<tr>
        <td><code>${esc(g.id)}</code></td>
        <td>${esc(g.label)}</td>
        <td>${esc(sourceLabel)}</td>
        <td>${g.channelCount}</td>
        <td>${g.accessMemberCount || 0}</td>
        <td class="sup-admin-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-section-filter="${esc(g.id)}">채널 보기</button>
          <button type="button" class="btn btn--secondary btn--sm" data-section-access="${esc(g.id)}">접근회원</button>
          ${canRemove ? `<button type="button" class="btn btn--secondary btn--sm" data-section-remove="${esc(g.id)}">삭제</button>` : ''}
        </td>
      </tr>`;
    })
    .join('');

  let accessPanel = '';
  if (openSectionAccessId) {
    const members = getSectionAccessMembers(openSectionAccessId);
    const memberRows = members
      .map(
        (email) => `<tr>
          <td>${esc(email)}</td>
          <td><button type="button" class="btn btn--secondary btn--sm" data-section-access-remove="${esc(email)}">제거</button></td>
        </tr>`,
      )
      .join('');
    accessPanel = `
      <div class="a28-section-access" data-section-access-panel="${esc(openSectionAccessId)}">
        <h4 class="admin-section-title">접근회원 · <code>${esc(openSectionAccessId)}</code></h4>
        <p class="a28-hint">영카트 그룹 접근회원 대응 · 우동공과는 이메일로 식별(운영 메모용 1차). 실제 ACL 연동은 후속.</p>
        <table class="sup-admin-table">
          <thead><tr><th>이메일</th><th></th></tr></thead>
          <tbody>${memberRows || '<tr><td colspan="2" class="sup-empty">접근회원 없음</td></tr>'}</tbody>
        </table>
        <form class="admin-filter-bar" data-section-access-form>
          <input type="email" name="email" class="admin-input" placeholder="member@example.com" required />
          <button type="submit" class="btn btn--primary btn--sm">접근회원 추가</button>
          <button type="button" class="btn btn--secondary btn--sm" data-section-access-close>닫기</button>
        </form>
      </div>`;
  }

  return `
    <section class="a28-section-groups">
      <h3 class="admin-section-title">소속 그룹 (게시판그룹 경량판)</h3>
      <p class="a28-hint">영카트 게시판그룹 ≈ <code>sectionOwner</code>. 그룹 추가 · 채널 수 · 접근회원(이메일) · 채널 필터.</p>
      <table class="sup-admin-table">
        <thead><tr><th>그룹 ID</th><th>표시명</th><th>출처</th><th>채널 수</th><th>접근회원</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6" class="sup-empty">그룹 없음</td></tr>'}</tbody>
      </table>
      <form class="admin-filter-bar" data-section-group-form>
        <input type="text" name="id" class="admin-input admin-input--sm" placeholder="그룹 ID (예: community)" required pattern="[a-z0-9]+(-[a-z0-9]+)*" />
        <input type="text" name="label" class="admin-input" placeholder="표시명 (선택)" />
        <button type="submit" class="btn btn--primary btn--sm">그룹 추가</button>
      </form>
      ${accessPanel}
    </section>`;
}

function renderChannelTable() {
  const q = (channelFilters.q || '').trim().toLowerCase();
  const filtered = listBoardChannels().filter((ch) => {
    if (channelFilters.status !== 'all' && ch.status !== channelFilters.status) return false;
    if (channelFilters.sectionOwner !== 'all' && ch.sectionOwner !== channelFilters.sectionOwner) {
      return false;
    }
    if (q) {
      const hay = `${ch.boardKey} ${ch.menuLabel} ${ch.routeSlug || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const all = listBoardChannels();
  const sectionOwners = [...new Set(all.map((ch) => ch.sectionOwner).filter(Boolean))].sort();
  const sectionOpts = [
    `<option value="all"${channelFilters.sectionOwner === 'all' ? ' selected' : ''}>소속 전체</option>`,
    ...sectionOwners.map(
      (owner) =>
        `<option value="${esc(owner)}"${channelFilters.sectionOwner === owner ? ' selected' : ''}>${esc(owner)}</option>`,
    ),
  ].join('');

  const rows = filtered
    .map(
      (ch) => `<tr>
        <td class="td-chk"><input type="checkbox" data-channel-chk value="${esc(ch.boardKey)}" ${ch.status === 'archived' ? 'disabled' : ''} /></td>
        <td><code>${esc(ch.boardKey)}</code></td>
        <td>${esc(ch.menuLabel)}</td>
        <td>${esc(ch.boardType)}<br><small>${esc(ch.presetId)}</small></td>
        <td>${esc(ch.sectionOwner)}</td>
        <td>${esc(ch.visibility)}<br><small>download ${esc(ch.downloadPolicy)}</small></td>
        <td>${yesNo(ch.allowWrite)}<br><small>upload ${yesNo(ch.allowUpload)}</small></td>
        <td>
          <select class="admin-input--sm" data-channel-status="${esc(ch.boardKey)}" ${ch.status === 'archived' ? 'disabled' : ''}>
            ${optionList(['active', 'hidden', 'archived'], ch.status)}
          </select>
        </td>
        <td><code>${esc(ch.routeSlug || '—')}</code></td>
        <td>${esc(ch.lastUpdatedAt || '—')}</td>
        <td class="sup-admin-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-channel-edit="${esc(ch.boardKey)}">수정</button>
          <button type="button" class="btn btn--secondary btn--sm" data-channel-copy="${esc(ch.boardKey)}">복사</button>
          <button type="button" class="btn btn--secondary btn--sm" data-channel-archive="${esc(ch.boardKey)}">보관</button>
        </td>
      </tr>`,
    )
    .join('');

  return `
    <form class="admin-filter-bar" data-channel-filter>
      <input type="search" name="q" class="admin-input" placeholder="boardKey · menuLabel · route" value="${esc(channelFilters.q)}" />
      <select name="status" class="admin-input--sm">
        <option value="all"${channelFilters.status === 'all' ? ' selected' : ''}>status 전체</option>
        <option value="active"${channelFilters.status === 'active' ? ' selected' : ''}>active</option>
        <option value="hidden"${channelFilters.status === 'hidden' ? ' selected' : ''}>hidden</option>
        <option value="archived"${channelFilters.status === 'archived' ? ' selected' : ''}>archived</option>
      </select>
      <select name="sectionOwner" class="admin-input--sm">${sectionOpts}</select>
      <button type="submit" class="btn btn--primary btn--sm">검색</button>
      <button type="button" class="btn btn--secondary btn--sm" data-channel-filter-reset>초기화</button>
    </form>
    <div class="admin-bulk-bar">
      <label class="admin-bulk-bar__chk"><input type="checkbox" data-channel-chkall /> 전체 선택</label>
      <select class="admin-input--sm" data-channel-bulk-status>
        <option value="active">active</option>
        <option value="hidden">hidden</option>
        <option value="archived">archived</option>
      </select>
      <button type="button" class="btn btn--secondary btn--sm" data-channel-bulk-apply>선택 status 적용</button>
      <span class="a28-hint" style="margin:0">${filtered.length}/${all.length}개 표시</span>
    </div>
    <table class="sup-admin-table a28-channel-table">
    <thead><tr><th></th><th>boardKey</th><th>menuLabel</th><th>type</th><th>소속</th><th>공개/다운로드</th><th>write policy</th><th>status</th><th>route</th><th>updatedAt</th><th></th></tr></thead>
    <tbody>${rows || '<tr><td colspan="11" class="sup-empty">채널 없음</td></tr>'}</tbody>
  </table>`;
}

function renderChannelForm(channel = null) {
  const presetId = channel?.presetId || 'notice';
  const presetOptions = getPresetOptions()
    .map((preset) => `<option value="${esc(preset.id)}"${selected(presetId, preset.id)}>${esc(preset.label)}</option>`)
    .join('');
  const sectionOptions = getSectionOwnerOptions(presetId)
    .map((owner) => `<option value="${esc(owner)}"${selected(channel?.sectionOwner, owner)}>${esc(owner)}</option>`)
    .join('');
  const keyCandidates = getBoardKeyCandidates(presetId);
  const candidateHint = keyCandidates.length ? `권장: ${keyCandidates.join(' · ')}` : '프리셋 기준 boardKey만 사용';
  const roles = channel?.allowedRoles || ['admin'];
  const roleChecks = CHANNEL_ROLE_OPTIONS.map(
    (r) =>
      `<label><input type="checkbox" name="role_${r.id}" data-allowed-role="${esc(r.id)}"${checked(roles.includes(r.id))} /> ${esc(r.label)}</label>`,
  ).join('');

  return `
    <form class="sup-admin-form a28-config-form" data-channel-form>
      <h3 class="sup-admin-form__title">채널 추가 · 수정</h3>
      <p class="a28-hint">프리셋 먼저 선택 · 자유 글판 생성 금지 · 정적 정책 페이지 대체 금지</p>
      <input type="hidden" name="mode" value="${channel ? 'update' : 'create'}" />
      <label class="sup-field"><span>프리셋</span><select name="presetId" data-channel-preset required>${presetOptions}</select></label>
      <label class="sup-field"><span>boardKey <small>${esc(candidateHint)}</small></span><input name="boardKey" value="${esc(channel?.boardKey || '')}" placeholder="notice" required /></label>
      <label class="sup-field"><span>menuLabel</span><input name="menuLabel" value="${esc(channel?.menuLabel || '')}" placeholder="공지사항" required /></label>
      <label class="sup-field"><span>routeSlug</span><input name="routeSlug" value="${esc(channel?.routeSlug || '')}" placeholder="#/support/notice" /></label>
      <label class="sup-field"><span>sectionOwner</span><select name="sectionOwner" required>${sectionOptions}</select></label>

      <div class="a28-perm-matrix" id="anc_channel_auth">
        <h4 class="admin-section-title">권한 (영카트 권한 매트릭스 축약)</h4>
        <p class="a28-hint">레벨 숫자 대신 우동공과 역할 · visibility/download + 쓰기·댓글·업로드</p>
        <div class="a28-perm-matrix__grid">
          <label class="sup-field"><span>목록/읽기 (visibility)</span>
            <select name="visibility">${optionList(['public', 'login', 'role'], channel?.visibility || 'public')}</select>
          </label>
          <label class="sup-field"><span>다운로드 (downloadPolicy)</span>
            <select name="downloadPolicy">${optionList(['none', 'public', 'login', 'role', 'admin'], channel?.downloadPolicy || 'none')}</select>
          </label>
        </div>
        <p class="a28-hint">역할 제한 시 허용 역할 (allowedRoles)</p>
        <div class="a28-checkbox-grid" data-allowed-roles>${roleChecks}</div>
        <div class="a28-checkbox-grid">
          <label><input type="checkbox" name="allowWrite"${checked(channel?.allowWrite ?? true)} /> 쓰기</label>
          <label><input type="checkbox" name="allowComment"${checked(channel?.allowComment)} /> 댓글</label>
          <label><input type="checkbox" name="allowUpload"${checked(channel?.allowUpload)} /> 업로드</label>
          <label><input type="checkbox" name="requireReview"${checked(channel?.requireReview)} /> 내부 확인 필요</label>
          <label><input type="checkbox" name="isGnuSeparated"${checked(channel?.isGnuSeparated ?? true)} /> GNU 분리</label>
        </div>
      </div>

      <label class="sup-field"><span>status</span><select name="status">${optionList(['active', 'hidden', 'archived'], channel?.status || 'active')}</select></label>
      <div class="sup-admin-form__actions">
        <button type="submit" class="btn btn--primary btn--sm">채널 저장</button>
        <button type="button" class="btn btn--secondary btn--sm" data-channel-reset-form>새 채널</button>
        <button type="button" class="btn btn--secondary btn--sm" data-channel-reset-seed>채널 seed 복원</button>
      </div>
    </form>`;
}

function renderRightRailTable() {
  const rows = listRightRailSlots()
    .map(
      (slot) => `<tr>
        <td><code>${esc(slot.slotKey)}</code><br><small>${esc(slot.sectionTitle)}</small></td>
        <td>${esc(slot.sourceBoardKeys?.join(', ') || slot.sourceBoardKey)}</td>
        <td>${esc(slot.selectionMode)}</td>
        <td>${esc(slot.itemLimit)}</td>
        <td>${esc(slot.mobileBehavior)}</td>
        <td>${esc(slot.status)}${slot.enabled ? '' : ' · off'}</td>
        <td>${esc(slot.lastUpdatedAt || '—')}</td>
        <td><code>${esc(slot.ctaTarget)}</code></td>
        <td class="sup-admin-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-rail-edit="${esc(slot.slotKey)}">수정</button>
          <button type="button" class="btn btn--secondary btn--sm" data-rail-toggle="${esc(slot.slotKey)}" data-rail-next="${slot.enabled ? 'hidden' : 'active'}">${slot.enabled ? '끄기' : '켜기'}</button>
        </td>
      </tr>`,
    )
    .join('');
  return `<table class="sup-admin-table a28-rail-table">
    <thead><tr><th>slotKey</th><th>sourceBoardKey</th><th>selectionMode</th><th>itemLimit</th><th>mobileBehavior</th><th>enabled</th><th>updatedAt</th><th>CTA</th><th></th></tr></thead>
    <tbody>${rows || '<tr><td colspan="9" class="sup-empty">슬롯 없음</td></tr>'}</tbody>
  </table>`;
}

function renderRightRailForm(slot = null) {
  const current = slot || listRightRailSlots()[0];
  const slotOptions = listRightRailSlots()
    .map((s) => `<option value="${esc(s.slotKey)}"${selected(current?.slotKey, s.slotKey)}>${esc(s.slotKey)}</option>`)
    .join('');
  const channels = listBoardChannels().filter((ch) => ch.status !== 'archived');
  const sourceOptions = channels
    .map((ch) => `<option value="${esc(ch.boardKey)}"${selected(current?.sourceBoardKey, ch.boardKey)}>${esc(ch.boardKey)} · ${esc(ch.menuLabel)}</option>`)
    .join('');
  return `
    <form class="sup-admin-form a28-config-form" data-rail-form>
      <h3 class="sup-admin-form__title">우측 슬롯 배치 관리</h3>
      <p class="a28-hint">슬롯은 게시판 본문 자리가 아니라 진입/요약/추천 영역입니다. 모바일에서는 stack/collapse/hide 중 하나로 처리합니다.</p>
      <label class="sup-field"><span>slotKey</span><select name="slotKey">${slotOptions}</select></label>
      <label class="sup-field"><span>pageType</span><input name="pageType" value="${esc(current?.pageType || 'home')}" required /></label>
      <label class="sup-field"><span>sectionTitle</span><input name="sectionTitle" value="${esc(current?.sectionTitle || '')}" required /></label>
      <label class="sup-field"><span>sourceType</span><select name="sourceType">${optionList(['board', 'static', 'mixed'], current?.sourceType || 'mixed')}</select></label>
      <label class="sup-field"><span>primary sourceBoardKey</span><select name="sourceBoardKey">${sourceOptions}</select></label>
      <label class="sup-field"><span>sourceBoardKeys (comma)</span><input name="sourceBoardKeys" value="${esc((current?.sourceBoardKeys || []).join(', '))}" /></label>
      <label class="sup-field"><span>selectionMode</span><select name="selectionMode">${optionList(RIGHT_RAIL_SELECTION_MODES, current?.selectionMode || 'curated')}</select></label>
      <label class="sup-field"><span>itemLimit</span><input type="number" name="itemLimit" min="1" max="5" value="${esc(current?.itemLimit || 3)}" /></label>
      <label class="sup-field"><span>ctaLabel</span><input name="ctaLabel" value="${esc(current?.ctaLabel || '')}" /></label>
      <label class="sup-field"><span>ctaTarget</span><input name="ctaTarget" value="${esc(current?.ctaTarget || '#/support')}" /></label>
      <label class="sup-field"><span>visibilityRule</span><select name="visibilityRule">${optionList(['public', 'login', 'role'], current?.visibilityRule || 'public')}</select></label>
      <label class="sup-field"><span>roleTarget</span><input name="roleTarget" value="${esc(current?.roleTarget || 'all')}" /></label>
      <label class="sup-field"><span>mobileBehavior</span><select name="mobileBehavior">${optionList(RIGHT_RAIL_MOBILE_BEHAVIORS, current?.mobileBehavior || 'stack')}</select></label>
      <label class="sup-field"><span>priority</span><input type="number" name="priority" value="${esc(current?.priority || 50)}" /></label>
      <label class="sup-field"><span>status</span><select name="status">${optionList(['active', 'hidden', 'archived'], current?.status || 'active')}</select></label>
      <div class="sup-admin-form__actions">
        <button type="submit" class="btn btn--primary btn--sm">슬롯 저장</button>
        <button type="button" class="btn btn--secondary btn--sm" data-rail-reset-seed>슬롯 seed 복원</button>
      </div>
    </form>`;
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
    '채널 · 우측 슬롯 · 공지/FAQ/가이드 CMS',
    'A28-05',
    `${renderRedLineBanner()}
     <p class="a28-hint">채널(콘텐츠 공급원)과 우측 슬롯(노출 자리)을 분리 운영합니다. notice/faq/safe-guide 운영 정본은 board_posts입니다.</p>
     <div class="a28-config-tabs" role="tablist">
       <button type="button" class="a28-config-tabs__btn is-active" data-a28-config-tab="channels" role="tab">1. 채널 관리</button>
       <button type="button" class="a28-config-tabs__btn" data-a28-config-tab="rails" role="tab">2. 우측 슬롯 관리</button>
       <button type="button" class="a28-config-tabs__btn" data-a28-config-tab="notices" role="tab">3. 공지 CMS</button>
       <button type="button" class="a28-config-tabs__btn" data-a28-config-tab="faq" role="tab">4. FAQ CMS</button>
       <button type="button" class="a28-config-tabs__btn" data-a28-config-tab="guide" role="tab">5. 안전과외 가이드 CMS</button>
     </div>
     <div class="a28-config-panel is-active" data-a28-config-panel="channels">
       <p class="a28-hint">프리셋 기반 채널 추가 · 삭제 대신 hidden/archived · 소속 그룹(sectionOwner)은 영카트 게시판그룹의 경량 대응</p>
       ${renderSectionGroupPanel()}
       ${renderChannelTable()}
       ${renderChannelForm()}
     </div>
     <div class="a28-config-panel" data-a28-config-panel="rails" hidden>
       <p class="a28-hint">슬롯 = 요약/추천/바로가기 전용 · 게시판 본문 삽입 금지</p>
       ${renderRightRailTable()}
       ${renderRightRailForm()}
     </div>
     <div class="a28-config-panel" data-a28-config-panel="notices" hidden>
       <p class="a28-hint">board_posts(notice) 연동 시 이 폼도 동일 정본에 저장됩니다.</p>
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
       </form>
     </div>
     <div class="a28-config-panel" data-a28-config-panel="faq" hidden>
       ${renderFaqCmsPanel()}
     </div>
     <div class="a28-config-panel" data-a28-config-panel="guide" hidden>
       ${renderGuideCmsPanel()}
     </div>`,
  );
}

function renderOperationalApiHint() {
  if (isOperationalBoardApiActive()) return '';
  return `<p class="a28-hint a28-hint--warn">⚠ board_posts API가 아직 활성화되지 않았습니다(관리자 로그인 필요). 저장 시 이 정본에 반영됩니다.</p>`;
}

function renderFaqCmsPanel() {
  const rows = listFaqPosts()
    .map(
      (f) =>
        `<tr data-faq-row="${esc(f.id)}"><td>${esc(String(f.sortOrder))}</td><td>${esc(f.q)}</td>
         <td class="sup-admin-table__actions">
           <button type="button" class="btn btn--secondary btn--sm" data-a28-faq-edit="${esc(f.id)}">수정</button>
           <button type="button" class="btn btn--secondary btn--sm" data-a28-faq-delete="${esc(f.id)}">삭제</button>
         </td></tr>`,
    )
    .join('');
  return `
     <p class="a28-hint">board_posts(faq) 운영 정본 · 정렬은 sortOrder 오름차순</p>
     ${renderOperationalApiHint()}
     <table class="sup-admin-table"><thead><tr><th>순서</th><th>질문</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="sup-empty">FAQ 없음</td></tr>'}</tbody></table>
     <form class="sup-admin-form" data-a28-faq-form>
       <h3 class="sup-admin-form__title">FAQ 작성 · 수정</h3>
       <input type="hidden" name="id" value="" />
       <label class="sup-field"><span>질문</span><input type="text" name="q" required /></label>
       <label class="sup-field"><span>답변</span><textarea name="a" rows="4" required></textarea></label>
       <label class="sup-field"><span>정렬 순서</span><input type="number" name="sortOrder" value="0" step="10" /></label>
       <div class="sup-admin-form__actions">
         <button type="submit" class="btn btn--primary btn--sm">저장</button>
         <button type="button" class="btn btn--secondary btn--sm" data-a28-faq-reset>새 FAQ</button>
       </div>
     </form>`;
}

function renderGuideCmsPanel() {
  const rows = listGuidePosts()
    .map(
      (g) =>
        `<tr data-guide-row="${esc(g.slug)}"><td><code>${esc(g.slug)}</code></td><td>${esc(g.title)}</td><td>${esc(g.priority)}</td>
         <td class="sup-admin-table__actions">
           <button type="button" class="btn btn--secondary btn--sm" data-a28-guide-edit="${esc(g.slug)}">수정</button>
           <button type="button" class="btn btn--secondary btn--sm" data-a28-guide-delete="${esc(g.slug)}">삭제</button>
         </td></tr>`,
    )
    .join('');
  return `
     <p class="a28-hint">board_posts(safe-guide) 운영 정본 · slug는 URL 경로(#/support/safe/{slug})로 쓰입니다</p>
     ${renderOperationalApiHint()}
     <table class="sup-admin-table"><thead><tr><th>slug</th><th>제목</th><th>우선순위</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="sup-empty">가이드 없음</td></tr>'}</tbody></table>
     <form class="sup-admin-form" data-a28-guide-form>
       <h3 class="sup-admin-form__title">가이드 작성 · 수정</h3>
       <input type="hidden" name="originalSlug" value="" />
       <label class="sup-field"><span>slug <small>(영문·숫자·하이픈)</small></span><input type="text" name="slug" pattern="[a-z0-9\\-]+" placeholder="safe-prepay" required /></label>
       <label class="sup-field"><span>제목</span><input type="text" name="title" required /></label>
       <label class="sup-field"><span>우선순위</span>
         <select name="priority">
           <option value="primary">primary (상단)</option>
           <option value="secondary">secondary (하단)</option>
         </select>
       </label>
       <label class="sup-field"><span>대상</span><input type="text" name="audience" value="전체" /></label>
       <label class="sup-field"><span>본문 <small>(줄 단위 문단)</small></span><textarea name="body" rows="5" required></textarea></label>
       <label class="sup-field"><span>체크리스트 <small>(줄 단위, 선택)</small></span><textarea name="checklist" rows="3"></textarea></label>
       <div class="sup-admin-form__actions">
         <button type="submit" class="btn btn--primary btn--sm">저장</button>
         <button type="button" class="btn btn--secondary btn--sm" data-a28-guide-reset>새 가이드</button>
       </div>
     </form>`;
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
  const filters = cache?.filters ?? memberFilters;
  const seedFiltered = !isAdminApiMode()
    ? A28_MEMBER_SEED.filter((m) => filters.status === 'all' || m.status === filters.status)
    : [];
  const members = cache?.members ?? seedFiltered;
  const master = isMasterAdmin();
  const counts = cache?.counts ?? countMemberSeed(A28_MEMBER_SEED);
  const totalLabel = cache?.total ?? seedFiltered.length;

  const chip = (key, label) => {
    const n = Number(counts[key] ?? 0);
    const on = (filters.status || 'all') === key ? ' is-on' : '';
    return `<button type="button" class="admin-ov__chip${on}" data-member-status-chip="${key}">
      <span class="admin-ov__txt">${label}</span>
      <span class="admin-ov__num">${n.toLocaleString()}명</span>
    </button>`;
  };

  const rows = members
    .map((m) => {
      const role = A28_MEMBER_ROLE_LABELS[m.primaryRole] || m.primaryRole || '—';
      const status = A28_MEMBER_STATUS_LABELS[m.status] || m.status;
      const tier = A28_MEMBER_TIER_LABELS[m.subscriptionTier] || m.subscriptionTier || 'free';
      return `<tr>
        <td class="td-chk"><input type="checkbox" name="member_chk" value="${m.id}" data-member-chk ${m.isMaster ? 'disabled' : ''} /></td>
        <td><code>${m.id}</code></td>
        <td>${esc(m.name || '—')}<br><small>${esc(m.email)}</small></td>
        <td>${esc(m.phone || '—')}</td>
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
          phone: seed.phone || '010-0000-0000',
          gender: 'female',
          birthDate: '1988-01-15',
          address: '서울시 예시동',
          smsOptIn: true,
          emailOptIn: true,
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
          <dt>성별</dt><dd>${esc(genderLabel(detail.gender))}</dd>
          <dt>생년월일</dt><dd>${esc(detail.birthDate || '—')}</dd>
          <dt>주소</dt><dd>${esc(detail.address || '—')}</dd>
          <dt>수신동의</dt><dd>SMS ${detail.smsOptIn ? 'Y' : 'N'} · 이메일 ${detail.emailOptIn ? 'Y' : 'N'}</dd>
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
     <div class="admin-ov" role="group" aria-label="회원 상태 집계">
       ${chip('all', '전체')}
       ${chip('active', '정상')}
       ${chip('pending', '대기')}
       ${chip('blocked', '이용 제한')}
       ${chip('withdrawn', '탈퇴')}
     </div>
     <form class="admin-filter-bar" data-member-filter>
       <input type="search" name="q" class="admin-input" placeholder="이메일·이름·휴대폰·ID" value="${esc(filters.q || '')}" />
       <select name="status" class="admin-input--sm">
         <option value="all"${filters.status === 'all' ? ' selected' : ''}>상태 전체</option>
         <option value="active"${filters.status === 'active' ? ' selected' : ''}>정상</option>
         <option value="pending"${filters.status === 'pending' ? ' selected' : ''}>대기</option>
         <option value="blocked"${filters.status === 'blocked' ? ' selected' : ''}>이용 제한</option>
         <option value="withdrawn"${filters.status === 'withdrawn' ? ' selected' : ''}>탈퇴</option>
       </select>
       <select name="role_type" class="admin-input--sm">
         <option value="all"${filters.role_type === 'all' ? ' selected' : ''}>역할 포함 · 전체</option>
         <option value="guardian_student"${filters.role_type === 'guardian_student' ? ' selected' : ''}>학부모 포함</option>
         <option value="study_room_owner"${filters.role_type === 'study_room_owner' ? ' selected' : ''}>공부방 포함</option>
         <option value="tutor"${filters.role_type === 'tutor' ? ' selected' : ''}>과외쌤 포함</option>
         <option value="admin"${filters.role_type === 'admin' ? ' selected' : ''}>운영자 포함</option>
       </select>
       <button type="submit" class="btn btn--primary btn--sm">검색</button>
       <button type="button" class="btn btn--secondary btn--sm" data-member-refresh>새로고침</button>
     </form>
     <p class="a28-hint">${isAdminApiMode() ? `API · 목록 ${members.length}명 / 조건 일치 ${Number(totalLabel).toLocaleString()}명` : '[프리뷰] 정적 시드 · 칩 클릭으로 상태 필터'}</p>
     <div class="admin-bulk-bar" data-member-bulk-bar>
       <label class="admin-bulk-bar__chk"><input type="checkbox" data-member-chkall /> 전체 선택</label>
       <input type="text" class="admin-input admin-input--sm" data-member-bulk-memo placeholder="일괄 조치 메모 (선택)" />
       <button type="button" class="btn btn--secondary btn--sm" data-member-bulk="block">선택 이용 제한</button>
       <button type="button" class="btn btn--primary btn--sm" data-member-bulk="restore">선택 복구</button>
     </div>
     <table class="sup-admin-table">
       <thead><tr><th></th><th>ID</th><th>회원</th><th>휴대폰</th><th>대표 역할</th><th>상태</th><th>유료</th><th>소셜</th><th>최근 로그인</th><th></th></tr></thead>
       <tbody>${rows || '<tr><td colspan="10" class="sup-empty">회원 없음</td></tr>'}</tbody>
     </table>
     ${detailHtml}`,
  );
}

/** @param {typeof A28_MEMBER_SEED} seed */
function countMemberSeed(seed) {
  const out = { all: seed.length, active: 0, pending: 0, blocked: 0, withdrawn: 0 };
  for (const m of seed) {
    if (Object.prototype.hasOwnProperty.call(out, m.status)) {
      out[m.status] += 1;
    }
  }
  return out;
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
  const configLogs = listAllBoardAndRailLogs();
  const logs = [...configLogs, ...(isAdminApiMode() ? getOperationLogsCache() : A28_LOG_SEED)];
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
    root.querySelectorAll('[data-member-status-chip]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const status = String(btn.getAttribute('data-member-status-chip') || 'all');
        memberFilters = { ...memberFilters, status };
        try {
          if (isAdminApiMode()) await hydrateMembersCache(memberFilters);
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '필터 실패');
        }
      });
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
    const chkAll = root.querySelector('[data-member-chkall]');
    chkAll?.addEventListener('change', () => {
      if (!(chkAll instanceof HTMLInputElement)) return;
      root.querySelectorAll('[data-member-chk]').forEach((el) => {
        if (el instanceof HTMLInputElement && !el.disabled) el.checked = chkAll.checked;
      });
    });
    root.querySelectorAll('[data-member-bulk]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const action = btn.getAttribute('data-member-bulk');
        if (action !== 'block' && action !== 'restore') return;
        const ids = [...root.querySelectorAll('[data-member-chk]:checked')]
          .map((el) => Number(el instanceof HTMLInputElement ? el.value : 0))
          .filter((id) => id > 0);
        if (!ids.length) {
          window.alert('회원을 선택해 주세요.');
          return;
        }
        const labels = { block: '이용 제한', restore: '복구' };
        if (!window.confirm(`선택한 ${ids.length}명에게 ${labels[action]} 할까요?`)) return;
        const memoEl = root.querySelector('[data-member-bulk-memo]');
        const memo = memoEl instanceof HTMLInputElement ? memoEl.value.trim() : '';
        if (!isAdminApiMode()) {
          window.alert('[프리뷰] API 연결 후 일괄 조치가 가능합니다.');
          return;
        }
        try {
          const data = await apiApplyMemberBulkAction(ids, action, { internalMemo: memo });
          const ok = Number(data.ok_count || 0);
          const fail = Number(data.fail_count || 0);
          await hydrateMembersCache(memberFilters);
          if (openMemberId) await hydrateMemberDetail(openMemberId).catch(() => {});
          rerender();
          window.alert(`완료: 성공 ${ok} · 실패 ${fail}`);
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '일괄 조치 실패');
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
    const channelForm = root.querySelector('[data-channel-form]');
    const railForm = root.querySelector('[data-rail-form]');

    root.querySelectorAll('[data-a28-config-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-a28-config-tab');
        root.querySelectorAll('[data-a28-config-tab]').forEach((el) => el.classList.toggle('is-active', el === btn));
        root.querySelectorAll('[data-a28-config-panel]').forEach((panel) => {
          const active = panel.getAttribute('data-a28-config-panel') === tab;
          panel.classList.toggle('is-active', active);
          panel.hidden = !active;
        });
      });
    });

    channelForm?.querySelector('[data-channel-preset]')?.addEventListener('change', (e) => {
      const presetId = e.target?.value || 'notice';
      const section = channelForm.querySelector('[name="sectionOwner"]');
      if (section) {
        section.innerHTML = getSectionOwnerOptions(presetId)
          .map((owner) => `<option value="${esc(owner)}">${esc(owner)}</option>`)
          .join('');
      }
      const boardKey = channelForm.querySelector('[name="boardKey"]');
      const candidates = getBoardKeyCandidates(presetId);
      if (boardKey instanceof HTMLInputElement && candidates.length && !boardKey.value) {
        boardKey.placeholder = candidates[0];
      }
    });

    root.querySelectorAll('[data-channel-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const channel = getBoardChannel(btn.getAttribute('data-channel-edit'));
        if (!channel || !channelForm) return;
        channelForm.querySelector('[name="mode"]').value = 'update';
        channelForm.querySelector('[name="presetId"]').value = channel.presetId;
        channelForm.querySelector('[name="boardKey"]').value = channel.boardKey;
        channelForm.querySelector('[name="menuLabel"]').value = channel.menuLabel;
        channelForm.querySelector('[name="routeSlug"]').value = channel.routeSlug || '';
        channelForm.querySelector('[name="sectionOwner"]').innerHTML = getSectionOwnerOptions(channel.presetId)
          .map((owner) => `<option value="${esc(owner)}"${selected(channel.sectionOwner, owner)}>${esc(owner)}</option>`)
          .join('');
        channelForm.querySelector('[name="visibility"]').value = channel.visibility;
        channelForm.querySelector('[name="downloadPolicy"]').value = channel.downloadPolicy;
        const roles = channel.allowedRoles || [];
        channelForm.querySelectorAll('[data-allowed-role]').forEach((el) => {
          if (el instanceof HTMLInputElement) {
            el.checked = roles.includes(el.getAttribute('data-allowed-role') || '');
          }
        });
        channelForm.querySelector('[name="allowWrite"]').checked = Boolean(channel.allowWrite);
        channelForm.querySelector('[name="allowComment"]').checked = Boolean(channel.allowComment);
        channelForm.querySelector('[name="allowUpload"]').checked = Boolean(channel.allowUpload);
        channelForm.querySelector('[name="requireReview"]').checked = Boolean(channel.requireReview);
        channelForm.querySelector('[name="isGnuSeparated"]').checked = channel.isGnuSeparated !== false;
        channelForm.querySelector('[name="status"]').value = channel.status || 'active';
        channelForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const auth = channelForm.querySelector('#anc_channel_auth');
        auth?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });

    root.querySelectorAll('[data-channel-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const sourceKey = btn.getAttribute('data-channel-copy');
        if (!sourceKey) return;
        const newKey = window.prompt(`「${sourceKey}」 복사 — 새 boardKey`, `${sourceKey}-copy`);
        if (!newKey) return;
        const newLabel = window.prompt('새 menuLabel (선택)', '') || undefined;
        try {
          await copyBoardChannel(sourceKey, { boardKey: newKey, menuLabel: newLabel });
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '채널 복사 실패');
        }
      });
    });

    root.querySelectorAll('[data-channel-archive]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const boardKey = btn.getAttribute('data-channel-archive');
        if (!boardKey || !window.confirm(`${boardKey} 채널을 보관 상태로 바꿀까요?`)) return;
        archiveBoardChannel(boardKey);
        rerender();
      });
    });

    root.querySelectorAll('[data-section-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const owner = btn.getAttribute('data-section-filter') || 'all';
        channelFilters = { ...channelFilters, sectionOwner: owner };
        rerender();
      });
    });
    root.querySelectorAll('[data-section-access]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openSectionAccessId = btn.getAttribute('data-section-access');
        rerender();
      });
    });
    root.querySelector('[data-section-access-close]')?.addEventListener('click', () => {
      openSectionAccessId = null;
      rerender();
    });
    const accessForm = root.querySelector('[data-section-access-form]');
    accessForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!(accessForm instanceof HTMLFormElement) || !openSectionAccessId) return;
      const fd = new FormData(accessForm);
      try {
        addSectionAccessMember(openSectionAccessId, String(fd.get('email') || ''));
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '접근회원 추가 실패');
      }
    });
    root.querySelectorAll('[data-section-access-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const email = btn.getAttribute('data-section-access-remove');
        if (!email || !openSectionAccessId) return;
        try {
          removeSectionAccessMember(openSectionAccessId, email);
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '접근회원 제거 실패');
        }
      });
    });
    root.querySelectorAll('[data-section-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-section-remove');
        if (!id || !window.confirm(`${id} 그룹을 삭제할까요?`)) return;
        try {
          removeCustomSectionGroup(id);
          if (channelFilters.sectionOwner === id) {
            channelFilters = { ...channelFilters, sectionOwner: 'all' };
          }
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '그룹 삭제 실패');
        }
      });
    });
    const sectionForm = root.querySelector('[data-section-group-form]');
    sectionForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!(sectionForm instanceof HTMLFormElement)) return;
      const fd = new FormData(sectionForm);
      try {
        addCustomSectionGroup(String(fd.get('id') || ''), String(fd.get('label') || ''));
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '그룹 추가 실패');
      }
    });

    const channelFilter = root.querySelector('[data-channel-filter]');
    channelFilter?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!(channelFilter instanceof HTMLFormElement)) return;
      const fd = new FormData(channelFilter);
      channelFilters = {
        q: String(fd.get('q') || '').trim(),
        status: String(fd.get('status') || 'all'),
        sectionOwner: String(fd.get('sectionOwner') || 'all'),
      };
      rerender();
    });
    root.querySelector('[data-channel-filter-reset]')?.addEventListener('click', () => {
      channelFilters = { q: '', status: 'all', sectionOwner: 'all' };
      rerender();
    });

    const channelChkAll = root.querySelector('[data-channel-chkall]');
    channelChkAll?.addEventListener('change', () => {
      if (!(channelChkAll instanceof HTMLInputElement)) return;
      root.querySelectorAll('[data-channel-chk]').forEach((el) => {
        if (el instanceof HTMLInputElement && !el.disabled) el.checked = channelChkAll.checked;
      });
    });

    root.querySelectorAll('[data-channel-status]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        if (!(sel instanceof HTMLSelectElement)) return;
        const boardKey = sel.getAttribute('data-channel-status');
        const status = sel.value;
        const channel = getBoardChannel(boardKey);
        if (!boardKey || !channel) return;
        try {
          await saveBoardChannel(
            {
              ...channel,
              allowedRoles: (channel.allowedRoles || []).join(', '),
              status,
            },
            { mode: 'update' },
          );
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : 'status 변경 실패');
          rerender();
        }
      });
    });

    root.querySelector('[data-channel-bulk-apply]')?.addEventListener('click', async () => {
      const statusEl = root.querySelector('[data-channel-bulk-status]');
      const status = statusEl instanceof HTMLSelectElement ? statusEl.value : '';
      if (!['active', 'hidden', 'archived'].includes(status)) return;
      const keys = [...root.querySelectorAll('[data-channel-chk]:checked')]
        .map((el) => (el instanceof HTMLInputElement ? el.value : ''))
        .filter(Boolean);
      if (!keys.length) {
        window.alert('채널을 선택해 주세요.');
        return;
      }
      if (!window.confirm(`선택한 ${keys.length}개 채널 status를 ${status}로 바꿀까요?`)) return;
      try {
        for (const boardKey of keys) {
          const channel = getBoardChannel(boardKey);
          if (!channel) continue;
          await saveBoardChannel(
            {
              ...channel,
              allowedRoles: (channel.allowedRoles || []).join(', '),
              status,
            },
            { mode: 'update' },
          );
        }
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '일괄 status 변경 실패');
        rerender();
      }
    });

    channelForm?.querySelector('[data-channel-reset-form]')?.addEventListener('click', () => {
      channelForm.reset();
      channelForm.querySelector('[name="mode"]').value = 'create';
    });

    channelForm?.querySelector('[data-channel-reset-seed]')?.addEventListener('click', () => {
      if (!window.confirm('채널 설정을 registry seed 기준으로 되돌릴까요?')) return;
      resetBoardChannels();
      rerender();
    });

    channelForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(channelForm);
      const allowedRoles = [...channelForm.querySelectorAll('[data-allowed-role]:checked')]
        .map((el) => el.getAttribute('data-allowed-role'))
        .filter(Boolean)
        .join(', ');
      try {
        await saveBoardChannel(
          {
            presetId: String(fd.get('presetId')),
            boardKey: String(fd.get('boardKey')),
            menuLabel: String(fd.get('menuLabel')),
            routeSlug: String(fd.get('routeSlug')),
            sectionOwner: String(fd.get('sectionOwner')),
            visibility: String(fd.get('visibility')),
            downloadPolicy: String(fd.get('downloadPolicy')),
            allowedRoles,
            allowWrite: fd.get('allowWrite') === 'on',
            allowComment: fd.get('allowComment') === 'on',
            allowUpload: fd.get('allowUpload') === 'on',
            requireReview: fd.get('requireReview') === 'on',
            isGnuSeparated: fd.get('isGnuSeparated') === 'on',
            status: String(fd.get('status')),
          },
          { mode: String(fd.get('mode')) === 'update' ? 'update' : 'create' },
        );
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '채널 저장 실패');
      }
    });

    root.querySelectorAll('[data-rail-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slot = listRightRailSlots().find((row) => row.slotKey === btn.getAttribute('data-rail-edit'));
        if (!slot || !railForm) return;
        railForm.querySelector('[name="slotKey"]').value = slot.slotKey;
        railForm.querySelector('[name="pageType"]').value = slot.pageType;
        railForm.querySelector('[name="sectionTitle"]').value = slot.sectionTitle;
        railForm.querySelector('[name="sourceType"]').value = slot.sourceType;
        railForm.querySelector('[name="sourceBoardKey"]').value = slot.sourceBoardKey;
        railForm.querySelector('[name="sourceBoardKeys"]').value = (slot.sourceBoardKeys || []).join(', ');
        railForm.querySelector('[name="selectionMode"]').value = slot.selectionMode;
        railForm.querySelector('[name="itemLimit"]').value = slot.itemLimit;
        railForm.querySelector('[name="ctaLabel"]').value = slot.ctaLabel;
        railForm.querySelector('[name="ctaTarget"]').value = slot.ctaTarget;
        railForm.querySelector('[name="visibilityRule"]').value = slot.visibilityRule;
        railForm.querySelector('[name="roleTarget"]').value = slot.roleTarget;
        railForm.querySelector('[name="mobileBehavior"]').value = slot.mobileBehavior;
        railForm.querySelector('[name="priority"]').value = slot.priority;
        railForm.querySelector('[name="status"]').value = slot.status;
        railForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    root.querySelectorAll('[data-rail-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slotKey = btn.getAttribute('data-rail-toggle');
        const next = btn.getAttribute('data-rail-next') || 'hidden';
        if (!slotKey) return;
        updateRightRailSlotStatus(slotKey, next);
        rerender();
      });
    });

    railForm?.querySelector('[data-rail-reset-seed]')?.addEventListener('click', () => {
      if (!window.confirm('우측 슬롯 설정을 seed 기준으로 되돌릴까요?')) return;
      resetRightRailSlots();
      rerender();
    });

    railForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(railForm);
      try {
        await saveRightRailSlot({
          slotKey: String(fd.get('slotKey')),
          pageType: String(fd.get('pageType')),
          sourceType: String(fd.get('sourceType')),
          sourceBoardKey: String(fd.get('sourceBoardKey')),
          sourceBoardKeys: String(fd.get('sourceBoardKeys')),
          selectionMode: String(fd.get('selectionMode')),
          itemLimit: Number(fd.get('itemLimit')),
          sectionTitle: String(fd.get('sectionTitle')),
          ctaLabel: String(fd.get('ctaLabel')),
          ctaTarget: String(fd.get('ctaTarget')),
          visibilityRule: String(fd.get('visibilityRule')),
          roleTarget: String(fd.get('roleTarget')),
          mobileBehavior: String(fd.get('mobileBehavior')),
          priority: Number(fd.get('priority')),
          status: String(fd.get('status')),
        });
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '슬롯 저장 실패');
      }
    });

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

    const faqForm = root.querySelector('[data-a28-faq-form]');
    root.querySelectorAll('[data-a28-faq-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = listFaqPosts().find((f) => f.id === btn.getAttribute('data-a28-faq-edit'));
        if (!item || !faqForm) return;
        faqForm.querySelector('[name="id"]').value = item.id;
        faqForm.querySelector('[name="q"]').value = item.q;
        faqForm.querySelector('[name="a"]').value = item.a;
        faqForm.querySelector('[name="sortOrder"]').value = String(item.sortOrder || 0);
      });
    });
    root.querySelectorAll('[data-a28-faq-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-a28-faq-delete');
        if (!id || !window.confirm('삭제할까요?')) return;
        try {
          await deleteFaqPost(id);
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : 'FAQ 삭제 실패');
        }
      });
    });
    faqForm?.querySelector('[data-a28-faq-reset]')?.addEventListener('click', () => {
      faqForm.reset();
      faqForm.querySelector('[name="id"]').value = '';
    });
    faqForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(faqForm);
      try {
        await upsertFaqPost({
          id: String(fd.get('id') || '').trim() || undefined,
          q: String(fd.get('q')),
          a: String(fd.get('a')),
          sortOrder: Number(fd.get('sortOrder') || 0),
        });
        faqForm.reset();
        faqForm.querySelector('[name="id"]').value = '';
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : 'FAQ 저장 실패');
      }
    });

    const guideForm = root.querySelector('[data-a28-guide-form]');
    root.querySelectorAll('[data-a28-guide-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = listGuidePosts().find((g) => g.slug === btn.getAttribute('data-a28-guide-edit'));
        if (!item || !guideForm) return;
        guideForm.querySelector('[name="originalSlug"]').value = item.slug;
        guideForm.querySelector('[name="slug"]').value = item.slug;
        guideForm.querySelector('[name="title"]').value = item.title;
        guideForm.querySelector('[name="priority"]').value = item.priority || 'primary';
        guideForm.querySelector('[name="audience"]').value = item.audience || '전체';
        guideForm.querySelector('[name="body"]').value = (item.body || []).join('\n');
        guideForm.querySelector('[name="checklist"]').value = (item.checklist || [])
          .map((c) => (c.hint ? `${c.label} | ${c.hint}` : c.label))
          .join('\n');
      });
    });
    root.querySelectorAll('[data-a28-guide-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const slug = btn.getAttribute('data-a28-guide-delete');
        if (!slug || !window.confirm('삭제할까요?')) return;
        try {
          await deleteGuidePost(slug);
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '가이드 삭제 실패');
        }
      });
    });
    guideForm?.querySelector('[data-a28-guide-reset]')?.addEventListener('click', () => {
      guideForm.reset();
      guideForm.querySelector('[name="originalSlug"]').value = '';
      guideForm.querySelector('[name="priority"]').value = 'primary';
      guideForm.querySelector('[name="audience"]').value = '전체';
    });
    guideForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(guideForm);
      const checklist = String(fd.get('checklist') || '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const [label, ...rest] = line.split('|');
          return { label: label.trim(), hint: rest.join('|').trim() };
        });
      const slug = String(fd.get('slug') || '').trim();
      const originalSlug = String(fd.get('originalSlug') || '').trim();
      try {
        await upsertGuidePost({
          slug,
          title: String(fd.get('title')),
          priority: String(fd.get('priority') || 'primary'),
          audience: String(fd.get('audience') || '전체'),
          body: String(fd.get('body')).split('\n').map((l) => l.trim()).filter(Boolean),
          checklist,
        });
        if (originalSlug && originalSlug !== slug) {
          await deleteGuidePost(originalSlug);
        }
        guideForm.reset();
        guideForm.querySelector('[name="originalSlug"]').value = '';
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '가이드 저장 실패');
      }
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
