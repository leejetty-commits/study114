/**
 * 회원·커머스·신고·티켓·노출·팝업 바인드.
 * 바깥은 a28-screens-bind.js만 부른다. 이 파일은 a28-screens-bind.js를 가져오지 않는다.
 */
import { memberBenefitEndNotice } from './a28-copy.js';
import { updateTicketStatus, updateTicketReply } from '../support/ticket-store.js';
import { isSupportApiMode } from '../support/support-backend.js';
import { fetchAdminTickets, fetchAdminTicketsByUser } from '../support/support-api.js';
import {
  bumpTicketAdminSeq,
  getTicketAdminState,
  memberSupportInquiriesLoaded,
  patchTicketAdminState,
  setMemberSupportInquiries,
  ticketAdminHost,
} from './a28-screens.js';
import { apiOpenSubmissionAttachment } from '../board/board-backend.js';
import {
  isAdminApiMode,
  apiApplySubmissionQueueAction,
  apiUpdateAdminReport,
  hydrateExposureCache,
  chooseExposureTab,
  getExposureStatusFilter,
  apiApplyExposureCorrection,
  hydrateCommerceCache,
  apiApplyCommerceCorrection,
  getMembersCache,
  hydrateMembersCache,
  getMemberDetailCache,
  hydrateMemberDetail,
  apiApplyMemberAction,
  apiApplyMemberBulkAction,
} from './admin-backend.js';
import { bulkDeleteAdminMembers, deleteAdminMember } from './admin-api.js';
import { deleteHomePopup, ensureHomePopups, peekHomePopups, saveHomePopup } from './home-popup-api.js';
import { s114Alert, s114Confirm } from '../../../shared/confirm-dialog.js';
import { a28Ui } from './a28-screens-state.js';
import { peekHubExposureRoute } from './a28-today-hub.js';

const MEMBER_ACTION_CONFIRM = {
  block: '정지하면 이 회원은 로그인할 수 없어요. 정지할까요?',
  restore: '다시 활성하면 이 회원은 다시 로그인할 수 있어요. 진행할까요?',
  withdraw: '탈퇴 처리하면 로그인할 수 없고, 올려 둔 등록은 홈·찾기에서 바로 안 보여요. 쪽지의 이름은 성+○○로 보여요. 탈퇴 처리할까요?',
};

/** @param {string} action @param {number} [count] */
function memberActionConfirm(action, count) {
  const text = MEMBER_ACTION_CONFIRM[action] || `${action} 할까요?`;
  if (count == null) return text;
  return `선택한 ${count}명 ${text}`;
}

function decodeAttr(btn, name) {
  try {
    return decodeURIComponent(btn.getAttribute(name) || '');
  } catch {
    return btn.getAttribute(name) || '';
  }
}

function selectedMemberDeletes(root) {
  return [...root.querySelectorAll('[data-member-chk]:checked')]
    .filter((el) => el instanceof HTMLInputElement && !el.disabled)
    .map((el) => {
      const id = Number(el.value);
      let name = '';
      try {
        name = decodeURIComponent(el.getAttribute('data-member-label') || '');
      } catch {
        name = el.getAttribute('data-member-label') || '';
      }
      return { id, name: name || `회원 #${id}` };
    })
    .filter((row) => row.id > 0);
}

function bulkDeleteSummary(data) {
  const ok = Number(data?.ok_count || 0);
  const fail = Number(data?.fail_count || 0);
  const reasons = [
    ...new Set(
      (data?.results || [])
        .filter((row) => row && row.ok === false)
        .map((row) => String(row.message || '실패'))
        .filter(Boolean),
    ),
  ];
  if (fail > 0) return `${ok}명 삭제, ${fail}명 실패(${reasons.join(' · ')})`;
  return `${ok}명 삭제`;
}

