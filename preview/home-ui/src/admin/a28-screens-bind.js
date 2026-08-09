/**
 * A28 admin event binders — extracted from a28-screens.js
 * Rollback: git revert this commit.
 */
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


export function bindA28ScreenEvents(root, path, rerender) {
  bindDetailDrawer(root);

  root.querySelectorAll('[data-promo-copy-url]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-promo-copy-url') || '';
      try {
        await navigator.clipboard.writeText(text);
        window.alert('URL을 복사했습니다.');
      } catch {
        window.prompt('복사하세요', text);
      }
    });
  });
  root.querySelectorAll('[data-promo-copy-share]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-promo-copy-share') || '';
      try {
        await navigator.clipboard.writeText(text);
        window.alert('공유 문구를 복사했습니다.');
      } catch {
        window.prompt('복사하세요', text);
      }
    });
  });
  root.querySelectorAll('[data-promo-copy-kit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-promo-copy-kit') || '';
      try {
        await navigator.clipboard.writeText(text);
        window.alert('런치 킷(문구+URL)을 복사했습니다.');
      } catch {
        window.prompt('복사하세요', text);
      }
    });
  });

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
      hydrateMembersCache(a28Ui.memberFilters)
        .then(() => rerender())
        .catch(() => {});
    }
    const form = root.querySelector('[data-member-filter]');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!(form instanceof HTMLFormElement)) return;
      const fd = new FormData(form);
      a28Ui.memberFilters = {
        q: String(fd.get('q') || '').trim(),
        status: String(fd.get('status') || 'all'),
        role_type: String(fd.get('role_type') || 'all'),
      };
      try {
        if (isAdminApiMode()) await hydrateMembersCache(a28Ui.memberFilters);
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '검색 실패');
      }
    });
    root.querySelectorAll('[data-member-status-chip]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const status = String(btn.getAttribute('data-member-status-chip') || 'all');
        a28Ui.memberFilters = { ...a28Ui.memberFilters, status };
        try {
          if (isAdminApiMode()) await hydrateMembersCache(a28Ui.memberFilters);
          rerender();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : '필터 실패');
        }
      });
    });
    root.querySelector('[data-member-refresh]')?.addEventListener('click', async () => {
      try {
        if (isAdminApiMode()) await hydrateMembersCache(a28Ui.memberFilters);
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '새로고침 실패');
      }
    });
    root.querySelectorAll('[data-member-open]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-member-open'));
        if (!id) return;
        a28Ui.openMemberId = id;
        try {
          if (isAdminApiMode()) await hydrateMemberDetail(id).catch(() => null);
        } catch {
          /* 더미 상세로 계속 */
        }
        rerender();
      });
    });
    if (a28Ui.openMemberId) {
      const drawer = root.querySelector(`[data-admin-drawer="member-${a28Ui.openMemberId}"]`);
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
          await hydrateMembersCache(a28Ui.memberFilters);
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
          await hydrateMembersCache(a28Ui.memberFilters);
          if (a28Ui.openMemberId) await hydrateMemberDetail(a28Ui.openMemberId).catch(() => {});
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
          .map((owner) => `<option value="${esc(owner)}">${esc(sectionOwnerLabel(owner))}</option>`)
          .join('');
        if (presetId === 'concern') section.value = 'community';
      }
      const boardKey = channelForm.querySelector('[name="boardKey"]');
      const routeSlug = channelForm.querySelector('[name="routeSlug"]');
      const candidates = getBoardKeyCandidates(presetId);
      if (boardKey instanceof HTMLInputElement) {
        if (candidates.length && !boardKey.value) boardKey.placeholder = candidates[0];
        if (presetId === 'concern') boardKey.placeholder = '예: concern-admission';
      }
      if (routeSlug instanceof HTMLInputElement && presetId === 'concern') {
        routeSlug.placeholder = '#/community/admission (비우면 자동)';
      }
    });

    channelForm?.querySelector('[name="boardKey"]')?.addEventListener('change', (e) => {
      const presetId = channelForm.querySelector('[name="presetId"]')?.value;
      const routeSlug = channelForm.querySelector('[name="routeSlug"]');
      const key = String(e.target?.value || '').trim();
      if (presetId === 'concern' && routeSlug instanceof HTMLInputElement && !routeSlug.value && key) {
        const slug = key.startsWith('concern-') ? key.slice('concern-'.length) : key;
        routeSlug.value = `#/community/${slug}`;
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
          .map((owner) => `<option value="${esc(owner)}"${selected(channel.sectionOwner, owner)}>${esc(sectionOwnerLabel(owner))}</option>`)
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
        a28Ui.channelFilters = { ...a28Ui.channelFilters, sectionOwner: owner };
        rerender();
      });
    });
    root.querySelectorAll('[data-section-access]').forEach((btn) => {
      btn.addEventListener('click', () => {
        a28Ui.openSectionAccessId = btn.getAttribute('data-section-access');
        rerender();
      });
    });
    root.querySelector('[data-section-access-close]')?.addEventListener('click', () => {
      a28Ui.openSectionAccessId = null;
      rerender();
    });
    const accessForm = root.querySelector('[data-section-access-form]');
    accessForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!(accessForm instanceof HTMLFormElement) || !a28Ui.openSectionAccessId) return;
      const fd = new FormData(accessForm);
      try {
        addSectionAccessMember(a28Ui.openSectionAccessId, String(fd.get('email') || ''));
        rerender();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '접근회원 추가 실패');
      }
    });
    root.querySelectorAll('[data-section-access-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const email = btn.getAttribute('data-section-access-remove');
        if (!email || !a28Ui.openSectionAccessId) return;
        try {
          removeSectionAccessMember(a28Ui.openSectionAccessId, email);
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
          if (a28Ui.channelFilters.sectionOwner === id) {
            a28Ui.channelFilters = { ...a28Ui.channelFilters, sectionOwner: 'all' };
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
      a28Ui.channelFilters = {
        q: String(fd.get('q') || '').trim(),
        status: String(fd.get('status') || 'all'),
        sectionOwner: String(fd.get('sectionOwner') || 'all'),
      };
      rerender();
    });
    root.querySelector('[data-channel-filter-reset]')?.addEventListener('click', () => {
      a28Ui.channelFilters = { q: '', status: 'all', sectionOwner: 'all' };
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

    root.querySelectorAll('[data-rail-add-concern]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-rail-add-concern');
        const input = railForm?.querySelector('[name="sourceBoardKeys"]');
        if (!key || !(input instanceof HTMLInputElement)) return;
        const current = input.value
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
        if (!current.includes(key)) current.push(key);
        input.value = current.join(', ');
      });
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


