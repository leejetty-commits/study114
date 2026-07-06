import { startFirstMemoFlow } from '../messages/compose-flow.js';
import { toggleWishlist, toggleCompare, isWishlisted, isInCompare } from '../user-actions-state.js';
import { previewState } from '../state.js';
import { recordRecentView, patchRecentHandoff } from '../mypage/recent-store.js';
import { WISH_LABELS, STUDENT_REVIEW } from '../handoff-copy.js';
import { notifyCompareToggle, notifyStudentReviewToggle, notifyWishToggle } from '../handoff-utils.js';
import { isInStudentReview, toggleStudentReview } from '../student-review-store.js';
import { renderEntryContextRibbon } from '../handoff-resume.js';
import { renderPreContactChecklist } from '../handoff-sticker.js';
import { renderStudentRequestBody } from './student-request-card.js';
import { unlockStudentRequestView } from '../request-unlock.js';
import {
  esc,
  buildJudgmentTokens,
  buildCompareRibbon,
  buildCompareAwareBar,
  buildTrustStrip,
  buildContactPanel,
  microSafetyCopy,
  showP24Toast,
} from './detail-utils.js';
import { renderTutorDetailBody } from './tutor-detail.js';
import { renderStudyRoomDetailBody } from './studyroom-detail.js';
import { AUTH_UI_BASE } from '../data.js';
import { openCompareModal } from '../compare-modal.js';
import { getCompareItems } from '../user-actions-state.js';

const MODAL_ID = 'p24-detail-modal';

export function closeDetailModal() {
  document.getElementById(MODAL_ID)?.remove();
  document.body.style.overflow = '';
}

function itemTitle(kind, item) {
  if (kind === 'student') return item.public_display_name || '학습 요청';
  if (kind === 'tutor') return item.tutor_display_name || '과외쌤';
  return item.study_room_name || '공부방';
}

function resolvePrimaryCta(kind, item, viewer) {
  if (viewer === 'guest') {
    return { label: '로그인하고 문의하기', action: 'login', disabled: false };
  }
  if (kind === 'student' && viewer === 'tutor') {
    const can = item.exposure_status === 'published';
    return { label: '메모 보내기', action: 'memo', disabled: !can };
  }
  if (kind === 'student' && viewer === 'study_room') {
    const can = item.exposure_status === 'published';
    return { label: '상담/쪽지 보내기', action: 'memo', disabled: !can };
  }
  if (kind === 'tutor' && viewer === 'parent') {
    return { label: '쪽지 보내기', action: 'memo', disabled: false };
  }
  if (kind === 'study_room' && viewer === 'parent') {
    const st = item.inquiry_status || 'open';
    const ok = st === 'open' || st === 'waiting_only';
    return { label: '상담/쪽지 보내기', action: 'memo', disabled: !ok };
  }
  return { label: '닫기', action: 'close', disabled: false };
}

function renderSecondaryActions(kind, item, viewer) {
  if (viewer === 'guest') return '';
  if (kind === 'student') {
    if (viewer !== 'tutor' && viewer !== 'study_room') return '';
    const inReview = isInStudentReview(item.id);
    return `
    <button type="button" class="btn btn--secondary btn--sm" data-p24-action="student-review-toggle"
      data-student-id="${item.id}" data-provider-role="${viewer}">
      ${inReview ? STUDENT_REVIEW.removeCta : STUDENT_REVIEW.addCta}
    </button>`;
  }
  const compareKind = kind;
  const wishOn = isWishlisted(compareKind, item.id);
  const cmpOn = isInCompare(compareKind, item.id);
  return `
    <button type="button" class="btn btn--secondary btn--sm" data-p24-action="wish-toggle"
      data-item-kind="${compareKind}" data-item-id="${item.id}">
      ${wishOn ? WISH_LABELS.remove : WISH_LABELS.add}
    </button>
    <button type="button" class="btn btn--secondary btn--sm" data-p24-action="compare-toggle"
      data-item-kind="${compareKind}" data-item-id="${item.id}">
      ${cmpOn ? '비교 해제' : '비교'}
    </button>`;
}

/**
 * @param {{ kind: 'study_room'|'tutor'|'student', item: object, viewer: string, onRerender?: () => void, sourceRoute?: string }} opts
 */