/** 선택 삭제. 이름 목록을 보여주고 「삭제」를 입력해야 한다. */
function openMemberBulkDelete(root, rerender) {
  const picked = selectedMemberDeletes(root);
  if (!picked.length) {
    void s114Alert('회원을 선택해 주세요.');
    return;
  }
  if (picked.length > 6) {
    void s114Alert('한 번에 6명까지 삭제할 수 있습니다.');
    return;
  }
  if (!isAdminApiMode()) {
    void s114Alert('미리보기에서는 회원 삭제를 쓸 수 없습니다.');
    return;
  }

  document.querySelector('[data-member-delete-modal]')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay member-delete-modal';
  overlay.setAttribute('data-member-delete-modal', '');
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  const head = document.createElement('div');
  head.className = 'modal__head';
  const title = document.createElement('h3');
  title.textContent = '선택 삭제';
  head.append(title);
  const body = document.createElement('div');
  body.className = 'modal__body';
  const list = document.createElement('ul');
  list.className = 'a28-lists';
  picked.forEach((row) => {
    const li = document.createElement('li');
    li.textContent = row.name;
    list.append(li);
  });
  const notice = document.createElement('p');
  notice.textContent = '결제 기록은 남고 계정은 복구할 수 없습니다';
  const label = document.createElement('label');
  label.className = 'a28-help';
  label.textContent = '확인을 위해 삭제 라고 입력하세요';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'admin-input';
  input.autocomplete = 'off';
  input.spellcheck = false;
  label.append(input);
  const error = document.createElement('p');
  error.className = 'member-delete-modal__error';
  error.hidden = true;
  body.append(list, notice, label, error);
  const foot = document.createElement('div');
  foot.className = 'modal__foot';
  const close = () => overlay.remove();
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn btn--secondary btn--sm';
  cancel.textContent = '취소';
  cancel.addEventListener('click', close);
  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'btn btn--danger btn--sm';
  confirmBtn.textContent = '삭제';
  confirmBtn.disabled = true;
  input.addEventListener('input', () => {
    confirmBtn.disabled = input.value !== '삭제';
  });
  confirmBtn.addEventListener('click', async () => {
    if (input.value !== '삭제') return;
    confirmBtn.disabled = true;
    error.hidden = true;
    try {
      const data = await bulkDeleteAdminMembers({
        ids: picked.map((row) => row.id),
        confirmPhrase: '삭제',
      });
      close();
      a28Ui.openMemberId = null;
      await hydrateMembersCache(a28Ui.memberFilters);
      rerender();
      void s114Alert(bulkDeleteSummary(data));
    } catch (err) {
      error.hidden = false;
      error.textContent = err instanceof Error ? err.message : '선택 삭제에 실패했습니다.';
      confirmBtn.disabled = input.value !== '삭제';
    }
  });
  foot.append(cancel, confirmBtn);
  modal.append(head, body, foot);
  overlay.append(modal);
  document.body.append(overlay);
  input.focus();
}

/** 회원 삭제 2단계. window.confirm을 쓰지 않는다. */
function openMemberDeleteModal(btn, rerender) {
  const id = Number(btn.getAttribute('data-member-delete'));
  const email = decodeAttr(btn, 'data-delete-email');
  const role = decodeAttr(btn, 'data-delete-role');
  const cards = decodeAttr(btn, 'data-delete-cards');
  const hasPayment = btn.getAttribute('data-delete-payment') === '1';
  if (!id || !email) return;

  document.querySelector('[data-member-delete-modal]')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay member-delete-modal';
  overlay.setAttribute('data-member-delete-modal', '');
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'member-delete-title');
  const head = document.createElement('div');
  head.className = 'modal__head';
  const title = document.createElement('h3');
  title.id = 'member-delete-title';
  title.textContent = '회원 삭제';
  head.append(title);
  const body = document.createElement('div');
  body.className = 'modal__body';
  const foot = document.createElement('div');
  foot.className = 'modal__foot';
  const error = document.createElement('p');
  error.className = 'member-delete-modal__error';
  error.hidden = true;

  const close = () => overlay.remove();

  function showStep1() {
    body.replaceChildren();
    foot.replaceChildren();
    error.hidden = true;
    error.textContent = '';
    const lines = [
      ['이메일', email],
      ['역할', role || '—'],
      ['등록 카드 수', cards || '공부방 0 · 과외쌤 0 · 학생 0'],
      ['결제', hasPayment ? '결제 있음' : '결제 없음'],
    ];
    const dl = document.createElement('dl');
    dl.className = 'admin-detail-dl';
    lines.forEach(([label, value]) => {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      dl.append(dt, dd);
    });
    const result = document.createElement('p');
    result.textContent = '결제 기록은 남고 계정은 복구할 수 없습니다';
    body.append(dl, result);
    const benefitNotice = memberBenefitEndNotice({
      ...(getMemberDetailCache(id) || {}),
      hasPayment,
    });
    if (benefitNotice) {
      const notice = document.createElement('p');
      notice.textContent = benefitNotice;
      body.append(notice);
    }
    body.append(error);
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'btn btn--secondary btn--sm';
    cancel.textContent = '취소';
    cancel.addEventListener('click', close);
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn btn--primary btn--sm';
    next.textContent = '다음';
    next.addEventListener('click', showStep2);
    foot.append(cancel, next);
  }

  function showStep2() {
    body.replaceChildren();
    foot.replaceChildren();
    error.hidden = true;
    error.textContent = '';
    const label = document.createElement('label');
    label.className = 'a28-help';
    label.textContent = '확인을 위해 이 회원의 이메일을 그대로 입력하세요';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'admin-input';
    input.autocomplete = 'off';
    input.spellcheck = false;
    label.append(input);
    body.append(label, error);
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'btn btn--secondary btn--sm';
    cancel.textContent = '취소';
    cancel.addEventListener('click', close);
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'btn btn--danger btn--sm';
    confirmBtn.textContent = '회원 삭제';
    confirmBtn.disabled = true;
    input.addEventListener('input', () => {
      confirmBtn.disabled = input.value !== email;
    });
    confirmBtn.addEventListener('click', async () => {
      if (input.value !== email) return;
      confirmBtn.disabled = true;
      error.hidden = true;
      try {
        await deleteAdminMember({ user_id: id, confirmEmail: input.value });
        close();
        a28Ui.openMemberId = null;
        await hydrateMembersCache(a28Ui.memberFilters);
        rerender();
      } catch (err) {
        error.hidden = false;
        error.textContent = err instanceof Error ? err.message : '회원 삭제에 실패했습니다.';
        confirmBtn.disabled = input.value !== email;
      }
    });
    foot.append(cancel, confirmBtn);
    input.focus();
  }

  showStep1();
  modal.append(head, body, foot);
  overlay.append(modal);
  document.body.append(overlay);
}

