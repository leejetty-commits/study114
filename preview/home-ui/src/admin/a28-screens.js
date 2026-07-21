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

/** 화면 한글 라벨 (저장값은 영문 유지) */
const STATUS_KO = { active: '사용', hidden: '숨김', archived: '보관' };
const VIS_KO = { public: '전체 공개', login: '로그인 후', role: '역할 제한' };
const DL_KO = { none: '불가', public: '전체', login: '로그인 후', role: '역할 제한', admin: '관리자만' };
const SEL_KO = { curated: '직접 고름', latest: '최신순', mixed: '혼합' };
const MOBILE_KO = { stack: '아래로 쌓기', collapse: '접기', hide: '숨김' };
const SOURCE_KO = { board: '게시판', static: '고정문', mixed: '혼합' };
const ORDER_STATUS_KO = {
  pending: '결제 대기',
  paid: '결제 완료',
  failed: '결제 실패',
  cancelled: '취소',
  refunded: '환불',
};
const SMS_STATUS_KO = {
  preview: '미리보기',
  queued: '발송 대기',
  sent: '발송 완료',
  failed: '발송 실패',
};

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

function sectionOwnerLabel(id) {
  const labels = {
    support: '고객센터',
    library: '자료실',
    'policy-log': '정책 기록',
    'mypage-submission': '마이페이지 제출함',
    phase2: '추후 기능',
  };
  return labels[id] || listSectionGroupSummary().find((group) => group.id === id)?.label || '기타';
}

