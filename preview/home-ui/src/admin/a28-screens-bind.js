/**
 * A28 admin event binders — extracted from a28-screens.js
 * Rollback: git revert this commit.
 * 본문은 a28-screens-bind-members.js, a28-screens-bind-content.js로 나뉘어 있고, 공개 이름은 여기서 다시 내보낸다.
 */
import {
  isAdminApiMode,
  getOperatorsCache,
  hydrateOperatorsCache,
  apiCreateOperator,
  apiPatchOperator,
  apiResetOperatorPassword,
} from './admin-backend.js';
import { s114Alert, s114Confirm, s114Prompt } from '../../../shared/confirm-dialog.js';
import { bindDetailDrawer } from './a28-screens-shared.js';
import { bindTodayHub, registerTodayBinders } from './a28-today-hub.js';
import { bindSettlement } from './a28-settlement.js';
import { MEMBER_MAIL_PATH, bindMemberMail } from './a28-member-mail.js';
import { WITHDRAW_REASONS_PATH, bindWithdrawReasons } from './a28-withdraw-reasons.js';
import { bindRegistrationList } from './a28-registration-list.js';
import {
  bindCommerceAdminEvents,
  bindSubmissionDocsAdminEvents,
  bindMembersScreen,
  bindReportsScreen,
  bindTicketsScreen,
  bindExposureScreen,
  bindHomePopupForm,
  writeAdminHash,
} from './a28-screens-bind-members.js';
import {
  bindNoticeAdminEvents,
  bindSettingsAdminEvents,
  bindNotifyAdminEvents,
} from './a28-screens-bind-content.js';

export {
  bindMembersScreen,
  bindReportsScreen,
  bindTicketsScreen,
  bindExposureScreen,
  bindHomePopupForm,
} from './a28-screens-bind-members.js';

export function bindTodaySlotNav(root) {
  root.querySelectorAll('[data-a28-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-a28-nav');
      if (target) window.location.hash = target.startsWith('/') ? target : `/${target}`;
    });
  });
}

export function bindA28ScreenEvents(root, path, rerender) {
  bindDetailDrawer(root);
  if (path === '/admin/settlement' || path === '/admin') bindSettlement(root, rerender);
  if (path === MEMBER_MAIL_PATH) bindMemberMail(root);
  if (path === WITHDRAW_REASONS_PATH) bindWithdrawReasons(root);

  root.querySelectorAll('[data-promo-copy-url]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-promo-copy-url') || '';
      try {
        await navigator.clipboard.writeText(text);
        void s114Alert('URL을 복사했습니다.');
      } catch {
        await s114Prompt('복사하세요', text);
      }
    });
  });
  root.querySelectorAll('[data-promo-copy-share]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-promo-copy-share') || '';
      try {
        await navigator.clipboard.writeText(text);
        void s114Alert('공유 문구를 복사했습니다.');
      } catch {
        await s114Prompt('복사하세요', text);
      }
    });
  });
  root.querySelectorAll('[data-promo-copy-kit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-promo-copy-kit') || '';
      try {
        await navigator.clipboard.writeText(text);
        void s114Alert('런치 킷(문구+URL)을 복사했습니다.');
      } catch {
        await s114Prompt('복사하세요', text);
      }
    });
  });

  if (path === '/admin/permissions') {
    if (isAdminApiMode() && !getOperatorsCache()) {
      hydrateOperatorsCache()
        .then(() => rerender())
        .catch((err) => void s114Alert(err instanceof Error ? err.message : '목록 로드 실패'));
    }
    root.querySelector('[data-operator-refresh]')?.addEventListener('click', async () => {
      try {
        await hydrateOperatorsCache();
        rerender();
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '새로고침 실패');
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
        void s114Alert('운영 계정을 발급했습니다.');
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '발급 실패');
      }
    });
    root.querySelectorAll('[data-operator-toggle-status]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-operator-toggle-status'));
        const status = String(btn.getAttribute('data-status') || '');
        if (!id || !status) return;
        if (!(await s114Confirm(status === 'inactive' ? '이 계정을 비활성할까요?' : '이 계정을 활성할까요?', { danger: status === 'inactive' }))) return;
        try {
          await apiPatchOperator({ user_id: id, status });
          rerender();
        } catch (err) {
          void s114Alert(err instanceof Error ? err.message : '상태 변경 실패');
        }
      });
    });
    root.querySelectorAll('[data-operator-toggle-level]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-operator-toggle-level'));
        const current = String(btn.getAttribute('data-level') || '');
        const next = current === 'super_admin' ? 'sub_master' : 'super_admin';
        if (!id) return;
        if (!(await s114Confirm(`권한을 ${next === 'super_admin' ? '최고관리자' : '부마스터'}로 변경할까요?`))) return;
        try {
          await apiPatchOperator({ user_id: id, admin_level: next });
          rerender();
        } catch (err) {
          void s114Alert(err instanceof Error ? err.message : '권한 변경 실패');
        }
      });
    });
    root.querySelectorAll('[data-operator-reset-pw]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-operator-reset-pw'));
        if (!id) return;
        const password = await s114Prompt('새 임시 비밀번호 (8~14자 · 영문+숫자+특수문자)');
        if (!password) return;
        try {
          await apiResetOperatorPassword({
            user_id: id,
            password,
            password_confirm: password,
          });
          rerender();
          void s114Alert('임시 비밀번호로 초기화했습니다. 대상자는 로그인 후 비밀번호를 변경해야 합니다.');
        } catch (err) {
          void s114Alert(err instanceof Error ? err.message : '초기화 실패');
        }
      });
    });
  }

  if (path === '/admin/members') {
    bindMembersScreen(root, rerender, writeAdminHash);
  }
  if (path === '/admin/registrations') bindRegistrationList(root, rerender);
  bindCommerceAdminEvents(root, path, rerender);
  bindNoticeAdminEvents(root, path, rerender);
  if (path === '/admin/reports') {
    bindReportsScreen(root, rerender, writeAdminHash);
  }

  if (path === '/admin/tickets') {
    bindTicketsScreen(root, rerender, writeAdminHash);
  }
  bindSubmissionDocsAdminEvents(root, path, rerender);
  if (path === '/admin/exposure') {
    bindExposureScreen(root, rerender, writeAdminHash);
  }
  bindSettingsAdminEvents(root, path, rerender);
  bindNotifyAdminEvents(root, path, rerender);

  bindTodayHub(root);
}

registerTodayBinders({
  members: bindMembersScreen,
  exposure: bindExposureScreen,
  tickets: bindTicketsScreen,
  reports: bindReportsScreen,
  popups: bindHomePopupForm,
  writeHash: writeAdminHash,
  bindNav: bindTodaySlotNav,
  bindDrawer: bindDetailDrawer,
});