let lastExposureLoad = '';
let exposureLoadBusy = false;
let lastCommerceLoad = '';
let lastMembersHash = '';

function numericHashUser() {
  const raw = window.location.hash.replace(/^#/, '');
  const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
  const userRaw = new URLSearchParams(q).get('user') || '';
  return /^[1-9][0-9]*$/.test(userRaw) ? userRaw : '';
}

function readMembersHash() {
  const raw = window.location.hash.replace(/^#/, '');
  const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
  const params = new URLSearchParams(q);
  return {
    userId: numericHashUser(),
    q: (params.get('q') || '').trim(),
  };
}

function readExposureRoute() {
  const hub = peekHubExposureRoute();
  if (hub) return hub;
  const raw = window.location.hash.replace(/^#/, '');
  const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
  const params = new URLSearchParams(q);
  const tab = params.get('tab');
  const userRaw = params.get('user') || '';
  return {
    tab: tab === 'tutor' || tab === 'student' || tab === 'study_room' ? tab : 'study_room',
    userId: /^[1-9][0-9]*$/.test(userRaw) ? userRaw : '',
    hasTab: params.has('tab'),
  };
}

function adminBindHost() {
  const raw = window.location.hash.replace(/^#/, '');
  const path = raw.split('?')[0];
  return path === '/admin' ? 'hub' : 'route';
}

function exposureLoadKey(route, status = getExposureStatusFilter()) {
  return `${adminBindHost()}|${route.userId}|${route.tab}|${status}|${route.hasTab ? '1' : '0'}`;
}

export function writeAdminHash(next) {
  window.location.hash = next;
}

export function bindCommerceAdminEvents(root, path, rerender) {
  if (path === '/admin/commerce') {
    const commerceUserId = numericHashUser();
    const commerceLoadKey = commerceUserId || 'all';
    if (isAdminApiMode() && lastCommerceLoad !== commerceLoadKey) {
      lastCommerceLoad = commerceLoadKey;
      void (async () => {
        try {
          await hydrateCommerceCache(commerceUserId);
          if (commerceUserId && !getMemberDetailCache(commerceUserId)) {
            await hydrateMemberDetail(commerceUserId).catch(() => null);
          }
          rerender();
        } catch (err) {
          lastCommerceLoad = '';
          void s114Alert(err instanceof Error ? err.message : '결제 목록을 불러오지 못했습니다.');
        }
      })();
    }
    root.querySelector('[data-a28-commerce-clear-user]')?.addEventListener('click', () => {
      lastCommerceLoad = '';
      window.location.hash = '/admin/commerce';
    });
    root.querySelector('[data-commerce-refresh]')?.addEventListener('click', async () => {
      try {
        await hydrateCommerceCache(numericHashUser());
        lastCommerceLoad = numericHashUser() || 'all';
        rerender();
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '새로고침 실패');
      }
    });
    root.querySelectorAll('[data-commerce-position-save]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-commerce-position-save');
        const input = root.querySelector(`[data-commerce-ends="${id}"]`);
        if (!id || !(input instanceof HTMLInputElement) || !input.value) return;
        const endsAt = input.value.replace('T', ' ') + ':00';
        if (!(await s114Confirm('포지션 만료일을 보정할까요?'))) return;
        try {
          await apiApplyCommerceCorrection({ action: 'position_ends_at', position_id: Number(id), ends_at: endsAt });
          rerender();
        } catch (err) {
          void s114Alert(err instanceof Error ? err.message : '보정 실패');
        }
      });
    });
    root.querySelectorAll('[data-commerce-ticket-save]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-commerce-ticket-save');
        const input = root.querySelector(`[data-commerce-remain="${id}"]`);
        if (!id || !(input instanceof HTMLInputElement)) return;
        if (!(await s114Confirm('횟수권 잔여를 보정할까요?'))) return;
        try {
          await apiApplyCommerceCorrection({
            action: 'ticket_remaining',
            ticket_pack_id: Number(id),
            remaining: Number(input.value),
          });
          rerender();
        } catch (err) {
          void s114Alert(err instanceof Error ? err.message : '보정 실패');
        }
      });
    });
  }
}

