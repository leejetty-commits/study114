import { formatMonthlyWon, formatTutorFeeCard, formatTutorLessonPlaces } from '../exposure-format.js';
import { operatorInquirySummary, resolveStudyRoomCardCta, isInquiryReceiving } from '../study-room-reg/inquiry-display.js';
import { getCompareIds, isInCompare, getCompareItems } from '../user-actions-state.js';
import { COMPARE_MAX } from '../exposure-schema.js';
import { compareRibbonText, compareOpenCta } from '../handoff-copy.js';
import { TRUST_PLATFORM_DISCLAIMER } from '../lifecycle-copy.js';
import { AUTH_UI_BASE } from '../data.js';
import {
  renderPermissionStateCard,
} from '../empty-state-copy.js';
import { navigate } from '../state.js';
import { openCompareModal } from '../compare-modal.js';
import { coarseRegionForGuest } from '../student-blind-teaser.js';
import {
  renderCardVisualPolicyBlock,
  resolveTrustBadgeLabels,
} from '../card-visual.js';
import { studentMemoContactLabel } from '../student-memo-status.js';

export function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function inquiryStatusLabel(status) {
  return operatorInquirySummary(status);
}

/** @param {string|null|undefined} status */
export function studyRoomParentInquiryLine(status) {
  const cta = resolveStudyRoomCardCta(status);
  if (cta.reasonLine) return `${cta.label} · ${cta.reasonLine}`;
  return cta.label;
}

/**
 * 신뢰 배지 개수 — card-visual SSOT만 사용 (facility/feature 혼입 금지)
 * @param {'study_room'|'tutor'|'student'} kind @param {object} item
 */
export function countTrustItems(kind, item) {
  return resolveTrustBadgeLabels(kind, item).length;
}

/**
 * 확대카드 상단 — 미니카드와 동일 card-visual 층위 (별도 trust strip 폐기)
 * @param {'study_room'|'tutor'|'student'} kind @param {object} item
 */
export function buildTrustStrip(kind, item) {
  return renderCardVisualPolicyBlock(kind, item, esc);
}

/** @param {'study_room'|'tutor'|'student'} kind @param {object} item @param {string} viewer */
export function buildJudgmentTokens(kind, item, viewer) {
  if (kind === 'study_room') {
    const price = formatMonthlyWon(item.price_amount);
    const inquiry = studyRoomParentInquiryLine(item.inquiry_status);
    const loc =
      viewer === 'guest' ? coarseRegionForGuest(item.location_label) : item.location_label;
    return [loc, item.grade_band, item.main_subject_note, inquiry, price].filter(Boolean);
  }
  if (kind === 'tutor') {
    const fee = formatTutorFeeCard(item);
    const places = formatTutorLessonPlaces(item.lesson_places);
    const loc =
      viewer === 'guest' ? coarseRegionForGuest(item.location_label) : item.location_label;
    const contactToken = viewer === 'guest' ? '로그인 후 쪽지' : '쪽지 가능';
    return [loc, item.main_subject_note, places, contactToken, fee].filter(Boolean);
  }
  const budget =
    item.preferred_lesson_type === 'study_room'
      ? item.preferred_studyroom_fee_amount
      : item.preferred_fee_amount;
  const budgetStr = budget != null ? `${Number(budget).toLocaleString('ko-KR')}원` : null;
  const memo =
    viewer === 'tutor' || viewer === 'study_room'
      ? studentMemoContactLabel(item).label
      : null;
  return [item.grade_level, item.subject_label, item.location_label, '대면', memo || budgetStr].filter(Boolean);
}

/** @param {'study_room'|'tutor'} kind */
export function buildCompareRibbon(kind) {
  const count = getCompareIds(kind).length;
  if (count <= 0) return '';
  return `<p class="p24-ribbon">${compareRibbonText(count, COMPARE_MAX)}</p>`;
}

/**
 * P24-08 Compare-aware — Sticky 영역 N/3 · 비교 열기 (24§13-1)
 * @param {'study_room'|'tutor'} kind
 * @param {number|string} itemId
 * @param {string} viewer
 */
export function buildCompareAwareBar(kind, itemId, viewer) {
  if (kind === 'student') return '';
  if (viewer === 'guest') {
    return `
    <div class="p24-compare-aware" aria-label="비교 상태">
      <span class="p24-compare-aware__badge">비교담기</span>
      <button type="button" class="btn btn--secondary btn--sm" data-p24-action="compare-guest-blocked" data-item-kind="${kind}">
        <span class="expo-compare-chip__check" aria-hidden="true"></span> 비교 담기
      </button>
    </div>`;
  }
  const count = getCompareIds(kind).length;
  const numId = Number(itemId);
  const inBasket = isInCompare(kind, numId);
  const openBtn =
    count > 0
      ? `<button type="button" class="btn btn--secondary btn--sm" data-p24-action="compare-open" data-item-kind="${kind}">${esc(compareOpenCta(count, COMPARE_MAX))}</button>`
      : '';
  const itemBadge = inBasket
    ? '<span class="p24-compare-aware__badge is-on">이 항목 · 비교 담김</span>'
    : '<span class="p24-compare-aware__badge">비교담기 가능</span>';

  return `
    <div class="p24-compare-aware" aria-label="비교 상태">
      <span class="p24-compare-aware__count">${esc(compareRibbonText(count, COMPARE_MAX))}</span>
      ${itemBadge}
      ${openBtn}
    </div>`;
}

