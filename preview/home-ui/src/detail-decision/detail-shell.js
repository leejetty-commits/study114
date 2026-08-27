import { startFirstMemoFlow } from '../messages/compose-flow.js';
import { navigate } from '../state.js';
import { recordRecentView, patchRecentHandoff } from '../mypage/recent-store.js';
import { WISH_LABELS } from '../handoff-copy.js';
import { notifyCompareToggle, notifyStudentReviewToggle, notifyWishToggle } from '../handoff-utils.js';
import { isInStudentReview, toggleStudentReview } from '../student-review-store.js';
import { checkFirstMemoPermission } from '../messages/permissions.js';
import { showPaidGateOverlay } from '../messages/overlays.js';
import { renderEntryContextRibbon } from '../handoff-resume.js';
import { renderStudentRequestBody } from './student-request-card.js';
import { resolveStudyRoomCardCta } from '../study-room-reg/inquiry-display.js';
import {
  esc,
  buildJudgmentTokens,
  buildCompareRibbon,
  buildTrustStrip,
  buildContactPanel,
  microSafetyCopy,
  showP24Toast,
} from './detail-utils.js';
import { renderTutorDetailBody } from './tutor-detail.js';
import { renderStudyRoomDetailBody } from './studyroom-detail.js';
import { AUTH_UI_BASE } from '../data.js';
import { HOME_UI_BASE } from '../../../shared/preview-links.js';
import { toggleWishlist, toggleCompare, isWishlisted } from '../user-actions-state.js';
import { bindStudyRoomMapSection } from '../../../shared/naver-map.js';
import { renderRightRailBlock } from '../right-rail.js';
import { maskPublicDisplayName } from '../student-blind-teaser.js';
import { isGuestPublicPath, loginUrl } from '../../../shared/route-access.js';
import { openPublicMyshop } from '../myshop/navigate.js';
import { bindProviderReviewMount } from '../provider-reviews/ui.js';
import { bindReviewSheetTriggers, openReviewSheet } from '../provider-reviews/sheet.js';
import { isLoggedIn } from '../auth-session.js';
import { guardGuestDeepAccess } from '../guest-deep-access.js';
import { renderItemActions } from '../exposure-render.js';
import { bindProtectedGuestActions } from '../../../shared/guest-gate-ui.js';
import { toggleRecommendation } from '../search-api.js';

const MODAL_ID = 'p24-detail-modal';

export function closeDetailModal() {
  const modal = document.getElementById(MODAL_ID);
  modal?.querySelectorAll('[data-naver-map-mount]').forEach((mount) => {
    /** @type {{ destroy?: () => void }|undefined} */ (mount)._mapController?.destroy?.();
  });
  modal?.remove();
  document.body.style.overflow = '';
  document.body.classList.remove('p24-detail-open', 'p24-detail-open--floating');
}

function itemTitle(kind, item) {
  if (kind === 'student') return maskPublicDisplayName(item.public_display_name) || '학습 요청';
  if (kind === 'tutor') return item.tutor_display_name || '과외쌤';
  return item.study_room_name || '공부방';
}

function resolvePrimaryCta(kind, item, viewer) {
  if (viewer === 'guest') {
    return { label: '로그인하고 문의하기', action: 'login', disabled: false };
  }
  if (kind === 'student' && (viewer === 'tutor' || viewer === 'study_room' || viewer === 'admin')) {
    const canPublish = item.exposure_status === 'published';
    const memoCheck = checkFirstMemoPermission({ kind: 'student', role: viewer === 'admin' ? 'tutor' : viewer });
    if (!canPublish) {
      return { label: '쪽지 준비', action: 'memo-prep', disabled: true };
    }
    if (!memoCheck.ok) {
      return {
        label: '쪽지 준비',
        action: memoCheck.reason === 'paid_gate' ? 'plans' : 'memo-prep',
        disabled: false,
      };
    }
    return {
      label: '쪽지 보내기',
      action: 'memo',
      disabled: false,
    };
  }
  if (kind === 'tutor' && viewer === 'parent') {
    return { label: '쪽지 보내기', action: 'memo', disabled: false };
  }
  if (kind === 'study_room' && viewer === 'parent') {
    const cta = resolveStudyRoomCardCta(item.inquiry_status);
    return { label: cta.label, action: 'memo', disabled: cta.disabled };
  }
  return { label: '닫기', action: 'close', disabled: false };
}

