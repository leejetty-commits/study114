/**
 * 공지·게시판, 설정, 알림·SMS 바인드.
 * 바깥은 a28-screens-bind.js만 부른다. 이 파일은 a28-screens-bind.js를 가져오지 않는다.
 */
import { listNotices, upsertNotice, deleteNotice } from '../support/notice-store.js';
import {
  listFaqPosts,
  upsertFaqPost,
  deleteFaqPost,
  listGuidePosts,
  upsertGuidePost,
  deleteGuidePost,
  isSeedFaqId,
  isSeedGuideSlug,
} from '../operational-board-store.js';
import { FAQ_TABS } from '../support/support-copy.js';
import {
  archiveBoardChannel,
  getBoardChannel,
  getBoardKeyCandidates,
  getSectionOwnerOptions,
  addCustomSectionGroup,
  removeCustomSectionGroup,
  addSectionAccessMember,
  removeSectionAccessMember,
  copyBoardChannel,
  resetBoardChannels,
  saveBoardChannel,
} from '../board-channel-store.js';
import {
  listRightRailSlots,
  resetRightRailSlots,
  saveRightRailSlot,
  updateRightRailSlotStatus,
} from '../right-rail-store.js';
import {
  getSiteSettings,
  saveSiteSettings,
  saveLegalDoc,
  resetSiteSettingsSeed,
  isAdminSettingsReady,
  ensureAdminSettings,
} from './site-settings-store.js';
import { getMembersCache } from './admin-backend.js';
import {
  saveSmsSettings,
  saveTemplateGroup,
  deleteTemplateGroup,
  listTemplates,
  saveTemplate,
  deleteTemplate,
  savePhoneGroup,
  deletePhoneGroup,
  listPhones,
  savePhone,
  deletePhone,
  syncPhonesFromMembers,
  previewSend,
  estimateSmsBytes,
  suggestChannelByBody,
  resetSmsLab,
} from './sms-lab-store.js';
import { s114Alert, s114Confirm, s114Prompt } from '../../../shared/confirm-dialog.js';
import { STATUS_KO, A28_MEMBER_SEED, a28Ui } from './a28-screens-state.js';
import { esc, cloneJoinPolicy, sectionOwnerLabel, selected } from './a28-screens-shared.js';
import { bindHomePopupForm, writeAdminHash } from './a28-screens-bind-members.js';

