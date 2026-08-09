import {
  ALLOWED_OPERATOR_ACTIONS,
  FORBIDDEN_OPERATOR_ACTIONS,
  SUBMISSION_DOC_USER_NOTICE,
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
  listConcernChannels,
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
import { PROMO_LANDINGS } from '../promo/catalog.js';
import { STUDY_ROOM_PROMO } from '../promo/study-room-content.js';
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
  getOperatorsCache,
  hydrateOperatorsCache,
  apiCreateOperator,
  apiPatchOperator,
  apiResetOperatorPassword,
} from './admin-backend.js';
import { isMasterAdmin } from './admin-guard.js';
import {
  canAccessAdminMenu,
  ADMIN_LEVEL_LABELS,
  SUB_MASTER_BLOCKED_MENUS,
} from './admin-permissions.js';
import {
  A28_COPY,
  A28_MENU,
  A28_MENU_ID_LABELS,
  A28_REPORT_SEED,
  A28_LOG_SEED,
  A28_ACTION_LABELS,
  A28_LOG_TARGET_TYPE_LABELS,
  A28_SUBMISSION_QUEUE_ACTIONS,
  A28_REPORT_STATUS_LABELS,
  A28_EXPOSURE_ACTIONS,
  A28_EXPOSURE_TARGET_LABELS,
  A28_INQUIRY_STATUS_LABELS,
  A28_MEMBER_STATUS_LABELS,
  A28_MEMBER_ROLE_LABELS,
  A28_MEMBER_TIER_LABELS,
} from './a28-copy.js';
import {
  getSiteSettings,
  saveSiteSettings,
  listPopups,
  savePopup,
  deletePopup,
  getLegalDocs,
  saveLegalDoc,
  resetSiteSettingsSeed,
  JOIN_FIELD_OPTIONS,
  JOIN_ROLES,
  POPUP_SURFACES,
  listSiteSettingsLogs,
} from './site-settings-store.js';
import {
  getMarketplaceLab,
  setReviewStatus,
  dismissIncomplete,
  resetMarketplaceLab,
} from './marketplace-lab-store.js';
import {
  getSmsLab,
  saveSmsSettings,
  listTemplateGroups,
  saveTemplateGroup,
  deleteTemplateGroup,
  listTemplates,
  saveTemplate,
  deleteTemplate,
  listPhoneGroups,
  savePhoneGroup,
  deletePhoneGroup,
  listPhones,
  savePhone,
  deletePhone,
  syncPhonesFromMembers,
  previewSend,
  listSendLogs,
  listSendLogsByPhone,
  estimateSmsBytes,
  suggestChannelByBody,
  resetSmsLab,
} from './sms-lab-store.js';
import {
  getNoticesSection,
  getSettingsSection,
  getMarketSection,
  getNotifySection,
  getAddonsSection,
  getAdminScreenId,
} from './router.js';
import { parseHashQuery } from '../../../shared/preview-links.js';
import {
  listAddonVendors,
  ADDON_CATEGORY_LABELS,
  ADDON_STATUS_LABELS,
  SMS_LAB_NOTICE,
} from './vendor-addons.js';

import {
  A28_MEMBER_SEED,
  DL_KO,
  MOBILE_KO,
  ORDER_STATUS_KO,
  SEL_KO,
  SMS_STATUS_KO,
  SOURCE_KO,
  STATUS_KO,
  VIS_KO,
  a28Ui,
} from './a28-screens-state.js';

import {
  bindDetailDrawer,
  checked,
  cloneJoinPolicy,
  esc,
  renderDetailDrawer,
  renderOpsTip,
  renderPanel,
  sectionOwnerLabel,
  selected,
} from './a28-screens-shared.js';
import {
  renderAddons,
  renderMarketLab,
  renderNotifyLab,
} from './a28-screens-labs.js';

function adminProductLabel(code) {
  const normalized = String(code || '').toLowerCase();
  if (normalized.includes('prime')) return '대표 노출';
  if (normalized.includes('pick')) return '추천 노출';
  if (normalized.includes('basic')) return '기본 노출';
  if (normalized.includes('memo')) return '쪽지권';
  if (normalized.includes('request')) return '요청문 열람권';
  return '기타 상품';
}

function ticketTypeLabel(type) {
  return String(type || '').includes('memo') ? '쪽지권' : '요청문 열람권';
}


function presetLabel(id) {
  return getPresetOptions().find((preset) => preset.id === id)?.label || '기타';
}

/**
 * 회원 상세 포맷(더미 포함) — API 캐시가 없어도 드로어가 항상 열리도록
 * @param {number} id
 * @param {object|null} [apiDetail]
 */
function buildMemberDetail(id, apiDetail = null) {
  const seed = A28_MEMBER_SEED.find((m) => Number(m.id) === Number(id));
  const base = apiDetail || seed;
  if (!base && !apiDetail) {
    return {
      id: Number(id),
      email: `user${id}@example.com`,
      name: `더미회원 ${id}`,
      phone: '010-0000-0000',
      status: 'active',
      primaryRole: 'guardian_student',
      emailVerified: false,
      gender: '',
      birthDate: '',
      address: '',
      smsOptIn: false,
      emailOptIn: false,
      createdAt: '—',
      lastLoginAt: '—',
      isMaster: false,
      roles: [{ roleType: 'guardian_student', isPrimary: true, status: 'active' }],
      oauth: [],
      paid: {
        subscriptionTier: 'free',
        positions: [],
        tickets: [],
        orders: [],
      },
      profileCounts: { studyRooms: 0, tutors: 0, students: 0 },
      _source: 'empty-dummy',
    };
  }

  const fromApi = Boolean(apiDetail);
  const src = base;

  // 더미 보강(API에 없는 필드만)
  const paidDefaults =
    Number(id) === 2
      ? {
          subscriptionTier: 'paid',
          positions: [{ sku_code: 'prime', ends_at: '2026-08-15 23:59:59', days_left: 28 }],
          tickets: [{ ticket_type: 'message', remaining: 12, pack_size: 20 }],
          orders: [
            {
              order_ref: 'ORD-DEMO-2',
              product_id: 'prime_30',
              status: 'paid',
              amount_won: 99000,
            },
          ],
        }
      : Number(id) === 1
        ? {
            subscriptionTier: 'free',
            positions: [],
            tickets: [{ ticket_type: 'view', remaining: 3, pack_size: 10 }],
            orders: [],
          }
        : {
            subscriptionTier: src.subscriptionTier || 'free',
            positions: [],
            tickets: [],
            orders: [],
          };

  return {
    id: Number(src.id ?? id),
    email: src.email || `user${id}@example.com`,
    name: src.name || '—',
    phone: src.phone || '010-0000-0000',
    status: src.status || 'active',
    primaryRole: src.primaryRole || 'guardian_student',
    emailVerified: src.emailVerified ?? false,
    gender: src.gender ?? (Number(id) === 1 ? 'female' : Number(id) === 2 ? 'male' : ''),
    birthDate: src.birthDate ?? (Number(id) === 1 ? '1988-01-15' : Number(id) === 2 ? '1979-06-02' : ''),
    address: src.address ?? (Number(id) === 1 ? '서울 강남구 예시동 12' : Number(id) === 2 ? '서울 강남구 대치동 45' : ''),
    smsOptIn: src.smsOptIn ?? true,
    emailOptIn: src.emailOptIn ?? true,
    createdAt: src.createdAt || '—',
    lastLoginAt: src.lastLoginAt || '—',
    isMaster: Boolean(src.isMaster),
    roles: src.roles?.length
      ? src.roles
      : [{ roleType: src.primaryRole || 'guardian_student', isPrimary: true, status: 'active' }],
    oauth: src.oauth?.length
      ? src.oauth
      : src.oauthLinked
        ? [{ provider: 'naver', providerEmail: src.email, linkedAt: src.createdAt || '—' }]
        : [],
    paid: {
      subscriptionTier: src.paid?.subscriptionTier || src.subscriptionTier || paidDefaults.subscriptionTier,
      positions: src.paid?.positions?.length ? src.paid.positions : paidDefaults.positions,
      tickets: src.paid?.tickets?.length ? src.paid.tickets : paidDefaults.tickets,
      orders: src.paid?.orders?.length ? src.paid.orders : paidDefaults.orders,
    },
    profileCounts: {
      studyRooms: src.profileCounts?.studyRooms ?? src.studyRoomCount ?? 0,
      tutors: src.profileCounts?.tutors ?? src.tutorCount ?? 0,
      students: src.profileCounts?.students ?? src.studentCount ?? 0,
    },
    _source: fromApi ? 'api' : 'seed-dummy',
  };
}

}