function presetLabel(id) {
  return getPresetOptions().find((preset) => preset.id === id)?.label || '기타';
}

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
  {
    id: 3,
    email: 'tutor@example.com',
    name: '박과외',
    phone: '010-5555-6666',
    status: 'pending',
    primaryRole: 'tutor',
    emailVerified: false,
    oauthLinked: false,
    subscriptionTier: 'free',
    activePositions: 0,
    studyRoomCount: 0,
    tutorCount: 1,
    studentCount: 0,
    lastLoginAt: '2026-07-14 09:11:00',
    createdAt: '2026-03-20 14:00:00',
    isMaster: false,
  },
];

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

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** 쉬운 말로 운영 안내 (이정표·영문 코드는 코드 주석에만) */
function renderOpsTip() {
  return `<div class="a28-ops-tip" role="note">
    <strong>${esc(A28_COPY.opsTipTitle)}</strong>
    <p>${esc(A28_COPY.opsTipBody)}</p>
  </div>`;
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

/**
 * @param {string} title
 * @param {string} _screenId 개발 참고용 이정표 — 화면에 표시하지 않음
 * @param {string} bodyHtml
 * @param {{ lead?: string }} [opts]
 */
function renderPanel(title, _screenId, bodyHtml, { lead = '' } = {}) {
  return `
    <section class="sup-panel-card sup-panel-card--admin a28-panel">
      <header class="sup-panel-card__head">
        <div>
          <h2 class="sup-panel-card__title">${esc(title)} <span class="sup-admin-badge a28-badge">${esc(A28_COPY.previewBadge)}</span></h2>
          ${lead ? `<p class="sup-panel-card__lead">${lead}</p>` : ''}
        </div>
      </header>
      <div class="sup-panel-card__body">${bodyHtml}</div>
    </section>`;
}

function yesNo(v) {
  return v ? '예' : '—';
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
        <h4 class="admin-section-title">접근회원 · ${esc(sectionOwnerLabel(openSectionAccessId))}</h4>
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
        `<option value="${esc(owner)}"${channelFilters.sectionOwner === owner ? ' selected' : ''}>${esc(sectionOwnerLabel(owner))}</option>`,
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
      <input type="search" name="q" class="admin-input" placeholder="채널 키 · 메뉴 이름 · 경로" value="${esc(channelFilters.q)}" />
      <select name="status" class="admin-input--sm">
        <option value="all"${channelFilters.status === 'all' ? ' selected' : ''}>상태 전체</option>
        <option value="active"${channelFilters.status === 'active' ? ' selected' : ''}>사용</option>
        <option value="hidden"${channelFilters.status === 'hidden' ? ' selected' : ''}>숨김</option>
        <option value="archived"${channelFilters.status === 'archived' ? ' selected' : ''}>보관</option>
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
      <p class="a28-help">먼저 종류(프리셋)를 고른 뒤, 메뉴에 보일 이름과 경로를 적습니다. 마음대로 새 게시판 종류를 만들지 마세요.</p>
      <input type="hidden" name="mode" value="${channel ? 'update' : 'create'}" />
      <label class="sup-field"><span>종류(프리셋)</span><select name="presetId" data-channel-preset required>${presetOptions}</select></label>
      <label class="sup-field"><span>채널 식별값 <small>${esc(candidateHint.replace('boardKey', '채널 식별값'))} · 시스템용 영문 소문자</small></span><input name="boardKey" value="${esc(channel?.boardKey || '')}" placeholder="예: notice" required /></label>
      <label class="sup-field"><span>메뉴 이름</span><input name="menuLabel" value="${esc(channel?.menuLabel || '')}" placeholder="공지사항" required /></label>
      <label class="sup-field"><span>주소 경로</span><input name="routeSlug" value="${esc(channel?.routeSlug || '')}" placeholder="#/support/notice" /></label>
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
    .map((ch) => `<option value="${esc(ch.boardKey)}"${selected(current?.sourceBoardKey, ch.boardKey)}>${esc(ch.menuLabel)}</option>`)
    .join('');
  return `
    <form class="sup-admin-form a28-config-form" data-rail-form>
      <h3 class="sup-admin-form__title">우측 배너 자리 설정</h3>
      <p class="a28-help">게시판 본문이 아니라, 화면 오른쪽의 요약·추천·바로가기 자리입니다. 모바일에서는 아래로 쌓기 / 접기 / 숨김 중 하나를 고릅니다.</p>
      <label class="sup-field"><span>배너 자리</span><select name="slotKey">${slotOptions}</select></label>
      <label class="sup-field"><span>페이지 종류</span><input name="pageType" value="${esc(current?.pageType || 'home')}" required /></label>
      <label class="sup-field"><span>구역 제목</span><input name="sectionTitle" value="${esc(current?.sectionTitle || '')}" required /></label>
      <label class="sup-field"><span>내용 출처</span><select name="sourceType">${optionList(['board', 'static', 'mixed'], current?.sourceType || 'mixed', SOURCE_KO)}</select></label>
      <label class="sup-field"><span>기본 채널</span><select name="sourceBoardKey">${sourceOptions}</select></label>
      <label class="sup-field"><span>추가 채널 (쉼표)</span><input name="sourceBoardKeys" value="${esc((current?.sourceBoardKeys || []).join(', '))}" /></label>
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
     <p>${esc(A28_COPY.hubLead)}</p>
     <div class="a28-lists">
       <div><h3>할 수 있는 일</h3><ul>${ALLOWED_OPERATOR_ACTIONS.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
       <div><h3>하지 않는 일</h3><ul>${FORBIDDEN_OPERATOR_ACTIONS.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
     </div>
     <div class="sup-admin-hub">${cardHtml}</div>`,
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
     <table class="sup-admin-table"><thead><tr><th>식별번호</th><th>계정</th><th>상품</th><th>남은일</th><th>만료</th><th>보정</th></tr></thead>
     <tbody>${posRows || '<tr><td colspan="6" class="sup-empty">활성 구독 없음</td></tr>'}</tbody></table>
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
  const filters = cache?.filters ?? memberFilters;
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
  if (openMemberId) {
    const apiDetail = isAdminApiMode() ? getMemberDetailCache(openMemberId) : null;
    const detail = buildMemberDetail(openMemberId, apiDetail);
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
      .map((p) => `<li>${esc(adminProductLabel(p.sku_code))} · ${esc(p.ends_at)} (${p.days_left}일 남음)</li>`)
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
function renderMarketLab(section = 'overview') {
  const data = getMarketplaceLab();
  const kindKo = { study_room: '공부방', tutor: '과외쌤' };
  const statusKo = { published: '공개중', hidden: '숨김', pending: '대기', draft: '비공개' };

  if (section === 'overview') {
    const k = data.kpi;
    return renderPanel(
      '마켓 현황',
      'A28-07b',
      `${renderOpsTip()}
       <p class="a28-help">공부방·과외쌤이 곧 「상품」입니다. 오늘 운영 숫자를 먼저 보고, 아래 메뉴로 내려가세요.</p>
       <div class="admin-kpi-row">
         <div class="admin-kpi"><span>오늘 주문</span><strong>${k.ordersToday}</strong></div>
         <div class="admin-kpi"><span>오늘 결제</span><strong>${k.paidToday}</strong></div>
         <div class="admin-kpi"><span>미완료 결제</span><strong>${k.incomplete}</strong><small><a href="#/admin/market/incomplete" data-a28-nav="/admin/market/incomplete">보기</a></small></div>
         <div class="admin-kpi"><span>열린 문의</span><strong>${k.openInquiries}</strong><small><a href="#/admin/tickets" data-a28-nav="/admin/tickets">문의</a></small></div>
         <div class="admin-kpi"><span>후기 대기</span><strong>${k.reviewsPending}</strong><small><a href="#/admin/market/reviews" data-a28-nav="/admin/market/reviews">후기</a></small></div>
         <div class="admin-kpi"><span>관심(찜)</span><strong>${k.bookmarks}</strong></div>
       </div>
       <p class="a28-help"><a href="#/admin/commerce" data-a28-nav="/admin/commerce">→ 결제·주문 상세</a> · <a href="#/admin/exposure" data-a28-nav="/admin/exposure">→ 노출 보정</a></p>
       <button type="button" class="btn btn--secondary btn--sm" data-market-reset>예시 데이터 초기화</button>`,
    );
  }

  if (section === 'listings') {
    const rows = data.listings
      .map(
        (r) => `<tr>
          <td>${esc(kindKo[r.kind] || r.kind)}</td>
          <td>${esc(r.name)}</td>
          <td>${esc(r.region)}</td>
          <td>${esc(statusKo[r.status] || r.status)}</td>
          <td><a class="btn btn--secondary btn--sm" href="#/admin/exposure" data-a28-nav="/admin/exposure">노출 보정</a></td>
        </tr>`,
      )
      .join('');
    return renderPanel(
      '공부방·과외 목록',
      'A28-07a',
      `${renderOpsTip()}
       <p class="a28-help">등록된 공부방·과외쌤 목록입니다. 숨기거나 다시 보이게 하려면 「노출 보정」으로 가세요.</p>
       <table class="sup-admin-table"><thead><tr><th>구분</th><th>이름</th><th>지역</th><th>상태</th><th></th></tr></thead>
       <tbody>${rows || '<tr><td colspan="5" class="sup-empty">목록 없음</td></tr>'}</tbody></table>`,
    );
  }

  if (section === 'stats') {
    const sales = data.sales
      .map((r) => `<tr><td>${esc(r.period)}</td><td>${Number(r.amount).toLocaleString()}원</td><td>${r.orders}건</td></tr>`)
      .join('');
    const ranks = data.ranks
      .map(
        (r, i) =>
          `<tr><td>${i + 1}</td><td>${esc(kindKo[r.kind] || r.kind)}</td><td>${esc(r.name)}</td><td>${r.views}</td><td>${r.pays}</td></tr>`,
      )
      .join('');
    return renderPanel(
      '매출·순위',
      'A28-07b',
      `${renderOpsTip()}
       <p class="a28-help">미리보기용 예시 숫자입니다. 나중에 실제 결제 기록과 연결하면 됩니다.</p>
       <h3 class="admin-section-title">매출 요약</h3>
       <table class="sup-admin-table"><thead><tr><th>기간</th><th>금액</th><th>건수</th></tr></thead><tbody>${sales}</tbody></table>
       <h3 class="admin-section-title">공부방·과외 순위</h3>
       <table class="sup-admin-table"><thead><tr><th>#</th><th>구분</th><th>이름</th><th>조회</th><th>결제</th></tr></thead><tbody>${ranks}</tbody></table>`,
    );
  }

  if (section === 'reviews') {
    const rows = data.reviews
      .map(
        (r) => `<tr>
          <td>${esc(r.id)}</td>
          <td>${esc(kindKo[r.kind] || r.kind)}</td>
          <td>${esc(r.target)}</td>
          <td>${r.rating}점</td>
          <td>${esc(r.body)}</td>
          <td>${esc(r.status === 'published' ? '공개' : r.status === 'pending' ? '대기' : '숨김')}</td>
          <td class="sup-admin-actions">
            <button type="button" class="btn btn--primary btn--sm" data-review-status="${esc(r.id)}" data-review-next="published">공개</button>
            <button type="button" class="btn btn--secondary btn--sm" data-review-status="${esc(r.id)}" data-review-next="hidden">숨김</button>
          </td>
        </tr>`,
      )
      .join('');
    return renderPanel(
      '이용 후기',
      'A28-07b',
      `${renderOpsTip()}
       <p class="a28-help">「승인」이 아닙니다. 공개할지·숨길지만 고릅니다. 회원 화면에 인증·보증처럼 보이지 않게 하세요.</p>
       <table class="sup-admin-table"><thead><tr><th>번호</th><th>구분</th><th>대상</th><th>별점</th><th>내용</th><th>상태</th><th></th></tr></thead>
       <tbody>${rows || '<tr><td colspan="7" class="sup-empty">후기 없음</td></tr>'}</tbody></table>`,
    );
  }

  // incomplete
  const rows = data.incomplete
    .map(
      (r) => `<tr>
        <td>${esc(r.id)}</td>
        <td>${esc(r.email)}</td>
        <td>${esc(r.product)}</td>
        <td>${Number(r.amount).toLocaleString()}원</td>
        <td>${esc(r.step)}</td>
        <td>${esc(r.at)}</td>
        <td><button type="button" class="btn btn--secondary btn--sm" data-incomplete-dismiss="${esc(r.id)}">목록에서 빼기</button></td>
      </tr>`,
    )
    .join('');
  return renderPanel(
    '미완료 결제',
    'A28-07b',
    `${renderOpsTip()}
     <p class="a28-help">결제창에서 나가거나 실패한 건입니다. 연락이 필요하면 회원관리에서 찾아보세요.</p>
     <table class="sup-admin-table"><thead><tr><th>번호</th><th>계정</th><th>상품</th><th>금액</th><th>단계</th><th>시각</th><th></th></tr></thead>
     <tbody>${rows || '<tr><td colspan="7" class="sup-empty">미완료 없음</td></tr>'}</tbody></table>`,
  );
}

/** @param {import('./vendor-addons.js').AddonVendor[]} vendors */
function renderAddonVendorCards(vendors) {
  if (!vendors.length) {
    return '<p class="a28-help">등록된 업체가 없습니다.</p>';
  }
  return `<div class="addon-vendor-grid">${vendors
    .map((v) => {
      const cat = ADDON_CATEGORY_LABELS[v.category] || v.category;
      const st = ADDON_STATUS_LABELS[v.status] || v.status;
      const links = [
        v.homeUrl
          ? `<a class="btn btn--primary btn--sm" href="${esc(v.homeUrl)}" target="_blank" rel="noopener noreferrer">홈페이지</a>`
          : '',
        v.applyUrl
          ? `<a class="btn btn--secondary btn--sm" href="${esc(v.applyUrl)}" target="_blank" rel="noopener noreferrer">신청·가입</a>`
          : '',
        v.docsUrl
          ? `<a class="btn btn--secondary btn--sm" href="${esc(v.docsUrl)}" target="_blank" rel="noopener noreferrer">연동 문서</a>`
          : '',
      ]
        .filter(Boolean)
        .join(' ');
      return `<article class="addon-vendor-card">
        <header class="addon-vendor-card__head">
          <h3 class="addon-vendor-card__title">${esc(v.name)}</h3>
          <span class="addon-vendor-card__badge">${esc(st)}</span>
        </header>
        <p class="addon-vendor-card__cat">${esc(cat)}</p>
        <p class="addon-vendor-card__summary">${esc(v.summary)}</p>
        ${v.phone ? `<p class="addon-vendor-card__phone">상담 · ${esc(v.phone)}</p>` : ''}
        ${v.note ? `<p class="a28-help">${esc(v.note)}</p>` : ''}
        <p class="addon-vendor-card__url"><code>${esc(v.homeUrl)}</code></p>
        <div class="addon-vendor-card__actions">${links}</div>
      </article>`;
    })
    .join('')}</div>`;
}

function renderSmsLabNotice() {
  const smsVendors = listAddonVendors('sms');
  const urlList = smsVendors
    .map(
      (v) =>
        `<li><strong>${esc(v.name)}</strong> — <a href="${esc(v.homeUrl)}" target="_blank" rel="noopener noreferrer">${esc(v.homeUrl)}</a>${
          v.applyUrl
            ? ` · <a href="${esc(v.applyUrl)}" target="_blank" rel="noopener noreferrer">신청</a>`
            : ''
        }</li>`,
    )
    .join('');
  return `<div class="a28-help a28-help--warn" role="note">
      <strong>${esc(SMS_LAB_NOTICE.title)}</strong>
      <p>${esc(SMS_LAB_NOTICE.body)}</p>
      <p><strong>업체 URL</strong></p>
      <ul class="addon-url-list">${urlList}</ul>
      <p class="addon-notice-links"><a href="#/admin/addons/sms" data-a28-nav="/admin/addons/sms">→ 부가서비스 · 문자·메시징</a>
        · <a href="#/admin/addons/pg" data-a28-nav="/admin/addons/pg">카드·전자결제</a></p>
    </div>`;
}

/** @param {string} [section] home|pg|sms|identity */
function renderAddons(section = 'home') {
  const titleMap = {
    home: '부가서비스',
    pg: '카드·전자결제',
    sms: '문자·메시징',
    identity: '본인인증',
  };
  const lead =
    section === 'home'
      ? '영카트 「부가서비스」처럼, 나중에 연동할 업체의 홈페이지·신청·문서 URL을 모아 두었습니다. 지금은 연락·계약용이며 실결제·실문자 연동은 아직 없습니다.'
      : section === 'pg'
        ? '카드 결제모듈 상담·계약이 필요할 때 아래 업체로 바로 이동하세요. 수수료·심사는 업체와 직접 확인합니다.'
        : section === 'sms'
          ? '문자 실제 발송 전에 가입·발신번호·연동키를 준비할 업체입니다.'
          : '본인확인이 정책상 필요할 때만 검토합니다. 가입 SMS OTP는 쓰지 않습니다.';

  const category = section === 'home' ? 'all' : section;
  const vendors = listAddonVendors(/** @type {'all'|'sms'|'pg'|'identity'} */ (category));

  const nav = `<nav class="addon-subnav" aria-label="부가서비스 구분">
      <a href="#/admin/addons" data-a28-nav="/admin/addons"${section === 'home' ? ' class="is-on"' : ''}>전체</a>
      <a href="#/admin/addons/pg" data-a28-nav="/admin/addons/pg"${section === 'pg' ? ' class="is-on"' : ''}>카드·전자결제</a>
      <a href="#/admin/addons/sms" data-a28-nav="/admin/addons/sms"${section === 'sms' ? ' class="is-on"' : ''}>문자</a>
      <a href="#/admin/addons/identity" data-a28-nav="/admin/addons/identity"${section === 'identity' ? ' class="is-on"' : ''}>본인인증</a>
    </nav>`;

  return renderPanel(
    titleMap[section] || '부가서비스',
    'A28-09',
    `${renderOpsTip()}
     <p class="a28-help">${esc(lead)}</p>
     ${nav}
     ${section === 'sms' ? renderSmsLabNotice() : ''}
     ${renderAddonVendorCards(vendors)}
     ${
       section === 'pg'
         ? '<p class="a28-help">결제·주문 미리보기: <a href="#/admin/commerce" data-a28-nav="/admin/commerce">결제·주문</a> · <a href="#/admin/market/overview" data-a28-nav="/admin/market/overview">마켓 현황</a></p>'
         : ''
     }
     ${
       section === 'sms'
         ? '<p class="a28-help"><a href="#/admin/notify/settings" data-a28-nav="/admin/notify/settings">→ 문자 기본설정(미리보기)</a></p>'
         : ''
     }`,
  );
}

/** @param {string} [section] settings|templates|send|logs */
function renderNotifyLab(section = 'settings') {

  const lab = getSmsLab();

  const st = lab.settings;

  const statusKo = SMS_STATUS_KO;

  const chKo = { sms: '단문', lms: '장문', email: '이메일' };



  if (section === 'settings') {

    const ev = st.events || {};

    return renderPanel(

      '문자 기본설정',

      'A28-09',

      `${renderOpsTip()}
       ${renderSmsLabNotice()}

       <form class="sup-admin-form" data-sms-settings>

         <label class="a28-check"><input type="checkbox" name="smsEnabled"${checked(st.smsEnabled)} /> 문자(SMS) 사용(예정)</label>

         <label class="a28-check"><input type="checkbox" name="emailEnabled"${checked(st.emailEnabled)} /> 이메일 알림 사용</label>

         <label class="sup-field"><span>게이트웨이</span>

           <select name="gateway">

             <option value="none"${selected(st.gateway, 'none')}>연결 안 함(미리보기)</option>

             <option value="aligo"${selected(st.gateway, 'aligo')}>알리고(예정)</option>

             <option value="icode"${selected(st.gateway, 'icode')}>아이코드(예정)</option>

           </select>

         </label>

         <label class="sup-field"><span>발신 표시명</span><input name="senderName" value="${esc(st.senderName)}" /></label>

         <label class="sup-field"><span>발신 번호(표시용)</span><input name="senderPhone" value="${esc(st.senderPhone)}" /></label>

         <label class="sup-field"><span>야간 제한 시작</span><input name="quietHoursStart" value="${esc(st.quietHoursStart)}" placeholder="21:00" /></label>

         <label class="sup-field"><span>야간 제한 종료</span><input name="quietHoursEnd" value="${esc(st.quietHoursEnd)}" placeholder="08:00" /></label>

         <h4 class="admin-section-title">자동 알림 이벤트</h4>

         <div class="a28-checkbox-grid">

           <label><input type="checkbox" name="onReport"${checked(ev.onReport)} /> 새 신고</label>

           <label><input type="checkbox" name="onTicket"${checked(ev.onTicket)} /> 새 문의</label>

           <label><input type="checkbox" name="onNewProvider"${checked(ev.onNewProvider)} /> 새 공부방·과외 등록</label>

           <label><input type="checkbox" name="onPaidExpire"${checked(ev.onPaidExpire)} /> 유료 만료 임박</label>

           <label><input type="checkbox" name="onIncompletePay"${checked(ev.onIncompletePay)} /> 미완료 결제</label>

         </div>

         <button type="submit" class="btn btn--primary btn--sm">설정 저장</button>

       </form>

       <p class="a28-help"><a href="#/admin/settings/notify" data-a28-nav="/admin/settings/notify">→ 환경설정 · 운영 알림</a></p>`,

    );

  }



  if (section === 'sync') {

    return renderPanel(

      '회원번호 동기화',

      'A28-09',

      `${renderOpsTip()}

       <p class="a28-help">회원관리에 있는 휴대폰을 「테스트」 주소록 그룹으로 가져옵니다. 이미 있는 번호는 건너뜁니다.</p>

       <p class="a28-help">최근 동기화: ${esc(lab.lastMemberSyncAt || '없음')} · 추가 ${lab.syncedMemberPhones || 0}건</p>

       <button type="button" class="btn btn--primary btn--sm" data-sms-sync-members>회원 휴대폰 가져오기</button>

       <p class="a28-help"><a href="#/admin/notify/phones" data-a28-nav="/admin/notify/phones">→ 수신번호 관리</a></p>`,

    );

  }



  if (section === 'templates') {

    const groups = listTemplateGroups();

    const groupOpts = groups.map((g) => `<option value="${esc(g.id)}">${esc(g.label)}</option>`).join('');

    const groupRows = groups

      .map(

        (g) =>

          `<tr><td>${esc(g.label)}</td><td><code>${esc(g.id)}</code></td>

            <td><button type="button" class="btn btn--secondary btn--sm" data-tpl-grp-del="${esc(g.id)}">삭제</button></td></tr>`,

      )

      .join('');

    const rows = listTemplates('all')

      .map((t) => {

        const g = groups.find((x) => x.id === t.groupId);

        return `<tr>

          <td>${esc(g?.label || t.groupId)}</td>

          <td>${esc(t.title)}</td>

          <td>${esc(chKo[t.channel] || t.channel)}</td>

          <td>${esc(t.body)}</td>

          <td class="sup-admin-actions">

            <button type="button" class="btn btn--secondary btn--sm" data-tpl-edit="${esc(t.id)}">수정</button>

            <button type="button" class="btn btn--secondary btn--sm" data-tpl-delete="${esc(t.id)}">삭제</button>

          </td>

        </tr>`;

      })

      .join('');

    return renderPanel(

      '문구 템플릿',

      'A28-09',

      `${renderOpsTip()}

       <p class="a28-help">그룹으로 묶어 두고, 본문에 {days} 같은 자리표시를 쓸 수 있습니다. 글자 수가 길면 장문(LMS)으로 권장합니다.</p>

       <h3 class="admin-section-title">템플릿 그룹</h3>

       <table class="sup-admin-table"><thead><tr><th>이름</th><th>키</th><th></th></tr></thead>

         <tbody>${groupRows || '<tr><td colspan="3" class="sup-empty">그룹 없음</td></tr>'}</tbody></table>

       <form class="admin-filter-bar" data-tpl-grp-form>

         <input name="label" class="admin-input" placeholder="그룹 이름" required />

         <button type="submit" class="btn btn--primary btn--sm">그룹 추가</button>

       </form>

       <h3 class="admin-section-title">템플릿</h3>

       <table class="sup-admin-table"><thead><tr><th>그룹</th><th>제목</th><th>채널</th><th>본문</th><th></th></tr></thead>

         <tbody>${rows || '<tr><td colspan="5" class="sup-empty">템플릿 없음</td></tr>'}</tbody></table>

       <form class="sup-admin-form" data-tpl-form>

         <h4 class="sup-admin-form__title">템플릿 작성 · 수정</h4>

         <input type="hidden" name="id" value="" />

         <label class="sup-field"><span>그룹</span><select name="groupId">${groupOpts}</select></label>

         <label class="sup-field"><span>제목</span><input name="title" required /></label>

         <label class="sup-field"><span>채널</span>

           <select name="channel">

             <option value="sms">단문(SMS)</option>

             <option value="lms">장문(LMS)</option>

             <option value="email">이메일</option>

           </select>

         </label>

         <label class="sup-field"><span>본문</span><textarea name="body" rows="3" required data-sms-body></textarea></label>

         <p class="a28-help" data-sms-bytes>대략 0바이트 · 단문 권장</p>

         <div class="sup-admin-form__actions">

           <button type="submit" class="btn btn--primary btn--sm">저장</button>

           <button type="button" class="btn btn--secondary btn--sm" data-tpl-reset>새 템플릿</button>

         </div>

       </form>`,

    );

  }



  if (section === 'phones') {

    const groups = listPhoneGroups();

    const groupOpts = groups.map((g) => `<option value="${esc(g.id)}">${esc(g.label)}</option>`).join('');

    const groupRows = groups

      .map(

        (g) =>

          `<tr><td>${esc(g.label)}</td><td><code>${esc(g.id)}</code></td>

            <td><button type="button" class="btn btn--secondary btn--sm" data-ph-grp-del="${esc(g.id)}">삭제</button></td></tr>`,

      )

      .join('');

    const rows = listPhones('all')

      .map((p) => {

        const g = groups.find((x) => x.id === p.groupId);

        const sendPath = `/admin/notify/send?phone=${encodeURIComponent(p.phone)}&name=${encodeURIComponent(p.name)}`;

        return `<tr>

          <td>${esc(g?.label || p.groupId)}</td>

          <td>${esc(p.name)}</td>

          <td>${esc(p.phone)}</td>

          <td>${esc(p.memo || '—')}</td>

          <td class="sup-admin-actions">

            <button type="button" class="btn btn--secondary btn--sm" data-ph-edit="${esc(p.id)}">수정</button>

            <button type="button" class="btn btn--secondary btn--sm" data-ph-del="${esc(p.id)}">삭제</button>

            <a class="btn btn--secondary btn--sm" href="#${esc(sendPath)}" data-a28-nav="${esc(sendPath)}">보내기</a>

          </td>

        </tr>`;

      })

      .join('');

    return renderPanel(

      '수신번호 관리',

      'A28-09',

      `${renderOpsTip()}

       <p class="a28-help">운영·테스트용 주소록입니다. 실서비스에서는 수신동의·광고성 문자 규정을 지켜야 합니다.</p>

       <h3 class="admin-section-title">수신 그룹</h3>

       <table class="sup-admin-table"><thead><tr><th>이름</th><th>키</th><th></th></tr></thead>

         <tbody>${groupRows || '<tr><td colspan="3" class="sup-empty">그룹 없음</td></tr>'}</tbody></table>

       <form class="admin-filter-bar" data-ph-grp-form>

         <input name="label" class="admin-input" placeholder="그룹 이름" required />

         <button type="submit" class="btn btn--primary btn--sm">그룹 추가</button>

       </form>

       <h3 class="admin-section-title">번호</h3>

       <table class="sup-admin-table"><thead><tr><th>그룹</th><th>이름</th><th>휴대폰</th><th>메모</th><th></th></tr></thead>

         <tbody>${rows || '<tr><td colspan="5" class="sup-empty">번호 없음</td></tr>'}</tbody></table>

       <form class="sup-admin-form" data-ph-form>

         <h4 class="sup-admin-form__title">번호 추가 · 수정</h4>

         <input type="hidden" name="id" value="" />

         <label class="sup-field"><span>그룹</span><select name="groupId">${groupOpts}</select></label>

         <label class="sup-field"><span>이름</span><input name="name" required /></label>

         <label class="sup-field"><span>휴대폰</span><input name="phone" required placeholder="010-0000-0000" /></label>

         <label class="sup-field"><span>메모</span><input name="memo" /></label>

         <div class="sup-admin-form__actions">

           <button type="submit" class="btn btn--primary btn--sm">저장</button>

           <button type="button" class="btn btn--secondary btn--sm" data-ph-reset>새 번호</button>

         </div>

       </form>`,

    );

  }



  if (section === 'send') {

    const q = parseHashQuery();

    const prePhone = q.phone || '';

    const preName = q.name || '';

    const tplOpts = listTemplates('all').map((t) => `<option value="${esc(t.id)}">${esc(t.title)}</option>`).join('');

    const phoneOpts = listPhones('all')

      .map((p) => `<option value="${esc(p.phone)}" data-name="${esc(p.name)}">${esc(p.name)} · ${esc(p.phone)}</option>`)

      .join('');

    return renderPanel(

      '문자 보내기',

      'A28-09',

      `${renderOpsTip()}

       <p class="a28-help"><strong>실제로 문자를 보내지 않습니다.</strong> 전송내역에 「미리보기」로만 남깁니다.</p>

       <form class="sup-admin-form" data-sms-send>

         <label class="sup-field"><span>주소록에서 고르기</span>

           <select data-sms-pick-phone>

             <option value="">직접 입력</option>

             ${phoneOpts}

           </select>

         </label>

         <label class="sup-field"><span>받는 이름</span><input name="toName" value="${esc(preName)}" /></label>

         <label class="sup-field"><span>받는 번호</span><input name="to" value="${esc(prePhone)}" placeholder="010-0000-0000" required /></label>

         <label class="sup-field"><span>템플릿</span><select name="templateId" data-sms-tpl>${tplOpts}</select></label>

         <label class="sup-field"><span>본문</span><textarea name="body" rows="4" data-sms-body></textarea></label>

         <p class="a28-help" data-sms-bytes>대략 0바이트</p>

         <button type="submit" class="btn btn--primary btn--sm">미리보기 기록</button>

       </form>`,

    );

  }



  if (section === 'logs-phone') {

    const rows = listSendLogsByPhone()

      .map(

        (r) =>

          `<tr><td>${esc(r.phone)}</td><td>${esc(r.name || '—')}</td><td>${r.count}</td><td>${esc(statusKo[r.lastStatus] || r.lastStatus)}</td><td>${esc(r.lastAt)}</td></tr>`,

      )

      .join('');

    return renderPanel(

      '전송내역(번호별)',

      'A28-09',

      `${renderOpsTip()}

       <p class="a28-help">수신번호별로 몇 건 남겼는지 봅니다.</p>

       <table class="sup-admin-table"><thead><tr><th>번호</th><th>이름</th><th>건수</th><th>최근 상태</th><th>최근 시각</th></tr></thead>

         <tbody>${rows || '<tr><td colspan="5" class="sup-empty">내역 없음</td></tr>'}</tbody></table>`,

    );

  }



  const logs = listSendLogs()

    .map(

      (l) =>

        `<tr>

          <td>${esc(l.id)}</td>

          <td>${esc(l.to)}${l.toName ? `<br><small>${esc(l.toName)}</small>` : ''}</td>

          <td>${esc(l.templateTitle || '—')}</td>

          <td>${esc(chKo[l.channel] || l.channel)}</td>

          <td>${esc(statusKo[l.status] || l.status)}</td>

          <td>${l.byteLen || estimateSmsBytes(l.body)}</td>

          <td>${esc(l.at)}</td>

        </tr>`,

    )

    .join('');

  return renderPanel(

    '전송내역(건별)',

    'A28-09',

    `${renderOpsTip()}

     <p class="a28-help">미리보기 기록이 쌓입니다. 실발송 연동 후 sent/failed 상태가 추가됩니다.</p>

     <table class="sup-admin-table"><thead><tr><th>식별번호</th><th>수신</th><th>문구 틀</th><th>발송 방식</th><th>상태</th><th>글자 용량</th><th>시각</th></tr></thead>

       <tbody>${logs || '<tr><td colspan="7" class="sup-empty">내역 없음</td></tr>'}</tbody></table>

     <button type="button" class="btn btn--secondary btn--sm" data-sms-reset>문자 미리보기 초기화</button>`,

  );

}



/** @param {string} path */
export function renderA28Screen(path) {
  let body = renderHub();
  if (path === '/admin/members') body = renderMembers();
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

/** @param {HTMLElement} root @param {string} path @param {() => void} rerender */
export function bindA28ScreenEvents(root, path, rerender) {
  bindDetailDrawer(root);

  if (path === '/admin/permissions') {
    if (isAdminApiMode() && !getOperatorsCache()) {
      hydrateOperatorsCache()
        .then(() => rerender())
        .catch((err) => window.alert(err instanceof Error ? err.message : '목록 로드 실패'));
    }
    root.querySelector('[data-operator-refresh]')?.addEventListener('click', async () => {
      try {
        await hydrateOperatorsCache();
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '새로고침 실패');
      }
    });
    const createForm = root.querySelector('[data-operator-create]');
    createForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!(createForm instanceof HTMLFormElement)) return;
      const fd = new FormData(createForm);
      try {
        await apiCreateOperator({
          name: String(fd.get('name') || '').trim(),
          email: String(fd.get('email') || '').trim(),
          password: String(fd.get('password') || ''),
          password_confirm: String(fd.get('password_confirm') || ''),
          admin_level: String(fd.get('admin_level') || 'sub_master'),
          status: String(fd.get('status') || 'active'),
        });
        createForm.reset();
        rerender();
        window.alert('운영 계정을 발급했습니다.');
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '발급 실패');
      }
    });
    root.querySelectorAll('[data-operator-toggle-status]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-operator-toggle-status'));
        const status = String(btn.getAttribute('data-status') || '');
        if (!id || !status) return;
        if (!window.confirm(status === 'inactive' ? '이 계정을 비활성할까요?' : '이 계정을 활성할까요?')) return;
        try {
          await apiPatchOperator({ user_id: id, status });
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '상태 변경 실패');
        }
      });
    });
    root.querySelectorAll('[data-operator-toggle-level]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-operator-toggle-level'));
        const current = String(btn.getAttribute('data-level') || '');
        const next = current === 'super_admin' ? 'sub_master' : 'super_admin';
        if (!id) return;
        if (!window.confirm(`권한을 ${next === 'super_admin' ? '최고관리자' : '부마스터'}로 변경할까요?`)) return;
        try {
          await apiPatchOperator({ user_id: id, admin_level: next });
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '권한 변경 실패');
        }
      });
    });
    root.querySelectorAll('[data-operator-reset-pw]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-operator-reset-pw'));
        if (!id) return;
        const password = window.prompt('새 임시 비밀번호 (8~14자 · 영문+숫자+특수문자)');
        if (!password) return;
        try {
          await apiResetOperatorPassword({
            user_id: id,
            password,
            password_confirm: password,
          });
          rerender();
          window.alert('임시 비밀번호로 초기화했습니다. 대상자는 로그인 후 비밀번호를 변경해야 합니다.');
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '초기화 실패');
        }
      });
    });
  }

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
          if (isAdminApiMode()) await hydrateMemberDetail(id).catch(() => null);
        } catch {
          /* 더미 상세로 계속 */
        }
        rerender();
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
          window.alert('미리보기에서는 일괄 조치를 쓸 수 없습니다.');
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

  if (path.startsWith('/admin/notices')) {
    const channelForm = root.querySelector('[data-channel-form]');
    const railForm = root.querySelector('[data-rail-form]');

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
        const newKey = window.prompt(`「${sourceKey}」 복사 — 새 채널 키`, `${sourceKey}-copy`);
        if (!newKey) return;
        const newLabel = window.prompt('새 메뉴 이름 (선택)', '') || undefined;
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
        window.alert(err instanceof Error ? err.message : '상태 변경 실패');
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
      if (!window.confirm(`선택한 ${keys.length}개 채널 상태를 ${STATUS_KO[status] || '선택값'}으로 바꿀까요?`)) return;
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
        window.alert(err instanceof Error ? err.message : '일괄 상태 변경 실패');
        rerender();
      }
    });

    channelForm?.querySelector('[data-channel-reset-form]')?.addEventListener('click', () => {
      channelForm.reset();
      channelForm.querySelector('[name="mode"]').value = 'create';
    });

    channelForm?.querySelector('[data-channel-reset-seed]')?.addEventListener('click', () => {
      if (!window.confirm('채널 설정을 초기값으로 되돌릴까요?')) return;
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
      if (!window.confirm('우측 배너 설정을 초기값으로 되돌릴까요?')) return;
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
          window.alert(err instanceof Error ? err.message : '자주 묻는 질문 삭제 실패');
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
        window.alert(err instanceof Error ? err.message : '자주 묻는 질문 저장 실패');
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

  if (path.startsWith('/admin/settings')) {
    const toLocal = (v) => String(v || '').replace(' ', 'T').slice(0, 16);

    root.querySelector('[data-settings-basic]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!(form instanceof HTMLFormElement)) return;
      const fd = new FormData(form);
      saveSiteSettings({
        siteName: String(fd.get('siteName') || ''),
        operatorEmail: String(fd.get('operatorEmail') || ''),
        operatorPhone: String(fd.get('operatorPhone') || ''),
        supportHours: String(fd.get('supportHours') || ''),
        maintenanceEnabled: fd.get('maintenanceEnabled') === 'on',
        maintenanceMessage: String(fd.get('maintenanceMessage') || ''),
        maintenanceUntil: String(fd.get('maintenanceUntil') || '').replace('T', ' '),
        guestBannerEnabled: fd.get('guestBannerEnabled') === 'on',
        guestBannerText: String(fd.get('guestBannerText') || ''),
      });
      rerender();
      window.alert('사이트 설정을 저장했습니다.');
    });

    root.querySelector('[data-settings-join]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!(form instanceof HTMLFormElement)) return;
      const fd = new FormData(form);
      const current = getSiteSettings();
      const joinPolicy = cloneJoinPolicy(current.joinPolicy);
      root.querySelectorAll('[data-join-show]').forEach((el) => {
        if (!(el instanceof HTMLInputElement)) return;
        const [role, field] = String(el.getAttribute('data-join-show') || '').split(':');
        if (joinPolicy[role]?.[field]) joinPolicy[role][field].show = el.checked;
      });
      root.querySelectorAll('[data-join-emph]').forEach((el) => {
        if (!(el instanceof HTMLInputElement)) return;
        const [role, field] = String(el.getAttribute('data-join-emph') || '').split(':');
        if (joinPolicy[role]?.[field]) joinPolicy[role][field].emphasize = el.checked;
      });
      saveSiteSettings({
        signupOpen: fd.get('signupOpen') === 'on',
        studyRoomRegisterOpen: fd.get('studyRoomRegisterOpen') === 'on',
        tutorRegisterOpen: fd.get('tutorRegisterOpen') === 'on',
        bannedEmails: String(fd.get('bannedEmails') || ''),
        bannedWords: String(fd.get('bannedWords') || ''),
        joinPolicy,
      });
      rerender();
      window.alert('가입·등록 정책을 저장했습니다.');
    });

    root.querySelector('[data-settings-notify]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!(form instanceof HTMLFormElement)) return;
      const fd = new FormData(form);
      saveSiteSettings({
        notifyOnReport: fd.get('notifyOnReport') === 'on',
        notifyOnTicket: fd.get('notifyOnTicket') === 'on',
        notifyOnNewProvider: fd.get('notifyOnNewProvider') === 'on',
        notifyEmails: String(fd.get('notifyEmails') || ''),
      });
      rerender();
      window.alert('알림 설정을 저장했습니다.');
    });

    const popupForm = root.querySelector('[data-popup-form]');
    root.querySelectorAll('[data-popup-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-popup-edit');
        const row = listPopups().find((p) => p.id === id);
        if (!row || !(popupForm instanceof HTMLFormElement)) return;
        popupForm.querySelector('[name="id"]').value = row.id;
        popupForm.querySelector('[name="title"]').value = row.title;
        popupForm.querySelector('[name="body"]').value = row.body;
        popupForm.querySelector('[name="surface"]').value = row.surface;
        popupForm.querySelector('[name="startAt"]').value = toLocal(row.startAt);
        popupForm.querySelector('[name="endAt"]').value = toLocal(row.endAt);
        popupForm.querySelector('[name="dismissHours"]').value = String(row.dismissHours ?? 24);
        popupForm.querySelector('[name="enabled"]').checked = Boolean(row.enabled);
        popupForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    root.querySelectorAll('[data-popup-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-popup-delete');
        if (!id || !window.confirm('이 팝업을 삭제할까요?')) return;
        deletePopup(id);
        rerender();
      });
    });
    root.querySelector('[data-popup-reset]')?.addEventListener('click', () => {
      if (!(popupForm instanceof HTMLFormElement)) return;
      popupForm.reset();
      popupForm.querySelector('[name="id"]').value = '';
      popupForm.querySelector('[name="dismissHours"]').value = '24';
    });
    popupForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!(popupForm instanceof HTMLFormElement)) return;
      const fd = new FormData(popupForm);
      savePopup({
        id: String(fd.get('id') || ''),
        title: String(fd.get('title') || ''),
        body: String(fd.get('body') || ''),
        surface: String(fd.get('surface') || 'guest_home'),
        startAt: String(fd.get('startAt') || '').replace('T', ' '),
        endAt: String(fd.get('endAt') || '').replace('T', ' '),
        dismissHours: Number(fd.get('dismissHours') || 24),
        enabled: fd.get('enabled') === 'on',
      });
      rerender();
    });

    root.querySelectorAll('[data-legal-form]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!(form instanceof HTMLFormElement)) return;
        const key = form.getAttribute('data-legal-form');
        if (key !== 'terms' && key !== 'privacy') return;
        const fd = new FormData(form);
        saveLegalDoc(key, {
          title: String(fd.get('title') || ''),
          body: String(fd.get('body') || ''),
        });
        rerender();
        window.alert('문서를 저장했습니다.');
      });
    });

    root.querySelector('[data-settings-reset-seed]')?.addEventListener('click', () => {
      if (!window.confirm('환경설정을 초기값으로 되돌릴까요?')) return;
      resetSiteSettingsSeed();
      rerender();
    });
  }

  if (path.startsWith('/admin/market/')) {
    root.querySelector('[data-market-reset]')?.addEventListener('click', () => {
      if (!window.confirm('마켓 예시 데이터를 초기화할까요?')) return;
      resetMarketplaceLab();
      rerender();
    });
    root.querySelectorAll('[data-review-status]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-review-status');
        const next = btn.getAttribute('data-review-next');
        if (!id || !next) return;
        setReviewStatus(id, next);
        rerender();
      });
    });
    root.querySelectorAll('[data-incomplete-dismiss]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-incomplete-dismiss');
        if (!id) return;
        dismissIncomplete(id);
        rerender();
      });
    });
  }

  if (path.startsWith('/admin/notify/')) {

    const bindBytes = (rootEl) => {

      const body = rootEl.querySelector('[data-sms-body]');

      const out = rootEl.querySelector('[data-sms-bytes]');

      if (!(body instanceof HTMLTextAreaElement) || !out) return;

      const refresh = () => {

        const n = estimateSmsBytes(body.value);

        const ch = suggestChannelByBody(body.value);

        out.textContent = `대략 ${n}바이트 · ${ch === 'lms' ? '장문(LMS) 권장' : '단문(SMS) 가능'}`;

      };

      body.addEventListener('input', refresh);

      refresh();

    };

    bindBytes(root);



    root.querySelector('[data-sms-settings]')?.addEventListener('submit', (e) => {

      e.preventDefault();

      const form = e.currentTarget;

      if (!(form instanceof HTMLFormElement)) return;

      const fd = new FormData(form);

      saveSmsSettings({

        smsEnabled: fd.get('smsEnabled') === 'on',

        emailEnabled: fd.get('emailEnabled') === 'on',

        gateway: String(fd.get('gateway') || 'none'),

        senderName: String(fd.get('senderName') || ''),

        senderPhone: String(fd.get('senderPhone') || ''),

        quietHoursStart: String(fd.get('quietHoursStart') || ''),

        quietHoursEnd: String(fd.get('quietHoursEnd') || ''),

        events: {

          onReport: fd.get('onReport') === 'on',

          onTicket: fd.get('onTicket') === 'on',

          onNewProvider: fd.get('onNewProvider') === 'on',

          onPaidExpire: fd.get('onPaidExpire') === 'on',

          onIncompletePay: fd.get('onIncompletePay') === 'on',

        },

      });

      rerender();

      window.alert('문자 기본설정을 저장했습니다. (실발송은 아직 없습니다)');

    });



    root.querySelector('[data-sms-sync-members]')?.addEventListener('click', () => {

      const cache = getMembersCache();

      const list = cache?.members?.length ? cache.members : A28_MEMBER_SEED;

      const data = syncPhonesFromMembers(list);

      rerender();

      window.alert(`동기화 완료 · 새로 추가 ${data.syncedMemberPhones}건`);

    });



    root.querySelector('[data-tpl-grp-form]')?.addEventListener('submit', (e) => {

      e.preventDefault();

      const form = e.currentTarget;

      if (!(form instanceof HTMLFormElement)) return;

      const fd = new FormData(form);

      saveTemplateGroup({ label: String(fd.get('label') || '') });

      rerender();

    });

    root.querySelectorAll('[data-tpl-grp-del]').forEach((btn) => {

      btn.addEventListener('click', () => {

        const id = btn.getAttribute('data-tpl-grp-del');

        if (!id || !window.confirm('이 그룹을 삭제할까요?')) return;

        try {

          deleteTemplateGroup(id);

          rerender();

        } catch (err) {

          window.alert(err instanceof Error ? err.message : '삭제 실패');

        }

      });

    });



    const tplForm = root.querySelector('[data-tpl-form]');

    root.querySelectorAll('[data-tpl-edit]').forEach((btn) => {

      btn.addEventListener('click', () => {

        const id = btn.getAttribute('data-tpl-edit');

        const row = listTemplates('all').find((t) => t.id === id);

        if (!row || !(tplForm instanceof HTMLFormElement)) return;

        tplForm.querySelector('[name="id"]').value = row.id;

        tplForm.querySelector('[name="groupId"]').value = row.groupId;

        tplForm.querySelector('[name="title"]').value = row.title;

        tplForm.querySelector('[name="channel"]').value = row.channel || 'sms';

        tplForm.querySelector('[name="body"]').value = row.body;

        tplForm.querySelector('[name="body"]')?.dispatchEvent(new Event('input'));

      });

    });

    root.querySelectorAll('[data-tpl-delete]').forEach((btn) => {

      btn.addEventListener('click', () => {

        const id = btn.getAttribute('data-tpl-delete');

        if (!id || !window.confirm('이 템플릿을 삭제할까요?')) return;

        deleteTemplate(id);

        rerender();

      });

    });

    root.querySelector('[data-tpl-reset]')?.addEventListener('click', () => {

      if (!(tplForm instanceof HTMLFormElement)) return;

      tplForm.reset();

      tplForm.querySelector('[name="id"]').value = '';

    });

    tplForm?.addEventListener('submit', (e) => {

      e.preventDefault();

      if (!(tplForm instanceof HTMLFormElement)) return;

      const fd = new FormData(tplForm);

      saveTemplate({

        id: String(fd.get('id') || ''),

        groupId: String(fd.get('groupId') || ''),

        title: String(fd.get('title') || ''),

        channel: String(fd.get('channel') || 'sms'),

        body: String(fd.get('body') || ''),

      });

      rerender();

    });



    root.querySelector('[data-ph-grp-form]')?.addEventListener('submit', (e) => {

      e.preventDefault();

      const form = e.currentTarget;

      if (!(form instanceof HTMLFormElement)) return;

      const fd = new FormData(form);

      savePhoneGroup({ label: String(fd.get('label') || '') });

      rerender();

    });

    root.querySelectorAll('[data-ph-grp-del]').forEach((btn) => {

      btn.addEventListener('click', () => {

        const id = btn.getAttribute('data-ph-grp-del');

        if (!id || !window.confirm('이 그룹을 삭제할까요?')) return;

        try {

          deletePhoneGroup(id);

          rerender();

        } catch (err) {

          window.alert(err instanceof Error ? err.message : '삭제 실패');

        }

      });

    });



    const phForm = root.querySelector('[data-ph-form]');

    root.querySelectorAll('[data-ph-edit]').forEach((btn) => {

      btn.addEventListener('click', () => {

        const id = btn.getAttribute('data-ph-edit');

        const row = listPhones('all').find((p) => p.id === id);

        if (!row || !(phForm instanceof HTMLFormElement)) return;

        phForm.querySelector('[name="id"]').value = row.id;

        phForm.querySelector('[name="groupId"]').value = row.groupId;

        phForm.querySelector('[name="name"]').value = row.name;

        phForm.querySelector('[name="phone"]').value = row.phone;

        phForm.querySelector('[name="memo"]').value = row.memo || '';

      });

    });

    root.querySelectorAll('[data-ph-del]').forEach((btn) => {

      btn.addEventListener('click', () => {

        const id = btn.getAttribute('data-ph-del');

        if (!id || !window.confirm('이 번호를 삭제할까요?')) return;

        deletePhone(id);

        rerender();

      });

    });

    root.querySelector('[data-ph-reset]')?.addEventListener('click', () => {

      if (!(phForm instanceof HTMLFormElement)) return;

      phForm.reset();

      phForm.querySelector('[name="id"]').value = '';

    });

    phForm?.addEventListener('submit', (e) => {

      e.preventDefault();

      if (!(phForm instanceof HTMLFormElement)) return;

      const fd = new FormData(phForm);

      savePhone({

        id: String(fd.get('id') || ''),

        groupId: String(fd.get('groupId') || ''),

        name: String(fd.get('name') || ''),

        phone: String(fd.get('phone') || ''),

        memo: String(fd.get('memo') || ''),

      });

      rerender();

    });



    const sendForm = root.querySelector('[data-sms-send]');

    root.querySelector('[data-sms-pick-phone]')?.addEventListener('change', (e) => {

      const sel = e.currentTarget;

      if (!(sel instanceof HTMLSelectElement) || !(sendForm instanceof HTMLFormElement)) return;

      const opt = sel.selectedOptions[0];

      if (!opt || !opt.value) return;

      sendForm.querySelector('[name="to"]').value = opt.value;

      sendForm.querySelector('[name="toName"]').value = opt.getAttribute('data-name') || '';

    });

    const tplSel = root.querySelector('[data-sms-tpl]');

    const fillTpl = () => {

      if (!(sendForm instanceof HTMLFormElement) || !(tplSel instanceof HTMLSelectElement)) return;

      const row = listTemplates('all').find((t) => t.id === tplSel.value);

      if (row) {

        const body = sendForm.querySelector('[name="body"]');

        if (body instanceof HTMLTextAreaElement && !body.value.trim()) {

          body.value = row.body;

          body.dispatchEvent(new Event('input'));

        }

      }

    };

    tplSel?.addEventListener('change', fillTpl);

    fillTpl();



    sendForm?.addEventListener('submit', (e) => {

      e.preventDefault();

      if (!(sendForm instanceof HTMLFormElement)) return;

      const fd = new FormData(sendForm);

      previewSend({

        to: String(fd.get('to') || ''),

        toName: String(fd.get('toName') || ''),

        templateId: String(fd.get('templateId') || ''),

        body: String(fd.get('body') || ''),

      });

      rerender();

      window.alert('전송내역에 미리보기를 남겼습니다. 실제 문자는 보내지 않았습니다.');

      window.location.hash = '/admin/notify/logs';

    });



    root.querySelector('[data-sms-reset]')?.addEventListener('click', () => {

      if (!window.confirm('문자 미리보기를 초기화할까요?')) return;

      resetSmsLab();

      rerender();

    });

  }


}

/** @param {Record<string, any>} policy */
function cloneJoinPolicy(policy) {
  return JSON.parse(JSON.stringify(policy || {}));
}

export { getAdminScreenId };