export function bindNoticeAdminEvents(root, path, rerender) {
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
        const newKey = await s114Prompt(`「${sourceKey}」 복사 — 새 채널 키`, `${sourceKey}-copy`);
        if (!newKey) return;
        const newLabel = (await s114Prompt('새 메뉴 이름 (선택)', '')) || undefined;
        try {
          await copyBoardChannel(sourceKey, { boardKey: newKey, menuLabel: newLabel });
          rerender();
        } catch (err) {
          void s114Alert(err instanceof Error ? err.message : '채널 복사 실패');
        }
      });
    });

    root.querySelectorAll('[data-channel-archive]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const boardKey = btn.getAttribute('data-channel-archive');
        if (!boardKey || !(await s114Confirm(`${boardKey} 채널을 보관 상태로 바꿀까요?`, { danger: true }))) return;
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
        void s114Alert(err instanceof Error ? err.message : '접근회원 추가 실패');
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
          void s114Alert(err instanceof Error ? err.message : '접근회원 제거 실패');
        }
      });
    });
    root.querySelectorAll('[data-section-remove]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-section-remove');
        if (!id || !(await s114Confirm(`${id} 그룹을 삭제할까요?`, { danger: true }))) return;
        try {
          removeCustomSectionGroup(id);
          if (a28Ui.channelFilters.sectionOwner === id) {
            a28Ui.channelFilters = { ...a28Ui.channelFilters, sectionOwner: 'all' };
          }
          rerender();
        } catch (err) {
          void s114Alert(err instanceof Error ? err.message : '그룹 삭제 실패');
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
        void s114Alert(err instanceof Error ? err.message : '그룹 추가 실패');
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
        void s114Alert(err instanceof Error ? err.message : '상태 변경 실패');
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
        void s114Alert('채널을 선택해 주세요.');
        return;
      }
      if (!(await s114Confirm(`선택한 ${keys.length}개 채널 상태를 ${STATUS_KO[status] || '선택값'}으로 바꿀까요?`))) return;
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
        void s114Alert(err instanceof Error ? err.message : '일괄 상태 변경 실패');
        rerender();
      }
    });

    channelForm?.querySelector('[data-channel-reset-form]')?.addEventListener('click', () => {
      channelForm.reset();
      channelForm.querySelector('[name="mode"]').value = 'create';
    });

    channelForm?.querySelector('[data-channel-reset-seed]')?.addEventListener('click', async () => {
      if (!(await s114Confirm('채널 설정을 초기값으로 되돌릴까요?', { danger: true }))) return;
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
        void s114Alert(err instanceof Error ? err.message : '채널 저장 실패');
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

    railForm?.querySelector('[data-rail-reset-seed]')?.addEventListener('click', async () => {
      if (!(await s114Confirm('우측 배너 설정을 초기값으로 되돌릴까요?', { danger: true }))) return;
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
        void s114Alert(err instanceof Error ? err.message : '슬롯 저장 실패');
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
        form.querySelector('[name="target_role"]').value = notice.targetRole || 'all';
        form.querySelector('[name="title"]').value = notice.title;
        form.querySelector('[name="body"]').value = notice.body.join('\n');
      });
    });
    root.querySelectorAll('[data-a28-notice-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-a28-notice-delete');
        if (!id || !(await s114Confirm('삭제할까요?', { danger: true }))) return;
        try {
          await deleteNotice(id);
          rerender();
        } catch (err) {
          void s114Alert(err instanceof Error ? err.message : '공지를 삭제하지 못했습니다. 운영자 로그인 상태를 확인해 주세요.');
        }
      });
    });
    form?.querySelector('[data-a28-notice-reset]')?.addEventListener('click', () => {
      form.reset();
      form.querySelector('[name="id"]').value = '';
      form.querySelector('[name="date"]').value = new Date().toISOString().slice(0, 10);
      form.querySelector('[name="target_role"]').value = 'all';
    });
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      try {
        await upsertNotice({
          id: String(fd.get('id') || '').trim() || undefined,
          date: String(fd.get('date')),
          title: String(fd.get('title')),
          body: String(fd.get('body')).split('\n').map((l) => l.trim()).filter(Boolean),
          target_role: String(fd.get('target_role') || 'all'),
        });
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '공지를 저장하지 못했습니다. 운영자 로그인 상태를 확인해 주세요.');
        return;
      }
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
        const category = faqForm.querySelector('[name="category"]');
        if (category) {
          category.value = FAQ_TABS.some((tab) => tab.slug === item.category) ? item.category : 'join';
        }
      });
    });
    root.querySelectorAll('[data-a28-faq-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-a28-faq-delete');
        if (!id) return;
        if (isSeedFaqId(id)) {
          void s114Alert('기본 질문은 지울 수 없습니다. 내용을 수정해 주세요.');
          return;
        }
        if (!(await s114Confirm('삭제할까요?', { danger: true }))) return;
        try {
          await deleteFaqPost(id);
          rerender();
        } catch (err) {
          void s114Alert(err instanceof Error ? err.message : '자주 묻는 질문 삭제 실패');
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
          category: String(fd.get('category') || 'join'),
          sortOrder: Number(fd.get('sortOrder') || 0),
        });
        faqForm.reset();
        faqForm.querySelector('[name="id"]').value = '';
        rerender();
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '자주 묻는 질문 저장 실패');
      }
    });

    const guideForm = root.querySelector('[data-a28-guide-form]');
    root.querySelectorAll('[data-a28-guide-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = listGuidePosts().find((g) => g.slug === btn.getAttribute('data-a28-guide-edit'));
        if (!item || !guideForm) return;
        guideForm.querySelector('[name="originalSlug"]').value = item.slug;
        guideForm.querySelector('[name="serverId"]').value = item.id || '';
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
        if (!slug) return;
        if (isSeedGuideSlug(slug)) {
          void s114Alert('기본 글은 지울 수 없습니다. 내용을 수정해 주세요.');
          return;
        }
        if (!(await s114Confirm('삭제할까요?', { danger: true }))) return;
        try {
          await deleteGuidePost(slug);
          rerender();
        } catch (err) {
          void s114Alert(err instanceof Error ? err.message : '이용안내 삭제 실패');
        }
      });
    });
    guideForm?.querySelector('[data-a28-guide-reset]')?.addEventListener('click', () => {
      guideForm.reset();
      guideForm.querySelector('[name="originalSlug"]').value = '';
      guideForm.querySelector('[name="serverId"]').value = '';
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
      try {
        await upsertGuidePost({
          id: String(fd.get('serverId') || '').trim(),
          slug,
          title: String(fd.get('title')),
          priority: String(fd.get('priority') || 'primary'),
          audience: String(fd.get('audience') || '전체'),
          body: String(fd.get('body')).split('\n').map((l) => l.trim()).filter(Boolean),
          checklist,
        });
        guideForm.reset();
        guideForm.querySelector('[name="originalSlug"]').value = '';
        guideForm.querySelector('[name="serverId"]').value = '';
        rerender();
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '이용안내 저장 실패');
      }
    });
  }
}