export function bindSubmissionDocsAdminEvents(root, path, rerender) {
  if (path === '/admin/submission-docs') {
    root.querySelectorAll('[data-a28-sub-view]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-a28-sub-view');
        if (!id) return;
        try {
          await apiOpenSubmissionAttachment(id, { audience: 'admin' });
        } catch (err) {
          void s114Alert(err instanceof Error ? err.message : '첨부를 열 수 없습니다.');
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
        if (!(await s114Confirm(confirmMsg, { danger: action === 'hide' }))) return;
        try {
          await apiApplySubmissionQueueAction(id, action, { internalMemo });
          rerender();
        } catch (err) {
          void s114Alert(err instanceof Error ? err.message : '조치에 실패했습니다.');
        }
      });
    });
  }
}

const memberInquiryLoading = new Set();

function ensureMemberSupportInquiries(userId, rerender) {
  const key = String(userId || '');
  if (!/^[1-9][0-9]*$/.test(key) || !isAdminApiMode()) return;
  if (memberSupportInquiriesLoaded(key) || memberInquiryLoading.has(key)) return;
  memberInquiryLoading.add(key);
  void fetchAdminTicketsByUser(key)
    .then((data) => {
      memberInquiryLoading.delete(key);
      setMemberSupportInquiries(key, data.tickets || []);
      if (!document.querySelector(`[data-admin-drawer="member-${key}"]`)) return;
      rerender();
    })
    .catch(() => {
      memberInquiryLoading.delete(key);
      setMemberSupportInquiries(key, []);
    });
}