let toastTimer;

/**
 * @param {string} message
 * @param {{ cta?: { label: string, href?: string, action?: 'compare-open', kind?: 'study_room'|'tutor' } }} [opts]
 */
export function showP24Toast(message, opts = {}) {
  let el = document.getElementById('p24-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'p24-toast';
    el.className = 'p24-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }

  const { cta } = opts;
  if (cta) {
    el.innerHTML = `<span class="p24-toast__msg">${esc(message)}</span>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'p24-toast__cta';
    btn.textContent = cta.label;
    btn.addEventListener('click', () => {
      if (cta.action === 'compare-open' && cta.kind) {
        openCompareModal(cta.kind, getCompareItems(cta.kind));
      } else if (cta.href) {
        const path = cta.href.replace(/^#/, '');
        navigate(path.startsWith('/') ? path : `/${path}`);
      }
      el.classList.remove('is-visible');
    });
    el.appendChild(btn);
  } else {
    el.textContent = message;
  }

  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), cta ? 4000 : 2200);
}

const LEAVE_CONFIRM_ID = 'p24-leave-confirm';
/** @type {((ok: boolean) => void) | null} */
let settleLeaveConfirm = null;

/**
 * 확대카드에서 다른 화면으로 나갈 때 안내.
 * @returns {Promise<boolean>} 이동이면 true, 머무르면 false
 */
export function confirmLeaveDetailCard() {
  document.getElementById(LEAVE_CONFIRM_ID)?.remove();
  if (settleLeaveConfirm) {
    const prev = settleLeaveConfirm;
    settleLeaveConfirm = null;
    prev(false);
  }

  return new Promise((resolve) => {
    settleLeaveConfirm = resolve;
    const host = document.createElement('div');
    host.id = LEAVE_CONFIRM_ID;
    host.className = 'p24-leave-confirm';
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-labelledby', 'p24-leave-title');
    host.innerHTML = `
      <div class="p24-leave-confirm__panel">
        <p class="p24-leave-confirm__eyebrow">안내</p>
        <h3 id="p24-leave-title" class="p24-leave-confirm__title">이 카드를 벗어납니다</h3>
        <p class="p24-leave-confirm__lead">확대카드를 닫고 선택한 화면으로 이동합니다.</p>
        <div class="p24-leave-confirm__actions">
          <button type="button" class="btn btn--secondary btn--sm" data-p24-leave="stay">머무르기</button>
          <button type="button" class="btn btn--primary btn--sm" data-p24-leave="go">이동</button>
        </div>
      </div>`;
    document.body.appendChild(host);

    const finish = (ok) => {
      if (settleLeaveConfirm !== resolve) return;
      settleLeaveConfirm = null;
      host.remove();
      resolve(ok);
    };
    host.querySelector('[data-p24-leave="stay"]')?.addEventListener('click', () => finish(false));
    host.querySelector('[data-p24-leave="go"]')?.addEventListener('click', () => finish(true));
    host.addEventListener('click', (e) => {
      if (e.target === host) finish(false);
    });
    host.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      finish(false);
    });
    host.querySelector('[data-p24-leave="stay"]')?.focus();
  });
}

/** @param {'study_room'|'tutor'|'student'} kind @param {object} item @param {string} viewer */
export function buildContactPanel(kind, item, viewer) {
  const loginHref = `${AUTH_UI_BASE}/#/login`;
  if (viewer === 'guest') {
    return `<div class="p24-contact">${renderPermissionStateCard('guest', { loginHref })}</div>`;
  }
  if (kind === 'student' && (viewer === 'tutor' || viewer === 'study_room')) {
    const memo = studentMemoContactLabel(item);
    if (item.exposure_status !== 'published') {
      return `<div class="p24-contact">${renderPermissionStateCard('student_protection')}</div>`;
    }
    if (!memo.ok) {
      return `<ul class="p24-contact"><li class="p24-contact__item is-locked">🔒 ${esc(memo.label)}</li></ul>`;
    }
    return `<ul class="p24-contact"><li class="p24-contact__item is-ok">✓ ${esc(memo.label)}</li></ul>`;
  }
  if (kind === 'student' && viewer === 'parent') {
    return `<ul class="p24-contact"><li class="p24-contact__item is-locked">비교 열람만 · 쪽지·연락처 비공개</li></ul>`;
  }
  if (kind === 'study_room') {
    const cta = resolveStudyRoomCardCta(item.inquiry_status);
    const ok = isInquiryReceiving(item.inquiry_status);
    const label = ok
      ? `✓ ${cta.label}`
      : `🔒 ${cta.label}${cta.reasonLine ? ` · ${cta.reasonLine}` : ''}`;
    return `<ul class="p24-contact"><li class="p24-contact__item${ok ? ' is-ok' : ' is-locked'}">${label}</li></ul>`;
  }
  if (kind === 'tutor') {
    return `<ul class="p24-contact"><li class="p24-contact__item is-ok">✓ 쪽지 시작 가능</li></ul>`;
  }
  return '';
}

export function microSafetyCopy() {
  return `<p class="p24-safety p24-safety--one-line">${esc(TRUST_PLATFORM_DISCLAIMER)}</p>`;
}