export function bindSettingsAdminEvents(root, path, rerender) {
  if (path.startsWith('/admin/settings')) {
    if (!isAdminSettingsReady()) {
      ensureAdminSettings().then(() => rerender());
    }
    const showSettingsError = (message) => {
      void s114Alert(message);
    };
    root.querySelector('[data-settings-basic]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!(form instanceof HTMLFormElement)) return;
      const fd = new FormData(form);
      try {
        await saveSiteSettings({
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
        void s114Alert('사이트 설정을 저장했습니다.');
      } catch (err) {
        showSettingsError(err instanceof Error ? err.message : '사이트 기본을 저장하지 못했습니다.');
        rerender();
      }
    });

    root.querySelector('[data-settings-join]')?.addEventListener('submit', async (e) => {
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
      try {
        await saveSiteSettings({
          bannedEmails: String(fd.get('bannedEmails') || ''),
          bannedWords: String(fd.get('bannedWords') || ''),
          joinPolicy,
        });
        rerender();
        void s114Alert('가입·등록 정책을 저장했습니다.');
      } catch (err) {
        showSettingsError(err instanceof Error ? err.message : '가입·등록 정책을 저장하지 못했습니다.');
        rerender();
      }
    });

    root.querySelector('[data-settings-notify]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!(form instanceof HTMLFormElement)) return;
      const fd = new FormData(form);
      try {
        await saveSiteSettings({
          notifyOnReport: fd.get('notifyOnReport') === 'on',
          notifyOnTicket: fd.get('notifyOnTicket') === 'on',
          notifyOnNewProvider: fd.get('notifyOnNewProvider') === 'on',
          notifyEmails: String(fd.get('notifyEmails') || ''),
        });
        rerender();
        void s114Alert('알림 설정을 저장했습니다.');
      } catch (err) {
        showSettingsError(err instanceof Error ? err.message : '알림 설정을 저장하지 못했습니다.');
        rerender();
      }
    });

    bindHomePopupForm(root, rerender, writeAdminHash);

    root.querySelectorAll('[data-legal-form]').forEach((form) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!(form instanceof HTMLFormElement)) return;
        const key = form.getAttribute('data-legal-form');
        if (key !== 'terms' && key !== 'privacy') return;
        const fd = new FormData(form);
        try {
          await saveLegalDoc(key, {
            title: String(fd.get('title') || ''),
            body: String(fd.get('body') || ''),
          });
          rerender();
          void s114Alert('문서를 저장했습니다.');
        } catch (err) {
          void s114Alert(err instanceof Error ? err.message : '문서를 저장하지 못했습니다.');
          rerender();
        }
      });
    });

    root.querySelector('[data-settings-reset-seed]')?.addEventListener('click', async () => {
      if (!(await s114Confirm('사이트 기본을 초기값으로 되돌릴까요?', { danger: true }))) return;
      try {
        await resetSiteSettingsSeed();
        rerender();
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '초기값으로 되돌리지 못했습니다.');
        rerender();
      }
    });
  }
}

export function bindNotifyAdminEvents(root, path, rerender) {
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

      void s114Alert('문자 기본설정을 저장했습니다. (실발송은 아직 없습니다)');

    });



    root.querySelector('[data-sms-sync-members]')?.addEventListener('click', () => {

      const cache = getMembersCache();

      const list = cache?.members?.length ? cache.members : A28_MEMBER_SEED;

      const data = syncPhonesFromMembers(list);

      rerender();

      void s114Alert(`동기화 완료 · 새로 추가 ${data.syncedMemberPhones}건`);

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

      btn.addEventListener('click', async () => {

        const id = btn.getAttribute('data-tpl-grp-del');

        if (!id || !(await s114Confirm('이 그룹을 삭제할까요?', { danger: true }))) return;

        try {

          deleteTemplateGroup(id);

          rerender();

        } catch (err) {

          void s114Alert(err instanceof Error ? err.message : '삭제 실패');

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

      btn.addEventListener('click', async () => {

        const id = btn.getAttribute('data-tpl-delete');

        if (!id || !(await s114Confirm('이 템플릿을 삭제할까요?', { danger: true }))) return;

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

      btn.addEventListener('click', async () => {

        const id = btn.getAttribute('data-ph-grp-del');

        if (!id || !(await s114Confirm('이 그룹을 삭제할까요?', { danger: true }))) return;

        try {

          deletePhoneGroup(id);

          rerender();

        } catch (err) {

          void s114Alert(err instanceof Error ? err.message : '삭제 실패');

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

      btn.addEventListener('click', async () => {

        const id = btn.getAttribute('data-ph-del');

        if (!id || !(await s114Confirm('이 번호를 삭제할까요?', { danger: true }))) return;

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



    sendForm?.addEventListener('submit', async (e) => {

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

      await s114Alert('전송내역에 미리보기를 남겼습니다. 실제 문자는 보내지 않았습니다.');

      window.location.hash = '/admin/notify/logs';

    });



    root.querySelector('[data-sms-reset]')?.addEventListener('click', async () => {

      if (!(await s114Confirm('문자 미리보기를 초기화할까요?', { danger: true }))) return;

      resetSmsLab();

      rerender();

    });

  }
}