/** @param {string[]} values @param {string} [active] @param {Record<string, string>} [labels] */
function optionList(values, active, labels = {}) {
  return values
    .map((value) => `<option value="${esc(value)}"${selected(active, value)}>${esc(labels[value] || value)}</option>`)
    .join('');
}

function renderSectionGroupPanel() {
  const groups = listSectionGroupSummary();
  const rows = groups
    .map((g) => {
      const sourceLabel = g.source === 'custom' ? '추가' : g.source === 'orphan' ? '사용중' : '프리셋';
      const canRemove = g.source === 'custom' && g.channelCount === 0;
      return `<tr>
        <td>${esc(sectionOwnerLabel(g.id))}</td>
        <td>${g.source === 'custom' ? '직접 추가한 그룹' : '기본 제공 그룹'}</td>
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
  if (a28Ui.openSectionAccessId) {
    const members = getSectionAccessMembers(a28Ui.openSectionAccessId);
    const memberRows = members
      .map(
        (email) => `<tr>
          <td>${esc(email)}</td>
          <td><button type="button" class="btn btn--secondary btn--sm" data-section-access-remove="${esc(email)}">제거</button></td>
        </tr>`,
      )
      .join('');
    accessPanel = `
      <div class="a28-section-access" data-section-access-panel="${esc(a28Ui.openSectionAccessId)}">
        <h4 class="admin-section-title">접근회원 · ${esc(sectionOwnerLabel(a28Ui.openSectionAccessId))}</h4>
        <p class="a28-help">이 그룹 글을 볼 수 있는 회원을 이메일로 적어 둡니다. (운영 메모용)</p>
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
      <p class="a28-help">관련 게시판을 한데 묶는 그룹입니다. 그룹 추가 · 채널 수 · 접근회원 · 채널 필터를 관리합니다.</p>
      <table class="sup-admin-table">
        <thead><tr><th>그룹</th><th>설명</th><th>출처</th><th>채널 수</th><th>접근회원</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6" class="sup-empty">그룹 없음</td></tr>'}</tbody>
      </table>
      <form class="admin-filter-bar" data-section-group-form>
        <input type="text" name="id" class="admin-input admin-input--sm" placeholder="그룹 식별값 (영문 소문자)" required pattern="[a-z0-9]+(-[a-z0-9]+)*" />
        <input type="text" name="label" class="admin-input" placeholder="표시명 (선택)" />
        <button type="submit" class="btn btn--primary btn--sm">그룹 추가</button>
      </form>
      ${accessPanel}
    </section>`;
}

function renderChannelTable() {
  const q = (a28Ui.channelFilters.q || '').trim().toLowerCase();
  const filtered = listBoardChannels().filter((ch) => {
    if (a28Ui.channelFilters.status !== 'all' && ch.status !== a28Ui.channelFilters.status) return false;
    if (a28Ui.channelFilters.sectionOwner !== 'all' && ch.sectionOwner !== a28Ui.channelFilters.sectionOwner) {
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
    `<option value="all"${a28Ui.channelFilters.sectionOwner === 'all' ? ' selected' : ''}>소속 전체</option>`,
    ...sectionOwners.map(
      (owner) =>
        `<option value="${esc(owner)}"${a28Ui.channelFilters.sectionOwner === owner ? ' selected' : ''}>${esc(sectionOwnerLabel(owner))}</option>`,
    ),
  ].join('');

  const rows = filtered
    .map(
      (ch) => `<tr>
        <td class="td-chk"><input type="checkbox" data-channel-chk value="${esc(ch.boardKey)}" ${ch.status === 'archived' ? 'disabled' : ''} /></td>
        <td>채널<br><small>식별값은 수정 화면에서 확인</small></td>
        <td>${esc(ch.menuLabel)}</td>
        <td>${esc(presetLabel(ch.presetId))}</td>
        <td>${esc(sectionOwnerLabel(ch.sectionOwner))}</td>
        <td>${esc(VIS_KO[ch.visibility] || ch.visibility)}<br><small>받기: ${esc(DL_KO[ch.downloadPolicy] || ch.downloadPolicy)}</small></td>
        <td>${yesNo(ch.allowWrite)}<br><small>업로드 ${yesNo(ch.allowUpload)}</small></td>
        <td>
          <select class="admin-input--sm" data-channel-status="${esc(ch.boardKey)}" ${ch.status === 'archived' ? 'disabled' : ''}>
            ${optionList(['active', 'hidden', 'archived'], ch.status, STATUS_KO)}
          </select>
        </td>
        <td>${ch.routeSlug ? '설정됨' : '없음'}</td>
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
      <input type="search" name="q" class="admin-input" placeholder="채널 키 · 메뉴 이름 · 경로" value="${esc(a28Ui.channelFilters.q)}" />
      <select name="status" class="admin-input--sm">
        <option value="all"${a28Ui.channelFilters.status === 'all' ? ' selected' : ''}>상태 전체</option>
        <option value="active"${a28Ui.channelFilters.status === 'active' ? ' selected' : ''}>사용</option>
        <option value="hidden"${a28Ui.channelFilters.status === 'hidden' ? ' selected' : ''}>숨김</option>
        <option value="archived"${a28Ui.channelFilters.status === 'archived' ? ' selected' : ''}>보관</option>
      </select>
      <select name="sectionOwner" class="admin-input--sm">${sectionOpts}</select>
      <button type="submit" class="btn btn--primary btn--sm">검색</button>
      <button type="button" class="btn btn--secondary btn--sm" data-channel-filter-reset>초기화</button>
    </form>
    <div class="admin-bulk-bar">
      <label class="admin-bulk-bar__chk"><input type="checkbox" data-channel-chkall /> 전체 선택</label>
      <select class="admin-input--sm" data-channel-bulk-status>
        <option value="active">사용</option>
        <option value="hidden">숨김</option>
        <option value="archived">보관</option>
      </select>
      <button type="button" class="btn btn--secondary btn--sm" data-channel-bulk-apply>선택 상태 적용</button>
      <span class="a28-help" style="margin:0">${filtered.length}/${all.length}개 표시</span>
    </div>
    <table class="sup-admin-table a28-channel-table">
    <thead><tr><th></th><th>채널 키</th><th>메뉴 이름</th><th>유형</th><th>소속</th><th>공개/받기</th><th>쓰기</th><th>상태</th><th>경로</th><th>수정일</th><th></th></tr></thead>
    <tbody>${rows || '<tr><td colspan="11" class="sup-empty">채널 없음</td></tr>'}</tbody>
  </table>`;
}

function renderChannelForm(channel = null) {
  const presetId = channel?.presetId || 'notice';
  const presetOptions = getPresetOptions()
    .map((preset) => `<option value="${esc(preset.id)}"${selected(presetId, preset.id)}>${esc(preset.label)}</option>`)
    .join('');
  const sectionOptions = getSectionOwnerOptions(presetId)
    .map((owner) => `<option value="${esc(owner)}"${selected(channel?.sectionOwner, owner)}>${esc(sectionOwnerLabel(owner))}</option>`)
    .join('');
  const keyCandidates = getBoardKeyCandidates(presetId);
  const candidateHint = keyCandidates.length ? `권장: ${keyCandidates.join(' · ')}` : '프리셋에 맞는 채널 키만 사용';
  const roles = channel?.allowedRoles || ['admin'];
  const roleChecks = CHANNEL_ROLE_OPTIONS.map(
    (r) =>
      `<label><input type="checkbox" name="role_${r.id}" data-allowed-role="${esc(r.id)}"${checked(roles.includes(r.id))} /> ${esc(r.label)}</label>`,
  ).join('');

  return `
    <form class="sup-admin-form a28-config-form" data-channel-form>
      <h3 class="sup-admin-form__title">채널 추가 · 수정</h3>
      <p class="a28-help">먼저 종류(프리셋)를 고른 뒤, 메뉴에 보일 이름과 경로를 적습니다. 커뮤니티(고민방)는 <strong>커뮤니티형</strong> 프리셋을 고르고 <code>concern-</code>로 시작하는 식별값을 쓰면 됩니다.</p>
      <input type="hidden" name="mode" value="${channel ? 'update' : 'create'}" />
      <label class="sup-field"><span>종류(프리셋)</span><select name="presetId" data-channel-preset required>${presetOptions}</select></label>
      <label class="sup-field"><span>채널 식별값 <small>${esc(candidateHint.replace('boardKey', '채널 식별값'))} · 시스템용 영문 소문자</small></span><input name="boardKey" value="${esc(channel?.boardKey || '')}" placeholder="${presetId === 'concern' ? '예: concern-admission' : '예: notice'}" required /></label>
      <label class="sup-field"><span>메뉴 이름</span><input name="menuLabel" value="${esc(channel?.menuLabel || '')}" placeholder="${presetId === 'concern' ? '예: 입학 고민방' : '공지사항'}" required /></label>
      <label class="sup-field"><span>주소 경로</span><input name="routeSlug" value="${esc(channel?.routeSlug || '')}" placeholder="${presetId === 'concern' ? '#/community/admission (비우면 자동)' : '#/support/notice'}" /></label>
      <label class="sup-field"><span>소속 그룹</span><select name="sectionOwner" required>${sectionOptions}</select></label>

      <div class="a28-perm-matrix" id="anc_channel_auth">
        <h4 class="admin-section-title">누가 보고 · 쓰고 · 받을 수 있나</h4>
        <p class="a28-help">목록/읽기·파일 받기·쓰기·댓글·업로드를 역할별로 정합니다.</p>
        <div class="a28-perm-matrix__grid">
          <label class="sup-field"><span>목록/읽기</span>
            <select name="visibility">${optionList(['public', 'login', 'role'], channel?.visibility || 'public', VIS_KO)}</select>
          </label>
          <label class="sup-field"><span>파일 받기</span>
            <select name="downloadPolicy">${optionList(['none', 'public', 'login', 'role', 'admin'], channel?.downloadPolicy || 'none', DL_KO)}</select>
          </label>
        </div>
        <p class="a28-help">「역할 제한」일 때 허용할 역할</p>
        <div class="a28-checkbox-grid" data-allowed-roles>${roleChecks}</div>
        <div class="a28-checkbox-grid">
          <label><input type="checkbox" name="allowWrite"${checked(channel?.allowWrite ?? true)} /> 쓰기</label>
          <label><input type="checkbox" name="allowComment"${checked(channel?.allowComment)} /> 댓글</label>
          <label><input type="checkbox" name="allowUpload"${checked(channel?.allowUpload)} /> 업로드</label>
          <label><input type="checkbox" name="requireReview"${checked(channel?.requireReview)} /> 내부 확인 필요</label>
        </div>
      </div>

      <label class="sup-field"><span>상태</span><select name="status">${optionList(['active', 'hidden', 'archived'], channel?.status || 'active', STATUS_KO)}</select></label>
      <div class="sup-admin-form__actions">
        <button type="submit" class="btn btn--primary btn--sm">채널 저장</button>
        <button type="button" class="btn btn--secondary btn--sm" data-channel-reset-form>새 채널</button>
        <button type="button" class="btn btn--secondary btn--sm" data-channel-reset-seed>초기값으로 되돌리기</button>
      </div>
    </form>`;
}

function renderRightRailTable() {
  const rows = listRightRailSlots()
    .map(
      (slot) => `<tr>
        <td><code>${esc(slot.slotKey)}</code><br><small>${esc(slot.sectionTitle)}</small></td>
        <td>${esc(slot.sourceBoardKeys?.join(', ') || slot.sourceBoardKey)}</td>
        <td>${esc(SEL_KO[slot.selectionMode] || '확인 필요')}</td>
        <td>${esc(slot.itemLimit)}</td>
        <td>${esc(MOBILE_KO[slot.mobileBehavior] || '확인 필요')}</td>
        <td>${esc(STATUS_KO[slot.status] || '확인 필요')}${slot.enabled ? '' : ' · 꺼짐'}</td>
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
    <thead><tr><th>배너 자리</th><th>가져올 채널</th><th>고르는 방식</th><th>개수</th><th>모바일</th><th>상태</th><th>수정일</th><th>바로가기</th><th></th></tr></thead>
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
    .map((ch) => `<option value="${esc(ch.boardKey)}"${selected(current?.sourceBoardKey, ch.boardKey)}>${esc(ch.menuLabel)} (${esc(ch.boardKey)})</option>`)
    .join('');
  const concernChips = listConcernChannels()
    .map(
      (ch) =>
        `<button type="button" class="btn btn--secondary btn--sm" data-rail-add-concern="${esc(ch.boardKey)}">${esc(ch.menuLabel)}</button>`,
    )
    .join('');
  return `
    <form class="sup-admin-form a28-config-form" data-rail-form>
      <h3 class="sup-admin-form__title">우측 배너 자리 설정</h3>
      <p class="a28-help">게시판 본문이 아니라, 화면 오른쪽의 요약·추천·바로가기 자리입니다. 커뮤니티 채널을 추가 채널에 넣으면 홈 우측 「현장 고민 HOT」이 그 보드 글을 우선 보여줍니다.</p>
      <label class="sup-field"><span>배너 자리</span><select name="slotKey">${slotOptions}</select></label>
      <label class="sup-field"><span>페이지 종류</span><input name="pageType" value="${esc(current?.pageType || 'home')}" required /></label>
      <label class="sup-field"><span>구역 제목</span><input name="sectionTitle" value="${esc(current?.sectionTitle || '')}" required /></label>
      <label class="sup-field"><span>내용 출처</span><select name="sourceType">${optionList(['board', 'static', 'mixed'], current?.sourceType || 'mixed', SOURCE_KO)}</select></label>
      <label class="sup-field"><span>기본 채널</span><select name="sourceBoardKey">${sourceOptions}</select></label>
      <label class="sup-field"><span>추가 채널 (쉼표)</span><input name="sourceBoardKeys" value="${esc((current?.sourceBoardKeys || []).join(', '))}" placeholder="notice, concern-director, concern-tutor" /></label>
      ${
        concernChips
          ? `<div class="a28-checkbox-grid" style="margin:0.35rem 0 0.75rem"><span class="a28-help" style="width:100%">커뮤니티 채널 추가:</span>${concernChips}</div>`
          : ''
      }
      <label class="sup-field"><span>고르는 방식</span><select name="selectionMode">${optionList(RIGHT_RAIL_SELECTION_MODES, current?.selectionMode || 'curated', SEL_KO)}</select></label>
      <label class="sup-field"><span>표시 개수</span><input type="number" name="itemLimit" min="1" max="5" value="${esc(current?.itemLimit || 3)}" /></label>
      <label class="sup-field"><span>버튼 글자</span><input name="ctaLabel" value="${esc(current?.ctaLabel || '')}" /></label>
      <label class="sup-field"><span>버튼 이동 주소</span><input name="ctaTarget" value="${esc(current?.ctaTarget || '#/support')}" /></label>
      <label class="sup-field"><span>누가 보나</span><select name="visibilityRule">${optionList(['public', 'login', 'role'], current?.visibilityRule || 'public', VIS_KO)}</select></label>
      <label class="sup-field"><span>대상 역할</span><input name="roleTarget" value="${esc(current?.roleTarget || 'all')}" /></label>
      <label class="sup-field"><span>모바일 표시</span><select name="mobileBehavior">${optionList(RIGHT_RAIL_MOBILE_BEHAVIORS, current?.mobileBehavior || 'stack', MOBILE_KO)}</select></label>
      <label class="sup-field"><span>우선순위</span><input type="number" name="priority" value="${esc(current?.priority || 50)}" /></label>
      <label class="sup-field"><span>상태</span><select name="status">${optionList(['active', 'hidden', 'archived'], current?.status || 'active', STATUS_KO)}</select></label>
      <div class="sup-admin-form__actions">
        <button type="submit" class="btn btn--primary btn--sm">배너 저장</button>
        <button type="button" class="btn btn--secondary btn--sm" data-rail-reset-seed>초기값으로 되돌리기</button>
      </div>
    </form>`;
}

function renderNav() {
  return '';
}

function renderHub() {
  /** @type {Array<{ label: string, path: string, desc: string }>} */
  const cards = [];
  for (const g of A28_MENU) {
    if (g.id === 'hub') continue;
    if (g.children?.length) {
      const kids = g.children.filter((c) => canAccessAdminMenu(c.menuId || c.id));
      if (!kids.length) continue;
      cards.push({ label: g.label, path: kids[0].path, desc: g.help || kids[0].help || '' });
    } else if (g.path && canAccessAdminMenu(g.menuId || g.id)) {
      cards.push({ label: g.label, path: g.path, desc: g.help || '' });
    }
  }
  const cardHtml = cards
    .map(
      (n) =>
        `<a href="#${n.path}" class="sup-admin-hub__card a28-hub__card" data-a28-nav="${n.path}">
          <span class="sup-admin-hub__title">${esc(n.label)}</span>
          <span class="sup-admin-hub__desc">${esc(n.desc)}</span>
        </a>`,
    )
    .join('');
  return renderPanel(
    A28_COPY.hubTitle,
    'A28-01',
    `${renderOpsTip()}
     ${renderPromoQuickBar()}
     <p>${esc(A28_COPY.hubLead)}</p>
     <div class="a28-lists">
       <div><h3>할 수 있는 일</h3><ul>${ALLOWED_OPERATOR_ACTIONS.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
       <div><h3>하지 않는 일</h3><ul>${FORBIDDEN_OPERATOR_ACTIONS.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
     </div>
     <div class="sup-admin-hub">${cardHtml}</div>`,
  );
}

/** 카톡/메일용 붙여넣기 한 덩어리 */
function buildPromoLaunchKit(p, absoluteUrl) {
  const share = p.shareText || p.title;
  return `${share}\n\n바로가기: ${absoluteUrl}\n경로: #${p.path}`;
}

function renderPromoQuickBar() {
  const live = PROMO_LANDINGS.filter((p) => p.status === 'live');
  if (!live.length) return '';
  return `
    <div class="a28-promo-quick" aria-label="홍보 랜딩 바로가기">
      <span class="a28-promo-quick__label">홍보 런치</span>
      ${live
        .map(
          (p) =>
            `<a class="a28-promo-quick__chip" href="#${esc(p.path)}">${esc(p.title.replace(' 랜딩', ''))}</a>
             <button type="button" class="a28-promo-quick__copy" data-promo-copy-kit="${esc(
               buildPromoLaunchKit(p, `${window.location.origin}/#${p.path}`),
             )}">킷 복사</button>`,
        )
        .join('')}
      <a class="a28-promo-quick__more" href="#/admin/promo" data-a28-nav="/admin/promo">데스크 →</a>
    </div>`;
}

function renderPromoDesk() {
  const statusKo = { live: '공개', draft: '초안', planned: '예정' };
  const railSlots = listRightRailSlots().filter((s) => s.enabled && s.status === 'active');
  const cards = PROMO_LANDINGS.map((p) => {
    const absoluteHint = `${window.location.origin}/#${p.path}`;
    const kit = buildPromoLaunchKit(p, absoluteHint);
    const linked =
      p.status === 'live'
        ? railSlots
            .filter((s) => String(s.ctaTarget || '').includes(p.path) || p.id === 'study-room')
            .map((s) => s.slotKey)
        : [];
    const uniqueLinked = [...new Set(linked)];
    return `
      <article class="a28-promo-card" data-promo-id="${esc(p.id)}">
        <div class="a28-promo-card__head">
          <strong>${esc(p.title)}</strong>
          <span class="a28-promo-card__status a28-promo-card__status--${esc(p.status)}">${esc(statusKo[p.status] || p.status)}</span>
        </div>
        <p class="a28-help">${esc(p.audience)} · <code>${esc(p.path)}</code></p>
        <p class="a28-help">배너: ${esc(p.railHint)}</p>
        ${
          uniqueLinked.length
            ? `<p class="a28-help">연결 슬롯: ${uniqueLinked.map((k) => `<code>${esc(k)}</code>`).join(' ')}</p>`
            : p.status === 'live'
              ? `<p class="a28-help">홈 우측 CTA · 게스트 인라인에 기본 연결</p>`
              : ''
        }
        <div class="sup-admin-actions">
          ${
            p.status === 'live'
              ? `<a class="btn btn--primary btn--sm" href="#${esc(p.path)}">페이지 열기</a>
                 <button type="button" class="btn btn--secondary btn--sm" data-promo-copy-kit="${esc(kit)}">런치 킷 복사</button>
                 <button type="button" class="btn btn--secondary btn--sm" data-promo-copy-url="${esc(absoluteHint)}">URL만</button>
                 <button type="button" class="btn btn--secondary btn--sm" data-promo-copy-share="${esc(p.shareText || p.title)}">문구만</button>`
              : `<button type="button" class="btn btn--secondary btn--sm" disabled>준비 중</button>`
          }
        </div>
      </article>`;
  }).join('');

  const railPreview = STUDY_ROOM_PROMO.railCard;
  const livePrimary = PROMO_LANDINGS.find((p) => p.status === 'live');
  const qrUrl = livePrimary
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`${window.location.origin}/#${livePrimary.path}`)}`
    : '';
  return renderPanel(
    '홍보 런치 데스크',
    'A28-promo',
    `${renderOpsTip()}
     ${renderPromoQuickBar()}
     <p class="a28-help">고객센터·자료실이 아닌 <strong>#/promo/*</strong> 프로모션 랜딩입니다. <strong>런치 킷</strong>은 카톡/메일에 바로 붙일 수 있는 문구+URL 묶음입니다.</p>
     <div class="a28-promo-grid">${cards}</div>
     ${
       qrUrl
         ? `<div class="a28-promo-qr">
              <img src="${esc(qrUrl)}" width="140" height="140" alt="홍보 랜딩 QR" />
              <div>
                <h3 class="admin-section-title">현장용 QR</h3>
                <p class="a28-help">인쇄물·카톡에 붙여 모바일로 바로 열 수 있습니다. (공개 랜딩 기준)</p>
              </div>
            </div>`
         : ''
     }
     <h3 class="admin-section-title">우측 배너 카드 미리보기</h3>
     <div class="a28-promo-rail-preview">
       <strong>${esc(railPreview.title)}</strong>
       <p>${esc(railPreview.desc)}</p>
       <span>${esc(railPreview.cta)} →</span>
     </div>
     <p class="a28-help"><a href="#/admin/notices/rails" data-a28-nav="/admin/notices/rails">→ 우측 배너 자리 설정</a></p>`,
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
    `${renderOpsTip()}
     <p class="a28-help">문의와는 따로 봅니다. 접수 → 임시 보호 → 조치 완료 순으로 상태를 바꾸면 됩니다.</p>
     <table class="sup-admin-table"><thead><tr><th>번호</th><th>유형</th><th>대상</th><th>사유</th><th>상태</th><th>접수</th><th>내부 메모</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="sup-empty">신고 없음</td></tr>'}</tbody></table>
     <p class="a28-help">${isAdminApiMode() ? '상태 변경은 운영 로그에 자동으로 남습니다.' : '미리보기 모드 — 예시 데이터입니다.'}</p>`,
  );
}

/** @param {string} [section] channels|rails|posts|faq|guide */
function renderNoticesAdmin(section = 'channels') {
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

  const titles = {
    channels: '게시판 채널',
    rails: '우측 배너',
    posts: '공지사항',
    faq: '자주 묻는 질문',
    guide: '안전과외 가이드',
  };
  const helps = {
    channels: '공지·자주 묻는 질문 같은 글이 어디에 보일지 「채널」로 묶습니다. 소속 그룹으로 비슷한 채널을 모을 수 있어요.',
    rails: '화면 오른쪽 요약·추천·바로가기 자리를 고릅니다. 게시판 본문과는 별개입니다.',
    posts: '사이트에 올릴 공지글을 작성·수정합니다.',
    faq: '자주 묻는 질문과 답변을 관리합니다.',
    guide: '안전과외 안내글을 관리합니다.',
  };

  let body = '';
  if (section === 'channels') {
    body = `${renderSectionGroupPanel()}${renderChannelTable()}${renderChannelForm()}`;
  } else if (section === 'rails') {
    body = `${renderRightRailTable()}${renderRightRailForm()}`;
  } else if (section === 'posts') {
    body = `
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
       </form>`;
  } else if (section === 'faq') {
    body = renderFaqCmsPanel();
  } else {
    body = renderGuideCmsPanel();
  }

  return renderPanel(
    titles[section] || '게시판관리',
    'A28-05',
    `${renderOpsTip()}
     <p class="a28-help">${esc(helps[section] || '')}</p>
     ${body}`,
  );
}

function renderOperationalApiHint() {
  if (isOperationalBoardApiActive()) return '';
  return `<p class="a28-help a28-help--warn">저장하려면 관리자로 로그인해 주세요. 로그인 후 같은 화면에 바로 반영됩니다.</p>`;
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
     <p class="a28-help">질문 순서 숫자가 작을수록 위에 보입니다.</p>
     ${renderOperationalApiHint()}
     <table class="sup-admin-table"><thead><tr><th>순서</th><th>질문</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="sup-empty">등록된 질문 없음</td></tr>'}</tbody></table>
     <form class="sup-admin-form" data-a28-faq-form>
       <h3 class="sup-admin-form__title">자주 묻는 질문 작성 · 수정</h3>
       <input type="hidden" name="id" value="" />
       <label class="sup-field"><span>질문</span><input type="text" name="q" required /></label>
       <label class="sup-field"><span>답변</span><textarea name="a" rows="4" required></textarea></label>
       <label class="sup-field"><span>정렬 순서</span><input type="number" name="sortOrder" value="0" step="10" /></label>
       <div class="sup-admin-form__actions">
         <button type="submit" class="btn btn--primary btn--sm">저장</button>
         <button type="button" class="btn btn--secondary btn--sm" data-a28-faq-reset>새 질문</button>
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
     <p class="a28-help">주소 키는 영문·숫자·하이픈만 씁니다. 예: safe-prepay</p>
     ${renderOperationalApiHint()}
     <table class="sup-admin-table"><thead><tr><th>주소 키</th><th>제목</th><th>위치</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="sup-empty">가이드 없음</td></tr>'}</tbody></table>
     <form class="sup-admin-form" data-a28-guide-form>
       <h3 class="sup-admin-form__title">가이드 작성 · 수정</h3>
       <input type="hidden" name="originalSlug" value="" />
       <label class="sup-field"><span>주소 키 <small>(영문·숫자·하이픈)</small></span><input type="text" name="slug" pattern="[a-z0-9\\-]+" placeholder="safe-prepay" required /></label>
       <label class="sup-field"><span>제목</span><input type="text" name="title" required /></label>
       <label class="sup-field"><span>우선순위</span>
         <select name="priority">
           <option value="primary">위쪽</option>
           <option value="secondary">아래쪽</option>
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
    '문의',
    'A28-04b',
    `${renderOpsTip()}
     <p class="a28-help">이용·정책·오류 문의입니다. 신고 처리와는 메뉴가 다릅니다.</p>
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
    '제출자료 확인',
    'A28-06',
    `${renderOpsTip()}
     <p class="a28-help">심사·인증이 아닙니다. 내부에서만 보고, 「노출 반영」또는 「숨김」만 합니다.</p>
     <blockquote class="a28-quote">${esc(SUBMISSION_DOC_USER_NOTICE.lead)} ${esc(SUBMISSION_DOC_USER_NOTICE.body)}</blockquote>
     <table class="sup-admin-table">
       <thead><tr><th>식별번호</th><th>역할</th><th>제목</th><th>항목</th><th>첨부</th><th>제출일</th><th>내부 메모</th><th>조치</th></tr></thead>
       <tbody>${rows}</tbody>
     </table>
     <p class="a28-help">${isAdminApiMode() ? '조치하면 운영 로그에 남습니다.' : '미리보기 모드입니다.'}</p>`,
  );
}
function renderExposure() {
  const items = isAdminApiMode() ? getExposureCache() : [];
  const rows = items
    .map((item) => {
      const typeLabel = A28_EXPOSURE_TARGET_LABELS[item.targetType] || item.targetType;
      const secondary =
        item.targetType === 'study_room' && item.secondaryLabel
          ? `<br><span class="a28-help">상담: ${esc(item.secondaryLabel)}</span>`
          : item.targetType === 'submission'
            ? `<br><span class="a28-help">역할: ${esc(item.secondaryLabel)}</span>`
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
          ${item.searchVisible ? '' : ' <span class="a28-help">(검색 제외)</span>'}</td>
        <td>${inquirySelect}</td>
        <td>${esc(item.updatedAt)}</td>
        <td><textarea class="a28-memo" rows="2" data-a28-exp-memo="${esc(item.targetType)}:${esc(item.targetId)}" placeholder="내부 메모">${esc(item.internalMemo || '')}</textarea></td>
        <td class="sub-board-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-a28-exp-action="hide" data-a28-exp-id="${esc(item.targetType)}:${esc(item.targetId)}" title="${esc(A28_EXPOSURE_ACTIONS.hide.hint)}">${esc(A28_EXPOSURE_ACTIONS.hide.label)}</button>
          ${
            item.targetType === 'submission' && item.status === 'submitted'
              ? `<a href="#/admin/submission-docs" class="a28-hint a28-queue-link" title="제출됨 상태는 제출자료 확인 메뉴에서만 노출 반영 가능">→ 제출자료에서 노출 반영</a>`
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
    `${renderOpsTip()}
     <p class="a28-help">검색/노출 상태 보정 · 승인/반려 용어 사용 금지 · 조치 시 운영 로그 기록</p>
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
       <thead><tr><th>유형</th><th>식별번호</th><th>이름</th><th>노출</th><th>상담</th><th>갱신</th><th>내부 메모</th><th>조치</th></tr></thead>
       <tbody>${rows || '<tr><td colspan="8" class="mypage-muted">표시할 항목이 없습니다.</td></tr>'}</tbody>
     </table>
     <p class="a28-help">${isAdminApiMode() ? '조치하면 운영 로그에 남습니다.' : '미리보기 — 운영자 로그인이 필요합니다.'}</p>`,
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
        <div class="admin-kpi"><span>대표 노출</span><strong>${slots.prime?.used}/${slots.prime?.capacity}</strong><small>잔여 ${slots.prime?.remaining}</small></div>
        <div class="admin-kpi"><span>추천 노출</span><strong>${slots.pick?.used}/${slots.pick?.capacity}</strong><small>한 묶음 ${slots.pick?.set_size}개 · ${slots.pick?.rotation_minutes}분</small></div>
        <div class="admin-kpi"><span>지역</span><strong>${slots.region_scope_type === 'complex' ? '단지' : '행정동'}</strong><small>조회 전용</small></div>
      </div>`
    : '<p class="sup-empty">서버 미연결 — 운영자 로그인 후 조회</p>';

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
        <td><strong>${esc(adminProductLabel(p.sku_code))}</strong></td>
        <td>${p.days_left}일</td>
        <td title="포함 종료일">${esc(p.ends_on || String(p.ends_at || '').slice(0, 10))}</td>
        <td title="end_exclusive">${esc(p.end_exclusive_on || p.ends_at)}</td>
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
        <td>${esc(ticketTypeLabel(t.ticket_type))}</td>
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
        <td>${esc(adminProductLabel(o.product_id))} · ${esc(o.variant_label)}</td>
        <td>${esc(ORDER_STATUS_KO[o.status] || '상태 확인 필요')}</td>
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
            <dt>상품</dt><dd>${esc(adminProductLabel(o.product_id))}</dd>
            <dt>옵션</dt><dd>${esc(o.variant_label)}</dd>
            <dt>결제</dt><dd>${esc(ORDER_STATUS_KO[o.status] || '상태 확인 필요')} · ${esc(o.pg_provider)}</dd>
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
    `${renderOpsTip()}
     <p class="a28-help">가격표·노출 자리 수·순환 간격은 이 화면에서 직접 바꿀 수 없습니다. 조회와 마스터의 최소 보정만 제공합니다.</p>
     ${slotHtml}
     ${settings ? `<p class="a28-help">대표 노출 ${settings.prime_slots}자리 · 추천 노출 ${settings.pick_set_size}개씩 · 기본 노출 ${settings.basic_page_size}개/페이지</p>` : ''}
     <h3 class="admin-section-title">대표·추천 노출 이용 중</h3>
     <table class="sup-admin-table"><thead><tr><th>식별번호</th><th>계정</th><th>상품</th><th>남은일</th><th>종료(포함)</th><th>exclusive</th><th>보정</th></tr></thead>
     <tbody>${posRows || '<tr><td colspan="7" class="sup-empty">활성 구독 없음</td></tr>'}</tbody></table>
     <h3 class="admin-section-title">접근권(횟수권) 묶음</h3>
     <table class="sup-admin-table"><thead><tr><th>식별번호</th><th>계정</th><th>유형</th><th>잔여</th><th>만료</th><th>보정</th></tr></thead>
     <tbody>${ticketRows || '<tr><td colspan="6" class="sup-empty">사용 중인 묶음 없음</td></tr>'}</tbody></table>
     <h3 class="admin-section-title">최근 주문·결제</h3>
     <table class="sup-admin-table"><thead><tr><th>주문</th><th>계정</th><th>상품</th><th>상태</th><th>금액</th><th>시각</th><th></th></tr></thead>
     <tbody>${orderRows || '<tr><td colspan="7" class="sup-empty">주문 없음</td></tr>'}</tbody></table>
     ${orderDrawers}
     <button type="button" class="btn btn--secondary btn--sm" data-commerce-refresh>목록 새로고침</button>`,
  );
}

function renderMembers() {
  const cache = isAdminApiMode() ? getMembersCache() : null;
  const filters = cache?.filters ?? a28Ui.memberFilters;
  const seedFiltered = A28_MEMBER_SEED.filter((m) => filters.status === 'all' || m.status === filters.status);
  const members = cache?.members?.length ? cache.members : seedFiltered;
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
      const tier = A28_MEMBER_TIER_LABELS[m.subscriptionTier] || '확인 필요';
      return `<tr>
        <td class="td-chk"><input type="checkbox" name="member_chk" value="${m.id}" data-member-chk ${m.isMaster ? 'disabled' : ''} /></td>
        <td><code>${m.id}</code></td>
        <td>${esc(m.name || '—')}<br><small>${esc(m.email)}</small></td>
        <td>${esc(m.phone || '—')}</td>
        <td>${esc(role)}${m.isMaster ? ' · 마스터' : ''}</td>
        <td>${esc(status)}</td>
        <td>${esc(tier)}${m.activePositions ? ` · 노출 상품 ${m.activePositions}개` : ''}</td>
        <td>${m.oauthLinked ? '연동' : '—'}${m.oauthPending ? ' · 역할대기' : ''}</td>
        <td>${esc(m.lastLoginAt || '—')}</td>
        <td><button type="button" class="btn btn--secondary btn--sm" data-member-open="${m.id}">상세</button></td>
      </tr>`;
    })
    .join('');

  let detailHtml = '';
  if (a28Ui.openMemberId) {
    const apiDetail = isAdminApiMode() ? getMemberDetailCache(a28Ui.openMemberId) : null;
    const detail = buildMemberDetail(a28Ui.openMemberId, apiDetail);
    const roles = (detail.roles || [])
      .map(
        (r) =>
          `<li>${esc(A28_MEMBER_ROLE_LABELS[r.roleType] || '역할 확인 필요')}${r.isPrimary ? ' (대표)' : ''} · ${esc(A28_MEMBER_STATUS_LABELS[r.status] || '상태 확인 필요')}</li>`,
      )
      .join('');
    const oauth = (detail.oauth || [])
      .map((o) => `<li>${esc(o.provider)} · ${esc(o.providerEmail || '—')} · ${esc(o.linkedAt)}</li>`)
      .join('');
    const positions = (detail.paid?.positions || [])
      .map((p) => `<li>${esc(adminProductLabel(p.sku_code))} · ~${esc(p.ends_on || p.ends_at)} (${p.days_left}일 남음)</li>`)
      .join('');
    const tickets = (detail.paid?.tickets || [])
      .map((t) => `<li>${esc(ticketTypeLabel(t.ticket_type))} · 잔여 ${t.remaining}/${t.pack_size}</li>`)
      .join('');
    const orders = (detail.paid?.orders || [])
      .map(
        (o) =>
          `<li><code>${esc(o.order_ref)}</code> · ${esc(adminProductLabel(o.product_id))} · ${esc(ORDER_STATUS_KO[o.status] || '상태 확인 필요')} · ${Number(o.amount_won || 0).toLocaleString()}원</li>`,
      )
      .join('');

    const canBlock = detail.status !== 'blocked' && detail.status !== 'withdrawn' && !detail.isMaster;
    const canRestore = detail.status === 'blocked' && !detail.isMaster;
    const canWithdraw = master && detail.status !== 'withdrawn' && !detail.isMaster;
    const sourceNote =
      detail._source === 'api'
        ? '서버 조회 결과'
        : detail._source === 'seed-dummy'
          ? '미리보기 더미(포맷 확인용)'
          : '기본 더미(포맷 확인용)';

    const smsPath = `/admin/notify/send?phone=${encodeURIComponent(detail.phone || '')}&name=${encodeURIComponent(detail.name || '')}`;

    detailHtml = renderDetailDrawer(
      `member-${detail.id}`,
      `회원 #${detail.id}`,
      `<p class="a28-help">${esc(sourceNote)}</p>
        <dl class="admin-detail-dl">
          <dt>계정</dt><dd>${esc(detail.name || '—')} · ${esc(detail.email)}</dd>
          <dt>상태</dt><dd>${esc(A28_MEMBER_STATUS_LABELS[detail.status] || detail.status)}</dd>
          <dt>전화</dt><dd>${esc(detail.phone || '—')}</dd>
          <dt>이메일 인증</dt><dd>${detail.emailVerified ? '완료' : '미완료'}</dd>
          <dt>성별</dt><dd>${esc(genderLabel(detail.gender))}</dd>
          <dt>생년월일</dt><dd>${esc(detail.birthDate || '—')}</dd>
          <dt>주소</dt><dd>${esc(detail.address || '—')}</dd>
          <dt>수신동의</dt><dd>문자 ${detail.smsOptIn ? '예' : '아니오'} · 이메일 ${detail.emailOptIn ? '예' : '아니오'}</dd>
          <dt>가입</dt><dd>${esc(detail.createdAt)}</dd>
          <dt>최근 로그인</dt><dd>${esc(detail.lastLoginAt || '—')}</dd>
          <dt>프로필 수</dt><dd>공부방 ${detail.profileCounts?.studyRooms || 0} · 과외 ${detail.profileCounts?.tutors || 0} · 자녀 ${detail.profileCounts?.students || 0}</dd>
          <dt>유료 이용</dt><dd>${esc(A28_MEMBER_TIER_LABELS[detail.paid?.subscriptionTier] || '확인 필요')}</dd>
        </dl>
        <h4 class="admin-section-title">역할</h4>
        <ul class="a28-lists">${roles || '<li>없음</li>'}</ul>
        <h4 class="admin-section-title">소셜 연동</h4>
        <ul class="a28-lists">${oauth || '<li>없음</li>'}</ul>
        <h4 class="admin-section-title">유료·결제 (조회)</h4>
        <p class="a28-help">노출 상품</p><ul class="a28-lists">${positions || '<li>없음</li>'}</ul>
        <p class="a28-help">횟수권</p><ul class="a28-lists">${tickets || '<li>없음</li>'}</ul>
        <p class="a28-help">최근 주문</p><ul class="a28-lists">${orders || '<li>없음</li>'}</ul>
        <label class="a28-help">내부 메모
          <input type="text" class="admin-input" data-member-memo="${detail.id}" placeholder="조치 사유 (로그 기록)" />
        </label>
        <div class="admin-actions">
          <a class="btn btn--secondary btn--sm" href="#${esc(smsPath)}" data-a28-nav="${esc(smsPath)}">문자 미리보기</a>
          ${canBlock ? `<button type="button" class="btn btn--secondary btn--sm" data-member-action="block" data-member-id="${detail.id}">이용 제한</button>` : ''}
          ${canRestore ? `<button type="button" class="btn btn--primary btn--sm" data-member-action="restore" data-member-id="${detail.id}">복구</button>` : ''}
          ${canWithdraw ? `<button type="button" class="btn btn--secondary btn--sm" data-member-action="withdraw" data-member-id="${detail.id}">탈퇴 처리</button>` : ''}
          ${detail.isMaster ? '<p class="a28-help">마스터 계정은 제한/탈퇴 불가</p>' : ''}
        </div>`,
    );
  }

  return renderPanel(
    '회원/역할 검색',
    'A28-02',
    `${renderOpsTip()}
     <p class="a28-help">회원 조회와 이용 제한·복구, 유료 이용·역할 확인을 제공합니다. 다른 회원으로 대신 로그인하거나 역할을 부여하는 기능은 없습니다.</p>
     <div class="admin-ov" role="group" aria-label="회원 상태 집계">
       ${chip('all', '전체')}
       ${chip('active', '정상')}
       ${chip('pending', '대기')}
       ${chip('blocked', '이용 제한')}
       ${chip('withdrawn', '탈퇴')}
     </div>
     <form class="admin-filter-bar" data-member-filter>
       <input type="search" name="q" class="admin-input" placeholder="이메일·이름·휴대폰·식별번호" value="${esc(filters.q || '')}" />
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
     <p class="a28-help">${isAdminApiMode() ? `서버 조회 · 목록 ${members.length}명 / 조건 일치 ${Number(totalLabel).toLocaleString()}명` : '미리보기 — 상태 항목을 눌러 골라 보세요.'}</p>
     <div class="admin-bulk-bar" data-member-bulk-bar>
       <label class="admin-bulk-bar__chk"><input type="checkbox" data-member-chkall /> 전체 선택</label>
       <input type="text" class="admin-input admin-input--sm" data-member-bulk-memo placeholder="일괄 조치 메모 (선택)" />
       <button type="button" class="btn btn--secondary btn--sm" data-member-bulk="block">선택 이용 제한</button>
       <button type="button" class="btn btn--primary btn--sm" data-member-bulk="restore">선택 복구</button>
     </div>
     <table class="sup-admin-table">
       <thead><tr><th></th><th>식별번호</th><th>회원</th><th>휴대폰</th><th>대표 역할</th><th>상태</th><th>유료</th><th>소셜</th><th>최근 로그인</th><th></th></tr></thead>
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
  const blocked = SUB_MASTER_BLOCKED_MENUS.map((m) => `<li>${esc(A28_MENU_ID_LABELS[m] || m)}</li>`).join('');
  const operators = isAdminApiMode() ? getOperatorsCache() : null;
  const rows =
    operators === null
      ? `<tr><td colspan="6" class="a28-help">${isAdminApiMode() ? '목록을 불러오는 중…' : '미리보기 — 운영자 로그인 후 서버 목록이 표시됩니다.'}</td></tr>`
      : operators.length
        ? operators
            .map((o) => {
              const levelLabel = ADMIN_LEVEL_LABELS[o.admin_level] || o.admin_level;
              const statusLabel = o.status === 'active' ? '활성' : '비활성';
              const temp = o.must_change_password ? ' · 임시비번' : '';
              const boot = o.is_bootstrap ? ' <span class="a28-badge">초기</span>' : '';
              return `<tr data-operator-id="${esc(String(o.id))}">
          <td>${esc(o.name || '—')}${boot}</td>
          <td><code>${esc(o.email)}</code></td>
          <td>${esc(levelLabel)}</td>
          <td>${esc(statusLabel)}${esc(temp)}</td>
          <td>${esc(o.last_login_at || '—')}</td>
          <td class="a28-ops-actions">
            <button type="button" class="btn btn--secondary btn--sm" data-operator-toggle-status="${o.id}" data-status="${o.status === 'active' ? 'inactive' : 'active'}">${o.status === 'active' ? '비활성' : '활성'}</button>
            <button type="button" class="btn btn--secondary btn--sm" data-operator-toggle-level="${o.id}" data-level="${o.admin_level}">${o.admin_level === 'super_admin' ? '→부마스터' : '→최고관리자'}</button>
            <button type="button" class="btn btn--secondary btn--sm" data-operator-reset-pw="${o.id}">비번초기화</button>
          </td>
        </tr>`;
            })
            .join('')
        : `<tr><td colspan="6" class="a28-help">등록된 운영 계정이 없습니다.</td></tr>`;

  return renderPanel(
    '권한·계정',
    'A28-08b',
    `${renderOpsTip()}
     <p class="a28-help">운영 계정은 공개 회원가입으로 만들지 않습니다. 최고관리자만 발급·권한·상태·비밀번호를 관리합니다.</p>
     <h3 class="admin-section-title">운영 계정 목록</h3>
     <table class="sup-admin-table">
       <thead><tr><th>이름</th><th>이메일</th><th>등급</th><th>상태</th><th>최근 로그인</th><th>조치</th></tr></thead>
       <tbody>${rows}</tbody>
     </table>
     <button type="button" class="btn btn--secondary btn--sm" data-operator-refresh>목록 새로고침</button>
     <h3 class="admin-section-title">계정 발급</h3>
     <form class="sup-admin-form" data-operator-create>
       <label>이름 <input name="name" required maxlength="50" /></label>
       <label>로그인 이메일 <input name="email" type="email" required /></label>
       <label>임시 비밀번호 <input name="password" type="password" required autocomplete="new-password" /></label>
       <label>비밀번호 확인 <input name="password_confirm" type="password" required autocomplete="new-password" /></label>
       <label>권한등급
         <select name="admin_level">
           <option value="sub_master">부마스터</option>
           <option value="super_admin">최고관리자</option>
         </select>
       </label>
       <label>상태
         <select name="status">
           <option value="active">활성</option>
           <option value="inactive">비활성</option>
         </select>
       </label>
       <button type="submit" class="btn btn--primary btn--sm">발급</button>
     </form>
     <p class="a28-help">발급·초기화 시 첫 로그인 후 비밀번호 변경이 강제됩니다. 마지막 최고관리자는 비활성/강등할 수 없습니다.</p>
     <h3 class="admin-section-title">부마스터가 볼 수 없는 메뉴</h3>
     <ul class="a28-lists">${blocked}</ul>
     <p class="a28-help"><a href="#/admin/settings/basic">→ 사이트 기본 설정</a></p>`,
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
          <td>${esc(A28_LOG_TARGET_TYPE_LABELS[l.targetType] || '대상 확인 필요')}</td>
          <td>${esc(A28_ACTION_LABELS[l.action] || '조치 확인 필요')}</td>
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
          <dt>조치</dt><dd>${esc(A28_ACTION_LABELS[l.action] || '조치 확인 필요')}</dd>
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
  return renderPanel(
    '운영 로그',
    'A28-08a',
    `${renderOpsTip()}
     <p class="a28-help">누가 언제 무엇을 바꿨는지 기록만 봅니다. 지우거나 고칠 수 없습니다.</p>
     <table class="sup-admin-table"><thead><tr><th>번호</th><th>대상 유형</th><th>조치</th><th>대상</th><th>운영자</th><th>시각</th><th>사유</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="sup-empty">로그 없음</td></tr>'}</tbody></table>
     ${drawers}
     <p class="a28-help">${isAdminApiMode() ? '서버와 연결되어 있습니다.' : '미리보기 모드 — 예시 로그입니다.'}</p>`,
  );
}

/** @param {string} [section] basic|join|notify|popups|legal */
function renderSettings(section = 'basic') {
  const s = getSiteSettings();
  const popups = listPopups();
  const legal = getLegalDocs();
  const settingsLogs = listSiteSettingsLogs().slice(0, 8);

  const joinHead = JOIN_FIELD_OPTIONS.map((f) => `<th>${esc(f.label)}</th>`).join('');
  const joinRows = JOIN_ROLES.map((role) => {
    const cells = JOIN_FIELD_OPTIONS.map((field) => {
      const cell = s.joinPolicy?.[role.id]?.[field.id] || { show: false, emphasize: false };
      return `<td class="a28-join-cell">
        <label title="표시"><input type="checkbox" data-join-show="${esc(role.id)}:${esc(field.id)}"${checked(cell.show)} /> 표시</label>
        <label title="강조"><input type="checkbox" data-join-emph="${esc(role.id)}:${esc(field.id)}"${checked(cell.emphasize)} /> 강조</label>
      </td>`;
    }).join('');
    return `<tr><th scope="row">${esc(role.label)}</th>${cells}</tr>`;
  }).join('');

  const popupRows = popups
    .map(
      (p) => `<tr>
        <td>${esc(p.title)}</td>
        <td>${esc(POPUP_SURFACES.find((x) => x.id === p.surface)?.label || p.surface)}</td>
        <td>${p.enabled ? '사용' : '끔'}</td>
        <td>${esc(p.startAt || '—')} ~ ${esc(p.endAt || '—')}</td>
        <td>${p.dismissHours}시간</td>
        <td class="sup-admin-actions">
          <button type="button" class="btn btn--secondary btn--sm" data-popup-edit="${esc(p.id)}">수정</button>
          <button type="button" class="btn btn--secondary btn--sm" data-popup-delete="${esc(p.id)}">삭제</button>
        </td>
      </tr>`,
    )
    .join('');

  const surfaceOpts = POPUP_SURFACES.map((x) => `<option value="${esc(x.id)}">${esc(x.label)}</option>`).join('');
  const logRows = settingsLogs
    .map(
      (l) =>
        `<tr><td>${esc(A28_ACTION_LABELS[l.action] || '조치 확인 필요')}</td><td>${esc(l.target)}</td><td>${esc(l.at)}</td></tr>`,
    )
    .join('');

  const titles = {
    basic: '사이트 기본',
    join: '가입·등록',
    notify: '운영 알림',
    popups: '팝업 관리',
    legal: '약관·개인정보',
  };
  const helps = {
    basic: '서비스 이름·연락처·점검 안내·게스트 배너를 정합니다. 저장하면 회원 화면에 바로 반영됩니다.',
    join: '회원가입·공부방/과외 등록 접수를 켜고, 역할별 안내 항목을 표시/강조합니다. (승인 대기열이 아닙니다)',
    notify: '새 신고·문의·등록이 오면 받을 이메일과 알림 사용 여부를 고릅니다.',
    popups: '기간과 노출 화면을 정해 안내 팝업을 띄웁니다. 「다시 안 보기」시간은 시간 단위입니다.',
    legal: '이용약관·개인정보처리방침 글을 고칩니다. 자주 묻는 질문·가이드는 게시판관리 메뉴를 쓰세요.',
  };

  let body = '';
  if (section === 'basic') {
    body = `
       <form class="sup-admin-form" data-settings-basic>
         <label class="sup-field"><span>서비스 표시명</span><input name="siteName" value="${esc(s.siteName)}" required /></label>
         <label class="sup-field"><span>운영 이메일</span><input name="operatorEmail" type="email" value="${esc(s.operatorEmail)}" /></label>
         <label class="sup-field"><span>운영 전화</span><input name="operatorPhone" value="${esc(s.operatorPhone)}" placeholder="010-0000-0000" /></label>
         <label class="sup-field"><span>상담 가능 시간</span><input name="supportHours" value="${esc(s.supportHours)}" /></label>
         <label class="a28-check"><input type="checkbox" name="maintenanceEnabled"${checked(s.maintenanceEnabled)} /> 점검 모드</label>
         <label class="sup-field"><span>점검 안내 문구</span><textarea name="maintenanceMessage" rows="2">${esc(s.maintenanceMessage)}</textarea></label>
         <label class="sup-field"><span>점검 종료 예정</span><input name="maintenanceUntil" type="datetime-local" value="${esc(String(s.maintenanceUntil || '').replace(' ', 'T').slice(0, 16))}" /></label>
         <label class="a28-check"><input type="checkbox" name="guestBannerEnabled"${checked(s.guestBannerEnabled)} /> 게스트 안내 배너</label>
         <label class="sup-field"><span>배너 문구</span><input name="guestBannerText" value="${esc(s.guestBannerText)}" /></label>
         <button type="submit" class="btn btn--primary btn--sm">사이트 설정 저장</button>
       </form>
       <section class="a28-settings-section">
         <h3 class="admin-section-title">최근 설정 기록</h3>
         <table class="sup-admin-table"><thead><tr><th>조치</th><th>대상</th><th>시각</th></tr></thead>
           <tbody>${logRows || '<tr><td colspan="3" class="sup-empty">기록 없음</td></tr>'}</tbody></table>
         <button type="button" class="btn btn--secondary btn--sm" data-settings-reset-seed>초기값으로 되돌리기</button>
       </section>`;
  } else if (section === 'join') {
    body = `
       <form class="sup-admin-form" data-settings-join>
         <div class="a28-checkbox-grid">
           <label><input type="checkbox" name="signupOpen"${checked(s.signupOpen)} /> 회원가입 접수</label>
           <label><input type="checkbox" name="studyRoomRegisterOpen"${checked(s.studyRoomRegisterOpen)} /> 공부방 등록 접수</label>
           <label><input type="checkbox" name="tutorRegisterOpen"${checked(s.tutorRegisterOpen)} /> 과외쌤 등록 접수</label>
         </div>
         <label class="sup-field"><span>가입 차단 이메일/도메인 (줄바꿈)</span><textarea name="bannedEmails" rows="3" placeholder="spam@example.com">${esc(s.bannedEmails)}</textarea></label>
         <label class="sup-field"><span>금지어 (쉼표)</span><input name="bannedWords" value="${esc(s.bannedWords)}" placeholder="욕설,광고성문구" /></label>
         <div class="a28-join-matrix-wrap">
           <table class="sup-admin-table a28-join-matrix">
             <thead><tr><th>역할 / 항목</th>${joinHead}</tr></thead>
             <tbody>${joinRows}</tbody>
           </table>
         </div>
         <button type="submit" class="btn btn--primary btn--sm">가입·등록 정책 저장</button>
       </form>`;
  } else if (section === 'notify') {
    body = `
       <form class="sup-admin-form" data-settings-notify>
         <div class="a28-checkbox-grid">
           <label><input type="checkbox" name="notifyOnReport"${checked(s.notifyOnReport)} /> 새 신고</label>
           <label><input type="checkbox" name="notifyOnTicket"${checked(s.notifyOnTicket)} /> 새 문의</label>
           <label><input type="checkbox" name="notifyOnNewProvider"${checked(s.notifyOnNewProvider)} /> 새 공부방·과외 등록</label>
         </div>
         <label class="sup-field"><span>수신 이메일 (쉼표)</span><input name="notifyEmails" value="${esc(s.notifyEmails)}" /></label>
         <button type="submit" class="btn btn--primary btn--sm">알림 설정 저장</button>
       </form>`;
  } else if (section === 'popups') {
    body = `
       <table class="sup-admin-table">
         <thead><tr><th>제목</th><th>노출</th><th>상태</th><th>기간</th><th>다시 안 보기</th><th></th></tr></thead>
         <tbody>${popupRows || '<tr><td colspan="6" class="sup-empty">팝업 없음</td></tr>'}</tbody>
       </table>
       <form class="sup-admin-form" data-popup-form>
         <h4 class="sup-admin-form__title">팝업 작성 · 수정</h4>
         <input type="hidden" name="id" value="" />
         <label class="sup-field"><span>제목</span><input name="title" required /></label>
         <label class="sup-field"><span>본문</span><textarea name="body" rows="3" required></textarea></label>
         <label class="sup-field"><span>어디에 보일까</span><select name="surface">${surfaceOpts}</select></label>
         <label class="sup-field"><span>시작</span><input name="startAt" type="datetime-local" /></label>
         <label class="sup-field"><span>종료</span><input name="endAt" type="datetime-local" /></label>
         <label class="sup-field"><span>다시 안 보기 (시간)</span><input name="dismissHours" type="number" min="0" value="24" /></label>
         <label class="a28-check"><input type="checkbox" name="enabled" /> 사용</label>
         <div class="sup-admin-form__actions">
           <button type="submit" class="btn btn--primary btn--sm">팝업 저장</button>
           <button type="button" class="btn btn--secondary btn--sm" data-popup-reset>새 팝업</button>
         </div>
       </form>`;
  } else {
    body = `
       <form class="sup-admin-form" data-legal-form="terms">
         <h4 class="sup-admin-form__title">${esc(legal.terms.title)} <small>갱신 ${esc(legal.terms.updatedAt)}</small></h4>
         <label class="sup-field"><span>제목</span><input name="title" value="${esc(legal.terms.title)}" required /></label>
         <label class="sup-field"><span>본문</span><textarea name="body" rows="6" required>${esc(legal.terms.body)}</textarea></label>
         <button type="submit" class="btn btn--primary btn--sm">이용약관 저장</button>
       </form>
       <form class="sup-admin-form" data-legal-form="privacy">
         <h4 class="sup-admin-form__title">${esc(legal.privacy.title)} <small>갱신 ${esc(legal.privacy.updatedAt)}</small></h4>
         <label class="sup-field"><span>제목</span><input name="title" value="${esc(legal.privacy.title)}" required /></label>
         <label class="sup-field"><span>본문</span><textarea name="body" rows="6" required>${esc(legal.privacy.body)}</textarea></label>
         <button type="submit" class="btn btn--primary btn--sm">개인정보처리방침 저장</button>
       </form>`;
  }

  return renderPanel(
    titles[section] || '환경설정',
    'A28-09',
    `${renderOpsTip()}
     <p class="a28-help">${esc(helps[section] || '')}</p>
     ${body}`,
  );
}

/** @param {string} [section] overview|listings|stats|reviews|incomplete */


/** @param {string} path */
export function renderA28Screen(path) {
  let body = renderHub();
  if (path === '/admin') body = renderHub();
  else if (path === '/admin/promo') body = renderPromoDesk();
  else if (path === '/admin/members') body = renderMembers();
  else if (path === '/admin/commerce') body = renderCommerce();
  else if (path.startsWith('/admin/market/')) body = renderMarketLab(getMarketSection(path));
  else if (path === '/admin/addons' || path.startsWith('/admin/addons/')) body = renderAddons(getAddonsSection(path));
  else if (path.startsWith('/admin/notify/')) body = renderNotifyLab(getNotifySection(path));
  else if (path === '/admin/reports') body = renderReports();
  else if (path.startsWith('/admin/notices')) body = renderNoticesAdmin(getNoticesSection(path));
  else if (path === '/admin/tickets') body = renderTicketsAdmin();
  else if (path === '/admin/submission-docs') body = renderSubmissionDocs();
  else if (path === '/admin/exposure') body = renderExposure();
  else if (path === '/admin/logs') body = renderLogs();
  else if (path.startsWith('/admin/settings')) body = renderSettings(getSettingsSection(path));
  else if (path === '/admin/permissions') body = renderPermissions();
  return body;
}


export { bindA28ScreenEvents } from './a28-screens-bind.js';

export { getAdminScreenId };