export function bindMembersScreen(root, rerender, navigate) {
  const memberRoute = readMembersHash();
  const memberHashKey = memberRoute.userId || memberRoute.q ? `${adminBindHost()}|user:${memberRoute.userId}|q:${memberRoute.q}` : '';
  if (memberHashKey && lastMembersHash !== memberHashKey && isAdminApiMode()) {
    lastMembersHash = memberHashKey;
    if (memberRoute.q) {
      a28Ui.memberFilters = { ...a28Ui.memberFilters, q: memberRoute.q };
    }
    if (memberRoute.userId) {
      a28Ui.openMemberId = Number(memberRoute.userId);
    }
    void (async () => {
      try {
        await hydrateMembersCache(a28Ui.memberFilters);
        if (memberRoute.userId) await hydrateMemberDetail(memberRoute.userId).catch(() => null);
        rerender();
      } catch (err) {
        lastMembersHash = '';
        void s114Alert(err instanceof Error ? err.message : '회원을 불러오지 못했습니다.');
      }
    })();
  } else if (isAdminApiMode() && !getMembersCache()) {
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
    a28Ui.openMemberId = null;
    try {
      if (isAdminApiMode()) await hydrateMembersCache(a28Ui.memberFilters);
      rerender();
    } catch (err) {
      void s114Alert(err instanceof Error ? err.message : '검색 실패');
    }
  });
  root.querySelectorAll('[data-member-status-chip]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const status = String(btn.getAttribute('data-member-status-chip') || 'all');
      a28Ui.memberFilters = { ...a28Ui.memberFilters, status };
      a28Ui.openMemberId = null;
      try {
        if (isAdminApiMode()) await hydrateMembersCache(a28Ui.memberFilters);
        rerender();
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '필터 실패');
      }
    });
  });
  root.querySelector('[data-member-refresh]')?.addEventListener('click', async () => {
    try {
      if (isAdminApiMode()) await hydrateMembersCache(a28Ui.memberFilters);
      rerender();
    } catch (err) {
      void s114Alert(err instanceof Error ? err.message : '새로고침 실패');
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
    ensureMemberSupportInquiries(a28Ui.openMemberId, rerender);
    const drawer = root.querySelector(`[data-admin-drawer="member-${a28Ui.openMemberId}"]`);
    if (drawer) {
      drawer.hidden = false;
      drawer.querySelectorAll('[data-admin-drawer-close]').forEach((el) => {
        el.addEventListener('click', () => {
          a28Ui.openMemberId = null;
        });
      });
    }
  }
  root.querySelectorAll('[data-member-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.getAttribute('data-member-action');
      const id = Number(btn.getAttribute('data-member-id'));
      if (!id || !action) return;
      const benefitNotice = action === 'withdraw' ? memberBenefitEndNotice(getMemberDetailCache(id)) : '';
      const confirmText = benefitNotice
        ? `${memberActionConfirm(action)}\n${benefitNotice}`
        : memberActionConfirm(action);
      if (!(await s114Confirm(confirmText, { danger: action !== 'restore' }))) return;
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
        void s114Alert(err instanceof Error ? err.message : '조치 실패');
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
      if (action === 'delete') {
        openMemberBulkDelete(root, rerender);
        return;
      }
      if (action !== 'block' && action !== 'restore') return;
      const ids = [...root.querySelectorAll('[data-member-chk]:checked')]
        .map((el) => Number(el instanceof HTMLInputElement ? el.value : 0))
        .filter((id) => id > 0);
      if (!ids.length) {
        void s114Alert('회원을 선택해 주세요.');
        return;
      }
      if (!(await s114Confirm(memberActionConfirm(action, ids.length), { danger: action === 'block' }))) return;
      const memoEl = root.querySelector('[data-member-bulk-memo]');
      const memo = memoEl instanceof HTMLInputElement ? memoEl.value.trim() : '';
      if (!isAdminApiMode()) {
        void s114Alert('미리보기에서는 일괄 조치를 쓸 수 없습니다.');
        return;
      }
      try {
        const data = await apiApplyMemberBulkAction(ids, action, { internalMemo: memo });
        const ok = Number(data.ok_count || 0);
        const fail = Number(data.fail_count || 0);
        await hydrateMembersCache(a28Ui.memberFilters);
        if (a28Ui.openMemberId) await hydrateMemberDetail(a28Ui.openMemberId).catch(() => {});
        rerender();
        void s114Alert(`완료: 성공 ${ok} · 실패 ${fail}`);
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '일괄 조치 실패');
      }
    });
  });
  root.querySelectorAll('[data-member-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!isAdminApiMode()) {
        void s114Alert('미리보기에서는 회원 삭제를 쓸 수 없습니다.');
        return;
      }
      openMemberDeleteModal(btn, rerender);
    });
  });
}

export function bindReportsScreen(root, rerender, navigate) {
  root.querySelectorAll('[data-a28-report-status]').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const id = sel.getAttribute('data-a28-report-status');
      if (!id) return;
      const memoEl = root.querySelector(`[data-a28-report-memo="${id}"]`);
      const internalMemo = memoEl instanceof HTMLTextAreaElement ? memoEl.value.trim() : '';
      try {
        await apiUpdateAdminReport(id, sel.value, { internalMemo });
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '상태 변경에 실패했습니다.');
        rerender();
      }
    });
  });
}