export function renderSecondaryActions(kind, item, viewer) {
  if (viewer === 'guest') {
    if (kind === 'student') return '';
    return `
    <button type="button" class="btn btn--secondary btn--sm expo-compare-chip" data-p24-action="compare-guest-blocked"
      data-item-kind="${kind}" aria-pressed="false">
      <span class="expo-compare-chip__check" aria-hidden="true"></span>비교
    </button>`;
  }
  if (kind === 'student') {
    if (viewer !== 'tutor' && viewer !== 'study_room' && viewer !== 'admin') return '';
    const wished = isInStudentReview(item.id);
    return `
    <button type="button" class="btn btn--secondary btn--sm" data-p24-action="student-review-toggle"
      data-student-id="${item.id}" data-provider-role="${viewer === 'admin' ? 'tutor' : viewer}">
      ${wished ? WISH_LABELS.remove : WISH_LABELS.add}
    </button>`;
  }
  if (viewer !== 'parent') return '';
  return `<button type="button" class="btn btn--secondary btn--sm" data-p24-action="review-write">후기 남기기</button>`;
}

function renderMyshopEntryCta(kind) {
  if (kind !== 'study_room') return '';
  return `
    <button type="button" class="btn btn--secondary btn--sm" data-p24-action="open-myshop">
      공부방 둘러보기
    </button>`;
}

function isHomeSpaHost() {
  try {
    const home = new URL(HOME_UI_BASE, window.location.href);
    return window.location.origin === home.origin && window.location.pathname.startsWith(home.pathname.replace(/\/$/, '') || '/');
  } catch {
    return false;
  }
}

function bindFloatingDrag(wrap) {
  const panel = wrap.querySelector('.p24-modal--floating');
  const handle = wrap.querySelector('[data-p24-drag-handle]');
  if (!panel || !handle) return;

  // flex 컨테이너 밖으로 빼서 fixed 좌표로 이동 (transform 방식은 일부 환경에서 무시됨)
  const rect = panel.getBoundingClientRect();
  panel.style.position = 'fixed';
  panel.style.left = `${rect.left}px`;
  panel.style.top = `${rect.top}px`;
  panel.style.right = 'auto';
  panel.style.margin = '0';
  panel.style.transform = 'none';
  wrap.appendChild(panel);

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origLeft = rect.left;
  let origTop = rect.top;
  /** @type {number|null} */
  let activePointer = null;

  const clamp = (left, top) => {
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    const maxL = Math.max(8, window.innerWidth - w - 8);
    const maxT = Math.max(8, window.innerHeight - Math.min(h, window.innerHeight * 0.9) - 8);
    return {
      left: Math.min(maxL, Math.max(8, left)),
      top: Math.min(maxT, Math.max(8, top)),
    };
  };

  const onMove = (e) => {
    if (!dragging) return;
    if (activePointer != null && e.pointerId !== activePointer) return;
    const pos = clamp(origLeft + (e.clientX - startX), origTop + (e.clientY - startY));
    panel.style.left = `${pos.left}px`;
    panel.style.top = `${pos.top}px`;
  };

  const onUp = (e) => {
    if (!dragging) return;
    if (activePointer != null && e.pointerId !== activePointer) return;
    dragging = false;
    activePointer = null;
    panel.classList.remove('is-dragging');
    origLeft = parseFloat(panel.style.left) || origLeft;
    origTop = parseFloat(panel.style.top) || origTop;
    try {
      handle.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onUp);
    handle.removeEventListener('pointercancel', onUp);
  };

  handle.addEventListener('pointerdown', (e) => {
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest('button, a')) return;
    dragging = true;
    activePointer = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    origLeft = parseFloat(panel.style.left) || panel.getBoundingClientRect().left;
    origTop = parseFloat(panel.style.top) || panel.getBoundingClientRect().top;
    panel.classList.add('is-dragging');
    handle.setPointerCapture(e.pointerId);
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
    e.preventDefault();
  });
}