export function openDetailModal({ kind, item, viewer, onRerender, sourceRoute = 'search' }) {
  closeDetailModal();

  const title = itemTitle(kind, item);
  recordRecentView(kind, item.id, title, { sourceRoute, lastAction: 'view_detail' });
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
  const preContact = renderPreContactChecklist(kind, viewer, primary.disabled);
  const compareKind = kind === 'tutor' ? 'tutor' : kind === 'study_room' ? 'study_room' : null;
  const compareAware =
    compareKind != null ? buildCompareAwareBar(compareKind, item.id, viewer) : '';

  const wrap = document.createElement('div');
  wrap.id = MODAL_ID;
  wrap.className = 'modal-overlay p24-overlay';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.innerHTML = `
    <div class="modal p24-modal">
      <header class="modal__head p24-modal__head">
        <div>
          <p class="p24-modal__kind">${esc(subtitle)}</p>
          <h2 class="p24-modal__title">${esc(title)}</h2>
        </div>
        <button type="button" class="modal__close" data-p24-action="close" aria-label="닫기">×</button>
      </header>
      <div class="modal__body p24-modal__body">
        ${entryRibbon}
        ${ribbon}
        <div class="p24-judgment" aria-label="3초 판단바">
          ${tokens.map((t) => `<span class="p24-judgment__token">${esc(t)}</span>`).join('')}
        </div>
        ${trust}
        ${bodyHtml}
        <section class="p24-section p24-section--contact">
          <h3 class="p24-section__title">접촉 가능성</h3>
          ${contact}
        </section>
        ${preContact}
        ${microSafetyCopy()}
      </div>
      <footer class="modal__foot p24-modal__foot">
        ${compareAware}
        <div class="p24-modal__foot-actions">
          ${secondary}
          <button type="button" class="btn btn--primary btn--sm" data-p24-action="${primary.action}"
            ${primary.disabled ? 'disabled' : ''}>${esc(primary.label)}</button>
        </div>
      </footer>
    </div>`;

  document.body.appendChild(wrap);
  document.body.style.overflow = 'hidden';

  wrap.querySelectorAll('[data-p24-action="close"]').forEach((btn) => {
    btn.addEventListener('click', closeDetailModal);
  });
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) closeDetailModal();
  });

  wrap.querySelector('[data-p24-action="login"]')?.addEventListener('click', () => {
    window.open(`${AUTH_UI_BASE}/#/login?from=detail`, '_blank', 'noopener');
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
    });
  });

  wrap.querySelectorAll('[data-p24-action="student-review-toggle"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const added = toggleStudentReview(btn.dataset.studentId, {
        providerRole: btn.dataset.providerRole,
      });
      notifyStudentReviewToggle(added, { sourceRoute });
      if (added) patchRecentHandoff(kind, item.id, { lastRoute: sourceRoute, lastAction: 'review_add' });
      onRerender?.();
      openDetailModal({ kind, item, viewer, onRerender, sourceRoute: 'detail' });
    });
  });

  wrap.querySelectorAll('[data-p24-action="wish-toggle"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wishKind = btn.dataset.itemKind;
      const wasWishlisted = isWishlisted(wishKind, btn.dataset.itemId);
      toggleWishlist(wishKind, btn.dataset.itemId);
      notifyWishToggle(!wasWishlisted, { sourceRoute });
      if (!wasWishlisted) patchRecentHandoff(wishKind, btn.dataset.itemId, { lastRoute: sourceRoute, lastAction: 'wish_add' });
      onRerender?.();
      closeDetailModal();
    });
  });

  wrap.querySelectorAll('[data-p24-action="compare-open"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.itemKind;
      if (k === 'study_room' || k === 'tutor') {
        openCompareModal(k, getCompareItems(k));
      }
    });
  });

  wrap.querySelectorAll('[data-p24-action="compare-toggle"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const compareKind = btn.dataset.itemKind;
      const result = toggleCompare(compareKind, btn.dataset.itemId);
      if (!notifyCompareToggle(result, compareKind, { sourceRoute: 'detail' })) return;
      if (result.inCompare) patchRecentHandoff(compareKind, btn.dataset.itemId, { lastRoute: sourceRoute, lastAction: 'compare_add' });
      onRerender?.();
      openDetailModal({ kind, item, viewer, onRerender, sourceRoute: 'detail' });
    });
  });

  wrap.querySelectorAll('[data-p24-action="unlock-request"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const studentId = Number(btn.dataset.studentId);
      btn.disabled = true;
      try {
        const result = await unlockStudentRequestView(studentId);
        const msg = result.consumed
          ? '요청문을 열람했습니다. (열람권 1회 차감)'
          : '이미 열람한 학생입니다.';
        showP24Toast(msg);
        openDetailModal({ kind, item, viewer, onRerender, sourceRoute });
      } catch (err) {
        const code = err && typeof err === 'object' ? /** @type {{code?: string}} */ (err).code : '';
        if (code === 'paid_gate') {
          showP24Toast('열람권이 필요합니다. 유료 서비스 안내를 확인해 주세요.');
        } else {
          showP24Toast('열람에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        }
        btn.disabled = false;
      }
    });
  });

  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetailModal();
  });
}