function readRouteTicketQuery() {
  const raw = window.location.hash.replace(/^#/, '');
  const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
  const params = new URLSearchParams(q);
  const group = params.get('group') || '';
  return {
    group: group === 'open' || group === 'closed' || group === 'all' ? group : '',
    q: (params.get('q') || '').trim(),
  };
}

function ticketAdminStillOpen(host) {
  return document.querySelector(`[data-a28-ticket-admin="${host}"]`) instanceof Element;
}

async function reloadTicketAdmin(host, rerender) {
  const state = getTicketAdminState(host);
  const seq = bumpTicketAdminSeq(host);
  const group = state.group;
  const q = state.q;
  const page = state.page;
  try {
    const data = await fetchAdminTickets({ group, q, page });
    const current = getTicketAdminState(host);
    if (current.seq !== seq || ticketAdminHost() !== host || !ticketAdminStillOpen(host)) return;
    patchTicketAdminState(host, {
      tickets: data.tickets || [],
      total: Number(data.total || 0),
      page: Number(data.page || page),
      perPage: Number(data.per_page || 20),
      loadError: '',
      loadedKey: `${group}|${q}|${page}`,
    });
    rerender();
  } catch (err) {
    const current = getTicketAdminState(host);
    if (current.seq !== seq || ticketAdminHost() !== host || !ticketAdminStillOpen(host)) return;
    patchTicketAdminState(host, {
      tickets: [],
      total: 0,
      loadError: err instanceof Error ? err.message : '문의 목록을 불러오지 못했습니다.',
      loadedKey: `${group}|${q}|${page}`,
    });
    rerender();
  }
}

export function bindTicketsScreen(root, rerender, _navigate) {
  const host = ticketAdminHost();
  const state = getTicketAdminState(host);
  if (host === 'route') {
    const query = readRouteTicketQuery();
    const hashKey = `${query.group}|${query.q}`;
    if (hashKey !== '|' && hashKey !== state.appliedHashKey) {
      state.q = query.q;
      if (query.group) state.group = query.group;
      state.page = 1;
      state.appliedHashKey = hashKey;
    } else if (hashKey === '|') {
      state.appliedHashKey = '';
    }
  }
  if (!state.initialized) state.initialized = true;
  const loadKey = `${state.group}|${state.q}|${state.page}`;
  if (isSupportApiMode() && state.loadedKey !== loadKey && ticketAdminStillOpen(host)) {
    state.loadedKey = loadKey;
    void reloadTicketAdmin(host, rerender);
  }
  root.querySelectorAll('[data-a28-ticket-group]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const group = btn.getAttribute('data-a28-ticket-group') || 'open';
      patchTicketAdminState(host, { group, page: 1, loadedKey: '' });
      rerender();
    });
  });
  root.querySelector('[data-a28-ticket-search]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const q = String(new FormData(form).get('q') || '').trim();
    patchTicketAdminState(host, { q, page: 1, loadedKey: '' });
    rerender();
  });
  root.querySelectorAll('[data-a28-ticket-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.getAttribute('data-a28-ticket-page');
      const view = getTicketAdminState(host);
      const pages = view.total === 0 ? 1 : Math.ceil(view.total / (view.perPage || 20));
      const next = dir === 'prev' ? view.page - 1 : view.page + 1;
      if (next < 1 || next > pages) return;
      patchTicketAdminState(host, { page: next, loadedKey: '' });
      rerender();
    });
  });
  root.querySelectorAll('[data-a28-ticket-status]').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const id = sel.getAttribute('data-a28-ticket-status');
      if (!id) return;
      try {
        await updateTicketStatus(id, sel.value);
        await reloadTicketAdmin(host, rerender);
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '상태를 바꾸지 못했습니다. 운영자 로그인 상태를 확인해 주세요.');
        rerender();
      }
    });
  });
  root.querySelectorAll('[data-a28-ticket-reply]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = form.getAttribute('data-a28-ticket-reply');
      const text = form.querySelector('[name="admin_reply_text"]')?.value || '';
      if (!id) return;
      try {
        const updated = await updateTicketReply(id, text);
        if (!updated) {
          void s114Alert('답변 내용이 필요합니다.');
          return;
        }
        await reloadTicketAdmin(host, rerender);
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '답변 저장에 실패했습니다.');
      }
    });
  });
}

export function bindExposureScreen(root, rerender, navigate) {
  const route = readExposureRoute();
  const loadKey = exposureLoadKey(route);
  if (isAdminApiMode() && !exposureLoadBusy && lastExposureLoad !== loadKey) {
    exposureLoadBusy = true;
    lastExposureLoad = loadKey;
    void (async () => {
      try {
        let tab = route.tab;
        if (route.userId && !route.hasTab) {
          tab = await chooseExposureTab(route.userId);
          if (tab !== route.tab) {
            lastExposureLoad = '';
            exposureLoadBusy = false;
            navigate(`/admin/exposure?user=${encodeURIComponent(route.userId)}&tab=${tab}`);
            return;
          }
        }
        await hydrateExposureCache(tab, getExposureStatusFilter(), route.userId);
        if (route.userId && !getMemberDetailCache(route.userId)) {
          await hydrateMemberDetail(route.userId).catch(() => null);
        }
        rerender();
      } catch (err) {
        lastExposureLoad = '';
        void s114Alert(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
      } finally {
        exposureLoadBusy = false;
      }
    })();
  }

  root.querySelectorAll('[data-a28-exp-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-a28-exp-tab');
      if (!next || next === route.tab) return;
      const params = new URLSearchParams();
      if (route.userId) params.set('user', route.userId);
      params.set('tab', next);
      navigate(`/admin/exposure?${params.toString()}`);
    });
  });

  root.querySelector('[data-a28-exp-clear-user]')?.addEventListener('click', () => {
    navigate(`/admin/exposure?tab=${route.tab}`);
  });

  const filterForm = root.querySelector('[data-a28-exp-filter]');
  filterForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(filterForm);
    const status = String(fd.get('status') || '');
    try {
      await hydrateExposureCache(route.tab, status, route.userId);
      lastExposureLoad = exposureLoadKey(route, status);
      rerender();
    } catch (err) {
      void s114Alert(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
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
          ? '이 카드를 홈·찾기에서 숨길까요? 주인은 마이페이지에서 그대로 볼 수 있어요.'
          : action === 'publish'
            ? '이 카드를 홈·찾기에 다시 보이게 할까요?'
            : '상담 상태를 보정할까요?';
      if (!(await s114Confirm(confirmMsg, { danger: action === 'hide' }))) return;

      try {
        await apiApplyExposureCorrection(
          targetType,
          targetId,
          /** @type {'hide'|'publish'|'inquiry_status'} */ (action),
          { internalMemo, inquiryStatus, reasonCategory: 'internal_review' },
        );
        lastExposureLoad = '';
        rerender();
      } catch (err) {
        void s114Alert(err instanceof Error ? err.message : '보정에 실패했습니다.');
      }
    });
  });
}