function bindGuestRailNavigation(wrap) {
  wrap.querySelectorAll('a[href], a[data-nav]').forEach((a) => {
    if (!a.closest('.right-rail')) return;
    a.addEventListener('click', (e) => {
      const navPath = a.getAttribute('data-nav') || '';
      const href = a.getAttribute('href') || '';
      const path = navPath || href;
      if (!isGuestPublicPath(path)) {
        e.preventDefault();
        window.location.assign(loginUrl('detail', 'rail'));
        return;
      }
      e.preventDefault();
      const normalized = String(navPath || href.replace(/^#/, '')).replace(/^#/, '');
      const hashPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
      if (isHomeSpaHost()) {
        navigate(hashPath);
        showP24Toast('안내 페이지로 이동했습니다. 카드를 끌어 위치를 바꿀 수 있어요.');
        return;
      }
      window.location.assign(`${HOME_UI_BASE}/#${hashPath}`);
    });
  });
}

/**
 * @param {{ kind: 'study_room'|'tutor'|'student', item: object, viewer: string, onRerender?: () => void, sourceRoute?: string }} opts
 */
export function openDetailModal({ kind, item, viewer, onRerender, sourceRoute = 'search' }) {
  if ((kind === 'study_room' || kind === 'tutor') && !isLoggedIn()) {
    guardGuestDeepAccess('card_detail', { providerType: kind, providerId: Number(item?.id) || 0 });
    return;
  }
  closeDetailModal();

  const title = itemTitle(kind, item);
  if (viewer !== 'guest') {
    recordRecentView(kind, item.id, title, { sourceRoute, lastAction: 'view_detail' });
  }
  const subtitle =
    kind === 'student'
      ? '학습 요청 카드'
      : kind === 'tutor'
        ? '과외쌤 상세'
        : '공부방 상세';

  const bodyHtml =
    kind === 'student'
      ? renderStudentRequestBody(item, viewer)
      : kind === 'tutor'
        ? renderTutorDetailBody(item, viewer)
        : renderStudyRoomDetailBody(item, viewer);

  const tokens = buildJudgmentTokens(kind, item, viewer);
  const ribbon = kind !== 'student' ? buildCompareRibbon(kind === 'tutor' ? 'tutor' : 'study_room') : '';
  const trust = buildTrustStrip(kind, item);
  const contact = buildContactPanel(kind, item, viewer);
  const primary = resolvePrimaryCta(kind, item, viewer);
  const secondary = renderSecondaryActions(kind, item, viewer);
  const entryRibbon = renderEntryContextRibbon(sourceRoute);
  const actionRail =
    kind === 'study_room' || kind === 'tutor'
      ? `<div class="p24-card-rail">${renderItemActions({
          guest: viewer === 'guest',
          compareKind: kind,
          itemId: item.id,
          item,
        })}</div>`
      : '';
  const floating = viewer === 'guest';

  const wrap = document.createElement('div');
  wrap.id = MODAL_ID;
  wrap.className = floating
    ? 'modal-overlay p24-overlay p24-overlay--floating'
    : 'modal-overlay p24-overlay';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', floating ? 'false' : 'true');
  wrap.innerHTML = `
    <div class="modal p24-modal${floating ? ' p24-modal--floating p24-modal--emphasis' : ' p24-modal--emphasis'}">
      ${
        floating
          ? `<div class="p24-modal__dragbar" data-p24-drag-handle title="끌어서 이동">
              <span class="p24-modal__dragbar-grip" aria-hidden="true"></span>
              <span class="p24-modal__dragbar-label">이동</span>
              <button type="button" class="modal__close p24-modal__dragbar-close" data-p24-action="close" aria-label="닫기">×</button>
            </div>`
          : ''
      }
      <header class="modal__head p24-modal__head"${floating ? ' data-p24-drag-handle' : ''}>
        <div>
          <p class="p24-modal__kind">${esc(subtitle)}</p>
          <h2 class="p24-modal__title">${esc(title)}</h2>
        </div>
        ${floating ? '' : '<button type="button" class="modal__close" data-p24-action="close" aria-label="닫기">×</button>'}
      </header>
      <div class="modal__body p24-modal__body">
        ${entryRibbon}
        ${ribbon}
        <div class="p24-judgment" aria-label="3초 판단바">
          ${tokens.map((t) => `<span class="p24-judgment__token">${esc(t)}</span>`).join('')}
        </div>
        ${trust}
        ${actionRail}
        ${bodyHtml}
        <section class="p24-section p24-section--contact">
          <h3 class="p24-section__title">접촉 가능성</h3>
          ${contact}
        </section>
        ${renderRightRailBlock('detail_right_rail', { guestFilter: floating })}
        ${microSafetyCopy()}
      </div>
      <footer class="modal__foot p24-modal__foot">
        <div class="p24-modal__foot-actions">
          ${secondary}
          ${renderMyshopEntryCta(kind)}
          <button type="button" class="btn btn--primary btn--sm" data-p24-action="${primary.action}"
            ${primary.disabled ? 'disabled' : ''}>${esc(primary.label)}</button>
        </div>
      </footer>
    </div>`;

  document.body.appendChild(wrap);
  document.body.classList.add('p24-detail-open');
  if (floating) {
    document.body.classList.add('p24-detail-open--floating');
    document.body.style.overflow = '';
    bindFloatingDrag(wrap);
    bindGuestRailNavigation(wrap);
  } else {
    document.body.style.overflow = 'hidden';
  }

  if (kind === 'study_room' && !floating) {
    const mapAccordion = wrap.querySelector('.p24-map-accordion');
    mapAccordion?.addEventListener('toggle', () => {
      if (!mapAccordion.open) return;
      bindStudyRoomMapSection(wrap, [item], { regionLabel: item.location_label || '' });
    });
  }

  bindProviderReviewMount(wrap, kind, item, viewer);
  bindReviewSheetTriggers(wrap);
  bindProtectedGuestActions(wrap);
  wrap.querySelectorAll('[data-action="recommend-toggle"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const recKind = btn.getAttribute('data-item-kind');
      const recId = Number(btn.getAttribute('data-item-id'));
      if ((recKind !== 'study_room' && recKind !== 'tutor') || !recId) return;
      try {
        const data = await toggleRecommendation(recKind, recId);
        const countEl = btn.querySelector('.item-actions__count');
        if (countEl) countEl.textContent = String(data.recommend_count ?? 0);
        btn.classList.toggle('is-active', Boolean(data.recommended));
        btn.title = `추천 ${data.recommend_count ?? 0}`;
      } catch (err) {
        console.warn('[recommend]', err);
        window.alert(err instanceof Error ? err.message : '추천 처리에 실패했습니다.');
      }
    });
  });

  wrap.querySelectorAll('[data-p24-action="close"]').forEach((btn) => {
    btn.addEventListener('click', closeDetailModal);
  });
  if (!floating) {
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) closeDetailModal();
    });
  }

  wrap.querySelector('[data-p24-action="login"]')?.addEventListener('click', () => {
    window.open(`${AUTH_UI_BASE}/#/login?from=detail`, '_blank', 'noopener');
  });

  wrap.querySelector('[data-p24-action="review-write"]')?.addEventListener('click', () => {
    if (kind !== 'study_room' && kind !== 'tutor') return;
    void openReviewSheet({
      providerType: kind,
      providerId: Number(item.id),
      view: 'write',
    });
  });

  wrap.querySelector('[data-p24-action="open-myshop"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (kind !== 'study_room') return;
    closeDetailModal();
    openPublicMyshop({
      studyRoomId: item.id,
      sourceRoute,
      viewerRole: viewer,
    });
  });

  wrap.querySelectorAll('[data-p24-action="compare-guest-blocked"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.assign(loginUrl('detail', 'compare'));
    });
  });

  wrap.querySelector('[data-p24-action="memo"]')?.addEventListener('click', () => {
    const memoKind = kind === 'student' ? 'student' : kind;
    startFirstMemoFlow({
      kind: memoKind,
      targetId: item.id,
      targetName: title,
      student: kind === 'student' ? item : undefined,
      structuredLine:
        kind === 'student'
          ? `${item.grade_level || '—'} · ${item.subject_label || '—'} · ${item.location_label || '—'}`
          : `${item.main_subject_note || '—'} · ${item.location_label || '—'}`,
      onSent: () => closeDetailModal(),
    });
  });

  wrap.querySelector('[data-p24-action="plans"]')?.addEventListener('click', () => {
    closeDetailModal();
    showPaidGateOverlay();
  });

  wrap.querySelector('[data-p24-action="memo-prep"]')?.addEventListener('click', () => {
    closeDetailModal();
    window.location.hash = '/mypage/plans';
  });

  wrap.querySelectorAll('[data-p24-action="student-review-toggle"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const added = toggleStudentReview(btn.dataset.studentId, {
        providerRole: btn.dataset.providerRole,
      });
      notifyStudentReviewToggle(added, { sourceRoute });
      if (added) patchRecentHandoff(kind, item.id, { lastRoute: sourceRoute, lastAction: 'wish_add' });
      onRerender?.();
      openDetailModal({ kind, item, viewer, onRerender, sourceRoute: 'detail' });
    });
  });

  wrap.querySelectorAll('[data-action="wish-toggle"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wishKind = btn.dataset.itemKind;
      const wasWishlisted = isWishlisted(wishKind, btn.dataset.itemId);
      toggleWishlist(wishKind, btn.dataset.itemId);
      notifyWishToggle(!wasWishlisted, { sourceRoute });
      if (!wasWishlisted) patchRecentHandoff(wishKind, btn.dataset.itemId, { lastRoute: sourceRoute, lastAction: 'wish_add' });
      onRerender?.();
      openDetailModal({ kind, item, viewer, onRerender, sourceRoute });
    });
  });

  wrap.querySelectorAll('[data-action="compare-toggle"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const compareKindBtn = btn.dataset.itemKind;
      const result = toggleCompare(compareKindBtn, btn.dataset.itemId);
      if (!notifyCompareToggle(result, compareKindBtn, { sourceRoute: 'detail' })) return;
      if (result.inCompare) patchRecentHandoff(compareKindBtn, btn.dataset.itemId, { lastRoute: sourceRoute, lastAction: 'compare_add' });
      onRerender?.();
      openDetailModal({ kind, item, viewer, onRerender, sourceRoute });
    });
  });

  wrap.querySelectorAll('[data-action="open-detail-memo"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const memoKind = kind === 'student' ? 'student' : kind;
      startFirstMemoFlow({
        kind: memoKind,
        targetId: item.id,
        targetName: title,
        student: kind === 'student' ? item : undefined,
        structuredLine:
          kind === 'student'
            ? `${item.grade_level || '—'} · ${item.subject_label || '—'} · ${item.location_label || '—'}`
            : `${item.main_subject_note || '—'} · ${item.location_label || '—'}`,
        onSent: () => closeDetailModal(),
      });
    });
  });

  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetailModal();
  });
}
