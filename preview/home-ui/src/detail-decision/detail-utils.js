import { formatMonthlyWon, formatTutorFeeCard, formatTutorLessonPlaces } from '../exposure-format.js';
import { getCompareIds, isInCompare, getCompareItems } from '../user-actions-state.js';
import { COMPARE_MAX } from '../exposure-schema.js';
import { compareRibbonText, compareOpenCta } from '../handoff-copy.js';
import { formatTrustInfoStrip, TRUST_PLATFORM_DISCLAIMER } from '../lifecycle-copy.js';
import { AUTH_UI_BASE } from '../data.js';
import {
  renderPermissionStateCard,
} from '../empty-state-copy.js';
import { navigate } from '../state.js';
import { openCompareModal } from '../compare-modal.js';

export function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const INQUIRY_STATUS_LABELS = {
  open: '상담 가능',
  paused: '상담 중지',
  capacity_full: '정원 마감',
  waiting_only: '대기 문의 가능',
};

export function inquiryStatusLabel(status) {
  return INQUIRY_STATUS_LABELS[status] || status || '—';
}

/** @param {'study_room'|'tutor'|'student'} kind @param {object} item */
export function countTrustItems(kind, item) {
  if (kind === 'study_room') {
    let n = 0;
    if (item.education_office_registered) n += 1;
    if (item.career_years) n += 1;
    if (item.facility_summary && item.facility_summary !== '—') n += 1;
    if (item.feature_1) n += 1;
    return n;
  }
  if (kind === 'tutor') {
    let n = 0;
    if (item.university_name || item.university_note) n += 1;
    if (item.proof_document_available) n += 1;
    if (item.career_year_band) n += 1;
    if (item.feature_1) n += 1;
    return n;
  }
  return 0;
}

/** @param {'study_room'|'tutor'|'student'} kind @param {object} item @param {string} viewer */
export function buildJudgmentTokens(kind, item, viewer) {
  if (kind === 'study_room') {
    const price = formatMonthlyWon(item.price_amount);
    const inquiry = inquiryStatusLabel(item.inquiry_status);
    return [item.location_label, item.grade_band, item.main_subject_note, inquiry, price].filter(Boolean);
  }
  if (kind === 'tutor') {
    const fee = formatTutorFeeCard(item);
    const places = formatTutorLessonPlaces(item.lesson_places);
    return [item.location_label, item.main_subject_note, places, '쪽지 가능', fee].filter(Boolean);
  }
  const budget =
    item.preferred_lesson_type === 'study_room'
      ? item.preferred_studyroom_fee_amount
      : item.preferred_fee_amount;
  const budgetStr = budget != null ? `${Number(budget).toLocaleString('ko-KR')}원` : null;
  const memo =
    viewer === 'tutor' ? (item.exposure_status === 'published' ? '메모 가능' : '접촉 불가') : null;
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
  if (viewer === 'guest' || kind === 'student') return '';
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

/** @param {'study_room'|'tutor'|'student'} kind @param {object} item */
export function buildTrustStrip(kind, item) {
  if (kind === 'student') return '';
  const trustCount = countTrustItems(kind, item);
  const docCount =
    kind === 'tutor'
      ? item.verification_doc_count ?? (item.proof_document_available ? 1 : 0)
      : kind === 'study_room' && item.education_office_registered
        ? 1
        : 0;
  const strip = formatTrustInfoStrip(trustCount, docCount);
  return `<p class="p24-trust">${esc(strip)} · 플랫폼 보증 아님</p>`;
}

/** @param {'study_room'|'tutor'|'student'} kind @param {object} item @param {string} viewer */
export function buildContactPanel(kind, item, viewer) {
  const loginHref = `${AUTH_UI_BASE}/#/login`;
  if (viewer === 'guest') {
    return `<div class="p24-contact">${renderPermissionStateCard('guest', { loginHref })}</div>`;
  }
  if (kind === 'student' && (viewer === 'tutor' || viewer === 'study_room')) {
    const can = item.exposure_status === 'published';
    if (!can) {
      return `<div class="p24-contact">${renderPermissionStateCard('student_protection')}</div>`;
    }
    const label = viewer === 'tutor' ? '메모 가능' : '상담/쪽지 가능';
    return `<ul class="p24-contact"><li class="p24-contact__item is-ok">${label}</li></ul>`;
  }
  if (kind === 'student' && viewer === 'parent') {
    return `<ul class="p24-contact"><li class="p24-contact__item is-locked">비교 열람만 · 쪽지·연락처 비공개</li></ul>`;
  }
  if (kind === 'study_room') {
    const st = item.inquiry_status || 'open';
    const ok = st === 'open' || st === 'waiting_only';
    const label =
      st === 'open'
        ? '✓ 상담/쪽지 가능'
        : st === 'waiting_only'
          ? '✓ 대기 문의 가능'
          : st === 'capacity_full'
            ? '🔒 정원 마감 · 대기 문의'
            : '🔒 상담 중지';
    return `<ul class="p24-contact"><li class="p24-contact__item${ok ? ' is-ok' : ' is-locked'}">${label}</li></ul>`;
  }
  if (kind === 'tutor') {
    return `<ul class="p24-contact"><li class="p24-contact__item is-ok">✓ 쪽지 시작 가능</li></ul>`;
  }
  return '';
}

export function microSafetyCopy() {
  return `<p class="p24-safety">${esc(TRUST_PLATFORM_DISCLAIMER)} · <a href="#/support/safe">안전 가이드</a></p>`;
}