export function bindHomePopupForm(root, rerender, navigate) {
  const popupForm = root.querySelector('[data-popup-form]');
  if (popupForm instanceof HTMLFormElement) {
  if (peekHomePopups().rows === null) {
    ensureHomePopups().then(() => rerender());
  }
  const showPopupError = (message) => {
    const box = root.querySelector('[data-home-popup-form-error]');
    if (!(box instanceof HTMLElement)) return;
    box.textContent = message || '';
    box.hidden = !message;
  };
  const syncPopupType = () => {
    if (!(popupForm instanceof HTMLFormElement)) return;
    const type = popupForm.querySelector('[name="type"]:checked')?.value || 'notice';
    popupForm.querySelectorAll('[data-popup-fields]').forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const on = el.getAttribute('data-popup-fields') === type;
      el.hidden = !on;
      el.style.display = on ? '' : 'none';
    });
  };
  const syncPopupAudience = () => {
    if (!(popupForm instanceof HTMLFormElement)) return;
    const all = popupForm.querySelector('[name="audience"][value="all"]');
    const others = [...popupForm.querySelectorAll('[name="audience"]')].filter(
      (el) => el instanceof HTMLInputElement && el.value !== 'all',
    );
    const allOn = all instanceof HTMLInputElement && all.checked;
    others.forEach((el) => {
      if (!(el instanceof HTMLInputElement)) return;
      if (allOn) el.checked = false;
      el.disabled = allOn;
    });
  };
  const syncPopupLive = () => {
    if (!(popupForm instanceof HTMLFormElement)) return;
    const on = popupForm.querySelector('[name="published"]:checked')?.value === '1';
    const hint = root.querySelector('[data-home-popup-live]');
    if (hint instanceof HTMLElement) hint.hidden = !on;
  };
  const resetPopupForm = () => {
    if (!(popupForm instanceof HTMLFormElement)) return;
    popupForm.reset();
    const idInput = popupForm.querySelector('[name="id"]');
    if (idInput instanceof HTMLInputElement) idInput.value = '';
    const sort = popupForm.querySelector('[name="sortOrder"]');
    if (sort instanceof HTMLInputElement) sort.value = '0';
    showPopupError('');
    syncPopupType();
    syncPopupAudience();
    syncPopupLive();
  };
  popupForm?.querySelectorAll('[name="type"]').forEach((el) => el.addEventListener('change', syncPopupType));
  popupForm?.querySelectorAll('[name="audience"]').forEach((el) => el.addEventListener('change', syncPopupAudience));
  popupForm?.querySelectorAll('[name="published"]').forEach((el) => el.addEventListener('change', syncPopupLive));
  syncPopupType();
  syncPopupAudience();
  syncPopupLive();
  const fieldValue = (type, name) => {
    if (!(popupForm instanceof HTMLFormElement)) return '';
    const box = popupForm.querySelector(`[data-popup-fields="${type}"] [name="${name}"]`);
    if (box instanceof HTMLInputElement || box instanceof HTMLTextAreaElement) return box.value.trim();
    return '';
  };
  const setField = (type, name, value) => {
    if (!(popupForm instanceof HTMLFormElement)) return;
    const box = popupForm.querySelector(`[data-popup-fields="${type}"] [name="${name}"]`);
    if (box instanceof HTMLInputElement || box instanceof HTMLTextAreaElement) box.value = value;
  };
  root.querySelectorAll('[data-popup-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-popup-edit');
      const row = (peekHomePopups().rows || []).find((item) => String(item.id) === id);
      if (!row || !(popupForm instanceof HTMLFormElement)) return;
      resetPopupForm();
      const idInput = popupForm.querySelector('[name="id"]');
      if (idInput instanceof HTMLInputElement) idInput.value = String(row.id);
      const type = popupForm.querySelector(`[name="type"][value="${row.type}"]`);
      if (type instanceof HTMLInputElement) type.checked = true;
      const family = popupForm.querySelector(`[name="family"][value="${row.family}"]`);
      if (family instanceof HTMLInputElement) family.checked = true;
      const audience = Array.isArray(row.audience) ? row.audience : [];
      popupForm.querySelectorAll('[name="audience"]').forEach((el) => {
        if (el instanceof HTMLInputElement) el.checked = audience.includes(el.value);
      });
      const start = popupForm.querySelector('[name="startAt"]');
      const end = popupForm.querySelector('[name="endAt"]');
      const sort = popupForm.querySelector('[name="sortOrder"]');
      const published = popupForm.querySelector(`[name="published"][value="${row.published ? '1' : '0'}"]`);
      if (start instanceof HTMLInputElement) start.value = String(row.startAt || '');
      if (end instanceof HTMLInputElement) end.value = String(row.endAt || '');
      if (sort instanceof HTMLInputElement) sort.value = String(row.sortOrder ?? 0);
      if (published instanceof HTMLInputElement) published.checked = true;
      const content = row.content && typeof row.content === 'object' ? row.content : {};
      const typeId = String(row.type || 'notice');
      Object.entries(content).forEach(([key, value]) => {
        if (key === 'bullets' && Array.isArray(value)) setField(typeId, key, value.join('\n'));
        else if (typeof value === 'string') setField(typeId, key, value);
      });
      syncPopupType();
      syncPopupAudience();
      syncPopupLive();
      popupForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  root.querySelectorAll('[data-popup-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-popup-delete');
      if (!id || !(await s114Confirm('이 팝업을 삭제할까요?', { danger: true }))) return;
      try {
        await deleteHomePopup(id);
        rerender();
      } catch (err) {
        showPopupError(err instanceof Error ? err.message : '삭제하지 못했습니다.');
      }
    });
  });
  root.querySelectorAll('[data-popup-preview]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-popup-preview');
      const row = (peekHomePopups().rows || []).find((item) => String(item.id) === id);
      if (!id || !row) return;
      const audience = Array.isArray(row.audience) ? row.audience : [];
      let hash = '#/guest';
      if (audience.length === 1 && audience[0] === 'studyRoom') hash = '#/study-room';
      else if (audience.length === 1 && audience[0] === 'tutor') hash = '#/tutor';
      else if (audience.length === 1 && audience[0] === 'student') hash = '#/parent';
      window.open(`/?popupPreviewId=${encodeURIComponent(id)}${hash}`, '_blank');
    });
  });
  root.querySelector('[data-popup-reset]')?.addEventListener('click', () => {
    resetPopupForm();
  });
  popupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!(popupForm instanceof HTMLFormElement)) return;
    const audience = [...popupForm.querySelectorAll('[name="audience"]')]
      .filter((el) => el instanceof HTMLInputElement && el.checked && !el.disabled)
      .map((el) => (el instanceof HTMLInputElement ? el.value : ''))
      .filter(Boolean);
    if (!audience.length) {
      showPopupError('대상을 하나 이상 고르세요');
      return;
    }
    const type = popupForm.querySelector('[name="type"]:checked')?.value || 'notice';
    const keys =
      type === 'event'
        ? ['kicker', 'title', 'chip', 'body', 'period', 'note', 'cta', 'ctaHref']
        : type === 'ad'
          ? ['chip', 'title', 'body', 'aside', 'primary', 'primaryHref', 'secondary', 'secondaryHref']
          : ['date', 'title', 'body', 'bullets', 'cta', 'ctaHref'];
    const content = {};
    keys.forEach((key) => {
      const value = fieldValue(type, key);
      if (!value) return;
      if (key === 'bullets') content.bullets = value.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 4);
      else content[key] = value;
    });
    const id = String(popupForm.querySelector('[name="id"]')?.value || '');
    const payload = {
      type,
      family: popupForm.querySelector('[name="family"]:checked')?.value || 'a',
      audience,
      content,
      startAt: String(popupForm.querySelector('[name="startAt"]')?.value || '') || null,
      endAt: String(popupForm.querySelector('[name="endAt"]')?.value || '') || null,
      published: popupForm.querySelector('[name="published"]:checked')?.value === '1' ? 1 : 0,
      sortOrder: Number(popupForm.querySelector('[name="sortOrder"]')?.value || 0),
    };
    if (id) payload.id = Number(id);
    try {
      await saveHomePopup(payload);
      showPopupError('');
      rerender();
    } catch (err) {
      showPopupError(err instanceof Error ? err.message : '저장하지 못했습니다.');
    }
  });
  }

}

